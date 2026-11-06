import { BrandMark } from '@/components/shell/brand-mark'

export type RankedChat = {
  position: number | null
  positions?: Record<string, number> | null
  mentions?: string[] | null
}

type Mark = { id: string; name: string; color: string; initials: string }

export function rankedPlaces(chat: RankedChat) {
  const mentions = chat.mentions ?? []
  const ranked = mentions.flatMap((id) => {
    const place = chat.positions?.[id]
    return place == null ? [] : [{ id, place }]
  })
  if (ranked.length) return ranked
  if (chat.position != null) return [{ id: 'you', place: chat.position }]
  return []
}

export function positionText(chat: RankedChat, marks: Mark[]) {
  const text = rankedPlaces(chat)
    .map((item) => {
      const name = marks.find((mark) => mark.id === item.id)?.name ?? item.id
      return `${name} ${item.place}`
    })
    .join(', ')
  return text || '0'
}

export function ChatPositions({ chat, marks }: { chat: RankedChat; marks: Mark[] }) {
  const ranked = rankedPlaces(chat)
  if (!ranked.length) return <span className="tabular-nums">0</span>
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      {ranked.map((item) => {
        const mark = marks.find((entry) => entry.id === item.id)
        return (
          <span key={item.id} title={mark?.name ?? item.id} className="inline-flex items-center gap-1">
            {mark ? <BrandMark initials={mark.initials} color={mark.color} size={16} /> : null}
            <span className="tabular-nums">{item.place}</span>
          </span>
        )
      })}
    </span>
  )
}
