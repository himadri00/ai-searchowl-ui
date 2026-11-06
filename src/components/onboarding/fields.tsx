'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { AlertCircle, Info, Plus, X } from 'lucide-react'
import { cn } from '@/lib/cn'

export function ErrorText({ id, children }: { id?: string; children: ReactNode }) {
  if (!children) return null
  return (
    <p id={id} role="alert" className="mt-2 flex items-start gap-1.5 text-[13px] leading-5 text-rose-700">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

export function Field({
  label,
  hint,
  help,
  error,
  children,
}: {
  label: string
  hint: string
  help: string
  error?: string | null
  children: ReactNode
}) {
  return (
    <section className="border-b border-nuw-line py-5 last:border-b-0">
      <h2 className="flex items-center gap-1.5 text-[14px] font-medium text-zinc-900">
        {label}
        <span title={help} aria-label={help} className="text-zinc-400">
          <Info className="h-3.5 w-3.5" />
        </span>
      </h2>
      <p className="mb-3 mt-0.5 text-[12px] text-zinc-500">{hint}</p>
      {children}
      <ErrorText>{error}</ErrorText>
    </section>
  )
}

export function ChipInput({
  values,
  onChange,
  max,
  maxLength = 60,
  label,
  invalid,
}: {
  values: string[]
  onChange: (values: string[]) => void
  max: number
  maxLength?: number
  label: string
  invalid?: boolean
}) {
  const t = useTranslations('onboarding')
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const [note, setNote] = useState<string | null>(null)

  const commit = () => {
    const value = text.trim()
    if (!value) {
      setAdding(false)
      setNote(null)
      return
    }
    if (value.length > maxLength) {
      setNote(t('chipTooLong', { max: maxLength }))
      return
    }
    if (values.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setNote(t('chipDuplicate', { value }))
      return
    }
    if (values.length >= max) {
      setNote(t('chipLimit', { max }))
      return
    }
    onChange([...values, value])
    setText('')
    setNote(null)
  }

  return (
    <div>
      <div className={cn('flex flex-wrap items-center gap-1.5', invalid && 'rounded-lg ring-1 ring-rose-300 ring-offset-4')}>
        {values.map((value) => (
          <span key={value} className="inline-flex items-center gap-1 rounded-md border border-nuw-line bg-zinc-100 py-0.5 pl-2 pr-1 text-[12px] text-zinc-700">
            {value}
            <button
              type="button"
              onClick={() => onChange(values.filter((item) => item !== value))}
              className="grid h-4 w-4 place-items-center rounded text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900"
              aria-label={t('chipRemove', { value })}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {adding ? (
          <input
            autoFocus
            value={text}
            aria-label={label}
            maxLength={maxLength + 20}
            onChange={(event) => {
              setText(event.target.value)
              setNote(null)
            }}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault()
                commit()
              }
              if (event.key === 'Escape') {
                setText('')
                setAdding(false)
                setNote(null)
              }
            }}
            placeholder={t('chipPlaceholder')}
            className="h-6 w-48 rounded-md border border-nuw-primary px-2 text-[12px] outline-none"
          />
        ) : values.length < max ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            aria-label={t('chipAddTo', { label })}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            {t('chipAdd')}
            <Plus className="h-3 w-3" />
          </button>
        ) : (
          <span className="text-[12px] text-zinc-500">{t('chipLimit', { max })}</span>
        )}
      </div>
      {note ? <p className="mt-2 text-[12px] text-rose-700">{note}</p> : null}
    </div>
  )
}
