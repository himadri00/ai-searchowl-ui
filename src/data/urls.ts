export const urlDates = ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17']

export const urlTypes = ['listicle', 'howTo', 'other', 'product', 'homepage', 'comparison', 'article', 'discussion', 'category', 'profile', 'alternative'] as const
export type UrlTypeId = (typeof urlTypes)[number]

export const domainKinds = ['corporate', 'editorial', 'institutional', 'other', 'reference', 'ugc', 'competitor', 'you'] as const
export type DomainKind = (typeof domainKinds)[number]

export const moverTabs = ['top', 'new', 'trending', 'losing'] as const
export type MoverTab = (typeof moverTabs)[number]

export type MentionId = 'you' | 'hunt' | 'directory' | 'futurepedia' | 'futuretools' | 'taaft' | 'toolify' | 'topai'

export type SourceUrl = {
  id: string
  title: string
  host: string
  path: string
  type: UrlTypeId
  tags: string[]
  domainType: DomainKind
  mentions: MentionId[]
  retrievals: number
  retrievalDelta: number | null
  citation: number
  citationDelta: number | null
  gapScore: number
  totalCitations: number
  citationShare: number
  updatedDays: number
  firstSeenDays: number
  lastSeenDays: number
  updatedHours: number | null
  models: { id: 'chatgpt' | 'perplexity' | 'aioverview'; current: number; previous: number }[]
  series: number[]
  previous: number[]
  topics: string[]
  promptTags: string[]
  movers: MoverTab[]
  chart?: boolean
  color?: string
}

export type LiveSourceUrl = Omit<SourceUrl, 'updatedDays' | 'firstSeenDays' | 'lastSeenDays' | 'models'> & {
  updatedDays: number | null
  firstSeenDays: number | null
  lastSeenDays: number | null
  models: { id: string; current: number; previous: number }[]
  modelCounts: boolean
}

type ApiSourceUrl = Partial<SourceUrl> & {
  urlType?: string | null
  cited?: number | null
  citedDelta?: number | null
  models?: Array<string | { id?: string; current?: number; previous?: number }>
}

export function normalizeSourceUrl(row: ApiSourceUrl): LiveSourceUrl {
  const rawType = row.type || row.urlType || 'other'
  const type = (urlTypes as readonly string[]).includes(rawType) ? (rawType as UrlTypeId) : 'other'
  const rawDomain = row.domainType ?? 'other'
  const domainType = (domainKinds as readonly string[]).includes(rawDomain) ? (rawDomain as DomainKind) : 'other'
  const rawModels = row.models ?? []
  const modelCounts = rawModels.some((model) => typeof model === 'object' && model != null && typeof model.current === 'number')
  const models = rawModels.flatMap((model) => {
    if (typeof model === 'string' && model) return [{ id: model, current: 0, previous: 0 }]
    if (model && typeof model === 'object' && model.id) {
      return [{ id: model.id, current: model.current ?? 0, previous: model.previous ?? 0 }]
    }
    return []
  })
  return {
    id: row.id ?? '',
    title: row.title ?? '',
    host: row.host ?? '',
    path: row.path || '/',
    type,
    tags: row.tags ?? [],
    domainType,
    mentions: row.mentions ?? [],
    retrievals: row.retrievals ?? 0,
    retrievalDelta: row.retrievalDelta ?? null,
    citation: row.citation ?? row.cited ?? 0,
    citationDelta: row.citationDelta ?? row.citedDelta ?? null,
    gapScore: row.gapScore ?? 0,
    totalCitations: row.totalCitations ?? 0,
    citationShare: row.citationShare ?? 0,
    updatedDays: row.updatedDays ?? null,
    firstSeenDays: row.firstSeenDays ?? null,
    lastSeenDays: row.lastSeenDays ?? null,
    updatedHours: row.updatedHours ?? null,
    models,
    modelCounts,
    series: row.series ?? [],
    previous: row.previous ?? [],
    topics: row.topics ?? [],
    promptTags: row.promptTags ?? [],
    movers: row.movers ?? [],
    chart: row.chart,
    color: row.color,
  }
}

