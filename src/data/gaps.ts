import type { MentionId, UrlTypeId } from '@/data/urls'

export type GapBoard = 'domain' | 'host' | 'url'

export type GapRow = {
  id: string
  board: GapBoard
  domainId: string
  href: string
  host: string
  path: string
  title: string
  domainType: string
  urlType: UrlTypeId | null
  mentions: MentionId[]
  retrievals: number
  retrievalDelta: number | null
  retrieved: number
  retrievedDelta: number | null
  cited: number
  citedDelta: number | null
  retrievalRate: number
  citationRate: number
  gapScore: number
  totalCitations: number
  citationShare: number
  updatedHours: number | null
  updatedDays: number | null
  topics: string[]
  promptTags: string[]
  models: string[]
  tags?: string[]
}

function gap(row: Omit<GapRow, 'retrievalDelta' | 'retrievedDelta' | 'citedDelta' | 'updatedHours' | 'updatedDays' | 'path' | 'title' | 'urlType'> & Partial<Pick<GapRow, 'retrievalDelta' | 'retrievedDelta' | 'citedDelta' | 'updatedHours' | 'updatedDays' | 'path' | 'title' | 'urlType'>>): GapRow {
  return {
    path: '',
    title: '',
    urlType: null,
    retrievalDelta: null,
    retrievedDelta: null,
    citedDelta: null,
    updatedHours: null,
    updatedDays: null,
    ...row,
  }
}

