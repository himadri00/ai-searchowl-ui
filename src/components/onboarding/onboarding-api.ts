'use client'

import type { Topic } from '@/data/prompts'
import { readPlanChoice } from '@/lib/plan-choice'
import { V2Error, v2Get, v2Send } from '@/lib/v2'

export type OnboardingMode = 'solo' | 'agency'
export type OnboardingStep = 'mode' | 'domain' | 'name' | 'locations' | 'profile' | 'market' | 'topics' | 'focus' | 'done'
export type OnboardingStatus = 'notStarted' | 'inProgress' | 'completed'
export type MarketScope = 'global' | 'continent' | 'country' | 'state' | 'city' | 'neighborhood'
export type Focus = 'research' | 'compare' | 'action'

export type Location = { country: string; language: string; timezone: string }
export type Market = { scope: MarketScope; places: string[] }
export type BrandProfile = { description: string; category: string; identity: string[]; products: string[]; personas: string[] }

export type OnboardingDraft = {
  mode: OnboardingMode | null
  domain: string
  name: string
  locations: Location[]
  profile: BrandProfile | null
  market: Market
  topics: Topic[]
  focus: Focus
}

export type OnboardingState = {
  status: OnboardingStatus
  step: OnboardingStep
  email: string | null
  draft: OnboardingDraft
  awaitingChoice?: boolean
  trackLimit?: number
  workspaceId?: string
}

export type CompleteResult = {
  workspaceId: string
  brandId: string
  prompts: number
  trackLimit: number
  awaitingChoice: boolean
  chosen: boolean
}

export type ReviewPrompt = {
  id: string
  text: string
  topicId: string | null
  topicName: string
  location: string | null
}

export const onboardingPool = 100

/** Why the flow runs without the API. `null` means the API is live. */
export type PreviewReason = 'notBuilt' | 'unreachable' | 'envMissing' | null

export const stepOrder: OnboardingStep[] = ['mode', 'domain', 'name', 'locations', 'profile', 'market', 'topics', 'focus', 'done']

export const focusSplit: Record<Focus, { nonBranded: number; informational: number; commercial: number; transactional: number }> = {
  research: { nonBranded: 80, informational: 50, commercial: 30, transactional: 20 },
  compare: { nonBranded: 80, informational: 25, commercial: 50, transactional: 25 },
  action: { nonBranded: 80, informational: 20, commercial: 30, transactional: 50 },
}

export const locationLimit = 5
export const topicLimit = 10

export function emptyDraft(): OnboardingDraft {
  return {
    mode: null,
    domain: '',
    name: '',
    locations: [],
    profile: null,
    market: { scope: 'global', places: [] },
    topics: [],
    focus: 'compare',
  }
}

export function previewReason(error: unknown): PreviewReason {
  if (!(error instanceof V2Error)) return null
  if (error.status === 404 && !error.code) return 'notBuilt'
  if (error.code === 'API_UNREACHABLE') return 'unreachable'
  if (error.code === 'ENV_MISSING') return 'envMissing'
  return null
}

