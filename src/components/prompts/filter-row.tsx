'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Check, ChevronDown, ChevronLeft, ChevronRight, Lock, Search } from 'lucide-react'
import { brandingTags, intentTags, promptModels } from '@/data/prompts'
import { useCatalog, type CatalogEngine } from '@/lib/catalog'
import { BrandMark } from '@/components/shell/brand-mark'
import { filtersAreClear, usePrompts, type MetricKey, type PromptFilters, type RangeId } from '@/components/prompts/prompts-context'
import { topicLabel } from '@/components/prompts/bits'
import { useBrand } from '@/components/workspace/workspace-context'
import { Menu, Modal, useMenu, useToast } from '@/components/ui/overlay'
import { cn } from '@/lib/cn'
import { errorText } from '@/lib/v2'

const ranges: RangeId[] = ['all', '7', '14', '30', '90', '180', '365', 'custom']
const metricKeys: MetricKey[] = ['visibility', 'sov', 'sentiment', 'position', 'winRate']

export function FilterRow({ compact }: { compact?: boolean }) {
  const t = useTranslations('prompts.page')
  const brand = useBrand()
  const { filters, setFilters, resetFilters, topics, competitors, extraBrands, addBrand } = usePrompts()
  const { push } = useToast()
  const [brandQuery, setBrandQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [brandName, setBrandName] = useState('')
  const [brandError, setBrandError] = useState('')
  const [brandSaving, setBrandSaving] = useState(false)

  const tracked = { id: 'you', name: brand.name, color: brand.color, initials: brand.initials }
  const catalog = [tracked, ...competitors, ...extraBrands]
  const brandMatches = catalog.filter((item) => item.name.toLowerCase().includes(brandQuery.trim().toLowerCase()))
  const selectedBrands = filters.brandIds ?? catalog.map((item) => item.id)

  const toggleBrand = (id: string) => {
    setFilters((current) => {
      const all = catalog.map((item) => item.id)
      const base = current.brandIds ?? all
      const next = base.includes(id) ? base.filter((item) => item !== id) : [...base, id]
      return { ...current, brandIds: next.length === all.length ? null : next }
    })
  }

  const saveBrand = async () => {
    const trimmed = brandName.trim()
    if (!trimmed) {
      setBrandError(t('brandRequired'))
      return
    }
    if (catalog.some((item) => item.name.toLowerCase() === trimmed.toLowerCase())) {
      setBrandError(t('brandExists'))
      return
    }
    setBrandSaving(true)
    try {
      await addBrand(trimmed)
    } catch (caught) {
      setBrandError(errorText(caught))
      return
    } finally {
      setBrandSaving(false)
    }
    setAddOpen(false)
    setBrandName('')
    setBrandError('')
    push({ title: t('brandAdded'), body: t('brandAddedBody', { name: trimmed }) })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-nuw-line px-3 py-2.5">
      <ViewMenu />
      {compact ? null : (
        <Menu
          panelClassName="w-72"
          trigger={() => (
            <button type="button" className="flex h-8 max-w-[220px] items-center gap-1.5 rounded-lg border border-nuw-line bg-white px-2.5 text-[13px]">
              <BrandMark initials={brand.initials} color={brand.color} size={16} />
              <span className="truncate">{brand.name}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            </button>
          )}
        >
          <label className="mb-1 flex items-center gap-2 px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-zinc-400" />
            <input value={brandQuery} onChange={(event) => setBrandQuery(event.target.value)} placeholder={t('searchBrands')} className="w-full bg-transparent text-[13px] outline-none" />
          </label>
          <CheckRow checked={filters.brandIds === null} label={t('allBrands')} onClick={() => setFilters((current) => ({ ...current, brandIds: null }))} />
          <p className="px-2 pb-1 pt-2 text-[11px] font-medium text-zinc-400">{t('trackedBrand')}</p>
          {brandMatches.filter((item) => item.id === 'you').map((item) => (
            <BrandRow key={item.id} name={item.name} initials={item.initials} color={item.color} you checked={selectedBrands.includes(item.id)} onClick={() => toggleBrand(item.id)} youLabel={t('you')} />
          ))}
          <p className="px-2 pb-1 pt-2 text-[11px] font-medium text-zinc-400">{t('allBrands')}</p>
          {brandMatches.filter((item) => item.id !== 'you').map((item) => (
            <BrandRow key={item.id} name={item.name} initials={item.initials} color={item.color} checked={selectedBrands.includes(item.id)} onClick={() => toggleBrand(item.id)} />
          ))}
          {brandMatches.length === 0 ? <p className="px-2 py-2 text-[13px] text-zinc-500">{t('noBrandMatch')}</p> : null}
          <OpenAdd onClick={() => { setAddOpen(true); setBrandName(''); setBrandError('') }} label={t('addBrand')} />
        </Menu>
      )}
      {compact ? null : <RangeMenu />}
      <AllFilters />
      {filters.brandIds !== null ? <p className="text-[12px] text-zinc-500">{t('brandNote', { brand: brand.name })}</p> : null}
      {filters.view !== 'default' || filters.tagMode !== 'or' || !filtersAreClear(filters) ? (
        <span className="ml-auto flex items-center gap-3 text-[13px]">
          <button type="button" onClick={resetFilters} className="text-zinc-600 hover:text-zinc-900">{t('reset')}</button>
          <button type="button" onClick={() => push({ title: t('filtersSaved'), body: t('filtersSavedBody') })} className="font-medium text-sky-600">{t('save')}</button>
        </span>
      ) : null}

      <Modal open={addOpen} title={t('addBrand')} onClose={() => setAddOpen(false)}>
        <div className="p-5">
          <h2 className="text-base font-semibold">{t('addBrand')}</h2>
          <p className="mt-1 text-[13px] leading-5 text-zinc-500">{t('addBrandBody')}</p>
          <label className="mt-4 block text-[13px] font-medium">
            {t('brandName')}
            <input
              value={brandName}
              onChange={(event) => { setBrandName(event.target.value); setBrandError('') }}
              placeholder={t('brandPlaceholder')}
              className="mt-1 w-full rounded-lg border border-nuw-line px-3 py-2 text-[13px] font-normal outline-none focus:border-nuw-primary"
            />
          </label>
          {brandError ? <p className="mt-2 text-[13px] text-rose-600">{brandError}</p> : null}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setAddOpen(false)} className="h-9 rounded-lg px-3 text-[13px] hover:bg-zinc-100">{t('cancel')}</button>
            <button type="button" onClick={() => void saveBrand()} disabled={brandSaving} className="h-9 rounded-lg bg-nuw-button px-3 text-[13px] text-white hover:bg-nuw-buttonHover disabled:bg-zinc-400">{brandSaving ? t('saving') : t('add')}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ViewMenu() {
  const t = useTranslations('prompts.page')
  const { filters, setFilters } = usePrompts()
  const [query, setQuery] = useState('')
  const pick = (view: PromptFilters['view']) => {
    setFilters((current) => ({ ...current, view, models: view === 'chatgpt' ? ['chatgpt'] : null }))
  }
  const showDefault = t('view').toLowerCase().includes(query.trim().toLowerCase())
  const showChat = t('viewChatgpt').toLowerCase().includes(query.trim().toLowerCase())
  return (
    <Menu
      panelClassName="w-56"
      trigger={() => (
        <button type="button" className="flex h-8 items-center gap-1.5 rounded-lg border border-nuw-line bg-white px-2.5 text-[13px]">
          {t(filters.view === 'default' ? 'view' : 'viewChatgpt')}
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
        </button>
      )}
    >
      <label className="mb-1 flex items-center gap-2 px-2 py-1.5">
        <Search className="h-3.5 w-3.5 text-zinc-400" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchFilters')} className="w-full bg-transparent text-[13px] outline-none" />
      </label>
      {showDefault ? <CheckRow checked={filters.view === 'default'} label={t('view')} onClick={() => pick('default')} /> : null}
      <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('savedFilters')}</p>
      {showChat ? <CheckRow checked={filters.view === 'chatgpt'} label={t('viewChatgpt')} onClick={() => pick('chatgpt')} /> : null}
      {!showDefault && !showChat ? <p className="px-2 py-2 text-[13px] text-zinc-500">{t('noFilterMatch')}</p> : null}
      <p className="px-2 py-2 text-[12px] leading-5 text-zinc-500">{t('viewNote')}</p>
    </Menu>
  )
}

function RangeMenu() {
  const t = useTranslations('prompts.page')
  const locale = useLocale()
  const { filters, setFilters } = usePrompts()
  const [cursor, setCursor] = useState(() => new Date(2026, 9, 1))
  const [anchor, setAnchor] = useState<string | null>(null)

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(cursor)
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(new Date(2026, 9, 12 + index)),
  )
  const cells = monthCells(cursor.getFullYear(), cursor.getMonth())
  const highlight = highlightRange(filters)

  const pickDay = (iso: string) => {
    if (!anchor) {
      setAnchor(iso)
      setFilters((current) => ({ ...current, range: 'custom', customStart: iso, customEnd: iso }))
      return
    }
    const [start, end] = anchor <= iso ? [anchor, iso] : [iso, anchor]
    setAnchor(null)
    setFilters((current) => ({ ...current, range: 'custom', customStart: start, customEnd: end }))
  }

  return (
    <Menu
      panelClassName="w-auto p-0"
      trigger={() => (
        <button type="button" className="flex h-8 items-center gap-1.5 rounded-lg border border-nuw-line bg-white px-2.5 text-[13px]">
          {filters.range === 'custom' ? t('customRange') : t(filters.range === 'all' ? 'timeAll' : `time${filters.range}`)}
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
        </button>
      )}
    >
      <div className="flex max-w-[calc(100vw-2rem)] flex-col sm:flex-row">
        <div className="w-full border-b border-nuw-line p-2 sm:w-44 sm:border-b-0 sm:border-r">
          <div className="mb-2 grid grid-cols-1 gap-1">
            {(['period', 'month', 'year'] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilters((current) => ({ ...current, compare: id }))}
                className={cn('rounded-md px-2 py-1 text-[12px]', filters.compare === id ? 'bg-zinc-100 font-medium' : 'text-zinc-500 hover:bg-zinc-50')}
              >
                {t(id === 'period' ? 'vsPeriod' : id === 'month' ? 'vsMonth' : 'vsYear')}
              </button>
            ))}
          </div>
          {ranges.map((id) => (
            <CheckRow
              key={id}
              checked={filters.range === id}
              label={t(id === 'all' ? 'timeAll' : id === 'custom' ? 'customRange' : `time${id}`)}
              onClick={() => {
                setAnchor(null)
                setFilters((current) => ({ ...current, range: id, customStart: id === 'custom' ? current.customStart : null, customEnd: id === 'custom' ? current.customEnd : null }))
              }}
            />
          ))}
        </div>
        <div className="p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <button type="button" aria-label={t('prevMonth')} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="grid h-7 w-7 place-items-center rounded-md hover:bg-zinc-100">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-[13px] font-medium capitalize">{monthLabel}</p>
            <button type="button" aria-label={t('nextMonth')} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="grid h-7 w-7 place-items-center rounded-md hover:bg-zinc-100">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-zinc-400">
            {weekdays.map((day) => (
              <span key={day} className="py-1">{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, index) => {
              if (!day) return <span key={`e${index}`} />
              const iso = toIso(cursor.getFullYear(), cursor.getMonth(), day)
              const on = highlight.includes(iso)
              return (
                <button key={iso} type="button" onClick={() => pickDay(iso)} className={cn('h-8 rounded-md text-[13px] hover:bg-zinc-100', on && 'bg-nuw-button text-white hover:bg-nuw-buttonHover')}>
                  {day}
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-[12px] text-zinc-500">{rangeCaption(filters, t)}</p>
          <p className="mt-1 max-w-xs text-[12px] leading-5 text-zinc-500">{t('rangeNote')}</p>
        </div>
      </div>
    </Menu>
  )
}

function AllFilters() {
  const t = useTranslations('prompts.page')
  const { filters, setFilters, resetFilters, topics } = usePrompts()
  const [section, setSection] = useState<'tags' | 'models' | 'topics' | 'mentions' | 'metrics'>('tags')
  const [query, setQuery] = useState('')
  const [tagGroup, setTagGroup] = useState<'branding' | 'intent' | 'persona' | null>(null)
  const { push } = useToast()

  const activeCount = countActiveFilters(filters)
  const sections = [
    ['tags', t('tags')],
    ['models', t('models')],
    ['topics', t('topics')],
    ['mentions', t('mentions')],
    ['metrics', t('metrics')],
  ] as const
  const visibleSections = sections.filter(([, label]) => label.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <Menu
      panelClassName="w-auto p-0"
      trigger={() => (
        <button type="button" className="flex h-8 items-center gap-1.5 rounded-lg border border-nuw-line bg-white px-2.5 text-[13px]">
          {activeCount ? t('filtersCount', { count: activeCount }) : t('filters')}
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
        </button>
      )}
    >
      <div className="flex max-w-[calc(100vw-2rem)]">
        <div className="w-44 border-r border-nuw-line p-2">
          <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('filterBy')}</p>
          <label className="mb-1 flex items-center gap-2 px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-zinc-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('search')} className="w-full bg-transparent text-[13px] outline-none" />
          </label>
          {visibleSections.length === 0 ? <p className="px-2 py-2 text-[13px] text-zinc-500">{t('noFilterMatch')}</p> : null}
          {visibleSections.map(([id, label]) => (
            <button key={id} type="button" onClick={() => { setSection(id); setTagGroup(null) }} className={cn('flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100', section === id && 'bg-zinc-100')}>
              {label}
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            </button>
          ))}
          {activeCount ? (
            <button type="button" onClick={resetFilters} className="mt-1 w-full rounded-lg px-2 py-2 text-left text-[13px] font-medium hover:bg-zinc-100">
              {t('resetFilters')}
            </button>
          ) : null}
        </div>
        <div className="w-64 p-2">
          {section === 'tags' ? (
            <TagPanel group={tagGroup} onGroup={setTagGroup} />
          ) : null}
          {section === 'models' ? <ModelPanel onUpgrade={() => push({ title: t('upgradeTitle'), body: t('upgradeBody') })} /> : null}
          {section === 'topics' ? <TopicPanel topics={topics.map((topic) => ({ id: topic.id, label: topicLabel(topic, t) }))} /> : null}
          {section === 'mentions' ? <MentionPanel /> : null}
          {section === 'metrics' ? <MetricPanel /> : null}
        </div>
      </div>
    </Menu>
  )
}

function TagPanel({ group, onGroup }: { group: 'branding' | 'intent' | 'persona' | null; onGroup: (group: 'branding' | 'intent' | 'persona' | null) => void }) {
  const t = useTranslations('prompts.page')
  const { filters, setFilters, tags, tagName } = usePrompts()
  const [query, setQuery] = useState('')
  const groups = [
    { id: 'branding' as const, label: t('groupBranding'), tags: [...brandingTags] as string[] },
    { id: 'intent' as const, label: t('groupIntent'), tags: [...intentTags] as string[] },
    { id: 'persona' as const, label: t('groupPersona'), tags: tags.map((tag) => tag.id) },
  ]
  const label = (id: string) => ((brandingTags as readonly string[]).includes(id) || (intentTags as readonly string[]).includes(id) ? t(id) : tagName(id))
  const all = groups.flatMap((item) => item.tags)
  const toggle = (id: string) => {
    setFilters((current) => {
      const base = current.tags ?? all
      const next = base.includes(id) ? base.filter((item) => item !== id) : [...base, id]
      return { ...current, tags: next.length === all.length ? null : next }
    })
  }
  const selected = filters.tags ?? all
  const shown = groups.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()))
  return (
    <div>
      <label className="mb-1 flex items-center gap-2 px-2 py-1.5">
        <Search className="h-3.5 w-3.5 text-zinc-400" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('search')} className="w-full bg-transparent text-[13px] outline-none" />
      </label>
      <CheckRow checked={filters.tags === null} label={t('allTags')} onClick={() => setFilters((current) => ({ ...current, tags: null }))} />
      <div className="my-1 grid grid-cols-2 rounded-lg bg-zinc-100 p-0.5 text-[12px]">
        {(['or', 'and'] as const).map((mode) => (
          <button key={mode} type="button" onClick={() => setFilters((current) => ({ ...current, tagMode: mode }))} className={cn('rounded-md py-1', filters.tagMode === mode ? 'bg-white font-medium shadow-sm' : 'text-zinc-500')}>
            {t(mode === 'or' ? 'tagOr' : 'tagAnd')}
          </button>
        ))}
      </div>
      {group ? (
        <div>
          <button type="button" onClick={() => onGroup(null)} className="mb-1 flex items-center gap-1 px-2 py-1 text-[12px] text-zinc-500 hover:text-zinc-800">
            <ChevronLeft className="h-3.5 w-3.5" /> {t(group === 'branding' ? 'groupBranding' : group === 'intent' ? 'groupIntent' : 'groupPersona')}
          </button>
          {groups.find((item) => item.id === group)?.tags.map((id) => (
            <CheckRow key={id} checked={selected.includes(id)} label={label(id)} onClick={() => toggle(id)} />
          ))}
        </div>
      ) : (
        shown.map((item) => (
          <button key={item.id} type="button" onClick={() => onGroup(item.id)} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100">
            <span>{item.label}</span>
            <span className="flex items-center gap-1 text-zinc-400">{item.tags.length} <ChevronRight className="h-3.5 w-3.5" /></span>
          </button>
        ))
      )}
      <p className="px-2 py-2 text-[12px] leading-5 text-zinc-500">{filters.tagMode === 'and' ? t('tagAndNote') : t('tagOrNote')}</p>
    </div>
  )
}

