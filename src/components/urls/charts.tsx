'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

type Line = { id: string; label: string; color: string; values: number[]; previous: number[] }

export function RetrievalLines({
  labels,
  lines,
  height = 220,
  tooltipLabels,
  note,
}: {
  labels: string[]
  lines: Line[]
  height?: number
  tooltipLabels?: string[]
  note?: string
}) {
  const t = useTranslations('urls.page')
  const [hover, setHover] = useState<number | null>(null)
  const width = 640
  const pad = { l: 44, r: 20, t: 18, b: 32 }
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const scale = chartScale(Math.max(0, ...lines.flatMap((line) => line.values.filter((value) => Number.isFinite(value)))))
  const yFor = (value: number) => pad.t + innerH - (value / scale.max) * innerH
  const xFor = (index: number) => pad.l + (labels.length === 1 ? innerW / 2 : (index / (labels.length - 1)) * innerW)
  const path = (values: number[]) => values.map((value, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index)} ${yFor(value)}`).join(' ')
  const shown = shownLabelIndexes(labels.length)

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const x = ((event.clientX - rect.left) / rect.width) * width
          let nearest = 0
          let best = Number.POSITIVE_INFINITY
          labels.forEach((_, index) => {
            const distance = Math.abs(xFor(index) - x)
            if (distance < best) {
              best = distance
              nearest = index
            }
          })
          setHover(nearest)
        }}
      >
        {scale.ticks.map((tick, index) => (
          <g key={`${tick}-${index}`}>
            <line x1={pad.l} x2={width - pad.r} y1={yFor(tick)} y2={yFor(tick)} stroke="#f4f4f5" />
            <text x={pad.l - 10} y={yFor(tick) + 4} textAnchor="end" fontSize="11" fill="#a1a1aa">{Number.isInteger(tick) ? String(tick) : String(Math.round(tick * 10) / 10)}</text>
          </g>
        ))}
        {labels.map((label, index) => (
          shown.has(index) ? (
            <text key={`${label}-${index}`} x={xFor(index)} y={height - 10} textAnchor={labelAnchor(index, labels.length)} fontSize="11" fill="#a1a1aa">
              {label}
            </text>
          ) : null
        ))}
        {lines.map((line) => (
          line.values.length < 2 ? (
            <circle key={line.id} cx={xFor(0)} cy={yFor(line.values[0] ?? 0)} r="4.5" fill={line.color} />
          ) : (
            <path key={line.id} d={path(line.values)} fill="none" stroke={line.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          )
        ))}
        {hover !== null ? (
          <line x1={xFor(hover)} x2={xFor(hover)} y1={pad.t} y2={pad.t + innerH} stroke="#d4d4d8" strokeDasharray="3 3" />
        ) : null}
        {hover !== null ? lines.map((line) => (
          <circle key={line.id} cx={xFor(hover)} cy={yFor(line.values[hover] ?? 0)} r="3.5" fill={line.color} />
        )) : null}
      </svg>
      {hover !== null ? (
        <div className="pointer-events-none absolute z-10 w-56 rounded-xl border border-nuw-line bg-white p-3 text-[12px] shadow-menu" style={{ left: `${Math.min(62, (xFor(hover) / width) * 100)}%`, top: 24 }}>
          <p className="font-medium">{tooltipLabels?.[hover] ?? labels[hover]}</p>
          {lines.map((line) => (
            <p key={line.id} className="mt-1 flex items-center gap-2 text-zinc-600">
              <span className="h-2 w-2 rounded-full" style={{ background: line.color }} />
              <span className="truncate">{line.label}</span>
              <span className="ml-auto tabular-nums">{line.values[hover] ?? 0}</span>
            </p>
          ))}
          {lines.length === 1 ? (
            <p className="mt-1 text-zinc-500">{t('previousPeriod')}: {lines[0].previous[hover] ?? 0}</p>
          ) : null}
          {note ? <p className="mt-2 border-t border-nuw-line pt-2 text-zinc-500">{note}</p> : null}
        </div>
      ) : null}
    </div>
  )
}

function chartScale(maxValue: number) {
  const peak = Math.max(maxValue, 1)
  const rough = peak / 4
  const power = 10 ** Math.floor(Math.log10(rough))
  const fraction = rough / power
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10
  const step = nice * power
  const max = step * Math.ceil(peak / step)
  const ticks: number[] = []
  for (let value = 0; value <= max + step * 0.001; value += step) ticks.push(Math.round(value * 1000) / 1000)
  return { max, ticks }
}

function shownLabelIndexes(count: number) {
  const shown = new Set<number>()
  if (count <= 0) return shown
  if (count <= 6) {
    for (let index = 0; index < count; index += 1) shown.add(index)
    return shown
  }
  const step = Math.ceil((count - 1) / 5)
  for (let index = 0; index < count; index += step) shown.add(index)
  shown.add(count - 1)
  return shown
}

function labelAnchor(index: number, count: number) {
  if (count <= 1) return 'middle'
  if (index === 0) return 'start'
  if (index === count - 1) return 'end'
  return 'middle'
}

export function ModelBars({
  rows,
}: {
  rows: { id: string; label: string; current: number; previous: number }[]
}) {
  const t = useTranslations('urls.page')
  const [hover, setHover] = useState<string | null>(null)
  const max = Math.max(1, ...rows.map((row) => row.current))
  const active = rows.find((row) => row.id === hover)

  return (
    <div className="relative">
      <div className="flex h-52 items-end gap-10 px-8">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            className="flex flex-1 flex-col items-center gap-2"
            onMouseEnter={() => setHover(row.id)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="text-[12px] tabular-nums text-zinc-700">{row.current}</span>
            <span className="w-full max-w-[72px] rounded-t bg-[#3b82f6]" style={{ height: `${Math.max(4, (row.current / max) * 160)}px` }} />
            <span className="text-[12px] text-zinc-500">{row.label}</span>
          </button>
        ))}
      </div>
      {active ? (
        <div className="absolute right-4 top-6 w-48 rounded-xl border border-nuw-line bg-white p-3 text-[12px] shadow-menu">
          <p className="font-medium">{active.label}</p>
          <p className="mt-1 text-zinc-600">{t('currentPeriod')}: {active.current}</p>
          <p className="text-zinc-400">{t('previousPeriod')}: {active.previous}</p>
        </div>
      ) : null}
    </div>
  )
}
