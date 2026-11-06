'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowLeftRight, Check, ChevronDown, Copy, Download, Expand, Image as ImageIcon, MoreHorizontal, Shrink } from 'lucide-react'
import { Box, Globe, Hash, MessagesSquare, Tags } from 'lucide-react'
import type { Brand, DimensionKey, MetricKey } from '@/data/types'
import { dimensionMembers, dimensionOrder } from '@/data/types'
import { useV2 } from '@/lib/v2'
import { ApiNote } from '@/components/data/api-note'
import { MetricSwitcher } from '@/components/overview/metric-switcher'
import { Menu, useToast } from '@/components/ui/overlay'
import { formatMatrixValue, heatStyle } from '@/lib/format'
import { cn } from '@/lib/cn'

export type Choice = string[] | null

const icons = { models: Box, brands: Tags, topics: MessagesSquare, tags: Hash, countries: Globe }
const metrics: MetricKey[] = ['visibility', 'sov', 'sentiment', 'position', 'winRate']

export function InsightMatrix({
  brand,
  filter,
  labelFor,
}: {
  brand: Brand
  filter: { models: Choice; tags: Choice; topics: Choice }
  labelFor: (dimension: DimensionKey, id: string) => string
}) {
  const t = useTranslations('insights.page')
  const overview = useTranslations('overview.page')
  const locale = useLocale()
  const { push } = useToast()
  const [metric, setMetric] = useState<MetricKey>('winRate')
  const [x, setX] = useState<DimensionKey>('topics')
  const [y, setY] = useState<DimensionKey>('tags')
  const [hidden, setHidden] = useState<Record<string, string[]>>({})
  const [sort, setSort] = useState<{ index: number; dir: 'asc' | 'desc' } | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const matrix = useV2<{ cols: string[]; rows: string[]; cells: (number | null)[][]; sameAxis: boolean }>('prompt-runs/matrix', { metric, x, y })
  const grid = matrix.data ?? { cols: [] as string[], rows: [] as string[], cells: [] as (number | null)[][], sameAxis: x === y }
  const memberIds = (dimension: DimensionKey) => (dimension === 'brands' ? brand.competitors.map((item) => item.id) : dimensionMembers[dimension])
  const hideKey = (dimension: DimensionKey) => hidden[dimension] ?? []

  const blocked = (dimension: DimensionKey, id: string) => {
    if (hideKey(dimension).includes(id)) return true
    const chosen = dimension === 'models' ? filter.models : dimension === 'tags' ? filter.tags : dimension === 'topics' ? filter.topics : null
    return Boolean(chosen && !chosen.includes(id))
  }

  const cols = grid.cols.filter((id) => !blocked(x, id))
  const rowIds = grid.rows.filter((id) => !blocked(y, id))

  const rows = useMemo(() => {
    const indexed = rowIds.map((id) => {
      const source = grid.rows.indexOf(id)
      const cells = cols.map((col) => grid.cells[source]?.[grid.cols.indexOf(col)] ?? null)
      return { id, cells }
    })
    if (!sort) return indexed
    return [...indexed].sort((a, b) => {
      if (sort.index < 0) return sort.dir === 'asc' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id)
      const left = a.cells[sort.index] ?? Number.NEGATIVE_INFINITY
      const right = b.cells[sort.index] ?? Number.NEGATIVE_INFINITY
      return sort.dir === 'asc' ? Number(left) - Number(right) : Number(right) - Number(left)
    })
  }, [rowIds, grid.rows, grid.cols, grid.cells, cols, sort])

  const toggleSort = (index: number) => {
    setSort((current) => {
      if (!current || current.index !== index) return { index, dir: 'desc' }
      if (current.dir === 'desc') return { index, dir: 'asc' }
      return null
    })
  }

  const toggleHidden = (dimension: DimensionKey, id: string) => {
    const all = memberIds(dimension)
    const current = hidden[dimension] ?? []
    const visible = all.filter((item) => !current.includes(item))
    const nextVisible = visible.includes(id) ? visible.filter((item) => item !== id) : [...visible, id]
    setHidden((previous) => ({ ...previous, [dimension]: all.filter((item) => !nextVisible.includes(item)) }))
  }

  const exportRows = () => {
    const header = [overview(`dimension.${y}`), ...cols.map((id) => labelFor(x, id))]
    const body = rows.map((row) => [labelFor(y, row.id), ...row.cells.map((cell) => (cell === null ? '' : formatMatrixValue(metric, cell, locale)))])
    return [header, ...body]
  }

  const download = () => {
    const csv = exportRows().map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'aisearchowl-insights-matrix.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const copy = async () => {
    await navigator.clipboard.writeText(exportRows().map((row) => row.join('\t')).join('\n'))
    push({ title: t('copiedTitle'), body: t('copiedBody') })
  }

  const panel = (
    <section className="rounded-2xl border border-nuw-line bg-white">
      <header className="flex flex-wrap items-center gap-2 px-4 py-3">
        <div>
          <h2 className="text-[15px] font-semibold">{t('matrixTitle')}</h2>
          <p className="text-[12px] text-zinc-500">{t('matrixBody')}</p>
          <ApiNote loading={matrix.loading} error={matrix.error} />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <MetricSwitcher value={metric} onChange={setMetric} metrics={metrics} label={(item) => overview(`metric.${item}`)} />
          <button
            type="button"
            onClick={() => {
              setX(y)
              setY(x)
              setSort(null)
            }}
            className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] text-zinc-700 hover:bg-zinc-100"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            {t('switchAxis')}
          </button>
          <Menu
            align="right"
            panelClassName="w-56 p-2"
            trigger={() => (
              <button type="button" className="flex h-8 items-center gap-1 rounded-lg border border-nuw-line px-2 text-[13px]">
                {overview('axisPair', { x: overview(`dimension.${x}`), y: overview(`dimension.${y}`) })}
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
              </button>
            )}
          >
            <AxisList title={t('xAxis')} value={x} onChange={setX} label={(id) => overview(`dimension.${id}`)} />
            <AxisList title={t('yAxis')} value={y} onChange={setY} label={(id) => overview(`dimension.${id}`)} />
          </Menu>
          <button type="button" aria-label={expanded ? t('collapse') : t('expand')} onClick={() => setExpanded((value) => !value)} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100">
            {expanded ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
          </button>
          <Menu
            align="right"
            panelClassName="w-52"
            trigger={() => (
              <button type="button" aria-label={t('more')} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            )}
          >
            <button type="button" onClick={download} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100">
              <Download className="h-3.5 w-3.5" /> {t('exportCsv')}
            </button>
            <button type="button" onClick={() => push({ title: t('imageTitle'), body: t('imageBody') })} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100">
              <ImageIcon className="h-3.5 w-3.5" /> {t('saveImage')}
            </button>
            <button type="button" onClick={copy} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100">
              <Copy className="h-3.5 w-3.5" /> {t('copyTable')}
            </button>
          </Menu>
        </div>
      </header>
      {x === y ? (
        <p className="px-4 pb-6 text-[13px] text-zinc-600">{t('sameAxis', { name: overview(`dimension.${x}`) })}</p>
      ) : cols.length === 0 || rows.length === 0 ? (
        <p className="px-4 pb-6 text-[13px] text-zinc-600">{t('emptyMatrix')}</p>
      ) : (
        <div className="overflow-auto px-2 pb-2">
          <table className="w-full min-w-[640px] border-separate border-spacing-y-1">
            <thead>
              <tr className="text-[12px] text-zinc-500">
                <th className="px-2 py-1 text-left font-medium">
                  <button type="button" onClick={() => toggleSort(-1)} className="inline-flex items-center gap-1 hover:text-zinc-800">
                    {overview(`dimension.${y}`)}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </th>
                {cols.map((id, index) => (
                  <th key={id} className="px-2 py-1 text-center font-medium">
                    <Menu
                      align="right"
                      panelClassName="w-64 p-2"
                      trigger={() => (
                        <button type="button" className="group/head relative inline-flex items-center gap-1 hover:text-zinc-800">
                          <span>{labelFor(x, id)}</span>
                          <ChevronDown className="h-3 w-3" />
                          <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-950 px-2 py-1 text-[12px] text-white group-hover/head:block">
                            {labelFor(x, id)}
                          </span>
                        </button>
                      )}
                    >
                      <ColumnFilter
                        brand={brand}
                        x={x}
                        y={y}
                        hidden={hidden}
                        query={query}
                        onQuery={setQuery}
                        labelFor={labelFor}
                        memberIds={memberIds}
                        onToggle={toggleHidden}
                        onReset={() => {
                          setHidden({})
                          setQuery('')
                        }}
                      />
                    </Menu>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-2 text-[13px] text-zinc-700">{labelFor(y, row.id)}</td>
                  {row.cells.map((cell, index) => (
                    <td key={`${row.id}-${cols[index]}`}>
                      <HeatCell metric={metric} value={cell} locale={locale} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-end gap-2 px-3 py-3 text-[11px] text-zinc-400">
            <span>{metric === 'position' ? '1' : '0'}</span>
            <span
              className="h-1.5 w-28 rounded-full"
              style={{
                background: metric === 'sentiment' ? 'linear-gradient(90deg, #3A3F4C, #F0A06A, #E85D0C)' : 'linear-gradient(90deg, #FFF1E6, #E85D0C)',
              }}
            />
            <span>{metric === 'position' ? '10' : metric === 'sentiment' ? '100' : '100%'}</span>
          </div>
        </div>
      )}
    </section>
  )

  if (!expanded) return panel
  return <div className="fixed inset-4 z-50 overflow-auto rounded-2xl bg-white shadow-menu">{panel}</div>
}

function ColumnFilter({
  brand,
  x,
  y,
  hidden,
  query,
  onQuery,
  labelFor,
  memberIds,
  onToggle,
  onReset,
}: {
  brand: Brand
  x: DimensionKey
  y: DimensionKey
  hidden: Record<string, string[]>
  query: string
  onQuery: (value: string) => void
  labelFor: (dimension: DimensionKey, id: string) => string
  memberIds: (dimension: DimensionKey) => string[]
  onToggle: (dimension: DimensionKey, id: string) => void
  onReset: () => void
}) {
  const t = useTranslations('insights.page')
  const overview = useTranslations('overview.page')
  const needle = query.trim().toLowerCase()
  const groups = [
    { dimension: y, title: t('rowsOf', { name: overview(`dimension.${y}`) }) },
    { dimension: x, title: t('columnsOf', { name: overview(`dimension.${x}`) }) },
  ]
  return (
    <div>
      <label className="flex items-center gap-2 rounded-lg border border-nuw-line px-2 py-1.5 text-[13px]">
        <span className="text-zinc-400">{t('search')}</span>
        <input value={query} onChange={(event) => onQuery(event.target.value)} className="w-full bg-transparent outline-none" placeholder={t('search')} />
      </label>
      {groups.map((group) => {
        const items = memberIds(group.dimension).filter((id) => labelFor(group.dimension, id).toLowerCase().includes(needle))
        return (
          <div key={group.dimension} className="mt-2">
            <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{group.title}</p>
            {items.length === 0 ? <p className="px-2 py-1 text-[12px] text-zinc-500">{t('filterEmpty')}</p> : null}
            {items.map((id) => {
              const off = (hidden[group.dimension] ?? []).includes(id)
              return (
                <label key={id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-zinc-50">
                  <input type="checkbox" checked={!off} onChange={() => onToggle(group.dimension, id)} />
                  <span className="truncate">{labelFor(group.dimension, id)}</span>
                </label>
              )
            })}
          </div>
        )
      })}
      <button type="button" onClick={onReset} className="mt-1 w-full rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100">
        {t('resetAll')}
      </button>
    </div>
  )
}

function AxisList({
  title,
  value,
  onChange,
  label,
}: {
  title: string
  value: DimensionKey
  onChange: (value: DimensionKey) => void
  label: (id: DimensionKey) => string
}) {
  return (
    <div className="py-1">
      <p className="px-2 pb-1 text-[11px] font-medium text-zinc-400">{title}</p>
      {dimensionOrder.map((id) => {
        const Icon = icons[id]
        const active = id === value
        return (
          <button key={id} type="button" onClick={() => onChange(id)} className={cn('flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-zinc-100', active && 'bg-zinc-100')}>
            <Icon className="h-3.5 w-3.5 text-zinc-500" />
            <span className="flex-1">{label(id)}</span>
            {active ? <Check className="h-3.5 w-3.5" /> : null}
          </button>
        )
      })}
    </div>
  )
}

function HeatCell({ metric, value, locale }: { metric: MetricKey; value: number | null; locale: string }) {
  if (value === null) return <div className="flex h-8 items-center justify-center text-[13px] text-zinc-400">N/A</div>
  const style = heatStyle(metric, value)
  return (
    <div className="flex h-8 items-center">
      <div className="flex h-7 items-center justify-center rounded-md px-2 text-[13px] font-medium" style={{ ...style, minWidth: 56 }}>
        {formatMatrixValue(metric, value, locale)}
      </div>
    </div>
  )
}
