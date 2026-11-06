export const promptLimit = 50

export type PromptStatus = 'active' | 'suggested' | 'archived' | 'discovery'
export type Branding = 'branded' | 'nonBranded'
export type Intent = 'informational' | 'commercial' | 'transactional'
export type Trend = -1 | 0 | 1

export type ColumnId =
  | 'visibility'
  | 'sov'
  | 'sentiment'
  | 'position'
  | 'mentions'
  | 'volume'
  | 'web'
  | 'branding'
  | 'intent'
  | 'facts'
  | 'tags'
  | 'location'
  | 'added'
  | 'winRate'

export type PromptItem = {
  id: string
  text: string
  topicId: string
  status: PromptStatus
  visibility: number | null
  sov: number | null
  sentiment: number | null
  position: number | null
  winRate: number | null
  web: number | null
  mentionIds: string[]
  volume: number[]
  branding: Branding | null
  intent: Intent | null
  tagIds: string[]
  location: string
  addedDays: number
  trend: Trend
  facts: boolean
}

export type Topic = { id: string; nameKey?: string; name?: string }

export type Competitor = { id: string; name: string; color: string; initials: string }

export const seedTopics: Topic[] = [
  { id: 'video', nameKey: 'topicVideo' },
  { id: 'planning', nameKey: 'topicPlanning' },
  { id: 'scheduling', nameKey: 'topicScheduling' },
]

export const competitors: Competitor[] = [
  { id: 'hunt', name: 'AI Tool Hunt', color: '#7c3aed', initials: 'AH' },
  { id: 'directory', name: 'AI Tools Directory', color: '#014CFF', initials: 'AD' },
  { id: 'futurepedia', name: 'Futurepedia', color: '#0d9488', initials: 'FP' },
  { id: 'futuretools', name: 'FutureTools', color: '#4f46e5', initials: 'FT' },
  { id: 'taaft', name: "There's An AI For That", color: '#db2777', initials: 'TA' },
  { id: 'toolify', name: 'Toolify', color: '#ea580c', initials: 'TL' },
  { id: 'topai', name: 'TopAI.tools', color: '#059669', initials: 'TP' },
]

export const promptModels = {
  active: [
    { id: 'chatgpt', label: 'ChatGPT', glyph: 'C', color: '#111827' },
    { id: 'perplexity', label: 'Perplexity', glyph: 'P', color: '#0f766e' },
    { id: 'aioverview', label: 'AI Overview', glyph: 'A', color: '#014CFF' },
  ],
  available: [
    { id: 'aimode', label: 'AI Mode', glyph: 'M', color: '#4f46e5' },
    { id: 'gemini', label: 'Gemini', glyph: 'G', color: '#7c3aed' },
    { id: 'copilot', label: 'Copilot', glyph: 'Co', color: '#0284c7' },
    { id: 'naver', label: 'Naver AI Briefing', glyph: 'N', color: '#16a34a' },
  ],
  locked: [
    { id: 'luna', label: 'OpenAI Luna', glyph: 'L', color: '#111827' },
    { id: 'qwen', label: 'Qwen API', glyph: 'Q', color: '#7c3aed' },
  ],
}

export const locations = [
  { id: 'us', flag: '🇺🇸' },
  { id: 'uk', flag: '🇬🇧' },
  { id: 'de', flag: '🇩🇪' },
  { id: 'fr', flag: '🇫🇷' },
  { id: 'in', flag: '🇮🇳' },
] as const

export const personaTags = ['agency', 'faceless', 'manager', 'creator', 'hobbyist'] as const
export const brandingTags = ['branded', 'nonBranded'] as const
export const intentTags = ['informational', 'commercial', 'transactional'] as const

export const defaultColumns: ColumnId[] = [
  'visibility',
  'sov',
  'sentiment',
  'position',
  'mentions',
  'volume',
  'web',
  'branding',
  'intent',
  'facts',
  'tags',
  'location',
  'added',
]

export const topicSummaries = {
  active: { visibility: 18, sentiment: 59 as number | null, position: 11 as number | null, web: 85 },
  archived: { visibility: 2, sentiment: null as number | null, position: null as number | null, web: 60 },
}

