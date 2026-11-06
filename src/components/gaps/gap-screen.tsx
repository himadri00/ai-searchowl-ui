'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, ChevronDown, Download, Search, Settings, X } from 'lucide-react'
import { type GapBoard, type GapRow } from '@/data/gaps'
import { errorText, useV2, v2Send } from '@/lib/v2'
import { ApiNote } from '@/components/data/api-note'
import { domainColors, domainKinds, urlTypes, type DomainKind, type UrlTypeId } from '@/data/urls'
import { FilterRow } from '@/components/prompts/filter-row'
import { usePrompts } from '@/components/prompts/prompts-context'
import { downloadFile, toCsv, toExcelXml } from '@/components/perception/export-data'
import { BrandMark, Favicon } from '@/components/shell/brand-mark'
import { useBrand } from '@/components/workspace/workspace-context'
import { Menu, MenuItem, useMenu, useToast } from '@/components/ui/overlay'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/cn'

type ColId = 'type' | 'tags' | 'urlType' | 'mentions' | 'retrievals' | 'retrieved' | 'cited' | 'retrievalRate' | 'citationRate' | 'gap' | 'citations' | 'share' | 'updated'
type Indicator = 'default' | 'indicators' | 'none'
type SortMode = 'desc' | 'asc' | 'up' | 'down'
type Reason = 'search' | 'filters' | 'trend' | 'trendNone' | null
type CustomType = { id: string; label: string; color: string }

const domainCols: ColId[] = ['type', 'tags', 'mentions', 'retrievals', 'retrieved', 'cited', 'retrievalRate', 'citationRate', 'gap']
const urlCols: ColId[] = ['urlType', 'tags', 'type', 'mentions', 'retrievals', 'citationRate', 'updated']
const extraCols: ColId[] = ['citations', 'share']
const sortable = new Set<ColId>(['mentions', 'retrievals', 'retrieved', 'cited', 'retrievalRate', 'citationRate', 'gap', 'citations', 'share', 'updated'])
const trendCols = new Set<ColId>(['retrievals', 'retrieved', 'cited'])
const builtInKinds: DomainKind[] = ['corporate', 'editorial', 'institutional']
const otherKinds: DomainKind[] = ['reference', 'ugc', 'competitor', 'you']
const palette = ['#fb923c', '#38bdf8', '#a78bfa', '#34d399', '#f472b6']
const starterTags = ['review', 'listicle', 'comparison']

