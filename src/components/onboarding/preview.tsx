'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, Clock, Compass, MessageSquare, PanelLeft } from 'lucide-react'
import { cn } from '@/lib/cn'

function Bar({ className }: { className?: string }) {
  return <span className={cn('block h-2 rounded-full bg-zinc-100', className)} />
}

function SideRow({ width }: { width: string }) {
  return (
    <span className="flex items-center gap-2 px-1">
      <span className="h-2.5 w-2.5 rounded-[3px] bg-zinc-100" />
      <Bar className={width} />
    </span>
  )
}

/**
 * Faded dashboard behind each step. `topics` switches the main area to the
 * prompts layout; `topicsPane` replaces the topic list when it must be editable.
 */
export function DashboardPreview({
  name,
  highlightName,
  topics,
  topicsPane,
  activeTopic,
}: {
  name?: string
  highlightName?: boolean
  topics?: string[] | null
  topicsPane?: ReactNode
  activeTopic?: string
}) {
  const t = useTranslations('onboarding')
  const promptsLayout = topics !== undefined || topicsPane !== undefined

  return (
    <div className="relative mx-auto w-full max-w-[800px]">
      <div
        className={cn(
          'grid grid-cols-[140px_1fr] overflow-hidden rounded-xl border border-nuw-line bg-white shadow-card sm:grid-cols-[170px_1fr]',
          topicsPane ? 'h-[min(300px,45vh)] min-h-[200px]' : 'h-[min(230px,32vh)] min-h-[150px]',
        )}
      >
        <div className="flex flex-col gap-3 border-r border-nuw-line p-2.5">
          <span
            className={cn(
              'flex h-7 items-center gap-1.5 rounded-lg px-2 text-[11px] font-medium text-zinc-700 transition',
              highlightName ? 'ring-2 ring-nuw-primary/60' : '',
            )}
          >
            <span className="grid h-3.5 w-3.5 place-items-center rounded-[3px] bg-zinc-200 text-[7px] text-zinc-600">{name ? name[0]?.toUpperCase() : ''}</span>
            {name ? <span className="truncate">{name}</span> : <Bar className="w-14" />}
            <ChevronDown className="h-3 w-3 shrink-0 text-zinc-400" />
          </span>
          <div className="flex flex-col gap-2">
            <Bar className="w-8" />
            <SideRow width="w-16" />
            <SideRow width="w-12" />
          </div>
          {promptsLayout ? (
            <div className="flex flex-col gap-2">
              <span className="px-1 text-[10px] text-zinc-500">{t('previewPrompts')}</span>
              <span className="flex items-center gap-2 px-1 text-[10px] text-zinc-400">
                <MessageSquare className="h-3 w-3" />
                <Bar className="w-10" />
              </span>
              <span className="flex items-center gap-2 rounded-md bg-zinc-100 px-1 py-0.5 text-[10px] text-zinc-600">
                <Compass className="h-3 w-3" />
                {t('previewDiscovery')}
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Bar className="w-8" />
              <SideRow width="w-14" />
              <SideRow width="w-16" />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="flex h-9 items-center gap-2 border-b border-nuw-line px-3">
            <PanelLeft className="h-3 w-3 text-zinc-400" />
            <Bar className="w-16" />
            <span className="ml-auto flex gap-1.5">
              <span className="grid h-5 w-5 place-items-center rounded-full border border-nuw-line">
                <MessageSquare className="h-2.5 w-2.5 text-zinc-400" />
              </span>
              <span className="grid h-5 w-5 place-items-center rounded-full border border-nuw-line">
                <Clock className="h-2.5 w-2.5 text-zinc-400" />
              </span>
            </span>
          </div>
          {promptsLayout ? (
            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,190px)_1fr]">
              <div className="min-h-0 overflow-auto border-r border-nuw-line">
                <p className="px-3 pb-1 pt-2 text-[11px] font-medium text-zinc-800">{t('previewTopics')}</p>
                {topicsPane ?? (
                  <ul className="flex flex-col">
                    {(topics ?? []).length
                      ? (topics ?? []).map((topic) => (
                          <li
                            key={topic}
                            className={cn('mx-1.5 flex items-center justify-between rounded-md px-1.5 py-1 text-[11px] text-zinc-700', topic === activeTopic && 'bg-zinc-100')}
                          >
                            <span className="truncate">{topic}</span>
                            <span className="text-zinc-300">-</span>
                          </li>
                        ))
                      : ['w-24', 'w-20', 'w-28', 'w-16', 'w-20'].map((width, index) => (
                          <li key={index} className="px-3 py-1.5">
                            <Bar className={cn(width, 'animate-pulse')} />
                          </li>
                        ))}
                  </ul>
                )}
              </div>
              <div className="flex min-w-0 flex-col">
                <div className="flex h-8 items-center border-b border-nuw-line px-3 text-[11px] font-medium text-zinc-700">
                  {activeTopic ? <span className="truncate">{activeTopic}</span> : <Bar className="w-24" />}
                  <span className="ml-auto h-4 w-14 rounded-md bg-zinc-100" />
                </div>
                <div className="flex h-6 items-center gap-6 bg-zinc-50 px-3">
                  <Bar className="w-10 bg-zinc-200" />
                  <Bar className="ml-auto w-6 bg-zinc-200" />
                  <Bar className="w-6 bg-zinc-200" />
                  <Bar className="w-6 bg-zinc-200" />
                </div>
                {['w-36', 'w-24', 'w-40', 'w-28', 'w-32'].map((width, index) => (
                  <div key={index} className="flex items-center gap-6 border-b border-zinc-100 px-3 py-2">
                    <Bar className={cn(width, activeTopic && 'animate-pulse')} />
                    <Bar className="ml-auto w-6" />
                    <Bar className="w-6" />
                    <Bar className="w-6" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 p-3">
              <div className="flex gap-2">
                {['w-16', 'w-14', 'w-20', 'w-16'].map((width, index) => (
                  <span key={index} className="flex h-5 items-center rounded-md border border-nuw-line px-2">
                    <Bar className={width} />
                  </span>
                ))}
              </div>
              <Bar className="w-14 bg-zinc-200" />
              <Bar className="w-40" />
              <div className="relative h-24 rounded-lg border border-nuw-line">
                <svg viewBox="0 0 400 90" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                  <path d="M0 80 C 80 78, 120 40, 200 30 S 330 25, 400 60" fill="none" stroke="#e4e6ee" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
      {topicsPane ? null : <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 rounded-b-xl bg-gradient-to-b from-transparent to-white" />}
    </div>
  )
}
