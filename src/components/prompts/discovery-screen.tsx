'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChartColumn, Check, ChevronDown, ChevronLeft, ChevronRight, Search, Settings, Sparkles } from 'lucide-react'
import { fillBrand, mentionsBrand, type ColumnId, type PromptItem } from '@/data/prompts'
import { errorText } from '@/lib/v2'
import { ApiNote } from '@/components/data/api-note'
import { LimitRing, topicLabel } from '@/components/prompts/bits'
import { defaultDiscoverySetup, DistributionDrawer, OverviewPanel, type DiscoverySetup } from '@/components/prompts/discovery-panel'
import { PromptsLayout } from '@/components/prompts/prompts-layout'
import { PromptTable } from '@/components/prompts/prompt-table'
import { usePrompts } from '@/components/prompts/prompts-context'
import { rowMatches, sortRows, type SortState } from '@/components/prompts/query'
import { useBrand } from '@/components/workspace/workspace-context'
import { Menu, Modal, useToast } from '@/components/ui/overlay'
import { cn } from '@/lib/cn'

const pageSize = 30
const columnOrder: ColumnId[] = ['volume', 'branding', 'intent', 'tags', 'location', 'added']

export function DiscoveryScreen() {
  const t = useTranslations('prompts.page')
  const brand = useBrand()
  const { push } = useToast()
  const store = usePrompts()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<SortState>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [limitOpen, setLimitOpen] = useState(false)
  const [overview, setOverview] = useState(false)
  const [setupOpen, setSetupOpen] = useState(false)
  const [setup, setSetup] = useState<DiscoverySetup>(defaultDiscoverySetup)
  const [columns, setColumns] = useState<ColumnId[]>(['volume', 'branding', 'intent', 'tags'])
  const [editing, setEditing] = useState<PromptItem | null>(null)
  const [draft, setDraft] = useState('')
  const [editError, setEditError] = useState('')

  const [saving, setSaving] = useState(false)
  const promptLimit = store.promptLimit

  useEffect(() => {
    if (store.selectedTopicId !== 'all' || !store.topics.length) return
    const withDiscovery = store.topics.find((item) => store.prompts.some((prompt) => prompt.status === 'discovery' && prompt.topicId === item.id))
    store.setSelectedTopicId((withDiscovery ?? store.topics[0]).id)
    // Landing on Discovery opens the topic that has suggestions, once topics have loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.topics.length])

  const topic = store.topics.find((item) => item.id === store.selectedTopicId)
  const topicName = topic ? topicLabel(topic, t) : t('allTopics')
  const activeCount = store.prompts.filter((item) => item.status === 'active' && (store.selectedTopicId === 'all' || item.topicId === store.selectedTopicId)).length
  const tracked = store.prompts.filter((item) => item.status === 'active').length
  const scoped = store.prompts.filter((item) => item.status === 'discovery' && (store.selectedTopicId === 'all' || item.topicId === store.selectedTopicId))
  const filtered = scoped.filter((item) => rowMatches(item, store.filters, store.selectedTopicId, query, brand.name))
  const sorted = sortRows(filtered, sort)
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, pages - 1)
  const visible = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize)

  const generate = async () => {
    if (store.selectedTopicId === 'all') {
      push({ title: t('needTopicTitle'), body: t('needTopicBody') })
      return
    }
    setBusy(true)
    try {
      const added = await store.discover(store.selectedTopicId, setup)
      if (!added) push({ title: t('discoverCapTitle'), body: t('discoverCapBody') })
      else push({ title: t('discoverAddedTitle'), body: setup.context.trim() ? t('discoverAddedContext', { count: added }) : t('discoverAddedBody', { count: added }) })
    } catch (caught) {
      push({ title: t('requestFailedTitle'), body: errorText(caught) })
    } finally {
      setBusy(false)
    }
  }

  const activate = async (ids: string[]) => {
    if (!ids.length) {
      push({ title: t('nothingToReviewTitle'), body: t('nothingToReview') })
      return
    }
    if (promptLimit <= 0) {
      push({ title: t('limitMissingTitle'), body: t('limitMissingBody') })
      return
    }
    const room = Math.max(0, promptLimit - tracked)
    const result = await store.setStatus(ids.slice(0, room), 'active')
    const left = ids.length - result.done
    if (!result.done) push({ title: t('limitTitle'), body: result.error ?? t('limitFull', { max: promptLimit }) })
    else if (left) push({ title: t('trackedPartialTitle'), body: t('trackedPartial', { moved: result.done, left, max: promptLimit }) })
    else push({ title: t('activatedTitle'), body: t('activatedBody', { count: result.done }) })
    setSelected([])
  }

  const reject = async (ids: string[]) => {
    const result = await store.remove(ids)
    if (result.done) push({ title: t('rejectedTitle'), body: ids.length === 1 ? t('rejectedOne') : t('rejectedBody', { count: result.done }) })
    if (result.failed) push({ title: t('requestFailedTitle'), body: t('bulkFailed', { count: result.failed, reason: result.error ?? '' }) })
    setSelected([])
  }

  const saveEdit = async () => {
    if (!editing) return
    const text = draft.trim()
    if (!text) {
      setEditError(t('editEmpty'))
      return
    }
    if (editing.branding !== 'branded' && mentionsBrand(text, brand.name)) {
      setEditError(t('lineBrand', { brand: brand.name, line: text }))
      return
    }
    setSaving(true)
    try {
      await store.updateText(editing.id, text)
      setEditing(null)
      push({ title: t('promptSaved'), body: t('promptSavedBody') })
    } catch (caught) {
      setEditError(errorText(caught))
    } finally {
      setSaving(false)
    }
  }

  return (
    <PromptsLayout status="discovery" showCounts={false} compactFilters>
      <div className="flex min-h-0 flex-1">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-3 border-b border-nuw-line px-4 py-3">
            <h2 className="truncate text-[15px] font-medium">{topicName}</h2>
            <Menu
              panelClassName="w-64"
              trigger={() => (
                <button type="button" className="inline-flex items-center gap-1 text-[13px] text-zinc-600">
                  {t('activePrompts', { count: activeCount })} <ChevronDown className="h-3.5 w-3.5" />
                </button>
              )}
            >
              <button type="button" onClick={() => store.setSelectedTopicId('all')} className="block w-full rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100">{t('allTopics')}</button>
              {store.topics.map((item) => {
                const count = store.prompts.filter((prompt) => prompt.status === 'active' && prompt.topicId === item.id).length
                return (
                  <button key={item.id} type="button" onClick={() => { store.setSelectedTopicId(item.id); setPage(0) }} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100">
                    <span className="truncate">{topicLabel(item, t)}</span>
                    <span className="text-zinc-400">{count}</span>
                  </button>
                )
              })}
            </Menu>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <button type="button" onClick={() => setLimitOpen((open) => !open)} aria-label={t('promptLimitAria', { used: tracked, max: promptLimit })}>
                  <LimitRing used={tracked} max={promptLimit} label={`${tracked} / ${promptLimit}`} />
                </button>
                {limitOpen ? (
                  <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-2xl border border-nuw-line bg-white p-4 shadow-menu">
                    <p className="text-[13px] font-medium">{t('limitCard', { brand: brand.name })}</p>
                    <div className="mt-3 flex items-center justify-between text-[12px] text-zinc-500">
                      <span>{t('limitTracking')}</span>
                      <span className="font-medium text-zinc-800">{tracked}</span>
                    </div>
                    <div className="mt-1 flex gap-px">
                      {Array.from({ length: promptLimit }, (_, index) => (
                        <span key={index} className={cn('h-4 flex-1 rounded-[1px]', index < tracked ? 'bg-zinc-300' : 'bg-zinc-100')} />
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[12px] text-zinc-500">
                      <span>{t('limitMax')}</span>
                      <span>{promptLimit}</span>
                    </div>
                    <button type="button" onClick={() => push({ title: t('upgradeTitle'), body: t('upgradeBody') })} className="mt-3 h-9 w-full rounded-lg bg-nuw-button text-[13px] text-white">{t('upgradePlan')}</button>
                  </div>
                ) : null}
              </div>
              <button type="button" onClick={() => setOverview((open) => !open)} className={cn('inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] hover:bg-zinc-100', overview && 'bg-zinc-100')}>
                <ChartColumn className="h-3.5 w-3.5" /> {t('overview')}
              </button>
              <button type="button" onClick={generate} disabled={busy} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] hover:bg-zinc-100 disabled:text-zinc-400">
                <Sparkles className="h-3.5 w-3.5" /> {busy ? t('suggesting') : t('generateMore')}
              </button>
              <Menu
                align="right"
                panelClassName="w-48"
                trigger={() => (
                  <button type="button" aria-label={t('columns')} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-zinc-100">
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                )}
              >
                {columnOrder.map((id) => (
                  <label key={id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-zinc-50">
                    <input
                      type="checkbox"
                      checked={columns.includes(id)}
                      onChange={() => setColumns((current) => current.includes(id) ? current.filter((item) => item !== id) : columnOrder.filter((item) => item === id || current.includes(item)))}
                    />
                    {t(id === 'added' ? 'added' : id)}
                  </label>
                ))}
              </Menu>
              {sorted.length === 0 && !query && !overview ? (
                <button type="button" onClick={() => setSetupOpen(true)} className="h-8 rounded-lg bg-nuw-button px-3 text-[13px] text-white">{t('modifySetup')}</button>
              ) : null}
            </div>
          </div>
          <div className="px-4 py-3">
            <label className="flex h-8 max-w-xs items-center gap-2 rounded-lg border border-nuw-line px-2 text-[13px]">
              <Search className="h-3.5 w-3.5 text-zinc-400" />
              <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0) }} placeholder={t('searchPrompts')} className="w-full bg-transparent outline-none" />
            </label>
            {store.dataError ? <div className="pt-3"><ApiNote loading={false} error={store.dataError} /></div> : null}
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {visible.length === 0 && !busy ? (
              <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
                <span className="mb-3 grid h-10 w-10 place-items-center rounded-lg border border-dashed border-zinc-300 text-zinc-400">
                  <Sparkles className="h-4 w-4" />
                </span>
                <h2 className="text-[15px] font-semibold">{query ? t('noSearchTitle', { query }) : t('discoveryEmptyTitle')}</h2>
                <p className="mt-2 text-[13px] leading-5 text-zinc-500">{query ? t('noSearchBody') : t('discoveryEmptyBody')}</p>
                <button type="button" onClick={query ? () => setQuery('') : generate} className="mt-4 inline-flex h-9 items-center gap-1 rounded-lg border border-nuw-line px-3 text-[13px] hover:bg-zinc-50">
                  {query ? t('clearSearch') : <><Sparkles className="h-3.5 w-3.5" /> {t('generateMorePrompts')}</>}
                </button>
              </div>
            ) : (
              <PromptTable
                rows={visible}
                columns={columns}
                mode="discovery"
                indicators="none"
                sort={sort}
                onSort={(key, mode) => setSort({ key, mode })}
                selected={selected}
                onToggle={(id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}
                onTogglePage={(checked) => setSelected(checked ? visible.map((row) => row.id) : [])}
                busy={busy}
                onTrack={(id) => void activate([id])}
                onReject={(id) => void reject([id])}
                onEdit={(row) => { setEditing(row); setDraft(fillBrand(row.text, brand.name)); setEditError('') }}
              />
            )}
          </div>
          <footer className="flex flex-wrap items-center gap-3 border-t border-nuw-line px-4 py-2.5 text-[13px]">
            {sorted.length > pageSize ? (
              <span className="flex items-center gap-1">
                <button type="button" aria-label={t('prevPage')} disabled={safePage === 0} onClick={() => setPage(safePage - 1)} className="grid h-7 w-7 place-items-center rounded-md hover:bg-zinc-50 disabled:text-zinc-300">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: pages }, (_, index) => (
                  <button key={index} type="button" onClick={() => setPage(index)} className={cn('h-7 min-w-7 rounded-md px-2', safePage === index ? 'bg-zinc-100 font-medium' : 'hover:bg-zinc-50')}>{index + 1}</button>
                ))}
                <button type="button" aria-label={t('nextPage')} disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)} className="grid h-7 w-7 place-items-center rounded-md hover:bg-zinc-50 disabled:text-zinc-300">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </span>
            ) : null}
            <span className="text-zinc-500">{t('showing', { shown: visible.length, total: sorted.length })}</span>
            <span className="ml-auto flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!sorted.length) {
                    push({ title: t('nothingToReviewTitle'), body: t('nothingToReview') })
                    return
                  }
                  void reject(sorted.map((row) => row.id))
                }}
                className="inline-flex items-center gap-1 hover:text-zinc-900"
              >
                <XMark /> {t('rejectAll')}
              </button>
              <button type="button" onClick={() => void activate(sorted.map((row) => row.id))} className="inline-flex h-8 items-center gap-1 rounded-lg bg-nuw-button px-3 text-white">
                <Check className="h-3.5 w-3.5" /> {t('activateAll')}
              </button>
            </span>
          </footer>
        </div>
        {overview ? (
          <OverviewPanel
            topicName={topicName}
            activeCount={activeCount}
            reviewCount={visible.length}
            rows={scoped}
            setup={setup}
            onClose={() => setOverview(false)}
            onAdjust={() => setSetupOpen(true)}
          />
        ) : null}
      </div>
      {setupOpen ? (
        <DistributionDrawer setup={setup} topicCount={store.topics.length} onChange={setSetup} onClose={() => setSetupOpen(false)} />
      ) : null}
      <Modal open={editing != null} title={t('editPromptTitle')} onClose={() => setEditing(null)}>
        <div className="p-5">
          <h2 className="text-base font-semibold">{t('editPromptTitle')}</h2>
          <p className="mt-1 text-[13px] leading-5 text-zinc-500">{t('editPromptHelp', { brand: brand.name })}</p>
          <textarea
            value={draft}
            onChange={(event) => { setDraft(event.target.value); setEditError('') }}
            className="mt-4 h-28 w-full resize-none rounded-lg border border-nuw-line px-3 py-2 text-[13px] outline-none focus:border-nuw-primary"
          />
          {editError ? <p className="mt-2 text-[13px] text-rose-600">{editError}</p> : null}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(null)} className="h-9 rounded-lg px-3 text-[13px] hover:bg-zinc-100">{t('cancel')}</button>
            <button type="button" onClick={() => void saveEdit()} disabled={saving} className="h-9 rounded-lg bg-nuw-button px-3 text-[13px] text-white disabled:bg-zinc-400">{saving ? t('saving') : t('save')}</button>
          </div>
        </div>
      </Modal>
    </PromptsLayout>
  )
}

function XMark() {
  return <span className="text-zinc-400">×</span>
}
