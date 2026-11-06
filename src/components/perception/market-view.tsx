'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { formatChartDate } from '@/lib/format'
import { Check, ChevronDown, Clipboard, Download, ImageIcon, MoreHorizontal, Pencil, Plus, Search, X } from 'lucide-react'
import { fullSourceCount, leadersFor, type AttributeRecord, type HeatBrand, type SourceRecord, type TermRecord } from '@/data/perception'
import { Menu, useMenu, useToast } from '@/components/ui/overlay'
import { Hint, ModelGlyph, Pager, heatStyle } from '@/components/perception/bits'
import { copyTable, downloadFile, toCsv, toExcelXml } from '@/components/perception/export-data'
import { cn } from '@/lib/cn'

const sourcePageSize = 6

export function MarketView({
  brandName,
  industry,
  languageLabel,
  scope,
  attributes,
  terms,
  shapeIds,
  selectedShape,
  heatIds,
  sortBrand,
  sortDir,
  tour,
  onIndustry,
  onLanguage,
  onScope,
  onShapeIds,
  onSelectShape,
  onHeatIds,
  onSort,
  onManage,
  onAdd,
  onInvite,
  heatBrands,
  sources,
  updatedAt,
}: {
  brandName: string
  industry: string
  languageLabel: string
  scope: 'global' | 'national' | 'city'
  attributes: AttributeRecord[]
  terms: TermRecord[]
  shapeIds: string[]
  selectedShape: string | null
  heatIds: string[]
  sortBrand: string
  sortDir: 'asc' | 'desc'
  tour: string | null
  onIndustry: (value: string) => void
  onLanguage: (value: string) => void
  onScope: (value: 'global' | 'national' | 'city') => void
  onShapeIds: (ids: string[]) => void
  onSelectShape: (id: string | null) => void
  onHeatIds: (ids: string[]) => void
  onSort: (brandId: string) => void
  onManage: () => void
  onAdd: () => void
  onInvite: () => void
  heatBrands: HeatBrand[]
  sources: SourceRecord[]
  updatedAt?: string | null
}) {
  const t = useTranslations('perception.page')
  const locale = useLocale()
  const most = [...attributes].filter((item) => item.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]
  const own = heatBrands[0]
  const gap = useMemo(() => {
    if (!own) return null
    const scored = attributes.flatMap((attribute) => {
      const mine = own.scores[attribute.id]
      const rivals = heatBrands.slice(1).map((brand) => brand.scores[attribute.id]).filter((score): score is number => score != null)
      if (mine == null || !rivals.length) return []
      return [{ name: attribute.name, gap: Math.max(...rivals) - mine }]
    })
    if (scored.length < 4) return null
    return [...scored].sort((a, b) => b.gap - a.gap)[0]?.name ?? null
  }, [attributes, heatBrands, own])
  const customCount = attributes.filter((item) => !item.builtin).length
  const top8 = attributes.filter((item) => item.top8).map((item) => item.id)
  const ring = (id: string) => (tour === id ? 'ring-2 ring-zinc-950 ring-offset-2' : '')

  return (
    <div className="space-y-4">
      <section data-tour="summary" className={cn('rounded-2xl border border-nuw-line bg-white p-4', ring('summary'))}>
        <p className="text-[12px] text-zinc-400">{updatedAt ? t('updatedOn', { date: formatChartDate(updatedAt, locale, true) }) : t('updatedNone')}</p>
        <h2 className="mt-1 text-[22px] font-semibold tracking-tight">{most ? t('headlineKnown', { brand: brandName, attribute: most.name }) : t('headline', { brand: brandName })}</h2>
        <p className="mt-1 text-[13px] text-zinc-500">{t('subhead', { brand: brandName })}</p>
        <div className="mt-4 grid gap-3 border-t border-nuw-line pt-3 sm:grid-cols-2 xl:grid-cols-5">
          <Meta
            label={t('industry')}
            value={!industry ? t('industryNotSet') : industry.length > 22 ? `${industry.slice(0, 20)}…` : industry}
            hint={industry ? t('industryHint', { industry }) : t('industryNotSetHint')}
            editLabel={t('editIndustry')}
          >
            <IndustryEditor industry={industry} onSave={onIndustry} />
          </Meta>
          <Meta label={t('language')} value={languageLabel} hint={t('languageHint')} editLabel={t('editLanguage')}>
            <LanguageEditor onPick={onLanguage} />
          </Meta>
          <Meta label={t('targetMarkets')} value={t(scope === 'global' ? 'scopeGlobal' : scope === 'national' ? 'scopeNational' : 'scopeCity')} hint={t('marketHint')} editLabel={t('editMarkets')}>
            <ScopeEditor scope={scope} onPick={onScope} />
          </Meta>
          <Meta label={t('mostAssociated')} value={most?.name ?? t('gapEmpty')} hint={t('mostHint', { brand: brandName })} />
          <Meta label={t('biggestGap')} value={gap ?? t('gapEmpty')} hint={t('gapHint', { brand: brandName })} />
        </div>
        {languageLabel !== 'English' ? <p className="mt-3 text-[12px] leading-5 text-zinc-500">{t('languageNote')}</p> : null}
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <section data-tour="known" className={cn('rounded-2xl border border-nuw-line bg-white', ring('known'))}>
          <header className="flex items-start justify-between gap-3 px-4 pb-2 pt-4">
            <div>
              <h2 className="text-[15px] font-semibold">{t('describes', { brand: brandName })}</h2>
              <p className="mt-0.5 text-[12px] text-zinc-500">{t('describesBody', { brand: brandName })}</p>
            </div>
          </header>
          <div className="px-4 pb-2">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-medium">{t('association')}</p>
              <Hint label={t('association')} text={t('tour2Body')} />
            </div>
            <AssociationBars attributes={attributes} terms={terms} heatBrands={heatBrands} brandName={brandName} />
          </div>
          <footer className="flex justify-end px-3 pb-3">
            <ExportMenu
              label={t('exportCsv')}
              rows={associationRows(attributes, terms, t('attribute'), t('association'), t('term'))}
              filename="brand-perception-attributes"
            />
          </footer>
        </section>

        <section data-tour="shape" className={cn('rounded-2xl border border-nuw-line bg-white', ring('shape'))}>
          <header className="flex items-start justify-between gap-3 px-4 pb-2 pt-4">
            <div>
              <h2 className="text-[15px] font-semibold">{t('shape')}</h2>
              <p className="mt-0.5 text-[12px] text-zinc-500">{t('shapeBody')}</p>
            </div>
            <ShapeFilter attributes={attributes} shapeIds={shapeIds} top8={top8} onShapeIds={onShapeIds} />
          </header>
          <ShapePlot attributes={attributes} shapeIds={shapeIds} selected={selectedShape} onSelect={onSelectShape} empty={t('shapeEmpty')} heatBrands={heatBrands} brandName={brandName} />
          <footer className="flex items-center justify-end gap-3 px-4 pb-3 text-[13px] text-zinc-500">
            <span>{t('customSlots', { count: customCount })}</span>
            <button type="button" onClick={onAdd} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-zinc-100">
              {t('add')} <Plus className="h-3.5 w-3.5" />
            </button>
          </footer>
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-nuw-line bg-zinc-50 px-4 py-2.5">
        <p className="text-[13px] text-zinc-600">{t('banner')}</p>
        <button type="button" onClick={onInvite} className="rounded-lg border border-nuw-line bg-white px-3 py-1.5 text-[13px] hover:bg-zinc-50">
          {t('inviteTeam')}
        </button>
      </div>

      <section data-tour="compare" className={cn('rounded-2xl border border-nuw-line bg-white', ring('compare'))}>
        <header className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4">
          <div className="max-w-3xl">
            <h2 className="flex items-center gap-1.5 text-[15px] font-semibold">
              {t('compare')}
              <Hint label={t('compare')} text={t('tour4Body')} />
            </h2>
            <p className="mt-1 text-[12px] leading-5 text-zinc-500">{t('compareBody')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onManage} data-tour="manage" className={cn('rounded-lg border border-nuw-line px-3 py-1.5 text-[13px] hover:bg-zinc-50', ring('manage'))}>
              {t('manage')}
            </button>
            <button type="button" onClick={onAdd} className="inline-flex items-center gap-1 rounded-lg border border-nuw-line px-3 py-1.5 text-[13px] hover:bg-zinc-50">
              <Plus className="h-3.5 w-3.5" /> {t('addAttribute')}
            </button>
          </div>
        </header>
        <Heatmap
          attributes={attributes}
          heatBrands={heatBrands}
          heatIds={heatIds}
          sortBrand={sortBrand}
          sortDir={sortDir}
          onHeatIds={onHeatIds}
          onSort={onSort}
          tourScale={tour === 'scale'}
        />
      </section>

      <SourcesBlock attributes={attributes} tour={tour} heatBrands={heatBrands} sources={sources} />
      <TermsBlock attributes={attributes} terms={terms} />
    </div>
  )
}

