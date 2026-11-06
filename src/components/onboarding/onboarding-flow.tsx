'use client'

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowLeft, ArrowRight, Check, Clock, Languages, LoaderCircle, Plus, Trash2, X } from 'lucide-react'
import { Link, useRouter } from '@/i18n/routing'
import { readPlanChoice, type PlanChoice } from '@/lib/plan-choice'
import { Flag } from '@/components/prompts/flag'
import { V2Error } from '@/lib/v2'
import { useWorkspace } from '@/components/workspace/workspace-context'
import { cn } from '@/lib/cn'
import { DashboardPreview } from './preview'
import { ChipInput, ErrorText, Field } from './fields'
import {
  createOnboardingApi,
  emptyDraft,
  focusSplit,
  isDomain,
  locationLimit,
  normalizeDomain,
  onboardingPool,
  previewPool,
  previewReason,
  spreadSelection,
  stepOrder,
  topicLimit,
  type BrandProfile,
  type CompleteResult,
  type Focus,
  type Location,
  type MarketScope,
  type OnboardingApi,
  type OnboardingDraft,
  type OnboardingStep,
  type PreviewReason,
  type ReviewPrompt,
} from './onboarding-api'

type Busy = 'loading' | 'saving' | 'domain' | 'profile' | 'topics' | 'prompts' | null

const countryCodes = ['us', 'uk', 'de', 'fr', 'in']
const regionCode: Record<string, string> = { us: 'US', uk: 'GB', de: 'DE', fr: 'FR', in: 'IN' }
const languageCodes = ['en', 'de', 'fr', 'es', 'it', 'hi']
const marketScopes: MarketScope[] = ['global', 'continent', 'country', 'state', 'city', 'neighborhood']
const focusIds: Focus[] = ['research', 'compare', 'action']
const freeMail = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'yahoo.com', 'icloud.com', 'proton.me', 'protonmail.com', 'aol.com']
const profileLimits = { description: 500, category: 80, identity: 10, products: 15, personas: 10 }

function browserZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

function zoneList() {
  const zone = browserZone()
  let zones: string[] = []
  try {
    zones = Intl.supportedValuesOf('timeZone')
  } catch {
    zones = ['UTC']
  }
  return zones.includes(zone) ? zones : [zone, ...zones]
}

function zoneLabel(zone: string) {
  const parts = zone.split('/')
  const city = (parts.pop() ?? zone).replace(/_/g, ' ')
  return parts.length ? `${city} · ${parts[0]}` : city
}

function workDomain(email: string | null) {
  const domain = email?.split('@')[1]?.toLowerCase() ?? ''
  return domain && !freeMail.includes(domain) && isDomain(domain) ? domain : ''
}

