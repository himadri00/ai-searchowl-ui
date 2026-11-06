'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Competitor, PromptItem, PromptStatus, Topic } from '@/data/prompts'
import type { DiscoverySetup } from '@/components/prompts/discovery-panel'
import { PLAN_MAX, readPlanChoice } from '@/lib/plan-choice'
import { errorText, v2Get, v2Send, v2SendText } from '@/lib/v2'
import { useWorkspace } from '@/components/workspace/workspace-context'

type TopicSummary = { visibility: number | null; sentiment: number | null; position: number | null; web: number | null }
const emptySummary = (): TopicSummary => ({ visibility: null, sentiment: null, position: null, web: null })

function asPrompt(item: PromptItem): PromptItem {
  return {
    ...item,
    topicId: item.topicId || '',
    location: item.location || '',
    addedDays: item.addedDays ?? 0,
    mentionIds: item.mentionIds ?? [],
    volume: item.volume ?? [],
    tagIds: item.tagIds ?? [],
  }
}

export type MetricKey = 'visibility' | 'sov' | 'sentiment' | 'position' | 'winRate'
export type RangeId = 'all' | '7' | '14' | '30' | '90' | '180' | '365' | 'custom'
export type CompareId = 'period' | 'month' | 'year'

export type PromptFilters = {
  view: 'default' | 'chatgpt'
  range: RangeId
  customStart: string | null
  customEnd: string | null
  compare: CompareId
  models: string[] | null
  brandIds: string[] | null
  topics: string[] | null
  tags: string[] | null
  tagMode: 'or' | 'and'
  mentions: 'all' | 'mentioned' | 'not'
  metrics: Record<MetricKey, { min: string; max: string }>
}

export type DraftPrompt = {
  text: string
  topicId: string
  location: string
  tagIds: string[]
  intent: PromptItem['intent']
  branding: PromptItem['branding']
}

export type PromptTag = { id: string; name: string }

/** Bulk calls run one request per prompt. `failed` holds the first error so the screen can say what went wrong. */
export type BulkResult = { done: number; failed: number; error: string | null }
type AddResult = { added: number; leftOut: number; prompts: PromptItem[] }

type PromptsContextValue = {
  topics: Topic[]
  prompts: PromptItem[]
  tags: PromptTag[]
  competitors: Competitor[]
  extraBrands: Competitor[]
  promptLimit: number
  topicSummaries: { active: TopicSummary; archived: TopicSummary }
  dataLoading: boolean
  dataError: string | null
  messages: string[]
  filters: PromptFilters
  pristine: boolean
  selectedTopicId: string
  setSelectedTopicId: (id: string) => void
  topicsOpen: boolean
  toggleTopics: () => void
  setFilters: (update: PromptFilters | ((current: PromptFilters) => PromptFilters)) => void
  resetFilters: () => void
  reload: () => void
  tagName: (id: string) => string
  addTopic: (name: string) => Promise<string>
  renameTopic: (id: string, name: string) => Promise<void>
  deleteTopic: (id: string) => Promise<void>
  addBrand: (name: string, domain?: string) => Promise<void>
  addPrompts: (drafts: DraftPrompt[], status: 'active' | 'suggested') => Promise<AddResult>
  importCsv: (csv: string) => Promise<{ added: number }>
  discover: (topicId: string, setup: DiscoverySetup) => Promise<number>
  setStatus: (ids: string[], status: PromptStatus) => Promise<BulkResult>
  remove: (ids: string[]) => Promise<BulkResult>
  createTag: (name: string, promptId?: string) => Promise<PromptTag>
  setTags: (id: string, tagIds: string[]) => Promise<void>
  updateText: (id: string, text: string) => Promise<void>
}

const emptyMetrics = (): PromptFilters['metrics'] => ({
  visibility: { min: '', max: '' },
  sov: { min: '', max: '' },
  sentiment: { min: '', max: '' },
  position: { min: '', max: '' },
  winRate: { min: '', max: '' },
})

const defaultFilters = (): PromptFilters => ({
  view: 'default',
  range: 'all',
  customStart: null,
  customEnd: null,
  compare: 'period',
  models: null,
  brandIds: null,
  topics: null,
  tags: null,
  tagMode: 'or',
  mentions: 'all',
  metrics: emptyMetrics(),
})

const PromptsContext = createContext<PromptsContextValue | null>(null)

const palette = ['#F0A06A', '#E85D0C', '#0A0C16', '#3A3F4C', '#1C2030', '#8BC400']
const pageLimit = 100

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  const value = parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
  return value || 'BR'
}

type PromptPage = {
  promptLimit: number
  topics: Topic[]
  tags?: PromptTag[]
  topicSummaries: { active?: TopicSummary; archived?: TopicSummary }
  competitors: Competitor[]
  total?: number
  prompts: PromptItem[]
  messages?: { text: string }[]
}