function Meta({
  label,
  value,
  hint,
  editLabel,
  children,
}: {
  label: string
  value: string
  hint: string
  editLabel?: string
  children?: ReactNode
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[12px] text-zinc-500">
        {label}
        <Hint label={label} text={hint} />
      </p>
      <p className="mt-1 flex items-center gap-1 text-[13px] font-medium">
        <span className="truncate">{value}</span>
        {children ? (
          <Menu
            panelClassName="w-64 p-2"
            trigger={() => (
              <button type="button" aria-label={editLabel} className="text-zinc-400 hover:text-zinc-700">
                <Pencil className="h-3 w-3" />
              </button>
            )}
          >
            {children}
          </Menu>
        ) : null}
      </p>
    </div>
  )
}

function IndustryEditor({ industry, onSave }: { industry: string; onSave: (value: string) => void }) {
  const t = useTranslations('perception.page')
  const { close } = useMenu()
  const [value, setValue] = useState(industry)
  const [error, setError] = useState('')
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const next = value.trim()
        if (!next) {
          setError(t('industryRequired'))
          return
        }
        onSave(next)
        close()
      }}
    >
      <label className="block text-[12px] text-zinc-500">{t('industry')}</label>
      <input value={value} onChange={(event) => { setValue(event.target.value); setError('') }} className="mt-1 w-full rounded-lg border border-nuw-line px-2 py-1.5 text-[13px] outline-none focus:border-nuw-primary" />
      {error ? <p className="mt-1 text-[12px] text-rose-600">{error}</p> : <p className="mt-1 text-[12px] leading-5 text-zinc-500">{t('industryHint', { industry: value.trim() || industry })}</p>}
      <button type="submit" className="mt-2 rounded-lg bg-nuw-button px-2.5 py-1.5 text-[13px] text-white hover:bg-nuw-buttonHover">{t('saveIndustry')}</button>
    </form>
  )
}

