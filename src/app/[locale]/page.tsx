import { getTranslations, setRequestLocale } from 'next-intl/server'
import { EditorialHome } from '@/components/home/editorial-home'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })
  return { title: t('metaTitle'), description: t('metaDescription') }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <EditorialHome />
}
