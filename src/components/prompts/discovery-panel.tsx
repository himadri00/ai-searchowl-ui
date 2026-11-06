'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Info, Play, Plus, X } from 'lucide-react'
import { locations, personaTags, type Intent, type PromptItem } from '@/data/prompts'
import { Flag } from '@/components/prompts/flag'
import { Modal } from '@/components/ui/overlay'
import { cn } from '@/lib/cn'

export type SetSize = 'focused' | 'standard' | 'broad' | 'extensive' | 'thorough'

export type DiscoverySetup = {
  nonBranded: number
  informational: number
  commercial: number
  transactional: number
  personasOn: boolean
  personas: string[]
  size: SetSize
  context: string
}

export const defaultDiscoverySetup = (): DiscoverySetup => ({
  nonBranded: 80,
  informational: 25,
  commercial: 50,
  transactional: 25,
  personasOn: true,
  personas: [...personaTags],
  size: 'focused',
  context: '',
})

const personaOrder = ['creator', 'faceless', 'agency', 'manager', 'hobbyist'] as const
const sizes: SetSize[] = ['focused', 'standard', 'broad', 'extensive', 'thorough']
export const promptsPerTopic: Record<SetSize, number> = { focused: 40, standard: 60, broad: 80, extensive: 100, thorough: 120 }

const intentColor: Record<Intent, string> = {
  informational: '#93c5fd',
  commercial: '#fdba74',
  transactional: '#86efac',
}