type Draft = {
  text: string
  topicId: string
  status: PromptStatus
  visibility?: number | null
  sov?: number | null
  sentiment?: number | null
  position?: number | null
  winRate?: number | null
  web?: number | null
  mentionIds?: string[]
  branding?: Branding | null
  intent?: Intent | null
  tagIds?: string[]
  location?: string
  addedDays?: number
  trend?: Trend
  facts?: boolean
}

const bars = (seed: number) => Array.from({ length: 8 }, (_, index) => 3 + ((seed * 5 + index * 7) % 13))

function item(id: string, draft: Draft): PromptItem {
  const visibility = draft.visibility === undefined ? 0 : draft.visibility
  return {
    id,
    text: draft.text,
    topicId: draft.topicId,
    status: draft.status,
    visibility,
    sov: draft.sov === undefined ? 0 : draft.sov,
    sentiment: draft.sentiment === undefined ? null : draft.sentiment,
    position: draft.position === undefined ? null : draft.position,
    winRate: draft.winRate === undefined ? (visibility && visibility > 0 ? Math.max(0, visibility - 8) : 0) : draft.winRate,
    web: draft.web === undefined ? 70 : draft.web,
    mentionIds: draft.mentionIds ?? [],
    volume: draft.status === 'suggested' || draft.status === 'discovery' ? [] : bars(id.length + draft.text.length),
    branding: draft.branding === undefined ? 'nonBranded' : draft.branding,
    intent: draft.intent === undefined ? 'commercial' : draft.intent,
    tagIds: draft.tagIds ?? [],
    location: draft.location ?? 'us',
    addedDays: draft.addedDays ?? 5,
    trend: draft.trend ?? 0,
    facts: draft.facts ?? false,
  }
}

const angles = [
  'scheduling daily short-form uploads',
  'keeping a 30-day content calendar full',
  'picking b-roll without a manual edit',
  'posting the same clip to several accounts',
  'writing hooks that hold viewers past three seconds',
  'turning one long recording into daily clips',
  'planning a week of faceless videos',
  'choosing music that fits short-form retention',
  'batching captions for Instagram and TikTok',
  'reviewing which clips actually earn follows',
  'replacing a freelance editor with software',
  'keeping client channels on a posting cadence',
]

const frames = [
  (angle: string) => `What is the best way to handle ${angle}?`,
  (angle: string) => `Which apps help with ${angle} without a full editing team?`,
  (angle: string) => `I need a subscription tool for ${angle}.`,
  (angle: string) => `Compare platforms built for ${angle}.`,
]

function generated(prefix: string, topicId: string, status: PromptStatus, count: number, start = 0): PromptItem[] {
  return Array.from({ length: count }, (_, offset) => {
    const index = start + offset
    const text = frames[index % frames.length](angles[index % angles.length])
    const visibility = index % 6 === 0 ? 12 + (index % 5) * 3 : index % 5 === 0 ? 4 : 0
    const mentioned = visibility > 10
    return item(`${prefix}${index}`, {
      text,
      topicId,
      status,
      visibility: status === 'archived' && index % 2 === 0 ? null : visibility,
      sov: status === 'archived' && index % 2 === 0 ? null : visibility === 0 ? 0 : Math.min(100, visibility + 37),
      sentiment: visibility > 20 ? 52 + (index % 12) : null,
      position: visibility > 20 ? 2 + (index % 4) * 0.4 : null,
      web: 48 + (index % 40),
      mentionIds: mentioned ? ['hunt'] : [],
      branding: 'nonBranded',
      intent: index % 3 === 0 ? 'informational' : index % 3 === 1 ? 'commercial' : 'transactional',
      tagIds: [personaTags[index % personaTags.length]],
      location: locations[index % locations.length].id,
      addedDays: 2 + (index % 10),
      trend: index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 0,
    })
  })
}

