'use client'
import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  Eye,
  FileBarChart,
  LayoutGrid,
  Link2,
  MessagesSquare,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Favicon } from '@/components/shell/brand-mark'
import { OwlBadge } from '@/components/home/hero-owl'
import { AnimatedNumber, EASE, TiltCard, trackHomeEvent } from '@/components/home/motion-primitives'

const ORANGE = '#F05A0A'
const LINE = '#EFE2D4'

type RangeId = '7d' | '30d' | '90d'
type ModelFilterId = 'all' | 'chatgpt' | 'perplexity' | 'overviews' | 'gemini'

type ChartPoint = {
  date: string
  score: number
  event: string
}

const RANGE_DATA: Record<
  RangeId,
  {
    label: string
    visibility: number
    delta: string
    prompts: number
    mentions: number
    citations: number
    points: ChartPoint[]
  }
> = {
  '7d': {
    label: 'Last 7 Days',
    visibility: 71,
    delta: '+6 pp vs prior week',
    prompts: 100,
    mentions: 318,
    citations: 94,
    points: [
      { date: 'Day 1', score: 65, event: 'Baseline daily run across ChatGPT, Perplexity & AI Overviews' },
      { date: 'Day 2', score: 66, event: 'Updated startup pricing table indexed by Perplexity' },
      { date: 'Day 4', score: 68, event: 'ChatGPT moved your brand from #3 to #2 on “Alternatives to Notion”' },
      { date: 'Day 5', score: 69, event: 'New FAQ schema picked up by Google AI Overviews' },
      { date: 'Day 7', score: 71, event: '94 verified URL citations recorded across 7-day window' },
    ],
  },
  '30d': {
    label: 'Last 30 Days',
    visibility: 68,
    delta: '+18 pp in 30 days',
    prompts: 100,
    mentions: 1284,
    citations: 356,
    points: [
      { date: 'Week 1', score: 50, event: 'Initial baseline: missing from 14 high-intent comparison prompts' },
      { date: 'Week 2', score: 55, event: 'Published “Remote Teams Guide” — Perplexity cited it within 48h' },
      { date: 'Week 3', score: 61, event: 'Removed sign-up wall on pricing overview — Claude & ChatGPT added citations' },
      { date: 'Week 4', score: 65, event: 'Overtook Asana for #2 share of voice in category prompts' },
      { date: 'Today', score: 68, event: 'Leading share of voice (34%) across tracked buyer prompts' },
    ],
  },
  '90d': {
    label: 'Last 90 Days',
    visibility: 68,
    delta: '+37 pp since day 1',
    prompts: 100,
    mentions: 3640,
    citations: 982,
    points: [
      { date: 'Month 1', score: 31, event: 'Started tracking: 31/100 score, competitors dominated 78% of answers' },
      { date: 'Month 1.5', score: 44, event: 'Shipped top 3 content fixes from AiSearchOwl Opportunity Plan' },
      { date: 'Month 2', score: 54, event: 'Earned #1 citation spot on Perplexity for core category query' },
      { date: 'Month 2.5', score: 62, event: 'Added comparison matrix tables across 6 product landing pages' },
      { date: 'Month 3', score: 68, event: 'Sustained #1 category visibility with daily drift alerts active' },
    ],
  },
}

const MODEL_COVERAGE: Record<
  ModelFilterId,
  {
    name: string
    host: string
    tierNote: string
    scoreBonus: number
    platforms: Array<{ name: string; host: string; value: number; status: string }>
  }
