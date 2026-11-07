'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Check, ChevronDown, Info, MoreHorizontal, X } from 'lucide-react'
import type { Brand, DimensionKey, MetricKey } from '@/data/types'
import { dimensionMembers } from '@/data/types'
import { useBrand } from '@/components/workspace/workspace-context'
import { usePrompts } from '@/components/prompts/prompts-context'
import { MetricSwitcher } from '@/components/overview/metric-switcher'
import { LineChart } from '@/components/overview/line-chart'
import { Menu, useMenu, useToast } from '@/components/ui/overlay'
import { formatDelta, formatMetricValue } from '@/lib/format'
import { cn } from '@/lib/cn'
import { InsightMatrix, type Choice } from '@/components/insights/insight-matrix'
import { useCatalog } from '@/lib/catalog'
import { InsightRankings } from '@/components/insights/insight-rankings'

const ranges = ['all', '7', '14', '30', '90', '180', '365', 'custom'] as const
type RangeId = (typeof ranges)[number]
const compares = ['prev', 'month', 'year'] as const
type CompareId = (typeof compares)[number]
const periods = ['d', 'w', 'm'] as const
const heroMetrics: MetricKey[] = ['visibility', 'sov', 'source', 'sentiment', 'position', 'winRate']
const chartMetrics: MetricKey[] = ['visibility', 'sentiment', 'position', 'sov', 'winRate']
const monthStartPad = 3

