'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowUpRight, Check, Info, Loader2 } from 'lucide-react'
import { Link } from '@/i18n/routing'
import type { ActionItem, ActionPlanGroup } from '@/data/types'
import { errorText, useV2, v2Send } from '@/lib/v2'
import { ApiNote } from '@/components/data/api-note'
import { cn } from '@/lib/cn'

export function ActionPlan() {
  const t = useTranslations('overview.page')
  const [updating, setUpdating] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const plan = useV2<ActionPlanGroup[]>('actions', { status: ['todo', 'in_progress'] })
  const planGroups = (plan.data ?? []).map((group) => ({
    ...group,
    tasks: group.tasks.slice(0, 3),
  }))

  const complete = async (action: ActionItem) => {
    setUpdating(action.id)
    setUpdateError(null)
    try {
      await v2Send<ActionItem>('PATCH', `actions/${encodeURIComponent(action.id)}`, { status: 'done' })
      plan.reload()
    } catch (error) {
      setUpdateError(errorText(error, 'This action could not be completed. Try again.'))
    } finally {
      setUpdating(null)
    }
  }

  return (
    <section id="plan" className="rounded-2xl border border-nuw-line bg-white">
      <header className="flex items-center px-4 py-3">
        <h2 className="inline-flex items-center gap-1 text-[15px] font-semibold">
          {t('planTitle')} <Info className="h-3.5 w-3.5 text-zinc-400" />
        </h2>
        <Link href="/actions" className="ml-auto inline-flex items-center gap-1 text-[13px] text-zinc-500 hover:text-zinc-900">
          {t('goToActions')} <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </header>
      <div className="px-4"><ApiNote loading={plan.loading} error={plan.error ?? updateError} /></div>
      <div className="grid gap-6 px-4 pb-4 md:grid-cols-2">
        {planGroups.map((group) => {
          return (
            <div key={group.id}>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-[13px] font-medium">{t(`plan.${group.id}.title`)}</p>
                <span className="text-[12px] text-zinc-400">
                  {group.total === 0 ? t('nothingOpen') : `${group.total} open`}
                </span>
              </div>
              {group.tasks.length === 0 ? <p className="text-[13px] leading-5 text-zinc-500">{emptyGroupMessage(group.id)}</p> : null}
              <ul className="space-y-2">
                {group.tasks.map((task) => {
                  return (
                    <li key={task.id} className="rounded-lg border border-zinc-100 p-2">
                      <button
                        type="button"
                        disabled={updating === task.id}
                        onClick={() => complete(task)}
                        className="flex w-full items-start gap-2 rounded-lg px-1 py-1 text-left hover:bg-zinc-50 disabled:opacity-60"
                      >
                        <span className={cn('mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border border-zinc-300', task.status === 'in_progress' && 'border-amber-500')}>
                          {updating === task.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-zinc-400" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-medium text-zinc-800">{task.title}</span>
                          <span className="mt-0.5 block text-[12px] leading-5 text-zinc-500">{task.recommendedChange}</span>
                          <span className="mt-1 flex flex-wrap gap-1">
                            <span className={cn('rounded-md px-1.5 py-0.5 text-[11px]', priorityClass(task.priority))}>{task.priority}</span>
                            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600">{task.evidence.length} evidence</span>
                            {task.impact ? (
                              <span className="rounded-md bg-orange-50 px-1.5 py-0.5 text-[11px] text-orange-700">
                                {task.impact.affectedResults}/{task.impact.totalResults} model checks affected
                              </span>
                            ) : null}
                            {task.status === 'in_progress' ? <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">In progress</span> : null}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              {group.total > group.tasks.length ? (
                <p className="mt-2 pl-6 text-[12px] text-zinc-500">{t('moreTasks', { count: group.total - group.tasks.length })}</p>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function priorityClass(priority: ActionItem['priority']) {
  if (priority === 'critical') return 'bg-rose-100 text-rose-700'
  if (priority === 'high') return 'bg-orange-100 text-orange-700'
  if (priority === 'medium') return 'bg-amber-50 text-amber-700'
  return 'bg-zinc-100 text-zinc-600'
}

function emptyGroupMessage(group: ActionPlanGroup['id']) {
  if (group === 'read') return 'No site-reading issues are open. The automatic audit will add them here.'
  if (group === 'pages') return 'No owned-page improvements are open.'
  if (group === 'mentions') return 'No external-coverage recommendations are open.'
  return 'No incorrect brand claims are open.'
}
