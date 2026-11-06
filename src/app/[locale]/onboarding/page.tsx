import { getTranslations, setRequestLocale } from 'next-intl/server'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'onboarding' })
  return { title: t('metaTitle') }
}

export default async function OnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <OnboardingFlow />
}
