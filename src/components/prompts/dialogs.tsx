'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Upload } from 'lucide-react'
import { intentTags, locations, mentionsBrand } from '@/data/prompts'
import { topicLabel } from '@/components/prompts/bits'
import { Flag } from '@/components/prompts/flag'
import { usePrompts, type DraftPrompt, type PromptTag } from '@/components/prompts/prompts-context'
import { errorText } from '@/lib/v2'
import { downloadFile } from '@/components/perception/export-data'
import { useBrand } from '@/components/workspace/workspace-context'
import { Modal, useToast } from '@/components/ui/overlay'
import { cn } from '@/lib/cn'

export function TopicNameDialog({
  open,
  title,
  initial,
  onClose,
  onSave,
}: {
  open: boolean
  title: string
  initial: string
  onClose: () => void
  onSave: (name: string) => Promise<void>
}) {
  const t = useTranslations('prompts.page')
  const { topics } = usePrompts()
  const [name, setName] = useState(initial)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(initial)
    setError('')
    setSaving(false)
  }, [open, initial])

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError(t('topicRequired'))
      return
    }
    const taken = topics.some((topic) => topicLabel(topic, t).toLowerCase() === trimmed.toLowerCase() && topicLabel(topic, t) !== initial)
    if (taken) {
      setError(t('topicExists'))
      return
    }
    setSaving(true)
    try {
      await onSave(trimmed)
    } catch (caught) {
      setError(errorText(caught))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="p-5">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-[13px] leading-5 text-zinc-500">{t('topicHelp')}</p>
        <input
          value={name}
          onChange={(event) => { setName(event.target.value); setError('') }}
          placeholder={t('topicPlaceholder')}
          className="mt-4 w-full rounded-lg border border-nuw-line px-3 py-2 text-[13px] outline-none focus:border-nuw-primary"
        />
        {error ? <p className="mt-2 text-[13px] text-rose-600">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-lg px-3 text-[13px] hover:bg-zinc-100">{t('cancel')}</button>
          <button type="button" onClick={() => void save()} disabled={saving} className="h-9 rounded-lg bg-nuw-button px-3 text-[13px] text-white hover:bg-nuw-buttonHover disabled:bg-zinc-400">{saving ? t('saving') : t('save')}</button>
        </div>
      </div>
    </Modal>
  )
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirm,
  danger,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  body: string
  confirm: string
  danger?: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
}) {
  const t = useTranslations('prompts.page')
  const [working, setWorking] = useState(false)
  const run = async () => {
    setWorking(true)
    try {
      await onConfirm()
    } finally {
      setWorking(false)
    }
  }
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="p-5">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-2 text-[13px] leading-5 text-zinc-600">{body}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-lg px-3 text-[13px] hover:bg-zinc-100">{t('cancel')}</button>
          <button type="button" disabled={working} onClick={() => void run()} className={cn('h-9 rounded-lg px-3 text-[13px] text-white disabled:bg-zinc-400', danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-nuw-button hover:bg-nuw-buttonHover')}>
            {working ? t('working') : confirm}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function AddPromptDialog({ open, onClose, topicId }: { open: boolean; onClose: () => void; topicId: string }) {
  const t = useTranslations('prompts.page')
  const { push } = useToast()
  const { topics, prompts, tags: tagOptions, promptLimit, addPrompts } = usePrompts()
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'single' | 'bulk'>('single')
  const [text, setText] = useState('')
  const [topic, setTopic] = useState(topicId === 'all' ? topics[0]?.id ?? '' : topicId)
  const [location, setLocation] = useState('us')
  const [tags, setTags] = useState<string[]>([])
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<DraftPrompt[]>([])
  const [fileErrors, setFileErrors] = useState<string[]>([])
  const active = prompts.filter((item) => item.status === 'active').length
  const room = Math.max(0, promptLimit - active)

  useEffect(() => {
    if (!open) return
    setTab('single')
    setText('')
    setTopic(topicId === 'all' ? topics[0]?.id ?? '' : topicId)
    setLocation('us')
    setTags([])
    setError('')
    setFileName('')
    setRows([])
    setFileErrors([])
    setSaving(false)
  }, [open, topicId, topics])

  const submitLines = async (drafts: DraftPrompt[]) => {
    if (!drafts.length) {
      setError(t('writeFirst'))
      return
    }
    if (room === 0) {
      setError(promptLimit <= 0 ? t('limitMissingBody') : t('limitFull', { max: promptLimit }))
      return
    }
    setSaving(true)
    let result
    try {
      result = await addPrompts(drafts, 'active')
    } catch (caught) {
      setError(errorText(caught))
      return
    } finally {
      setSaving(false)
    }
    if (!result.added) {
      setError(promptLimit <= 0 ? t('limitMissingBody') : t('limitFull', { max: promptLimit }))
      return
    }
    onClose()
    if (result.leftOut) push({ title: t('addedPartialTitle'), body: t('addedPartial', { added: result.added, left: result.leftOut, max: promptLimit }) })
    else push({ title: t('addedTitle'), body: t('addedBody', { count: result.added }) })
  }

  return (
    <Modal open={open} title={t('addPrompt')} onClose={onClose} panelClassName="max-w-xl">
      <div className="p-5">
        <div className="grid grid-cols-2 rounded-xl bg-zinc-100 p-1 text-[13px] font-medium">
          <button type="button" onClick={() => setTab('single')} className={cn('rounded-lg py-2', tab === 'single' ? 'bg-white shadow-sm' : 'text-zinc-500')}>{t('addPrompt')}</button>
          <button type="button" onClick={() => setTab('bulk')} className={cn('rounded-lg py-2', tab === 'bulk' ? 'bg-white shadow-sm' : 'text-zinc-500')}>{t('bulk')}</button>
        </div>
        <p className="mt-4 text-[13px] text-zinc-500">{t('slots', { used: active, max: promptLimit, room })}</p>
        {room === 0 ? <p className="mt-2 text-[13px] text-rose-600">{promptLimit <= 0 ? t('limitMissingBody') : t('limitFull', { max: promptLimit })}</p> : null}
        {tab === 'single' ? (
          <SingleForm
            text={text}
            topic={topic}
            location={location}
            tags={tags}
            error={error}
            topics={topics.map((item) => ({ id: item.id, label: topicLabel(item, t) }))}
            tagOptions={tagOptions}
            saving={saving}
            onText={setText}
            onTopic={setTopic}
            onLocation={setLocation}
            onTags={setTags}
            onError={setError}
            onCancel={onClose}
            onAdd={(drafts) => void submitLines(drafts)}
          />
        ) : (
          <BulkForm
            fileName={fileName}
            rows={rows}
            errors={fileErrors}
            room={room}
            promptLimit={promptLimit}
            saving={saving}
            topics={topics.map((item) => ({ id: item.id, label: topicLabel(item, t) }))}
            tagOptions={tagOptions}
            onParsed={(name, nextRows, nextErrors) => { setFileName(name); setRows(nextRows); setFileErrors(nextErrors); setError('') }}
            onCancel={onClose}
            onAdd={() => void submitLines(rows)}
            formError={error}
          />
        )}
      </div>
    </Modal>
  )
}

function SingleForm({
  text,
  topic,
  location,
  tags,
  error,
  topics,
  tagOptions,
  saving,
  onText,
  onTopic,
  onLocation,
  onTags,
  onError,
  onCancel,
  onAdd,
}: {
  text: string
  topic: string
  location: string
  tags: string[]
  error: string
  topics: { id: string; label: string }[]
  tagOptions: PromptTag[]
  saving: boolean
  onText: (value: string) => void
  onTopic: (value: string) => void
  onLocation: (value: string) => void
  onTags: (value: string[]) => void
  onError: (value: string) => void
  onCancel: () => void
  onAdd: (drafts: DraftPrompt[]) => void
}) {
  const t = useTranslations('prompts.page')
  const brandName = useBrand().name
  const add = () => {
    if (!topic) {
      onError(t('chooseTopic'))
      return
    }
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
    if (!lines.length) {
      onError(t('writeFirst'))
      return
    }
    const branded = lines.filter((line) => mentionsBrand(line, brandName))
    if (branded.length) {
      onError(t('lineBrand', { brand: brandName, line: branded[0] }))
      return
    }
    const intent = tags.find((tag) => (intentTags as readonly string[]).includes(tag)) as DraftPrompt['intent']
    const tagIds = tags.filter((tag) => tagOptions.some((option) => option.id === tag))
    onAdd(lines.map((line) => ({
      text: line,
      topicId: topic,
      location,
      tagIds,
      intent: intent ?? null,
      branding: 'nonBranded',
    })))
  }

  return (
    <div>
      <h2 className="mt-4 text-[15px] font-semibold">{t('addPrompt')}</h2>
      <p className="mt-1 text-[13px] leading-5 text-zinc-500">{t('addBody')}</p>
      <div className="mt-4 flex items-center justify-between text-[13px]">
        <span className="font-medium">{t('promptLabel')}</span>
        <span className="text-zinc-400">{text.length}/2000</span>
      </div>
      <textarea
        value={text}
        maxLength={2000}
        onChange={(event) => { onText(event.target.value); onError('') }}
        placeholder={t('promptPlaceholder')}
        className="mt-1 h-24 w-full resize-none rounded-lg border border-nuw-line px-3 py-2 text-[13px] outline-none focus:border-nuw-primary"
      />
      <Field label={t('topic')}>
        <select value={topic} onChange={(event) => onTopic(event.target.value)} className="h-10 w-full rounded-lg border border-nuw-line bg-white px-3 text-[13px] outline-none focus:border-nuw-primary">
          <option value="">{t('chooseTopic')}</option>
          {topics.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </Field>
      <Field label={t('location')}>
        <span className="flex items-center gap-2">
          <Flag id={location} title={t(location)} />
          <select value={location} onChange={(event) => onLocation(event.target.value)} className="h-10 w-full rounded-lg border border-nuw-line bg-white px-3 text-[13px] outline-none focus:border-nuw-primary">
            {locations.map((item) => <option key={item.id} value={item.id}>{t(item.id)}</option>)}
          </select>
        </span>
      </Field>
      <Field label={t('tags')}>
        <TagPicker selected={tags} options={tagOptions} onChange={onTags} />
      </Field>
      {error ? <p className="mt-3 text-[13px] leading-5 text-rose-600">{error}</p> : null}
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-9 rounded-lg px-3 text-[13px] hover:bg-zinc-100">{t('cancel')}</button>
        <button type="button" onClick={add} disabled={saving} className="inline-flex h-9 items-center gap-1 rounded-lg bg-nuw-button px-3 text-[13px] text-white hover:bg-nuw-buttonHover disabled:bg-zinc-400">{saving ? t('saving') : `+ ${t('add')}`}</button>
      </div>
    </div>
  )
}

function BulkForm({
  fileName,
  rows,
  errors,
  room,
  promptLimit,
  saving,
  topics,
  tagOptions,
  formError,
  onParsed,
  onCancel,
  onAdd,
}: {
  fileName: string
  rows: DraftPrompt[]
  errors: string[]
  room: number
  promptLimit: number
  saving: boolean
  topics: { id: string; label: string }[]
  tagOptions: PromptTag[]
  formError: string
  onParsed: (name: string, rows: DraftPrompt[], errors: string[]) => void
  onCancel: () => void
  onAdd: () => void
}) {
  const t = useTranslations('prompts.page')
  const brandName = useBrand().name
  const read = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
      onParsed(file.name, [], [t('csvOnly')])
      return
    }
    const text = await file.text()
    const parsed = parsePromptCsv(text, topics, tagOptions, brandName, t)
    onParsed(file.name, parsed.rows, parsed.errors)
  }

  return (
    <div>
      <div className="mx-auto mt-6 grid h-16 w-24 place-items-center">
        <span className="relative block h-12 w-16">
          <span className="absolute left-0 top-3 h-8 w-8 rounded-md border border-zinc-300 bg-white" />
          <span className="absolute left-4 top-1 h-8 w-8 rounded-md border border-zinc-300 bg-white" />
          <span className="absolute left-8 top-3 h-8 w-8 rounded-md border border-zinc-300 bg-white" />
        </span>
      </div>
      <p className="mt-2 text-center text-[13px] leading-5 text-zinc-500">
        {t('bulkHint')}{' '}
        <button
          type="button"
          className="underline"
          onClick={() => downloadFile('prompts-example.csv', exampleCsv(topics[0]?.label ?? 'Topic'), 'text/csv')}
        >
          {t('downloadExample')}
        </button>
      </p>
      <label
        className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center hover:bg-zinc-50"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          const file = event.dataTransfer.files?.[0]
          if (file) void read(file)
        }}
      >
        <Upload className="mb-2 h-4 w-4 text-zinc-500" />
        <span className="text-[13px]">{t('drop')} <span className="underline">{t('browse')}</span></span>
        <input
          type="file"
          accept=".csv,.txt,text/csv"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void read(file)
          }}
        />
      </label>
      {fileName ? <p className="mt-3 text-[13px] text-zinc-700">{t('fileReady', { name: fileName, count: rows.length })}</p> : null}
      {rows.length > room ? <p className="mt-2 text-[13px] leading-5 text-rose-600">{t('fileOverLimit', { count: rows.length, room, max: promptLimit })}</p> : null}
      {errors.slice(0, 4).map((item) => <p key={item} className="mt-1 text-[13px] leading-5 text-rose-600">{item}</p>)}
      {errors.length > 4 ? <p className="mt-1 text-[13px] text-rose-600">{t('moreErrors', { count: errors.length - 4 })}</p> : null}
      {formError ? <p className="mt-2 text-[13px] text-rose-600">{formError}</p> : null}
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-9 rounded-lg border border-nuw-line px-3 text-[13px] hover:bg-zinc-50">{t('cancel')}</button>
        <button type="button" disabled={!rows.length || rows.length > room || saving} onClick={onAdd} className="h-9 rounded-lg bg-nuw-button px-3 text-[13px] text-white enabled:hover:bg-nuw-buttonHover disabled:cursor-not-allowed disabled:bg-zinc-300">
          {saving ? t('saving') : t('add')}
        </button>
      </div>
    </div>
  )
}

