import { useState } from 'react'
import type { Workflow } from '../api/types'
import { Icon } from '../components/Icon'

interface Props {
  workflows: Workflow[]
  loading: boolean
  error: string | null
  reload: () => void
}

export function WorkflowsPage({ workflows, loading, error, reload }: Props) {
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const shown = query
    ? workflows.filter((w) => w.name.toLowerCase().includes(query) || w.description?.toLowerCase().includes(query))
    : workflows
  const exact = query ? workflows.find((w) => w.name.toLowerCase() === query) : undefined

  return (
    <main className="main main-narrow">
      <div className="page-head center">
        <h1>Find a workflow</h1>
        <p>Workflows are the things TDaaS knows how to create. Type a name to see if the one you need is available.</p>
      </div>

      <div className="search search-lg">
        <label htmlFor="wfsearch" className="sr-only">
          Search workflows
        </label>
        <Icon name="search" size={22} strokeWidth={1.8} className="search-icon" />
        <input
          id="wfsearch"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. create_user, claim, supplier"
          autoComplete="off"
          autoFocus
        />
      </div>

      <div role="status" aria-live="polite" className="wf-status">
        {!loading && !error && exact && (
          <div className="notice notice-ok">
            <Icon name="check" size={20} strokeWidth={2.4} />
            <span>
              <strong>
                Yes, <span className="mono">{exact.name}</span> is available.
              </strong>{' '}
              You can use it in a prompt.
            </span>
          </div>
        )}
        {!loading && !error && query && shown.length === 0 && (
          <div className="notice notice-bad">
            <Icon name="xCircle" size={20} />
            <span>
              <strong>Not available.</strong> No workflow matches “{q.trim()}”. Ask the TDaaS team to add it.
            </span>
          </div>
        )}
        {!loading && !error && !exact && shown.length > 0 && (
          <p className="center muted">
            {query
              ? `${shown.length} workflow${shown.length === 1 ? '' : 's'} match “${q.trim()}”`
              : `${workflows.length} workflows available`}
          </p>
        )}
      </div>

      <div className="row-between mb-16">
        <h2 className="h-small">{query && shown.length ? 'Matching workflows' : `All workflows (${workflows.length})`}</h2>
        <button type="button" className="btn btn-secondary btn-sm" onClick={reload} disabled={loading}>
          <Icon name="refresh" size={15} className={loading ? 'spin' : undefined} />
          Refresh list
        </button>
      </div>

      {error ? (
        <div role="alert" className="notice notice-bad">
          <Icon name="alert" size={20} />
          <span>
            <strong>Couldn't load workflows.</strong> {error}
          </span>
        </div>
      ) : loading && workflows.length === 0 ? (
        <ul className="wf-grid" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="wf-card skeleton" />
          ))}
        </ul>
      ) : (
        <ul className="wf-grid">
          {(shown.length ? shown : workflows).map((w) => (
            <li key={w.name} className="wf-card">
              <div className="row-between">
                <span className="mono wf-name">{w.name}</span>
                <span className="badge badge-ok">
                  <Icon name="check" size={11} strokeWidth={3} />
                  Available
                </span>
              </div>
              {w.description && <p className="wf-desc">{w.description}</p>}
              <a href="#/retrieve" className="link link-arrow">
                Use in a request
                <Icon name="arrow" size={14} strokeWidth={2} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
