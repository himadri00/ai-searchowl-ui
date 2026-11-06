export function BrandMark({
  initials,
  color,
  size = 28,
}: {
  initials: string
  color: string
  size?: number
}) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-[7px] font-semibold tracking-tight text-white"
      style={{ width: size, height: size, background: color, fontSize: size <= 22 ? 9 : 11 }}
    >
      {initials}
    </span>
  )
}

export function Favicon({ host, src, className = 'h-4 w-4' }: { host: string; src?: string; className?: string }) {
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-sm bg-zinc-100 ${className}`}>
      <span className="text-[9px] font-semibold uppercase text-zinc-500">{host.slice(0, 1)}</span>
      <img
        src={src ?? `https://www.google.com/s2/favicons?domain=${host}&sz=64`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        onError={(event) => {
          event.currentTarget.style.display = 'none'
        }}
      />
    </span>
  )
}