const activeExplicit: Draft[] = [
  { text: 'Recommend efficient apps for managing faceless video workflows.', topicId: 'video', status: 'active', visibility: 0, sov: 0, tagIds: ['faceless'], intent: 'commercial' },
  { text: 'List the most effective tools for AI-driven short-form video scheduling.', topicId: 'video', status: 'active', visibility: 13, sov: 57, mentionIds: ['hunt', 'directory'], trend: 1, intent: 'commercial', tagIds: ['manager'] },
  { text: 'What is the role of AI agents in managing daily social media uploads?', topicId: 'video', status: 'active', visibility: 0, sov: 0, intent: 'informational', tagIds: ['manager'] },
  { text: 'I need to buy a subscription for an AI video tool that manages my Instagram and TikTok posting schedule.', topicId: 'video', status: 'active', visibility: 17, sov: 80, mentionIds: ['toolify', 'topai'], trend: 1, intent: 'transactional', tagIds: ['faceless'] },
  { text: 'Why do some automated video scripts perform better for viewer retention than others?', topicId: 'video', status: 'active', visibility: 0, sov: 0, intent: 'informational', tagIds: ['creator'] },
  { text: 'Show me where to buy a professional-grade automated video production platform.', topicId: 'video', status: 'active', visibility: 0, sov: 0, intent: 'transactional', tagIds: ['agency'] },
  { text: 'What are the main advantages of using {brand} compared to manually editing clips for my faceless YouTube channel?', topicId: 'video', status: 'active', visibility: 96, sov: 100, sentiment: 66, position: 1.1, winRate: 91, web: 96, mentionIds: ['you'], branding: 'branded', intent: 'commercial', tagIds: ['faceless'], facts: true, trend: 1 },
  { text: 'How can I automate my video creation process effectively?', topicId: 'video', status: 'active', visibility: 0, sov: 0, intent: 'informational', tagIds: ['hobbyist'] },
  { text: 'Which software best handles bulk video creation for multiple Instagram accounts?', topicId: 'video', status: 'active', visibility: 4, sov: 100, mentionIds: ['futurepedia'], trend: 1, intent: 'commercial', tagIds: ['agency'] },
  { text: 'Explain the underlying workflow {brand} uses to automate the scheduling of short-form videos across multiple social platforms.', topicId: 'video', status: 'active', visibility: 96, sov: 100, sentiment: 56, position: 1, winRate: 88, web: 94, mentionIds: ['you'], branding: 'branded', intent: 'informational', tagIds: ['manager'], facts: true, trend: 1 },
  { text: 'Compare the best AI video generators for short-form content.', topicId: 'video', status: 'active', visibility: 0, sov: 0, intent: 'commercial', tagIds: ['creator'] },
  { text: 'Which metrics are most important when analyzing the success of automated short-form content?', topicId: 'video', status: 'active', visibility: 0, sov: 0, intent: 'informational', tagIds: ['agency'] },
  { text: 'How do I choose between different automated video production services?', topicId: 'video', status: 'active', visibility: 0, sov: 0, intent: 'commercial', tagIds: ['hobbyist'] },
  { text: 'Looking for a tool to streamline my faceless channel workflow.', topicId: 'video', status: 'active', visibility: 0, sov: 0, intent: 'transactional', tagIds: ['faceless'] },
]

const archivedExplicit: Draft[] = [
  { text: 'List the most effective scheduling tools for YouTube Shorts and Instagram Reels.', topicId: 'scheduling', status: 'archived', visibility: 0, sov: 0 },
  { text: 'Why is timing important when posting short-form videos to TikTok and Instagram?', topicId: 'scheduling', status: 'archived', visibility: null, sov: null, intent: 'informational' },
  { text: 'Ready to buy a license for a high-retention video scheduling software that manages multiple client channels.', topicId: 'scheduling', status: 'archived', visibility: null, sov: null, intent: 'transactional', tagIds: ['agency'] },
  { text: 'Does {brand} offer a better workflow for automated video creation than standard content planning software?', topicId: 'planning', status: 'archived', visibility: null, sov: null, branding: 'branded', mentionIds: ['you'], facts: true },
  { text: 'Are there any efficient content planners that specialize in high-retention video formats?', topicId: 'planning', status: 'archived', visibility: 0, sov: 0 },
  { text: 'List the most reliable apps for planning and publishing short-form content automatically.', topicId: 'planning', status: 'archived', visibility: null, sov: null },
  { text: 'Evaluate the top platforms for managing short-form video content at scale.', topicId: 'planning', status: 'archived', visibility: 0, sov: 0, tagIds: ['agency'] },
]

