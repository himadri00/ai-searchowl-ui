import { setRequestLocale } from 'next-intl/server'
import { OverviewScreen } from '@/components/overview/overview-screen'

export default async function DashboardHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <OverviewScreen />
}
