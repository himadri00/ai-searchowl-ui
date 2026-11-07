export type MetricKey = 'visibility' | 'sov' | 'sentiment' | 'position' | 'source' | 'winRate'
export type DimensionKey = 'models' | 'brands' | 'topics' | 'tags' | 'countries'
export type RangeKey = 'all' | '7d' | '30d' | '90d'
export type WorkspaceMode = 'solo' | 'agency'
export type ModelId = 'chatgpt' | 'perplexity' | 'gemini' | 'claude' | 'aioverview' | 'aimode' | 'copilot'
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
  sourceUrls?: CitationSource[]
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
  verdict?: ResultVerdict
  explanation?: ResultExplanation
}

export type CitationSource = {
  id: string
  url: string
  host: string
  path: string
  title?: string | null
  citationIndex?: number | null
  sourceUrlId?: string | null
  isTrackedBrand: boolean
  citedInline?: boolean
  snippet?: string | null
}

export type ResultVerdict = {
  state: 'recommended' | 'mentioned' | 'cited' | 'missing'
  trackedBrandId: string
  trackedBrandPosition: number | null
  winnerBrandId: string | null
  winnerBrandName: string | null
  winnerPosition: number | null
}

export type EvidenceReference = {
  type: 'chat' | 'prompt_run_result' | 'source_url' | 'brand_position' | 'site_audit' | 'fact_check'
  id: string
  label: string
  href?: string | null
  details: Record<string, unknown>
  observedAt?: string | null
}

export type ResultExplanation = {
  status: 'observed' | 'inferred' | 'unknown'
  summary: string
  evidence: EvidenceReference[]
  causalClaim?: boolean
}

export type ActionStatus = 'todo' | 'in_progress' | 'done' | 'dismissed'
export type ActionPriority = 'critical' | 'high' | 'medium' | 'low'
export type ActionGroup = 'site_readability' | 'owned_pages' | 'external_mentions' | 'incorrect_claims'

export type OutcomeSnapshot = {
  runId: string
  resultId: string
  observedAt: string
  visibility: number | null
  cited: boolean | null
  position: number | null
  winnerBrandId: string | null
  mentioned?: boolean | null
  mentionRate?: number | null
  citationRate?: number | null
  modelsObserved?: string[]
  checksObserved?: string[]
}

export type ActionOutcome = {
  status: 'waiting_for_run' | 'insufficient_data' | 'improved' | 'no_change' | 'declined'
  baseline: OutcomeSnapshot | null
  latest: OutcomeSnapshot | null
  runsObserved: number
  firstEvaluatedAt: string | null
  lastEvaluatedAt: string | null
  summary: string
}

export type ActionItem = {
  id: string
  group: ActionGroup
  source: 'automatic' | 'manual'
  ruleKey: string
  title: string
  description: string
  priority: ActionPriority
  confidence: number
  status: ActionStatus
  recommendedChange: string
  rationale: string
  target: {
    type: 'existing_url' | 'new_page' | 'external_source' | 'technical'
    sourceUrlId?: string | null
    url?: string | null
  }
  trigger: {
    promptId?: string | null
    promptText: string
    model: string
    chatId?: string | null
    runResultId?: string | null
    observedAt?: string | null
  }
  evidence: EvidenceReference[]
  impact?: {
    kind: 'prompt_visibility_summary'
    affectedModels: string[]
    allModels: string[]
    missingModels: string[]
    uncitedModels: string[]
    affectedResults: number
    totalResults: number
    topCompetitors: Array<{ name: string; answers: number }>
    topSources: Array<{ domain: string; answers: number; url?: string | null }>
    pageMatch: {
      type?: 'existing_url' | 'new_page'
      url?: string | null
      pageTitle?: string | null
      matchedConcepts?: string[]
      missingConcepts?: string[]
      contentChecked?: boolean
    }
  } | null
  evidenceMessage?: string
  createdAt: string
  updatedAt: string
  completedAt?: string | null
  outcome: ActionOutcome | null
}

export type ActionPlanGroup = {
  id: 'read' | 'pages' | 'mentions' | 'claims'
  total: number
  tasks: ActionItem[]
}

export const metricOrder: MetricKey[] = ['visibility', 'sov', 'sentiment', 'position', 'source', 'winRate']

export const dimensionOrder: DimensionKey[] = ['models', 'brands', 'topics', 'tags', 'countries']

export const dimensionMembers: Record<Exclude<DimensionKey, 'brands'>, string[]> = {
  models: ['chatgpt', 'perplexity', 'gemini', 'aioverview', 'claude'],
  topics: ['video', 'planning', 'scheduling'],
  tags: ['branded', 'nonBranded', 'informational', 'commercial', 'transactional'],
  countries: ['us', 'uk', 'de', 'fr', 'in'],
}

export const widgetIds = ['hero', 'visibility', 'impact', 'plan', 'matrix', 'domains', 'chats'] as const
export type WidgetId = (typeof widgetIds)[number]

export type NavChild = { href: string; key: string; icon: string; dot?: boolean }
export type NavItem = { href?: string; key: string; icon: string; children?: NavChild[] }

export const navigation: NavItem[] = [
  { href: '/overview', key: 'navHome', icon: 'home' },
  {
    key: 'navImprove',
    icon: 'actions',
    children: [
      { href: '/prompts/gap', key: 'navGap', icon: 'gap' },
      { href: '/actions', key: 'navActions', icon: 'actions' },
    ],
  },
  {
    key: 'navMonitor',
    icon: 'brand',
    children: [
      { href: '/brand/insights', key: 'navInsights', icon: 'insights' },
      { href: '/brand/perception', key: 'navPerception', icon: 'perception' },
      { href: '/prompts', key: 'navAllPrompts', icon: 'allPrompts' },
      { href: '/prompts/discovery', key: 'navDiscovery', icon: 'discovery', dot: true },
    ],
  },
  {
    key: 'navEvidence',
    icon: 'sources',
    children: [
      { href: '/prompts/domains', key: 'navPromptDomains', icon: 'promptDomains' },
      { href: '/prompts/urls', key: 'navUrls', icon: 'urls' },
    ],
  },
]
