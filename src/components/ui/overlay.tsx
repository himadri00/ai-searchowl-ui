'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type MenuContextValue = { close: () => void }

const MenuContext = createContext<MenuContextValue>({ close: () => undefined })

export function useMenu() {
  return useContext(MenuContext)
}

export function Menu({
  trigger,
  children,
  align = 'left',
  panelClassName,
}: {
  trigger: (open: boolean) => ReactNode
  children: ReactNode
  align?: 'left' | 'right'
  panelClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const value = useMemo(() => ({ close: () => setOpen(false) }), [])

  return (
    <MenuContext.Provider value={value}>
      <div ref={ref} className="relative">
        <div onClick={() => setOpen((current) => !current)}>{trigger(open)}</div>
        {open ? (
          <div
            className={cn(
              'absolute z-50 mt-2 rounded-lg border border-nuw-line bg-white p-1.5 shadow-menu',
              align === 'right' ? 'right-0' : 'left-0',
              panelClassName,
            )}
          >
            {children}
          </div>
        ) : null}
      </div>
    </MenuContext.Provider>
  )
}

export function MenuItem({
  children,
  onSelect,
  active,
  icon,
}: {
  children: ReactNode
  onSelect?: () => void
  active?: boolean
  icon?: ReactNode
}) {
  const { close } = useMenu()
  return (
    <button
      type="button"
      onClick={() => {
        onSelect?.()
        close()
      }}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-zinc-800 hover:bg-zinc-100',
        active && 'bg-[#171411] font-semibold text-white',
      )}
    >
      {icon ? <span className={active ? 'text-white/60' : 'text-zinc-500'}>{icon}</span> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {active ? <span className="text-[#F05A0A]">✓</span> : null}
    </button>
  )
}

export function Modal({
  open,
  title,
  onClose,
  children,
  wide,
  panelClassName,
}: {
  open: boolean
  title?: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
  panelClassName?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-900/40 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
        className={cn(
          'max-h-[86vh] w-full overflow-auto rounded-lg border border-nuw-line bg-white shadow-menu',
          wide ? 'max-w-4xl' : 'max-w-md',
          panelClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}

type Toast = { id: number; title: string; body: string }

const ToastContext = createContext<{ push: (toast: Omit<Toast, 'id'>) => void }>({ push: () => undefined })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now()
    setToasts((current) => [...current, { ...toast, id }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 4200)
  }

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto rounded-lg border border-nuw-line bg-white px-4 py-3 shadow-menu">
            <p className="text-sm font-semibold text-zinc-900">{toast.title}</p>
            <p className="mt-1 text-[13px] leading-5 text-zinc-600">{toast.body}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
