'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Columns3, Download, LineChart, Play, Plus, Search, Sparkles, X } from 'lucide-react'
import { RunDialog } from '@/components/prompts/run-dialog'
import { defaultColumns, fillBrand, type ColumnId, type PromptStatus } from '@/data/prompts'
import { ApiNote } from '@/components/data/api-note'
import { LimitRing, SummaryStat, topicLabel } from '@/components/prompts/bits'
import { AddPromptDialog, ConfirmDialog, ImportDialog } from '@/components/prompts/dialogs'
import { useFilterNote } from '@/components/prompts/filter-row'
import { PromptsLayout } from '@/components/prompts/prompts-layout'
import { PromptTable } from '@/components/prompts/prompt-table'
import { filtersAreClear, usePrompts, type BulkResult } from '@/components/prompts/prompts-context'
import { defaultDiscoverySetup } from '@/components/prompts/discovery-panel'
import { errorText } from '@/lib/v2'
import { rowMatches, sortRows, type SortMode, type SortState } from '@/components/prompts/query'
import { downloadFile, toCsv, toExcelXml } from '@/components/perception/export-data'
import { useBrand } from '@/components/workspace/workspace-context'
import { Menu, useToast } from '@/components/ui/overlay'
import { cn } from '@/lib/cn'

type Tab = 'all' | 'active' | 'suggested' | 'archived'
const pageSize = 50
const columnOrder: ColumnId[] = [...defaultColumns, 'winRate']

