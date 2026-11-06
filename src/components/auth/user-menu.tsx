'use client'

import { UserButton, useAuth } from '@clerk/nextjs'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { clerkAppearance, clerkClientEnabled } from '@/lib/clerk'

function ClerkUserMenu() {
  const { isLoaded, isSignedIn } = useAuth()
  const t = useTranslations('auth')

  if (!isLoaded) {
    return <span aria-label={t('accountLoading')} className="ml-1 h-8 w-8 animate-pulse rounded-full bg-zinc-100" />
  }
  if (!isSignedIn) {
    return (
      <Link href="/sign-in" className="ml-1 whitespace-nowrap rounded-lg bg-nuw-button px-3 py-1.5 font-medium text-white hover:bg-nuw-buttonHover">
        {t('signInLink')}
      </Link>
    )
  }
  return (
    <span className="ml-1 flex items-center" aria-label={t('account')}>
      <UserButton appearance={clerkAppearance} />
    </span>
  )
}

/**
 * Account button in the top bar: avatar with profile and sign-out when signed
 * in, a clear “Sign in” button when signed out, and the same button in preview
 * mode (no Clerk keys yet), where it opens the setup instructions.
 */
export function UserMenu() {
  const t = useTranslations('auth')
  if (!clerkClientEnabled) {
    return (
      <Link href="/sign-in" className="ml-1 whitespace-nowrap rounded-lg bg-nuw-button px-3 py-1.5 font-medium text-white hover:bg-nuw-buttonHover">
        {t('signInLink')}
      </Link>
    )
  }
  return <ClerkUserMenu />
}
