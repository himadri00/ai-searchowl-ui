'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { ChatRecord, FeatureId } from '@/data/types'
import { useBrand, useWorkspace } from '@/components/workspace/workspace-context'
import { useV2 } from '@/lib/v2'
import { BrandMark, Favicon } from '@/components/shell/brand-mark'
import { ChatAnswer } from '@/components/overview/chat-answer'

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
  const extra = chat as SourceListChat & Partial<Pick<ChatRecord, 'models' | 'country' | 'brandId' | 'prompt' | 'answer' | 'citations'>>
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
    ? { ...row, ...detail.data, models: detail.data.models?.length ? detail.data.models : row.models, sources: detail.data.sources ?? row.sources }
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
            {chat.sources.map((host) => (
              <li key={host} className="text-[13px]">
                <p className="font-medium text-zinc-800">{t.has(`sourceTitles.${host.replaceAll('.', '_')}`) ? t(`sourceTitles.${host.replaceAll('.', '_')}`) : host}</p>
                <p className="text-[12px] text-zinc-400">{host}</p>
              </li>
            ))}
          </ul>
          <p className="px-4 pb-4 text-[12px] leading-5 text-zinc-500">{t('detailNote')}</p>
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
