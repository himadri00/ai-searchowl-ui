'use client'

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'motion/react'
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  CircleAlert,
  ExternalLink,
  Globe2,
  Link2,
  Menu,
  MousePointer2,
  Search,
  X,
} from 'lucide-react'
import { Link, useRouter } from '@/i18n/routing'
import { savePlanChoice, type PlanId } from '@/lib/plan-choice'

const ORANGE = '#F05A0A'
const INK = '#171411'
const PAPER = '#F7F5F1'
const LINE = '#DEDAD3'
const EASE = [0.22, 1, 0.36, 1] as const
const TRACKED_MODELS = [
  'ChatGPT',
  'Perplexity',
  'Google AI Overviews',
  'Microsoft Copilot',
  'Gemini',
  'Claude Sonnet 4',
  'Google AI Mode',
  'Naver AI Briefing',
  'Grok',
  'DeepSeek',
] as const

type Model = {
  id: string
  name: string
  score: number
  status: string
  result: string
  citation: string
  action: string
}

const MODELS: Model[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    score: 72,
    status: 'Cited at position 2',
    result: 'Your brand is included after Notion in the sample answer.',
    citation: '/guides/remote-teams',
    action: 'Add current pricing and a comparison table to move toward position 1.',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    score: 84,
    status: 'Cited at position 1',
    result: 'Your guide is the primary source in the sample answer.',
    citation: '/research/ai-visibility',
    action: 'Keep the cited benchmark updated and monitor citation changes.',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    score: 31,
    status: 'Competitor recommended',
    result: 'Gemini recommends Jasper instead of your brand.',
    citation: 'jasper.ai/marketing',
    action: 'Create a public page for marketing teams with measurable outcomes.',
  },
  {
    id: 'claude',
    name: 'Claude',
    score: 48,
    status: 'Mentioned without a link',
    result: 'Your brand is named, but HubSpot receives the citation.',
    citation: 'hubspot.com/pricing',
    action: 'Make your pricing overview public and readable without sign-in.',
  },
  {
    id: 'copilot',
    name: 'Copilot',
    score: 61,
    status: 'Cited at position 3',
    result: 'Your comparison page appears behind Asana and ClickUp.',
    citation: '/compare/work-management',
    action: 'State plan limits clearly in a crawlable comparison table.',
  },
  {
    id: 'overviews',
    name: 'AI Overviews',
    score: 34,
    status: 'Not included',
    result: 'Google AI Overviews cites Notion and Asana, but not your site.',
    citation: 'notion.so/startups',
    action: 'Answer the buyer question directly in a clear heading and FAQ.',
  },
]

const QUESTIONS = [
  {
    question: 'Best project management tools for startups',
    answer:
      'The sample answer recommends Notion, Linear, and Asana. Each brand has a public startup page, current pricing, and clear comparison content.',
    brands: ['Notion', 'Linear', 'Asana'],
    cited: ['notion.so/startups', 'linear.app/pricing', 'asana.com/startups'],
    gap: 'Your brand is missing because the site has no dedicated startup comparison page.',
    action: 'Create a startup page with pricing, use cases, and three direct buyer questions.',
  },
  {
    question: 'Best CRM for small businesses',
    answer:
      'The sample answer recommends HubSpot, Pipedrive, and Attio. Public pricing and setup documentation influence the citations.',
    brands: ['HubSpot', 'Pipedrive', 'Attio'],
    cited: ['hubspot.com/crm', 'pipedrive.com/pricing', 'attio.com/product'],
    gap: 'Your product is mentioned once, but no page from your site is linked.',
    action: 'Publish a public small-business pricing table and a short setup guide.',
  },
  {
    question: 'Best analytics tools for SaaS',
    answer:
      'The sample answer recommends PostHog, Amplitude, and Mixpanel based on technical documentation and recent comparison pages.',
    brands: ['PostHog', 'Amplitude', 'Mixpanel'],
    cited: ['posthog.com/docs', 'amplitude.com/compare', 'mixpanel.com/templates'],
    gap: 'Your comparison page is old and does not state SDK coverage or event limits.',
    action: 'Update the comparison matrix with current limits and a visible review date.',
  },
  {
    question: 'Best AI SEO platforms',
    answer:
      'The sample answer compares platforms by tracked models, citation reporting, refresh frequency, and practical recommendations.',
    brands: ['AiSearchOwl', 'Ahrefs', 'Semrush'],
    cited: ['aisearchowl.com/platform', 'ahrefs.com/ai-search', 'semrush.com/features'],
    gap: 'A competitor is losing visibility because its methodology and refresh frequency are unclear.',
    action: 'Document how results are collected and when each prompt is checked.',
  },
]

const COMPETITORS = [
  {
    name: 'Notion',
    score: 82,
    yourScore: 41,
    winnerCount: 4,
    reason: 'Its startup and pricing pages answer the exact comparison questions AI models cite.',
    action: 'Build one public startup comparison page with current pricing and FAQs.',
  },
  {
    name: 'Jasper',
    score: 76,
    yourScore: 34,
    winnerCount: 3,
    reason: 'Its role-specific marketing pages contain outcomes and clearly named use cases.',
    action: 'Publish a marketing-team page with evidence, workflows, and direct answers.',
  },
  {
    name: 'Asana',
    score: 74,
    yourScore: 52,
    winnerCount: 3,
    reason: 'Its plan limits and seat information are available in plain, crawlable text.',
    action: 'Add a transparent plan-limit table to your existing comparison page.',
  },
]

const FEATURES = [
  {
    title: 'AI visibility tracking',
    label: 'Coverage',
    body: 'Track whether each AI model mentions, cites, or recommends your brand for specific buyer questions.',
    detail: 'Switch models and prompts to isolate where visibility is strong, weak, or missing.',
  },
  {
    title: 'Competitor intelligence',
    label: 'Comparison',
    body: 'See which competing brand each model recommends and which page helped it win the answer.',
    detail: 'Compare share of voice by prompt instead of relying on a broad market average.',
  },
  {
    title: 'Citation monitoring',
    label: 'Sources',
    body: 'Open the exact URLs used in AI answers and identify when a citation appears or disappears.',
    detail: 'Find the page structure and evidence AI systems currently trust.',
  },
  {
    title: 'Opportunity discovery',
    label: 'Actions',
    body: 'Turn a missed recommendation into a specific page, content, or accessibility improvement.',
    detail: 'Work from a prioritized list instead of a generic SEO audit.',
  },
  {
    title: 'Visibility over time',
    label: 'Trend',
    body: 'Review daily visibility changes and connect movement to pages your team updated.',
    detail: 'Monitor progress without implying that any optimization guarantees a ranking.',
  },
]