export function normalizeDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/^www\./, '')
    .split(/[/?#]/)[0]
    .replace(/:\d+$/, '')
    .replace(/\.$/, '')
}

export function isDomain(value: string) {
  return /^(?=.{3,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(value)
}

export function nameFromDomain(domain: string) {
  const label = domain.split('.')[0] ?? ''
  return label
    .split('-')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}

type Job<T> =
  | { status: 'queued' | 'running'; pollUrl?: string; poll_url?: string; jobId?: string; job_id?: string }
  | { status: 'completed'; result: T }
  | { status: 'failed'; message?: string }

function pollPath(job: { pollUrl?: string; poll_url?: string; jobId?: string; job_id?: string }) {
  const url = job.pollUrl ?? job.poll_url
  if (url) return url.replace(/^\/?v2\//, '')
  const id = job.jobId ?? job.job_id
  return id ? `onboarding/jobs/${encodeURIComponent(id)}` : null
}

const pollEveryMs = 1500

async function settle<T>(first: T | Job<T>, pollLimitMs = 120_000): Promise<T> {
  let current = first as Job<T> | T
  let path: string | null = null
  const started = Date.now()
  while (current && typeof current === 'object' && 'status' in current) {
    const job = current as Job<T>
    if (job.status === 'completed') return job.result
    if (job.status === 'failed') throw new Error(job.message || 'This step could not finish. Press the button again. Your answers so far are saved.')
    path = pollPath(job) ?? path
    if (!path) throw new Error('We could not check the progress of this step. Refresh the page in a minute to see the result. Your answers so far are saved.')
    if (Date.now() - started > pollLimitMs) {
      const minutes = Math.max(1, Math.round(pollLimitMs / 60_000))
      throw new Error(`This is taking longer than ${minutes} minutes. Wait a moment, then press the button again. Your answers so far are saved.`)
    }
    await new Promise((resolve) => window.setTimeout(resolve, pollEveryMs))
    current = await v2Get<Job<T>>(path)
  }
  return current as T
}

const storageKey = 'nuwtonic-onboarding'

function readLocal(): OnboardingState {
  const fallback: OnboardingState = { status: 'notStarted', step: 'mode', email: null, draft: emptyDraft() }
  try {
    const saved = window.localStorage.getItem(storageKey)
    if (!saved) return fallback
    const parsed = JSON.parse(saved) as Partial<OnboardingState>
    return {
      status: parsed.status ?? 'inProgress',
      step: parsed.step && stepOrder.includes(parsed.step) ? parsed.step : 'mode',
      email: null,
      draft: { ...emptyDraft(), ...parsed.draft },
    }
  } catch {
    window.localStorage.removeItem(storageKey)
    return fallback
  }
}

function writeLocal(state: OnboardingState) {
  window.localStorage.setItem(storageKey, JSON.stringify({ status: state.status, step: state.step, draft: state.draft }))
}

/** Pick ids evenly across topics, up to `limit`. */
export function spreadSelection(prompts: { id: string; topicId: string | null }[], limit: number): string[] {
  if (limit <= 0) return []
  const groups = new Map<string, string[]>()
  for (const prompt of prompts) {
    const key = prompt.topicId ?? ''
    const list = groups.get(key) ?? []
    list.push(prompt.id)
    groups.set(key, list)
  }
  const picked: string[] = []
  let round = 0
  while (picked.length < limit) {
    let added = false
    for (const ids of groups.values()) {
      const id = ids[round]
      if (!id) continue
      picked.push(id)
      added = true
      if (picked.length >= limit) break
    }
    if (!added) break
    round += 1
  }
  return picked
}

export function previewPool(draft: OnboardingDraft, total = onboardingPool): ReviewPrompt[] {
  const topics = draft.topics.length ? draft.topics : [{ id: 'topic', name: draft.name || 'Your topic' }]
  const prompts: ReviewPrompt[] = []
  let cursor = 0
  while (prompts.length < total) {
    const topic = topics[cursor % topics.length]
    const number = prompts.length + 1
    const name = topic.name || 'this topic'
    prompts.push({
      id: `preview-${number}`,
      text: `What should I look for in ${name}? (${number})`,
      topicId: topic.id,
      topicName: topic.name || 'Your topic',
      location: draft.locations[0]?.country ?? null,
    })
    cursor += 1
  }
  return prompts
}

export function createOnboardingApi(preview: boolean) {
  return {
    async load(): Promise<OnboardingState> {
      const state = preview ? readLocal() : await v2Get<OnboardingState>('onboarding')
      const draft = { ...emptyDraft(), ...Object.fromEntries(Object.entries(state.draft ?? {}).filter(([, value]) => value != null)) } as OnboardingDraft
      if (!(draft.focus in focusSplit)) draft.focus = emptyDraft().focus
      return { ...state, draft }
    },

    async save(step: OnboardingStep, draft: OnboardingDraft): Promise<void> {
      if (preview) {
        writeLocal({ status: 'inProgress', step, email: null, draft })
        return
      }
      await v2Send('PATCH', 'onboarding', { step, ...draft })
    },

    async checkDomain(domain: string): Promise<{ domain: string; suggestedName: string }> {
      if (preview) return { domain, suggestedName: nameFromDomain(domain) }
      return v2Send('POST', 'onboarding/domain-check', { domain })
    },

    async readProfile(draft: OnboardingDraft): Promise<BrandProfile> {
      if (preview) return { description: '', category: '', identity: [], products: [], personas: [] }
      const first = await v2Send<BrandProfile | Job<BrandProfile>>('POST', 'onboarding/profile', {
        domain: draft.domain,
        name: draft.name,
        language: draft.locations[0]?.language ?? 'en',
      })
      return settle(first)
    },

    async saveProfile(profile: BrandProfile): Promise<void> {
      if (preview) return
      await v2Send('PUT', 'onboarding/profile', profile)
    },

    async generateTopics(draft: OnboardingDraft): Promise<Topic[]> {
      if (preview) {
        const source = draft.profile?.products.length ? draft.profile.products : [draft.profile?.category ?? draft.name]
        return source.filter(Boolean).slice(0, 5).map((name, index) => ({ id: `topic${index + 1}`, name }))
      }
      const first = await v2Send<{ topics: Topic[] } | Job<{ topics: Topic[] }>>('POST', 'onboarding/topics', {})
      return (await settle(first)).topics
    },

    async complete(draft: OnboardingDraft): Promise<CompleteResult> {
      const split = focusSplit[draft.focus] ?? focusSplit.compare
      const choice = readPlanChoice()
      if (preview) {
        writeLocal({ status: 'inProgress', step: 'focus', email: null, draft })
        return {
          workspaceId: 'preview',
          brandId: normalizeDomain(draft.domain),
          prompts: onboardingPool,
          trackLimit: choice?.prompts ?? 15,
          awaitingChoice: true,
          chosen: false,
        }
      }
      const first = await v2Send<CompleteResult | Job<CompleteResult>>('POST', 'onboarding/complete', {
        topics: draft.topics.map((topic) => topic.name ?? ''),
        focus: draft.focus,
        ...split,
        ...(choice ? { plan: choice.plan, prompts: choice.prompts } : {}),
      })
      return settle(first, 360_000)
    },

    async pool(): Promise<{ prompts: ReviewPrompt[]; trackLimit: number }> {
      if (preview) {
        const choice = readPlanChoice()
        return { prompts: previewPool(readLocal().draft), trackLimit: choice?.prompts ?? 15 }
      }
      const body = await v2Get<{ trackLimit?: number; prompts?: Partial<ReviewPrompt>[] }>('onboarding/prompts')
      const prompts = (body.prompts ?? []).flatMap((item) => {
        if (!item.id || !item.text) return []
        return [{
          id: item.id,
          text: item.text,
          topicId: item.topicId ?? null,
          topicName: item.topicName ?? '',
          location: item.location ?? null,
        }]
      })
      return { prompts, trackLimit: body.trackLimit ?? 0 }
    },

    async choose(promptIds: string[]): Promise<CompleteResult> {
      if (preview) {
        const choice = readPlanChoice()
        writeLocal({ status: 'completed', step: 'done', email: null, draft: readLocal().draft })
        return {
          workspaceId: 'preview',
          brandId: 'preview',
          prompts: promptIds.length,
          trackLimit: choice?.prompts ?? promptIds.length,
          awaitingChoice: false,
          chosen: true,
        }
      }
      return v2Send<CompleteResult>('POST', 'onboarding/prompts', { promptIds })
    },

    reset() {
      if (preview) window.localStorage.removeItem(storageKey)
    },
  }
}

export type OnboardingApi = ReturnType<typeof createOnboardingApi>
