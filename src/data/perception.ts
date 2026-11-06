export type AnswerModel = 'chatgpt' | 'perplexity' | 'aioverview'

export type AttributeRecord = {
  id: string
  name: string
  score: number | null
  shape?: { x: number; y: number }
  top8: boolean
  builtin: boolean
}

export type TermRecord = {
  id: string
  label: string
  attributeId: string | null
  occurrences: number
  models: AnswerModel[]
}

export type HeatBrand = {
  id: string
  name: string
  initials: string
  color: string
  scores: Record<string, number | null>
}

export type SourceRecord = {
  id: string
  title: string
  url: string
  domain: string
  urlType: 'listicle' | 'reference' | 'other'
  domainType: 'corporate' | 'reference'
  mentioned: boolean
  attributeIds: string[]
  occurrences: number
  retrievals: number | null
  citation: number | null
}

export type PromptRecord = {
  id: string
  topic: 'video' | 'pricing' | 'workflow'
  text: string
  visibility: number
  sov: number
  sentiment: number | null
}

export const perceptionModels = {
  active: ['chatgpt', 'aioverview', 'perplexity'],
  available: ['aimode', 'gemini', 'copilot'],
  locked: ['naver', 'luna', 'qwen'],
} as const

export const defaultHeatIds = ['adobe', 'apple', 'blackmagic', 'wondershare', 'canva', 'descript', 'avid']

export const attributes: AttributeRecord[] = [
  { id: 'automation', name: 'AI Automation', score: 71, shape: { x: 46, y: 74 }, top8: true, builtin: true },
  { id: 'productivity', name: 'Productivity', score: 53, top8: false, builtin: true },
  { id: 'video', name: 'Video Generation', score: 51, top8: false, builtin: true },
  { id: 'planning', name: 'Content Planning', score: 47, shape: { x: 84, y: 30 }, top8: true, builtin: true },
  { id: 'ease', name: 'Ease of Use', score: 37, shape: { x: 78, y: 68 }, top8: true, builtin: true },
  { id: 'social', name: 'Social Media Marketing', score: 30, shape: { x: 36, y: 28 }, top8: true, builtin: true },
  { id: 'creator', name: 'Creator Productivity', score: 29, shape: { x: 30, y: 50 }, top8: true, builtin: true },
  { id: 'digital', name: 'Digital Technology', score: 12, shape: { x: 86, y: 54 }, top8: true, builtin: true },
  { id: 'library', name: 'Open Library', score: null, shape: { x: 58, y: 16 }, top8: true, builtin: true },
  { id: 'scalable', name: 'Scalable Design', score: null, shape: { x: 58, y: 88 }, top8: true, builtin: true },
]

const both: AnswerModel[] = ['chatgpt', 'perplexity']
const chat: AnswerModel[] = ['chatgpt']
const overview: AnswerModel[] = ['aioverview']

