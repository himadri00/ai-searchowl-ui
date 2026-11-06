'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowLeftRight, Check, ChevronDown, ChevronUp, Copy, Download, Expand, MoreHorizontal, Shrink } from 'lucide-react'
import { Box, Globe, Hash, MessagesSquare, Tags } from 'lucide-react'
import { dimensionMembers, dimensionOrder } from '@/data/types'
import type { DimensionKey, MetricKey } from '@/data/types'
import { useBrand, useWorkspace } from '@/components/workspace/workspace-context'
import { usePrompts } from '@/components/prompts/prompts-context'
import { useV2 } from '@/lib/v2'
import { ApiNote } from '@/components/data/api-note'
import { MetricSwitcher } from '@/components/overview/metric-switcher'
import { Menu, useToast } from '@/components/ui/overlay'
import { formatMatrixValue, heatStyle } from '@/lib/format'
import { cn } from '@/lib/cn'

const dimensionIcon = {
  models: Box,
  brands: Tags,
  topics: MessagesSquare,
  tags: Hash,
  countries: Globe,
}

const matrixMetrics: MetricKey[] = ['visibility', 'sov', 'sentiment', 'position', 'winRate']

export function PerformanceMatrix() {
  const t = useTranslations('overview.page')
  const promptsText = useTranslations('prompts.page')
  const shell = useTranslations('shell')
  const locale = useLocale()
  const { push } = useToast()
  const { matrixMetric, setMatrixMetric, matrixX, matrixY, setMatrixX, setMatrixY } = useWorkspace()
  const brand = useBrand()
  const { tags, topics, dataLoading, dataError } = usePrompts()
  const [sort, setSort] = useState<{ index: number; dir: 'asc' | 'desc' } | null>(null)
  const [expanded, setExpanded] = useState(false)
  const matrix = useV2<{ cols: string[]; rows: string[]; cells: (number | null)[][]; sameAxis: boolean }>('prompt-runs/matrix', { metric: matrixMetric, x: matrixX, y: matrixY })
  const grid = matrix.data ?? { cols: [] as string[], rows: [] as string[], cells: [] as (number | null)[][], sameAxis: matrixX === matrixY }

  const rows = useMemo(() => {
    const indexed = grid.rows.map((id, index) => ({ id, cells: grid.cells[index] ?? [] }))
    if (!sort) return indexed
    return [...indexed].sort((a, b) => {
      const av = a.cells[sort.index]
      const bv = b.cells[sort.index]
      const an = av === null || av === undefined ? Number.NEGATIVE_INFINITY : av
      const bn = bv === null || bv === undefined ? Number.NEGATIVE_INFINITY : bv
      return sort.dir === 'asc' ? an - bn : bn - an
    })
  }, [grid.rows, grid.cells, sort])

  const labelFor = (dimension: DimensionKey, id: string) => {
    if (dimension === 'brands') {
      return brand.competitors.find((item) => item.id === id)?.name ?? id
    }
    if (dimension === 'tags') {
      const name = tags.find((tag) => tag.id === id)?.name?.trim()
      if (name) return name
    }
    if (dimension === 'topics') {
      const topic = topics.find((item) => item.id === id)
      const name = topic?.name?.trim()
      if (name) return name
      if (topic?.nameKey && promptsText.has(topic.nameKey)) return promptsText(topic.nameKey)
    }
    // Only the built-in sample ids live in the message file. A live id is a
    // UUID, and translating a missing key prints overview.page.tags.<id>.
    if (dimensionMembers[dimension].includes(id)) {
      const key = `${dimension}.${id}`
      if (t.has(key)) return t(key)
    }
    return id
  }

  const missingNames =
    !dataLoading &&
    [matrixX, matrixY].some((dimension, index) => {
      if (dimension !== 'tags' && dimension !== 'topics') return false
      const ids = index === 0 ? grid.cols : grid.rows
      return ids.some((id) => labelFor(dimension, id) === id)
    })

  const exportRows = () => {
    const header = [t(`dimension.${matrixY}`), ...grid.cols.map((id) => labelFor(matrixX, id))]
    const body = rows.map((row) => [
      labelFor(matrixY, row.id),
      ...row.cells.map((cell) => (cell === null ? '' : formatMatrixValue(matrixMetric, cell, locale))),
    ])
    return [header, ...body]
  }

  const download = () => {
    const csv = exportRows().map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'aisearchowl-performance-matrix.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const copy = async () => {
    const text = exportRows().map((row) => row.join('\t')).join('\n')
    await navigator.clipboard.writeText(text)
    push({ title: t('copiedTitle'), body: t('copiedBody') })
  }

  const panel = (
    <section id="matrix" className={cn('rounded-2xl border border-nuw-line bg-white', expanded && 'flex h-full flex-col')}>
      <header className="flex flex-wrap items-center gap-2 px-4 py-3">
        <h2 className="text-[15px] font-semibold">{t('matrixTitle')}</h2>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <MetricSwitcher value={matrixMetric} onChange={setMatrixMetric} metrics={matrixMetrics} label={(metric) => t(`metric.${metric}`)} />
          <button
            type="button"
            onClick={() => {
              setMatrixX(matrixY)
              setMatrixY(matrixX)
              setSort(null)
            }}
            className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] text-zinc-700 hover:bg-zinc-100"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            {t('switchAxis')}
          </button>
          <Menu
            align="right"
            panelClassName="w-60 p-2"
            trigger={() => (
              <button type="button" className="flex h-8 items-center gap-1 rounded-lg border border-nuw-line px-2 text-[13px]">
                {t('axisPair', { x: t(`dimension.${matrixX}`), y: t(`dimension.${matrixY}`) })}
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
              </button>
            )}
          >
            <AxisGroup title={t('xAxis')} value={matrixX} onChange={setMatrixX} label={(id) => t(`dimension.${id}`)} />
            <AxisGroup title={t('yAxis')} value={matrixY} onChange={setMatrixY} label={(id) => t(`dimension.${id}`)} />
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
            <button type="button" onClick={() => push({ title: shell('pdfTitle'), body: t('imageSoon') })} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100">
              <Download className="h-3.5 w-3.5" /> {t('saveImage')}
            </button>
            <button type="button" onClick={copy} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100">
              <Copy className="h-3.5 w-3.5" /> {t('copyTable')}
            </button>
          </Menu>
        </div>
      </header>
      {grid.sameAxis ? (
        <p className="px-4 pb-6 text-[13px] leading-6 text-zinc-600">{t('sameAxis', { name: t(`dimension.${matrixX}`) })}</p>
      ) : (
        <div className={cn('overflow-auto px-2 pb-2', expanded && 'min-h-0 flex-1')}>
          <table className="w-full min-w-[720px] border-separate border-spacing-x-2 border-spacing-y-1">
            <thead>
              <tr>
                <th className="w-44 px-2 text-left text-[13px] font-medium text-zinc-700">{t(`dimension.${matrixY}`)}</th>
                {grid.cols.map((col, index) => {
                  const label = labelFor(matrixX, col)
                  return (
                  <th key={col} className="px-1 text-center text-[13px] font-medium text-zinc-700">
                    <button
                      type="button"
                      title={label}
                      className="inline-flex max-w-52 items-center gap-1"
                      onClick={() => setSort((current) => ({ index, dir: current?.index === index && current.dir === 'desc' ? 'asc' : 'desc' }))}
                    >
                      <span className="truncate">{label}</span>
                      {sort?.index === index ? (sort.dir === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />) : <ChevronDown className="h-3 w-3 text-zinc-300" />}
                    </button>
                  </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const label = labelFor(matrixY, row.id)
                return (
                <tr key={row.id}>
                  <td title={label} className="max-w-52 px-2 text-[13px] leading-5 break-words text-zinc-700">{label}</td>
                  {row.cells.map((cell, index) => (
                    <td key={`${row.id}-${grid.cols[index]}`}>
                      <HeatCell metric={matrixMetric} value={cell} locale={locale} />
                    </td>
                  ))}
                </tr>
                )
              })}
            </tbody>
          </table>
          {missingNames ? <p className="px-3 pt-2 text-[13px] leading-6 text-zinc-600">{dataError || t('unnamedAxis')}</p> : null}
          <div className="flex items-center justify-end gap-2 px-3 py-3 text-[11px] text-zinc-400">
            <span>{matrixMetric === 'position' ? '1' : '0'}</span>
            <span
              className="h-1.5 w-28 rounded-full"
              style={{
                background:
                  matrixMetric === 'sentiment'
                    ? 'linear-gradient(90deg, #f87171, #facc15, #4ade80)'
                    : 'linear-gradient(90deg, #FFF1E6, #E85D0C)',
              }}
            />
            <span>{matrixMetric === 'position' ? '10' : matrixMetric === 'sentiment' ? '100' : '100%'}</span>
          </div>
        </div>
      )}
      <ApiNote loading={matrix.loading} error={matrix.error} />
    </section>
  )

  if (!expanded) return panel
  return <div className="fixed inset-4 z-50 overflow-hidden rounded-2xl bg-white shadow-menu">{panel}</div>
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

function AxisGroup({
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
        const Icon = dimensionIcon[id]
        const active = id === value
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn('flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-zinc-100', active && 'bg-zinc-100')}
          >
            <Icon className="h-3.5 w-3.5 text-zinc-500" />
            <span className="flex-1">{label(id)}</span>
            {active ? <Check className="h-3.5 w-3.5" /> : null}
          </button>
        )
      })}
    </div>
  )
}