export function InsightsScreen() {
  const t = useTranslations('insights.page')
  const overview = useTranslations('overview.page')
  const locale = useLocale()
  const brand = useBrand()
  const hasBrandData = Boolean(brand.id || brand.name.trim() || brand.domain.trim())
  const { tags: promptTags, topics: promptTopics } = usePrompts()
  const { push } = useToast()
  const [range, setRange] = useState<RangeId>('all')
  const [compare, setCompare] = useState<CompareId>('prev')
  const [models, setModels] = useState<Choice>(null)
  const [tags, setTags] = useState<Choice>(null)
  const [topics, setTopics] = useState<Choice>(null)
  const [tagMode, setTagMode] = useState<'or' | 'and'>('or')
  const [brandIds, setBrandIds] = useState<Choice>(null)
  const [brandQuery, setBrandQuery] = useState('')
  const [filterPane, setFilterPane] = useState<'tags' | 'models' | 'topics'>('tags')
  const [filterQuery, setFilterQuery] = useState('')
  const [metric, setMetric] = useState<MetricKey>('visibility')
  const [period, setPeriod] = useState<(typeof periods)[number]>('d')

  const labelFor = (dimension: DimensionKey, id: string) => {
    if (dimension === 'brands') return brand.competitors.find((item) => item.id === id)?.name ?? id
    if (dimension === 'tags') {
      const name = promptTags.find((tag) => tag.id === id)?.name?.trim()
      if (name) return name
    }
    if (dimension === 'topics') {
      const name = promptTopics.find((topic) => topic.id === id)?.name?.trim()
      if (name) return name
    }
    if (dimension === 'models' && (id === 'copilot' || id === 'naver' || id === 'luna' || id === 'qwen')) return t.has(id) ? t(id) : id
    if (dimensionMembers[dimension].includes(id)) {
      const key = `${dimension}.${id}`
      if (overview.has(key)) return overview(key)
    }
    return id
  }

  const filterCount = [models, tags, topics].filter((list) => list !== null).length
  const dirty = range !== 'all' || filterCount > 0 || brandIds !== null
  const points = brand.series.filter((point) => point?.date)
  const dates = points.map((point) => point.date)
  const weekly = dates.map((_, index) => index).filter((index) => index % 2 === 0)
  if (period === 'w' && dates.length && weekly[weekly.length - 1] !== dates.length - 1) weekly.push(dates.length - 1)
  const visibleIndexes = period === 'm' ? (points.length ? [0, points.length - 1].filter((index, place, list) => list.indexOf(index) === place) : []) : period === 'w' ? weekly : dates.map((_, index) => index)

  const reset = () => {
    setRange('all')
    setCompare('prev')
    setModels(null)
    setTags(null)
    setTopics(null)
    setTagMode('or')
    setBrandIds(null)
    setBrandQuery('')
    setFilterQuery('')
  }

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <Menu
          panelClassName="w-56"
          trigger={() => (
            <button type="button" className="flex h-8 items-center gap-1.5 rounded-lg border border-nuw-line bg-white px-2.5 text-[13px]">
              {t('view')} <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            </button>
          )}
        >
          <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('savedViews')}</p>
          <p className="flex items-center gap-2 rounded-lg bg-zinc-100 px-2 py-2 text-[13px] font-medium">
            <Check className="h-3.5 w-3.5" /> {t('view')}
          </p>
          <p className="px-2 py-2 text-[12px] leading-5 text-zinc-500">{t('onlyView')}</p>
        </Menu>
        <BrandMenu
          brand={brand}
          brandIds={brandIds}
          query={brandQuery}
          onQuery={setBrandQuery}
          onChange={setBrandIds}
          onAdd={() => push({ title: t('addBrandTitle'), body: t('addBrandBody') })}
          labelFor={labelFor}
        />
        <Menu
          panelClassName="w-[560px] p-0"
          trigger={() => (
            <button type="button" className="flex h-8 items-center gap-1.5 rounded-lg border border-nuw-line bg-white px-2.5 text-[13px]">
              {t(range === 'all' ? 'timeAll' : range === 'custom' ? 'custom' : `time${range}`)}
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            </button>
          )}
        >
          <div className="grid md:grid-cols-[200px_1fr]">
            <div className="border-b border-nuw-line p-2 md:border-b-0 md:border-r">
              {ranges.map((id) => (
                <RangeOption key={id} active={range === id} onPick={() => setRange(id)}>
                  {t(id === 'all' ? 'timeAll' : id === 'custom' ? 'custom' : `time${id}`)}
                </RangeOption>
              ))}
            </div>
            <div className="p-3">
              <div className="mb-3 flex gap-1 text-[12px]">
                {compares.map((id) => (
                  <button key={id} type="button" onClick={() => setCompare(id)} className={cn('rounded-md px-2 py-1', compare === id ? 'bg-nuw-primary font-medium text-white' : 'text-nuw-olive hover:bg-[#FFF1E6]')}>
                    {t(id === 'prev' ? 'vsPrev' : id === 'month' ? 'vsMonth' : 'vsYear')}
                  </button>
                ))}
              </div>
              <p className="mb-2 text-[12px] font-medium text-zinc-500">{t('selectRange')}</p>
              <OctoberCalendar />
              <p className="mt-3 text-[12px] text-zinc-500">{t('compareLine')}</p>
              <p className="mt-1 text-[12px] leading-5 text-zinc-500">{t('sampleRange')}</p>
            </div>
          </div>
        </Menu>
        <Menu
          align="right"
          panelClassName="w-[420px] p-0"
          trigger={() => (
            <button type="button" className="flex h-8 items-center gap-1.5 rounded-lg border border-nuw-line bg-white px-2.5 text-[13px]">
              {t('filters')}
              {filterCount ? <span className="rounded bg-zinc-100 px-1.5 text-[11px]">{filterCount}</span> : null}
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            </button>
          )}
        >
          <div className="grid grid-cols-[150px_1fr]">
            <div className="border-r border-nuw-line p-2">
              <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('filterBy')}</p>
              {(['tags', 'models', 'topics'] as const).map((id) => (
                <button key={id} type="button" onClick={() => setFilterPane(id)} className={cn('flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100', filterPane === id && 'bg-zinc-100')}>
                  {t(id)} <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-zinc-400" />
                </button>
              ))}
              <button type="button" onClick={() => { setModels(null); setTags(null); setTopics(null); setFilterQuery('') }} className="mt-1 w-full rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100">
                {t('resetFilters')}
              </button>
            </div>
            <FilterPane
              pane={filterPane}
              models={models}
              tags={tags}
              topics={topics}
              tagMode={tagMode}
              query={filterQuery}
              onQuery={setFilterQuery}
              onMode={setTagMode}
              onModels={setModels}
              onTags={setTags}
              onTopics={setTopics}
              onUpgrade={() => push({ title: t('upgradeTitle'), body: t('upgradeBody') })}
              labelFor={labelFor}
            />
          </div>
        </Menu>
        {dirty ? (
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={reset} className="h-8 rounded-lg px-2 text-[13px] text-zinc-600 hover:bg-zinc-100">{t('reset')}</button>
            <button type="button" onClick={() => push({ title: t('savedTitle'), body: t('savedBody') })} className="h-8 rounded-lg bg-nuw-button px-3 text-[13px] text-white hover:bg-nuw-buttonHover">{t('save')}</button>
          </div>
        ) : null}
      </div>
      <ChipRow models={models} tags={tags} topics={topics} labelFor={labelFor} onClear={(key) => {
        if (key === 'models') setModels(null)
        if (key === 'tags') setTags(null)
        if (key === 'topics') setTopics(null)
      }} />

      <section>
        <h2 className="text-[22px] font-semibold tracking-tight">{t('headline')}</h2>
        <p className="mt-1 text-[13px] text-zinc-500">{t('headlineBody')}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {heroMetrics.map((item) => (
            <MetricStat key={item} metric={item} locale={locale} brand={brand} ready={hasBrandData} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-nuw-line bg-white">
        <header className="flex flex-wrap items-center gap-2 px-4 py-3">
          <div>
            <h2 className="text-[15px] font-semibold">{t('chartTitle')}</h2>
            <p className="text-[12px] text-zinc-500">{t('chartBody')}</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <MetricSwitcher value={metric} onChange={setMetric} metrics={chartMetrics} label={(item) => overview(`metric.${item}`)} />
            <div className="flex h-7 items-center gap-0.5 text-[12px]">
              {periods.map((item) => (
                <button key={item} type="button" aria-label={t(item === 'd' ? 'day' : item === 'w' ? 'week' : 'month')} onClick={() => setPeriod(item)} className={cn('h-7 rounded-md px-2 uppercase', period === item ? 'bg-nuw-primary font-medium text-white' : 'text-nuw-olive hover:bg-[#FFF1E6] hover:text-black')}>
                  {overview(`period.${item}`)}
                </button>
              ))}
            </div>
            <button type="button" aria-label={t('chartMore')} onClick={() => push({ title: t('chartMore'), body: t('chartMoreBody') })} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="px-3">
          <LineChart
            dates={visibleIndexes.map((index) => dates[index])}
            dateLabels={period === 'm' ? [t('monthLabel')] : undefined}
            todayLabel={overview('createdToday')}
            series={[
              { id: 'main', label: overview(`metric.${metric}`), values: visibleIndexes.map((index) => points[index]?.[metric] ?? 0), color: '#E85D0C' },
              { id: 'source', label: t('usedAsSource'), values: visibleIndexes.map((index) => points[index]?.source ?? 0), color: '#71717a', axis: 'right' },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 px-4 pb-4 text-[12px] text-zinc-500">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-nuw-primary" />{overview(`metric.${metric}`)}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-zinc-500" />{brand.domain}</span>
          <span>{t('yourDomain')}</span>
        </div>
        {range !== 'all' || filterCount ? <p className="px-4 pb-4 text-[12px] leading-5 text-zinc-500">{range !== 'all' ? t('sampleRange') : t('applied')}</p> : null}
      </section>

      <InsightMatrix brand={brand} filter={{ models, tags, topics }} labelFor={labelFor} />
      <InsightRankings brand={brand} brandIds={brandIds} labelFor={labelFor} />
    </div>
  )
}

function MetricStat({ metric, locale, brand, ready }: { metric: MetricKey; locale: string; brand: Brand; ready: boolean }) {
  const t = useTranslations('insights.page')
  const overview = useTranslations('overview.page')
  const { push } = useToast()
  const item = brand.metrics[metric]
  return (
    <div>
      <HelpLabel label={overview(`metric.${metric}`)} help={overview(`metricHelp.${metric}`)} learn={t('learnMore')} onLearn={() => push({ title: t('learnTitle'), body: t('learnBody') })} />
      <p className="mt-1 flex items-baseline gap-2">
        <span className="inline-flex items-center gap-1.5 text-[20px] font-semibold tracking-tight">
          {metric === 'sentiment' ? <span className="h-2 w-2 rounded-full bg-[#0f9f6e]" /> : null}
          {ready ? formatMetricValue(metric, item.value, locale) : t('notAvailable')}
        </span>
        {item.delta !== undefined ? (
          <span className={cn('text-[12px] font-medium', item.tone === 'bad' ? 'text-[#e11d48]' : 'text-[#0f9f6e]')}>{formatDelta(metric, item.delta, locale)}</span>
        ) : null}
      </p>
    </div>
  )
}

function HelpLabel({ label, help, learn, onLearn }: { label: string; help: string; learn: string; onLearn: () => void }) {
  return (
    <span className="group/help relative inline-flex items-center gap-1 text-[12px] text-zinc-500">
      {label}
      <Info className="h-3.5 w-3.5 text-zinc-400" />
      <span className="invisible absolute left-0 top-full z-30 mt-1 w-64 rounded-lg bg-zinc-950 p-3 text-[12px] font-normal leading-5 text-white shadow-menu group-hover/help:visible">
        {help}
        <button type="button" onClick={onLearn} className="mt-2 block text-left text-white underline">{learn}</button>
      </span>
    </span>
  )
}

function ChipRow({
  models,
  tags,
  topics,
  labelFor,
  onClear,
}: {
  models: Choice
  tags: Choice
  topics: Choice
  labelFor: (dimension: DimensionKey, id: string) => string
  onClear: (key: 'models' | 'tags' | 'topics') => void
}) {
  const t = useTranslations('insights.page')
  const chips = [
    models ? { key: 'models' as const, name: t('models'), sample: labelFor('models', models[0] ?? ''), extra: Math.max(0, models.length - 1) } : null,
    tags ? { key: 'tags' as const, name: t('tags'), sample: labelFor('tags', tags[0] ?? ''), extra: Math.max(0, tags.length - 1) } : null,
    topics ? { key: 'topics' as const, name: t('topics'), sample: labelFor('topics', topics[0] ?? ''), extra: Math.max(0, topics.length - 1) } : null,
  ].filter((item) => item !== null)

  if (!chips.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button key={chip.key} type="button" onClick={() => onClear(chip.key)} className="inline-flex h-7 items-center gap-1 rounded-lg border border-nuw-line bg-white px-2 text-[12px]">
          {chip.name} · {chip.sample || t('filterEmpty')}{chip.extra ? ` +${chip.extra}` : ''}
          <X className="h-3 w-3 text-zinc-400" />
          <span className="sr-only">{t('clearChip', { name: chip.name })}</span>
        </button>
      ))}
    </div>
  )
}