function ModelPanel({ onUpgrade }: { onUpgrade: () => void }) {
  const t = useTranslations('prompts.page')
  const { filters, setFilters } = usePrompts()
  const catalog = useCatalog()
  const look = (id: string) => [...promptModels.active, ...promptModels.available, ...promptModels.locked].find((model) => model.id === id)
  const asModel = (engine: CatalogEngine) => ({ id: engine.id, label: engine.label, glyph: look(engine.id)?.glyph ?? engine.label.slice(0, 1), color: look(engine.id)?.color ?? '#3f3f46' })
  const models = { active: catalog.active.map(asModel), available: catalog.available.map(asModel), locked: [...catalog.comingSoon, ...catalog.locked].map(asModel) }
  const activeIds = models.active.map((model) => model.id)
  const selected = filters.models ?? activeIds
  const toggle = (id: string) => {
    setFilters((current) => {
      const base = current.models ?? activeIds
      const next = base.includes(id) ? base.filter((item) => item !== id) : [...base, id]
      const same = next.length === activeIds.length && activeIds.every((item) => next.includes(item))
      return { ...current, models: same ? null : next, view: same ? 'default' : current.view }
    })
  }
  return (
    <div>
      <CheckRow checked={filters.models === null} label={t('allModels')} onClick={() => setFilters((current) => ({ ...current, models: null, view: 'default' }))} />
      <p className="px-2 pb-1 pt-2 text-[11px] font-medium text-zinc-400">{t('activeModels')}</p>
      {catalog.error ? <p className="px-2 py-2 text-[12px] leading-5 text-rose-600">{catalog.error}</p> : null}
      {models.active.map((model) => (
        <ModelRow key={model.id} label={model.label} glyph={model.glyph} color={model.color} checked={selected.includes(model.id)} onClick={() => toggle(model.id)} />
      ))}
      {models.available.length ? <p className="px-2 pb-1 pt-2 text-[11px] font-medium text-zinc-400">{t('availableModels')}</p> : null}
      {models.available.map((model) => (
        <ModelRow key={model.id} label={model.label} glyph={model.glyph} color={model.color} checked={selected.includes(model.id)} onClick={() => toggle(model.id)} />
      ))}
      {models.locked.map((model) => (
        <button key={model.id} type="button" onClick={onUpgrade} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] text-zinc-400 hover:bg-zinc-50">
          <Glyph glyph={model.glyph} color={model.color} />
          <span className="flex-1">{model.label}</span>
          <Lock className="h-3.5 w-3.5" />
          <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px]">{t('upgrade')}</span>
        </button>
      ))}
      {filters.models?.length === 0 ? <p className="px-2 py-2 text-[12px] leading-5 text-rose-600">{t('pickModel')}</p> : null}
      <p className="px-2 py-2 text-[12px] leading-5 text-zinc-500">{t('modelNote')}</p>
    </div>
  )
}

