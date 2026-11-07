'use client'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { Check, Eye, Link2, ListChecks, MessagesSquare, Trophy } from 'lucide-react'
import { Reveal, SectionTag } from './motion-primitives'

const PROMPTS = [
  { q: 'Best project management tools?', rank: '#1', prev: '#3', vis: 78 },
  { q: 'Alternatives to Notion?', rank: '#2', prev: '#2', vis: 72 },
  { q: 'AI tools for marketing teams?', rank: 'Not shown', prev: 'Not shown', vis: 18 },
  { q: 'Best CRM for startups?', rank: 'Mentioned', prev: '#4', vis: 51 },
] as const

function PromptDemo() {
  const [i, setI] = useState(0); const p = PROMPTS[i]
  return (<div>
    <div className="grid gap-1.5">{PROMPTS.map((x, idx) => <button key={x.q} type="button" onClick={() => setI(idx)} aria-pressed={i === idx} className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] font-semibold ${i === idx ? 'bg-[#171310] text-white' : 'bg-[#FFF6EC] hover:bg-[#FFEEDD]'}`}><span className="truncate">{x.q}</span><span className={i === idx ? 'text-[#FFB067]' : 'text-[#C44708]'}>{x.rank}</span></button>)}</div>
    <AnimatePresence mode="wait"><motion.p key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-[12.5px] leading-5 text-[#8A8178]">Visibility {p.vis}% · last check yesterday you were {p.prev}. {p.rank === 'Not shown' ? 'You are missing here — this prompt goes on your fix plan first.' : 'We check this again tomorrow and tell you if it moves.'}</motion.p></AnimatePresence>
  </div>)
}

function ScoreDemo() {
  const [day, setDay] = useState(30); const score = Math.round(38 + (day / 30) * 30)
  const pts = Array.from({ length: 13 }, (_, i) => `${12 + i * 22},${92 - (38 + (i / 12) * (score - 38)) * 0.95}`).join(' ')
  return (<div>
    <div className="rounded-2xl bg-[#171310] px-4 py-3 text-white"><div className="flex items-end justify-between"><div><p className="text-[11px] text-white/50">AI visibility score</p><p className="text-[30px] font-extrabold leading-none">{score}<span className="text-[13px] text-white/40">/100</span></p></div><p className="text-[12px] font-bold text-emerald-400">▲ from 38 in 30 days</p></div>
      <svg viewBox="0 0 290 110" className="mt-2 w-full" aria-hidden><motion.polyline points={pts} fill="none" stroke="#FF8A3A" strokeWidth="3" strokeLinecap="round" animate={{ points: pts }} transition={{ type: 'spring', stiffness: 90, damping: 20 }} /></svg></div>
    <label className="mt-3 block text-[12px] font-semibold">Drag to travel through the last 30 days: day {day}<input type="range" min={1} max={30} value={day} onChange={e => setDay(+e.target.value)} className="mt-1 w-full" aria-label="Day in the last 30 days" /></label>
    <p className="text-[12px] leading-5 text-[#8A8178]">One clear score, updated daily — so you can see if your fixes are working or not.</p>
  </div>)
}

function CitationDemo() {
  const [tab, setTab] = useState<'you' | 'them'>('you')
  const rows = tab === 'you' ? [['yourblog.com/remote-teams-guide', 'Cited 42 times'], ['yourblog.com/pricing', 'Not cited yet — make it public']] : [['notion.com/templates', 'Cited 118 times — copy its structure'], ['asana.com/resources', 'Cited 86 times']]
  return (<div>
    <div className="flex gap-1.5" role="group" aria-label="Citation view">{([['you', 'Pages AI cites for you'], ['them', 'Pages AI cites instead']] as const).map(([k, l]) => <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k} className={`flex-1 rounded-full px-2 py-2 text-[11.5px] font-bold ${tab === k ? 'bg-[#E85D0C] text-white' : 'bg-[#FFF1E6] text-[#7C4A21]'}`}>{l}</button>)}</div>
    <AnimatePresence mode="wait"><motion.ul key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 space-y-1.5">{rows.map(([u, n]) => <li key={u} className="flex justify-between gap-2 rounded-xl bg-[#FFFBF6] px-3 py-2 text-[12px]"><span className="truncate font-semibold">{u}</span><span className="shrink-0 text-[#8A8178]">{n}</span></li>)}</motion.ul></AnimatePresence>
    <p className="mt-2 text-[12px] leading-5 text-[#8A8178]">If AI cites them and not you, we show you the exact page to create or fix — not a vague tip.</p>
  </div>)
}

function CompetitorDemo() {
  const [focus, setFocus] = useState<'week' | 'month'>('month')
  const data = focus === 'month' ? [['You', 34], ['Notion', 28], ['Asana', 21], ['ClickUp', 17]] : [['You', 29], ['Notion', 31], ['Asana', 23], ['ClickUp', 17]]
  return (<div>
    <div className="space-y-2.5">{data.map(([name, v]) => <div key={name}><div className="mb-1 flex justify-between text-[12px]"><span className={`font-bold ${name === 'You' ? 'text-[#C44708]' : ''}`}>{name}</span><span className="font-semibold">{v}% of AI answers</span></div><div className="h-2.5 overflow-hidden rounded-full bg-[#FFF1E6]"><motion.div className={`h-full rounded-full ${name === 'You' ? 'bg-[#E85D0C]' : 'bg-[#FFC79A]'}`} animate={{ width: `${Number(v) * 2.4}%` }} transition={{ type: 'spring', stiffness: 90, damping: 20 }} /></div></div>)}</div>
    <div className="mt-3 flex gap-1.5">{([['week', 'This week'], ['month', 'Last 30 days']] as const).map(([k, l]) => <button key={k} type="button" onClick={() => setFocus(k)} aria-pressed={focus === k} className={`rounded-full px-3 py-1.5 text-[12px] font-bold ${focus === k ? 'bg-[#171310] text-white' : 'bg-[#FFF1E6]'}`}>{l}</button>)}</div>
    <p className="mt-2 text-[12px] leading-5 text-[#8A8178]">{focus === 'week' ? 'Notion passed you this week. Your fix plan moves their winning prompt to the top.' : 'You lead over 30 days — but the weekly view warns you before you slip.'}</p>
  </div>)
}

const FIXES = [
  { label: 'Publish “Remote teams” guide AI can cite', gain: '+14' },
  { label: 'Make startup pricing public (no sign-up wall)', gain: '+9' },
  { label: 'Update alternatives page with price table', gain: '+7' },
  { label: 'Add FAQ answers AI can quote word-for-word', gain: '+5' },
] as const
function FixPlanDemo() {
  const [done, setDone] = useState<boolean[]>([true, false, false, false]); const n = done.filter(Boolean).length
  return (<div>
    <ul className="space-y-1.5">{FIXES.map((f, i) => <li key={f.label}><label className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] font-semibold ${done[i] ? 'bg-emerald-50 text-emerald-900 line-through decoration-emerald-400' : 'bg-[#FFF6EC]'}`}><input type="checkbox" checked={done[i]} onChange={() => setDone(d => d.map((v, j) => j === i ? !v : v))} className="h-4 w-4 shrink-0" /><span className="flex-1">{f.label}</span><span className="shrink-0 text-[11px] font-extrabold text-[#C44708]">{f.gain}</span></label></li>)}</ul>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#FFF1E6]"><motion.div className="h-full bg-emerald-500" animate={{ width: `${(n / FIXES.length) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} /></div>
    <p className="mt-2 text-[12px] leading-5 text-[#8A8178]">{n === 0 ? 'Tick a fix when you ship it. We re-check AI the next day.' : n === FIXES.length ? 'All fixes shipped. We now watch daily and warn you if a competitor takes a prompt back.' : `${n} of ${FIXES.length} done. Next unchecked item is your #1 job — do that one first.`}</p>
  </div>)
}

