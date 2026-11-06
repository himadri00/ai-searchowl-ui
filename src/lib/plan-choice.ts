export const PLAN_MAX = { lite: 15, standard: 100, premium: 400, enterprise: 1000 } as const

export type PlanId = keyof typeof PLAN_MAX

export const PLAN_STORAGE = 'nuw_plan'

export type PlanChoice = { plan: PlanId; prompts: number }

function normalize(plan: string | null, prompts: string | number | null): PlanChoice | null {
  if (!plan || !(plan in PLAN_MAX)) return null
  const max = PLAN_MAX[plan as PlanId]
  const value = typeof prompts === 'number' ? prompts : Number(prompts)
  if (!Number.isInteger(value) || value < 1 || value > max) return null
  return { plan: plan as PlanId, prompts: value }
}

function readStored(): PlanChoice | null {
  try {
    const raw = window.localStorage.getItem(PLAN_STORAGE)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { plan?: string; prompts?: number }
    return normalize(parsed.plan ?? null, parsed.prompts ?? null)
  } catch {
    return null
  }
}

/** The plan and daily prompt count saved on this browser, or the same pair in the page address. */
export function readPlanChoice(): PlanChoice | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const fromUrl = normalize(params.get('plan'), params.get('prompts'))
  const choice = fromUrl ?? readStored()
  if (choice) window.localStorage.setItem(PLAN_STORAGE, JSON.stringify(choice))
  return choice
}

export function savePlanChoice(choice: PlanChoice) {
  window.localStorage.setItem(PLAN_STORAGE, JSON.stringify(choice))
}
