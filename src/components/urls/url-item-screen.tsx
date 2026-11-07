'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Check, ChevronDown, Copy, Download, Info, Search } from 'lucide-react'
import { normalizeSourceUrl, type LiveSourceUrl, type UrlChat, type UrlPrompt } from '@/data/urls'
import { useV2 } from '@/lib/v2'
import { ApiNote } from '@/components/data/api-note'
import { ModelBars, RetrievalLines } from '@/components/urls/charts'
import { FilterRow } from '@/components/prompts/filter-row'
import { usePrompts } from '@/components/prompts/prompts-context'
import { downloadFile, toCsv, toExcelXml } from '@/components/perception/export-data'
import { ChatPositions, positionText } from '@/components/sources/chat-positions'
import { ChatDetail, sourceChatRecord } from '@/components/overview/chat-detail'
import { BrandMark, Favicon } from '@/components/shell/brand-mark'
import { useBrand } from '@/components/workspace/workspace-context'
import { Menu, MenuItem, Modal, useToast } from '@/components/ui/overlay'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/cn'
import { bucketChart, daysBeforeBrowserToday, formatChartDate, isBrowserToday, runCalendarKey, seriesSeenDays } from '@/lib/format'

type ChatCol = 'mentions' | 'sources' | 'links' | 'features' | 'position' | 'created' | 'citations'
const chatCols: ChatCol[] = ['mentions', 'sources', 'links', 'features', 'position', 'created']

