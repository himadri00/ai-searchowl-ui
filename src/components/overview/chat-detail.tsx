'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, ChevronLeft, ChevronRight, ExternalLink, Loader2, Plus, X } from 'lucide-react'
import type { ActionItem, ChatRecord, FeatureId } from '@/data/types'
import { useBrand, useWorkspace } from '@/components/workspace/workspace-context'
import { errorText, useV2, v2Send } from '@/lib/v2'
import { BrandMark, Favicon } from '@/components/shell/brand-mark'
import { ChatAnswer } from '@/components/overview/chat-answer'
import { Link } from '@/i18n/routing'

export const modelColor: Record<string, string> = {
  chatgpt: '#111827',
  perplexity: '#0f766e',
  gemini: '#E85D0C',
  claude: '#c2410c',
  aioverview: '#7c3aed',
}

const featureIds: FeatureId[] = ['shopping', 'web', 'links']

/** A chat row from a domain or URL list. Extra API fields are read when present. */
export type SourceListChat = {
  id: string
  title: string
  snippet: string
  mentions?: string[] | null
  sources?: string[] | null
  links?: number | null
  features?: string[] | null
  position?: number | null
  positions?: Record<string, number> | null
  createdAt?: string | null
}

export function sourceChatRecord(chat: SourceListChat, brandName: string, activeBrandId: string): ChatRecord {
  const extra = chat as SourceListChat & Partial<Pick<ChatRecord, 'models' | 'country' | 'brandId' | 'prompt' | 'answer' | 'citations' | 'sourceUrls' | 'verdict' | 'explanation'>>
  const mentions = chat.mentions ?? []
  const models = (extra.models ?? []).filter((model) => typeof model === 'string' && model.length > 0)
  const features = (chat.features ?? []).filter((feature): feature is FeatureId => featureIds.includes(feature as FeatureId))
  return {
    id: chat.id,
    brandId: extra.brandId ?? (mentions.includes('you') ? activeBrandId : null),
    models,
    features,
    country: extra.country ?? '',
    tag: '',
    sources: chat.sources ?? [],
    sourceUrls: extra.sourceUrls,
    links: chat.links ?? 0,
    citations: extra.citations ?? 0,
    position: chat.position ?? null,
    positions: chat.positions,
    mentions,
    title: fill(chat.title, brandName),
    snippet: fill(chat.snippet, brandName),
    prompt: extra.prompt ? fill(extra.prompt, brandName) : undefined,
    answer: extra.answer ? fill(extra.answer, brandName) : undefined,
    createdAt: chat.createdAt,
    verdict: extra.verdict,
    explanation: extra.explanation,
  }
}

export function chatText(
  chat: ChatRecord,
  field: 'title' | 'snippet' | 'prompt' | 'answer',
  t: { (key: string): string; has: (key: string) => boolean },
) {
  const direct = chat[field]
  if (direct) return direct
  const key = `chat.${chat.id}.${field}`
  return t.has(key) ? t(key) : ''
}