export type UrlPrompt = {
  id: string
  urlId: string
  text: string
  topic: 'video' | 'planning' | 'scheduling'
  retrieved: number
  citation: number
}

export type UrlChat = {
  id: string
  urlId: string
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
  models: string[]
}

export const typeColors: Record<UrlTypeId, string> = {
  listicle: '#014CFF',
  howTo: '#0d9488',
  other: '#71717a',
  product: '#16a34a',
  homepage: '#f97316',
  comparison: '#3b82f6',
  article: '#22c55e',
  discussion: '#06b6d4',
  category: '#fb923c',
  profile: '#a855f7',
  alternative: '#ec4899',
}

export const domainColors: Record<DomainKind, string> = {
  corporate: '#f97316',
  editorial: '#a3e635',
  institutional: '#84cc16',
  other: '#a1a1aa',
  reference: '#c084fc',
  ugc: '#f472b6',
  competitor: '#f87171',
  you: '#60a5fa',
}

export const typeShare: { id: UrlTypeId; share: number }[] = [
  { id: 'listicle', share: 28 },
  { id: 'howTo', share: 19 },
  { id: 'other', share: 13 },
  { id: 'product', share: 13 },
  { id: 'homepage', share: 12 },
  { id: 'comparison', share: 8 },
  { id: 'article', share: 4 },
  { id: 'discussion', share: 2 },
]

export const totalRetrievals = 12000

const day = (values: number[]): number[] => values

