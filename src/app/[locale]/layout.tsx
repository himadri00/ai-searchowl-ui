import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales, type Locale } from '@/i18n'
import { routing } from '@/i18n/routing'
import { clerkLocalizations } from '@/components/auth/clerk-localization'
import { clerkAppearance, clerkClientEnabled, clerkPublishableKey, localePath } from '@/lib/clerk'
import { WorkspaceProvider } from '@/components/workspace/workspace-context'
import { PromptsProvider } from '@/components/prompts/prompts-context'
import { ToastProvider } from '@/components/ui/overlay'
import { AppShell } from '@/components/shell/app-shell'
import '../globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'shell' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound()
  setRequestLocale(locale)
  const messages = await getMessages()

  const app = (
    <NextIntlClientProvider messages={messages}>
      <ToastProvider>
        <WorkspaceProvider>
          <PromptsProvider>
            <AppShell>{children}</AppShell>
          </PromptsProvider>
        </WorkspaceProvider>
      </ToastProvider>
    </NextIntlClientProvider>
  )

  return (
    <html lang={locale}>
      <body className={`${inter.className} antialiased`}>
        {clerkClientEnabled ? (
          <ClerkProvider
            publishableKey={clerkPublishableKey}
            localization={clerkLocalizations[locale as Locale] ?? clerkLocalizations.en}
            appearance={clerkAppearance}
            signInUrl={localePath(locale, '/sign-in')}
            signUpUrl={localePath(locale, '/sign-up')}
            signInFallbackRedirectUrl={localePath(locale, '/overview')}
            signUpFallbackRedirectUrl={localePath(locale, '/overview')}
            afterSignOutUrl={localePath(locale, '/sign-in')}
          >
            {app}
          </ClerkProvider>
        ) : (
          app
        )}
      </body>
    </html>
  )
}