export const terms: TermRecord[] = [
  { id: 't1', label: 'Productivity', attributeId: 'productivity', occurrences: 6, models: both },
  { id: 't2', label: 'Digital', attributeId: 'digital', occurrences: 4, models: both },
  { id: 't3', label: 'AI powered', attributeId: 'automation', occurrences: 4, models: overview },
  { id: 't4', label: 'Trend discovery', attributeId: null, occurrences: 4, models: overview },
  { id: 't5', label: 'Content creation', attributeId: 'planning', occurrences: 3, models: overview },
  { id: 't6', label: 'Efficient', attributeId: 'ease', occurrences: 3, models: both },
  { id: 't7', label: 'Content planning', attributeId: 'planning', occurrences: 3, models: overview },
  { id: 't8', label: 'Social media', attributeId: 'social', occurrences: 3, models: overview },
  { id: 't9', label: 'Accessibility', attributeId: 'ease', occurrences: 2, models: chat },
  { id: 't10', label: 'Accessible', attributeId: 'ease', occurrences: 2, models: chat },
  { id: 't11', label: 'Ai automation', attributeId: 'automation', occurrences: 2, models: both },
  { id: 't12', label: 'Audience engagement', attributeId: null, occurrences: 2, models: chat },
  { id: 't13', label: 'Automated', attributeId: 'automation', occurrences: 2, models: overview },
  { id: 't14', label: 'Automated publishing', attributeId: 'planning', occurrences: 2, models: chat },
  { id: 't15', label: 'User-friendly', attributeId: 'ease', occurrences: 2, models: both },
  { id: 't16', label: 'Practical', attributeId: 'ease', occurrences: 1, models: chat },
  { id: 't17', label: 'Helpful', attributeId: 'ease', occurrences: 1, models: chat },
  { id: 't18', label: 'Convenience', attributeId: 'ease', occurrences: 1, models: overview },
  { id: 't19', label: 'Convenient', attributeId: 'ease', occurrences: 1, models: overview },
  { id: 't20', label: 'Utility', attributeId: 'ease', occurrences: 1, models: chat },
  { id: 't21', label: 'Productive', attributeId: 'ease', occurrences: 1, models: both },
  { id: 't22', label: 'Technology', attributeId: 'digital', occurrences: 2, models: chat },
  { id: 't23', label: 'Dynamic', attributeId: 'digital', occurrences: 1, models: overview },
  { id: 't24', label: 'AI tools', attributeId: 'automation', occurrences: 2, models: both },
  { id: 't25', label: 'Hands-free', attributeId: 'automation', occurrences: 1, models: chat },
  { id: 't26', label: 'Scheduling', attributeId: 'planning', occurrences: 2, models: both },
  { id: 't27', label: 'Editorial calendar', attributeId: 'planning', occurrences: 1, models: chat },
  { id: 't28', label: 'Campaign planning', attributeId: 'planning', occurrences: 1, models: overview },
  { id: 't29', label: 'Content calendar', attributeId: 'planning', occurrences: 1, models: chat },
  { id: 't30', label: 'Post planning', attributeId: 'planning', occurrences: 1, models: overview },
  { id: 't31', label: 'Content workflow', attributeId: 'planning', occurrences: 1, models: both },
  { id: 't32', label: 'Creator workflow', attributeId: 'creator', occurrences: 2, models: both },
  { id: 't33', label: 'Batch creation', attributeId: 'creator', occurrences: 2, models: chat },
  { id: 't34', label: 'Faceless video', attributeId: 'creator', occurrences: 2, models: overview },
  { id: 't35', label: 'Output speed', attributeId: 'creator', occurrences: 1, models: chat },
  { id: 't36', label: 'Creator tools', attributeId: 'creator', occurrences: 1, models: both },
  { id: 't37', label: 'Open source', attributeId: 'library', occurrences: 2, models: both },
  { id: 't38', label: 'Asset library', attributeId: 'library', occurrences: 1, models: chat },
  { id: 't39', label: 'Template library', attributeId: 'library', occurrences: 1, models: overview },
  { id: 't40', label: 'Fast', attributeId: 'productivity', occurrences: 2, models: chat },
  { id: 't41', label: 'Output', attributeId: 'productivity', occurrences: 2, models: overview },
  { id: 't42', label: 'Throughput', attributeId: 'productivity', occurrences: 1, models: chat },
  { id: 't43', label: 'Time saved', attributeId: 'productivity', occurrences: 1, models: both },
  { id: 't44', label: 'Workflow speed', attributeId: 'productivity', occurrences: 1, models: chat },
  { id: 't45', label: 'Scalable', attributeId: 'scalable', occurrences: 2, models: both },
  { id: 't46', label: 'Modular', attributeId: 'scalable', occurrences: 1, models: chat },
  { id: 't47', label: 'Design system', attributeId: 'scalable', occurrences: 1, models: overview },
  { id: 't48', label: 'Viral hooks', attributeId: null, occurrences: 2, models: overview },
  { id: 't49', label: 'Niche audience', attributeId: null, occurrences: 1, models: chat },
  { id: 't50', label: 'Video generation', attributeId: 'video', occurrences: 3, models: both },
  { id: 't51', label: 'B-roll', attributeId: 'video', occurrences: 2, models: chat },
  { id: 't52', label: 'Short-form', attributeId: 'video', occurrences: 2, models: overview },
]