export function PromptsScreen() {
  const t = useTranslations('prompts.page')
  const brand = useBrand()
  const { push } = useToast()
  const store = usePrompts()
  const note = useFilterNote()
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [columns, setColumns] = useState<ColumnId[]>(defaultColumns)
  const [indicators, setIndicators] = useState<'default' | 'indicators' | 'none'>('default')
  const [sort, setSort] = useState<SortState>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [runOpen, setRunOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [tour, setTour] = useState(true)
  const [limitOpen, setLimitOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<'archive' | 'reactivate' | 'delete' | null>(null)

  const activeCount = store.prompts.filter((item) => item.status === 'active').length
  const waitingCount = store.prompts.filter((item) => item.status === 'discovery' || item.status === 'suggested').length
  const topic = store.topics.find((item) => item.id === store.selectedTopicId)
  const scoped = store.prompts.filter((item) => {
    if (tab === 'all') return item.status === 'active' || item.status === 'suggested' || item.status === 'discovery'
    if (tab === 'suggested') return item.status === 'suggested' || item.status === 'discovery'
    return item.status === (tab as PromptStatus)
  })
  const inTopic = scoped.filter((item) => store.selectedTopicId === 'all' || item.topicId === store.selectedTopicId)
  const filtered = inTopic.filter((item) => rowMatches(item, store.filters, store.selectedTopicId, query, brand.name))
  const sorted = sortRows(filtered, sort)
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, pages - 1)
  const visible = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize)
  const promptLimit = store.promptLimit
  const summary = useMemo(() => buildSummary(tab, store.selectedTopicId, filtered, store.pristine && !query && filtersAreClear(store.filters), store.topicSummaries), [tab, store.selectedTopicId, filtered, store.pristine, query, store.filters, store.topicSummaries])

  const clearSelection = () => setSelected([])
  const switchTab = (next: Tab) => {
    setTab(next)
    setPage(0)
    clearSelection()
    setSort(null)
  }

  const runSuggest = async () => {
    if (store.selectedTopicId === 'all') {
      push({ title: t('needTopicTitle'), body: t('needTopicBody') })
      setTab('suggested')
      return
    }
    setBusy(true)
    setTab('suggested')
    try {
      const added = await store.discover(store.selectedTopicId, defaultDiscoverySetup())
      if (!added) push({ title: t('suggestCapTitle'), body: t('suggestCapBody') })
      else push({ title: t('suggestAddedTitle'), body: t('suggestInDiscovery', { count: added }) })
    } catch (caught) {
      push({ title: t('requestFailedTitle'), body: errorText(caught) })
    } finally {
      setBusy(false)
    }
  }

  const idsInList = sorted.map((item) => item.id)
  const runnableIds = tab === 'all' ? sorted.filter((item) => item.status === 'active').map((item) => item.id) : idsInList
  const measured = tab === 'all' || tab === 'active'
  const targetIds = selected.length ? selected.filter((id) => runnableIds.includes(id)) : runnableIds

  const reportFailures = (result: BulkResult) => {
    if (result.failed) push({ title: t('requestFailedTitle'), body: t('bulkFailed', { count: result.failed, reason: result.error ?? '' }) })
  }

  const applyConfirm = async () => {
    if (confirm === 'archive') {
      const result = await store.setStatus(targetIds, 'archived')
      if (result.done) push({ title: t('archivedTitle'), body: t('archivedBody', { count: result.done }) })
      reportFailures(result)
    }
    if (confirm === 'delete') {
      const result = await store.remove(targetIds)
      if (result.done) push({ title: t('deletedTitle'), body: t('deletedBody', { count: result.done }) })
      reportFailures(result)
    }
    if (confirm === 'reactivate') {
      if (promptLimit <= 0) {
        push({ title: t('limitMissingTitle'), body: t('limitMissingBody') })
        setConfirm(null)
        return
      }
      const room = Math.max(0, promptLimit - activeCount)
      const result = await store.setStatus(targetIds.slice(0, room), 'active')
      const left = targetIds.length - result.done
      if (!result.done) push({ title: t('limitTitle'), body: result.error ?? t('limitFull', { max: promptLimit }) })
      else push({
        title: left ? t('reactivatedPartialTitle') : t('reactivatedTitle'),
        body: left ? t('reactivatedPartial', { moved: result.done, left, max: promptLimit }) : t('reactivatedBody', { count: result.done }),
      })
    }
    setConfirm(null)
    clearSelection()
  }

  const trackIds = async (ids: string[]) => {
    if (promptLimit <= 0) {
      push({ title: t('limitMissingTitle'), body: t('limitMissingBody') })
      return
    }
    const room = Math.max(0, promptLimit - activeCount)
    const result = await store.setStatus(ids.slice(0, room), 'active')
    const left = ids.length - result.done
    if (!result.done) push({ title: t('limitTitle'), body: result.error ?? t('limitFull', { max: promptLimit }) })
    else if (left) push({ title: t('trackedPartialTitle'), body: t('trackedPartial', { moved: result.done, left, max: promptLimit }) })
    else push({ title: t('trackedTitle'), body: t('trackedBody', { count: result.done }) })
    clearSelection()
  }

  const rejectIds = async (ids: string[], one: boolean) => {
    const result = await store.remove(ids)
    if (result.done) push({ title: t('rejectedTitle'), body: one ? t('rejectedOne') : t('rejectedBody', { count: result.done }) })
    reportFailures(result)
    clearSelection()
  }

  const exportRows = () => {
    if (!sorted.length) {
      push({ title: t('exportEmptyTitle'), body: t('exportEmptyBody') })
      return null
    }
    const header = [t('prompt'), ...columns.map((column) => t(column))]
    const body = sorted.map((row) => [
      fillBrand(row.text, brand.name),
      ...columns.map((column) => cellText(row, column, t)),
    ])
    return [header, ...body]
  }

  return (
    <PromptsLayout status={tab} showSuggested={tab === 'suggested'} compactFilters={false}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="px-4 pt-3"><ApiNote loading={store.dataLoading} error={store.dataError} shown={store.prompts.length} total={store.prompts.length} /></div>
        <div className="flex flex-wrap items-center gap-3 border-b border-nuw-line px-4">
          <div className="flex items-center gap-4 text-[14px]">
            {(['all', 'active', 'suggested', 'archived'] as const).map((id) => (
              <button key={id} type="button" onClick={() => switchTab(id)} className={cn('-mb-px border-b-2 py-3', tab === id ? 'border-zinc-950 font-medium' : 'border-transparent text-zinc-500')}>
                {t(id === 'all' ? 'library' : id)}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2 py-2">
            <div className="relative">
              <button type="button" onClick={() => setLimitOpen((open) => !open)} className="rounded-lg px-1 py-1 hover:bg-zinc-100" aria-label={t('promptLimitAria', { used: activeCount, max: promptLimit })}>
                <LimitRing used={activeCount} max={promptLimit} label={`${activeCount} / ${promptLimit}`} />
              </button>
              {limitOpen ? (
                <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-2xl border border-nuw-line bg-white p-4 shadow-menu">
                  <p className="text-[13px] font-medium">{t('limitCard', { brand: brand.name })}</p>
                  <div className="mt-3 flex items-center justify-between text-[12px] text-zinc-500">
                    <span>{t('limitTracking')}</span>
                    <span className="font-medium text-zinc-800">{activeCount}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full rounded-full bg-zinc-300" style={{ width: `${promptLimit > 0 ? Math.min(100, (activeCount / promptLimit) * 100) : 0}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[12px] text-zinc-500">
                    <span>{t('limitMax')}</span>
                    <span className="font-medium text-zinc-800">{promptLimit}</span>
                  </div>
                  <button type="button" onClick={() => push({ title: t('upgradeTitle'), body: t('upgradeBody') })} className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-nuw-button text-[13px] text-white">
                    {t('upgradePlan')}
                  </button>
                </div>
              ) : null}
            </div>
            {tab === 'suggested' ? (
              <button type="button" onClick={() => setImportOpen(true)} className="h-8 rounded-lg border border-nuw-line px-3 text-[13px] hover:bg-zinc-50">{t('importKeywords')}</button>
            ) : null}
            <button type="button" onClick={runSuggest} disabled={busy} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] hover:bg-zinc-100 disabled:text-zinc-400">
              <Sparkles className="h-3.5 w-3.5" /> {busy ? t('suggesting') : t('generate')}
            </button>
            {tab === 'suggested' ? (
              <button type="button" onClick={() => setAddOpen(true)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-nuw-line px-3 text-[13px] hover:bg-zinc-50">
                <Plus className="h-3.5 w-3.5" /> {t('addPrompt')}
              </button>
            ) : (
              <button type="button" onClick={() => setAddOpen(true)} className="inline-flex h-8 items-center gap-1 rounded-lg bg-nuw-button px-3 text-[13px] text-white hover:bg-nuw-buttonHover">
                <Plus className="h-3.5 w-3.5" /> {t('addPrompt')}
              </button>
            )}
            {tab === 'suggested' ? (
              <button type="button" onClick={runSuggest} disabled={busy} className="inline-flex h-8 items-center gap-1 rounded-lg bg-nuw-button px-3 text-[13px] text-white hover:bg-nuw-buttonHover disabled:bg-zinc-400">
                <Sparkles className="h-3.5 w-3.5" /> {busy ? t('suggesting') : t('suggestMore')}
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <label className="flex h-8 w-full max-w-xs items-center gap-2 rounded-lg border border-nuw-line px-2 text-[13px]">
            <Search className="h-3.5 w-3.5 text-zinc-400" />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0) }} placeholder={t('searchPrompts')} className="w-full bg-transparent outline-none" />
          </label>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <SummaryStat label={t(store.selectedTopicId === 'all' ? 'visibility' : 'topicVisibility')} value={summary.visibility == null ? 'N/A' : `${summary.visibility}%`} />
            <SummaryStat label={t(store.selectedTopicId === 'all' ? 'sentiment' : 'topicSentiment')} value={summary.sentiment == null ? 'N/A' : `+${summary.sentiment}`} tone={summary.sentiment != null ? 'good' : undefined} />
            <SummaryStat label={t(store.selectedTopicId === 'all' ? 'position' : 'topicPosition')} value={summary.position == null ? 'N/A' : `#${summary.position}`} />
            <SummaryStat label={t(store.selectedTopicId === 'all' ? 'web' : 'topicWeb')} value={summary.web == null ? 'N/A' : `${summary.web}%`} />
            {tab !== 'suggested' ? (
              <span className="relative">
                <Menu
                  align="right"
                  panelClassName="w-56"
                  trigger={() => (
                    <button type="button" aria-label={t('columns')} onClick={() => setTour(false)} className="grid h-8 w-8 place-items-center rounded-lg border border-nuw-line hover:bg-zinc-50">
                      <Columns3 className="h-3.5 w-3.5" />
                    </button>
                  )}
                >
                  <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('fixedColumns')}</p>
                  <label className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-zinc-400"><input type="checkbox" checked disabled /> {t('prompt')}</label>
                  <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('activeColumns')}</p>
                  {columnOrder.filter((id) => id !== 'winRate').map((id) => (
                    <label key={id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-zinc-50">
                      <input type="checkbox" checked={columns.includes(id)} onChange={() => setColumns((current) => current.includes(id) ? current.filter((item) => item !== id) : columnOrder.filter((item) => item === id || current.includes(item)))} />
                      {t(id)}
                    </label>
                  ))}
                  <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('availableColumns')}</p>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-zinc-50">
                    <input
                      type="checkbox"
                      checked={columns.includes('winRate')}
                      onChange={() => {
                        setColumns((current) => current.includes('winRate') ? current.filter((item) => item !== 'winRate') : [...current, 'winRate'])
                        setTour(false)
                      }}
                    />
                    {t('winRate')}
                  </label>
                </Menu>
                {tour && measured ? (
                  <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl bg-zinc-950 p-3 text-[13px] leading-5 text-white shadow-menu">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <p className="font-medium">{t('winTourTitle')}</p>
                      <button type="button" aria-label={t('close')} onClick={() => setTour(false)} className="text-zinc-400"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    <p className="text-[12px] leading-5 text-zinc-200">
                      {t('winTourBody')}{' '}
                      <button
                        type="button"
                        className="underline"
                        onClick={() => {
                          setColumns((current) => current.includes('winRate') ? current : [...current, 'winRate'])
                          setTour(false)
                        }}
                      >
                        {t('clickHere')}
                      </button>{' '}
                      {t('winTourTail')}
                    </p>
                    <button type="button" onClick={() => setTour(false)} className="mt-2 text-[12px] text-zinc-300 underline">{t('skipTour')}</button>
                  </div>
                ) : null}
              </span>
            ) : null}
            <Menu
              align="right"
              panelClassName="w-36"
              trigger={() => (
                <button type="button" aria-label={t('exportFormat')} className="grid h-8 w-8 place-items-center rounded-lg border border-nuw-line hover:bg-zinc-50">
                  <Download className="h-3.5 w-3.5" />
                </button>
              )}
            >
              <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('exportFormat')}</p>
              {(['csv', 'xlsx', 'json'] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => {
                    const rows = exportRows()
                    if (!rows) return
                    if (kind === 'csv') downloadFile('prompts.csv', toCsv(rows), 'text/csv')
                    if (kind === 'xlsx') downloadFile('prompts.xls', toExcelXml(rows, 'Prompts'), 'application/vnd.ms-excel')
                    if (kind === 'json') downloadFile('prompts.json', JSON.stringify(rows, null, 2), 'application/json')
                    push({ title: t('exportedTitle'), body: t('exportedBody', { count: rows.length - 1 }) })
                  }}
                  className="block w-full rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100"
                >
                  {t(kind)}
                </button>
              ))}
            </Menu>
            {tab !== 'suggested' ? (
              <Menu
                align="right"
                panelClassName="w-48"
                trigger={() => (
                  <button type="button" aria-label={t('indicators')} className="grid h-8 w-8 place-items-center rounded-lg border border-nuw-line hover:bg-zinc-50">
                    <LineChart className="h-3.5 w-3.5" />
                  </button>
                )}
              >
                <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('indicators')}</p>
                {(['default', 'indicators', 'none'] as const).map((id) => (
                  <button key={id} type="button" onClick={() => setIndicators(id)} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100">
                    {t(id === 'default' ? 'indicatorsDefault' : id === 'indicators' ? 'indicatorsOnly' : 'indicatorsNone')}
                    {indicators === id ? <Check className="h-3.5 w-3.5" /> : null}
                  </button>
                ))}
              </Menu>
            ) : null}
          </div>
        </div>
        {note ? <p className="px-4 pb-2 text-[12px] text-zinc-500">{note}</p> : null}
        {store.selectedTopicId !== 'all' && topic ? <p className="px-4 pb-2 text-[12px] text-zinc-500">{t('showingTopic', { topic: topicLabel(topic, t) })}</p> : null}
        {tab === 'all' && waitingCount > 0 ? (
          <p className="px-4 pb-2 text-[12px] leading-5 text-zinc-600">{t('libraryNote', { total: activeCount + waitingCount, tracked: activeCount, waiting: waitingCount, limit: promptLimit })}</p>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto">
          {visible.length === 0 && !busy ? (
            <EmptyState
              tab={tab}
              query={query}
              filteredOut={inTopic.length > 0}
              activeCount={store.prompts.filter((item) => item.status === 'active').length}
              waitingCount={waitingCount}
              allTopics={store.selectedTopicId === 'all'}
              onClear={() => { setQuery(''); store.resetFilters() }}
              onAdd={() => setAddOpen(true)}
              onSuggest={runSuggest}
              onShowSuggested={() => switchTab('suggested')}
            />
          ) : (
            <PromptTable
              rows={visible}
              columns={tab === 'suggested' ? ['volume', 'branding', 'intent', 'tags', 'added', 'location'] : columns}
              mode={tab === 'all' ? 'active' : tab}
              indicators={indicators}
              sort={sort}
              onSort={(key, mode: SortMode) => { setSort({ key, mode }); setPage(0) }}
              selected={selected}
              onToggle={(id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}
              onTogglePage={(checked) => setSelected(checked ? Array.from(new Set([...selected, ...visible.map((row) => row.id)])) : selected.filter((id) => !visible.some((row) => row.id === id)))}
              busy={busy}
              onArchive={async (id) => {
                const result = await store.setStatus([id], 'archived')
                if (result.done) push({ title: t('archivedTitle'), body: t('archivedOne') })
                reportFailures(result)
              }}
              onRestore={async (id) => {
                if (promptLimit <= 0) {
                  push({ title: t('limitMissingTitle'), body: t('limitMissingBody') })
                  return
                }
                if (activeCount >= promptLimit) {
                  push({ title: t('limitTitle'), body: t('limitFull', { max: promptLimit }) })
                  return
                }
                const result = await store.setStatus([id], 'active')
                if (result.done) push({ title: t('reactivatedTitle'), body: t('reactivatedBody', { count: result.done }) })
                else push({ title: t('limitTitle'), body: result.error ?? t('limitFull', { max: promptLimit }) })
              }}
              onDelete={async (id) => {
                const result = await store.remove([id])
                if (result.done) push({ title: t('deletedTitle'), body: t('deletedOne') })
                reportFailures(result)
              }}
              onTrack={(id) => void trackIds([id])}
              onReject={(id) => void rejectIds([id], true)}
            />
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-3 border-t border-nuw-line px-4 py-2.5 text-[13px] text-zinc-600">
          <button type="button" onClick={store.toggleTopics} className="text-zinc-400 hover:text-zinc-700" aria-label={store.topicsOpen ? t('collapseTopics') : t('expandTopics')}>
            {store.topicsOpen ? '«' : '»'}
          </button>
          <span>{t('promptsCount', { count: sorted.length })}</span>
          {pages > 1 ? (
            <span className="flex items-center gap-1">
              {Array.from({ length: pages }, (_, index) => (
                <button key={index} type="button" onClick={() => setPage(index)} className={cn('h-7 min-w-7 rounded-md px-2', safePage === index ? 'bg-zinc-100 font-medium' : 'hover:bg-zinc-50')}>{index + 1}</button>
              ))}
            </span>
          ) : null}
          {measured ? (
            <span className="inline-flex items-center gap-1 text-zinc-500">
              {t('runs')} <span title={t('runsTip')}>· {t('nextRun')}</span>
            </span>
          ) : null}
          <span className="ml-auto flex items-center gap-2">
            {selected.length ? <span>{t('selectedCount', { count: selected.length })}</span> : null}
            {measured && targetIds.length ? <button type="button" onClick={() => setRunOpen(true)} className="inline-flex items-center gap-1 hover:text-zinc-900"><Play className="h-3.5 w-3.5" /> {selected.length ? t('runSelected') : t('runAll')}</button> : null}
            {measured && targetIds.length ? <button type="button" onClick={() => setConfirm('archive')} className="inline-flex items-center gap-1 hover:text-zinc-900"><span className="text-zinc-400">↓</span> {selected.length ? t('archiveSelected') : t('archiveAll')}</button> : null}
            {tab === 'archived' ? (
              <>
                <button type="button" onClick={() => setConfirm('reactivate')} className="inline-flex items-center gap-1 hover:text-zinc-900"><Check className="h-3.5 w-3.5" /> {t('reactivateAll')}</button>
                <button type="button" onClick={() => setConfirm('delete')} className="inline-flex items-center gap-1 text-rose-600"><span className="grid h-4 w-4 place-items-center rounded bg-rose-600 text-[10px] text-white">⌫</span> {t('deleteAll')}</button>
              </>
            ) : null}
            {tab === 'suggested' ? (
              <>
                <button type="button" onClick={() => void rejectIds(targetIds, false)} className="hover:text-zinc-900">{t('rejectAll')}</button>
                <button type="button" onClick={() => void trackIds(targetIds)} className="inline-flex items-center gap-1 hover:text-zinc-900"><Check className="h-3.5 w-3.5" /> {t('trackAll')}</button>
              </>
            ) : null}
          </span>
        </footer>
      </div>
      <RunDialog open={runOpen} promptIds={targetIds} onClose={() => setRunOpen(false)} />
      <AddPromptDialog open={addOpen} onClose={() => setAddOpen(false)} topicId={store.selectedTopicId} />
      <ImportDialog open={importOpen} onClose={() => { setImportOpen(false); setTab('suggested') }} topicId={store.selectedTopicId} />
      <ConfirmDialog
        open={confirm != null}
        title={confirm === 'delete' ? t('deleteTitle') : confirm === 'reactivate' ? t('reactivateTitle') : t('archiveTitle')}
        body={confirm === 'delete' ? t('deleteBody', { count: targetIds.length }) : confirm === 'reactivate' ? t('reactivateBody', { count: targetIds.length, max: promptLimit }) : t('archiveBody', { count: targetIds.length })}
        confirm={confirm === 'delete' ? t('delete') : confirm === 'reactivate' ? t('reactivateAll') : t('archiveAll')}
        danger={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        onConfirm={applyConfirm}
      />
    </PromptsLayout>
  )
}

function EmptyState({
  tab,
  query,
  filteredOut,
  activeCount,
  waitingCount,
  allTopics,
  onClear,
  onAdd,
  onSuggest,
  onShowSuggested,
}: {
  tab: Tab
  query: string
  filteredOut: boolean
  activeCount: number
  waitingCount: number
  allTopics: boolean
  onClear: () => void
  onAdd: () => void
  onSuggest: () => void
  onShowSuggested: () => void
}) {
  const t = useTranslations('prompts.page')
  if (query) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
        <h2 className="text-[15px] font-semibold">{t('noSearchTitle', { query })}</h2>
        <p className="mt-2 text-[13px] leading-5 text-zinc-500">{t('noSearchBody')}</p>
        <button type="button" onClick={onClear} className="mt-4 h-9 rounded-lg bg-nuw-button px-3 text-[13px] text-white">{t('clearSearch')}</button>
      </div>
    )
  }
  if (filteredOut) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
        <h2 className="text-[15px] font-semibold">{t('noFilterTitle')}</h2>
        <p className="mt-2 text-[13px] leading-5 text-zinc-500">{t('noFilterBody')}</p>
        <button type="button" onClick={onClear} className="mt-4 h-9 rounded-lg bg-nuw-button px-3 text-[13px] text-white">{t('resetFilters')}</button>
      </div>
    )
  }
  if (tab === 'suggested') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
        <span className="mb-3 grid h-10 w-10 place-items-center rounded-lg border border-dashed border-zinc-300 text-zinc-400">+</span>
        <h2 className="text-[15px] font-semibold">{t('emptySuggestTitle')}</h2>
        <p className="mt-2 text-[13px] leading-5 text-zinc-500">{t('emptySuggestBody')}</p>
        <button type="button" onClick={onSuggest} className="mt-4 inline-flex h-9 items-center gap-1 rounded-lg bg-nuw-button px-3 text-[13px] text-white">
          <Sparkles className="h-3.5 w-3.5" /> {t('suggestPrompts')}
        </button>
      </div>
    )
  }
  if (tab === 'all' && activeCount === 0 && waitingCount > 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
        <h2 className="text-[15px] font-semibold">{t('emptyWaitingTitle', { count: waitingCount })}</h2>
        <p className="mt-2 text-[13px] leading-5 text-zinc-500">{t('emptyWaitingBody')}</p>
        <button type="button" onClick={onShowSuggested} className="mt-4 h-9 rounded-lg bg-nuw-button px-3 text-[13px] text-white">{t('openDiscovery')}</button>
      </div>
    )
  }
  if (tab === 'all' && activeCount === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
        <h2 className="text-[15px] font-semibold">{t('emptySavedTitle')}</h2>
        <p className="mt-2 text-[13px] leading-5 text-zinc-500">{t('emptySavedBody')}</p>
        <button type="button" onClick={onSuggest} disabled={allTopics} className="mt-4 h-9 rounded-lg bg-nuw-button px-3 text-[13px] text-white disabled:bg-zinc-300">{t('generate')}</button>
      </div>
    )
  }
  if (tab === 'active') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
        <h2 className="text-[15px] font-semibold">{t(allTopics ? 'emptyActiveAllTitle' : 'emptyActiveTitle')}</h2>
        <p className="mt-2 text-[13px] leading-5 text-zinc-500">{t('emptyActiveBody')}</p>
        <button type="button" onClick={onAdd} className="mt-4 h-9 rounded-lg bg-nuw-button px-3 text-[13px] text-white">{t('addPrompt')}</button>
      </div>
    )
  }
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
      <h2 className="text-[15px] font-semibold">{t('emptyArchivedTitle')}</h2>
      <p className="mt-2 text-[13px] leading-5 text-zinc-500">{t('emptyArchivedBody')}</p>
    </div>
  )
}