export const sourceUrls: SourceUrl[] = [
  {
    id: 'home',
    title: 'AiSearchOwl',
    host: 'aisearchowl.com',
    path: '/',
    type: 'homepage',
    tags: [],
    domainType: 'you',
    mentions: ['you'],
    retrievals: 126,
    retrievalDelta: 18,
    citation: 1.2,
    citationDelta: 0.2,
    gapScore: 12,
    totalCitations: 40,
    citationShare: 18,
    updatedDays: 1,
    firstSeenDays: 40,
    lastSeenDays: 0,
    updatedHours: 6,
    models: [
      { id: 'chatgpt', current: 40, previous: 30 },
      { id: 'perplexity', current: 70, previous: 50 },
      { id: 'aioverview', current: 16, previous: 8 },
    ],
    series: day([44, 28, 18, 16, 16, 18]),
    previous: day([30, 22, 14, 12, 12, 14]),
    topics: ['video'],
    promptTags: ['commercial', 'faceless'],
    movers: ['top', 'trending'],
    chart: true,
    color: '#14b8a6',
  },
  {
    id: 'compare-auto',
    title: 'AiSearchOwl vs Autoshorts',
    host: 'aisearchowl.com',
    path: '/compare/aisearchowl-vs-autoshorts-ai',
    type: 'comparison',
    tags: [],
    domainType: 'you',
    mentions: ['you'],
    retrievals: 66,
    retrievalDelta: 9,
    citation: 0.8,
    citationDelta: 0.1,
    gapScore: 20,
    totalCitations: 18,
    citationShare: 9,
    updatedDays: 2,
    firstSeenDays: 21,
    lastSeenDays: 0,
    updatedHours: null,
    models: [
      { id: 'chatgpt', current: 20, previous: 12 },
      { id: 'perplexity', current: 40, previous: 28 },
      { id: 'aioverview', current: 6, previous: 2 },
    ],
    series: day([24, 16, 10, 9, 10, 9]),
    previous: day([16, 12, 8, 7, 7, 7]),
    topics: ['video'],
    promptTags: ['commercial'],
    movers: ['top', 'new'],
    chart: true,
    color: '#a855f7',
  },
  {
    id: 'faceless',
    title: 'Faceless.so',
    host: 'faceless.so',
    path: '/',
    type: 'homepage',
    tags: [],
    domainType: 'competitor',
    mentions: ['hunt'],
    retrievals: 54,
    retrievalDelta: -4,
    citation: 0.4,
    citationDelta: -0.1,
    gapScore: 64,
    totalCitations: 11,
    citationShare: 6,
    updatedDays: 3,
    firstSeenDays: 30,
    lastSeenDays: 1,
    updatedHours: null,
    models: [
      { id: 'perplexity', current: 36, previous: 30 },
      { id: 'aioverview', current: 8, previous: 6 },
    ],
    series: day([22, 14, 9, 8, 9, 8]),
    previous: day([18, 12, 8, 7, 7, 7]),
    topics: ['video'],
    promptTags: ['nonBranded', 'faceless'],
    movers: ['top', 'losing'],
    chart: true,
    color: '#7c3aed',
  },
  {
    id: 'gen',
    title: 'Nuwton gen',
    host: 'nuwtongen.com',
    path: '/',
    type: 'product',
    tags: [],
    domainType: 'you',
    mentions: ['you'],
    retrievals: 51,
    retrievalDelta: 3,
    citation: 0.6,
    citationDelta: null,
    gapScore: 15,
    totalCitations: 9,
    citationShare: 5,
    updatedDays: 4,
    firstSeenDays: 18,
    lastSeenDays: 0,
    updatedHours: null,
    models: [
      { id: 'chatgpt', current: 22, previous: 18 },
      { id: 'perplexity', current: 24, previous: 20 },
    ],
    series: day([18, 12, 7, 6, 8, 7]),
    previous: day([14, 10, 6, 5, 6, 6]),
    topics: ['planning'],
    promptTags: ['informational'],
    movers: ['top', 'trending'],
    chart: true,
    color: '#eab308',
  },
  {
    id: 'compare',
    title: 'AiSearchOwl comparisons',
    host: 'aisearchowl.com',
    path: '/compare',
    type: 'comparison',
    tags: [],
    domainType: 'you',
    mentions: ['you'],
    retrievals: 47,
    retrievalDelta: 2,
    citation: 0.5,
    citationDelta: null,
    gapScore: 10,
    totalCitations: 8,
    citationShare: 4,
    updatedDays: 5,
    firstSeenDays: 25,
    lastSeenDays: 0,
    updatedHours: null,
    models: [{ id: 'perplexity', current: 30, previous: 22 }, { id: 'aioverview', current: 8, previous: 4 }],
    series: day([16, 11, 6, 5, 7, 6]),
    previous: day([12, 9, 5, 4, 5, 5]),
    topics: ['video'],
    promptTags: ['commercial'],
    movers: ['top'],
    chart: true,
    color: '#a1a1aa',
  },
  {
    id: 'autoshorts',
    title: 'Autoshorts',
    host: 'autoshorts.ai',
    path: '/',
    type: 'homepage',
    tags: [],
    domainType: 'competitor',
    mentions: ['toolify'],
    retrievals: 40,
    retrievalDelta: -6,
    citation: 0.3,
    citationDelta: -0.2,
    gapScore: 70,
    totalCitations: 6,
    citationShare: 3,
    updatedDays: 6,
    firstSeenDays: 16,
    lastSeenDays: 1,
    updatedHours: null,
    models: [{ id: 'chatgpt', current: 14, previous: 16 }, { id: 'perplexity', current: 20, previous: 22 }],
    series: day([14, 10, 6, 5, 5, 4]),
    previous: day([16, 12, 8, 7, 6, 6]),
    topics: ['video'],
    promptTags: ['commercial', 'agency'],
    movers: ['top', 'losing'],
  },
  {
    id: 'compare-shorts',
    title: 'AiSearchOwl vs short-form tools',
    host: 'aisearchowl.com',
    path: '/compare/aisearchowl-vs-shortsfaceless',
    type: 'comparison',
    tags: [],
    domainType: 'you',
    mentions: ['you'],
    retrievals: 38,
    retrievalDelta: 4,
    citation: 0.4,
    citationDelta: 0.1,
    gapScore: 18,
    totalCitations: 5,
    citationShare: 2,
    updatedDays: 2,
    firstSeenDays: 12,
    lastSeenDays: 0,
    updatedHours: null,
    models: [{ id: 'perplexity', current: 28, previous: 20 }],
    series: day([12, 9, 6, 5, 6, 5]),
    previous: day([8, 7, 5, 4, 4, 4]),
    topics: ['video'],
    promptTags: ['faceless'],
    movers: ['new', 'trending'],
  },
  {
    id: 'compare-virvid',
    title: 'AiSearchOwl vs Virvid',
    host: 'aisearchowl.com',
    path: '/compare/aisearchowl-vs-virvid',
    type: 'comparison',
    tags: [],
    domainType: 'you',
    mentions: ['you'],
    retrievals: 38,
    retrievalDelta: 1,
    citation: 0.3,
    citationDelta: null,
    gapScore: 22,
    totalCitations: 4,
    citationShare: 2,
    updatedDays: 3,
    firstSeenDays: 11,
    lastSeenDays: 0,
    updatedHours: null,
    models: [{ id: 'aioverview', current: 10, previous: 6 }, { id: 'perplexity', current: 18, previous: 14 }],
    series: day([11, 8, 5, 5, 5, 5]),
    previous: day([9, 7, 5, 4, 4, 4]),
    topics: ['planning'],
    promptTags: ['informational'],
    movers: ['new'],
  },
  {
    id: 'metricool',
    title: 'Faceless YouTube Channel Guide | Metricool',
    host: 'metricool.com',
    path: '/faceless-youtube-channel',
    type: 'howTo',
    tags: [],
    domainType: 'corporate',
    mentions: ['hunt', 'directory', 'topai'],
    retrievals: 22,
    retrievalDelta: 22,
    citation: 0.5,
    citationDelta: 0.5,
    gapScore: 48,
    totalCitations: 6,
    citationShare: 3,
    updatedDays: 0,
    firstSeenDays: 5,
    lastSeenDays: 0,
    updatedHours: 11,
    models: [
      { id: 'perplexity', current: 21, previous: 0 },
      { id: 'aioverview', current: 1, previous: 0 },
    ],
    series: day([7, 4, 3, 3, 3, 3]),
    previous: day([3, 3, 3, 3, 3, 3]),
    topics: ['video', 'scheduling'],
    promptTags: ['commercial', 'faceless', 'informational'],
    movers: [],
  },
  {
    id: 'quuu',
    title: 'Multi-platform video scheduling - Quuu Blog',
    host: 'quuu.co',
    path: '/blog/multi-platform-video-scheduling',
    type: 'listicle',
    tags: [],
    domainType: 'corporate',
    mentions: ['directory', 'futurepedia'],
    retrievals: 13,
    retrievalDelta: null,
    citation: 0.5,
    citationDelta: null,
    gapScore: 36,
    totalCitations: 3,
    citationShare: 2,
    updatedDays: 4,
    firstSeenDays: 9,
    lastSeenDays: 1,
    updatedHours: null,
    models: [{ id: 'chatgpt', current: 5, previous: 4 }, { id: 'perplexity', current: 8, previous: 6 }],
    series: day([4, 3, 2, 2, 2, 2]),
    previous: day([3, 2, 2, 2, 2, 1]),
    topics: ['scheduling'],
    promptTags: ['commercial', 'manager'],
    movers: [],
  },
  {
    id: 'virvid',
    title: 'AI B-roll & Visuals Generator: 3 Best Tools to Use',
    host: 'virvid.ai',
    path: '/blog/ai-visual-generator-for-shorts',
    type: 'listicle',
    tags: [],
    domainType: 'corporate',
    mentions: ['futuretools', 'toolify'],
    retrievals: 11,
    retrievalDelta: null,
    citation: 0,
    citationDelta: null,
    gapScore: 55,
    totalCitations: 1,
    citationShare: 1,
    updatedDays: 6,
    firstSeenDays: 14,
    lastSeenDays: 2,
    updatedHours: null,
    models: [{ id: 'perplexity', current: 9, previous: 7 }, { id: 'aioverview', current: 2, previous: 1 }],
    series: day([3, 2, 2, 2, 1, 1]),
    previous: day([2, 2, 1, 1, 1, 1]),
    topics: ['video'],
    promptTags: ['informational', 'hobbyist'],
    movers: [],
  },
  {
    id: 'overseeros',
    title: 'Best AI Tools for Faceless YouTube Channels',
    host: 'overseeros.com',
    path: '/blog/ai-tools-for-faceless-youtube',
    type: 'listicle',
    tags: [],
    domainType: 'editorial',
    mentions: ['taaft', 'topai'],
    retrievals: 7,
    retrievalDelta: 1,
    citation: 0.1,
    citationDelta: null,
    gapScore: 40,
    totalCitations: 1,
    citationShare: 1,
    updatedDays: 8,
    firstSeenDays: 20,
    lastSeenDays: 2,
    updatedHours: null,
    models: [{ id: 'chatgpt', current: 4, previous: 3 }, { id: 'perplexity', current: 3, previous: 2 }],
    series: day([2, 2, 1, 1, 1, 1]),
    previous: day([1, 1, 1, 1, 1, 1]),
    topics: ['video'],
    promptTags: ['commercial', 'creator'],
    movers: [],
  },
  {
    id: 'quuu-blog',
    title: 'Multi-platform video scheduling - Quuu Blog',
    host: 'blog.quuu.co',
    path: '/multi-platform-video-scheduling',
    type: 'listicle',
    tags: [],
    domainType: 'corporate',
    mentions: ['directory'],
    retrievals: 5,
    retrievalDelta: null,
    citation: 0.8,
    citationDelta: null,
    gapScore: 28,
    totalCitations: 2,
    citationShare: 1,
    updatedDays: 3,
    firstSeenDays: 7,
    lastSeenDays: 1,
    updatedHours: null,
    models: [{ id: 'chatgpt', current: 5, previous: 4 }],
    series: day([2, 1, 1, 1, 1, 1]),
    previous: day([1, 1, 1, 1, 1, 1]),
    topics: ['scheduling'],
    promptTags: ['transactional'],
    movers: [],
  },
  {
    id: 'opus',
    title: 'How to Make AI Faceless YouTube Videos for Fun',
    host: 'opus.pro',
    path: '/blog/how-to-make-ai-faceless-youtube',
    type: 'howTo',
    tags: [],
    domainType: 'corporate',
    mentions: ['hunt', 'futurepedia', 'you'],
    retrievals: 5,
    retrievalDelta: null,
    citation: 0.4,
    citationDelta: null,
    gapScore: 8,
    totalCitations: 2,
    citationShare: 1,
    updatedDays: 2,
    firstSeenDays: 6,
    lastSeenDays: 0,
    updatedHours: null,
    models: [{ id: 'perplexity', current: 4, previous: 2 }, { id: 'aioverview', current: 1, previous: 0 }],
    series: day([2, 1, 1, 1, 1, 1]),
    previous: day([1, 1, 1, 1, 0, 0]),
    topics: ['video'],
    promptTags: ['informational', 'hobbyist'],
    movers: [],
  },
  {
    id: 'vidmachine',
    title: 'Top AI tools for faceless YouTube',
    host: 'vidmachine.ai',
    path: '/blog/top-ai-tools-faceless-youtube',
    type: 'listicle',
    tags: [],
    domainType: 'corporate',
    mentions: ['toolify'],
    retrievals: 4,
    retrievalDelta: null,
    citation: 0,
    citationDelta: null,
    gapScore: 44,
    totalCitations: 0,
    citationShare: 0,
    updatedDays: 10,
    firstSeenDays: 15,
    lastSeenDays: 3,
    updatedHours: null,
    models: [{ id: 'chatgpt', current: 4, previous: 3 }],
    series: day([1, 1, 1, 1, 0, 0]),
    previous: day([1, 1, 1, 0, 0, 0]),
    topics: ['video'],
    promptTags: ['commercial'],
    movers: [],
  },
  {
    id: 'frameo',
    title: '9 Best AI Video Generator Tools in 2026',
    host: 'frameo.ai',
    path: '/blog/best-ai-video-content-tools',
    type: 'listicle',
    tags: [],
    domainType: 'editorial',
    mentions: ['taaft', 'topai', 'futuretools'],
    retrievals: 3,
    retrievalDelta: null,
    citation: 0.2,
    citationDelta: null,
    gapScore: 33,
    totalCitations: 1,
    citationShare: 1,
    updatedDays: 5,
    firstSeenDays: 8,
    lastSeenDays: 1,
    updatedHours: null,
    models: [{ id: 'perplexity', current: 3, previous: 1 }],
    series: day([1, 1, 1, 0, 0, 0]),
    previous: day([1, 0, 0, 0, 0, 0]),
    topics: ['planning'],
    promptTags: ['commercial', 'agency'],
    movers: [],
  },
  {
    id: 'mark',
    title: 'The Best AI Tools to Automate Your Video Marketing',
    host: 'videomark.example',
    path: '/best-ai-tools-video-marketing',
    type: 'listicle',
    tags: [],
    domainType: 'corporate',
    mentions: ['directory'],
    retrievals: 3,
    retrievalDelta: null,
    citation: 0.3,
    citationDelta: null,
    gapScore: 30,
    totalCitations: 1,
    citationShare: 1,
    updatedDays: 7,
    firstSeenDays: 13,
    lastSeenDays: 2,
    updatedHours: null,
    models: [{ id: 'chatgpt', current: 2, previous: 1 }, { id: 'aioverview', current: 1, previous: 0 }],
    series: day([1, 1, 0, 0, 1, 0]),
    previous: day([1, 0, 0, 0, 0, 0]),
    topics: ['planning'],
    promptTags: ['transactional', 'manager'],
    movers: [],
  },
  {
    id: 'owned-guide',
    title: 'Plan a week of faceless videos',
    host: 'aisearchowl.com',
    path: '/guides/faceless-week',
    type: 'howTo',
    tags: [],
    domainType: 'you',
    mentions: ['you'],
    retrievals: 2,
    retrievalDelta: 2,
    citation: 1,
    citationDelta: 1,
    gapScore: 0,
    totalCitations: 2,
    citationShare: 1,
    updatedDays: 1,
    firstSeenDays: 4,
    lastSeenDays: 0,
    updatedHours: 20,
    models: [{ id: 'chatgpt', current: 2, previous: 0 }],
    series: day([0, 0, 1, 1, 0, 0]),
    previous: day([0, 0, 0, 0, 0, 0]),
    topics: ['planning'],
    promptTags: ['informational', 'creator'],
    movers: ['new'],
  },
]