function LanguageEditor({ onPick }: { onPick: (value: string) => void }) {
  const t = useTranslations('perception.page')
  const { close } = useMenu()
  const options = [
    ['en', 'English'],
    ['fr', 'Français'],
    ['es', 'Español'],
    ['it', 'Italiano'],
    ['de', 'Deutsch'],
  ] as const
  return (
    <div>
      <p className="px-1 pb-1 text-[12px] leading-5 text-zinc-500">{t('languageHint')}</p>
      {options.map(([id, label]) => (
        <button key={id} type="button" onClick={() => { onPick(id); close() }} className="block w-full rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-zinc-100">
          {label}
        </button>
      ))}
    </div>
  )
}

function ScopeEditor({ scope, onPick }: { scope: 'global' | 'national' | 'city'; onPick: (value: 'global' | 'national' | 'city') => void }) {
  const t = useTranslations('perception.page')
  const { close } = useMenu()
  const options = [
    ['global', t('scopeGlobal'), t('scopeGlobalHint')],
    ['national', t('scopeNational'), t('scopeNationalHint')],
    ['city', t('scopeCity'), t('scopeCityHint')],
  ] as const
  return (
    <div>
      {options.map(([id, label, hint]) => (
        <button key={id} type="button" onClick={() => { onPick(id); close() }} className={cn('block w-full rounded-lg px-2 py-1.5 text-left hover:bg-zinc-100', scope === id && 'bg-zinc-50')}>
          <span className="flex items-center gap-2 text-[13px] font-medium">{scope === id ? <Check className="h-3.5 w-3.5" /> : <span className="w-3.5" />}{label}</span>
          <span className="mt-0.5 block pl-5 text-[12px] leading-5 text-zinc-500">{hint}</span>
        </button>
      ))}
    </div>
  )
}