export function ImportDialog({ open, onClose, topicId }: { open: boolean; onClose: () => void; topicId: string }) {
  const t = useTranslations('prompts.page')
  const { push } = useToast()
  const { topics, importCsv } = usePrompts()
  const [topic, setTopic] = useState(topicId === 'all' ? '' : topicId)
  const [lines, setLines] = useState<string[]>([])
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setTopic(topicId === 'all' ? '' : topicId)
    setLines([])
    setError('')
    setFileName('')
    setSaving(false)
  }, [open, topicId])

  const read = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
      setError(t('csvOnly'))
      setLines([])
      return
    }
    const text = await file.text()
    const parsed = text.split(/\r?\n/).map((line) => line.split(',')[0]?.trim() ?? '').filter(Boolean)
    const body = parsed[0]?.toLowerCase() === 'keyword' || parsed[0]?.toLowerCase() === 'prompt' ? parsed.slice(1) : parsed
    if (!body.length) {
      setError(t('keywordEmpty'))
      setLines([])
      return
    }
    setFileName(file.name)
    setLines(body)
    setError('')
  }

  const save = async () => {
    if (!topic) {
      setError(t('chooseTopic'))
      return
    }
    if (!lines.length) {
      setError(t('keywordEmpty'))
      return
    }
    const cell = (value: string) => (/[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value)
    const csv = ['text,topicId', ...lines.map((line) => `${cell(line)},${cell(topic)}`)].join('\n')
    setSaving(true)
    try {
      const result = await importCsv(csv)
      onClose()
      push({ title: t('importedTitle'), body: t('importedBody', { count: result.added }) })
    } catch (caught) {
      setError(errorText(caught))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} title={t('importKeywords')} onClose={onClose} panelClassName="max-w-lg">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold">{t('importKeywords')}</h2>
          <button type="button" onClick={onClose} aria-label={t('close')} className="text-zinc-400 hover:text-zinc-700">×</button>
        </div>
        <p className="mt-2 text-[13px] leading-5 text-zinc-500">{t('importBody')}</p>
        <label className="mt-4 block text-[13px] font-medium">
          {t('topic')}
          <select value={topic} onChange={(event) => { setTopic(event.target.value); setError('') }} className="mt-1 h-10 w-full rounded-lg border border-nuw-line bg-white px-3 font-normal outline-none focus:border-nuw-primary">
            <option value="">{t('chooseTopic')}</option>
            {topics.map((item) => <option key={item.id} value={item.id}>{topicLabel(item, t)}</option>)}
          </select>
        </label>
        <label
          className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center hover:bg-zinc-50"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            const file = event.dataTransfer.files?.[0]
            if (file) void read(file)
          }}
        >
          <Upload className="mb-2 h-4 w-4 text-zinc-500" />
          <span className="text-[13px]">{t('drop')} <span className="underline">{t('browse')}</span></span>
          <input type="file" accept=".csv,.txt,text/csv" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void read(file) }} />
        </label>
        {fileName ? <p className="mt-3 text-[13px]">{t('keywordsReady', { name: fileName, count: lines.length })}</p> : null}
        {error ? <p className="mt-2 text-[13px] leading-5 text-rose-600">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-nuw-line px-3 text-[13px]">{t('cancel')}</button>
          <button type="button" onClick={() => void save()} disabled={saving} className="h-9 rounded-lg bg-nuw-button px-3 text-[13px] text-white disabled:bg-zinc-400">{saving ? t('saving') : t('importAction')}</button>
        </div>
      </div>
    </Modal>
  )
}

