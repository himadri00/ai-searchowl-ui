import type { DomainKind, MentionId, MoverTab, UrlTypeId } from '@/data/urls'

export const domainDates = ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17']
export const promptsCreated = 146

export type DomainRecord = {
  id: string
  host: string
  kind: 'domain' | 'host'
  parentId?: string
  domainType: DomainKind
  mentions: MentionId[]
  retrievals: number
  listedRetrievals: number
  retrievalDelta: number | null
  retrieved: number
  retrievedDelta: number | null
  cited: number
  headerCited?: number
  citedDelta: number | null
  retrievalRate: number
  citationRate: number
  gapScore: number
  totalCitations: number
  citationShare: number
  usedAsSource: number
  topics: string[]
  promptTags: string[]
  models: string[]
  movers: MoverTab[]
  chart?: boolean
  color?: string
  series: number[]
  previous: number[]
}

export type DomainPage = {
  id: string
  domainId: string
  title: string
  path: string
  type: UrlTypeId
  mentions: MentionId[]
  retrievals: number
  retrievalDelta: number | null
  citation: number
  citationDelta: number | null
  series: number[]
  color: string
  urlId?: string
}

export type DomainChat = {
  id: string
  domainId: string
  title: string
  snippet: string
  mentions: MentionId[]
  sources: string[]
  links: number
  features: Array<'shopping' | 'web' | 'links' | 'none'>
  position: number | null
  positions?: Record<string, number> | null
  createdDays: number
  createdAt?: string | null
}

export const domainTypeShare: { id: DomainKind; share: number; retrievals: number }[] = [
  { id: 'corporate', share: 68, retrievals: 8200 },
  { id: 'ugc', share: 14, retrievals: 1680 },
  { id: 'editorial', share: 5, retrievals: 600 },
  { id: 'other', share: 4, retrievals: 533 },
  { id: 'you', share: 3, retrievals: 360 },
  { id: 'reference', share: 3, retrievals: 385 },
  { id: 'institutional', share: 2, retrievals: 240 },
]

const row = (item: DomainRecord): DomainRecord => item