function buildSummary(tab: Tab, topicId: string, rows: { visibility: number | null; sentiment: number | null; position: number | null; web: number | null }[], preset: boolean, topicSummaries: { active: { visibility: number | null; sentiment: number | null; position: number | null; web: number | null }; archived: { visibility: number | null; sentiment: number | null; position: number | null; web: number | null } }) {
  if (!rows.length) return { visibility: null, sentiment: null, position: null, web: null }
  if (preset && (tab === 'all' || tab === 'active') && (topicId === 'all' || topicId === '')) return topicSummaries.active
  if (preset && tab === 'archived') return topicSummaries.archived
  const mean = (values: Array<number | null>, fillZero = false) => {
    const nums = values.filter((value): value is number => value != null)
    const source = fillZero ? values.map((value) => value ?? 0) : nums
    if (!source.length) return null
    return Math.round(source.reduce((sum, value) => sum + value, 0) / source.length)
  }
  return {
    visibility: mean(rows.map((row) => row.visibility), true),
    sentiment: mean(rows.map((row) => row.sentiment)),
    position: mean(rows.map((row) => row.position)),
    web: mean(rows.map((row) => row.web), true),
  }
}

function cellText(row: { text: string; visibility: number | null; sov: number | null; sentiment: number | null; position: number | null; winRate: number | null; web: number | null; mentionIds: string[]; volume: number[]; branding: string | null; intent: string | null; facts: boolean; tagIds: string[]; location: string; addedDays: number }, column: ColumnId, t: (key: string, values?: Record<string, string | number>) => string) {
  if (column === 'visibility' || column === 'sov' || column === 'web' || column === 'winRate') return row[column] == null ? '' : `${row[column]}%`
  if (column === 'sentiment' || column === 'position') return row[column] == null ? '' : String(row[column])
  if (column === 'mentions') return String(row.mentionIds.length)
  if (column === 'volume') return String(row.volume.reduce((sum, value) => sum + value, 0))
  if (column === 'branding') return row.branding ? t(row.branding) : ''
  if (column === 'intent') return row.intent ? t(row.intent) : ''
  if (column === 'facts') return row.facts ? t('factChecked') : ''
  if (column === 'tags') return row.tagIds.map((id) => t(id)).join(', ')
  if (column === 'location') return t(row.location)
  if (column === 'added') return String(row.addedDays)
  return ''
}
