import type { RetrieveRequest } from './api/types'

export interface PromptField {
  key: number
  text: string
}

export interface RetrieveForm {
  app: string
  testCaseId: string
  apiHost: string
  targetIp: string
  customer: string
  prompts: PromptField[]
  bypassCache: boolean
}

export const emptyForm: RetrieveForm = {
  app: '',
  testCaseId: '',
  apiHost: '',
  targetIp: '',
  customer: '',
  prompts: [{ key: 1, text: '' }],
  bypassCache: false,
}

export function toRequest(f: RetrieveForm): RetrieveRequest {
  return {
    application_name: f.app.trim(),
    environment: {
      api_host_ip: f.apiHost.trim(),
      target_server_ip: f.targetIp.trim(),
      customer_name: f.customer.trim(),
    },
    prompts: f.prompts.map((p) => p.text.trim()).filter(Boolean),
    bypass_cache: f.bypassCache,
    test_case_id: f.testCaseId.trim(),
  }
}

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/
/** Accepts IPv4, IPv6, or a hostname, optionally with a port. */
export function looksLikeHost(v: string): boolean {
  const s = v.trim()
  if (!s) return false
  if (s.includes(':') && !/^[^:]+:\d+$/.test(s)) return /^[0-9a-f:.]+$/i.test(s) // IPv6
  const host = s.replace(/:\d+$/, '')
  if (/^[\d.]+$/.test(host)) return IPV4.test(host)
  return IPV4.test(host) || /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i.test(host)
}
