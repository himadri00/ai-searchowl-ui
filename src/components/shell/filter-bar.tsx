'use client'

import { useTranslations } from 'next-intl'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { dimensionMembers } from '@/data/types'
import type { ModelId, RangeKey } from '@/data/types'
import { useWorkspace } from '@/components/workspace/workspace-context'
import { BrandSwitcher } from '@/components/shell/brand-switcher'
import { Menu } from '@/components/ui/overlay'
import { cn } from '@/lib/cn'

const ranges: RangeKey[] = ['all', '7d', '30d', '90d']

export function FilterBar() {
  const t = useTranslations('shell')
  const page = useTranslations('overview.page')
  const { range, setRange, filters, setFilters } = useWorkspace()
  const active = filters.models.length + filters.countries.length + filters.tags.length
  const rangeLabel = { all: t('timeAll'), '7d': t('time7'), '30d': t('time30'), '90d': t('time90') }[range]

  const toggle = (key: 'models' | 'countries' | 'tags', id: string, all: readonly string[]) => {
    setFilters((current) => {
      const list = current[key] as string[]
      const base = list.length === 0 ? [...all] : [...list]
      const next = base.includes(id) ? base.filter((item) => item !== id) : [...base, id]
      return { ...current, [key]: next.length === all.length ? [] : next }
    })
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-nuw-line bg-white px-4 py-2.5">
      <BrandSwitcher />
      <Menu
        panelClassName="w-48"
        trigger={() => (
          <button type="button" className="flex h-8 items-center gap-1.5 rounded-lg border border-nuw-line bg-white px-2.5 text-[13px]">
            {rangeLabel}
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          </button>
        )}
      >
        {ranges.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setRange(item)}
            className={cn('block w-full rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-zinc-100', range === item && 'bg-zinc-100 font-medium')}
          >
            {{ all: t('timeAll'), '7d': t('time7'), '30d': t('time30'), '90d': t('time90') }[item]}
          </button>
        ))}
        <p className="px-2.5 py-2 text-[12px] leading-5 text-zinc-500">{t('rangeNote')}</p>
      </Menu>
      <Menu
        panelClassName="w-72 p-3"
        trigger={() => (
          <button type="button" className="flex h-8 items-center gap-1.5 rounded-lg border border-nuw-line bg-white px-2.5 text-[13px]">
            <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-500" />
            {active ? t('filtersCount', { count: active }) : t('allFilters')}
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          </button>
        )}
      >
        <p className="text-[13px] leading-5 text-zinc-600">{t('filtersHint')}</p>
        <FilterGroup title={t('models')} options={dimensionMembers.models} selected={filters.models} onToggle={(id) => toggle('models', id, dimensionMembers.models)} label={(id) => page(`models.${id}`)} />
        <FilterGroup title={t('countries')} options={dimensionMembers.countries} selected={filters.countries} onToggle={(id) => toggle('countries', id, dimensionMembers.countries)} label={(id) => page(`countries.${id}`)} />
        <FilterGroup title={t('tags')} options={dimensionMembers.tags} selected={filters.tags} onToggle={(id) => toggle('tags', id, dimensionMembers.tags)} label={(id) => page(`tags.${id}`)} />
        {active ? (
          <button
            type="button"
            className="mt-2 text-[13px] font-medium text-zinc-800 underline"
            onClick={() => setFilters((current) => ({ ...current, models: [], countries: [], tags: [] }))}
          >
            {t('clearFilters')}
          </button>
        ) : null}
      </Menu>
    </div>
  )
}

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
  label,
}: {
  title: string
  options: readonly string[]
  selected: string[]
  onToggle: (id: string) => void
  label: (id: string) => string
}) {
  return (
    <div className="mt-3">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">{title}</p>
      {options.map((id) => (
        <label key={id} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-[13px] hover:bg-zinc-50">
          <input type="checkbox" checked={selected.length === 0 || selected.includes(id)} onChange={() => onToggle(id as ModelId)} />
          {label(id)}
        </label>
      ))}
    </div>
  )
}