const score = (
  scalable: number | null,
  productivity: number | null,
  social: number | null,
  digital: number | null,
  library: number | null,
  automation: number | null,
  creator: number | null,
  planning: number | null,
  ease: number | null,
  video: number | null,
): Record<string, number | null> => ({
  scalable,
  productivity,
  social,
  digital,
  library,
  automation,
  creator,
  planning,
  ease,
  video,
})

export const heatBrands: HeatBrand[] = [
  { id: 'adobe', name: 'Adobe', initials: 'A', color: '#e11d48', scores: score(90, 83, 79, 78, 73, 71, 70, 54, 49, 27) },
  { id: 'apple', name: 'Apple', initials: 'A', color: '#18181b', scores: score(75, 69, 24, 62, 57, null, 60, 16, 49, null) },
  { id: 'blackmagic', name: 'Blackmagic Design', initials: 'B', color: '#f59e0b', scores: score(74, 52, 31, 53, 66, 47, 50, null, 15, null) },
  { id: 'wondershare', name: 'Wondershare', initials: 'W', color: '#7c3aed', scores: score(41, 52, 35, 24, 37, 12, 29, 17, 58, null) },
  { id: 'canva', name: 'Canva', initials: 'C', color: '#00c4cc', scores: score(29, 7, 83, null, 6, 16, 23, 50, 41, 26) },
  { id: 'descript', name: 'Descript', initials: 'D', color: '#111827', scores: score(23, 30, 16, null, null, 72, 52, 23, 17, 5) },
  { id: 'avid', name: 'Avid', initials: 'A', color: '#014CFF', scores: score(59, 48, null, 56, 23, null, 30, 2, 12, null) },
  { id: 'cyberlink', name: 'CyberLink', initials: 'C', color: '#ea580c', scores: score(44, 33, 18, 40, 12, 22, 19, 8, 28, 11) },
]

