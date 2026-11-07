'use client'

import { useEffect, useMemo, useState } from 'react'
import { Eye, Link2, MessageSquare, Users, X, type LucideIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { ApiNote } from '@/components/data/api-note'
import { AiSearchMark, Favicon } from '@/components/shell/brand-mark'
import { useBrand, useWorkspace } from '@/components/workspace/workspace-context'
import type { PromptItem } from '@/data/prompts'
import type { ChatRecord, RangeKey } from '@/data/types'
import { Link } from '@/i18n/routing'
import { browserTimeZone, formatChartDate, formatDelta, formatNumber, formatPercent } from '@/lib/format'
import { rangeQuery, useV2 } from '@/lib/v2'

const rangeKey: Record<RangeKey, 'timeAll' | 'time7' | 'time30' | 'time90'> = {
  all: 'timeAll',
  '7d': 'time7',
  '30d': 'time30',
  '90d': 'time90',
}

const modelHosts: Record<string, string> = {
  chatgpt: 'openai.com',
  perplexity: 'perplexity.ai',
  gemini: 'gemini.google.com',
  aioverview: 'google.com',
  claude: 'claude.ai',
  aimode: 'google.com',
}

const knownModels = new Set(['chatgpt', 'perplexity', 'gemini', 'aioverview', 'claude'])

const sharePalette = ['#F05A0A', '#171411', '#68625C', '#A49E96', '#D1CCC5']

export function SearchOverview() {
  const t = useTranslations('overview.page')
  const shell = useTranslations('shell')
  const locale = useLocale()
  const brand = useBrand()
  const { range, apiLoading, apiMessage } = useWorkspace()
  const prompts = useV2<{ total: number; prompts: PromptItem[] }>('prompts', { limit: 100, offset: 0, status: 'active' })
  const chats = useV2<{ total: number; chats: ChatRecord[] }>('prompt-runs/chats', {
    limit: 100,
    timezone: browserTimeZone(),
    ...rangeQuery(range),
  })

  const waiting = apiLoading || prompts.loading || chats.loading
  const percent = (value: number) => formatPercent(value, locale, value % 1 === 0 ? 0 : 1)
  const count = (value: number) => formatNumber(value, locale, 0)

  const mentions = useMemo(() => (chats.data?.chats ?? []).filter((chat) => mentionsBrand(chat, brand.id)).length, [chats.data, brand.id])
  const citations = useMemo(() => ownCitations(brand.domain, brand.domains), [brand.domain, brand.domains])
  const platforms = useMemo(() => platformScores(chats.data?.chats ?? [], brand.id), [chats.data, brand.id])
  const shares = useMemo(() => shareSlices(brand), [brand])
  const allShares = useMemo(() => allShareSlices(brand), [brand])
  const topPrompts = useMemo(
    () => rankPrompts(prompts.data?.prompts ?? [], chats.data?.chats ?? []),
    [prompts.data, chats.data],
  )

  const visibility = brand.metrics.visibility
  const visibilityDelta = visibility.delta
  const stats: { id: string; icon: LucideIcon; value: string; delta: string | null; deltaTone: 'good' | 'bad' | undefined }[] = [
    {
      id: 'visibility',
      icon: Eye,
      value: waiting ? '...' : percent(visibility.value),
      delta: !waiting && visibilityDelta != null ? formatDelta('visibility', visibilityDelta, locale) : null,
      deltaTone: visibility.tone ?? (visibilityDelta != null && visibilityDelta < 0 ? 'bad' : 'good'),
    },
    { id: 'prompts', icon: MessageSquare, value: prompts.loading ? '...' : count(prompts.data?.total ?? 0), delta: null, deltaTone: undefined },
    { id: 'mentions', icon: Users, value: chats.loading ? '...' : count(mentions), delta: null, deltaTone: undefined },
    { id: 'citations', icon: Link2, value: waiting ? '...' : count(citations), delta: null, deltaTone: undefined },
  ]

  return (
    <section id="ask" className="min-w-0 border border-nuw-line bg-[#F7F5F1] p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AiSearchMark size={40} />
          <div className="min-w-0">
            <h2 className="text-[18px] font-extrabold tracking-[-0.03em] text-zinc-950">{t('searchBoard.title')}</h2>
            <p className="text-[13px] text-zinc-500">{t('searchBoard.subtitle')}</p>
          </div>
        </div>
        <span className="rounded-full border border-nuw-line bg-white px-3 py-1.5 text-[13px] text-zinc-700 shadow-sm">
          {shell(rangeKey[range])}
        </span>
      </header>
      <div className="mt-3">
        <ApiNote loading={apiLoading} error={apiMessage} />
        <ApiNote loading={prompts.loading && !apiLoading} error={prompts.error} shown={prompts.data?.prompts.length} total={prompts.data?.total} />
        <ApiNote loading={chats.loading && !apiLoading && !prompts.loading} error={chats.error} shown={chats.data?.chats.length} total={chats.data?.total} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
        {stats.map((stat) => (
          <article key={stat.id} className="rounded-lg border border-nuw-line bg-white px-4 py-3.5 shadow-sm">
            <p className="flex items-center gap-1.5 text-[13px] text-zinc-500">
              <stat.icon className="h-3.5 w-3.5" />
              {t(`searchBoard.${stat.id}`)}
            </p>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-[28px] font-semibold leading-none tracking-tight text-zinc-950">{stat.value}</span>
              {stat.delta ? (
                <span className={stat.deltaTone === 'bad' ? 'text-[13px] font-medium text-[#e11d48]' : 'text-[13px] font-medium text-[#0f9f6e]'}>
                  {stat.delta}
                </span>
              ) : null}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2 [&>*]:min-w-0">
        <TrendCard loading={apiLoading} points={brand.series.filter((point) => point?.date).map((point) => ({ date: point.date, value: point.visibility }))} />
        <article className="rounded-lg border border-nuw-line bg-white p-4 shadow-sm">
          <h3 className="text-[15px] font-semibold text-zinc-950">{t('searchBoard.platformTitle')}</h3>
          {platforms.length === 0 ? (
            chats.error ? null : <p className="mt-4 text-[13px] leading-5 text-zinc-500">{chats.loading ? '...' : t('searchBoard.noPlatforms')}</p>
          ) : (
            <ul className="mt-4 space-y-3.5">
              {platforms.map((platform) => (
                <li key={platform.id} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_3rem] items-center gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-[13px] text-zinc-800">
                    <Favicon host={modelHosts[platform.id] ?? `${platform.id}.com`} className="h-4 w-4" />
                    <span className="truncate">{knownModels.has(platform.id) ? t(`models.${platform.id}`) : platform.id}</span>
                  </span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-[#FFE8D6]">
                    <span className="block h-full rounded-full bg-[#F05A0A]" style={{ width: `${Math.min(100, platform.value)}%` }} />
                  </span>
                  <span className="text-right text-[13px] font-medium text-zinc-800">{percent(platform.value)}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2 [&>*]:min-w-0">
        <ShareCard loading={apiLoading} slices={shares} all={allShares} center={brand.metrics.sov.value} centerLabel={brand.name} />
        <article className="rounded-lg border border-nuw-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[15px] font-semibold text-zinc-950">{t('searchBoard.promptsTitle')}</h3>
            <Link href="/prompts" className="text-[13px] font-medium text-[#F05A0A] hover:underline">
              {t('searchBoard.viewAll')}
            </Link>
          </div>
          {topPrompts.length === 0 ? (
            prompts.error ? null : <p className="mt-4 text-[13px] leading-5 text-zinc-500">{prompts.loading ? '...' : t('searchBoard.noPrompts')}</p>
          ) : (
            <div className="mt-3 min-w-0 overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="text-[12px] text-zinc-400">
                    <th className="pb-2 font-medium">{t('searchBoard.colPrompt')}</th>
                    <th className="pb-2 font-medium">{t('searchBoard.colRank')}</th>
                    <th className="pb-2 font-medium">{t('searchBoard.colVisibility')}</th>
                    <th className="pb-2 text-right font-medium">{t('searchBoard.colCitations')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topPrompts.map((row) => (
                    <tr key={row.id} className="border-t border-nuw-line">
                      <td className="max-w-[12rem] py-3 pr-3 text-zinc-800 sm:max-w-none">{row.text}</td>
                      <td className="py-3 pr-3">
                        {row.rank == null ? (
                          <span className="text-[12px] text-zinc-400">{t('searchBoard.notRanked')}</span>
                        ) : (
                          <span className="inline-flex rounded-md bg-[#FFF3E8] px-1.5 py-0.5 text-[12px] font-semibold text-[#F05A0A]">
                            #{formatNumber(row.rank, locale, row.rank % 1 === 0 ? 0 : 1)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700">{row.visibility == null ? t('searchBoard.noScore') : percent(row.visibility)}</td>
                      <td className="py-3 text-right text-zinc-700">{count(row.citations)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

function TrendCard({ points, loading }: { points: { date: string; value: number }[]; loading: boolean }) {
  const t = useTranslations('overview.page')
  const locale = useLocale()
  if (loading || points.length < 2) {
    return (
      <article className="rounded-lg border border-nuw-line bg-white p-4 shadow-sm">
        <h3 className="text-[15px] font-semibold text-zinc-950">{t('searchBoard.trendTitle')}</h3>
        <p className="mt-4 text-[13px] leading-5 text-zinc-500">{loading ? '...' : t('chartEmpty')}</p>
      </article>
    )
  }

  const width = 560
  const height = 220
  const pad = { l: 44, r: 28, t: 22, b: 32 }
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const scale = chartScale(Math.max(...points.map((point) => point.value)))
  const yMax = scale.max
  const yFor = (value: number) => pad.t + ((yMax - value) / yMax) * innerH
  const xFor = (index: number) => pad.l + (index / (points.length - 1)) * innerW
  const plotted = points.map((point, index) => ({ x: xFor(index), y: yFor(point.value) }))
  const line = smoothPath(plotted)
  const area = `${line} L ${plotted[plotted.length - 1].x} ${pad.t + innerH} L ${plotted[0].x} ${pad.t + innerH} Z`
  const last = plotted[plotted.length - 1]
  const lastValue = points[points.length - 1].value
  const label = `${formatNumber(lastValue, locale, lastValue % 1 === 0 ? 0 : 1)}%`
  const labelWidth = Math.max(40, label.length * 7 + 14)
  const labelX = Math.min(Math.max(pad.l, last.x - labelWidth / 2), width - pad.r - labelWidth)
  const labelY = last.y < pad.t + 28 ? last.y + 10 : last.y - 28
  const ticks = scale.ticks
  const labelEvery = points.length > 8 ? Math.ceil(points.length / 6) : 1

  return (
    <article className="rounded-lg border border-nuw-line bg-white p-4 shadow-sm">
      <h3 className="text-[15px] font-semibold text-zinc-950">{t('searchBoard.trendTitle')}</h3>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-2 h-[220px] w-full"
        role="img"
        aria-label={t('searchBoard.trendLabel', {
          start: formatChartDate(points[0].date, locale),
          end: formatChartDate(points[points.length - 1].date, locale),
        })}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={pad.l} x2={width - pad.r} y1={yFor(tick)} y2={yFor(tick)} stroke="#F3E6DC" strokeDasharray="3 4" />
            <text x={pad.l - 8} y={yFor(tick) + 4} textAnchor="end" className="fill-zinc-400" fontSize="11">
              {formatNumber(tick, locale, tick % 1 === 0 ? 0 : 1)}%
            </text>
          </g>
        ))}
        <path d={area} fill="#F05A0A" fillOpacity="0.08" />
        <path d={line} fill="none" stroke="#F05A0A" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={last.x} cy={last.y} r="5" fill="#FFFFFF" stroke="#F05A0A" strokeWidth="2.5" />
        <g transform={`translate(${labelX}, ${labelY})`}>
          <rect width={labelWidth} height="20" rx="10" fill="#FFFFFF" stroke="#F3E6DC" />
          <text x={labelWidth / 2} y="14" textAnchor="middle" fontSize="11" fontWeight="600" className="fill-zinc-800">
            {label}
          </text>
        </g>
        {points.map((point, index) => (
          index % labelEvery === 0 || index === points.length - 1 ? (
            <text key={point.date} x={xFor(index)} y={height - 10} textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'} className="fill-zinc-400" fontSize="11">
              {formatChartDate(point.date, locale)}
            </text>
          ) : null
        ))}
      </svg>
    </article>
  )
}

type ShareSlice = { id: string; label: string; value: number; color: string }

function ShareCard({
  slices,
  all,
  center,
  centerLabel,
  loading,
}: {
  slices: ShareSlice[]
  all: ShareSlice[]
  center: number
  centerLabel: string
  loading: boolean
}) {
  const t = useTranslations('overview.page')
  const shell = useTranslations('shell')
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const visible = slices.filter((slice) => slice.value > 0 && (slice.id !== 'other' || slices.some((item) => item.id !== 'other' && item.value > 0)))
  const percent = (value: number) => formatPercent(value, locale, value % 1 === 0 ? 0 : 1)
  const labelFor = (slice: ShareSlice) => (slice.id === 'other' ? t('searchBoard.others') : slice.label)
  const competitors = all.filter((slice) => slice.id !== 'you' && slice.id !== 'other')

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (loading || visible.length === 0) {
    return (
      <article className="rounded-lg border border-nuw-line bg-white p-4 shadow-sm">
        <h3 className="text-[15px] font-semibold text-zinc-950">{t('searchBoard.shareTitle')}</h3>
        <p className="mt-4 text-[13px] leading-5 text-zinc-500">{loading ? '...' : t('searchBoard.noShare')}</p>
      </article>
    )
  }

  return (
    <article className="rounded-lg border border-nuw-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-zinc-950">{t('searchBoard.shareTitle')}</h3>
        <button type="button" onClick={() => setOpen(true)} className="text-[13px] font-medium text-[#F05A0A] hover:underline">
          {t('searchBoard.viewAll')}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-6">
        <ShareRing slices={visible} center={percent(center)} centerLabel={centerLabel} label={t('searchBoard.shareTitle')} />
        <ul className="min-w-[180px] flex-1 space-y-2.5">
          {visible.map((slice) => (
            <li key={slice.id} className="flex items-center gap-2 text-[13px] text-zinc-700">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: slice.color }} />
              <span className="min-w-0 flex-1 truncate">{labelFor(slice)}</span>
              <span className="font-medium text-zinc-900">{percent(slice.value)}</span>
            </li>
          ))}
        </ul>
      </div>
      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-900/40 p-4" onMouseDown={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-all-title"
            onMouseDown={(event) => event.stopPropagation()}
            className="grid h-[min(86vh,40rem)] w-full max-w-4xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border border-nuw-line bg-white shadow-menu md:grid-cols-[280px_minmax(0,1fr)] md:grid-rows-1"
          >
            <div className="flex items-center justify-center border-b border-nuw-line px-6 py-8 md:items-start md:border-b-0 md:border-r md:pt-16">
              <ShareRing slices={all.filter((slice) => slice.value > 0)} center={percent(center)} centerLabel={centerLabel} label={t('searchBoard.shareTitle')} />
            </div>
            <div className="flex min-h-0 flex-col">
              <div className="flex items-start justify-between gap-3 px-5 py-4">
                <div>
                  <h2 id="share-all-title" className="text-sm font-semibold text-zinc-950">{t('searchBoard.shareTitle')}</h2>
                  <p className="mt-1 text-[13px] leading-5 text-zinc-500">{t('searchBoard.shareAllNote')}</p>
                  <p className="mt-1 text-[12px] font-medium text-zinc-400">{t('searchBoard.shareCount', { count: competitors.length })}</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} aria-label={shell('close')} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg hover:bg-zinc-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ul className="min-h-0 flex-1 overflow-auto border-t border-nuw-line">
                {all.map((slice) => (
                  <li key={slice.id} className="flex items-center gap-3 border-b border-nuw-line px-5 py-3 last:border-b-0">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: slice.color }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-zinc-800">{labelFor(slice)}</span>
                      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[#FFF1E6]">
                        <span className="block h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, slice.value))}%`, background: slice.color }} />
                      </span>
                    </span>
                    <span className="w-14 text-right text-[13px] font-medium tabular-nums text-zinc-900">{percent(slice.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  )
}

function ShareRing({ slices, center, centerLabel, label }: { slices: ShareSlice[]; center: string; centerLabel: string; label: string }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const gap = 3
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1
  let offset = 0
  return (
    <div className="relative grid h-40 w-40 shrink-0 place-items-center">
      <svg viewBox="0 0 120 120" className="h-40 w-40" role="img" aria-label={label}>
        {slices.map((slice) => {
          const raw = (slice.value / total) * circumference
          const length = raw > gap * 2 ? raw - gap : raw
          const circle = (
            <circle
              key={slice.id}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth="14"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
            />
          )
          offset += raw
          return circle
        })}
      </svg>
      <div className="absolute px-6 text-center">
        <p className="text-[26px] font-semibold leading-none tracking-tight text-zinc-950">{center}</p>
        <p className="mt-1 truncate text-[11px] text-zinc-500">{centerLabel}</p>
      </div>
    </div>
  )
}

function mentionsBrand(chat: ChatRecord, brandId: string) {
  if (chat.brandId === brandId) return true
  return chat.positions?.[brandId] != null
}

function ownCitations(domain: string, domains: { host: string; count: number; you?: boolean }[]) {
  const host = domain.replace(/^www\./, '').toLowerCase()
  return domains
    .filter((row) => row.you || row.host.replace(/^www\./, '').toLowerCase() === host)
    .reduce((sum, row) => sum + row.count, 0)
}

function platformScores(chats: ChatRecord[], brandId: string) {
  const answers = new Map<string, number>()
  const hits = new Map<string, number>()
  for (const chat of chats) {
    const named = mentionsBrand(chat, brandId)
    for (const model of chat.models) {
      answers.set(model, (answers.get(model) ?? 0) + 1)
      if (named) hits.set(model, (hits.get(model) ?? 0) + 1)
    }
  }
  return [...answers.entries()]
    .map(([id, total]) => ({ id, value: total ? ((hits.get(id) ?? 0) / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value)
}

function allShareSlices(brand: { name: string; color: string; metrics: { sov: { value: number } }; competitors: { id: string; name: string; color: string; sov: number }[] }) {
  const yours = Math.max(0, brand.metrics.sov.value)
  const ranked = [...brand.competitors].sort((a, b) => b.sov - a.sov || a.name.localeCompare(b.name))
  const shown = yours + ranked.reduce((sum, item) => sum + Math.max(0, item.sov), 0)
  const others = Math.max(0, 100 - shown)
  const slices: ShareSlice[] = [
    { id: 'you', label: brand.name, value: yours, color: brand.color || sharePalette[0] },
    ...ranked.map((item, index) => ({
      id: `${item.id}-${index}`,
      label: item.name,
      value: Math.max(0, item.sov),
      color: item.color || sharePalette[(index + 1) % sharePalette.length],
    })),
  ]
  if (others > 0.05) slices.push({ id: 'other', label: 'others', value: others, color: '#D5D0CB' })
  return slices
}

function shareSlices(brand: { name: string; color: string; metrics: { sov: { value: number } }; competitors: { id: string; name: string; color: string; sov: number }[] }) {
  const yours = Math.max(0, brand.metrics.sov.value)
  const ranked = [...brand.competitors].filter((item) => item.sov > 0).sort((a, b) => b.sov - a.sov)
  const top = ranked.slice(0, 4)
  const rest = ranked.slice(4).reduce((sum, item) => sum + item.sov, 0)
  const shown = yours + ranked.reduce((sum, item) => sum + item.sov, 0)
  const others = rest + Math.max(0, 100 - shown)
  const slices = [
    { id: 'you', label: brand.name, value: yours, color: brand.color || sharePalette[0] },
    ...top.map((item, index) => ({ id: `${item.id}-${index}`, label: item.name, value: item.sov, color: item.color || sharePalette[(index + 1) % sharePalette.length] })),
  ]
  if (others > 0.05) slices.push({ id: 'other', label: 'others', value: others, color: '#D5D0CB' })
  return slices
}

function rankPrompts(prompts: PromptItem[], chats: ChatRecord[]) {
  const citations = new Map<string, number>()
  for (const chat of chats) {
    const key = (chat.prompt || chat.title || '').trim().toLowerCase()
    if (!key) continue
    citations.set(key, (citations.get(key) ?? 0) + (chat.citations || 0))
  }
  return [...prompts]
    .map((prompt) => ({
      id: prompt.id,
      text: prompt.text,
      rank: prompt.position,
      visibility: prompt.visibility,
      citations: citations.get(prompt.text.trim().toLowerCase()) ?? 0,
    }))
    .sort((a, b) => (b.visibility ?? -1) - (a.visibility ?? -1) || b.citations - a.citations)
    .slice(0, 3)
}

function chartScale(max: number) {
  const padded = max <= 0 ? 10 : Math.min(100, Math.ceil((max * 1.2) / 5) * 5)
  const step = padded <= 20 ? 5 : padded <= 50 ? 10 : 20
  const ticks: number[] = []
  for (let value = padded; value >= 0; value -= step) ticks.push(value)
  return { max: padded, ticks }
}

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return ''
  let path = `M ${points[0].x} ${points[0].y}`
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index]
    const next = points[index + 1]
    const bend = (next.x - current.x) / 2
    path += ` C ${current.x + bend} ${current.y}, ${next.x - bend} ${next.y}, ${next.x} ${next.y}`
  }
  return path
}
