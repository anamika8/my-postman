/** Body sent to POST /retrieve. Key names are assumptions: change them here if the API differs. */
export interface RetrieveRequest {
  application_name: string
  environment: {
    api_host_ip: string
    target_server_ip: string
    customer_name: string
  }
  prompts: string[]
  bypass_cache: boolean
  test_case_id: string
}

export interface Workflow {
  name: string
  description?: string
}

export interface ApiResult<T> {
  ok: boolean
  status: number
  data: T
  /** Raw response body, for the "Raw response" view. */
  raw: unknown
  durationMs: number
}

export type HealthState = 'unknown' | 'checking' | 'up' | 'down'
