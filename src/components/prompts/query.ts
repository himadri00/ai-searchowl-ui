import { fillBrand, type ColumnId, type PromptItem } from '@/data/prompts'
import type { PromptFilters } from '@/components/prompts/prompts-context'

const metricKeys = ['visibility', 'sov', 'sentiment', 'position', 'winRate'] as const

export function rowMatches(item: PromptItem, filters: PromptFilters, topicId: string, query: string, brandName: string) {
  if (topicId !== 'all' && item.topicId !== topicId) return false
  if (filters.topics && !filters.topics.includes(item.topicId)) return false
  const text = fillBrand(item.text, brandName).toLowerCase()
  if (query.trim() && !text.includes(query.trim().toLowerCase())) return false
  if (filters.mentions === 'mentioned' && item.mentionIds.length === 0) return false
  if (filters.mentions === 'not' && item.mentionIds.length > 0) return false
  if (filters.tags?.length === 0) return false
  if (filters.tags) {
    const has = (tag: string) => item.branding === tag || item.intent === tag || item.tagIds.includes(tag)
    const ok = filters.tagMode === 'and' ? filters.tags.every(has) : filters.tags.some(has)
    if (!ok) return false
  }
  for (const key of metricKeys) {
    const bound = filters.metrics[key]
    const value = item[key]
    if (bound.min.trim() !== '' && !Number.isNaN(Number(bound.min))) {
      if (value == null || value < Number(bound.min)) return false
    }
    if (bound.max.trim() !== '' && !Number.isNaN(Number(bound.max))) {
      if (value == null || value > Number(bound.max)) return false
    }
  }
  return true
}

export type SortMode = 'high' | 'low' | 'pos' | 'neg'
export type SortState = { key: ColumnId; mode: SortMode } | null

export function sortRows(rows: PromptItem[], sort: SortState) {
  if (!sort) return rows
  const direction = sort.mode === 'low' || sort.mode === 'neg' ? 1 : -1
  return rows.slice().sort((a, b) => {
    if (sort.mode === 'pos' || sort.mode === 'neg') return (a.trend - b.trend) * direction
    const left = sortValue(a, sort.key)
    const right = sortValue(b, sort.key)
    if (left == null && right == null) return 0
    if (left == null) return 1
    if (right == null) return -1
    if (typeof left === 'string' && typeof right === 'string') return left.localeCompare(right) * direction
    return (Number(left) - Number(right)) * direction
  })
}

function sortValue(item: PromptItem, key: ColumnId): number | string | null {
  if (key === 'volume') return item.volume.reduce((sum, value) => sum + value, 0) || null
  if (key === 'mentions') return item.mentionIds.length || null
  if (key === 'facts') return item.facts ? 1 : 0
  if (key === 'tags') return item.tagIds.length || null
  if (key === 'branding') return item.branding
  if (key === 'intent') return item.intent
  if (key === 'location') return item.location
  if (key === 'added') return item.addedDays
  return item[key]
}
