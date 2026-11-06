import {
  Eye, FileBarChart, Link2, LayoutGrid, MessagesSquare, Users,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Favicon } from '@/components/shell/brand-mark'
import { OwlBadge } from '@/components/home/hero-owl'

const ORANGE = '#E85D0C'
const LINE = '#F3E6DC'

const SIDE = [
  { key: 'sideOverview', icon: LayoutGrid, active: true },
  { key: 'sidePrompts', icon: MessagesSquare, active: false },
  { key: 'sideVisibility', icon: Eye, active: false },
  { key: 'sideCitations', icon: Link2, active: false },
  { key: 'sideCompetitors', icon: Users, active: false },
  { key: 'sideReports', icon: FileBarChart, active: false },
] as const

const METRICS = [
  { icon: Eye, label: 'metricVisibility', value: '68%', delta: '+12 pp' },
  { icon: MessagesSquare, label: 'metricPrompts', value: '248', delta: '+24%' },
  { icon: Users, label: 'metricMentions', value: '1,284', delta: '+37%' },
  { icon: Link2, label: 'metricCitations', value: '356', delta: '+53%' },
] as const

const PLATFORMS = [
  { name: 'ChatGPT', host: 'openai.com', value: 72 },
  { name: 'Gemini', host: 'gemini.google.com', value: 69 },
  { name: 'Perplexity', host: 'perplexity.ai', value: 63 },
  { name: 'AI Overviews', host: 'google.com', value: 58 },
] as const

const SHARE = [
  { key: 'yourBrand', value: 34, color: '#E85D0C' },
  { key: 'compA', value: 26, color: '#FFB067' },
  { key: 'compB', value: 18, color: '#FFD7B0' },
  { key: 'compC', value: 12, color: '#E7E5E4' },
  { key: 'othersLabel', value: 10, color: '#D6D3D1' },
] as const

const PROMPTS = [
  { q: 'Best project management tools?', rank: '#1', visibility: '78%', citations: '42' },
  { q: 'Alternatives to Notion?', rank: '#2', visibility: '72%', citations: '36' },
  { q: 'Top AI writing tools for teams?', rank: '#1', visibility: '69%', citations: '28' },
] as const

function TrendChart() {
  const line = 'M48 115 C100 112, 128 106, 160 103 C210 98, 236 96, 272 90 C328 82, 352 74, 384 69 C430 60, 458 56, 496 53'
  return (
    <svg viewBox="0 0 540 180" className="h-[180px] w-full">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ORANGE} stopOpacity="0.28" />
          <stop offset="100%" stopColor={ORANGE} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[16, 47, 78, 109, 140].map((y, i) => (
        <g key={y}>
          <line x1="40" x2="520" y1={y} y2={y} stroke="#F6EBE3" />
          <text x="0" y={y + 4} fill="#A8A29E" fontSize="11">{80 - i * 10}%</text>
        </g>
      ))}
      <path className="chart-area" d={`${line} L496 140 L48 140 Z`} fill="url(#trendFill)" />
      <path className="chart-draw" d={line} fill="none" stroke={ORANGE} strokeWidth="3" strokeLinecap="round" pathLength={1} />
      <circle cx="496" cy="53" r="5" fill="#fff" stroke={ORANGE} strokeWidth="3" />
      <g>
        <rect x="454" y="24" width="46" height="22" rx="11" fill="#fff" stroke="#FFE1CC" />
        <text x="477" y="39" textAnchor="middle" fill="#1A1A1A" fontSize="11" fontWeight="700">68%</text>
      </g>
      {['Mar 1', 'Mar 8', 'Mar 15', 'Mar 22', 'Mar 29'].map((label, i) => (
        <text key={label} x={48 + i * 112} y="168" fill="#A8A29E" fontSize="11">{label}</text>
      ))}
    </svg>
  )
}

function ShareDonut() {
  const r = 42
  const c = 2 * Math.PI * r
  const gap = 3
  let acc = 0
  return (
    <svg viewBox="0 0 120 120" className="h-[148px] w-[148px] -rotate-90">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#FFF1E6" strokeWidth="12" />
      {SHARE.map((slice) => {
        const len = Math.max(0, (slice.value / 100) * c - gap)
        const node = (
          <circle
            key={slice.key}
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={slice.color}
            strokeWidth="12"
            strokeLinecap="butt"
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-acc}
          />
        )
        acc += (slice.value / 100) * c
        return node
      })}
    </svg>
  )
}

