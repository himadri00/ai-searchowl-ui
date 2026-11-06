'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Check, ChevronDown, Download, Info, LineChart, Search, Settings } from 'lucide-react'
import { type DomainRecord } from '@/data/domains'
import { errorText, useV2, v2Send } from '@/lib/v2'
import { ApiNote } from '@/components/data/api-note'
import { domainColors, domainKinds, moverTabs, type DomainKind, type MoverTab } from '@/data/urls'
import { RetrievalLines } from '@/components/urls/charts'
import { FilterRow } from '@/components/prompts/filter-row'
import { filtersAreClear, usePrompts } from '@/components/prompts/prompts-context'
import { downloadFile, toCsv, toExcelXml } from '@/components/perception/export-data'
import { BrandMark, Favicon } from '@/components/shell/brand-mark'
import { useBrand } from '@/components/workspace/workspace-context'
import { Menu, MenuItem, useToast } from '@/components/ui/overlay'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/cn'
import { bucketChart } from '@/lib/format'

type ColId = 'type' | 'tags' | 'mentions' | 'retrievals' | 'retrieved' | 'cited' | 'retrievalRate' | 'citationRate' | 'gap' | 'citations' | 'share'
type Indicator = 'default' | 'indicators' | 'none'
type Resolution = 'day' | 'week' | 'month'
type Board = 'domains' | 'hosts'

const defaultCols: ColId[] = ['type', 'tags', 'mentions', 'retrievals', 'retrieved', 'cited', 'retrievalRate', 'citationRate', 'gap']
const extraCols: ColId[] = ['citations', 'share']
function compactCount(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return String(value)
}

function pageMatch(item: DomainRecord, filters: ReturnType<typeof usePrompts>['filters']) {
  if (filters.brandIds && !item.mentions.some((id) => filters.brandIds?.includes(id))) return false
  if (filters.models && !item.models.some((id) => filters.models?.includes(id))) return false
  if (filters.topics && !item.topics.some((id) => filters.topics?.includes(id))) return false
  if (filters.tags) {
    const tagged = filters.tagMode === 'and'
      ? filters.tags.every((tag) => item.promptTags.includes(tag))
      : filters.tags.some((tag) => item.promptTags.includes(tag))
    if (!tagged) return false
  }
  return true
}

