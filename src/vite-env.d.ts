/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_HEALTH_PATH?: string
  readonly VITE_WORKFLOWS_PATH?: string
  readonly VITE_RETRIEVE_PATH?: string
  readonly VITE_SUGGEST_PROMPTS_PATH?: string
  readonly VITE_JIRA_URL?: string
  readonly VITE_ENVIRONMENTS_URL?: string
  readonly VITE_USE_MOCKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.txt?raw' {
  const content: string
  export default content
}
