'use client'

import { useEffect, useState } from 'react'
import { browserTimeZone } from '@/lib/format'
import { errorText, rangeQuery, useV2, v2Poll, v2Send } from '@/lib/v2'
import { useCatalog } from '@/lib/catalog'
import { ApiNote } from '@/components/data/api-note'
import { useTranslations } from 'next-intl'
import { Check, ChevronDown, ListChecks, X } from 'lucide-react'
import {
  type AttributeRecord,
  type HeatBrand,
  type PromptRecord,
  type SourceRecord,
  type TermRecord,
} from '@/data/perception'
import { useBrand } from '@/components/workspace/workspace-context'
import { Menu, Modal, useToast } from '@/components/ui/overlay'
import { MarketView } from '@/components/perception/market-view'
import { FactsView } from '@/components/perception/facts-view'
import { ObjectionsView } from '@/components/perception/objections-view'
import { AddAttributeDialog, InviteDialog, ManageDialog } from '@/components/perception/dialogs'
import { cn } from '@/lib/cn'

const ranges = ['all', '7', '30', '90'] as const
const tourIds = ['summary', 'known', 'shape', 'compare', 'scale', 'manage', 'sources'] as const
const languages = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
  { id: 'es', label: 'Español' },
  { id: 'it', label: 'Italiano' },
  { id: 'de', label: 'Deutsch' },
] as const

type Tab = 'market' | 'objections' | 'facts'
type Choice = string[] | null

