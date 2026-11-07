'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronRight, CircleHelp, Download, Menu as MenuIcon, Pencil, Share2, Sparkles, SquareChartGantt } from 'lucide-react'
import { locales } from '@/i18n'
import { Link, usePathname } from '@/i18n/routing'
import { domainById } from '@/data/domains'
import { navigation } from '@/data/types'
import type { WidgetId } from '@/data/types'
import { widgetIds } from '@/data/types'
import { useWorkspace } from '@/components/workspace/workspace-context'
import { UserMenu } from '@/components/auth/user-menu'
import { Menu, useToast } from '@/components/ui/overlay'
import { cn } from '@/lib/cn'

const widgetLabel: Record<WidgetId, string> = {
  hero: 'widgetHero',
  metrics: 'widgetMetrics',
  visibility: 'widgetVisibility',
  impact: 'widgetImpact',
  plan: 'widgetPlan',
  matrix: 'widgetMatrix',
  domains: 'widgetDomains',
  chats: 'widgetChats',
}

const localeLabel: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  de: 'Deutsch',
}

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const t = useTranslations('shell')
  const pathname = usePathname()
  const locale = useLocale()
  const { push } = useToast()
  const { agent, setAgent, reveal, hidden, toggleWidget, resetView, checklistHidden, setChecklistHidden } = useWorkspace()
  const [copied, setCopied] = useState(false)
  const title = pageTitle(pathname, t)

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-nuw-line bg-nuw-sidebar px-3 sm:gap-3 sm:px-4">
      <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-zinc-600 hover:bg-zinc-100 lg:hidden" onClick={onMenu} aria-label={t('openMenu')}>
        <MenuIcon className="h-4 w-4" />
      </button>
      <div className="flex min-w-0 items-center gap-2">
        <SquareChartGantt className="h-4 w-4 text-zinc-500" />
        {pathname === '/prompts/gap' ? (
          <h1 className="flex min-w-0 items-center gap-1 truncate text-[15px] font-extrabold tracking-[-0.025em]">
            <span className="text-zinc-500">{t('navSources')}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
            <span className="font-medium">{t('navGap')}</span>
          </h1>
        ) : pathname.startsWith('/prompts/urls') || pathname.startsWith('/prompts/domains') ? (
          <h1 className="flex min-w-0 items-center gap-1 truncate text-[15px] font-extrabold tracking-[-0.025em]">
            <span className="text-zinc-500">{t('navSources')}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
            {pathname.startsWith('/prompts/domains') ? (
              pathname === '/prompts/domains' ? (
                <span className="font-medium">{t('navPromptDomains')}</span>
              ) : (
                <>
                  <Link href="/prompts/domains" className="text-zinc-500 hover:text-zinc-800">{t('navPromptDomains')}</Link>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
                  <span className="font-medium">{domainById(pathname.split('/').pop() ?? '')?.host ?? pathname.split('/').pop()}</span>
                </>
              )
            ) : pathname === '/prompts/urls' ? (
              <span className="font-medium">{t('navUrls')}</span>
            ) : (
              <>
                <Link href="/prompts/urls" className="text-zinc-500 hover:text-zinc-800">{t('navUrls')}</Link>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
                <span className="font-medium">{t('navUrlItem')}</span>
              </>
            )}
          </h1>
        ) : pathname === '/brand/insights' || pathname === '/brand/perception' || pathname.startsWith('/prompts') ? (
          <h1 className="flex min-w-0 items-center gap-1 truncate text-[15px] font-extrabold tracking-[-0.025em]">
            <span className="text-zinc-500">{pathname.startsWith('/prompts') ? t('navPrompts') : t('navBrand')}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
            <span className="font-medium">{promptCrumb(pathname, t) || (pathname === '/brand/insights' ? t('navInsights') : t('navPerception'))}</span>
          </h1>
        ) : (
          <h1 className="truncate text-[15px] font-extrabold tracking-[-0.025em]">{title}</h1>
        )}
      </div>
      <div className="ml-auto flex items-center gap-1 text-[13px] text-zinc-600">
        <p className="mr-2 hidden sm:block">
          {t('trialLead')}
        </p>
        <button
          type="button"
          onClick={() => {
            setAgent(true)
            reveal('ask')
          }}
          className={cn('flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-zinc-100', agent && 'bg-zinc-100 text-zinc-900')}
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">{t('agent')}</span>
        </button>
        <Menu
          align="right"
          panelClassName="w-72 p-3"
          trigger={() => (
            <button type="button" className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-zinc-100">
              <CircleHelp className="h-4 w-4" />
              <span className="hidden sm:inline">{t('help')}</span>
            </button>
          )}
        >
          <p className="text-[13px] leading-5 text-zinc-600">{t('helpBody')}</p>
          <p className="mb-1 mt-3 text-[11px] font-medium uppercase tracking-wide text-zinc-400">{t('helpLanguage')}</p>
          <div className="flex flex-wrap gap-1">
            {locales.map((item) => (
              <Link
                key={item}
                href={pathname}
                locale={item}
                className={cn('rounded-md px-2 py-1 text-[12px] hover:bg-nuw-buttonHover hover:text-white', item === locale && 'bg-nuw-button text-white')}
              >
                {localeLabel[item]}
              </Link>
            ))}
          </div>
          {checklistHidden ? (
            <button type="button" onClick={() => setChecklistHidden(false)} className="mt-3 text-[13px] font-medium text-zinc-800 underline">
              {t('showChecklist')}
            </button>
          ) : null}
        </Menu>
        {pathname === '/home' ? (
          <>
            <Menu
              align="right"
              panelClassName="w-64 p-2"
              trigger={() => (
                <button type="button" aria-label={t('edit')} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-zinc-100">
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('edit')}</span>
                </button>
              )}
            >
              <p className="px-2 py-1 text-[13px] font-medium">{t('editTitle')}</p>
              <p className="px-2 pb-2 text-[12px] leading-5 text-zinc-500">{t('editBody')}</p>
              {widgetIds.map((id) => (
                <label key={id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-zinc-50">
                  <input type="checkbox" checked={!hidden.includes(id)} onChange={() => toggleWidget(id)} />
                  {t(widgetLabel[id])}
                </label>
              ))}
              <button type="button" onClick={resetView} className="mt-1 w-full rounded-lg px-2 py-2 text-left text-[13px] font-medium hover:bg-zinc-100">
                {t('resetView')}
              </button>
            </Menu>
            <button
              type="button"
              onClick={() => push({ title: t('pdfTitle'), body: t('pdfBody') })}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-zinc-100"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{t('exportPdf')}</span>
            </button>
            <Menu
              align="right"
              panelClassName="w-72 p-3"
              trigger={() => (
                <button type="button" aria-label={t('share')} className="ml-1 flex items-center gap-1.5 rounded-lg bg-nuw-button px-3 py-1.5 text-white hover:bg-nuw-buttonHover">
                  <Share2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('share')}</span>
                </button>
              )}
            >
              <p className="text-sm font-semibold">{t('shareTitle')}</p>
              <p className="mt-1 text-[13px] leading-5 text-zinc-600">{t('shareBody')}</p>
              <button
                type="button"
                className="mt-3 w-full rounded-lg bg-nuw-primary py-2 text-[13px] text-white hover:bg-nuw-primary"
                onClick={async () => {
                  await navigator.clipboard.writeText(window.location.href)
                  setCopied(true)
                }}
              >
                {copied ? t('shareCopied') : t('shareCopy')}
              </button>
            </Menu>
          </>
        ) : null}
        <UserMenu />
      </div>
    </header>
  )
}

function promptCrumb(pathname: string, t: (key: string) => string) {
  if (!pathname.startsWith('/prompts')) return ''
  if (pathname === '/prompts') return t('navAllPrompts')
  for (const item of navigation) {
    for (const child of item.children ?? []) {
      if (child.href === pathname) return t(child.key)
    }
  }
  return t('navPrompts')
}

function pageTitle(pathname: string, t: (key: string) => string) {
  if (pathname === '/home') return t('overview')
  for (const item of navigation) {
    if (item.href === pathname) return t(item.key)
    for (const child of item.children ?? []) {
      if (child.href === pathname) return t(child.key)
    }
  }
  return t('overview')
}
