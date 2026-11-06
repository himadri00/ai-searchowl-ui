'use client'

import type { ReactNode } from 'react'
import { BarChart3, Eye, Hash, Link2, Smile, Star } from 'lucide-react'
import type { MetricKey } from '@/data/types'
import { cn } from '@/lib/cn'

const iconFor: Record<MetricKey, ReactNode> = {
  visibility: <Eye className="h-3.5 w-3.5" />,
  sov: <BarChart3 className="h-3.5 w-3.5" />,
  sentiment: <Smile className="h-3.5 w-3.5" />,
  position: <Hash className="h-3.5 w-3.5" />,
  winRate: <Star className="h-3.5 w-3.5" />,
  source: <Link2 className="h-3.5 w-3.5" />,
}

export function MetricSwitcher({
  value,
  onChange,
  metrics,
  label,
}: {
  value: MetricKey
  onChange: (metric: MetricKey) => void
  metrics: MetricKey[]
  label: (metric: MetricKey) => string
}) {
  return (
    <div className="flex items-center gap-0.5">
      {metrics.map((metric) => {
        const active = metric === value
        return (
          <button
            key={metric}
            type="button"
            onClick={() => onChange(metric)}
            className={cn(
              'flex h-7 items-center gap-1 rounded-md px-1.5 text-nuw-olive hover:bg-[#FFF1E6] hover:text-black',
              active && 'bg-nuw-button font-medium text-white',
            )}
          >
            {iconFor[metric]}
            {active ? <span className="pr-1 text-[13px]">{label(metric)}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
