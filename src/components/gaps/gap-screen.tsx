'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Loader2, Search, X } from 'lucide-react'
import type { ChatRecord } from '@/data/types'
import type { Competitor, PromptItem } from '@/data/prompts'
import { ApiNote } from '@/components/data/api-note'
import { ChatDetail, modelColor } from '@/components/overview/chat-detail'
import { FilterRow } from '@/components/prompts/filter-row'
import { topicLabel } from '@/components/prompts/bits'
import { usePrompts, type PromptFilters } from '@/components/prompts/prompts-context'
import { Favicon } from '@/components/shell/brand-mark'
import { useToast } from '@/components/ui/overlay'
import { useBrand } from '@/components/workspace/workspace-context'
import { Link } from '@/i18n/routing'
import { browserTimeZone } from '@/lib/format'
import { errorText, rangeQuery, useV2, v2Send, type V2Query } from '@/lib/v2'

const modelNames: Record<string, string> = {
  chatgpt: 'ChatGPT',
  perplexity: 'Perplexity',
  gemini: 'Gemini',
  claude: 'Claude',
  aioverview: 'AI Overview',
}

function plain(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function chatRange(filters: PromptFilters): V2Query {
  if (filters.range === 'custom') {
    if (filters.customStart && filters.customEnd) return { start_date: filters.customStart, end_date: filters.customEnd }
    return { start_date: 'all' }
  }
  return rangeQuery(filters.range)
}

function latestMisses(chats: ChatRecord[]) {
  const kept = new Map<string, ChatRecord>()
  for (const chat of chats) {
    if (chat.verdict?.state !== 'missing') continue
    const model = chat.models[0] ?? ''
    const key = `${plain(chat.prompt || chat.title || chat.id)}|${model}`
    const previous = kept.get(key)
    if (!previous || (chat.createdAt ?? '') > (previous.createdAt ?? '')) kept.set(key, chat)
  }
  return [...kept.values()].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
}

function citedPages(chat: ChatRecord) {
  const pages = (chat.sourceUrls ?? []).filter((source) => source.url && !source.isTrackedBrand)
  return pages.length ? pages : (chat.sourceUrls ?? []).filter((source) => source.url)
}

function brandHit(chat: ChatRecord, brandIds: string[] | null, competitors: Competitor[]) {
  if (!brandIds) return true
  const keys = new Set<string>()
  for (const id of Object.keys(chat.positions ?? {})) keys.add(plain(id))
  if (chat.verdict?.winnerBrandId) keys.add(plain(chat.verdict.winnerBrandId))
  if (chat.verdict?.winnerBrandName) keys.add(plain(chat.verdict.winnerBrandName))
  return brandIds.some((id) => {
    if (id === 'you') return false
    const competitor = competitors.find((item) => item.id === id)
    const names = [id, competitor?.name ?? ''].map(plain).filter(Boolean)
    return names.some((name) => keys.has(name) || [...keys].some((key) => key.replace(/[^a-z0-9]/g, '') === name.replace(/[^a-z0-9]/g, '')))
  })
}

function promptFor(chat: ChatRecord, prompts: PromptItem[]) {
  const text = plain(chat.prompt || chat.title || '')
  return text ? prompts.find((item) => plain(item.text) === text) : undefined
}

export function GapScreen() {
  const t = useTranslations('gaps.page')
  const topicText = useTranslations('prompts.page')
  const brand = useBrand()
  const { push } = useToast()
  const { filters, prompts, topics, competitors } = usePrompts()
  const brandLabel = brand.name.trim() || t('yourBrand')
  const queryParams = useMemo(() => ({ limit: 100, timezone: browserTimeZone(), ...chatRange(filters) }), [filters])
  const chatQuery = useV2<{ total: number; chats: ChatRecord[] }>('prompt-runs/chats', queryParams)
  const chats = chatQuery.data?.chats ?? []
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [saved, setSaved] = useState<Record<string, string>>({})

  const rows = useMemo(() => {
    const needle = plain(query)
    return latestMisses(chats).filter((chat) => {
      if (filters.models && !chat.models.some((model) => filters.models?.includes(model))) return false
      const prompt = promptFor(chat, prompts)
      if (filters.topics && (!prompt || !filters.topics.includes(prompt.topicId))) return false
      if (filters.tags) {
        const tags = prompt?.tagIds ?? []
        const tagged = filters.tagMode === 'and'
          ? filters.tags.every((tag) => tags.includes(tag))
          : filters.tags.some((tag) => tags.includes(tag))
        if (!tagged) return false
      }
      if (!brandHit(chat, filters.brandIds, competitors)) return false
      if (!needle) return true
      const pages = citedPages(chat)
      const haystack = plain(`${chat.prompt ?? ''} ${chat.title ?? ''} ${chat.verdict?.winnerBrandName ?? ''} ${pages.map((page) => `${page.title ?? ''} ${page.host}`).join(' ')}`)
      return haystack.includes(needle)
    })
  }, [chats, competitors, filters, prompts, query])

  const openIndex = rows.findIndex((chat) => chat.id === openId)
  const waiting = chatQuery.loading && !chatQuery.data
  const reason = rows.length
    ? null
    : query.trim()
      ? 'search'
      : chats.some((chat) => chat.verdict?.state === 'missing')
        ? 'filters'
        : chats.length
          ? 'clear'
          : 'empty'

  const createAction = async (chat: ChatRecord) => {
    const prompt = chat.prompt || chat.title || t('untitledPrompt')
    const model = chat.models[0] ?? ''
    const page = citedPages(chat)[0]
    const winner = chat.verdict?.winnerBrandName
    setSavingId(chat.id)
    try {
      const action = await v2Send<{ id: string }>('POST', 'actions', {
        group: 'owned_pages',
        title: t('actionTitle'),
        description: winner
          ? t('actionDescription', { winner, brand: brandLabel, prompt })
          : t('actionDescriptionNoWinner', { brand: brandLabel, prompt }),
        priority: 'high',
        recommendedChange: page
          ? t('actionChange', { brand: brandLabel, url: page.url })
          : t('actionChangeNew', { brand: brandLabel }),
        rationale: t('actionRationale', { brand: brandLabel }),
        target: { type: 'new_page', url: page?.url ?? null, sourceUrlId: page?.sourceUrlId ?? null },
        trigger: {
          promptText: prompt,
          model,
          chatId: chat.id,
          runResultId: chat.id,
          observedAt: chat.createdAt ?? new Date().toISOString(),
        },
        evidence: [
          {
            type: 'chat',
            id: chat.id,
            label: prompt,
            details: { verdict: 'missing', winner: winner ?? null },
            observedAt: chat.createdAt,
          },
          ...citedPages(chat).slice(0, 4).map((source) => ({
            type: 'source_url',
            id: source.id,
            label: source.title || source.host,
            href: source.url,
            details: { citationIndex: source.citationIndex ?? null, isTrackedBrand: source.isTrackedBrand },
            observedAt: chat.createdAt,
          })),
        ],
      })
      setSaved((current) => ({ ...current, [chat.id]: action.id }))
      push({ title: t('actionSaved'), body: t('actionSavedBody', { brand: brandLabel }) })
    } catch (caught) {
      push({ title: t('saveFailedTitle'), body: errorText(caught) })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="min-h-full bg-white">
      <FilterRow />
      <div className="px-4 py-5">
        <ApiNote loading={chatQuery.loading} error={chatQuery.error} shown={chats.length} total={chatQuery.data?.total} />
        <h2 className="text-[15px] font-semibold text-zinc-900">{t('missedTitle')}</h2>
        <p className="mt-1 text-[13px] text-zinc-500">{t('missedHint', { brand: brandLabel })}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="flex h-8 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-nuw-line px-2 text-[13px]">
            <Search className="h-3.5 w-3.5 text-zinc-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchMissed')} aria-label={t('searchMissed')} className="w-full bg-transparent outline-none" />
            {query ? <button type="button" aria-label={t('clearSearch')} onClick={() => setQuery('')} className="text-zinc-400 hover:text-zinc-700"><X className="h-3.5 w-3.5" /></button> : null}
          </label>
        </div>

        {waiting ? null : reason ? (
          <div className="px-4 py-16 text-center">
            <h3 className="text-[15px] font-semibold text-zinc-900">{t('missedTitle')}</h3>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-5 text-zinc-500">
              {reason === 'search' ? t('missedSearchEmpty', { query: query.trim() }) : null}
              {reason === 'filters' ? t('missedFilterEmpty') : null}
              {reason === 'clear' ? t('noGaps', { brand: brandLabel }) : null}
              {reason === 'empty' ? t('noAnswers', { brand: brandLabel }) : null}
            </p>
            {reason === 'search' ? <button type="button" onClick={() => setQuery('')} className="mt-4 h-9 rounded-lg bg-nuw-button px-3 text-[13px] text-white">{t('clearSearch')}</button> : null}
          </div>
        ) : (
          <div className="mt-3 overflow-auto">
            <table className="w-max min-w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-nuw-line text-[12px] text-zinc-500">
                  <th className="px-2 py-2">#</th>
                  <th className="min-w-[280px] px-2 py-2">{t('promptColumn')}</th>
                  <th className="px-2 py-2">{t('modelColumn')}</th>
                  <th className="px-2 py-2">{t('whoWon')}</th>
                  <th className="min-w-[240px] px-2 py-2">{t('citedPage')}</th>
                  <th className="min-w-[180px] px-2 py-2">{t('explanationColumn')}</th>
                  <th className="px-2 py-2">{t('whatToDo')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((chat, index) => {
                  const prompt = promptFor(chat, prompts)
                  const topic = prompt ? topics.find((item) => item.id === prompt.topicId) : undefined
                  const pages = citedPages(chat)
                  const page = pages[0]
                  const model = chat.models[0] ?? ''
                  const winner = chat.verdict?.winnerBrandName
                  const position = chat.verdict?.winnerPosition
                  return (
                    <tr key={chat.id} className="border-b border-nuw-line">
                      <td className="px-2 py-3 text-zinc-400">{index + 1}</td>
                      <td className="max-w-[360px] px-2 py-3">
                        <button type="button" onClick={() => setOpenId(chat.id)} className="text-left font-medium text-zinc-800 hover:underline">
                          {chat.prompt || chat.title || t('untitledPrompt')}
                        </button>
                        {topic ? <span className="mt-0.5 block text-[12px] text-zinc-400">{topicLabel(topic, topicText)}</span> : null}
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 text-zinc-700">
                        {model ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: modelColor[model] ?? '#71717a' }} />
                            {modelNames[model] ?? model}
                          </span>
                        ) : t('winnerUnknown')}
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 text-zinc-800">
                        {winner ? (position == null ? winner : t('winnerLine', { name: winner, position: String(position) })) : t('winnerUnknown')}
                      </td>
                      <td className="px-2 py-3">
                        {page ? (
                          <span className="inline-flex items-center gap-2">
                            <a href={page.url} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-2 font-medium text-zinc-800 hover:underline">
                              <Favicon host={page.host} />
                              <span className="min-w-0">
                                <span className="block max-w-[220px] truncate">{page.title || page.host}</span>
                                <span className="block max-w-[220px] truncate text-[12px] font-normal text-zinc-400">{page.host}{page.path}</span>
                              </span>
                            </a>
                            {pages.length > 1 ? <span className="text-[12px] text-zinc-400">{t('moreSources', { count: pages.length - 1 })}</span> : null}
                          </span>
                        ) : <span className="text-zinc-400">{t('noCitedPageShort')}</span>}
                      </td>
                      <td className="px-2 py-3">
                        <span className="block text-[12px] font-medium text-zinc-700">
                          {t(`explanation.${chat.explanation?.status ?? 'unknown'}`)}
                        </span>
                        <span className="mt-0.5 block max-w-[240px] text-[12px] leading-5 text-zinc-400">
                          {chat.explanation?.summary || t('explanationUnavailable')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-3">
                        {saved[chat.id] ? (
                          <Link href="/actions" className="inline-flex items-center gap-1 font-medium text-zinc-800 hover:underline">
                            <Check className="h-3.5 w-3.5 text-emerald-600" /> {t('openActions')}
                          </Link>
                        ) : (
                          <button type="button" disabled={savingId === chat.id} onClick={() => createAction(chat)} className="inline-flex items-center gap-1 font-medium text-nuw-primary hover:underline disabled:opacity-50">
                            {savingId === chat.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            {savingId === chat.id ? t('addingAction') : t('addToActions')}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {rows.length ? <p className="mt-3 text-[12px] text-zinc-500">{t('missedCount', { count: rows.length })}</p> : null}
      </div>
      {openIndex >= 0 ? (
        <ChatDetail
          chat={rows[openIndex]}
          onClose={() => setOpenId(null)}
          onPrev={openIndex > 0 ? () => setOpenId(rows[openIndex - 1].id) : undefined}
          onNext={openIndex < rows.length - 1 ? () => setOpenId(rows[openIndex + 1].id) : undefined}
        />
      ) : null}
    </div>
  )
}
