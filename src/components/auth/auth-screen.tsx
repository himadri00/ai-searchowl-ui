import { SignIn, SignUp } from '@clerk/nextjs'
import { getTranslations } from 'next-intl/server'
import { AlertTriangle, Check } from 'lucide-react'
import { BrandLockup } from '@/components/home/brand-lockup'
import { Link } from '@/i18n/routing'
import { clerkFormAppearance, localePath, missingClerkKeys } from '@/lib/clerk'

type AuthMode = 'sign-in' | 'sign-up'

/**
 * Sign-in and sign-up screens.
 *
 * Clerk renders the form, sends the email verification code, handles a
 * forgotten password, and shows the social buttons switched on in the Clerk
 * dashboard. When the Clerk keys are missing, this screen says exactly what
 * to add to .env.local instead of showing a broken form.
 */
export async function AuthScreen({ locale, mode, start }: { locale: string; mode: AuthMode; start: boolean }) {
  const t = await getTranslations({ locale, namespace: 'auth' })
  const missing = missingClerkKeys()
  const signInPath = localePath(locale, '/sign-in')
  const signUpPath = localePath(locale, '/sign-up')
  const homePath = localePath(locale, '/home')
  const isSignIn = mode === 'sign-in'

  return (
    <main className="grid min-h-screen bg-white text-nuw-ink lg:grid-cols-[1.05fr_1fr]">
      <section className="hidden flex-col justify-between bg-[#FFF6F0] px-10 py-10 text-[#1A1A1A] lg:flex xl:px-14">
        <BrandLockup className="self-start" />
        <div className="max-w-md">
          <h2 className="text-[28px] font-semibold leading-9 tracking-tight">{t('panelTitle')}</h2>
          <p className="mt-3 text-[14px] leading-6 text-[#6F6A66]">{t('panelBody')}</p>
          <ul className="mt-6 space-y-3 text-[14px] leading-6">
            {[t('panelPointOne'), t('panelPointTwo'), t('panelPointThree')].map((point) => (
              <li key={point} className="flex gap-2.5">
                <Check className="mt-1 h-4 w-4 shrink-0 text-[#E85D0C]" aria-hidden />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="max-w-md text-[12px] leading-5 text-[#8A847E]">{t('panelNote')}</p>
      </section>

      <section className="flex min-h-screen flex-col overflow-auto px-4 py-8 sm:px-8 lg:py-10">
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
          <h1 className="text-[24px] font-semibold tracking-tight">{isSignIn ? t('signInTitle') : t('signUpTitle')}</h1>
          <p className="mt-2 text-[14px] leading-6 text-zinc-500">{isSignIn ? t('signInBody') : t('signUpBody')}</p>
          {missing.length === 0 ? <BrandLockup className="mt-6" /> : null}

          <div className="mt-4">
            {missing.length > 0 ? (
              <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
                <p className="flex items-start gap-2 text-[15px] font-semibold text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {t('setupTitle')}
                </p>
                <p className="mt-2 text-[13px] leading-6 text-amber-900">{t('setupBody')}</p>
                <p className="mt-3 text-[13px] font-medium leading-6 text-amber-900">
                  {t('setupMissing', { names: missing.join(', ') })}
                </p>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[13px] leading-6 text-amber-900">
                  <li>{t('setupStepOne')}</li>
                  <li>{t('setupStepTwo')}</li>
                  <li>{t('setupStepThree')}</li>
                  <li>{t('setupStepFour')}</li>
                </ol>
              </div>
            ) : isSignIn ? (
              <SignIn
                routing="path"
                path={signInPath}
                signUpUrl={signUpPath}
                fallbackRedirectUrl={homePath}
                appearance={clerkFormAppearance(start)}
              />
            ) : (
              <SignUp
                routing="path"
                path={signUpPath}
                signInUrl={signInPath}
                fallbackRedirectUrl={homePath}
                appearance={clerkFormAppearance(start)}
              />
            )}
          </div>

          <p className="mt-6 text-center text-[13px] leading-6 text-zinc-500">
            {isSignIn ? t('noAccount') : t('hasAccount')}{' '}
            <Link href={isSignIn ? '/sign-up' : '/sign-in'} className="font-medium text-nuw-primary hover:underline">
              {isSignIn ? t('createAccount') : t('signInLink')}
            </Link>
          </p>
          {!isSignIn ? <p className="mt-3 text-center text-[12px] leading-5 text-zinc-400">{t('signUpNote')}</p> : null}
        </div>
      </section>
    </main>
  )
}
