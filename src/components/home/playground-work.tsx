'use client'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Globe,
  Link2,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react'
import { Favicon } from '@/components/shell/brand-mark'
import { OwlBadge } from './hero-owl'
import { AnimatedNumber, EASE, Magnetic, Reveal, SectionTag, trackHomeEvent } from './motion-primitives'

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 3: "Know Who AI Recommends Instead" — Split-Screen Routing Visualizer
// ═════════════════════════════════════════════════════════════════════════════

type CompetitorScenario = {
  id: string
  competitorName: string
  competitorHost: string
  promptLabel: string
  yourScore: number
  compScore: number
  yourCitations: number
  compCitations: number
  models: Array<{
    id: string
    name: string
    host: string
    icon?: string
    routesTo: 'you' | 'competitor' | 'both'
    verdictLabel: string
    citedUrl: string
  }>
  gapExplanation: string
  recommendedAction: string
}

const SCENARIOS: CompetitorScenario[] = [
  {
    id: 'notion',
    competitorName: 'Notion',
    competitorHost: 'notion.so',
    promptLabel: '“Best workspace & workflow tools for remote startups”',
    yourScore: 41,
    compScore: 82,
    yourCitations: 12,
    compCitations: 64,
    models: [
      { id: 'chatgpt', name: 'ChatGPT', host: 'openai.com', routesTo: 'both', verdictLabel: 'Picks Notion #1 · You #2', citedUrl: 'notion.so/remote-work' },
      { id: 'perplexity', name: 'Perplexity', host: 'perplexity.ai', routesTo: 'you', verdictLabel: 'Cites your guide #1', citedUrl: 'yourwebsite.com/remote-guide' },
      { id: 'overviews', name: 'AI Overviews', host: 'google.com', routesTo: 'competitor', verdictLabel: 'Picks Notion · Skips you', citedUrl: 'notion.so/startups' },
      { id: 'gemini', name: 'Gemini', host: 'gemini.google.com', routesTo: 'competitor', verdictLabel: 'Recommends Notion only', citedUrl: 'notion.so/templates' },
      { id: 'claude', name: 'Claude', host: 'claude.ai', routesTo: 'competitor', verdictLabel: 'Links Notion pricing', citedUrl: 'notion.so/pricing' },
    ],
    gapExplanation:
      'Notion wins 4 of 5 models on this prompt because its /startups and /pricing pages contain crawlable comparison tables and FAQ schema. Your site only has a generic feature tour.',
    recommendedAction:
      'Publish a public “For Remote Startups” comparison page with a structured pricing & feature table that AI Overviews, Gemini, and Claude can cite directly.',
  },
  {
    id: 'jasper',
    competitorName: 'Jasper',
    competitorHost: 'jasper.ai',
    promptLabel: '“Best AI content & visibility platforms for marketing teams”',
    yourScore: 34,
    compScore: 76,
    yourCitations: 9,
    compCitations: 51,
    models: [
      { id: 'chatgpt', name: 'ChatGPT', host: 'openai.com', routesTo: 'competitor', verdictLabel: 'Recommends Jasper #1', citedUrl: 'jasper.ai/marketing' },
      { id: 'perplexity', name: 'Perplexity', host: 'perplexity.ai', routesTo: 'both', verdictLabel: 'Cites both brands', citedUrl: 'yourwebsite.com/benchmarks' },
      { id: 'overviews', name: 'AI Overviews', host: 'google.com', routesTo: 'competitor', verdictLabel: 'Lists Jasper & HubSpot', citedUrl: 'jasper.ai/solutions' },
      { id: 'gemini', name: 'Gemini', host: 'gemini.google.com', routesTo: 'competitor', verdictLabel: 'Picks Jasper · Skips you', citedUrl: 'jasper.ai/case-studies' },
      { id: 'claude', name: 'Claude', host: 'claude.ai', routesTo: 'you', verdictLabel: 'Cites your methodology', citedUrl: 'yourwebsite.com/docs' },
    ],
    gapExplanation:
      'Gemini and ChatGPT route marketing buyers to Jasper because Jasper publishes role-specific landing pages (“For Marketing Teams”) with quantified case metrics.',
    recommendedAction:
      'Add a dedicated “For Marketing Teams” solution page with 3 customer benchmark metrics and direct answers to buyer evaluation questions.',
  },
  {
    id: 'asana',
    competitorName: 'Asana',
    competitorHost: 'asana.com',
    promptLabel: '“Best team collaboration & tracking software with clear limits”',
    yourScore: 52,
    compScore: 74,
    yourCitations: 24,
    compCitations: 49,
    models: [
      { id: 'chatgpt', name: 'ChatGPT', host: 'openai.com', routesTo: 'you', verdictLabel: 'Cites you #1 for speed', citedUrl: 'yourwebsite.com/overview' },
      { id: 'perplexity', name: 'Perplexity', host: 'perplexity.ai', routesTo: 'you', verdictLabel: 'Cites you #1 (24 links)', citedUrl: 'yourwebsite.com/compare' },
      { id: 'overviews', name: 'AI Overviews', host: 'google.com', routesTo: 'competitor', verdictLabel: 'Picks Asana #1', citedUrl: 'asana.com/compare' },
      { id: 'gemini', name: 'Gemini', host: 'gemini.google.com', routesTo: 'both', verdictLabel: 'Names Asana #1 · You #3', citedUrl: 'asana.com/pricing' },
      { id: 'claude', name: 'Claude', host: 'claude.ai', routesTo: 'competitor', verdictLabel: 'Links Asana tier table', citedUrl: 'asana.com/enterprise' },
    ],
    gapExplanation:
      'You already beat Asana on Perplexity and ChatGPT! However, Claude and AI Overviews prefer Asana because Asana states seat limits and API quotas in plain text.',
    recommendedAction:
      'Add a transparent “Plan Limits & Seat Quotas” section to your existing comparison page to capture Claude and Google AI Overviews.',
  },
]