export const domains: DomainRecord[] = [
  row({
    id: 'youtube', host: 'youtube.com', kind: 'domain', domainType: 'ugc', mentions: [],
    retrievals: 303, listedRetrievals: 180, retrievalDelta: 12, retrieved: 8.4, retrievedDelta: 0.4, cited: 3.1, citedDelta: null,
    retrievalRate: 1.4, citationRate: 0.8, gapScore: 10, totalCitations: 90, citationShare: 12, usedAsSource: 14.2,
    topics: ['video'], promptTags: ['faceless', 'creator'], models: ['chatgpt', 'perplexity', 'aioverview'],
    movers: ['top', 'trending'], chart: true, color: '#ec4899',
    series: [125, 42, 40, 38, 34, 40], previous: [90, 36, 34, 30, 28, 32],
  }),
  row({
    id: 'nuwtonic', host: 'aisearchowl.com', kind: 'domain', domainType: 'you', mentions: ['you'],
    retrievals: 134, listedRetrievals: 40, retrievalDelta: 9, retrieved: 4.2, retrievedDelta: 0.6, cited: 2.4, citedDelta: 0.2,
    retrievalRate: 0.6, citationRate: 0.9, gapScore: 8, totalCitations: 48, citationShare: 9, usedAsSource: 8.1,
    topics: ['video', 'scheduling'], promptTags: ['faceless', 'manager'], models: ['chatgpt', 'perplexity', 'aioverview'],
    movers: ['top', 'trending'], chart: true, color: '#14b8a6',
    series: [48, 28, 22, 18, 17, 20], previous: [30, 20, 16, 14, 14, 16],
  }),
  row({
    id: 'reddit', host: 'reddit.com', kind: 'domain', domainType: 'ugc', mentions: ['hunt'],
    retrievals: 87, listedRetrievals: 24, retrievalDelta: null, retrieved: 2.1, retrievedDelta: null, cited: 0.8, citedDelta: null,
    retrievalRate: 0.4, citationRate: 0.3, gapScore: 22, totalCitations: 16, citationShare: 4, usedAsSource: 3.4,
    topics: ['video'], promptTags: ['hobbyist'], models: ['perplexity', 'aioverview'],
    movers: ['top', 'new'], chart: true, color: '#71717a',
    series: [32, 16, 14, 12, 10, 12], previous: [20, 12, 10, 10, 8, 10],
  }),
  row({
    id: 'opus', host: 'opus.pro', kind: 'domain', domainType: 'corporate', mentions: ['toolify', 'topai'],
    retrievals: 82, listedRetrievals: 5, retrievalDelta: -4, retrieved: 0.4, retrievedDelta: -0.1, cited: 0.2, citedDelta: null,
    retrievalRate: 0.2, citationRate: 0.2, gapScore: 30, totalCitations: 4, citationShare: 1, usedAsSource: 1.1,
    topics: ['video'], promptTags: ['creator'], models: ['chatgpt', 'aioverview'],
    movers: ['top', 'losing'], chart: true, color: '#a1a1aa',
    series: [22, 14, 12, 12, 15, 14], previous: [24, 16, 14, 14, 16, 16],
  }),
  row({
    id: 'faceless', host: 'faceless.so', kind: 'domain', domainType: 'competitor', mentions: ['hunt', 'directory'],
    retrievals: 67, listedRetrievals: 9, retrievalDelta: -6, retrieved: 0.7, retrievedDelta: -0.2, cited: 0.3, citedDelta: null,
    retrievalRate: 0.2, citationRate: 0.2, gapScore: 64, totalCitations: 6, citationShare: 2, usedAsSource: 1.6,
    topics: ['video'], promptTags: ['faceless'], models: ['perplexity'],
    movers: ['top', 'losing'], chart: true, color: '#7c3aed',
    series: [28, 14, 12, 10, 9, 10], previous: [30, 16, 14, 12, 12, 12],
  }),
  row({
    id: 'nuwtongen', host: 'nuwtongen.com', kind: 'domain', domainType: 'competitor', mentions: ['futuretools'],
    retrievals: 66, listedRetrievals: 8, retrievalDelta: -2, retrieved: 0.6, retrievedDelta: null, cited: 0.2, citedDelta: null,
    retrievalRate: 0.2, citationRate: 0.1, gapScore: 40, totalCitations: 3, citationShare: 1, usedAsSource: 1.2,
    topics: ['planning'], promptTags: ['manager'], models: ['chatgpt'],
    movers: ['top', 'losing'], color: '#6366f1',
    series: [18, 12, 10, 9, 8, 9], previous: [16, 12, 10, 10, 10, 10],
  }),
  row({
    id: 'buffer', host: 'buffer.com', kind: 'domain', domainType: 'corporate', mentions: ['directory'],
    retrievals: 64, listedRetrievals: 7, retrievalDelta: 5, retrieved: 0.6, retrievedDelta: 0.1, cited: 0.2, citedDelta: null,
    retrievalRate: 0.2, citationRate: 0.2, gapScore: 18, totalCitations: 5, citationShare: 1, usedAsSource: 1.4,
    topics: ['scheduling'], promptTags: ['manager'], models: ['chatgpt', 'perplexity'],
    movers: ['top', 'new', 'trending'], color: '#22c55e',
    series: [16, 10, 10, 9, 9, 10], previous: [10, 8, 8, 7, 7, 8],
  }),
  row({
    id: 'metricool', host: 'metricool.com', kind: 'domain', domainType: 'corporate', mentions: ['hunt', 'directory', 'topai'],
    retrievals: 61, listedRetrievals: 22, retrievalDelta: null, retrieved: 1.8, retrievedDelta: null, cited: 1.0, citedDelta: null,
    retrievalRate: 0.1, citationRate: 0.6, gapScore: 48, totalCitations: 11, citationShare: 3, usedAsSource: 5.1, headerCited: 2,
    topics: ['video', 'scheduling'], promptTags: ['faceless', 'commercial'], models: ['perplexity', 'aioverview'],
    movers: ['top', 'trending'], color: '#eab308',
    series: [14, 10, 9, 9, 9, 10], previous: [8, 8, 8, 8, 8, 8],
  }),
  row({
    id: 'google', host: 'google.com', kind: 'domain', domainType: 'other', mentions: ['futurepedia'],
    retrievals: 44, listedRetrievals: 6, retrievalDelta: 3, retrieved: 0.5, retrievedDelta: null, cited: 0.2, citedDelta: null,
    retrievalRate: 0.1, citationRate: 0.1, gapScore: 12, totalCitations: 4, citationShare: 1, usedAsSource: 0.9,
    topics: ['planning'], promptTags: ['agency'], models: ['aioverview'],
    movers: ['trending'], color: '#4285f4',
    series: [10, 8, 7, 6, 6, 7], previous: [8, 6, 6, 5, 5, 6],
  }),
  row({
    id: 'quuu', host: 'quuu.co', kind: 'domain', domainType: 'corporate', mentions: ['directory', 'futurepedia'],
    retrievals: 28, listedRetrievals: 15, retrievalDelta: null, retrieved: 1.3, retrievedDelta: null, cited: 0.8, citedDelta: null,
    retrievalRate: 0.1, citationRate: 0.4, gapScore: 36, totalCitations: 5, citationShare: 1, usedAsSource: 1.0,
    topics: ['scheduling'], promptTags: ['manager'], models: ['chatgpt', 'perplexity'],
    movers: ['new'], color: '#0ea5e9',
    series: [8, 5, 4, 4, 4, 3], previous: [4, 4, 3, 3, 3, 3],
  }),
  row({
    id: 'virvid', host: 'virvid.ai', kind: 'domain', domainType: 'corporate', mentions: ['toolify'],
    retrievals: 20, listedRetrievals: 11, retrievalDelta: null, retrieved: 0.9, retrievedDelta: null, cited: 0, citedDelta: null,
    retrievalRate: 0.1, citationRate: 0, gapScore: 28, totalCitations: 2, citationShare: 1, usedAsSource: 0.7,
    topics: ['video'], promptTags: ['creator'], models: ['perplexity'],
    movers: [], color: '#84cc16',
    series: [6, 4, 3, 3, 2, 2], previous: [4, 3, 3, 2, 2, 2],
  }),
  row({
    id: 'overseeros', host: 'overseeros.com', kind: 'domain', domainType: 'corporate', mentions: ['taaft'],
    retrievals: 14, listedRetrievals: 7, retrievalDelta: null, retrieved: 0.6, retrievedDelta: null, cited: 0.1, citedDelta: null,
    retrievalRate: 0.1, citationRate: 0.1, gapScore: 20, totalCitations: 1, citationShare: 0, usedAsSource: 0.4,
    topics: ['planning'], promptTags: ['agency'], models: ['chatgpt'],
    movers: [], color: '#38bdf8',
    series: [4, 3, 2, 2, 2, 1], previous: [3, 2, 2, 2, 1, 1],
  }),
  row({
    id: 'vidmachine', host: 'vidmachine.ai', kind: 'domain', domainType: 'corporate', mentions: ['futuretools'],
    retrievals: 12, listedRetrievals: 6, retrievalDelta: null, retrieved: 0.5, retrievedDelta: null, cited: 0.2, citedDelta: null,
    retrievalRate: 0, citationRate: 0.1, gapScore: 16, totalCitations: 1, citationShare: 0, usedAsSource: 0.3,
    topics: ['video'], promptTags: ['hobbyist'], models: ['aioverview'],
    movers: [], color: '#111827',
    series: [3, 2, 2, 2, 2, 1], previous: [2, 2, 2, 1, 1, 1],
  }),
  row({
    id: 'frameo', host: 'frameo.ai', kind: 'domain', domainType: 'corporate', mentions: ['topai'],
    retrievals: 8, listedRetrievals: 3, retrievalDelta: null, retrieved: 0.3, retrievedDelta: null, cited: 0, citedDelta: null,
    retrievalRate: 0, citationRate: 0, gapScore: 14, totalCitations: 0, citationShare: 0, usedAsSource: 0.2,
    topics: ['video'], promptTags: ['faceless'], models: ['perplexity'],
    movers: [], color: '#a78bfa',
    series: [2, 2, 1, 1, 1, 1], previous: [1, 1, 1, 1, 1, 1],
  }),
  row({
    id: 'imappliedseo', host: 'imappliedseo.com', kind: 'domain', domainType: 'corporate', mentions: ['directory'],
    retrievals: 8, listedRetrievals: 3, retrievalDelta: null, retrieved: 0.3, retrievedDelta: null, cited: 0.1, citedDelta: null,
    retrievalRate: 0, citationRate: 0.1, gapScore: 11, totalCitations: 1, citationShare: 0, usedAsSource: 0.2,
    topics: ['planning'], promptTags: ['agency'], models: ['chatgpt'],
    movers: [], color: '#60a5fa',
    series: [2, 2, 1, 1, 1, 1], previous: [1, 1, 1, 1, 1, 1],
  }),
  row({
    id: 'theaitoolsbox', host: 'theaitoolsbox.com', kind: 'domain', domainType: 'ugc', mentions: ['topai', 'toolify'],
    retrievals: 24, listedRetrievals: 24, retrievalDelta: null, retrieved: 2.0, retrievedDelta: null, cited: 1.2, citedDelta: null,
    retrievalRate: 0, citationRate: 0.8, gapScore: 24, totalCitations: 7, citationShare: 2, usedAsSource: 2, headerCited: 1.2,
    topics: ['video'], promptTags: ['faceless'], models: ['perplexity', 'chatgpt'],
    movers: ['new'], color: '#8b5cf6',
    series: [9, 4, 3, 3, 3, 3], previous: [5, 3, 2, 2, 2, 2],
  }),
  row({
    id: 'setuproll', host: 'setuproll.com', kind: 'domain', domainType: 'ugc', mentions: ['directory'],
    retrievals: 7, listedRetrievals: 7, retrievalDelta: null, retrieved: 0.6, retrievedDelta: null, cited: 0, citedDelta: null,
    retrievalRate: 0, citationRate: 0, gapScore: 7, totalCitations: 0, citationShare: 0, usedAsSource: 0.6,
    topics: ['video'], promptTags: ['faceless'], models: ['perplexity'],
    movers: [], color: '#f97316',
    series: [3, 2, 1, 1, 1, 1], previous: [2, 1, 1, 1, 1, 1],
  }),
  row({
    id: 'nuwcutlab', host: 'nuwcutlab.com', kind: 'domain', domainType: 'reference', mentions: ['hunt'],
    retrievals: 1, listedRetrievals: 1, retrievalDelta: null, retrieved: 0.1, retrievedDelta: null, cited: 0, citedDelta: null,
    retrievalRate: 0, citationRate: 0, gapScore: 2, totalCitations: 0, citationShare: 0, usedAsSource: 0.1,
    topics: ['video'], promptTags: ['hobbyist'], models: ['chatgpt'],
    movers: [], color: '#c084fc',
    series: [1, 0, 0, 0, 0, 0], previous: [0, 0, 0, 0, 0, 0],
  }),
  row({
    id: 'searchengineland', host: 'searchengineland.com', kind: 'domain', domainType: 'editorial', mentions: ['hunt'],
    retrievals: 11, listedRetrievals: 4, retrievalDelta: null, retrieved: 0.3, retrievedDelta: null, cited: 0.1, citedDelta: null,
    retrievalRate: 0, citationRate: 0.1, gapScore: 15, totalCitations: 1, citationShare: 0, usedAsSource: 0.3,
    topics: ['planning'], promptTags: ['agency'], models: ['aioverview'],
    movers: [], color: '#f97316',
    series: [3, 2, 2, 2, 1, 1], previous: [2, 2, 1, 1, 1, 1],
  }),
  row({
    id: 'moz', host: 'moz.com', kind: 'domain', domainType: 'editorial', mentions: ['directory'],
    retrievals: 9, listedRetrievals: 2, retrievalDelta: null, retrieved: 0.2, retrievedDelta: null, cited: 0.1, citedDelta: null,
    retrievalRate: 0, citationRate: 0, gapScore: 13, totalCitations: 1, citationShare: 0, usedAsSource: 0.2,
    topics: ['planning'], promptTags: ['manager'], models: ['chatgpt'],
    movers: [], color: '#0ea5e9',
    series: [2, 2, 2, 1, 1, 1], previous: [2, 1, 1, 1, 1, 1],
  }),
  row({
    id: 'wikipedia', host: 'wikipedia.org', kind: 'domain', domainType: 'reference', mentions: ['futurepedia'],
    retrievals: 18, listedRetrievals: 5, retrievalDelta: null, retrieved: 0.4, retrievedDelta: null, cited: 0.3, citedDelta: null,
    retrievalRate: 0.1, citationRate: 0.2, gapScore: 6, totalCitations: 3, citationShare: 1, usedAsSource: 0.6,
    topics: ['planning'], promptTags: ['hobbyist'], models: ['aioverview', 'chatgpt'],
    movers: [], color: '#c084fc',
    series: [4, 3, 3, 3, 3, 2], previous: [3, 3, 2, 2, 2, 2],
  }),
]