function AssociationBars({
  attributes,
  terms,
  heatBrands,
  brandName,
}: {
  attributes: AttributeRecord[]
  terms: TermRecord[]
  heatBrands: HeatBrand[]
  brandName: string
}) {
  const t = useTranslations('perception.page')
  const rows = attributes
    .map((item) => {
      const ownScore = heatBrands[0]?.scores[item.id] ?? item.score
      const leader = leadingScore(item.id, heatBrands)
      return { item, ownScore, leader }
    })
  const ownRows = rows.filter((row) => row.ownScore != null).sort((a, b) => (b.ownScore ?? 0) - (a.ownScore ?? 0))
  const leaderRows = rows.filter((row) => row.leader).sort((a, b) => (b.leader?.score ?? 0) - (a.leader?.score ?? 0))
  if (!ownRows.length && !leaderRows.length) {
    return <p className="py-6 text-[13px] leading-5 text-zinc-500">{t('associationEmpty', { brand: brandName })}</p>
  }
  const shown = ownRows.length ? ownRows : leaderRows
  const usingLeaders = ownRows.length === 0
  return (
    <div>
      {usingLeaders ? <p className="mb-3 text-[12px] leading-5 text-zinc-500">{t('associationLeaders', { brand: brandName })}</p> : null}
      <ul className="space-y-2">
        {shown.map(({ item, ownScore, leader }) => {
          const score = ownScore ?? leader?.score ?? 0
          const phrases = terms.filter((term) => term.attributeId === item.id).map((term) => term.label)
          return (
            <li key={item.id} className="group relative grid grid-cols-[148px_1fr_28px] items-center gap-2">
              <span className="min-w-0">
                <span className="block truncate text-[13px]">{item.name}</span>
                {usingLeaders && leader ? <span className="block truncate text-[11px] text-zinc-400">{leader.name}</span> : null}
              </span>
              <span className="h-7 overflow-hidden rounded-md bg-[#FFF1E6]">
                <span className="block h-full rounded-md bg-nuw-primary" style={{ width: `${score}%` }} />
              </span>
              <span className="text-right text-[13px] tabular-nums text-zinc-700">{score}</span>
              {phrases.length ? (
                <span className="pointer-events-none absolute left-[42%] top-7 z-20 hidden w-44 rounded-lg bg-zinc-950 p-2 text-[12px] leading-5 text-white shadow-menu group-hover:block">
                  {phrases.slice(0, 8).map((phrase) => (
                    <span key={phrase} className="block">{phrase}</span>
                  ))}
                </span>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function leadingScore(attributeId: string, heatBrands: HeatBrand[]) {
  let leader: { name: string; score: number } | null = null
  for (const brand of heatBrands) {
    const score = brand.scores[attributeId]
    if (score == null || (leader && score <= leader.score)) continue
    leader = { name: brand.name, score }
  }
  return leader
}

function ShapeFilter({
  attributes,
  shapeIds,
  top8,
  onShapeIds,
}: {
  attributes: AttributeRecord[]
  shapeIds: string[]
  top8: string[]
  onShapeIds: (ids: string[]) => void
}) {
  const t = useTranslations('perception.page')
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const visible = attributes.filter((item) => item.name.toLowerCase().includes(needle))
  const topOn = top8.length > 0 && top8.every((id) => shapeIds.includes(id)) && shapeIds.length === top8.length
  return (
    <Menu
      align="right"
      panelClassName="w-64 p-2"
      trigger={() => (
        <button type="button" aria-label={t('attributeScores')} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      )}
    >
      <p className="px-2 pb-1 text-[13px] font-medium">{t('attributeScores')}</p>
      <label className="mb-1 flex items-center gap-2 rounded-lg border border-nuw-line px-2 py-1.5">
        <Search className="h-3.5 w-3.5 text-zinc-400" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('search')} className="w-full bg-transparent text-[13px] outline-none" />
      </label>
      <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-zinc-50">
        <input type="checkbox" checked={topOn} onChange={() => onShapeIds(topOn ? [] : top8)} />
        {t('top8')}
      </label>
      {visible.length === 0 ? <p className="px-2 py-2 text-[12px] text-zinc-500">{t('noAttribute')}</p> : null}
      <div className="max-h-56 overflow-auto">
        {visible.map((item) => (
          <label key={item.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-zinc-50">
            <input
              type="checkbox"
              checked={shapeIds.includes(item.id)}
              onChange={() => onShapeIds(shapeIds.includes(item.id) ? shapeIds.filter((id) => id !== item.id) : [...shapeIds, item.id])}
            />
            <span className="truncate">{item.name}</span>
          </label>
        ))}
      </div>
      <button type="button" onClick={() => onShapeIds([])} className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-zinc-500 hover:bg-zinc-50">
        <X className="h-3.5 w-3.5" /> {t('resetAll')}
      </button>
    </Menu>
  )
}

function ShapePlot({
  attributes,
  shapeIds,
  selected,
  onSelect,
  empty,
  heatBrands,
  brandName,
}: {
  attributes: AttributeRecord[]
  shapeIds: string[]
  selected: string | null
  onSelect: (id: string | null) => void
  empty: string
  heatBrands: HeatBrand[]
  brandName: string
}) {
  const t = useTranslations('perception.page')
  const plotted = attributes.filter((item) => shapeIds.includes(item.id))
  const axes = plotted.map((item) => {
    const own = heatBrands[0]?.scores[item.id] ?? item.score
    const leader = leadingScore(item.id, heatBrands)
    return { item, own, leader: leader?.score ?? null }
  })
  const hasScores = axes.some((axis) => axis.leader != null || axis.own != null)
  const hasOwn = axes.some((axis) => axis.own != null)
  return (
    <div className="mx-4 mb-2">
      {plotted.length === 0 ? (
        <p className="grid h-[280px] place-items-center rounded-xl border border-dashed border-zinc-200 px-6 text-center text-[13px] leading-5 text-zinc-500">{empty}</p>
      ) : !hasScores ? (
        <p className="grid h-[280px] place-items-center rounded-xl border border-dashed border-zinc-200 px-6 text-center text-[13px] leading-5 text-zinc-500">{t('shapeNoScores')}</p>
      ) : (
        <ShapeRadar axes={axes} selected={selected} onSelect={onSelect} brandName={brandName} hasOwn={hasOwn} />
      )}
    </div>
  )
}

function ShapeRadar({
  axes,
  selected,
  onSelect,
  brandName,
  hasOwn,
}: {
  axes: { item: AttributeRecord; own: number | null; leader: number | null }[]
  selected: string | null
  onSelect: (id: string | null) => void
  brandName: string
  hasOwn: boolean
}) {
  const t = useTranslations('perception.page')
  const count = axes.length
  const cx = 230
  const cy = 132
  const ring = 86
  const point = (index: number, ratio: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2
    return { x: cx + Math.cos(angle) * ring * ratio, y: cy + Math.sin(angle) * ring * ratio, angle }
  }
  const polygon = (pick: (axis: (typeof axes)[number]) => number | null) =>
    axes.map((axis, index) => {
      const spot = point(index, Math.max(0, Math.min(1, (pick(axis) ?? 0) / 100)))
      return `${spot.x},${spot.y}`
    }).join(' ')
  const grid = (ratio: number) => axes.map((_, index) => {
    const spot = point(index, ratio)
    return `${spot.x},${spot.y}`
  }).join(' ')
  return (
    <div>
      <svg viewBox="0 0 460 268" className="h-[268px] w-full" role="img" aria-label={t('shape')}>
        {[1, 0.66, 0.33].map((ratio) => (
          <polygon key={ratio} points={grid(ratio)} fill="none" stroke="#f4f4f5" />
        ))}
        {axes.map((axis, index) => {
          const end = point(index, 1)
          const label = point(index, 1.28)
          const active = selected === axis.item.id
          const anchor = Math.cos(end.angle) > 0.35 ? 'start' : Math.cos(end.angle) < -0.35 ? 'end' : 'middle'
          const score = axis.leader ?? axis.own
          return (
            <g key={axis.item.id}>
              <line x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="#e4e4e7" />
              <text
                x={label.x}
                y={label.y}
                textAnchor={anchor}
                className="cursor-pointer text-[11px]"
                fill={active ? '#E85D0C' : '#3f3f46'}
                onClick={() => onSelect(active ? null : axis.item.id)}
              >
                <title>{axis.item.name}{score != null ? ` ${score}` : ''}</title>
                {shortName(axis.item.name)}
                {score != null ? ` ${score}` : ''}
              </text>
            </g>
          )
        })}
        <polygon points={polygon((axis) => axis.leader)} fill="rgba(232,93,12,0.18)" stroke="#E85D0C" strokeWidth="1.5" />
        {hasOwn ? <polygon points={polygon((axis) => axis.own)} fill="none" stroke="#18181b" strokeWidth="1.5" /> : null}
      </svg>
      <p className="flex flex-wrap items-center justify-center gap-4 text-[12px] text-zinc-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-nuw-primary" />{t('shapeLeader')}</span>
        {hasOwn ? <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-3 bg-zinc-950" />{t('shapeYou', { brand: brandName })}</span> : null}
      </p>
    </div>
  )
}

function shortName(name: string) {
  return name.length > 18 ? `${name.slice(0, 16)}…` : name
}

function Heatmap({
  attributes,
  heatBrands,
  heatIds,
  sortBrand,
  sortDir,
  onHeatIds,
  onSort,
  tourScale,
}: {
  attributes: AttributeRecord[]
  heatBrands: HeatBrand[]
  heatIds: string[]
  sortBrand: string
  sortDir: 'asc' | 'desc'
  onHeatIds: (ids: string[]) => void
  onSort: (brandId: string) => void
  tourScale: boolean
}) {
  const t = useTranslations('perception.page')
  const columns = heatBrands.filter((brand) => heatIds.includes(brand.id))
  const max = Math.max(1, ...columns.flatMap((brand) => Object.values(brand.scores).filter((score): score is number => score !== null)))
  const rows = useMemo(() => {
    const list = attributes.filter((item) => item.builtin || columns.some((brand) => brand.scores[item.id] != null))
    const sorter = heatBrands.find((brand) => brand.id === sortBrand)
    return [...list].sort((a, b) => {
      const left = sorter?.scores[a.id] ?? null
      const right = sorter?.scores[b.id] ?? null
      if (left === null && right === null) return a.name.localeCompare(b.name)
      if (left === null) return 1
      if (right === null) return -1
      return sortDir === 'desc' ? right - left : left - right
    })
  }, [attributes, columns, sortBrand, sortDir])
  const rowsForExport = heatmapRows(rows, columns, t('attribute'))
  const emptyBrands = columns.filter((brand) => rows.length > 0 && rows.every((attribute) => brand.scores[attribute.id] == null))
  const emptyNames = emptyBrands.map((brand) => brand.name).join(', ')

  return (
    <div className="px-2 pb-4 pt-3">
      {emptyBrands.length > 0 ? (
        <p role="status" className="mx-2 mb-3 text-[12px] leading-5 text-zinc-500">{t('compareMissingBody', { brands: emptyNames, count: rows.length })}</p>
      ) : null}
      <div className="mb-2 flex justify-end gap-1 px-2">
        <BrandPicker heatBrands={heatBrands} heatIds={heatIds} onHeatIds={onHeatIds} />
        <ExportMenu label={t('exportCsv')} rows={rowsForExport} filename="brand-perception-comparison" image />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-x-1 border-spacing-y-1 text-[13px]">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left font-medium text-zinc-500">{t('attribute')}</th>
              {columns.map((brand) => (
                <th key={brand.id} className="min-w-[88px] px-1 py-2 text-left font-medium">
                  <button type="button" onClick={() => onSort(brand.id)} className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 hover:bg-zinc-50">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: brand.color }}>
                      {brand.initials}
                    </span>
                    <span className="truncate">{brand.name.split(' ')[0]}</span>
                    {sortBrand === brand.id ? <Plus className={cn('ml-auto h-3.5 w-3.5 shrink-0', sortDir === 'asc' && 'rotate-45')} /> : <ChevronDown className="ml-auto h-3 w-3 shrink-0 text-zinc-300" />}
                    <span className="sr-only">{t('sortBy', { brand: brand.name })}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((attribute) => (
              <tr key={attribute.id}>
                <td className="whitespace-nowrap px-2 py-1 font-medium">{attribute.name}</td>
                {columns.map((brand) => {
                  const value = brand.scores[attribute.id]
                  if (value == null) return <td key={brand.id} className="px-1 py-1 text-center text-[13px] text-zinc-300" title={t('notScored')}>—</td>
                  return (
                    <td key={brand.id} className="px-1 py-1">
                      <div className="rounded-md px-2 py-1.5 text-center font-medium tabular-nums" style={heatStyle(value, max)}>
                        {value}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {attributes.some((item) => !item.builtin) ? <p className="px-2 pt-2 text-[12px] text-zinc-500">{t('customHeatNote')}</p> : null}
      <div data-tour="scale" className={cn('mt-3 flex items-center justify-end gap-2 px-2', tourScale && 'rounded-lg ring-2 ring-zinc-950 ring-offset-2')}>
        <span className="text-[12px] text-zinc-400">0</span>
        <span className="h-2 w-36 rounded-full" style={{ background: 'linear-gradient(90deg, #FFF1E6, #E85D0C)' }} />
        <span className="text-[12px] text-zinc-500">{max}</span>
        <Hint label={t('scaleHint')} text={t('scaleHint')} />
      </div>
    </div>
  )
}

function BrandPicker({ heatBrands, heatIds, onHeatIds }: { heatBrands: HeatBrand[]; heatIds: string[]; onHeatIds: (ids: string[]) => void }) {
  const t = useTranslations('perception.page')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const needle = query.trim().toLowerCase()
  const visible = heatBrands.filter((brand) => brand.name.toLowerCase().includes(needle))
  const toggle = (id: string) => {
    const next = heatIds.includes(id) ? heatIds.filter((item) => item !== id) : [...heatIds, id]
    if (next.length === 0) {
      setError(t('needBrand'))
      return
    }
    setError('')
    onHeatIds(heatBrands.map((brand) => brand.id).filter((item) => next.includes(item)))
  }
  return (
    <Menu
      align="right"
      panelClassName="w-64 p-2"
      trigger={() => (
        <button type="button" aria-label={t('searchBrands')} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100">
          <Search className="h-4 w-4" />
        </button>
      )}
    >
      <label className="mb-1 flex items-center gap-2 rounded-lg border border-nuw-line px-2 py-1.5">
        <Search className="h-3.5 w-3.5 text-zinc-400" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchBrands')} className="w-full bg-transparent text-[13px] outline-none" />
      </label>
      <p className="px-2 py-1 text-[12px] text-zinc-400">{t('brandCount', { count: heatBrands.length })}</p>
      {visible.length === 0 ? <p className="px-2 py-2 text-[12px] text-zinc-500">{t('noBrand')}</p> : null}
      {visible.map((brand) => (
        <label key={brand.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-zinc-50">
          <input type="checkbox" checked={heatIds.includes(brand.id)} onChange={() => toggle(brand.id)} />
          <span className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: brand.color }}>{brand.initials}</span>
          <span className="truncate">{brand.name}</span>
        </label>
      ))}
      {error ? <p className="px-2 pt-1 text-[12px] text-rose-600">{error}</p> : null}
    </Menu>
  )
}

function SourcesBlock({ attributes, tour, heatBrands, sources }: { attributes: AttributeRecord[]; tour: string | null; heatBrands: HeatBrand[]; sources: SourceRecord[] }) {
  const t = useTranslations('perception.page')
  const [mode, setMode] = useState<'attribute' | 'source'>('attribute')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const needle = query.trim().toLowerCase()

  const attributeRows = attributes.filter((item) => item.name.toLowerCase().includes(needle))
  const sourceRows = sources.filter((item) => `${item.title} ${item.domain} ${item.url}`.toLowerCase().includes(needle))
  const pages = Math.max(1, Math.ceil(sourceRows.length / sourcePageSize))
  const safePage = Math.min(page, pages - 1)
  const pageRows = sourceRows.slice(safePage * sourcePageSize, safePage * sourcePageSize + sourcePageSize)

  return (
    <section data-tour="sources" className={cn('rounded-2xl border border-nuw-line bg-white', tour === 'sources' && 'ring-2 ring-zinc-950 ring-offset-2')}>
      <header className="px-4 pt-4">
        <h2 className="flex items-center gap-1.5 text-[15px] font-semibold">
          {t('sourcesTitle')}
          <Hint label={t('sourcesTitle')} text={t('sourcesHint')} />
        </h2>
        <p className="mt-1 text-[12px] text-zinc-500">{mode === 'attribute' ? t('sourcesBody') : t('sourceLead')}</p>
        <div className="mt-3 flex gap-4 border-b border-nuw-line text-[13px]">
          {(['attribute', 'source'] as const).map((id) => (
            <button key={id} type="button" onClick={() => { setMode(id); setQuery(''); setPage(0) }} className={cn('border-b-2 px-1 pb-2', mode === id ? 'border-zinc-950 font-medium' : 'border-transparent text-zinc-500')}>
              {t(id === 'attribute' ? 'byAttribute' : 'bySource')}
            </button>
          ))}
        </div>
      </header>
      <div className="px-4 py-3">
        <label className="mb-3 flex max-w-sm items-center gap-2 rounded-lg border border-nuw-line px-2 py-1.5">
          <Search className="h-3.5 w-3.5 text-zinc-400" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0) }} placeholder={t(mode === 'attribute' ? 'searchAttributes' : 'searchSources')} className="w-full bg-transparent text-[13px] outline-none" />
        </label>
        {mode === 'attribute' ? (
          attributeRows.length === 0 ? <p className="py-6 text-[13px] text-zinc-500">{t('noAttribute')}</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead className="text-[12px] text-zinc-400">
                  <tr>
                    <th className="py-2 font-medium">{t('attribute')}</th>
                    <th className="py-2 font-medium">{t('ranking')}</th>
                    <th className="py-2 font-medium">{t('competitors')}</th>
                  </tr>
                </thead>
                <tbody>
                  {attributeRows.map((attribute) => {
                    const leaders = leadersFor(attribute.id, heatBrands)
                    const open = openId === attribute.id
                    const pagesFor = sources.filter((item) => item.attributeIds.includes(attribute.id))
                    return (
                      <AttributeSourceRow key={attribute.id} open={open} name={attribute.name} leaders={leaders} pages={pagesFor} onToggle={() => setOpenId(open ? null : attribute.id)} />
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : sourceRows.length === 0 ? (
          <p className="py-6 text-[13px] text-zinc-500">{t('noSource')}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-[13px]">
                <thead className="text-[12px] text-zinc-400">
                  <tr>
                    <th className="py-2 font-medium">{t('sources')}</th>
                    <th className="py-2 font-medium">{t('domain')}</th>
                    <th className="py-2 font-medium">{t('urlType')}</th>
                    <th className="py-2 font-medium">{t('attributesCount')}</th>
                    <th className="py-2 font-medium">{t('occurrences')}</th>
                    <th className="py-2 font-medium">{t('retrievals')}</th>
                    <th className="py-2 font-medium">{t('citation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((item) => (
                    <tr key={item.id} className="border-t border-nuw-line">
                      <td className="max-w-[280px] py-2 pr-3">
                        <p className="truncate font-medium">{item.title}</p>
                        <p className="truncate text-[12px] text-zinc-400">{item.url}</p>
                      </td>
                      <td className="py-2 text-zinc-600">{item.domain}</td>
                      <td className="py-2"><TypePill kind={item.urlType} /></td>
                      <td className="py-2 tabular-nums">{item.attributeIds.length}</td>
                      <td className="py-2 tabular-nums">{item.occurrences}</td>
                      <td className="py-2 tabular-nums text-zinc-500">{item.retrievals ?? 'N/A'}</td>
                      <td className="py-2 tabular-nums text-zinc-500">{item.citation ?? 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <Pager page={safePage} pages={pages} onPage={setPage} previousLabel={t('pagePrev')} nextLabel={t('pageNext')} />
              <p className="text-[12px] text-zinc-500">{t('sourcePreview', { shown: sourceRows.length, total: fullSourceCount })}</p>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function AttributeSourceRow({
  open,
  name,
  leaders,
  pages,
  onToggle,
}: {
  open: boolean
  name: string
  leaders: ReturnType<typeof leadersFor>
  pages: SourceRecord[]
  onToggle: () => void
}) {
  const t = useTranslations('perception.page')
  const shown = leaders.slice(0, 3)
  const extra = Math.max(0, leaders.length - shown.length)
  return (
    <>
      <tr className="border-t border-nuw-line">
        <td className="py-2">
          <button type="button" onClick={onToggle} className="inline-flex items-center gap-2 font-medium" aria-expanded={open}>
            <ChevronDown className={cn('h-3.5 w-3.5 text-zinc-400', !open && '-rotate-90')} />
            {name}
            <span className="sr-only">{open ? t('hideSources') : t('showSources')}</span>
          </button>
        </td>
        <td className="py-2 text-zinc-400">{t('notScored')}</td>
        <td className="py-2">
          <span className="inline-flex items-center gap-1">
            {shown.map(({ brand }) => (
              <span key={brand.id} title={brand.name} className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: brand.color }}>
                {brand.initials}
              </span>
            ))}
            {extra ? <span className="text-[12px] text-zinc-500">+{extra}</span> : null}
            {shown.length === 0 ? <span className="text-zinc-400">{t('notScored')}</span> : null}
          </span>
        </td>
      </tr>
      {open ? (
        <tr>
          <td colSpan={3} className="pb-3">
            {pages.length === 0 ? (
              <p className="rounded-lg bg-zinc-50 px-3 py-3 text-[13px] text-zinc-500">{t('noSourceFor', { attribute: name })}</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-nuw-line">
                <table className="w-full min-w-[720px] text-left text-[13px]">
                  <thead className="text-[12px] text-zinc-400">
                    <tr>
                      <th className="px-3 py-2 font-medium">{t('urls')}</th>
                      <th className="px-3 py-2 font-medium">{t('urlType')}</th>
                      <th className="px-3 py-2 font-medium">{t('domainType')}</th>
                      <th className="px-3 py-2 font-medium">{t('mentioned')}</th>
                      <th className="px-3 py-2 font-medium">{t('occurrences')}</th>
                      <th className="px-3 py-2 font-medium">{t('retrievals')}</th>
                      <th className="px-3 py-2 font-medium">{t('citation')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.map((item) => (
                      <tr key={item.id} className="border-t border-nuw-line">
                        <td className="max-w-[240px] px-3 py-2">
                          <p className="truncate font-medium">{item.title}</p>
                          <p className="truncate text-[12px] text-zinc-400">{item.url}</p>
                        </td>
                        <td className="px-3 py-2"><TypePill kind={item.urlType} /></td>
                        <td className="px-3 py-2"><DomainPill kind={item.domainType} /></td>
                        <td className="px-3 py-2">{item.mentioned ? <span className="text-emerald-700">{t('mentionedYes')}</span> : <span className="text-rose-600">{t('mentionedNo')}</span>}</td>
                        <td className="px-3 py-2 tabular-nums">{item.occurrences}</td>
                        <td className="px-3 py-2 tabular-nums text-zinc-500">{item.retrievals ?? 'N/A'}</td>
                        <td className="px-3 py-2 tabular-nums text-zinc-500">{item.citation ?? 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </td>
        </tr>
      ) : null}
    </>
  )
}

function TypePill({ kind }: { kind: 'listicle' | 'reference' | 'other' }) {
  const t = useTranslations('perception.page')
  const className = kind === 'listicle' ? 'text-sky-600' : kind === 'reference' ? 'text-violet-600' : 'text-zinc-500'
  return <span className={className}>{t(kind)}</span>
}

function DomainPill({ kind }: { kind: 'corporate' | 'reference' }) {
  const t = useTranslations('perception.page')
  return <span className={cn('rounded-md px-1.5 py-0.5 text-[12px]', kind === 'corporate' ? 'bg-orange-50 text-orange-600' : 'bg-violet-50 text-violet-600')}>{t(kind)}</span>
}

function TermsBlock({ attributes, terms }: { attributes: AttributeRecord[]; terms: TermRecord[] }) {
  const t = useTranslations('perception.page')
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const rows = [...terms].filter((term) => term.label.toLowerCase().includes(needle)).sort((a, b) => b.occurrences - a.occurrences || a.label.localeCompare(b.label))
  const nameFor = (id: string | null) => attributes.find((item) => item.id === id)?.name ?? t('unassigned')
  const exportRows = [
    [t('term'), t('attribute'), t('occurrences'), t('modelsCol')],
    ...[...terms].sort((a, b) => b.occurrences - a.occurrences).map((term) => [term.label, nameFor(term.attributeId), String(term.occurrences), term.models.join(', ')]),
  ]
  return (
    <section className="rounded-2xl border border-nuw-line bg-white">
      <header className="flex items-start justify-between gap-3 px-4 pt-4">
        <div>
          <h2 className="text-[15px] font-semibold">{t('termsTitle')}</h2>
          <p className="mt-1 max-w-3xl text-[12px] leading-5 text-zinc-500">{t('termsBody')}</p>
        </div>
        <ExportMenu label={t('exportFormat')} rows={exportRows} filename="brand-perception-terms" formats />
      </header>
      <div className="px-4 py-3">
        <label className="mb-3 flex max-w-sm items-center gap-2 rounded-lg border border-nuw-line px-2 py-1.5">
          <Search className="h-3.5 w-3.5 text-zinc-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchTerms')} className="w-full bg-transparent text-[13px] outline-none" />
        </label>
        {rows.length === 0 ? <p className="py-6 text-[13px] text-zinc-500">{t('noTerm')}</p> : (
          <table className="w-full text-left text-[13px]">
            <thead className="text-[12px] text-zinc-400">
              <tr>
                <th className="py-2 font-medium">{t('term')}</th>
                <th className="py-2 font-medium">{t('attribute')}</th>
                <th className="py-2 font-medium">{t('occurrences')}</th>
                <th className="py-2 font-medium">{t('modelsCol')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((term) => (
                <tr key={term.id} className="border-t border-nuw-line">
                  <td className="py-2 font-medium">{term.label}</td>
                  <td className="py-2 text-zinc-600">{nameFor(term.attributeId)}</td>
                  <td className="py-2 tabular-nums">{term.occurrences}</td>
                  <td className="py-2">
                    <span className="inline-flex gap-1">
                      {term.models.map((model) => <ModelGlyph key={model} id={model} />)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

function ExportMenu({
  rows,
  filename,
  label,
  image,
  formats,
}: {
  rows: string[][]
  filename: string
  label: string
  image?: boolean
  formats?: boolean
}) {
  return (
    <Menu
      align="right"
      panelClassName="w-52"
      trigger={() => (
        <button type="button" aria-label={label} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100">
          {formats ? <Download className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
        </button>
      )}
    >
      <ExportItems rows={rows} filename={filename} formats={formats} image={image} />
    </Menu>
  )
}

function ExportItems({ rows, filename, formats, image }: { rows: string[][]; filename: string; formats?: boolean; image?: boolean }) {
  const t = useTranslations('perception.page')
  const { push } = useToast()
  const { close } = useMenu()
  const save = (kind: 'csv' | 'xls' | 'json') => {
    if (kind === 'csv') downloadFile(`${filename}.csv`, toCsv(rows), 'text/csv')
    if (kind === 'xls') downloadFile(`${filename}.xls`, toExcelXml(rows), 'application/vnd.ms-excel')
    if (kind === 'json') {
      const [header, ...body] = rows
      const json = body.map((row) => Object.fromEntries(header.map((key, index) => [key, row[index] ?? ''])))
      downloadFile(`${filename}.json`, JSON.stringify(json, null, 2), 'application/json')
    }
    push({ title: t('downloadedTitle'), body: t('downloadedBody') })
    close()
  }
  return (
    <>
      {formats ? <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('exportFormat')}</p> : null}
      <button type="button" onClick={() => save('csv')} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100"><Download className="h-3.5 w-3.5" />{formats ? 'CSV' : t('exportCsv')}</button>
      <button type="button" onClick={() => save('xls')} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100"><Download className="h-3.5 w-3.5" />{formats ? 'XLSX' : t('exportXlsx')}</button>
      <button type="button" onClick={() => save('json')} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100"><Download className="h-3.5 w-3.5" />{formats ? 'JSON' : t('exportJson')}</button>
      <button
        type="button"
        onClick={async () => {
          await copyTable(rows)
          push({ title: t('copiedTitle'), body: t('copiedBody') })
          close()
        }}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100"
      >
        <Clipboard className="h-3.5 w-3.5" />{t('copyClipboard')}
      </button>
      {image || !formats ? (
        <button type="button" onClick={() => { push({ title: t('imageTitle'), body: t('imageBody') }); close() }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100">
          <ImageIcon className="h-3.5 w-3.5" />{t('saveImage')}
        </button>
      ) : null}
    </>
  )
}

function associationRows(attributes: AttributeRecord[], terms: TermRecord[], attribute: string, score: string, term: string) {
  const header = [attribute, score, term]
  const body = attributes
    .filter((item) => item.score !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .map((item) => [item.name, String(item.score), terms.filter((entry) => entry.attributeId === item.id).map((entry) => entry.label).join('; ')])
  return [header, ...body]
}

function heatmapRows(rows: AttributeRecord[], columns: HeatBrand[], attributeLabel: string) {
  return [
    [attributeLabel, ...columns.map((brand) => brand.name)],
    ...rows.map((attribute) => [attribute.name, ...columns.map((brand) => {
      const value = brand.scores[attribute.id]
      return value == null ? '' : String(value)
    })]),
  ]
}
