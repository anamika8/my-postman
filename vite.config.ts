import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.TDAAS_PROXY_TARGET
  const paths = [
    env.VITE_HEALTH_PATH || '/health-check',
    env.VITE_WORKFLOWS_PATH || '/workflows',
    env.VITE_RETRIEVE_PATH || '/retrieve',
    env.VITE_SUGGEST_PROMPTS_PATH || '/suggest-prompts',
  ]
  return {
    plugins: [react()],
    server: target
      ? { proxy: Object.fromEntries(paths.map((p) => [p, { target, changeOrigin: true }])) }
      : undefined,
  }
})
