'use client'

import { useEffect, useState } from 'react'

export type V2Query = Record<string, string | number | boolean | string[] | undefined | null>

export function readApiError(body: unknown, status: number) {
  if (body && typeof body === 'object' && 'detail' in body) {
    const detail = (body as { detail: unknown }).detail
    if (typeof detail === 'string' && detail.trim()) return detail
    if (detail && typeof detail === 'object' && !Array.isArray(detail) && 'message' in detail) {
      const message = (detail as { message: unknown }).message
      if (typeof message === 'string' && message.trim()) return message
    }
    if (Array.isArray(detail)) {
      const first = detail.find((item) => item && typeof item === 'object' && 'msg' in item) as { msg?: unknown } | undefined
      if (typeof first?.msg === 'string') return first.msg.replace(/^Value error,\s*/i, '')
    }
  }
  return `This page could not be loaded (status ${status}). Try again.`
}

export class V2Error extends Error {
  status: number
  code: string | null

  constructor(message: string, status: number, code: string | null) {
    super(message)
    this.status = status
    this.code = code
  }
}

function readErrorCode(body: unknown) {
  if (!body || typeof body !== 'object' || !('detail' in body)) return null
  const detail = (body as { detail: unknown }).detail
  if (detail && typeof detail === 'object' && !Array.isArray(detail) && 'error_code' in detail) {
    const code = (detail as { error_code: unknown }).error_code
    if (typeof code === 'string') return code
  }
  return null
}

async function readResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new V2Error(readApiError(body, response.status), response.status, readErrorCode(body))
  return body as T
}

export async function v2Send<T>(method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/v2/${path.replace(/^\//, '')}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  })
  return readResponse<T>(response)
}

export async function v2SendText<T>(path: string, text: string, contentType: string): Promise<T> {
  const response = await fetch(`/api/v2/${path.replace(/^\//, '')}`, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: text,
    cache: 'no-store',
  })
  return readResponse<T>(response)
}

export function errorText(error: unknown, fallback = 'The request failed. Check your connection, then try again.') {
  return error instanceof Error && error.message ? error.message : fallback
}

export async function v2Poll<T>(path: string, done: (body: T) => boolean, { every = 1500, tries = 80 } = {}): Promise<T> {
  let body = await v2Get<T>(path)
  for (let attempt = 0; attempt < tries && !done(body); attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, every))
    body = await v2Get<T>(path)
  }
  if (!done(body)) throw new V2Error('This is taking longer than expected. Refresh the page in a minute to see the result.', 408, 'POLL_TIMEOUT')
  return body
}

export async function v2Get<T>(path: string, query?: V2Query): Promise<T> {
  const url = new URL(`/api/v2/${path.replace(/^\//, '')}`, window.location.origin)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue
      if (Array.isArray(value)) {
        if (!value.length) continue
        value.forEach((item) => url.searchParams.append(key, item))
      } else {
        url.searchParams.set(key, String(value))
      }
    }
  }
  const response = await fetch(url, { cache: 'no-store' })
  return readResponse<T>(response)
}

function queryKey(path: string, query?: V2Query) {
  const entries = Object.entries(query ?? {}).sort(([a], [b]) => a.localeCompare(b))
  return `${path}?${JSON.stringify(entries)}`
}

/**
 * Scoped screens (prompts, overview, sources) must not call the API until the
 * signed-in workspace and brand are saved. Otherwise the first call fails
 * with "no workspace" and the screen keeps that error after setup finishes.
 */
let selectionState: 'pending' | 'ready' | 'missing' = 'pending'
let selectionVersion = 0
const selectionListeners = new Set<() => void>()

function bumpSelection(next: 'pending' | 'ready' | 'missing') {
  selectionState = next
  selectionVersion += 1
  selectionListeners.forEach((listener) => listener())
}

export function markSelectionPending() {
  if (selectionState !== 'ready') bumpSelection('pending')
}

export function markSelectionReady() {
  bumpSelection('ready')
}

export function markSelectionMissing() {
  if (selectionState !== 'ready') bumpSelection('missing')
}

function useSelectionVersion() {
  const [version, setVersion] = useState(selectionVersion)
  useEffect(() => {
    const listener = () => setVersion(selectionVersion)
    selectionListeners.add(listener)
    return () => {
      selectionListeners.delete(listener)
    }
  }, [])
  return version
}

export function useV2<T>(path: string | null, query?: V2Query) {
  const key = path ? queryKey(path, query) : ''
  const [nonce, setNonce] = useState(0)
  const version = useSelectionVersion()
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({
    data: null,
    error: null,
    loading: Boolean(path),
  })

  useEffect(() => {
    if (!path) return
    if (selectionState === 'pending') {
      setState({ data: null, error: null, loading: true })
      return
    }
    if (selectionState === 'missing') {
      setState({ data: null, error: null, loading: false })
      return
    }
    let cancel = false
    setState((current) => ({ ...current, loading: true, error: null }))
    v2Get<T>(path, query)
      .then((data) => {
        if (!cancel) setState({ data, error: null, loading: false })
      })
      .catch((error: unknown) => {
        if (cancel) return
        setState({ data: null, error: error instanceof Error ? error.message : 'This page could not be loaded. Try again.', loading: false })
      })
    return () => {
      cancel = true
    }
    // query is serialized into key; version bumps when the workspace is saved
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce, version])

  return { ...state, reload: () => setNonce((current) => current + 1) }
}

export function rangeQuery(range: 'all' | '7d' | '30d' | '90d' | '7' | '14' | '30' | '90' | '180' | '365') {
  if (range === 'all') return { start_date: 'all' }
  const days = Number.parseInt(range, 10)
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (days - 1))
  const iso = (date: Date) => date.toISOString().slice(0, 10)
  return { start_date: iso(start), end_date: iso(end) }
}
