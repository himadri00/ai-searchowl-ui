import { deDE, enUS, esES, frFR, itIT } from '@clerk/localizations'
import type { Locale } from '@/i18n'

/** Clerk's own form labels, errors, and buttons in the page language. */
export const clerkLocalizations: Record<Locale, typeof enUS> = {
  en: enUS,
  fr: frFR,
  es: esES,
  it: itIT,
  de: deDE,
}