function TagPicker({ selected, options, onChange }: { selected: string[]; options: PromptTag[]; onChange: (ids: string[]) => void }) {
  const t = useTranslations('prompts.page')
  const choices = useMemo(() => [...intentTags.map((id) => ({ id, name: t(id) })), ...options], [options, t])
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id])
  return (
    <div className="rounded-lg border border-nuw-line p-2">
      <p className="px-1 pb-1 text-[12px] text-zinc-400">{selected.length ? choices.filter((item) => selected.includes(item.id)).map((item) => item.name).join(', ') : t('tagsPlaceholder')}</p>
      <div className="flex flex-wrap gap-1">
        {choices.map((item) => (
          <button key={item.id} type="button" onClick={() => toggle(item.id)} className={cn('rounded-full px-2 py-1 text-[12px]', selected.includes(item.id) ? 'bg-sky-100 text-sky-800' : 'bg-zinc-100 text-zinc-600')}>
            {item.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mt-3 block text-[13px] font-medium">
      {label}
      <div className="mt-1 font-normal">{children}</div>
    </label>
  )
}

function parsePromptCsv(text: string, topics: { id: string; label: string }[], tagOptions: PromptTag[], brandName: string, t: (key: string, values?: Record<string, string | number>) => string) {
  const table = splitCsv(text)
  if (!table.length) return { rows: [] as DraftPrompt[], errors: [t('keywordEmpty')] }
  const header = table[0].map((cell) => cell.trim().toLowerCase())
  const hasHeader = header.includes('prompt') || header.includes('keyword')
  const body = hasHeader ? table.slice(1) : table
  const promptAt = hasHeader ? Math.max(0, header.indexOf('prompt')) : 0
  const topicAt = header.indexOf('topic')
  const locationAt = header.indexOf('location')
  const tagsAt = header.indexOf('tags')
  const rows: DraftPrompt[] = []
  const errors: string[] = []
  body.forEach((cells, index) => {
    const line = index + (hasHeader ? 2 : 1)
    const prompt = cells[promptAt]?.trim() ?? ''
    if (!prompt) {
      errors.push(t('rowEmpty', { line }))
      return
    }
    if (mentionsBrand(prompt, brandName)) {
      errors.push(t('rowBrand', { line, brand: brandName }))
      return
    }
    let topicId = topics[0]?.id ?? ''
    if (topicAt >= 0 && cells[topicAt]?.trim()) {
      const wanted = cells[topicAt].trim().toLowerCase()
      const match = topics.find((item) => item.id.toLowerCase() === wanted || item.label.toLowerCase() === wanted)
      if (!match) {
        errors.push(t('rowTopic', { line, topic: cells[topicAt].trim() }))
        return
      }
      topicId = match.id
    }
    if (!topicId) {
      errors.push(t('chooseTopic'))
      return
    }
    const locationCell = locationAt >= 0 ? cells[locationAt]?.trim().toLowerCase() : 'us'
    const location = locations.find((item) => item.id === locationCell || t(item.id).toLowerCase() === locationCell)?.id ?? 'us'
    const tagCell = tagsAt >= 0 ? cells[tagsAt] ?? '' : ''
    const cellTags = tagCell.split(/[|;]/).map((tag) => tag.trim().toLowerCase()).filter(Boolean)
    const tagIds = tagOptions.filter((option) => cellTags.includes(option.name.toLowerCase()) || cellTags.includes(option.id.toLowerCase())).map((option) => option.id)
    rows.push({
      text: prompt,
      topicId,
      location,
      tagIds,
      intent: (cellTags.find((tag) => (intentTags as readonly string[]).includes(tag)) as DraftPrompt['intent']) ?? null,
      branding: 'nonBranded',
    })
  })
  if (!rows.length && !errors.length) errors.push(t('keywordEmpty'))
  return { rows, errors }
}

function splitCsv(text: string) {
  return text.split(/\r?\n/).filter((line) => line.trim()).map((line) => {
    const cells: string[] = []
    let current = ''
    let quoted = false
    for (const char of line) {
      if (char === '"') quoted = !quoted
      else if (char === ',' && !quoted) {
        cells.push(current)
        current = ''
      } else current += char
    }
    cells.push(current)
    return cells
  })
}

function exampleCsv(topic: string) {
  return `prompt,topic,location,tags\nWhat is the best insurance?,${topic},us,commercial\n`
}