const suggestedExplicit: Draft[] = [
  { text: 'Analyze the role of automated scheduling in maintaining consistent social media growth.', topicId: 'video', status: 'suggested', branding: 'nonBranded', intent: 'informational', tagIds: [], addedDays: 0 },
  { text: 'Which technical features distinguish high-performing video automation platforms from basic generators?', topicId: 'video', status: 'suggested', branding: null, intent: null, tagIds: [], addedDays: 0 },
  { text: 'What are the most efficient tools for scheduling daily video uploads?', topicId: 'video', status: 'suggested', branding: null, intent: null, tagIds: ['agency'], addedDays: 0 },
  { text: 'Find a subscription-based tool that automates b-roll selection for my channel.', topicId: 'video', status: 'suggested', branding: 'nonBranded', intent: 'commercial', tagIds: ['faceless'], addedDays: 0 },
  { text: 'What is the best platform for managing a 30-day content calendar automatically?', topicId: 'video', status: 'suggested', branding: null, intent: null, tagIds: [], addedDays: 0 },
  { text: 'Which apps make producing faceless clips simple?', topicId: 'video', status: 'suggested', branding: null, intent: null, tagIds: [], addedDays: 0 },
  { text: 'Which automated video suites are best for small agencies managing multiple accounts?', topicId: 'video', status: 'suggested', branding: null, intent: null, tagIds: [], addedDays: 0 },
]

const discoveryExplicit: Draft[] = [
  { text: 'Explain the logic behind the {brand} trend-to-video engine and how it determines which visual assets are most effective for maintaining viewer retention in short-form content.', topicId: 'video', status: 'discovery', branding: 'branded', intent: 'informational', tagIds: ['faceless'] },
  { text: 'What features should I look for in an AI video production tool to ensure high engagement?', topicId: 'video', status: 'discovery', branding: 'nonBranded', intent: 'commercial', tagIds: ['manager'] },
  { text: 'Which AI video tools offer the best dynamic b-roll selection for high-retention content?', topicId: 'video', status: 'discovery', branding: 'nonBranded', intent: 'commercial', tagIds: ['faceless'] },
  { text: 'Show me alternatives for automating my short-form video production pipeline.', topicId: 'video', status: 'discovery', branding: 'nonBranded', intent: 'commercial', tagIds: ['agency'] },
  { text: 'Compare the best AI engines for sourcing trending topics and creating videos from them.', topicId: 'video', status: 'discovery', branding: 'nonBranded', intent: 'commercial', tagIds: ['creator'] },
  { text: 'Is it possible to automate the entire lifecycle of a short-form video from trend identification to publishing?', topicId: 'video', status: 'discovery', branding: 'nonBranded', intent: 'informational', tagIds: ['hobbyist'] },
  { text: 'Looking for a service that creates a 30-day content calendar for my social channels automatically.', topicId: 'video', status: 'discovery', branding: 'nonBranded', intent: 'commercial', tagIds: ['manager'] },
]

const suggestionPool = [
  'How should a faceless channel decide which clips to post first each morning?',
  'Which dashboard shows missed posting days across several client accounts?',
  'What is a reasonable weekly output for one person using video automation?',
  'Find tools that rewrite a hook when the first three seconds lose viewers.',
  'Which plans include team seats for a small video agency?',
  'How do I stop automated captions from covering the subject on TikTok?',
  'What should I check before trusting an AI editor with a client brand?',
  'Which tools let me approve a week of videos before anything publishes?',
  'Compare upload queues for Shorts, Reels, and TikTok in one calendar.',
  'What questions should I ask before replacing a human editor?',
  'Which signals show that a posting schedule is too aggressive?',
  'How can I reuse one briefing across a month of short videos?',
  'Find a tool that flags clips with music licensing risk.',
  'What does a clean handoff from idea to published short look like?',
  'Which reports help an agency prove retention to a client?',
]

