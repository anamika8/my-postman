import { useCallback, useEffect, useState } from 'react'
import { Header, type Tab, type Theme } from './components/Header'
import { useHealth, usePersistentState, useWorkflows } from './hooks'
import { RetrievePage } from './pages/RetrievePage'
import { SuggestPage } from './pages/SuggestPage'
import { WorkflowsPage } from './pages/WorkflowsPage'
import { emptyForm, type RetrieveForm } from './types'

const TABS: Tab[] = ['retrieve', 'workflows', 'suggest']

function tabFromHash(): Tab {
  const t = window.location.hash.replace(/^#\/?/, '') as Tab
  return TABS.includes(t) ? t : 'retrieve'
}

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [tab, setTab] = useState<Tab>(tabFromHash)
  const [theme, setTheme] = usePersistentState<Theme>('tdaas.theme', systemTheme())
  const [form, setFormState] = usePersistentState<RetrieveForm>('tdaas.form', emptyForm)
  const health = useHealth()
  const workflows = useWorkflows()

  useEffect(() => {
    const onHash = () => {
      setTab(tabFromHash())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const setForm = useCallback((u: (f: RetrieveForm) => RetrieveForm) => setFormState((f) => u(f)), [setFormState])

  const applyPrompts = (prompts: string[]) => {
    setForm((f) => ({ ...f, prompts: prompts.map((text, i) => ({ key: i + 1, text })) }))
    window.location.hash = '#/retrieve'
  }

  return (
    <div className="app">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header
        tab={tab}
        health={health.state}
        checkedAt={health.checkedAt}
        onCheck={() => void health.check()}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />
      <div id="main">
        {tab === 'retrieve' && <RetrievePage form={form} setForm={setForm} health={health.state} workflows={workflows} />}
        {tab === 'workflows' && <WorkflowsPage {...workflows} />}
        {tab === 'suggest' && <SuggestPage form={form} onUsePrompts={applyPrompts} />}
      </div>
    </div>
  )
}