export const hosts: DomainRecord[] = [
  row({
    id: 'www-youtube', host: 'www.youtube.com', kind: 'host', parentId: 'youtube', domainType: 'ugc', mentions: [],
    retrievals: 210, listedRetrievals: 120, retrievalDelta: 8, retrieved: 5.5, retrievedDelta: 0.2, cited: 2.0, citedDelta: null,
    retrievalRate: 0.9, citationRate: 0.5, gapScore: 10, totalCitations: 60, citationShare: 8, usedAsSource: 9.4,
    topics: ['video'], promptTags: ['faceless'], models: ['chatgpt', 'perplexity'],
    movers: ['top', 'trending'], chart: true, color: '#ec4899',
    series: [80, 30, 28, 26, 24, 28], previous: [60, 24, 22, 20, 18, 22],
  }),
  row({
    id: 'm-youtube', host: 'm.youtube.com', kind: 'host', parentId: 'youtube', domainType: 'ugc', mentions: ['hunt'],
    retrievals: 93, listedRetrievals: 18, retrievalDelta: 4, retrieved: 1.1, retrievedDelta: null, cited: 0.4, citedDelta: null,
    retrievalRate: 0.3, citationRate: 0.2, gapScore: 12, totalCitations: 8, citationShare: 2, usedAsSource: 2.2,
    topics: ['video'], promptTags: ['creator'], models: ['aioverview'],
    movers: ['top', 'new'], chart: true, color: '#f472b6',
    series: [28, 16, 14, 12, 11, 12], previous: [16, 12, 10, 10, 8, 10],
  }),
  row({
    id: 'host-nuwtonic', host: 'aisearchowl.com', kind: 'host', parentId: 'nuwtonic', domainType: 'you', mentions: ['you'],
    retrievals: 134, listedRetrievals: 40, retrievalDelta: 9, retrieved: 4.2, retrievedDelta: 0.6, cited: 2.4, citedDelta: 0.2,
    retrievalRate: 0.6, citationRate: 0.9, gapScore: 8, totalCitations: 48, citationShare: 9, usedAsSource: 8.1,
    topics: ['video'], promptTags: ['faceless', 'manager'], models: ['chatgpt', 'perplexity'],
    movers: ['top', 'trending'], chart: true, color: '#14b8a6',
    series: [48, 28, 22, 18, 17, 20], previous: [30, 20, 16, 14, 14, 16],
  }),
  row({
    id: 'www-reddit', host: 'www.reddit.com', kind: 'host', parentId: 'reddit', domainType: 'ugc', mentions: ['hunt'],
    retrievals: 70, listedRetrievals: 16, retrievalDelta: null, retrieved: 1.4, retrievedDelta: null, cited: 0.5, citedDelta: null,
    retrievalRate: 0.3, citationRate: 0.2, gapScore: 18, totalCitations: 10, citationShare: 2, usedAsSource: 2.4,
    topics: ['video'], promptTags: ['hobbyist'], models: ['perplexity'],
    movers: ['top'], chart: true, color: '#71717a',
    series: [22, 12, 10, 9, 8, 9], previous: [16, 10, 8, 8, 7, 8],
  }),
  row({
    id: 'help-metricool', host: 'help.metricool.com', kind: 'host', parentId: 'metricool', domainType: 'corporate', mentions: ['topai', 'directory'],
    retrievals: 28, listedRetrievals: 9, retrievalDelta: 2, retrieved: 0.7, retrievedDelta: null, cited: 0.3, citedDelta: null,
    retrievalRate: 0.1, citationRate: 0.2, gapScore: 22, totalCitations: 3, citationShare: 1, usedAsSource: 0.8,
    topics: ['scheduling'], promptTags: ['faceless'], models: ['perplexity', 'aioverview'],
    movers: ['new', 'trending'], chart: true, color: '#eab308',
    series: [8, 5, 4, 4, 4, 3], previous: [4, 3, 3, 3, 3, 3],
  }),
  row({
    id: 'blog-quuu', host: 'blog.quuu.co', kind: 'host', parentId: 'quuu', domainType: 'corporate', mentions: ['futurepedia'],
    retrievals: 15, listedRetrievals: 8, retrievalDelta: null, retrieved: 0.6, retrievedDelta: null, cited: 0.3, citedDelta: null,
    retrievalRate: 0.1, citationRate: 0.2, gapScore: 19, totalCitations: 2, citationShare: 0, usedAsSource: 0.4,
    topics: ['scheduling'], promptTags: ['manager'], models: ['chatgpt'],
    movers: ['new'], color: '#0ea5e9',
    series: [4, 3, 2, 2, 2, 2], previous: [2, 2, 2, 2, 1, 1],
  }),
  row({
    id: 'www-opus', host: 'www.opus.pro', kind: 'host', parentId: 'opus', domainType: 'corporate', mentions: ['toolify'],
    retrievals: 50, listedRetrievals: 4, retrievalDelta: -3, retrieved: 0.3, retrievedDelta: null, cited: 0.1, citedDelta: null,
    retrievalRate: 0.1, citationRate: 0.1, gapScore: 24, totalCitations: 2, citationShare: 0, usedAsSource: 0.6,
    topics: ['video'], promptTags: ['creator'], models: ['aioverview'],
    movers: ['losing'], color: '#a1a1aa',
    series: [14, 9, 8, 7, 6, 6], previous: [16, 12, 10, 9, 8, 8],
  }),
]

