import { auth } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server'
import { clerkServerEnabled, missingClerkKeys } from '@/lib/clerk'

/**
 * Who a v2 call belongs to. Nothing here is read from .env.local except the
 * API address and the server-only API key:
 *
 * - org_id: the signed-in Clerk organization when one is active, otherwise
 *   the Clerk user id (a personal organization). Plans and entitlements in
 *   the backend hang off this id.
 * - workspace_id: the workspace picked in the switcher (cookie set by
 *   /api/selection, or by onboarding when it creates the workspace).
 * - target_domain: the brand picked in the switcher (same cookie route).
 *
 * Onboarding and the catalog only need the org. Data screens need all three;
 * when one is missing the proxy answers with a message that says exactly
 * what to do next instead of guessing.
 */
export type Scope =
  | {
      ok: true
      baseUrl: string
      apiKey: string
      orgId: string
      userId: string
      workspaceId: string | null
      targetDomain: string | null
    }
  | { ok: false; code: string; status: number; message: string }

export const workspaceCookie = 'nuw_workspace'
export const brandCookie = 'nuw_brand'

const workspaceIdPattern = /^[A-Za-z0-9_-]{3,64}$/
// A normal host such as example.com. The previous pattern required an extra
// dot, so example.com was rejected and the brand cookie was never saved.
const domainPattern = /^(?=.{3,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/

export function cleanWorkspaceId(value: string | undefined | null) {
  return value && workspaceIdPattern.test(value) ? value : null
}

export function cleanDomain(value: string | undefined | null) {
  const domain = (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/^www\./, '')
    .split(/[/?#]/)[0]
    .replace(/:\d+$/, '')
    .replace(/\.$/, '')
  return domainPattern.test(domain) ? domain : null
}

export async function getScope(request: NextRequest): Promise<Scope> {
  const baseUrl = process.env.API_BASE_URL?.trim().replace(/\/$/, '') ?? ''
  if (!baseUrl) {
    return {
      ok: false,
      code: 'ENV_MISSING',
      status: 503,
      message: 'Add API_BASE_URL to .env.local in the project root, then restart the dev server. API_BASE_URL is the address of the backend API.',
    }
  }
  if (!clerkServerEnabled()) {
    return {
      ok: false,
      code: 'ENV_MISSING',
      status: 503,
      message: `Sign-in is not set up yet, so we do not know whose workspace to show. Add ${missingClerkKeys().join(', ') || 'the Clerk keys'} to .env.local, then restart the dev server.`,
    }
  }
  const { userId, orgId } = await auth()
  if (!userId) {
    return {
      ok: false,
      code: 'SIGN_IN_REQUIRED',
      status: 401,
      message: 'You are signed out. Sign in again, then reload this page.',
    }
  }
  return {
    ok: true,
    baseUrl,
    apiKey: process.env.API_KEY?.trim() ?? '',
    // Option A: Clerk organization when one is active, else a personal org.
    orgId: orgId ?? userId,
    userId,
    workspaceId: cleanWorkspaceId(request.cookies.get(workspaceCookie)?.value),
    targetDomain: cleanDomain(request.cookies.get(brandCookie)?.value),
  }
}

export const noWorkspaceMessage =
  'No workspace is selected yet. If this is your first visit, finish setup to create your first workspace. If you already have one, pick it in the workspace switcher at the top of the sidebar.'

export const noBrandMessage =
  'No brand is selected in this workspace yet. Pick a brand in the switcher at the top of the sidebar. If this workspace has no brand yet, add its first brand from the switcher.'