export function CompetitorComparisonSection() {
  const reduce = useReducedMotion()
  const [compIdx, setCompIdx] = useState(0)
  const [focusedModelIdx, setFocusedModelIdx] = useState<number | null>(null)
  const scenario = SCENARIOS[compIdx]

  return (
    <section
      id="competitors"
      className="scroll-mt-28 px-4 py-20 sm:px-6 sm:py-28"
      aria-label="Know Who AI Recommends Instead"
    >
      <div className="mx-auto max-w-[1180px]">
        <Reveal className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <SectionTag>Know who AI recommends instead</SectionTag>
            <h2 className="mt-4 text-[clamp(34px,5vw,60px)] font-extrabold leading-[1.03] tracking-[-0.035em] text-[#171411]">
              Your competitors are in the answer.{' '}
              <span className="text-[#F05A0A]">You should be too.</span>
            </h2>
            <p className="mt-4 text-[16.5px] leading-relaxed text-[#655C53]">
              See exactly which AI models route buyers to your brand—and which models send high-intent buyers straight
              to your competitors. Switch competitors below to watch recommendation paths reroute in real time.
            </p>
          </div>

          {/* Competitor Switcher Pills */}
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Select sample competitor">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#8C8177]">Compare vs:</span>
            {SCENARIOS.map((s, idx) => {
              const active = idx === compIdx
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setCompIdx(idx)
                    setFocusedModelIdx(null)
                    trackHomeEvent('competitor_switch', { competitor: s.id })
                  }}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-bold transition ${
                    active
                      ? 'border-[#F05A0A] bg-[#F05A0A] text-white shadow-[0_10px_22px_rgba(240,90,10,0.28)]'
                      : 'border-[#EADAC9] bg-white text-[#171411] hover:border-[#F05A0A]'
                  }`}
                >
                  <Favicon host={s.competitorHost} className="h-4 w-4 rounded-full" />
                  <span>vs {s.competitorName}</span>
                </button>
              )
            })}
          </div>
        </Reveal>

        {/* Split-Screen Composition */}
        <Reveal delay={0.1} className="mt-8">
          <div className="rounded-[32px] border border-[#EADAC9] bg-white p-5 shadow-[0_26px_65px_rgba(23,20,17,0.07)] sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-[#F2E5D8] pb-4">
              <p className="text-[13.5px] font-bold text-[#655C53]">
                Buyer Prompt Tested:{' '}
                <strong className="text-[#171411]">{scenario.promptLabel}</strong>
              </p>
              <span className="rounded-full bg-[#FFF3E8] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#F05A0A]">
                Sample Comparison Data
              </span>
            </div>

            <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.25fr_1fr]">
              {/* LEFT: YOUR BRAND */}
              <div className="rounded-[24px] border-2 border-[#EADAC9] bg-[#FFFAF5] p-5">
                <div className="flex items-center gap-2.5">
                  <OwlBadge size={36} />
                  <div>
                    <span className="rounded-full bg-[#FFF0E5] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#F05A0A]">
                      Your Brand
                    </span>
                    <h3 className="mt-0.5 text-[18px] font-extrabold text-[#171411]">yourwebsite.com</h3>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#EFE2D4] pt-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C8177]">Visibility Score</p>
                    <p className="mt-1 text-[28px] font-extrabold leading-none text-[#171411]">
                      <AnimatedNumber value={scenario.yourScore} suffix="/100" />
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C8177]">Cited Links</p>
                    <p className="mt-1 text-[28px] font-extrabold leading-none text-emerald-700">
                      <AnimatedNumber value={scenario.yourCitations} />
                    </p>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#EFE2D4]">
                  <motion.div
                    className="h-full rounded-full bg-emerald-600"
                    animate={{ width: `${scenario.yourScore}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                  />
                </div>
                <p className="mt-2.5 text-[12px] font-semibold text-[#655C53]">
                  Recommended by{' '}
                  <strong className="text-emerald-700">
                    {scenario.models.filter((m) => m.routesTo === 'you' || m.routesTo === 'both').length} of 5
                  </strong>{' '}
                  models on this prompt.
                </p>
              </div>

              {/* CENTER: AI MODELS & REROUTING RECOMMENDATION PATHS */}
              <div className="space-y-2.5" role="list" aria-label="AI model recommendation routing paths">
                <p className="text-center text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#8C8177]">
                  AI Recommendation Routing (Click any model)
                </p>
                {scenario.models.map((mod, idx) => {
                  const isFocused = focusedModelIdx === idx
                  const routesYou = mod.routesTo === 'you'
                  const routesBoth = mod.routesTo === 'both'
                  return (
                    <motion.button
                      key={mod.id}
                      type="button"
                      layout
                      onClick={() => setFocusedModelIdx(isFocused ? null : idx)}
                      className={`w-full rounded-2xl border p-3 text-left transition ${
                        isFocused
                          ? 'border-[#171411] bg-[#171411] text-white shadow-lg'
                          : routesYou
                          ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400'
                          : routesBoth
                          ? 'border-amber-200 bg-amber-50/50 hover:border-amber-400'
                          : 'border-rose-200 bg-rose-50/55 hover:border-rose-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Left Arrow indicator toward Your Brand */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-extrabold ${
                            routesYou || routesBoth
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-200/70 text-zinc-500'
                          }`}
                        >
                          ← {routesYou ? 'Cites You' : routesBoth ? 'Both' : 'Skipped'}
                        </span>

                        {/* Model Identity */}
                        <div className="flex items-center gap-1.5">
                          <Favicon host={mod.host} className="h-4 w-4 rounded-full" />
                          <span className={`text-[13px] font-extrabold ${isFocused ? 'text-white' : 'text-[#171411]'}`}>
                            {mod.name}
                          </span>
                        </div>

                        {/* Right Arrow indicator toward Competitor */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-extrabold ${
                            !routesYou
                              ? 'bg-rose-600 text-white'
                              : 'bg-zinc-200/70 text-zinc-500'
                          }`}
                        >
                          {!routesYou ? `Picks ${scenario.competitorName}` : 'Beaten'} →
                        </span>
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-[11.5px]">
                        <span className={isFocused ? 'text-white/80' : 'font-semibold text-[#4E463E]'}>
                          {mod.verdictLabel}
                        </span>
                        <span className={`flex items-center gap-1 font-mono text-[10.5px] ${isFocused ? 'text-[#FF9A57]' : 'text-[#7A7067]'}`}>
                          <Link2 className="h-3 w-3" /> {mod.citedUrl}
                        </span>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* RIGHT: COMPETING BRAND */}
              <div className="rounded-[24px] border-2 border-rose-200 bg-rose-50/35 p-5">
                <div className="flex items-center gap-2.5">
                  <Favicon host={scenario.competitorHost} className="h-9 w-9 rounded-xl" />
                  <div>
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-rose-800">
                      Competing Brand
                    </span>
                    <h3 className="mt-0.5 text-[18px] font-extrabold text-[#171411]">{scenario.competitorName}</h3>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-rose-200/70 pt-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C8177]">Visibility Score</p>
                    <p className="mt-1 text-[28px] font-extrabold leading-none text-rose-700">
                      <AnimatedNumber value={scenario.compScore} suffix="/100" />
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C8177]">Cited Links</p>
                    <p className="mt-1 text-[28px] font-extrabold leading-none text-[#171411]">
                      <AnimatedNumber value={scenario.compCitations} />
                    </p>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-rose-100">
                  <motion.div
                    className="h-full rounded-full bg-rose-600"
                    animate={{ width: `${scenario.compScore}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                  />
                </div>
                <p className="mt-2.5 text-[12px] font-semibold text-[#655C53]">
                  Captures{' '}
                  <strong className="text-rose-700">
                    {scenario.models.filter((m) => m.routesTo !== 'you').length} of 5
                  </strong>{' '}
                  AI model recommendations here.
                </p>
              </div>
            </div>

            {/* Associated Explanation & Next Recommended Action */}
            <AnimatePresence mode="wait">
              <motion.div
                key={scenario.id}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-[#F2DEC9] bg-[#FFF8F1] p-5 lg:flex-row lg:items-center"
              >
                <div className="space-y-1.5">
                  <p className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-wider text-[#9A3412]">
                    <Trophy className="h-4 w-4 text-[#F05A0A]" />
                    Why {scenario.competitorName} is winning this prompt — and how to take it back
                  </p>
                  <p className="text-[13.5px] leading-relaxed text-[#3F3831]">{scenario.gapExplanation}</p>
                  <p className="text-[13.5px] font-bold text-[#171411]">
                    <span className="text-[#F05A0A]">Next recommended action:</span> {scenario.recommendedAction}
                  </p>
                </div>

                <Magnetic className="shrink-0">
                  <a
                    href="#start"
                    onClick={() => trackHomeEvent('cta_primary_click', { source: 'competitor_comparison' })}
                    className="inline-flex items-center gap-2 rounded-full bg-[#171411] px-6 py-3.5 text-[14px] font-bold text-white transition hover:bg-[#F05A0A]"
                  >
                    Discover My Competitors <ArrowRight className="h-4 w-4" />
                  </a>
                </Magnetic>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 4: "From Invisible to Recommended" — Interactive Before & After Plan
// ═════════════════════════════════════════════════════════════════════════════

const BEFORE_ITEMS = [
  {
    title: 'Missing from relevant AI answers',
    detail: 'High-intent buyers ask ChatGPT or Gemini what to buy in your category, and only your top 3 competitors are named.',
    badge: '0 mentions on 7/10 prompts',
  },
  {
    title: 'Weak citation presence',
    detail: 'Your best product and pricing pages are gated or unstructured, giving Perplexity and AI Overviews nothing verifiable to cite.',
    badge: 'Unlinked or skipped',
  },
  {
    title: 'Competitors mentioned first',
    detail: 'Even when your brand appears, competitors rank #1 because their comparison tables answer exact buyer specs.',
    badge: 'Ranked #3 or lower',
  },
  {
    title: 'Unaddressed content opportunities',
    detail: 'Your team publishes blog posts for legacy keyword volume without knowing which exact questions AI models fail to cite you on.',
    badge: 'Guesswork roadmap',
  },
] as const

const PLAN_ITEMS = [
  {
    title: 'Identify missing buyer topics',
    detail: 'Pinpoint the exact high-intent buyer questions where ChatGPT, Perplexity, and AI Overviews recommend competitors instead of you.',
    badge: 'Step 1 · Gap Audit',
  },
  {
    title: 'Find exact citation opportunities',
    detail: 'See the exact competitor URLs AI models cite as footnotes—so you know which comparison, pricing, or FAQ page to build or ungate.',
    badge: 'Step 2 · Source Mapping',
  },
  {
    title: 'Prioritize relevant content updates',
    detail: 'Work from a clear, impact-ordered optimization checklist instead of guessing what to write or update next.',
    badge: 'Step 3 · Ordered Action Plan',
  },
  {
    title: 'Monitor visibility over time',
    detail: 'Track daily prompt runs across models to verify whether your updated pages earn new citations and mentions.',
    badge: 'Step 4 · Daily Verification',
  },
] as const

export function ImprovementPlanSection() {
  const reduce = useReducedMotion()
  const [mode, setMode] = useState<'before' | 'plan'>('plan')
  const [sliderPos, setSliderPos] = useState<number>(72) // Draggable comparison percentage

  const switchMode = (next: 'before' | 'plan') => {
    setMode(next)
    setSliderPos(next === 'before' ? 24 : 78)
    trackHomeEvent('before_after_toggle', { state: next })
  }

  return (
    <section
      id="improvement-plan"
      className="scroll-mt-28 bg-[#FFF6ED]/70 px-4 py-20 sm:px-6 sm:py-28"
      aria-label="From Invisible to Recommended — Before and Improvement Plan"
    >
      <div className="mx-auto max-w-[1180px]">
        <Reveal className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <SectionTag>From invisible to recommended</SectionTag>
            <h2 className="mt-4 text-[clamp(34px,5vw,60px)] font-extrabold leading-[1.03] tracking-[-0.035em] text-[#171411]">
              Don&apos;t just track visibility.{' '}
              <span className="text-[#F05A0A]">Know what to improve.</span>
            </h2>
            <p className="mt-4 text-[16.5px] leading-relaxed text-[#655C53]">
              Tracking a score without an action plan doesn&apos;t move revenue. Toggle between{' '}
              <strong className="text-[#171411]">State A (Before)</strong> and{' '}
              <strong className="text-[#171411]">State B (Improvement Plan)</strong>—or drag the comparison slider—to
              see how AiSearchOwl turns visibility gaps into a structured optimization plan.
            </p>
          </div>

          {/* Segmented Control */}
          <div
            role="group"
            aria-label="Toggle between Before state and Improvement Plan state"
            className="relative inline-flex self-start rounded-full border border-[#EADAC9] bg-white p-1.5 shadow-sm"
          >
            {(
              [
                ['before', 'State A — Before AiSearchOwl'],
                ['plan', 'State B — Your Improvement Plan'],
              ] as const
            ).map(([key, label]) => {
              const active = mode === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchMode(key)}
                  aria-pressed={active}
                  className={`relative rounded-full px-4 py-2.5 text-[13px] font-extrabold transition ${
                    active ? 'text-white' : 'text-[#655C53] hover:text-[#171411]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="before-after-pill"
                      className={`absolute inset-0 rounded-full ${
                        key === 'before' ? 'bg-[#171411]' : 'bg-[#F05A0A]'
                      }`}
                      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                    />
                  )}
                  <span className="relative">{label}</span>
                </button>
              )
            })}
          </div>
        </Reveal>

        {/* Draggable Comparison Bar + Morphing State Cards */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Left: Morphing State Card + Interactive Draggable Comparison Scrubber */}
          <Reveal>
            <div className="rounded-[30px] border border-[#EADAC9] bg-white p-6 shadow-[0_22px_55px_rgba(23,20,17,0.06)] sm:p-7">
              {/* Interactive Draggable Scrubber */}
              <div className="mb-6 rounded-2xl border border-[#F2E5D8] bg-[#FFFAF5] p-4">
                <div className="flex items-center justify-between text-[12px] font-extrabold">
                  <span className={sliderPos < 50 ? 'text-rose-700' : 'text-[#8C8177]'}>
                    ← State A: Unstructured & Overlooked
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#171411]">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-[#F05A0A]" /> Drag comparison slider
                  </span>
                  <span className={sliderPos >= 50 ? 'text-[#F05A0A]' : 'text-[#8C8177]'}>
                    State B: Structured Optimization Plan →
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sliderPos}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setSliderPos(v)
                    setMode(v < 50 ? 'before' : 'plan')
                  }}
                  aria-label="Comparison slider between State A Before and State B Improvement Plan"
                  className="mt-2.5 w-full"
                />
              </div>

              {/* Morphing List */}
              <AnimatePresence mode="wait">
                {mode === 'before' ? (
                  <motion.div
                    key="state-before"
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.26, ease: EASE }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-[11.5px] font-extrabold text-rose-800">
                        <XCircle className="h-3.5 w-3.5" /> State A — Before AiSearchOwl
                      </span>
                      <span className="text-[12px] font-semibold text-[#8C8177]">What happens without visibility tracking</span>
                    </div>

                    <ul className="mt-4 space-y-3">
                      {BEFORE_ITEMS.map((item) => (
                        <li
                          key={item.title}
                          className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-[15px] font-extrabold text-[#171411]">{item.title}</h3>
                            <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                              {item.badge}
                            </span>
                          </div>
                          <p className="mt-1 text-[13.5px] leading-relaxed text-[#5C534A]">{item.detail}</p>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ) : (
                  <motion.div
                    key="state-plan"
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.26, ease: EASE }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11.5px] font-extrabold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" /> State B — Structured Improvement Plan
                      </span>
                      <span className="text-[11.5px] font-semibold text-[#7A7067]">
                        Actionable optimization plan (not a guaranteed ranking claim)
                      </span>
                    </div>

                    <ul className="mt-4 space-y-3">
                      {PLAN_ITEMS.map((item) => (
                        <li
                          key={item.title}
                          className="rounded-2xl border border-emerald-200/90 bg-emerald-50/40 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-[15px] font-extrabold text-[#171411]">{item.title}</h3>
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800">
                              {item.badge}
                            </span>
                          </div>
                          <p className="mt-1 text-[13.5px] leading-relaxed text-[#4E463E]">{item.detail}</p>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>

          {/* Right: Interactive Sample Recommendation Card */}
          <Reveal delay={0.1}>
            <div className="flex h-full flex-col justify-between rounded-[30px] border-2 border-[#171411] bg-[#171411] p-6 text-white shadow-[0_28px_65px_rgba(23,20,17,0.22)] sm:p-7">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F05A0A]/20 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#FF9A57]">
                    <Sparkles className="h-3.5 w-3.5 text-[#F05A0A]" /> Sample Recommendation Card
                  </span>
                  <span className="text-[11px] font-semibold text-white/50">Priority #1 Opportunity</span>
                </div>

                {/* Exact Required Quote */}
                <div className="mt-5 rounded-2xl border border-white/12 bg-white/[0.06] p-4">
                  <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-rose-300">
                    <AlertCircle className="h-4 w-4 text-rose-400" /> Opportunity Detected
                  </p>
                  <p className="mt-2 text-[17px] font-extrabold leading-snug text-white">
                    “Opportunity detected: Your competitor appears in 7 of 10 sample answers about team collaboration.”
                  </p>
                </div>

                {/* Exact Recommended Action */}
                <div className="mt-4 rounded-2xl border border-[#F05A0A]/45 bg-[#F05A0A]/12 p-4">
                  <p className="text-[11.5px] font-extrabold uppercase tracking-wider text-[#FF9A57]">
                    Recommended Action
                  </p>
                  <p className="mt-1.5 text-[15px] font-bold leading-relaxed text-white">
                    “Improve your comparison content and answer the high-intent questions buyers ask.”
                  </p>
                  <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-[12.5px] text-white/80">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#FF9A57]" />
                      Target URL: <code className="text-[#FFB067]">/compare/team-collaboration</code>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#FF9A57]" />
                      Add side-by-side seat limits, pricing tiers & buyer FAQ schema
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#FF9A57]" />
                      Daily tracking verifies when AI models pick up the updated page
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-5">
                <Magnetic className="w-full">
                  <a
                    href="#start"
                    onClick={() => trackHomeEvent('cta_primary_click', { source: 'see_my_opportunities' })}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#F05A0A] px-6 py-4 text-[15px] font-bold text-white shadow-[0_16px_34px_rgba(240,90,10,0.38)] transition hover:bg-white hover:text-[#171411]"
                  >
                    See My Opportunities <ArrowRight className="h-4 w-4" />
                  </a>
                </Magnetic>
                <p className="mt-2.5 text-center text-[12px] text-white/50">
                  Sample illustration of an AiSearchOwl optimization plan. Outcomes depend on your site updates and AI model indexing.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// Legacy exports kept aliased so any secondary imports stay intact
export const Playground = CompetitorComparisonSection
export const WorkShowcase = ImprovementPlanSection