const metricoolPages: DomainPage[] = [
  { id: 'metricool-guide', domainId: 'metricool', title: 'Faceless YouTube Channel Guide | Metricool', path: '/faceless-youtube-channel', type: 'howTo', mentions: ['hunt', 'directory', 'topai'], retrievals: 22, retrievalDelta: 22, citation: 0.5, citationDelta: 0.5, series: [7, 4, 3, 3, 3, 3], color: '#14b8a6', urlId: 'metricool' },
  { id: 'metricool-agents', domainId: 'metricool', title: 'AI agents for social media', path: '/ai-agents-for-social-media', type: 'product', mentions: ['directory'], retrievals: 10, retrievalDelta: null, citation: 0.2, citationDelta: null, series: [4, 2, 1, 1, 1, 1], color: '#22c55e' },
  { id: 'metricool-schedule', domainId: 'metricool', title: 'How to schedule content from the calendar', path: '/how-to-schedule-content-from-the-calendar-q8ymv', type: 'howTo', mentions: ['topai'], retrievals: 9, retrievalDelta: null, citation: 0.1, citationDelta: null, series: [3, 2, 1, 1, 1, 1], color: '#7c3aed' },
  { id: 'metricool-pricing', domainId: 'metricool', title: 'Pricing', path: '/pricing', type: 'product', mentions: ['hunt'], retrievals: 9, retrievalDelta: null, citation: 0.2, citationDelta: null, series: [3, 1, 1, 1, 2, 1], color: '#a1a1aa' },
  { id: 'metricool-planner', domainId: 'metricool', title: 'Planner', path: '/planner', type: 'product', mentions: ['futurepedia'], retrievals: 6, retrievalDelta: null, citation: 0.1, citationDelta: null, series: [2, 1, 1, 1, 1, 0], color: '#ec4899' },
  { id: 'metricool-pricing-trk', domainId: 'metricool', title: 'Pricing article block', path: '/pricing?trk=article-ssr-frontend-pulse_little-text-block', type: 'article', mentions: [], retrievals: 5, retrievalDelta: null, citation: 0, citationDelta: null, series: [1, 1, 1, 1, 1, 0], color: '#71717a' },
  { id: 'metricool-faqs', domainId: 'metricool', title: 'Content planning guide', path: '/content-planning-full-guide-faqs-qc5e1', type: 'howTo', mentions: ['toolify'], retrievals: 4, retrievalDelta: null, citation: 0.1, citationDelta: null, series: [1, 1, 1, 1, 0, 0], color: '#014CFF' },
  { id: 'metricool-start', domainId: 'metricool', title: 'Getting started with Metricool', path: '/getting-started-with-metricool', type: 'article', mentions: ['directory'], retrievals: 4, retrievalDelta: null, citation: 0, citationDelta: null, series: [1, 1, 0, 1, 1, 0], color: '#f97316' },
]

