'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowUp, AtSign } from 'lucide-react'
import { metricOrder } from '@/data/types'
import { useBrand, useWorkspace } from '@/components/workspace/workspace-context'
import { BrandMark } from '@/components/shell/brand-mark'
import { formatMetricValue } from '@/lib/format'
import { Menu } from '@/components/ui/overlay'
import { cn } from '@/lib/cn'

const suggestions = ['explain', 'changed', 'compare'] as const
type Skill = (typeof suggestions)[number] | 'generic'

export function AskHero() {
  const t = useTranslations('overview.page')
  const shell = useTranslations('shell')
  const locale = useLocale()
  const brand = useBrand()
  const { agent } = useWorkspace()
  const [query, setQuery] = useState('')
  const [skill, setSkill] = useState<Skill | null>(null)
  const [error, setError] = useState('')
  const [mention, setMention] = useState(false)

  const values = useMemo(() => {
    const metrics = brand.metrics
    return {
      brand: brand.name,
      visibility: formatMetricValue('visibility', metrics.visibility.value, locale),
      sov: formatMetricValue('sov', metrics.sov.value, locale),
      sentiment: formatMetricValue('sentiment', metrics.sentiment.value, locale),
      position: formatMetricValue('position', metrics.position.value, locale),
      source: formatMetricValue('source', metrics.source.value, locale),
      winRate: formatMetricValue('winRate', metrics.winRate.value, locale),
      rank: '1',
    }
  }, [brand, locale])

  const submit = (nextSkill: Skill = skill ?? 'generic') => {
    if (!query.trim()) {
      setError(shell('agentNeedQuestion'))
      setSkill(null)
      return
    }
    setError('')
    setSkill(nextSkill)
  }

  return (
    <div id="ask" className="relative mx-auto flex w-full max-w-[680px] flex-col items-center px-4 text-center">
      <BrandMark initials={brand.initials} color={brand.color} size={48} />
      <h2 className="mt-5 text-[28px] font-semibold leading-tight tracking-tight text-zinc-950">
        {t('heroLead')}
        <br />
        {t('heroBrand', { brand: brand.name })}
      </h2>
      <form
        className="mt-6 flex w-full items-center gap-2 rounded-full border border-nuw-line bg-white px-4 py-2 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <input
          id="ask-input"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setMention(event.target.value.endsWith('@'))
            if (event.target.value.endsWith('/')) setSkill(null)
            setError('')
          }}
          placeholder={t('askPlaceholder')}
          className="h-9 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-zinc-400"
        />
        <Menu
          align="right"
          panelClassName="w-52"
          trigger={() => (
            <button type="button" aria-label={t('insertMetric')} className="grid h-8 w-8 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100">
              <AtSign className="h-4 w-4" />
            </button>
          )}
        >
          {metricOrder.map((metric) => (
            <button
              key={metric}
              type="button"
              className="block w-full rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100"
              onClick={() => setQuery((current) => `${current.replace(/@$/, '')}${t(`metric.${metric}`)} `)}
            >
              {t(`metric.${metric}`)}
            </button>
          ))}
        </Menu>
        <button type="submit" aria-label={t('askSubmit')} className="grid h-8 w-8 place-items-center rounded-full border border-nuw-line text-zinc-700 hover:bg-zinc-50">
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>
      {mention ? <p className="mt-2 text-[12px] text-zinc-500">{t('mentionHint')}</p> : null}
      {query.endsWith('/') ? (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              className="rounded-full border border-nuw-line px-3 py-1 text-[12px] hover:bg-zinc-50"
              onClick={() => {
                setQuery(t(`suggest.${item}`))
                setSkill(item)
                setError('')
              }}
            >
              / {t(`suggest.${item}`)}
            </button>
          ))}
        </div>
      ) : null}
      {error ? <p className="mt-3 text-[13px] text-[#e11d48]">{error}</p> : null}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {suggestions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setQuery(t(`suggest.${item}`))
              setSkill(item)
              setError('')
            }}
            className={cn(
              'rounded-full border border-nuw-line bg-white px-3 py-1.5 text-[13px] text-zinc-600 hover:bg-zinc-50',
              skill === item && 'border-zinc-300 bg-zinc-50 text-zinc-900',
            )}
          >
            {t(`suggest.${item}`)}
          </button>
        ))}
      </div>
      {skill && query.trim() ? (
        <div className="mt-5 w-full rounded-2xl border border-nuw-line bg-white p-4 text-left shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{t('sampleLabel')}</p>
          <p className="mt-2 text-[14px] leading-6 text-zinc-800">{t(`answer.${skill}`, values)}</p>
          <p className="mt-3 text-[12px] leading-5 text-zinc-500">{t('sampleNote')}</p>
        </div>
      ) : agent ? (
        <p className="mt-4 text-[13px] text-zinc-500">{shell('agentEmpty', { brand: brand.name })}</p>
      ) : null}
    </div>
  )
}
