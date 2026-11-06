'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import type { Brand, DimensionKey, MetricKey, ModelId, RangeKey, WidgetId, WorkspaceMode } from '@/data/types'
import { metricOrder, widgetIds } from '@/data/types'
import { markSelectionMissing, markSelectionPending, markSelectionReady, rangeQuery, V2Error, v2Get, v2Send } from '@/lib/v2'

export type SwitchBrand = { id: string; name: string; domain: string; initials: string; color: string }
export type WorkspaceSummary = { id: string; name: string; mode: WorkspaceMode; brands: SwitchBrand[]; createdAt?: string | null }
type WorkspaceList = { workspaces: WorkspaceSummary[]; limit: number | null; used: number; canCreate: boolean }
export type NewWorkspace = { name: string; domain: string; brandName: string; mode: WorkspaceMode }

async function recoverFinishedSetup(knownId?: string) {
  const state = await v2Get<{ status?: string; workspaceId?: string; draft?: { domain?: string; name?: string } }>('onboarding').catch(() => null)
  const domain = state?.draft?.domain?.trim() ?? ''
  const id = state?.workspaceId?.trim() || knownId || ''
  if (state?.status === 'completed' && id && domain) {
    return { workspaceId: id, domain, name: state.draft?.name?.trim() || domain, brands: [brandFrom(domain, state.draft?.name || domain)] }
  }
  if (!knownId) return null
  const detail = await v2Get<{ brands?: SwitchBrand[] }>(`workspaces/${knownId}`).catch(() => null)
  const brands = (detail?.brands ?? []).filter((item) => item.domain)
  if (brands.length) {
    return { workspaceId: knownId, domain: brands[0].domain, name: brands[0].name, brands }
  }
  if (!domain) return null
  return { workspaceId: knownId, domain, name: state?.draft?.name?.trim() || domain, brands: [brandFrom(domain, state?.draft?.name || domain)] }
}

async function saveSelection(workspaceId: string, domain?: string) {
  const response = await fetch('/api/selection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceId, domain }),
    cache: 'no-store',
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const detail = body && typeof body === 'object' && 'detail' in body ? (body as { detail?: { message?: string } }).detail : null
    throw new Error(detail?.message || 'The workspace could not be selected. Refresh the page and pick it again.')
  }
  markSelectionReady()
}

function brandFrom(domain: string, name: string): SwitchBrand {
  const clean = name.trim() || domain
  const letters = clean.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')
  return { id: domain, name: clean, domain, initials: letters || 'BR', color: '#E85D0C' }
}

function emptyBrand(): Brand {
  const metrics = {} as Brand['metrics']
  for (const key of metricOrder) metrics[key] = { value: 0 }
  return {
    id: '',
    name: '',
    domain: '',
    initials: '',
    color: '#E85D0C',
    matrixScale: 1,
    retrievals: 0,
    metrics,
    series: [],
    competitors: [],
    domains: [],
    domainTypes: [],
  }
}

type Filters = {
  models: ModelId[]
  countries: string[]
  tags: string[]
  brands: string[]
  features: string[]
  sources: string[]
  featureMode: 'or' | 'and'
  brandMode: 'or' | 'and'
}

type WorkspaceState = {
  mode: WorkspaceMode
  brandId: string
  range: RangeKey
  agent: boolean
  hidden: WidgetId[]
  checklistHidden: boolean
  steps: string[]
  filters: Filters
  matrixMetric: MetricKey
  matrixX: DimensionKey
  matrixY: DimensionKey
  setMode: (mode: WorkspaceMode) => void
  setBrandId: (id: string) => void
  setRange: (range: RangeKey) => void
  setAgent: (agent: boolean) => void
  toggleWidget: (id: WidgetId) => void
  resetView: () => void
  setChecklistHidden: (hidden: boolean) => void
  completeStep: (id: string) => void
  setFilters: (filters: Filters | ((current: Filters) => Filters)) => void
  setMatrixMetric: (metric: MetricKey) => void
  setMatrixX: (dimension: DimensionKey) => void
  setMatrixY: (dimension: DimensionKey) => void
  reveal: (id: string) => void
  brand: Brand
  workspaceBrands: SwitchBrand[]
  workspaces: WorkspaceSummary[]
  workspaceId: string
  setWorkspaceId: (id: string) => void
  workspaceLimit: number | null
  workspaceUsed: number
  canCreateWorkspace: boolean
  createWorkspace: (input: NewWorkspace) => Promise<WorkspaceSummary>
  adoptWorkspace: (workspaceId: string, domain: string, name: string) => Promise<void>
  reloadWorkspaces: () => void
  scopeReady: boolean
  apiMessage: string | null
  apiLoading: boolean
}

