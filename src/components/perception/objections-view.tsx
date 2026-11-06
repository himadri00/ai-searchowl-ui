'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Lock } from 'lucide-react'
export function ObjectionsView({ objections }: { objections: { id: string; label: string; score: number }[] }) {
  const t = useTranslations('perception.page')
  const [note, setNote] = useState('')

  return (
    <div className="relative min-h-[640px]">
      <div className="pointer-events-none select-none px-4 py-4 blur-[6px]">
        <h2 className="text-[18px] font-semibold">{t('objections')}</h2>
        <p className="mt-1 text-[13px] text-zinc-500">{t('objectionsLead')}</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ul className="space-y-3 rounded-2xl border border-nuw-line bg-white p-4">
            {objections.map((item) => (
              <li key={item.id}>
                <div className="mb-1 flex justify-between text-[13px]">
                  <span>{item.label}</span>
                  <span className="tabular-nums text-zinc-500">{item.score}</span>
                </div>
                <div className="h-6 overflow-hidden rounded-md bg-zinc-100">
                  <div className="h-full rounded-md bg-zinc-300" style={{ width: `${item.score * 2}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="grid place-items-center rounded-2xl border border-nuw-line bg-white p-4">
            <Radar objections={objections} />
          </div>
        </div>
      </div>
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-menu">
          <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-nuw-line text-zinc-500">
            <Lock className="h-4 w-4" />
          </span>
          <h2 className="mt-3 text-[16px] font-semibold">{t('lockTitle')}</h2>
          <p className="mt-2 text-[13px] leading-5 text-zinc-500">{t('lockBody')}</p>
          <button type="button" onClick={() => setNote(t('upgradeProBody'))} className="mt-4 rounded-lg bg-nuw-button px-4 py-2 text-[13px] text-white">
            {t('upgradePro')}
          </button>
          {note ? <p className="mt-3 text-[13px] leading-5 text-zinc-600">{note}</p> : null}
        </div>
      </div>
    </div>
  )
}

function Radar({ objections }: { objections: { id: string; label: string; score: number }[] }) {
  const count = objections.length
  const points = objections.map((item, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2
    const radius = 28 + (item.score / 42) * 58
    return [120 + Math.cos(angle) * radius, 110 + Math.sin(angle) * radius] as const
  })
  const ring = (radius: number) => objections.map((_, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2
    return `${120 + Math.cos(angle) * radius},${110 + Math.sin(angle) * radius}`
  }).join(' ')
  return (
    <svg viewBox="0 0 240 220" className="h-64 w-full max-w-sm">
      {[90, 65, 40].map((radius) => <polygon key={radius} points={ring(radius)} fill="none" stroke="#e4e4e7" />)}
      <polygon points={points.map((point) => point.join(',')).join(' ')} fill="rgba(232,93,12,0.16)" stroke="#E85D0C" />
    </svg>
  )
}