function TopicPanel({ topics }: { topics: { id: string; label: string }[] }) {
  const t = useTranslations('prompts.page')
  const { filters, setFilters } = usePrompts()
  const ids = topics.map((topic) => topic.id)
  const selected = filters.topics ?? ids
  const toggle = (id: string) => {
    setFilters((current) => {
      const base = current.topics ?? ids
      const next = base.includes(id) ? base.filter((item) => item !== id) : [...base, id]
      return { ...current, topics: next.length === ids.length ? null : next }
    })
  }
  return (
    <div>
      <CheckRow checked={filters.topics === null} label={t('allTopics')} onClick={() => setFilters((current) => ({ ...current, topics: null }))} />
      {topics.map((topic) => (
        <CheckRow key={topic.id} checked={selected.includes(topic.id)} label={topic.label} onClick={() => toggle(topic.id)} />
      ))}
      {filters.topics?.length === 0 ? <p className="px-2 py-2 text-[12px] leading-5 text-rose-600">{t('pickTopic')}</p> : null}
    </div>
  )
}

function MentionPanel() {
  const t = useTranslations('prompts.page')
  const { filters, setFilters } = usePrompts()
  const options = [
    ['all', t('mentionAll')],
    ['mentioned', t('mentioned')],
    ['not', t('notMentioned')],
  ] as const
  return (
    <div>
      {options.map(([id, label]) => (
        <CheckRow key={id} checked={filters.mentions === id} label={label} onClick={() => setFilters((current) => ({ ...current, mentions: id }))} />
      ))}
      <p className="px-2 py-2 text-[12px] leading-5 text-zinc-500">{t('mentionNote')}</p>
    </div>
  )
}