function AlertDemo() {
  const [on, setOn] = useState(true)
  return (<div className="flex flex-col items-start gap-3">
    <button type="button" role="switch" aria-checked={on} onClick={() => setOn(v => !v)} className={`relative h-8 w-14 rounded-full transition ${on ? 'bg-[#E85D0C]' : 'bg-[#E7DDD2]'}`}><motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 32 }} className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow ${on ? 'right-1' : 'left-1'}`} /></button>
    <AnimatePresence mode="wait"><motion.div key={String(on)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`w-full rounded-2xl px-4 py-3 text-[13px] leading-6 ${on ? 'bg-[#171310] text-white' : 'bg-[#FFF6EC] text-[#7C4A21]'}`}>{on ? <><strong className="text-[#FFB067]">Tomorrow, 9:00 —</strong> “ChatGPT dropped you to #3 for ‘Alternatives to Notion?’. Asana updated their page yesterday. Here is what to change back.”</> : 'Alerts are off. You would only find out at your next manual check — possibly weeks later. Turn alerts on so you never lose a prompt quietly.'}</motion.div></AnimatePresence>
    <p className="text-[12px] leading-5 text-[#8A8178]">Flip the switch. This is the message you get the morning after AI changes its answer.</p>
  </div>)
}

const CARDS = [
  { icon: MessagesSquare, title: 'Track the questions buyers ask AI', body: 'We ask ChatGPT, Perplexity, Gemini and more the real buying questions in your market — every day.', node: <PromptDemo /> },
  { icon: Eye, title: 'One visibility score, updated daily', body: 'Mentioned? Cited? Ranked where? Rolled into one score out of 100 you can watch move.', node: <ScoreDemo /> },
  { icon: Link2, title: 'See the exact pages AI cites', body: 'Yours — and theirs. So you know which page to build, fix, or make public next.', node: <CitationDemo /> },
  { icon: Trophy, title: 'Know who AI recommends instead of you', body: 'Share of voice per prompt, per competitor. No more guessing why you lost a deal.', node: <CompetitorDemo /> },
  { icon: ListChecks, title: 'Get a fix plan, ordered for you', body: 'Each gap becomes one clear job, sorted by what will move your ranking first.', node: <FixPlanDemo /> },
  { icon: Check, title: 'Get warned when AI changes its mind', body: 'Answers change weekly. We check daily and tell you the same morning — with the fix.', node: <AlertDemo /> },
] as const

export function FeatureShowcase() {
  const reduce = useReducedMotion()
  return (
    <section id="features" className="scroll-mt-28 px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-[1180px]">
        <Reveal><SectionTag>What we track — and what you do about it</SectionTag>
          <h2 className="mt-4 max-w-3xl text-[36px] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-[52px]">We watch AI answers.<br /><span className="text-[#E85D0C]">You get the fix list.</span></h2>
          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-[#6F6A66]">Try each card — they use sample data and behave like your real report. Every card answers one question and ends with what to do next.</p></Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c, i) => (
            <Reveal key={c.title} delay={(i % 3) * 0.08}>
              <motion.article whileHover={reduce ? undefined : { y: -4 }} className="flex h-full flex-col rounded-[26px] border border-[#F1DFD0] bg-white p-5 shadow-[0_10px_30px_rgba(28,20,10,0.04)] hover:shadow-[0_24px_50px_rgba(232,93,12,0.12)]">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF1E6] text-[#E85D0C]"><c.icon className="h-5 w-5" /></span>
                <h3 className="mt-4 text-[18px] font-bold tracking-tight">{c.title}</h3><p className="mb-4 mt-1.5 text-[14px] leading-6 text-[#6F6A66]">{c.body}</p><div className="mt-auto">{c.node}</div>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