const domainRows: GapRow[] = [
  gap({ id: 'theaitoolsbox', board: 'domain', domainId: 'theaitoolsbox', href: '/prompts/domains/theaitoolsbox', host: 'theaitoolsbox.com', domainType: 'ugc', mentions: ['topai'], retrievals: 24, retrieved: 2, cited: 1.2, retrievalRate: 0, citationRate: 0.8, gapScore: 24, totalCitations: 7, citationShare: 2, topics: ['video'], promptTags: ['faceless'], models: ['perplexity', 'chatgpt'] }),
  gap({ id: 'metricool', board: 'domain', domainId: 'metricool', href: '/prompts/domains/metricool', host: 'metricool.com', domainType: 'corporate', mentions: ['hunt'], retrievals: 22, retrieved: 1.8, cited: 1, retrievalRate: 0, citationRate: 0.5, gapScore: 22, totalCitations: 6, citationShare: 2, topics: ['scheduling', 'video'], promptTags: ['faceless'], models: ['perplexity'] }),
  gap({ id: 'virvid', board: 'domain', domainId: 'virvid', href: '/prompts/domains/virvid', host: 'virvid.ai', domainType: 'corporate', mentions: ['futuretools'], retrievals: 11, retrieved: 0.9, cited: 0, retrievalRate: 0, citationRate: 0, gapScore: 22, totalCitations: 0, citationShare: 0, topics: ['video'], promptTags: ['creator'], models: ['aioverview'] }),
  gap({ id: 'quuu', board: 'domain', domainId: 'quuu', href: '/prompts/domains/quuu', host: 'quuu.co', domainType: 'corporate', mentions: ['futurepedia'], retrievals: 15, retrieved: 1.3, cited: 0.8, retrievalRate: 0, citationRate: 0.7, gapScore: 18, totalCitations: 4, citationShare: 1, topics: ['scheduling'], promptTags: ['manager'], models: ['chatgpt'] }),
  gap({ id: 'overseeros', board: 'domain', domainId: 'overseeros', href: '/prompts/domains/overseeros', host: 'overseeros.com', domainType: 'corporate', mentions: ['topai'], retrievals: 7, retrieved: 0.6, cited: 0.1, retrievalRate: 0, citationRate: 0.1, gapScore: 7, totalCitations: 1, citationShare: 0, topics: ['video'], promptTags: ['faceless'], models: ['perplexity'] }),
  gap({ id: 'setuproll', board: 'domain', domainId: 'setuproll', href: '/prompts/domains/setuproll', host: 'setuproll.com', domainType: 'ugc', mentions: ['directory'], retrievals: 7, retrieved: 0.6, cited: 0, retrievalRate: 0, citationRate: 0, gapScore: 7, totalCitations: 0, citationShare: 0, topics: ['video'], promptTags: ['hobbyist'], models: ['perplexity'] }),
  gap({ id: 'vidmachine', board: 'domain', domainId: 'vidmachine', href: '/prompts/domains/vidmachine', host: 'vidmachine.ai', domainType: 'corporate', mentions: ['futuretools'], retrievals: 6, retrieved: 0.5, cited: 0.2, retrievalRate: 0, citationRate: 0.3, gapScore: 6, totalCitations: 1, citationShare: 0, topics: ['video'], promptTags: ['creator'], models: ['aioverview'] }),
  gap({ id: 'opus', board: 'domain', domainId: 'opus', href: '/prompts/domains/opus', host: 'opus.pro', domainType: 'corporate', mentions: ['toolify'], retrievals: 5, retrieved: 0.4, cited: 0.2, retrievalRate: 0, citationRate: 0.4, gapScore: 5, totalCitations: 1, citationShare: 0, topics: ['video'], promptTags: ['creator'], models: ['chatgpt'] }),
  gap({ id: 'frameo', board: 'domain', domainId: 'frameo', href: '/prompts/domains/frameo', host: 'frameo.ai', domainType: 'corporate', mentions: ['topai'], retrievals: 3, retrieved: 0.3, cited: 0, retrievalRate: 0, citationRate: 0, gapScore: 3, totalCitations: 0, citationShare: 0, topics: ['video'], promptTags: ['faceless'], models: ['perplexity'] }),
  gap({ id: 'imappliedseo', board: 'domain', domainId: 'imappliedseo', href: '/prompts/domains/imappliedseo', host: 'imappliedseo.com', domainType: 'corporate', mentions: ['directory'], retrievals: 3, retrieved: 0.3, cited: 0.1, retrievalRate: 0, citationRate: 0.3, gapScore: 3, totalCitations: 1, citationShare: 0, topics: ['planning'], promptTags: ['agency'], models: ['chatgpt'] }),
  gap({ id: 'nuwcutlab', board: 'domain', domainId: 'nuwcutlab', href: '/prompts/domains/nuwcutlab', host: 'nuwcutlab.com', domainType: 'reference', mentions: ['hunt'], retrievals: 1, retrieved: 0.1, cited: 0, retrievalRate: 0, citationRate: 0, gapScore: 2, totalCitations: 0, citationShare: 0, topics: ['video'], promptTags: ['hobbyist'], models: ['chatgpt'] }),
]

