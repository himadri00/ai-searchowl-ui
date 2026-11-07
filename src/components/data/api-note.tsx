'use client'

import { useTranslations } from 'next-intl'

export function ApiNote({
  loading,
  error,
  shown,
  total,
}: {
  loading: boolean
  error: string | null
  shown?: number
  total?: number
}) {
  const t = useTranslations('shell')
  if (error) {
    return (
      <p role="status" className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] leading-5 text-rose-800">
        {error}
      </p>
    )
  }
  if (loading) {
    return <p role="status" className="mb-3 text-[13px] text-zinc-500">{t('pageLoading')}</p>
  }
  if (shown != null && total != null && total > shown) {
    return (
      <p role="status" className="mb-3 text-[13px] leading-5 text-zinc-600">
        {t('pagePartial', { shown, total })}
      </p>
    )
  }
  return null
}
