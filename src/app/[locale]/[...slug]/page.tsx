import { setRequestLocale } from 'next-intl/server'
import { InsightsScreen } from '@/components/insights/insights-screen'
import { PerceptionScreen } from '@/components/perception/perception-screen'
import { DiscoveryScreen } from '@/components/prompts/discovery-screen'
import { PromptsScreen } from '@/components/prompts/prompts-screen'
import { DomainItemScreen } from '@/components/domains/domain-item-screen'
import { DomainsScreen } from '@/components/domains/domains-screen'
import { GapScreen } from '@/components/gaps/gap-screen'
import { UrlItemScreen } from '@/components/urls/url-item-screen'
import { UrlsScreen } from '@/components/urls/urls-screen'
import { ComingSoon } from '@/components/overview/coming-soon'

export default async function SectionPage({ params }: { params: Promise<{ locale: string; slug: string[] }> }) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const path = slug.join('/')
  if (path === 'brand/insights') return <InsightsScreen />
  if (path === 'brand/perception') return <PerceptionScreen />
  if (path === 'prompts') return <PromptsScreen />
  if (path === 'prompts/discovery') return <DiscoveryScreen />
  if (path === 'prompts/urls') return <UrlsScreen />
  if (path.startsWith('prompts/urls/')) return <UrlItemScreen id={slug.slice(2).join('/')} />
  if (path === 'prompts/gap') return <GapScreen />
  if (path === 'prompts/domains') return <DomainsScreen />
  if (path.startsWith('prompts/domains/')) return <DomainItemScreen id={slug.slice(2).join('/')} />
  return <ComingSoon />
}
