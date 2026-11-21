import { useCallback, useEffect, useRef, useState } from 'react'
import { checkHealth, fetchWorkflows } from './api/client'
import type { HealthState, Workflow } from './api/types'
import { config } from './config'

export function useHealth() {
  const [state, setState] = useState<HealthState>('unknown')
  const [checkedAt, setCheckedAt] = useState<Date | null>(null)
  const busy = useRef(false)

  const check = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    setState('checking')
    const up = await checkHealth()
    setState(up ? 'up' : 'down')
    setCheckedAt(new Date())
    busy.current = false
  }, [])

  useEffect(() => {
    void check()
    if (!config.healthPollMs) return
    const id = setInterval(() => void check(), config.healthPollMs)
    return () => clearInterval(id)
  }, [check])

  return { state, checkedAt, check }
}

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setWorkflows(await fetchWorkflows())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { workflows, loading, error, reload: load }
}

export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = useCallback(async (text: string, key = 'default') => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      return
    }
    setCopied(key)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(null), 1600)
  }, [])
  return { copied, copy }
}

/** Reads/writes a value in localStorage, ignoring storage errors. */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const v = localStorage.getItem(key)
      return v ? (JSON.parse(v) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* ignore */
    }
  }, [key, value])
  return [value, setValue] as const
}
