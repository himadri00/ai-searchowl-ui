export function Flag({ id, title }: { id: string; title?: string }) {
  const code = id.toLowerCase()
  return (
    <span className="inline-grid h-4 w-4 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10" role="img" aria-label={title ?? code}>
      <svg viewBox="0 0 20 14" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        {code === 'us' ? <Us /> : null}
        {code === 'uk' ? <Uk /> : null}
        {code === 'de' ? <De /> : null}
        {code === 'fr' ? <Fr /> : null}
        {code === 'in' ? <In /> : null}
        {code !== 'us' && code !== 'uk' && code !== 'de' && code !== 'fr' && code !== 'in' ? <rect width="20" height="14" fill="#e4e4e7" /> : null}
      </svg>
    </span>
  )
}

function Us() {
  return (
    <>
      <rect width="20" height="14" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((y) => <rect key={y} y={y} width="20" height="1" fill="#b91c1c" />)}
      <rect width="8" height="7" fill="#1d4ed8" />
    </>
  )
}

function Uk() {
  return (
    <>
      <rect width="20" height="14" fill="#1d4ed8" />
      <path d="M0 0 L20 14 M20 0 L0 14" stroke="#fff" strokeWidth="3" />
      <path d="M0 0 L20 14 M20 0 L0 14" stroke="#b91c1c" strokeWidth="1.2" />
      <path d="M10 0 V14 M0 7 H20" stroke="#fff" strokeWidth="4" />
      <path d="M10 0 V14 M0 7 H20" stroke="#b91c1c" strokeWidth="2" />
    </>
  )
}

function De() {
  return (
    <>
      <rect width="20" height="14" fill="#facc15" />
      <rect width="20" height="4.67" fill="#18181b" />
      <rect y="9.33" width="20" height="4.67" fill="#b91c1c" />
    </>
  )
}

function Fr() {
  return (
    <>
      <rect width="20" height="14" fill="#fff" />
      <rect width="6.67" height="14" fill="#1d4ed8" />
      <rect x="13.33" width="6.67" height="14" fill="#b91c1c" />
    </>
  )
}

function In() {
  return (
    <>
      <rect width="20" height="14" fill="#fff" />
      <rect width="20" height="4.67" fill="#f97316" />
      <rect y="9.33" width="20" height="4.67" fill="#16a34a" />
      <circle cx="10" cy="7" r="1.6" fill="none" stroke="#1d4ed8" strokeWidth="0.7" />
    </>
  )
}
