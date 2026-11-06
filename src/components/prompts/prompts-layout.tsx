'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import type { PromptStatus, Topic } from '@/data/prompts'
import { topicLabel } from '@/components/prompts/bits'
import { ConfirmDialog, TopicNameDialog } from '@/components/prompts/dialogs'
import { FilterRow } from '@/components/prompts/filter-row'
import { usePrompts } from '@/components/prompts/prompts-context'
import { TopicsPane } from '@/components/prompts/topics-pane'
import { useToast } from '@/components/ui/overlay'
import { errorText } from '@/lib/v2'

export function PromptsLayout({
  status,
  showCounts = true,
  showSuggested = false,
  compactFilters = false,
  children,
}: {
  status: PromptStatus | 'all'
  showCounts?: boolean
  showSuggested?: boolean
  compactFilters?: boolean
  children: ReactNode
}) {
  const t = useTranslations('prompts.page')
  const { push } = useToast()
  const { topics, prompts, addTopic, renameTopic, deleteTopic, selectedTopicId, setSelectedTopicId, topicsOpen } = usePrompts()
  const [createOpen, setCreateOpen] = useState(false)
  const [rename, setRename] = useState<Topic | null>(null)
  const [remove, setRemove] = useState<Topic | null>(null)

  const saveCreate = async (name: string) => {
    await addTopic(name)
    setCreateOpen(false)
    push({ title: t('topicCreated'), body: t('topicCreatedBody', { name }) })
  }

  const saveRename = async (name: string) => {
    if (!rename) return
    await renameTopic(rename.id, name)
    setRename(null)
  }

  const confirmDelete = async () => {
    if (!remove) return
    try {
      await deleteTopic(remove.id)
      push({ title: t('topicDeleted'), body: t('topicDeletedBody') })
    } catch (caught) {
      push({ title: t('topicKept'), body: errorText(caught) })
    }
    setRemove(null)
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <FilterRow compact={compactFilters} />
      <div className="flex min-h-0 flex-1">
        <div className={topicsOpen ? 'hidden h-full md:block' : 'hidden'}>
          <TopicsPane
            status={status}
            showCounts={showCounts}
            showSuggested={showSuggested}
            onCreate={() => setCreateOpen(true)}
            onRename={setRename}
            onDelete={setRemove}
          />
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <label className="flex items-center gap-2 border-b border-nuw-line px-3 py-2 text-[13px] md:hidden">
            <span className="text-zinc-500">{t('topic')}</span>
            <select value={selectedTopicId} onChange={(event) => setSelectedTopicId(event.target.value)} className="h-8 min-w-0 flex-1 rounded-lg border border-nuw-line bg-white px-2">
              <option value="all">{t('allTopics')}</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>{topicLabel(topic, t)}</option>
              ))}
            </select>
          </label>
          {children}
        </div>
      </div>
      <TopicNameDialog open={createOpen} title={t('newTopic')} initial="" onClose={() => setCreateOpen(false)} onSave={saveCreate} />
      <TopicNameDialog open={Boolean(rename)} title={t('renameTopic')} initial={rename ? topicLabel(rename, t) : ''} onClose={() => setRename(null)} onSave={saveRename} />
      <ConfirmDialog
        open={Boolean(remove)}
        title={t('deleteTopicTitle')}
        body={remove ? (prompts.filter((item) => item.topicId === remove.id).length ? t('deleteTopicBody', { name: topicLabel(remove, t), count: prompts.filter((item) => item.topicId === remove.id).length }) : t('deleteTopicEmpty', { name: topicLabel(remove, t) })) : ''}
        confirm={remove && prompts.some((item) => item.topicId === remove.id) ? t('close') : t('delete')}
        danger={Boolean(remove && !prompts.some((item) => item.topicId === remove.id))}
        onClose={() => setRemove(null)}
        onConfirm={async () => {
          if (remove && prompts.some((item) => item.topicId === remove.id)) {
            setRemove(null)
            return
          }
          await confirmDelete()
        }}
      />
    </div>
  )
}