export function UrlItemScreen({ id }: { id: string }) {
  const t = useTranslations('urls.page')
  const locale = useLocale()
  const brand = useBrand()
  const { push } = useToast()
  const { competitors } = usePrompts()
  const catalog = useV2<{ rows: Parameters<typeof normalizeSourceUrl>[0][]; dates: string[] }>('sources', { kind: 'url', limit: 100 })
  const detail = useV2<{ prompts?: UrlPrompt[]; chats?: UrlChat[]; pages?: unknown[]; snapshot?: { kicker: string; heading: string; lines: string[] }; messages?: { text: string }[] }>(`sources/${encodeURIComponent(id)}`)
  const url = catalog.data?.rows.map(normalizeSourceUrl).find((item) => item.id === id) ?? null
  const urlDates = catalog.data?.dates ?? []
  const snapshot = detail.data?.snapshot ?? { kicker: '', heading: '', lines: [] as string[] }
  const [content, setContent] = useState(false)
  const [tips, setTips] = useState<string | null>(null)
  const [resolution, setResolution] = useState<'day' | 'week' | 'month'>('day')
  const [query, setQuery] = useState('')
  const [features, setFeatures] = useState<string[] | null>(null)
  const [sources, setSources] = useState<string[] | null>(null)
  const [brands, setBrands] = useState<string[] | null>(null)
  const [brandMode, setBrandMode] = useState<'or' | 'and'>('or')
  const [columns, setColumns] = useState<ChatCol[]>(chatCols)
  const [copied, setCopied] = useState(false)
  const [openChatId, setOpenChatId] = useState<string | null>(null)

  if (catalog.loading || detail.loading) {
    return <div className="px-6 py-10"><ApiNote loading error={null} /></div>
  }

  if (!url) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-6">
        <h2 className="text-2xl font-semibold">{t('missingTitle')}</h2>
        <p className="mt-3 text-[15px] leading-6 text-zinc-600">{catalog.error ?? detail.error ?? t('missingBody')}</p>
        <Link href="/prompts/urls" className="mt-6 w-fit rounded-lg bg-nuw-button px-4 py-2 text-sm text-white">{t('backToUrls')}</Link>
      </div>
    )
  }

  const marks = [
    { id: 'you', name: brand.name, color: brand.color, initials: brand.initials },
    ...competitors,
  ]
  const promptRows = detail.data?.prompts ?? []
  const prompts = promptRows.filter((item) => {
    const topic = item.topic ? (t.has(item.topic) ? t(item.topic) : item.topic) : ''
    return (item.text ?? '').toLowerCase().includes(query.trim().toLowerCase()) || topic.toLowerCase().includes(query.trim().toLowerCase())
  })
  const chats = (detail.data?.chats ?? []).filter((chat) => {
    const chatFeatures = chat.features ?? []
    const chatSources = chat.sources ?? []
    const chatMentions = chat.mentions ?? []
    if (features && !chatFeatures.some((feature) => features.includes(feature))) return false
    if (sources && !chatSources.some((source) => sources.includes(source))) return false
    if (brands) {
      const ids = chatMentions.length ? chatMentions : ['none']
      const hit = brandMode === 'and' ? brands.every((id) => ids.includes(id as UrlChat['mentions'][number] | 'none')) : brands.some((id) => ids.includes(id as UrlChat['mentions'][number] | 'none'))
      if (!hit) return false
    }
    return true
  })
  const openChatIndex = chats.findIndex((chat) => chat.id === openChatId)
  const openChat = openChatIndex >= 0 ? chats[openChatIndex] : null
  const current = bucketChart(urlDates, url.series ?? [], resolution, locale)
  const earlier = bucketChart(urlDates, url.previous ?? [], resolution, locale)
  const labels = current.labels
  const firstSeen = url.firstSeenDays ?? seriesSeenDays(urlDates, url.series, 'first')
  const lastSeen = url.lastSeenDays ?? seriesSeenDays(urlDates, url.series, 'last')
  const updatedDays = url.updatedDays ?? lastSeen
  const modelRows = modelBreakdown(url, detail.data)
  const mentioned = marks.filter((mark) => url.mentions.includes(mark.id as typeof url.mentions[number]))

  const exportChats = (kind: 'csv' | 'xlsx' | 'json') => {
    if (!chats.length) {
      push({ title: t('exportEmptyTitle'), body: t('exportEmptyBody') })
      return
    }
    const header = [t('chat'), ...columns.map((id) => t(id === 'created' ? 'created' : id))]
    const body = chats.map((chat) => [fill(chat.title, brand.name), ...columns.map((id) => chatCell(chat, id, brand.name, t, marks, locale))])
    const table = [header, ...body]
    if (kind === 'csv') downloadFile('url-chats.csv', toCsv(table), 'text/csv')
    if (kind === 'xlsx') downloadFile('url-chats.xls', toExcelXml(table, 'Chats'), 'application/vnd.ms-excel')
    if (kind === 'json') downloadFile('url-chats.json', JSON.stringify(table, null, 2), 'application/json')
    push({ title: t('exportedTitle'), body: t('exportedBody', { count: chats.length }) })
  }

  return (
    <div className="min-h-full bg-white">
      <FilterRow />
      <div className="space-y-8 px-4 py-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[13px] text-zinc-500">{url.title} · {updatedLabel(url, updatedDays, t)}</p>
            <h2 className="mt-1 flex items-center gap-2 text-[22px] font-semibold">
              <Favicon host={url.host} className="h-7 w-7" />
              <span className="text-emerald-700">{url.path}</span>
            </h2>
            <p className="mt-1 text-[13px] text-zinc-500">
              {url.url ? <a href={url.url} target="_blank" rel="noreferrer" className="break-all text-blue-700 hover:underline">{url.url}</a> : `${url.host}${url.path === '/' ? '' : url.path}`}
              <button type="button" onClick={() => setContent(true)} className="ml-3 underline">{t('viewContent')}</button>
            </p>
          </div>
        </header>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label={t('urlType')} value={knownLabel(t, url.type)} tone={url.type === 'howTo' ? 'text-teal-600' : undefined} />
          <Stat label={t('domainType')} value={knownLabel(t, url.domainType)} tone="text-orange-500" />
          <Stat label={t('retrievals')} value={`${url.retrievals}`} delta={url.retrievalDelta} tip={t('retrievalsHelp')} open={tips === 'retrievals'} onTip={() => setTips(tips === 'retrievals' ? null : 'retrievals')} />
          <Stat label={t('citation')} value={`${url.citation}`} delta={url.citationDelta} tip={t('citationHelp')} open={tips === 'citation'} onTip={() => setTips(tips === 'citation' ? null : 'citation')} />
          <Stat label={t('promptsCount')} value={String(promptRows.length)} delta={promptRows.length} tip={t('promptsHelp')} open={tips === 'prompts'} onTip={() => setTips(tips === 'prompts' ? null : 'prompts')} />
          <Stat label={t('firstSeen')} value={daysLabel(t, firstSeen)} tip={t('firstSeenHelp')} open={tips === 'first'} onTip={() => setTips(tips === 'first' ? null : 'first')} />
        </div>
        <p className="text-[13px] text-zinc-500">{t('lastSeen')}: <span className="font-medium text-zinc-800">{daysLabel(t, lastSeen)}</span></p>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-nuw-line p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="inline-flex items-center gap-1 font-medium">{t('retrievals')} <Info className="h-3.5 w-3.5 text-zinc-400" /></h3>
                <p className="text-[12px] text-zinc-500">{t('retrievalsHelp')}</p>
              </div>
              <Resolution value={resolution} onChange={setResolution} />
            </div>
            <RetrievalLines
              labels={labels}
              lines={[{ id: url.id, label: t('retrievals'), color: '#E85D0C', values: current.values, previous: earlier.values }]}
            />
            <PeriodLegend />
          </section>
          <section className="rounded-2xl border border-nuw-line p-4">
            <h3 className="inline-flex items-center gap-1 font-medium">{t('byModel')} <Info className="h-3.5 w-3.5 text-zinc-400" /></h3>
            <p className="text-[12px] text-zinc-500">{t('byModelHelp')}</p>
            {modelRows.length > 0 ? (
              <ModelBars rows={modelRows.map((model) => ({ id: model.id, label: knownLabel(t, model.id), current: model.current, previous: model.previous }))} />
            ) : (
              <p className="py-8 text-[13px] text-zinc-500">{url.models.length ? url.models.map((model) => knownLabel(t, model.id)).join(', ') : t('noModels')}</p>
            )}
            <PeriodLegend />
          </section>
        </div>

        <section>
          <h3 className="font-semibold">{t('prompts')}</h3>
          <p className="text-[13px] text-zinc-500">{t('promptsSectionHelp')}</p>
          <label className="mt-3 flex h-8 max-w-sm items-center gap-2 rounded-lg border border-nuw-line px-2">
            <Search className="h-3.5 w-3.5 text-zinc-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('search')} className="w-full bg-transparent outline-none" />
          </label>
          {prompts.length === 0 ? (
            <p className="py-8 text-[13px] text-zinc-500">{query ? t('noSearchBody') : t('noPrompts')}</p>
          ) : (
            <table className="mt-3 w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-nuw-line text-[12px] text-zinc-500">
                  <th className="px-2 py-2 font-medium">{t('prompts')}</th>
                  <th className="px-2 py-2 font-medium">{t('topic')}</th>
                  <th className="px-2 py-2 font-medium">{t('retrieved')}</th>
                  <th className="px-2 py-2 font-medium">{t('citation')}</th>
                </tr>
              </thead>
              <tbody>
                {prompts.map((item) => (
                  <tr key={item.id} className="border-b border-nuw-line">
                    <td className="px-2 py-3">{fill(item.text ?? '', brand.name)}</td>
                    <td className="px-2 py-3 text-zinc-500">{item.topic ? knownLabel(t, item.topic) : 'N/A'}</td>
                    <td className="px-2 py-3 tabular-nums">{item.retrieved}</td>
                    <td className="px-2 py-3 tabular-nums">{item.citation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section>
          <h3 className="font-semibold">{t('brandsMentioned', { title: url.title })}</h3>
          <p className="text-[13px] text-zinc-500">{t('brandsHelp')}</p>
          {mentioned.length === 0 ? <p className="py-6 text-[13px] text-zinc-500">{t('noBrandsOnPage', { brand: brand.name })}</p> : (
            <table className="mt-3 w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-nuw-line text-[12px] text-zinc-500">
                  <th className="px-2 py-2">{t('brands')}</th>
                  <th className="px-2 py-2">{t('position')}</th>
                  <th className="px-2 py-2">{t('frequency')}</th>
                </tr>
              </thead>
              <tbody>
                {mentioned.map((mark, index) => (
                  <tr key={mark.id} className="border-b border-nuw-line">
                    <td className="px-2 py-3"><span className="inline-flex items-center gap-2"><BrandMark initials={mark.initials} color={mark.color} size={16} />{mark.name}</span></td>
                    <td className="px-2 py-3">{index + 1}</td>
                    <td className="px-2 py-3">1</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold">{t('chats')}</h3>
              <p className="text-[13px] text-zinc-500">{t('chatsHelp')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <MultiMenu label={brands ? t('brandsSelected', { count: brands.length }) : t('allBrands')} options={[{ id: 'none', label: t('noBrand') }, ...marks.map((mark) => ({ id: mark.id, label: mark.id === 'you' ? `${mark.name} ${t('you')}` : mark.name }))]} selected={brands} onChange={setBrands} mode={brandMode} onMode={setBrandMode} searchLabel={t('searchBrands')} empty={t('noBrandMatch')} />
              <MultiMenu label={features ? t('typesSelected', { count: features.length }) : t('allFeatures')} options={[{ id: 'shopping', label: t('shopping') }, { id: 'web', label: t('web') }, { id: 'links', label: t('links') }, { id: 'none', label: t('noFeatures') }]} selected={features} onChange={setFeatures} mode={brandMode} onMode={setBrandMode} searchLabel={t('search')} empty={t('noTypeMatch')} />
              <MultiMenu label={sources ? t('typesSelected', { count: sources.length }) : t('allSources')} options={Array.from(new Set(chats.flatMap((chat) => chat.sources))).map((host) => ({ id: host, label: host }))} selected={sources} onChange={setSources} searchLabel={t('searchSources')} empty={t('noSourceMatch')} />
              <Menu align="right" panelClassName="w-52" trigger={() => <button type="button" aria-label={t('columns')} className="grid h-8 w-8 place-items-center rounded-lg border border-nuw-line">☰</button>}>
                <p className="px-2 py-1 text-[11px] text-zinc-400">{t('fixedColumns')}</p>
                <label className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-zinc-400"><input type="checkbox" checked disabled /> {t('chat')}</label>
                <p className="px-2 py-1 text-[11px] text-zinc-400">{t('activeColumns')}</p>
                {chatCols.map((id) => (
                  <label key={id} className="flex items-center gap-2 px-2 py-1.5 text-[13px]">
                    <input type="checkbox" checked={columns.includes(id)} onChange={() => setColumns((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} />
                    {t(id)}
                  </label>
                ))}
                <button type="button" onClick={() => setColumns(chatCols)} className="w-full rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100">{t('resetColumns')}</button>
              </Menu>
              <button type="button" aria-label={t('copy')} onClick={async () => { await navigator.clipboard.writeText(chats.map((chat) => fill(chat.title, brand.name)).join('\n')); setCopied(true); push({ title: t('copiedTitle'), body: t('copiedBody', { count: chats.length }) }) }} className="grid h-8 w-8 place-items-center rounded-lg border border-nuw-line"><Copy className="h-3.5 w-3.5" /></button>
              <Menu align="right" panelClassName="w-36" trigger={() => <button type="button" aria-label={t('exportFormat')} className="grid h-8 w-8 place-items-center rounded-lg border border-nuw-line"><Download className="h-3.5 w-3.5" /></button>}>
                {(['csv', 'xlsx', 'json'] as const).map((kind) => (
                  <MenuItem key={kind} onSelect={() => exportChats(kind)}>{kind.toUpperCase()}</MenuItem>
                ))}
              </Menu>
            </div>
          </div>
          {copied ? <p className="mt-2 text-[12px] text-zinc-500">{t('copiedBody', { count: chats.length })}</p> : null}
          {chats.length === 0 ? <p className="py-8 text-[13px] text-zinc-500">{t('noChats')}</p> : (
            <div className="mt-3 overflow-auto">
              <table className="w-max min-w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-nuw-line text-[12px] text-zinc-500">
                    <th className="min-w-[320px] px-2 py-2">{t('chat')}</th>
                    {columns.map((id) => <th key={id} className="px-2 py-2">{t(id)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {chats.map((chat, index) => (
                    <tr
                      key={`${chat.id}-${index}`}
                      tabIndex={0}
                      className="cursor-pointer border-b border-nuw-line align-top hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-900"
                      onClick={() => setOpenChatId(chat.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setOpenChatId(chat.id)
                        }
                      }}
                    >
                      <td className="px-2 py-3">
                        <p>{fill(chat.title, brand.name)}</p>
                        <p className="text-[12px] text-zinc-500">{fill(chat.snippet, brand.name)}</p>
                      </td>
                      {columns.map((id) => (
                        <td key={id} className="whitespace-nowrap px-2 py-3">
                          {id === 'mentions' ? <span className="inline-flex gap-1">{(chat.mentions ?? []).map((id) => { const mark = marks.find((item) => item.id === id); return mark ? <BrandMark key={id} initials={mark.initials} color={mark.color} size={16} /> : null })}</span> : null}
                          {id === 'sources' ? <span className="inline-flex gap-1">{(chat.sources ?? []).slice(0, 3).map((host) => <Favicon key={host} host={host} />)}{(chat.sources ?? []).length > 3 ? <span className="text-zinc-400">+{(chat.sources ?? []).length - 3}</span> : null}</span> : null}
                          {id === 'links' ? (chat.links ?? 0) : null}
                          {id === 'features' ? (chat.features ?? []).map((feature) => knownLabel(t, feature)).join(', ') : null}
                          {id === 'position' ? <ChatPositions chat={chat} marks={marks} /> : null}
                          {id === 'created' ? createdPhrase(chat, t, locale) : null}
                          {id === 'citations' ? 'N/A' : null}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {openChat ? (
            <ChatDetail
              chat={sourceChatRecord(openChat, brand.name, brand.id)}
              onClose={() => setOpenChatId(null)}
              onPrev={openChatIndex > 0 ? () => setOpenChatId(chats[openChatIndex - 1].id) : undefined}
              onNext={openChatIndex < chats.length - 1 ? () => setOpenChatId(chats[openChatIndex + 1].id) : undefined}
            />
          ) : null}
        </section>
      </div>
      <Modal open={content} title={url.title} onClose={() => setContent(false)} wide>
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[15px] font-medium">{url.title}</h2>
            <button type="button" onClick={() => setContent(false)} aria-label={t('close')} className="text-zinc-400">×</button>
          </div>
          <p className="mt-4 text-[13px] text-sky-700">{snapshot.kicker}</p>
          {snapshot.lines.length === 0 ? (
            <p className="mt-4 text-[15px] leading-7 text-zinc-700">{detail.data?.messages?.[0]?.text ?? t('snapshotMissing')}</p>
          ) : snapshot.lines.map((line) => (
            <p key={line} className="mt-4 text-[15px] leading-7 text-zinc-800">{line}</p>
          ))}
          {snapshot.heading ? <h3 className="mt-6 text-2xl font-semibold">{snapshot.heading}</h3> : null}
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={() => setContent(false)} className="h-9 rounded-lg bg-nuw-button px-4 text-[13px] text-white">{t('close')}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function knownLabel(t: { (key: string): string; has: (key: string) => boolean }, key: string) {
  return t.has(key) ? t(key) : key
}

function daysLabel(t: (key: string, values?: Record<string, string | number>) => string, count: number | null | undefined) {
  if (count == null) return t('notInResponse')
  return count === 0 ? t('today') : t('daysAgo', { count })
}

function createdPhrase(chat: { createdAt?: string | null }, t: (key: string, values?: Record<string, string | number>) => string, locale: string) {
  const stamp = chat.createdAt?.trim() ?? ''
  if (!stamp) return t('dateMissing')
  if (isBrowserToday(stamp)) return t('today')
  const gap = daysBeforeBrowserToday(stamp)
  if (gap != null && gap > 0) return t('daysAgo', { count: gap })
  const key = runCalendarKey(stamp)
  return key ? formatChartDate(key, locale) : t('dateMissing')
}

function modelBreakdown(url: LiveSourceUrl, detail: { chats?: UrlChat[]; pages?: unknown[] } | null | undefined) {
  if (url.modelCounts) return url.models
  const fromPages = modelsFromPages(url, detail?.pages)
  if (fromPages.length) return fromPages
  // A homepage shares its id with the domain, so that payload's chats cover every page on the host.
  if (detail && Array.isArray(detail.pages)) return []
  return modelsFromChats(detail?.chats)
}

function modelsFromPages(url: LiveSourceUrl, pages: unknown[] | undefined) {
  if (!pages) return []
  const rows = pages.filter((page): page is { id?: string; path?: string; retrievals?: number; models?: unknown } => Boolean(page) && typeof page === 'object')
  const match = rows.find((page) => page.id === url.id && page.retrievals === url.retrievals)
    ?? rows.find((page) => page.path === url.path && page.retrievals === url.retrievals)
  if (!match || !Array.isArray(match.models)) return []
  return match.models.flatMap((model) => {
    if (!model || typeof model !== 'object') return []
    const row = model as { id?: string; current?: number; previous?: number }
    if (!row.id || typeof row.current !== 'number') return []
    return [{ id: row.id, current: row.current, previous: row.previous ?? 0 }]
  })
}

function modelsFromChats(chats: UrlChat[] | undefined) {
  const current = new Map<string, number>()
  for (const chat of chats ?? []) {
    for (const model of chat.models ?? []) {
      if (!model) continue
      current.set(model, (current.get(model) ?? 0) + 1)
    }
  }
  return [...current.entries()].map(([id, count]) => ({ id, current: count, previous: 0 }))
}

function updatedLabel(url: LiveSourceUrl, days: number | null, t: (key: string, values?: Record<string, string | number>) => string) {
  if (url.updatedHours != null) return t('updatedAgo', { count: url.updatedHours, unit: t('hours') })
  if (days == null) return t('updatedMissing')
  if (days === 0) return t('updatedToday')
  return t('updatedAgo', { count: days, unit: t('days') })
}

function fill(text: string, brand: string) {
  return text.replaceAll('{brand}', brand)
}

function chatCell(chat: UrlChat, id: ChatCol, brand: string, t: { (key: string, values?: Record<string, string | number>): string; has: (key: string) => boolean }, marks: { id: string; name: string; color: string; initials: string }[], locale: string) {
  if (id === 'mentions') return (chat.mentions ?? []).join(', ')
  if (id === 'sources') return (chat.sources ?? []).join(', ')
  if (id === 'links') return String(chat.links ?? 0)
  if (id === 'features') return (chat.features ?? []).map((feature) => knownLabel(t, feature)).join(', ')
  if (id === 'position') return positionText(chat, marks)
  if (id === 'created') return createdPhrase(chat, t, locale)
  return ''
}

function Stat({ label, value, delta, tone, tip, open, onTip }: { label: string; value: string; delta?: number | null; tone?: string; tip?: string; open?: boolean; onTip?: () => void }) {
  return (
    <div className="relative">
      <p className="inline-flex items-center gap-1 text-[12px] text-zinc-500">
        {label}
        {onTip ? <button type="button" aria-label={label} onClick={onTip}><Info className="h-3 w-3" /></button> : null}
      </p>
      <p className={cn('mt-1 text-[14px] font-medium', tone)}>
        {value}{delta != null ? <span className={cn('ml-1', delta < 0 ? 'text-rose-500' : 'text-emerald-600')}>{delta > 0 ? `+${delta}` : delta}</span> : null}
      </p>
      {open && tip ? <p className="absolute z-10 mt-1 w-56 rounded-xl bg-zinc-950 p-3 text-[12px] leading-5 text-white shadow-menu">{tip}</p> : null}
    </div>
  )
}

function PeriodLegend() {
  const t = useTranslations('urls.page')
  return (
    <div className="mt-2 flex gap-3 text-[12px] text-zinc-500">
      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#E85D0C]" />{t('currentPeriod')}</span>
      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-zinc-300" />{t('previousPeriod')}</span>
    </div>
  )
}

function Resolution({ value, onChange }: { value: 'day' | 'week' | 'month'; onChange: (value: 'day' | 'week' | 'month') => void }) {
  const t = useTranslations('urls.page')
  return (
    <div className="inline-flex rounded-lg border border-nuw-line p-0.5 text-[12px]">
      {(['day', 'week', 'month'] as const).map((id) => (
        <button key={id} type="button" onClick={() => onChange(id)} className={cn('h-7 rounded-md px-2', value === id ? 'bg-zinc-100 font-medium' : 'text-zinc-500')}>{t(id)}</button>
      ))}
    </div>
  )
}

function MultiMenu({
  label,
  options,
  selected,
  onChange,
  mode,
  onMode,
  searchLabel,
  empty,
}: {
  label: string
  options: { id: string; label: string }[]
  selected: string[] | null
  onChange: (ids: string[] | null) => void
  mode?: 'or' | 'and'
  onMode?: (mode: 'or' | 'and') => void
  searchLabel: string
  empty: string
}) {
  const t = useTranslations('urls.page')
  const [query, setQuery] = useState('')
  const active = selected ?? options.map((option) => option.id)
  const shown = options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
  const picked = useMemo(() => active, [active])
  return (
    <Menu panelClassName="w-64" trigger={() => <button type="button" className="inline-flex h-8 items-center gap-1 rounded-lg border border-nuw-line px-2 text-[13px]">{label} <ChevronDown className="h-3.5 w-3.5 text-zinc-400" /></button>}>
      <label className="mb-1 flex items-center gap-2 px-2"><Search className="h-3.5 w-3.5 text-zinc-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchLabel} className="w-full bg-transparent text-[13px] outline-none" /></label>
      <button type="button" onClick={() => onChange(null)} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-50">{t('all')} {selected === null ? <Check className="h-3.5 w-3.5" /> : null}</button>
      {onMode && mode ? (
        <div className="my-1 grid grid-cols-2 gap-1 px-2">
          {(['or', 'and'] as const).map((id) => (
            <button key={id} type="button" onClick={() => onMode(id)} className={cn('h-8 rounded-lg text-[13px]', mode === id ? 'bg-white shadow-sm' : 'bg-zinc-100 text-zinc-500')}>{t(id)}</button>
          ))}
        </div>
      ) : null}
      {shown.length === 0 ? <p className="px-2 py-2 text-[13px] text-zinc-500">{empty}</p> : shown.map((option) => (
        <button key={option.id} type="button" onClick={() => {
          const next = picked.includes(option.id) ? picked.filter((id) => id !== option.id) : [...picked, option.id]
          onChange(next.length === options.length ? null : next)
        }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-zinc-50">
          <span className={cn('grid h-4 w-4 place-items-center rounded border text-[10px] text-white', picked.includes(option.id) ? 'border-sky-500 bg-sky-500' : 'border-zinc-300')}>{picked.includes(option.id) ? '✓' : ''}</span>
          {option.label}
        </button>
      ))}
    </Menu>
  )
}
