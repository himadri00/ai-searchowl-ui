'use client'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, Globe, Link2, Sparkles, Trophy, XCircle } from 'lucide-react'
import { Favicon } from '@/components/shell/brand-mark'
import { OwlBadge } from './hero-owl'
import { AnimatedNumber, trackHomeEvent } from './motion-primitives'

export type UniverseModel = {
  id: string
  name: string
  host: string
  icon?: string
  slot: string
  px: number
  py: number
  floatOffset: number
  nodeBadge: string
  tone: 'positive' | 'warning' | 'negative'
  score: number
  citationStatus: string
  recommendationStatus: string
  competitorWinner: string
  headlineVerdict: string
  sampleAnswer: string
  exclusionNotice: string
  actionTeaser: string
  specificFix: string
}

const CX = 300
const CY = 225

export const UNIVERSE_MODELS: UniverseModel[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    host: 'openai.com',
    slot: 'left-1.5 top-2.5 sm:left-3 sm:top-3',
    px: 92,
    py: 46,
    floatOffset: 0,
    nodeBadge: 'Cites you #2',
    tone: 'positive',
    score: 72,
    citationStatus: 'Cited (#2 source link)',
    recommendationStatus: 'Recommended after Notion',
    competitorWinner: 'Notion',
    headlineVerdict: 'ChatGPT recommends your brand #2 and cites your guide.',
    sampleAnswer:
      '“For startups evaluating workflow and search visibility tools, top choices include Notion, yourwebsite.com (strong automated reporting), and Asana…”',
    exclusionNotice: 'Included in the answer — Notion appears first because its comparison table lists current pricing.',
    actionTeaser: 'Discover how to overtake Notion for the #1 recommendation.',
    specificFix: 'Add a structured pricing & feature table with a current month timestamp to your cited guide.',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    host: 'perplexity.ai',
    slot: 'right-1.5 top-2.5 sm:right-3 sm:top-3',
    px: 508,
    py: 46,
    floatOffset: 0.8,
    nodeBadge: 'Cites you #1',
    tone: 'positive',
    score: 84,
    citationStatus: 'Primary cited source (#1)',
    recommendationStatus: 'Recommended first choice',
    competitorWinner: 'Your Brand (#1)',
    headlineVerdict: 'Perplexity cites your website #1 ahead of competitors.',
    sampleAnswer:
      '“Based on recent benchmarks, yourwebsite.com is the highest-cited platform for teams tracking AI search visibility [1], ahead of Asana [2] and Coda [3].”',
    exclusionNotice: 'Your brand leads this prompt with 42 verified source citations.',
    actionTeaser: 'Protect your #1 citation spot before competitors update their guides.',
    specificFix: 'Keep your benchmark guide refreshed weekly — we alert you the morning any citation shifts.',
  },
  {
    id: 'overviews',
    name: 'AI Overviews',
    host: 'google.com',
    slot: 'left-0 top-1/2 -translate-y-1/2',
    px: 64,
    py: 225,
    floatOffset: 1.5,
    nodeBadge: 'Picks Notion',
    tone: 'negative',
    score: 31,
    citationStatus: '0 citations found',
    recommendationStatus: 'Missing from AI summary',
    competitorWinner: 'Notion',
    headlineVerdict: 'Google AI Overviews picks Notion and skips your website.',
    sampleAnswer:
      '“Google AI Overview: Top platforms for high-growth teams include Notion, ClickUp, and Linear. These tools provide templates and direct integrations…”',
    exclusionNotice: "Your brand wasn't included in this recommendation.",
    actionTeaser: 'Discover why Google AI Overviews cited Notion instead of your page.',
    specificFix: 'Add direct question-and-answer H2 headings and FAQ schema matching exact buyer prompts.',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    host: 'gemini.google.com',
    slot: 'right-0 top-1/2 -translate-y-1/2',
    px: 536,
    py: 225,
    floatOffset: 2.1,
    nodeBadge: 'Recommends a competitor',
    tone: 'negative',
    score: 31,
    citationStatus: 'Not cited (0 links)',
    recommendationStatus: 'Competitor recommended instead',
    competitorWinner: 'Jasper',
    headlineVerdict: 'Gemini recommends Jasper instead of your brand.',
    sampleAnswer:
      '“For marketing teams looking to scale visibility and content workflows, Jasper, HubSpot, and Copy.ai are the most widely recommended solutions…”',
    exclusionNotice: "Your brand wasn't included in this recommendation.",
    actionTeaser: 'Discover why AI recommended your competitor.',
    specificFix: 'Publish a dedicated “For Marketing Teams” comparison page with measurable case outcomes Gemini can cite.',
  },
  {
    id: 'copilot',
    name: 'Copilot',
    host: 'copilot.microsoft.com',
    icon: '/icons/copilot.svg',
    slot: 'left-1.5 bottom-2.5 sm:left-3 sm:bottom-3',
    px: 92,
    py: 404,
    floatOffset: 2.7,
    nodeBadge: 'Cites you #3',
    tone: 'positive',
    score: 61,
    citationStatus: 'Cited (#3 footnote link)',
    recommendationStatus: 'Listed 3rd after Asana & ClickUp',
    competitorWinner: 'Asana',
    headlineVerdict: 'Copilot cites your comparison page at #3 behind Asana.',
    sampleAnswer:
      '“Asana and ClickUp lead enterprise adoption, while yourwebsite.com is frequently cited for streamlined team reporting…”',
    exclusionNotice: 'Included at #3 — Asana wins #1 because its page states plan limits in plain text.',
    actionTeaser: 'See which missing table rows keep Copilot ranking Asana above you.',
    specificFix: 'Expose plan limits and seat pricing in a crawlable HTML table on your comparison URL.',
  },
  {
    id: 'claude',
    name: 'Claude',
    host: 'claude.ai',
    slot: 'right-1.5 bottom-2.5 sm:right-3 sm:bottom-3',
    px: 508,
    py: 404,
    floatOffset: 3.3,
    nodeBadge: 'Mentions you without a link',
    tone: 'warning',
    score: 48,
    citationStatus: 'Unlinked name mention',
    recommendationStatus: 'Named without source link',
    competitorWinner: 'HubSpot',
    headlineVerdict: 'Claude mentions your brand name, but links to HubSpot.',
    sampleAnswer:
      '“…teams also consider yourwebsite.com for lightweight tracking, though HubSpot (hubspot.com/pricing) offers the most documented onboarding tiers.”',
    exclusionNotice: 'Your brand was named, but buyers got zero clickable link to your website.',
    actionTeaser: 'See why Claude refused to link your pricing page.',
    specificFix: 'Remove the sign-up gate on your pricing overview so AI crawlers can verify and cite your URL.',
  },
]

