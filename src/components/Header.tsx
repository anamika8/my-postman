import type { HealthState } from '../api/types'
import { Icon } from './Icon'

export type Tab = 'retrieve' | 'workflows' | 'suggest'
export type Theme = 'light' | 'dark'

const TABS: { id: Tab; label: string }[] = [
  { id: 'retrieve', label: 'Retrieve data' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'suggest', label: 'Suggest prompts' },
]

const HEALTH_LABEL: Record<HealthState, string> = {
  unknown: 'Not checked yet',
  checking: 'Checking…',
  up: 'TDaaS is up',
  down: 'TDaaS is down',
}

interface Props {
  tab: Tab
  health: HealthState
  checkedAt: Date | null
  onCheck: () => void
  theme: Theme
  onToggleTheme: () => void
}

export function Header({ tab, health, checkedAt, onCheck, theme, onToggleTheme }: Props) {
  return (
    <header className="header">
      <a className="brand" href="#/retrieve">
        <span className="brand-mark">
          <Icon name="db" size={20} strokeWidth={1.8} />
        </span>
        <span className="brand-name">TDaaS</span>
        <span className="brand-sub">Test Data as a Service</span>
      </a>
      <nav aria-label="Main" className="nav">
        {TABS.map((t) => (
          <a key={t.id} href={`#/${t.id}`} aria-current={tab === t.id ? 'page' : undefined}>
            {t.label}
          </a>
        ))}
      </nav>
      <div className="header-end">
        <div className="health" role="status" aria-live="polite">
          <span className={`dot dot-${health}`} />
          <span className="health-text">
            <strong>{HEALTH_LABEL[health]}</strong>
            {checkedAt && health !== 'checking' && (
              <span className="muted">
                {' '}
                · checked {checkedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
          </span>
          <button type="button" className="health-btn" onClick={onCheck} disabled={health === 'checking'}>
            <Icon name="refresh" size={14} className={health === 'checking' ? 'spin' : undefined} />
            Check now
          </button>
        </div>
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>
      </div>
    </header>
  )
}
