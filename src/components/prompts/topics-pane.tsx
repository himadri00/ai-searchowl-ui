'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { MoreHorizontal, Plus, SlidersHorizontal } from 'lucide-react'
import type { PromptStatus, Topic } from '@/data/prompts'
import { topicLabel } from '@/components/prompts/bits'
import { usePrompts } from '@/components/prompts/prompts-context'
import { Menu, useMenu } from '@/components/ui/overlay'
import { cn } from '@/lib/cn'

export function TopicsPane({
  status,
  showCounts,
  showSuggested,
  onCreate,
  onRename,
  onDelete,
}: {
  status: PromptStatus | 'all'
  showCounts: boolean
  showSuggested?: boolean
  onCreate: () => void
  onRename: (topic: Topic) => void
  onDelete: (topic: Topic) => void
}) {
  const t = useTranslations('prompts.page')
  const { topics, prompts, selectedTopicId, setSelectedTopicId } = usePrompts()
  const [sort, setSort] = useState<'count' | 'name'>('count')
  const [showEmpty, setShowEmpty] = useState(true)

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const topic of topics) map.set(topic.id, 0)
    for (const item of prompts) {
      const listed = matchesTab(status, item.status)
      if (!listed) continue
      map.set(item.topicId, (map.get(item.topicId) ?? 0) + 1)
    }
    return map
  }, [prompts, status, topics])

  const rows = topics
    .filter((topic) => showEmpty || (counts.get(topic.id) ?? 0) > 0)
    .slice()
    .sort((a, b) => {
      if (sort === 'name') return topicLabel(a, t).localeCompare(topicLabel(b, t))
      return (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0)
    })

  const total = prompts.filter((item) => matchesTab(status, item.status)).length

  return (
    <aside className="flex w-[232px] shrink-0 flex-col border-r border-nuw-line bg-white">
      <div className="flex items-center justify-between px-3 pb-1 pt-3">
        <p className="text-[13px] font-medium">{t('topics')}</p>
        <Menu
          align="right"
          panelClassName="w-52"
          trigger={() => (
            <button type="button" aria-label={t('topicSettings')} className="grid h-7 w-7 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          )}
        >
          <SortChoice label={t('sortCount')} onSelect={() => setSort('count')} />
          <SortChoice label={t('sortName')} onSelect={() => setSort('name')} />
          <SortChoice label={showEmpty ? t('hideEmpty') : t('showEmpty')} onSelect={() => setShowEmpty((current) => !current)} />
        </Menu>
      </div>
      <button type="button" onClick={onCreate} className="mx-2 flex items-center justify-between rounded-lg px-2 py-2 text-left text-[13px] text-zinc-700 hover:bg-zinc-100">
        {t('newTopic')}
        <Plus className="h-3.5 w-3.5 text-zinc-500" />
      </button>
      <div className="min-h-0 flex-1 overflow-auto px-2 pb-3">
        {showCounts ? (
          <TopicRow label={t('allTopics')} count={total} active={selectedTopicId === 'all'} onClick={() => setSelectedTopicId('all')} />
        ) : null}
        {rows.length === 0 ? <p className="px-2 py-3 text-[12px] leading-5 text-zinc-500">{t('noTopics')}</p> : null}
        {rows.map((topic) => (
          <TopicRow
            key={topic.id}
            label={topicLabel(topic, t)}
            count={showCounts ? counts.get(topic.id) ?? 0 : undefined}
            active={selectedTopicId === topic.id}
            onClick={() => setSelectedTopicId(topic.id)}
            menu={
              <Menu
                align="right"
                panelClassName="w-40"
                trigger={() => (
                  <button type="button" aria-label={t('topicMenu')} onClick={(event) => event.stopPropagation()} className="grid h-6 w-6 place-items-center rounded text-zinc-400 hover:bg-white hover:text-zinc-700">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                )}
              >
                <SortChoice label={t('rename')} onSelect={() => onRename(topic)} />
                <SortChoice label={t('delete')} danger onSelect={() => onDelete(topic)} />
              </Menu>
            }
          />
        ))}
        {showSuggested ? (
          <div className="mt-4 px-2">
            <p className="text-[12px] text-zinc-400">{t('suggestedTopics')}</p>
            <div className="mt-2 space-y-2" aria-hidden>
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-7 rounded-md bg-zinc-100" />
              ))}
            </div>
            <p className="mt-2 text-[12px] leading-5 text-zinc-500">{t('suggestedTopicsNote')}</p>
          </div>
        ) : null}
      </div>
    </aside>
  )
}

function matchesTab(tab: PromptStatus | 'all', status: PromptStatus) {
  if (tab === 'all') return status === 'active' || status === 'suggested' || status === 'discovery'
  if (tab === 'suggested') return status === 'suggested' || status === 'discovery'
  return status === tab
}

function SortChoice({ label, onSelect, danger }: { label: string; onSelect: () => void; danger?: boolean }) {
  const { close } = useMenu()
  return (
    <button
      type="button"
      onClick={() => {
        onSelect()
        close()
      }}
      className={cn('block w-full rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100', danger && 'text-rose-600 hover:bg-rose-50')}
    >
      {label}
    </button>
  )
}

function TopicRow({
  label,
  count,
  active,
  onClick,
  menu,
}: {
  label: string
  count?: number
  active: boolean
  onClick: () => void
  menu?: ReactNode
}) {
  return (
    <div className={cn('group flex items-center rounded-lg pr-1', active ? 'bg-zinc-100' : 'hover:bg-zinc-50')}>
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left text-[13px]">
        <span className="truncate">{label}</span>
        {count != null ? <span className="ml-auto shrink-0 text-zinc-400">{count}</span> : null}
      </button>
      {menu ? <span className="opacity-0 group-hover:opacity-100">{menu}</span> : null}
    </div>
  )
}
