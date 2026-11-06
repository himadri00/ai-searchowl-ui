import { auth } from '@clerk/nextjs/server'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { AuthScreen } from '@/components/auth/auth-screen'
import { clerkServerEnabled, localePath } from '@/lib/clerk'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  return { title: t('metaSignUpTitle'), description: t('signUpBody') }
}

export default async function SignUpPage({ params }: { params: Promise<{ locale: string; 'sign-up'?: string[] }> }) {
  const { locale, 'sign-up': segments } = await params
  setRequestLocale(locale)
  if (clerkServerEnabled()) {
    const { userId } = await auth()
    if (userId) redirect(localePath(locale, '/home'))
  }
  return <AuthScreen locale={locale} mode="sign-up" start={!segments?.length} />
}
