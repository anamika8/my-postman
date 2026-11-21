/**
 * Runtime configuration. Everything here comes from Vite env vars (see .env.example),
 * so the same build can point at any TDaaS backend.
 */
const env = import.meta.env

export const config = {
  apiBaseUrl: (env.VITE_API_BASE_URL ?? '').replace(/\/+$/, ''),
  paths: {
    health: env.VITE_HEALTH_PATH || '/health-check',
    workflows: env.VITE_WORKFLOWS_PATH || '/workflows',
    retrieve: env.VITE_RETRIEVE_PATH || '/retrieve',
    suggestPrompts: env.VITE_SUGGEST_PROMPTS_PATH || '/suggest-prompts',
  },
  jiraUrl: env.VITE_JIRA_URL || '',
  useMocks: env.VITE_USE_MOCKS === 'true',
  /** How often the header re-checks health in the background (ms). 0 turns it off. */
  healthPollMs: 60_000,
}

export function apiUrl(path: string): string {
  return config.apiBaseUrl + path
}
