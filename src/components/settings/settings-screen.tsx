'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Plus, X } from 'lucide-react'
import { Flag } from '@/components/prompts/flag'
import { usePathname, useRouter } from '@/i18n/routing'
import { cn } from '@/lib/cn'
import { errorText, useV2, v2Send } from '@/lib/v2'

const countries = ['us', 'uk', 'de', 'fr', 'in'] as const
const marketLanguages = ['en', 'de', 'fr', 'es', 'it', 'hi'] as const
const uiLanguages = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
  { id: 'es', label: 'Español' },
  { id: 'it', label: 'Italiano' },
  { id: 'de', label: 'Deutsch' },
] as const

const descriptionLimit = 500
const categoryLimit = 80
const phraseLimit = 60
const attributeLimit = 40
const locationLimit = 5

type LocationRow = { country: string; language: string; timezone: string }
type Profile = { description: string; category: string; identity: string[]; products: string[]; personas: string[] }
type AttributeRow = { id: string | null; name: string }
type SettingsBody = { locations: LocationRow[]; profile: Profile; attributes: AttributeRow[]; uiLanguage: string }

const emptyProfile = (): Profile => ({ description: '', category: '', identity: [], products: [], personas: [] })

function browserZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function SettingsScreen() {
  const t = useTranslations('settings.page')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const settings = useV2<SettingsBody>('settings')
  const regionNames = useMemo(() => new Intl.DisplayNames([locale], { type: 'region' }), [locale])
  const languageNames = useMemo(() => new Intl.DisplayNames([locale], { type: 'language' }), [locale])
  const timezones = useMemo(() => {
    const supported = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : ['UTC']
    return [...new Set([...supported, browserZone()])].sort((a, b) => a.localeCompare(b))
  }, [])
  const [draft, setDraft] = useState<SettingsBody | null>(null)
  const [problems, setProblems] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!settings.data) return
    setDraft({
      locations: settings.data.locations ?? [],
      profile: { ...emptyProfile(), ...settings.data.profile },
      attributes: settings.data.attributes ?? [],
      uiLanguage: settings.data.uiLanguage || locale,
    })
  }, [settings.data, locale])

  const countryName = (code: string) => regionNames.of(code === 'uk' ? 'GB' : code.toUpperCase()) ?? code
  const languageName = (code: string) => languageNames.of(code) ?? code

  const updateLocation = (index: number, patch: Partial<LocationRow>) => {
    setDraft((current) => current && { ...current, locations: current.locations.map((row, item) => (item === index ? { ...row, ...patch } : row)) })
  }

  const save = async () => {
    if (!draft) return
    const nextProblems = validate(draft, t, countryName, languageName)
    setProblems(nextProblems)
    setNotice('')
    if (nextProblems.length) return
    setSaving(true)
    try {
      const saved = await v2Send<SettingsBody>('PUT', 'settings', draft)
      setDraft({
        locations: saved.locations ?? draft.locations,
        profile: { ...emptyProfile(), ...saved.profile },
        attributes: saved.attributes ?? draft.attributes,
        uiLanguage: saved.uiLanguage || draft.uiLanguage,
      })
      if (saved.uiLanguage && saved.uiLanguage !== locale) {
        setNotice(t('savedSwitch', { language: uiLanguages.find((item) => item.id === saved.uiLanguage)?.label ?? saved.uiLanguage }))
        router.replace(pathname, { locale: saved.uiLanguage })
        return
      }
      setNotice(t('saved'))
    } catch (caught) {
      setProblems([errorText(caught, t('saveFailed'))])
    } finally {
      setSaving(false)
    }
  }

  if (settings.loading || (!draft && !settings.error)) {
    return <p className="p-6 text-sm text-zinc-500" role="status">{t('loading')}</p>
  }

  if (settings.error || !draft) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-700" role="alert">
          {settings.error === 'Not Found' ? t('unavailable') : settings.error || t('missingBrand')}
        </p>
        <button type="button" onClick={() => settings.reload()} className="mt-4 rounded-lg bg-nuw-button px-3 py-2 text-sm text-white hover:bg-nuw-buttonHover">
          {t('retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6">
      <header>
        <h1 className="text-[22px] font-extrabold tracking-[-0.025em]">{t('title')}</h1>
        <p className="mt-1 max-w-2xl text-[13px] leading-5 text-zinc-600">{t('intro')}</p>
      </header>

      {problems.length ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
          <p className="font-medium">{t('fixTitle')}</p>
          <ul className="mt-1 list-disc pl-5">
            {problems.map((problem) => <li key={problem}>{problem}</li>)}
          </ul>
        </div>
      ) : null}
      {notice ? <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p> : null}

      <Section title={t('marketsTitle')} body={t('marketsBody')}>
        {draft.locations.length === 0 ? <p className="text-sm text-zinc-600">{t('locationsRequired')}</p> : null}
        <ul className="space-y-3">
          {draft.locations.map((row, index) => (
            <li key={`${row.country}-${row.language}-${index}`} className="rounded-lg border border-nuw-line p-3">
              <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_36px]">
                <Field label={t('country')}>
                  <span className="flex h-9 items-center gap-2 rounded-lg border border-nuw-line bg-white px-2">
                    <Flag id={row.country} title={countryName(row.country)} />
                    <select value={row.country} onChange={(event) => updateLocation(index, { country: event.target.value })} className="h-full min-w-0 flex-1 bg-transparent text-[13px] outline-none">
                      {countries.map((code) => <option key={code} value={code}>{countryName(code)}</option>)}
                    </select>
                  </span>
                </Field>
                <Field label={t('language')}>
                  <select value={row.language} onChange={(event) => updateLocation(index, { language: event.target.value })} className={inputClass}>
                    {marketLanguages.map((code) => <option key={code} value={code}>{languageName(code)}</option>)}
                  </select>
                </Field>
                <Field label={t('timezone')}>
                  <select value={row.timezone} onChange={(event) => updateLocation(index, { timezone: event.target.value })} className={inputClass}>
                    {row.timezone && !timezones.includes(row.timezone) ? <option value={row.timezone}>{row.timezone.replaceAll('_', ' ')}</option> : null}
                    {timezones.map((zone) => (
                      <option key={zone} value={zone}>{zone.replaceAll('_', ' ')}</option>
                    ))}
                  </select>
                </Field>
                <button
                  type="button"
                  aria-label={t('removeLocation', { country: countryName(row.country), language: languageName(row.language) })}
                  onClick={() => setDraft({ ...draft, locations: draft.locations.filter((_, item) => item !== index) })}
                  className="grid h-9 w-9 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-[12px] leading-5 text-zinc-500">{t('timezoneHint')}</p>
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={draft.locations.length >= locationLimit}
          onClick={() => {
            const used = new Set(draft.locations.map((row) => row.country))
            const country = countries.find((code) => !used.has(code)) ?? 'us'
            setDraft({
              ...draft,
              locations: [...draft.locations, { country, language: marketLanguages.includes(locale as (typeof marketLanguages)[number]) ? locale : 'en', timezone: browserZone() }],
            })
          }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-800 disabled:text-zinc-400"
        >
          <Plus className="h-4 w-4" />
          {draft.locations.length >= locationLimit ? t('locationLimit') : t('addLocation')}
        </button>
      </Section>

      <Section title={t('profileTitle')} body={t('profileBody')}>
        <Field label={t('description')} meta={`${draft.profile.description.length} / ${descriptionLimit}`} hint={t('descriptionHint')}>
          <textarea
            value={draft.profile.description}
            maxLength={descriptionLimit}
            rows={4}
            onChange={(event) => setDraft({ ...draft, profile: { ...draft.profile, description: event.target.value } })}
            className="w-full resize-y rounded-lg border border-nuw-line bg-white px-3 py-2 text-[13px] leading-5 outline-none focus:border-zinc-400"
          />
        </Field>
        <Field label={t('category')} meta={`${draft.profile.category.length} / ${categoryLimit}`} hint={t('categoryHint')}>
          <input
            value={draft.profile.category}
            maxLength={categoryLimit}
            onChange={(event) => setDraft({ ...draft, profile: { ...draft.profile, category: event.target.value } })}
            className={inputClass}
          />
        </Field>
        <PhraseList
          label={t('identity')}
          hint={t('listHint', { count: draft.profile.identity.length, max: 10 })}
          items={draft.profile.identity}
          addLabel={t('addItem')}
          emptyLabel={t('phraseEmpty')}
          duplicateLabel={(item) => t('phraseDuplicate', { item })}
          limitLabel={t('listFull', { max: 10 })}
          max={10}
          removeLabel={(item) => t('removeItem', { item })}
          onChange={(identity) => setDraft({ ...draft, profile: { ...draft.profile, identity } })}
        />
        <PhraseList
          label={t('products')}
          hint={t('listRequiredHint', { field: t('products').toLowerCase(), count: draft.profile.products.length, max: 15 })}
          items={draft.profile.products}
          addLabel={t('addItem')}
          emptyLabel={t('phraseEmpty')}
          duplicateLabel={(item) => t('phraseDuplicate', { item })}
          limitLabel={t('listFull', { max: 15 })}
          max={15}
          removeLabel={(item) => t('removeItem', { item })}
          onChange={(products) => setDraft({ ...draft, profile: { ...draft.profile, products } })}
        />
        <PhraseList
          label={t('personas')}
          hint={t('listRequiredHint', { field: t('personas').toLowerCase(), count: draft.profile.personas.length, max: 10 })}
          items={draft.profile.personas}
          addLabel={t('addItem')}
          emptyLabel={t('phraseEmpty')}
          duplicateLabel={(item) => t('phraseDuplicate', { item })}
          limitLabel={t('listFull', { max: 10 })}
          max={10}
          removeLabel={(item) => t('removeItem', { item })}
          onChange={(personas) => setDraft({ ...draft, profile: { ...draft.profile, personas } })}
        />
      </Section>

      <Section title={t('attributesTitle')} body={t('attributesBody')}>
        {draft.attributes.length === 0 ? <p className="text-sm text-zinc-600">{t('attributeRequired')}</p> : null}
        <ul className="space-y-2">
          {draft.attributes.map((attribute, index) => (
            <li key={attribute.id ?? `new-${index}`} className="flex items-center gap-2">
              <input
                aria-label={t('attributeName')}
                value={attribute.name}
                maxLength={attributeLimit}
                onChange={(event) => setDraft({
                  ...draft,
                  attributes: draft.attributes.map((item, itemIndex) => (itemIndex === index ? { ...item, name: event.target.value } : item)),
                })}
                className={inputClass}
              />
              <button
                type="button"
                aria-label={t('removeAttribute', { name: attribute.name || t('attributeName') })}
                onClick={() => setDraft({ ...draft, attributes: draft.attributes.filter((_, item) => item !== index) })}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setDraft({ ...draft, attributes: [...draft.attributes, { id: null, name: '' }] })}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-800"
        >
          <Plus className="h-4 w-4" />
          {t('addAttribute')}
        </button>
      </Section>

      <Section title={t('uiTitle')} body={t('uiBody')}>
        <Field label={t('uiLanguage')}>
          <select
            value={draft.uiLanguage}
            onChange={(event) => setDraft({ ...draft, uiLanguage: event.target.value })}
            className={cn(inputClass, 'max-w-xs')}
          >
            {uiLanguages.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
      </Section>

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="rounded-lg bg-nuw-button px-4 py-2 text-sm font-medium text-white hover:bg-nuw-buttonHover disabled:opacity-60"
      >
        {saving ? t('saving') : t('save')}
      </button>
    </div>
  )
}

function validate(
  draft: SettingsBody,
  t: (key: string, values?: Record<string, string | number>) => string,
  countryName: (code: string) => string,
  languageName: (code: string) => string,
) {
  const problems: string[] = []
  if (!draft.locations.length) problems.push(t('locationsRequired'))
  const seen = new Set<string>()
  for (const row of draft.locations) {
    const key = `${row.country}:${row.language}`
    if (seen.has(key)) problems.push(t('locationDuplicate', { country: countryName(row.country), language: languageName(row.language) }))
    seen.add(key)
    if (!row.timezone.trim()) problems.push(t('timezoneRequired', { country: countryName(row.country) }))
  }
  if (draft.locations.length > locationLimit) problems.push(t('locationLimit'))
  const description = draft.profile.description.trim()
  const category = draft.profile.category.trim()
  if (!description || description.length > descriptionLimit) problems.push(t('descriptionRequired'))
  if (!category || category.length > categoryLimit) problems.push(t('categoryRequired'))
  if (!draft.profile.products.length) problems.push(t('listRequired', { field: t('products').toLowerCase() }))
  if (!draft.profile.personas.length) problems.push(t('listRequired', { field: t('personas').toLowerCase() }))
  if (!draft.attributes.length) problems.push(t('keepOne'))
  const names = new Set<string>()
  for (const attribute of draft.attributes) {
    const name = attribute.name.trim()
    if (!name) problems.push(t('attributeRequired'))
    else if (names.has(name.toLowerCase())) problems.push(t('attributeDuplicate', { name }))
    else names.add(name.toLowerCase())
  }
  if (!uiLanguages.some((item) => item.id === draft.uiLanguage)) problems.push(t('uiRequired'))
  return [...new Set(problems)]
}

function Section({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-nuw-line bg-white p-4">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-[13px] leading-5 text-zinc-600">{body}</p>
      </div>
      {children}
    </section>
  )
}

function Field({ label, meta, hint, children }: { label: string; meta?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block min-w-0 text-[13px]">
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="font-medium text-zinc-700">{label}</span>
        {meta ? <span className="shrink-0 text-[12px] font-normal text-zinc-400">{meta}</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1.5 block text-[12px] leading-5 text-zinc-500">{hint}</span> : null}
    </label>
  )
}

function PhraseList({
  label,
  hint,
  items,
  addLabel,
  emptyLabel,
  duplicateLabel,
  limitLabel,
  max,
  removeLabel,
  onChange,
}: {
  label: string
  hint: string
  items: string[]
  addLabel: string
  emptyLabel: string
  duplicateLabel: (item: string) => string
  limitLabel: string
  max: number
  removeLabel: (item: string) => string
  onChange: (items: string[]) => void
}) {
  const [text, setText] = useState('')
  const [problem, setProblem] = useState('')
  const add = () => {
    const next = text.trim()
    if (items.length >= max) {
      setProblem(limitLabel)
      return
    }
    if (!next) {
      setProblem(emptyLabel)
      return
    }
    if (items.some((item) => item.toLowerCase() === next.toLowerCase())) {
      setProblem(duplicateLabel(next))
      return
    }
    onChange([...items, next.slice(0, phraseLimit)])
    setText('')
    setProblem('')
  }
  return (
    <div>
      <p className="text-[13px] font-medium text-zinc-700">{label}</p>
      <p className="mt-1 text-[12px] leading-5 text-zinc-500">{hint}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-[12px]">
            {item}
            <button type="button" aria-label={removeLabel(item)} onClick={() => onChange(items.filter((current) => current !== item))} className="text-zinc-500 hover:text-zinc-800">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      {problem ? <p role="alert" className="mt-2 text-[12px] leading-5 text-red-700">{problem}</p> : null}
      <div className="mt-2 flex gap-2">
        <input
          value={text}
          maxLength={phraseLimit}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              add()
            }
          }}
          className={inputClass}
        />
        <button type="button" onClick={add} className="h-9 shrink-0 rounded-lg border border-nuw-line px-3 text-[13px] hover:bg-zinc-50">{addLabel}</button>
      </div>
    </div>
  )
}

const inputClass = 'h-9 w-full rounded-lg border border-nuw-line bg-white px-2 text-[13px] outline-none focus:border-zinc-400'
