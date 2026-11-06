'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Info } from 'lucide-react'
import type { DomainTab } from '@/data/types'
import { useBrand } from '@/components/workspace/workspace-context'
import { Favicon } from '@/components/shell/brand-mark'
import { formatCompact } from '@/lib/format'
import { cn } from '@/lib/cn'

const tabs: DomainTab[] = ['top', 'new', 'trending', 'losing']

export function DomainsPanel() {
  const t = useTranslations('overview.page')
  const locale = useLocale()
  const brand = useBrand()
  const [tab, setTab] = useState<DomainTab>('top')
  const rows = brand.domains.filter((domain) => domain.tabs.includes(tab))
  const max = Math.max(...rows.map((domain) => domain.count), 1)

  return (
    <section id="domains" className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-nuw-line bg-white">
        <header className="flex items-center gap-3 px-4 py-3">
          <h2 className="inline-flex items-center gap-1 text-[15px] font-semibold">
            {t('topDomains')}
            <Info className="h-3.5 w-3.5 text-zinc-400" />
          </h2>
          <div className="ml-auto flex gap-1 text-[13px]">
            {tabs.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={cn('rounded-md px-2 py-1', tab === item ? 'font-medium text-zinc-900' : 'text-zinc-400 hover:text-zinc-700')}
              >
                {t(`domainTab.${item}`)}
              </button>
            ))}
          </div>
        </header>
        {rows.length === 0 ? <p className="px-4 pb-4 text-[13px] leading-5 text-zinc-500">{t('domainTabEmpty', { tab: t(`domainTab.${tab}`) })}</p> : null}
        <ul className="space-y-1.5 px-4 pb-4">
          {rows.map((domain) => (
            <li key={domain.host} className="relative flex items-center gap-2">
              <div className="absolute inset-y-0 left-0 rounded-lg bg-zinc-100" style={{ width: `${Math.max(18, (domain.count / max) * 100)}%` }} />
              <div className="relative flex w-full items-center gap-2 px-2 py-1.5">
                <Favicon host={domain.host} />
                <span className={cn('text-[13px]', domain.you && 'font-medium')}>{domain.host}</span>
                {domain.you ? <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">{t('you')}</span> : null}
                <span className="ml-auto text-[13px] tabular-nums text-zinc-600">{domain.count}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-nuw-line bg-white">
        <header className="flex items-center px-4 py-3">
          <h2 className="text-[15px] font-semibold">{t('domainTypes')}</h2>
          <p className="ml-auto text-[12px] text-zinc-400">{t('totalRetrievals', { count: formatCompact(brand.retrievals, locale) })}</p>
        </header>
        <ul className="space-y-2 px-4 pb-4">
          {(brand.domainTypes ?? []).map((type) => (
            <li key={type.id} className="grid grid-cols-[140px_1fr_36px] items-center gap-3 text-[13px]">
              <span className="inline-flex items-center gap-2 text-zinc-700">
                <span className="h-2 w-2 rounded-full" style={{ background: type.color }} />
                {t(`domainType.${type.id}`)}
              </span>
              <span className="h-7 overflow-hidden rounded-lg bg-[#f4f4f5]">
                <span className="block h-full rounded-lg bg-[#e4e4e7]" style={{ width: `${Math.max(type.share, 8)}%` }} />
              </span>
              <span className="text-right tabular-nums text-zinc-500">{type.share}%</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
