'use client'

import { useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ListChecks, Sparkles } from 'lucide-react'
import type { PromptRecord } from '@/data/perception'
import { Modal } from '@/components/ui/overlay'
import { Pager } from '@/components/perception/bits'
import { cn } from '@/lib/cn'
import { errorText } from '@/lib/v2'

const pageSize = 8

export function FactsView({
  brandName,
  text,
  onText,
  selected,
  onSelected,
  checking,
  onCheck,
  onEdit,
  open,
  onOpen,
  prompts,
  factLimit,
  promptLimit,
  saved,
  result,
  onSave,
  onSuggest,
}: {
  brandName: string
  text: string
  onText: (value: string) => void
  selected: string[]
  onSelected: (ids: string[]) => void
  checking: boolean
  onCheck: () => void
  onEdit: () => void
  open: boolean
  onOpen: (open: boolean) => void
  prompts: PromptRecord[]
  factLimit: number
  promptLimit: number
  saved: boolean
  result: string | null
  onSave: () => Promise<void>
  onSuggest: () => Promise<string[]>
}) {
  const t = useTranslations('perception.page')
  const facts = countFacts(text)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<'save' | 'suggest' | null>(null)
  const box = useRef<HTMLTextAreaElement>(null)

  const run = async (kind: 'save' | 'suggest', work: () => Promise<void>) => {
    setBusy(kind)
    setError('')
    try {
      await work()
    } catch (caught) {
      setError(errorText(caught))
    } finally {
      setBusy(null)
    }
  }

  const change = (value: string) => {
    const next = countFacts(value)
    if (next > factLimit) {
      setError(t('factsLimit', { max: factLimit }))
      return
    }
    setError('')
    onText(value)
  }

  return (
    <div className="mx-auto flex min-h-[520px] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      {checking ? (
        <>
          <h2 className="text-[22px] font-semibold">{t('checkingTitle')}</h2>
          <p className="mt-2 max-w-md text-[14px] leading-6 text-zinc-500">{t('checkingBody', { prompts: selected.length, facts, brand: brandName })}</p>
          <button type="button" onClick={onEdit} className="mt-4 text-[13px] text-nuw-button hover:underline">
            {t('editFacts')}
          </button>
        </>
      ) : result ? (
        <>
          <h2 className="text-[22px] font-semibold">{t('checkDoneTitle')}</h2>
          <p className="mt-2 max-w-md text-[14px] leading-6 text-zinc-500">{result}</p>
        </>
      ) : facts > 0 ? (
        <>
          <h2 className="text-[22px] font-semibold">{t('factsReadyTitle')}</h2>
          <p className="mt-2 max-w-md text-[14px] leading-6 text-zinc-500">{t('factsReadyBody', { count: facts })}</p>
        </>
      ) : (
        <>
          <h2 className="text-[22px] font-semibold">{t('factsEmptyTitle')}</h2>
          <p className="mt-2 max-w-md text-[14px] leading-6 text-zinc-500">{t('factsEmptyBody')}</p>
        </>
      )}
      <textarea
        ref={box}
        value={text}
        onChange={(event) => change(event.target.value)}
        placeholder={t('factsPlaceholder')}
        rows={5}
        className="mt-6 w-full resize-y rounded-xl border border-sky-200 px-4 py-3 text-left text-[14px] leading-6 outline-none focus:border-nuw-primary"
      />
      {error ? <p className="mt-2 w-full text-left text-[13px] text-rose-600">{error}</p> : null}
      <div className="mt-3 flex w-full flex-wrap items-center justify-between gap-2">
        <p className={cn('text-[13px]', facts > factLimit ? 'text-rose-600' : 'text-zinc-500')}>
          {t('factsCount', { count: Math.min(facts, factLimit), max: factLimit })}
          {facts > 0 ? <span className="ml-2">{saved ? t('factsSavedNote') : t('factsUnsavedNote')}</span> : null}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => {
              if (text.trim()) {
                setError(t('factsReplace'))
                return
              }
              void run('suggest', async () => {
                const suggested = await onSuggest()
                if (!suggested.length) {
                  setError(t('factsNoSuggestion'))
                  return
                }
                change(suggested.slice(0, factLimit).join('\n'))
              })
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-[13px] text-sky-700 hover:bg-sky-100 disabled:text-zinc-400"
          >
            <Sparkles className="h-3.5 w-3.5" /> {busy === 'suggest' ? t('suggestingFacts') : t('buildFacts')}
          </button>
          <button
            type="button"
            disabled={busy !== null || saved}
            onClick={() => void run('save', onSave)}
            className="rounded-lg bg-nuw-button px-3 py-1.5 text-[13px] text-white hover:bg-nuw-buttonHover disabled:bg-zinc-300"
          >
            {busy === 'save' ? t('saving') : t('saveFacts')}
          </button>
          <button
            type="button"
            onClick={() => {
              if (facts >= factLimit) {
                setError(t('factsLimit', { max: factLimit }))
                return
              }
              setError('')
              if (text.trim()) onText(`${text.replace(/\s+$/, '')}\n`)
              requestAnimationFrame(() => {
                const field = box.current
                if (!field) return
                field.focus()
                field.setSelectionRange(field.value.length, field.value.length)
              })
            }}
            className="rounded-lg border border-nuw-line bg-white px-3 py-1.5 text-[13px] hover:bg-zinc-50"
          >
            {t('addFact')}
          </button>
        </div>
      </div>
      <PromptDialog
        open={open}
        brandName={brandName}
        facts={facts}
        prompts={prompts}
        promptLimit={promptLimit}
        selected={selected}
        onClose={() => onOpen(false)}
        onSelected={onSelected}
        onCheck={() => {
          onCheck()
          onOpen(false)
        }}
      />
      <span className="sr-only">
        <ListChecks className="h-4 w-4" />
      </span>
    </div>
  )
}