function MetricPanel() {
  const t = useTranslations('prompts.page')
  const { filters, setFilters } = usePrompts()
  return (
    <div className="space-y-2 px-1 py-1">
      {metricKeys.map((key) => {
        const bound = filters.metrics[key]
        const invalid = [bound.min, bound.max].some((value) => value !== '' && Number.isNaN(Number(value)))
        return (
          <div key={key}>
            <p className="mb-1 text-[12px] text-zinc-500">{t(key === 'sov' ? 'sovFull' : key === 'winRate' ? 'winRateFull' : key)}</p>
            <div className="grid grid-cols-2 gap-2">
              {(['min', 'max'] as const).map((edge) => (
                <input
                  key={edge}
                  value={bound[edge]}
                  inputMode="decimal"
                  placeholder={t(edge)}
                  onChange={(event) => {
                    const value = event.target.value
                    setFilters((current) => ({ ...current, metrics: { ...current.metrics, [key]: { ...current.metrics[key], [edge]: value } } }))
                  }}
                  className="h-8 rounded-lg border border-nuw-line px-2 text-[13px] outline-none focus:border-nuw-primary"
                />
              ))}
            </div>
            {invalid ? <p className="mt-1 text-[12px] text-rose-600">{t('metricNumber')}</p> : null}
          </div>
        )
      })}
      <p className="text-[12px] leading-5 text-zinc-500">{t('metricNote')}</p>
    </div>
  )
}

