'use client'

import { useTranslations } from 'next-intl'
import { navigation } from '@/data/types'
import { Link, usePathname } from '@/i18n/routing'

export function ComingSoon() {
  const t = useTranslations('shell')
  const pathname = usePathname()
  const known = navigation
    .flatMap<{ href?: string; key: string }>((item) => (item.children ? [...item.children] : item.href ? [item] : []))
    .find((item) => item.href === pathname)

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-start justify-center px-6">
      <p className="text-[12px] font-medium uppercase tracking-wide text-zinc-400">{known ? t(known.key) : pathname}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{known ? t('comingTitle') : t('unknownTitle')}</h2>
      <p className="mt-3 text-[15px] leading-6 text-zinc-600">
        {known ? t('comingBody', { screen: t(known.key) }) : t('unknownBody')}
      </p>
      <Link href="/home" className="mt-6 rounded-lg bg-nuw-button px-4 py-2 text-sm text-white hover:bg-nuw-buttonHover">
        {t('comingAction')}
      </Link>
    </div>
  )
}