export function OnboardingFlow() {
  const t = useTranslations('onboarding')
  const locale = useLocale()
  const router = useRouter()
  const [busy, setBusy] = useState<Busy>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewReason>(null)
  const [step, setStep] = useState<OnboardingStep>('mode')
  const [review, setReview] = useState<ReviewPrompt[] | null>(null)
  const [trackLimit, setTrackLimit] = useState(0)
  const [draft, setDraft] = useState<OnboardingDraft>(emptyDraft)
  const [email, setEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CompleteResult | null>(null)
  const [planChoice, setPlanChoice] = useState<PlanChoice | null>(null)
  const [attempt, setAttempt] = useState(0)
  const api = useMemo(() => createOnboardingApi(preview !== null), [preview])
  const { adoptWorkspace } = useWorkspace()
  const agency = draft.mode === 'agency'
  const tm = (key: string, values?: Record<string, string | number>) => t(agency ? `${key}Agency` : key, values)
  const message = (cause: unknown) => (cause instanceof Error && cause.message ? cause.message : t('errorGeneric'))

  useEffect(() => { setPlanChoice(readPlanChoice()) }, [])

  const loadProfile = async (current: OnboardingDraft, client: OnboardingApi = api) => {
    setBusy('profile')
    setError(null)
    try {
      const profile = await client.readProfile(current)
      const next = { ...current, profile }
      setDraft(next)
      await client.save('profile', next)
    } catch (cause) {
      setError(message(cause))
    } finally {
      setBusy(null)
    }
  }

  const loadTopics = async (current: OnboardingDraft, client: OnboardingApi = api) => {
    setBusy('topics')
    setError(null)
    try {
      const topics = (await client.generateTopics(current)).slice(0, topicLimit)
      const next = { ...current, topics }
      setDraft(next)
      await client.save('topics', next)
    } catch (cause) {
      setError(message(cause))
    } finally {
      setBusy(null)
    }
  }

  useEffect(() => {
    let cancel = false
    setBusy('loading')
    setLoadError(null)
    createOnboardingApi(false)
      .load()
      .then((state) => ({ state, reason: null as PreviewReason }))
      .catch(async (cause: unknown) => {
        const reason = previewReason(cause)
        if (!reason) throw cause
        return { state: await createOnboardingApi(true).load(), reason }
      })
      .then(({ state, reason }) => {
        if (cancel) return
        const loaded = { ...emptyDraft(), ...state.draft }
        const client = createOnboardingApi(reason !== null)
        setPreview(reason)
        setEmail(state.email)
        setDraft(loaded)
        setStep(state.status === 'completed' ? 'done' : state.step)
        if (state.awaitingChoice) {
          setTrackLimit(state.trackLimit ?? 0)
          client.pool().then((pool) => {
            if (cancel) return
            setTrackLimit(pool.trackLimit)
            if (pool.prompts.length) setReview(pool.prompts)
            else setError(t('promptsNone'))
            setBusy(null)
          }).catch((cause: unknown) => {
            if (cancel) return
            setError(message(cause))
            setBusy(null)
          })
          return
        }
        setBusy(null)
        if (state.status === 'completed') return
        if (state.step === 'profile' && !loaded.profile) void loadProfile(loaded, client)
        if (state.step === 'topics' && !loaded.topics.length) void loadTopics(loaded, client)
      })
      .catch((cause: unknown) => {
        if (cancel) return
        setLoadError(message(cause))
        setBusy(null)
      })
    return () => {
      cancel = true
    }
    // loadProfile and loadTopics receive the client explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt])

  const advance = async (next: OnboardingStep, patch: Partial<OnboardingDraft>, after?: (current: OnboardingDraft) => Promise<void>) => {
    const nextDraft = { ...draft, ...patch }
    setError(null)
    setBusy('saving')
    try {
      await api.save(next, nextDraft)
      setDraft(nextDraft)
      setStep(next)
      setBusy(null)
    } catch (cause) {
      setError(message(cause))
      setBusy(null)
      return
    }
    if (after) await after(nextDraft)
  }

  const goBack = () => {
    if (review) {
      setReview(null)
      setError(null)
      return
    }
    const index = stepOrder.indexOf(step)
    if (index <= 0) return
    setError(null)
    setStep(stepOrder[index - 1])
  }

  const submitDomain = async (raw: string) => {
    const domain = normalizeDomain(raw)
    if (!domain) {
      setError(t('domainEmpty'))
      return
    }
    if (!isDomain(domain)) {
      setError(t('domainInvalid', { value: raw.trim() }))
      return
    }
    setError(null)
    setBusy('domain')
    try {
      const checked = await api.checkDomain(domain)
      const sameSite = checked.domain === draft.domain
      const next: OnboardingDraft = {
        ...draft,
        domain: checked.domain,
        name: sameSite && draft.name ? draft.name : checked.suggestedName,
        profile: sameSite ? draft.profile : null,
        topics: sameSite ? draft.topics : [],
      }
      await api.save('name', next)
      setDraft(next)
      setStep('name')
    } catch (cause) {
      const code = cause instanceof V2Error ? cause.code : null
      if (code === 'DOMAIN_INVALID') setError(t('domainInvalid', { value: domain }))
      else if (code === 'DOMAIN_UNREACHABLE') setError(t('domainUnreachable', { domain }))
      else if (code === 'DOMAIN_TAKEN') setError(t('domainTaken', { domain }))
      else setError(message(cause))
    } finally {
      setBusy(null)
    }
  }

  const submitProfile = async (profile: BrandProfile) => {
    setError(null)
    setBusy('saving')
    try {
      await api.saveProfile(profile)
    } catch (cause) {
      setError(message(cause))
      setBusy(null)
      return
    }
    const changed = JSON.stringify(profile) !== JSON.stringify(draft.profile)
    await advance('market', { profile, topics: changed ? [] : draft.topics })
  }

  const finish = async (focus: Focus) => {
    const choice = readPlanChoice()
    if (!choice && preview === null) {
      setPlanChoice(null)
      setError(t('planMissing'))
      return
    }
    const next = { ...draft, focus }
    setDraft(next)
    setError(null)
    setBusy('prompts')
    try {
      const result = await api.complete(next)
      if (result.workspaceId && result.workspaceId !== 'preview' && next.domain) {
        await adoptWorkspace(result.workspaceId, next.domain, next.name)
      }
      setResult(result)
      if (result.chosen) {
        setReview(null)
        setStep('done')
        return
      }
      if (preview) {
        setTrackLimit(result.trackLimit)
        setReview(previewPool(next))
        return
      }
      const listed = await api.pool()
      if (!listed.prompts.length) {
        setError(t('promptsNone'))
        return
      }
      setTrackLimit(listed.trackLimit)
      setReview(listed.prompts)
    } catch (cause) {
      setError(message(cause))
    } finally {
      setBusy(null)
    }
  }

  const confirmPrompts = async (ids: string[]) => {
    setError(null)
    setBusy('prompts')
    try {
      const chosen = await api.choose(ids)
      setResult(chosen)
      setReview(null)
      router.push('/prompts')
    } catch (cause) {
      setError(message(cause))
    } finally {
      setBusy(null)
    }
  }

  const startOver = () => {
    api.reset()
    setDraft(emptyDraft())
    setResult(null)
    setReview(null)
    setError(null)
    setStep('mode')
  }

  const canGoBack = !busy && step !== 'mode' && step !== 'done'

  return (
    <div className="flex min-h-screen flex-col bg-white text-[13px] text-nuw-ink">
      {preview ? (
        <p role="status" className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-center text-[12px] leading-5 text-amber-900">
          {t(`preview.${preview}`)}
        </p>
      ) : null}
      {step !== 'done' ? (
        <p role="status" className="border-b border-nuw-line bg-[#FFFFFF] px-5 py-2 text-center text-[12px] leading-5 text-zinc-700">
          {planChoice ? (
            t('planSaved', {
              prompts: planChoice.prompts,
              plan: planChoice.plan === 'lite' ? 'Lite' : planChoice.plan === 'standard' ? 'Standard' : planChoice.plan === 'premium' ? 'Premium' : 'Enterprise',
            })
          ) : (
            <>
              {t('planMissing')}{' '}
              <Link href="/#pricing" className="font-medium underline">{t('planMissingLink')}</Link>
            </>
          )}
        </p>
      ) : null}
      <header className="flex h-14 shrink-0 items-center gap-3 px-5">
        <Mark />
        {canGoBack ? (
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1.5 rounded-lg border border-nuw-line px-2.5 py-1 text-[13px] text-zinc-700 hover:bg-zinc-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('back')}
          </button>
        ) : null}
        {email ? <p className="ml-auto truncate text-[12px] text-zinc-500">{t('loggedInAs', { email })}</p> : null}
      </header>

      <main className="flex flex-1 flex-col items-center px-4 pb-24">
        {busy === 'loading' ? (
          <Centered>
            <LoaderCircle className="h-5 w-5 animate-spin text-zinc-400" />
            <p className="mt-3 text-zinc-500">{t('loading')}</p>
          </Centered>
        ) : loadError ? (
          <Centered>
            <h1 className="text-[20px] font-medium">{t('loadErrorTitle')}</h1>
            <p className="mt-2 max-w-md text-center leading-5 text-zinc-600">{loadError}</p>
            <PrimaryButton onClick={() => setAttempt((value) => value + 1)} className="mt-5">
              {t('tryAgain')}
            </PrimaryButton>
          </Centered>
        ) : step === 'mode' ? (
          <ModeStep email={email} saving={busy === 'saving'} error={error} onPick={(mode) => void advance('domain', { mode })} />
        ) : step === 'domain' ? (
          <DomainStep
            initial={draft.domain || workDomain(email)}
            title={tm('domainTitle')}
            busy={busy === 'domain'}
            error={error}
            onClearError={() => setError(null)}
            onSubmit={(value) => void submitDomain(value)}
          />
        ) : step === 'name' ? (
          <NameStep
            draft={draft}
            title={tm('nameTitle')}
            busy={busy === 'saving'}
            error={error}
            onError={setError}
            onSubmit={(name) => void advance('locations', { name })}
          />
        ) : step === 'locations' ? (
          <LocationsStep
            draft={draft}
            locale={locale}
            busy={busy === 'saving'}
            error={error}
            onError={setError}
            onSubmit={(locations) => void advance('profile', { locations }, (current) => (current.profile ? Promise.resolve() : loadProfile(current)))}
          />
        ) : step === 'profile' ? (
          busy === 'profile' ? (
            <Working draft={draft} title={t('profileReading', { domain: draft.domain })} body={t('profileReadingBody')} />
          ) : draft.profile ? (
            <ProfileStep
              profile={draft.profile}
              title={tm('profileTitle')}
              preview={preview !== null}
              busy={busy === 'saving'}
              error={error}
              onSubmit={(profile) => void submitProfile(profile)}
            />
          ) : (
            <Centered>
              <h1 className="text-[20px] font-medium">{t('profileFailedTitle', { domain: draft.domain })}</h1>
              <ErrorText>{error}</ErrorText>
              <div className="mt-5 flex gap-2">
                <SecondaryButton onClick={() => setDraft((current) => ({ ...current, profile: { description: '', category: '', identity: [], products: [], personas: [] } }))}>
                  {t('profileManual')}
                </SecondaryButton>
                <PrimaryButton onClick={() => void loadProfile(draft)}>{t('tryAgain')}</PrimaryButton>
              </div>
            </Centered>
          )
        ) : step === 'market' ? (
          <MarketStep
            draft={draft}
            busy={busy === 'saving'}
            error={error}
            onError={setError}
            onSubmit={(market) => void advance('topics', { market }, (current) => (current.topics.length ? Promise.resolve() : loadTopics(current)))}
          />
        ) : step === 'topics' ? (
          busy === 'topics' ? (
            <Working draft={draft} title={t('topicsGenerating')} topics={null} />
          ) : (
            <TopicsStep
              draft={draft}
              busy={busy === 'saving'}
              error={error}
              onError={setError}
              onRetry={() => void loadTopics(draft)}
              onEditProfile={() => {
                setError(null)
                setStep('profile')
              }}
              onChange={(topics) => {
                const next = { ...draft, topics }
                setDraft(next)
                api.save('topics', next).catch((cause: unknown) => setError(message(cause)))
              }}
              onSubmit={() => void advance('focus', { topics: draft.topics })}
            />
          )
        ) : review ? (
          <ReviewStep
            name={draft.name}
            prompts={review}
            limit={trackLimit}
            busy={busy === 'prompts'}
            error={error}
            onContinue={(ids) => void confirmPrompts(ids)}
          />
        ) : step === 'focus' ? (
          busy === 'prompts' ? (
            <Working
              draft={draft}
              title={t('promptsGenerating')}
              body={t('promptsGeneratingBody')}
              topics={draft.topics.map((topic) => topic.name ?? '')}
              activeTopic={draft.topics[0]?.name}
            />
          ) : (
            <FocusStep initial={draft.focus} error={error} onSubmit={(focus) => void finish(focus)} />
          )
        ) : (
          <DoneStep draft={draft} result={result} preview={preview} onOpen={(path) => router.push(path)} onStartOver={startOver} />
        )}
      </main>
    </div>
  )
}

function Mark() {
  return (
    <span aria-hidden className="grid h-7 w-7 place-items-center rounded-lg bg-nuw-primary">
      <svg viewBox="0 0 32 32" className="h-5 w-5">
        <path d="M9 22V10h3.2l3.8 7.2L19.8 10H23v12h-2.6v-7.4L17 22h-2l-3.4-7.4V22H9z" fill="white" />
      </svg>
    </span>
  )
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col items-center justify-center py-16">{children}</div>
}

function Heading({ title, body }: { title: string; body?: string }) {
  return (
    <div className="mt-8 text-center">
      <h1 className="text-[22px] font-medium tracking-tight text-zinc-900">{title}</h1>
      {body ? <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-5 text-zinc-500">{body}</p> : null}
    </div>
  )
}

function Glow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-[440px] rounded-2xl bg-gradient-to-r from-blue-100 via-white to-pink-100 p-px shadow-[0_10px_30px_rgba(1,76,255,0.08)]', className)}>
      <div className="rounded-[15px] bg-white">{children}</div>
    </div>
  )
}

function ArrowButton({ busy, label, disabled }: { busy?: boolean; label: string; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      aria-label={label}
      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-nuw-button text-white hover:bg-nuw-buttonHover disabled:opacity-40"
    >
      {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
    </button>
  )
}

function PrimaryButton({ children, onClick, className, disabled, type = 'button' }: { children: ReactNode; onClick?: () => void; className?: string; disabled?: boolean; type?: 'button' | 'submit' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn('inline-flex items-center gap-1.5 rounded-lg bg-nuw-button px-4 py-2 text-[13px] font-medium text-white hover:bg-nuw-buttonHover disabled:opacity-40', className)}
    >
      {children}
    </button>
  )
}

function SecondaryButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-lg border border-nuw-line bg-white px-4 py-2 text-[13px] font-medium text-zinc-800 hover:bg-zinc-100">
      {children}
    </button>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-md border border-nuw-line bg-white px-2 py-0.5 text-[12px] text-zinc-600">{children}</span>
}