function beamPath(m: UniverseModel) {
  const mx = (m.px + CX) / 2
  const my = (m.py + CY) / 2 + (m.py < CY ? -26 : m.py > CY ? 26 : -20)
  return `M ${m.px} ${m.py} Q ${mx} ${my} ${CX} ${CY}`
}

function toneColor(tone: UniverseModel['tone']) {
  if (tone === 'positive') return '#15803D'
  if (tone === 'warning') return '#F05A0A'
  return '#E11D48'
}

export function HeroStage({ onCheckBrand }: { onCheckBrand?: () => void }) {
  const reduce = useReducedMotion()
  // Default to Gemini (index 3, score 31/100) so the initial view shows the 31/100 score & competitive gap curiosity loop immediately
  const [selectedIndex, setSelectedIndex] = useState(3)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const activeIndex = hoveredIndex ?? selectedIndex
  const m = UNIVERSE_MODELS[selectedIndex]
  const highlighted = UNIVERSE_MODELS[activeIndex]

  const selectModel = (idx: number) => {
    setSelectedIndex(idx)
    trackHomeEvent('ai_model_interact', { model: UNIVERSE_MODELS[idx].id })
  }

  return (
    <div
      className="relative mx-auto w-full max-w-[610px]"
      aria-label="Interactive AI Visibility Universe. Sample demonstration data. Click any AI model node to inspect how it represents your brand."
    >
      {/* Sample data transparency badge */}
      <div className="mb-2 flex items-center justify-between px-1 text-[11.5px] font-semibold text-[#7A7067]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EFE2D4] bg-white/90 px-2.5 py-1 shadow-sm">
          <Sparkles className="h-3 w-3 text-[#F05A0A]" />
          Interactive Live Demo · Sample Data
        </span>
        <span className="text-[#8C8177]">Click any AI model to inspect</span>
      </div>

      {/* ── ORBIT STAGE ── */}
      <div className="relative h-[430px] rounded-[30px] border border-[#EFE2D4]/90 bg-gradient-to-b from-white/95 via-[#FFFAF5] to-white/95 p-2 shadow-[0_24px_60px_rgba(23,20,17,0.06)] sm:h-[456px]">
        {/* Subtle warm orange ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(240,90,10,0.16),rgba(255,176,103,0.06)_52%,transparent_72%)]"
        />

        {/* SVG Constellation & Animated Citation Signals */}
        <svg aria-hidden viewBox="0 0 600 450" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <linearGradient id="orbitStroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FAD5B8" />
              <stop offset="50%" stopColor="#F05A0A" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FAD5B8" />
            </linearGradient>
          </defs>

          <ellipse
            cx={CX}
            cy={CY}
            rx="224"
            ry="172"
            fill="none"
            stroke="url(#orbitStroke)"
            strokeWidth="1.4"
            strokeDasharray="6 8"
          />
          <ellipse cx={CX} cy={CY} rx="140" ry="108" fill="none" stroke="#F2DEC9" strokeWidth="1.1" />

          {UNIVERSE_MODELS.map((mod, i) => {
            const isFocused = i === activeIndex
            const isSelected = i === selectedIndex
            const d = beamPath(mod)
            const c = toneColor(mod.tone)
            return (
              <g key={mod.id} opacity={isFocused || isSelected ? 1 : 0.36} className="transition-opacity duration-300">
                <path
                  d={d}
                  fill="none"
                  stroke={c}
                  strokeWidth={isFocused ? 2.8 : 1.5}
                  strokeDasharray={mod.tone === 'positive' ? undefined : '5 6'}
                  strokeLinecap="round"
                />
                {!reduce && (
                  <circle r={isFocused ? 5 : 3.2} fill={c}>
                    <animateMotion dur={isFocused ? '1.75s' : '3.2s'} repeatCount="indefinite" path={d} />
                  </circle>
                )}
              </g>
            )
          })}
        </svg>

        {/* ── CENTER ANALYSIS CARD ── */}
        <div className="absolute left-1/2 top-1/2 z-10 w-[224px] -translate-x-1/2 -translate-y-1/2 sm:w-[244px]">
          <motion.div
            layout
            animate={reduce ? undefined : { y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 4.8, ease: 'easeInOut' }}
            className="rounded-[24px] border-2 border-[#F05A0A] bg-white p-3.5 shadow-[0_22px_50px_rgba(240,90,10,0.20)] sm:p-4"
          >
            {/* Website row */}
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#7A624E]">
              <Globe className="h-3.5 w-3.5 shrink-0 text-[#F05A0A]" />
              <span className="truncate text-[#171411]">yourwebsite.com</span>
              <span className="ml-auto rounded-full bg-[#FFF2E8] px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-[#F05A0A]">
                Sample
              </span>
            </div>

            {/* Score & model status */}
            <div className="mt-2.5 flex items-center gap-2.5">
              <OwlBadge size={34} />
              <div className="min-w-0">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#8C8177]">
                  AI Visibility Score
                </p>
                <p className="text-[25px] font-extrabold leading-none tracking-tight text-[#171411]">
                  <AnimatedNumber value={m.score} />
                  <span className="text-[12px] font-semibold text-[#9A9086]">/100</span>
                </p>
              </div>
              <span
                className={`ml-auto rounded-full px-2 py-1 text-[10px] font-extrabold ${
                  m.tone === 'positive'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : m.tone === 'warning'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {m.name}
              </span>
            </div>

            {/* Animated Score Progression Bar */}
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#F7ECE2]">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: toneColor(m.tone) }}
                animate={{ width: `${m.score}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </div>

            {/* Citation, Recommendation & Competitor Insight mini-table */}
            <dl className="mt-2.5 space-y-1 border-t border-[#F3E8DC] pt-2 text-[10.5px]">
              <div className="flex items-center justify-between gap-1">
                <dt className="font-medium text-[#8C8177]">Citation:</dt>
                <dd className="truncate font-bold text-[#171411]">{m.citationStatus}</dd>
              </div>
              <div className="flex items-center justify-between gap-1">
                <dt className="font-medium text-[#8C8177]">Status:</dt>
                <dd
                  className={`truncate font-bold ${
                    m.tone === 'positive'
                      ? 'text-emerald-700'
                      : m.tone === 'warning'
                      ? 'text-amber-700'
                      : 'text-rose-700'
                  }`}
                >
                  {m.recommendationStatus}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-1">
                <dt className="font-medium text-[#8C8177]">Top Pick:</dt>
                <dd className="truncate font-extrabold text-[#F05A0A]">{m.competitorWinner}</dd>
              </div>
            </dl>
          </motion.div>
        </div>

        {/* ── 6 FLOATING AI PLATFORM NODES ── */}
        {UNIVERSE_MODELS.map((mod, i) => {
          const isSelected = i === selectedIndex
          const isHovered = i === hoveredIndex
          const c = toneColor(mod.tone)
          return (
            <motion.button
              key={mod.id}
              type="button"
              onClick={() => selectModel(i)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              aria-pressed={isSelected}
              animate={
                reduce
                  ? undefined
                  : {
                      y: [0, -3.5, 0],
                    }
              }
              transition={{
                repeat: Infinity,
                duration: 4.2 + (i % 3) * 0.5,
                delay: mod.floatOffset,
                ease: 'easeInOut',
              }}
              className={`group absolute z-20 flex items-center gap-2 rounded-2xl border bg-white px-2.5 py-2 text-left transition-all sm:px-3 sm:py-2.5 ${
                mod.slot
              } ${
                isSelected
                  ? 'scale-[1.04] shadow-[0_14px_32px_rgba(240,90,10,0.20)] ring-2'
                  : isHovered
                  ? 'scale-[1.02] border-[#F05A0A]/60 shadow-md'
                  : 'border-[#EADAC9] shadow-[0_6px_18px_rgba(23,20,17,0.06)] hover:border-[#F05A0A]/50'
              }`}
              style={
                isSelected
                  ? {
                      borderColor: c,
                      ['--tw-ring-color' as string]: `${c}30`,
                    }
                  : undefined
              }
            >
              <Favicon host={mod.host} src={mod.icon} className="h-6 w-6 shrink-0 rounded-full" />
              <span className="leading-tight">
                <span className="block text-[12px] font-extrabold text-[#171411] sm:text-[12.5px]">{mod.name}</span>
                <span className="mt-0.5 flex items-center gap-1 text-[10px] font-bold sm:text-[10.5px]" style={{ color: c }}>
                  {mod.tone === 'positive' ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                  ) : mod.tone === 'warning' ? (
                    <Link2 className="h-3 w-3 shrink-0" />
                  ) : (
                    <XCircle className="h-3 w-3 shrink-0" />
                  )}
                  <span>{mod.nodeBadge}</span>
                </span>
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* ── CONNECTED INSIGHT PANEL (THE CURIOSITY LOOP) ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={m.id}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="mt-3 rounded-[24px] border border-[#EADAC9] bg-white p-4 shadow-[0_18px_44px_rgba(23,20,17,0.07)] sm:p-5"
        >
          {/* Headline Verdict */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Favicon host={m.host} src={m.icon} className="h-5 w-5 rounded-full" />
              <h3 className="text-[14px] font-extrabold text-[#171411] sm:text-[15px]">{m.headlineVerdict}</h3>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF5EB] px-2.5 py-1 text-[11px] font-bold text-[#9A3412]">
              <Trophy className="h-3 w-3 text-[#F05A0A]" />
              Recommended: <strong>{m.competitorWinner}</strong>
            </span>
          </div>

          {/* Connected Sample AI Response Preview */}
          <div className="mt-2.5 rounded-xl border border-[#F3E6D8] bg-[#FFFAF5] px-3.5 py-2.5">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#8C8177]">
              Sample {m.name} Answer Preview
            </p>
            <p className="mt-1 text-[12.5px] italic leading-relaxed text-[#3F3831]">{m.sampleAnswer}</p>
          </div>

          {/* Status Banner: Restraint Coral for Missed, Subtle Green for Positive */}
          <div
            className={`mt-2.5 flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold ${
              m.tone === 'positive'
                ? 'bg-emerald-50/90 text-emerald-900 border border-emerald-200/80'
                : m.tone === 'warning'
                ? 'bg-amber-50/90 text-amber-900 border border-amber-200/80'
                : 'bg-rose-50/90 text-rose-900 border border-rose-200/80'
            }`}
          >
            <AlertCircle
              className={`h-4 w-4 shrink-0 ${
                m.tone === 'positive'
                  ? 'text-emerald-600'
                  : m.tone === 'warning'
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}
            />
            <span>{m.exclusionNotice}</span>
          </div>

          {/* Actionable Teaser + Check My Brand CTA */}
          <div className="mt-3 flex flex-col justify-between gap-2.5 border-t border-[#F3E6D8] pt-3 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <p className="text-[12.5px] font-extrabold text-[#171411]">{m.actionTeaser}</p>
              <p className="mt-0.5 text-[12px] text-[#6E655C]">
                <strong className="text-[#F05A0A]">Recommended fix:</strong> {m.specificFix}
              </p>
            </div>
            <a
              href="#hero-brand-check"
              onClick={() => {
                trackHomeEvent('cta_primary_click', { source: `hero_universe_${m.id}` })
                onCheckBrand?.()
              }}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#F05A0A] px-4 py-2 text-[12.5px] font-bold text-white shadow-sm transition hover:bg-[#171411]"
            >
              Check My Brand <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Quick model switcher pills for effortless keyboard/mobile tap */}
      <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5" role="tablist" aria-label="Select AI model">
        {UNIVERSE_MODELS.map((mod, idx) => (
          <button
            key={mod.id}
            type="button"
            role="tab"
            aria-selected={idx === selectedIndex}
            onClick={() => selectModel(idx)}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
              idx === selectedIndex
                ? 'bg-[#171411] text-white'
                : 'border border-[#EADAC9] bg-white text-[#6E655C] hover:border-[#F05A0A]'
            }`}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: toneColor(mod.tone) }}
            />
            {mod.name}
          </button>
        ))}
      </div>
    </div>
  )
}