export const sources: SourceRecord[] = [
  { id: 's1', title: 'Top 10 Best Video Production Software', url: 'worldmetrics.org/best/video-production-software', domain: 'worldmetrics.org', urlType: 'listicle', domainType: 'reference', mentioned: false, attributeIds: ['automation', 'productivity', 'video', 'planning', 'ease', 'social'], occurrences: 42, retrievals: null, citation: null },
  { id: 's2', title: 'Best Professional Video Production Software', url: 'worldmetrics.org/best/professional-video-production', domain: 'worldmetrics.org', urlType: 'listicle', domainType: 'reference', mentioned: false, attributeIds: ['automation', 'productivity', 'video', 'planning', 'creator'], occurrences: 38, retrievals: null, citation: null },
  { id: 's3', title: 'Best video marketing tools', url: 'thecmo.com/tools/best-video-marketing-software', domain: 'thecmo.com', urlType: 'listicle', domainType: 'corporate', mentioned: false, attributeIds: ['social', 'planning', 'automation', 'creator', 'ease', 'productivity'], occurrences: 37, retrievals: 6, citation: 0 },
  { id: 's4', title: 'Best video production software', url: 'zipdo.co/best/video-production-software', domain: 'zipdo.co', urlType: 'other', domainType: 'corporate', mentioned: false, attributeIds: ['video', 'productivity', 'automation', 'ease', 'planning'], occurrences: 34, retrievals: null, citation: null },
  { id: 's5', title: 'Best Video Production Software | 2026 Edition', url: 'gitnux.org/best/video-production-software', domain: 'gitnux.org', urlType: 'listicle', domainType: 'reference', mentioned: false, attributeIds: ['automation', 'video', 'productivity', 'digital', 'planning'], occurrences: 29, retrievals: null, citation: null },
  { id: 's6', title: 'Professional Video Production Software', url: 'zipdo.co/best/professional-video-production', domain: 'zipdo.co', urlType: 'listicle', domainType: 'corporate', mentioned: false, attributeIds: ['productivity', 'video', 'automation', 'creator'], occurrences: 28, retrievals: null, citation: null },
  { id: 's7', title: 'Best Video Editing Software in 2026', url: 'cloudinary.com/guides/video-effects/best-video-editing-software', domain: 'cloudinary.com', urlType: 'listicle', domainType: 'corporate', mentioned: false, attributeIds: ['ease'], occurrences: 7, retrievals: null, citation: null },
  { id: 's8', title: 'Best Tools for Content Teams', url: 'proom.ai/blog/best-ai-tools-for-content', domain: 'proom.ai', urlType: 'listicle', domainType: 'corporate', mentioned: false, attributeIds: ['planning', 'automation', 'creator'], occurrences: 7, retrievals: null, citation: null },
  { id: 's9', title: 'Best AI Video Production Tools', url: 'marmalaide.ai/top-ai-video-production', domain: 'marmalaide.ai', urlType: 'listicle', domainType: 'corporate', mentioned: false, attributeIds: ['automation', 'video', 'creator'], occurrences: 7, retrievals: null, citation: null },
  { id: 's10', title: 'One post tagged with "AI video"', url: 'marketbetter.ai/blog/tag/ai-video', domain: 'marketbetter.ai', urlType: 'listicle', domainType: 'corporate', mentioned: false, attributeIds: ['social', 'automation'], occurrences: 7, retrievals: null, citation: null },
  { id: 's11', title: 'Top 10 Best AI Video Production Tools', url: 'worldmetrics.org/service/top-ai-video', domain: 'worldmetrics.org', urlType: 'reference', domainType: 'reference', mentioned: false, attributeIds: ['automation', 'video', 'digital'], occurrences: 7, retrievals: null, citation: null },
  { id: 's12', title: 'Top 10 AI Video Editors', url: 'vizard.ai/blog/top-10-ai-video-editors', domain: 'vizard.ai', urlType: 'listicle', domainType: 'corporate', mentioned: false, attributeIds: ['video', 'ease', 'productivity'], occurrences: 7, retrievals: null, citation: null },
  { id: 's13', title: 'Scalable design systems for video teams', url: 'descript.com/blog/scalable-video-workflows', domain: 'descript.com', urlType: 'other', domainType: 'corporate', mentioned: false, attributeIds: ['scalable', 'ease', 'creator'], occurrences: 6, retrievals: 2, citation: 0.4 },
  { id: 's14', title: 'Open libraries for short-form production', url: 'github.com/topics/video-production', domain: 'github.com', urlType: 'reference', domainType: 'reference', mentioned: false, attributeIds: ['library', 'digital'], occurrences: 5, retrievals: 1, citation: 0.2 },
  { id: 's15', title: 'Social scheduling stacks compared', url: 'buffer.com/resources/video-scheduling-tools', domain: 'buffer.com', urlType: 'listicle', domainType: 'corporate', mentioned: false, attributeIds: ['social', 'planning', 'automation'], occurrences: 5, retrievals: 3, citation: 0 },
  { id: 's16', title: 'What makes video software easy to learn', url: 'capcut.com/learn/ease-of-use', domain: 'capcut.com', urlType: 'other', domainType: 'corporate', mentioned: false, attributeIds: ['ease', 'creator'], occurrences: 4, retrievals: null, citation: null },
  { id: 's17', title: 'Digital technology buyers guide', url: 'g2.com/categories/video-production', domain: 'g2.com', urlType: 'listicle', domainType: 'corporate', mentioned: false, attributeIds: ['digital', 'scalable', 'productivity'], occurrences: 4, retrievals: 2, citation: 1.2 },
  { id: 's18', title: 'Template libraries for agencies', url: 'canva.com/learn/video-templates', domain: 'canva.com', urlType: 'listicle', domainType: 'corporate', mentioned: false, attributeIds: ['library', 'planning', 'social'], occurrences: 3, retrievals: null, citation: null },
]

