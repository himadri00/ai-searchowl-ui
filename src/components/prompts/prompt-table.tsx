'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Archive, Check, ChevronDown, Info, Pencil, Trash2, X } from 'lucide-react'
import { fillBrand, locations, type ColumnId, type PromptItem } from '@/data/prompts'
import { errorText } from '@/lib/v2'
import { MetricValue, VolumeBars } from '@/components/prompts/bits'
import { Flag } from '@/components/prompts/flag'
import type { SortMode, SortState } from '@/components/prompts/query'
import { usePrompts } from '@/components/prompts/prompts-context'
import { BrandMark } from '@/components/shell/brand-mark'
import { useBrand } from '@/components/workspace/workspace-context'
import { Menu, useToast } from '@/components/ui/overlay'
import { cn } from '@/lib/cn'

const headerKey: Record<ColumnId, string> = {
  visibility: 'visibility',
  sov: 'sov',
  sentiment: 'sentiment',
  position: 'position',
  mentions: 'mentions',
  volume: 'volume',
  web: 'web',
  branding: 'branding',
  intent: 'intent',
  facts: 'facts',
  tags: 'tags',
  location: 'location',
  added: 'added',
  winRate: 'winRate',
}

export function PromptTable({
  rows,
  columns,
  mode,
  indicators,
  sort,
  onSort,
  selected,
  onToggle,
  onTogglePage,
  busy,
  onArchive,
  onRestore,
  onDelete,
  onTrack,
  onReject,
  onEdit,
}: {
  rows: PromptItem[]
  columns: ColumnId[]
  mode: 'active' | 'archived' | 'suggested' | 'discovery'
  indicators: 'default' | 'indicators' | 'none'
  sort: SortState
  onSort: (key: ColumnId, mode: SortMode) => void
  selected: string[]
  onToggle: (id: string) => void
  onTogglePage: (checked: boolean) => void
  busy?: boolean
  onArchive?: (id: string) => void
  onRestore?: (id: string) => void
  onDelete?: (id: string) => void
  onTrack?: (id: string) => void
  onReject?: (id: string) => void
  onEdit?: (row: PromptItem) => void
}) {
  const t = useTranslations('prompts.page')
  const brand = useBrand()
  const { competitors, extraBrands, setTags, createTag } = usePrompts()
  const { push } = useToast()
  const saveTags = async (id: string, ids: string[]) => {
    try {
      await setTags(id, ids)
    } catch (caught) {
      push({ title: t('requestFailedTitle'), body: errorText(caught) })
    }
  }
  const newTag = async (id: string, current: string[], name: string) => {
    try {
      const tag = await createTag(name, id)
      await setTags(id, current.includes(tag.id) ? current : [...current, tag.id])
    } catch (caught) {
      push({ title: t('requestFailedTitle'), body: errorText(caught) })
    }
  }
  const [volumeOpen, setVolumeOpen] = useState(false)
  const [learnMore, setLearnMore] = useState(false)
  const [tagFor, setTagFor] = useState<string | null>(null)
  const pageIds = rows.map((row) => row.id)
  const allChecked = pageIds.length > 0 && pageIds.every((id) => selected.includes(id))
  const someChecked = pageIds.some((id) => selected.includes(id))
  const box = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (box.current) box.current.indeterminate = someChecked && !allChecked
  }, [someChecked, allChecked])

  const marks = [
    { id: 'you', name: brand.name, color: brand.color, initials: brand.initials },
    ...competitors,
    ...extraBrands,
  ]
  const hiddenBrands = useHidden(marks)

  return (
    <table className="w-max min-w-full border-collapse text-left">
      <thead className="sticky top-0 z-10 bg-white">
        <tr className="border-b border-nuw-line text-[12px] text-zinc-500">
          <th className="w-10 px-3 py-2">
            <input ref={box} type="checkbox" checked={allChecked} onChange={(event) => onTogglePage(event.target.checked)} aria-label={t('selectPage')} />
          </th>
          <th className="min-w-[320px] px-2 py-2 font-medium">{t('prompt')}</th>
          {columns.map((column) => (
            <th key={column} className={cn('px-2 py-2 font-medium', sort?.key === column && 'bg-zinc-100')}>
              <span className="inline-flex items-center gap-1">
                {column === 'volume' ? (
                  <span className="relative">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => setVolumeOpen((open) => !open)}>
                      {t('volume')} <Info className="h-3 w-3 text-zinc-400" />
                    </button>
                    {volumeOpen ? (
                      <span className="absolute left-0 top-full z-20 mt-2 w-64 rounded-xl bg-zinc-950 p-3 text-[12px] font-normal leading-5 text-white shadow-menu">
                        {t('volumeTip')}{' '}
                        <button type="button" className="underline" onClick={() => setLearnMore((open) => !open)}>{t('learnMore')}</button>
                        {learnMore ? <span className="mt-2 block text-zinc-300">{t('learnMoreBody')}</span> : null}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  t(column === 'added' && mode === 'suggested' ? 'suggestedAt' : headerKey[column])
                )}
                {column === 'tags' && mode === 'suggested' ? <span className="rounded bg-sky-100 px-1 text-[10px] font-medium text-sky-700">{t('beta')}</span> : null}
                <Menu
                  panelClassName="w-48"
                  trigger={() => (
                    <button type="button" aria-label={t('sortBy')} className="text-zinc-400 hover:text-zinc-700">
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  )}
                >
                  <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('sortBy')}</p>
                  {(['high', 'low', 'pos', 'neg'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onSort(column, option)}
                      className={cn('flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100', sort?.key === column && sort.mode === option && 'bg-zinc-100 font-medium')}
                    >
                      {t(option === 'high' ? 'sortHigh' : option === 'low' ? 'sortLow' : option === 'pos' ? 'sortPos' : 'sortNeg')}
                    </button>
                  ))}
                </Menu>
              </span>
            </th>
          ))}
          <th className="w-8" />
        </tr>
      </thead>
      <tbody>
        {busy
          ? Array.from({ length: 6 }, (_, index) => (
              <tr key={index} className="border-b border-nuw-line">
                <td className="px-3 py-3"><span className="block h-4 w-4 rounded bg-zinc-100" /></td>
                <td className="px-2 py-3" colSpan={columns.length + 1}><span className="block h-4 max-w-xl rounded bg-zinc-100" /></td>
              </tr>
            ))
          : null}
        {rows.map((row) => (
          <tr key={row.id} className="group border-b border-nuw-line hover:bg-zinc-50">
            <td className="px-3 py-3 align-top">
              <input type="checkbox" checked={selected.includes(row.id)} onChange={() => onToggle(row.id)} aria-label={t('selectRow')} />
            </td>
            <td className="px-2 py-3 align-top text-[13px] leading-5 text-zinc-800">{fillBrand(row.text, brand.name)}</td>
            {columns.map((column) => (
              <td key={column} className="whitespace-nowrap px-2 py-3 align-top text-[13px]">
                <Cell
                  column={column}
                  row={row}
                  indicators={indicators}
                  marks={marks}
                  hiddenBrands={hiddenBrands}
                  mode={mode}
                  onAddTags={() => setTagFor(row.id)}
                  tagOpen={tagFor === row.id}
                  onCloseTags={() => setTagFor(null)}
                  onSaveTags={(ids) => void saveTags(row.id, ids)}
                  onCreateTag={(name) => void newTag(row.id, row.tagIds, name)}
                />
              </td>
            ))}
            <td className="relative w-8 px-2">
              <span className="absolute right-2 top-2 hidden items-center gap-1 group-hover:flex">
                {mode === 'active' && onArchive ? <IconButton label={t('archiveOne')} onClick={() => onArchive(row.id)}><Archive className="h-3.5 w-3.5" /></IconButton> : null}
                {mode === 'archived' && onRestore ? <IconButton label={t('reactivateOne')} onClick={() => onRestore(row.id)}><Check className="h-3.5 w-3.5" /></IconButton> : null}
                {mode === 'archived' && onDelete ? <IconButton label={t('deleteOne')} onClick={() => onDelete(row.id)}><Trash2 className="h-3.5 w-3.5" /></IconButton> : null}
                {mode === 'discovery' && onEdit ? <IconButton label={t('editPrompt')} onClick={() => onEdit(row)}><Pencil className="h-3.5 w-3.5" /></IconButton> : null}
                {(mode === 'suggested' || mode === 'discovery') && onReject ? <IconButton label={t('rejectOne')} onClick={() => onReject(row.id)}><X className="h-3.5 w-3.5" /></IconButton> : null}
                {(mode === 'suggested' || mode === 'discovery') && onTrack ? <IconButton label={t(mode === 'discovery' ? 'acceptPrompt' : 'trackOne')} onClick={() => onTrack(row.id)}><Check className="h-3.5 w-3.5" /></IconButton> : null}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function useHidden(marks: { id: string }[]) {
  const { filters } = usePrompts()
  if (!filters.brandIds) return new Set<string>()
  const hidden = new Set(marks.map((mark) => mark.id))
  for (const id of filters.brandIds) hidden.delete(id)
  return hidden
}

function Cell({
  column,
  row,
  indicators,
  marks,
  hiddenBrands,
  mode,
  onAddTags,
  tagOpen,
  onCloseTags,
  onSaveTags,
  onCreateTag,
}: {
  column: ColumnId
  row: PromptItem
  indicators: 'default' | 'indicators' | 'none'
  marks: { id: string; name: string; color: string; initials: string }[]
  hiddenBrands: Set<string>
  mode: 'active' | 'archived' | 'suggested' | 'discovery'
  onAddTags: () => void
  tagOpen: boolean
  onCloseTags: () => void
  onSaveTags: (ids: string[]) => void
  onCreateTag: (name: string) => void
}) {
  const t = useTranslations('prompts.page')
  const { tags, tagName } = usePrompts()
  if (column === 'visibility' || column === 'sov' || column === 'web' || column === 'winRate') {
    return <MetricValue value={row[column]} kind="percent" mode={indicators} trend={row.trend} />
  }
  if (column === 'sentiment') return <MetricValue value={row.sentiment} kind="sentiment" mode={indicators} trend={row.trend} />
  if (column === 'position') return <MetricValue value={row.position} kind="position" mode={indicators} trend={row.trend} />
  if (column === 'volume') return <VolumeBars values={row.volume} empty={mode === 'discovery' ? 'circle' : 'dash'} />
  if (column === 'mentions') {
    const shown = row.mentionIds.filter((id) => !hiddenBrands.has(id))
    if (!shown.length) return <span className="text-zinc-300">N/A</span>
    return (
      <span className="inline-flex gap-1">
        {shown.map((id) => {
          const mark = marks.find((item) => item.id === id)
          if (!mark) return null
          return <BrandMark key={id} initials={mark.initials} color={mark.color} size={16} />
        })}
      </span>
    )
  }
  if (column === 'branding') return row.branding ? <span>{t(row.branding)}</span> : <span className="text-zinc-300">N/A</span>
  if (column === 'intent') return row.intent ? <span>{t(row.intent)}</span> : <span className="text-zinc-300">N/A</span>
  if (column === 'facts') return <span className={row.facts ? 'text-emerald-600' : 'text-zinc-300'}>{row.facts ? t('factChecked') : 'N/A'}</span>
  if (column === 'location') {
    const place = locations.find((item) => item.id === row.location.toLowerCase())
    if (!place) return <span className="text-zinc-300">N/A</span>
    const name = t(place.id)
    return <span className="inline-flex items-center gap-1.5"><Flag id={place.id} title={name} />{name}</span>
  }
  if (column === 'added') return <span className="text-zinc-500">{row.addedDays === 0 ? t('lessThanMin') : t('daysAgo', { count: row.addedDays })}</span>
  if (column === 'tags' && mode === 'discovery') {
    return <DiscoveryTags row={row} open={tagOpen} onOpen={onAddTags} onClose={onCloseTags} onSave={onSaveTags} onCreate={onCreateTag} />
  }
  if (column === 'tags') {
    return (
      <span className="relative inline-flex flex-wrap gap-1">
        {row.tagIds.map((id) => (
          <span key={id} className="rounded-full bg-sky-50 px-2 py-0.5 text-[12px] text-sky-700">{tagName(id)}</span>
        ))}
        <button type="button" onClick={onAddTags} className="text-[12px] text-zinc-500 underline">
          {row.tagIds.length ? t('editTags') : t('addTags')}
        </button>
        {tagOpen ? (
          <span className="absolute left-0 top-full z-20 mt-1 w-56 rounded-xl border border-nuw-line bg-white p-2 shadow-menu">
            {tags.length ? null : <p className="px-2 py-1.5 text-[12px] leading-5 text-zinc-500">{t('noTagsYet')}</p>}
            {tags.map((tag) => {
              const on = row.tagIds.includes(tag.id)
              return (
                <button key={tag.id} type="button" onClick={() => onSaveTags(on ? row.tagIds.filter((id) => id !== tag.id) : [...row.tagIds, tag.id])} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-zinc-100">
                  <span className={cn('grid h-4 w-4 place-items-center rounded border', on ? 'border-nuw-primary bg-nuw-primary text-white' : 'border-zinc-300')}>{on ? <Check className="h-3 w-3" /> : null}</span>
                  {tag.name}
                </button>
              )
            })}
            <button type="button" onClick={onCloseTags} className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-[12px] text-zinc-500 hover:bg-zinc-50">{t('close')}</button>
          </span>
        ) : null}
      </span>
    )
  }
  return null
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className="grid h-7 w-7 place-items-center rounded-md border border-nuw-line bg-white text-zinc-600 shadow-sm hover:bg-zinc-50">
      {children}
    </button>
  )
}

function DiscoveryTags({
  row,
  open,
  onOpen,
  onClose,
  onSave,
  onCreate,
}: {
  row: PromptItem
  open: boolean
  onOpen: () => void
  onClose: () => void
  onSave: (ids: string[]) => void
  onCreate: (name: string) => void
}) {
  const t = useTranslations('prompts.page')
  const { tags, tagName } = usePrompts()
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const available = tags.filter((tag) => !row.tagIds.includes(tag.id) && tag.name.toLowerCase().includes(needle))
  const known = tags.find((tag) => tag.name.toLowerCase() === needle)
  const canCreate = needle.length > 0 && !known

  const add = (id: string) => {
    onSave(row.tagIds.includes(id) ? row.tagIds : [...row.tagIds, id])
    setQuery('')
  }
  const create = () => {
    onCreate(query.trim())
    setQuery('')
  }

  return (
    <span className="relative inline-flex flex-wrap gap-1">
      {row.tagIds.map((id) => (
        <button key={id} type="button" onClick={onOpen} className="rounded-full bg-sky-50 px-2 py-0.5 text-[12px] text-sky-700">
          {tagName(id)}
        </button>
      ))}
      {row.tagIds.length ? null : (
        <button type="button" onClick={onOpen} className="text-[12px] text-zinc-500 underline">{t('addTags')}</button>
      )}
      {open ? (
        <span className="absolute left-0 top-full z-20 mt-1 w-64 rounded-xl border border-nuw-line bg-white p-2 shadow-menu">
          <label className="flex items-center gap-2 rounded-lg border border-nuw-line px-2 py-1.5">
            <span className="sr-only">{t('searchOrCreate')}</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchOrCreate')} className="w-full bg-transparent text-[13px] outline-none" />
          </label>
          <p className="px-1 pb-1 pt-2 text-[11px] text-zinc-400">{t('tagHint')}</p>
          <p className="px-1 pt-1 text-[11px] font-medium text-zinc-400">{t('currentTags')}</p>
          <span className="mt-1 flex flex-wrap gap-1">
            {row.tagIds.length ? row.tagIds.map((id) => (
              <button key={id} type="button" onClick={() => onSave(row.tagIds.filter((tag) => tag !== id))} className="rounded-full bg-sky-50 px-2 py-0.5 text-[12px] text-sky-700">
                {tagName(id)}
              </button>
            )) : <span className="px-1 text-[12px] text-zinc-400">{t('noCurrentTags')}</span>}
          </span>
          <p className="px-1 pt-2 text-[11px] font-medium text-zinc-400">{t('availableTags')}</p>
          {available.map((tag) => (
            <button key={tag.id} type="button" onClick={() => add(tag.id)} className="mt-1 block rounded-full bg-sky-50 px-2 py-0.5 text-[12px] text-sky-700">
              {tag.name}
            </button>
          ))}
          {canCreate ? (
            <button type="button" onClick={create} className="mt-2 block text-[13px] font-medium">{t('createTag', { name: query.trim() })}</button>
          ) : null}
          {needle && !available.length && !canCreate ? <p className="mt-2 text-[12px] text-zinc-500">{t('tagNeeded')}</p> : null}
          <button type="button" onClick={onClose} className="mt-2 w-full rounded-lg px-2 py-1.5 text-left text-[12px] text-zinc-500 hover:bg-zinc-50">{t('close')}</button>
        </span>
      ) : null}
    </span>
  )
}