function Working({ draft, title, body, topics, activeTopic }: { draft: OnboardingDraft; title: string; body?: string; topics?: string[] | null; activeTopic?: string }) {
  return (
    <div className="flex w-full flex-col items-center pt-4">
      <DashboardPreview name={draft.name} topics={topics} activeTopic={activeTopic} />
      <div className="mt-14 text-center" role="status">
        <p className="animate-pulse text-[20px] text-zinc-500">{title}</p>
        {body ? <p className="mx-auto mt-2 max-w-md leading-5 text-zinc-500">{body}</p> : null}
      </div>
    </div>
  )
}

function ModeStep({ email, saving, error, onPick }: { email: string | null; saving: boolean; error: string | null; onPick: (mode: 'solo' | 'agency') => void }) {
  const t = useTranslations('onboarding')
  const domain = workDomain(email)
  const cards = [
    {
      mode: 'solo' as const,
      title: t('modeSolo'),
      body: t('modeSoloBody'),
      icon: <span className="h-2.5 w-2.5 rounded-[3px] bg-nuw-primary" />,
    },
    {
      mode: 'agency' as const,
      title: t('modeAgency'),
      body: t('modeAgencyBody'),
      icon: (
        <span className="flex gap-1.5">
          {[0, 1, 2].map((item) => (
            <span key={item} className="h-2.5 w-2.5 rounded-[3px] bg-zinc-500" />
          ))}
        </span>
      ),
    },
  ]

  return (
    <Centered>
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-nuw-primary">
        <svg viewBox="0 0 32 32" className="h-7 w-7">
          <path d="M9 22V10h3.2l3.8 7.2L19.8 10H23v12h-2.6v-7.4L17 22h-2l-3.4-7.4V22H9z" fill="white" />
        </svg>
      </span>
      <h1 className="mt-5 text-center text-[22px] font-medium tracking-tight">{domain ? t('modeTitleDomain', { domain }) : t('modeTitle')}</h1>
      <p className="mt-1.5 text-zinc-500">{t('modeBody')}</p>
      <div className="mt-6 grid w-full max-w-[460px] gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <button
            key={card.mode}
            type="button"
            disabled={saving}
            onClick={() => onPick(card.mode)}
            className="group flex flex-col rounded-xl border border-nuw-line bg-white p-3.5 text-left shadow-card transition hover:border-zinc-300 disabled:opacity-60"
          >
            <span className="flex h-8 w-fit items-center rounded-lg border border-nuw-line px-2.5">{card.icon}</span>
            <span className="mt-6 text-[14px] font-medium text-zinc-900">{card.title}</span>
            <span className="mt-0.5 flex items-center justify-between gap-2 text-[12px] text-zinc-500">
              {card.body}
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-900" />
            </span>
          </button>
        ))}
      </div>
      <ErrorText>{error}</ErrorText>
    </Centered>
  )
}

