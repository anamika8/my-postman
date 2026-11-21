import { apiUrl, config } from '../config'
import { mockFetch } from './mock'
import type { SavedEnvironment } from '../types'
import type { ApiResult, RetrieveRequest, Workflow } from './types'

export class ApiError extends Error {
  status: number
  raw: unknown
  constructor(message: string, status: number, raw: unknown) {
    super(message)
    this.status = status
    this.raw = raw
  }
}

async function request<T = unknown>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const started = performance.now()
  const doFetch = config.useMocks ? mockFetch : fetch
  let res: Response
  try {
    res = await doFetch(apiUrl(path), {
      ...init,
      headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
    })
  } catch (e) {
    throw new ApiError(
      'Could not reach TDaaS. Check that the service is up and that the API address is right.',
      0,
      String(e),
    )
  }
  const text = await res.text()
  let raw: unknown = text
  try {
    raw = text ? JSON.parse(text) : null
  } catch {
    /* plain-text body; keep as string */
  }
  const durationMs = Math.round(performance.now() - started)
  if (!res.ok) {
    const msg =
      (raw && typeof raw === 'object' && ('message' in raw || 'error' in raw || 'detail' in raw)
        ? String((raw as Record<string, unknown>).message ?? (raw as Record<string, unknown>).error ?? (raw as Record<string, unknown>).detail)
        : '') || `TDaaS answered with an error (${res.status} ${res.statusText}).`
    throw new ApiError(msg, res.status, raw)
  }
  return { ok: true, status: res.status, data: raw as T, raw, durationMs }
}

export async function checkHealth(): Promise<boolean> {
  try {
    await request(config.paths.health)
    return true
  } catch {
    return false
  }
}

/** Accepts a few likely shapes: ["a","b"], [{name, description}], {workflows|tools|data: [...]}. */
export function normalizeWorkflows(raw: unknown): Workflow[] {
  let list: unknown = raw
  if (list && typeof list === 'object' && !Array.isArray(list)) {
    const o = list as Record<string, unknown>
    list = o.workflows ?? o.tools ?? o.data ?? o.items ?? []
  }
  if (!Array.isArray(list)) return []
  return list
    .map((item): Workflow | null => {
      if (typeof item === 'string') return { name: item }
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>
        const name = o.name ?? o.id ?? o.tool ?? o.workflow
        if (typeof name !== 'string') return null
        const description = o.description ?? o.desc ?? o.summary
        return { name, description: typeof description === 'string' ? description : undefined }
      }
      return null
    })
    .filter((w): w is Workflow => w !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function fetchWorkflows(): Promise<Workflow[]> {
  const res = await request(config.paths.workflows)
  return normalizeWorkflows(res.data)
}

export function retrieve(body: RetrieveRequest) {
  return request(config.paths.retrieve, { method: 'POST', body: JSON.stringify(body) })
}

/** Accepts ["..."], {prompts: [...]}, {suggestions: [...]}, items as strings or {prompt|text}. */
export function normalizeSuggestions(raw: unknown): string[] {
  let list: unknown = raw
  if (list && typeof list === 'object' && !Array.isArray(list)) {
    const o = list as Record<string, unknown>
    list = o.prompts ?? o.suggestions ?? o.data ?? []
  }
  if (!Array.isArray(list)) return []
  return list
    .map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>
        const t = o.prompt ?? o.text ?? o.value
        return typeof t === 'string' ? t : ''
      }
      return ''
    })
    .filter((s) => s.trim() !== '')
}

export async function suggestPrompts(requirement: string): Promise<string[]> {
  const res = await request(config.paths.suggestPrompts, {
    method: 'POST',
    body: JSON.stringify({ requirement }),
  })
  return normalizeSuggestions(res.data)
}

/** Loads the saved environments list, skipping the browser cache so Refresh always gets the latest. */
export async function fetchEnvironments(): Promise<SavedEnvironment[]> {
  let res: Response
  try {
    res = await fetch(config.environmentsUrl, { cache: 'no-store', headers: { Accept: 'application/json' } })
  } catch {
    throw new Error("Couldn't reach the saved environments list.")
  }
  if (!res.ok) throw new Error(`Couldn't load saved environments (${res.status}).`)
  const raw: unknown = await res.json()
  const list = Array.isArray(raw) ? raw : ((raw as Record<string, unknown>)?.environments ?? [])
  if (!Array.isArray(list)) return []
  return list.filter(
    (e): e is SavedEnvironment =>
      !!e && typeof e.id === 'string' && typeof e.name === 'string' &&
      typeof e.apiHostIp === 'string' && typeof e.targetServerIp === 'string' && typeof e.customerName === 'string',
  )
}
