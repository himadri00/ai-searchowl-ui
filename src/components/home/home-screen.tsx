'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  ArrowRight, Check, Menu as MenuIcon, Play, Search, TrendingUp, Trophy, X,
} from 'lucide-react'
import { Link, useRouter } from '@/i18n/routing'
import { PLAN_MAX, type PlanId, savePlanChoice } from '@/lib/plan-choice'
import { Favicon } from '@/components/shell/brand-mark'
import { HeroOwl, OwlBadge } from '@/components/home/hero-owl'
import { PreviewBoard } from '@/components/home/preview-board'

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
  { id: 'gpt4o-search', name: 'GPT-4o Search', host: 'openai.com', tier: 'enterprise' },
  { id: 'gpt35', name: 'GPT-3.5', host: 'openai.com', tier: 'enterprise' },
  { id: 'astra', name: 'GPT-6 Astra', host: 'openai.com', tier: 'enterprise' },
  { id: 'sol', name: 'GPT-5.6 Sol', host: 'openai.com', tier: 'enterprise' },
  { id: 'terra', name: 'GPT-5.6 Terra', host: 'openai.com', tier: 'enterprise' },
  { id: 'sonar', name: 'Sonar', host: 'perplexity.ai', tier: 'enterprise' },
  { id: 'llama-sonar', name: 'Llama Sonar', host: 'perplexity.ai', tier: 'enterprise' },
  { id: 'gemini25', name: 'Gemini 2.5 Flash', host: 'gemini.google.com', tier: 'enterprise' },
  { id: 'gemini31', name: 'Gemini 3.1 Flash', host: 'gemini.google.com', tier: 'enterprise' },
  { id: 'gemini4', name: 'Gemini 4', host: 'gemini.google.com', tier: 'enterprise' },
  { id: 'llama', name: 'Llama 3.3', host: 'ai.meta.com', tier: 'enterprise' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', host: 'deepseek.com', tier: 'enterprise' },
  { id: 'deepseek-v4', name: 'DeepSeek V4 Pro', host: 'deepseek.com', tier: 'enterprise' },
  { id: 'claude35haiku', name: 'Claude 3.5 Haiku', host: 'claude.ai', tier: 'enterprise' },
  { id: 'claudehaiku45', name: 'Claude Haiku 4.5', host: 'claude.ai', tier: 'enterprise' },
  { id: 'opus', name: 'Claude Opus 5', host: 'claude.ai', tier: 'enterprise' },
  { id: 'fable', name: 'Claude Fable', host: 'claude.ai', tier: 'enterprise' },
  { id: 'grok', name: 'Grok', host: 'grok.com', tier: 'enterprise' },
  { id: 'grok4', name: 'Grok 4', host: 'grok.com', tier: 'enterprise' },
  { id: 'grok43', name: 'Grok 4.3', host: 'grok.com', tier: 'enterprise' },
  { id: 'grok46', name: 'Grok 4.6', host: 'grok.com', tier: 'enterprise' },
  { id: 'qwen36', name: 'Qwen 3.6 Plus', host: 'qwen.ai', tier: 'enterprise' },
  { id: 'qwen37', name: 'Qwen 3.7 Plus', host: 'qwen.ai', tier: 'enterprise' },
  { id: 'rufus', name: 'Amazon Rufus', host: 'amazon.com', tier: 'enterprise' },
  { id: 'mistral-small', name: 'Mistral Small 4', host: 'mistral.ai', tier: 'enterprise' },
  { id: 'mistral-medium', name: 'Mistral Medium', host: 'mistral.ai', tier: 'enterprise' },
  { id: 'spark12', name: 'Meta Spark 1.2', host: 'ai.meta.com', tier: 'enterprise' },
  { id: 'spark13', name: 'Meta Spark 1.3', host: 'ai.meta.com', tier: 'enterprise' },
  { id: 'wonder', name: 'Muse Wonder', host: 'muse.ai', tier: 'enterprise' },
  { id: 'ernie', name: 'Ernie', host: 'yiyan.baidu.com', tier: 'enterprise' },
] as const