function DomainStep({
  initial,
  title,
  busy,
  error,
  onClearError,
  onSubmit,
}: {
  initial: string
  title: string
  busy: boolean
  error: string | null
  onClearError: () => void
  onSubmit: (value: string) => void
}) {
  const t = useTranslations('onboarding')
  const [value, setValue] = useState(initial)

  return (
    <div className="flex w-full flex-col items-center pt-4">
      <DashboardPreview />
      <Heading title={title} body={t('domainBody')} />
      <form
        className="mt-6 w-full"
        noValidate
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          onSubmit(value)
        }}
      >
        <Glow>
          <label className="flex items-center gap-2 py-2 pl-3 pr-2">
            <span className="sr-only">{t('domainLabel')}</span>
            <input
              autoFocus
              value={value}
              disabled={busy}
              inputMode="url"
              autoComplete="url"
              aria-invalid={Boolean(error)}
              aria-describedby="domain-help"
              onChange={(event) => {
                setValue(event.target.value)
                onClearError()
              }}
              placeholder={t('domainPlaceholder')}
              className="h-8 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-zinc-400"
            />
            <ArrowButton busy={busy} label={t('continue')} />
          </label>
        </Glow>
        <div id="domain-help" className="mx-auto max-w-[440px] px-3">
          {busy ? <p className="mt-2 text-[12px] text-zinc-500">{t('domainChecking')}</p> : <ErrorText>{error}</ErrorText>}
        </div>
      </form>
    </div>
  )
}

function NameStep({
  draft,
  title,
  busy,
  error,
  onError,
  onSubmit,
}: {
  draft: OnboardingDraft
  title: string
  busy: boolean
  error: string | null
  onError: (message: string | null) => void
  onSubmit: (name: string) => void
}) {
  const t = useTranslations('onboarding')
  const [value, setValue] = useState(draft.name)
  const trimmed = value.trim()

  return (
    <div className="flex w-full flex-col items-center pt-4">
      <DashboardPreview name={trimmed} highlightName />
      <Heading title={title} body={t('nameBody')} />
      <form
        className="mt-6 w-full"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (!trimmed) return onError(t('nameEmpty'))
          if (trimmed.length > 60) return onError(t('nameTooLong'))
          onSubmit(trimmed)
        }}
      >
        <Glow>
          <label className="flex items-center gap-2 py-2 pl-3 pr-2">
            <span className="sr-only">{t('nameLabel')}</span>
            <input
              autoFocus
              value={value}
              disabled={busy}
              aria-invalid={Boolean(error)}
              onChange={(event) => {
                setValue(event.target.value)
                onError(null)
              }}
              placeholder={t('namePlaceholder')}
              className="h-8 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-zinc-400"
            />
            <ArrowButton busy={busy} label={t('continue')} />
          </label>
        </Glow>
        <div className="mx-auto max-w-[440px] px-3">
          <ErrorText>{error}</ErrorText>
        </div>
      </form>
      <div className="mt-4">
        <Chip>{draft.domain}</Chip>
      </div>
    </div>
  )
}

