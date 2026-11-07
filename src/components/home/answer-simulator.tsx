'use client'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  MessageSquare,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { Favicon } from '@/components/shell/brand-mark'
import { OwlBadge } from './hero-owl'
import { EASE, Magnetic, Reveal, SectionTag, trackHomeEvent } from './motion-primitives'

type SimulatedQuestion = {
  id: string
  prompt: string
  category: string
  engineName: string
  engineHost: string
  answerIntro: string
  recommendedBrands: Array<{
    name: string
    host: string
    rank: string
    reason: string
    citedUrl: string
  }>
  overlookedBrand: {
    name: string
    status: string
    reasonMissing: string
  }
  owlInsight: {
    headline: string
    action: string
    impactNote: string
  }
}

const QUESTIONS: SimulatedQuestion[] = [
  {
    id: 'pm-startups',
    prompt: 'Best project management tools for startups',
    category: 'SaaS / Productivity',
    engineName: 'ChatGPT + Perplexity Consensus',
    engineHost: 'openai.com',
    answerIntro:
      'For fast-moving startups in 2026, AI assistants consistently recommend tools that combine docs, sprints, and transparent startup pricing:',
    recommendedBrands: [
      {
        name: 'Notion',
        host: 'notion.so',
        rank: '#1 Recommended',
        reason: 'Cited for all-in-one docs + startup credit program page.',
        citedUrl: 'notion.so/startups',
      },
      {
        name: 'Linear',
        host: 'linear.app',
        rank: '#2 Recommended',
        reason: 'Cited for engineering issue tracking benchmarks & public changelog.',
        citedUrl: 'linear.app/features',
      },
      {
        name: 'Asana',
        host: 'asana.com',
        rank: '#3 Recommended',
        reason: 'Cited from “Startup Project Management Guide (Updated)”.',
        citedUrl: 'asana.com/resources/startup-guide',
      },
    ],
    overlookedBrand: {
      name: 'yourwebsite.com (Your Brand)',
      status: 'Overlooked — 0 citations in this answer',
      reasonMissing:
        'Your product has startup features, but your site has no dedicated “For Startups” page or public tier comparison table for AI to cite.',
    },
    owlInsight: {
      headline: 'Why AI overlooked your brand on this buyer question:',
      action:
        'Publish a crawlable “Project Management for Startups” comparison guide with startup tier pricing and 3 concrete workflow FAQs.',
      impactNote: 'High-intent prompt asked daily across ChatGPT, Perplexity, and Google AI Overviews.',
    },
  },
  {
    id: 'crm-smb',
    prompt: 'Best CRM for small businesses',
    category: 'B2B Software / Sales',
    engineName: 'Perplexity + Gemini Answer',
    engineHost: 'perplexity.ai',
    answerIntro:
      'Small businesses asking AI for a CRM receive recommendations weighted heavily toward transparent seat pricing and setup speed:',
    recommendedBrands: [
      {
        name: 'HubSpot CRM',
        host: 'hubspot.com',
        rank: '#1 Recommended',
        reason: 'Cited 64 times for free-tier documentation and SMB comparison tables.',
        citedUrl: 'hubspot.com/products/crm',
      },
      {
        name: 'Pipedrive',
        host: 'pipedrive.com',
        rank: '#2 Recommended',
        reason: 'Cited for visual sales pipeline setup under 15 minutes.',
        citedUrl: 'pipedrive.com/en/crm-comparison',
      },
      {
        name: 'Attio',
        host: 'attio.com',
        rank: '#3 Recommended',
        reason: 'Cited from modern data-model documentation and G2 summary pages.',
        citedUrl: 'attio.com/customers',
      },
    ],
    overlookedBrand: {
      name: 'yourwebsite.com (Your Brand)',
      status: 'Mentioned once without a link',
      reasonMissing:
        'AI knows your brand name, but your pricing and SMB onboarding steps sit behind a demo request form that crawlers cannot verify.',
    },
    owlInsight: {
      headline: 'Turn an unlinked mention into a top-3 cited recommendation:',
      action:
        'Make your SMB pricing table and “Setup in 10 Minutes” checklist public in plain HTML without requiring email capture.',
      impactNote: 'Directly fixes unlinked mentions on Claude and Perplexity.',
    },
  },
  {
    id: 'analytics-saas',
    prompt: 'Best analytics tools for SaaS',
    category: 'Product Analytics / Data',
    engineName: 'Google AI Overviews + Claude',
    engineHost: 'google.com',
    answerIntro:
      'When SaaS founders ask AI how to track funnel retention and subscription revenue, AI synthesizes answers from technical docs and comparison matrices:',
    recommendedBrands: [
      {
        name: 'PostHog',
        host: 'posthog.com',
        rank: '#1 Recommended',
        reason: 'Cited for open documentation and side-by-side feature comparisons.',
        citedUrl: 'posthog.com/blog/best-saas-analytics',
      },
      {
        name: 'Amplitude',
        host: 'amplitude.com',
        rank: '#2 Recommended',
        reason: 'Cited for cohort retention benchmarks and enterprise governance docs.',
        citedUrl: 'amplitude.com/saas-analytics',
      },
      {
        name: 'Mixpanel',
        host: 'mixpanel.com',
        rank: '#3 Recommended',
        reason: 'Cited from interactive product metrics templates.',
        citedUrl: 'mixpanel.com/templates',
      },
    ],
    overlookedBrand: {
      name: 'yourwebsite.com (Your Brand)',
      status: 'Skipped in favour of PostHog & Amplitude',
      reasonMissing:
        'Your comparison page hasn’t been updated in 9 months and lacks structured schema for event limits and SDK support.',
    },
    owlInsight: {
      headline: 'Competitors win because their comparison pages answer exact specs:',
      action:
        'Refresh your “Alternatives & Comparison” matrix with current SDK coverage, free event limits, and a visible last-updated date.',
      impactNote: 'AI models prioritize recently updated technical comparison tables.',
    },
  },
  {
    id: 'ai-seo-platforms',
    prompt: 'Best AI SEO platforms',
    category: 'Marketing / AI Search Visibility',
    engineName: 'ChatGPT + Perplexity Live Synthesis',
    engineHost: 'openai.com',
    answerIntro:
      'Marketing teams searching for AI SEO and Generative Engine Optimization (GEO) platforms see brands that clearly document multi-model tracking:',
    recommendedBrands: [
      {
        name: 'AiSearchOwl',
        host: 'aisearchowl.com',
        rank: '#1 Recommended (Example Target)',
        reason: 'Cited for daily prompt tracking across ChatGPT, Perplexity & AI Overviews plus ordered fix plans.',
        citedUrl: 'aisearchowl.com/platform',
      },
      {
        name: 'Ahrefs',
        host: 'ahrefs.com',
        rank: '#2 Recommended',
        reason: 'Cited for backlink authority and traditional search index data.',
        citedUrl: 'ahrefs.com/ai-search',
      },
      {
        name: 'Semrush',
        host: 'semrush.com',
        rank: '#3 Recommended',
        reason: 'Cited for keyword research suite and domain overview guides.',
        citedUrl: 'semrush.com/features',
      },
    ],
    overlookedBrand: {
      name: 'Unoptimized Competitor',
      status: 'Dropped from #2 to Unlisted',
      reasonMissing:
        'Stopped updating citation sources when models refreshed their retrieval weights last month.',
    },
    owlInsight: {
      headline: 'What winning #1 in AI answers looks like:',
      action:
        'Track your buyer prompts daily, monitor which exact URLs each model cites, and ship the #1 prioritized content fix before competitors react.',
      impactNote: 'This is the exact workflow AiSearchOwl automates for your team.',
    },
  },
]

