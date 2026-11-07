'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Loader2,
  RotateCcw,
  Search,
  X,
  XCircle,
} from 'lucide-react'
import type { ActionItem, ActionPlanGroup, ActionPriority, ActionStatus } from '@/data/types'
import { ApiNote } from '@/components/data/api-note'
import { cn } from '@/lib/cn'
import { errorText, useV2, v2Send } from '@/lib/v2'

const priorityRank: Record<ActionPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

const PAGE_SIZE = 25

type View = 'open' | 'done' | 'dismissed' | 'all'
type GroupFilter = ActionPlanGroup['id'] | 'all'
type PriorityFilter = ActionPriority | 'all'
type Sort = 'impact' | 'priority' | 'newest'

type ClusterAction = {
  action: ActionItem
  planGroup: ActionPlanGroup['id']
}

type ActionCluster = {
  id: string
  planGroup: ActionPlanGroup['id']
  actions: ActionItem[]
  title: string
  targetLabel: string
  priority: ActionPriority
  models: string[]
  affectedResults: number
}

export function ActionsScreen() {
  const t = useTranslations('actions.page')
  const groupNames: Record<ActionPlanGroup['id'], string> = {
    read: t('group.read'),
    pages: t('group.pages'),
    mentions: t('group.mentions'),
    claims: t('group.claims'),
  }
  const [view, setView] = useState<View>('open')
  const [query, setQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [sort, setSort] = useState<Sort>('impact')
  const [page, setPage] = useState(1)
  const [activeClusterId, setActiveClusterId] = useState<string | null>(null)
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [updating, setUpdating] = useState<Set<string>>(() => new Set())
  const [updateError, setUpdateError] = useState<string | null>(null)
  const actions = useV2<ActionPlanGroup[]>(
    'actions',
    view === 'all' ? undefined : { status: view === 'open' ? ['todo', 'in_progress'] : view },
  )

  const matchingActions = useMemo<ClusterAction[]>(() => {
    const search = query.trim().toLocaleLowerCase()
    return (actions.data ?? []).flatMap((group) => group.tasks
      .filter((action) => {
        if (view === 'open' && action.status !== 'todo' && action.status !== 'in_progress') return false
        if (view !== 'open' && view !== 'all' && action.status !== view) return false
        if (groupFilter !== 'all' && group.id !== groupFilter) return false
        if (priorityFilter !== 'all' && action.priority !== priorityFilter) return false
        if (!search) return true
        return [
          action.title,
          action.description,
          action.recommendedChange,
          action.trigger.promptText,
          action.trigger.model,
          action.target.url,
        ].some((value) => value?.toLocaleLowerCase().includes(search))
      })
      .map((action) => ({ action, planGroup: group.id })))
  }, [actions.data, groupFilter, priorityFilter, query, view])

  const clusters = useMemo(() => {
    const byTarget = new Map<string, ClusterAction[]>()
    matchingActions.forEach((item) => {
      const target = item.action.target.url
        ?? item.action.impact?.pageMatch?.url
        ?? `${item.action.target.type}:${item.action.trigger.promptId ?? item.action.id}`
      const key = `${item.planGroup}:${item.action.ruleKey}:${target}`
      byTarget.set(key, [...(byTarget.get(key) ?? []), item])
    })

    const next = Array.from(byTarget.entries()).map(([id, items]): ActionCluster => {
      const sortedItems = [...items].sort((left, right) => (
        priorityRank[right.action.priority] - priorityRank[left.action.priority]
        || Date.parse(right.action.createdAt) - Date.parse(left.action.createdAt)
      ))
      const clusterActions = sortedItems.map((item) => item.action)
      const first = clusterActions[0]
      const targetLabel = first.target.url
        ?? first.impact?.pageMatch?.url
        ?? (first.target.type === 'new_page' ? t('newFocusedPage') : t('technicalChange'))
      return {
        id,
        planGroup: items[0].planGroup,
        actions: clusterActions,
        title: clusterActions.length > 1
          ? t('clusterTitle', { verb: t(`verb.${items[0].planGroup}`), target: shortTarget(targetLabel), count: clusterActions.length })
          : first.title,
        targetLabel,
        priority: first.priority,
        models: Array.from(new Set(clusterActions.map((action) => action.trigger.model).filter(Boolean))),
        affectedResults: clusterActions.reduce((total, action) => total + (action.impact?.affectedResults ?? 0), 0),
      }
    })

    return next.sort((left, right) => {
      if (sort === 'priority') return priorityRank[right.priority] - priorityRank[left.priority]
      if (sort === 'newest') return Date.parse(right.actions[0].createdAt) - Date.parse(left.actions[0].createdAt)
      return right.affectedResults - left.affectedResults
        || right.actions.length - left.actions.length
        || priorityRank[right.priority] - priorityRank[left.priority]
    })
  }, [matchingActions, sort])

  const pageCount = Math.max(1, Math.ceil(clusters.length / PAGE_SIZE))
  const visibleClusters = clusters.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const activeCluster = visibleClusters.find((cluster) => cluster.id === activeClusterId)
    ?? visibleClusters[0]
    ?? null
  const activeAction = activeCluster?.actions.find((action) => action.id === activeActionId)
    ?? activeCluster?.actions[0]
    ?? null
  const hasFilters = Boolean(query || groupFilter !== 'all' || priorityFilter !== 'all')

  useEffect(() => {
    setPage(1)
    setSelected(new Set())
  }, [view, query, groupFilter, priorityFilter, sort])

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const updateStatuses = async (items: ActionItem[], status: ActionStatus) => {
    const ids = items.map((item) => item.id)
    setUpdating(new Set(ids))
    setUpdateError(null)
    try {
      const results = await Promise.allSettled(items.map((item) => (
        v2Send<ActionItem>('PATCH', `actions/${encodeURIComponent(item.id)}`, { status })
      )))
      const failed = results.filter((result) => result.status === 'rejected')
      if (failed.length) {
        setUpdateError(t('updatePartial', { failed: failed.length, total: items.length }))
      }
      setSelected(new Set())
      actions.reload()
    } catch (error) {
      setUpdateError(errorText(error, t('updateFailed')))
    } finally {
      setUpdating(new Set())
    }
  }

  const toggleCluster = (cluster: ActionCluster) => {
    setSelected((current) => {
      const next = new Set(current)
      const allSelected = cluster.actions.every((action) => next.has(action.id))
      cluster.actions.forEach((action) => allSelected ? next.delete(action.id) : next.add(action.id))
      return next
    })
  }

  const selectedActions = matchingActions
    .map((item) => item.action)
    .filter((action) => selected.has(action.id))

  const clearFilters = () => {
    setQuery('')
    setGroupFilter('all')
    setPriorityFilter('all')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
      <header>
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-nuw-accent">{t('eyebrow')}</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-950">{t('title')}</h1>
            <p className="mt-1 max-w-3xl text-[13px] leading-5 text-zinc-600">
              {t('subtitle')}
            </p>
          </div>
          {!actions.loading && !actions.error ? (
            <p className="text-[12px] text-zinc-500">
              {t('summary', { recommendations: matchingActions.length, items: clusters.length })}
            </p>
          ) : null}
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {(['open', 'done', 'dismissed', 'all'] as View[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setView(item)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[13px] capitalize',
              view === item ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-nuw-line bg-white text-zinc-600 hover:border-zinc-400',
            )}
          >
            {t(`view.${item}`)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-nuw-line bg-white p-2.5 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{t('searchLabel')}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('searchPlaceholder')}
            className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-9 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
          />
          {query ? (
            <button type="button" onClick={() => setQuery('')} aria-label={t('clearSearch')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </label>
        <FilterSelect label={t('category')} value={groupFilter} onChange={(value) => setGroupFilter(value as GroupFilter)}>
          <option value="all">{t('allCategories')}</option>
          {Object.entries(groupNames).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </FilterSelect>
        <FilterSelect label={t('priority')} value={priorityFilter} onChange={(value) => setPriorityFilter(value as PriorityFilter)}>
          <option value="all">{t('allPriorities')}</option>
          <option value="critical">{t('critical')}</option>
          <option value="high">{t('high')}</option>
          <option value="medium">{t('medium')}</option>
          <option value="low">{t('low')}</option>
        </FilterSelect>
        <FilterSelect label={t('sort')} value={sort} onChange={(value) => setSort(value as Sort)}>
          <option value="impact">{t('highestImpact')}</option>
          <option value="priority">{t('highestPriority')}</option>
          <option value="newest">{t('newest')}</option>
        </FilterSelect>
      </div>

      <ApiNote loading={actions.loading} error={actions.error ?? updateError} shown={matchingActions.length} />

      {selectedActions.length ? (
        <div className="sticky top-2 z-30 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-white shadow-lg">
          <span className="mr-auto text-[13px] font-medium">{t('selected', { count: selectedActions.length })}</span>
          <button type="button" onClick={() => updateStatuses(selectedActions, 'done')} className="rounded-lg bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-900 hover:bg-zinc-100">{t('markDone')}</button>
          <button type="button" onClick={() => updateStatuses(selectedActions, 'dismissed')} className="rounded-lg border border-white/25 px-3 py-1.5 text-[12px] hover:bg-white/10">{t('dismiss')}</button>
          <button type="button" onClick={() => setSelected(new Set())} aria-label={t('clearSelection')} className="rounded p-1.5 text-zinc-300 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
      ) : null}

      {!actions.loading && !actions.error && matchingActions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
          <p className="font-semibold text-zinc-900">{hasFilters ? t('emptyFilteredTitle') : t('emptyTitle', { view: view === 'all' ? '' : t(`view.${view}`).toLocaleLowerCase() })}</p>
          <p className="mx-auto mt-2 max-w-xl text-[13px] leading-5 text-zinc-500">
            {hasFilters
              ? t('emptyFilteredBody')
              : t('emptyBody')}
          </p>
          {hasFilters ? <button type="button" onClick={clearFilters} className="mt-4 rounded-lg border border-nuw-line px-3 py-1.5 text-[12px] text-zinc-700 hover:bg-zinc-50">{t('clearFilters')}</button> : null}
        </div>
      ) : null}

      {visibleClusters.length ? (
        <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
          <section className="overflow-hidden rounded-xl border border-nuw-line bg-white">
            <div className="grid grid-cols-[32px_minmax(0,1fr)] border-b border-nuw-line bg-zinc-50/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              <span />
              <span>{t('workItem')}</span>
            </div>
            <div className="divide-y divide-nuw-line">
              {visibleClusters.map((cluster) => (
                <CompactActionRow
                  key={cluster.id}
                  cluster={cluster}
                  active={activeCluster?.id === cluster.id}
                  selected={cluster.actions.every((action) => selected.has(action.id))}
                  partiallySelected={cluster.actions.some((action) => selected.has(action.id))}
                  onSelect={() => {
                    setActiveClusterId(cluster.id)
                    setActiveActionId(cluster.actions[0]?.id ?? null)
                  }}
                  onToggle={() => toggleCluster(cluster)}
                />
              ))}
            </div>
            <Pagination
              page={page}
              pageCount={pageCount}
              start={(page - 1) * PAGE_SIZE + 1}
              end={Math.min(page * PAGE_SIZE, clusters.length)}
              total={clusters.length}
              onPage={(nextPage) => {
                setPage(nextPage)
                setActiveClusterId(null)
                setActiveActionId(null)
              }}
            />
          </section>

          {activeCluster && activeAction ? (
            <ActionDetails
              cluster={activeCluster}
              action={activeAction}
              busy={updating.has(activeAction.id)}
              onActionChange={setActiveActionId}
              onStatus={(status) => updateStatuses([activeAction], status)}
              className="hidden md:block"
            />
          ) : null}
        </div>
      ) : null}

      {activeClusterId && activeCluster && activeAction ? (
        <div className="fixed inset-0 z-50 bg-zinc-950/40 p-3 md:hidden" onMouseDown={() => setActiveClusterId(null)}>
          <ActionDetails
            cluster={activeCluster}
            action={activeAction}
            busy={updating.has(activeAction.id)}
            onActionChange={setActiveActionId}
            onStatus={(status) => updateStatuses([activeAction], status)}
            onClose={() => setActiveClusterId(null)}
            className="mx-auto max-h-full max-w-xl overflow-y-auto"
          />
        </div>
      ) : null}
    </div>
  )
}

function CompactActionRow({
  cluster,
  active,
  selected,
  partiallySelected,
  onSelect,
  onToggle,
}: {
  cluster: ActionCluster
  active: boolean
  selected: boolean
  partiallySelected: boolean
  onSelect: () => void
  onToggle: () => void
}) {
  const t = useTranslations('actions.page')
  const open = cluster.actions.filter((action) => action.status === 'todo' || action.status === 'in_progress').length
  const done = cluster.actions.filter((action) => action.status === 'done').length
  const dismissed = cluster.actions.filter((action) => action.status === 'dismissed').length
  const status = open ? t('openCount', { count: open }) : done ? t('doneCount', { count: done }) : t('dismissedCount', { count: dismissed })

  return (
    <div className={cn('grid grid-cols-[32px_minmax(0,1fr)] px-3 py-2.5 transition-colors', active ? 'bg-blue-50/70' : 'hover:bg-zinc-50')}>
      <div className="pt-1">
        <input
          type="checkbox"
          checked={selected}
          ref={(node) => {
            if (node) node.indeterminate = partiallySelected && !selected
          }}
          onChange={onToggle}
          aria-label={t('selectItem', { title: cluster.title })}
          className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
        />
      </div>
      <button type="button" onClick={onSelect} className="min-w-0 text-left">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', priorityClass(cluster.priority))}>{t(cluster.priority)}</span>
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">{t(`group.${cluster.planGroup}`)}</span>
            </div>
            <h2 className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-5 text-zinc-900">{cluster.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
              <span>{status}</span>
              <span>{t('questionCount', { count: cluster.actions.length })}</span>
              {cluster.models.length ? <span>{t('modelCount', { count: cluster.models.length })}</span> : null}
              {cluster.affectedResults ? <span>{t('checkCount', { count: cluster.affectedResults })}</span> : null}
            </div>
          </div>
          <ChevronRight className={cn('mt-5 h-4 w-4 shrink-0', active ? 'text-blue-700' : 'text-zinc-300')} />
        </div>
      </button>
    </div>
  )
}

function ActionDetails({
  cluster,
  action,
  busy,
  onActionChange,
  onStatus,
  onClose,
  className,
}: {
  cluster: ActionCluster
  action: ActionItem
  busy: boolean
  onActionChange: (id: string) => void
  onStatus: (status: ActionStatus) => void
  onClose?: () => void
  className?: string
}) {
  const t = useTranslations('actions.page')
  const sourceLabel = action.source === 'manual'
    ? t('source.manual')
    : action.ruleKey === 'prompt_visibility_gap'
      ? t('source.answer')
      : t('source.audit')
  return (
    <aside
      onMouseDown={(event) => event.stopPropagation()}
      className={cn('overflow-hidden rounded-xl border border-nuw-line bg-white md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:overflow-y-auto', className)}
    >
      <div className="border-b border-nuw-line p-4">
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-medium', priorityClass(action.priority))}>{t(action.priority)}</span>
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">{t(`status.${action.status}`)}</span>
            <span className="text-[11px] text-zinc-400">{sourceLabel}</span>
          </div>
          {onClose ? (
            <button type="button" onClick={onClose} aria-label={t('closeDetails')} className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <h2 className="mt-2 text-[15px] font-semibold leading-6 text-zinc-900">{action.title}</h2>
        <p className="mt-1 text-[12px] leading-5 text-zinc-600">{action.description}</p>

        {cluster.actions.length > 1 ? (
          <label className="mt-3 block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              {t('questionEvidence', { count: cluster.actions.length })}
            </span>
            <select
              value={action.id}
              onChange={(event) => onActionChange(event.target.value)}
              className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-[12px] text-zinc-800 outline-none focus:border-zinc-400"
            >
              {cluster.actions.map((item) => (
                <option key={item.id} value={item.id}>{item.trigger.promptText || item.title}</option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="p-4">
        <div className="rounded-xl bg-blue-50 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">{t('recommendedChange')}</p>
          <p className="mt-1 text-[13px] leading-5 text-blue-950">{action.recommendedChange}</p>
        </div>

        {action.impact ? <ImpactPanel impact={action.impact} /> : null}

        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{t('whyRecommended')}</p>
          <p className="mt-1 text-[12px] leading-5 text-zinc-600">{action.rationale}</p>
        </div>

        {action.target.url ? (
          <a href={action.target.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex max-w-full items-center gap-1 text-[12px] text-blue-700 hover:underline">
            <span className="truncate">{action.target.url}</span><ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        ) : null}

        <div className="mt-4 border-t border-nuw-line pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{t('evidence')}</p>
          {action.evidence.length ? (
            <ul className="mt-2 space-y-1.5">
              {action.evidence.map((evidence) => (
                <li key={`${evidence.type}:${evidence.id}`} className="text-[12px] leading-5 text-zinc-600">
                  {isExternal(evidence.href) ? (
                    <a href={evidence.href!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-700 hover:underline">
                      {evidence.label}<ExternalLink className="h-3 w-3" />
                    </a>
                  ) : evidence.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[12px] leading-5 text-zinc-500">{action.evidenceMessage ?? t('noEvidence')}</p>
          )}
        </div>

        {action.outcome ? (
          <div className={cn('mt-4 rounded-xl px-3 py-3', outcomeClass(action.outcome.status))}>
            <p className="text-[11px] font-semibold uppercase tracking-wide">{t('outcomeCheck')} · {t(`outcome.${action.outcome.status}`)}</p>
            <p className="mt-1 text-[12px] leading-5">{action.outcome.summary}</p>
            {action.outcome.runsObserved ? <p className="mt-1 text-[11px] opacity-70">{t('runsEvaluated', { count: action.outcome.runsObserved })}</p> : null}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {busy ? <span className="inline-flex items-center gap-1 text-[12px] text-zinc-500"><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('saving')}</span> : (
            <>
              {action.status === 'todo' ? <StatusButton icon={<Clock3 />} onClick={() => onStatus('in_progress')}>{t('start')}</StatusButton> : null}
              {action.status === 'todo' || action.status === 'in_progress' ? <StatusButton icon={<CheckCircle2 />} onClick={() => onStatus('done')}>{t('markDone')}</StatusButton> : null}
              {action.status === 'todo' || action.status === 'in_progress' ? <StatusButton icon={<XCircle />} onClick={() => onStatus('dismissed')}>{t('dismiss')}</StatusButton> : null}
              {action.status === 'done' || action.status === 'dismissed' ? <StatusButton icon={<RotateCcw />} onClick={() => onStatus('todo')}>{t('reopen')}</StatusButton> : null}
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-[12px] text-zinc-700 outline-none focus:border-zinc-400 sm:w-auto">
        {children}
      </select>
    </label>
  )
}

function Pagination({
  page,
  pageCount,
  start,
  end,
  total,
  onPage,
}: {
  page: number
  pageCount: number
  start: number
  end: number
  total: number
  onPage: (page: number) => void
}) {
  const t = useTranslations('actions.page')
  if (pageCount <= 1) return null
  return (
    <div className="flex items-center justify-between gap-3 border-t border-nuw-line px-3 py-2.5 text-[12px] text-zinc-500">
      <span>{t('pageStatus', { start, end, total })}</span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={page === 1} onClick={() => onPage(page - 1)} aria-label={t('previousPage')} className="rounded-md border border-nuw-line p-1.5 text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" /></button>
        <span className="min-w-16 text-center">{t('page', { page, total: pageCount })}</span>
        <button type="button" disabled={page === pageCount} onClick={() => onPage(page + 1)} aria-label={t('nextPage')} className="rounded-md border border-nuw-line p-1.5 text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  )
}

function shortTarget(target: string) {
  try {
    const url = new URL(target)
    return url.pathname === '/' ? url.hostname : url.pathname
  } catch {
    return target
  }
}

function ImpactPanel({ impact }: { impact: NonNullable<ActionItem['impact']> }) {
  const t = useTranslations('actions.page')
  const target = impact.pageMatch?.url
  return (
    <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50/70 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-800">{t('observedIssue')}</p>
      <p className="mt-1 text-[13px] font-medium text-orange-950">
        {t('checksNeedWork', { affected: impact.affectedResults, total: impact.totalResults })}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {impact.missingModels.length ? (
          <span className="rounded-md bg-white px-2 py-1 text-[11px] text-rose-700">
            {t('brandMissing', { models: impact.missingModels.join(', ') })}
          </span>
        ) : null}
        {impact.uncitedModels.length ? (
          <span className="rounded-md bg-white px-2 py-1 text-[11px] text-amber-700">
            {t('siteNotCited', { models: impact.uncitedModels.join(', ') })}
          </span>
        ) : null}
      </div>
      {impact.topCompetitors.length ? (
        <p className="mt-2 text-[12px] leading-5 text-orange-900">
          <span className="font-medium">{t('alternativesShown')}</span>{' '}
          {impact.topCompetitors.slice(0, 3).map((item) => `${item.name} (${item.answers})`).join(', ')}
        </p>
      ) : null}
      <p className="mt-2 text-[12px] leading-5 text-orange-900">
        <span className="font-medium">{t('recommendedPage')}</span>{' '}
        {target ? target : t('createPage')}
      </p>
      {impact.pageMatch?.missingConcepts?.length ? (
        <p className="mt-1 text-[12px] leading-5 text-orange-900">
          <span className="font-medium">{t('missingCoverage')}</span>{' '}
          {impact.pageMatch.missingConcepts.join(', ')}
        </p>
      ) : null}
      {impact.topSources.length ? (
        <div className="mt-2 text-[12px] leading-5 text-orange-900">
          <span className="font-medium">{t('sourcesUsed')}</span>{' '}
          {impact.topSources.slice(0, 4).map((source, index) => (
            <span key={source.domain}>
              {index ? ', ' : ''}
              {source.url ? <a href={source.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">{source.domain}</a> : source.domain}
              {' '}({source.answers})
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function StatusButton({ icon, children, onClick }: { icon: ReactElement; children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-lg border border-nuw-line px-2.5 py-1.5 text-[12px] text-zinc-700 hover:bg-zinc-50">
      <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>{children}
    </button>
  )
}

function priorityClass(priority: ActionItem['priority']) {
  if (priority === 'critical') return 'bg-rose-100 text-rose-700'
  if (priority === 'high') return 'bg-orange-100 text-orange-700'
  if (priority === 'medium') return 'bg-amber-50 text-amber-700'
  return 'bg-zinc-100 text-zinc-600'
}

function outcomeClass(status: NonNullable<ActionItem['outcome']>['status']) {
  if (status === 'improved') return 'bg-emerald-50 text-emerald-900'
  if (status === 'declined') return 'bg-rose-50 text-rose-900'
  return 'bg-zinc-50 text-zinc-700'
}

function isExternal(href: string | null | undefined) {
  return Boolean(href && /^https?:\/\//i.test(href))
}