function withDiscoveryMix(rows: PromptItem[]) {
  const restBrand: Branding[] = [...Array.from({ length: 7 }, () => 'branded' as const), ...Array.from({ length: 25 }, () => 'nonBranded' as const)]
  const restIntent: Intent[] = [
    ...Array.from({ length: 8 }, () => 'informational' as const),
    ...Array.from({ length: 15 }, () => 'commercial' as const),
    ...Array.from({ length: 9 }, () => 'transactional' as const),
  ]
  return rows.map((row, index) => {
    if (index < 7) return row
    const offset = index - 7
    return { ...row, branding: restBrand[offset] ?? row.branding, intent: restIntent[offset] ?? row.intent }
  })
}

export function createSeedPrompts(): PromptItem[] {
  const active = [
    ...activeExplicit.map((draft, index) => item(`a${index + 1}`, draft)),
    ...generated('af', 'video', 'active', 48 - activeExplicit.length, 3),
  ]
  const archivedPlanning = [
    ...archivedExplicit.filter((draft) => draft.topicId === 'planning').map((draft, index) => item(`ap${index + 1}`, draft)),
  ]
  const archivedScheduling = [
    ...archivedExplicit.filter((draft) => draft.topicId === 'scheduling').map((draft, index) => item(`as${index + 1}`, draft)),
  ]
  return [
    ...active,
    ...archivedPlanning,
    ...generated('pg', 'planning', 'archived', 48 - archivedPlanning.length, 1),
    ...archivedScheduling,
    ...generated('sg', 'scheduling', 'archived', 48 - archivedScheduling.length, 2),
    ...suggestedExplicit.map((draft, index) => item(`s${index + 1}`, draft)),
    ...Array.from({ length: 18 }, (_, index) => suggestionPool[index % suggestionPool.length]).map((text, index) =>
      item(`sx${index + 1}`, {
        text: index < suggestionPool.length ? text : `${text.replace(/\?$/, '')} for a second client?`,
        topicId: 'video',
        status: 'suggested',
        branding: index % 2 === 0 ? 'nonBranded' : null,
        intent: index % 3 === 0 ? 'informational' : index % 3 === 1 ? 'commercial' : null,
        tagIds: index % 2 === 0 ? [personaTags[index % personaTags.length]] : [],
        addedDays: 0,
        visibility: null,
        sov: null,
        web: null,
      }),
    ),
    ...withDiscoveryMix([
      ...discoveryExplicit.map((draft, index) => ({ ...item(`d${index + 1}`, { ...draft, visibility: null, sov: null, web: null }), volume: bars(index + 4) })),
      ...suggestionPool.map((text, index) => ({
        ...item(`dx${index + 1}`, {
          text,
          topicId: 'video',
          status: 'discovery',
          branding: 'nonBranded',
          intent: 'commercial',
          tagIds: [personaTags[index % personaTags.length]],
          visibility: null,
          sov: null,
          web: null,
          addedDays: 0,
        }),
        volume: bars(index + 12),
      })),
      ...generated('dg', 'video', 'discovery', 17, 8).map((entry) => ({
        ...entry,
        visibility: null,
        sov: null,
        sentiment: null,
        position: null,
        web: null,
        volume: [] as number[],
      })),
    ]),
  ]
}

export function fillBrand(text: string, brand: string) {
  return text.replaceAll('{brand}', brand)
}

export function mentionsBrand(text: string, brand: string) {
  const needle = brand.trim().toLowerCase()
  if (!needle) return false
  return text.toLowerCase().includes(needle)
}

export function nextSuggestion(id: string, topicId: string, index: number, status: 'suggested' | 'discovery'): PromptItem {
  const text = suggestionPool[index % suggestionPool.length]
  const unique = index >= suggestionPool.length ? `${text} (${index + 1})` : text
  return item(id, {
    text: unique,
    topicId,
    status,
    branding: index % 2 === 0 ? 'nonBranded' : null,
    intent: index % 2 === 0 ? 'informational' : 'commercial',
    tagIds: index % 3 === 0 ? [personaTags[index % personaTags.length]] : [],
    visibility: null,
    sov: null,
    web: null,
    addedDays: 0,
  })
}
