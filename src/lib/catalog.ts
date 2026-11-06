'use client'

import { useEffect, useState } from 'react'
import { errorText, v2Get } from '@/lib/v2'

export type CatalogEngine = {
  id: string
  label: string
  method: string
  state: 'available' | 'coming_soon' | 'locked'
  addon: string | null
  inSchedule: boolean
  showInUi: boolean
}

export type CatalogModule = { id: string; label: string; kind: 'limit' | 'feature'; enabled: boolean; limit?: number | null }
export type Catalog = { engines: CatalogEngine[]; modules: CatalogModule[] }

let cached: Promise<Catalog> | null = null

function loadCatalog() {
  cached = cached ?? v2Get<Catalog>('catalog').catch((error: unknown) => {
    cached = null
    throw error
  })
  return cached
}

/** Engines grouped the way the model menus show them: scheduled, can be added, not on this plan yet. */
export function useCatalog() {
  const [state, setState] = useState<{ catalog: Catalog | null; error: string | null }>({ catalog: null, error: null })

  useEffect(() => {
    let cancel = false
    loadCatalog()
      .then((catalog) => { if (!cancel) setState({ catalog, error: null }) })
      .catch((error: unknown) => { if (!cancel) setState({ catalog: null, error: errorText(error, 'The model list could not be loaded. Refresh the page to try again.') }) })
    return () => {
      cancel = true
    }
  }, [])

  const engines = (state.catalog?.engines ?? []).filter((engine) => engine.showInUi)
  return {
    ...state,
    active: engines.filter((engine) => engine.state === 'available' && engine.inSchedule),
    available: engines.filter((engine) => engine.state === 'available' && !engine.inSchedule),
    comingSoon: engines.filter((engine) => engine.state === 'coming_soon'),
    locked: engines.filter((engine) => engine.state === 'locked'),
    limit: (id: string) => state.catalog?.modules.find((module) => module.id === id),
  }
}
