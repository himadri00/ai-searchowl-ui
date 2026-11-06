import { clerkMiddleware } from '@clerk/nextjs/server'
import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { routing } from './i18n/routing'
import { clerkServerEnabled, localePath } from './lib/clerk'

const intlMiddleware = createMiddleware(routing)

const locales = routing.locales as readonly string[]

/** Sign-in and sign-up stay open in every locale: `/sign-in`, `/fr/sign-in`, and their sub-steps. */
function isAuthPage(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const page = locales.includes(segments[0] ?? '') ? segments[1] : segments[0]
  return page === 'sign-in' || page === 'sign-up'
}

/** The public home page (`/` or `/fr`) stays open so visitors can run the free check before signing up. */
function isLandingPage(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  return segments.length === 0 || (segments.length === 1 && locales.includes(segments[0]))
}

function localeOf(pathname: string) {
  const first = pathname.split('/').filter(Boolean)[0] ?? ''
  return locales.includes(first) ? first : routing.defaultLocale
}

const signedOutApiResponse = () =>
  NextResponse.json(
    {
      detail: {
        error_code: 'SIGN_IN_REQUIRED',
        message: 'You are signed out. Sign in again, then reload this page.',
      },
    },
    { status: 401 },
  )

/**
 * With Clerk keys in .env.local, every page except sign-in/sign-up needs a
 * signed-in user, and /api/v2 answers a clear 401 instead of redirecting.
 * Without the keys the app stays in preview mode: pages stay open and the
 * sign-in screen explains which keys to add.
 */
const clerkProxy = clerkMiddleware(
  async (auth, request: NextRequest) => {
    const { pathname } = request.nextUrl

    if (pathname.startsWith('/api/')) {
      if (pathname.startsWith('/api/v2/')) {
        const { userId } = await auth()
        if (!userId) return signedOutApiResponse()
      }
      return NextResponse.next()
    }

    if (!isAuthPage(pathname) && !isLandingPage(pathname)) {
      await auth.protect()
    }
    return intlMiddleware(request)
  },
  (request) => {
    const locale = localeOf(request.nextUrl.pathname)
    return {
      signInUrl: localePath(locale, '/sign-in'),
      signUpUrl: localePath(locale, '/sign-up'),
    }
  },
)

export default clerkServerEnabled() ? clerkProxy : intlMiddleware

export const config = {
  // Run on pages (for intl + Clerk) and on /api (for Clerk only; the handler
  // above returns before the intl middleware touches an API path). Skip Next
  // internals and real files. Dots inside a URL id such as
  // blog.contentforce.ai must still reach the locale rewrite.
  matcher: [
    '/((?!_next|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|css|js|map|txt|xml|woff2?)$).*)',
    '/api/(.*)',
  ],
}
