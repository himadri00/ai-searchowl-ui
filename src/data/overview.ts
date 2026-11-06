import type { Brand, ChatRecord, MetricKey } from './types'

const nuwtonicSeries: Brand['series'] = [
  { date: '2026-10-12', visibility: 17.2, sov: 99.2, sentiment: 59, position: 1.15, source: 11.2, winRate: 15.1 },
  { date: '2026-10-13', visibility: 19.6, sov: 99.8, sentiment: 60.5, position: 1.02, source: 12.6, winRate: 15.4 },
  { date: '2026-10-14', visibility: 18.9, sov: 99.4, sentiment: 58.6, position: 1.08, source: 11.4, winRate: 15.2 },
  { date: '2026-10-15', visibility: 18.7, sov: 99.7, sentiment: 59.4, position: 1.2, source: 12.1, winRate: 15.6 },
  { date: '2026-10-16', visibility: 16.4, sov: 99.6, sentiment: 59, position: 1.22, source: 13, winRate: 15.8 },
  { date: '2026-10-17', visibility: 17.5, sov: 99.5, sentiment: 58.4, position: 1.32, source: 11, winRate: 15.7 },
]

function shiftSeries(series: Brand['series'], visibilityDelta: number, sourceDelta: number): Brand['series'] {
  return series.map((point) => ({
    ...point,
    visibility: Math.round((point.visibility + visibilityDelta) * 10) / 10,
    source: Math.round((point.source + sourceDelta) * 10) / 10,
    winRate: Math.round((point.winRate + visibilityDelta * 0.4) * 10) / 10,
    sov: Math.max(12, Math.round((point.sov - Math.abs(visibilityDelta) * 1.4) * 10) / 10),
  }))
}

