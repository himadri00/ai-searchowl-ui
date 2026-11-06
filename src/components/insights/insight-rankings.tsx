'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
import type { Brand, Competitor, DimensionKey, MetricKey } from '@/data/types'
import { useV2 } from '@/lib/v2'
import { ApiNote } from '@/components/data/api-note'
import { MetricSwitcher } from '@/components/overview/metric-switcher'
import { Menu, useMenu } from '@/components/ui/overlay'
import { formatMetricValue } from '@/lib/format'
import { cn } from '@/lib/cn'

const rankDimensions: DimensionKey[] = ['models', 'topics', 'tags', 'countries']
const rankMetrics: MetricKey[] = ['visibility', 'sentiment', 'position', 'sov', 'winRate']

export function InsightRankings({
  brand,
  brandIds,
  labelFor,
}: {
  brand: Brand
  brandIds: string[] | null
  labelFor: (dimension: DimensionKey, id: string) => string
}) {
  const t = useTranslations('insights.page')
  const overview = useTranslations('overview.page')
  const locale = useLocale()
  const [dimension, setDimension] = useState<DimensionKey>('models')
  const [metric, setMetric] = useState<MetricKey>('visibility')
  const rankings = useV2<{ rows: { id: string; brands: Competitor[] }[] }>('prompt-runs/rankings', { dimension, metric })
  const ranked = rankings.data?.rows ?? []
  const noneSelected = brandIds !== null && brandIds.length === 0
  const pool = brand.competitors.filter((item) => !brandIds || brandIds.includes(item.id))
  const columns = Math.min(8, Math.max(pool.length, ranked.reduce((max, row) => Math.max(max, row.brands.length), 1)))

  return (
    <section className="rounded-2xl border border-nuw-line bg-white">
      <header className="flex flex-wrap items-center gap-2 px-4 py-3">
        <div>
          <h2 className="text-[15px] font-semibold">{t('rankTitle')}</h2>
          <p className="text-[12px] text-zinc-500">{t('rankBody')}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <MetricSwitcher value={metric} onChange={setMetric} metrics={rankMetrics} label={(item) => overview(`metric.${item}`)} />
          <Menu
            align="right"
            panelClassName="w-44"
            trigger={() => (
              <button type="button" className="flex h-8 items-center gap-1 rounded-lg border border-nuw-line px-2 text-[13px]">
                {t('by', { name: overview(`dimension.${dimension}`) })}
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
              </button>
            )}
          >
            {rankDimensions.map((id) => (
              <Pick key={id} active={dimension === id} onPick={() => setDimension(id)}>
                {overview(`dimension.${id}`)}
              </Pick>
            ))}
          </Menu>
        </div>
      </header>
      <div className="px-4"><ApiNote loading={rankings.loading} error={rankings.error} /></div>
      {noneSelected ? <p className="px-4 pb-4 text-[13px] leading-5 text-zinc-600">{t('noBrands')}</p> : null}
      {!noneSelected ? <div className="overflow-auto px-2 pb-3">
        <table className="w-full min-w-[760px] text-left text-[13px]">
          <thead className="text-[12px] text-zinc-400">
            <tr>
              <th className="px-2 py-2 font-medium">{overview(`dimension.${dimension}`)}</th>
              {Array.from({ length: columns }, (_, index) => (
                <th key={index} className="px-2 py-2 text-center font-medium">#{index + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((row) => {
              const id = row.id
              const order = row.brands.filter((item) => !brandIds || brandIds.includes(item.id))
              return (
                <tr key={id} className="border-t border-nuw-line">
                  <td className="px-2 py-2">
                    <span className="group/rank relative inline-flex cursor-default text-zinc-700">
                      {labelFor(dimension, id)}
                      <span className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-52 rounded-lg bg-zinc-950 p-3 text-[12px] text-white group-hover/rank:block">
                        <span className="block font-medium">{labelFor(dimension, id)}</span>
                        {rankMetrics.map((item) => (
                          <span key={item} className="mt-1 flex items-center justify-between gap-3">
                            <span className="text-zinc-300">{overview(`metric.${item}`)}</span>
                            <span>{item === 'position' && brand.metrics[item].value === null ? 'N/A' : formatMetricValue(item, brand.metrics[item].value, locale)}</span>
                          </span>
                        ))}
                      </span>
                    </span>
                  </td>
                  {Array.from({ length: columns }, (_, index) => {
                    const item = order[index]
                    if (!item) return <td key={index} />
                    const you = item.id === brand.id
                    return (
                      <td key={item.id} className="px-1 py-2 text-center">
                        <span className="inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium" style={pillStyle(item.color, you)}>
                          <span className="max-w-[88px] truncate">{item.name}</span>
                          {you ? <span className="rounded-full bg-white/25 px-1.5 text-[10px] font-semibold text-white">{t('you')}</span> : null}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div> : null}
      {!noneSelected ? <div className="flex flex-wrap items-center gap-4 px-4 pb-4 text-[12px] text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5">
            {pool.filter((item) => item.id !== brand.id).map((item) => (
              <span key={item.id} className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} title={item.name} />
            ))}
          </span>
          {t('otherBrands')}
        </span>
        {brandIds === null || brandIds.includes(brand.id) ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: brand.color }} />
            {t('yourBrand')}
          </span>
        ) : null}
      </div> : null}
    </section>
  )
}

function Pick({ active, onPick, children }: { active: boolean; onPick: () => void; children: string }) {
  const { close } = useMenu()
  return (
    <button type="button" onClick={() => { onPick(); close() }} className={cn('block w-full rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100', active && 'bg-zinc-100 font-medium')}>
      {children}
    </button>
  )
}

function pillStyle(color: string, you: boolean) {
  if (you) return { backgroundColor: color, color: '#ffffff' }
  return { backgroundColor: hexAlpha(color, 0.14), color }
}

function hexAlpha(hex: string, alpha: number) {
  const value = hex.replace('#', '')
  const r = Number.parseInt(value.slice(0, 2), 16)
  const g = Number.parseInt(value.slice(2, 4), 16)
  const b = Number.parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

