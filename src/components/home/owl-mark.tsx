export function OwlMark({ size = 36, ring = false }: { size?: number; ring?: boolean }) {
  return (
    <span
      aria-hidden
      className={
        ring
          ? 'owl-bob inline-grid shrink-0 place-items-center rounded-[10px] bg-[#E85D0C] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35),0_0_0_2px_#FFFFFF]'
          : 'owl-bob inline-grid shrink-0 place-items-center rounded-[10px] bg-[#E85D0C] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)]'
      }
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 32 32" width={size * 0.84} height={size * 0.84} role="presentation">
        <circle cx="16" cy="17" r="9" fill="#FFF7F1" />
        <path d="M9 10l3 3M23 10l-3 3" stroke="#C44708" strokeWidth="2.4" strokeLinecap="round" />
        <g className="owl-eyes">
          <circle cx="12.5" cy="16" r="3.4" fill="#FFFFFF" />
          <circle cx="19.5" cy="16" r="3.4" fill="#FFFFFF" />
          <circle cx="12.5" cy="16" r="1.6" fill="#171512" />
          <circle cx="19.5" cy="16" r="1.6" fill="#171512" />
        </g>
        <path d="M14.2 20.2h3.6l-1.8 2z" fill="#E85D0C" />
      </svg>
    </span>
  )
}