export const urlPrompts: UrlPrompt[] = [
  { id: 'p1', urlId: 'metricool', text: 'What are the main advantages of using {brand} compared to manually editing clips for my faceless YouTube channel?', topic: 'video', retrieved: 8, citation: 0.3 },
  { id: 'p2', urlId: 'metricool', text: 'Looking for a tool to streamline my faceless channel workflow.', topic: 'video', retrieved: 8, citation: 0.8 },
  { id: 'p3', urlId: 'metricool', text: 'What are the best platforms for automating faceless YouTube channel production?', topic: 'video', retrieved: 5, citation: 0.6 },
  { id: 'p4', urlId: 'metricool', text: 'What are the best ways to plan content for a faceless brand on YouTube?', topic: 'scheduling', retrieved: 1, citation: 1 },
]

export const urlChats: UrlChat[] = [
  {
    id: 'c1',
    urlId: 'metricool',
    title: 'What are the best platforms for automating faceless YouTube channel production?',
    snippet: 'The best setup depends on your format: one tool for hands-off posting, another when you still want to approve each clip.',
    mentions: ['hunt', 'directory', 'futurepedia', 'futuretools', 'taaft', 'toolify'],
    sources: ['youtube.com', 'aisearchowl.com'],
    links: 5,
    features: ['web', 'links'],
    position: null,
    createdDays: 0,
    models: ['perplexity'],
  },
  {
    id: 'c2',
    urlId: 'metricool',
    title: 'What are the main advantages of using {brand} compared to manually editing clips?',
    snippet: 'If by “{brand}” you mean an AI tool for making YouTube Shorts, its main advantage is speed.',
    mentions: ['you'],
    sources: ['aisearchowl.com'],
    links: 5,
    features: ['web'],
    position: 1,
    createdDays: 0,
    models: ['chatgpt'],
  },
  {
    id: 'c3',
    urlId: 'metricool',
    title: 'Looking for a tool to streamline my faceless channel workflow.',
    snippet: 'For an all-in-one option, try a studio that assembles narration, animation, and posting in one queue.',
    mentions: ['toolify', 'topai'],
    sources: ['faceless.so', 'opus.pro'],
    links: 6,
    features: ['links'],
    position: null,
    createdDays: 0,
    models: ['perplexity'],
  },
  {
    id: 'c4',
    urlId: 'metricool',
    title: 'Looking for a tool to streamline my faceless channel workflow.',
    snippet: 'For an all-in-one option, try a faceless video maker like Viblo, which combines scripts and upload times.',
    mentions: ['hunt'],
    sources: ['youtube.com', 'reddit.com'],
    links: 7,
    features: ['web', 'links'],
    position: null,
    createdDays: 1,
    models: ['aioverview'],
  },
  {
    id: 'c5',
    urlId: 'metricool',
    title: 'What are the main advantages of using {brand} compared to manually editing clips?',
    snippet: 'If by “{brand}” you mean an AI Shorts-making tool, its main advantage is speed: it can auto-cut a long recording.',
    mentions: ['you'],
    sources: ['aisearchowl.com'],
    links: 5,
    features: ['web'],
    position: 1,
    createdDays: 1,
    models: ['chatgpt'],
  },
  {
    id: 'c6',
    urlId: 'metricool',
    title: 'What are the best platforms for automating faceless YouTube channel production?',
    snippet: 'There isn’t one best platform for every workflow. For an all-in-one, largely hands-off setup, compare two or three tools.',
    mentions: [],
    sources: ['youtube.com', 'metricool.com'],
    links: 5,
    features: ['web', 'links'],
    position: null,
    createdDays: 1,
    models: ['perplexity'],
  },
  {
    id: 'c7',
    urlId: 'metricool',
    title: 'What are the best platforms for automating faceless YouTube channel production?',
    snippet: 'For an efficient faceless-channel workflow, use ChatGPT or Claude for scripts, ElevenLabs for voice, and a scheduler for posting.',
    mentions: [],
    sources: ['google.com', 'nuwtongen.com'],
    links: 4,
    features: ['links'],
    position: null,
    createdDays: 1,
    models: ['chatgpt'],
  },
  {
    id: 'c8',
    urlId: 'metricool',
    title: 'Looking for a tool to streamline my faceless channel workflow.',
    snippet: 'For an all-in-one option, try Metricool: it can schedule uploads, cross-post Shorts, and keep a content calendar.',
    mentions: ['topai'],
    sources: ['metricool.com', 'storyflow.so'],
    links: 5,
    features: ['web'],
    position: null,
    createdDays: 2,
    models: ['perplexity'],
  },
]