const hostRows: GapRow[] = [
  gap({ id: 'host-toolsbox', board: 'host', domainId: 'theaitoolsbox', href: '/prompts/domains/theaitoolsbox', host: 'theaitoolsbox.com', domainType: 'ugc', mentions: ['topai'], retrievals: 24, retrieved: 2, cited: 1.2, retrievalRate: 0, citationRate: 0.8, gapScore: 24, totalCitations: 7, citationShare: 2, topics: ['video'], promptTags: ['faceless'], models: ['perplexity', 'chatgpt'] }),
  gap({ id: 'host-metricool', board: 'host', domainId: 'metricool', href: '/prompts/domains/metricool', host: 'metricool.com', domainType: 'corporate', mentions: ['hunt'], retrievals: 22, retrieved: 1.8, cited: 1, retrievalRate: 0, citationRate: 0.5, gapScore: 22, totalCitations: 6, citationShare: 2, topics: ['scheduling', 'video'], promptTags: ['faceless'], models: ['perplexity'] }),
  gap({ id: 'host-virvid', board: 'host', domainId: 'virvid', href: '/prompts/domains/virvid', host: 'virvid.ai', domainType: 'corporate', mentions: ['futuretools'], retrievals: 11, retrieved: 0.9, cited: 0, retrievalRate: 0, citationRate: 0, gapScore: 22, totalCitations: 0, citationShare: 0, topics: ['video'], promptTags: ['creator'], models: ['aioverview'] }),
  gap({ id: 'host-quuu', board: 'host', domainId: 'quuu', href: '/prompts/domains/quuu', host: 'quuu.co', domainType: 'corporate', mentions: ['futurepedia'], retrievals: 13, retrieved: 1.1, cited: 0.5, retrievalRate: 0, citationRate: 0.5, gapScore: 13, totalCitations: 3, citationShare: 1, topics: ['scheduling'], promptTags: ['manager'], models: ['chatgpt'] }),
  gap({ id: 'host-setuproll', board: 'host', domainId: 'setuproll', href: '/prompts/domains/setuproll', host: 'setuproll.com', domainType: 'ugc', mentions: ['directory'], retrievals: 7, retrieved: 0.6, cited: 0, retrievalRate: 0, citationRate: 0, gapScore: 7, totalCitations: 0, citationShare: 0, topics: ['video'], promptTags: ['hobbyist'], models: ['perplexity'] }),
  gap({ id: 'host-overseeros', board: 'host', domainId: 'overseeros', href: '/prompts/domains/overseeros', host: 'www.overseeros.com', domainType: 'corporate', mentions: ['topai'], retrievals: 7, retrieved: 0.6, cited: 0.1, retrievalRate: 0, citationRate: 0.1, gapScore: 7, totalCitations: 1, citationShare: 0, topics: ['video'], promptTags: ['faceless'], models: ['perplexity'] }),
  gap({ id: 'host-vidmachine', board: 'host', domainId: 'vidmachine', href: '/prompts/domains/vidmachine', host: 'vidmachine.ai', domainType: 'corporate', mentions: ['futuretools'], retrievals: 6, retrieved: 0.5, cited: 0.2, retrievalRate: 0, citationRate: 0.3, gapScore: 6, totalCitations: 1, citationShare: 0, topics: ['video'], promptTags: ['creator'], models: ['aioverview'] }),
  gap({ id: 'host-blog-quuu', board: 'host', domainId: 'quuu', href: '/prompts/domains/quuu', host: 'blog.quuu.co', domainType: 'corporate', mentions: ['futurepedia'], retrievals: 5, retrieved: 0.4, cited: 0.3, retrievalRate: 0, citationRate: 0.8, gapScore: 8, totalCitations: 2, citationShare: 0, topics: ['scheduling'], promptTags: ['manager'], models: ['chatgpt'] }),
  gap({ id: 'host-opus', board: 'host', domainId: 'opus', href: '/prompts/domains/opus', host: 'www.opus.pro', domainType: 'corporate', mentions: ['toolify'], retrievals: 5, retrieved: 0.4, cited: 0.2, retrievalRate: 0, citationRate: 0.4, gapScore: 5, totalCitations: 1, citationShare: 0, topics: ['video'], promptTags: ['creator'], models: ['chatgpt'] }),
]