export function DomainsScreen() {
  const t = useTranslations('domains.page')
  const locale = useLocale()
  const brand = useBrand()
  const { push } = useToast()
  const { filters, competitors, tags: tagChoices, tagName } = usePrompts()
  const tagLabel = (tag: string) => (t.has(tag) ? t(tag) : tagName(tag))
  const domainQuery = useV2<{ total: number; rows: DomainRecord[]; dates: string[]; promptsCreated: number; domainTypeShare: { id: DomainKind; share: number; retrievals: number }[] }>('sources', { kind: 'domain', limit: 100 })
  const hostQuery = useV2<{ total: number; rows: DomainRecord[] }>('sources', { kind: 'host', limit: 100 })
  const domains = domainQuery.data?.rows ?? []
  const hosts = hostQuery.data?.rows ?? []
  const domainDates = domainQuery.data?.dates ?? []
  const domainTypeShare = domainQuery.data?.domainTypeShare ?? []
  const promptsCreated = domainQuery.data?.promptsCreated ?? 0
  const [board, setBoard] = useState<Board>('domains')
  const [resolution, setResolution] = useState<Resolution>('day')
  const [mover, setMover] = useState<MoverTab>('top')
  const [moverHelp, setMoverHelp] = useState(false)
  const [hoverType, setHoverType] = useState<DomainKind | null>(null)
  const [query, setQuery] = useState('')
  const [gap, setGap] = useState(true)
  const [minCompetitors, setMinCompetitors] = useState(1)
  const [domainTypes, setDomainTypes] = useState<DomainKind[] | null>(['corporate', 'editorial'])
  const [mentionIds, setMentionIds] = useState<string[] | null>(null)
  const [mentionMode, setMentionMode] = useState<'or' | 'and'>('or')
  const [columns, setColumns] = useState<ColId[]>(defaultCols)
  const [indicators, setIndicators] = useState<Indicator>('default')
  const [sort, setSort] = useState<{ key: ColId | 'source'; dir: 'asc' | 'desc' } | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [tagFor, setTagFor] = useState<string | null>(null)
  const [extraTags, setExtraTags] = useState<Record<string, string[]>>({})
  const [mentionTip, setMentionTip] = useState(false)

  const marks = [
    { id: 'you', name: brand.name, color: brand.color, initials: brand.initials },
    ...competitors,
  ]
  const source = board === 'domains' ? domains : hosts

  const rows = useMemo(() => source.filter((item) => {
    if (!pageMatch(item, filters)) return false
    const competitorCount = item.mentions.filter((id) => id !== 'you').length
    if (gap && competitorCount < minCompetitors) return false
    const tags = [...item.promptTags, ...(extraTags[item.id] ?? [])]
    const text = `${item.host} ${tags.join(' ')}`.toLowerCase()
    if (query.trim() && !text.includes(query.trim().toLowerCase())) return false
    if (domainTypes && !domainTypes.includes(item.domainType)) return false
    if (mentionIds) {
      const hit = mentionMode === 'and'
        ? mentionIds.every((id) => item.mentions.includes(id as DomainRecord['mentions'][number]))
        : mentionIds.some((id) => item.mentions.includes(id as DomainRecord['mentions'][number]))
      if (!hit) return false
    }
    return true
  }), [domainTypes, extraTags, filters, gap, mentionIds, mentionMode, minCompetitors, query, source])

  const sorted = useMemo(() => {
    const copy = [...rows]
    if (!sort) return copy.sort((a, b) => b.listedRetrievals - a.listedRetrievals)
    const value = (item: DomainRecord) => {
      if (sort.key === 'source') return item.host
      if (sort.key === 'type') return t(item.domainType)
      if (sort.key === 'mentions') return item.mentions.length
      if (sort.key === 'retrievals') return item.listedRetrievals
      if (sort.key === 'retrieved') return item.retrieved
      if (sort.key === 'cited') return item.cited
      if (sort.key === 'retrievalRate') return item.retrievalRate
      if (sort.key === 'citationRate') return item.citationRate
      if (sort.key === 'gap') return item.gapScore
      if (sort.key === 'citations') return item.totalCitations
      if (sort.key === 'share') return item.citationShare
      return extraTags[item.id]?.length ?? 0
    }
    copy.sort((a, b) => {
      const left = value(a)
      const right = value(b)
      const order = typeof left === 'string' && typeof right === 'string' ? left.localeCompare(right) : Number(left) - Number(right)
      return sort.dir === 'asc' ? order : -order
    })
    return copy
  }, [extraTags, rows, sort, t])

  const visible = source.filter((item) => pageMatch(item, filters))
  const chartItems = visible.filter((item) => item.chart)
  const axis = bucketChart(domainDates, domainDates.map(() => 0), resolution, locale)
  const lines = chartItems.map((item) => ({
    id: item.id,
    label: item.host,
    color: item.color ?? '#14b8a6',
    values: bucketChart(domainDates, item.series ?? [], resolution, locale).values,
    previous: bucketChart(domainDates, item.previous ?? [], resolution, locale).values,
  }))
  const moverRows = visible.filter((item) => item.movers.includes(mover)).sort((a, b) => b.retrievals - a.retrievals)
  const moverMax = Math.max(...moverRows.map((item) => item.retrievals), 1)
  const listClear = !query && gap && minCompetitors === 1 && domainTypes?.length === 2 && mentionIds === null && filtersAreClear(filters)

  const hrefFor = (item: DomainRecord) => `/prompts/domains/${item.kind === 'host' ? item.parentId : item.id}`

  const exportRows = () => {
    const chosen = selected.length ? sorted.filter((item) => selected.includes(item.id)) : sorted
    if (!chosen.length) {
      push({ title: t('exportEmptyTitle'), body: t('exportEmptyBody') })
      return null
    }
    const header = [t('source'), ...columns.map((id) => t(colKey(id)))]
    const body = chosen.map((item) => [
      item.host,
      ...columns.map((id) => {
        if (id === 'type') return t(item.domainType)
        if (id === 'tags') return (extraTags[item.id] ?? []).map(tagLabel).join(', ')
        if (id === 'mentions') return item.mentions.map((id) => marks.find((mark) => mark.id === id)?.name ?? id).join(', ')
        if (id === 'retrievals') return String(item.listedRetrievals)
        if (id === 'retrieved') return `${item.retrieved}%`
        if (id === 'cited') return `${item.cited}%`
        if (id === 'retrievalRate') return String(item.retrievalRate)
        if (id === 'citationRate') return String(item.citationRate)
        if (id === 'gap') return String(item.gapScore)
        if (id === 'citations') return String(item.totalCitations)
        return `${item.citationShare}%`
      }),
    ])
    return [header, ...body]
  }

  const saveExport = (kind: 'csv' | 'xlsx' | 'json') => {
    const table = exportRows()
    if (!table) return
    if (kind === 'csv') downloadFile('domains.csv', toCsv(table), 'text/csv')
    if (kind === 'xlsx') downloadFile('domains.xls', toExcelXml(table, 'Domains'), 'application/vnd.ms-excel')
    if (kind === 'json') downloadFile('domains.json', JSON.stringify(table, null, 2), 'application/json')
    push({ title: t('exportedTitle'), body: t('exportedBody', { count: table.length - 1 }) })
  }

  const typeLabel = domainTypes === null
    ? t('allDomainTypes')
    : domainTypes.length === 1
      ? t(domainTypes[0])
      : t('typesSelected', { count: domainTypes.length })

  return (
    <div className="min-h-full bg-white">
      <FilterRow />
      <div className="space-y-8 px-4 py-5">
        <ApiNote loading={domainQuery.loading || hostQuery.loading} error={domainQuery.error ?? hostQuery.error} shown={board === 'domains' ? domains.length : hosts.length} total={board === 'domains' ? domainQuery.data?.total : hostQuery.data?.total} />
        <div className="flex gap-4 border-b border-nuw-line text-[14px]">
          {(['domains', 'hosts'] as const).map((id) => (
            <button key={id} type="button" role="tab" aria-selected={board === id} onClick={() => { setBoard(id); setSelected([]); setQuery('') }} className={cn('border-b-2 pb-2', board === id ? 'border-zinc-900 font-medium' : 'border-transparent text-zinc-400')}>
              {t(id === 'domains' ? 'domainsTab' : 'hostsTab')}
            </button>
          ))}
        </div>

        <section>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold">{t('overview')}</h2>
              <p className="text-[13px] text-zinc-500">{board === 'domains' ? t('overviewHelp') : t('hostOverviewHelp')}</p>
            </div>
            <Resolution value={resolution} onChange={setResolution} />
          </div>
          <div className="rounded-2xl border border-nuw-line p-4">
            <h3 className="text-[14px] font-medium">{t('chartTitle')}</h3>
            {resolution !== 'day' ? <p className="mt-1 text-[12px] text-zinc-500">{t(resolution === 'week' ? 'weekNote' : 'monthNote')}</p> : null}
            {!filtersAreClear(filters) ? <p className="mt-1 text-[12px] text-zinc-500">{t('filterChartNote')}</p> : null}
            {lines.length === 0 ? <p className="py-10 text-center text-[13px] text-zinc-500">{t('chartEmpty')}</p> : (
              <RetrievalLines labels={axis.labels} lines={lines} note={resolution === 'week' ? t('promptsCreated', { count: promptsCreated }) : undefined} />
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-[12px]">
              {lines.map((line) => (
                <span key={line.id} className="inline-flex max-w-[140px] items-center gap-1.5 text-zinc-600">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: line.color }} />
                  <span className="truncate">{line.label.replace('.com', '').replace('.so', '')}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-nuw-line p-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[15px] font-semibold">{board === 'domains' ? t('movers') : t('hostMovers')}</h2>
              <div className="flex items-center gap-1 text-[13px]">
                {moverTabs.map((tab) => (
                  <button key={tab} type="button" onClick={() => setMover(tab)} className={cn('rounded-md px-2 py-1', mover === tab ? 'font-medium text-zinc-900' : 'text-zinc-400')}>{t(tab)}</button>
                ))}
                <span className="relative">
                  <button type="button" aria-label={t('moverHelp')} onClick={() => setMoverHelp((open) => !open)} className="text-zinc-400"><Info className="h-3.5 w-3.5" /></button>
                  {moverHelp ? (
                    <span className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl bg-zinc-950 p-3 text-[12px] leading-5 text-white shadow-menu">
                      {moverTabs.map((tab) => (
                        <span key={tab} className="mb-2 block"><span className="font-medium">{t(tab)}. </span>{t(board === 'domains' ? `${tab}Tip` : `${tab}HostTip`)}</span>
                      ))}
                    </span>
                  ) : null}
                </span>
              </div>
              <span className="ml-auto text-[12px] text-zinc-400">{t('retrievals')}</span>
            </div>
            <p className="mt-1 text-[13px] text-zinc-500">{board === 'domains' ? t('moversHelp') : t('hostMoversHelp')}</p>
            {moverRows.length === 0 ? <p className="py-8 text-[13px] text-zinc-500">{t('moversEmpty', { tab: t(mover) })}</p> : (
              <ul className="mt-3 space-y-1.5">
                {moverRows.map((item) => (
                  <li key={item.id}>
                    <Link href={hrefFor(item)} className="relative flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-zinc-50">
                      <span className="absolute inset-y-0 left-0 rounded-lg bg-zinc-100" style={{ width: `${Math.max(12, (item.retrievals / moverMax) * 100)}%` }} />
                      <span className="relative flex w-full items-center gap-2">
                        <Favicon host={item.host.replace(/^www\.|^m\./, '')} />
                        <span className="truncate">{item.host}</span>
                        <span className="ml-auto tabular-nums text-zinc-600">{item.retrievals}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-nuw-line p-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold">{t('domainTypes')}</h2>
              <span className="ml-auto inline-flex items-center gap-1 text-[12px] text-zinc-400">
                <Info className="h-3.5 w-3.5" /> {t('totalRetrievals', { count: compactCount(domainTypeShare.reduce((sum, type) => sum + type.retrievals, 0)) })}
              </span>
            </div>
            <ul className="relative mt-3 space-y-2">
              {domainTypeShare.map((type) => {
                const tops = visible.filter((item) => item.domainType === type.id).sort((a, b) => b.retrievals - a.retrievals).slice(0, 4)
                return (
                  <li key={type.id} className="relative" onMouseEnter={() => setHoverType(type.id)} onMouseLeave={() => setHoverType(null)}>
                    <button type="button" onClick={() => setDomainTypes([type.id])} className="grid w-full grid-cols-[120px_1fr_40px] items-center gap-2 text-left text-[13px]">
                      <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: domainColors[type.id] }} />{t(type.id)}</span>
                      <span className="h-7 overflow-hidden rounded-lg bg-zinc-100"><span className="block h-full rounded-lg bg-zinc-200" style={{ width: `${type.share}%` }} /></span>
                      <span className="text-right tabular-nums text-zinc-500">{type.share}%</span>
                    </button>
                    {hoverType === type.id ? (
                      <span className="absolute right-0 top-8 z-20 w-52 rounded-xl bg-zinc-950 p-3 text-[12px] text-white shadow-menu">
                        <span className="flex items-center justify-between gap-3"><span className="font-medium">{t(type.id)}</span><span>{t('typeRetrievals', { count: compactCount(type.retrievals) })}</span></span>
                        <span className="mt-2 block text-zinc-300">{t('topSources')}</span>
                        <span className="mt-1 flex gap-1">{tops.length ? tops.map((item) => <Favicon key={item.id} host={item.host} />) : <span className="text-zinc-400">{t('noTopSources')}</span>}</span>
                      </span>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold">{board === 'domains' ? t('domainsTitle') : t('hostsTitle')}</h2>
              <p className="text-[13px] text-zinc-500">{board === 'domains' ? t('domainsHelp') : t('hostsHelp')}</p>
            </div>
            <label className="inline-flex items-center gap-2 text-[13px]">
              <span>{t('gap')}</span>
              <button type="button" role="switch" aria-checked={gap} aria-label={t('gap')} onClick={() => setGap((on) => !on)} className={cn('h-5 w-9 rounded-full p-0.5', gap ? 'bg-emerald-500' : 'bg-zinc-200')}>
                <span className={cn('block h-4 w-4 rounded-full bg-white', gap && 'translate-x-4')} />
              </button>
            </label>
          </div>
          <p className="mt-2 text-[12px] text-zinc-500">{gap ? t('gapOn') : t('gapOff')}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="flex h-8 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-nuw-line px-2">
              <Search className="h-3.5 w-3.5 text-zinc-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('search')} className="w-full bg-transparent outline-none" />
            </label>
            {gap ? (
              <Menu panelClassName="w-52" trigger={() => <button type="button" className="inline-flex h-8 items-center gap-1 rounded-lg border border-nuw-line px-2">{t('minCompetitor', { count: minCompetitors })} <ChevronDown className="h-3.5 w-3.5 text-zinc-400" /></button>}>
                {[1, 2, 3, 4, 5, 6, 7].map((count) => (
                  <MenuItem key={count} active={minCompetitors === count} onSelect={() => setMinCompetitors(count)}>{t('minCompetitor', { count })}</MenuItem>
                ))}
              </Menu>
            ) : null}
            <BrandFilter marks={marks} selected={mentionIds} mode={mentionMode} onMode={setMentionMode} onChange={setMentionIds} />
            <Menu panelClassName="w-60" trigger={() => <button type="button" className="inline-flex h-8 items-center gap-1 rounded-lg border border-nuw-line px-2">{typeLabel} <ChevronDown className="h-3.5 w-3.5 text-zinc-400" /></button>}>
              <TypeChoices selected={domainTypes} onChange={setDomainTypes} />
            </Menu>
            <Menu align="right" panelClassName="w-56" trigger={() => <button type="button" aria-label={t('columns')} className="grid h-8 w-8 place-items-center rounded-lg border border-nuw-line"><Settings className="h-3.5 w-3.5" /></button>}>
              <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('fixedColumns')}</p>
              <label className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-zinc-400"><input type="checkbox" checked disabled /> {t('rank')}</label>
              <label className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-zinc-400"><input type="checkbox" checked disabled /> {t('source')}</label>
              <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('activeColumns')}</p>
              {defaultCols.map((id) => <ColumnCheck key={id} id={id} columns={columns} setColumns={setColumns} />)}
              <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('availableColumns')}</p>
              {extraCols.map((id) => <ColumnCheck key={id} id={id} columns={columns} setColumns={setColumns} />)}
              <button type="button" onClick={() => setColumns(defaultCols)} className="mt-1 w-full rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100">{t('resetColumns')}</button>
            </Menu>
            <Menu align="right" panelClassName="w-44" trigger={() => <button type="button" aria-label={t('indicators')} className="grid h-8 w-8 place-items-center rounded-lg border border-nuw-line"><LineChart className="h-3.5 w-3.5" /></button>}>
              {(['default', 'indicators', 'none'] as const).map((id) => (
                <MenuItem key={id} active={indicators === id} onSelect={() => setIndicators(id)}>
                  {t(id === 'default' ? 'indicatorsDefault' : id === 'indicators' ? 'indicatorsOnly' : 'indicatorsNone')}
                </MenuItem>
              ))}
            </Menu>
            <Menu align="right" panelClassName="w-36" trigger={() => <button type="button" aria-label={t('exportFormat')} className="grid h-8 w-8 place-items-center rounded-lg border border-nuw-line"><Download className="h-3.5 w-3.5" /></button>}>
              <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('exportFormat')}</p>
              {(['csv', 'xlsx', 'json'] as const).map((kind) => (
                <MenuItem key={kind} onSelect={() => saveExport(kind)}>{kind.toUpperCase()}</MenuItem>
              ))}
            </Menu>
          </div>
          {sorted.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <h3 className="text-[15px] font-semibold">{query ? t('noSearchTitle', { query }) : t('noFilterTitle')}</h3>
              <p className="mx-auto mt-2 max-w-md text-[13px] leading-5 text-zinc-500">{query ? t('noSearchBody') : t('noFilterBody')}</p>
              <button type="button" onClick={() => { setQuery(''); setGap(true); setMinCompetitors(1); setDomainTypes(['corporate', 'editorial']); setMentionIds(null) }} className="mt-4 h-9 rounded-lg bg-nuw-button px-3 text-[13px] text-white">
                {query ? t('clearSearch') : t('resetList')}
              </button>
            </div>
          ) : (
            <div className="mt-3 overflow-auto">
              <table className="w-max min-w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-nuw-line text-[12px] text-zinc-500">
                    <th className="w-10 px-3 py-2"><input type="checkbox" aria-label={t('selectPage')} checked={sorted.every((item) => selected.includes(item.id))} onChange={(event) => setSelected(event.target.checked ? sorted.map((item) => item.id) : [])} /></th>
                    <th className="px-2 py-2">{t('rank')}</th>
                    <th className="min-w-[200px] px-2 py-2"><SortButton label={t('source')} onClick={() => setSort(toggleSort(sort, 'source'))} /></th>
                    {columns.filter((id) => id !== 'gap' || gap).map((id) => (
                      <th key={id} className="px-2 py-2">
                        {id === 'mentions' ? (
                          <span className="relative inline-flex">
                            <button type="button" className="inline-flex items-center gap-1" onClick={() => setMentionTip((open) => !open)}>{t('mentions')} <Info className="h-3 w-3" /></button>
                            {mentionTip ? <span className="absolute left-0 top-full z-20 mt-2 w-64 rounded-xl bg-zinc-950 p-3 text-[12px] font-normal leading-5 text-white shadow-menu">{t('mentionsTip')}</span> : null}
                          </span>
                        ) : <SortButton label={t(colKey(id))} onClick={() => setSort(toggleSort(sort, id))} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((item, index) => {
                    const tags = extraTags[item.id] ?? []
                    return (
                      <tr key={item.id} className="border-b border-nuw-line">
                        <td className="px-3 py-3"><input type="checkbox" aria-label={t('selectRow')} checked={selected.includes(item.id)} onChange={() => setSelected((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} /></td>
                        <td className="px-2 py-3 text-zinc-400">{index + 1}</td>
                        <td className="px-2 py-3">
                          <Link href={hrefFor(item)} className="inline-flex items-center gap-2 font-medium text-zinc-800">
                            <Favicon host={item.host} />
                            {item.host}
                          </Link>
                        </td>
                        {columns.filter((id) => id !== 'gap' || gap).map((id) => (
                          <td key={id} className="whitespace-nowrap px-2 py-3">
                            {id === 'type' ? <span className="font-medium" style={{ color: domainColors[item.domainType] }}>{t(item.domainType)}</span> : null}
                            {id === 'tags' ? (
                              <span className="relative inline-flex items-center gap-1">
                                {tags.map((tag) => <span key={tag} className="rounded-full bg-sky-50 px-2 py-0.5 text-[12px] text-sky-700">{tagLabel(tag)}</span>)}
                                <button type="button" className="text-[12px] text-zinc-500 underline" onClick={() => setTagFor(tagFor === item.id ? null : item.id)}>{t('addTags')}</button>
                                {tagFor === item.id ? (
                                  <span className="absolute left-0 top-full z-20 mt-1 w-44 rounded-xl border border-nuw-line bg-white p-2 shadow-menu">
                                    {!tagChoices.length ? <p className="px-2 py-1.5 text-[12px] leading-5 text-zinc-500">{t('noTagsYet')}</p> : null}
                                    {tagChoices.map(({ id: tag }) => {
                                      const on = tags.includes(tag)
                                      return (
                                        <button key={tag} type="button" onClick={() => {
                                          const next = on ? tags.filter((value) => value !== tag) : [...tags, tag]
                                          setExtraTags((current) => ({ ...current, [item.id]: next }))
                                          v2Send('PATCH', `sources/${encodeURIComponent(item.id)}`, { kind: board === 'domains' ? 'domain' : 'host', tags: next }).catch((caught: unknown) => {
                                            setExtraTags((current) => ({ ...current, [item.id]: tags }))
                                            push({ title: t('saveFailedTitle'), body: errorText(caught) })
                                          })
                                        }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-zinc-50">
                                          <span className={cn('grid h-4 w-4 place-items-center rounded border text-[10px]', on ? 'border-nuw-primary bg-nuw-primary text-white' : 'border-zinc-300')}>{on ? '✓' : ''}</span>
                                          {tagLabel(tag)}
                                        </button>
                                      )
                                    })}
                                  </span>
                                ) : null}
                              </span>
                            ) : null}
                            {id === 'mentions' ? (
                              <span className="inline-flex gap-1">
                                {item.mentions.map((id) => {
                                  const mark = marks.find((entry) => entry.id === id)
                                  return mark ? <span key={id} title={mark.name}><BrandMark initials={mark.initials} color={mark.color} size={16} /></span> : null
                                })}
                              </span>
                            ) : null}
                            {id === 'retrievals' ? <DeltaValue value={item.listedRetrievals} delta={item.retrievalDelta} mode={indicators} /> : null}
                            {id === 'retrieved' ? <DeltaValue value={item.retrieved} delta={item.retrievedDelta} mode={indicators} suffix="%" /> : null}
                            {id === 'cited' ? <DeltaValue value={item.cited} delta={item.citedDelta} mode={indicators} suffix="%" /> : null}
                            {id === 'retrievalRate' ? item.retrievalRate : null}
                            {id === 'citationRate' ? item.citationRate : null}
                            {id === 'gap' ? item.gapScore : null}
                            {id === 'citations' ? item.totalCitations : null}
                            {id === 'share' ? `${item.citationShare}%` : null}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-[12px] text-zinc-500">
            {selected.length ? t('selectedCount', { count: selected.length }) : listClear ? t('showingAll', { count: sorted.length }) : t('showingFiltered', { count: sorted.length })}
          </p>
        </section>
      </div>
    </div>
  )
}

function colKey(id: ColId) {
  if (id === 'type') return 'domainType'
  if (id === 'tags') return 'domainTags'
  if (id === 'citations') return 'totalCitations'
  if (id === 'share') return 'citationShare'
  if (id === 'gap') return 'gapScore'
  return id
}

function Resolution({ value, onChange }: { value: Resolution; onChange: (value: Resolution) => void }) {
  const t = useTranslations('domains.page')
  return (
    <div className="inline-flex rounded-lg border border-nuw-line p-0.5 text-[12px]">
      {(['day', 'week', 'month'] as const).map((id) => (
        <button key={id} type="button" onClick={() => onChange(id)} className={cn('h-7 rounded-md px-2', value === id ? 'bg-zinc-100 font-medium' : 'text-zinc-500')}>{t(id)}</button>
      ))}
    </div>
  )
}

function DeltaValue({ value, delta, mode, suffix = '' }: { value: number; delta: number | null; mode: Indicator; suffix?: string }) {
  const change = delta != null && delta !== 0 ? delta : null
  if (mode === 'indicators') {
    if (change == null) return <span className="tabular-nums">{value}{suffix}</span>
    return <span className={change > 0 ? 'text-emerald-600' : 'text-rose-500'}>{change > 0 ? '↑' : '↓'}</span>
  }
  return (
    <span className="tabular-nums">
      {value}{suffix}
      {mode === 'default' && change != null ? <span className={change > 0 ? 'text-emerald-600' : 'text-rose-500'}>{` ${change > 0 ? '+' : ''}${change}${suffix}`}</span> : null}
    </span>
  )
}

function SortButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1 font-medium">{label} <ChevronDown className="h-3 w-3 text-zinc-400" /></button>
}

function toggleSort(current: { key: ColId | 'source'; dir: 'asc' | 'desc' } | null, key: ColId | 'source') {
  if (current?.key === key) return { key, dir: current.dir === 'desc' ? 'asc' as const : 'desc' as const }
  return { key, dir: 'desc' as const }
}

function ColumnCheck({ id, columns, setColumns }: { id: ColId; columns: ColId[]; setColumns: (value: ColId[]) => void }) {
  const t = useTranslations('domains.page')
  const order = [...defaultCols, ...extraCols]
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-zinc-50">
      <input type="checkbox" checked={columns.includes(id)} onChange={() => setColumns(columns.includes(id) ? columns.filter((item) => item !== id) : order.filter((item) => item === id || columns.includes(item)))} />
      {t(colKey(id))}
    </label>
  )
}

function TypeChoices({ selected, onChange }: { selected: DomainKind[] | null; onChange: (ids: DomainKind[] | null) => void }) {
  const t = useTranslations('domains.page')
  const [query, setQuery] = useState('')
  const active = selected ?? [...domainKinds]
  const shown = domainKinds.filter((id) => t(id).toLowerCase().includes(query.trim().toLowerCase()))
  return (
    <>
      <label className="mb-1 flex items-center gap-2 px-2"><Search className="h-3.5 w-3.5 text-zinc-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchTypes')} className="w-full bg-transparent text-[13px] outline-none" /></label>
      <button type="button" onClick={() => onChange(null)} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-50">{t('allDomainTypes')} {selected === null ? <Check className="h-3.5 w-3.5" /> : null}</button>
      {shown.length === 0 ? <p className="px-2 py-2 text-[13px] text-zinc-500">{t('noTypeMatch')}</p> : shown.map((id) => (
        <button key={id} type="button" onClick={() => {
          const next = active.includes(id) ? active.filter((item) => item !== id) : [...active, id]
          onChange(next.length === domainKinds.length ? null : next)
        }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-zinc-50">
          <span className={cn('grid h-4 w-4 place-items-center rounded border text-[10px] text-white', active.includes(id) ? 'border-sky-500 bg-sky-500' : 'border-zinc-300')}>{active.includes(id) ? '✓' : ''}</span>
          <span style={{ color: domainColors[id] }}>{t(id)}</span>
        </button>
      ))}
    </>
  )
}

function BrandFilter({
  marks, selected, mode, onMode, onChange,
}: {
  marks: { id: string; name: string; color: string; initials: string }[]
  selected: string[] | null
  mode: 'or' | 'and'
  onMode: (mode: 'or' | 'and') => void
  onChange: (ids: string[] | null) => void
}) {
  const t = useTranslations('domains.page')
  const [query, setQuery] = useState('')
  const shown = marks.filter((mark) => mark.name.toLowerCase().includes(query.trim().toLowerCase()))
  const active = selected ?? marks.map((mark) => mark.id)
  return (
    <Menu panelClassName="w-64" trigger={() => <button type="button" className="inline-flex h-8 items-center gap-1 rounded-lg border border-nuw-line px-2">{selected ? t('brandsSelected', { count: selected.length }) : t('allBrands')} <ChevronDown className="h-3.5 w-3.5 text-zinc-400" /></button>}>
      <label className="mb-1 flex items-center gap-2 px-2"><Search className="h-3.5 w-3.5 text-zinc-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchBrands')} className="w-full bg-transparent outline-none" /></label>
      <button type="button" onClick={() => onChange(null)} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-50">{t('allBrands')} {selected === null ? <Check className="h-3.5 w-3.5" /> : null}</button>
      <div className="my-1 grid grid-cols-2 gap-1 px-2">
        {(['or', 'and'] as const).map((id) => (
          <button key={id} type="button" onClick={() => onMode(id)} className={cn('h-8 rounded-lg text-[13px]', mode === id ? 'bg-white shadow-sm' : 'bg-zinc-100 text-zinc-500')}>{t(id)}</button>
        ))}
      </div>
      {shown.length === 0 ? <p className="px-2 py-2 text-[13px] text-zinc-500">{t('noBrandMatch')}</p> : shown.map((mark) => (
        <button key={mark.id} type="button" onClick={() => {
          const next = active.includes(mark.id) ? active.filter((id) => id !== mark.id) : [...active, mark.id]
          onChange(next.length === marks.length ? null : next)
        }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-zinc-50">
          <span className={cn('grid h-4 w-4 place-items-center rounded border text-[10px] text-white', active.includes(mark.id) ? 'border-sky-500 bg-sky-500' : 'border-zinc-300')}>{active.includes(mark.id) ? '✓' : ''}</span>
          <BrandMark initials={mark.initials} color={mark.color} size={16} />
          {mark.name}
          {mark.id === 'you' ? <span className="text-emerald-600">{t('you')}</span> : null}
        </button>
      ))}
    </Menu>
  )
}