export const socialPlatforms = [
  { id: 'youtube', host: 'youtube.com', channels: 288 },
  { id: 'reddit', host: 'reddit.com', channels: 29 },
  { id: 'facebook', host: 'facebook.com', channels: 23 },
  { id: 'linkedin', host: 'linkedin.com', channels: 15 },
  { id: 'instagram', host: 'instagram.com', channels: 12 },
  { id: 'tiktok', host: 'tiktok.com', channels: 4 },
  { id: 'medium', host: 'medium.com', channels: 9 },
  { id: 'quora', host: 'quora.com', channels: 1 },
] as const

export type SocialTab = 'top' | 'trending' | 'losing'

export const socialHandles: { platform: (typeof socialPlatforms)[number]['id']; handle: string; retrievals: number; tab: SocialTab }[] = [
  { platform: 'youtube', handle: '@vilsoftwarereviews', retrievals: 97, tab: 'top' },
  { platform: 'youtube', handle: '@SuccessWithSam', retrievals: 25, tab: 'top' },
  { platform: 'facebook', handle: '@theaigarage', retrievals: 18, tab: 'top' },
  { platform: 'linkedin', handle: '@TomBlakeFinance', retrievals: 13, tab: 'top' },
  { platform: 'instagram', handle: '@jonathanacuna', retrievals: 12, tab: 'top' },
  { platform: 'tiktok', handle: '@heygen_official', retrievals: 12, tab: 'trending' },
  { platform: 'medium', handle: '@Yourivanhoffwegen', retrievals: 12, tab: 'top' },
  { platform: 'quora', handle: '@StartupWise', retrievals: 11, tab: 'losing' },
  { platform: 'reddit', handle: '@ELEVENPERCENT', retrievals: 9, tab: 'trending' },
  { platform: 'youtube', handle: '@iamAImaster', retrievals: 8, tab: 'losing' },
]

