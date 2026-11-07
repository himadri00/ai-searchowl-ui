'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  ChevronDown,
  ChevronRight,
  ChartColumn,
  Compass,
  Eye,
  Globe,
  Hexagon,
  Home,
  Link2,
  ListChecks,
  MessageSquare,
  MessagesSquare,
  Search,
  Settings,
  Smile,
  type LucideIcon,
} from 'lucide-react'
import { navigation, type NavItem } from '@/data/types'
import { Link, usePathname } from '@/i18n/routing'
import { useWorkspace } from '@/components/workspace/workspace-context'
import { BrandSwitcher } from '@/components/shell/brand-switcher'
import { BrandMark } from '@/components/shell/brand-mark'
import { useBrand } from '@/components/workspace/workspace-context'
import { Menu } from '@/components/ui/overlay'
import { cn } from '@/lib/cn'

const icons: Record<string, LucideIcon> = {
  home: Home,
  actions: ListChecks,
  brand: Hexagon,
  insights: Eye,
  perception: Smile,
  prompts: MessageSquare,
  allPrompts: MessagesSquare,
  discovery: Compass,
  sources: ChartColumn,
  gap: ChartColumn,
  promptDomains: Globe,
  urls: Link2,
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations('shell')
  const pathname = usePathname()
  const brand = useBrand()
  const { reveal, agent, setAgent } = useWorkspace()
  const [query, setQuery] = useState('')
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ navImprove: true, navMonitor: true, navEvidence: true })

  const pages = navigation.flatMap<{ href?: string; key: string }>((item) => (item.children ? item.children : item.href ? [item] : []))
  const results = pages.filter((item) => t(item.key).toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <aside className="flex h-full min-h-0 w-[248px] shrink-0 flex-col overflow-hidden border-r border-nuw-line bg-nuw-sidebar">
      <div className="flex items-center gap-1 px-3 pb-2 pt-3">
        <BrandSwitcher variant="sidebar" />
        <Menu
          align="right"
          panelClassName="w-64"
          trigger={() => (
            <button type="button" aria-label={t('search')} className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 hover:bg-zinc-200/70">
              <Search className="h-4 w-4" />
            </button>
          )}
        >
          <label className="flex items-center gap-2 px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-zinc-400" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-transparent text-[13px] outline-none"
            />
          </label>
          <div className="mt-1 border-t border-nuw-line pt-1">
            {results.length === 0 ? <p className="px-2 py-3 text-[13px] text-zinc-500">{t('paletteEmpty')}</p> : null}
            {results.map((item) => (
              <Link
                key={`${item.href}-${item.key}`}
                href={item.href!}
                onClick={onNavigate}
                className="block rounded-md px-2 py-2 text-[13px] hover:bg-zinc-100"
              >
                {t(item.key)}
              </Link>
            ))}
          </div>
        </Menu>
      </div>

      <div className="mx-3 mb-3 grid grid-cols-2 rounded-md border border-nuw-line bg-white p-0.5 text-[13px] font-semibold">
        <button
          type="button"
          onClick={() => setAgent(false)}
          className={cn('rounded-sm py-1', !agent ? 'bg-[#171411] text-white' : 'text-zinc-500')}
        >
          {t('browse')}
        </button>
        <button
          type="button"
          onClick={() => {
            setAgent(true)
            reveal('ask')
          }}
          className={cn('rounded-sm py-1', agent ? 'bg-[#171411] text-white' : 'text-zinc-500')}
        >
          {t('agent')}
        </button>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-auto px-2">
        {navigation.map((item) => (
          <NavBlock
            key={item.key}
            item={item}
            pathname={pathname}
            label={(key) => t(key)}
            open={openGroups[item.key] ?? false}
            onToggle={() => setOpenGroups((current) => ({ ...current, [item.key]: !current[item.key] }))}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="shrink-0 border-t border-nuw-line px-2 py-2">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]',
            pathname === '/settings'
              ? 'bg-[#171411] font-semibold text-white hover:bg-[#171411] hover:text-white'
              : 'text-[#302C29] hover:bg-[#F0EDE8]',
          )}
        >
          <Settings className="h-4 w-4" />
          <span>{t('navSettings')}</span>
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-nuw-line bg-nuw-sidebar px-4 py-3 text-[13px]">
        <BrandMark initials={brand.initials} color={brand.color} size={18} />
        <span className="truncate font-medium">{t('live', { brand: brand.name })}</span>
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </div>
    </aside>
  )
}

function childIsActive(href: string, pathname: string) {
  return pathname === href || ((href === '/prompts/urls' || href === '/prompts/domains') && pathname.startsWith(`${href}/`))
}

function NavBlock({
  item,
  pathname,
  label,
  open,
  onToggle,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  label: (key: string) => string
  open: boolean
  onToggle: () => void
  onNavigate?: () => void
}) {
  if (item.children) {
    const Icon = icons[item.icon] ?? Hexagon
    const childActive = item.children.some((child) => childIsActive(child.href, pathname))
    return (
      <div>
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 font-semibold text-[#171411] hover:bg-[#F0EDE8]"
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1 text-left">{label(item.key)}</span>
          {open || childActive ? <ChevronDown className="h-3.5 w-3.5 text-[#8A847E]" /> : <ChevronRight className="h-3.5 w-3.5 text-[#8A847E]" />}
        </button>
        {open || childActive ? (
          <div className="ml-3 space-y-0.5 border-l border-nuw-line pl-2">
            {item.children.map((child) => (
              <NavLink key={child.href} href={child.href} active={childIsActive(child.href, pathname)} icon={child.icon} dot={child.dot} onNavigate={onNavigate}>
                {label(child.key)}
              </NavLink>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <NavLink href={item.href!} active={pathname === item.href} icon={item.icon} onNavigate={onNavigate}>
      {label(item.key)}
    </NavLink>
  )
}

function NavLink({
  href,
  active,
  icon,
  dot,
  children,
  onNavigate,
}: {
  href: string
  active: boolean
  icon: string
  dot?: boolean
  children: string
  onNavigate?: () => void
}) {
  const Icon = icons[icon] ?? Home
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]',
        active
          ? 'bg-[#171411] font-semibold text-white hover:bg-[#171411] hover:text-white'
          : 'text-[#302C29] hover:bg-[#F0EDE8]',
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="truncate">{children}</span>
      {dot ? <span className={cn('ml-auto h-1.5 w-1.5', active ? 'bg-[#F05A0A]' : 'bg-[#F05A0A]')} /> : null}
    </Link>
  )
}