export const metricoolTypeShare: { id: UrlTypeId; share: number }[] = [
  { id: 'howTo', share: 41 },
  { id: 'product', share: 31 },
  { id: 'article', share: 10 },
  { id: 'comparison', share: 6 },
  { id: 'other', share: 5 },
  { id: 'listicle', share: 5 },
  { id: 'alternative', share: 2 },
  { id: 'homepage', share: 1 },
]

export const metricoolTypeTotal = 152

export const domainChats: DomainChat[] = [
  { id: 'dc1', domainId: 'metricool', title: 'What are the best platforms for automating faceless YouTube channel production?', snippet: 'The best setup depends on your format: one tool for hands-off posting, another when you still want to approve each clip.', mentions: ['hunt', 'directory', 'futurepedia', 'futuretools', 'taaft'], sources: ['youtube.com', 'aisearchowl.com'], links: 5, features: ['web', 'links'], position: null, createdDays: 0 },
  { id: 'dc2', domainId: 'metricool', title: 'What are the main advantages of using {brand} compared to manually editing clips?', snippet: 'If by “{brand}” you mean an AI tool for making YouTube Shorts, its main advantage is speed.', mentions: ['you'], sources: ['aisearchowl.com'], links: 5, features: ['web'], position: 1, createdDays: 0 },
  { id: 'dc3', domainId: 'metricool', title: 'What is the role of AI agents in managing daily social media uploads?', snippet: 'AI agents can automate the daily upload workflow: prepare and adapt posts for each channel.', mentions: [], sources: ['linkedin.com', 'metricool.com'], links: 7, features: ['links'], position: null, createdDays: 0 },
  { id: 'dc4', domainId: 'metricool', title: 'Compare {brand} with other AI video automation tools for managing multiple client channels.', snippet: '{brand} vs other AI video automation tools for multiple Instagram accounts.', mentions: ['you'], sources: ['aisearchowl.com', 'faceless.so'], links: 14, features: ['web', 'links'], position: 1, createdDays: 0 },
  { id: 'dc5', domainId: 'metricool', title: 'Looking for a tool to streamline my faceless channel workflow.', snippet: 'For an all-in-one option, try a studio that assembles narration, animation, and posting in one queue.', mentions: ['toolify', 'topai'], sources: ['faceless.so', 'opus.pro'], links: 6, features: ['links'], position: null, createdDays: 0 },
  { id: 'dc6', domainId: 'metricool', title: 'Which software best handles bulk video creation for multiple Instagram accounts?', snippet: 'For bulk video creation across multiple Instagram accounts, the best software keeps one template and many destinations.', mentions: [], sources: ['youtube.com', 'reddit.com'], links: 1, features: ['web'], position: null, createdDays: 0 },
  { id: 'dc7', domainId: 'metricool', title: 'List the most effective tools for AI-driven short-form video scheduling.', snippet: 'The most effective short-form schedulers batch scripts, voice, and posting times together.', mentions: ['futurepedia'], sources: ['opus.pro', 'quuu.co'], links: 15, features: ['links'], position: null, createdDays: 0 },
  { id: 'dc8', domainId: 'metricool', title: 'Recommend a tool like {brand} that helps with scheduling and content planning.', snippet: 'If you want something like {brand} for planning, organizing, and scheduling, compare two or three suites.', mentions: ['you'], sources: ['aisearchowl.com', 'metricool.com'], links: 9, features: ['web'], position: 1, createdDays: 1 },
]