function BrandMenu({
  brand,
  brandIds,
  query,
  onQuery,
  onChange,
  onAdd,
  labelFor,
}: {
  brand: Brand
  brandIds: Choice
  query: string
  onQuery: (value: string) => void
  onChange: (value: Choice) => void
  onAdd: () => void
  labelFor: (dimension: DimensionKey, id: string) => string
}) {
  const t = useTranslations('insights.page')
  const ids = brand.competitors.map((item) => item.id)
  const needle = query.trim().toLowerCase()
  const visible = brand.competitors.filter((item) => item.id !== brand.id && item.name.toLowerCase().includes(needle))
  const checked = (id: string) => brandIds === null || brandIds.includes(id)
  const triggerLabel = brandIds === null ? brand.name : brandIds.length === 0 ? t('noBrandsShort') : t('brandsSelected', { count: brandIds.length })

  const toggle = (id: string) => {
    const current = brandIds ?? ids
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    onChange(next.length === ids.length ? null : next)
  }

  return (
    <Menu
      panelClassName="w-64 p-2"
      trigger={() => (
        <button type="button" className="flex h-8 items-center gap-1.5 rounded-lg border border-nuw-line bg-white px-2.5 text-[13px]">
          {triggerLabel} <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
        </button>
      )}
    >
      <label className="mb-1 flex items-center gap-2 rounded-lg border border-nuw-line px-2 py-1.5">
        <span className="sr-only">{t('searchBrands')}</span>
        <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder={t('searchBrands')} className="w-full bg-transparent text-[13px] outline-none" />
      </label>
      <label className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] hover:bg-zinc-50">
        <input type="checkbox" checked={brandIds === null} onChange={() => onChange(brandIds === null ? [] : null)} />
        {t('allBrands')}
      </label>
      <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('trackedBrand')}</p>
      <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-medium hover:bg-zinc-50">
        <input type="checkbox" checked={checked(brand.id)} onChange={() => toggle(brand.id)} />
        <span className="truncate">{brand.name}</span>
        <span className="rounded bg-emerald-100 px-1 text-[10px] text-emerald-700">{t('you')}</span>
      </label>
      {brandIds?.length === 0 ? <p className="px-2 py-2 text-[12px] leading-5 text-zinc-600">{t('noBrands')}</p> : null}
      <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('allBrands')}</p>
      {visible.length === 0 ? <p className="px-2 py-2 text-[12px] text-zinc-500">{t('filterEmpty')}</p> : null}
      {visible.map((item) => (
        <label key={item.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-zinc-50">
          <input type="checkbox" checked={checked(item.id)} onChange={() => toggle(item.id)} />
          <span className="truncate">{item.name}</span>
          {item.id === brand.id ? <span className="rounded bg-emerald-100 px-1 text-[10px] text-emerald-700">{t('you')}</span> : null}
        </label>
      ))}
      <button type="button" onClick={onAdd} className="mt-1 w-full rounded-lg px-2 py-2 text-left text-[13px] text-nuw-button hover:bg-zinc-50">
        + {t('addBrand')}
      </button>
      <span className="sr-only">{labelFor('brands', brand.id)}</span>
    </Menu>
  )
}

