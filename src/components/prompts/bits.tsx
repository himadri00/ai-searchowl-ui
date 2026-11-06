'use client'

import { promptLimit } from '@/data/prompts'
import type { Topic } from '@/data/prompts'
import { cn } from '@/lib/cn'

export function topicLabel(topic: Topic, t: (key: string) => string) {
  if (topic.name) return topic.name
  if (topic.nameKey) return t(topic.nameKey)
  return topic.id
}

export function LimitRing({ used, max = promptLimit, label }: { used: number; max?: number; label: string }) {
  const radius = 7
  const circ = 2 * Math.PI * radius
  const pct = max > 0 ? Math.max(0, Math.min(1, used / max)) : 0
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-zinc-700">
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <circle cx="9" cy="9" r={radius} fill="none" stroke="#e4e4e7" strokeWidth="2.5" />
        <circle
          cx="9"
          cy="9"
          r={radius}
          fill="none"
          stroke="#22c55e"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ}`}
          transform="rotate(-90 9 9)"
        />
      </svg>
      <span>{label}</span>
    </span>
  )
}

export function VolumeBars({ values, empty = 'dash' }: { values: number[]; empty?: 'dash' | 'circle' }) {
  if (!values.length) {
    if (empty === 'circle') return <span className="inline-block h-4 w-4 rounded-full border border-zinc-300" aria-hidden />
    return <span className="text-zinc-300">N/A</span>
  }
  return (
    <span className="inline-flex h-4 items-end gap-px" aria-hidden>
      {values.map((value, index) => (
        <span key={index} className="w-[3px] rounded-[1px] bg-emerald-400" style={{ height: Math.max(2, Math.min(16, value)) }} />
      ))}
    </span>
  )
}

export function MetricValue({
  value,
  kind,
  mode,
  trend,
}: {
  value: number | null
  kind: 'percent' | 'sentiment' | 'position' | 'plain'
  mode: 'default' | 'indicators' | 'none'
  trend: -1 | 0 | 1
}) {
  if (value == null || Number.isNaN(value)) return <span className="text-zinc-300">N/A</span>
  const text =
    kind === 'percent' ? `${Math.round(value)}%` : kind === 'position' ? `# ${value.toFixed(1)}` : kind === 'sentiment' ? `${value > 0 ? '+' : ''}${Math.round(value)}` : `${Math.round(value)}`
  const mark = trend > 0 ? '↑' : trend < 0 ? '↓' : null
  const tone = trend > 0 ? 'text-emerald-600' : 'text-rose-500'
  if (mode === 'indicators') return mark ? <span className={tone}>{mark}</span> : <span className="text-zinc-300">–</span>
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      <span className={kind === 'sentiment' && value > 0 ? 'text-emerald-600' : undefined}>{text}</span>
      {mode === 'default' && mark ? <span className={cn('text-[12px]', tone)}>{mark}</span> : null}
    </span>
  )
}

export function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: 'good' }) {
  return (
    <span className="inline-flex items-center gap-1 text-[13px] text-zinc-500">
      <span>{label}</span>
      <span className={cn('font-medium text-zinc-800', tone === 'good' && 'text-emerald-600')}>{value}</span>
    </span>
  )
}