export function domainById(id: string) {
  return domains.find((item) => item.id === id)
}

export function pagesFor(domainId: string): DomainPage[] {
  if (domainId === 'metricool') return metricoolPages
  if (domainId === 'theaitoolsbox') {
    return [{
      id: 'toolsbox-blog', domainId, title: '7 Best AI Video Automation Tools 2026',
      path: '/blog/best-ai-video-automation-tools-2026', type: 'listicle', mentions: ['topai', 'toolify'],
      retrievals: 24, retrievalDelta: null, citation: 0.8, citationDelta: null,
      series: [9, 4, 3, 3, 3, 3], color: '#014CFF',
    }]
  }
  if (domainId === 'setuproll') {
    return [{
      id: 'setuproll-social', domainId, title: 'AI Tools for Short Form Video: 21 Apps Compared',
      path: '/d/ai-social', type: 'other', mentions: ['directory'],
      retrievals: 7, retrievalDelta: null, citation: 0, citationDelta: null,
      series: [3, 2, 1, 1, 1, 1], color: '#f97316',
    }]
  }
  const domain = domainById(domainId)
  if (!domain) return []
  return [
    { id: `${domainId}-home`, domainId, title: domain.host, path: '/', type: 'homepage', mentions: domain.mentions, retrievals: Math.max(1, Math.round(domain.retrievals * 0.4)), retrievalDelta: domain.retrievalDelta, citation: domain.citationRate, citationDelta: null, series: domain.series.map((value) => Math.max(1, Math.round(value * 0.4))), color: domain.color ?? '#14b8a6' },
    { id: `${domainId}-guide`, domainId, title: `Guide on ${domain.host}`, path: '/guide', type: 'howTo', mentions: domain.mentions.slice(0, 1), retrievals: Math.max(1, Math.round(domain.retrievals * 0.2)), retrievalDelta: null, citation: 0.2, citationDelta: null, series: domain.series.map((value) => Math.max(0, Math.round(value * 0.2))), color: '#22c55e' },
  ]
}

