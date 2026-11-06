'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ExternalLink } from 'lucide-react'
import { useCatalog } from '@/lib/catalog'
import { errorText, useV2, v2Get, v2Send } from '@/lib/v2'
import { Modal } from '@/components/ui/overlay'
import { cn } from '@/lib/cn'

type RunEngine = { engine: string; label: string; method: string }
type Country = { code: string; name: string }
type Progress = { engine: string; label: string; total: number; counts: Record<string, number> }
type RunStatus = { run_id: string; status: string; prompt_count: number; result_count: number; finished_count: number; progress: Progress[]; message?: string | null }
type RunResult = {
  result_id: string
  prompt: string
  engine: string
  engine_label: string
  status: string
  message?: string | null
  answer_text?: string | null
  is_target_cited?: boolean | null
  target_position?: number | null
  has_raw_capture: boolean
}
type RawCapture = { capture_json_url?: string | null; page_html_url?: string | null; screenshot_url?: string | null; message: string }

const finished = new Set(['completed', 'complete', 'done', 'succeeded', 'success', 'failed', 'error', 'partial', 'cancelled', 'canceled'])
const isDone = (run: RunStatus) => finished.has(run.status.toLowerCase()) || (run.result_count > 0 && run.finished_count >= run.result_count)

export function RunDialog({ open, promptIds, onClose }: { open: boolean; promptIds: string[]; onClose: () => void }) {
  const t = useTranslations('prompts.page')
  const engineQuery = useV2<{ engines: RunEngine[] }>(open ? 'prompt-runs/engines' : null)
  const countryQuery = useV2<{ countries: Country[] }>(open ? 'prompt-runs/countries' : null)
  const { active, available, locked, comingSoon, error: catalogError } = useCatalog()
  const allowedIds = new Set([...active, ...available].map((item) => item.id))
  const engines = (engineQuery.data?.engines ?? []).filter((item) => allowedIds.has(item.engine))
  const blockedModels = [
    ...locked.map((item) => ({ id: item.id, label: item.label, badge: 'upgrade' as const })),
    ...comingSoon.map((item) => ({ id: item.id, label: item.label, badge: 'soon' as const })),
  ].filter((item) => (engineQuery.data?.engines ?? []).some((engine) => engine.engine === item.id) || item.badge === 'upgrade')
  const countries = countryQuery.data?.countries ?? []
  const [country, setCountry] = useState('')
  const [chosen, setChosen] = useState<string[] | null>(null)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [run, setRun] = useState<RunStatus | null>(null)
  const [startMessage, setStartMessage] = useState('')
  const [results, setResults] = useState<RunResult[] | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedEngines = chosen ?? engines.filter((item) => active.some((entry) => entry.id === item.engine)).map((item) => item.engine)
  const selectedCountry = country || (countries.some((item) => item.code === 'US') ? 'US' : countries[0]?.code ?? '')

  useEffect(() => {
    if (open) return
    if (timer.current) clearTimeout(timer.current)
    setRun(null)
    setResults(null)
    setError(null)
    setChosen(null)
    setStartMessage('')
  }, [open])

  useEffect(() => {
    if (!open || !run || isDone(run)) return
    timer.current = setTimeout(async () => {
      try {
        const next = await v2Get<RunStatus>(`prompt-runs/${encodeURIComponent(run.run_id)}`)
        setRun(next)
        if (isDone(next)) {
          const body = await v2Get<{ results: RunResult[] }>(`prompt-runs/${encodeURIComponent(run.run_id)}/results`)
          setResults(body.results)
        }
      } catch (caught) {
        setError(errorText(caught))
      }
    }, 3000)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [open, run])

  const start = async () => {
    setError(null)
    if (!promptIds.length) return setError(t('runNoPrompts'))
    if (!selectedCountry) return setError(t('runPickCountry'))
    if (!selectedEngines.length) return setError(t('runPickEngine'))
    setStarting(true)
    try {
      const body = await v2Send<{ run_id: string; status: string; prompt_count: number; result_count: number; message: string }>('POST', 'prompt-runs', {
        country: selectedCountry,
        engines: selectedEngines,
        prompt_ids: promptIds,
      })
      setStartMessage(body.message)
      setRun({ run_id: body.run_id, status: body.status, prompt_count: body.prompt_count, result_count: body.result_count, finished_count: 0, progress: [] })
    } catch (caught) {
      setError(errorText(caught))
    } finally {
      setStarting(false)
    }
  }

  const toggle = (id: string) => {
    const now = selectedEngines
    setChosen(now.includes(id) ? now.filter((item) => item !== id) : [...now, id])
  }

  return (
    <Modal open={open} title={t('runTitle')} onClose={onClose} wide>
      <div className="w-full min-w-0">
        <div className="p-4 sm:p-6">
        <h2 className="text-base font-semibold sm:text-lg">{t('runTitle')}</h2>
        {!run ? (
          <>
            <p className="mt-1 text-[13px] leading-5 text-zinc-600">{t('runIntro', { count: promptIds.length })}</p>
            <label className="mt-4 block text-[12px] font-medium text-zinc-600">{t('runCountry')}</label>
            {countryQuery.loading ? <p className="mt-1 text-[13px] text-zinc-500">{t('runLoading')}</p> : null}
            {countryQuery.error ? <p className="mt-1 text-[13px] text-rose-600">{errorText(countryQuery.error)}</p> : null}
            {countries.length ? (
              <select value={selectedCountry} onChange={(event) => setCountry(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-nuw-line bg-white px-3 text-[13px] sm:h-9">
                {countries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
              </select>
            ) : null}
            <p className="mt-4 text-[12px] font-medium text-zinc-600">{t('runEngines')}</p>
            {engineQuery.loading ? <p className="mt-1 text-[13px] text-zinc-500">{t('runLoading')}</p> : null}
            {engineQuery.error ? <p className="mt-1 text-[13px] text-rose-600">{errorText(engineQuery.error)}</p> : null}
            <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {engines.map((item) => (
                <label key={item.engine} className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-2.5 text-[13px] hover:bg-zinc-50 sm:py-1.5">
                  <input type="checkbox" className="h-4 w-4 shrink-0" checked={selectedEngines.includes(item.engine)} onChange={() => toggle(item.engine)} />
                  <span className="min-w-0 leading-5">{item.label}</span>
                </label>
              ))}
              {blockedModels.map((item) => (
                <label key={item.id} className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-lg px-2 py-2.5 text-[13px] text-zinc-400 sm:py-1.5" title={t('runLockedNote')}>
                  <input type="checkbox" className="h-4 w-4 shrink-0" checked={false} disabled />
                  <span className="min-w-0 leading-5">{item.label}</span>
                  <span className="shrink-0 rounded border border-nuw-line px-1.5 py-0.5 text-[11px]">{item.badge === 'upgrade' ? t('upgrade') : t('runSoon')}</span>
                </label>
              ))}
            </div>
            {blockedModels.length ? <p className="mt-3 text-[12px] leading-5 text-zinc-500">{t('runLockedNote')}</p> : null}
            {catalogError ? <p className="mt-2 text-[13px] leading-5 text-rose-600">{catalogError}</p> : null}
            <p className="mt-3 text-[12px] leading-5 text-zinc-500">{t('runQuotaNote')}</p>
            {error ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[13px] leading-5 text-rose-700">{error}</p> : null}
          </>
        ) : (
          <>
            <p className="mt-1 text-[13px] leading-5 text-zinc-600">{run.message || startMessage}</p>
            {!results ? (
              <>
                <p className="mt-3 text-[13px] font-medium">{t('runProgress', { done: run.finished_count, total: run.result_count })}</p>
                <ul className="mt-2 space-y-1">
                  {run.progress.map((item) => {
                    const done = Object.entries(item.counts).filter(([key]) => key !== 'queued' && key !== 'running' && key !== 'pending').reduce((sum, [, value]) => sum + value, 0)
                    return (
                      <li key={item.engine} className="flex items-center justify-between text-[13px] text-zinc-600">
                        <span>{item.label}</span>
                        <span>{done} / {item.total}</span>
                      </li>
                    )
                  })}
                </ul>
                <p className="mt-3 text-[12px] leading-5 text-zinc-500">{t('runKeepsGoing')}</p>
              </>
            ) : (
              <ul className="mt-3 divide-y divide-nuw-line">
                {results.length === 0 ? <li className="py-2 text-[13px] text-zinc-500">{t('runNoResults')}</li> : null}
                {results.map((item) => <ResultRow key={item.result_id} result={item} />)}
              </ul>
            )}
            {error ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[13px] leading-5 text-rose-700">{error}</p> : null}
          </>
        )}
        </div>
        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-nuw-line bg-white p-4 sm:flex-row sm:justify-end sm:px-6">
          {!run ? (
            <>
              <button type="button" onClick={onClose} className="h-11 rounded-lg px-4 text-[13px] hover:bg-zinc-100 sm:h-9">{t('cancel')}</button>
              <button type="button" disabled={starting} onClick={() => void start()} className="h-11 rounded-lg bg-nuw-button px-4 text-[13px] text-white hover:bg-nuw-buttonHover disabled:bg-zinc-400 sm:h-9">
                {starting ? t('runStarting') : t('runStart')}
              </button>
            </>
          ) : (
            <button type="button" onClick={onClose} className="h-11 rounded-lg bg-nuw-button px-4 text-[13px] text-white hover:bg-nuw-buttonHover sm:h-9">{t('close')}</button>
          )}
        </div>
      </div>
    </Modal>
  )
}

function ResultRow({ result }: { result: RunResult }) {
  const t = useTranslations('prompts.page')
  const [raw, setRaw] = useState<RawCapture | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const failed = !result.answer_text && result.status.toLowerCase() !== 'completed'
  const openRaw = async () => {
    setLoading(true)
    setError(null)
    try {
      setRaw(await v2Get<RawCapture>(`prompt-runs/results/${encodeURIComponent(result.result_id)}/raw`))
    } catch (caught) {
      setError(errorText(caught))
    } finally {
      setLoading(false)
    }
  }
  const links = raw ? ([['runRawJson', raw.capture_json_url], ['runRawPage', raw.page_html_url], ['runRawScreenshot', raw.screenshot_url]] as const).filter(([, url]) => url) : []
  return (
    <li className="py-3 text-[13px]">
      <div className="flex items-center gap-2">
        <span className="font-medium">{result.engine_label}</span>
        <span className={cn('rounded-full px-2 py-0.5 text-[11px]', result.is_target_cited ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500')}>
          {result.is_target_cited ? t('runCited', { position: result.target_position ?? 'N/A' }) : t('runNotCited')}
        </span>
      </div>
      <p className="mt-1 truncate text-zinc-500">{result.prompt}</p>
      {failed ? <p className="mt-1 text-rose-600">{result.message || t('runResultFailed')}</p> : <p className="mt-1 line-clamp-3 leading-5 text-zinc-700">{result.answer_text}</p>}
      {result.has_raw_capture ? (
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px]">
          {!raw ? <button type="button" disabled={loading} onClick={() => void openRaw()} className="text-zinc-500 underline hover:text-zinc-900">{loading ? t('runLoading') : t('runRawOpen')}</button> : null}
          {links.map(([key, url]) => (
            <a key={key} href={url ?? undefined} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-zinc-600 underline hover:text-zinc-900">
              {t(key)} <ExternalLink className="h-3 w-3" />
            </a>
          ))}
          {raw && !links.length ? <span className="text-zinc-500">{raw.message}</span> : null}
          {error ? <span className="text-rose-600">{error}</span> : null}
        </div>
      ) : null}
    </li>
  )
}