export const brands: Brand[] = [
  {
    id: 'nuwtonic',
    name: 'AiSearchOwl',
    domain: 'aisearchowl.com',
    initials: 'AO',
    color: '#E85D0C',
    matrixScale: 1,
    retrievals: 11900,
    metrics: {
      visibility: { value: 17.5, delta: 17.5, tone: 'good' },
      sov: { value: 99.6, delta: 99.6, tone: 'good' },
      sentiment: { value: 59, delta: 91, tone: 'good' },
      position: { value: 1.1, delta: 1.1, tone: 'bad' },
      source: { value: 11 },
      winRate: { value: 15.7, delta: 15.7, tone: 'good' },
    },
    series: nuwtonicSeries,
    competitors: [
      { id: 'nuwtonic', name: 'AiSearchOwl', initials: 'AO', color: '#E85D0C', visibility: 18, sov: 100, sentiment: 59, position: 1 },
      { id: 'surfer', name: 'Surfer', initials: 'SU', color: '#0F766E', visibility: 0, sov: 0, sentiment: null, position: null },
      { id: 'frase', name: 'Frase', initials: 'FR', color: '#E85D0C', visibility: 0, sov: 0, sentiment: null, position: null },
      { id: 'clearscope', name: 'Clearscope', initials: 'CL', color: '#0284C7', visibility: 0, sov: 0, sentiment: null, position: null },
      { id: 'marketmuse', name: 'MarketMuse', initials: 'MM', color: '#7C3AED', visibility: 0, sov: 0, sentiment: null, position: null },
      { id: 'neuron', name: 'NeuronWriter', initials: 'NR', color: '#059669', visibility: 0, sov: 0, sentiment: null, position: null },
      { id: 'writesonic', name: 'Writesonic', initials: 'WR', color: '#EA580C', visibility: 0, sov: 0, sentiment: null, position: null },
    ],
    domains: [
      { host: 'youtube.com', count: 299, tabs: ['top', 'trending'] },
      { host: 'aisearchowl.com', count: 132, you: true, tabs: ['top', 'new'] },
      { host: 'reddit.com', count: 86, tabs: ['top', 'trending'] },
      { host: 'g2.com', count: 76, tabs: ['top'] },
      { host: 'capterra.com', count: 67, tabs: ['top', 'losing'] },
      { host: 'linkedin.com', count: 66, tabs: ['top', 'new'] },
      { host: 'medium.com', count: 64, tabs: ['top', 'losing'] },
      { host: 'searchenginejournal.com', count: 61, tabs: ['top', 'trending'] },
    ],
  },
  {
    id: 'northwind',
    name: 'Northwind',
    domain: 'northwind.io',
    initials: 'NO',
    color: '#0F766E',
    matrixScale: 0.62,
    retrievals: 6400,
    metrics: {
      visibility: { value: 8.4, delta: 1.2, tone: 'good' },
      sov: { value: 22.5, delta: -3.1, tone: 'bad' },
      sentiment: { value: 54, delta: 4, tone: 'good' },
      position: { value: 3.4, delta: 0.6, tone: 'bad' },
      source: { value: 4.2, delta: 0.4, tone: 'good' },
      winRate: { value: 9.1, delta: -1.4, tone: 'bad' },
    },
    series: shiftSeries(nuwtonicSeries, -9, -6),
    competitors: [
      { id: 'northwind', name: 'Northwind', initials: 'NO', color: '#0F766E', visibility: 8.4, sov: 22, sentiment: 54, position: 3.4 },
      { id: 'nuwtonic', name: 'AiSearchOwl', initials: 'AO', color: '#E85D0C', visibility: 17.5, sov: 41, sentiment: 59, position: 1.1 },
      { id: 'helix', name: 'Helix', initials: 'HX', color: '#BE123C', visibility: 6.1, sov: 14, sentiment: 51, position: 4.2 },
      { id: 'lumen', name: 'Lumen Health', initials: 'LH', color: '#DB2777', visibility: 2.2, sov: 6, sentiment: null, position: null },
      { id: 'fieldnote', name: 'Fieldnote', initials: 'FN', color: '#C2410C', visibility: 1.1, sov: 3, sentiment: null, position: null },
      { id: 'atlas', name: 'Atlas Desk', initials: 'AD', color: '#334155', visibility: 0, sov: 0, sentiment: null, position: null },
      { id: 'paper', name: 'Paperlane', initials: 'PA', color: '#0369A1', visibility: 0, sov: 0, sentiment: null, position: null },
    ],
    domains: [
      { host: 'youtube.com', count: 140, tabs: ['top'] },
      { host: 'northwind.io', count: 88, you: true, tabs: ['top', 'new'] },
      { host: 'reddit.com', count: 54, tabs: ['top', 'trending'] },
      { host: 'g2.com', count: 31, tabs: ['top', 'losing'] },
      { host: 'linkedin.com', count: 28, tabs: ['top', 'new'] },
    ],
  },
  {
    id: 'lumen',
    name: 'Lumen Health',
    domain: 'lumenhealth.com',
    initials: 'LH',
    color: '#DB2777',
    matrixScale: 1.15,
    retrievals: 15200,
    metrics: {
      visibility: { value: 24.2, delta: 3.4, tone: 'good' },
      sov: { value: 61.3, delta: 4.8, tone: 'good' },
      sentiment: { value: 63, delta: 6, tone: 'good' },
      position: { value: 1.8, delta: -0.4, tone: 'good' },
      source: { value: 18.6, delta: 2.1, tone: 'good' },
      winRate: { value: 21.4, delta: 2.6, tone: 'good' },
    },
    series: shiftSeries(nuwtonicSeries, 6.4, 5),
    competitors: [
      { id: 'lumen', name: 'Lumen Health', initials: 'LH', color: '#DB2777', visibility: 24, sov: 61, sentiment: 63, position: 1.8 },
      { id: 'nuwtonic', name: 'AiSearchOwl', initials: 'AO', color: '#E85D0C', visibility: 11, sov: 18, sentiment: 59, position: 2.4 },
      { id: 'northwind', name: 'Northwind', initials: 'NO', color: '#0F766E', visibility: 4, sov: 7, sentiment: 54, position: 5 },
      { id: 'helix', name: 'Helix', initials: 'HX', color: '#BE123C', visibility: 2, sov: 4, sentiment: null, position: null },
      { id: 'fieldnote', name: 'Fieldnote', initials: 'FN', color: '#C2410C', visibility: 0, sov: 0, sentiment: null, position: null },
      { id: 'atlas', name: 'Atlas Desk', initials: 'AD', color: '#334155', visibility: 0, sov: 0, sentiment: null, position: null },
      { id: 'paper', name: 'Paperlane', initials: 'PA', color: '#0369A1', visibility: 0, sov: 0, sentiment: null, position: null },
    ],
    domains: [
      { host: 'youtube.com', count: 410, tabs: ['top', 'trending'] },
      { host: 'lumenhealth.com', count: 188, you: true, tabs: ['top', 'new'] },
      { host: 'reddit.com', count: 96, tabs: ['top'] },
      { host: 'healthline.com', count: 74, tabs: ['top', 'losing'] },
      { host: 'webmd.com', count: 52, tabs: ['top'] },
    ],
  },
  {
    id: 'fieldnote',
    name: 'Fieldnote',
    domain: 'fieldnote.app',
    initials: 'FN',
    color: '#C2410C',
    matrixScale: 0.35,
    retrievals: 2100,
    metrics: {
      visibility: { value: 3.1, delta: -0.8, tone: 'bad' },
      sov: { value: 6.4, delta: -1.1, tone: 'bad' },
      sentiment: { value: 48, delta: -3, tone: 'bad' },
      position: { value: 6.8, delta: 1.4, tone: 'bad' },
      source: { value: 1.4 },
      winRate: { value: 2.2, delta: -0.5, tone: 'bad' },
    },
    series: shiftSeries(nuwtonicSeries, -14, -9),
    competitors: [
      { id: 'fieldnote', name: 'Fieldnote', initials: 'FN', color: '#C2410C', visibility: 3.1, sov: 6, sentiment: 48, position: 6.8 },
      { id: 'nuwtonic', name: 'AiSearchOwl', initials: 'AO', color: '#E85D0C', visibility: 17.5, sov: 48, sentiment: 59, position: 1.1 },
      { id: 'northwind', name: 'Northwind', initials: 'NO', color: '#0F766E', visibility: 8.4, sov: 22, sentiment: 54, position: 3.4 },
      { id: 'lumen', name: 'Lumen Health', initials: 'LH', color: '#DB2777', visibility: 5, sov: 9, sentiment: 60, position: 4 },
      { id: 'helix', name: 'Helix', initials: 'HX', color: '#BE123C', visibility: 1, sov: 2, sentiment: null, position: null },
      { id: 'atlas', name: 'Atlas Desk', initials: 'AD', color: '#334155', visibility: 0, sov: 0, sentiment: null, position: null },
      { id: 'paper', name: 'Paperlane', initials: 'PA', color: '#0369A1', visibility: 0, sov: 0, sentiment: null, position: null },
    ],
    domains: [
      { host: 'reddit.com', count: 40, tabs: ['top', 'trending'] },
      { host: 'fieldnote.app', count: 22, you: true, tabs: ['top', 'new'] },
      { host: 'youtube.com', count: 18, tabs: ['top', 'losing'] },
      { host: 'medium.com', count: 11, tabs: ['top'] },
    ],
  },
]

