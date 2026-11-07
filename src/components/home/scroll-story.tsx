'use client'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { ArrowRight, CheckCircle2, Globe, ListChecks, Radar, Sparkles } from 'lucide-react'
import { Favicon } from '@/components/shell/brand-mark'
import { OwlBadge } from './hero-owl'
import { EASE, Magnetic, Reveal, SectionTag, trackHomeEvent } from './motion-primitives'

const STEPS = [
  {
    number: 'STEP 01',
    title: 'Add your website',
    subtitle: 'Website input → Instant prompt & competitor setup',
    body: 'Enter your website domain (e.g., yourcompany.com). Tell us your brand name and 2–3 competitors—or let AiSearchOwl suggest competitors and high-intent buyer questions automatically.',
    icon: Globe,
    highlights: [
      'No code snippet or DNS change required to start',
      'Clear inline validation if your domain is incomplete',
      'Customize daily buyer prompt count for your plan',
    ],
  },
  {
    number: 'STEP 02',
    title: 'Track AI recommendations',
    subtitle: 'AI model analysis → Daily mentions, citations & rankings',
    body: 'Every day, we ask AI models the real buying questions your customers ask. We record whether your brand is recommended, which exact URLs get cited, and which competitors appear ahead of you.',
    icon: Radar,
    highlights: [
      'ChatGPT, Perplexity & Google AI Overviews included on Lite, Standard & Premium',
      'Copilot, Claude Sonnet 4, Gemini, Google AI Mode & Naver AI Briefing available as add-ons',
      'Enterprise supports all 39 tracked AI models',
    ],
  },
  {
    number: 'STEP 03',
    title: 'Discover what to improve',
    subtitle: 'Insights dashboard → Prioritized actions to win citations',
    body: 'Stop guessing what content to update. We show you why competitors won specific answers—like an ungated pricing table or missing comparison FAQ—so your team can ship high-impact improvements.',
    icon: ListChecks,
    highlights: [
      'See exact competitor URLs cited by each AI model',
      'Prioritized content & structural opportunities',
      'Daily re-checks track visibility changes over time',
    ],
  },
] as const

