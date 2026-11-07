'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence, useReducedMotion, useScroll, useSpring } from 'motion/react'
import { ArrowDown, ArrowRight, Check, ChevronDown, Menu as MenuIcon, Play, Search, X } from 'lucide-react'
import { Link, useRouter } from '@/i18n/routing'
import { PLAN_MAX, type PlanId, savePlanChoice } from '@/lib/plan-choice'
import { Favicon } from '@/components/shell/brand-mark'
import { OwlBadge } from '@/components/home/hero-owl'
import { PreviewBoard } from '@/components/home/preview-board'
import { Magnetic, Reveal, SectionTag, SplitWords, EASE } from '@/components/home/motion-primitives'
import { HeroStage } from '@/components/home/hero-stage'
import { FeatureShowcase } from '@/components/home/feature-showcase'
import { ScrollStory } from '@/components/home/scroll-story'
import { Playground, WorkShowcase } from '@/components/home/playground-work'

const ENGINES = [
  { id: 'chatgpt', name: 'ChatGPT', host: 'openai.com', tier: 'lite' },
  { id: 'perplexity', name: 'Perplexity', host: 'perplexity.ai', tier: 'lite' },
  { id: 'overviews', name: 'Google AI Overviews', host: 'google.com', tier: 'lite' },
  { id: 'copilot', name: 'Copilot', host: 'copilot.microsoft.com', tier: 'addon', icon: '/icons/copilot.svg' },
  { id: 'gemini', name: 'Gemini', host: 'gemini.google.com', tier: 'addon' },
  { id: 'claude', name: 'Claude Sonnet 4', host: 'claude.ai', tier: 'addon' },
  { id: 'aimode', name: 'Google AI Mode', host: 'google.com', tier: 'addon' },
  { id: 'naver', name: 'Naver AI Briefing', host: 'naver.com', tier: 'addon' },
  { id: 'gpt4o', name: 'GPT-4o', host: 'openai.com', tier: 'enterprise' },
  { id: 'opus', name: 'Claude Opus 5', host: 'claude.ai', tier: 'enterprise' },
  { id: 'grok', name: 'Grok', host: 'grok.com', tier: 'enterprise' },
  { id: 'deepseek', name: 'DeepSeek V4 Pro', host: 'deepseek.com', tier: 'enterprise' },
] as const
const INCLUDED_ENGINES = ENGINES.filter((e) => e.tier === 'lite')
const ADDON_ENGINES = ENGINES.filter((e) => e.tier === 'addon')
function EngineIcon({ engine, className }: { engine: (typeof ENGINES)[number]; className: string }) { return <Favicon host={engine.host} src={'icon' in engine ? engine.icon : undefined} className={className} /> }
const SHOWN = [{ name: 'ChatGPT', host: 'openai.com' }, { name: 'Perplexity', host: 'perplexity.ai' }, { name: 'Gemini', host: 'gemini.google.com' }, { name: 'AI Overviews', host: 'google.com' }] as const
const ORANGE = '#E85D0C'; const LINE = '#F1DFD0'
const NAV = [['navFeaturesLink', '#features'], ['navPlatform', '#platform'], ['navHowLink', '#how'], ['navPricing', '#pricing']] as const
const MARQUEE = ['ChatGPT', 'Perplexity', 'Gemini', 'AI Overviews', 'Claude', 'Copilot', 'Grok', 'DeepSeek', 'Naver AI Briefing', 'Google AI Mode']