export const prompts: PromptRecord[] = [
  { id: 'p1', topic: 'video', text: 'Recommend efficient apps for managing faceless video workflows.', visibility: 0, sov: 0, sentiment: null },
  { id: 'p2', topic: 'video', text: 'List the most effective tools for AI-driven short-form video scheduling.', visibility: 13, sov: 57, sentiment: null },
  { id: 'p3', topic: 'workflow', text: 'What is the role of AI agents in managing daily social media uploads?', visibility: 0, sov: 0, sentiment: null },
  { id: 'p4', topic: 'workflow', text: 'Is {brand} the best platform for scaling my video production agency’s workflow?', visibility: 96, sov: 100, sentiment: 55 },
  { id: 'p5', topic: 'workflow', text: 'Explain the underlying workflow {brand} uses to automate the scheduling of short-form videos.', visibility: 96, sov: 100, sentiment: 56 },
  { id: 'p6', topic: 'pricing', text: 'Show me the pricing plans for {brand} so I can purchase a license for my video agency.', visibility: 96, sov: 100, sentiment: 57 },
  { id: 'p7', topic: 'video', text: 'How does the {brand} engine handle dynamic b-roll selection for different niche audiences?', visibility: 100, sov: 100, sentiment: 57 },
  { id: 'p8', topic: 'video', text: 'Show me how {brand} handles dynamic B-roll selection for trending short-content.', visibility: 96, sov: 100, sentiment: 59 },
  { id: 'p9', topic: 'pricing', text: 'Compare {brand} plans for a five-person video team that posts every day.', visibility: 88, sov: 74, sentiment: 61 },
  { id: 'p10', topic: 'pricing', text: 'Does {brand} include a free trial before a team buys an annual license?', visibility: 91, sov: 80, sentiment: 64 },
  { id: 'p11', topic: 'workflow', text: 'Which tool should a faceless channel use to batch a week of uploads?', visibility: 22, sov: 18, sentiment: 48 },
  { id: 'p12', topic: 'video', text: 'What software turns a script into a short-form video without an editor?', visibility: 41, sov: 33, sentiment: 52 },
  { id: 'p13', topic: 'workflow', text: 'How do agencies hand off content calendars between strategists and editors?', visibility: 17, sov: 9, sentiment: null },
  { id: 'p14', topic: 'pricing', text: 'What does a video production suite cost per month for one brand?', visibility: 63, sov: 44, sentiment: 49 },
  { id: 'p15', topic: 'video', text: 'Which AI tools pick b-roll that matches a niche audience?', visibility: 54, sov: 38, sentiment: 58 },
]

export const objections = [
  { id: 'price', label: 'Too expensive for the value', score: 42 },
  { id: 'integrations', label: 'Limited integrations', score: 31 },
  { id: 'learning', label: 'Steep learning curve', score: 24 },
  { id: 'reporting', label: 'Reporting is too shallow', score: 18 },
  { id: 'support', label: 'Slow support response', score: 14 },
  { id: 'vendor', label: 'Small vendor risk', score: 11 },
]

export const factSamples = [
  'Plans start at €90 per month, billed annually.',
  'Every plan includes a 14-day free trial.',
  'The company is headquartered in Berlin, Germany.',
]

export const fullSourceCount = 424
export const fullPromptCount = 48
export const factLimit = 5
export const promptLimit = 5
export const customAttributeLimit = 10
export const shapeSlotLimit = 50

export function cloneAttributes() {
  return attributes.map((item) => ({ ...item, shape: item.shape ? { ...item.shape } : undefined }))
}

export function cloneTerms() {
  return terms.map((item) => ({ ...item, models: [...item.models] }))
}

export function leadersFor(attributeId: string, brands: HeatBrand[]) {
  return brands
    .map((brand) => ({ brand, score: brand.scores[attributeId] ?? null }))
    .filter((item): item is { brand: HeatBrand; score: number } => item.score !== null)
    .sort((a, b) => b.score - a.score)
}
