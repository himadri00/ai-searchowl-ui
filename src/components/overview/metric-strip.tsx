'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Info } from 'lucide-react'
import { metricOrder } from '@/data/types'
import type { MetricKey } from '@/data/types'
import { useBrand } from '@/components/workspace/workspace-context'
import { formatDelta, formatMetricValue } from '@/lib/format'
import { Menu } from '@/components/ui/overlay'
import { cn } from '@/lib/cn'

export function MetricStrip({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('overview.page')
  const locale = useLocale()
  const brand = useBrand()

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
        {metricOrder.map((metric) => {
          const item = brand.metrics[metric]
          return (
            <span key={metric} className="inline-flex items-center gap-1 text-zinc-500">
              {t(`metric.${metric}`)}
              <span className="font-medium text-zinc-900">{formatMetricValue(metric, item.value, locale)}</span>
              {item.delta !== undefined ? (
                <span className={item.tone === 'bad' ? 'text-[#e11d48]' : 'text-[#0f9f6e]'}>{formatDelta(metric, item.delta, locale)}</span>
              ) : null}
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <section id="metrics" className="grid overflow-hidden rounded-2xl border border-nuw-line bg-white sm:grid-cols-2 xl:grid-cols-6">
      {metricOrder.map((metric, index) => (
        <MetricCell key={metric} metric={metric} locale={locale} divider={index > 0} />
      ))}
    </section>
  )
}

function MetricCell({ metric, locale, divider }: { metric: MetricKey; locale: string; divider: boolean }) {
  const t = useTranslations('overview.page')
  const brand = useBrand()
  const item = brand.metrics[metric]
  return (
    <div className={cn('px-4 py-3', divider && 'xl:border-l xl:border-nuw-line')}>
      <div className="flex items-center gap-1 text-[12px] text-zinc-500">
        <span>{t(`metric.${metric}`)}</span>
        <Menu
          panelClassName="w-64 p-3"
          trigger={() => (
            <button type="button" aria-label={t('metricInfo', { metric: t(`metric.${metric}`) })} className="text-zinc-400 hover:text-zinc-700">
              <Info className="h-3.5 w-3.5" />
            </button>
          )}
        >
          <p className="text-[13px] font-medium">{t(`metric.${metric}`)}</p>
          <p className="mt-1 text-[13px] leading-5 text-zinc-600">{t(`metricHelp.${metric}`)}</p>
        </Menu>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="flex items-center gap-1.5 text-[22px] font-semibold tracking-tight text-zinc-950">
          {metric === 'sentiment' ? <span className="h-2 w-2 rounded-full bg-[#0f9f6e]" /> : null}
          {formatMetricValue(metric, item.value, locale)}
        </p>
        {item.delta !== undefined ? (
          <span className={cn('text-[12px] font-medium', item.tone === 'bad' ? 'text-[#e11d48]' : 'text-[#0f9f6e]')}>
            {formatDelta(metric, item.delta, locale)}
          </span>
        ) : null}
      </div>
    </div>
  )
}