> = {
  all: {
    name: 'All Tracked Models',
    host: 'openai.com',
    tierNote: 'Showing combined sample metrics across models',
    scoreBonus: 0,
    platforms: [
      { name: 'Perplexity', host: 'perplexity.ai', value: 84, status: 'Cited #1 on 38 prompts' },
      { name: 'ChatGPT', host: 'openai.com', value: 72, status: 'Recommended in 72% of runs' },
      { name: 'AI Overviews', host: 'google.com', value: 58, status: 'Appears in 58% of summaries' },
      { name: 'Gemini (Add-on)', host: 'gemini.google.com', value: 49, status: '3 missed prompt gaps detected' },
    ],
  },
  chatgpt: {
    name: 'ChatGPT',
    host: 'openai.com',
    tierNote: 'Included in Lite, Standard, Premium & Enterprise',
    scoreBonus: 4,
    platforms: [
      { name: 'ChatGPT', host: 'openai.com', value: 72, status: 'Cited #2 on core buyer prompts' },
      { name: 'Perplexity', host: 'perplexity.ai', value: 84, status: 'Strongest citation source' },
      { name: 'AI Overviews', host: 'google.com', value: 58, status: 'Growing after FAQ update' },
      { name: 'Gemini (Add-on)', host: 'gemini.google.com', value: 49, status: 'Needs comparison page fix' },
    ],
  },
  perplexity: {
    name: 'Perplexity',
    host: 'perplexity.ai',
    tierNote: 'Included in Lite, Standard, Premium & Enterprise',
    scoreBonus: 12,
    platforms: [
      { name: 'Perplexity', host: 'perplexity.ai', value: 84, status: '42 direct footnote citations' },
      { name: 'ChatGPT', host: 'openai.com', value: 72, status: 'Cites your remote-teams guide' },
      { name: 'AI Overviews', host: 'google.com', value: 58, status: 'Pulls from structured H2s' },
      { name: 'Gemini (Add-on)', host: 'gemini.google.com', value: 49, status: 'Prefers Jasper on 4 prompts' },
    ],
  },
  overviews: {
    name: 'Google AI Overviews',
    host: 'google.com',
    tierNote: 'Included in Lite, Standard, Premium & Enterprise',
    scoreBonus: -8,
    platforms: [
      { name: 'AI Overviews', host: 'google.com', value: 58, status: 'Missed on 4 comparison queries' },
      { name: 'Perplexity', host: 'perplexity.ai', value: 84, status: 'Leading citation rate' },
      { name: 'ChatGPT', host: 'openai.com', value: 72, status: 'Consistent top-3 mention' },
      { name: 'Gemini (Add-on)', host: 'gemini.google.com', value: 49, status: 'Opportunity identified' },
    ],
  },
  gemini: {
    name: 'Gemini',
    host: 'gemini.google.com',
    tierNote: 'Paid add-on on Lite/Standard/Premium · Included in Enterprise',
    scoreBonus: -15,
    platforms: [
      { name: 'Gemini (Add-on)', host: 'gemini.google.com', value: 49, status: 'Recommends Jasper on marketing prompts' },
      { name: 'Perplexity', host: 'perplexity.ai', value: 84, status: 'Your strongest benchmark engine' },
      { name: 'ChatGPT', host: 'openai.com', value: 72, status: 'Strong citation momentum' },
      { name: 'AI Overviews', host: 'google.com', value: 58, status: 'Moderate visibility' },
    ],
  },
}

const COMPETITORS = [
  { id: 'you', name: 'Your Brand (Sample)', host: 'aisearchowl.com', share: 34, color: '#F05A0A', note: 'Leading on Perplexity & ChatGPT workflow prompts; missing on 3 Gemini marketing prompts.' },
  { id: 'notion', name: 'Notion', host: 'notion.so', share: 28, color: '#FF9A57', note: 'Wins #1 when buyers ask for startup templates because of its public /startups hub.' },
  { id: 'asana', name: 'Asana', host: 'asana.com', share: 21, color: '#FFD2AD', note: 'Cited by Copilot & AI Overviews due to crawlable plan limit comparison tables.' },
  { id: 'jasper', name: 'Jasper', host: 'jasper.ai', share: 17, color: '#E2D6CA', note: 'Recommended ahead of you by Gemini on marketing-team workflow queries.' },
] as const