const urlRows: GapRow[] = [
  gap({ id: 'url-toolsbox', board: 'url', domainId: 'theaitoolsbox', href: '/prompts/domains/theaitoolsbox', host: 'theaitoolsbox.com', path: '/blog/best-ai-video-automation-tools-2026', title: '7 Best AI Video Automation Tools 2026', domainType: 'ugc', urlType: 'listicle', mentions: ['topai'], retrievals: 24, retrieved: 2, cited: 1.2, retrievalRate: 0, citationRate: 0.8, gapScore: 24, totalCitations: 7, citationShare: 2, updatedDays: 5, topics: ['video'], promptTags: ['faceless'], models: ['perplexity', 'chatgpt'] }),
  gap({ id: 'url-metricool', board: 'url', domainId: 'metricool', href: '/prompts/urls/metricool', host: 'metricool.com', path: '/faceless-youtube-channel', title: 'Faceless YouTube Channel Guide | Metricool', domainType: 'corporate', urlType: 'howTo', mentions: ['hunt'], retrievals: 22, retrieved: 1.8, cited: 1, retrievalRate: 0, citationRate: 0.5, gapScore: 22, totalCitations: 6, citationShare: 2, updatedHours: 10, topics: ['scheduling', 'video'], promptTags: ['faceless'], models: ['perplexity'] }),
  gap({ id: 'url-virvid', board: 'url', domainId: 'virvid', href: '/prompts/domains/virvid', host: 'virvid.ai', path: '/blog/ai-visual-generator-for-shorts', title: 'AI B-roll & Visuals Generator: 3 Best Tools to Use', domainType: 'corporate', urlType: 'listicle', mentions: ['futuretools'], retrievals: 11, retrieved: 0.9, cited: 0, retrievalRate: 0, citationRate: 0, gapScore: 22, totalCitations: 0, citationShare: 0, updatedDays: 5, topics: ['video'], promptTags: ['creator'], models: ['aioverview'] }),
  gap({ id: 'url-quuu', board: 'url', domainId: 'quuu', href: '/prompts/domains/quuu', host: 'quuu.co', path: '/blog/multi-platform-video-scheduling', title: 'Multi-platform video scheduling, Quuu Blog', domainType: 'corporate', urlType: 'listicle', mentions: ['futurepedia'], retrievals: 13, retrieved: 1.1, cited: 0.5, retrievalRate: 0, citationRate: 0.5, gapScore: 13, totalCitations: 3, citationShare: 1, updatedDays: 30, topics: ['scheduling'], promptTags: ['manager'], models: ['chatgpt'] }),
  gap({ id: 'url-overseeros', board: 'url', domainId: 'overseeros', href: '/prompts/domains/overseeros', host: 'overseeros.com', path: '/blog/ai-tools-for-faceless-youtube-channels', title: 'Best AI Tools for Faceless YouTube Channels', domainType: 'corporate', urlType: 'listicle', mentions: ['topai'], retrievals: 7, retrieved: 0.6, cited: 0.1, retrievalRate: 0, citationRate: 0.1, gapScore: 7, totalCitations: 1, citationShare: 0, updatedDays: 12, topics: ['video'], promptTags: ['faceless'], models: ['perplexity'] }),
  gap({ id: 'url-setuproll', board: 'url', domainId: 'setuproll', href: '/prompts/domains/setuproll', host: 'setuproll.com', path: '/d/ai-social', title: 'AI Tools for Short Form Video: 21 Apps Compared', domainType: 'ugc', urlType: 'other', mentions: ['directory'], retrievals: 7, retrieved: 0.6, cited: 0, retrievalRate: 0, citationRate: 0, gapScore: 7, totalCitations: 0, citationShare: 0, updatedDays: 30, topics: ['video'], promptTags: ['hobbyist'], models: ['perplexity'] }),
  gap({ id: 'url-quuu-blog', board: 'url', domainId: 'quuu', href: '/prompts/domains/quuu', host: 'blog.quuu.co', path: '/multi-platform-video-scheduling', title: 'Multi-platform video scheduling, Quuu Blog', domainType: 'corporate', urlType: 'listicle', mentions: ['futurepedia'], retrievals: 5, retrieved: 0.4, cited: 0.3, retrievalRate: 0, citationRate: 0.8, gapScore: 8, totalCitations: 2, citationShare: 0, updatedDays: 4, topics: ['scheduling'], promptTags: ['manager'], models: ['chatgpt'] }),
  gap({ id: 'url-opus', board: 'url', domainId: 'opus', href: '/prompts/domains/opus', host: 'opus.pro', path: '/blog/how-to-make-ai-faceless-youtube-videos', title: 'How to Make AI Faceless YouTube Videos', domainType: 'corporate', urlType: 'howTo', mentions: ['toolify'], retrievals: 5, retrieved: 0.4, cited: 0.2, retrievalRate: 0, citationRate: 0.4, gapScore: 5, totalCitations: 1, citationShare: 0, updatedDays: 9, topics: ['video'], promptTags: ['creator'], models: ['chatgpt'] }),
]

export const gapRows: GapRow[] = [...domainRows, ...hostRows, ...urlRows]
