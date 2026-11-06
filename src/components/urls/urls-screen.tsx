'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Check, ChevronDown, Download, Info, LineChart, Search, Settings } from 'lucide-react'
import {
  domainColors,
  domainKinds,
  moverTabs,
  typeColors,
  urlTypes,
  type DomainKind,
  type MoverTab,
  normalizeSourceUrl,
  type LiveSourceUrl,
  type UrlTypeId,
} from '@/data/urls'
import { errorText, useV2, v2Send } from '@/lib/v2'
import { ApiNote } from '@/components/data/api-note'
import { RetrievalLines } from '@/components/urls/charts'
import { FilterRow } from '@/components/prompts/filter-row'
import { filtersAreClear, usePrompts } from '@/components/prompts/prompts-context'
import { downloadFile, toCsv, toExcelXml } from '@/components/perception/export-data'
import { BrandMark, Favicon } from '@/components/shell/brand-mark'
import { useBrand } from '@/components/workspace/workspace-context'
import { Menu, MenuItem, useToast } from '@/components/ui/overlay'
import { Link } from '@/i18n/routing'
import { bucketChart, formatCompact, seriesSeenDays } from '@/lib/format'
import { cn } from '@/lib/cn'

type ColId = 'type' | 'tags' | 'domain' | 'mentions' | 'retrievals' | 'citation' | 'gap' | 'updated' | 'citations' | 'share'
type Indicator = 'default' | 'indicators' | 'none'
type Resolution = 'day' | 'week' | 'month'

const defaultCols: ColId[] = ['type', 'tags', 'domain', 'mentions', 'retrievals', 'citation', 'gap', 'updated']
const extraCols: ColId[] = ['citations', 'share']

