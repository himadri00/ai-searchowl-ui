'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowUpRight, Info } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { useV2 } from '@/lib/v2'
import { ApiNote } from '@/components/data/api-note'
import { cn } from '@/lib/cn'

export function ActionPlan() {
  const t = useTranslations('overview.page')
  const [done, setDone] = useState<string[]>([])
  const plan = useV2<{ id: string; total: number; tasks: { id: string; tags: string[] }[] }[]>('actions')
  const planGroups = plan.data ?? []

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
      <div className="px-4"><ApiNote loading={plan.loading} error={plan.error} /></div>
      <div className="grid gap-6 px-4 pb-4 md:grid-cols-2">
        {planGroups.map((group) => {
          const finished = group.tasks.filter((task) => done.includes(task.id)).length
          return (
            <div key={group.id}>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-[13px] font-medium">{t(`plan.${group.id}.title`)}</p>
                <span className="text-[12px] text-zinc-400">
                  {group.total === 0 ? t('nothingOpen') : `${finished} / ${group.total}`}
                </span>
              </div>
              {group.tasks.length === 0 ? <p className="text-[13px] text-zinc-500">{t('claimsClear')}</p> : null}
              <ul className="space-y-2">
                {group.tasks.map((task) => {
                  const checked = done.includes(task.id)
                  return (
                    <li key={task.id}>
                      <button
                        type="button"
                        onClick={() => setDone((current) => (checked ? current.filter((id) => id !== task.id) : [...current, task.id]))}
                        className="flex w-full items-start gap-2 rounded-lg px-1 py-1 text-left hover:bg-zinc-50"
                      >
                        <span className={cn('mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border', checked ? 'border-emerald-500 bg-emerald-500 text-[10px] text-white' : 'border-zinc-300')}>
                          {checked ? '✓' : ''}
                        </span>
                        <span>
                          <span className={cn('block text-[13px]', checked && 'text-zinc-400 line-through')}>{t(`plan.${group.id}.${task.id}`)}</span>
                          <span className="mt-1 flex flex-wrap gap-1">
                            {task.tags.map((tag) => (
                              <span key={tag} className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600">
                                {t(`planTag.${tag}`)}
                              </span>
                            ))}
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
