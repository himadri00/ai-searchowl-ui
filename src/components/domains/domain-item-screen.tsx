'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Check, ChevronDown, Copy, Download, Info, Search } from 'lucide-react'
import { type DomainChat, type DomainPage, type DomainRecord } from '@/data/domains'
import { useV2 } from '@/lib/v2'
import { ApiNote } from '@/components/data/api-note'
import { domainColors, moverTabs, typeColors, type MoverTab, type UrlTypeId } from '@/data/urls'
import { RetrievalLines } from '@/components/urls/charts'
import { FilterRow } from '@/components/prompts/filter-row'
import { usePrompts } from '@/components/prompts/prompts-context'
import { downloadFile, toCsv, toExcelXml } from '@/components/perception/export-data'
import { ChatPositions, positionText } from '@/components/sources/chat-positions'
import { ChatDetail, sourceChatRecord } from '@/components/overview/chat-detail'
import { BrandMark, Favicon } from '@/components/shell/brand-mark'
import { useBrand } from '@/components/workspace/workspace-context'
import { Menu, MenuItem, useToast } from '@/components/ui/overlay'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/cn'
import { daysBeforeBrowserToday, formatChartDate, isBrowserToday, runCalendarKey, bucketChart } from '@/lib/format'

type Tab = 'urls' | 'chats'
type ChatCol = 'mentions' | 'sources' | 'links' | 'features' | 'position' | 'created'
const chatCols: ChatCol[] = ['mentions', 'sources', 'links', 'features', 'position', 'created']