export function ScrollStory() {
  const reduce = useReducedMotion()
  const [activeStep, setActiveStep] = useState(0)

  return (
    <section
      id="how"
      className="scroll-mt-28 px-4 py-20 sm:px-6 sm:py-28"
      aria-label="How AiSearchOwl Works in Three Steps"
    >
      <div className="mx-auto max-w-[1180px]">
        <Reveal className="max-w-3xl">
          <SectionTag>How AiSearchOwl works</SectionTag>
          <h2 className="mt-4 text-[clamp(36px,5.2vw,62px)] font-extrabold leading-[1.02] tracking-[-0.035em] text-[#171411]">
            From your domain to an{' '}
            <span className="text-[#F05A0A]">actionable visibility plan.</span>
          </h2>
          <p className="mt-4 text-[16.5px] leading-relaxed text-[#655C53]">
            Three clear steps. Click or hover any step below to see how your website transforms into daily AI model
            analysis and prioritized improvements.
          </p>
        </Reveal>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          {/* Left: Three Editorial Steps */}
          <div className="space-y-4" role="tablist" aria-label="Three steps to use AiSearchOwl">
            {STEPS.map((s, idx) => {
              const isAct = idx === activeStep
              return (
                <Reveal key={s.number} delay={idx * 0.08}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isAct}
                    onClick={() => setActiveStep(idx)}
                    onMouseEnter={() => setActiveStep(idx)}
                    className={`w-full rounded-[26px] border p-6 text-left transition-all ${
                      isAct
                        ? 'border-[#F05A0A] bg-white shadow-[0_22px_50px_rgba(240,90,10,0.12)] ring-1 ring-[#F05A0A]/25'
                        : 'border-[#EADAC9] bg-[#FFFAF5] hover:border-[#F05A0A]/50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11.5px] font-extrabold tracking-[0.16em] ${
                          isAct ? 'bg-[#F05A0A] text-white' : 'bg-[#FFF0E5] text-[#C44708]'
                        }`}
                      >
                        {s.number}
                      </span>
                      <span className="text-[12px] font-semibold text-[#8C8177]">{s.subtitle}</span>
                    </div>

                    <h3 className="mt-3.5 text-[24px] font-extrabold tracking-tight text-[#171411] sm:text-[27px]">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-[#5C534A]">{s.body}</p>

                    <ul className="mt-4 space-y-1.5 border-t border-[#F2E5D8] pt-3.5 text-[13px] font-semibold text-[#3F3831]">
                      {s.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#F05A0A]" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                </Reveal>
              )
            })}
          </div>

          {/* Right: Sticky Connected Transforming Visual */}
          <div className="lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-[30px] border-2 border-[#171411] bg-[#171411] p-6 text-white shadow-[0_30px_70px_rgba(23,20,17,0.22)] sm:p-8">
              {/* Step Progress Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <OwlBadge size={28} />
                  <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#FF9A57]">
                    {STEPS[activeStep].number} · Live Workflow Preview
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {STEPS.map((st, i) => (
                    <button
                      key={st.number}
                      type="button"
                      onClick={() => setActiveStep(i)}
                      aria-label={`Show ${st.title}`}
                      className={`h-2 rounded-full transition-all ${
                        i === activeStep ? 'w-8 bg-[#F05A0A]' : 'w-2 bg-white/25 hover:bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Animated Visual State */}
              <AnimatePresence mode="wait">
                {activeStep === 0 && (
                  <motion.div
                    key="visual-step-1"
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: EASE }}
                    className="mt-6 space-y-4"
                  >
                    <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#FF9A57]">
                        1. Website Input & Brand Setup
                      </p>
                      <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-[#F05A0A] bg-[#1F1A16] px-3.5 py-3">
                        <Globe className="h-4 w-4 text-[#F05A0A]" />
                        <span className="font-mono text-[14px] font-bold text-white">yourwebsite.com</span>
                        <span className="ml-auto rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                          Domain Verified
                        </span>
                      </div>
                      <p className="mt-2 text-[12px] text-white/60">
                        Clear helper: If you omit a top-level domain like .com or .io, the input tells you immediately what to add.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-white/65">
                        Auto-Suggested Buyer Prompts (Sample)
                      </p>
                      <ul className="mt-2.5 space-y-2 text-[12.5px]">
                        {[
                          '“Best workflow software for growing startups?”',
                          '“Top alternatives to Notion for product teams?”',
                          '“Which SaaS reporting tool has transparent pricing?”',
                        ].map((pr) => (
                          <li key={pr} className="flex items-center justify-between rounded-xl bg-white/[0.06] px-3 py-2">
                            <span className="text-white/90">{pr}</span>
                            <span className="text-[11px] font-bold text-[#FF9A57]">Tracked Daily</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}

                {activeStep === 1 && (
                  <motion.div
                    key="visual-step-2"
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: EASE }}
                    className="mt-6 space-y-4"
                  >
                    <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#FF9A57]">
                          2. Daily Multi-Model Recommendation Scan
                        </p>
                        <span className="text-[11px] text-white/55">Sample Daily Run</span>
                      </div>

                      <div className="mt-3 space-y-2.5">
                        {[
                          { name: 'Perplexity', host: 'perplexity.ai', status: 'Cited #1 · 42 source links', color: 'text-emerald-300', bar: 84 },
                          { name: 'ChatGPT', host: 'openai.com', status: 'Recommended #2 · Guide cited', color: 'text-emerald-300', bar: 72 },
                          { name: 'Google AI Overviews', host: 'google.com', status: 'Skipped · Notion picked #1', color: 'text-rose-300', bar: 31 },
                          { name: 'Gemini (Add-on)', host: 'gemini.google.com', status: 'Competitor Jasper recommended', color: 'text-rose-300', bar: 28 },
                        ].map((m) => (
                          <div key={m.name} className="rounded-xl bg-white/[0.06] p-3">
                            <div className="flex items-center gap-2 text-[12.5px]">
                              <Favicon host={m.host} className="h-4 w-4 rounded-full" />
                              <span className="font-extrabold text-white">{m.name}</span>
                              <span className={`ml-auto text-[11.5px] font-bold ${m.color}`}>{m.status}</span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                              <motion.div
                                className="h-full rounded-full bg-[#F05A0A]"
                                initial={{ width: 0 }}
                                animate={{ width: `${m.bar}%` }}
                                transition={{ duration: 0.4 }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeStep === 2 && (
                  <motion.div
                    key="visual-step-3"
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: EASE }}
                    className="mt-6 space-y-4"
                  >
                    <div className="rounded-2xl border border-[#F05A0A]/50 bg-[#F05A0A]/12 p-4">
                      <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#FF9A57]">
                        <Sparkles className="h-3.5 w-3.5 text-[#F05A0A]" /> 3. Prioritized Improvement Checklist
                      </p>
                      <p className="mt-1 text-[13.5px] font-bold text-white">
                        Turn citation gaps into clear content & structural actions:
                      </p>

                      <ol className="mt-3 space-y-2 text-[12.5px]">
                        {[
                          {
                            priority: 'Priority #1',
                            task: 'Publish “Remote Teams Comparison” table with current pricing',
                            why: 'Fixes Google AI Overviews & ChatGPT #1 gap vs Notion',
                          },
                          {
                            priority: 'Priority #2',
                            task: 'Remove sign-up gate from /pricing overview page',
                            why: 'Allows Claude & Perplexity crawlers to link your URL directly',
                          },
                          {
                            priority: 'Priority #3',
                            task: 'Add buyer FAQ headings to “For Marketing Teams” page',
                            why: 'Addresses Gemini competitor gap against Jasper',
                          },
                        ].map((item) => (
                          <li key={item.priority} className="rounded-xl bg-[#171411]/90 p-3">
                            <span className="rounded-full bg-[#F05A0A] px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                              {item.priority}
                            </span>
                            <p className="mt-1.5 font-extrabold text-white">{item.task}</p>
                            <p className="mt-0.5 text-[11.5px] text-white/65">{item.why}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom CTA inside sticky visual */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
                <span className="text-[12.5px] text-white/65">
                  Start with your domain — takes under 60 seconds.
                </span>
                <Magnetic>
                  <a
                    href="#start"
                    onClick={() => trackHomeEvent('cta_primary_click', { source: `how_it_works_step_${activeStep + 1}` })}
                    className="inline-flex items-center gap-2 rounded-full bg-[#F05A0A] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-white hover:text-[#171411]"
                  >
                    Start Tracking for Free <ArrowRight className="h-4 w-4" />
                  </a>
                </Magnetic>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
