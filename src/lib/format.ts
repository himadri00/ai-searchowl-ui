import type { MetricKey } from '@/data/types'

const dateLocale = (locale: string) => (locale === 'en' ? 'en-GB' : locale)

export function formatNumber(value: number, locale: string, digits = 1) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatPercent(value: number, locale: string, digits = 1) {
  return `${formatNumber(value, locale, digits)}%`
}

export function formatCompact(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatChartDate(iso: string, locale: string, withYear = false) {
  const key = iso.trim().slice(0, 10)
  return new Intl.DateTimeFormat(dateLocale(locale), {
    day: 'numeric',
    month: 'short',
    year: withYear ? 'numeric' : undefined,
  }).format(new Date(`${key}T00:00:00`))
}

function dayKey(iso: string) {
  return iso.trim().slice(0, 10)
}

function weekStartKey(iso: string) {
  const date = new Date(`${dayKey(iso)}T00:00:00`)
  const weekday = date.getDay()
  date.setDate(date.getDate() - (weekday === 0 ? 6 : weekday - 1))
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Sum a daily series into days, Monday-start weeks, or calendar months. */
export function bucketChart(dates: string[], values: number[], resolution: 'day' | 'week' | 'month', locale: string) {
  const groups = new Map<string, number>()
  dates.forEach((date, index) => {
    const key = dayKey(date)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return
    const bucket = resolution === 'week' ? weekStartKey(key) : resolution === 'month' ? key.slice(0, 7) : key
    groups.set(bucket, (groups.get(bucket) ?? 0) + (Number(values[index]) || 0))
  })
  const keys = [...groups.keys()].sort()
  return {
    labels: keys.map((key) => {
      if (resolution === 'month') {
        return new Intl.DateTimeFormat(dateLocale(locale), { month: 'short', year: 'numeric' }).format(new Date(`${key}-01T00:00:00`))
      }
      return formatChartDate(key, locale)
    }),
    values: keys.map((key) => groups.get(key) ?? 0),
  }
}

export function browserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

/** Calendar day in the browser's timezone, as YYYY-MM-DD. */
export function browserTodayKey(now = new Date(), timeZone = browserTimeZone()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  return year && month && day ? `${year}-${month}-${day}` : ''
}

/**
 * A date-only value stays that calendar day. A timestamp becomes the calendar
 * day in the browser's timezone, so "today" follows the user's location.
 */
export function runCalendarKey(value: string) {
  const text = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) return ''
  return browserTodayKey(parsed, browserTimeZone())
}

export function isBrowserToday(value: string, now = new Date()) {
  const key = runCalendarKey(value)
  return Boolean(key) && key === browserTodayKey(now)
}

export function daysBeforeBrowserToday(value: string, now = new Date()) {
  const key = runCalendarKey(value)
  const today = browserTodayKey(now)
  if (!key || !today) return null
  const start = Date.parse(`${key}T00:00:00`)
  const end = Date.parse(`${today}T00:00:00`)
  if (Number.isNaN(start) || Number.isNaN(end)) return null
  return Math.round((end - start) / 86_400_000)
}

/** Days before today for the first or last day in a series that has a retrieval. */
export function seriesSeenDays(dates: string[], series: number[] | undefined, which: 'first' | 'last', now = new Date()) {
  if (!series?.length) return null
  let index = -1
  series.forEach((value, item) => {
    if ((Number(value) || 0) <= 0) return
    if (which === 'first' && index < 0) index = item
    if (which === 'last') index = item
  })
  if (index < 0) return null
  const key = dates[index]
  return key ? daysBeforeBrowserToday(key, now) : null
}

export function formatMetricValue(metric: MetricKey, value: number, locale: string) {
  if (metric === 'position') return `#${formatNumber(value, locale, 1)}`
  if (metric === 'sentiment') return `+${formatNumber(value, locale, 0)}`
  return formatPercent(value, locale, value >= 100 ? 1 : 1)
}

export function formatMatrixValue(metric: MetricKey, value: number, locale: string) {
  if (metric === 'position') return formatNumber(value, locale, 1)
  if (metric === 'sentiment') return formatNumber(value, locale, 0)
  return formatPercent(value, locale, 1)
}

export function formatDelta(metric: MetricKey, delta: number, locale: string) {
  const sign = delta > 0 ? '+' : ''
  if (metric === 'position') return `${sign}${formatNumber(delta, locale, 1)}`
  if (metric === 'sentiment') return `${sign}${formatNumber(delta, locale, 0)}`
  return `${sign}${formatPercent(delta, locale, 1)}`
}

function hexToRgb(hex: string) {
  const value = hex.replace('#', '')
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16))
}

function mix(from: string, to: string, amount: number) {
  const start = hexToRgb(from)
  const end = hexToRgb(to)
  const channels = start.map((channel, index) => Math.round(channel + (end[index] - channel) * amount))
  return `rgb(${channels.join(',')})`
}

export function heatStyle(metric: MetricKey, value: number) {
  if (metric === 'position') {
    const strength = 1 - Math.min(1, Math.max(0, (value - 1) / 9))
    return {
      background: mix('#FFF1E6', '#E85D0C', 0.35 + strength * 0.65),
      color: strength > 0.45 ? '#ffffff' : '#000000',
      width: `${Math.round(72 + strength * 24)}%`,
    }
  }

  if (metric === 'sentiment') {
    const strength = Math.min(1, Math.max(0, (value - 40) / 40))
    return {
      background: mix('#FFF1E6', '#E85D0C', 0.25 + strength * 0.75),
      color: strength > 0.55 ? '#ffffff' : '#000000',
      width: `${Math.round(58 + strength * 34)}%`,
    }
  }

  const strength = Math.min(1, value / 100)
  const width = value < 1 ? 18 : Math.min(96, Math.round(46 + Math.pow(strength, 0.45) * 50))
  const amount = Math.min(1, Math.max(0.16, Math.pow(Math.min(1, value / 48), 0.75)))
  return {
    background: mix('#ffffff', '#E85D0C', amount),
    color: amount > 0.55 ? '#ffffff' : '#000000',
    width: `${width}%`,
  }
}