function FilterPane({
  pane,
  models,
  tags,
  topics,
  tagMode,
  query,
  onQuery,
  onMode,
  onModels,
  onTags,
  onTopics,
  onUpgrade,
  labelFor,
}: {
  pane: 'tags' | 'models' | 'topics'
  models: Choice
  tags: Choice
  topics: Choice
  tagMode: 'or' | 'and'
  query: string
  onQuery: (value: string) => void
  onMode: (mode: 'or' | 'and') => void
  onModels: (value: Choice) => void
  onTags: (value: Choice) => void
  onTopics: (value: Choice) => void
  onUpgrade: () => void
  labelFor: (dimension: DimensionKey, id: string) => string
}) {
  const t = useTranslations('insights.page')
  const catalog = useCatalog()
  const needle = query.trim().toLowerCase()

  if (pane === 'models') {
    const activeModels = catalog.active.map((item) => item.id)
    const availableModels = catalog.available.map((item) => item.id)
    const lockedModels = [...catalog.comingSoon, ...catalog.locked]
    const catalogLabel = (id: string) => [...catalog.active, ...catalog.available, ...catalog.comingSoon, ...catalog.locked].find((item) => item.id === id)?.label ?? labelFor('models', id)
    return (
      <div className="max-h-80 overflow-auto p-2">
        <CheckRow label={t('allModels')} checked={models === null} onChange={() => onModels(null)} />
        {catalog.error ? <p className="px-2 py-2 text-[12px] leading-5 text-rose-600">{catalog.error}</p> : null}
        <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('activeModels')}</p>
        {activeModels.map((id) => (
          <ModelRow key={id} label={catalogLabel(id)} checked={models === null || models.includes(id)} onChange={() => onModels(toggleChoice(models, id, [...activeModels, ...availableModels]))} onOnly={() => onModels([id])} onlyLabel={t('only')} />
        ))}
        <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('availableModels')}</p>
        {availableModels.map((id) => (
          <ModelRow key={id} label={catalogLabel(id)} checked={models === null || models.includes(id)} onChange={() => onModels(toggleChoice(models, id, [...activeModels, ...availableModels]))} onOnly={() => onModels([id])} onlyLabel={t('only')} />
        ))}
        {lockedModels.map((item) => (
          <button key={item.id} type="button" onClick={onUpgrade} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[13px] text-zinc-400 hover:bg-zinc-50">
            {item.label} <span className="rounded border border-nuw-line px-1.5 py-0.5 text-[11px]">{item.state === 'coming_soon' ? t('soonBadge') : t('upgrade')}</span>
          </button>
        ))}
      </div>
    )
  }

  const dimension = pane
  const selected = pane === 'tags' ? tags : topics
  const setSelected = pane === 'tags' ? onTags : onTopics
  const all = dimensionMembers[dimension]
  const items = all.filter((id) => labelFor(dimension, id).toLowerCase().includes(needle))
  return (
    <div className="max-h-80 overflow-auto p-2">
      <label className="mb-2 flex items-center gap-2 rounded-lg border border-nuw-line px-2 py-1.5">
        <span className="sr-only">{t('search')}</span>
        <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder={t('search')} className="w-full bg-transparent text-[13px] outline-none" />
      </label>
      <div className="mb-2 flex items-center justify-between gap-2">
        <CheckRow label={pane === 'tags' ? t('allTags') : t('allTopics')} checked={selected === null} onChange={() => setSelected(null)} />
        {pane === 'tags' ? (
          <div className="flex rounded-md bg-zinc-100 p-0.5 text-[12px]">
            {(['or', 'and'] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => onMode(mode)} className={cn('rounded px-2 py-0.5', tagMode === mode ? 'bg-white font-medium shadow-sm' : 'text-zinc-500')}>
                {t(mode)}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {items.length === 0 ? <p className="px-2 py-2 text-[12px] text-zinc-500">{t('filterEmpty')}</p> : null}
      {items.map((id) => (
        <CheckRow key={id} label={labelFor(dimension, id)} checked={selected === null || selected.includes(id)} onChange={() => setSelected(toggleChoice(selected, id, all))} />
      ))}
    </div>
  )
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-zinc-50">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="truncate">{label}</span>
    </label>
  )
}

function ModelRow({ label, checked, onChange, onOnly, onlyLabel }: { label: string; checked: boolean; onChange: () => void; onOnly: () => void; onlyLabel: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1 text-[13px] hover:bg-zinc-50">
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="truncate">{label}</span>
      </label>
      <button type="button" onClick={onOnly} className="rounded px-1.5 py-0.5 text-[11px] text-zinc-500 hover:bg-white">{onlyLabel}</button>
    </div>
  )
}

function RangeOption({ active, onPick, children }: { active: boolean; onPick: () => void; children: string }) {
  const { close } = useMenu()
  return (
    <button type="button" onClick={() => { onPick(); if (children) close() }} className={cn('flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100', active && 'bg-zinc-100 font-medium')}>
      {children}
      {active ? <Check className="h-3.5 w-3.5" /> : null}
    </button>
  )
}

function OctoberCalendar() {
  const days = Array.from({ length: monthStartPad + 31 }, (_, index) => (index < monthStartPad ? null : index - monthStartPad + 1))
  const headers = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
  return (
    <div>
      <p className="mb-2 text-center text-[13px] font-medium">October 2026</p>
      <div className="grid grid-cols-7 gap-1 text-center text-[12px] text-zinc-400">
        {headers.map((day) => <span key={day}>{day}</span>)}
        {days.map((day, index) => {
          const selected = day !== null && day >= 12 && day <= 17
          return (
            <span key={index} className={cn('grid h-7 place-items-center rounded-md', selected && 'bg-nuw-button font-medium text-white', day === null && 'invisible')}>
              {day ?? ''}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function toggleChoice(current: Choice, id: string, all: string[]): Choice {
  const list = current ?? all
  const next = list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
  if (next.length === all.length) return null
  return next
}
