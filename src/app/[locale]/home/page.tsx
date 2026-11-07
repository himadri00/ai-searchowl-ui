import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { localePath } from '@/lib/clerk'

export default async function HomeRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  redirect(localePath(locale, '/overview'))
}
