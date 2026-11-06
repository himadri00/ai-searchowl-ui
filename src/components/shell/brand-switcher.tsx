'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, ChevronDown, Plus, Search } from 'lucide-react'
import { useBrand, useWorkspace, type SwitchBrand } from '@/components/workspace/workspace-context'
import { isDomain, normalizeDomain } from '@/components/onboarding/onboarding-api'
import { BrandMark } from '@/components/shell/brand-mark'
import { cn } from '@/lib/cn'
import { Menu, Modal, useMenu } from '@/components/ui/overlay'

export function BrandSwitcher({ variant = 'header' }: { variant?: 'header' | 'sidebar' }) {
  const t = useTranslations('shell')
  const { mode, setMode, brandId, setBrandId, workspaceBrands, workspaces, workspaceId, setWorkspaceId, canCreateWorkspace, workspaceLimit, workspaceUsed, createWorkspace } = useWorkspace()
  const active = useBrand()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const current = workspaceBrands.find((brand) => brand.id === brandId) ?? {
    id: active.id,
    name: active.name || 'Brand',
    domain: active.domain,
    initials: active.initials || 'AO',
    color: active.color,
  }
  const list = useMemo(() => {
    const available = workspaceBrands.length ? workspaceBrands : current.name ? [current] : []
    const needle = query.trim().toLowerCase()
    if (!needle) return available
    return available.filter((brand) => `${brand.name} ${brand.domain}`.toLowerCase().includes(needle))
  }, [workspaceBrands, query, active])

  return (
    <>
    <Menu
      align="left"
      panelClassName="w-[280px] p-2"
      trigger={() => (
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 rounded-lg text-left hover:bg-zinc-100',
            variant === 'sidebar' ? 'min-w-0 flex-1 px-1.5 py-1' : 'h-8 border border-nuw-line bg-white px-2',
          )}
        >
          <BrandMark initials={current.initials} color={current.color} size={variant === 'sidebar' ? 22 : 18} />
          <span className="truncate text-[13px] font-medium text-zinc-900">{current.name}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        </button>
      )}
    >
      <BrandMenu
        query={query}
        setQuery={setQuery}
        list={list}
        brandId={brandId}
        setBrandId={setBrandId}
        mode={mode}
        setMode={setMode}
        searchLabel={t('searchBrands')}
        emptyLabel={t('noBrandMatch')}
        workspaceTitle={t('workspaceTitle')}
        solo={t('workspaceSolo')}
        agency={t('workspaceAgency')}
        soloHint={t('workspaceSoloHint')}
        agencyHint={t('workspaceAgencyHint')}
        workspaces={workspaces}
        workspaceId={workspaceId}
        setWorkspaceId={setWorkspaceId}
        canCreateWorkspace={canCreateWorkspace}
        workspaceLimit={workspaceLimit}
        workspaceUsed={workspaceUsed}
        onCreate={() => setCreating(true)}
      />
    </Menu>
    <CreateWorkspaceDialog open={creating} onClose={() => setCreating(false)} onCreate={createWorkspace} />
    </>
  )
}

function CreateWorkspaceDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (input: { name: string; domain: string; brandName: string; mode: 'solo' | 'agency' }) => Promise<unknown>
}) {
  const t = useTranslations('shell')
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [brandName, setBrandName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    const cleanDomain = normalizeDomain(domain)
    if (!isDomain(cleanDomain)) {
      setError(t('workspaceDomainError'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onCreate({ name: name.trim(), domain: cleanDomain, brandName: brandName.trim(), mode: 'solo' })
      setName('')
      setDomain('')
      setBrandName('')
      onClose()
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : t('workspaceDomainError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} title={t('workspaceCreateTitle')} onClose={onClose}>
      <div className="w-[min(440px,92vw)] p-5">
        <h2 className="text-base font-semibold">{t('workspaceCreateTitle')}</h2>
        <p className="mt-1 text-[13px] leading-5 text-zinc-600">{t('workspaceCreateHint')}</p>
        <label className="mt-4 block text-[12px] font-medium text-zinc-600">{t('brandDomain')}</label>
        <input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder={t('brandDomainPlaceholder')} className="mt-1 h-9 w-full rounded-lg border border-nuw-line px-2 text-[13px] outline-none focus:border-nuw-primary" />
        <label className="mt-3 block text-[12px] font-medium text-zinc-600">{t('brandName')}</label>
        <input value={brandName} onChange={(event) => setBrandName(event.target.value)} placeholder={t('brandNamePlaceholder')} className="mt-1 h-9 w-full rounded-lg border border-nuw-line px-2 text-[13px] outline-none focus:border-nuw-primary" />
        <label className="mt-3 block text-[12px] font-medium text-zinc-600">{t('workspaceName')}</label>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder={t('workspaceNamePlaceholder')} className="mt-1 h-9 w-full rounded-lg border border-nuw-line px-2 text-[13px] outline-none focus:border-nuw-primary" />
        {error ? <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[13px] leading-5 text-rose-700">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-lg px-3 text-[13px] hover:bg-zinc-100">{t('workspaceCancel')}</button>
          <button type="button" disabled={busy} onClick={() => void submit()} className="h-9 rounded-lg bg-nuw-button px-3 text-[13px] text-white hover:bg-nuw-buttonHover disabled:bg-zinc-400">
            {busy ? t('workspaceCreating') : t('workspaceCreateAction')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function BrandMenu({
  query,
  setQuery,
  list,
  brandId,
  setBrandId,
  mode,
  setMode,
  searchLabel,
  emptyLabel,
  workspaceTitle,
  solo,
  agency,
  soloHint,
  agencyHint,
  workspaces,
  workspaceId,
  setWorkspaceId,
  canCreateWorkspace,
  workspaceLimit,
  workspaceUsed,
  onCreate,
}: {
  query: string
  setQuery: (value: string) => void
  list: SwitchBrand[]
  brandId: string
  setBrandId: (id: string) => void
  mode: 'solo' | 'agency'
  setMode: (mode: 'solo' | 'agency') => void
  searchLabel: string
  emptyLabel: string
  workspaceTitle: string
  solo: string
  agency: string
  soloHint: string
  agencyHint: string
  workspaces: { id: string; name: string; brands: SwitchBrand[] }[]
  workspaceId: string
  setWorkspaceId: (id: string) => void
  canCreateWorkspace: boolean
  workspaceLimit: number | null
  workspaceUsed: number
  onCreate: () => void
}) {
  const { close } = useMenu()
  const t = useTranslations('shell')
  return (
    <div>
      <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">{t('workspaceListTitle')}</p>
      <div className="max-h-40 overflow-auto">
        {workspaces.length === 0 ? <p className="px-2 py-2 text-[13px] leading-5 text-zinc-500">{t('noWorkspaces')}</p> : null}
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            type="button"
            onClick={() => {
              setWorkspaceId(workspace.id)
              close()
            }}
            className={cn('flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-zinc-100', workspace.id === workspaceId && 'bg-zinc-100')}
          >
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium">{workspace.name}</span>
              <span className="block truncate text-[11px] text-zinc-500">{workspace.brands[0]?.domain ?? t('noWorkspaces')}</span>
            </span>
            {workspace.id === workspaceId ? <Check className="ml-auto h-4 w-4 shrink-0 text-zinc-700" /> : null}
          </button>
        ))}
      </div>
      {canCreateWorkspace ? (
        <button type="button" onClick={() => { close(); onCreate() }} className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] font-medium text-nuw-primary hover:bg-zinc-100">
          <Plus className="h-4 w-4" /> {t('workspaceCreate')}
        </button>
      ) : workspaceLimit !== null ? (
        <p className="px-2 py-2 text-[12px] leading-5 text-zinc-500">{t('workspaceLimit', { limit: workspaceLimit, used: workspaceUsed })}</p>
      ) : null}
      <p className="mb-1 mt-2 border-t border-nuw-line px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">{t('brandsTitle')}</p>
      <label className="flex items-center gap-2 rounded-lg border border-nuw-line px-2 py-1.5">
        <Search className="h-3.5 w-3.5 text-zinc-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchLabel}
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-zinc-400"
        />
      </label>
      <div className="mt-1 max-h-56 overflow-auto">
        {list.length === 0 ? <p className="px-2 py-3 text-[13px] text-zinc-500">{emptyLabel}</p> : null}
        {list.map((brand) => (
          <button
            key={brand.id}
            type="button"
            onClick={() => {
              setBrandId(brand.id)
              close()
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-zinc-100',
              brand.id === brandId && 'bg-zinc-100',
            )}
          >
            <BrandMark initials={brand.initials} color={brand.color} size={22} />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium">{brand.name}</span>
              <span className="block truncate text-[11px] text-zinc-500">{brand.domain}</span>
            </span>
            {brand.id === brandId ? <Check className="ml-auto h-4 w-4 text-zinc-700" /> : null}
          </button>
        ))}
      </div>
      <div className="mt-1 border-t border-nuw-line pt-2">
        <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">{workspaceTitle}</p>
        {([
          ['solo', solo, soloHint],
          ['agency', agency, agencyHint],
        ] as const).map(([id, label, hint]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setMode(id)
              close()
            }}
            className={cn(
              'flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-zinc-100',
              mode === id && 'bg-zinc-50',
            )}
          >
            <span className={cn('mt-0.5 h-3.5 w-3.5 rounded-full border', mode === id ? 'border-nuw-primary bg-nuw-primary' : 'border-zinc-300')} />
            <span>
              <span className="block text-[13px] font-medium">{label}</span>
              <span className="block text-[11px] text-zinc-500">{hint}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
