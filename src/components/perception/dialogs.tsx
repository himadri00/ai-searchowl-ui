'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { GripVertical, Search, X } from 'lucide-react'
import type { AttributeRecord, TermRecord } from '@/data/perception'
import { shapeSlotLimit } from '@/data/perception'
import { Modal } from '@/components/ui/overlay'
import { cn } from '@/lib/cn'
import { errorText, useV2 } from '@/lib/v2'

export function ManageDialog({
  open,
  attributes,
  terms,
  onClose,
  onApply,
}: {
  open: boolean
  attributes: AttributeRecord[]
  terms: TermRecord[]
  onClose: () => void
  onApply: (attributes: AttributeRecord[], terms: TermRecord[]) => Promise<void>
}) {
  const t = useTranslations('perception.page')
  const [draftAttributes, setDraftAttributes] = useState(attributes)
  const [draftTerms, setDraftTerms] = useState(terms)
  const [active, setActive] = useState<string | 'all'>('all')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setDraftAttributes(attributes)
    setDraftTerms(terms)
    setActive('all')
    setQuery('')
    setError('')
    setSaving(false)
  }, [open, attributes, terms])

  const apply = async () => {
    setSaving(true)
    try {
      await onApply(draftAttributes, draftTerms)
    } catch (caught) {
      setError(errorText(caught))
    } finally {
      setSaving(false)
    }
  }

  const dirty = JSON.stringify(draftAttributes) !== JSON.stringify(attributes) || JSON.stringify(draftTerms) !== JSON.stringify(terms)
  const needle = query.trim().toLowerCase()
  const visible = draftTerms.filter((term) => {
    const inGroup = active === 'all' || term.attributeId === active || (active === 'unassigned' && term.attributeId === null)
    return inGroup && term.label.toLowerCase().includes(needle)
  })
  const nameFor = (id: string | null) => draftAttributes.find((item) => item.id === id)?.name ?? t('unassigned')

  const move = (termId: string, attributeId: string | null) => {
    setDraftTerms((current) => current.map((term) => (term.id === termId ? { ...term, attributeId } : term)))
    setError('')
  }

  return (
    <Modal open={open} title={t('manageTitle')} onClose={onClose} panelClassName="max-w-4xl">
      <div className="flex items-start justify-between gap-3 border-b border-nuw-line px-5 py-4">
        <div>
          <h2 className="text-[16px] font-semibold">{t('manageTitle')}</h2>
          <p className="mt-1 max-w-2xl text-[13px] leading-5 text-zinc-500">{t('manageBody')}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={t('close')} className="text-zinc-400 hover:text-zinc-700"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid min-h-[420px] md:grid-cols-[240px_1fr]">
        <aside className="border-b border-nuw-line p-3 md:border-b-0 md:border-r">
          <p className="px-2 py-1 text-[12px] font-medium text-zinc-400">{t('attributesCount')}</p>
          <button type="button" onClick={() => setActive('all')} className={cn('flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px]', active === 'all' && 'bg-zinc-100')}>
            {t('allAttributes')} <span className="text-zinc-400">{draftTerms.length}</span>
          </button>
          {draftAttributes.map((item) => (
            <div key={item.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => move(event.dataTransfer.getData('text/plain'), item.id)} className={cn('flex items-center gap-1 rounded-lg pr-1', active === item.id && 'bg-zinc-100')}>
              <button type="button" onClick={() => setActive(item.id)} className="min-w-0 flex-1 truncate px-2 py-2 text-left text-[13px]">
                {item.name}
              </button>
              <span className="text-[12px] text-zinc-400">{draftTerms.filter((term) => term.attributeId === item.id).length}</span>
            </div>
          ))}
          <div onDragOver={(event) => event.preventDefault()} onDrop={(event) => move(event.dataTransfer.getData('text/plain'), null)} className={cn('flex items-center justify-between rounded-lg px-2 py-2 text-[13px]', active === 'unassigned' && 'bg-zinc-100')}>
            <button type="button" onClick={() => setActive('unassigned')}>{t('unassigned')}</button>
            <span className="text-zinc-400">{draftTerms.filter((term) => term.attributeId === null).length}</span>
          </div>
        </aside>
        <div className="p-3">
          {active !== 'all' && active !== 'unassigned' ? (
            <AttributeEditor
              attribute={draftAttributes.find((item) => item.id === active)!}
              canDelete={draftAttributes.length > 1}
              onRename={(name) => setDraftAttributes((current) => current.map((item) => (item.id === active ? { ...item, name } : item)))}
              onDelete={() => {
                if (draftAttributes.length < 2) {
                  setError(t('keepOne'))
                  return
                }
                setDraftTerms((current) => current.map((term) => (term.attributeId === active ? { ...term, attributeId: null } : term)))
                setDraftAttributes((current) => current.filter((item) => item.id !== active))
                setActive('all')
              }}
            />
          ) : (
            <p className="mb-2 text-[12px] leading-5 text-zinc-500">{t('dragHint')}</p>
          )}
          <label className="mb-2 flex items-center gap-2 rounded-lg border border-nuw-line px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-zinc-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchTermsManage')} className="w-full bg-transparent text-[13px] outline-none" />
          </label>
          {visible.length === 0 ? <p className="px-2 py-6 text-[13px] text-zinc-500">{t('noTerm')}</p> : (
            <table className="w-full text-left text-[13px]">
              <thead className="text-[12px] text-zinc-400">
                <tr>
                  <th className="py-2 font-medium">{t('term')}</th>
                  <th className="py-2 font-medium">{t('attribute')}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((term) => (
                  <tr key={term.id} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', term.id)} className="cursor-grab border-t border-nuw-line active:cursor-grabbing">
                    <td className="py-2">
                      <span className="inline-flex items-center gap-2">
                        <GripVertical className="h-3.5 w-3.5 text-zinc-300" />
                        {term.label}
                      </span>
                    </td>
                    <td className="py-2 text-zinc-600">{nameFor(term.attributeId)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-nuw-line px-5 py-3">
        <p className={cn('mr-auto text-[13px]', error ? 'text-rose-600' : 'text-zinc-500')}>{error || (dirty ? t('changesReady') : t('noChanges'))}</p>
        <button type="button" onClick={() => { setDraftAttributes(attributes); setDraftTerms(terms); setError('') }} className="text-[13px] text-zinc-600 hover:text-zinc-950">{t('reset')}</button>
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={() => void apply()}
          className="rounded-lg bg-nuw-button px-3 py-1.5 text-[13px] text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {saving ? t('saving') : t('applyChanges')}
        </button>
      </footer>
    </Modal>
  )
}

function AttributeEditor({
  attribute,
  canDelete,
  onRename,
  onDelete,
}: {
  attribute: AttributeRecord
  canDelete: boolean
  onRename: (name: string) => void
  onDelete: () => void
}) {
  const t = useTranslations('perception.page')
  const [name, setName] = useState(attribute.name)
  useEffect(() => setName(attribute.name), [attribute.name, attribute.id])
  return (
    <div className="mb-3 flex flex-wrap items-end gap-2">
      <label className="min-w-[200px] flex-1 text-[12px] text-zinc-500">
        {t('renameHint')}
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => {
            const next = name.trim()
            if (next) onRename(next)
            else setName(attribute.name)
          }}
          className="mt-1 w-full rounded-lg border border-nuw-line px-2 py-1.5 text-[13px] text-zinc-950 outline-none focus:border-nuw-primary"
        />
      </label>
      <button type="button" onClick={onDelete} disabled={!canDelete} className="rounded-lg border border-nuw-line px-2.5 py-1.5 text-[13px] text-rose-600 disabled:text-zinc-300">
        {t('deleteAttribute')}
      </button>
    </div>
  )
}

export function AddAttributeDialog({
  open,
  terms,
  customCount,
  customAttributeLimit,
  onClose,
  onCreate,
}: {
  open: boolean
  terms: TermRecord[]
  customCount: number
  customAttributeLimit: number
  onClose: () => void
  onCreate: (name: string, termIds: string[]) => Promise<void>
}) {
  const t = useTranslations('perception.page')
  const [name, setName] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (!open) return
    setName('')
    setPicked([])
    setQuery('')
    setError('')
    setSaving(false)
  }, [open])
  const needle = query.trim().toLowerCase()
  const visible = terms.filter((term) => term.label.toLowerCase().includes(needle))
  const atLimit = customCount >= customAttributeLimit

  return (
    <Modal open={open} title={t('addTitle')} onClose={onClose} panelClassName="max-w-lg">
      <div className="flex items-start justify-between px-5 pt-4">
        <h2 className="text-[16px] font-semibold">{t('addTitle')}</h2>
        <button type="button" onClick={onClose} aria-label={t('close')} className="text-zinc-400 hover:text-zinc-700"><X className="h-4 w-4" /></button>
      </div>
      <div className="px-5 pb-4">
        <p className="mt-1 text-[12px] text-zinc-500">{t('customUsed', { count: customCount, max: customAttributeLimit })}</p>
        {atLimit ? <p className="mt-2 text-[13px] text-rose-600">{t('addLimit', { max: customAttributeLimit })}</p> : null}
        <label className="mt-3 block text-[13px] font-medium">
          {t('attributeName')}
          <input value={name} onChange={(event) => { setName(event.target.value); setError('') }} placeholder={t('attributePlaceholder')} className="mt-1 w-full rounded-lg border border-nuw-line px-3 py-2 font-normal outline-none focus:border-nuw-primary" />
        </label>
        <p className="mt-4 text-[13px] font-medium">{t('termsCount')}</p>
        <p className="text-[12px] text-zinc-500">{t('termsPick')}</p>
        <label className="mt-2 flex items-center gap-2 rounded-lg border border-nuw-line px-2 py-1.5">
          <Search className="h-3.5 w-3.5 text-zinc-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchTerms')} className="w-full bg-transparent text-[13px] outline-none" />
        </label>
        <p className="px-1 py-1 text-[12px] text-zinc-400">{t('termTotal', { count: terms.length })}</p>
        <div className="max-h-64 overflow-auto">
          {visible.length === 0 ? <p className="py-4 text-[13px] text-zinc-500">{t('noTerm')}</p> : visible.map((term) => (
            <label key={term.id} className="flex items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-[13px] hover:bg-zinc-50">
              <span className="flex min-w-0 items-center gap-2">
                <input
                  type="checkbox"
                  checked={picked.includes(term.id)}
                  onChange={() => setPicked((current) => current.includes(term.id) ? current.filter((id) => id !== term.id) : [...current, term.id])}
                />
                <span className="truncate">{term.label}</span>
              </span>
              <span className="shrink-0 text-[12px] text-zinc-400">{term.occurrences}</span>
            </label>
          ))}
        </div>
        {error ? <p className="mt-2 text-[13px] text-rose-600">{error}</p> : null}
      </div>
      <footer className="flex justify-end gap-2 border-t border-nuw-line px-5 py-3">
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-[13px] hover:bg-zinc-100">{t('cancel')}</button>
        <button
          type="button"
          disabled={atLimit || saving}
          onClick={async () => {
            const next = name.trim()
            if (!next) {
              setError(t('nameRequired'))
              return
            }
            if (picked.length === 0) {
              setError(t('termRequired'))
              return
            }
            if (customCount >= shapeSlotLimit) {
              setError(t('addLimit', { max: shapeSlotLimit }))
              return
            }
            setSaving(true)
            try {
              await onCreate(next, picked)
            } catch (caught) {
              setError(errorText(caught))
            } finally {
              setSaving(false)
            }
          }}
          className="rounded-lg bg-nuw-button px-3 py-1.5 text-[13px] text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {saving ? t('saving') : t('addAttributeAction')}
        </button>
      </footer>
    </Modal>
  )
}

export function InviteDialog({
  open,
  brandName,
  initials,
  color,
  onClose,
  onSend,
}: {
  open: boolean
  brandName: string
  initials: string
  color: string
  onClose: () => void
  onSend: (invite: { email: string; companyMember: boolean; projects: { id: string; access: string }[] }) => Promise<void>
}) {
  const t = useTranslations('perception.page')
  const projectQuery = useV2<{ projects: { id: string; name?: string; initials?: string; color?: string }[] }>(open ? 'workspaces/current/projects' : null)
  const projects = projectQuery.data?.projects ?? []
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState(false)
  const [access, setAccess] = useState<Record<string, 'none' | 'view' | 'edit' | 'full'>>({})
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (!open) return
    setEmail('')
    setCompany(false)
    setAccess({})
    setQuery('')
    setError('')
    setSaving(false)
  }, [open])
  const needle = query.trim().toLowerCase()
  const visible = projects.filter((project) => (project.name ?? project.id).toLowerCase().includes(needle))
  const chosen = Object.entries(access).filter(([, level]) => level !== 'none').map(([id, level]) => ({ id, access: level }))
  return (
    <Modal open={open} title={t('inviteTitle')} onClose={onClose}>
      <div className="flex items-start justify-between px-5 pt-4">
        <h2 className="text-[16px] font-semibold">{t('inviteTitle')}</h2>
        <button type="button" onClick={onClose} aria-label={t('close')} className="text-zinc-400 hover:text-zinc-700"><X className="h-4 w-4" /></button>
      </div>
      <form
        className="px-5 pb-5"
        onSubmit={async (event) => {
          event.preventDefault()
          const next = email.trim()
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) {
            setError(t('inviteNeedEmail'))
            return
          }
          if (!company && chosen.length === 0) {
            setError(projects.length ? t('inviteNeedAccess') : t('inviteNoProjects'))
            return
          }
          setSaving(true)
          try {
            await onSend({ email: next, companyMember: company, projects: company ? [] : chosen })
          } catch (caught) {
            setError(errorText(caught))
          } finally {
            setSaving(false)
          }
        }}
      >
        <label className="mt-3 block text-[13px] font-medium">
          {t('email')}
          <input value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} placeholder={t('emailPlaceholder')} className="mt-1 w-full rounded-lg border border-nuw-line px-3 py-2 font-normal outline-none focus:border-nuw-primary" />
        </label>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-nuw-line p-3">
          <div>
            <p className="text-[13px] font-medium">{t('companyMember')}</p>
            <p className="text-[12px] leading-5 text-zinc-500">{t('companyBody')}</p>
          </div>
          <button type="button" aria-pressed={company} onClick={() => { setCompany((current) => !current); setError('') }} className={cn('h-6 w-11 rounded-full p-0.5', company ? 'bg-nuw-button' : 'bg-zinc-200')}>
            <span className={cn('block h-5 w-5 rounded-full bg-white transition', company && 'translate-x-5')} />
          </button>
        </div>
        <p className="mt-4 text-[13px] font-medium">{t('accessPerProject')}</p>
        <label className="mt-2 flex items-center gap-2 rounded-lg border border-nuw-line px-2 py-1.5">
          <Search className="h-3.5 w-3.5 text-zinc-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchProjects')} className="w-full bg-transparent text-[13px] font-normal outline-none" />
        </label>
        {projectQuery.loading ? <p className="mt-3 text-[13px] text-zinc-500">{t('projectsLoading')}</p> : null}
        {projectQuery.error ? <p className="mt-3 text-[13px] text-rose-600">{projectQuery.error}</p> : null}
        {!projectQuery.loading && !projectQuery.error && projects.length === 0 ? <p className="mt-3 text-[13px] leading-5 text-zinc-500">{t('inviteNoProjects')}</p> : null}
        {projects.length > 0 && visible.length === 0 ? <p className="mt-3 text-[13px] text-zinc-500">{t('noBrand')}</p> : null}
        {visible.map((project) => {
          const label = project.name ?? project.id
          const isBrand = label.toLowerCase() === brandName.toLowerCase()
          return (
            <div key={project.id} className="mt-2 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-md text-[11px] font-semibold text-white" style={{ backgroundColor: project.color ?? (isBrand ? color : '#3f3f46') }}>{project.initials ?? (isBrand ? initials : label.slice(0, 2).toUpperCase())}</span>
              <span className="flex-1 truncate text-[13px]">{label}</span>
              <select value={company ? 'full' : access[project.id] ?? 'none'} disabled={company} onChange={(event) => { setAccess((current) => ({ ...current, [project.id]: event.target.value as 'none' | 'view' | 'edit' | 'full' })); setError('') }} className="rounded-lg border border-nuw-line bg-white px-2 py-1 text-[13px] disabled:text-zinc-400">
                <option value="none">{t('noAccess')}</option>
                <option value="view">{t('viewAccess')}</option>
                <option value="edit">{t('editAccess')}</option>
                <option value="full">{t('fullAccess')}</option>
              </select>
            </div>
          )
        })}
        {error ? <p className="mt-3 text-[13px] text-rose-600">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-[13px] hover:bg-zinc-100">{t('cancel')}</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-nuw-button px-3 py-1.5 text-[13px] text-white hover:bg-nuw-buttonHover disabled:bg-zinc-400">{saving ? t('sending') : t('sendInvite')}</button>
        </div>
      </form>
    </Modal>
  )
}