export function InteractiveAnswerSimulator() {
  const reduce = useReducedMotion()
  const [selectedIdx, setSelectedIdx] = useState(0)
  const q = QUESTIONS[selectedIdx]

  const handleSelect = (idx: number) => {
    setSelectedIdx(idx)
    trackHomeEvent('simulator_prompt_select', { prompt_id: QUESTIONS[idx].id })
  }

  return (
    <section
      id="simulator"
      className="scroll-mt-28 px-4 py-20 sm:px-6 sm:py-28"
      aria-label="Interactive AI Answer Simulator"
    >
      <div className="mx-auto max-w-[1180px]">
        {/* Header */}
        <Reveal className="max-w-3xl">
          <SectionTag>Your buyers are asking AI · Are you in the answer?</SectionTag>
          <h2 className="mt-4 text-[clamp(36px,5.2vw,64px)] font-extrabold leading-[1.02] tracking-[-0.035em] text-[#171411]">
            Your next customer
            <br />
            <span className="text-[#F05A0A]">might never Google you.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-[#655C53]">
            They&apos;re asking AI what to buy, which tools to use, and which brands to trust. Click a buyer question
            below to see a sample AI response—who gets recommended, which sources get cited, and why brands get left out.
          </p>
        </Reveal>

        {/* Clickable Prompt Selector Pills */}
        <Reveal delay={0.08} className="mt-8">
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Sample buyer questions">
            <span className="mr-1 text-[12px] font-bold uppercase tracking-wider text-[#8C8177]">
              Select a buyer prompt:
            </span>
            {QUESTIONS.map((item, idx) => {
              const active = idx === selectedIdx
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleSelect(idx)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[13.5px] font-bold transition-all ${
                    active
                      ? 'border-[#171411] bg-[#171411] text-white shadow-[0_10px_24px_rgba(23,20,17,0.18)]'
                      : 'border-[#EADAC9] bg-white text-[#3F3831] hover:border-[#F05A0A] hover:bg-[#FFF6EE]'
                  }`}
                >
                  <MessageSquare className={`h-3.5 w-3.5 ${active ? 'text-[#F05A0A]' : 'text-[#8C8177]'}`} />
                  <span>“{item.prompt}”</span>
                </button>
              )
            })}
          </div>
        </Reveal>

        {/* Large AI-Style Prompt Window */}
        <Reveal delay={0.14} className="mt-6">
          <div className="overflow-hidden rounded-[30px] border border-[#EADAC9] bg-white shadow-[0_28px_70px_rgba(23,20,17,0.08)]">
            {/* Top window bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F2E5D8] bg-[#FFFAF5] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 text-[12px] font-bold text-[#655C53]">
                  AI Answer Simulator · <span className="text-[#F05A0A]">Sample Demonstration</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-[12px] font-semibold text-[#7A7067]">
                <Favicon host={q.engineHost} className="h-4 w-4 rounded-full" />
                <span>{q.engineName}</span>
                <span className="rounded-full bg-[#FFF0E5] px-2.5 py-0.5 text-[11px] font-bold text-[#C44708]">
                  {q.category}
                </span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={q.id}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: EASE }}
                className="p-5 sm:p-8"
              >
                {/* 1. Buyer question bubble */}
                <div className="flex items-start gap-3 rounded-2xl border border-[#F2E5D8] bg-[#FFFAF5] p-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#171411] text-[11px] font-extrabold text-white">
                    BUYER
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C8177]">
                      Buyer asks AI
                    </p>
                    <p className="mt-0.5 text-[17px] font-extrabold text-[#171411] sm:text-[19px]">
                      “{q.prompt}”
                    </p>
                  </div>
                </div>

                {/* 2. Sample AI Answer + Recommended Brands + Overlooked Brand */}
                <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  {/* Left: Recommended Brands & Cited Sources */}
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#F05A0A]" />
                      <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#F05A0A]">
                        Sample AI Response — Recommended Brands & Citations
                      </p>
                    </div>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-[#3F3831]">{q.answerIntro}</p>

                    <ul className="mt-4 space-y-2.5">
                      {q.recommendedBrands.map((b) => (
                        <li
                          key={b.name}
                          className="flex flex-col justify-between gap-2 rounded-2xl border border-emerald-200/80 bg-emerald-50/45 p-3.5 sm:flex-row sm:items-center"
                        >
                          <div className="flex items-start gap-3">
                            <Favicon host={b.host} className="mt-0.5 h-6 w-6 shrink-0 rounded-full" />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[14.5px] font-extrabold text-[#171411]">{b.name}</span>
                                <span className=" inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800">
                                  <CheckCircle2 className="h-3 w-3" /> {b.rank}
                                </span>
                              </div>
                              <p className="mt-0.5 text-[12.5px] text-[#4E463E]">{b.reason}</p>
                            </div>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-emerald-300/80 bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-800 sm:self-center">
                            <ExternalLink className="h-3 w-3" />
                            Cited: {b.citedUrl}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right: Overlooked Brand + AiSearchOwl Actionable Insight */}
                  <div className="flex flex-col justify-between gap-4">
                    {/* Overlooked Card */}
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold uppercase tracking-wider text-rose-700">
                          <XCircle className="h-4 w-4" /> Overlooked in this AI answer
                        </span>
                        <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                          Missed Opportunity
                        </span>
                      </div>
                      <p className="mt-2 text-[15px] font-extrabold text-[#171411]">{q.overlookedBrand.name}</p>
                      <p className="mt-0.5 text-[12.5px] font-bold text-rose-700">{q.overlookedBrand.status}</p>
                      <p className="mt-2 text-[13px] leading-relaxed text-[#4E463E]">
                        {q.overlookedBrand.reasonMissing}
                      </p>
                    </div>

                    {/* AiSearchOwl Insight Card */}
                    <div className="rounded-2xl border-2 border-[#F05A0A] bg-[#FFF8F2] p-4 shadow-[0_14px_34px_rgba(240,90,10,0.12)]">
                      <div className="flex items-center gap-2">
                        <OwlBadge size={26} />
                        <span className="text-[11.5px] font-extrabold uppercase tracking-wider text-[#F05A0A]">
                          AiSearchOwl Actionable Insight
                        </span>
                      </div>
                      <p className="mt-2 text-[14px] font-extrabold text-[#171411]">{q.owlInsight.headline}</p>
                      <p className="mt-1.5 flex items-start gap-2 text-[13px] leading-relaxed text-[#3F3831]">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#F05A0A]" />
                        <span>{q.owlInsight.action}</span>
                      </p>
                      <p className="mt-2.5 flex items-center gap-1.5 text-[11.5px] font-semibold text-[#7A624E]">
                        <AlertTriangle className="h-3.5 w-3.5 text-[#F05A0A]" />
                        {q.owlInsight.impactNote}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom CTA Row */}
                <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-[#F2E5D8] pt-5 sm:flex-row">
                  <p className="text-[13.5px] font-medium text-[#655C53]">
                    Want to see the real AI answers for the questions your buyers ask in your market?
                  </p>
                  <Magnetic>
                    <a
                      href="#start"
                      onClick={() => trackHomeEvent('cta_primary_click', { source: 'answer_simulator' })}
                      className="inline-flex items-center gap-2 rounded-full bg-[#F05A0A] px-6 py-3 text-[14px] font-bold text-white shadow-[0_12px_28px_rgba(240,90,10,0.3)] transition hover:bg-[#171411]"
                    >
                      Find Out What AI Says About You <ArrowRight className="h-4 w-4" />
                    </a>
                  </Magnetic>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