export const soloBrandIds = ['nuwtonic']
export const agencyBrandIds = brands.map((brand) => brand.id)

export const chats: ChatRecord[] = [
  { id: 'c1', brandId: 'nuwtonic', models: ['chatgpt', 'perplexity'], features: ['web'], country: 'us', tag: 'commercial', sources: ['youtube.com', 'aisearchowl.com'], links: 2, citations: 5, position: null },
  { id: 'c2', brandId: null, models: ['perplexity', 'gemini'], features: ['web', 'links'], country: 'us', tag: 'informational', sources: ['reddit.com', 'g2.com'], links: 4, citations: 7, position: null },
  { id: 'c3', brandId: 'nuwtonic', models: ['aioverview', 'chatgpt', 'gemini'], features: ['web'], country: 'uk', tag: 'commercial', sources: ['aisearchowl.com', 'capterra.com'], links: 3, citations: 9, position: null },
  { id: 'c4', brandId: 'nuwtonic', models: ['perplexity', 'claude'], features: ['links'], country: 'us', tag: 'informational', sources: ['youtube.com', 'reddit.com'], links: 1, citations: 4, position: null },
  { id: 'c5', brandId: 'nuwtonic', models: ['chatgpt', 'gemini'], features: ['web'], country: 'de', tag: 'transactional', sources: ['linkedin.com', 'aisearchowl.com'], links: 2, citations: 5, position: null },
  { id: 'c6', brandId: null, models: ['aioverview'], features: [], country: 'fr', tag: 'nonBranded', sources: ['searchenginejournal.com'], links: 0, citations: 1, position: null },
  { id: 'c7', brandId: 'nuwtonic', models: ['chatgpt', 'perplexity'], features: ['web', 'links'], country: 'us', tag: 'branded', sources: ['aisearchowl.com', 'medium.com'], links: 6, citations: 8, position: 1 },
  { id: 'c8', brandId: 'lumen', models: ['gemini', 'aioverview'], features: ['web'], country: 'us', tag: 'informational', sources: ['youtube.com', 'reddit.com'], links: 2, citations: 3, position: null },
  { id: 'c9', brandId: 'northwind', models: ['claude', 'perplexity'], features: ['shopping', 'web'], country: 'uk', tag: 'commercial', sources: ['g2.com', 'capterra.com'], links: 3, citations: 6, position: null },
  { id: 'c10', brandId: null, models: ['chatgpt'], features: ['web'], country: 'in', tag: 'transactional', sources: ['reddit.com', 'youtube.com'], links: 1, citations: 2, position: null },
]

