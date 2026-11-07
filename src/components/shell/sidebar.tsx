'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  ChartColumn,
  Compass,
  Eye,
  Globe,
  Hexagon,
  Home,
  LayoutGrid,
  Link2,
  ListChecks,
  MessageSquare,
  MessagesSquare,
  Search,
  Settings,
  Smile,
  X,
  type LucideIcon,
} from 'lucide-react'
import { navigation, type NavItem } from '@/data/types'
import { Link, usePathname } from '@/i18n/routing'
import { useWorkspace } from '@/components/workspace/workspace-context'
import { BrandSwitcher } from '@/components/shell/brand-switcher'
import { BrandMark } from '@/components/shell/brand-mark'
import { useBrand } from '@/components/workspace/workspace-context'
import { Menu, Modal, useToast } from '@/components/ui/overlay'
import { cn } from '@/lib/cn'

const icons: Record<string, LucideIcon> = {
  home: Home,
  custom: LayoutGrid,
  actions: ListChecks,
  website: Globe,
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
  settings: Settings,
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations('shell')
  const pathname = usePathname()
  const brand = useBrand()
  const { steps, completeStep, checklistHidden, setChecklistHidden, reveal, agent, setAgent } = useWorkspace()
  const { push } = useToast()
  const [query, setQuery] = useState('')
  const [kickoff, setKickoff] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ navBrand: true, navPrompts: true, navSources: true })

  const pages = navigation.flatMap<{ href?: string; key: string }>((item) => (item.children ? item.children : item.href ? [item] : []))
  const results = pages.filter((item) => t(item.key).toLowerCase().includes(query.trim().toLowerCase()))

  const runStep = (id: string, target: string) => {
    if (id === 'workspace') {
      push({ title: t('checklistDone'), body: t('stepWorkspaceToast') })
      return
    }
    completeStep(id)
    reveal(target)
    onNavigate?.()
  }

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-nuw-line bg-nuw-sidebar">
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

      <div className="max-h-[42vh] shrink-0 overflow-auto px-3 pb-2">
        {checklistHidden ? (
          <button type="button" onClick={() => setChecklistHidden(false)} className="w-full rounded-lg px-2 py-2 text-left text-[13px] text-zinc-600 hover:bg-zinc-200/60">
            {t('showChecklist')}
          </button>
        ) : (
          <div className="rounded-lg border border-nuw-line bg-white p-3 shadow-card">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[12px] font-medium text-zinc-700">{t('startHere', { done: steps.length, total: 5 })}</p>
              <button type="button" aria-label={t('hideChecklist')} onClick={() => setChecklistHidden(true)} className="text-zinc-400 hover:text-zinc-700">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mb-3 h-1 overflow-hidden rounded-full bg-zinc-200">
              <div className="h-full rounded-full bg-nuw-primary" style={{ width: `${(steps.length / 5) * 100}%` }} />
            </div>
            <p className="mb-2 text-[13px] font-medium text-zinc-800">{t('firstWin')}</p>
            <ul className="space-y-0.5">
              <Step done={steps.includes('workspace')} label={t('checklistDone')} onClick={() => runStep('workspace', 'ask')} />
              <Step done={steps.includes('stand')} label={t('checklistStand')} onClick={() => runStep('stand', 'metrics')} />
              <Step done={steps.includes('response')} label={t('checklistResponse')} onClick={() => runStep('response', 'ask')} />
              <Step done={steps.includes('answers')} label={t('checklistAnswers')} onClick={() => runStep('answers', 'domains')} />
              <Step done={steps.includes('gap')} label={t('checklistGap')} onClick={() => runStep('gap', 'plan')} />
            </ul>
            <button
              type="button"
              onClick={() => setKickoff(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-nuw-line py-1.5 text-[13px] hover:bg-zinc-50"
            >
              <Calendar className="h-3.5 w-3.5" />
              {t('bookKickstart')}
            </button>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-nuw-line bg-nuw-sidebar px-4 py-3 text-[13px]">
        <BrandMark initials={brand.initials} color={brand.color} size={18} />
        <span className="truncate font-medium">{t('live', { brand: brand.name })}</span>
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </div>

      <Modal open={kickoff} title={t('kickTitle')} onClose={() => setKickoff(false)}>
        <div className="p-5">
          <h2 className="text-base font-semibold">{t('kickTitle')}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{t('kickBody')}</p>
          <button type="button" onClick={() => setKickoff(false)} className="mt-4 rounded-lg bg-nuw-button px-3 py-2 text-sm text-white hover:bg-nuw-buttonHover">
            {t('kickAction')}
          </button>
        </div>
      </Modal>
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

function Step({ done, label, onClick }: { done: boolean; label: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-[13px] text-zinc-700 hover:bg-zinc-50">
        <span className={cn('grid h-4 w-4 place-items-center rounded-full border', done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-zinc-300')}>
          {done ? <span className="text-[10px]">✓</span> : null}
        </span>
        <span className={cn('flex-1', done && 'text-zinc-500')}>{label}</span>
        {!done ? <ChevronRight className="h-3.5 w-3.5 text-zinc-300" /> : null}
      </button>
    </li>
  )
}
