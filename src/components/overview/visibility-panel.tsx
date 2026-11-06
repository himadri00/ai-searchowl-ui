'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Info } from 'lucide-react'
import type { MetricKey } from '@/data/types'
import { useBrand, useWorkspace } from '@/components/workspace/workspace-context'
import { LineChart } from '@/components/overview/line-chart'
import { MetricSwitcher } from '@/components/overview/metric-switcher'
import { BrandMark } from '@/components/shell/brand-mark'
import { formatNumber, formatPercent } from '@/lib/format'
import { cn } from '@/lib/cn'

const periods = ['d', 'w', 'm'] as const

export function VisibilityPanel() {
  const t = useTranslations('overview.page')
  const shell = useTranslations('shell')
  const locale = useLocale()
  const brand = useBrand()
  const { range } = useWorkspace()
  const [period, setPeriod] = useState<(typeof periods)[number]>('d')
  const dates = brand.series.filter((point) => point?.date).map((point) => point.date)
  const visibleDates = period === 'd' ? dates : period === 'w' ? dates.filter((_, index) => index % 2 === 0) : dates.length ? [dates[0], dates[dates.length - 1]] : []
  const values = visibleDates.map((date) => brand.series.find((point) => point.date === date)?.visibility ?? 0)

  return (
    <section id="visibility" className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
      <div className="rounded-2xl border border-nuw-line bg-white">
        <header className="flex items-center gap-2 px-4 py-3">
          <h2 className="inline-flex items-center gap-1 text-[15px] font-semibold">
            {t('visibilityTitle')} <Info className="h-3.5 w-3.5 text-zinc-400" />
          </h2>
          <div className="ml-auto flex h-7 items-center gap-0.5 text-[12px]">
            {periods.map((item) => (
              <button key={item} type="button" onClick={() => setPeriod(item)} className={cn('h-7 rounded-md px-2 uppercase', period === item ? 'bg-nuw-primary font-medium text-white' : 'text-nuw-olive hover:bg-[#FFF1E6] hover:text-black')}>
                {t(`period.${item}`)}
              </button>
            ))}
          </div>
        </header>
        <div className="px-2">
          <LineChart
            dates={visibleDates}
            todayLabel={t('createdToday')}
            series={[{ id: 'visibility', label: t('metric.visibility'), values, color: '#E85D0C' }]}
          />
        </div>
        <p className="px-4 pb-4 text-[12px] text-zinc-400">
          {t('rangeCaption', { count: visibleDates.length })}
          {range !== 'all' ? ` ${shell('rangeNote')}` : ''}
        </p>
      </div>
      <div className="rounded-2xl border border-nuw-line bg-white">
        <header className="px-4 py-3">
          <h2 className="text-[15px] font-semibold">{t('topBrands', { count: brand.competitors.length })}</h2>
        </header>
        <div className="overflow-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-[12px] text-zinc-400">
              <tr>
                <th className="px-4 py-2 font-medium">#</th>
                <th className="py-2 font-medium">{t('colBrand')}</th>
                <th className="py-2 font-medium">{t('metric.visibility')}</th>
                <th className="py-2 font-medium">{t('metric.sov')}</th>
                <th className="py-2 font-medium">{t('metric.sentiment')}</th>
                <th className="px-4 py-2 font-medium">{t('metric.position')}</th>
              </tr>
            </thead>
            <tbody>
              {brand.competitors.map((competitor, index) => (
                <tr key={competitor.id} className="border-t border-nuw-line">
                  <td className="px-4 py-2.5 text-zinc-400">{index + 1}</td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-2">
                      <BrandMark initials={competitor.initials} color={competitor.color} size={18} />
                      {competitor.name}
                    </span>
                  </td>
                  <td className="py-2.5">{formatPercent(competitor.visibility, locale, 0)}</td>
                  <td className="py-2.5">{formatPercent(competitor.sov, locale, 0)}</td>
                  <td className="py-2.5">{competitor.sentiment === null ? 'N/A' : `+${formatNumber(competitor.sentiment, locale, 0)}`}</td>
                  <td className="px-4 py-2.5">{competitor.position === null ? 'N/A' : `#${formatNumber(competitor.position, locale, competitor.position % 1 === 0 ? 0 : 1)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

const impactMetrics: MetricKey[] = ['visibility', 'sov', 'sentiment', 'position', 'winRate']

export function SourceImpact() {
  const t = useTranslations('overview.page')
  const brand = useBrand()
  const [metric, setMetric] = useState<MetricKey>('winRate')
  const [period, setPeriod] = useState<(typeof periods)[number]>('d')
  const points = brand.series.filter((point) => point?.date)
  const dates = points.map((point) => point.date)
  const weekly = dates.map((_, index) => index).filter((index) => index % 2 === 0)
  if (dates.length && weekly[weekly.length - 1] !== dates.length - 1) weekly.push(dates.length - 1)
  const visible = period === 'm' ? (points.length ? [0, points.length - 1] : []) : period === 'w' ? weekly : dates.map((_, index) => index)

  return (
    <section id="impact" className="rounded-2xl border border-nuw-line bg-white">
      <header className="flex flex-wrap items-center gap-2 px-4 py-3">
        <h2 className="text-[15px] font-semibold">{t('impactTitle')}</h2>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <MetricSwitcher value={metric} onChange={setMetric} metrics={impactMetrics} label={(item) => t(`metric.${item}`)} />
          <div className="flex h-7 items-center gap-0.5 text-[12px]">
            {periods.map((item) => (
              <button key={item} type="button" onClick={() => setPeriod(item)} className={cn('h-7 rounded-md px-2 uppercase', period === item ? 'bg-nuw-primary font-medium text-white' : 'text-nuw-olive hover:bg-[#FFF1E6] hover:text-black')}>
                {t(`period.${item}`)}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className="px-3">
        <LineChart
          dates={visible.map((index) => dates[index])}
          todayLabel={t('createdToday')}
          series={[
            { id: 'main', label: `${brand.name} ${t(`metric.${metric}`)}`, values: visible.map((index) => points[index]?.[metric] ?? 0), color: '#E85D0C' },
            { id: 'source', label: `${brand.name} ${t('metric.source')}`, values: visible.map((index) => points[index]?.source ?? 0), color: '#a78bfa', dashed: true, axis: 'right' },
          ]}
        />
      </div>
      <div className="flex items-center gap-4 px-4 pb-4 text-[12px] text-zinc-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[#E85D0C]" />{t(`metric.${metric}`)}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 border-t border-dashed border-[#a78bfa]" />{t('metric.source')}</span>
      </div>
    </section>
  )
}
