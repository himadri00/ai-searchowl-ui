'use client'

import { useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { v2Get } from '@/lib/v2'
import type { OnboardingStatus } from './onboarding-api'

/**
 * Sends a user who has not finished setup to /onboarding. Errors are ignored:
 * until the API has the onboarding route, every page stays reachable.
 */
export function useOnboardingRedirect(active: boolean) {
  const router = useRouter()

  useEffect(() => {
    if (!active) return
    let cancel = false
    v2Get<{ status: OnboardingStatus; workspaceId?: string; awaitingChoice?: boolean }>('onboarding')
      .then((state) => {
        const promptsReady = state.status === 'completed' || Boolean(state.workspaceId) || Boolean(state.awaitingChoice)
        if (!cancel && !promptsReady) router.replace('/onboarding')
      })
      .catch(() => undefined)
    return () => {
      cancel = true
    }
  }, [active, router])
}
