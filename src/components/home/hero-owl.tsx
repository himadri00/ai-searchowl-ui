import { Search } from 'lucide-react'

export function OwlBadge({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/logo.svg"
      alt=""
      width={size}
      height={size}
      className="inline-block shrink-0"
      style={{ width: size, height: size }}
    />
  )
}

function QueryChip({ text, className, delay }: { text: string; className: string; delay: string }) {
  return (
    <div
      className={`owl-chip absolute z-20 hidden items-center gap-2 rounded-full border border-[#FFE1CC] bg-white py-1.5 pl-1.5 pr-3 shadow-[0_12px_28px_rgba(232,93,12,0.16)] sm:flex ${className}`}
      style={{ animationDelay: delay }}
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#FFF1E6] text-[#E85D0C]">
        <Search className="h-3.5 w-3.5" strokeWidth={2.4} />
      </span>
      <span className="whitespace-nowrap text-[12.5px] font-medium text-[#3F3A36]">{text}</span>
      <span className="grid h-4 w-4 place-items-center rounded-full bg-[#FFF1E6] text-[9px] font-bold text-[#E85D0C]">G</span>
    </div>
  )
}

export function HeroOwl() {
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[640px] sm:h-[500px]" aria-hidden>
      <div className="pointer-events-none absolute left-1/2 top-[46%] h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,140,50,0.32),rgba(255,140,50,0)_68%)]" />

      <div className="pointer-events-none absolute left-1/2 top-[46%] h-[230px] w-[108%] -translate-x-1/2 -translate-y-1/2">
        <svg viewBox="0 0 640 230" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="owlRing" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFE7C2" />
              <stop offset="45%" stopColor="#E85D0C" />
              <stop offset="100%" stopColor="#FFD19A" />
            </linearGradient>
          </defs>
          <ellipse cx="320" cy="118" rx="286" ry="92" fill="none" stroke="#E89A55" strokeWidth="16" opacity="0.55" />
          <ellipse className="owl-ring" cx="320" cy="118" rx="286" ry="92" fill="none" stroke="url(#owlRing)" strokeWidth="16" strokeLinecap="round" strokeDasharray="150 520" />
          <ellipse className="owl-ring-slow" cx="320" cy="124" rx="220" ry="108" fill="none" stroke="#E08A45" strokeWidth="7" strokeLinecap="round" strokeDasharray="70 360" opacity="0.8" />
        </svg>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="owl-orbit absolute left-0 top-0 h-2.5 w-2.5 rounded-full bg-[#E85D0C] shadow-[0_0_12px_#E85D0C]"
            style={{ animationDelay: `${-i * 4.5}s` }}
          />
        ))}
      </div>

      <svg viewBox="0 0 520 460" className="absolute left-[8%] top-[4%] h-[90%] w-[84%] overflow-visible">
        <defs>
          <linearGradient id="owlBody" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#FFB15C" />
            <stop offset="45%" stopColor="#E85D0C" />
            <stop offset="100%" stopColor="#C44708" />
          </linearGradient>
          <linearGradient id="owlHead" x1="0.15" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor="#FFC278" />
            <stop offset="55%" stopColor="#E85D0C" />
            <stop offset="100%" stopColor="#C44708" />
          </linearGradient>
          <linearGradient id="owlWing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFD19A" />
            <stop offset="55%" stopColor="#E8782A" />
            <stop offset="100%" stopColor="#C44708" />
          </linearGradient>
          <radialGradient id="owlBelly" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FFE8D4" />
          </radialGradient>
        </defs>

        <ellipse className="owl-shadow" cx="260" cy="400" rx="70" ry="12" fill="#E85D0C" opacity="0.35" />

        <g className="owl-float">
          <g className="owl-wing-l">
            <path d="M198 214c-46-42-112-58-158-28-10 22 8 48 36 58-22 16-28 48-4 64 36 22 92-4 118-40 8-12 12-36 8-54z" fill="url(#owlWing)" />
            <path d="M186 222c-36-24-84-28-118-8 8 18 34 28 62 24 16-2 36-12 48-24 4-4 6-2 8 8z" fill="#FFE4C4" opacity="0.9" />
            <path d="M78 196c22 16 40 28 52 44M64 220c28 14 52 20 74 16" fill="none" stroke="#FFF8EE" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
          </g>
          <g className="owl-wing-r">
            <path d="M322 214c46-42 112-58 158-28 10 22-8 48-36 58 22 16 28 48 4 64-36 22-92-4-118-40-8-12-12-36-8-54z" fill="url(#owlWing)" />
            <path d="M334 222c36-24 84-28 118-8-8 18-34 28-62 24-16-2-36-12-48-24-4-4-6-2-8 8z" fill="#FFE4C4" opacity="0.9" />
            <path d="M442 196c-22 16-40 28-52 44M456 220c-28 14-52 20-74 16" fill="none" stroke="#FFF8EE" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
          </g>

          <ellipse cx="260" cy="292" rx="78" ry="86" fill="url(#owlBody)" />
          <ellipse cx="260" cy="308" rx="48" ry="58" fill="url(#owlBelly)" />
          <path d="M236 286c8 10 8 22 0 34M260 280c8 12 8 28 0 44M284 286c-8 10-8 22 0 34" fill="none" stroke="#FFD7B8" strokeWidth="2" strokeLinecap="round" opacity="0.8" />

          <path d="M214 168c8-48 28-62 48-28" fill="#E87820" />
          <path d="M306 168c-8-48-28-62-48-28" fill="#E87820" />
          <circle cx="260" cy="196" r="78" fill="url(#owlHead)" />
          <ellipse cx="232" cy="168" rx="22" ry="10" fill="#fff" opacity="0.28" />

          <ellipse cx="260" cy="214" rx="58" ry="50" fill="#FFF8F3" />
          <ellipse cx="226" cy="214" rx="16" ry="10" fill="#FFB088" opacity="0.35" />
          <ellipse cx="294" cy="214" rx="16" ry="10" fill="#FFB088" opacity="0.35" />

          <g className="owl-eyes">
            <ellipse cx="236" cy="206" rx="20" ry="22" fill="#fff" />
            <ellipse cx="284" cy="206" rx="20" ry="22" fill="#fff" />
            <circle cx="238" cy="208" r="11" fill="#E87820" />
            <circle cx="286" cy="208" r="11" fill="#E87820" />
            <circle cx="238" cy="208" r="6" fill="#2A160C" />
            <circle cx="286" cy="208" r="6" fill="#2A160C" />
            <circle cx="235" cy="204" r="2.2" fill="#fff" />
            <circle cx="283" cy="204" r="2.2" fill="#fff" />
          </g>

          <path d="M252 226h16l-8 12z" fill="#F0943E" />
          <path d="M248 224c4 2 8 2 12 0" fill="none" stroke="#E8A06A" strokeWidth="1.4" strokeLinecap="round" />

          <ellipse cx="232" cy="372" rx="16" ry="9" fill="#E86A14" />
          <ellipse cx="288" cy="372" rx="16" ry="9" fill="#E86A14" />
          <path d="M220 372h24M276 372h24" stroke="#C8530C" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>

      <span className="owl-spark absolute left-[18%] top-[22%] h-2 w-2 rounded-full bg-[#FFD59A]" />
      <span className="owl-spark absolute right-[16%] top-[18%] h-1.5 w-1.5 rounded-full bg-[#FFB067]" style={{ animationDelay: '0.8s' }} />
      <span className="owl-spark absolute bottom-[24%] left-[22%] h-1.5 w-1.5 rounded-full bg-[#FF8A2A]" style={{ animationDelay: '1.4s' }} />

      <QueryChip text="Best project management tools?" className="right-[2%] top-[4%]" delay="0s" />
      <QueryChip text="Alternatives to Notion?" className="right-[0%] top-[40%]" delay="0.8s" />
      <QueryChip text="Top AI writing tools for teams?" className="bottom-[16%] right-[4%]" delay="1.4s" />
    </div>
  )
}
