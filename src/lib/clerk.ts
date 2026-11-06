import { defaultLocale, type Locale } from '@/i18n'

/**
 * Clerk is switched on by adding two keys to .env.local (see .env.example):
 * NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY.
 *
 * Until both keys are present the app stays open in preview mode and the
 * sign-in page explains exactly what to add. Never put the secret key in a
 * NEXT_PUBLIC_ variable: it is read on the server only.
 */
export const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? ''

/** True in the browser once a publishable key exists, so ClerkProvider is mounted. */
export const clerkClientEnabled = clerkPublishableKey.length > 0

/** True only on the server when both Clerk keys exist, so routes can be protected. */
export function clerkServerEnabled() {
  return clerkClientEnabled && Boolean(process.env.CLERK_SECRET_KEY?.trim())
}

/** The names of the Clerk variables that are still missing, for the setup message. */
export function missingClerkKeys() {
  const missing: string[] = []
  if (!clerkPublishableKey) missing.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
  if (!process.env.CLERK_SECRET_KEY?.trim()) missing.push('CLERK_SECRET_KEY')
  return missing
}

/** `/sign-in` in the default locale, `/fr/sign-in` in every other locale. */
export function localePath(locale: string, path: string) {
  const clean = path.startsWith('/') ? path : `/${path}`
  return locale === defaultLocale ? clean : `/${locale}${clean}`
}

export const clerkAppearance = {
  variables: {
    colorPrimary: '#E85D0C',
    colorText: '#1A1A1A',
    colorTextSecondary: '#6F6A66',
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    colorInputText: '#1A1A1A',
    colorDanger: '#dc2626',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    borderRadius: '0.625rem',
  },
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full shadow-none',
    headerTitle: 'text-[20px] font-semibold text-black',
    headerSubtitle: 'text-[13px] leading-5 text-zinc-500',
    formFieldLabel: 'text-[13px] font-medium text-zinc-700',
    formFieldInput: 'h-10 rounded-lg border-nuw-line text-[14px] focus:border-nuw-primary',
    formButtonPrimary:
      'h-10 rounded-lg bg-nuw-button text-[14px] font-medium normal-case hover:bg-nuw-buttonHover focus:bg-nuw-buttonHover',
    footerActionText: 'text-[13px] text-zinc-500',
    footerActionLink: 'text-[13px] font-medium text-nuw-primary hover:text-nuw-primary',
    socialButtonsBlockButton: 'h-10 rounded-lg border-nuw-line text-[13px] hover:bg-zinc-50',
    dividerLine: 'bg-nuw-line',
    dividerText: 'text-[12px] text-zinc-400',
    identityPreviewEditButton: 'text-nuw-primary',
    formFieldAction: 'text-nuw-primary',
    alertText: 'text-[13px] leading-5',
    otpCodeFieldInput: 'rounded-lg border-nuw-line',
  },
} as const

/**
 * Sign-in and sign-up cards. On the first step the navbar lockup replaces
 * Clerk's application-name title, so that header is hidden and the card
 * leaves room for the lockup. Later steps keep Clerk's own titles, such as
 * "Check your email", so the next action stays clear.
 */
export function clerkFormAppearance(start: boolean) {
  return {
    ...clerkAppearance,
    elements: {
      ...clerkAppearance.elements,
      card: 'w-full rounded-2xl border border-nuw-line px-6 py-6 shadow-card sm:px-8',
      footer: 'hidden',
      headerTitle: start ? 'auth-hide-clerk-header' : clerkAppearance.elements.headerTitle,
      headerSubtitle: start ? 'auth-hide-clerk-header' : clerkAppearance.elements.headerSubtitle,
    },
  }
}

export type { Locale }