export const domainTypeTemplate = [
  { id: 'corporate', share: 68, color: '#f59e0b' },
  { id: 'ugc', share: 14, color: '#22b8cf' },
  { id: 'editorial', share: 5, color: '#3b82f6' },
  { id: 'other', share: 4, color: '#a1a1aa' },
  { id: 'you', share: 3, color: '#22c55e' },
  { id: 'reference', share: 3, color: '#a855f7' },
  { id: 'institutional', share: 2, color: '#84cc16' },
]

const winRate: Array<Array<number | null>> = [
  [86.4, null, null],
  [0.1, 0, 0],
  [16.1, 0, 0],
  [17.6, 0, 0],
  [13.8, 0, 0],
]

const position: Array<Array<number | null>> = [
  [1.1, null, null],
  [1.0, null, null],
  [1.0, null, null],
  [1.1, null, null],
  [1.3, null, null],
]

const sentiment: Array<Array<number | null>> = [
  [59, null, null],
  [58, 50, 50],
  [57, 50, 50],
  [60, 50, 50],
  [59, 50, 50],
]

const sov: Array<Array<number | null>> = [
  [32.8, null, null],
  [0.6, 33.3, 0],
  [7, 0, 0],
  [21.1, 0, 0],
  [5.2, 33.3, 0],
]

const visibility: Array<Array<number | null>> = [
  [18.2, null, null],
  [0.4, 2.1, 0],
  [6.2, 0, 0],
  [9.1, 0, 0],
  [4.4, 1.2, 0],
]

const source: Array<Array<number | null>> = [
  [11, null, null],
  [0.2, 0, 0],
  [3.4, 0, 0],
  [4.8, 0, 0],
  [2.1, 0, 0],
]

export const baseMatrix: Record<MetricKey, Array<Array<number | null>>> = {
  winRate,
  position,
  sentiment,
  sov,
  visibility,
  source,
}

export const planGroups = [
  {
    id: 'read',
    total: 7,
    tasks: [
      { id: 'canonical', tags: ['yourPage', 'technical'] },
      { id: 'llms', tags: ['yourPage', 'agentReady'] },
    ],
  },
  {
    id: 'pages',
    total: 2,
    tasks: [
      { id: 'comparison', tags: ['article', 'brief'] },
      { id: 'checklist', tags: ['listicle', 'optimization'] },
    ],
  },
  {
    id: 'mentions',
    total: 27,
    tasks: [
      { id: 'youtube', tags: ['youtube', 'publish'] },
      { id: 'reddit', tags: ['reddit', 'join'] },
    ],
  },
  {
    id: 'claims',
    total: 0,
    tasks: [],
  },
] as const

export function brandById(id: string) {
  return brands.find((brand) => brand.id === id) ?? brands[0]
}