export function ChatDetail({
  chat: row,
  onClose,
  onPrev,
  onNext,
}: {
  chat: ChatRecord
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
}) {
  const t = useTranslations('overview.page')
  const detail = useV2<Partial<ChatRecord>>(`prompt-runs/chats/${encodeURIComponent(row.id)}`)
  const chat: ChatRecord = detail.data
    ? {
        ...row,
        ...detail.data,
        models: detail.data.models?.length ? detail.data.models : row.models,
        sources: detail.data.sources ?? row.sources,
        sourceUrls: detail.data.sourceUrls ?? row.sourceUrls,
      }
    : row
  const shell = useTranslations('shell')
  const [promptOpen, setPromptOpen] = useState(false)
  const { workspaceBrands } = useWorkspace()
  const activeBrand = useBrand()
  const brand = workspaceBrands.find((item) => item.id === chat.brandId) ?? (activeBrand.id === chat.brandId ? activeBrand : null)
  const model = chat.models.find((item) => item.length > 0) ?? ''
  const modelName = model && t.has(`models.${model}`) ? t(`models.${model}`) : model
  const countryName = chat.country && t.has(`countries.${chat.country}`) ? t(`countries.${chat.country}`) : ''
  const answer = chatText(chat, 'answer', t) || (detail.error ? chatText(chat, 'snippet', t) : '')
  const [creatingAction, setCreatingAction] = useState(false)
  const [createdAction, setCreatedAction] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const exactSources = chat.sourceUrls ?? []

  const createAction = async () => {
    const prompt = chatText(chat, 'prompt', t) || chatText(chat, 'title', t)
    setCreatingAction(true)
    setActionError(null)
    try {
      const action = await v2Send<ActionItem>('POST', 'actions', {
        group: 'owned_pages',
        title: `Improve coverage for: ${prompt}`,
        description: chat.explanation?.summary ?? `Review how ${modelName || 'this model'} represented the tracked brand in this saved answer.`,
        priority: chat.verdict?.state === 'missing' ? 'high' : 'medium',
        recommendedChange: 'Review the saved answer and its cited sources. Update the most relevant owned page with a clear, specific, verifiable answer to this prompt.',
        rationale: 'This action is linked to a saved model answer and its citation evidence. Completing it does not guarantee a future ranking, mention, or citation.',
        target: { type: 'new_page' },
        trigger: {
          promptText: prompt,
          model,
          chatId: chat.id,
          runResultId: chat.id,
          observedAt: chat.createdAt,
        },
        evidence: [
          {
            type: 'chat',
            id: chat.id,
            label: `${modelName || 'Model'} answer: ${prompt}`,
            details: { verdict: chat.verdict?.state ?? 'unknown' },
            observedAt: chat.createdAt,
          },
          ...exactSources.map((source) => ({
            type: 'source_url',
            id: source.id,
            label: source.title || source.host,
            href: source.url,
            details: { citationIndex: source.citationIndex, isTrackedBrand: source.isTrackedBrand },
            observedAt: chat.createdAt,
          })),
        ],
      })
      setCreatedAction(action.id)
    } catch (error) {
      setActionError(errorText(error, 'The action could not be created. Try again.'))
    } finally {
      setCreatingAction(false)
    }
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-900/40 p-4" onMouseDown={onClose}>
      <div onMouseDown={(event) => event.stopPropagation()} className="grid max-h-[86vh] w-full max-w-5xl grid-rows-[auto_1fr_auto] overflow-hidden rounded-2xl bg-white shadow-menu md:grid-cols-[1fr_300px] md:grid-rows-[1fr_auto]">
        <div className="flex min-h-0 flex-col border-b border-nuw-line md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 px-5 py-4">
            {model ? (
              <span className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ background: modelColor[model] ?? '#3f3f46' }}>{model.slice(0, 1).toUpperCase()}</span>
            ) : null}
            {modelName ? <span className="text-sm font-medium">{modelName}</span> : null}
            {countryName ? <span className="text-[12px] text-zinc-400">{countryName}</span> : null}
            <button type="button" onClick={() => setPromptOpen((value) => !value)} className="ml-auto text-[13px] text-zinc-500 hover:text-zinc-900">
              {promptOpen ? t('hidePrompt') : t('viewPrompt')}
            </button>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-auto px-5 pb-6">
            <div className="ml-auto w-fit max-w-[75%] rounded-[22px] bg-[#f4f4f4] px-4 py-2.5 text-[16px] leading-6 text-[#0d0d0d]">{chatText(chat, 'title', t)}</div>
            {promptOpen ? <p className="rounded-xl bg-amber-50 px-3 py-2 text-[13px] leading-5 text-amber-900">{chatText(chat, 'prompt', t) || chatText(chat, 'title', t)}</p> : null}
            {detail.loading && !answer ? <p className="text-[13px] text-zinc-500">{t('chatLoading')}</p> : null}
            {detail.error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] leading-5 text-rose-700">{t('chatLoadFailed')}</p> : null}
            <ChatAnswer text={answer} />
            {chat.verdict ? (
              <div className="rounded-xl border border-nuw-line bg-zinc-50 px-3 py-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">What happened</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${verdictClass(chat.verdict.state)}`}>
                    {verdictLabel(chat.verdict.state)}
                  </span>
                  {chat.verdict.trackedBrandPosition ? <span className="text-[12px] text-zinc-500">Tracked brand position: {chat.verdict.trackedBrandPosition}</span> : null}
                  {chat.verdict.winnerBrandName ? <span className="text-[12px] text-zinc-500">Leading brand: {chat.verdict.winnerBrandName}{chat.verdict.winnerPosition ? ` · #${chat.verdict.winnerPosition}` : ''}</span> : null}
                </div>
                {chat.explanation ? (
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Why this verdict</p>
                    <p className="mt-1 text-[13px] leading-5 text-zinc-700">{chat.explanation.summary}</p>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      {chat.explanation.status === 'observed' ? 'Observed directly in the saved answer and citations.' : chat.explanation.status === 'inferred' ? 'Inferred from the attached evidence; review before acting.' : 'The available evidence does not explain this result.'}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
            {brand ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-2 py-1 text-[12px]">
                <BrandMark initials={brand.initials} color={brand.color} size={16} /> {brand.name}
              </span>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {chat.sources.map((host) => (
                <span key={host} className="inline-flex items-center gap-1 rounded-full border border-nuw-line px-2 py-1 text-[12px] text-zinc-600">
                  <Favicon host={host} /> {host}
                </span>
              ))}
            </div>
            <div>
              <button
                type="button"
                disabled={creatingAction || Boolean(createdAction)}
                onClick={createAction}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-[12px] font-medium text-white disabled:bg-zinc-400"
              >
                {creatingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : createdAction ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {creatingAction ? 'Creating action…' : createdAction ? 'Action created' : 'Create action from this evidence'}
              </button>
              {actionError ? <p className="mt-2 text-[12px] leading-5 text-rose-700">{actionError}</p> : null}
            </div>
          </div>
        </div>
        <aside className="min-h-0 overflow-auto">
          <div className="flex items-center justify-between px-4 py-4">
            <p className="text-sm font-semibold">{t('details')}</p>
            <button type="button" onClick={onClose} aria-label={shell('close')} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-zinc-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="px-4 text-[12px] font-medium uppercase tracking-wide text-zinc-400">{t('sourcesHeading')}</p>
          <ul className="space-y-3 px-4 py-3">
            {exactSources.length ? exactSources.map((source) => (
              <li key={source.id} className="text-[13px]">
                <a href={source.url} target="_blank" rel="noreferrer" className="group block rounded-lg border border-nuw-line p-2 hover:bg-zinc-50">
                  <span className="flex items-start gap-1 font-medium text-zinc-800">
                    <span className="min-w-0 flex-1">{source.title || source.host}</span>
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400 group-hover:text-zinc-700" />
                  </span>
                  <span className="mt-1 block break-all text-[11px] leading-4 text-blue-700">{source.url}</span>
                  <span className="mt-1 block text-[11px] text-zinc-400">
                    {source.isTrackedBrand ? 'Tracked-site source' : 'External source'}{source.citationIndex ? ` · Citation #${source.citationIndex}` : ''}
                  </span>
                </a>
                {source.sourceUrlId ? (
                  <Link href={`/prompts/urls/${source.sourceUrlId}`} className="mt-1 inline-block text-[11px] text-zinc-500 hover:text-zinc-900 hover:underline">
                    View URL evidence in AiSearchOwl
                  </Link>
                ) : null}
              </li>
            )) : chat.sources.map((host) => (
              <li key={host} className="text-[13px]">
                <p className="font-medium text-zinc-800">{t.has(`sourceTitles.${host.replaceAll('.', '_')}`) ? t(`sourceTitles.${host.replaceAll('.', '_')}`) : host}</p>
                <p className="text-[12px] text-zinc-400">{host}</p>
                <p className="mt-1 text-[11px] leading-4 text-amber-700">The model returned a source host, but no exact page URL was stored.</p>
              </li>
            ))}
          </ul>
          <p className="px-4 pb-4 text-[12px] leading-5 text-zinc-500">Open an exact URL to review the evidence on the source page.</p>
        </aside>
        <div className="col-span-full flex items-center justify-between border-t border-nuw-line px-4 py-3 text-[13px]">
          <button type="button" disabled={!onPrev} onClick={onPrev} className="inline-flex items-center gap-1 disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" /> {t('previous')}
          </button>
          <button type="button" disabled={!onNext} onClick={onNext} className="inline-flex items-center gap-1 disabled:opacity-30">
            {t('next')} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function fill(text: string, brand: string) {
  return text.replaceAll('{brand}', brand)
}

function verdictLabel(state: NonNullable<ChatRecord['verdict']>['state']) {
  if (state === 'recommended') return 'Recommended'
  if (state === 'mentioned') return 'Mentioned'
  if (state === 'cited') return 'Cited, not mentioned'
  return 'Missing'
}

function verdictClass(state: NonNullable<ChatRecord['verdict']>['state']) {
  if (state === 'recommended') return 'bg-emerald-100 text-emerald-800'
  if (state === 'mentioned') return 'bg-blue-100 text-blue-800'
  if (state === 'cited') return 'bg-violet-100 text-violet-800'
  return 'bg-rose-100 text-rose-800'
}
