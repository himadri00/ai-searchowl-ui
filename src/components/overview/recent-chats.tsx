'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, Columns3, Download, Search } from 'lucide-react'
import type { ChatRecord, FeatureId } from '@/data/types'
import { useBrand, useWorkspace } from '@/components/workspace/workspace-context'
import { useV2 } from '@/lib/v2'
import { browserTimeZone, formatChartDate, isBrowserToday, runCalendarKey } from '@/lib/format'
import { ApiNote } from '@/components/data/api-note'
import { BrandMark, Favicon } from '@/components/shell/brand-mark'
import { Menu } from '@/components/ui/overlay'
import { cn } from '@/lib/cn'
import { ChatDetail, chatText, modelColor } from '@/components/overview/chat-detail'

const columns = ['chat', 'mentions', 'sources', 'links', 'features', 'citations', 'position', 'created'] as const
type ColumnId = (typeof columns)[number]
const pageSize = 8

function createdLabel(value: string | null | undefined, locale: string, today: string, missing: string) {
  const text = value?.trim() ?? ''
  if (!text) return missing
  const key = runCalendarKey(text)
  if (!key) return missing
  if (isBrowserToday(text)) return today
  return formatChartDate(key, locale)
}

export function RecentChats() {
  const t = useTranslations('overview.page')
  const locale = useLocale()
  const { filters, setFilters, workspaceBrands } = useWorkspace()
  const activeBrand = useBrand()
  const chatQuery = useV2<{ total: number; chats: ChatRecord[] }>('prompt-runs/chats', { limit: 100, timezone: browserTimeZone() })
  const chats = chatQuery.data?.chats ?? []
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [visible, setVisible] = useState<ColumnId[]>([...columns])
  const [page, setPage] = useState(0)
  const [openId, setOpenId] = useState<string | null>(null)
  const [sourceQuery, setSourceQuery] = useState('')

  const sourceOptions = useMemo(() => Array.from(new Set(chats.flatMap((chat) => chat.sources))), [chats])
  const brandOptions = useMemo(() => {
    const ids = Array.from(new Set(chats.map((chat) => chat.brandId).filter((id): id is string => Boolean(id))))
    const pool = workspaceBrands.length ? workspaceBrands : activeBrand.id ? [activeBrand] : []
    return pool.filter((brand) => ids.includes(brand.id))
  }, [chats, workspaceBrands, activeBrand])

  const filtered = chats.filter((chat) => {
    if (filters.models.length && !chat.models.some((model) => filters.models.includes(model))) return false
    if (filters.countries.length && !filters.countries.includes(chat.country)) return false
    if (filters.tags.length && !filters.tags.includes(chat.tag)) return false
    if (filters.sources.length && !chat.sources.some((source) => filters.sources.includes(source))) return false
    if (filters.brands.length) {
      const hit = chat.brandId ? filters.brands.includes(chat.brandId) : filters.brands.includes('none')
      if (filters.brandMode === 'and') {
        const needed = filters.brands.filter((id) => id !== 'none')
        if (needed.length && chat.brandId && !needed.every((id) => id === chat.brandId)) return false
        if (filters.brands.includes('none') && chat.brandId) return false
      } else if (!hit) return false
    }
    if (filters.features.length) {
      const wantsNone = filters.features.includes('none')
      const selected = filters.features.filter((feature) => feature !== 'none')
      const hasNone = chat.features.length === 0
      const hasSelected = filters.featureMode === 'and'
        ? selected.every((feature) => chat.features.includes(feature as FeatureId))
        : selected.some((feature) => chat.features.includes(feature as FeatureId))
      const featureOk = filters.featureMode === 'and'
        ? (selected.length === 0 || hasSelected) && (!wantsNone || hasNone)
        : (wantsNone && hasNone) || (selected.length > 0 && hasSelected)
      if (!featureOk) return false
    }
    if (query.trim()) {
      const haystack = `${chatText(chat, 'title', t)} ${chatText(chat, 'snippet', t)}`.toLowerCase()
      if (!haystack.includes(query.trim().toLowerCase())) return false
    }
    return true
  })

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pages - 1)
  const slice = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize)
  const active = chats.find((chat) => chat.id === openId) ?? null
  const activeIndex = active ? filtered.findIndex((chat) => chat.id === active.id) : -1

  const download = (kind: 'csv' | 'json') => {
    const rows = filtered.map((chat) => ({
      title: chatText(chat, 'title', t),
      snippet: chatText(chat, 'snippet', t),
      brand: chat.brandId ?? '',
      sources: chat.sources.join(' '),
      links: chat.links,
      features: chat.features.join(' '),
      citations: chat.citations,
      position: chat.position ?? 0,
    }))
    const blob = kind === 'json'
      ? new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
      : new Blob([['title,brand,sources,links,citations,position', ...rows.map((row) => `"${row.title}","${row.brand}","${row.sources}",${row.links},${row.citations},${row.position}`)].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `aisearchowl-chats.${kind === 'json' ? 'json' : 'csv'}`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section id="chats" className="rounded-2xl border border-nuw-line bg-white">
      <header className="flex flex-wrap items-center gap-2 px-4 py-3">
        <h2 className="text-[15px] font-semibold">{t('chatsTitle')}</h2>
        <div className="basis-full">
          <ApiNote loading={chatQuery.loading} error={chatQuery.error} shown={chats.length} total={chatQuery.data?.total} />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <ChoiceMenu
            label={t('allBrands')}
            options={[{ id: 'none', label: t('noBrand') }, ...brandOptions.map((brand) => ({ id: brand.id, label: brand.name }))]}
            selected={filters.brands}
            mode={filters.brandMode}
            onMode={(brandMode) => setFilters((current) => ({ ...current, brandMode }))}
            onToggle={(id) => {
              setPage(0)
              setFilters((current) => ({
                ...current,
                brands: current.brands.includes(id) ? current.brands.filter((item) => item !== id) : [...current.brands, id],
              }))
            }}
          />
          <ChoiceMenu
            label={t('allFeatures')}
            options={[
              { id: 'shopping', label: t('feature.shopping') },
              { id: 'web', label: t('feature.web') },
              { id: 'links', label: t('feature.links') },
              { id: 'none', label: t('feature.none') },
            ]}
            selected={filters.features}
            mode={filters.featureMode}
            onMode={(featureMode) => setFilters((current) => ({ ...current, featureMode }))}
            onToggle={(id) => {
              setPage(0)
              setFilters((current) => ({
                ...current,
                features: current.features.includes(id as FeatureId)
                  ? current.features.filter((item) => item !== id)
                  : [...current.features, id as FeatureId],
              }))
            }}
          />
          <Menu
            align="right"
            panelClassName="w-64 p-2"
            trigger={() => (
              <button type="button" className="flex h-8 items-center gap-1 rounded-lg border border-nuw-line px-2 text-[13px]">
                {filters.sources.length ? t('sourcesCount', { count: filters.sources.length }) : t('allSources')}
              </button>
            )}
          >
            <input
              value={sourceQuery}
              onChange={(event) => setSourceQuery(event.target.value)}
              placeholder={t('searchSources')}
              className="mb-1 w-full rounded-lg border border-nuw-line px-2 py-1.5 text-[13px] outline-none"
            />
            {sourceOptions.filter((host) => host.includes(sourceQuery.trim().toLowerCase())).map((host) => (
              <label key={host} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={filters.sources.includes(host)}
                  onChange={() => {
                    setPage(0)
                    setFilters((current) => ({
                      ...current,
                      sources: current.sources.includes(host) ? current.sources.filter((item) => item !== host) : [...current.sources, host],
                    }))
                  }}
                />
                <Favicon host={host} />
                {host}
              </label>
            ))}
          </Menu>
          {searchOpen ? (
            <label className="flex h-8 items-center gap-1 rounded-lg border border-nuw-line px-2">
              <Search className="h-3.5 w-3.5 text-zinc-400" />
              <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0) }} placeholder={t('searchChats')} className="w-36 bg-transparent text-[13px] outline-none" />
            </label>
          ) : (
            <button type="button" aria-label={t('searchChats')} onClick={() => setSearchOpen(true)} className="grid h-8 w-8 place-items-center rounded-lg border border-nuw-line">
              <Search className="h-3.5 w-3.5" />
            </button>
          )}
          <Menu
            align="right"
            panelClassName="w-48"
            trigger={() => (
              <button type="button" aria-label={t('columns')} className="grid h-8 w-8 place-items-center rounded-lg border border-nuw-line">
                <Columns3 className="h-3.5 w-3.5" />
              </button>
            )}
          >
            {columns.map((column) => (
              <label key={column} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px]">
                <input
                  type="checkbox"
                  checked={visible.includes(column)}
                  onChange={() => setVisible((current) => (current.includes(column) ? current.filter((item) => item !== column) : [...current, column]))}
                />
                {t(`column.${column}`)}
              </label>
            ))}
            <button type="button" onClick={() => setVisible([...columns])} className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-[13px] text-zinc-500 hover:bg-zinc-50">
              {t('resetColumns')}
            </button>
          </Menu>
          <Menu
            align="right"
            panelClassName="w-40"
            trigger={() => (
              <button type="button" aria-label={t('exportCsv')} className="grid h-8 w-8 place-items-center rounded-lg border border-nuw-line">
                <Download className="h-3.5 w-3.5" />
              </button>
            )}
          >
            <button type="button" onClick={() => download('csv')} className="block w-full rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100">CSV</button>
            <button type="button" onClick={() => download('json')} className="block w-full rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100">JSON</button>
            <p className="px-2 py-2 text-[12px] leading-5 text-zinc-500">{t('xlsxNote')}</p>
          </Menu>
        </div>
      </header>
      {filtered.length === 0 ? (
        <p className="px-4 pb-6 text-[13px] leading-6 text-zinc-600">{t('chatsEmpty')}</p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full min-w-[860px] text-left text-[13px]">
            <thead className="text-[12px] text-zinc-400">
              <tr>
                {columns.filter((column) => visible.includes(column)).map((column) => (
                  <th key={column} className="px-4 py-2 font-medium">{t(`column.${column}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((chat) => (
                <tr key={chat.id} className="cursor-pointer border-t border-nuw-line hover:bg-zinc-50" onClick={() => setOpenId(chat.id)}>
                  {visible.includes('chat') ? (
                    <td className="max-w-[360px] px-4 py-3">
                      <p className="truncate font-medium text-zinc-900">{chatText(chat, 'title', t)}</p>
                      <p className="truncate text-[12px] text-zinc-500">{chatText(chat, 'snippet', t)}</p>
                      {chat.verdict ? <p className="mt-1 text-[11px] font-medium text-zinc-500">{chat.verdict.state === 'recommended' ? 'Recommended' : chat.verdict.state === 'mentioned' ? 'Mentioned' : chat.verdict.state === 'cited' ? 'Cited, not mentioned' : 'Tracked brand missing'}</p> : null}
                    </td>
                  ) : null}
                  {visible.includes('mentions') ? <td className="px-4 py-3"><ModelDots models={chat.models} extra={chat.citations} /></td> : null}
                  {visible.includes('sources') ? (
                    <td className="px-4 py-3">
                      <span className="inline-flex gap-1">{chat.sources.slice(0, 3).map((host) => <Favicon key={host} host={host} />)}</span>
                    </td>
                  ) : null}
                  {visible.includes('links') ? <td className="px-4 py-3 text-zinc-500 tabular-nums">{chat.links ?? 0}</td> : null}
                  {visible.includes('features') ? (
                    <td className="px-4 py-3 text-zinc-500">{chat.features.length ? chat.features.map((feature) => t(`feature.${feature}`)).join(', ') : 'N/A'}</td>
                  ) : null}
                  {visible.includes('citations') ? <td className="px-4 py-3">{chat.citations}</td> : null}
                  {visible.includes('position') ? <td className="px-4 py-3 tabular-nums">{chat.position ?? 0}</td> : null}
                  {visible.includes('created') ? <td className="px-4 py-3 text-zinc-500">{createdLabel(chat.createdAt, locale, t('createdToday'), t('createdMissing'))}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <footer className="flex items-center justify-between px-4 py-3 text-[12px] text-zinc-500">
        <span>{t('pageStatus', { from: filtered.length === 0 ? 0 : safePage * pageSize + 1, to: Math.min(filtered.length, safePage * pageSize + pageSize), total: filtered.length })}</span>
        <span className="inline-flex items-center gap-1">
          <button type="button" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} className="grid h-7 w-7 place-items-center rounded-md hover:bg-zinc-100 disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span>{safePage + 1} / {pages}</span>
          <button type="button" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)} className="grid h-7 w-7 place-items-center rounded-md hover:bg-zinc-100 disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </span>
      </footer>
      {active ? (
        <ChatDetail
          chat={active}
          onClose={() => setOpenId(null)}
          onPrev={activeIndex > 0 ? () => setOpenId(filtered[activeIndex - 1].id) : undefined}
          onNext={activeIndex >= 0 && activeIndex < filtered.length - 1 ? () => setOpenId(filtered[activeIndex + 1].id) : undefined}
        />
      ) : null}
    </section>
  )
}

function ModelDots({ models, extra }: { models: string[]; extra: number }) {
  const t = useTranslations('overview.page')
  return (
    <span className="inline-flex items-center gap-1">
      {models.slice(0, 3).map((model) => (
        <span key={model} title={t(`models.${model}`)} className="grid h-4 w-4 place-items-center rounded-full text-[8px] font-semibold text-white" style={{ background: modelColor[model] }}>
          {model.slice(0, 1).toUpperCase()}
        </span>
      ))}
      {extra > 0 ? <span className="text-[11px] text-zinc-400">+{extra}</span> : null}
    </span>
  )
}

function ChoiceMenu({
  label,
  options,
  selected,
  mode,
  onMode,
  onToggle,
}: {
  label: string
  options: { id: string; label: string }[]
  selected: string[]
  mode: 'or' | 'and'
  onMode: (mode: 'or' | 'and') => void
  onToggle: (id: string) => void
}) {
  const t = useTranslations('overview.page')
  return (
    <Menu
      align="right"
      panelClassName="w-64 p-2"
      trigger={() => (
        <button type="button" className="flex h-8 items-center gap-1 rounded-lg border border-nuw-line px-2 text-[13px]">
          {selected.length ? `${label} · ${selected.length}` : label}
        </button>
      )}
    >
      <div className="mb-1 flex gap-1 p-1">
        {(['or', 'and'] as const).map((item) => (
          <button key={item} type="button" onClick={() => onMode(item)} className={cn('rounded-md px-2 py-1 text-[12px] hover:bg-nuw-buttonHover hover:text-white', mode === item ? 'bg-nuw-button text-white' : 'text-zinc-500')}>
            {t(`match.${item}`)}
          </button>
        ))}
      </div>
      {options.map((option) => (
        <label key={option.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-zinc-50">
          <input type="checkbox" checked={selected.includes(option.id)} onChange={() => onToggle(option.id)} />
          {option.label}
        </label>
      ))}
    </Menu>
  )
}