const defaultFilters: Filters = {
  models: [],
  countries: [],
  tags: [],
  brands: [],
  features: [],
  sources: [],
  featureMode: 'or',
  brandMode: 'or',
}

const WorkspaceContext = createContext<WorkspaceState | null>(null)

const storageKey = 'nuwtonic-overview-preview'

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mode, setModeState] = useState<WorkspaceMode>('agency')
  const [brandId, setBrandIdState] = useState('')
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([])
  const [workspaceId, setWorkspaceIdState] = useState('')
  const [workspaceLimit, setWorkspaceLimit] = useState<number | null>(null)
  const [workspaceUsed, setWorkspaceUsed] = useState(0)
  const [canCreateWorkspace, setCanCreateWorkspace] = useState(false)
  const [selection, setSelection] = useState<{ workspaceId: string; domain: string } | null>(null)
  const [listNonce, setListNonce] = useState(0)
  const [range, setRange] = useState<RangeKey>('all')
  const [agent, setAgent] = useState(false)
  const [hidden, setHidden] = useState<WidgetId[]>([])
  const [checklistHidden, setChecklistHidden] = useState(false)
  const [steps, setSteps] = useState<string[]>(['workspace'])
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [matrixMetric, setMatrixMetric] = useState<MetricKey>('winRate')
  const [matrixX, setMatrixX] = useState<DimensionKey>('topics')
  const [matrixY, setMatrixY] = useState<DimensionKey>('tags')
  const [ready, setReady] = useState(false)
  const [brand, setBrand] = useState<Brand>(emptyBrand)
  const [workspaceBrands, setWorkspaceBrands] = useState<SwitchBrand[]>([])
  const [apiMessage, setApiMessage] = useState<string | null>(null)
  const [apiLoading, setApiLoading] = useState(true)

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<WorkspaceState> & { filters?: Filters }
        if (parsed.mode === 'solo' || parsed.mode === 'agency') setModeState(parsed.mode)
        if (typeof parsed.brandId === 'string') setBrandIdState(parsed.brandId)
        if (typeof (parsed as { workspaceId?: unknown }).workspaceId === 'string') setWorkspaceIdState((parsed as { workspaceId: string }).workspaceId)
        if (Array.isArray(parsed.hidden)) setHidden(parsed.hidden.filter((id): id is WidgetId => widgetIds.includes(id as WidgetId)))
        if (typeof parsed.checklistHidden === 'boolean') setChecklistHidden(parsed.checklistHidden)
        if (Array.isArray(parsed.steps)) setSteps(parsed.steps.filter((step) => typeof step === 'string'))
      } catch {
        window.localStorage.removeItem(storageKey)
      }
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ mode, brandId, workspaceId, hidden, checklistHidden, steps }),
    )
  }, [ready, mode, brandId, workspaceId, hidden, checklistHidden, steps])

  // The signed-in user's workspaces. Pick the last used one (or the first),
  // save the pick for the /api/v2 proxy, then load that workspace's data.
  // Retries after sign-in. Once a workspace is saved, only an explicit reload
  // (finishing setup, creating a workspace) fetches the list again.
  useEffect(() => {
    if (!ready) return
    if (selection && listNonce === 0) return
    let cancel = false
    if (!selection) markSelectionPending()
    const noWorkspace = 'No workspace is selected yet. If this is your first visit, finish setup to create your first workspace. If you already finished setup, refresh this page.'
    const giveUp = (message: string) => {
      if (cancel) return
      setApiMessage(message)
      setApiLoading(false)
      markSelectionMissing()
    }
    const apply = async (id: string, domain: string, brands: SwitchBrand[], all: WorkspaceSummary[]) => {
      const brand = brands.find((item) => item.id === brandId) ?? brands.find((item) => item.domain === domain) ?? brands[0]
      await saveSelection(id, brand?.domain || domain)
      if (cancel) return
      if (all.length) setWorkspaces(all)
      setWorkspaceIdState(id)
      setWorkspaceBrands(brands)
      if (brand) setBrandIdState(brand.id)
      setSelection({ workspaceId: id, domain: brand?.domain || domain })
      setApiMessage(null)
    }
    v2Get<WorkspaceList>('workspaces')
      .then(async (list) => {
        if (cancel) return
        setWorkspaceLimit(list.limit)
        setWorkspaceUsed(list.used ?? (list.workspaces ?? []).length)
        setCanCreateWorkspace(list.canCreate)
        const rows = list.workspaces ?? []
        const chosen = rows.find((item) => item.id === workspaceId) ?? rows[0]
        if (!chosen) {
          const recovered = await recoverFinishedSetup(workspaceId)
          if (cancel) return
          if (recovered) {
            await apply(recovered.workspaceId, recovered.domain, recovered.brands, [])
            return
          }
          giveUp(noWorkspace)
          return
        }
        const domain = chosen.brands.find((item) => item.domain)?.domain ?? ''
        if (!domain) {
          const recovered = await recoverFinishedSetup(chosen.id)
          if (cancel) return
          if (!recovered) {
            giveUp('This workspace has no brand yet. Open the workspace switcher at the top of the sidebar and add the brand website.')
            return
          }
          await apply(recovered.workspaceId, recovered.domain, recovered.brands, rows)
          return
        }
        await apply(chosen.id, domain, chosen.brands, rows)
      })
      .catch(async (error: unknown) => {
        if (cancel) return
        try {
          const recovered = await recoverFinishedSetup(workspaceId)
          if (cancel) return
          if (!recovered) {
            const missingList = error instanceof V2Error && (error.status === 404 || error.status === 405)
            giveUp(missingList || !(error instanceof Error) || !error.message ? noWorkspace : error.message)
            return
          }
          await apply(recovered.workspaceId, recovered.domain, recovered.brands, [])
        } catch (cause) {
          giveUp(cause instanceof Error && cause.message ? cause.message : noWorkspace)
        }
      })
    return () => {
      cancel = true
    }
    // workspaceId/brandId are the restored pick, read once per load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, listNonce, pathname, selection])

  useEffect(() => {
    if (!selection) return
    let cancel = false
    setApiLoading(true)
    const overviewQuery = {
      ...rangeQuery(range),
      granularity: 'day',
      compare: 'period' as const,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      engines: filters.models,
      countries: filters.countries,
    }
    Promise.allSettled([
      v2Get<Brand>('prompt-runs/overview', overviewQuery),
      v2Get<{ mode: WorkspaceMode; brands: SwitchBrand[] }>('workspaces/current'),
    ]).then(([overview, workspace]) => {
      if (cancel) return
      if (overview.status === 'fulfilled' && overview.value) setBrand({ ...emptyBrand(), ...overview.value, metrics: { ...emptyBrand().metrics, ...(overview.value.metrics ?? {}) } })
      if (workspace.status === 'fulfilled' && workspace.value) setWorkspaceBrands(workspace.value.brands ?? [])
      const failed = [overview, workspace].find((item) => item.status === 'rejected')
      setApiMessage(failed && failed.status === 'rejected' ? (failed.reason instanceof Error ? failed.reason.message : 'The workspace could not be loaded. Try again.') : null)
      setApiLoading(false)
    })
    return () => {
      cancel = true
    }
  }, [selection, range, filters.models, filters.countries, pathname])

  const availableIds = workspaceBrands.map((item) => item.id)
  const safeBrandId = availableIds.includes(brandId) ? brandId : availableIds[0] ?? brand.id

  const value = useMemo<WorkspaceState>(() => {
    const reveal = (id: string) => {
      setAgent(false)
      if (widgetIds.includes(id as WidgetId)) {
        setHidden((current) => current.filter((item) => item !== id))
      }
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        if (id === 'ask') {
          document.getElementById('ask-input')?.focus()
        }
      }, 40)
    }

    return {
      mode,
      brandId: safeBrandId,
      range,
      agent,
      hidden,
      checklistHidden,
      steps,
      filters,
      matrixMetric,
      matrixX,
      matrixY,
      setMode: setModeState,
      setBrandId: (id: string) => {
        const chosen = workspaceBrands.find((item) => item.id === id)
        if (!chosen || !workspaceId) {
          setBrandIdState(id)
          return
        }
        void saveSelection(workspaceId, chosen.domain).then(() => {
          setBrandIdState(id)
          setSelection({ workspaceId, domain: chosen.domain })
        })
      },
      workspaces,
      workspaceId,
      setWorkspaceId: (id: string) => {
        const chosen = workspaces.find((item) => item.id === id)
        if (!chosen) return
        const nextBrand = chosen.brands.find((item) => item.id === brandId) ?? chosen.brands[0]
        void saveSelection(id, nextBrand?.domain).then(() => {
          setWorkspaceIdState(id)
          setWorkspaceBrands(chosen.brands ?? [])
          if (nextBrand) setBrandIdState(nextBrand.id)
          setSelection({ workspaceId: id, domain: nextBrand?.domain ?? '' })
        })
      },
      workspaceLimit,
      workspaceUsed,
      canCreateWorkspace,
      createWorkspace: async (input: NewWorkspace) => {
        const created = await v2Send<WorkspaceSummary & { limit?: number | null; used?: number; canCreate?: boolean }>('POST', 'workspaces', input)
        const summary: WorkspaceSummary = { id: created.id, name: created.name, mode: created.mode, brands: created.brands ?? [] }
        setWorkspaces((current) => [...current, summary])
        if (typeof created.used === 'number') setWorkspaceUsed(created.used)
        if (created.limit !== undefined) setWorkspaceLimit(created.limit)
        if (typeof created.canCreate === 'boolean') setCanCreateWorkspace(created.canCreate)
        const firstBrand = summary.brands[0]
        setWorkspaceIdState(summary.id)
        setWorkspaceBrands(summary.brands)
        if (firstBrand) setBrandIdState(firstBrand.id)
        await saveSelection(summary.id, firstBrand?.domain)
        setSelection({ workspaceId: summary.id, domain: firstBrand?.domain ?? '' })
        return summary
      },
      adoptWorkspace: async (id: string, domain: string, name: string) => {
        const brand = brandFrom(domain, name)
        await saveSelection(id, domain)
        setWorkspaces((current) => (current.some((item) => item.id === id) ? current : [...current, { id, name: name || domain, mode: 'solo', brands: [brand] }]))
        setWorkspaceIdState(id)
        setWorkspaceBrands([brand])
        setBrandIdState(brand.id)
        setSelection({ workspaceId: id, domain })
        setApiMessage(null)
        setApiLoading(false)
      },
      scopeReady: selection !== null,
      reloadWorkspaces: () => setListNonce((current) => current + 1),
      setRange,
      setAgent,
      toggleWidget: (id) => setHidden((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id])),
      resetView: () => {
        setHidden([])
        setChecklistHidden(false)
        setSteps(['workspace'])
        setFilters(defaultFilters)
        setMatrixMetric('winRate')
        setMatrixX('topics')
        setMatrixY('tags')
        setRange('all')
        setAgent(false)
        setModeState('agency')
        setBrandIdState(workspaceBrands[0]?.id ?? '')
      },
      setChecklistHidden,
      completeStep: (id) => setSteps((current) => (current.includes(id) ? current : [...current, id])),
      setFilters,
      setMatrixMetric,
      setMatrixX,
      setMatrixY,
      reveal,
      brand,
      workspaceBrands,
      apiMessage,
      apiLoading,
    }
  }, [mode, safeBrandId, range, agent, hidden, checklistHidden, steps, filters, matrixMetric, matrixX, matrixY, brand, workspaceBrands, workspaces, workspaceId, workspaceLimit, workspaceUsed, canCreateWorkspace, selection, apiMessage, apiLoading])

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return context
}

export function useBrand() {
  const { brand } = useWorkspace()
  return brand
}
