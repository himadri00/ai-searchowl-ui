'use client'

import { ArrowUpRight, CheckCircle2, FileQuestion, ListChecks, MessageSquareText } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { ApiNote } from '@/components/data/api-note'
import { useBrand, useWorkspace } from '@/components/workspace/workspace-context'
import type { PromptItem } from '@/data/prompts'
import type { ActionPlanGroup, ChatRecord } from '@/data/types'
import { Link } from '@/i18n/routing'
import { browserTimeZone, formatDelta, formatNumber, formatPercent } from '@/lib/format'
import { rangeQuery, useV2 } from '@/lib/v2'

export function DecisionBrief() {
  const t = useTranslations('overview.page')
  const shell = useTranslations('shell')
  const locale = useLocale()
  const brand = useBrand()
  const brandName = brand.name.trim() || t('decision.yourBrand')
  const { range } = useWorkspace()
  const prompts = useV2<{ total: number; prompts: PromptItem[] }>('prompts', { limit: 1, offset: 0, status: 'active' })
  const answers = useV2<{ total: number; chats: ChatRecord[] }>('prompt-runs/chats', {
    limit: 100,
    timezone: browserTimeZone(),
    ...rangeQuery(range),
  })
  const actions = useV2<ActionPlanGroup[]>('actions', { status: ['todo', 'in_progress'] })

  const savedAnswers = answers.data?.chats ?? []
  const missedAnswers = savedAnswers.filter((answer) => answer.verdict?.state === 'missing').length
  const openWork = (actions.data ?? []).reduce((total, group) => total + group.total, 0)
  const mentionRate = brand.metrics.visibility
  const ownSourceRate = brand.metrics.source
  const count = (value: number) => formatNumber(value, locale, 0)
  const percent = (value: number) => formatPercent(value, locale, value % 1 === 0 ? 0 : 1)

  const steps = [
    {
      id: 'answers',
      number: '01',
      title: t('decision.answersTitle'),
      body: t('decision.answersBody', { count: answers.loading ? '…' : count(answers.data?.total ?? 0) }),
      href: '#chats',
      icon: MessageSquareText,
    },
    {
      id: 'misses',
      number: '02',
      title: t('decision.missesTitle'),
      body: answers.loading
        ? t('decision.loading')
        : missedAnswers
          ? t('decision.missesBody', { count: count(missedAnswers) })
          : t('decision.noMissesBody'),
      href: '/prompts/gap',
      icon: FileQuestion,
    },
    {
      id: 'work',
      number: '03',
      title: t('decision.workTitle'),
      body: actions.loading
        ? t('decision.loading')
        : openWork
          ? t('decision.workBody', { count: count(openWork) })
          : t('decision.noWorkBody'),
      href: '/actions',
      icon: ListChecks,
    },
    {
      id: 'outcomes',
      number: '04',
      title: t('decision.outcomesTitle'),
      body: t('decision.outcomesBody'),
      href: '/actions',
      icon: CheckCircle2,
    },
  ] as const

  return (
    <section id="ask" className="overflow-hidden rounded-2xl border border-nuw-line bg-white">
      <div className="border-b border-nuw-line bg-[#F7F5F1] px-4 py-5 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-nuw-accent">{t('decision.eyebrow')}</p>
            <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.035em] text-zinc-950">
              {t('decision.title', { brand: brandName })}
            </h2>
            <p className="mt-1 max-w-2xl text-[13px] leading-5 text-zinc-600">{t('decision.body')}</p>
          </div>
          <span className="rounded-full border border-nuw-line bg-white px-3 py-1.5 text-[12px] text-zinc-600">
            {shell(range === 'all' ? 'timeAll' : range === '7d' ? 'time7' : range === '30d' ? 'time30' : 'time90')}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label={t('metric.visibility')}
            value={percent(mentionRate.value)}
            delta={mentionRate.delta == null ? null : formatDelta('visibility', mentionRate.delta, locale)}
            bad={mentionRate.tone === 'bad'}
            help={t('metricHelp.visibility')}
          />
          <Metric
            label={t('metric.sov')}
            value={percent(brand.metrics.sov.value)}
            delta={brand.metrics.sov.delta == null ? null : formatDelta('sov', brand.metrics.sov.delta, locale)}
            bad={brand.metrics.sov.tone === 'bad'}
            help={t('metricHelp.sov')}
          />
          <Metric
            label={t('metric.source')}
            value={percent(ownSourceRate.value)}
            delta={ownSourceRate.delta == null ? null : formatDelta('source', ownSourceRate.delta, locale)}
            bad={ownSourceRate.tone === 'bad'}
            help={t('metricHelp.source')}
          />
          <Metric
            label={t('decision.trackedQuestions')}
            value={prompts.loading ? '…' : count(prompts.data?.total ?? 0)}
            delta={null}
            bad={false}
            help={t('decision.trackedQuestionsHelp')}
          />
        </div>
      </div>

      <div className="px-4 pt-3 sm:px-5">
        <ApiNote loading={answers.loading || actions.loading || prompts.loading} error={answers.error ?? actions.error ?? prompts.error} />
      </div>
      <div className="grid divide-y divide-nuw-line sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        {steps.map((step) => (
          <Link key={step.id} href={step.href} className="group flex min-w-0 gap-3 px-4 py-4 hover:bg-zinc-50 sm:px-5">
            <step.icon className="mt-0.5 h-4 w-4 shrink-0 text-nuw-accent" />
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                {step.number}
                <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
              <span className="mt-1 block text-[13px] font-semibold text-zinc-900">{step.title}</span>
              <span className="mt-1 block text-[12px] leading-5 text-zinc-500">{step.body}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function Metric({ label, value, delta, bad, help }: { label: string; value: string; delta: string | null; bad: boolean; help: string }) {
  return (
    <article className="rounded-xl border border-nuw-line bg-white px-3.5 py-3">
      <p className="text-[12px] text-zinc-500" title={help}>{label}</p>
      <p className="mt-1 flex items-baseline gap-2">
        <span className="text-[24px] font-semibold tracking-[-0.03em] text-zinc-950">{value}</span>
        {delta ? <span className={bad ? 'text-[12px] font-medium text-rose-600' : 'text-[12px] font-medium text-emerald-700'}>{delta}</span> : null}
      </p>
    </article>
  )
}