function CheckRow({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-zinc-100">
      <span className={cn('grid h-4 w-4 place-items-center rounded border', checked ? 'border-nuw-primary bg-nuw-primary text-white' : 'border-zinc-300')}>
        {checked ? <Check className="h-3 w-3" /> : null}
      </span>
      <span className="truncate">{label}</span>
    </button>
  )
}

function BrandRow({ name, initials: mark, color, checked, onClick, you, youLabel }: { name: string; initials: string; color: string; checked: boolean; onClick: () => void; you?: boolean; youLabel?: string }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-zinc-100">
      <span className={cn('grid h-4 w-4 place-items-center rounded border', checked ? 'border-nuw-primary bg-nuw-primary text-white' : 'border-zinc-300')}>
        {checked ? <Check className="h-3 w-3" /> : null}
      </span>
      <BrandMark initials={mark} color={color} size={16} />
      <span className="truncate">{name}</span>
      {you ? <span className="ml-auto text-[12px] font-medium text-emerald-600">{youLabel}</span> : null}
    </button>
  )
}

function ModelRow({ label, glyph, color, checked, onClick }: { label: string; glyph: string; color: string; checked: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-zinc-100">
      <span className={cn('grid h-4 w-4 place-items-center rounded border', checked ? 'border-nuw-primary bg-nuw-primary text-white' : 'border-zinc-300')}>
        {checked ? <Check className="h-3 w-3" /> : null}
      </span>
      <Glyph glyph={glyph} color={color} />
      <span className="truncate">{label}</span>
    </button>
  )
}