export function HomeScreen() {
  const t = useTranslations('home'); const router = useRouter(); const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll(); const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 })
  const [domain, setDomain] = useState(''); const [error, setError] = useState(''); const [checking, setChecking] = useState(false); const [checkedDomain, setCheckedDomain] = useState('')
  const [yearly, setYearly] = useState(true); const [menuOpen, setMenuOpen] = useState(false); const [faqOpen, setFaqOpen] = useState(0)
  const [counts, setCounts] = useState<Record<PlanId, string>>({ lite: '15', standard: '100', premium: '400', enterprise: '1000' })
  const [countErrors, setCountErrors] = useState<Partial<Record<PlanId, string>>>({})
  const cleanDomain = useMemo(() => domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, ''), [domain])
  const runCheck = () => {
    if (!cleanDomain) { setError(t('errorEmpty')); setCheckedDomain(''); return }
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(cleanDomain)) { setError(t('errorInvalid')); setCheckedDomain(''); return }
    setError(''); setChecking(true); setCheckedDomain(''); window.setTimeout(() => { setChecking(false); setCheckedDomain(cleanDomain) }, 900)
  }
  const lines = (keys: string[]) => keys.map((k) => t(k))
  const plans: Array<{ key: PlanId; name: string; body: string; monthly: number; yearly: number; popular: boolean; custom: boolean; cta: string; engines: typeof INCLUDED_ENGINES; addons: typeof ADDON_ENGINES; modelsLabel: string; features: string[]; promptMax: number }> = [
    { key: 'lite', name: t('starterName'), body: t('starterBody'), monthly: 22, yearly: 19, popular: false, custom: false, cta: t('planCta'), engines: INCLUDED_ENGINES, addons: ADDON_ENGINES, modelsLabel: t('liteModels'), promptMax: PLAN_MAX.lite, features: lines(['starterF1', 'starterF4', 'starterF5', 'starterF6', 'starterF7', 'starterF8', 'starterF9']) },
    { key: 'standard', name: t('growthName'), body: t('growthBody'), monthly: 189, yearly: 160, popular: true, custom: false, cta: t('planCta'), engines: INCLUDED_ENGINES, addons: ADDON_ENGINES, modelsLabel: t('paidModels'), promptMax: PLAN_MAX.standard, features: lines(['growthF1', 'growthF4', 'growthF5', 'growthF6', 'growthF7', 'growthF8', 'growthF9', 'growthF10', 'growthF11', 'growthF12', 'growthF13']) },
    { key: 'premium', name: t('scaleName'), body: t('scaleBody'), monthly: 489, yearly: 422, popular: false, custom: false, cta: t('planCta'), engines: INCLUDED_ENGINES, addons: ADDON_ENGINES, modelsLabel: t('paidModels'), promptMax: PLAN_MAX.premium, features: lines(['scaleF1', 'scaleF4', 'scaleF5', 'scaleF6', 'scaleF7', 'scaleF8', 'scaleF9', 'scaleF10', 'scaleF11', 'scaleF12', 'scaleF13']) },
    { key: 'enterprise', name: t('enterpriseName'), body: t('enterpriseBody'), monthly: 0, yearly: 0, popular: false, custom: true, cta: t('enterpriseCta'), engines: [], addons: [], modelsLabel: t('enterpriseModels'), promptMax: PLAN_MAX.enterprise, features: lines(['enterpriseF1', 'enterpriseF2', 'enterpriseF3', 'enterpriseF4', 'enterpriseF5', 'enterpriseF6', 'enterpriseF7', 'enterpriseF8', 'enterpriseF9']) },
  ]
  const startTrial = (plan: PlanId, max: number) => {
    const raw = (counts[plan] ?? '').trim(); const parsed = Number(raw)
    if (!/^\d+$/.test(raw) || parsed < 1 || parsed > max) { setCountErrors((c) => ({ ...c, [plan]: t('promptRunError', { max: String(max) }) })); document.getElementById(`prompts-${plan}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }
    savePlanChoice({ plan, prompts: parsed }); router.push(`/sign-up?plan=${plan}&prompts=${parsed}`)
  }

  return (
    <div className="min-h-screen bg-[#FFFBF6] text-[#171310] selection:bg-[#FFE1CC]">
      <motion.div aria-hidden style={{ scaleX: progress }} className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-[#E85D0C] via-[#FF8A3A] to-[#FFB067]" />
      {/* Floating nav */}
      <motion.header initial={reduce ? false : { y: -70, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: EASE }} className="fixed inset-x-0 top-3 z-50 px-3 sm:top-4 sm:px-6">
        <div className="mx-auto flex h-[60px] max-w-[1180px] items-center gap-3 rounded-full border border-[#F1DFD0]/80 bg-[#FFFBF6]/85 py-2 pl-4 pr-2 shadow-[0_16px_40px_rgba(28,20,10,0.08)] backdrop-blur-xl">
          <Link href="/" className="inline-flex items-center gap-2 text-[16px] font-extrabold tracking-tight"><OwlBadge size={32} />AiSearchOwl</Link>
          <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map(([key, href]) => <a key={href} href={href} className="group relative rounded-full px-3.5 py-2 text-[14px] font-medium text-[#5C544C] transition hover:text-[#171310]">{t(key)}<span className="absolute inset-x-3.5 -bottom-px h-[2px] origin-left scale-x-0 rounded-full bg-[#E85D0C] transition-transform duration-300 group-hover:scale-x-100" /></a>)}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <Link href="/sign-in" className="hidden rounded-full px-3.5 py-2 text-[14px] font-semibold hover:bg-[#FFF1E6] sm:block">{t('navSignIn')}</Link>
            <Magnetic><a href="#start" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#171310] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#E85D0C]">{t('navTrial')} <ArrowRight className="h-4 w-4" /></a></Magnetic>
            <button type="button" onClick={() => setMenuOpen(v => !v)} aria-expanded={menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#FFF1E6] lg:hidden">{menuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}</button>
          </div>
        </div>
        <AnimatePresence>{menuOpen && <motion.nav aria-label="Mobile" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto mt-2 max-w-[1180px] rounded-[22px] border border-[#F1DFD0] bg-white p-2 shadow-xl lg:hidden"><ul className="text-[15px] font-medium">{NAV.map(([key, href]) => <li key={href}><a href={href} onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-3 hover:bg-[#FFF6EC]">{t(key)}</a></li>)}<li><Link href="/sign-in" className="block rounded-xl px-3 py-3 hover:bg-[#FFF6EC]">{t('navSignIn')}</Link></li></ul></motion.nav>}</AnimatePresence>
      </motion.header>

      {/* HERO */}
      <section className="relative overflow-hidden px-4 pb-10 pt-[118px] sm:px-6 sm:pt-[136px]">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_75%_8%,rgba(255,150,70,0.20),transparent_60%),radial-gradient(600px_300px_at_8%_30%,rgba(232,93,12,0.08),transparent_60%)]" />
        <div aria-hidden className="noise pointer-events-none absolute inset-0 opacity-[0.35]" />
        <div className="relative mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
          <div>
            <motion.p initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7, ease: EASE }}><SectionTag>AI search visibility — tracked daily</SectionTag></motion.p>
            <h1 className="mt-5 text-[clamp(44px,6.2vw,76px)] font-extrabold leading-[0.98] tracking-[-0.04em]">
              <SplitWords text={t('heroHeadlineA')} delay={0.15} /><br /><span className="text-[#E85D0C]"><SplitWords text={t('heroHeadlineB')} delay={0.4} /></span>
            </h1>
            <motion.p initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.8, ease: EASE }} className="mt-6 max-w-xl text-[17px] leading-8 text-[#6F675E]">Every day we ask ChatGPT, Perplexity, Gemini and more the questions your buyers ask. We show which models mention your website, which cite it, who they recommend instead — then tell you exactly what to fix to rank better.</motion.p>
            <motion.div initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8, ease: EASE }} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Magnetic><a href="#start" className="group inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-[#E85D0C] px-6 text-[15px] font-bold text-white shadow-[0_16px_32px_rgba(232,93,12,0.35)] transition-colors hover:bg-[#171310]">{t('ctaTrack')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></a></Magnetic>
              <Magnetic><a href="#platform" className="inline-flex h-[52px] items-center justify-center gap-2.5 rounded-full border border-[#E9D8C6] bg-white px-6 text-[15px] font-bold shadow-sm transition hover:border-[#FFB27A] hover:bg-[#FFF8F1]"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#E85D0C] text-white"><Play className="ml-0.5 h-3 w-3 fill-current" /></span>{t('ctaExplore')}</a></Magnetic>
            </motion.div>
            <motion.ul initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-8 flex flex-wrap gap-2" aria-label="AI engines we check">
              {SHOWN.map((e, i) => <motion.li key={e.name} initial={reduce ? false : { opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1 + i * 0.08, type: 'spring', stiffness: 300, damping: 20 }} whileHover={{ y: -3 }} className="inline-flex items-center gap-2 rounded-full border border-[#F1DFD0] bg-white py-1.5 pl-1.5 pr-3 text-[13px] font-semibold shadow-sm"><Favicon host={e.host} className="h-5 w-5 rounded-full" />{e.name}</motion.li>)}
            </motion.ul>
            <p className="mt-4 text-[13px] leading-5 text-[#9A9186]">On the right: every AI model, pointing at your website — or at a competitor. <strong className="text-[#7C4A21]">Click a model</strong> to see what it said about you and the first fix to make.</p>
          </div>
          <motion.div initial={reduce ? false : { opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.35, duration: 1, ease: EASE }}><HeroStage /></motion.div>
        </div>
        <motion.a href="#platform" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="group relative mx-auto mt-12 flex w-fit flex-col items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#9A9186] hover:text-[#E85D0C]">Scroll to see your dashboard<motion.span animate={reduce ? undefined : { y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} className="grid h-9 w-9 place-items-center rounded-full border border-[#EFD9C4] bg-white group-hover:border-[#E85D0C]"><ArrowDown className="h-4 w-4" /></motion.span></motion.a>
      </section>

      {/* Marquee */}
      <div className="marquee overflow-hidden border-y border-[#2A2118] bg-[#171310] py-3.5" aria-label="AI engines we track">
        <div className="marquee-track flex w-max items-center gap-10 pr-10">{[...MARQUEE, ...MARQUEE].map((m, i) => <span key={i} className="flex items-center gap-10 whitespace-nowrap text-[13px] font-bold uppercase tracking-[0.18em] text-white/70">{m}<span className="h-1.5 w-1.5 rounded-full bg-[#E85D0C]" /></span>)}</div>
      </div>

      {/* Preview */}
      <section id="platform" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><SectionTag>Your dashboard, sample data</SectionTag><h2 className="mt-3 text-[32px] font-extrabold tracking-[-0.03em] sm:text-[42px]">This is what <span className="text-[#E85D0C]">winning</span> looks like.</h2></div><p className="max-w-sm text-[14px] leading-6 text-[#8A8178]">{t('sampleNote')} Your real numbers appear after your first check runs — usually the same day you start.</p></Reveal>
          <Reveal delay={0.1}><motion.div whileHover={reduce ? undefined : { y: -4 }} transition={{ type: 'spring', stiffness: 200, damping: 22 }}><PreviewBoard /></motion.div></Reveal>
        </div>
      </section>

      <FeatureShowcase />
      <ScrollStory />

      {/* Insight */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal><SectionTag>From answer to action</SectionTag><h2 className="mt-4 text-[36px] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-[48px]">{t('insightTitleA')} <span className="text-[#E85D0C]">{t('insightTitleB')}</span></h2><p className="mt-4 text-[16px] leading-7 text-[#6F6A66]">{t('insightBody')}</p>
            <ul className="mt-7 space-y-4">{[['check1Title', 'check1Body'], ['check2Title', 'check2Body'], ['check3Title', 'check3Body']].map(([title, body], i) => <motion.li key={title} initial={reduce ? false : { opacity: 0, x: -18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6, ease: EASE }} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#E85D0C] text-white"><Check className="h-4 w-4" /></span><div><p className="font-bold">{t(title)}</p><p className="mt-0.5 text-[14px] leading-6 text-[#6F6A66]">{t(body)}</p></div></motion.li>)}</ul></Reveal>
          <Reveal delay={0.12}>
            <article className="rounded-[28px] border border-[#F1DFD0] bg-white p-6 shadow-[0_24px_55px_rgba(232,93,12,0.10)]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#9A9186]">{t('promptLabel')}</p><p className="mt-2 text-[18px] font-bold">“{t('insightPrompt')}”</p>
              <div className="mt-4 rounded-2xl bg-[#FFF8F1] p-4"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#E85D0C]">{t('insightAnswerLabel')}</p><p className="answer-line mt-2 text-[14.5px] leading-6 text-[#3F382F]">{t('insightAnswer')}</p></div>
              <p className="mt-5 text-[12px] font-bold uppercase tracking-[0.14em] text-[#9A9186]">{t('insightSources')}</p>
              <ul className="mt-2.5 space-y-2 text-[14px] font-medium"><li className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-emerald-900"><Check className="h-4 w-4 text-emerald-600" /><Favicon host="aisearchowl.com" className="h-4 w-4 rounded-full" /> aisearchowl.com — your page was cited</li><li className="flex items-center gap-2 rounded-xl bg-[#FFF8F1] px-3 py-2"><Favicon host="notion.so" className="h-4 w-4 rounded-full" /> notion.so — competitor cited here too</li></ul>
              <p className="mt-4 rounded-xl border border-dashed border-[#FFC79A] bg-[#FFF6EC] px-3.5 py-2.5 text-[13px] leading-5 text-[#7C4A21]"><strong>What to do next:</strong> keep the cited page updated weekly. If the citation disappears, we tell you the same day.</p>
            </article>
          </Reveal>
        </div>
      </section>

      <Playground />
      <WorkShowcase />

      {/* How */}
      <section id="how" className="scroll-mt-28 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="text-center"><SectionTag>How it works</SectionTag><h2 className="mt-4 text-[36px] font-extrabold tracking-[-0.035em] sm:text-[48px]">{t('growTitle')}</h2><p className="mx-auto mt-3 max-w-xl text-[15px] leading-7 text-[#6F6A66]">{t('growBody')} Three steps. If you get stuck, each step tells you what is missing.</p></Reveal>
          <ol className="relative mt-12 grid gap-8 md:grid-cols-3">{[['01', 'grow1Title', 'grow1Body'], ['02', 'grow2Title', 'grow2Body'], ['03', 'grow3Title', 'grow3Body']].map(([n, title, body], i) => <Reveal key={n} delay={i * 0.12}><li className="group relative text-center"><motion.span whileHover={reduce ? undefined : { scale: 1.12, rotate: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }} className="relative z-10 mx-auto grid h-14 w-14 place-items-center rounded-[20px] bg-[#171310] text-[16px] font-extrabold text-white shadow-[0_14px_28px_rgba(18,12,6,0.25)] group-hover:bg-[#E85D0C]">{n}</motion.span><h3 className="mt-5 text-[19px] font-bold">{t(title)}</h3><p className="mx-auto mt-2 max-w-xs text-[14.5px] leading-6 text-[#6F6A66]">{t(body)}</p></li></Reveal>)}</ol>
        </div>
      </section>

      {/* Start / domain check */}
      <section id="start" className="scroll-mt-28 px-4 py-8 sm:px-6">
        <Reveal><div className="relative mx-auto max-w-3xl overflow-hidden rounded-[32px] border border-[#2A2118] bg-[#171310] p-6 text-white shadow-[0_30px_70px_rgba(18,12,6,0.30)] sm:p-9">
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#E85D0C]/25 blur-3xl" />
          <div className="relative"><SectionTag dark>Step 1 of 3 — your website</SectionTag><h2 className="mt-3 text-[30px] font-extrabold tracking-tight sm:text-[36px]">{t('startTitle')}</h2><p className="mt-2.5 max-w-xl text-[15px] leading-7 text-white/65">{t('startBody')}</p>
            <form className="mt-6" onSubmit={(e) => { e.preventDefault(); runCheck() }} noValidate>
              <label htmlFor="owl-domain" className="text-[13px] font-bold text-white/85">{t('domainLabel')} <span className="font-medium text-[#FF9A57]">(required)</span></label>
              <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" /><input id="owl-domain" value={domain} onChange={(e) => { setDomain(e.target.value); if (error) setError('') }} placeholder={t('domainPlaceholder')} inputMode="url" autoComplete="url" aria-invalid={Boolean(error)} aria-describedby="owl-domain-help owl-domain-error" className="h-[52px] w-full rounded-full border border-white/15 bg-white/[0.07] pl-11 pr-3 text-[15px] text-white outline-none placeholder:text-white/35 focus:border-[#FF9A57] focus:ring-2 focus:ring-[#E85D0C]/40" /></div>
                <Magnetic><button type="submit" disabled={checking} className="inline-flex h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#E85D0C] px-6 text-[15px] font-bold text-white transition hover:bg-[#FF7A29] disabled:opacity-60 sm:w-auto">{checking ? t('checkingButton') : t('checkButton')} {!checking && <ArrowRight className="h-4 w-4" />}</button></Magnetic>
              </div>
              <p id="owl-domain-help" className="mt-3 text-[13px] leading-5 text-white/45">{t('domainHelp')}</p>
              <AnimatePresence>{error ? <motion.p key="err" id="owl-domain-error" role="alert" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 flex items-start gap-2 rounded-2xl border border-rose-300/30 bg-rose-500/15 px-4 py-3 text-[14px] leading-6 text-rose-100"><X className="mt-1 h-4 w-4 shrink-0" />{error}</motion.p> : null}
              {checkedDomain ? <motion.div key="ok" role="status" initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }} className="mt-3 rounded-2xl border border-emerald-300/30 bg-emerald-500/12 px-4 py-4"><p className="flex items-start gap-2 text-[15px] font-bold text-emerald-100"><Check className="mt-0.5 h-4 w-4 shrink-0" />{t('successTitle', { domain: checkedDomain })}</p><p className="mt-1.5 text-[14px] leading-6 text-emerald-100/75">{t('successBody', { domain: checkedDomain })}</p><a href="#pricing" className="mt-3.5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[14px] font-bold text-[#9A3412] hover:bg-[#FFE8D6]">Next step: {t('successCta')} <ArrowRight className="h-4 w-4" /></a><p className="mt-2.5 text-[13px] leading-5 text-emerald-100/60">{t('successNote')}</p></motion.div> : null}</AnimatePresence>
              <p className="mt-3.5 text-[13px] text-white/40">{t('noCard')}</p>
            </form>
            <ul className="mt-6 grid gap-2.5 border-t border-white/10 pt-5 text-[14px] leading-6 text-white/70 sm:grid-cols-3">{[t('need1'), t('need2'), t('need3')].map((item) => <li key={item} className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-[#FF9A57]" />{item}</li>)}</ul>
          </div></div></Reveal>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-28 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="text-center"><SectionTag>{t('pricingEyebrow')} — step 2 of 3</SectionTag><h2 className="mx-auto mt-4 max-w-2xl text-[36px] font-extrabold tracking-[-0.035em] sm:text-[48px]">{t('pricingTitle')}</h2><p className="mx-auto mt-3 max-w-2xl text-[15px] leading-7 text-[#6F6A66]">{t('pricingBody')}</p></Reveal>
          <div className="mt-8 flex justify-center"><div role="group" aria-label="Billing period" className="relative inline-flex rounded-full border border-[#F1DFD0] bg-white p-1 shadow-sm">
            {([false, true] as const).map((y) => <button key={String(y)} type="button" onClick={() => setYearly(y)} aria-pressed={yearly === y} className={`relative rounded-full px-4 py-2 text-[14px] font-semibold transition ${yearly === y ? 'text-white' : 'text-[#6F6A66] hover:text-[#171310]'}`}>{yearly === y && <motion.span layoutId="billing-pill" className="absolute inset-0 rounded-full bg-[#E85D0C]" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}<span className="relative">{y ? <>{t('billingYearly')} <span className={yearly ? 'text-white/85' : 'text-[#E85D0C]'}>({t('billingSave')})</span></> : t('billingMonthly')}</span></button>)}
          </div></div>
          <div className="mt-10 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan, pi) => <Reveal key={plan.key} delay={pi * 0.07} className="h-full">
              <motion.article layout whileHover={reduce ? undefined : { y: -6 }} transition={{ type: 'spring', stiffness: 220, damping: 22 }} className={`relative flex h-full flex-col rounded-[26px] border bg-white p-6 ${plan.popular ? 'shadow-[0_28px_55px_rgba(232,93,12,0.18)]' : 'shadow-[0_10px_30px_rgba(28,20,10,0.04)]'}`} style={{ borderColor: plan.popular ? ORANGE : LINE }}>
                {plan.popular ? <p className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#171310] px-3 py-1 text-[12px] font-bold text-white">{t('popular')}</p> : null}
                <h3 className="text-[22px] font-extrabold tracking-tight">{plan.name}</h3><p className="mt-1.5 min-h-[48px] text-[14px] leading-6 text-[#6F6A66]">{plan.body}</p>
                {plan.custom ? <p className="mt-5 text-[40px] font-extrabold leading-none">{t('customPrice')}</p> : <p className="mt-5"><AnimatePresence mode="wait"><motion.span key={yearly ? 'y' : 'm'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="inline-block text-[42px] font-extrabold leading-none tracking-tight">${yearly ? plan.yearly : plan.monthly}</motion.span></AnimatePresence><span className="ml-1.5 text-[14px] text-[#9A9186]">USD / {t('perMonth')}</span></p>}
                <p className="mt-1.5 text-[13px] text-[#9A9186]">{plan.custom ? t('customPriceNote') : yearly ? t('billedYearly') : t('billedMonthly')}</p>
                <div className="mt-5"><p className="text-[13px] font-semibold">{plan.modelsLabel}</p>
                  {plan.engines.length > 0 ? <div className="mt-2 flex flex-wrap gap-1.5" role="list">{plan.engines.map((en) => <span key={en.id} role="listitem" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#F1DFD0] bg-[#FFF8F1] py-1 pl-1 pr-2.5 text-[12px] font-semibold"><EngineIcon engine={en} className="h-5 w-5 rounded-full" />{en.name.replace('Google ', '')}</span>)}</div> : <p className="mt-2 text-[13px] leading-5 text-[#9A9186]">{t('enterpriseChoose')}</p>}
                  {plan.addons.length > 0 ? <><p className="mt-3 text-[13px] font-semibold">{t('addonModels')}</p><div className="mt-2 flex flex-wrap gap-1.5" role="list">{plan.addons.map((en) => <span key={en.id} role="listitem" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#F1DFD0] py-1 pl-1 pr-2.5 text-[12px] font-medium text-[#9A9186]"><EngineIcon engine={en} className="h-5 w-5 rounded-full" />{en.name.replace('Google ', '')}</span>)}</div></> : null}
                </div>
                <div className="mt-5"><label htmlFor={`count-${plan.key}`} className="block text-[13px] font-semibold">{t('promptRunLabel')}</label>
                  <input id={`prompts-${plan.key}`} type="number" inputMode="numeric" min={1} max={plan.promptMax} value={counts[plan.key]} aria-invalid={Boolean(countErrors[plan.key])} aria-describedby={`prompts-help-${plan.key}`} onChange={(e) => { const v = e.target.value; setCounts((c) => ({ ...c, [plan.key]: v })); const p = Number(v); const valid = /^\d+$/.test(v) && p >= 1 && p <= plan.promptMax; setCountErrors((c) => ({ ...c, [plan.key]: valid ? '' : t('promptRunError', { max: String(plan.promptMax) }) })) }} className="mt-1.5 w-full rounded-xl border bg-[#FFFBF6] px-3 py-2.5 text-[15px] font-semibold outline-none focus:ring-2 focus:ring-[#E85D0C]/30" style={{ borderColor: countErrors[plan.key] ? '#B42318' : LINE }} />
                  <p id={`prompts-help-${plan.key}`} className={`mt-1.5 text-[12px] leading-5 ${countErrors[plan.key] ? 'font-semibold text-[#B42318]' : 'text-[#9A9186]'}`}>{countErrors[plan.key] || t('promptRunHelp', { max: String(plan.promptMax) })}</p></div>
                <Magnetic className="mt-5 block"><button type="button" onClick={() => startTrial(plan.key, plan.promptMax)} className={`flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-bold transition ${plan.popular ? 'bg-[#E85D0C] text-white shadow-[0_14px_28px_rgba(232,93,12,0.32)] hover:bg-[#171310]' : 'border border-[#FFC79A] text-[#C44708] hover:bg-[#FFF6EC]'}`}>{plan.cta} <ArrowRight className="h-4 w-4" /></button></Magnetic>
                <p className="mt-2 text-center text-[12px] text-[#9A9186]">Step 3 is sign-up. We save this number for you.</p>
                <ul className="mt-6 flex-1 space-y-2.5 border-t border-[#F6E9DC] pt-6 text-[14px] leading-6">{plan.features.map((f) => <li key={f} className="flex gap-2.5"><Check className="mt-1 h-4 w-4 shrink-0 text-[#E85D0C]" />{f}</li>)}</ul>
              </motion.article></Reveal>)}
          </div>
          <p className="mx-auto mt-7 max-w-3xl text-center text-[13px] leading-6 text-[#9A9186]">{t('pricingNote')}</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-28 px-4 py-10 sm:px-6"><div className="mx-auto max-w-3xl">
        <Reveal className="text-center"><h2 className="text-[32px] font-extrabold tracking-tight sm:text-[40px]">{t('faqTitle')}</h2><p className="mt-2 text-[14px] text-[#8A8178]">Tap a question to open its answer.</p></Reveal>
        <div className="mt-8 space-y-3">{[[t('q1'), t('a1')], [t('q2'), t('a2')], [t('q3'), t('a3')], [t('q4'), t('a4')]].map(([q, a], i) => <div key={q} className="overflow-hidden rounded-[20px] border border-[#F1DFD0] bg-white"><button type="button" onClick={() => setFaqOpen(faqOpen === i ? -1 : i)} aria-expanded={faqOpen === i} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-[16px] font-bold hover:bg-[#FFFBF6]">{q}<motion.span animate={{ rotate: faqOpen === i ? 180 : 0 }}><ChevronDown className="h-5 w-5 text-[#E85D0C]" /></motion.span></button><AnimatePresence initial={false}>{faqOpen === i && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden"><p className="px-5 pb-5 text-[14.5px] leading-6 text-[#6F6A66]">{a}</p></motion.div>}</AnimatePresence></div>)}</div>
      </div></section>

      {/* Final CTA */}
      <section className="px-4 pb-14 pt-8 sm:px-6">
        <Reveal><div className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[36px] bg-[#12100E] px-6 py-20 text-center text-white sm:py-24">
          <motion.div aria-hidden animate={reduce ? undefined : { scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ repeat: Infinity, duration: 7 }} className="pointer-events-none absolute left-1/2 top-0 h-[380px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E85D0C]/30 blur-3xl" />
          <div className="relative"><p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#FF9A57]">Do not guess. Know.</p>
            <h2 className="mx-auto mt-5 max-w-4xl text-[clamp(36px,6vw,72px)] font-extrabold leading-[0.98] tracking-[-0.04em]">Be the brand<br /><span className="bg-gradient-to-r from-[#FF7A29] to-[#FFB067] bg-clip-text text-transparent">AI recommends.</span></h2>
            <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-7 text-white/60">{t('bannerBody')}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"><Magnetic><a href="#start" className="inline-flex h-[52px] items-center gap-2 rounded-full bg-[#E85D0C] px-7 text-[15px] font-bold text-white shadow-[0_18px_36px_rgba(232,93,12,0.4)] transition hover:bg-white hover:text-[#9A3412]">{t('ctaTrack')} <ArrowRight className="h-4 w-4" /></a></Magnetic><a href="#features" className="inline-flex h-[52px] items-center rounded-full border border-white/20 px-6 text-[15px] font-bold text-white/85 hover:border-[#FF9A57] hover:text-white">First, try the live cards</a></div>
            <p className="mt-4 text-[13px] text-white/40">Start with your website above. It takes under a minute, and the form tells you if anything is missing.</p>
          </div></div></Reveal>
      </section>

      <footer className="border-t border-[#F1DFD0] px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center gap-5 sm:flex-row">
          <Link href="/" className="inline-flex items-center gap-2 text-[15px] font-extrabold"><OwlBadge size={28} />AiSearchOwl</Link>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[14px] font-medium text-[#6F6A66] sm:ml-auto" aria-label="Footer">{NAV.map(([key, href]) => <a key={href} href={href} className="hover:text-[#E85D0C]">{t(key)}</a>)}<a href="#faq" className="hover:text-[#E85D0C]">{t('navFaq')}</a><Link href="/sign-in" className="hover:text-[#E85D0C]">{t('navSignIn')}</Link></nav>
        </div>
        <p className="mx-auto mt-6 max-w-[1180px] text-center text-[12px] leading-5 text-[#B0A69A] sm:text-left">{t('footerRights')}</p>
      </footer>
    </div>
  )
}
