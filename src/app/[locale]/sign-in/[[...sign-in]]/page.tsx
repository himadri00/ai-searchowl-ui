import { auth } from '@clerk/nextjs/server'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { AuthScreen } from '@/components/auth/auth-screen'
import { clerkServerEnabled, localePath } from '@/lib/clerk'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  return { title: t('metaSignInTitle'), description: t('signInBody') }
}

export default async function SignInPage({ params }: { params: Promise<{ locale: string; 'sign-in'?: string[] }> }) {
  const { locale, 'sign-in': segments } = await params
  setRequestLocale(locale)
  if (clerkServerEnabled()) {
    const { userId } = await auth()
    if (userId) redirect(localePath(locale, '/overview'))
  }
  return <AuthScreen locale={locale} mode="sign-in" start={!segments?.length} />
}