const FAQS = [
  {
    q: 'What is AI search visibility?',
    a: 'AI search visibility measures how often your brand is mentioned, cited, or recommended when AI models answer the questions your buyers ask.',
  },
  {
    q: 'How does AiSearchOwl track recommendations?',
    a: 'AiSearchOwl runs the buyer prompts you choose, records each model response, and compares mentions, citations, ranking position, and competitor presence over time.',
  },
  {
    q: 'Which AI platforms are supported?',
    a: 'Lite, Standard, and Premium include ChatGPT, Perplexity, and Google AI Overviews. Copilot, Claude Sonnet 4, Gemini, Google AI Mode, and Naver AI Briefing are paid add-ons. Enterprise can use all 39 models.',
  },
  {
    q: 'How often is visibility checked?',
    a: 'Plans include daily tracking. The number of buyer prompts checked each day depends on the plan and prompt count you select.',
  },
  {
    q: 'Can I monitor competitors?',
    a: 'Yes. Add competitors during setup or review suggested competitors, then compare mentions, citations, and recommendation share by prompt.',
  },
  {
    q: 'How does AiSearchOwl help me improve?',
    a: 'It shows the questions where you are missing, the competitor pages AI cites instead, and a prioritized improvement such as publishing a comparison page, making pricing public, or answering a missing question.',
  },
  {
    q: 'What does the trial include?',
    a: 'The first 7 days are a trial of the plan you select. After 7 days that plan is billed. AiSearchOwl is not charging cards yet and asks for payment before anything is charged.',
  },
]