const EXPANDABLE_PROMPTS = [
  {
    q: 'Best project management tools for startups?',
    rank: '#1 on Perplexity · #2 on ChatGPT',
    visibility: '78%',
    citations: '42 urls',
    status: 'winning',
    excerpt:
      '“Top recommendations for startups include yourwebsite.com [1] for automated visibility reporting and Notion [2] for all-in-one workspace docs.”',
    citedPage: 'yourwebsite.com/guides/remote-teams',
    missedGap: 'Keep benchmark numbers updated monthly to defend #1 against Notion.',
  },
  {
    q: 'Alternatives to Notion for growing teams?',
    rank: '#2 Mentioned & Cited',
    visibility: '72%',
    citations: '36 urls',
    status: 'winning',
    excerpt:
      '“Teams outgrowing Notion frequently evaluate Linear for engineering sprints and yourwebsite.com [1] for structured visibility workflows.”',
    citedPage: 'yourwebsite.com/compare/notion-alternatives',
    missedGap: 'Add a seat-pricing calculator row to overtake Linear for #1.',
  },
  {
    q: 'Best AI marketing workflow tools for agencies?',
    rank: 'Missed on Gemini (Opportunity)',
    visibility: '24%',
    citations: '2 urls',
    status: 'missed',
    excerpt:
      '“Agencies typically choose Jasper, HubSpot, and Copy.ai for client campaign workflows…” (Your brand was not included in this answer.)',
    citedPage: 'No page cited — jasper.ai/agencies was cited instead',
    missedGap: 'Action: Publish a dedicated “For Agencies” page answering client-reporting FAQs.',
  },
] as const

const SIDE_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'prompts', label: 'Tracked Prompts', icon: MessagesSquare },
  { id: 'citations', label: 'Citation Sources', icon: Link2 },
  { id: 'competitors', label: 'Competitor SOV', icon: Users },
  { id: 'opportunities', label: 'Missed Opportunities', icon: FileBarChart },
] as const