async function loadAllPrompts() {
  const first = await v2Get<PromptPage>('prompts', { limit: pageLimit, offset: 0 })
  const prompts = [...(first.prompts ?? [])]
  const total = first.total ?? prompts.length
  while (prompts.length < total) {
    const next = await v2Get<PromptPage>('prompts', { limit: pageLimit, offset: prompts.length })
    if (!next.prompts?.length) break
    prompts.push(...next.prompts)
  }
  return { ...first, prompts }
}

async function eachId(ids: string[], run: (id: string) => Promise<void>): Promise<BulkResult> {
  let done = 0
  let failed = 0
  let error: string | null = null
  const queue = [...ids]
  const worker = async () => {
    while (queue.length) {
      const id = queue.shift() as string
      try {
        await run(id)
        done += 1
      } catch (caught) {
        failed += 1
        error = error ?? errorText(caught)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, ids.length) }, worker))
  return { done, failed, error }
}

export function PromptsProvider({ children }: { children: ReactNode }) {
  const { workspaceId, brandId, scopeReady, apiLoading, apiMessage } = useWorkspace()
  const [topics, setTopics] = useState<Topic[]>([])
  const [prompts, setPrompts] = useState<PromptItem[]>([])
  const [tags, setTagList] = useState<PromptTag[]>([])
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [promptLimit, setPromptLimit] = useState(50)
  const [topicSummaries, setTopicSummaries] = useState({ active: emptySummary(), archived: emptySummary() })
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)
  const [messages, setMessages] = useState<string[]>([])
  const [extraBrands, setExtraBrands] = useState<Competitor[]>([])
  const [filters, setFiltersState] = useState<PromptFilters>(defaultFilters)
  const [pristine, setPristine] = useState(true)
  const [selectedTopicId, setSelectedTopicId] = useState('all')
  const [topicsOpen, setTopicsOpen] = useState(true)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!scopeReady) {
      setDataError(apiLoading ? null : apiMessage)
      setDataLoading(apiLoading)
      return
    }
    let cancel = false
    setDataLoading(true)
    loadAllPrompts()
      .then(async (body) => {
        if (cancel) return
        const serverLimit = typeof body.promptLimit === 'number' ? body.promptLimit : 50
        const choice = readPlanChoice()
        // A chosen plan is a 7-day trial of that plan. The account can use the
        // plan's full allowance during the trial, even when the server still
        // reports the unset default of 0.
        const limit = serverLimit > 0 ? serverLimit : (choice ? PLAN_MAX[choice.plan] : serverLimit)
        setPromptLimit(limit)
        if (limit <= 0) {
          setDataError('This account can track 0 prompts because no plan is saved. Lite tracks 15, Standard 100, Premium 400, and Enterprise 1,000. Save that plan, then track these prompts.')
        }
        setTopics((body.topics ?? []).map((topic) => ({ ...topic })))
        setTagList(body.tags ?? [])
        setTopicSummaries({
          active: { ...emptySummary(), ...body.topicSummaries?.active },
          archived: { ...emptySummary(), ...body.topicSummaries?.archived },
        })
        setCompetitors(body.competitors ?? [])
        setPrompts((body.prompts ?? []).map(asPrompt))
        setMessages((body.messages ?? []).map((item) => item.text).filter(Boolean))
        if (limit > 0) setDataError(null)
        setDataLoading(false)
      })
      .catch((error: unknown) => {
        if (cancel) return
        setDataError(errorText(error, 'The prompt list could not be loaded. Refresh this page.'))
        setDataLoading(false)
      })
    return () => {
      cancel = true
    }
    // Reload when the switcher picks another workspace or brand: the proxy
    // scopes every call to that pick.
  }, [nonce, scopeReady, apiLoading, apiMessage, workspaceId, brandId])

  const replacePrompt = useCallback((next: PromptItem) => {
    setPrompts((current) => current.map((item) => (item.id === next.id ? asPrompt(next) : item)))
  }, [])

  const value = useMemo<PromptsContextValue>(() => {
    const patch = async (id: string, body: Record<string, unknown>) => {
      const next = await v2Send<PromptItem>('PATCH', `prompts/${encodeURIComponent(id)}`, body)
      setPristine(false)
      replacePrompt(next)
    }

    return {
      topics,
      prompts,
      tags,
      competitors,
      extraBrands,
      promptLimit,
      topicSummaries,
      dataLoading,
      dataError,
      messages,
      filters,
      pristine,
      selectedTopicId,
      setSelectedTopicId,
      topicsOpen,
      toggleTopics: () => setTopicsOpen((open) => !open),
      setFilters: setFiltersState,
      resetFilters: () => setFiltersState(defaultFilters()),
      reload: () => setNonce((current) => current + 1),
      tagName: (id) => tags.find((tag) => tag.id === id)?.name ?? id,
      addTopic: async (name) => {
        const topic = await v2Send<Topic>('POST', 'prompts/topics', { name: name.trim() })
        setTopics((current) => [...current, topic])
        setSelectedTopicId(topic.id)
        return topic.id
      },
      renameTopic: async (id, name) => {
        const topic = await v2Send<Topic>('PATCH', `prompts/topics/${encodeURIComponent(id)}`, { name: name.trim() })
        setTopics((current) => current.map((item) => (item.id === id ? { ...item, ...topic } : item)))
      },
      deleteTopic: async (id) => {
        await v2Send('DELETE', `prompts/topics/${encodeURIComponent(id)}`)
        setTopics((current) => current.filter((topic) => topic.id !== id))
        if (selectedTopicId === id) setSelectedTopicId('all')
      },
      addBrand: async (name, domain) => {
        const body = await v2Send<Partial<Competitor> & { name?: string } | null>('POST', 'prompts/competitors', { name: name.trim(), domain: domain?.trim() || null })
        const brandName = body?.name ?? name.trim()
        const brand: Competitor = {
          id: body?.id ?? brandName,
          name: brandName,
          color: body?.color ?? palette[extraBrands.length % palette.length],
          initials: body?.initials ?? initials(brandName),
        }
        setExtraBrands((current) => [...current, brand])
        setFiltersState((current) => ({
          ...current,
          brandIds: current.brandIds ? [...current.brandIds, brand.id] : current.brandIds,
        }))
      },
      addPrompts: async (drafts, status) => {
        const groups = new Map<string, DraftPrompt[]>()
        for (const draft of drafts) {
          const key = `${draft.topicId}|${draft.location}|${draft.branding ?? ''}`
          groups.set(key, [...(groups.get(key) ?? []), draft])
        }
        let added = 0
        let leftOut = 0
        const created: PromptItem[] = []
        for (const group of Array.from(groups.values())) {
          const first = group[0]
          const body = await v2Send<{ added: number; leftOut: number; prompts: PromptItem[] }>('POST', 'prompts', {
            topicId: first.topicId || null,
            status,
            location: first.location || null,
            branding: first.branding,
            lines: group.map((draft) => draft.text),
          })
          added += body.added ?? 0
          leftOut += body.leftOut ?? 0
          for (const prompt of body.prompts ?? []) {
            const draft = group.find((item) => item.text === prompt.text)
            const extra: Record<string, unknown> = {}
            if (draft?.intent && draft.intent !== prompt.intent) extra.intent = draft.intent
            if (draft?.tagIds.length) extra.tagIds = draft.tagIds
            created.push(Object.keys(extra).length ? await v2Send<PromptItem>('PATCH', `prompts/${encodeURIComponent(prompt.id)}`, extra) : prompt)
          }
        }
        if (created.length) {
          setPristine(false)
          setPrompts((current) => [...created.map(asPrompt), ...current])
        }
        return { added, leftOut, prompts: created }
      },
      importCsv: async (csv) => {
        const body = await v2SendText<{ added: number; prompts: PromptItem[] }>('prompts/import', csv, 'text/csv')
        if (body.prompts?.length) {
          setPristine(false)
          setPrompts((current) => [...body.prompts.map(asPrompt), ...current])
        }
        return { added: body.added ?? body.prompts?.length ?? 0 }
      },
      discover: async (topicId, setup) => {
        const rows = await v2Send<PromptItem[]>('POST', 'prompts/discover', {
          topicId,
          nonBranded: setup.nonBranded,
          informational: setup.informational,
          commercial: setup.commercial,
          transactional: setup.transactional,
          personasOn: setup.personasOn,
          personas: setup.personas,
          size: setup.size,
          context: setup.context.trim() || null,
        })
        if (rows.length) {
          setPristine(false)
          setPrompts((current) => [...rows.map(asPrompt), ...current])
        }
        return rows.length
      },
      setStatus: (ids, status) => eachId(ids, (id) => patch(id, { status })),
      remove: async (ids) => {
        const removed = new Set<string>()
        const result = await eachId(ids, async (id) => {
          await v2Send('DELETE', `prompts/${encodeURIComponent(id)}`)
          removed.add(id)
        })
        if (removed.size) {
          setPristine(false)
          setPrompts((current) => current.filter((item) => !removed.has(item.id)))
        }
        return result
      },
      createTag: async (name, promptId) => {
        const tag = await v2Send<PromptTag>('POST', 'prompts/tags', { name: name.trim(), prompt_id: promptId ?? null })
        setTagList((current) => (current.some((item) => item.id === tag.id) ? current : [...current, tag]))
        return tag
      },
      setTags: (id, tagIds) => patch(id, { tagIds }),
      updateText: (id, text) => patch(id, { text }),
    }
  }, [topics, prompts, tags, competitors, extraBrands, promptLimit, topicSummaries, dataLoading, dataError, messages, filters, pristine, selectedTopicId, topicsOpen, replacePrompt])

  return <PromptsContext.Provider value={value}>{children}</PromptsContext.Provider>
}

export function usePrompts() {
  const value = useContext(PromptsContext)
  if (!value) throw new Error('usePrompts must be used inside PromptsProvider')
  return value
}

export function filtersAreClear(filters: PromptFilters) {
  const metricsClear = Object.values(filters.metrics).every((bound) => bound.min === '' && bound.max === '')
  return filters.models === null && filters.brandIds === null && filters.topics === null && filters.tags === null && filters.mentions === 'all' && metricsClear && filters.range === 'all'
}