function pageMatch(item: GapRow, filters: ReturnType<typeof usePrompts>['filters']) {
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

export function GapScreen() {
  const t = useTranslations('gaps.page')
  const brand = useBrand()
  const { push } = useToast()
  const { filters, competitors, tags: promptTags, tagName, createTag } = usePrompts()
  const [board, setBoard] = useState<GapBoard>('domain')
  const gapQuery = useV2<{ total: number; rows: GapRow[] }>('gaps', { board, limit: 100 })
  const gapRows = gapQuery.data?.rows ?? []
  const [query, setQuery] = useState('')
  const [minCompetitors, setMinCompetitors] = useState(1)
  const [domainTypes, setDomainTypes] = useState<string[] | null>(null)
  const [urlTypeFilter, setUrlTypeFilter] = useState<string[] | null>(null)
  const [mentionIds, setMentionIds] = useState<string[] | null>(null)
  const [mentionMode, setMentionMode] = useState<'or' | 'and'>('or')
  const [columns, setColumns] = useState<ColId[]>(domainCols)
  const [indicators, setIndicators] = useState<Indicator>('default')
  const [sort, setSort] = useState<{ key: ColId; mode: SortMode }>({ key: 'retrievals', mode: 'desc' })
  const [selected, setSelected] = useState<string[]>([])
  const [typeOf, setTypeOf] = useState<Record<string, string>>({})
  const [urlTypeOf, setUrlTypeOf] = useState<Record<string, string>>({})
  const [tagsOf, setTagsOf] = useState<Record<string, string[]>>({})
  const [customTypes, setCustomTypes] = useState<CustomType[]>([{ id: 'related', label: '', color: '#fb923c' }])
  const [customUrlTypes, setCustomUrlTypes] = useState<CustomType[]>([])

  useEffect(() => {
    setColumns(board === 'url' ? urlCols : domainCols)
    setSort({ key: 'retrievals', mode: 'desc' })
    setSelected([])
  }, [board])

  const marks = [
    { id: 'you', name: brand.name, color: brand.color, initials: brand.initials },
    ...competitors,
  ]
  const knownTags = promptTags.map((tag) => tag.id)

  const view = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const typed = gapRows.filter((item) => item.board === board).map((item) => ({
      ...item,
      domainType: typeOf[item.id] ?? item.domainType,
      urlType: (urlTypeOf[item.id] as UrlTypeId | undefined) ?? item.urlType,
      tags: tagsOf[item.id] ?? item.tags ?? [],
    }))
    const searched = needle
      ? typed.filter((item) => `${item.host} ${item.path} ${item.title} ${item.tags.join(' ')}`.toLowerCase().includes(needle))
      : typed
    if (needle && searched.length === 0) return { rows: [] as typeof typed, reason: 'search' as Reason }
    const filtered = searched.filter((item) => {
      if (!pageMatch(item, filters)) return false
      if (item.mentions.filter((id) => id !== 'you').length < minCompetitors) return false
      if (mentionIds) {
        const hit = mentionMode === 'and'
          ? mentionIds.every((id) => item.mentions.includes(id as typeof item.mentions[number]))
          : mentionIds.some((id) => item.mentions.includes(id as typeof item.mentions[number]))
        if (!hit) return false
      }
      if (domainTypes && !domainTypes.includes(item.domainType)) return false
      if (board === 'url' && urlTypeFilter && (!item.urlType || !urlTypeFilter.includes(item.urlType))) return false
      return true
    })
    if (filtered.length === 0) return { rows: [] as typeof typed, reason: 'filters' as Reason }
    const delta = (item: typeof typed[number]) => {
      if (sort.key === 'retrievals') return item.retrievalDelta
      if (sort.key === 'retrieved') return item.retrievedDelta
      if (sort.key === 'cited') return item.citedDelta
      return undefined
    }
    if (sort.mode === 'up' || sort.mode === 'down') {
      if (!trendCols.has(sort.key)) return { rows: [] as typeof typed, reason: 'trendNone' as Reason }
      const moving = filtered.filter((item) => {
        const change = delta(item)
        if (change == null) return false
        return sort.mode === 'up' ? change > 0 : change < 0
      })
      if (moving.length === 0) return { rows: [] as typeof typed, reason: 'trend' as Reason }
      moving.sort((a, b) => (delta(b) ?? 0) - (delta(a) ?? 0))
      if (sort.mode === 'down') moving.reverse()
      return { rows: moving, reason: null }
    }
    const value = (item: typeof typed[number]) => {
      if (sort.key === 'mentions') return item.mentions.length
      if (sort.key === 'retrievals') return item.retrievals
      if (sort.key === 'retrieved') return item.retrieved
      if (sort.key === 'cited') return item.cited
      if (sort.key === 'retrievalRate') return item.retrievalRate
      if (sort.key === 'citationRate') return item.citationRate
      if (sort.key === 'gap') return item.gapScore
      if (sort.key === 'citations') return item.totalCitations
      if (sort.key === 'share') return item.citationShare
      if (sort.key === 'updated') return (item.updatedHours ?? 0) / 24 + (item.updatedDays ?? 0)
      return 0
    }
    const copy = [...filtered].sort((a, b) => sort.mode === 'asc' ? value(a) - value(b) : value(b) - value(a))
    return { rows: copy, reason: null }
  }, [board, domainTypes, filters, mentionIds, mentionMode, minCompetitors, query, sort, tagsOf, typeOf, urlTypeFilter, urlTypeOf])

  const labelFor = (id: string) => {
    if (id === 'related') return t('related')
    if ((domainKinds as readonly string[]).includes(id) || (urlTypes as readonly string[]).includes(id) || starterTags.includes(id)) return t(id)
    return customTypes.find((item) => item.id === id)?.label ?? customUrlTypes.find((item) => item.id === id)?.label ?? tagName(id)
  }
  const colorFor = (id: string) => {
    if ((domainKinds as readonly string[]).includes(id)) return domainColors[id as DomainKind]
    if ((urlTypes as readonly string[]).includes(id)) return '#014CFF'
    return customTypes.find((item) => item.id === id)?.color ?? customUrlTypes.find((item) => item.id === id)?.color ?? '#fb923c'
  }
  const colLabel = (id: ColId) => {
    if (id === 'type') return board === 'host' ? t('hostType') : t('domainType')
    if (id === 'tags') return board === 'url' ? t('urlTags') : t('domainTags')
    if (id === 'gap') return t('gapScore')
    if (id === 'citations') return t('totalCitations')
    if (id === 'share') return t('citationShare')
    if (id === 'urlType') return t('urlType')
    return t(id)
  }

  const fail = (caught: unknown) => push({ title: t('saveFailedTitle'), body: errorText(caught) })
  const patchSource = (rowId: string, body: Record<string, unknown>, undo: () => void) => {
    v2Send('PATCH', `sources/${encodeURIComponent(rowId)}`, { kind: board, ...body }).catch((caught: unknown) => {
      undo()
      fail(caught)
    })
  }
  const assignDomainType = (rowId: string, typeId: string) => {
    const before = typeOf[rowId]
    setTypeOf((current) => ({ ...current, [rowId]: typeId }))
    setDomainTypes((current) => current && !current.includes(typeId) ? [...current, typeId] : current)
    patchSource(rowId, { domainType: typeId }, () => setTypeOf((current) => ({ ...current, [rowId]: before })))
  }
  const assignUrlType = (rowId: string, typeId: string) => {
    const before = urlTypeOf[rowId]
    setUrlTypeOf((current) => ({ ...current, [rowId]: typeId }))
    setUrlTypeFilter((current) => current && !current.includes(typeId) ? [...current, typeId] : current)
    patchSource(rowId, { type: typeId }, () => setUrlTypeOf((current) => ({ ...current, [rowId]: before })))
  }
  const setRowTags = (rowId: string, next: string[]) => {
    const before = tagsOf[rowId]
    setTagsOf((current) => ({ ...current, [rowId]: next }))
    patchSource(rowId, { tags: next }, () => setTagsOf((current) => ({ ...current, [rowId]: before })))
  }
  const createType = async (kind: 'domain' | 'url', name: string) => {
    const label = name.trim()
    if (!label) return null
    try {
      const created = await v2Send<{ id?: string; label?: string; color?: string }>('POST', 'sources/types', { kind, label })
      const id = created?.id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const set = kind === 'domain' ? setCustomTypes : setCustomUrlTypes
      set((current) => current.some((item) => item.id === id) ? current : [...current, { id, label: created?.label ?? label, color: created?.color ?? palette[current.length % palette.length] }])
      return id
    } catch (caught) {
      fail(caught)
      return null
    }
  }

  const exportRows = (kind: 'csv' | 'xlsx' | 'json') => {
    const chosen = selected.length ? view.rows.filter((item) => selected.includes(item.id)) : view.rows
    if (!chosen.length) {
      push({ title: t('exportEmptyTitle'), body: t('exportEmptyBody') })
      return
    }
    const header = [board === 'url' ? t('url') : t('source'), ...columns.map(colLabel)]
    const body = chosen.map((item) => [
      board === 'url' ? `${item.title} ${item.host}${item.path}` : item.host,
      ...columns.map((id) => {
        if (id === 'type' || id === 'urlType') return labelFor(id === 'urlType' ? item.urlType ?? '' : item.domainType)
        if (id === 'tags') return item.tags.map(labelFor).join(', ')
        if (id === 'mentions') return item.mentions.map((mention) => marks.find((mark) => mark.id === mention)?.name ?? mention).join(', ')
        if (id === 'retrievals') return String(item.retrievals)
        if (id === 'retrieved') return `${item.retrieved}%`
        if (id === 'cited') return `${item.cited}%`
        if (id === 'retrievalRate') return String(item.retrievalRate)
        if (id === 'citationRate') return String(item.citationRate)
        if (id === 'gap') return String(item.gapScore)
        if (id === 'citations') return String(item.totalCitations)
        if (id === 'share') return `${item.citationShare}%`
        if (item.updatedHours) return t('hoursAgo', { count: item.updatedHours })
        if (item.updatedDays && item.updatedDays >= 30) return t('monthsAgo', { count: Math.round(item.updatedDays / 30) })
        if (item.updatedDays) return t('daysAgo', { count: item.updatedDays })
        return ''
      }),
    ])
    const table = [header, ...body]
    if (kind === 'csv') downloadFile('gap-analysis.csv', toCsv(table), 'text/csv')
    if (kind === 'xlsx') downloadFile('gap-analysis.xls', toExcelXml(table, 'Gaps'), 'application/vnd.ms-excel')
    if (kind === 'json') downloadFile('gap-analysis.json', JSON.stringify(table, null, 2), 'application/json')
    push({ title: t('exportedTitle'), body: t('exportedBody', { count: chosen.length }) })
  }

  const domainTypeLabel = domainTypes === null ? t('allDomainTypes') : domainTypes.length === 1 ? labelFor(domainTypes[0]) : t('typesSelected', { count: domainTypes.length })
  const urlTypeLabel = urlTypeFilter === null ? t('allUrlTypes') : urlTypeFilter.length === 1 ? labelFor(urlTypeFilter[0]) : t('typesSelected', { count: urlTypeFilter.length })
  const title = board === 'domain' ? t('domainTitle') : board === 'host' ? t('hostTitle') : t('urlTitle')
  const hint = board === 'domain' ? t('domainHint') : board === 'host' ? t('hostHint') : t('urlHint')

  return (
    <div className="min-h-full bg-white">
      <FilterRow />
      <div className="px-4 py-5">
        <ApiNote loading={gapQuery.loading} error={gapQuery.error} shown={gapRows.length} total={gapQuery.data?.total} />
        <div className="flex gap-5 border-b border-nuw-line">
          {(['domain', 'host', 'url'] as const).map((id) => (
            <button key={id} type="button" onClick={() => setBoard(id)} className={cn('-mb-px border-b-2 pb-2 text-[14px]', board === id ? 'border-zinc-900 font-medium text-zinc-900' : 'border-transparent text-zinc-500')}>
              {t(id === 'domain' ? 'domains' : id === 'host' ? 'hosts' : 'urls')}
            </button>
          ))}
        </div>
        <h2 className="mt-5 text-[18px] font-semibold text-zinc-900">{title}</h2>
        <p className="mt-1 text-[13px] text-zinc-500">{hint}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="flex h-9 min-w-[220px] items-center gap-2 rounded-lg border border-nuw-line px-2 text-[13px]">
            <Search className="h-3.5 w-3.5 text-zinc-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('search')} aria-label={t('search')} className="w-full bg-transparent outline-none" />
            {query ? <button type="button" aria-label={t('clearSearch')} onClick={() => setQuery('')} className="text-zinc-400 hover:text-zinc-700"><X className="h-3.5 w-3.5" /></button> : null}
          </label>
          <Menu panelClassName="w-48" trigger={() => <button type="button" className="inline-flex h-9 items-center gap-1 rounded-lg border border-nuw-line px-2 text-[13px]">{t('minCompetitor', { count: minCompetitors })} <ChevronDown className="h-3.5 w-3.5 text-zinc-400" /></button>}>
            {[1, 2, 3, 4, 5, 6, 7].map((count) => (
              <MenuItem key={count} active={minCompetitors === count} onSelect={() => setMinCompetitors(count)}>{t('minCompetitor', { count })}</MenuItem>
            ))}
          </Menu>
          <BrandFilter marks={marks} selected={mentionIds} mode={mentionMode} onMode={setMentionMode} onChange={setMentionIds} />
          <TypeFilter
            label={domainTypeLabel}
            allLabel={t('allDomainTypes')}
            selected={domainTypes}
            groups={[
              { title: t('builtIn'), ids: builtInKinds },
              { title: t('otherGroup'), ids: [...otherKinds, ...customTypes.map((item) => item.id)] },
            ]}
            labelFor={labelFor}
            colorFor={colorFor}
            onChange={setDomainTypes}
          />
          {board === 'url' ? (
            <TypeFilter
              label={urlTypeLabel}
              allLabel={t('allUrlTypes')}
              selected={urlTypeFilter}
              groups={[{ title: t('builtIn'), ids: [...urlTypes, ...customUrlTypes.map((item) => item.id)] }]}
              labelFor={labelFor}
              colorFor={colorFor}
              onChange={setUrlTypeFilter}
            />
          ) : null}
          <Menu align="right" panelClassName="w-56" trigger={() => <button type="button" aria-label={t('columns')} className="grid h-9 w-9 place-items-center rounded-lg border border-nuw-line text-zinc-500"><Settings className="h-4 w-4" /></button>}>
            <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">{t('fixedColumns')}</p>
            <p className="px-2 py-1 text-[13px] text-zinc-500">#</p>
            <p className="px-2 py-1 text-[13px] text-zinc-500">{board === 'url' ? t('url') : t('source')}</p>
            <p className="mt-1 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">{t('activeColumns')}</p>
            {(board === 'url' ? urlCols : domainCols).map((id) => <ColumnCheck key={id} id={id} label={colLabel(id)} columns={columns} setColumns={setColumns} order={board === 'url' ? [...urlCols, ...extraCols] : [...domainCols, ...extraCols]} />)}
            <p className="mt-1 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">{t('availableColumns')}</p>
            {extraCols.map((id) => <ColumnCheck key={id} id={id} label={colLabel(id)} columns={columns} setColumns={setColumns} order={board === 'url' ? [...urlCols, ...extraCols] : [...domainCols, ...extraCols]} />)}
            <MenuItem onSelect={() => setColumns(board === 'url' ? urlCols : domainCols)}>{t('resetColumns')}</MenuItem>
          </Menu>
          <Menu align="right" panelClassName="w-48" trigger={() => <button type="button" aria-label={t('changeIndicators')} className="grid h-9 w-9 place-items-center rounded-lg border border-nuw-line text-zinc-500">%</button>}>
            <p className="px-2 py-1 text-[11px] text-zinc-400">{t('changeIndicators')}</p>
            <MenuItem active={indicators === 'default'} onSelect={() => setIndicators('default')}>{t('defaultIndicators')}</MenuItem>
            <MenuItem active={indicators === 'indicators'} onSelect={() => setIndicators('indicators')}>{t('indicatorsOnly')}</MenuItem>
            <MenuItem active={indicators === 'none'} onSelect={() => setIndicators('none')}>{t('none')}</MenuItem>
          </Menu>
          <Menu align="right" panelClassName="w-36" trigger={() => <button type="button" aria-label={t('export')} className="grid h-9 w-9 place-items-center rounded-lg border border-nuw-line text-zinc-500"><Download className="h-4 w-4" /></button>}>
            <p className="px-2 py-1 text-[11px] text-zinc-400">{t('export')}</p>
            <MenuItem onSelect={() => exportRows('csv')}>{t('csv')}</MenuItem>
            <MenuItem onSelect={() => exportRows('xlsx')}>{t('xlsx')}</MenuItem>
            <MenuItem onSelect={() => exportRows('json')}>{t('json')}</MenuItem>
          </Menu>
        </div>

        {view.reason ? (
          <div className="mt-6 rounded-xl border border-dashed border-nuw-line px-4 py-8 text-[13px] text-zinc-600">
            <p>
              {view.reason === 'search' ? t('searchEmpty', { query: query.trim(), brand: brand.name }) : null}
              {view.reason === 'filters' ? t('filterEmpty', { brand: brand.name }) : null}
              {view.reason === 'trend' ? t('trendEmpty', { direction: t(sort.mode === 'up' ? 'up' : 'down'), column: colLabel(sort.key) }) : null}
              {view.reason === 'trendNone' ? t('trendNone', { column: colLabel(sort.key) }) : null}
            </p>
            {view.reason === 'search' ? <button type="button" onClick={() => setQuery('')} className="mt-3 font-medium text-nuw-primary">{t('clearSearch')}</button> : null}
            {view.reason === 'filters' ? (
              <button type="button" onClick={() => { setMinCompetitors(1); setDomainTypes(null); setUrlTypeFilter(null); setMentionIds(null); setQuery('') }} className="mt-3 font-medium text-nuw-primary">{t('resetList')}</button>
            ) : null}
            {view.reason === 'trend' || view.reason === 'trendNone' ? (
              <button type="button" onClick={() => setSort({ key: 'retrievals', mode: 'desc' })} className="mt-3 font-medium text-nuw-primary">{t('valueHigh')}</button>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-nuw-line text-[12px] text-zinc-500">
                  <th className="w-10 px-3 py-2"><input type="checkbox" aria-label={t('selectPage')} checked={view.rows.length > 0 && view.rows.every((item) => selected.includes(item.id))} onChange={(event) => setSelected(event.target.checked ? view.rows.map((item) => item.id) : [])} /></th>
                  <th className="w-10 px-2 py-2">#</th>
                  <th className="min-w-[220px] px-2 py-2">{board === 'url' ? t('url') : t('source')}</th>
                  {columns.map((id) => (
                    <th key={id} className="px-2 py-2">
                      {sortable.has(id) ? (
                        <Menu panelClassName="w-48" trigger={() => <button type="button" className="inline-flex items-center gap-1 font-medium">{colLabel(id)} <ChevronDown className="h-3 w-3 text-zinc-400" /></button>}>
                          <p className="px-2 py-1 text-[11px] text-zinc-400">{t('sortBy')}</p>
                          <MenuItem active={sort.key === id && sort.mode === 'desc'} onSelect={() => setSort({ key: id, mode: 'desc' })}>{t('valueHigh')}</MenuItem>
                          <MenuItem active={sort.key === id && sort.mode === 'asc'} onSelect={() => setSort({ key: id, mode: 'asc' })}>{t('valueLow')}</MenuItem>
                          <MenuItem active={sort.key === id && sort.mode === 'up'} onSelect={() => setSort({ key: id, mode: 'up' })}>{t('positiveTrend')}</MenuItem>
                          <MenuItem active={sort.key === id && sort.mode === 'down'} onSelect={() => setSort({ key: id, mode: 'down' })}>{t('negativeTrend')}</MenuItem>
                        </Menu>
                      ) : colLabel(id)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {view.rows.map((item, index) => (
                  <tr key={item.id} className="border-b border-nuw-line">
                    <td className="px-3 py-3"><input type="checkbox" aria-label={t('selectRow')} checked={selected.includes(item.id)} onChange={() => setSelected((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} /></td>
                    <td className="px-2 py-3 text-zinc-400">{index + 1}</td>
                    <td className="px-2 py-3">
                      <Link href={item.href} className="inline-flex items-center gap-2 font-medium text-zinc-800">
                        <Favicon host={item.host} />
                        {board === 'url' ? (
                          <span className="min-w-0">
                            <span className="block truncate">{item.title}</span>
                            <span className="block truncate text-[12px] font-normal text-zinc-400">{item.host}{item.path}</span>
                          </span>
                        ) : item.host}
                      </Link>
                    </td>
                    {columns.map((id) => (
                      <td key={id} className="whitespace-nowrap px-2 py-3">
                        {id === 'type' ? (
                          <TypeEditor
                            current={item.domainType}
                            groups={[
                              { title: t('builtIn'), ids: builtInKinds },
                              { title: t('otherGroup'), ids: [...otherKinds, ...customTypes.map((entry) => entry.id)] },
                            ]}
                            labelFor={labelFor}
                            colorFor={colorFor}
                            onSelect={(typeId) => assignDomainType(item.id, typeId)}
                            onOnly={(typeId) => setDomainTypes([typeId])}
                            onCreate={async (name) => {
                              const id = await createType('domain', name)
                              if (id) assignDomainType(item.id, id)
                            }}
                          />
                        ) : null}
                        {id === 'urlType' && item.urlType ? (
                          <TypeEditor
                            current={item.urlType}
                            groups={[{ title: t('builtIn'), ids: [...urlTypes, ...customUrlTypes.map((entry) => entry.id)] }]}
                            labelFor={labelFor}
                            colorFor={colorFor}
                            onSelect={(typeId) => assignUrlType(item.id, typeId)}
                            onOnly={(typeId) => setUrlTypeFilter([typeId])}
                            onCreate={async (name) => {
                              const id = await createType('url', name)
                              if (id) assignUrlType(item.id, id)
                            }}
                          />
                        ) : null}
                        {id === 'tags' ? (
                          <TagEditor
                            tags={item.tags}
                            known={knownTags}
                            labelFor={labelFor}
                            onToggle={(tag) => setRowTags(item.id, item.tags.includes(tag) ? item.tags.filter((value) => value !== tag) : [...item.tags, tag])}
                            onCreate={async (name) => {
                              if (!name.trim()) return
                              try {
                                const tag = await createTag(name.trim())
                                if (!item.tags.includes(tag.id)) setRowTags(item.id, [...item.tags, tag.id])
                              } catch (caught) {
                                fail(caught)
                              }
                            }}
                          />
                        ) : null}
                        {id === 'mentions' ? (
                          <span className="inline-flex gap-1">
                            {item.mentions.map((mention) => {
                              const mark = marks.find((entry) => entry.id === mention)
                              return mark ? <span key={mention} title={mark.name}><BrandMark initials={mark.initials} color={mark.color} size={16} /></span> : null
                            })}
                          </span>
                        ) : null}
                        {id === 'retrievals' ? <Delta value={item.retrievals} delta={item.retrievalDelta} mode={indicators} /> : null}
                        {id === 'retrieved' ? <Delta value={item.retrieved} delta={item.retrievedDelta} mode={indicators} suffix="%" /> : null}
                        {id === 'cited' ? <Delta value={item.cited} delta={item.citedDelta} mode={indicators} suffix="%" /> : null}
                        {id === 'retrievalRate' ? item.retrievalRate.toFixed(1) : null}
                        {id === 'citationRate' ? item.citationRate.toFixed(1) : null}
                        {id === 'gap' ? item.gapScore : null}
                        {id === 'citations' ? item.totalCitations : null}
                        {id === 'share' ? `${item.citationShare}%` : null}
                        {id === 'updated' ? <Updated hours={item.updatedHours} days={item.updatedDays} /> : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[12px] text-zinc-500">{selected.length ? t('selectedCount', { count: selected.length }) : t('itemCount', { count: view.rows.length })}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Updated({ hours, days }: { hours: number | null; days: number | null }) {
  const t = useTranslations('gaps.page')
  if (hours) return t('hoursAgo', { count: hours })
  if (days && days >= 30) return t('monthsAgo', { count: Math.round(days / 30) })
  if (days) return t('daysAgo', { count: days })
  return 'N/A'
}

function Delta({ value, delta, mode, suffix = '' }: { value: number; delta: number | null; mode: Indicator; suffix?: string }) {
  const shown = suffix === '%' ? value.toFixed(1) : String(value)
  const change = delta != null && delta !== 0 ? delta : null
  if (mode === 'indicators') {
    if (change == null) return <span className="tabular-nums">{shown}{suffix}</span>
    return <span className={change > 0 ? 'text-emerald-600' : 'text-rose-500'}>{change > 0 ? '↑' : '↓'}</span>
  }
  return (
    <span className="tabular-nums">
      {shown}{suffix}
      {mode === 'default' && change != null ? <span className={change > 0 ? 'text-emerald-600' : 'text-rose-500'}>{` ${change > 0 ? '+' : ''}${change}${suffix}`}</span> : null}
    </span>
  )
}

function ColumnCheck({ id, label, columns, setColumns, order }: { id: ColId; label: string; columns: ColId[]; setColumns: (value: ColId[]) => void; order: ColId[] }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-zinc-50">
      <input type="checkbox" checked={columns.includes(id)} onChange={() => setColumns(columns.includes(id) ? columns.filter((item) => item !== id) : order.filter((item) => item === id || columns.includes(item)))} />
      {label}
    </label>
  )
}

function TypeFilter({
  label, allLabel, selected, groups, labelFor, colorFor, onChange,
}: {
  label: string
  allLabel: string
  selected: string[] | null
  groups: { title: string; ids: string[] }[]
  labelFor: (id: string) => string
  colorFor: (id: string) => string
  onChange: (ids: string[] | null) => void
}) {
  const t = useTranslations('gaps.page')
  const [query, setQuery] = useState('')
  const all = groups.flatMap((group) => group.ids)
  const active = selected ?? all
  const needle = query.trim().toLowerCase()
  return (
    <Menu panelClassName="w-64" trigger={() => <button type="button" className={cn('inline-flex h-9 items-center gap-1 rounded-lg border px-2 text-[13px]', selected ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-nuw-line')}>{label} <ChevronDown className="h-3.5 w-3.5 text-zinc-400" /></button>}>
      <TypeFilterBody
        allLabel={allLabel}
        selected={selected}
        groups={groups}
        labelFor={labelFor}
        colorFor={colorFor}
        needle={needle}
        query={query}
        setQuery={setQuery}
        active={active}
        all={all}
        onChange={onChange}
        empty={t('noTypeMatch')}
        only={t('only')}
        placeholder={t('searchOrCreateType')}
      />
    </Menu>
  )
}

function TypeFilterBody(props: {
  allLabel: string
  selected: string[] | null
  groups: { title: string; ids: string[] }[]
  labelFor: (id: string) => string
  colorFor: (id: string) => string
  needle: string
  query: string
  setQuery: (value: string) => void
  active: string[]
  all: string[]
  onChange: (ids: string[] | null) => void
  empty: string
  only: string
  placeholder: string
}) {
  const { close } = useMenu()
  const shown = props.groups.map((group) => ({ ...group, ids: group.ids.filter((id) => props.labelFor(id).toLowerCase().includes(props.needle)) })).filter((group) => group.ids.length)
  return (
    <>
      <label className="mb-1 flex items-center gap-2 px-2"><Search className="h-3.5 w-3.5 text-zinc-400" /><input value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder={props.placeholder} className="w-full bg-transparent text-[13px] outline-none" /></label>
      <button type="button" onClick={() => props.onChange(null)} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-50">{props.allLabel} {props.selected === null ? <Check className="h-3.5 w-3.5" /> : null}</button>
      {shown.length === 0 ? <p className="px-2 py-2 text-[13px] text-zinc-500">{props.empty}</p> : shown.map((group) => (
        <div key={group.title}>
          <p className="px-2 py-1 text-[11px] text-zinc-400">{group.title}</p>
          {group.ids.map((id) => (
            <div key={id} className="group flex items-center rounded-lg hover:bg-zinc-50">
              <button type="button" onClick={() => {
                const next = props.active.includes(id) ? props.active.filter((item) => item !== id) : [...props.active, id]
                props.onChange(next.length === props.all.length ? null : next)
              }} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-[13px]">
                <span className={cn('grid h-4 w-4 place-items-center rounded border text-[10px] text-white', props.active.includes(id) ? 'border-sky-500 bg-sky-500' : 'border-zinc-300')}>{props.active.includes(id) ? '✓' : ''}</span>
                <span style={{ color: props.colorFor(id) }}>{props.labelFor(id)}</span>
              </button>
              <button type="button" onClick={() => { props.onChange([id]); close() }} className="mr-2 hidden text-[12px] text-zinc-500 group-hover:inline">{props.only}</button>
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

function TypeEditor({
  current, groups, labelFor, colorFor, onSelect, onOnly, onCreate,
}: {
  current: string
  groups: { title: string; ids: string[] }[]
  labelFor: (id: string) => string
  colorFor: (id: string) => string
  onSelect: (id: string) => void
  onOnly: (id: string) => void
  onCreate: (name: string) => void
}) {
  return (
    <Menu panelClassName="w-64" trigger={() => (
      <button type="button" className="rounded-md px-2 py-0.5 text-[12px] font-medium" style={{ color: colorFor(current), backgroundColor: `${colorFor(current)}22` }}>{labelFor(current)}</button>
    )}>
      <TypeEditorPanel current={current} groups={groups} labelFor={labelFor} colorFor={colorFor} onSelect={onSelect} onOnly={onOnly} onCreate={onCreate} />
    </Menu>
  )
}

function TypeEditorPanel({
  current, groups, labelFor, colorFor, onSelect, onOnly, onCreate,
}: {
  current: string
  groups: { title: string; ids: string[] }[]
  labelFor: (id: string) => string
  colorFor: (id: string) => string
  onSelect: (id: string) => void
  onOnly: (id: string) => void
  onCreate: (name: string) => void
}) {
  const t = useTranslations('gaps.page')
  const { close } = useMenu()
  const [draft, setDraft] = useState('')
  const needle = draft.trim().toLowerCase()
  const shown = groups.map((group) => ({ ...group, ids: group.ids.filter((id) => labelFor(id).toLowerCase().includes(needle)) })).filter((group) => group.ids.length)
  const canCreate = needle.length > 0 && !groups.some((group) => group.ids.some((id) => labelFor(id).toLowerCase() === needle))
  return (
    <>
      <label className="mb-1 flex items-center gap-2 px-2"><Search className="h-3.5 w-3.5 text-zinc-400" /><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t('searchOrCreateType')} className="w-full bg-transparent text-[13px] outline-none" /></label>
      {shown.length === 0 && !canCreate ? <p className="px-2 py-2 text-[13px] text-zinc-500">{t('startType')}</p> : null}
      {shown.map((group) => (
        <div key={group.title}>
          <p className="px-2 py-1 text-[11px] text-zinc-400">{group.title}</p>
          {group.ids.map((id) => (
            <div key={id} className="group flex items-center rounded-lg hover:bg-zinc-50">
              <button type="button" onClick={() => { onSelect(id); close() }} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-[13px]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colorFor(id) }} />
                <span style={{ color: colorFor(id) }}>{labelFor(id)}</span>
                {id === current ? <Check className="ml-auto h-3.5 w-3.5 text-zinc-500" /> : null}
              </button>
              <button type="button" onClick={() => { onOnly(id); close() }} className="mr-2 hidden text-[12px] text-zinc-500 group-hover:inline">{t('only')}</button>
            </div>
          ))}
        </div>
      ))}
      {canCreate ? <button type="button" onClick={() => { onCreate(draft.trim()); close() }} className="mt-1 w-full rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-50">{t('createType', { name: draft.trim() })}</button> : null}
      {!draft.trim() && shown.length > 0 ? <p className="px-2 py-2 text-[12px] text-zinc-400">{t('startType')}</p> : null}
    </>
  )
}

function TagEditor({
  tags, known, labelFor, onToggle, onCreate,
}: {
  tags: string[]
  known: string[]
  labelFor: (id: string) => string
  onToggle: (tag: string) => void
  onCreate: (name: string) => void
}) {
  const t = useTranslations('gaps.page')
  return (
    <span className="inline-flex items-center gap-1">
      {tags.map((tag) => <span key={tag} className="rounded-full bg-sky-50 px-2 py-0.5 text-[12px] text-sky-700">{labelFor(tag)}</span>)}
      <Menu panelClassName="w-56" trigger={() => <button type="button" className="text-[12px] text-zinc-400">{t('addTags')}</button>}>
        <TagEditorPanel tags={tags} known={known} labelFor={labelFor} onToggle={onToggle} onCreate={onCreate} />
      </Menu>
    </span>
  )
}

function TagEditorPanel({
  tags, known, labelFor, onToggle, onCreate,
}: {
  tags: string[]
  known: string[]
  labelFor: (id: string) => string
  onToggle: (tag: string) => void
  onCreate: (name: string) => void
}) {
  const t = useTranslations('gaps.page')
  const { close } = useMenu()
  const [draft, setDraft] = useState('')
  const needle = draft.trim().toLowerCase()
  const shown = known.filter((tag) => labelFor(tag).toLowerCase().includes(needle))
  const canCreate = needle.length > 0 && !known.some((tag) => tag.toLowerCase() === needle || labelFor(tag).toLowerCase() === needle)
  return (
    <>
      <label className="mb-1 flex items-center gap-2 px-2"><Search className="h-3.5 w-3.5 text-zinc-400" /><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t('searchOrCreateTags')} className="w-full bg-transparent text-[13px] outline-none" /></label>
        {!draft.trim() ? <p className="px-2 py-2 text-[13px] text-zinc-500">{t('startTag')}</p> : null}
        {shown.map((tag) => (
          <button key={tag} type="button" onClick={() => onToggle(tag)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-zinc-50">
            <span className={cn('grid h-4 w-4 place-items-center rounded border text-[10px] text-white', tags.includes(tag) ? 'border-sky-500 bg-sky-500' : 'border-zinc-300')}>{tags.includes(tag) ? '✓' : ''}</span>
            {labelFor(tag)}
          </button>
        ))}
        {canCreate ? <button type="button" onClick={() => { onCreate(draft.trim()); setDraft(''); close() }} className="mt-1 w-full rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-50">{t('createTag', { name: draft.trim() })}</button> : null}
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
  const t = useTranslations('gaps.page')
  const [query, setQuery] = useState('')
  const shown = marks.filter((mark) => mark.name.toLowerCase().includes(query.trim().toLowerCase()))
  const active = selected ?? marks.map((mark) => mark.id)
  return (
    <Menu panelClassName="w-64" trigger={() => <button type="button" className="inline-flex h-9 items-center gap-1 rounded-lg border border-nuw-line px-2 text-[13px]">{selected ? t('brandsSelected', { count: selected.length }) : t('allBrands')} <ChevronDown className="h-3.5 w-3.5 text-zinc-400" /></button>}>
      <label className="mb-1 flex items-center gap-2 px-2"><Search className="h-3.5 w-3.5 text-zinc-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchBrands')} className="w-full bg-transparent text-[13px] outline-none" /></label>
      <button type="button" onClick={() => onChange(null)} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-50">{t('allBrands')} {selected === null ? <Check className="h-3.5 w-3.5" /> : null}</button>
      <div className="my-1 grid grid-cols-2 gap-1 px-2">
        {(['or', 'and'] as const).map((id) => (
          <button key={id} type="button" onClick={() => onMode(id)} className={cn('h-8 rounded-lg text-[13px]', mode === id ? 'bg-white shadow-sm ring-1 ring-zinc-200' : 'bg-zinc-100 text-zinc-500')}>{t(id)}</button>
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