const PLANS: Array<{
  id: PlanId
  name: string
  monthly: string
  yearly: string
  prompts: number
  audience: string
  features: string[]
}> = [
  {
    id: 'lite',
    name: 'Lite',
    monthly: '$22',
    yearly: '$19',
    prompts: 15,
    audience: 'Solo marketers and small teams',
    features: ['15 prompts per day', '3 included AI models', 'Daily tracking', 'Citation sources', 'Unlimited team members'],
  },
  {
    id: 'standard',
    name: 'Standard',
    monthly: '$189',
    yearly: '$160',
    prompts: 100,
    audience: 'SMEs and marketing teams',
    features: ['100 prompts per day', 'Everything in Lite', 'API and MCP access', 'Agent analytics', 'Extra prompt option'],
  },
  {
    id: 'premium',
    name: 'Premium',
    monthly: '$489',
    yearly: '$422',
    prompts: 400,
    audience: 'Mid-sized companies and agencies',
    features: ['400 prompts per day', 'Everything in Standard', 'Advanced competitor tracking', 'API and MCP access', 'Extra prompt option'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthly: 'Custom',
    yearly: 'Custom',
    prompts: 1000,
    audience: 'Global brands with custom needs',
    features: ['Starts at 1,000 prompts', 'Choose from 39 models', 'Single sign-on', 'Personal onboarding', 'Dedicated customer success'],
  },
]

function track(event: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('aisearchowl:analytics', {
      detail: { event, timestamp: Date.now(), ...data },
    }),
  )
}

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28, scale: 0.988 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.78, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <p
      className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] ${
        light ? 'text-white/60' : 'text-[#625D57]'
      }`}
    >
      <motion.span
        initial={reduce ? false : { scale: 0, rotate: -45 }}
        whileInView={{ scale: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        className="h-1.5 w-1.5 bg-[#F05A0A]"
      />
      {children}
    </p>
  )
}

function PrimaryLink({
  href,
  children,
  source,
  dark = false,
}: {
  href: string
  children: ReactNode
  source: string
  dark?: boolean
}) {
  return (
    <a
      href={href}
      onClick={() => track('cta_click', { source })}
      className={`group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 text-[14px] font-bold transition ${
        dark
          ? 'bg-white text-[#171411] hover:bg-[#F05A0A] hover:text-white'
          : 'bg-[#171411] text-white hover:bg-[#F05A0A]'
      }`}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </a>
  )
}

function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img src="/logo.svg" alt="" width={32} height={32} className="h-8 w-8 shrink-0" />
      <span className="hidden text-[16px] font-extrabold tracking-[-0.02em] min-[440px]:inline">AiSearchOwl</span>
    </span>
  )
}

function PremiumHeadlineLine({
  text,
  delay,
  className = '',
}: {
  text: string
  delay: number
  className?: string
}) {
  const reduce = useReducedMotion()

  return (
    <span className={`block ${className}`} aria-hidden>
      {text.split(' ').map((word, index) => (
        <span
          key={`${word}-${index}`}
          aria-hidden
          className="mr-[0.2em] inline-block overflow-hidden pb-[0.08em] align-bottom last:mr-0"
        >
          <motion.span
            className="inline-block will-change-transform"
            initial={reduce ? false : { y: '108%' }}
            animate={{ y: 0 }}
            transition={{
              duration: 0.88,
              delay: delay + index * 0.065,
              ease: EASE,
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

function ScrollHeading({
  lines,
  className,
}: {
  lines: string[]
  className: string
}) {
  const reduce = useReducedMotion()

  return (
    <h2 className={className} aria-label={lines.join(' ')}>
      {lines.map((line, lineIndex) => (
        <span key={line} className="block" aria-hidden>
          {line.split(' ').map((word, wordIndex) => (
            <span
              key={`${word}-${wordIndex}`}
              aria-hidden
              className="mr-[0.2em] inline-block overflow-hidden pb-[0.08em] align-bottom last:mr-0"
            >
              <motion.span
                className="inline-block will-change-transform"
                initial={reduce ? false : { y: '105%', opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: '-8%' }}
                transition={{
                  duration: 0.72,
                  delay: lineIndex * 0.12 + wordIndex * 0.045,
                  ease: EASE,
                }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </span>
      ))}
    </h2>
  )
}

function ModelPanel() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(2)
  const model = MODELS[active]

  return (
    <div className="border border-[#D9D5CE] bg-white shadow-[0_24px_70px_rgba(23,20,17,0.10)]">
      <div className="flex items-center justify-between border-b border-[#DEDAD3] px-4 py-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#68625C]">AI visibility monitor</p>
          <p className="mt-0.5 text-[12px] text-[#8A857F]">Interactive sample data</p>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#68625C]">
          <span className="h-1.5 w-1.5 bg-[#F05A0A]" />
          Daily check
        </span>
      </div>

      <div className="grid min-h-[430px] sm:grid-cols-[190px_1fr]">
        <div className="border-b border-[#DEDAD3] bg-[#F7F5F1] p-3 sm:border-b-0 sm:border-r">
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8A857F]">Select a model</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-1">
            {MODELS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActive(index)
                  track('model_interaction', { model: item.id })
                }}
                className={`border px-3 py-2.5 text-left transition ${
                  index === active
                    ? 'border-[#171411] bg-[#171411] text-white'
                    : 'border-transparent text-[#4C4742] hover:border-[#C9C4BC] hover:bg-white'
                }`}
              >
                <span className="block text-[12px] font-bold">{item.name}</span>
                <span className={`mt-0.5 block text-[10px] ${index === active ? 'text-white/60' : 'text-[#8A857F]'}`}>
                  {item.score}/100
                </span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={model.id}
            initial={reduce ? false : { opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#7A746E]">{model.name}</p>
                <p className="mt-2 text-[34px] font-extrabold leading-none tracking-[-0.04em]">
                  {model.score}
                  <span className="text-[14px] font-medium text-[#8A857F]"> / 100</span>
                </p>
              </div>
              <span className="border border-[#F05A0A] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#C84908]">
                {model.status}
              </span>
            </div>

            <div className="mt-5 h-1 bg-[#EAE7E2]">
              <motion.div
                className="h-full bg-[#F05A0A]"
                animate={{ width: `${model.score}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 22 }}
              />
            </div>

            <div className="mt-6 border-y border-[#DEDAD3] py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8A857F]">Sample answer finding</p>
              <h3 className="mt-2 text-[20px] font-extrabold leading-tight text-[#171411]">{model.result}</h3>
              <div className="group mt-4 flex items-center gap-2 bg-[#F7F5F1] px-3 py-2.5 text-[12px] text-[#4C4742]">
                <motion.span
                  initial={reduce ? false : { scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                  className="shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                >
                  <Link2 className="h-4 w-4 text-[#F05A0A]" />
                </motion.span>
                <span className="font-semibold">Source cited:</span>
                <span className="truncate font-mono text-[11px]">{model.citation}</span>
              </div>
            </div>

            <div className="mt-auto pt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#F05A0A]">Recommended improvement</p>
              <p className="mt-1.5 text-[13px] leading-6 text-[#4C4742]">{model.action}</p>
              <a
                href="#start"
                onClick={() => track('cta_click', { source: 'hero_model_panel', model: model.id })}
                className="mt-4 inline-flex items-center gap-2 text-[13px] font-bold text-[#171411] underline decoration-[#F05A0A] decoration-2 underline-offset-4"
              >
                Check my brand <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function AnswerSimulator() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const item = QUESTIONS[active]

  return (
    <section id="demo" className="scroll-mt-24 border-t border-[#DEDAD3] px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-[1180px]">
        <Reveal className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <Eyebrow>Buyer question simulator</Eyebrow>
            <ScrollHeading
              lines={['Your next customer', 'might never Google you.']}
              className="mt-4 text-[clamp(38px,5vw,64px)] font-extrabold leading-[0.98] tracking-[-0.045em]"
            />
          </div>
          <p className="max-w-xl text-[17px] leading-8 text-[#5D5751]">
            Buyers ask AI what to buy and which brands to trust. Select a question to see a clearly labeled sample answer,
            the cited sources, and the missing opportunity.
          </p>
        </Reveal>

        <Reveal delay={0.08} className="mt-10 border border-[#D9D5CE] bg-white">
          <div className="grid lg:grid-cols-[340px_1fr]">
            <div className="border-b border-[#DEDAD3] bg-[#F7F5F1] p-4 lg:border-b-0 lg:border-r">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A746E]">Select a sample prompt</p>
              <div className="space-y-2">
                {QUESTIONS.map((question, index) => (
                  <button
                    key={question.question}
                    type="button"
                    onClick={() => {
                      setActive(index)
                      track('demo_prompt_select', { prompt: index })
                    }}
                    className={`w-full border p-4 text-left text-[13px] font-bold leading-5 transition ${
                      index === active
                        ? 'border-[#171411] bg-[#171411] text-white'
                        : 'border-[#D9D5CE] bg-white text-[#302C29] hover:border-[#F05A0A]'
                    }`}
                  >
                    {question.question}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="p-5 sm:p-8"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DEDAD3] pb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F05A0A]">Sample AI response</p>
                    <p className="mt-1 text-[17px] font-extrabold">“{item.question}”</p>
                  </div>
                  <span className="border border-[#D9D5CE] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#625D57]">
                    Demonstration only
                  </span>
                </div>

                <p className="mt-5 text-[14px] leading-7 text-[#4C4742]">{item.answer}</p>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A746E]">Recommended brands</p>
                    <ol className="mt-3 divide-y divide-[#DEDAD3] border-y border-[#DEDAD3]">
                      {item.brands.map((brand, index) => (
                        <li key={brand} className="flex items-center gap-3 py-3 text-[13px]">
                          <span className="grid h-6 w-6 place-items-center bg-[#171411] text-[10px] font-bold text-white">
                            {index + 1}
                          </span>
                          <span className="font-bold">{brand}</span>
                          <span className="ml-auto text-[11px] text-[#7A746E]">Recommended</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A746E]">Cited sources</p>
                    <ul className="mt-3 divide-y divide-[#DEDAD3] border-y border-[#DEDAD3]">
                      {item.cited.map((source) => (
                        <li key={source} className="group flex items-center gap-2 py-3 font-mono text-[11px] text-[#4C4742]">
                          <ExternalLink className="h-3.5 w-3.5 text-[#F05A0A] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                          {source}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 border-l-2 border-[#F05A0A] bg-[#F7F5F1] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F05A0A]">AiSearchOwl insight</p>
                  <p className="mt-2 text-[14px] font-bold text-[#171411]">{item.gap}</p>
                  <p className="mt-1 text-[13px] leading-6 text-[#5D5751]">{item.action}</p>
                </div>

                <PrimaryLink href="#start" source="answer_simulator">
                  Find out what AI says about you
                </PrimaryLink>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function DashboardSection() {
  const reduce = useReducedMotion()
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [model, setModel] = useState(0)
  const [point, setPoint] = useState(4)
  const ranges = {
    '7d': [54, 57, 59, 62, 66],
    '30d': [31, 40, 49, 57, 68],
    '90d': [24, 35, 47, 59, 72],
  }
  const values = ranges[range]
  const offset = model === 1 ? 8 : model === 2 ? -12 : model === 3 ? -7 : 0
  const coords = values.map((value, index) => ({
    x: 35 + index * 105,
    y: 140 - Math.max(0, Math.min(100, value + offset)) * 1.1,
    value: Math.max(0, Math.min(100, value + offset)),
  }))
  const line = coords.map((coord) => `${coord.x},${coord.y}`).join(' ')

  return (
    <section id="platform" className="scroll-mt-24 bg-[#171411] px-4 py-24 text-white sm:px-6">
      <div className="mx-auto max-w-[1180px]">
        <Reveal className="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div>
            <Eyebrow light>Interactive product dashboard</Eyebrow>
            <ScrollHeading
              lines={['Stop guessing.', 'See exactly where you stand.']}
              className="mt-4 text-[clamp(38px,5vw,64px)] font-extrabold leading-[0.98] tracking-[-0.045em]"
            />
          </div>
          <p className="text-[16px] leading-7 text-white/60">
            Switch AI models, change the time range, and inspect chart points. All figures in this preview are sample data.
          </p>
        </Reveal>

        <Reveal delay={0.08} className="mt-10 border border-white/20 bg-[#201D1A]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 p-4">
            <div className="flex flex-wrap gap-2">
              {['All models', 'Perplexity', 'Gemini', 'AI Overviews'].map((item, index) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setModel(index)
                    track('dashboard_model', { model: item })
                  }}
                  className={`border px-3 py-2 text-[11px] font-bold transition ${
                    model === index
                      ? 'border-white bg-white text-[#171411]'
                      : 'border-white/20 text-white/65 hover:border-[#F05A0A] hover:text-white'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex border border-white/20">
              {(['7d', '30d', '90d'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setRange(item)
                    setPoint(4)
                    track('dashboard_range', { range: item })
                  }}
                  className={`px-3 py-2 text-[11px] font-bold ${
                    range === item ? 'bg-[#F05A0A] text-white' : 'text-white/60'
                  }`}
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-px bg-white/15 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="bg-[#201D1A] p-5 sm:p-7">
              <div className="grid grid-cols-2 gap-px bg-white/15 sm:grid-cols-4">
                {[
                  ['Visibility', `${coords[4].value}/100`],
                  ['Tracked prompts', '100'],
                  ['Brand mentions', '1,284'],
                  ['Citations', '356'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-[#201D1A] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-white/45">{label}</p>
                    <p className="mt-2 text-[24px] font-extrabold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 border border-white/15 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-bold">Visibility over time</p>
                  <p className="text-[10px] text-white/45">Select a point</p>
                </div>
                <svg viewBox="0 0 470 165" className="mt-3 w-full">
                  {[30, 70, 110, 150].map((y) => (
                    <line key={y} x1="20" x2="455" y1={y} y2={y} stroke="rgba(255,255,255,.1)" />
                  ))}
                  <motion.polyline
                    points={line}
                    animate={{ points: line }}
                    fill="none"
                    stroke={ORANGE}
                    strokeWidth="3"
                    strokeLinecap="square"
                    transition={{ duration: 0.35, ease: EASE }}
                  />
                  {coords.map((coord, index) => (
                    <g
                      key={index}
                      onClick={() => setPoint(index)}
                      className="cursor-pointer"
                    >
                      <circle cx={coord.x} cy={coord.y} r="13" fill="transparent" />
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r={point === index ? 6 : 4}
                        fill={point === index ? ORANGE : INK}
                        stroke={ORANGE}
                        strokeWidth="2"
                      />
                      <text x={coord.x} y={coord.y - 12} textAnchor="middle" fill="white" fontSize="10">
                        {coord.value}
                      </text>
                    </g>
                  ))}
                </svg>
                <p className="border-l-2 border-[#F05A0A] pl-3 text-[12px] text-white/65">
                  {point === 0
                    ? 'Baseline check identified missing comparison and pricing pages.'
                    : point === 4
                      ? 'Latest sample check shows more citations after structured page updates.'
                      : 'A tracked page update corresponds with higher sample visibility in the next checks.'}
                </p>
              </div>
            </div>

            <div className="bg-[#F7F5F1] p-5 text-[#171411] sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#68625C]">Model coverage</p>
              <div className="mt-5 space-y-5">
                {[
                  ['Perplexity', 84],
                  ['ChatGPT', 72],
                  ['AI Overviews', 58],
                  ['Gemini', 49],
                ].map(([name, value]) => (
                  <div key={String(name)}>
                    <div className="mb-1.5 flex justify-between text-[12px] font-bold">
                      <span>{name}</span>
                      <span>{value}%</span>
                    </div>
                    <div className="h-1 bg-[#D9D5CE]">
                      <motion.div
                        initial={reduce ? false : { width: 0 }}
                        whileInView={{ width: `${value}%` }}
                        viewport={{ once: true }}
                        className="h-full bg-[#F05A0A]"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 border-t border-[#D9D5CE] pt-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#68625C]">Missed opportunity</p>
                <p className="mt-2 text-[15px] font-extrabold">Gemini recommends Jasper on marketing-team prompts.</p>
                <p className="mt-2 text-[12px] leading-6 text-[#5D5751]">
                  Add a role-specific page with outcomes and buyer FAQs, then monitor whether the answer changes.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function CompetitorSection() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const competitor = COMPETITORS[active]

  return (
    <section id="competitors" className="scroll-mt-24 border-b border-[#DEDAD3] px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-[1180px]">
        <Reveal className="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div>
            <Eyebrow>Competitive visibility</Eyebrow>
            <ScrollHeading
              lines={['Your competitors are in the answer.', 'You should be too.']}
              className="mt-4 text-[clamp(38px,5vw,64px)] font-extrabold leading-[0.98] tracking-[-0.045em]"
            />
          </div>
          <p className="text-[16px] leading-7 text-[#5D5751]">
            Select a competitor to see how recommendations route between brands and what content creates the gap.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-[260px_1fr]">
          <Reveal className="space-y-2">
            {COMPETITORS.map((item, index) => (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  setActive(index)
                  track('competitor_select', { competitor: item.name })
                }}
                className={`w-full border p-4 text-left transition ${
                  active === index
                    ? 'border-[#171411] bg-[#171411] text-white'
                    : 'border-[#D9D5CE] bg-white hover:border-[#F05A0A]'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.13em] opacity-55">Compare against</span>
                <span className="mt-1 block text-[18px] font-extrabold">{item.name}</span>
              </button>
            ))}
          </Reveal>

          <AnimatePresence mode="wait">
            <motion.div
              key={competitor.name}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="border border-[#D9D5CE] bg-white p-5 sm:p-8"
            >
              <div className="grid gap-8 md:grid-cols-[1fr_0.7fr_1fr] md:items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#68625C]">Your brand</p>
                  <p className="mt-2 text-[42px] font-extrabold leading-none">{competitor.yourScore}</p>
                  <p className="mt-1 text-[12px] text-[#7A746E]">Visibility score</p>
                  <div className="mt-4 h-1 bg-[#D9D5CE]">
                    <motion.div className="h-full bg-[#171411]" animate={{ width: `${competitor.yourScore}%` }} />
                  </div>
                </div>

                <div className="border-y border-[#DEDAD3] py-5 text-center md:border-x md:border-y-0 md:px-5 md:py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#68625C]">Model result</p>
                  <p className="mt-2 text-[30px] font-extrabold text-[#F05A0A]">{competitor.winnerCount}/5</p>
                  <p className="mt-1 text-[11px] leading-5 text-[#7A746E]">models recommend {competitor.name} first</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#68625C]">{competitor.name}</p>
                  <p className="mt-2 text-[42px] font-extrabold leading-none">{competitor.score}</p>
                  <p className="mt-1 text-[12px] text-[#7A746E]">Visibility score</p>
                  <div className="mt-4 h-1 bg-[#D9D5CE]">
                    <motion.div className="h-full bg-[#F05A0A]" animate={{ width: `${competitor.score}%` }} />
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-px bg-[#D9D5CE] md:grid-cols-2">
                <div className="bg-[#F7F5F1] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#68625C]">Why they win</p>
                  <p className="mt-2 text-[14px] leading-7 text-[#3F3A36]">{competitor.reason}</p>
                </div>
                <div className="bg-[#171411] p-5 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#F05A0A]">What to improve next</p>
                  <p className="mt-2 text-[14px] leading-7 text-white/75">{competitor.action}</p>
                </div>
              </div>

              <div className="mt-6">
                <PrimaryLink href="#start" source="competitor_section">
                  Discover my competitors
                </PrimaryLink>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

function ImprovementSection() {
  const reduce = useReducedMotion()
  const [plan, setPlan] = useState(false)
  const before = [
    'Missing from relevant AI answers',
    'Weak citation presence',
    'Competitors mentioned first',
    'No prioritized content roadmap',
  ]
  const after = [
    'Identify missing buyer topics',
    'Find exact citation opportunities',
    'Prioritize relevant page updates',
    'Monitor visibility after changes',
  ]
  const list = plan ? after : before

  return (
    <section className="bg-[#F0EDE8] px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-[1180px]">
        <Reveal className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <Eyebrow>From invisible to recommended</Eyebrow>
            <ScrollHeading
              lines={['Do not just track visibility.', 'Know what to improve.']}
              className="mt-4 text-[clamp(38px,5vw,64px)] font-extrabold leading-[0.98] tracking-[-0.045em]"
            />
          </div>
          <p className="text-[16px] leading-7 text-[#5D5751]">
            The improvement state is a plan, not a guaranteed ranking outcome. Toggle the view to understand the
            difference.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <Reveal className="border border-[#D4CFC7] bg-white p-5 sm:p-8">
            <div className="flex border border-[#D9D5CE] p-1">
              <button
                type="button"
                onClick={() => {
                  setPlan(false)
                  track('improvement_toggle', { state: 'before' })
                }}
                className={`flex-1 px-4 py-2.5 text-[12px] font-bold ${!plan ? 'bg-[#171411] text-white' : ''}`}
              >
                Before
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlan(true)
                  track('improvement_toggle', { state: 'plan' })
                }}
                className={`flex-1 px-4 py-2.5 text-[12px] font-bold ${plan ? 'bg-[#F05A0A] text-white' : ''}`}
              >
                Improvement plan
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.ol
                key={String(plan)}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-6 divide-y divide-[#DEDAD3] border-y border-[#DEDAD3]"
              >
                {list.map((item, index) => (
                  <li key={item} className="flex items-center gap-4 py-4">
                    <span className={`grid h-8 w-8 place-items-center text-[11px] font-bold ${plan ? 'bg-[#F05A0A] text-white' : 'bg-[#E5E1DB]'}`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[14px] font-bold">{item}</span>
                    {plan && <Check className="ml-auto h-4 w-4 text-[#F05A0A]" />}
                  </li>
                ))}
              </motion.ol>
            </AnimatePresence>
          </Reveal>

          <Reveal delay={0.08} className="bg-[#171411] p-6 text-white sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F05A0A]">Sample opportunity</p>
            <p className="mt-4 text-[25px] font-extrabold leading-tight">
              Your competitor appears in 7 of 10 sample answers about team collaboration.
            </p>
            <div className="my-6 h-px bg-white/15" />
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Recommended action</p>
            <p className="mt-2 text-[15px] leading-7 text-white/70">
              Improve your comparison content and answer the high-intent questions buyers ask.
            </p>
            <div className="mt-7">
              <PrimaryLink href="#start" source="opportunity_section" dark>
                See my opportunities
              </PrimaryLink>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const steps = [
    {
      title: 'Add your website',
      body: 'Enter your domain, confirm the brand name, and add competitors or review suggested competitors.',
      visual: 'yourcompany.com',
    },
    {
      title: 'Track AI recommendations',
      body: 'AiSearchOwl runs the buyer prompts you select and records model mentions, citations, and competitor recommendations.',
      visual: '6 models checked',
    },
    {
      title: 'Discover what to improve',
      body: 'Review prioritized pages, topics, and citation opportunities, then monitor the next daily checks.',
      visual: '12 actions prioritized',
    },
  ]

  return (
    <section id="how" className="scroll-mt-24 border-y border-[#DEDAD3] px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-[1180px]">
        <Reveal>
          <Eyebrow>How it works</Eyebrow>
          <ScrollHeading
            lines={['Three steps from your website', 'to a clear action plan.']}
            className="mt-4 max-w-3xl text-[clamp(38px,5vw,64px)] font-extrabold leading-[0.98] tracking-[-0.045em]"
          />
        </Reveal>

        <div className="mt-10 grid gap-px bg-[#D9D5CE] lg:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal key={step.title} delay={index * 0.07}>
              <motion.button
                type="button"
                onClick={() => setActive(index)}
                onMouseEnter={() => setActive(index)}
                whileHover={reduce ? undefined : { y: -3 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                className={`h-full w-full p-6 text-left transition sm:p-8 ${
                  active === index ? 'bg-[#171411] text-white' : 'bg-white text-[#171411]'
                }`}
              >
                <span className={`text-[11px] font-bold ${active === index ? 'text-[#F05A0A]' : 'text-[#7A746E]'}`}>
                  0{index + 1}
                </span>
                <h3 className="mt-8 text-[23px] font-extrabold">{step.title}</h3>
                <p className={`mt-3 text-[14px] leading-7 ${active === index ? 'text-white/65' : 'text-[#5D5751]'}`}>
                  {step.body}
                </p>
                <div className={`mt-8 border px-4 py-5 ${active === index ? 'border-white/20' : 'border-[#D9D5CE] bg-[#F7F5F1]'}`}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-50">Output</p>
                  <p className="mt-1 text-[16px] font-extrabold">{step.visual}</p>
                </div>
              </motion.button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureGallery() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const feature = FEATURES[active]

  return (
    <section id="features" className="scroll-mt-24 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-[1180px]">
        <Reveal>
          <Eyebrow>Product capabilities</Eyebrow>
          <ScrollHeading
            lines={['One platform for the full', 'AI visibility workflow.']}
            className="mt-4 max-w-3xl text-[clamp(38px,5vw,64px)] font-extrabold leading-[0.98] tracking-[-0.045em]"
          />
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-[360px_1fr]">
          <Reveal className="divide-y divide-[#D9D5CE] border-y border-[#D9D5CE]">
            {FEATURES.map((item, index) => (
              <motion.button
                key={item.title}
                type="button"
                onClick={() => {
                  setActive(index)
                  track('feature_select', { feature: item.label })
                }}
                whileHover={reduce ? undefined : { x: 3 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`group flex w-full items-center justify-between gap-4 px-4 py-5 text-left transition ${
                  active === index ? 'bg-[#171411] text-white' : 'hover:bg-[#F0EDE8]'
                }`}
              >
                <span>
                  <span className={`block text-[10px] font-bold uppercase tracking-[0.14em] ${active === index ? 'text-[#F05A0A]' : 'text-[#7A746E]'}`}>
                    {item.label}
                  </span>
                  <span className="mt-1 block text-[15px] font-extrabold">{item.title}</span>
                </span>
                <ArrowRight className={`h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 ${active === index ? 'text-[#F05A0A]' : 'text-[#7A746E]'}`} />
              </motion.button>
            ))}
          </Reveal>

          <AnimatePresence mode="wait">
            <motion.div
              key={feature.title}
              initial={reduce ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="border border-[#D9D5CE] bg-[#F7F5F1] p-6 sm:p-10"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F05A0A]">{feature.label}</p>
              <h3 className="mt-3 text-[34px] font-extrabold tracking-[-0.035em]">{feature.title}</h3>
              <p className="mt-4 max-w-xl text-[16px] leading-8 text-[#4C4742]">{feature.body}</p>

              <div className="mt-8 border border-[#D9D5CE] bg-white p-5">
                <div className="flex items-center justify-between border-b border-[#DEDAD3] pb-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em]">Interactive sample</p>
                  <MousePointer2 className="h-4 w-4 text-[#F05A0A]" />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-px bg-[#D9D5CE]">
                  {[68, 42, 81].map((value, index) => (
                    <button
                      key={index}
                      type="button"
                      className="bg-white p-4 text-left hover:bg-[#F7F5F1]"
                    >
                      <span className="text-[10px] text-[#7A746E]">Signal {index + 1}</span>
                      <span className="mt-1 block text-[24px] font-extrabold">{value}</span>
                      <span className="mt-3 block h-1 bg-[#E5E1DB]">
                        <motion.span
                          className="block h-full bg-[#F05A0A]"
                          initial={reduce ? false : { width: 0 }}
                          animate={{ width: `${value}%` }}
                        />
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-5 text-[13px] leading-6 text-[#5D5751]">{feature.detail}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

function Methodology() {
  const reduce = useReducedMotion()
  return (
    <section className="border-y border-[#DEDAD3] bg-white px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-[1180px]">
        <Reveal className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Eyebrow>Transparent methodology</Eyebrow>
            <ScrollHeading
              lines={['Understand what', 'the score means.']}
              className="mt-4 text-[clamp(34px,4.5vw,54px)] font-extrabold leading-[1] tracking-[-0.04em]"
            />
            <p className="mt-4 text-[15px] leading-7 text-[#5D5751]">
              No invented testimonials or customer counts. Credibility comes from clear measurement, visible sample
              labels, and direct source evidence.
            </p>
          </div>
          <div className="grid gap-px bg-[#D9D5CE] sm:grid-cols-2">
            {[
              ['01', 'Run selected buyer prompts', 'AiSearchOwl asks the models and prompts configured in your workspace.'],
              ['02', 'Record the complete answer', 'Mentions, position, linked citations, and recommended competitors are stored.'],
              ['03', 'Compare repeated checks', 'Daily runs show when an answer or cited source changes over time.'],
              ['04', 'Prioritize the gap', 'Missing topics and competitor source pages become specific improvement opportunities.'],
            ].map(([number, title, body]) => (
              <motion.article
                key={number}
                whileHover={reduce ? undefined : { y: -3 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                className="group bg-[#F7F5F1] p-6"
              >
                <motion.span
                  initial={reduce ? false : { opacity: 0, x: -6 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="inline-block text-[11px] font-bold text-[#F05A0A] transition-transform group-hover:translate-x-1"
                >
                  {number}
                </motion.span>
                <h3 className="mt-6 text-[17px] font-extrabold">{title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-[#5D5751]">{body}</p>
              </motion.article>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Pricing() {
  const router = useRouter()
  const reduce = useReducedMotion()
  const [yearly, setYearly] = useState(true)

  const choosePlan = (id: PlanId, prompts: number) => {
    savePlanChoice({ plan: id, prompts })
    track('signup_start', { source: 'pricing', plan: id })
    router.push(`/sign-up?plan=${id}&prompts=${prompts}`)
  }

  return (
    <section id="pricing" className="scroll-mt-24 bg-[#F0EDE8] px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-[1180px]">
        <Reveal className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <Eyebrow>Pricing</Eyebrow>
            <ScrollHeading
              lines={['Choose the tracking volume', 'that fits your team.']}
              className="mt-4 text-[clamp(38px,5vw,60px)] font-extrabold leading-[0.98] tracking-[-0.045em]"
            />
          </div>
          <div className="flex border border-[#CFC9C0] bg-white p-1">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={`px-4 py-2 text-[12px] font-bold ${!yearly ? 'bg-[#171411] text-white' : ''}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`px-4 py-2 text-[12px] font-bold ${yearly ? 'bg-[#171411] text-white' : ''}`}
            >
              Yearly, save 15%
            </button>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-px bg-[#CFC9C0] md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan, index) => (
            <Reveal key={plan.id} delay={index * 0.05}>
              <motion.article
                whileHover={reduce ? undefined : { y: -4 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                className={`flex h-full flex-col p-6 ${plan.id === 'standard' ? 'bg-[#171411] text-white' : 'bg-white text-[#171411]'}`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${plan.id === 'standard' ? 'text-[#F05A0A]' : 'text-[#7A746E]'}`}>
                  {plan.id === 'standard' ? 'Most popular' : plan.audience}
                </p>
                <h3 className="mt-5 text-[24px] font-extrabold">{plan.name}</h3>
                <p className={`mt-1 min-h-10 text-[12px] leading-5 ${plan.id === 'standard' ? 'text-white/55' : 'text-[#6A645E]'}`}>
                  {plan.audience}
                </p>
                <p className="mt-6 text-[38px] font-extrabold tracking-[-0.04em]">
                  {yearly ? plan.yearly : plan.monthly}
                  {plan.monthly !== 'Custom' && <span className="text-[12px] font-medium opacity-55"> USD / month</span>}
                </p>
                <p className={`mt-1 text-[11px] ${plan.id === 'standard' ? 'text-white/45' : 'text-[#7A746E]'}`}>
                  {plan.monthly === 'Custom' ? 'Price confirmed before payment' : yearly ? 'Billed yearly' : 'Billed monthly'}
                </p>

                <button
                  type="button"
                  onClick={() => choosePlan(plan.id, plan.prompts)}
                  className={`group mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-[13px] font-bold transition ${
                    plan.id === 'standard'
                      ? 'bg-[#F05A0A] text-white hover:bg-white hover:text-[#171411]'
                      : 'border border-[#171411] hover:bg-[#171411] hover:text-white'
                  }`}
                >
                  Start 7-day trial <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>

                <ul className={`mt-6 flex-1 space-y-3 border-t pt-5 text-[12.5px] ${plan.id === 'standard' ? 'border-white/15 text-white/70' : 'border-[#DEDAD3] text-[#4C4742]'}`}>
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F05A0A]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.article>
            </Reveal>
          ))}
        </div>

        <p className="mt-6 max-w-4xl text-[12px] leading-6 text-[#68625C]">
          Prices are in USD before tax. The first 7 days are a trial of the selected plan. After 7 days that plan is
          billed. AiSearchOwl is not charging cards yet and asks for payment before anything is charged. Add-on model
          pricing and extra prompt pricing are shown during setup.
        </p>
      </div>
    </section>
  )
}

function FAQ() {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(0)

  return (
    <section id="faq" className="scroll-mt-24 px-4 py-24 sm:px-6">
      <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.65fr_1fr]">
        <Reveal>
          <Eyebrow>Questions answered clearly</Eyebrow>
          <ScrollHeading
            lines={['Remove the final', 'uncertainty.']}
            className="mt-4 text-[clamp(38px,5vw,58px)] font-extrabold leading-[0.98] tracking-[-0.045em]"
          />
          <p className="mt-4 text-[15px] leading-7 text-[#5D5751]">
            Select a question to review the answer. If a required setup detail is missing, the product tells you what to
            add.
          </p>
        </Reveal>

        <div className="divide-y divide-[#D9D5CE] border-y border-[#D9D5CE]">
          {FAQS.map((item, index) => (
            <div key={item.q}>
              <button
                type="button"
                onClick={() => {
                  setOpen(open === index ? -1 : index)
                  track('faq_toggle', { question: index })
                }}
                aria-expanded={open === index}
                className="flex w-full items-center justify-between gap-4 py-5 text-left text-[15px] font-extrabold"
              >
                {item.q}
                <ChevronDown className={`h-4 w-4 shrink-0 text-[#F05A0A] transition-transform ${open === index ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {open === index && (
                  <motion.div
                    initial={reduce ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-2xl pb-5 text-[14px] leading-7 text-[#5D5751]">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function EditorialHome() {
  const router = useRouter()
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 24 })
  const [menuOpen, setMenuOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const [domain, setDomain] = useState('')
  const [domainError, setDomainError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const handleScroll = () => setCompact(window.scrollY > 60)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const cleanDomain = useMemo(
    () => domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, ''),
    [domain],
  )

  const submitDomain = (event: FormEvent) => {
    event.preventDefault()
    if (!cleanDomain) {
      setDomainError('Enter your website domain, for example yourcompany.com.')
      return
    }
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(cleanDomain)) {
      setDomainError('Enter a complete domain with an ending such as .com, .io, or .co.uk.')
      return
    }
    setDomainError('')
    setSubmitting(true)
    savePlanChoice({ plan: 'lite', prompts: 15 })
    track('website_submit', { domain: cleanDomain })
    window.setTimeout(() => {
      router.push(`/sign-up?plan=lite&prompts=15&domain=${encodeURIComponent(cleanDomain)}`)
    }, 250)
  }

  const nav = [
    ['Features', '#features'],
    ['Platform', '#platform'],
    ['How it works', '#how'],
    ['Pricing', '#pricing'],
  ]

  return (
    <main className="min-h-screen bg-[#F7F5F1] text-[#171411] selection:bg-[#F05A0A] selection:text-white">
      <motion.div style={{ scaleX: progress }} className="fixed inset-x-0 top-0 z-[70] h-0.5 origin-left bg-[#F05A0A]" />

      <motion.header
        initial={reduce ? false : { opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6"
      >
        <motion.div
          animate={{ maxWidth: compact ? 1040 : 1180, minHeight: compact ? 54 : 62 }}
          className="mx-auto flex items-center border border-[#D9D5CE] bg-[#F7F5F1]/95 px-4 shadow-[0_12px_35px_rgba(23,20,17,0.08)] backdrop-blur-xl"
        >
          <Link href="/" className="shrink-0">
            <BrandMark />
          </Link>
          <nav className="ml-10 hidden items-center gap-6 lg:flex" aria-label="Main navigation">
            {nav.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="relative py-2 text-[13px] font-semibold text-[#5D5751] after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-[#F05A0A] after:transition-all hover:text-[#171411] hover:after:w-full"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/sign-in" className="hidden px-3 py-2 text-[13px] font-bold sm:block">
              Sign in
            </Link>
            <a
              href="#start"
              onClick={() => track('cta_click', { source: 'navigation' })}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#171411] px-4 text-[12px] font-bold text-white hover:bg-[#F05A0A]"
            >
              <span className="sm:hidden">Start free</span>
              <span className="hidden sm:inline">Start free trial</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="grid h-10 w-10 place-items-center border border-[#D9D5CE] lg:hidden"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </motion.div>
        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mx-auto mt-2 max-w-[1180px] border border-[#D9D5CE] bg-white p-3 shadow-xl lg:hidden"
              aria-label="Mobile navigation"
            >
              {nav.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="block border-b border-[#E5E1DB] px-3 py-3 text-[14px] font-bold last:border-0"
                >
                  {label}
                </a>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.header>

      <section className="px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
        <div className="mx-auto grid max-w-[1180px] items-center gap-8 min-[900px]:grid-cols-[1.08fr_0.92fr] lg:gap-10">
          <div>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <Eyebrow>AI search visibility, tracked daily</Eyebrow>
            </motion.div>
            <h1
              className="mt-5 text-[clamp(50px,5.8vw,82px)] font-extrabold leading-[0.9] tracking-[-0.06em]"
              aria-label="Be the brand AI recommends."
            >
              <PremiumHeadlineLine text="Be the brand" delay={0.08} />
              <PremiumHeadlineLine
                text="AI recommends."
                delay={0.26}
                className="min-[900px]:whitespace-nowrap"
              />
            </h1>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.18, ease: EASE }}
              className="mt-7 max-w-xl text-[17px] leading-8 text-[#5D5751]"
            >
              See which AI models recommend your brand, who they recommend instead, and exactly what to improve to
              become a stronger choice.
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.26, ease: EASE }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <PrimaryLink href="#start" source="hero">
                Start tracking for free
              </PrimaryLink>
              <a
                href="#demo"
                onClick={() => track('demo_launch', { source: 'hero' })}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#171411] px-5 text-[14px] font-bold hover:bg-white"
              >
                Explore interactive demo <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>

            <form id="start" onSubmit={submitDomain} noValidate className="mt-8 scroll-mt-28 border-t border-[#D9D5CE] pt-6">
              <label htmlFor="hero-domain" className="text-[12px] font-bold">
                Enter your website URL
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Globe2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A746E]" />
                  <input
                    id="hero-domain"
                    value={domain}
                    onChange={(event) => {
                      setDomain(event.target.value)
                      if (domainError) setDomainError('')
                    }}
                    placeholder="yourcompany.com"
                    inputMode="url"
                    autoComplete="url"
                    aria-invalid={Boolean(domainError)}
                    aria-describedby="domain-help domain-error"
                    className="h-12 w-full rounded-md border border-[#BFBAB2] bg-white pl-10 pr-3 text-[14px] outline-none focus:border-[#F05A0A] focus:ring-1 focus:ring-[#F05A0A]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#F05A0A] px-5 text-[13px] font-bold text-white hover:bg-[#171411] disabled:opacity-55"
                >
                  {submitting ? 'Opening setup...' : 'Check AI visibility'}{' '}
                  <Search className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                </button>
              </div>
              <p id="domain-help" className="mt-2 text-[11.5px] leading-5 text-[#7A746E]">
                This opens signup and setup. It does not run a fake scan. The first 7 days are a trial of the plan you
                select.
              </p>
              {domainError && (
                <p id="domain-error" role="alert" className="mt-2 flex items-center gap-2 text-[12px] font-bold text-[#B43B00]">
                  <CircleAlert className="h-4 w-4" />
                  {domainError}
                </p>
              )}
            </form>
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.16, ease: EASE }}
            className="min-[900px]:ml-3 lg:ml-5"
          >
            <ModelPanel />
          </motion.div>
        </div>
      </section>

      <div
        className="overflow-hidden border-y border-[#171411] bg-[#171411] py-4 text-white"
        aria-label={`AI models tracked: ${TRACKED_MODELS.join(', ')}`}
      >
        <motion.div
          className="flex w-max will-change-transform"
          animate={reduce ? undefined : { x: ['-50%', '0%'] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        >
          {[0, 1].map((copy) => (
            <div
              key={copy}
              aria-hidden={copy === 1}
              className="flex shrink-0 items-center gap-10 pr-10 text-[10px] font-bold uppercase tracking-[0.15em] text-white/60"
            >
              {TRACKED_MODELS.map((model) => (
                <span key={`${copy}-${model}`} className="flex items-center gap-2 whitespace-nowrap">
                  <span className="h-1 w-1 shrink-0 bg-[#F05A0A]" />
                  {model}
                </span>
              ))}
            </div>
          ))}
        </motion.div>
      </div>

      <AnswerSimulator />
      <DashboardSection />
      <CompetitorSection />
      <ImprovementSection />
      <HowItWorks />
      <FeatureGallery />
      <Methodology />
      <Pricing />
      <FAQ />

      <section className="px-4 pb-8 sm:px-6">
        <Reveal className="mx-auto max-w-[1180px] bg-[#171411] px-6 py-20 text-white sm:px-12 sm:py-24">
          <Eyebrow light>Start with one clear question</Eyebrow>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_0.55fr] lg:items-end">
            <div>
              <ScrollHeading
                lines={['AI is already recommending brands.', 'Make sure yours is one of them.']}
                className="text-[clamp(40px,6vw,76px)] font-extrabold leading-[0.94] tracking-[-0.055em]"
              />
              <p className="mt-5 max-w-xl text-[16px] leading-7 text-white/60">
                Discover where your brand stands and what to improve.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:items-start">
              <PrimaryLink href="#start" source="final_cta" dark>
                Start tracking for free
              </PrimaryLink>
              <a href="#platform" className="text-[13px] font-bold text-white/65 underline underline-offset-4 hover:text-white">
                Explore the platform
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-[#D9D5CE] px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 sm:flex-row sm:items-center">
          <Link href="/">
            <BrandMark />
          </Link>
          <p className="text-[11px] leading-5 text-[#7A746E] sm:ml-auto">
            © 2026 AiSearchOwl. Dashboard figures and AI answers on this page are clearly labeled sample data.
          </p>
        </div>
      </footer>
    </main>
  )
}
