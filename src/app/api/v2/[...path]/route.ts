import { clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { brandCookie, cleanDomain, cleanWorkspaceId, getScope, noBrandMessage, noWorkspaceMessage, workspaceCookie, type Scope } from '@/lib/server/scope'

type Level = 'org' | 'workspace' | 'scoped'

/**
 * How much identity a backend route needs. Onboarding creates the workspace,
 * so it (and the plan catalog) must work with only the org. One workspace's
 * own routes take the workspace from the URL. Everything else reads one
 * brand in one workspace.
 */
function levelOf(parts: string[]): Level {
  const [first, second] = parts
  if (first === 'onboarding' || first === 'catalog' || first === 'admin' || first === 'plans' || first === 'plan') return 'org'
  if (first === 'workspaces') return parts.length === 1 ? 'org' : 'workspace'
  if (first === 'prompt-runs') {
    if (second === 'engines' || second === 'countries' || second === 'results') return 'org'
    if (second === 'chats' && parts.length === 3) return 'org'
    if (parts.length >= 2 && second !== 'overview' && second !== 'matrix' && second !== 'rankings' && second !== 'chats') return 'org'
    return 'scoped'
  }
  if (first === 'perception' && second === 'facts' && parts[2] === 'check' && parts.length === 4) return 'org'
  return 'scoped'
}

function fail(code: string, message: string, status: number) {
  return NextResponse.json({ detail: { error_code: code, message } }, { status })
}

async function userEmail(userId: string) {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    return user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null
  } catch {
    return null
  }
}

async function proxy(request: NextRequest, path: string[]) {
  const scope = await getScope(request)
  if (!scope.ok) return fail(scope.code, scope.message, scope.status)

  const parts = [...path]
  const level = levelOf(parts)

  // The workspace in the URL wins. `current` means the switcher's pick.
  let workspaceId = scope.workspaceId
  if (parts[0] === 'workspaces' && parts.length >= 2) {
    if (parts[1] === 'current') {
      if (!workspaceId) return fail('WORKSPACE_NOT_SELECTED', noWorkspaceMessage, 409)
      parts[1] = workspaceId
    } else {
      workspaceId = cleanWorkspaceId(parts[1]) ?? workspaceId
    }
  }
  if (level !== 'org' && !workspaceId) return fail('WORKSPACE_NOT_SELECTED', noWorkspaceMessage, 409)
  if (level === 'scoped' && !scope.targetDomain) return fail('BRAND_NOT_SELECTED', noBrandMessage, 409)

  const target = new URL(`${scope.baseUrl}/v2/${parts.map(encodeURIComponent).join('/')}`)
  request.nextUrl.searchParams.forEach((value, key) => {
    if (key === 'org_id' || key === 'workspace_id' || key === 'target_domain') return
    target.searchParams.append(key, value)
  })
  target.searchParams.set('org_id', scope.orgId)
  if (level !== 'org' && workspaceId) target.searchParams.set('workspace_id', workspaceId)
  if (level === 'scoped' && scope.targetDomain) target.searchParams.set('target_domain', scope.targetDomain)

  const headers = new Headers()
  headers.set('Accept', 'application/json')
  if (scope.apiKey) headers.set('Authorization', `Bearer ${scope.apiKey}`)
  headers.set('X-User-Id', scope.userId)
  if (parts[0] === 'onboarding') {
    const email = await userEmail(scope.userId)
    if (email) headers.set('X-User-Email', email)
  }
  const contentType = request.headers.get('content-type')
  if (contentType) headers.set('Content-Type', contentType)

  let body: string | undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const text = await request.text()
    if (text && contentType?.includes('application/json')) {
      try {
        const parsed = JSON.parse(text) as unknown
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const record = parsed as Record<string, unknown>
          record.org_id = scope.orgId
          if (level !== 'org' && workspaceId) record.workspace_id = workspaceId
          if (level === 'scoped' && scope.targetDomain) record.target_domain = scope.targetDomain
          body = JSON.stringify(record)
        } else {
          body = text
        }
      } catch {
        body = text
      }
    } else if (text) {
      body = text
    }
  }

  let upstream: Response
  try {
    upstream = await fetch(target, { method: request.method, headers, body, cache: 'no-store' })
  } catch {
    return fail('API_UNREACHABLE', 'This page could not be loaded. Try again in a moment.', 503)
  }

  const text = await upstream.text()

  // The deployed API may not have GET /v2/workspaces yet. Setup already saved
  // this workspace, and its id is in the cookie, so build the list from the
  // workspace the API does know about.
  if (request.method === 'GET' && parts.length === 1 && parts[0] === 'workspaces' && upstream.status === 404 && workspaceId) {
    const detail = await readWorkspace(scope, workspaceId, headers)
    let brands = detail?.brands ?? []
    if (!brands.length) {
      const domain = await onboardingBrand(scope, headers)
      if (domain) brands = [{ id: domain, name: domain, domain, initials: domain.slice(0, 2).toUpperCase(), color: '#E85D0C' }]
    }
    if (detail || brands.length) {
      const domain = cleanDomain(brands[0]?.domain)
      const response = NextResponse.json({
        workspaces: [{ id: workspaceId, name: detail?.name || brands[0]?.name || 'Workspace', mode: detail?.mode ?? 'solo', brands }],
        limit: null,
        used: 1,
        canCreate: false,
      })
      response.cookies.set(workspaceCookie, workspaceId, cookieOptions)
      if (domain) response.cookies.set(brandCookie, domain, cookieOptions)
      return response
    }
  }

  const empty = upstream.status === 204 || upstream.status === 205 || upstream.status === 304
  const response = new NextResponse(empty ? null : text, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  })
  if (upstream.ok && parts[0] === 'onboarding') {
    const created = createdWorkspace(text)
    if (created) response.cookies.set(workspaceCookie, created, cookieOptions)
    const workspaceForBrand = created || scope.workspaceId
    let domain = onboardingDomain(text)
    if (!domain && created && !scope.targetDomain) {
      domain = cleanDomain((await readWorkspace(scope, created, headers))?.brands[0]?.domain)
    }
    if (domain && workspaceForBrand && !scope.targetDomain) response.cookies.set(brandCookie, domain, cookieOptions)
  }
  if (upstream.ok && request.method === 'POST' && parts[0] === 'workspaces' && parts.length === 1) {
    const created = createdWorkspaceBody(text)
    if (created) {
      response.cookies.set(workspaceCookie, created.id, cookieOptions)
      if (created.domain) response.cookies.set(brandCookie, created.domain, cookieOptions)
    }
  }
  return response
}