const INCLUDED_ENGINES = ENGINES.filter((engine) => engine.tier === 'lite')
const ADDON_ENGINES = ENGINES.filter((engine) => engine.tier === 'addon')

function EngineIcon({ engine, className }: { engine: (typeof ENGINES)[number]; className: string }) {
  return <Favicon host={engine.host} src={'icon' in engine ? engine.icon : undefined} className={className} />
}

const SHOWN = [
  { name: 'ChatGPT', host: 'openai.com' },
  { name: 'Perplexity', host: 'perplexity.ai' },
  { name: 'Gemini', host: 'gemini.google.com' },
  { name: 'AI Overviews', host: 'google.com' },
] as const

const ORANGE = '#E85D0C'
const LINE = '#F3E6DC'

const NAV = [
  ['navFeaturesLink', '#features'],
  ['navPlatform', '#platform'],
  ['navHowLink', '#how'],
  ['navPricing', '#pricing'],
] as const

export function HomeScreen() {
  const t = useTranslations('home')
  const router = useRouter()
  const [domain, setDomain] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [checkedDomain, setCheckedDomain] = useState('')
  const [yearly, setYearly] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [counts, setCounts] = useState<Record<PlanId, string>>({ lite: '15', standard: '100', premium: '400', enterprise: '1000' })
  const [countErrors, setCountErrors] = useState<Partial<Record<PlanId, string>>>({})

  const cleanDomain = useMemo(
    () => domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, ''),
    [domain],
  )

  const runCheck = () => {
    if (!cleanDomain) { setError(t('errorEmpty')); setCheckedDomain(''); return }
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(cleanDomain)) { setError(t('errorInvalid')); setCheckedDomain(''); return }
    setError('')
    setChecking(true)
    setCheckedDomain('')
    window.setTimeout(() => { setChecking(false); setCheckedDomain(cleanDomain) }, 900)
  }

  const lines = (keys: string[]) => keys.map((key) => t(key))
  const plans: Array<{ key: PlanId; name: string; body: string; monthly: number; yearly: number; popular: boolean; custom: boolean; cta: string; engines: typeof INCLUDED_ENGINES; addons: typeof ADDON_ENGINES; modelsLabel: string; features: string[]; promptMax: number }> = [
    { key: 'lite', name: t('starterName'), body: t('starterBody'), monthly: 22, yearly: 19, popular: false, custom: false, cta: t('planCta'), engines: INCLUDED_ENGINES, addons: ADDON_ENGINES, modelsLabel: t('liteModels'), promptMax: PLAN_MAX.lite, features: lines(['starterF1', 'starterF4', 'starterF5', 'starterF6', 'starterF7', 'starterF8', 'starterF9']) },
    { key: 'standard', name: t('growthName'), body: t('growthBody'), monthly: 189, yearly: 160, popular: true, custom: false, cta: t('planCta'), engines: INCLUDED_ENGINES, addons: ADDON_ENGINES, modelsLabel: t('paidModels'), promptMax: PLAN_MAX.standard, features: lines(['growthF1', 'growthF4', 'growthF5', 'growthF6', 'growthF7', 'growthF8', 'growthF9', 'growthF10', 'growthF11', 'growthF12', 'growthF13']) },
    { key: 'premium', name: t('scaleName'), body: t('scaleBody'), monthly: 489, yearly: 422, popular: false, custom: false, cta: t('planCta'), engines: INCLUDED_ENGINES, addons: ADDON_ENGINES, modelsLabel: t('paidModels'), promptMax: PLAN_MAX.premium, features: lines(['scaleF1', 'scaleF4', 'scaleF5', 'scaleF6', 'scaleF7', 'scaleF8', 'scaleF9', 'scaleF10', 'scaleF11', 'scaleF12', 'scaleF13']) },
    { key: 'enterprise', name: t('enterpriseName'), body: t('enterpriseBody'), monthly: 0, yearly: 0, popular: false, custom: true, cta: t('enterpriseCta'), engines: [], addons: [], modelsLabel: t('enterpriseModels'), promptMax: PLAN_MAX.enterprise, features: lines(['enterpriseF1', 'enterpriseF2', 'enterpriseF3', 'enterpriseF4', 'enterpriseF5', 'enterpriseF6', 'enterpriseF7', 'enterpriseF8', 'enterpriseF9']) },
  ]

  const startTrial = (plan: PlanId, max: number) => {
    const raw = (counts[plan] ?? '').trim()
    const parsed = Number(raw)
    if (!/^\d+$/.test(raw) || parsed < 1 || parsed > max) {
      setCountErrors((current) => ({ ...current, [plan]: t('promptRunError', { max: String(max) }) }))
      return
    }
    savePlanChoice({ plan, prompts: parsed })
    router.push(`/sign-up?plan=${plan}&prompts=${parsed}`)
  }

  return (
    <div className="min-h-screen scroll-smooth bg-white text-[#1A1A1A]">
      <header className="sticky top-0 z-40 border-b border-[#F3E6DC] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-[16px] font-bold tracking-tight">
            <OwlBadge size={32} />
            AiSearchOwl
          </Link>
          <nav className="ml-8 hidden items-center gap-7 text-[14px] font-medium text-[#5C574F] lg:flex">
            {NAV.map(([key, href]) => (
              <a key={href} href={href} className="hover:text-[#1A1A1A]">{t(key)}</a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/sign-in" className="hidden rounded-full px-3.5 py-2 text-[14px] font-medium text-[#3F3A36] hover:bg-[#FFF6F0] sm:block">{t('navSignIn')}</Link>
            <a href="#start" className="whitespace-nowrap rounded-full bg-[#E85D0C] px-4 py-2.5 text-[14px] font-semibold text-white shadow-[0_8px_18px_rgba(232,93,12,0.28)] transition hover:bg-[#C44708]">{t('navTrial')} <span aria-hidden>→</span></a>
            <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#FFF6F0] lg:hidden">
              {menuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen ? (
          <nav aria-label="Mobile" className="border-t border-[#F3E6DC] px-4 py-3 lg:hidden">
            <ul className="space-y-1 text-[15px] font-medium">
              {NAV.map(([key, href]) => (
                <li key={href}><a href={href} onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2.5 hover:bg-[#FFF6F0]">{t(key)}</a></li>
              ))}
              <li><Link href="/sign-in" className="block rounded-xl px-3 py-2.5 hover:bg-[#FFF6F0]">{t('navSignIn')}</Link></li>
            </ul>
          </nav>
        ) : null}
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-[1180px] items-center gap-8 px-4 pb-6 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-4 lg:pt-16">
          <div>
            <p className="rise-in text-[12px] font-semibold uppercase tracking-[0.2em] text-[#E85D0C]">{t('heroEyebrow')}</p>
            <h1 className="rise-in mt-4 text-[40px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[56px] lg:text-[64px]" style={{ animationDelay: '70ms' }}>
              {t('heroHeadlineA')}
              <br />
              <span className="text-[#E85D0C]">{t('heroHeadlineB')}</span>
            </h1>
            <p className="rise-in mt-5 max-w-xl text-[16px] leading-7 text-[#6F6A66] sm:text-[17px]" style={{ animationDelay: '140ms' }}>{t('heroLead')}</p>
            <div className="rise-in mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '200ms' }}>
              <a href="#start" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#E85D0C] px-5 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(232,93,12,0.3)] transition hover:bg-[#C44708]">
                {t('ctaTrack')} <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#platform" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#E7E5E4] bg-white px-5 text-[15px] font-semibold text-[#1A1A1A] shadow-sm transition hover:border-[#FFD0B5] hover:bg-[#FFF8F3]">
                <span className="grid h-6 w-6 place-items-center rounded-full border border-[#E85D0C] text-[#E85D0C]"><Play className="h-3 w-3 fill-current" /></span>
                {t('ctaExplore')}
              </a>
            </div>
            <ul className="rise-in mt-7 flex flex-wrap items-center gap-2" style={{ animationDelay: '260ms' }}>
              {SHOWN.map((engine) => (
                <li key={engine.name} className="inline-flex items-center gap-2 rounded-full border border-[#F3E6DC] bg-white py-1.5 pl-1.5 pr-3 text-[13px] font-medium text-[#3F3A36] shadow-[0_6px_16px_rgba(28,25,23,0.04)]">
                  <Favicon host={engine.host} className="h-5 w-5 rounded-full" />
                  {engine.name}
                </li>
              ))}
            </ul>
          </div>
          <HeroOwl />
        </div>
      </section>

      <section id="platform" className="scroll-mt-24 px-4 pb-8 sm:px-6">
        <div className="mx-auto max-w-[1180px]">
          <PreviewBoard />
          <p className="mt-3 text-center text-[13px] text-[#8A847E]">{t('sampleNote')}</p>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="max-w-xs text-center text-[15px] font-semibold leading-6 sm:text-left">{t('platformsLead')}</p>
          <ul className="flex flex-wrap items-center justify-center gap-2">
            {SHOWN.map((engine) => (
              <li key={engine.name} className="inline-flex items-center gap-2 rounded-full border border-[#F3E6DC] bg-white px-3 py-2 text-[13px] font-medium shadow-sm">
                <Favicon host={engine.host} className="h-5 w-5 rounded-full" />
                {engine.name}
              </li>
            ))}
            <li className="rounded-full border border-[#F3E6DC] bg-[#FFF8F3] px-3 py-2 text-[13px] font-medium text-[#8A847E]">{t('platformsMore')}</li>
          </ul>
        </div>
      </section>

      <section id="features" className="scroll-mt-24 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="text-center text-[32px] font-extrabold tracking-[-0.03em] sm:text-[40px]">
            {t('winTitleA')} <span className="text-[#E85D0C]">{t('winTitleB')}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[15px] leading-7 text-[#6F6A66]">{t('winBody')}</p>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <article className="rounded-[24px] border bg-[#FFFCF9] p-6" style={{ borderColor: LINE }}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF1E6] text-[#E85D0C]"><Search className="h-5 w-5" /></span>
              <h3 className="mt-4 text-[18px] font-bold">{t('win1Title')}</h3>
              <p className="mt-2 text-[14px] leading-6 text-[#6F6A66]">{t('win1Body')}</p>
              <p className="mt-5 text-[12px] text-[#8A847E]">{t('metricPrompts')}</p>
              <p className="text-[28px] font-semibold leading-none">248</p>
              <ul className="mt-4 space-y-2 text-[13px]">
                {['Best project management tools?', 'Alternatives to Notion?', 'AI tools for marketing teams?'].map((prompt) => (
                  <li key={prompt} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[#3F3A36]">
                    <Search className="h-3.5 w-3.5 shrink-0 text-[#E85D0C]" />
                    <span className="truncate">{prompt}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-[24px] border bg-[#FFFCF9] p-6" style={{ borderColor: LINE }}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF1E6] text-[#E85D0C]"><TrendingUp className="h-5 w-5" /></span>
              <h3 className="mt-4 text-[18px] font-bold">{t('win2Title')}</h3>
              <p className="mt-2 text-[14px] leading-6 text-[#6F6A66]">{t('win2Body')}</p>
              <dl className="mt-5 grid grid-cols-3 gap-2">
                {[['68%', t('metricVisibility'), '+12 pp'], ['1,284', t('metricMentions'), '+37%'], ['356', t('metricCitations'), '+53%']].map(([value, label, delta]) => (
                  <div key={label} className="rounded-2xl bg-white px-2 py-3 text-center">
                    <dd className="text-[20px] font-semibold leading-none">{value}</dd>
                    <dt className="mt-1 text-[11px] text-[#8A847E]">{label}</dt>
                    <p className="mt-1 text-[11px] font-semibold text-[#16A34A]">{delta}</p>
                  </div>
                ))}
              </dl>
            </article>
            <article className="rounded-[24px] border bg-[#FFFCF9] p-6" style={{ borderColor: LINE }}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF1E6] text-[#E85D0C]"><Trophy className="h-5 w-5" /></span>
              <h3 className="mt-4 text-[18px] font-bold">{t('win3Title')}</h3>
              <p className="mt-2 text-[14px] leading-6 text-[#6F6A66]">{t('win3Body')}</p>
              <ul className="mt-5 space-y-3">
                {([
                  ['yourBrand', 34, true],
                  ['compA', 26, false],
                  ['compB', 18, false],
                  ['compC', 12, false],
                ] as const).map(([key, value, yours]) => (
                  <li key={key}>
                    <div className="mb-1 flex justify-between text-[12px]">
                      <span className="font-medium">{t(key)}</span>
                      <span className="font-semibold">{value}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#FFF1E6]">
                      <div className="h-full rounded-full" style={{ width: `${value}%`, background: yours ? ORANGE : '#FFC48A' }} />
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6">
        <div className="mx-auto grid max-w-[1180px] items-center gap-8 lg:grid-cols-[0.85fr_1.15fr_0.9fr]">
          <div>
            <h2 className="text-[32px] font-extrabold leading-[1.15] tracking-[-0.03em] sm:text-[36px]">
              {t('insightTitleA')} <span className="text-[#E85D0C]">{t('insightTitleB')}</span>
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-[#6F6A66]">{t('insightBody')}</p>
          </div>
          <article className="rounded-[24px] border bg-white p-5 shadow-[0_18px_40px_rgba(232,93,12,0.08)]" style={{ borderColor: LINE }}>
            <p className="text-[12px] text-[#8A847E]">{t('promptLabel')}</p>
            <p className="mt-1 text-[15px] font-semibold">“{t('insightPrompt')}”</p>
            <div className="mt-4 rounded-2xl bg-[#FFF8F3] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#E85D0C]">{t('insightAnswerLabel')}</p>
              <p className="mt-2 text-[14px] leading-6 text-[#3F3A36]">{t('insightAnswer')}</p>
            </div>
            <p className="mt-4 text-[12px] font-semibold text-[#8A847E]">{t('insightSources')}</p>
            <ul className="mt-2 space-y-2 text-[13px]">
              <li className="flex items-center gap-2"><Favicon host="aisearchowl.com" className="h-4 w-4 rounded-full" /> aisearchowl.com</li>
              <li className="flex items-center gap-2"><Favicon host="notion.so" className="h-4 w-4 rounded-full" /> notion.so</li>
            </ul>
          </article>
          <ul className="space-y-5">
            {[['check1Title', 'check1Body'], ['check2Title', 'check2Body'], ['check3Title', 'check3Body']].map(([title, body]) => (
              <li key={title} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#FFF1E6] text-[#E85D0C]"><Check className="h-4 w-4" /></span>
                <div>
                  <p className="font-semibold">{t(title)}</p>
                  <p className="mt-0.5 text-[14px] leading-6 text-[#6F6A66]">{t(body)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how" className="scroll-mt-24 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="text-center text-[32px] font-extrabold tracking-[-0.03em] sm:text-[40px]">{t('growTitle')}</h2>
          <p className="mt-3 text-center text-[15px] text-[#6F6A66]">{t('growBody')}</p>
          <ol className="relative mt-12 grid gap-8 md:grid-cols-3">
            <span aria-hidden className="absolute left-[16%] right-[16%] top-5 hidden h-px bg-[#FFD7C2] md:block" />
            {[['01', 'grow1Title', 'grow1Body'], ['02', 'grow2Title', 'grow2Body'], ['03', 'grow3Title', 'grow3Body']].map(([n, title, body]) => (
              <li key={n} className="relative text-center">
                <span className="relative z-10 mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#E85D0C] text-[14px] font-bold text-white shadow-[0_8px_16px_rgba(232,93,12,0.3)]">{n}</span>
                <h3 className="mt-4 text-[18px] font-bold">{t(title)}</h3>
                <p className="mx-auto mt-2 max-w-xs text-[14px] leading-6 text-[#6F6A66]">{t(body)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="start" className="scroll-mt-24 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-[28px] border bg-[#FFF8F3] p-6 sm:p-8" style={{ borderColor: LINE }}>
          <h2 className="text-[28px] font-extrabold tracking-tight">{t('startTitle')}</h2>
          <p className="mt-2 text-[15px] leading-7 text-[#6F6A66]">{t('startBody')}</p>
          <form className="mt-5" onSubmit={(e) => { e.preventDefault(); runCheck() }} noValidate>
            <label htmlFor="owl-domain" className="text-[13px] font-semibold text-[#3F3A36]">{t('domainLabel')}</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8A29E]" />
                <input
                  id="owl-domain"
                  value={domain}
                  onChange={(e) => { setDomain(e.target.value); if (error) setError('') }}
                  placeholder={t('domainPlaceholder')}
                  inputMode="url"
                  autoComplete="url"
                  aria-invalid={Boolean(error)}
                  aria-describedby="owl-domain-help owl-domain-error"
                  className="h-12 w-full rounded-full border bg-white pl-10 pr-3 text-[15px] outline-none placeholder:text-[#A8A29E] focus:ring-2 focus:ring-[#E85D0C]/30"
                  style={{ borderColor: error ? '#B42318' : LINE }}
                />
              </div>
              <button type="submit" disabled={checking} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#E85D0C] px-5 text-[15px] font-semibold text-white transition hover:bg-[#C44708] disabled:opacity-60">
                {checking ? t('checkingButton') : t('checkButton')} {!checking && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
            <p id="owl-domain-help" className="mt-3 text-[13px] leading-5 text-[#8A847E]">{t('domainHelp')}</p>
            {error ? (
              <p id="owl-domain-error" role="alert" className="mt-3 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] leading-6 text-rose-800">
                <X className="mt-1 h-4 w-4 shrink-0" /> {error}
              </p>
            ) : null}
            {checkedDomain ? (
              <div role="status" className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
                <p className="flex items-start gap-2 text-[15px] font-semibold text-emerald-900"><Check className="mt-0.5 h-4 w-4 shrink-0" /> {t('successTitle', { domain: checkedDomain })}</p>
                <p className="mt-1 text-[14px] leading-6 text-emerald-900/80">{t('successBody', { domain: checkedDomain })}</p>
                <a href="#pricing" className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#E85D0C] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#C44708]">{t('successCta')} <ArrowRight className="h-4 w-4" /></a>
                <p className="mt-2 text-[13px] leading-5 text-emerald-900/70">{t('successNote')}</p>
              </div>
            ) : null}
            <p className="mt-3 text-[13px] text-[#8A847E]">{t('noCard')}</p>
          </form>
          <ul className="mt-5 grid gap-2 text-[14px] leading-6 sm:grid-cols-3">
            {[t('need1'), t('need2'), t('need3')].map((item) => (
              <li key={item} className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-[#E85D0C]" />{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-24 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-[1180px]">
          <p className="text-center text-[12px] font-semibold uppercase tracking-[0.2em] text-[#E85D0C]">{t('pricingEyebrow')}</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-center text-[32px] font-extrabold tracking-[-0.03em] sm:text-[40px]">{t('pricingTitle')}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[15px] leading-7 text-[#6F6A66]">{t('pricingBody')}</p>
          <div className="mt-8 flex justify-center">
            <div role="group" aria-label="Billing period" className="inline-flex rounded-full border bg-[#FFF8F3] p-1" style={{ borderColor: LINE }}>
              <button type="button" onClick={() => setYearly(false)} aria-pressed={!yearly} className={`rounded-full px-4 py-2 text-[14px] font-medium transition ${!yearly ? 'bg-[#E85D0C] text-white' : 'text-[#6F6A66] hover:text-[#1A1A1A]'}`}>{t('billingMonthly')}</button>
              <button type="button" onClick={() => setYearly(true)} aria-pressed={yearly} className={`rounded-full px-4 py-2 text-[14px] font-medium transition ${yearly ? 'bg-[#E85D0C] text-white' : 'text-[#6F6A66] hover:text-[#1A1A1A]'}`}>
                {t('billingYearly')} <span className={yearly ? 'text-white/90' : 'text-[#E85D0C]'}>({t('billingSave')})</span>
              </button>
            </div>
          </div>
          <div className="mt-10 grid items-stretch gap-5 grid-cols-1 min-[760px]:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <article key={plan.key} className={`relative flex flex-col rounded-[24px] border bg-white p-6 ${plan.popular ? 'shadow-[0_24px_50px_rgba(232,93,12,0.16)]' : 'shadow-[0_10px_30px_rgba(28,25,23,0.04)]'}`} style={{ borderColor: plan.popular ? ORANGE : LINE }}>
                {plan.popular ? <p className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#E85D0C] px-3 py-1 text-[12px] font-semibold text-white">{t('popular')}</p> : null}
                <h3 className="text-[22px] font-bold">{plan.name}</h3>
                <p className="mt-1.5 min-h-[48px] text-[14px] leading-6 text-[#6F6A66]">{plan.body}</p>
                {plan.custom ? (
                  <p className="mt-5"><span className="text-[40px] font-extrabold leading-none">{t('customPrice')}</span></p>
                ) : (
                  <p key={yearly ? 'yearly' : 'monthly'} className="pop-in mt-5">
                    <span className="text-[40px] font-extrabold leading-none">${yearly ? plan.yearly : plan.monthly}</span>
                    <span className="ml-1.5 text-[14px] text-[#8A847E]">USD / {t('perMonth')}</span>
                  </p>
                )}
                <p className="mt-1.5 text-[13px] text-[#8A847E]">{plan.custom ? t('customPriceNote') : yearly ? t('billedYearly') : t('billedMonthly')}</p>
                <div className="mt-5">
                  <p className="text-[13px] font-medium text-[#3F3A36]">{plan.modelsLabel}</p>
                  {plan.engines.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5" role="list">
                      {plan.engines.map((engine) => (
                        <span key={engine.id} role="listitem" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-[#FFF8F3] py-1 pl-1 pr-2.5 text-[12px] font-medium" style={{ borderColor: LINE }}>
                          <EngineIcon engine={engine} className="h-5 w-5 rounded-full" />
                          {engine.name.replace('Google ', '')}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-[13px] leading-5 text-[#8A847E]">{t('enterpriseChoose')}</p>
                  )}
                  {plan.addons.length > 0 ? (
                    <>
                      <p className="mt-3 text-[13px] font-medium text-[#3F3A36]">{t('addonModels')}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5" role="list">
                        {plan.addons.map((engine) => (
                          <span key={engine.id} role="listitem" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-white py-1 pl-1 pr-2.5 text-[12px] font-medium text-[#8A847E]" style={{ borderColor: LINE }}>
                            <EngineIcon engine={engine} className="h-5 w-5 rounded-full" />
                            {engine.name.replace('Google ', '')}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
                <label className="mt-5 block text-[13px] font-medium text-[#3F3A36]">
                  {t('promptRunLabel')}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={plan.promptMax}
                    value={counts[plan.key]}
                    aria-invalid={Boolean(countErrors[plan.key])}
                    aria-describedby={`prompts-${plan.key}`}
                    onChange={(event) => {
                      const value = event.target.value
                      setCounts((current) => ({ ...current, [plan.key]: value }))
                      const parsed = Number(value)
                      const valid = /^\d+$/.test(value) && parsed >= 1 && parsed <= plan.promptMax
                      setCountErrors((current) => ({ ...current, [plan.key]: valid ? '' : t('promptRunError', { max: String(plan.promptMax) }) }))
                    }}
                    className="mt-1.5 w-full rounded-xl border bg-[#FFF8F3] px-3 py-2 text-[15px] font-medium text-[#1A1A1A] outline-none"
                    style={{ borderColor: countErrors[plan.key] ? '#B42318' : LINE }}
                  />
                </label>
                <p id={`prompts-${plan.key}`} className={`mt-1.5 text-[12px] leading-5 ${countErrors[plan.key] ? 'text-[#B42318]' : 'text-[#8A847E]'}`}>
                  {countErrors[plan.key] || t('promptRunHelp', { max: String(plan.promptMax) })}
                </p>
                <button type="button" onClick={() => startTrial(plan.key, plan.promptMax)} className={`mt-5 flex items-center justify-center gap-2 rounded-full py-3 text-[15px] font-semibold transition ${plan.popular ? 'bg-[#E85D0C] text-white hover:bg-[#C44708]' : 'border border-[#FFD0B5] text-[#C44708] hover:bg-[#FFF6F0]'}`}>
                  {plan.cta} <ArrowRight className="h-4 w-4" />
                </button>
                <ul className="mt-6 flex-1 space-y-2.5 border-t pt-6 text-[14px] leading-6" style={{ borderColor: LINE }}>
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5"><Check className="mt-1 h-4 w-4 shrink-0 text-[#E85D0C]" />{feature}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="mx-auto mt-7 max-w-3xl text-center text-[13px] leading-6 text-[#8A847E]">{t('pricingNote')}</p>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-[32px] font-extrabold tracking-tight">{t('faqTitle')}</h2>
          <div className="mt-8">
            {[[t('q1'), t('a1')], [t('q2'), t('a2')], [t('q3'), t('a3')], [t('q4'), t('a4')]].map(([q, a]) => (
              <details key={q} className="group border-b border-[#F3E6DC] py-5">
                <summary className="cursor-pointer list-none text-[16px] font-semibold marker:content-none">{q}</summary>
                <p className="mt-2.5 text-[14px] leading-6 text-[#6F6A66]">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 pt-6 sm:px-6">
        <div className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[32px] bg-[#E85D0C] px-6 py-16 text-center text-white">
          <svg aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full" viewBox="0 0 1200 140" preserveAspectRatio="none">
            <path d="M0 70 C 180 120, 320 20, 520 70 S 860 130, 1200 50 V140 H0 Z" fill="#FF8A45" opacity="0.55" />
            <path d="M0 90 C 200 40, 400 130, 680 80 S 980 30, 1200 90 V140 H0 Z" fill="#FFB07A" opacity="0.45" />
          </svg>
          <div className="relative">
            <h2 className="mx-auto max-w-3xl text-[32px] font-extrabold leading-tight tracking-[-0.03em] sm:text-[44px]">{t('bannerTitle')}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-7 text-white/90">{t('bannerBody')}</p>
            <a href="#start" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[15px] font-semibold text-[#C44708] shadow-sm transition hover:bg-[#FFF6F0]">
              {t('ctaTrack')} <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#F3E6DC]">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-[15px] font-bold">
            <OwlBadge size={28} />
            AiSearchOwl
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[14px] text-[#6F6A66] sm:ml-auto">
            {NAV.map(([key, href]) => (
              <a key={href} href={href} className="hover:text-[#1A1A1A]">{t(key)}</a>
            ))}
            <a href="#faq" className="hover:text-[#1A1A1A]">{t('navFaq')}</a>
            <Link href="/sign-in" className="hover:text-[#1A1A1A]">{t('navSignIn')}</Link>
          </nav>
        </div>
        <p className="px-4 pb-6 text-center text-[12px] leading-5 text-[#A8A29E]">{t('footerRights')}</p>
      </footer>
    </div>
  )
}