export function PerceptionScreen() {
  const t = useTranslations('perception.page')
  const brand = useBrand()
  const { push } = useToast()
  const [tab, setTab] = useState<Tab>('market')
  const [view, setView] = useState<'default' | 'chatgpt'>('default')
  const [range, setRange] = useState<(typeof ranges)[number]>('all')
  const [models, setModels] = useState<Choice>(null)
  const [filterQuery, setFilterQuery] = useState('')
  const [industry, setIndustry] = useState('')
  const [language, setLanguage] = useState('en')
  const [pendingLanguage, setPendingLanguage] = useState<string | null>(null)
  const [scope, setScope] = useState<'global' | 'national' | 'city'>('global')
  const perception = useV2<{
    industry: string | null
    language: string
    scope: 'global' | 'national' | 'city'
    attributes: AttributeRecord[]
    terms: TermRecord[]
    brands: HeatBrand[]
    sources: SourceRecord[]
    prompts: PromptRecord[]
    objections: { id: string; label: string; score: number }[]
    facts: string[]
    updatedAt?: string | null
    messages?: { text: string }[]
  }>('perception', {
    ...rangeQuery(range),
    timezone: browserTimeZone(),
    ...(models ? { engines: models } : {}),
  })
  const [attributes, setAttributes] = useState<AttributeRecord[]>([])
  const [terms, setTerms] = useState<TermRecord[]>([])
  const [shapeIds, setShapeIds] = useState<string[]>([])
  const [selectedShape, setSelectedShape] = useState<string | null>(null)
  const [heatIds, setHeatIds] = useState<string[]>([])
  const [heatBrands, setHeatBrands] = useState<HeatBrand[]>([])
  const [sources, setSources] = useState<SourceRecord[]>([])
  const [promptRows, setPromptRows] = useState<PromptRecord[]>([])
  const [objections, setObjections] = useState<{ id: string; label: string; score: number }[]>([])
  const [savedFacts, setSavedFacts] = useState('')
  const [checkResult, setCheckResult] = useState<string | null>(null)
  const catalog = useCatalog()
  const factLimit = catalog.limit('perception_facts')?.limit ?? 5
  const checkPromptLimit = catalog.limit('fact_check_prompts')?.limit ?? 5
  const customAttributeLimit = catalog.limit('custom_attributes')?.limit ?? 10
  const [sortBrand, setSortBrand] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [tour, setTour] = useState(0)
  const [manageOpen, setManageOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [promptsOpen, setPromptsOpen] = useState(false)
  const [factsHint, setFactsHint] = useState(true)
  const [factText, setFactText] = useState('')
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([])
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (!perception.data) return
    const data = perception.data
    setIndustry(data.industry ?? '')
    if (data.language) setLanguage(data.language)
    if (data.scope) setScope(data.scope)
    setSources(data.sources ?? [])
    setPromptRows(data.prompts ?? [])
    setObjections(data.objections ?? [])
    setFactText((data.facts ?? []).join('\n'))
    setSavedFacts((data.facts ?? []).join('\n'))
    setAttributes(data.attributes ?? [])
    setTerms(data.terms ?? [])
    setShapeIds((data.attributes ?? []).filter((item) => item.top8).map((item) => item.id))
    setHeatBrands(data.brands ?? [])
    setHeatIds((data.brands ?? []).map((item) => item.id))
    setSortBrand((current) => current || data.brands?.[0]?.id || '')
  }, [perception.data])

  const fail = (caught: unknown) => push({ title: t('requestFailedTitle'), body: errorText(caught) })

  const saveSettings = async (next: { industry?: string; language?: string; scope?: 'global' | 'national' | 'city' }) => {
    const body = await v2Send<{ industry: string | null; language: string; scope: 'global' | 'national' | 'city' }>('PUT', 'perception/settings', next)
    setIndustry(body.industry ?? '')
    setLanguage(body.language)
    setScope(body.scope)
  }

  const applyManage = async (nextAttributes: AttributeRecord[], nextTerms: TermRecord[]) => {
    const renamed = nextAttributes.filter((item) => attributes.some((old) => old.id === item.id && old.name !== item.name))
    const removed = attributes.filter((old) => !nextAttributes.some((item) => item.id === old.id))
    const moves = nextTerms
      .filter((term) => terms.find((old) => old.id === term.id)?.attributeId !== term.attributeId)
      .filter((term) => !removed.some((item) => item.id === term.attributeId))
      .map((term) => ({ termId: term.id, attributeId: term.attributeId }))
    for (const item of renamed) await v2Send('PATCH', `perception/attributes/${encodeURIComponent(item.id)}`, { name: item.name })
    if (moves.length) await v2Send('PUT', 'perception/terms', { moves })
    for (const item of removed) await v2Send('DELETE', `perception/attributes/${encodeURIComponent(item.id)}`)
    perception.reload()
    setManageOpen(false)
    push({ title: t('applyDoneTitle'), body: t('applyDoneBody') })
  }

  const saveFacts = async () => {
    const facts = factText.split('\n').map((line) => line.trim()).filter(Boolean)
    const body = await v2Send<{ facts: string[] }>('PUT', 'perception/facts', { facts })
    const text = (body.facts ?? facts).join('\n')
    setFactText(text)
    setSavedFacts(text)
  }

  const runCheck = async () => {
    setChecking(true)
    setCheckResult(null)
    try {
      if (factText !== savedFacts) await saveFacts()
      type CheckJob = { status?: string; pollUrl?: string; jobId?: string; message?: string }
      let job = await v2Send<CheckJob>('POST', 'perception/facts/check', { promptIds: selectedPrompts })
      const pollPath = job.pollUrl ? job.pollUrl.replace(/^\/?v2\//, '') : job.jobId ? `perception/facts/check/${encodeURIComponent(job.jobId)}` : null
      if (job.status !== 'completed' && pollPath) {
        job = await v2Poll<CheckJob>(pollPath, (body) => body.status === 'completed' || body.status === 'failed')
      }
      if (job.status === 'failed') throw new Error(job.message || t('checkFailedBody'))
      setCheckResult(job.message || t('checkDoneBody', { count: selectedPrompts.length }))
      perception.reload()
    } catch (caught) {
      fail(caught)
    } finally {
      setChecking(false)
    }
  }

  const modelLabels = Object.fromEntries([...catalog.active, ...catalog.available, ...catalog.comingSoon, ...catalog.locked].map((engine) => [engine.id, engine.label]))
  const models3 = {
    active: catalog.active.map((engine) => engine.id),
    available: catalog.available.map((engine) => engine.id),
    locked: [...catalog.comingSoon, ...catalog.locked].map((engine) => engine.id),
  }
  const selectable = [...models3.active, ...models3.available]
  const languageLabel = languages.find((item) => item.id === language)?.label ?? 'English'
  const filterCount = models === null ? 0 : 1
  const dirty = view !== 'default' || range !== 'all' || models !== null
  const tourId = tab === 'market' && tour >= 0 ? tourIds[tour] : null

  const applyView = (next: 'default' | 'chatgpt') => {
    setView(next)
    setModels(next === 'chatgpt' ? ['chatgpt'] : null)
  }

  const reset = () => {
    setView('default')
    setRange('all')
    setModels(null)
  }

  const sortBy = (brandId: string) => {
    if (sortBrand === brandId) setSortDir((current) => (current === 'desc' ? 'asc' : 'desc'))
    else {
      setSortBrand(brandId)
      setSortDir('desc')
    }
  }

  return (
    <div className="px-4 py-4">
      <ApiNote loading={perception.loading} error={perception.error} />
      {!perception.loading && !perception.error && perception.data?.messages?.length ? (
        <div className="mb-3 space-y-1">
          {perception.data.messages.filter((item) => item.text).map((item, index) => (
            <p key={`${index}-${item.text}`} role="status" className="text-[13px] leading-5 text-zinc-600">{item.text}</p>
          ))}
        </div>
      ) : null}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Menu
          panelClassName="w-56"
          trigger={() => (
            <button type="button" className="flex h-8 items-center gap-1.5 rounded-lg border border-nuw-line bg-white px-2.5 text-[13px]">
              {t(view === 'default' ? 'view' : 'viewChatgpt')} <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            </button>
          )}
        >
          <label className="mb-1 flex items-center gap-2 px-2 py-1.5">
            <input value={filterQuery} onChange={(event) => setFilterQuery(event.target.value)} placeholder={t('searchFilters')} className="w-full bg-transparent text-[13px] outline-none" />
          </label>
          {t('view').toLowerCase().includes(filterQuery.trim().toLowerCase()) ? (
            <button type="button" onClick={() => applyView('default')} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100">
              {view === 'default' ? <Check className="h-3.5 w-3.5" /> : <span className="w-3.5" />} {t('view')}
            </button>
          ) : null}
          <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('savedFilters')}</p>
          {t('viewChatgpt').toLowerCase().includes(filterQuery.trim().toLowerCase()) ? (
            <button type="button" onClick={() => applyView('chatgpt')} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100">
              {view === 'chatgpt' ? <Check className="h-3.5 w-3.5" /> : <span className="w-3.5" />} {t('viewChatgpt')}
            </button>
          ) : null}
          <p className="px-2 py-2 text-[12px] leading-5 text-zinc-500">{t('viewNote')}</p>
        </Menu>
        <Menu
          panelClassName="w-48"
          trigger={() => (
            <button type="button" className="flex h-8 items-center gap-1.5 rounded-lg border border-nuw-line bg-white px-2.5 text-[13px]">
              {t(range === 'all' ? 'timeAll' : `time${range}`)} <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            </button>
          )}
        >
          {ranges.map((id) => (
            <button key={id} type="button" onClick={() => setRange(id)} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100">
              {t(id === 'all' ? 'timeAll' : `time${id}`)}
              {range === id ? <Check className="h-3.5 w-3.5" /> : null}
            </button>
          ))}
        </Menu>
        <ModelFilter models={models} groups={models3} labels={modelLabels} selectable={selectable} onChange={setModels} onUpgrade={() => push({ title: t('upgradeTitle'), body: t('upgradeBody') })} />
        {dirty ? (
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={reset} className="h-8 rounded-lg px-2 text-[13px] text-zinc-600 hover:bg-zinc-100">{t('reset')}</button>
            <button type="button" onClick={() => push({ title: t('savedTitle'), body: t('savedBody') })} className="h-8 rounded-lg bg-nuw-button px-3 text-[13px] text-white">{t('saveView')}</button>
          </div>
        ) : null}
        {tab === 'facts' ? (
          <div className={cn('relative', !dirty && 'ml-auto')}>
            <button type="button" onClick={() => { setPromptsOpen(true); setFactsHint(false) }} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-nuw-line bg-white px-3 text-[13px]">
              <ListChecks className="h-3.5 w-3.5" /> {t('choosePrompts')}
            </button>
            {factsHint ? (
              <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl bg-zinc-950 p-3 text-[13px] leading-5 text-white shadow-menu">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="font-medium">{t('chooseTitle')}</p>
                  <button type="button" aria-label={t('close')} onClick={() => setFactsHint(false)} className="text-zinc-400"><X className="h-3.5 w-3.5" /></button>
                </div>
                <p className="text-[12px] leading-5 text-zinc-200">{t('chooseBody')}</p>
                <button type="button" onClick={() => setFactsHint(false)} className="mt-2 rounded-md bg-white px-2 py-1 text-[12px] font-medium text-zinc-950">{t('gotIt')}</button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {range !== 'all' ? <p className="mb-3 text-[12px] text-zinc-500">{t('rangeNote', { count: range })}</p> : null}
      {models !== null ? (
        <div className="mb-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => setModels(null)} className="inline-flex h-7 items-center gap-1 rounded-lg border border-nuw-line bg-white px-2 text-[12px]">
            {t('models')} · {modelLabels[models[0] ?? ''] ?? models[0]}{models.length > 1 ? ` +${models.length - 1}` : ''}
            <X className="h-3 w-3 text-zinc-400" />
          </button>
        </div>
      ) : null}

      <div className="mb-4 flex items-center gap-5 border-b border-nuw-line text-[14px]">
        {(['market', 'objections', 'facts'] as const).map((id) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={cn('-mb-px border-b-2 px-1 pb-2', tab === id ? 'border-zinc-950 font-medium' : 'border-transparent text-zinc-500')}>
            {t(id)}
          </button>
        ))}
        {tour < 0 && tab === 'market' ? (
          <button type="button" onClick={() => setTour(0)} className="mb-2 ml-auto text-[13px] text-zinc-500 hover:text-zinc-900">{t('takeTour')}</button>
        ) : null}
      </div>

      {tab === 'market' ? (
        <MarketView
          brandName={brand.name}
          industry={industry}
          languageLabel={languageLabel}
          scope={scope}
          attributes={attributes}
          terms={terms}
          shapeIds={shapeIds}
          selectedShape={selectedShape}
          heatIds={heatIds}
          sortBrand={sortBrand}
          sortDir={sortDir}
          tour={tourId}
          onIndustry={async (value) => {
            try {
              await saveSettings({ industry: value })
              push({ title: t('industrySavedTitle'), body: t('industrySavedBody', { industry: value }) })
            } catch (caught) {
              fail(caught)
            }
          }}
          onLanguage={(value) => setPendingLanguage(value)}
          onScope={(value) => { void saveSettings({ scope: value }).catch(fail) }}
          onShapeIds={setShapeIds}
          onSelectShape={setSelectedShape}
          onHeatIds={setHeatIds}
          onSort={sortBy}
          onManage={() => setManageOpen(true)}
          onAdd={() => setAddOpen(true)}
          onInvite={() => setInviteOpen(true)}
          heatBrands={heatBrands}
          sources={sources}
          updatedAt={perception.data?.updatedAt}
        />
      ) : null}
      {tab === 'objections' ? <ObjectionsView objections={objections} /> : null}
      {tab === 'facts' ? (
        <FactsView
          brandName={brand.name}
          text={factText}
          onText={(value) => {
            setFactText(value)
            setCheckResult(null)
          }}
          selected={selectedPrompts}
          onSelected={setSelectedPrompts}
          checking={checking}
          onCheck={() => void runCheck()}
          onEdit={() => setCheckResult(null)}
          open={promptsOpen}
          onOpen={setPromptsOpen}
          prompts={promptRows}
          factLimit={factLimit}
          promptLimit={checkPromptLimit}
          saved={factText === savedFacts}
          result={checkResult}
          onSave={async () => {
            await saveFacts()
            push({ title: t('factsSavedTitle'), body: t('factsSavedBody') })
          }}
          onSuggest={async () => (await v2Send<{ facts: string[] }>('POST', 'perception/facts/suggest', {})).facts ?? []}
        />
      ) : null}

      {tourId ? <Tour step={tour} onStep={setTour} onClose={() => setTour(-1)} /> : null}

      <ManageDialog
        open={manageOpen}
        attributes={attributes}
        terms={terms}
        onClose={() => setManageOpen(false)}
        onApply={applyManage}
      />
      <AddAttributeDialog
        open={addOpen}
        terms={terms}
        customCount={attributes.filter((item) => !item.builtin).length}
        customAttributeLimit={customAttributeLimit}
        onClose={() => setAddOpen(false)}
        onCreate={async (name, termIds) => {
          await v2Send('POST', 'perception/attributes', { name, termIds })
          perception.reload()
          setAddOpen(false)
          push({ title: t('applyDoneTitle'), body: t('customHeatNote') })
        }}
      />
      <InviteDialog
        open={inviteOpen}
        brandName={brand.name}
        initials={brand.initials}
        color={brand.color}
        onClose={() => setInviteOpen(false)}
        onSend={async (invite) => {
          await v2Send('POST', 'workspaces/current/invites', invite)
          setInviteOpen(false)
          push({ title: t('inviteSentTitle'), body: t('inviteSentBody', { email: invite.email }) })
        }}
      />
      <Modal open={pendingLanguage !== null} title={t('languageTitle')} onClose={() => setPendingLanguage(null)}>
        <div className="p-5">
          <h2 className="text-base font-semibold">{t('languageTitle')}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{t('languageBody', { language: languages.find((item) => item.id === pendingLanguage)?.label ?? '' })}</p>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setPendingLanguage(null)} className="rounded-lg px-3 py-1.5 text-[13px] hover:bg-zinc-100">{t('cancel')}</button>
            <button
              type="button"
              onClick={async () => {
                if (pendingLanguage) {
                  try {
                    await saveSettings({ language: pendingLanguage })
                  } catch (caught) {
                    fail(caught)
                  }
                }
                setPendingLanguage(null)
              }}
              className="rounded-lg bg-nuw-button px-3 py-1.5 text-[13px] text-white"
            >
              {t('changeLanguage')}
            </button>
          </div>
        </div>
      </Modal>
      <span className="sr-only">{filterCount}</span>
    </div>
  )
}

function ModelFilter({
  models,
  groups,
  labels,
  selectable,
  onChange,
  onUpgrade,
}: {
  models: Choice
  groups: { active: string[]; available: string[]; locked: string[] }
  labels: Record<string, string>
  selectable: string[]
  onChange: (value: Choice) => void
  onUpgrade: () => void
}) {
  const t = useTranslations('perception.page')
  const [error, setError] = useState('')
  const toggle = (id: string) => {
    const current = models ?? selectable
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    if (next.length === 0) {
      setError(t('needModel'))
      return
    }
    setError('')
    onChange(next.length === selectable.length ? null : next)
  }
  return (
    <Menu
      panelClassName="w-[420px] p-0"
      trigger={() => (
        <button type="button" className="flex h-8 items-center gap-1.5 rounded-lg border border-nuw-line bg-white px-2.5 text-[13px]">
          {t('filters')}
          {models ? <span className="rounded bg-zinc-100 px-1.5 text-[11px]">1</span> : null}
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
        </button>
      )}
    >
      <div className="grid grid-cols-[150px_1fr]">
        <div className="border-r border-nuw-line p-2">
          <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('filterBy')}</p>
          <p className="rounded-lg bg-zinc-100 px-2 py-2 text-[13px]">{t('models')}</p>
          <button type="button" onClick={() => onChange(null)} className="mt-1 w-full rounded-lg px-2 py-2 text-left text-[13px] hover:bg-zinc-100">{t('resetFilters')}</button>
        </div>
        <div className="max-h-80 overflow-auto p-2">
          <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-zinc-50">
            <input type="checkbox" checked={models === null} onChange={() => onChange(null)} /> {t('allModels')}
          </label>
          <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('activeModels')}</p>
          {groups.active.map((id) => (
            <ModelRow key={id} id={id} label={labels[id] ?? id} checked={models === null || models.includes(id)} onChange={() => toggle(id)} onOnly={() => onChange([id])} />
          ))}
          {groups.available.length ? <p className="px-2 py-1 text-[11px] font-medium text-zinc-400">{t('availableModels')}</p> : null}
          {groups.available.map((id) => (
            <ModelRow key={id} id={id} label={labels[id] ?? id} checked={models === null || models.includes(id)} onChange={() => toggle(id)} onOnly={() => onChange([id])} />
          ))}
          {error ? <p className="px-2 pt-2 text-[12px] leading-5 text-rose-600">{error}</p> : null}
          {groups.locked.map((id) => (
            <button key={id} type="button" onClick={onUpgrade} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[13px] text-zinc-400 hover:bg-zinc-50">
              <span className="inline-flex items-center gap-2"><Dot id={id} />{labels[id] ?? id}</span>
              <span className="rounded border border-nuw-line px-1.5 py-0.5 text-[11px]">{t('upgrade')}</span>
            </button>
          ))}
        </div>
      </div>
    </Menu>
  )
}