export function PreviewBoard() {
  const reduce = useReducedMotion()
  const [range, setRange] = useState<RangeId>('30d')
  const [modelFilter, setModelFilter] = useState<ModelFilterId>('all')
  const [selectedPointIdx, setSelectedPointIdx] = useState(4)
  const [selectedCompId, setSelectedCompId] = useState<string>('you')
  const [expandedPromptIdx, setExpandedPromptIdx] = useState<number>(2) // Open the missed opportunity by default
  const [activeSideTab, setActiveSideTab] = useState<string>('overview')

  const rData = RANGE_DATA[range]
  const mData = MODEL_COVERAGE[modelFilter]
  const adjustedScore = Math.max(18, Math.min(96, rData.visibility + mData.scoreBonus))
  const activePoint = rData.points[selectedPointIdx] ?? rData.points[rData.points.length - 1]
  const selectedComp = COMPETITORS.find((c) => c.id === selectedCompId) ?? COMPETITORS[0]

  // Compute SVG polyline coordinates for the 5 chart points
  const chartCoords = rData.points.map((pt, idx) => {
    const x = 52 + idx * 108
    const s = Math.max(20, Math.min(95, pt.score + mData.scoreBonus))
    const y = 145 - ((s - 20) / 75) * 110
    return { x, y, score: s, date: pt.date, event: pt.event }
  })
  const polylinePoints = chartCoords.map((c) => `${c.x},${c.y}`).join(' ')
  const areaPath = `M ${chartCoords[0].x} 148 ` + chartCoords.map((c) => `L ${c.x} ${c.y}`).join(' ') + ` L ${chartCoords[chartCoords.length - 1].x} 148 Z`

  return (
    <TiltCard>
      <div
        className="overflow-hidden rounded-[30px] border bg-white shadow-[0_32px_80px_rgba(240,90,10,0.11),0_10px_30px_rgba(23,20,17,0.06)]"
        style={{ borderColor: LINE }}
      >
        {/* Top Demo Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFE2D4] bg-[#FFFAF5] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#F05A0A]" />
            <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#171411]">
              Interactive Platform Showcase · <span className="text-[#F05A0A]">Sample Workspace Data</span>
            </span>
          </div>

          {/* Model Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter dashboard by AI model">
            {(
              [
                ['all', 'All Models'],
                ['chatgpt', 'ChatGPT'],
                ['perplexity', 'Perplexity'],
                ['overviews', 'AI Overviews'],
                ['gemini', 'Gemini'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setModelFilter(id)
                  trackHomeEvent('dashboard_interact', { control: 'model_filter', value: id })
                }}
                aria-pressed={modelFilter === id}
                className={`rounded-full px-3 py-1 text-[11.5px] font-bold transition ${
                  modelFilter === id
                    ? 'bg-[#171411] text-white shadow-sm'
                    : 'border border-[#E7D6C4] bg-white text-[#5C534A] hover:border-[#F05A0A]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Time Range Switcher */}
          <div className="inline-flex rounded-full border border-[#E7D6C4] bg-white p-0.5" role="group" aria-label="Select sample time range">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRange(r)
                  setSelectedPointIdx(4)
                  trackHomeEvent('dashboard_interact', { control: 'time_range', value: r })
                }}
                aria-pressed={range === r}
                className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold transition ${
                  range === r ? 'bg-[#F05A0A] text-white' : 'text-[#6E655C] hover:text-[#171411]'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[200px_1fr]">
          {/* Left Sidebar Navigation */}
          <aside
            className="hidden border-b bg-[#FFFCF9] p-3.5 lg:block lg:border-b-0 lg:border-r"
            style={{ borderColor: LINE }}
          >
            <div className="mb-3 flex items-center gap-2 px-2 py-1">
              <OwlBadge size={26} />
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-extrabold text-[#171411]">yourwebsite.com</p>
                <p className="text-[10.5px] font-medium text-[#8C8177]">Sample Workspace</p>
              </div>
            </div>
            <ul className="space-y-1">
              {SIDE_TABS.map((item) => {
                const isAct = activeSideTab === item.id
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSideTab(item.id)
                        trackHomeEvent('dashboard_interact', { control: 'sidebar_tab', value: item.id })
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12.5px] font-bold transition ${
                        isAct
                          ? 'bg-[#F05A0A] text-white shadow-[0_8px_18px_rgba(240,90,10,0.25)]'
                          : 'text-[#6E655C] hover:bg-[#FFF3E8] hover:text-[#171411]'
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                      <span>{item.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="mt-6 rounded-2xl border border-[#F2DEC9] bg-[#FFF7EF] p-3 text-[11.5px] leading-relaxed text-[#5C534A]">
              <p className="font-extrabold text-[#9A3412]">Daily Check Active</p>
              <p className="mt-1">
                Every morning we run your buyer prompts and flag citation changes.
              </p>
            </div>
          </aside>

          {/* Main Dashboard Canvas */}
          <div className="min-w-0 p-4 sm:p-6">
            {/* Header Info */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-[17px] font-extrabold text-[#171411]">
                  AI Search Visibility Overview — <span className="text-[#F05A0A]">{mData.name}</span>
                </h3>
                <p className="text-[12px] text-[#7A7067]">{mData.tierNote}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11.5px] font-bold text-emerald-800">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                {rData.delta}
              </span>
            </div>

            {/* 4 Key KPI Cards */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border bg-[#FFFAF5] px-4 py-3.5" style={{ borderColor: LINE }}>
                <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-[#7A7067]">
                  <Eye className="h-3.5 w-3.5 text-[#F05A0A]" /> Overall AI Visibility
                </p>
                <p className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-[28px] font-extrabold leading-none tracking-tight text-[#171411]">
                    <AnimatedNumber value={adjustedScore} suffix="/100" />
                  </span>
                  <span className="text-[11.5px] font-bold text-emerald-700">Sample Score</span>
                </p>
              </article>

              <article className="rounded-2xl border bg-white px-4 py-3.5" style={{ borderColor: LINE }}>
                <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-[#7A7067]">
                  <MessagesSquare className="h-3.5 w-3.5 text-[#F05A0A]" /> Tracked Buyer Prompts
                </p>
                <p className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-[28px] font-extrabold leading-none tracking-tight text-[#171411]">
                    <AnimatedNumber value={rData.prompts} />
                  </span>
                  <span className="text-[11.5px] font-semibold text-[#7A7067]">Checked daily</span>
                </p>
              </article>

              <article className="rounded-2xl border bg-white px-4 py-3.5" style={{ borderColor: LINE }}>
                <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-[#7A7067]">
                  <Users className="h-3.5 w-3.5 text-[#F05A0A]" /> Brand Mentions
                </p>
                <p className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-[28px] font-extrabold leading-none tracking-tight text-[#171411]">
                    <AnimatedNumber value={rData.mentions} />
                  </span>
                  <span className="text-[11.5px] font-bold text-emerald-700">+37%</span>
                </p>
              </article>

              <article className="rounded-2xl border bg-white px-4 py-3.5" style={{ borderColor: LINE }}>
                <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-[#7A7067]">
                  <Link2 className="h-3.5 w-3.5 text-[#F05A0A]" /> Verified Citations
                </p>
                <p className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-[28px] font-extrabold leading-none tracking-tight text-[#171411]">
                    <AnimatedNumber value={rData.citations} />
                  </span>
                  <span className="text-[11.5px] font-bold text-emerald-700">+53%</span>
                </p>
              </article>
            </div>

            {/* Row 2: Interactive Trend Chart (click points!) + AI Model Coverage */}
            <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
              {/* Interactive Chart */}
              <article className="rounded-2xl border bg-white p-4" style={{ borderColor: LINE }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13.5px] font-extrabold text-[#171411]">
                    AI Visibility Trend ({rData.label})
                  </p>
                  <span className="text-[11.5px] font-semibold text-[#F05A0A]">
                    Click any point on the chart to inspect what changed
                  </span>
                </div>

                <svg viewBox="0 0 540 175" className="mt-2 h-[175px] w-full select-none">
                  <defs>
                    <linearGradient id="owlTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ORANGE} stopOpacity="0.26" />
                      <stop offset="100%" stopColor={ORANGE} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {[35, 72, 110, 148].map((y, idx) => (
                    <g key={y}>
                      <line x1="40" x2="505" y1={y} y2={y} stroke="#F5EAE0" />
                      <text x="4" y={y + 4} fill="#9A9086" fontSize="10.5" fontWeight="600">
                        {90 - idx * 20}%
                      </text>
                    </g>
                  ))}

                  <path d={areaPath} fill="url(#owlTrendGrad)" />
                  <motion.polyline
                    fill="none"
                    stroke={ORANGE}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylinePoints}
                    animate={{ points: polylinePoints }}
                    transition={{ duration: 0.35, ease: EASE }}
                  />

                  {chartCoords.map((pt, idx) => {
                    const isSelected = idx === selectedPointIdx
                    return (
                      <g
                        key={pt.date}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedPointIdx(idx)
                          trackHomeEvent('dashboard_interact', { control: 'chart_point', value: pt.date })
                        }}
                      >
                        <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isSelected ? 6.5 : 4.5}
                          fill={isSelected ? ORANGE : '#FFFFFF'}
                          stroke={ORANGE}
                          strokeWidth="3"
                        />
                        <text
                          x={pt.x}
                          y={pt.y - 12}
                          textAnchor="middle"
                          fill={isSelected ? '#171411' : '#7A7067'}
                          fontSize="11"
                          fontWeight="800"
                        >
                          {pt.score}%
                        </text>
                        <text x={pt.x} y="168" textAnchor="middle" fill="#8C8177" fontSize="11" fontWeight="600">
                          {pt.date}
                        </text>
                      </g>
                    )
                  })}
                </svg>

                {/* Selected Chart Point Event Callout */}
                <div className="mt-1 flex items-center justify-between gap-2 rounded-xl border border-[#F3E2D2] bg-[#FFFAF5] px-3 py-2 text-[12px]">
                  <span className="font-extrabold text-[#F05A0A]">{activePoint.date}:</span>
                  <span className="flex-1 text-[#3F3831]">{activePoint.event}</span>
                </div>
              </article>

              {/* AI Model Coverage Bars */}
              <article className="rounded-2xl border bg-white p-4" style={{ borderColor: LINE }}>
                <p className="text-[13.5px] font-extrabold text-[#171411]">Coverage by AI Model</p>
                <p className="mt-0.5 text-[11.5px] text-[#7A7067]">
                  How often each engine mentions or cites your brand
                </p>
                <ul className="mt-3.5 space-y-3">
                  {mData.platforms.map((platform) => (
                    <li key={platform.name}>
                      <div className="mb-1 flex items-center gap-2 text-[12px]">
                        <Favicon host={platform.host} className="h-4 w-4 rounded-full" />
                        <span className="font-bold text-[#171411]">{platform.name}</span>
                        <span className="ml-auto font-extrabold text-[#171411]">{platform.value}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#FFF1E6]">
                        <motion.div
                          className="h-full rounded-full bg-[#F05A0A]"
                          animate={{ width: `${platform.value}%` }}
                          transition={{ type: 'spring', stiffness: 110, damping: 20 }}
                        />
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#7A7067]">{platform.status}</p>
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            {/* Row 3: Interactive Competitor Share of Voice + Expandable AI Answers & Missed Opportunities */}
            <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              {/* Interactive Competitor Share of Voice */}
              <article className="rounded-2xl border bg-white p-4" style={{ borderColor: LINE }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13.5px] font-extrabold text-[#171411]">Competitor Share of Voice</p>
                  <span className="text-[11px] font-semibold text-[#8C8177]">Click a brand to compare</span>
                </div>

                <div className="mt-3 space-y-2">
                  {COMPETITORS.map((comp) => {
                    const isSel = comp.id === selectedCompId
                    return (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => {
                          setSelectedCompId(comp.id)
                          trackHomeEvent('dashboard_interact', { control: 'competitor_select', value: comp.id })
                        }}
                        className={`w-full rounded-xl border p-2.5 text-left transition ${
                          isSel
                            ? 'border-[#F05A0A] bg-[#FFF8F1] shadow-sm'
                            : 'border-[#F3E6D8] bg-white hover:border-[#F05A0A]/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-[12.5px]">
                          <Favicon host={comp.host} className="h-4 w-4 rounded-full" />
                          <span className="font-extrabold text-[#171411]">{comp.name}</span>
                          <span className="ml-auto font-extrabold text-[#F05A0A]">{comp.share}% SOV</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#F5E8DC]">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: comp.color }}
                            animate={{ width: `${comp.share * 2.4}%` }}
                            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-3 rounded-xl bg-[#FFFAF5] p-3 text-[12px] leading-relaxed text-[#4E463E]">
                  <strong className="text-[#171411]">{selectedComp.name}:</strong> {selectedComp.note}
                </div>
              </article>

              {/* Expandable Specific AI Answers & Missed Opportunities */}
              <article className="rounded-2xl border bg-white p-4" style={{ borderColor: LINE }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13.5px] font-extrabold text-[#171411]">
                    Prompt Answers & Missed Opportunities
                  </p>
                  <span className="text-[11px] font-semibold text-[#F05A0A]">Click any prompt to expand</span>
                </div>

                <div className="mt-3 space-y-2">
                  {EXPANDABLE_PROMPTS.map((row, idx) => {
                    const isOpen = expandedPromptIdx === idx
                    const isMissed = row.status === 'missed'
                    return (
                      <div
                        key={row.q}
                        className={`overflow-hidden rounded-xl border transition ${
                          isMissed
                            ? 'border-rose-200 bg-rose-50/35'
                            : isOpen
                            ? 'border-[#F05A0A] bg-[#FFFAF5]'
                            : 'border-[#F2E5D8] bg-white'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedPromptIdx(isOpen ? -1 : idx)
                            trackHomeEvent('dashboard_interact', { control: 'expand_prompt', value: row.q })
                          }}
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[12.5px] font-extrabold text-[#171411]">{row.q}</p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px]">
                              <span
                                className={`rounded-full px-2 py-0.5 font-bold ${
                                  isMissed
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {row.rank}
                              </span>
                              <span className="text-[#7A7067]">Visibility: {row.visibility}</span>
                              <span className="text-[#7A7067]">Citations: {row.citations}</span>
                            </div>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-[#F05A0A] transition-transform ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={reduce ? false : { height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden border-t border-[#F2E5D8] px-3.5 pb-3 pt-2.5 text-[12px]"
                            >
                              <p className="italic text-[#3F3831]">{row.excerpt}</p>
                              <p className="mt-1.5 font-semibold text-[#6E655C]">
                                <strong className="text-[#171411]">Citation URL:</strong> {row.citedPage}
                              </p>
                              <p className="mt-1.5 flex items-center gap-1.5 font-bold text-[#F05A0A]">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                {row.missedGap}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between pt-1 text-[12px]">
                  <span className="text-[#7A7067]">Sample dashboard preview</span>
                  <a
                    href="#start"
                    onClick={() => trackHomeEvent('cta_primary_click', { source: 'dashboard_preview' })}
                    className="inline-flex items-center gap-1 font-extrabold text-[#F05A0A] hover:underline"
                  >
                    Start tracking your own domain <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </TiltCard>
  )
}
