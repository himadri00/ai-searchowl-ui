import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { clerkServerEnabled } from '@/lib/clerk'
import { brandCookie, cleanDomain, cleanWorkspaceId, workspaceCookie } from '@/lib/server/scope'

const cookieOptions = { path: '/', sameSite: 'lax', httpOnly: true, maxAge: 60 * 60 * 24 * 365 } as const

/**
 * Saves the switcher's pick (workspace + brand) in httpOnly cookies. The
 * /api/v2 proxy reads them on every call, so the browser never sends
 * org_id, workspace_id, or target_domain itself.
 */
export async function POST(request: NextRequest) {
  if (clerkServerEnabled()) {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { detail: { error_code: 'SIGN_IN_REQUIRED', message: 'You are signed out. Sign in again, then reload this page.' } },
        { status: 401 },
      )
    }
  }
  const body = (await request.json().catch(() => null)) as { workspaceId?: unknown; domain?: unknown } | null
  const workspaceId = cleanWorkspaceId(typeof body?.workspaceId === 'string' ? body.workspaceId : null)
  if (!workspaceId) {
    return NextResponse.json(
      { detail: { error_code: 'WORKSPACE_INVALID', message: 'Pick a workspace from the list. If the list is empty, finish setup first to create one.' } },
      { status: 400 },
    )
  }
  const response = NextResponse.json({ workspaceId })
  response.cookies.set(workspaceCookie, workspaceId, cookieOptions)
  const domain = cleanDomain(typeof body?.domain === 'string' ? body.domain : null)
  if (domain) response.cookies.set(brandCookie, domain, cookieOptions)
  return response
}
