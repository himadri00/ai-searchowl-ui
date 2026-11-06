'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { formatChartDate, isBrowserToday } from '@/lib/format'
import { cn } from '@/lib/cn'

type Series = {
  id: string
  label: string
  values: number[]
  color: string
  dashed?: boolean
  axis?: 'left' | 'right'
}

export function LineChart({
  dates,
  series,
  height = 250,
  yMin,
  yMax,
  dateLabels,
  todayLabel,
}: {
  dates: string[]
  series: Series[]
  height?: number
  yMin?: number
  yMax?: number
  dateLabels?: string[]
  todayLabel?: string
}) {
  const locale = useLocale()
  const t = useTranslations('overview.page')
  const [hover, setHover] = useState<number | null>(null)
  const frame = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const canDraw = dates.length >= 2 && series.some((item) => item.values.filter((value) => Number.isFinite(value)).length >= 2)
  useEffect(() => {
    const node = frame.current
    if (!node) return
    const measure = () => {
      const next = Math.max(320, Math.round(node.clientWidth))
      setWidth((current) => (current === next ? current : next))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [canDraw])
  const pad = { l: 42, r: 48, t: 16, b: 28 }
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b

  const domain = (axis: 'left' | 'right') => {
    if (axis === 'left' && yMin !== undefined && yMax !== undefined) return { min: yMin, max: yMax }
    const values = series
      .filter((item) => (item.axis ?? 'left') === axis)
      .flatMap((item) => item.values)
      .filter((value) => Number.isFinite(value))
    return axisDomain(values)
  }

  const left = domain('left')
  const right = domain('right')
  const yFor = (value: number, axis: 'left' | 'right') => {
    const { min, max } = axis === 'right' ? right : left
    return pad.t + innerH - ((value - min) / (max - min || 1)) * innerH
  }
  const xFor = (index: number) => pad.l + (dates.length === 1 ? innerW / 2 : (index / (dates.length - 1)) * innerW)

  const pathFor = (item: Series) => {
    const pts = item.values
      .map((value, index) => [xFor(index), yFor(value, item.axis ?? 'left')] as const)
      .filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]))
    if (pts.length < 2 || pts[0] === undefined) return ''
    let d = `M ${pts[0][0]} ${pts[0][1]}`
    for (let i = 0; i < pts.length - 1; i += 1) {
      const p0 = pts[Math.max(0, i - 1)]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[Math.min(pts.length - 1, i + 2)]
      const plotTop = pad.t
      const plotBottom = pad.t + innerH
      const clampY = (y: number) => Math.min(plotBottom, Math.max(plotTop, y))
      const c1x = p1[0] + (p2[0] - p0[0]) / 6
      const c1y = clampY(p1[1] + (p2[1] - p0[1]) / 6)
      const c2x = p2[0] - (p3[0] - p1[0]) / 6
      const c2y = clampY(p2[1] - (p3[1] - p1[1]) / 6)
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`
    }
    return d
  }

  const ticks = useMemo(() => [0, 0.5, 1], [])
  const hoverPoint = hover === null ? null : dates[hover]
  const labelStep = Math.max(1, Math.ceil(dates.length / 4))
  const labeled = new Set<number>()
  for (let index = 0; index < dates.length; index += labelStep) labeled.add(index)
  if (dates.length) labeled.add(dates.length - 1)

  if (!canDraw) {
    return <p className="px-4 py-16 text-center text-[13px] leading-5 text-zinc-500">{t('chartEmpty')}</p>
  }

  return (
    <div ref={frame} className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block w-full"
        style={{ height }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect()
          const ratio = (event.clientX - bounds.left) / bounds.width
          const x = ratio * width
          let nearest = 0
          let best = Number.POSITIVE_INFINITY
          dates.forEach((_, index) => {
            const distance = Math.abs(xFor(index) - x)
            if (distance < best) {
              best = distance
              nearest = index
            }
          })
          setHover(nearest)
        }}
      >
        {ticks.map((tick) => {
          const y = pad.t + innerH * (1 - tick)
          const leftValue = left.min + (left.max - left.min) * tick
          const rightValue = right.min + (right.max - right.min) * tick
          return (
            <g key={tick}>
              <line x1={pad.l} x2={width - pad.r} y1={y} y2={y} stroke="#efeff2" strokeDasharray="3 4" />
              <text x={pad.l - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#a1a1aa">
                {tickLabel(leftValue)}
              </text>
              {series.some((item) => item.axis === 'right') ? (
                <text x={width - pad.r + 8} y={y + 4} textAnchor="start" fontSize="11" fill="#a1a1aa">
                  {tickLabel(rightValue)}
                </text>
              ) : null}
            </g>
          )
        })}
        {series.map((item) => (
          <path
            key={item.id}
            d={pathFor(item)}
            fill="none"
            stroke={item.color}
            strokeWidth="2"
            strokeDasharray={item.dashed ? '5 4' : undefined}
          />
        ))}
        {hover !== null ? (
          <line x1={xFor(hover)} x2={xFor(hover)} y1={pad.t} y2={pad.t + innerH} stroke="#d4d4d8" />
        ) : null}
        {dates.map((date, index) =>
          labeled.has(index) ? (
            <text key={`${date}-${index}`} x={xFor(index)} y={height - 8} textAnchor={index === 0 ? 'start' : index === dates.length - 1 ? 'end' : 'middle'} fontSize="11" fill="#a1a1aa">
              {todayLabel && isBrowserToday(date) ? todayLabel : (dateLabels?.[index] ?? formatChartDate(date, locale))}
            </text>
          ) : null,
        )}
      </svg>
      {hoverPoint && hover !== null ? (
        <div
          className={cn('pointer-events-none absolute top-3 z-10 w-52 rounded-xl border border-nuw-line bg-white p-3 text-[12px] shadow-menu')}
          style={{ left: `min(${(xFor(hover) / width) * 100}%, calc(100% - 13rem))` }}
        >
          <p className="font-medium text-zinc-800">{todayLabel && isBrowserToday(hoverPoint) ? todayLabel : formatChartDate(hoverPoint, locale, true)}</p>
          {series.map((item) => (
            <p key={item.id} className="mt-1 flex items-center justify-between gap-3 text-zinc-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                {item.label}
              </span>
              <span className="font-medium text-zinc-900">{item.values[hover]}</span>
            </p>
          ))}
          <p className="sr-only">{t('chartHover')}</p>
        </div>
      ) : null}
    </div>
  )
}

/** Zero stays the baseline when every value is zero or higher. Headroom stays above the peak. */
function axisDomain(values: number[]) {
  if (values.length === 0) return { min: 0, max: 1 }
  const dataMin = Math.min(...values)
  const dataMax = Math.max(...values)
  if (dataMin < 0) {
    const span = Math.max(dataMax - dataMin, 1)
    return { min: dataMin - span * 0.1, max: dataMax + span * 0.1 }
  }
  if (dataMax <= 0) return { min: 0, max: 1 }
  const rough = dataMax + Math.max(dataMax * 0.12, 1)
  return { min: 0, max: niceCeiling(rough) }
}

function tickLabel(value: number) {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

function niceCeiling(value: number) {
  if (value <= 5) return 5
  if (value <= 10) return 10
  return Math.ceil(value / 10) * 10
}