export const chatSources = ['youtube.com', 'aisearchowl.com', 'buffer.com', 'google.com', 'metricool.com', 'opus.pro', 'faceless.so', 'nuwtongen.com', 'reddit.com', 'storyflow.so', 'hootsuite.com']

export function promptsFor(urlId: string): UrlPrompt[] {
  const own = urlPrompts.filter((item) => item.urlId === urlId)
  if (own.length) return own
  const url = sourceUrls.find((item) => item.id === urlId)
  if (!url) return []
  return [
    { id: `${urlId}-a`, urlId, text: `Which pages explain ${url.host} for a faceless video workflow?`, topic: 'video', retrieved: Math.max(1, Math.round(url.retrievals / 5)), citation: url.citation },
    { id: `${urlId}-b`, urlId, text: 'Looking for a tool to streamline my faceless channel workflow.', topic: url.topics[0] === 'scheduling' ? 'scheduling' : 'planning', retrieved: 1, citation: 0.2 },
  ]
}

export function chatsFor(urlId: string): UrlChat[] {
  const own = urlChats.filter((item) => item.urlId === urlId)
  if (own.length) return own
  const url = sourceUrls.find((item) => item.id === urlId)
  if (!url) return []
  return [
    {
      id: `${urlId}-c`,
      urlId,
      title: 'What are the best platforms for automating faceless YouTube channel production?',
      snippet: `One answer cites ${url.host}${url.path === '/' ? '' : url.path} while comparing schedulers.`,
      mentions: url.mentions.slice(0, 2),
      sources: [url.host, 'youtube.com'],
      links: 3,
      features: ['web'],
      position: url.mentions.includes('you') ? 1 : null,
      createdDays: 1,
      models: url.models.map((item) => item.id),
    },
  ]
}

export const contentSnapshot = {
  kicker: 'Saved page snapshot',
  heading: 'How to start a faceless YouTube channel in 2026',
  lines: [
    'https://metricool.com/',
    'This preview stores a short snapshot. It is not a live copy of the page.',
    'A faceless channel can publish short videos on a schedule without the owner appearing on camera.',
    'Pick one topic, batch the scripts, and check which pages AI already cites before you add another tool.',
  ],
}