export function UrlsScreen() {
  const t = useTranslations('urls.page')
  const locale = useLocale()
  const brand = useBrand()
  const { push } = useToast()
  const { filters, competitors, tags: tagChoices, tagName } = usePrompts()
  const tagLabel = (tag: string) => (t.has(tag) ? t(tag) : tagName(tag))
  const urlQuery = useV2<{ total: number; rows: Parameters<typeof normalizeSourceUrl>[0][]; dates: string[] }>('sources', { kind: 'url', limit: 100 })
  const socialFeed = useV2<{ platforms: { id: string; host: string; channels: number }[]; handles: { platform: string; handle: string; retrievals: number; tab: SocialTab }[] }>('sources/social')
  const sourceUrls = (urlQuery.data?.rows ?? []).map(normalizeSourceUrl)
  const urlDates = urlQuery.data?.dates ?? []
  const socialPlatforms = socialFeed.data?.platforms ?? []
  const socialHandles = socialFeed.data?.handles ?? []
  const [resolution, setResolution] = useState<Resolution>('day')
  const [mover, setMover] = useState<MoverTab>('top')
  const [moverHelp, setMoverHelp] = useState(false)
  const [social, setSocial] = useState<SocialTab>('top')
  const [query, setQuery] = useState('')
  const [gap, setGap] = useState(true)
  const [minCompetitors, setMinCompetitors] = useState(1)
  const [types, setTypes] = useState<UrlTypeId[] | null>(null)
  const [domains, setDomains] = useState<DomainKind[] | null>(['corporate', 'editorial'])
  const [mentionIds, setMentionIds] = useState<string[] | null>(null)
  const [mentionMode, setMentionMode] = useState<'or' | 'and'>('or')
  const [columns, setColumns] = useState<ColId[]>(defaultCols)
  const [indicators, setIndicators] = useState<Indicator>('default')
  const [sort, setSort] = useState<{ key: ColId | 'url'; dir: 'asc' | 'desc' } | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [tagFor, setTagFor] = useState<string | null>(null)
  const [extraTags, setExtraTags] = useState<Record<string, string[]>>({})
  const [mentionTip, setMentionTip] = useState(false)
  const [learnMore, setLearnMore] = useState(false)

  const marks = [
    { id: 'you', name: brand.name, color: brand.color, initials: brand.initials },
    ...competitors,
  ]
  const totalRetrievals = sourceUrls.reduce((sum, url) => sum + url.retrievals, 0)
  const typeCounts = new Map<string, number>()
  for (const url of sourceUrls) typeCounts.set(url.type, (typeCounts.get(url.type) ?? 0) + url.retrievals)
  const typeTotal = [...typeCounts.values()].reduce((sum, value) => sum + value, 0) || 1
  const typeShare = [...typeCounts.entries()].map(([id, retrievals]) => ({ id: id as UrlTypeId, share: Math.round((100 * retrievals) / typeTotal) }))

  const rows = useMemo(() => {
    return sourceUrls.filter((url) => {
      if (url.chart) return false
      const competitorCount = url.mentions.filter((id) => id !== 'you').length
      if (gap && competitorCount < minCompetitors) return false
      const tags = [...url.tags, ...(extraTags[url.id] ?? [])]
      const text = `${url.title} ${url.host}${url.path}`.toLowerCase()
      if (query.trim() && !text.includes(query.trim().toLowerCase())) return false
      if (types && !types.includes(url.type)) return false
      if (domains && !domains.includes(url.domainType)) return false
      if (mentionIds) {
        const hit = mentionMode === 'and' ? mentionIds.every((id) => url.mentions.includes(id as LiveSourceUrl['mentions'][number])) : mentionIds.some((id) => url.mentions.includes(id as LiveSourceUrl['mentions'][number]))
        if (!hit) return false
      }
      if (filters.brandIds && !url.mentions.some((id) => filters.brandIds?.includes(id))) return false
      if (filters.models && !url.models.some((model) => filters.models?.includes(model.id))) return false
      if (filters.topics && !url.topics.some((topic) => filters.topics?.includes(topic))) return false
      if (filters.tags) {
        const tagged = filters.tagMode === 'and'
          ? filters.tags.every((tag) => url.promptTags.includes(tag))
          : filters.tags.some((tag) => url.promptTags.includes(tag))
        if (!tagged) return false
      }
      return true
    })
  }, [domains, extraTags, filters.brandIds, filters.models, filters.tagMode, filters.tags, filters.topics, gap, mentionIds, mentionMode, minCompetitors, query, types])

  const sorted = useMemo(() => {
    const copy = [...rows]
    if (!sort) return copy
    const value = (url: LiveSourceUrl) => {
      if (sort.key === 'url') return url.title
      if (sort.key === 'type') return t.has(url.type) ? t(url.type) : url.type
      if (sort.key === 'domain') return t.has(url.domainType) ? t(url.domainType) : url.domainType
      if (sort.key === 'mentions') return url.mentions.length
      if (sort.key === 'retrievals') return url.retrievals
      if (sort.key === 'citation') return url.citation
      if (sort.key === 'gap') return url.gapScore
      if (sort.key === 'updated') return url.updatedDays ?? seriesSeenDays(urlDates, url.series, 'last') ?? -1
      if (sort.key === 'citations') return url.totalCitations
      if (sort.key === 'share') return url.citationShare
      return url.tags.length
    }
    copy.sort((a, b) => {
      const left = value(a)
      const right = value(b)
      const order = typeof left === 'string' && typeof right === 'string' ? left.localeCompare(right) : Number(left) - Number(right)
      return sort.dir === 'asc' ? order : -order
    })
    return copy
  }, [rows, sort, t, urlDates])

  const chartUrls = sourceUrls.filter((url) => url.chart)
  const labels = bucketChart(urlDates, urlDates.map(() => 0), resolution, locale).labels
  const lines = chartUrls.filter((url) => {
    if (filters.brandIds && !url.mentions.some((id) => filters.brandIds?.includes(id))) return false
    if (filters.models && !url.models.some((model) => filters.models?.includes(model.id))) return false
    if (filters.topics && !url.topics.some((topic) => filters.topics?.includes(topic))) return false
    if (filters.tags) {
      const tagged = filters.tagMode === 'and'
        ? filters.tags.every((tag) => url.promptTags.includes(tag))
        : filters.tags.some((tag) => url.promptTags.includes(tag))
      if (!tagged) return false
    }
    return true
  }).map((url) => ({
    id: url.id,
    label: url.path === '/' ? url.host : url.path,
    color: url.color ?? '#14b8a6',
    values: bucketChart(urlDates, url.series ?? [], resolution, locale).values,
    previous: bucketChart(urlDates, url.previous ?? [], resolution, locale).values,
  }))

  const moverRows = sourceUrls.filter((url) => url.movers.includes(mover))
  const moverMax = Math.max(...moverRows.map((url) => url.retrievals), 1)
  const socialRows = socialHandles.filter((item) => item.tab === social)
  const socialMax = Math.max(...socialRows.map((item) => item.retrievals), 1)
  const pageFiltersClear = !query && gap && minCompetitors === 1 && types === null && domains?.length === 2 && mentionIds === null && filtersAreClear(filters)

  const exportRows = () => {
    const chosen = selected.length ? sorted.filter((url) => selected.includes(url.id)) : sorted
    if (!chosen.length) {
      push({ title: t('exportEmptyTitle'), body: t('exportEmptyBody') })
      return null
    }
    const header = [t('url'), ...columns.map((id) => t(id === 'type' ? 'urlType' : id === 'tags' ? 'urlTags' : id === 'domain' ? 'domainType' : id === 'citations' ? 'totalCitations' : id === 'share' ? 'citationShare' : id === 'citation' ? 'citation' : id === 'gap' ? 'gapScore' : id))]
    const body = chosen.map((url) => [
      `${url.host}${url.path}`,
      ...columns.map((id) => {
        if (id === 'type') return t.has(url.type) ? t(url.type) : url.type
        if (id === 'tags') return [...url.tags, ...(extraTags[url.id] ?? [])].map(tagLabel).join(', ')
        if (id === 'domain') return t.has(url.domainType) ? t(url.domainType) : url.domainType
        if (id === 'mentions') return url.mentions.map((id) => marks.find((mark) => mark.id === id)?.name ?? id).join(', ')
        if (id === 'retrievals') return String(url.retrievals)
        if (id === 'citation') return String(url.citation)
        if (id === 'gap') return String(url.gapScore)
        if (id === 'updated') return updatedPhrase(url, urlDates, t)
        if (id === 'citations') return String(url.totalCitations)
        return `${url.citationShare}%`
      }),
    ])
    return [header, ...body]
  }

  const saveExport = (kind: 'csv' | 'xlsx' | 'json') => {
    const table = exportRows()
    if (!table) return
    if (kind === 'csv') downloadFile('urls.csv', toCsv(table), 'text/csv')
    if (kind === 'xlsx') downloadFile('urls.xls', toExcelXml(table, 'URLs'), 'application/vnd.ms-excel')
    if (kind === 'json') downloadFile('urls.json', JSON.stringify(table, null, 2), 'application/json')
    push({ title: t('exportedTitle'), body: t('exportedBody', { count: table.length - 1 }) })
  }

  return (
    <div className="min-h-full bg-white">
      <FilterRow />
      <div className="space-y-8 px-4 py-5">
        <ApiNote loading={urlQuery.loading || socialFeed.loading} error={urlQuery.error ?? socialFeed.error} shown={sourceUrls.length} total={urlQuery.data?.total} />
        <section>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold">{t('overview')}</h2>
              <p className="text-[13px] text-zinc-500">{t('overviewHelp')}</p>
            </div>
            <Resolution value={resolution} onChange={setResolution} />
          </div>
          <div className="rounded-2xl border border-nuw-line p-4">
            <h3 className="text-[14px] font-medium">{t('chartTitle')}</h3>
            {resolution !== 'day' ? <p className="mt-1 text-[12px] text-zinc-500">{t(resolution === 'week' ? 'weekNote' : 'monthNote')}</p> : null}
            {!filtersAreClear(filters) ? <p className="mt-1 text-[12px] text-zinc-500">{t('filterChartNote')}</p> : null}
            {lines.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-zinc-500">{t('chartEmpty')}</p>
            ) : (
              <RetrievalLines labels={labels} lines={lines} />
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-[12px]">
              {lines.map((line) => (
                <span key={line.id} className="inline-flex items-center gap-1.5 text-zinc-600">
                  <span className="h-2 w-2 rounded-full" style={{ background: line.color }} />
                  {line.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-nuw-line p-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[15px] font-semibold">{t('movers')}</h2>
              <div className="flex items-center gap-1 text-[13px]">
                {moverTabs.map((tab) => (
                  <button key={tab} type="button" onClick={() => setMover(tab)} className={cn('rounded-md px-2 py-1', mover === tab ? 'font-medium text-zinc-900' : 'text-zinc-400')}>{t(tab)}</button>
                ))}
                <span className="relative">
                  <button type="button" aria-label={t('moverHelp')} onClick={() => setMoverHelp((open) => !open)} className="text-zinc-400"><Info className="h-3.5 w-3.5" /></button>
                  {moverHelp ? (
                    <span className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl bg-zinc-950 p-3 text-[12px] leading-5 text-white shadow-menu">
                      {moverTabs.map((tab) => (
                        <span key={tab} className="mb-2 block"><span className="font-medium">{t(tab)}. </span>{t(`${tab}Tip`)}</span>
                      ))}
                    </span>
                  ) : null}
                </span>
              </div>
              <span className="ml-auto text-[12px] text-zinc-400">{t('retrievals')}</span>
            </div>
            <p className="mt-1 text-[13px] text-zinc-500">{t('moversHelp')}</p>
            {moverRows.length === 0 ? <p className="py-8 text-[13px] text-zinc-500">{t('moversEmpty', { tab: t(mover) })}</p> : (
              <ul className="mt-3 space-y-1.5">
                {moverRows.map((url) => (
                  <li key={url.id}>
                    <Link href={`/prompts/urls/${url.id}`} className="relative flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-zinc-50">
                      <span className="absolute inset-y-0 left-0 rounded-lg bg-zinc-100" style={{ width: `${Math.max(12, (url.retrievals / moverMax) * 100)}%` }} />
                      <span className="relative flex w-full items-center gap-2">
                        <Favicon host={url.host} />
                        <span className="truncate">{url.path === '/' ? url.host : url.path}</span>
                        <span className="ml-auto tabular-nums text-zinc-600">{url.retrievals}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-nuw-line p-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold">{t('urlTypes')}</h2>
              <span className="ml-auto inline-flex items-center gap-1 text-[12px] text-zinc-400">
                <Info className="h-3.5 w-3.5" /> {t('totalRetrievals', { count: formatCompact(totalRetrievals, locale) })}
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {typeShare.map((type) => (
                <li key={type.id} className="grid grid-cols-[140px_1fr_40px] items-center gap-2 text-[13px]">
                  <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: typeColors[type.id] ?? '#a1a1aa' }} />{t.has(type.id) ? t(type.id) : type.id}</span>
                  <span className="h-7 overflow-hidden rounded-lg bg-zinc-100"><span className="block h-full rounded-lg bg-zinc-200" style={{ width: `${type.share}%` }} /></span>
                  <span className="text-right tabular-nums text-zinc-500">{type.share}%</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-nuw-line p-4">
          <h2 className="text-[15px] font-semibold">{t('social')}</h2>
          <p className="text-[13px] text-zinc-500">{t('socialHelp')}</p>
          <div className="mt-3 flex gap-1 text-[13px]">
            {(['top', 'trending', 'losing'] as const).map((tab) => (
              <button key={tab} type="button" onClick={() => setSocial(tab)} className={cn('rounded-md px-2 py-1', social === tab ? 'font-medium' : 'text-zinc-400')}>{t(tab)}</button>
            ))}
          </div>
          {socialRows.length === 0 ? <p className="py-6 text-[13px] text-zinc-500">{t('socialEmpty', { tab: t(social) })}</p> : (
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              <ul className="space-y-2">
                {socialPlatforms.map((platform) => (
                  <li key={platform.id} className="flex items-center gap-2 text-[13px]">
                    <Favicon host={platform.host} />
                    <span>{t(platform.id)}</span>
                    <span className="text-zinc-400">{t('channelCount', { count: platform.channels })}</span>
                  </li>
                ))}
              </ul>
              <ul className="space-y-1.5">
                {socialRows.map((item) => (
                  <li key={item.handle} className="relative flex items-center">
                    <span className="absolute inset-y-0 left-0 rounded-lg bg-zinc-100" style={{ width: `${Math.max(16, (item.retrievals / socialMax) * 100)}%` }} />
                    <span className="relative flex w-full items-center px-2 py-1.5 text-[13px]">
                      <span>{item.handle}</span>
                      <span className="ml-auto tabular-nums text-zinc-600">{item.retrievals}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold">{t('urlsTitle')}</h2>
              <p className="text-[13px] text-zinc-500">{t('urlsHelp', { brand: brand.name })}</p>
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
                  <MenuItem key={count} active={minCompetitors === count} onSelect={() => setMinCompetitors(count)}>
                    {t('minCompetitor', { count })}
                  </MenuItem>
                ))}
              </Menu>
            ) : null}
            <BrandFilter marks={marks} selected={mentionIds} mode={mentionMode} onMode={setMentionMode} onChange={setMentionIds} />
            <TypeFilter selected={types} onChange={setTypes} />
            <DomainFilter selected={domains} onChange={setDomains} />
            <Menu align="right" panelClassName="w-56" trigger={() => <button type="button" aria-label={t('columns')} className="grid h-8 w-8 place-items-center rounded-lg border border-nuw-line"><Settings className="h-3.5 w-3.5" /></button>}>
              <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('fixedColumns')}</p>
              <label className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-zinc-400"><input type="checkbox" checked disabled /> {t('url')}</label>
              <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('activeColumns')}</p>
              {defaultCols.map((id) => (
                <ColumnCheck key={id} id={id} columns={columns} setColumns={setColumns} />
              ))}
              <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('availableColumns')}</p>
              {extraCols.map((id) => (
                <ColumnCheck key={id} id={id} columns={columns} setColumns={setColumns} />
              ))}
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
              <button
                type="button"
                onClick={() => { setQuery(''); setGap(true); setMinCompetitors(1); setTypes(null); setDomains(['corporate', 'editorial']); setMentionIds(null) }}
                className="mt-4 h-9 rounded-lg bg-nuw-button px-3 text-[13px] text-white"
              >
                {query ? t('clearSearch') : t('resetList')}
              </button>
            </div>
          ) : (
            <div className="mt-3 overflow-auto">
              <table className="w-max min-w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-nuw-line text-[12px] text-zinc-500">
                    <th className="w-10 px-3 py-2">
                      <input type="checkbox" aria-label={t('selectPage')} checked={sorted.every((url) => selected.includes(url.id))} onChange={(event) => setSelected(event.target.checked ? sorted.map((url) => url.id) : [])} />
                    </th>
                    <th className="min-w-[280px] px-2 py-2"><SortButton label={t('url')} onClick={() => setSort(toggleSort(sort, 'url'))} /></th>
                    {columns.filter((id) => id !== 'gap' || gap).map((id) => (
                      <th key={id} className="px-2 py-2">
                        {id === 'mentions' ? (
                          <span className="relative inline-flex items-center gap-1">
                            <button type="button" className="inline-flex items-center gap-1" onClick={() => setMentionTip((open) => !open)}>
                              {t('mentions')} <Info className="h-3 w-3" />
                            </button>
                            {mentionTip ? (
                              <span className="absolute left-0 top-full z-20 mt-2 w-64 rounded-xl bg-zinc-950 p-3 text-[12px] font-normal leading-5 text-white shadow-menu">
                                {t('mentionsTip')}{' '}
                                <button type="button" className="underline" onClick={() => setLearnMore((open) => !open)}>{t('learnMore')}</button>
                                {learnMore ? <span className="mt-2 block text-zinc-300">{t('learnMoreBody')}</span> : null}
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          <SortButton label={t(id === 'type' ? 'urlType' : id === 'tags' ? 'urlTags' : id === 'domain' ? 'domainType' : id === 'citations' ? 'totalCitations' : id === 'share' ? 'citationShare' : id === 'citation' ? 'citation' : id === 'gap' ? 'gapScore' : id)} onClick={() => setSort(toggleSort(sort, id))} />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((url) => {
                    const tags = [...url.tags, ...(extraTags[url.id] ?? [])]
                    return (
                      <tr key={url.id} className="border-b border-nuw-line align-top">
                        <td className="px-3 py-3"><input type="checkbox" aria-label={t('selectRow')} checked={selected.includes(url.id)} onChange={() => setSelected((current) => current.includes(url.id) ? current.filter((id) => id !== url.id) : [...current, url.id])} /></td>
                        <td className="px-2 py-3">
                          <Link href={`/prompts/urls/${url.id}`} className="flex items-start gap-2">
                            <Favicon host={url.host} />
                            <span>
                              <span className="block font-medium text-zinc-800">{url.title}</span>
                              <span className="text-[12px] text-zinc-400">{url.host}{url.path === '/' ? '' : url.path}</span>
                            </span>
                          </Link>
                        </td>
                        {columns.filter((id) => id !== 'gap' || gap).map((id) => (
                          <td key={id} className="whitespace-nowrap px-2 py-3">
                            {id === 'type' ? <TypeChip id={url.type} /> : null}
                            {id === 'tags' ? (
                              <span className="relative inline-flex flex-wrap items-center gap-1">
                                {tags.map((tag) => <span key={tag} className="rounded-full bg-sky-50 px-2 py-0.5 text-[12px] text-sky-700">{tagLabel(tag)}</span>)}
                                <button type="button" className="text-[12px] text-zinc-500 underline" onClick={() => setTagFor(tagFor === url.id ? null : url.id)}>{t('addTags')}</button>
                                {tagFor === url.id ? (
                                  <span className="absolute left-0 top-full z-20 mt-1 w-52 rounded-xl border border-nuw-line bg-white p-2 shadow-menu">
                                    {!tagChoices.length ? <p className="px-2 py-1.5 text-[12px] leading-5 text-zinc-500">{t('noTagsYet')}</p> : null}
                                    {tagChoices.map(({ id: tag }) => {
                                      const on = tags.includes(tag)
                                      return (
                                        <button key={tag} type="button" onClick={() => {
                                          const before = extraTags[url.id] ?? []
                                          const extra = on ? before.filter((item) => item !== tag) : [...before, tag]
                                          setExtraTags((current) => ({ ...current, [url.id]: extra }))
                                          v2Send('PATCH', `sources/${encodeURIComponent(url.id)}`, { kind: 'url', tags: [...url.tags, ...extra].filter((item) => item !== tag || !on) }).catch((caught: unknown) => {
                                            setExtraTags((current) => ({ ...current, [url.id]: before }))
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
                            {id === 'domain' ? <span className="font-medium" style={{ color: domainColors[url.domainType] }}>{t.has(url.domainType) ? t(url.domainType) : url.domainType}</span> : null}
                            {id === 'mentions' ? (
                              <span className="inline-flex gap-1">
                                {url.mentions.map((id) => {
                                  const mark = marks.find((item) => item.id === id)
                                  return mark ? <BrandMark key={id} initials={mark.initials} color={mark.color} size={16} /> : null
                                })}
                              </span>
                            ) : null}
                            {id === 'retrievals' ? <Metric value={url.retrievals} delta={url.retrievalDelta} mode={indicators} /> : null}
                            {id === 'citation' ? <Metric value={url.citation} delta={url.citationDelta} mode={indicators} /> : null}
                            {id === 'gap' ? url.gapScore : null}
                            {id === 'updated' ? <span className="text-zinc-500">{updatedPhrase(url, urlDates, t)}</span> : null}
                            {id === 'citations' ? url.totalCitations : null}
                            {id === 'share' ? `${url.citationShare}%` : null}
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
            {selected.length ? t('selectedCount', { count: selected.length }) : pageFiltersClear ? t('showingAll', { count: sorted.length }) : t('showingFiltered', { count: sorted.length })}
          </p>
        </section>
      </div>
    </div>
  )
}

type SocialTab = 'top' | 'trending' | 'losing'

function Resolution({ value, onChange }: { value: Resolution; onChange: (value: Resolution) => void }) {
  const t = useTranslations('urls.page')
  return (
    <div className="inline-flex rounded-lg border border-nuw-line p-0.5 text-[12px]">
      {(['day', 'week', 'month'] as const).map((id) => (
        <button key={id} type="button" onClick={() => onChange(id)} className={cn('h-7 rounded-md px-2', value === id ? 'bg-zinc-100 font-medium' : 'text-zinc-500')}>{t(id)}</button>
      ))}
    </div>
  )
}

function TypeChip({ id }: { id: UrlTypeId }) {
  const t = useTranslations('urls.page')
  return <span className="rounded-md px-1.5 py-0.5 text-[12px] font-medium" style={{ color: typeColors[id], background: `${typeColors[id]}18` }}>{t(id)}</span>
}

function Metric({ value, delta, mode }: { value: number; delta: number | null; mode: Indicator }) {
  const change = delta != null && delta !== 0 ? delta : null
  if (mode === 'indicators') {
    if (change == null) return <span className="tabular-nums">{value}</span>
    return <span className={change > 0 ? 'text-emerald-600' : 'text-rose-500'}>{change > 0 ? '↑' : '↓'}</span>
  }
  return (
    <span className="tabular-nums">
      {value}
      {mode === 'default' && change != null ? <span className={change > 0 ? 'text-emerald-600' : 'text-rose-500'}>{` ${change > 0 ? '+' : ''}${change}`}</span> : null}
    </span>
  )
}

function SortButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1 font-medium">{label} <ChevronDown className="h-3 w-3 text-zinc-400" /></button>
}

function toggleSort(current: { key: ColId | 'url'; dir: 'asc' | 'desc' } | null, key: ColId | 'url') {
  if (current?.key === key) return { key, dir: current.dir === 'desc' ? 'asc' as const : 'desc' as const }
  return { key, dir: 'desc' as const }
}

function ColumnCheck({ id, columns, setColumns }: { id: ColId; columns: ColId[]; setColumns: (value: ColId[]) => void }) {
  const t = useTranslations('urls.page')
  const order = [...defaultCols, ...extraCols]
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-zinc-50">
      <input type="checkbox" checked={columns.includes(id)} onChange={() => setColumns(columns.includes(id) ? columns.filter((item) => item !== id) : order.filter((item) => item === id || columns.includes(item)))} />
      {t(id === 'type' ? 'urlType' : id === 'tags' ? 'urlTags' : id === 'domain' ? 'domainType' : id === 'citations' ? 'totalCitations' : id === 'share' ? 'citationShare' : id === 'citation' ? 'citation' : id === 'gap' ? 'gapScore' : id)}
    </label>
  )
}

function BrandFilter({
  marks,
  selected,
  mode,
  onMode,
  onChange,
}: {
  marks: { id: string; name: string; color: string; initials: string }[]
  selected: string[] | null
  mode: 'or' | 'and'
  onMode: (mode: 'or' | 'and') => void
  onChange: (ids: string[] | null) => void
}) {
  const t = useTranslations('urls.page')
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

function TypeFilter({ selected, onChange }: { selected: UrlTypeId[] | null; onChange: (ids: UrlTypeId[] | null) => void }) {
  const t = useTranslations('urls.page')
  const [query, setQuery] = useState('')
  const active = selected ?? [...urlTypes]
  const shown = urlTypes.filter((id) => t(id).toLowerCase().includes(query.trim().toLowerCase()))
  return (
    <Menu panelClassName="w-60" trigger={() => <button type="button" className="inline-flex h-8 items-center gap-1 rounded-lg border border-nuw-line px-2">{selected ? t('typesSelected', { count: selected.length }) : t('allTypes')} <ChevronDown className="h-3.5 w-3.5 text-zinc-400" /></button>}>
      <label className="mb-1 flex items-center gap-2 px-2"><Search className="h-3.5 w-3.5 text-zinc-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchTypes')} className="w-full bg-transparent outline-none" /></label>
      <button type="button" onClick={() => onChange(null)} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-50">{t('allTypes')} {selected === null ? <Check className="h-3.5 w-3.5" /> : null}</button>
      {shown.length === 0 ? <p className="px-2 py-2 text-[13px] text-zinc-500">{t('noTypeMatch')}</p> : shown.map((id) => (
        <button key={id} type="button" onClick={() => {
          const next = active.includes(id) ? active.filter((item) => item !== id) : [...active, id]
          onChange(next.length === urlTypes.length ? null : next)
        }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-zinc-50">
          <span className={cn('grid h-4 w-4 place-items-center rounded border text-[10px] text-white', active.includes(id) ? 'border-sky-500 bg-sky-500' : 'border-zinc-300')}>{active.includes(id) ? '✓' : ''}</span>
          <TypeChip id={id} />
        </button>
      ))}
    </Menu>
  )
}

function DomainFilter({ selected, onChange }: { selected: DomainKind[] | null; onChange: (ids: DomainKind[] | null) => void }) {
  const t = useTranslations('urls.page')
  const [query, setQuery] = useState('')
  const active = selected ?? [...domainKinds]
  const shown = domainKinds.filter((id) => t(id).toLowerCase().includes(query.trim().toLowerCase()))
  const label = selected === null ? t('allDomainTypes') : t('typesSelected', { count: selected.length })
  return (
    <Menu panelClassName="w-60" trigger={() => <button type="button" className="inline-flex h-8 items-center gap-1 rounded-lg border border-nuw-line px-2">{label} <ChevronDown className="h-3.5 w-3.5 text-zinc-400" /></button>}>
      <label className="mb-1 flex items-center gap-2 px-2"><Search className="h-3.5 w-3.5 text-zinc-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchTypes')} className="w-full bg-transparent outline-none" /></label>
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
    </Menu>
  )
}

function updatedPhrase(url: LiveSourceUrl, dates: string[], t: (key: string, values?: Record<string, string | number>) => string) {
  const days = url.updatedDays ?? seriesSeenDays(dates, url.series, 'last')
  if (days == null) return t('notInResponse')
  return t('daysAgo', { count: days })
}