export function PreviewBoard() {
  const t = useTranslations('home')

  return (
    <div className="overflow-hidden rounded-[28px] border bg-white shadow-[0_30px_80px_rgba(232,93,12,0.12),0_8px_30px_rgba(28,25,23,0.06)]" style={{ borderColor: LINE }}>
      <div className="grid lg:grid-cols-[188px_1fr]">
        <aside className="hidden border-b bg-[#FFFCF9] p-3 lg:block lg:border-b-0 lg:border-r" style={{ borderColor: LINE }}>
          <ul className="space-y-1">
            {SIDE.map((item) => (
              <li key={item.key}>
                <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium ${item.active ? 'bg-[#E85D0C] text-white shadow-[0_8px_16px_rgba(232,93,12,0.28)]' : 'text-[#8A847E]'}`}>
                  <item.icon className="h-4 w-4" strokeWidth={1.8} />
                  {t(item.key)}
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex flex-wrap items-start gap-3">
            <OwlBadge size={36} />
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-[#1A1A1A]">{t('previewTitle')}</p>
              <p className="text-[12px] text-[#8A847E]">{t('previewSubtitle')}</p>
            </div>
            <span className="ml-auto inline-flex items-center rounded-full border bg-white px-3 py-1.5 text-[12px] font-medium text-[#6F6A66]" style={{ borderColor: LINE }}>
              {t('previewRange')}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {METRICS.map((metric) => (
              <article key={metric.label} className="rounded-2xl border bg-white px-4 py-3" style={{ borderColor: LINE }}>
                <p className="flex items-center gap-1.5 text-[12px] text-[#8A847E]">
                  <metric.icon className="h-3.5 w-3.5 text-[#E85D0C]" strokeWidth={2} />
                  {t(metric.label)}
                </p>
                <p className="mt-1.5 flex items-end gap-2">
                  <span className="text-[26px] font-semibold leading-none tracking-tight text-[#1A1A1A]">{metric.value}</span>
                  <span className="pb-0.5 text-[12px] font-semibold text-[#16A34A]">{metric.delta}</span>
                </p>
              </article>
            ))}
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-[1.35fr_0.85fr]">
            <article className="rounded-2xl border p-4" style={{ borderColor: LINE }}>
              <p className="text-[13px] font-semibold text-[#1A1A1A]">{t('trendTitle')}</p>
              <TrendChart />
            </article>
            <article className="rounded-2xl border p-4" style={{ borderColor: LINE }}>
              <p className="text-[13px] font-semibold text-[#1A1A1A]">{t('platformsTitle')}</p>
              <ul className="mt-4 space-y-3.5">
                {PLATFORMS.map((platform, index) => (
                  <li key={platform.name}>
                    <div className="mb-1.5 flex items-center gap-2 text-[12px]">
                      <Favicon host={platform.host} className="h-4 w-4 rounded-full" />
                      <span className="font-medium text-[#3F3A36]">{platform.name}</span>
                      <span className="ml-auto font-semibold text-[#1A1A1A]">{platform.value}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#FFF1E6]">
                      <div className="bar-grow h-full rounded-full bg-[#E85D0C]" style={{ width: `${platform.value}%`, animationDelay: `${index * 90}ms` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            <article className="rounded-2xl border p-4" style={{ borderColor: LINE }}>
              <p className="text-[13px] font-semibold text-[#1A1A1A]">{t('shareTitle')}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <div className="relative grid h-[148px] w-[148px] place-items-center">
                  <ShareDonut />
                  <div className="absolute text-center">
                    <p className="text-[22px] font-semibold leading-none text-[#1A1A1A]">34%</p>
                    <p className="mt-1 text-[11px] text-[#8A847E]">{t('yourBrand')}</p>
                  </div>
                </div>
                <ul className="min-w-[160px] flex-1 space-y-2 text-[12px]">
                  {SHARE.map((slice) => (
                    <li key={slice.key} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
                      <span className="text-[#6F6A66]">{t(slice.key)}</span>
                      <span className="ml-auto font-semibold text-[#1A1A1A]">{slice.value}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <article className="rounded-2xl border p-4" style={{ borderColor: LINE }}>
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold text-[#1A1A1A]">{t('promptsTitle')}</p>
                <a href="#start" className="ml-auto text-[12px] font-semibold text-[#E85D0C] hover:underline">{t('viewAll')}</a>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-[12px]">
                  <thead className="text-[#A8A29E]">
                    <tr>
                      <th className="pb-2 font-medium">{t('colPrompt')}</th>
                      <th className="pb-2 font-medium">{t('colRank')}</th>
                      <th className="pb-2 font-medium">{t('colVisibility')}</th>
                      <th className="pb-2 text-right font-medium">{t('colCitations')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PROMPTS.map((row) => (
                      <tr key={row.q} className="border-t" style={{ borderColor: LINE }}>
                        <td className="max-w-[180px] truncate py-2.5 pr-3 font-medium text-[#1A1A1A]">{row.q}</td>
                        <td className="py-2.5 pr-3">
                          <span className="rounded-full bg-[#FFF1E6] px-2 py-0.5 font-semibold text-[#C44708]">{row.rank}</span>
                        </td>
                        <td className="py-2.5 pr-3 text-[#3F3A36]">{row.visibility}</td>
                        <td className="py-2.5 text-right font-medium text-[#1A1A1A]">{row.citations}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  )
}