function Glyph({ glyph, color }: { glyph: string; color: string }) {
  return (
    <span className="grid h-4 w-4 place-items-center rounded-full text-[8px] font-semibold text-white" style={{ background: color }}>
      {glyph.slice(0, 1)}
    </span>
  )
}

function OpenAdd({ onClick, label }: { onClick: () => void; label: string }) {
  const { close } = useMenu()
  return (
    <button
      type="button"
      onClick={() => {
        close()
        onClick()
      }}
      className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100"
    >
      + {label}
    </button>
  )
}

function countActiveFilters(filters: PromptFilters) {
  let count = 0
  if (filters.tags) count += 1
  if (filters.topics) count += 1
  if (filters.mentions !== 'all') count += 1
  if (filters.models) count += 1
  if (Object.values(filters.metrics).some((bound) => bound.min !== '' || bound.max !== '')) count += 1
  return count
}

function monthCells(year: number, month: number) {
  const first = new Date(year, month, 1)
  const pad = (first.getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const cells: Array<number | null> = Array.from({ length: pad }, () => null)
  for (let day = 1; day <= days; day += 1) cells.push(day)
  return cells
}

function toIso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function highlightRange(filters: PromptFilters) {
  if (filters.range === 'custom' && filters.customStart && filters.customEnd) return daysBetween(filters.customStart, filters.customEnd)
  if (filters.range === 'all') return daysBetween('2026-10-12', '2026-10-17')
  const length = Number(filters.range)
  const end = new Date(2026, 9, 17)
  const start = new Date(end)
  start.setDate(end.getDate() - (length - 1))
  return daysBetween(toIso(start.getFullYear(), start.getMonth(), start.getDate()), '2026-10-17')
}

function daysBetween(start: string, end: string) {
  const from = new Date(`${start}T00:00:00`)
  const to = new Date(`${end}T00:00:00`)
  const days: string[] = []
  for (let cursor = from; cursor <= to; cursor.setDate(cursor.getDate() + 1)) {
    days.push(toIso(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()))
  }
  return days
}

function rangeCaption(filters: PromptFilters, t: (key: string, values?: Record<string, string | number>) => string) {
  if (filters.range === 'all') return t('sampleWindow')
  if (filters.range === 'custom') {
    if (!filters.customStart || !filters.customEnd) return t('pickDays')
    return `${filters.customStart} to ${filters.customEnd}`
  }
  const days = highlightRange(filters)
  return t('windowDays', { count: days.length })
}

export function useFilterNote() {
  const t = useTranslations('prompts.page')
  const { filters } = usePrompts()
  return useMemo(() => {
    if (filters.models?.length === 0) return t('pickModel')
    if (filters.range !== 'all' || filters.models) return t('rangeNote')
    return ''
  }, [filters.models, filters.range, t])
}
