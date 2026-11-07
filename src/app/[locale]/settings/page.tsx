import { getTranslations, setRequestLocale } from 'next-intl/server'
import { SettingsScreen } from '@/components/settings/settings-screen'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'settings.page' })
  return { title: `${t('title')} · AiSearchOwl` }
}

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <SettingsScreen />
}