function ModelRow({ id, label, checked, onChange, onOnly }: { id: string; label: string; checked: boolean; onChange: () => void; onOnly: () => void }) {
  const t = useTranslations('perception.page')
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1 text-[13px] hover:bg-zinc-50">
      <label className="flex min-w-0 flex-1 items-center gap-2">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <Dot id={id} />
        <span className="truncate">{label}</span>
      </label>
      <button type="button" onClick={onOnly} className="rounded px-1.5 py-0.5 text-[11px] text-zinc-500 hover:bg-white">{t('only')}</button>
    </div>
  )
}

function Dot({ id }: { id: string }) {
  const color = id === 'chatgpt' ? '#10a37f' : id === 'perplexity' ? '#20808d' : id === 'aioverview' ? '#4285f4' : id === 'gemini' ? '#8ab4f8' : '#a1a1aa'
  return <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
}

function Tour({ step, onStep, onClose }: { step: number; onStep: (step: number) => void; onClose: () => void }) {
  const t = useTranslations('perception.page')
  const id = tourIds[step]
  const [pos, setPos] = useState({ top: 120, left: 280 })
  useEffect(() => {
    const el = document.querySelector(`[data-tour="${id}"]`)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const place = () => {
      const rect = el?.getBoundingClientRect()
      if (!rect) return
      setPos({
        top: Math.min(rect.top + 24, window.innerHeight - 200),
        left: Math.min(Math.max(16, rect.left + 24), window.innerWidth - 340),
      })
    }
    const timer = window.setTimeout(place, 280)
    window.addEventListener('resize', place)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', place)
    }
  }, [id])
  const last = step === tourIds.length - 1
  return (
    <div className="fixed z-[60] w-80 rounded-xl bg-zinc-950 p-3 text-[13px] leading-5 text-white shadow-menu" style={{ top: pos.top, left: pos.left }}>
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="font-medium">{t(`tour${step + 1}Title`)}</p>
        <button type="button" aria-label={t('close')} onClick={onClose} className="text-zinc-400"><X className="h-3.5 w-3.5" /></button>
      </div>
      <p className="text-[12px] leading-5 text-zinc-200">{t(`tour${step + 1}Body`)}</p>
      <div className="mt-3 flex items-center justify-between">
        <button type="button" onClick={onClose} className="text-[12px] text-zinc-300">{t('skipTour')}</button>
        <div className="flex gap-2">
          {step > 0 ? <button type="button" onClick={() => onStep(step - 1)} className="rounded-md px-2 py-1 text-[12px] text-zinc-200">{t('back')}</button> : null}
          <button type="button" onClick={() => (last ? onClose() : onStep(step + 1))} className="rounded-md bg-white px-2.5 py-1 text-[12px] font-medium text-zinc-950">
            {last ? t('finish') : t('next')}
          </button>
        </div>
      </div>
    </div>
  )
}
