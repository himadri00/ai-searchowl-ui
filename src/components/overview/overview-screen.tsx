'use client'

import { useTranslations } from 'next-intl'
import { SearchOverview } from '@/components/overview/search-overview'
import { MetricStrip } from '@/components/overview/metric-strip'
import { VisibilityPanel, SourceImpact } from '@/components/overview/visibility-panel'
import { ActionPlan } from '@/components/overview/action-plan'
import { PerformanceMatrix } from '@/components/overview/performance-matrix'
import { DomainsPanel } from '@/components/overview/domains-panel'
import { RecentChats } from '@/components/overview/recent-chats'
import { useBrand, useWorkspace } from '@/components/workspace/workspace-context'
import { BrandMark } from '@/components/shell/brand-mark'

export function OverviewScreen() {
  const t = useTranslations('shell')
  const { hidden, agent } = useWorkspace()
  const brand = useBrand()
  const show = (id: string) => !hidden.includes(id as never) && (!agent || id === 'hero')
  const any = ['metrics', 'visibility', 'impact', 'plan', 'matrix', 'domains', 'chats'].some((id) => show(id))

  return (
    <div className="pb-10">
      {show('hero') || show('metrics') ? (
        <section className="space-y-4 px-4 pb-4 pt-6">
          {show('hero') ? <SearchOverview /> : null}
          {show('metrics') ? <MetricStrip /> : null}
        </section>
      ) : null}
      <div className="space-y-4 px-4">
        {show('visibility') ? <VisibilityPanel /> : null}
        {show('impact') ? <SourceImpact /> : null}
        {show('plan') ? <ActionPlan /> : null}
        {show('matrix') ? (
          <div className="rounded-lg border border-nuw-line bg-white px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <BrandMark initials={brand.initials} color={brand.color} size={22} />
              <span className="text-[15px] font-semibold">{brand.name}</span>
              <div className="min-w-0 flex-1 lg:ml-auto lg:flex-none">
                <MetricStrip compact />
              </div>
            </div>
          </div>
        ) : null}
        {show('matrix') ? <PerformanceMatrix /> : null}
        {show('domains') ? <DomainsPanel /> : null}
        {show('chats') ? <RecentChats /> : null}
        {!any && !show('hero') ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
            <p className="text-base font-semibold">{t('hiddenAll')}</p>
            <p className="mt-2 text-[13px] text-zinc-500">{t('editBody')}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
