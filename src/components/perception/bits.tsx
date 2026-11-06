'use client'

import { Info } from 'lucide-react'
import { cn } from '@/lib/cn'

export function heatStyle(score: number, max: number) {
  const ratio = max <= 0 ? 0 : Math.max(0, Math.min(1, score / max))
  const mix = (from: number, to: number) => Math.round(from + (to - from) * ratio)
  return {
    backgroundColor: `rgb(${mix(255, 232)} ${mix(241, 93)} ${mix(230, 12)})`,
    color: ratio > 0.82 ? '#ffffff' : '#1c1917',
  }
}

export function Hint({ label, text }: { label: string; text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <button type="button" aria-label={label} className="grid h-4 w-4 place-items-center text-zinc-400 hover:text-zinc-700">
        <Info className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-40 mt-1.5 hidden w-72 -translate-x-1/2 rounded-lg bg-zinc-950 px-3 py-2 text-left text-[12px] font-normal leading-5 text-white shadow-menu group-hover:block group-focus-within:block"
      >
        {text}
      </span>
    </span>
  )
}

export function Pager({
  page,
  pages,
  onPage,
  previousLabel,
  nextLabel,
}: {
  page: number
  pages: number
  onPage: (page: number) => void
  previousLabel: string
  nextLabel: string
}) {
  const items = pagerItems(page, pages)
  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label={previousLabel} disabled={page === 0} onClick={() => onPage(page - 1)} className="grid h-7 w-7 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 disabled:opacity-30">
        ‹
      </button>
      {items.map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-zinc-400">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPage(item)}
            className={cn('grid h-7 min-w-7 place-items-center rounded-md px-1.5 text-[13px]', item === page ? 'bg-zinc-100 font-medium text-zinc-950' : 'text-zinc-600 hover:bg-zinc-50')}
          >
            {item + 1}
          </button>
        ),
      )}
      <button type="button" aria-label={nextLabel} disabled={page >= pages - 1} onClick={() => onPage(page + 1)} className="grid h-7 w-7 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 disabled:opacity-30">
        ›
      </button>
    </div>
  )
}

function pagerItems(page: number, pages: number): Array<number | 'gap'> {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index)
  const visible = new Set([0, pages - 1, page, page - 1, page + 1])
  const items: Array<number | 'gap'> = []
  let previous: number | null = null
  for (let index = 0; index < pages; index += 1) {
    if (!visible.has(index)) continue
    if (previous !== null && index - previous > 1) items.push('gap')
    items.push(index)
    previous = index
  }
  return items
}

export function ModelGlyph({ id }: { id: string }) {
  const color = id === 'chatgpt' ? '#10a37f' : id === 'perplexity' ? '#20808d' : '#4285f4'
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
}
