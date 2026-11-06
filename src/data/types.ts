export type MetricKey = 'visibility' | 'sov' | 'sentiment' | 'position' | 'source' | 'winRate'
export type DimensionKey = 'models' | 'brands' | 'topics' | 'tags' | 'countries'
export type RangeKey = 'all' | '7d' | '30d' | '90d'
export type WorkspaceMode = 'solo' | 'agency'
export type ModelId = 'chatgpt' | 'perplexity' | 'gemini' | 'claude' | 'aioverview'
export type FeatureId = 'shopping' | 'web' | 'links'
export type DomainTab = 'top' | 'new' | 'trending' | 'losing'

export type MetricValue = {
  value: number
  delta?: number
  tone?: 'good' | 'bad'
}

export type SeriesPoint = {
  date: string
  visibility: number
  sov: number
  sentiment: number
  position: number
  source: number
  winRate: number
}

export type Competitor = {
  id: string
  name: string
  initials: string
  color: string
  visibility: number
  sov: number
  sentiment: number | null
  position: number | null
}

export type DomainRow = {
  host: string
  count: number
  you?: boolean
  tabs: DomainTab[]
}

export type Brand = {
  id: string
  name: string
  domain: string
  initials: string
  color: string
  metrics: Record<MetricKey, MetricValue>
  series: SeriesPoint[]
  competitors: Competitor[]
  domains: DomainRow[]
  domainTypes?: { id: string; share: number; color: string }[]
  retrievals: number
  matrixScale: number
}

export type ChatRecord = {
  id: string
  brandId: string | null
  models: ModelId[]
  features: FeatureId[]
  country: string
  tag: string
  sources: string[]
  links: number
  citations: number
  position: number | null
  positions?: Record<string, number> | null
  mentions?: string[]
  title?: string
  snippet?: string
  prompt?: string
  answer?: string
  createdAt?: string | null
}

export const metricOrder: MetricKey[] = ['visibility', 'sov', 'sentiment', 'position', 'source', 'winRate']

export const dimensionOrder: DimensionKey[] = ['models', 'brands', 'topics', 'tags', 'countries']

export const dimensionMembers: Record<Exclude<DimensionKey, 'brands'>, string[]> = {
  models: ['chatgpt', 'perplexity', 'gemini', 'aioverview', 'claude'],
  topics: ['video', 'planning', 'scheduling'],
  tags: ['branded', 'nonBranded', 'informational', 'commercial', 'transactional'],
  countries: ['us', 'uk', 'de', 'fr', 'in'],
}

export const widgetIds = ['hero', 'metrics', 'visibility', 'impact', 'plan', 'matrix', 'domains', 'chats'] as const
export type WidgetId = (typeof widgetIds)[number]

export type NavChild = { href: string; key: string; icon: string; dot?: boolean }
export type NavItem = { href?: string; key: string; icon: string; children?: NavChild[] }

export const navigation: NavItem[] = [
  { href: '/home', key: 'navHome', icon: 'home' },
  { href: '/home', key: 'overview', icon: 'custom' },
  { href: '/website', key: 'navWebsite', icon: 'website' },
  {
    key: 'navBrand',
    icon: 'brand',
    children: [
      { href: '/brand/insights', key: 'navInsights', icon: 'insights' },
      { href: '/brand/perception', key: 'navPerception', icon: 'perception' },
    ],
  },
  {
    key: 'navPrompts',
    icon: 'prompts',
    children: [
      { href: '/prompts', key: 'navAllPrompts', icon: 'allPrompts' },
      { href: '/prompts/discovery', key: 'navDiscovery', icon: 'discovery', dot: true },
    ],
  },
  {
    key: 'navSources',
    icon: 'sources',
    children: [
      { href: '/prompts/gap', key: 'navGap', icon: 'gap' },
      { href: '/prompts/domains', key: 'navPromptDomains', icon: 'promptDomains' },
      { href: '/prompts/urls', key: 'navUrls', icon: 'urls' },
    ],
  },
  { href: '/settings', key: 'navSettings', icon: 'settings' },
]