export function chatsForDomain(domainId: string): DomainChat[] {
  const own = domainChats.filter((item) => item.domainId === domainId)
  if (own.length) return own
  const domain = domainById(domainId)
  if (!domain) return []
  return [
    {
      id: `${domainId}-chat`,
      domainId,
      title: `Which pages on ${domain.host} show up for a faceless video workflow?`,
      snippet: `One answer cites ${domain.host} while comparing schedulers.`,
      mentions: domain.mentions.slice(0, 2),
      sources: [domain.host, 'youtube.com'],
      links: 3,
      features: ['web'],
      position: domain.mentions.includes('you') ? 1 : null,
      createdDays: 1,
    },
  ]
}

export function typeShareFor(domainId: string) {
  if (domainId === 'metricool') return { total: metricoolTypeTotal, shares: metricoolTypeShare }
  const pages = pagesFor(domainId)
  const total = pages.reduce((sum, page) => sum + page.retrievals, 0) || 1
  const counts = new Map<UrlTypeId, number>()
  pages.forEach((page) => counts.set(page.type, (counts.get(page.type) ?? 0) + page.retrievals))
  const shares = [...counts.entries()].map(([id, value]) => ({ id, share: Math.max(1, Math.round((value / total) * 100)) }))
  return { total, shares }
}