const cookieOptions = { path: '/', sameSite: 'lax', httpOnly: true, maxAge: 60 * 60 * 24 * 365 } as const

type ReadyScope = Extract<Scope, { ok: true }>

async function onboardingBrand(scope: ReadyScope, headers: Headers) {
  try {
    const url = new URL(`${scope.baseUrl}/v2/onboarding`)
    url.searchParams.set('org_id', scope.orgId)
    const requestHeaders = new Headers(headers)
    if (!requestHeaders.has('X-User-Email')) {
      const email = await userEmail(scope.userId)
      if (email) requestHeaders.set('X-User-Email', email)
    }
    const upstream = await fetch(url, { headers: requestHeaders, cache: 'no-store' })
    if (!upstream.ok) return null
    const body = (await upstream.json()) as { status?: unknown; draft?: { domain?: unknown } }
    if (body?.status !== 'completed') return null
    return cleanDomain(typeof body.draft?.domain === 'string' ? body.draft.domain : null)
  } catch {
    return null
  }
}

async function readWorkspace(scope: ReadyScope, workspaceId: string, headers: Headers) {
  try {
    const url = new URL(`${scope.baseUrl}/v2/workspaces/${encodeURIComponent(workspaceId)}`)
    url.searchParams.set('org_id', scope.orgId)
    const upstream = await fetch(url, { headers, cache: 'no-store' })
    if (!upstream.ok) return null
    const body = (await upstream.json()) as { mode?: unknown; brands?: { id?: string; name?: string; domain?: string; initials?: string; color?: string }[] }
    const brands = (body.brands ?? []).flatMap((brand) => {
      const domain = cleanDomain(typeof brand.domain === 'string' ? brand.domain : null)
      if (!domain || typeof brand.id !== 'string' || !brand.id) return []
      return [{ id: brand.id, name: brand.name || domain, domain, initials: brand.initials || domain.slice(0, 2).toUpperCase(), color: brand.color || '#E85D0C' }]
    })
    return { mode: body.mode === 'agency' ? 'agency' as const : 'solo' as const, brands, name: brands[0]?.name || '' }
  } catch {
    return null
  }
}

function onboardingDomain(text: string) {
  try {
    const body = JSON.parse(text) as { status?: unknown; draft?: { domain?: unknown }; result?: { domain?: unknown } }
    const finished = body?.status === 'completed' || Boolean(body?.result)
    if (!finished) return null
    const raw = body?.draft?.domain ?? body?.result?.domain
    return cleanDomain(typeof raw === 'string' ? raw : null)
  } catch {
    return null
  }
}

function createdWorkspace(text: string) {
  try {
    const body = JSON.parse(text) as { workspaceId?: unknown; result?: { workspaceId?: unknown } }
    return cleanWorkspaceId(typeof (body?.result?.workspaceId ?? body?.workspaceId) === 'string' ? ((body?.result?.workspaceId ?? body?.workspaceId) as string) : null)
  } catch {
    return null
  }
}

function createdWorkspaceBody(text: string) {
  try {
    const body = JSON.parse(text) as { id?: unknown; brands?: { domain?: unknown }[] }
    const id = cleanWorkspaceId(typeof body?.id === 'string' ? body.id : null)
    if (!id) return null
    const domain = typeof body.brands?.[0]?.domain === 'string' ? body.brands[0].domain : null
    return { id, domain }
  } catch {
    return null
  }
}

type RouteContext = { params: Promise<{ path: string[] }> }

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return proxy(request, path)
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return proxy(request, path)
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return proxy(request, path)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return proxy(request, path)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return proxy(request, path)
}