export function DomainItemScreen({ id }: { id: string }) {
  const t = useTranslations('domains.page')
  const locale = useLocale()
  const brand = useBrand()
  const { push } = useToast()
  const { competitors } = usePrompts()
  const catalog = useV2<{ rows: DomainRecord[]; dates: string[] }>('sources', { kind: 'domain', limit: 100 })
  const detail = useV2<{ pages: DomainPage[]; chats: DomainChat[]; dates?: string[] }>(`sources/${encodeURIComponent(id)}`)
  const domain = catalog.data?.rows.find((item) => item.id === id) ?? null
  const domainDates = catalog.data?.dates ?? []
  const [tab, setTab] = useState<Tab>('urls')
  const [resolution, setResolution] = useState<'day' | 'week' | 'month'>('day')
  const [mover, setMover] = useState<MoverTab>('top')
  const [tips, setTips] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [features, setFeatures] = useState<string[] | null>(null)
  const [brands, setBrands] = useState<string[] | null>(null)
  const [columns, setColumns] = useState<ChatCol[]>(chatCols)
  const [copied, setCopied] = useState(false)
  const [openChatId, setOpenChatId] = useState<string | null>(null)

  if (catalog.loading || detail.loading) {
    return <div className="px-6 py-10"><ApiNote loading error={null} /></div>
  }

  if (!domain) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-6">
        <h2 className="text-2xl font-semibold">{t('missingTitle')}</h2>
        <p className="mt-3 text-[15px] leading-6 text-zinc-600">{catalog.error ?? detail.error ?? t('missingBody')}</p>
        <Link href="/prompts/domains" className="mt-6 w-fit rounded-lg bg-nuw-button px-4 py-2 text-sm text-white">{t('backToDomains')}</Link>
      </div>
    )
  }

  const pages = detail.data?.pages ?? []
  const chats = (detail.data?.chats ?? []).filter((chat) => {
    if (features && !chat.features.some((feature) => features.includes(feature))) return false
    if (brands) {
      const ids = chat.mentions.length ? chat.mentions : ['none']
      if (!brands.some((id) => ids.includes(id))) return false
    }
    return true
  })
  const openChatIndex = chats.findIndex((chat) => chat.id === openChatId)
  const openChat = openChatIndex >= 0 ? chats[openChatIndex] : null
  const shownPages = pages.filter((page) => `${page.title} ${page.path}`.toLowerCase().includes(query.trim().toLowerCase()))
  const chartDates = detail.data?.dates?.length ? detail.data.dates : domainDates
  const daily = chartDates.map((_, index) => pages.reduce((sum, page) => sum + (Number(page.series?.[index]) || 0), 0))
  const pageSeries = pages.some((page) => page.series?.length === chartDates.length)
  const dayValues = pageSeries ? daily : (domain.series?.length === chartDates.length ? domain.series : daily)
  const previousDaily = domain.previous?.length === dayValues.length ? domain.previous : dayValues.map(() => 0)
  const current = bucketChart(chartDates, dayValues, resolution, locale)
  const earlier = bucketChart(chartDates, previousDaily, resolution, locale)
  const labels = current.labels
  const lines = current.values.length === 0 ? [] : [{
    id: domain.id,
    label: domain.host,
    color: domain.color ?? '#E85D0C',
    values: current.values,
    previous: earlier.values,
  }]
  const moverMax = Math.max(...pages.map((page) => page.retrievals), 1)
  const typeTotal = pages.reduce((sum, page) => sum + page.retrievals, 0) || 1
  const typeCounts = new Map<string, number>()
  pages.forEach((page) => typeCounts.set(page.type, (typeCounts.get(page.type) ?? 0) + page.retrievals))
  const types = {
    total: pages.reduce((sum, page) => sum + page.retrievals, 0),
    shares: [...typeCounts.entries()].map(([typeId, value]) => ({ id: typeId as UrlTypeId, share: Math.max(1, Math.round((value / typeTotal) * 100)) })),
  }
  const marks = [
    { id: 'you', name: brand.name, color: brand.color, initials: brand.initials },
    ...competitors,
  ]

  const exportChats = (kind: 'csv' | 'xlsx' | 'json') => {
    if (!chats.length) {
      push({ title: t('exportEmptyTitle'), body: t('exportEmptyBody') })
      return
    }
    const header = [t('chat'), ...columns.map((id) => t(id))]
    const body = chats.map((chat) => [fill(chat.title, brand.name), ...columns.map((id) => chatCell(chat, id, t, marks, locale))])
    const table = [header, ...body]
    if (kind === 'csv') downloadFile('domain-chats.csv', toCsv(table), 'text/csv')
    if (kind === 'xlsx') downloadFile('domain-chats.xls', toExcelXml(table, 'Chats'), 'application/vnd.ms-excel')
    if (kind === 'json') downloadFile('domain-chats.json', JSON.stringify(table, null, 2), 'application/json')
    push({ title: t('exportedTitle'), body: t('exportedBody', { count: chats.length }) })
  }

  return (
    <div className="min-h-full bg-white">
      <FilterRow />
      <div className="space-y-8 px-4 py-5">
        <div className="flex gap-4 border-b border-nuw-line text-[14px]">
          {(['urls', 'chats'] as const).map((id) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn('border-b-2 pb-2', tab === id ? 'border-zinc-900 font-medium' : 'border-transparent text-zinc-400')}>
              {t(id === 'urls' ? 'urlsTab' : 'chatsTab')}
            </button>
          ))}
        </div>

        <header className="flex flex-wrap items-center gap-3">
          <Favicon host={domain.host} className="h-10 w-10" />
          <div>
            <h2 className="text-[22px] font-semibold">{domain.host}</h2>
            <a href={`https://${domain.host}`} target="_blank" rel="noreferrer" className="text-[13px] text-zinc-500 underline">{t('visitSite')}</a>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label={t('domainType')} value={t(domain.domainType)} tone={domain.domainType === 'corporate' ? 'text-orange-500' : undefined} tip={t('domainTypeHelp')} open={tips === 'type'} onTip={() => setTips(tips === 'type' ? null : 'type')} />
          <Stat label={t('retrievals')} value={String(domain.retrievals)} tip={t('retrievalsHelp')} open={tips === 'retrievals'} onTip={() => setTips(tips === 'retrievals' ? null : 'retrievals')} />
          <Stat label={t('usedAsSource')} value={domain.usedAsSource == null ? 'N/A' : `${domain.usedAsSource}%`} tip={t('usedHelp')} open={tips === 'used'} onTip={() => setTips(tips === 'used' ? null : 'used')} />
          <Stat label={t('cited')} value={`${domain.headerCited ?? domain.cited}%`} tip={t('citedHelp')} open={tips === 'cited'} onTip={() => setTips(tips === 'cited' ? null : 'cited')} />
          <Stat label={t('retrievalRate')} value={String(domain.retrievalRate)} tip={t('retrievalRateHelp')} open={tips === 'rate'} onTip={() => setTips(tips === 'rate' ? null : 'rate')} />
          <Stat label={t('citationRate')} value={String(domain.citationRate)} tip={t('citationRateHelp')} open={tips === 'citation'} onTip={() => setTips(tips === 'citation' ? null : 'citation')} />
        </div>

        {tab === 'urls' ? (
          <>
            <section className="rounded-2xl border border-nuw-line p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium">{t('chartTitle')}</h3>
                  <p className="text-[12px] text-zinc-500">{t('overviewHelp')}</p>
                  {resolution !== 'day' ? <p className="text-[12px] text-zinc-500">{t(resolution === 'week' ? 'weekNote' : 'monthNote')}</p> : null}
                </div>
                <Resolution value={resolution} onChange={setResolution} />
              </div>
              {lines.length === 0 ? <p className="py-8 text-[13px] text-zinc-500">{t('noPages')}</p> : <RetrievalLines labels={labels} lines={lines} />}
              <div className="mt-3 flex flex-wrap gap-3 text-[12px]">
                {lines.map((line) => (
                  <span key={line.id} className="inline-flex items-center gap-1.5 text-zinc-600">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: line.color }} />
                    <span>{line.label}</span>
                  </span>
                ))}
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-nuw-line p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-semibold">{t('urlMovers')}</h3>
                  <div className="flex gap-1 text-[13px]">
                    {moverTabs.map((id) => (
                      <button key={id} type="button" onClick={() => setMover(id)} className={cn('rounded-md px-2 py-1', mover === id ? 'font-medium' : 'text-zinc-400')}>{t(id)}</button>
                    ))}
                  </div>
                  <span className="ml-auto text-[12px] text-zinc-400">{t('retrievals')}</span>
                </div>
                <p className="mt-1 text-[13px] text-zinc-500">{t('urlMoversHelp')}</p>
                {mover === 'losing' || mover === 'new' ? <p className="py-6 text-[13px] text-zinc-500">{t('moversEmpty', { tab: t(mover) })}</p> : (
                  <ul className="mt-3 space-y-1.5">
                    {pages.map((page) => (
                      <li key={page.id} className="relative flex items-center gap-2 px-1 py-1" title={`${domain.host}${page.path}`}>
                        <span className="absolute inset-y-0 left-0 rounded-lg bg-zinc-100" style={{ width: `${Math.max(12, (page.retrievals / moverMax) * 100)}%` }} />
                        <span className="relative flex w-full items-center gap-2">
                          <Favicon host={domain.host} />
                          <span className="truncate">{page.path}</span>
                          <span className="ml-auto tabular-nums">{page.retrievals}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-2xl border border-nuw-line p-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{t('urlTypes')}</h3>
                  <span className="ml-auto text-[12px] text-zinc-400">{t('totalRetrievals', { count: String(types.total) })}</span>
                </div>
                <ul className="mt-3 space-y-2">
                  {types.shares.map((type) => (
                    <li key={type.id} className="grid grid-cols-[130px_1fr_40px] items-center gap-2 text-[13px]">
                      <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: typeColors[type.id] }} />{t(type.id)}</span>
                      <span className="h-7 overflow-hidden rounded-lg bg-zinc-100"><span className="block h-full rounded-lg bg-zinc-200" style={{ width: `${type.share}%` }} /></span>
                      <span className="text-right text-zinc-500">{type.share}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section>
              <h3 className="font-semibold">{t('pagesTitle')}</h3>
              <p className="text-[13px] text-zinc-500">{t('pagesHelp', { brand: brand.name })}</p>
              <label className="mt-3 flex h-8 max-w-sm items-center gap-2 rounded-lg border border-nuw-line px-2">
                <Search className="h-3.5 w-3.5 text-zinc-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('search')} className="w-full bg-transparent outline-none" />
              </label>
              {shownPages.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <h3 className="text-[15px] font-semibold">{query ? t('noSearchTitle', { query }) : t('noPages')}</h3>
                  <p className="mt-2 text-[13px] text-zinc-500">{query ? t('noSearchBody') : t('noPagesBody')}</p>
                  {query ? <button type="button" onClick={() => setQuery('')} className="mt-4 h-9 rounded-lg bg-nuw-button px-3 text-[13px] text-white">{t('clearSearch')}</button> : null}
                </div>
              ) : (
                <div className="mt-3 overflow-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-nuw-line text-[12px] text-zinc-500">
                        <th className="px-2 py-2">{t('url')}</th>
                        <th className="px-2 py-2">{t('urlType')}</th>
                        <th className="px-2 py-2">{t('domainType')}</th>
                        <th className="px-2 py-2">{t('mentions')}</th>
                        <th className="px-2 py-2">{t('retrievals')}</th>
                        <th className="px-2 py-2">{t('citation')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shownPages.map((page) => <PageRow key={page.id} page={page} host={domain.host} domainType={domain.domainType} marks={marks} />)}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : (
          <section>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold">{t('chats')}</h3>
                <p className="text-[13px] text-zinc-500">{t('chatsHelp')}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Menu panelClassName="w-64" trigger={() => <button type="button" className="inline-flex h-8 items-center gap-1 rounded-lg border border-nuw-line px-2 text-[13px]">{brands ? t('brandsSelected', { count: brands.length }) : t('allBrands')} <ChevronDown className="h-3.5 w-3.5" /></button>}>
                  <button type="button" onClick={() => setBrands(null)} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px]">{t('allBrands')} {brands === null ? <Check className="h-3.5 w-3.5" /> : null}</button>
                  <button type="button" onClick={() => setBrands(['none'])} className="flex w-full rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-zinc-50">{t('noBrand')}</button>
                  {marks.map((mark) => (
                    <button key={mark.id} type="button" onClick={() => setBrands([mark.id])} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-zinc-50">
                      <BrandMark initials={mark.initials} color={mark.color} size={16} />
                      {mark.name}
                    </button>
                  ))}
                </Menu>
                <Menu panelClassName="w-52" trigger={() => <button type="button" className="inline-flex h-8 items-center gap-1 rounded-lg border border-nuw-line px-2 text-[13px]">{features ? t('typesSelected', { count: features.length }) : t('allFeatures')} <ChevronDown className="h-3.5 w-3.5" /></button>}>
                  <button type="button" onClick={() => setFeatures(null)} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px]">{t('allFeatures')} {features === null ? <Check className="h-3.5 w-3.5" /> : null}</button>
                  {(['shopping', 'web', 'links', 'none'] as const).map((id) => (
                    <button key={id} type="button" onClick={() => setFeatures([id])} className="block w-full rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-zinc-50">{t(id === 'none' ? 'noFeatures' : id === 'web' ? 'web' : id === 'links' ? 'links' : 'shopping')}</button>
                  ))}
                </Menu>
                <Menu align="right" panelClassName="w-52" trigger={() => <button type="button" aria-label={t('columns')} className="grid h-8 w-8 place-items-center rounded-lg border border-nuw-line">☰</button>}>
                  {chatCols.map((id) => (
                    <label key={id} className="flex items-center gap-2 px-2 py-1.5 text-[13px]">
                      <input type="checkbox" checked={columns.includes(id)} onChange={() => setColumns((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} />
                      {t(id)}
                    </label>
                  ))}
                </Menu>
                <button type="button" aria-label={t('copy')} onClick={async () => { await navigator.clipboard.writeText(chats.map((chat) => fill(chat.title, brand.name)).join('\n')); setCopied(true); push({ title: t('copiedTitle'), body: t('copiedBody', { count: chats.length }) }) }} className="grid h-8 w-8 place-items-center rounded-lg border border-nuw-line"><Copy className="h-3.5 w-3.5" /></button>
                <Menu align="right" panelClassName="w-36" trigger={() => <button type="button" aria-label={t('exportFormat')} className="grid h-8 w-8 place-items-center rounded-lg border border-nuw-line"><Download className="h-3.5 w-3.5" /></button>}>
                  {(['csv', 'xlsx', 'json'] as const).map((kind) => <MenuItem key={kind} onSelect={() => exportChats(kind)}>{kind.toUpperCase()}</MenuItem>)}
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
                            {id === 'mentions' ? <span className="inline-flex gap-1">{chat.mentions.map((id) => { const mark = marks.find((item) => item.id === id); return mark ? <BrandMark key={id} initials={mark.initials} color={mark.color} size={16} /> : null })}</span> : null}
                            {id === 'sources' ? <span className="inline-flex gap-1">{chat.sources.slice(0, 3).map((host) => <Favicon key={host} host={host} />)}</span> : null}
                            {id === 'links' ? (chat.links ?? 0) : null}
                            {id === 'features' ? chat.features.map((feature) => t(feature === 'none' ? 'noFeatures' : feature === 'web' ? 'web' : feature === 'links' ? 'links' : 'shopping')).join(', ') : null}
                            {id === 'position' ? <ChatPositions chat={chat} marks={marks} /> : null}
                            {id === 'created' ? createdPhrase(chat, t, locale) : null}
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
        )}
      </div>
    </div>
  )
}

function PageRow({ page, host, domainType, marks }: { page: DomainPage; host: string; domainType: string; marks: { id: string; name: string; color: string; initials: string }[] }) {
  const t = useTranslations('domains.page')
  const body = (
    <>
      <Favicon host={host} />
      <span>
        <span className="block font-medium">{page.title}</span>
        <span className="text-[12px] text-zinc-400">{host}{page.path}</span>
      </span>
    </>
  )
  return (
    <tr className="border-b border-nuw-line">
      <td className="px-2 py-3">
        {page.urlId ? <Link href={`/prompts/urls/${page.urlId}`} className="flex items-start gap-2">{body}</Link> : <span className="flex items-start gap-2">{body}</span>}
      </td>
      <td className="px-2 py-3"><span className="rounded-md px-1.5 py-0.5 text-[12px] font-medium" style={{ color: typeColors[page.type], background: `${typeColors[page.type]}18` }}>{t(page.type as UrlTypeId)}</span></td>
      <td className="px-2 py-3 font-medium" style={{ color: domainColors[domainType as keyof typeof domainColors] }}>{t(domainType)}</td>
      <td className="px-2 py-3">
        <span className="inline-flex gap-1">
          {page.mentions.map((id) => {
            const mark = marks.find((item) => item.id === id)
            return mark ? <span key={id} title={mark.name}><BrandMark initials={mark.initials} color={mark.color} size={16} /></span> : null
          })}
        </span>
      </td>
      <td className="px-2 py-3 tabular-nums">{page.retrievals}{page.retrievalDelta != null && page.retrievalDelta !== 0 ? <span className={page.retrievalDelta > 0 ? 'text-emerald-600' : 'text-rose-500'}>{` ${page.retrievalDelta > 0 ? '+' : ''}${page.retrievalDelta}`}</span> : null}</td>
      <td className="px-2 py-3 tabular-nums">{page.citation}{page.citationDelta != null && page.citationDelta !== 0 ? <span className={page.citationDelta > 0 ? 'text-emerald-600' : 'text-rose-500'}>{` ${page.citationDelta > 0 ? '+' : ''}${page.citationDelta}`}</span> : null}</td>
    </tr>
  )
}

function fill(text: string, brand: string) {
  return text.replaceAll('{brand}', brand)
}

function chatCell(chat: DomainChat, id: ChatCol, t: (key: string, values?: Record<string, string | number>) => string, marks: { id: string; name: string; color: string; initials: string }[], locale: string) {
  if (id === 'mentions') return chat.mentions.join(', ')
  if (id === 'sources') return chat.sources.join(', ')
  if (id === 'links') return String(chat.links ?? 0)
  if (id === 'features') return chat.features.join(', ')
  if (id === 'position') return positionText(chat, marks)
  return createdPhrase(chat, t, locale)
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

function Stat({ label, value, tone, tip, open, onTip }: { label: string; value: string; tone?: string; tip?: string; open?: boolean; onTip?: () => void }) {
  return (
    <div className="relative">
      <p className="inline-flex items-center gap-1 text-[12px] text-zinc-500">
        {label}
        {onTip ? <button type="button" aria-label={label} onClick={onTip}><Info className="h-3 w-3" /></button> : null}
      </p>
      <p className={cn('mt-1 text-[14px] font-medium', tone)}>{value}</p>
      {open && tip ? <p className="absolute z-10 mt-1 w-56 rounded-xl bg-zinc-950 p-3 text-[12px] leading-5 text-white shadow-menu">{tip}</p> : null}
    </div>
  )
}

function Resolution({ value, onChange }: { value: 'day' | 'week' | 'month'; onChange: (value: 'day' | 'week' | 'month') => void }) {
  const t = useTranslations('domains.page')
  return (
    <div className="inline-flex rounded-lg border border-nuw-line p-0.5 text-[12px]">
      {(['day', 'week', 'month'] as const).map((id) => (
        <button key={id} type="button" onClick={() => onChange(id)} className={cn('h-7 rounded-md px-2', value === id ? 'bg-zinc-100 font-medium' : 'text-zinc-500')}>{t(id)}</button>
      ))}
    </div>
  )
}