function PromptDialog({
  open,
  brandName,
  facts,
  prompts,
  promptLimit,
  selected,
  onClose,
  onSelected,
  onCheck,
}: {
  open: boolean
  brandName: string
  facts: number
  prompts: PromptRecord[]
  promptLimit: number
  selected: string[]
  onClose: () => void
  onSelected: (ids: string[]) => void
  onCheck: () => void
}) {
  const t = useTranslations('perception.page')
  const fullPromptCount = prompts.length
  const topics = Array.from(new Set(prompts.map((item) => item.topic).filter(Boolean)))
  const [topic, setTopic] = useState<'all' | PromptRecord['topic']>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [limitNote, setLimitNote] = useState('')
  const needle = query.trim().toLowerCase()
  const filtered = useMemo(
    () => prompts.filter((item) => (topic === 'all' || item.topic === topic) && fill(item.text, brandName).toLowerCase().includes(needle)),
    [prompts, topic, needle, brandName],
  )
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pages - 1)
  const rows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize)
  const blocked = facts === 0 ? t('writeFactsFirst') : selected.length === 0 ? t('selectPrompt') : ''

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setLimitNote('')
      onSelected(selected.filter((item) => item !== id))
      return
    }
    if (selected.length >= promptLimit) {
      setLimitNote(t('promptsFull', { max: promptLimit }))
      return
    }
    setLimitNote('')
    onSelected([...selected, id])
  }

  const topicCount = (id: 'all' | PromptRecord['topic']) => {
    const pool = id === 'all' ? prompts : prompts.filter((item) => item.topic === id)
    return `${pool.filter((item) => selected.includes(item.id)).length} / ${fullPromptCount}`
  }

  return (
    <Modal open={open} title={t('promptsTitle')} onClose={onClose} panelClassName="max-w-5xl">
      <div className="flex items-start justify-between gap-3 border-b border-nuw-line px-5 py-4">
        <div>
          <h2 className="text-[16px] font-semibold">{t('promptsTitle')}</h2>
          <p className="mt-1 text-[13px] text-zinc-500">{t('promptsBody', { max: promptLimit })}</p>
        </div>
        <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-700" aria-label={t('close')}>×</button>
      </div>
      <div className="grid min-h-[420px] md:grid-cols-[220px_1fr]">
        <aside className="border-b border-nuw-line p-3 md:border-b-0 md:border-r">
          <p className="px-2 py-1 text-[12px] font-medium text-zinc-400">{t('topics')}</p>
          {[['all', t('allPrompts')] as const, ...topics.map((id) => [id, id] as const)].map(([id, label]) => (
            <button key={id} type="button" onClick={() => { setTopic(id); setPage(0) }} className={cn('flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-50', topic === id && 'bg-zinc-100')}>
              <span className="truncate">{label}</span>
              <span className="shrink-0 text-[12px] text-zinc-400">{topicCount(id)}</span>
            </button>
          ))}
        </aside>
        <div className="p-3">
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0) }} placeholder={t('searchPrompts')} className="mb-2 w-full rounded-lg border border-nuw-line px-3 py-2 text-[13px] outline-none focus:border-nuw-primary" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead className="text-[12px] text-zinc-400">
                <tr>
                  <th className="w-8 py-2" />
                  <th className="py-2 font-medium">{t('prompt')}</th>
                  <th className="py-2 font-medium">{t('visibility')}</th>
                  <th className="py-2 font-medium">{t('sov')}</th>
                  <th className="py-2 font-medium">{t('sentiment')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-zinc-500">{t('noTerm')}</td></tr>
                ) : rows.map((item) => {
                  const on = selected.includes(item.id)
                  return (
                    <tr key={item.id} className={cn('border-t border-nuw-line', on && 'bg-indigo-50/70')}>
                      <td className="py-2">
                        <input type="checkbox" checked={on} onChange={() => toggle(item.id)} aria-label={fill(item.text, brandName)} />
                      </td>
                      <td className="max-w-md py-2 pr-3">{fill(item.text, brandName)}</td>
                      <td className="py-2 tabular-nums">{item.visibility}%</td>
                      <td className="py-2 tabular-nums">{item.sov}%</td>
                      <td className="py-2 tabular-nums">{item.sentiment ?? 'N/A'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <Pager page={safePage} pages={pages} onPage={setPage} previousLabel={t('pagePrev')} nextLabel={t('pageNext')} />
            <p className="text-[12px] text-zinc-500">{t('showingItems', { shown: rows.length, total: fullPromptCount })}</p>
          </div>
        </div>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-nuw-line px-5 py-3">
        <p className={cn('text-[13px]', limitNote || blocked ? 'text-rose-600' : 'text-zinc-500')}>
          {limitNote || blocked || t('promptsSelected', { count: selected.length, max: promptLimit })}
        </p>
        <button type="button" disabled={Boolean(blocked)} onClick={onCheck} className="rounded-lg bg-nuw-button px-3 py-2 text-[13px] text-white disabled:cursor-not-allowed disabled:bg-zinc-300">
          {t('factCheck')}
        </button>
      </footer>
    </Modal>
  )
}

function countFacts(value: string) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).length
}

function fill(text: string, brand: string) {
  return text.replaceAll('{brand}', brand)
}
