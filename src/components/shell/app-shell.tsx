'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname } from '@/i18n/routing'
import { Sidebar } from '@/components/shell/sidebar'
import { TopBar } from '@/components/shell/top-bar'
import { FilterBar } from '@/components/shell/filter-bar'
import { useWorkspace } from '@/components/workspace/workspace-context'
import { useOnboardingRedirect } from '@/components/onboarding/gate'

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('shell')
  const pathname = usePathname()
  const { apiMessage, apiLoading } = useWorkspace()
  const [mobileOpen, setMobileOpen] = useState(false)
  const onboarding = pathname === '/onboarding'
  const authPage = pathname === '/sign-in' || pathname.startsWith('/sign-in/') || pathname === '/sign-up' || pathname.startsWith('/sign-up/')
  const landing = pathname === '/'
  useOnboardingRedirect(!onboarding && !authPage && !landing)

  if (onboarding || authPage || landing) return <>{children}</>

  return (
    <div className="product-ui flex h-screen overflow-hidden bg-nuw-canvas text-[13px] text-nuw-ink">
      <div className="hidden h-full min-h-0 lg:block">
        <Sidebar />
      </div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-zinc-900/30" onClick={() => setMobileOpen(false)} aria-label="Close" />
          <div className="relative h-full w-[248px]">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setMobileOpen(true)} />
        {pathname === '/overview' ? <FilterBar /> : null}
        {apiMessage ? (
          <p role="status" className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-[13px] leading-5 text-rose-800">{apiMessage}</p>
        ) : apiLoading ? (
          <p role="status" className="border-b border-nuw-line bg-white px-4 py-2 text-[13px] text-zinc-500">{t('workspaceLoading')}</p>
        ) : null}
        <main className="app-main min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
