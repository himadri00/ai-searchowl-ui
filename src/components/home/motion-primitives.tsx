'use client'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react'

export const EASE = [0.22, 1, 0.36, 1] as const
export const INK = '#171411'
export const ORANGE = '#F05A0A'
export const IVORY = '#FFFAF5'
export const LINE = '#EFE2D4'

/** Behavioral analytics & A/B testing instrumentation hook */
export type AnalyticsEvent =
  | 'cta_primary_click'
  | 'demo_launch'
  | 'ai_model_interact'
  | 'website_url_submit'
  | 'simulator_prompt_select'
  | 'dashboard_interact'
  | 'competitor_switch'
  | 'before_after_toggle'
  | 'feature_gallery_select'
  | 'pricing_view'
  | 'signup_start'
  | 'faq_toggle'

export function trackHomeEvent(event: AnalyticsEvent, payload?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return
  const detail = { event, timestamp: Date.now(), ...payload }
  window.dispatchEvent(new CustomEvent('aisearchowl:analytics', { detail }))
  const w = window as unknown as { dataLayer?: Array<Record<string, unknown>> }
  if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push({ event: `aisearchowl_${event}`, ...payload })
  }
}

export function Reveal({ children, delay = 0, y = 24, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

export function SplitWords({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const reduce = useReducedMotion()
  const words = text.split(' ')
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.09em] -mb-[0.09em] align-bottom">
          <motion.span
            className="inline-block will-change-transform"
            initial={reduce ? false : { y: '108%', rotate: 3 }}
            animate={{ y: 0, rotate: 0 }}
            transition={{ duration: 0.78, delay: delay + i * 0.065, ease: EASE }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  )
}

export function AnimatedNumber({ value, suffix = '', className }: { value: number; suffix?: string; className?: string }) {
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)

  useEffect(() => {
    if (reduce) {
      setDisplay(value)
      prevRef.current = value
      return
    }
    const start = prevRef.current
    const diff = value - start
    if (diff === 0) return
    const duration = 380
    const startTime = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const elapsed = Math.min(1, (now - startTime) / duration)
      const eased = 1 - Math.pow(1 - elapsed, 3)
      setDisplay(Math.round(start + diff * eased))
      if (elapsed < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        prevRef.current = value
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, reduce])

  return (
    <span className={className}>
      {display}
      {suffix}
    </span>
  )
}

export function Magnetic({ children, strength = 0.28, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 210, damping: 16, mass: 0.35 })
  const sy = useSpring(y, { stiffness: 210, damping: 16, mass: 0.35 })
  function onMove(e: MouseEvent) {
    if (reduce || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => {
        x.set(0)
        y.set(0)
      }}
      style={{ x: sx, y: sy }}
      className={`inline-block ${className ?? ''}`}
    >
      {children}
    </motion.div>
  )
}

export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const rxv = useMotionValue(0)
  const ryv = useMotionValue(0)
  const rx = useSpring(rxv, { stiffness: 160, damping: 20 })
  const ry = useSpring(ryv, { stiffness: 160, damping: 20 })
  function onMove(e: MouseEvent) {
    if (reduce || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    ryv.set(((e.clientX - r.left) / r.width - 0.5) * 4.5)
    rxv.set(-((e.clientY - r.top) / r.height - 0.5) * 4.5)
  }
  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => {
        rxv.set(0)
        ryv.set(0)
      }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1100 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Uses <span> instead of <p> so it can safely sit inside headings, divs, or paragraphs without hydration errors */
export function SectionTag({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${
        dark
          ? 'border-[#F05A0A]/35 bg-[#F05A0A]/12 text-[#FF9A57]'
          : 'border-[#F5D6BE] bg-[#FFF4E9] text-[#F05A0A]'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dark ? 'bg-[#FF9A57]' : 'bg-[#F05A0A]'} pulse-dot`} />
      {children}
    </span>
  )
}