function LocationsStep({
  draft,
  locale,
  busy,
  error,
  onError,
  onSubmit,
}: {
  draft: OnboardingDraft
  locale: string
  busy: boolean
  error: string | null
  onError: (message: string | null) => void
  onSubmit: (locations: Location[]) => void
}) {
  const t = useTranslations('onboarding')
  const zones = useMemo(zoneList, [])
  const [rows, setRows] = useState<Location[]>(() =>
    draft.locations.length ? draft.locations : [{ country: 'us', language: languageCodes.includes(locale) ? locale : 'en', timezone: browserZone() }],
  )
  const regionNames = useMemo(() => new Intl.DisplayNames([locale], { type: 'region' }), [locale])
  const languageNames = useMemo(() => new Intl.DisplayNames([locale], { type: 'language' }), [locale])
  const countryName = (code: string) => regionNames.of(regionCode[code] ?? code.toUpperCase()) ?? code
  const languageName = (code: string) => languageNames.of(code) ?? code

  const update = (index: number, patch: Partial<Location>) => {
    onError(null)
    setRows((current) => current.map((row, position) => (position === index ? { ...row, ...patch } : row)))
  }

  const addRow = () => {
    if (rows.length >= locationLimit) {
      onError(t('locationsLimit', { max: locationLimit }))
      return
    }
    onError(null)
    const used = new Set(rows.map((row) => row.country))
    const country = countryCodes.find((code) => !used.has(code)) ?? 'us'
    setRows((current) => [...current, { ...current[current.length - 1], country }])
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const seen = new Set<string>()
    for (const row of rows) {
      const key = `${row.country}:${row.language}`
      if (seen.has(key)) {
        onError(t('locationsDuplicate', { country: countryName(row.country), language: languageName(row.language) }))
        return
      }
      seen.add(key)
    }
    onSubmit(rows)
  }

  const selectClass = 'h-7 min-w-0 cursor-pointer appearance-none bg-transparent pr-1 text-[13px] outline-none'

  return (
    <div className="flex w-full flex-col items-center pt-4">
      <DashboardPreview name={draft.name} />
      <Heading title={t('locationsTitle')} body={t('locationsBody')} />
      <form className="mt-6 w-full" noValidate onSubmit={submit}>
        <Glow className="max-w-[560px]">
          <ul className="divide-y divide-nuw-line">
            {rows.map((row, index) => (
              <li key={index} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5 pl-3 pr-2">
                <label className="flex min-w-[150px] flex-1 items-center gap-2">
                  <Flag id={row.country} title={countryName(row.country)} />
                  <span className="sr-only">{t('locationsCountry')}</span>
                  <select value={row.country} disabled={busy} onChange={(event) => update(index, { country: event.target.value })} className={cn(selectClass, 'flex-1')}>
                    {countryCodes.map((code) => (
                      <option key={code} value={code}>
                        {countryName(code)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-1 text-zinc-700">
                  <Languages className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="sr-only">{t('locationsLanguage')}</span>
                  <select value={row.language} disabled={busy} onChange={(event) => update(index, { language: event.target.value })} className={selectClass}>
                    {languageCodes.map((code) => (
                      <option key={code} value={code}>
                        {languageName(code)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-1 text-zinc-700">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="sr-only">{t('locationsTimezone')}</span>
                  <select value={row.timezone} disabled={busy} onChange={(event) => update(index, { timezone: event.target.value })} className={cn(selectClass, 'max-w-[150px]')}>
                    {zones.map((zone) => (
                      <option key={zone} value={zone}>
                        {zoneLabel(zone)}
                      </option>
                    ))}
                  </select>
                </label>
                {index === 0 ? (
                  <span className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={addRow}
                      disabled={busy}
                      aria-label={t('locationsAdd')}
                      title={t('locationsAdd')}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-nuw-line text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <ArrowButton busy={busy} label={t('continue')} />
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onError(null)
                      setRows((current) => current.filter((_, position) => position !== index))
                    }}
                    aria-label={t('locationsRemove', { country: countryName(row.country) })}
                    className="grid h-7 w-7 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Glow>
        <div className="mx-auto max-w-[560px] px-3">
          <ErrorText>{error}</ErrorText>
        </div>
      </form>
      <div className="mt-4 flex gap-1.5">
        <Chip>{draft.domain}</Chip>
        <Chip>{draft.name}</Chip>
      </div>
    </div>
  )
}

function ProfileStep({
  profile,
  title,
  preview,
  busy,
  error,
  onSubmit,
}: {
  profile: BrandProfile
  title: string
  preview: boolean
  busy: boolean
  error: string | null
  onSubmit: (profile: BrandProfile) => void
}) {
  const t = useTranslations('onboarding')
  const [value, setValue] = useState<BrandProfile>(profile)
  const [checked, setChecked] = useState(false)
  const set = <K extends keyof BrandProfile>(key: K, next: BrandProfile[K]) => setValue((current) => ({ ...current, [key]: next }))

  const problems: Partial<Record<keyof BrandProfile, string>> = {}
  const description = value.description.trim()
  if (!description) problems.description = t('profileDescriptionEmpty')
  else if (description.length > profileLimits.description) problems.description = t('profileDescriptionLong', { max: profileLimits.description, count: description.length })
  if (!value.category.trim()) problems.category = t('profileCategoryEmpty')
  else if (value.category.trim().length > profileLimits.category) problems.category = t('profileCategoryLong', { max: profileLimits.category })
  if (!value.products.length) problems.products = t('profileProductsEmpty')
  if (!value.personas.length) problems.personas = t('profilePersonasEmpty')
  const count = Object.keys(problems).length
  const shown = checked ? problems : {}

  return (
    <form
      noValidate
      className="w-full max-w-[480px] pt-2"
      onSubmit={(event) => {
        event.preventDefault()
        setChecked(true)
        if (count) {
          const form = event.currentTarget
          window.setTimeout(() => form.querySelector('[role="alert"]')?.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
          return
        }
        onSubmit({ ...value, description, category: value.category.trim() })
      }}
    >
      <h1 className="text-[22px] font-medium tracking-tight">{title}</h1>
      <p className="mt-1 leading-5 text-zinc-500">{t(preview ? 'profileBodyManual' : 'profileBody')}</p>
      {preview ? <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-5 text-amber-900">{t('profilePreviewNote')}</p> : null}
      <div className="mt-2">
        <Field label={t('profileDescription')} hint={t('profileDescriptionHint')} help={t('profileDescriptionHelp')} error={shown.description}>
          <textarea
            value={value.description}
            rows={3}
            aria-label={t('profileDescription')}
            onChange={(event) => set('description', event.target.value)}
            placeholder={t('profileDescriptionPlaceholder')}
            aria-invalid={Boolean(shown.description)}
            className={cn('w-full resize-none rounded-lg border border-nuw-line px-3 py-2 text-[13px] leading-5 outline-none focus:border-nuw-primary', shown.description && 'border-rose-300')}
          />
          <p className={cn('mt-1 text-right text-[11px]', description.length > profileLimits.description ? 'text-rose-700' : 'text-zinc-400')}>
            {description.length}/{profileLimits.description}
          </p>
        </Field>
        <Field label={t('profileCategory')} hint={t('profileCategoryHint')} help={t('profileCategoryHelp')} error={shown.category}>
          <input
            value={value.category}
            aria-label={t('profileCategory')}
            onChange={(event) => set('category', event.target.value)}
            placeholder={t('profileCategoryPlaceholder')}
            aria-invalid={Boolean(shown.category)}
            className={cn('h-9 w-full rounded-lg border border-nuw-line px-3 text-[13px] outline-none focus:border-nuw-primary', shown.category && 'border-rose-300')}
          />
        </Field>
        <Field label={t('profileIdentity')} hint={t('profileIdentityHint')} help={t('profileIdentityHelp')}>
          <ChipInput values={value.identity} onChange={(next) => set('identity', next)} max={profileLimits.identity} label={t('profileIdentity')} />
        </Field>
        <Field label={t('profileProducts')} hint={t('profileProductsHint')} help={t('profileProductsHelp')} error={shown.products}>
          <ChipInput values={value.products} onChange={(next) => set('products', next)} max={profileLimits.products} label={t('profileProducts')} invalid={Boolean(shown.products)} />
        </Field>
        <Field label={t('profilePersonas')} hint={t('profilePersonasHint')} help={t('profilePersonasHelp')} error={shown.personas}>
          <ChipInput values={value.personas} onChange={(next) => set('personas', next)} max={profileLimits.personas} label={t('profilePersonas')} invalid={Boolean(shown.personas)} />
        </Field>
      </div>
      <div className="pointer-events-none sticky bottom-0 mt-4 flex flex-col items-center gap-1 bg-gradient-to-t from-white via-white to-transparent pb-2 pt-6 [&>*]:pointer-events-auto">
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
          {t('profileSubmit')}
        </PrimaryButton>
        {checked && count ? <ErrorText>{t('profileFix', { count })}</ErrorText> : <ErrorText>{error}</ErrorText>}
      </div>
    </form>
  )
}

function MarketStep({
  draft,
  busy,
  error,
  onError,
  onSubmit,
}: {
  draft: OnboardingDraft
  busy: boolean
  error: string | null
  onError: (message: string | null) => void
  onSubmit: (market: OnboardingDraft['market']) => void
}) {
  const t = useTranslations('onboarding')
  const [scope, setScope] = useState<MarketScope>(draft.market.scope)
  const [places, setPlaces] = useState<string[]>(draft.market.places)

  return (
    <div className="flex w-full flex-col items-center pt-4">
      <DashboardPreview name={draft.name} />
      <Heading title={t('marketTitle')} body={t('marketBody')} />
      <div role="radiogroup" aria-label={t('marketTitle')} className="mt-5 flex flex-wrap justify-center gap-1.5">
        {marketScopes.map((item) => (
          <button
            key={item}
            type="button"
            role="radio"
            aria-checked={scope === item}
            onClick={() => {
              onError(null)
              if (item !== scope) setPlaces([])
              setScope(item)
            }}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-[12px] font-medium transition',
              scope === item ? 'border-zinc-300 bg-zinc-100 text-zinc-900' : 'border-nuw-line bg-white text-zinc-600 hover:bg-zinc-50',
            )}
          >
            {t(`market.${item}`)}
          </button>
        ))}
      </div>
      {scope !== 'global' ? (
        <div className="mt-4 w-full max-w-[440px] rounded-xl border border-nuw-line p-3">
          <p className="mb-2 text-[12px] text-zinc-600">{t(`marketPlaces.${scope}`)}</p>
          <ChipInput
            values={places}
            onChange={(next) => {
              onError(null)
              setPlaces(next)
            }}
            max={20}
            label={t(`market.${scope}`)}
          />
        </div>
      ) : null}
      <PrimaryButton
        className="mt-5"
        disabled={busy}
        onClick={() => {
          if (scope !== 'global' && !places.length) {
            onError(t('marketPlacesEmpty', { scope }))
            return
          }
          onSubmit({ scope, places: scope === 'global' ? [] : places })
        }}
      >
        {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
        {t('continue')}
      </PrimaryButton>
      <ErrorText>{error}</ErrorText>
    </div>
  )
}

function TopicsStep({
  draft,
  busy,
  error,
  onError,
  onRetry,
  onEditProfile,
  onChange,
  onSubmit,
}: {
  draft: OnboardingDraft
  busy: boolean
  error: string | null
  onError: (message: string | null) => void
  onRetry: () => void
  onEditProfile: () => void
  onChange: (topics: OnboardingDraft['topics']) => void
  onSubmit: () => void
}) {
  const t = useTranslations('onboarding')
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const topics = draft.topics

  const add = () => {
    const name = text.trim()
    if (!name) return onError(t('topicEmpty'))
    if (name.length > 60) return onError(t('topicTooLong'))
    if (topics.some((topic) => (topic.name ?? '').toLowerCase() === name.toLowerCase())) return onError(t('topicExists', { name }))
    if (topics.length >= topicLimit) return onError(t('topicLimit', { max: topicLimit }))
    onError(null)
    onChange([...topics, { id: `new-${Date.now()}`, name }])
    setText('')
  }

  const pane = (
    <ul className="flex flex-col pb-2">
      <li>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-between border-b border-nuw-line px-3 py-1.5 text-[11px] text-zinc-500 hover:bg-zinc-50"
        >
          {t('topicsAdd')}
          <Plus className="h-3 w-3" />
        </button>
      </li>
      {topics.map((topic) => (
        <li key={topic.id} className="group flex items-center justify-between px-3 py-1 text-[11px] text-zinc-800">
          <span className="truncate">{topic.name}</span>
          <button
            type="button"
            onClick={() => {
              onError(null)
              onChange(topics.filter((item) => item.id !== topic.id))
            }}
            aria-label={t('topicRemove', { name: topic.name ?? '' })}
            className="grid h-5 w-5 place-items-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-rose-700"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="flex w-full flex-col items-center pt-4">
      <DashboardPreview name={draft.name} topicsPane={pane} />
      <Heading title={t('topicsTitle')} />
      <p className="mt-1.5 text-center leading-5 text-zinc-500">
        {t('topicsBody')}
        <br />
        {t('topicsSource')}{' '}
        <button type="button" onClick={onEditProfile} className="text-nuw-primary underline underline-offset-2">
          {t('topicsEditProfile')}
        </button>
      </p>
      {adding ? (
        <form
          className="mt-4 w-full"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            add()
          }}
        >
          <Glow>
            <label className="flex items-center gap-2 py-2 pl-3 pr-2">
              <span className="sr-only">{t('topicsAddLabel')}</span>
              <input
                autoFocus
                value={text}
                onChange={(event) => {
                  setText(event.target.value)
                  onError(null)
                }}
                placeholder={t('topicsAddPlaceholder')}
                className="h-8 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-zinc-400"
              />
              <button type="submit" className="rounded-lg bg-nuw-button px-3 py-1.5 text-[12px] font-medium text-white hover:bg-nuw-buttonHover">
                {t('topicsAddButton')}
              </button>
            </label>
          </Glow>
        </form>
      ) : null}
      <div className="mt-5 flex gap-2">
        {!adding ? <SecondaryButton onClick={() => setAdding(true)}>{t('topicsAdd')}</SecondaryButton> : null}
        {!topics.length ? <SecondaryButton onClick={onRetry}>{t('topicsRetry')}</SecondaryButton> : null}
        <PrimaryButton
          disabled={busy}
          onClick={() => {
            if (!topics.length) return onError(t('topicsNone'))
            onSubmit()
          }}
        >
          {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
          {t('continue')}
        </PrimaryButton>
      </div>
      <ErrorText>{error}</ErrorText>
    </div>
  )
}

const intentColors = {
  informational: { bar: '#dce6ff', dot: '#0ea5e9' },
  commercial: { bar: '#fdebd9', dot: '#f97316' },
  transactional: { bar: '#dcf2e3', dot: '#15803d' },
}

function Share({ dot, label, value }: { dot: string; label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5 rounded-md border border-nuw-line px-2 py-1 text-[12px] text-zinc-600">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: dot }} />
      {label}
      <span className="font-medium text-zinc-900">{value}%</span>
    </span>
  )
}

function ReviewStep({
  name,
  prompts,
  limit,
  busy,
  error,
  onContinue,
}: {
  name: string
  prompts: ReviewPrompt[]
  limit: number
  busy: boolean
  error: string | null
  onContinue: (ids: string[]) => void
}) {
  const t = useTranslations('onboarding')
  const [selected, setSelected] = useState<string[]>([])
  const [atLimit, setAtLimit] = useState(false)
  const promptKey = prompts.map((item) => item.id).join('\n')
  useEffect(() => {
    setSelected([])
    setAtLimit(false)
  }, [promptKey])

  const selectedSet = useMemo(() => new Set(selected), [selected])
  const showLocation = useMemo(() => new Set(prompts.map((item) => item.location).filter(Boolean)).size > 1, [prompts])
  const groups = useMemo(() => {
    const map = new Map<string, { id: string; name: string; prompts: ReviewPrompt[] }>()
    for (const prompt of prompts) {
      const key = prompt.topicId ?? 'other'
      const group = map.get(key) ?? { id: key, name: prompt.topicName || t('promptsReviewOther'), prompts: [] }
      group.prompts.push(prompt)
      map.set(key, group)
    }
    return [...map.values()]
  }, [prompts, t])
  const room = Math.max(0, limit)
  const fillCount = Math.min(room, prompts.length)
  const overLimit = selected.length > room
  const canContinue = prompts.length > 0 && !busy && !overLimit

  const toggle = (id: string) => {
    setSelected((current) => {
      if (current.includes(id)) {
        setAtLimit(false)
        return current.filter((item) => item !== id)
      }
      if (current.length >= room) {
        setAtLimit(true)
        return current
      }
      setAtLimit(false)
      return [...current, id]
    })
  }

  return (
    <div className="w-full max-w-[720px] pt-6">
      <h1 className="text-[22px] font-medium tracking-tight">{t('promptsReviewTitle')}</h1>
      <p className="mt-1 leading-5 text-zinc-500">
        {name
          ? t('promptsReviewBody', { name, count: prompts.length, limit: room })
          : t('promptsReviewBodyShort', { count: prompts.length, limit: room })}
      </p>
      <p className="mt-1 leading-5 text-zinc-500">{t('promptsReviewHint')}</p>
      {prompts.length < onboardingPool ? <p className="mt-2 leading-5 text-zinc-700">{t('promptsReviewShort', { count: prompts.length })}</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <p className="text-[13px] font-medium text-zinc-900">{t('promptsReviewCount', { selected: selected.length, limit: room })}</p>
        {fillCount > 0 ? (
          <button
            type="button"
            onClick={() => {
              setAtLimit(false)
              setSelected(spreadSelection(prompts, fillCount))
            }}
            className="rounded-lg border border-nuw-line bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-800 hover:bg-zinc-100"
          >
            {t('promptsReviewSelect', { count: fillCount })}
          </button>
        ) : null}
        {selected.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setAtLimit(false)
              setSelected([])
            }}
            className="rounded-lg px-3 py-1.5 text-[13px] text-zinc-600 hover:bg-zinc-100"
          >
            {t('promptsReviewClear')}
          </button>
        ) : null}
      </div>
      <div className="mt-3 max-h-[60vh] space-y-4 overflow-auto pr-1">
        {groups.map((group) => {
          const picked = group.prompts.filter((item) => selectedSet.has(item.id)).length
          return (
            <section key={group.id}>
              <h2 className="sticky top-0 bg-white py-1 text-[13px] font-medium text-zinc-900">
                {group.name}
                <span className="ml-2 font-normal text-zinc-500">{t('promptsReviewGroup', { selected: picked, count: group.prompts.length })}</span>
              </h2>
              <ul className="space-y-2">
                {group.prompts.map((item) => {
                  const checked = selectedSet.has(item.id)
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        onClick={() => toggle(item.id)}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-xl border px-3 py-2 text-left leading-5',
                          checked ? 'border-zinc-900 bg-zinc-50' : 'border-nuw-line hover:bg-zinc-50',
                        )}
                      >
                        <span className={cn('mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border', checked ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 bg-white')}>
                          {checked ? <Check className="h-3 w-3" /> : null}
                        </span>
                        <span className="text-zinc-800">
                          {item.text}
                          {showLocation && item.location ? <span className="ml-2 text-[12px] uppercase text-zinc-400">{item.location}</span> : null}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
      <div className="mt-6 flex flex-col items-center">
        <PrimaryButton disabled={!canContinue} onClick={() => onContinue(selected)}>{busy ? t('promptsReviewSaving') : t('promptsReviewContinue')}</PrimaryButton>
        {overLimit && room <= 0 ? <ErrorText>{t('promptsReviewFull')}</ErrorText> : null}
        {atLimit || (overLimit && room > 0) ? <ErrorText>{t('promptsReviewAtLimit', { limit: room })}</ErrorText> : null}
        {error ? <ErrorText>{error}</ErrorText> : null}
      </div>
    </div>
  )
}

function FocusStep({ initial, error, onSubmit }: { initial: Focus; error: string | null; onSubmit: (focus: Focus) => void }) {
  const t = useTranslations('onboarding')
  const [focus, setFocus] = useState<Focus>(initial in focusSplit ? initial : 'compare')
  const split = focusSplit[focus]
  const intents = (['informational', 'commercial', 'transactional'] as const).map((id) => ({ id, share: split[id] }))

  return (
    <div className="w-full max-w-[480px] pt-6">
      <h1 className="text-[22px] font-medium tracking-tight">{t('focusTitle')}</h1>
      <p className="mt-1 leading-5 text-zinc-500">{t('focusBody')}</p>
      <div role="radiogroup" aria-label={t('focusTitle')} className="mt-5 grid gap-2 sm:grid-cols-3">
        {focusIds.map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={focus === id}
            onClick={() => setFocus(id)}
            className={cn('rounded-xl border p-3 text-left transition', focus === id ? 'border-zinc-300 shadow-card' : 'border-nuw-line hover:bg-zinc-50')}
          >
            <span className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-900">
              <span className={cn('h-1.5 w-1.5 rounded-full', focus === id ? 'bg-zinc-900' : 'bg-zinc-300')} />
              {t(`focus.${id}`)}
            </span>
            <span className="mt-1 block text-[12px] leading-4 text-zinc-500">{t(`focus.${id}Body`)}</span>
          </button>
        ))}
      </div>

      <h2 className="mt-6 text-[13px] font-medium">
        {t('focusBranding')} <span className="font-normal text-zinc-500">{t('focusBrandingHint')}</span>
      </h2>
      <div className="mt-2 flex gap-1.5" aria-hidden>
        <span className="h-5 rounded-md bg-zinc-100" style={{ width: `${split.nonBranded}%` }} />
        <span className="h-5 rounded-md bg-blue-50" style={{ width: `${100 - split.nonBranded}%` }} />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <Share dot="#3A3F4C" label={t('focusNonBranded')} value={split.nonBranded} />
        <Share dot="#014CFF" label={t('focusBranded')} value={100 - split.nonBranded} />
      </div>

      <h2 className="mt-6 text-[13px] font-medium">
        {t('focusIntent')} <span className="font-normal text-zinc-500">{t('focusIntentHint')}</span>
      </h2>
      <div className="mt-2 flex gap-1.5" aria-hidden>
        {intents.map((item) => (
          <span key={item.id} className="h-5 rounded-md transition-all" style={{ width: `${item.share}%`, background: intentColors[item.id].bar }} />
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {intents.map((item) => (
          <Share key={item.id} dot={intentColors[item.id].dot} label={t(`intent.${item.id}`)} value={item.share} />
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center">
        <PrimaryButton onClick={() => onSubmit(focus)}>{t('focusSubmit')}</PrimaryButton>
        <ErrorText>{error}</ErrorText>
      </div>
    </div>
  )
}

function DoneStep({
  draft,
  result,
  preview,
  onOpen,
  onStartOver,
}: {
  draft: OnboardingDraft
  result: CompleteResult | null
  preview: PreviewReason
  onOpen: (path: string) => void
  onStartOver: () => void
}) {
  const t = useTranslations('onboarding')
  const agency = draft.mode === 'agency'

  return (
    <Centered>
      <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-zinc-900">
        <Check className="h-5 w-5" />
      </span>
      <h1 className="mt-4 text-center text-[22px] font-medium tracking-tight">
        {preview ? t('donePreviewTitle') : draft.name ? t(agency ? 'doneTitleAgency' : 'doneTitle', { name: draft.name }) : t('doneTitleShort')}
      </h1>
      <p className="mt-2 max-w-md text-center leading-5 text-zinc-600">
        {preview ? t('donePreviewBody') : result ? t('doneBody', { prompts: result.prompts, topics: draft.topics.length }) : t('doneAlready')}
      </p>
      <div className="mt-6 flex gap-2">
        {preview ? <SecondaryButton onClick={onStartOver}>{t('doneStartOver')}</SecondaryButton> : null}
        <PrimaryButton onClick={() => onOpen(result && !preview ? '/prompts' : '/home')}>
          {result && !preview ? t('doneOpenPrompts') : t('doneOpenOverview')}
          <ArrowRight className="h-3.5 w-3.5" />
        </PrimaryButton>
      </div>
    </Centered>
  )
}