export function OverviewPanel({
  topicName,
  activeCount,
  reviewCount,
  rows,
  setup,
  onClose,
  onAdjust,
}: {
  topicName: string
  activeCount: number
  reviewCount: number
  rows: PromptItem[]
  setup: DiscoverySetup
  onClose: () => void
  onAdjust: () => void
}) {
  const t = useTranslations('prompts.page')
  const [allNote, setAllNote] = useState(false)
  const empty = rows.length === 0
  const mix = share(rows)
  const checks = empty
    ? []
    : [
        near(mix.nonBranded, setup.nonBranded),
        near(mix.branded, 100 - setup.nonBranded),
        near(mix.informational, setup.informational),
        near(mix.commercial, setup.commercial),
        near(mix.transactional, setup.transactional),
      ]
  const score = checks.length ? Math.round((checks.filter(Boolean).length / checks.length) * 100) : 0
  const onTarget = !empty && score === 100
  const covered = personaOrder.filter((id) => rows.some((row) => row.tagIds.includes(id))).length

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col overflow-auto border-l border-nuw-line bg-white">
      <div className="flex items-center gap-2 border-b border-nuw-line px-4 py-3">
        <span className="max-w-[180px] truncate rounded-full bg-zinc-100 px-2 py-1 text-[13px]">{topicName}</span>
        <button type="button" onClick={() => setAllNote((open) => !open)} className="rounded-full bg-zinc-100 px-2 py-1 text-[13px] hover:bg-zinc-200">
          {t('overviewAll')}
        </button>
        <button type="button" onClick={onClose} aria-label={t('close')} className="ml-auto text-zinc-400 hover:text-zinc-700">
          <X className="h-4 w-4" />
        </button>
      </div>
      {allNote ? <p className="px-4 pt-3 text-[12px] leading-5 text-zinc-500">{t('overviewAllBody')}</p> : null}
      <div className="flex items-center gap-3 px-4 py-4">
        <Ring value={empty ? 8 : score} muted={empty || !onTarget} />
        <div>
          <p className="flex items-center gap-1 text-[15px] font-semibold">
            {empty ? t('emptyTopic') : onTarget ? t('onTarget') : t('offTarget')}
            <InfoTip label={t('aboutScore')} body={empty ? t('emptyTopicTip') : onTarget ? t('onTargetTip') : t('offTargetTip')} />
          </p>
          <p className="mt-0.5 text-[13px] text-zinc-500">
            {empty ? t('emptyTopicBody') : t('toReview', { active: activeCount, review: reviewCount })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 px-4 text-[12px] text-zinc-500">
        <Legend swatch="bg-emerald-500" label={t('legendActive')} />
        <Legend swatch="bg-emerald-200" label={t('legendSuggested')} />
        <Legend swatch="border border-zinc-300" label={t('legendTarget')} />
      </div>
      <section className="px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[13px] font-medium">{t('brandingSplit')}</h3>
          <button type="button" onClick={onAdjust} className="text-[13px] text-zinc-500 underline">{t('adjustTargets')}</button>
        </div>
        <SplitBar className="mt-3" parts={[{ value: empty ? setup.nonBranded : mix.nonBranded, color: '#e4e4e7' }, { value: empty ? 100 - setup.nonBranded : mix.branded, color: '#60a5fa' }]} />
        <ShareRow label={t('nonBranded')} dot="bg-zinc-900" value={empty ? setup.nonBranded : mix.nonBranded} target={setup.nonBranded} empty={empty} ok={!empty && checks[0]} />
        <ShareRow label={t('branded')} dot="bg-blue-500" value={empty ? 100 - setup.nonBranded : mix.branded} target={100 - setup.nonBranded} empty={empty} ok={!empty && checks[1]} />
      </section>
      <section className="px-4 pb-4">
        <h3 className="text-[13px] font-medium">{t('intentDistribution')}</h3>
        <SplitBar
          className="mt-3"
          parts={(empty
            ? [
                { value: setup.informational, color: intentColor.informational },
                { value: setup.commercial, color: intentColor.commercial },
                { value: setup.transactional, color: intentColor.transactional },
              ]
            : [
                { value: mix.informational, color: intentColor.informational },
                { value: mix.commercial, color: intentColor.commercial },
                { value: mix.transactional, color: intentColor.transactional },
              ])}
        />
        <ShareRow label={t('informational')} dot="bg-blue-400" value={empty ? setup.informational : mix.informational} target={setup.informational} empty={empty} ok={!empty && checks[2]} />
        <ShareRow label={t('commercial')} dot="bg-orange-300" value={empty ? setup.commercial : mix.commercial} target={setup.commercial} empty={empty} ok={!empty && checks[3]} />
        <ShareRow label={t('transactional')} dot="bg-emerald-300" value={empty ? setup.transactional : mix.transactional} target={setup.transactional} empty={empty} ok={!empty && checks[4]} />
      </section>
      <section className="px-4 pb-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[13px] font-medium">{t('personasCountries')}</h3>
          {empty ? null : <span className="text-[12px] text-zinc-400">{t('covered', { done: covered, total: personaOrder.length })}</span>}
        </div>
        {empty ? (
          <p className="mt-4 text-[13px] leading-5 text-zinc-500">
            <span className="font-medium text-zinc-700">{t('noCountry')}</span>
            <span className="mt-1 block">{t('noCountryBody')}</span>
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="w-28" />
                  {locations.map((place) => (
                    <th key={place.id} className="px-1 pb-1 text-center text-[12px]"><Flag id={place.id} title={t(place.id)} /></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {personaOrder.map((id) => (
                  <tr key={id}>
                    <td className="py-1 pr-2 text-[12px] text-zinc-600">{t(id)}</td>
                    {locations.map((place) => {
                      const hit = rows.some((row) => row.tagIds.includes(id) && row.location === place.id)
                      return (
                        <td key={place.id} className="px-1 py-1">
                          <span className={cn('mx-auto block h-5 w-5 rounded', hit ? 'bg-sky-100' : 'bg-zinc-50')} />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </aside>
  )
}

export function DistributionDrawer({
  setup,
  topicCount,
  onChange,
  onClose,
}: {
  setup: DiscoverySetup
  topicCount: number
  onChange: (next: DiscoverySetup) => void
  onClose: () => void
}) {
  const t = useTranslations('prompts.page')
  const [video, setVideo] = useState(false)
  const [personaNote, setPersonaNote] = useState('')
  const [adding, setAdding] = useState(false)
  const branded = 100 - setup.nonBranded
  const perTopic = promptsPerTopic[setup.size]
  const intents = (['informational', 'commercial', 'transactional'] as const).filter((key) => setup[key] > 0)
  const branding = setup.nonBranded > 0 && branded > 0 ? t('brandingBoth') : t('brandingOnly', { name: t(setup.nonBranded > 0 ? 'nonBranded' : 'branded') })
  const estimated = perTopic * Math.max(1, topicCount)
  const missing = personaOrder.filter((id) => !setup.personas.includes(id))

  const setIntent = (key: Intent, raw: number) => {
    const value = clamp(raw)
    const others = (['informational', 'commercial', 'transactional'] as const).filter((item) => item !== key)
    const rest = 100 - value
    const sum = others.reduce((total, item) => total + setup[item], 0)
    const next = { ...setup, [key]: value }
    if (sum === 0) {
      next[others[0]] = rest
      next[others[1]] = 0
    } else {
      const first = Math.round((rest * setup[others[0]]) / sum)
      next[others[0]] = first
      next[others[1]] = rest - first
    }
    onChange(next)
  }

  const removePersona = (id: string) => {
    if (setup.personas.length === 1) {
      setPersonaNote(t('personasKeep'))
      return
    }
    setPersonaNote('')
    onChange({ ...setup, personas: setup.personas.filter((item) => item !== id) })
  }

  return (
    <div className="fixed inset-0 top-14 z-40 flex justify-end bg-zinc-900/30" onMouseDown={onClose}>
      <aside className="flex h-full w-full max-w-[420px] flex-col bg-white shadow-menu" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3">
          <button type="button" onClick={onClose} aria-label={t('close')} className="text-zinc-400 hover:text-zinc-700">»</button>
          <button type="button" onClick={() => setVideo(true)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-nuw-line px-3 text-[13px]">
            <Play className="h-3.5 w-3.5" /> {t('watchVideo')}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-5 pb-6">
          <h2 className="text-[18px] font-semibold">{t('promptDistribution')}</h2>
          <p className="mt-1 text-[13px] text-zinc-500">{t('distributionLead')}</p>

          <section className="mt-6">
            <h3 className="text-[14px] font-medium">{t('brandingSplit')}</h3>
            <p className="mt-1 text-[13px] text-zinc-500">{t('brandingHelp')}</p>
            <SplitBar className="mt-3" parts={[{ value: setup.nonBranded, color: '#e4e4e7' }, { value: branded, color: '#93c5fd' }]} />
            <p className="mt-2 text-[12px] text-zinc-500">{t('brandingSum')}</p>
            <Slider label={t('nonBranded')} value={setup.nonBranded} onChange={(value) => onChange({ ...setup, nonBranded: value })} />
            <Slider label={t('branded')} value={branded} onChange={(value) => onChange({ ...setup, nonBranded: 100 - value })} />
          </section>

          <section className="mt-6">
            <h3 className="text-[14px] font-medium">{t('intentDistribution')}</h3>
            <p className="mt-1 text-[13px] text-zinc-500">{t('intentHelp')}</p>
            <SplitBar className="mt-3" parts={[
              { value: setup.informational, color: intentColor.informational },
              { value: setup.commercial, color: intentColor.commercial },
              { value: setup.transactional, color: intentColor.transactional },
            ]} />
            <p className="mt-2 text-[12px] text-zinc-500">{t('intentSum')}</p>
            <Slider label={t('informational')} value={setup.informational} onChange={(value) => setIntent('informational', value)} />
            <Slider label={t('commercial')} value={setup.commercial} onChange={(value) => setIntent('commercial', value)} />
            <Slider label={t('transactional')} value={setup.transactional} onChange={(value) => setIntent('transactional', value)} />
          </section>

          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1 text-[14px] font-medium">
                {t('personasTitle')}
                <InfoTip label={t('aboutPersonas')} body={t('personasHelp')} />
              </h3>
              <button
                type="button"
                role="switch"
                aria-checked={setup.personasOn}
                onClick={() => { setPersonaNote(''); onChange({ ...setup, personasOn: !setup.personasOn }) }}
                className={cn('h-5 w-9 rounded-full p-0.5', setup.personasOn ? 'bg-zinc-900' : 'bg-zinc-200')}
              >
                <span className={cn('block h-4 w-4 rounded-full bg-white transition', setup.personasOn && 'translate-x-4')} />
              </button>
            </div>
            <p className="mt-1 text-[13px] text-zinc-500">{t('personasHelp')}</p>
            {setup.personasOn ? null : <p className="mt-2 text-[13px] text-amber-700">{t('personasOff')}</p>}
            <div className={cn('mt-3 flex flex-wrap gap-2', !setup.personasOn && 'opacity-50')}>
              {personaOrder.filter((id) => setup.personas.includes(id)).map((id) => (
                <span key={id} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-[13px]">
                  {t(id)}
                  <button type="button" aria-label={t('removePersona', { name: t(id) })} onClick={() => removePersona(id)} className="text-zinc-400 hover:text-zinc-700">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <span className="relative">
                <button type="button" onClick={() => { setAdding((open) => !open); setPersonaNote('') }} className="inline-flex items-center gap-1 rounded-full border border-dashed border-zinc-300 px-2 py-1 text-[13px]">
                  {t('addPersona')} <Plus className="h-3 w-3" />
                </button>
                {adding ? (
                  <span className="absolute left-0 top-full z-10 mt-1 w-56 rounded-xl border border-nuw-line bg-white p-1 shadow-menu">
                    {missing.length === 0 ? <span className="block px-2 py-2 text-[13px] text-zinc-500">{t('personasFull')}</span> : missing.map((id) => (
                      <button key={id} type="button" onClick={() => { onChange({ ...setup, personas: [...setup.personas, id], personasOn: true }); setAdding(false); setPersonaNote('') }} className="block w-full rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-zinc-100">
                        {t(id)}
                      </button>
                    ))}
                  </span>
                ) : null}
              </span>
            </div>
            {personaNote ? <p className="mt-2 text-[13px] text-rose-600">{personaNote}</p> : null}
          </section>

          <section className="mt-6">
            <h3 className="text-[14px] font-medium">{t('setSize')}</h3>
            <p className="mt-1 text-[13px] text-zinc-500">{t('setSizeHelp')}</p>
            <div className="mt-3 h-2 rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-sky-200" style={{ width: `${(sizes.indexOf(setup.size) + 1) * 20}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1 rounded-xl bg-zinc-100 p-1">
              {sizes.map((id) => (
                <button key={id} type="button" onClick={() => onChange({ ...setup, size: id })} className={cn('h-8 flex-1 rounded-lg px-2 text-[12px]', setup.size === id ? 'bg-white font-medium shadow-sm' : 'text-zinc-500')}>
                  {t(id)}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-[14px] font-medium">{t('extraContext')}</h3>
            <p className="mt-1 text-[13px] text-zinc-500">{t('extraContextHelp')}</p>
            <textarea
              value={setup.context}
              maxLength={500}
              onChange={(event) => onChange({ ...setup, context: event.target.value })}
              placeholder={t('extraContextPlaceholder')}
              className="mt-3 h-24 w-full resize-none rounded-xl border border-nuw-line px-3 py-2 text-[13px] outline-none focus:border-nuw-primary"
            />
            {setup.context.length >= 500 ? <p className="mt-1 text-[12px] text-rose-600">{t('contextLimit')}</p> : null}
          </section>

          <section className="mt-6 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-[14px] font-medium">{t('estimated')}</h3>
              <p className="mt-1 text-[13px] text-zinc-500">{t('perTopic', { count: perTopic })}</p>
              <p className="mt-1 text-[12px] leading-5 text-zinc-400">{t('setupBreakdown', { topics: topicCount, markets: 1, branding, intents: intents.length })}</p>
            </div>
            <p className="text-[28px] font-semibold tabular-nums">{estimated}</p>
          </section>
        </div>
        <div className="border-t border-nuw-line px-5 py-3">
          <button type="button" onClick={onClose} className="text-[14px] font-medium">{t('back')}</button>
        </div>
        <Modal open={video} title={t('watchVideoTitle')} onClose={() => setVideo(false)}>
          <div className="p-5">
            <h2 className="text-base font-semibold">{t('watchVideoTitle')}</h2>
            <p className="mt-2 text-[13px] leading-5 text-zinc-600">{t('watchVideoBody')}</p>
            <button type="button" onClick={() => setVideo(false)} className="mt-4 h-9 rounded-lg bg-nuw-button px-3 text-[13px] text-white">{t('close')}</button>
          </div>
        </Modal>
      </aside>
    </div>
  )
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="mt-3 block text-[13px]">
      <span className="mb-1 flex items-center justify-between">
        <span>{label}</span>
        <span className="tabular-nums text-zinc-500">{value}%</span>
      </span>
      <input type="range" min={0} max={100} value={value} aria-label={label} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-zinc-900" />
    </label>
  )
}

function ShareRow({ label, dot, value, target, empty, ok }: { label: string; dot: string; value: number; target: number; empty: boolean; ok: boolean }) {
  const t = useTranslations('prompts.page')
  return (
    <div className="mt-2 flex items-center gap-2 text-[13px]">
      <span className={cn('h-2 w-2 rounded-full', dot)} />
      <span>{label}</span>
      <span className="ml-auto tabular-nums text-zinc-500">{empty ? t('targetPct', { value: target }) : `${value}%`}</span>
      {empty || !ok ? null : <Check className="h-3.5 w-3.5 text-emerald-500" />}
    </div>
  )
}

function SplitBar({ parts, className }: { parts: { value: number; color: string }[]; className?: string }) {
  return (
    <div className={cn('flex h-2 overflow-hidden rounded-full bg-zinc-100', className)}>
      {parts.filter((part) => part.value > 0).map((part, index) => (
        <span key={index} style={{ width: `${part.value}%`, background: part.color }} />
      ))}
    </div>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn('h-2 w-2 rounded-full', swatch)} />
      {label}
    </span>
  )
}

function Ring({ value, muted }: { value: number; muted: boolean }) {
  const radius = 28
  const circ = 2 * Math.PI * radius
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden>
      <circle cx="38" cy="38" r={radius} fill="none" stroke="#e4e4e7" strokeWidth="6" />
      <circle
        cx="38"
        cy="38"
        r={radius}
        fill="none"
        stroke={muted ? '#d4d4d8' : '#22c55e'}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${circ * (value / 100)} ${circ}`}
        transform="rotate(-90 38 38)"
      />
      {muted ? null : <text x="38" y="42" textAnchor="middle" fontSize="13" fontWeight="600" fill="#18181b">{value}%</text>}
    </svg>
  )
}

function InfoTip({ label, body }: { label: string; body: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex">
      <button type="button" aria-label={label} onClick={() => setOpen((current) => !current)} className="text-zinc-400">
        <Info className="h-3.5 w-3.5" />
      </button>
      {open ? <span className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg bg-zinc-950 p-2 text-left text-[12px] font-normal leading-5 text-white shadow-menu">{body}</span> : null}
    </span>
  )
}

function share(rows: PromptItem[]) {
  const branding = rows.filter((row) => row.branding)
  const intent = rows.filter((row) => row.intent)
  const branded = branding.filter((row) => row.branding === 'branded').length
  const informational = intent.filter((row) => row.intent === 'informational').length
  const commercial = intent.filter((row) => row.intent === 'commercial').length
  return {
    branded: percent(branded, branding.length),
    nonBranded: branding.length ? 100 - percent(branded, branding.length) : 0,
    informational: percent(informational, intent.length),
    commercial: percent(commercial, intent.length),
    transactional: intent.length ? Math.max(0, 100 - percent(informational, intent.length) - percent(commercial, intent.length)) : 0,
  }
}

function percent(count: number, total: number) {
  if (!total) return 0
  return Math.round((count / total) * 100)
}

function near(actual: number, target: number) {
  return Math.abs(actual - target) <= 5
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}
