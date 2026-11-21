import { useState } from 'react'
import type { Workflow } from '../api/types'
import { Icon } from './Icon'

interface Props {
  workflows: Workflow[]
  loading: boolean
  error: string | null
}

export function WorkflowQuickCheck({ workflows, loading, error }: Props) {
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const matches = query ? workflows.filter((w) => w.name.toLowerCase().includes(query)).slice(0, 5) : []

  return (
    <section className="card card-tight" aria-labelledby="wfqHead">
      <div className="row-between">
        <h2 id="wfqHead" className="h-small">
          Is a workflow available?
        </h2>
        <a href="#/workflows" className="link">
          See all
        </a>
      </div>
      <p className="hint">Check before you write a prompt that needs it.</p>
      <div className="search">
        <label htmlFor="wfq" className="sr-only">
          Search workflows
        </label>
        <Icon name="search" size={18} className="search-icon" />
        <input id="wfq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try create_claim" autoComplete="off" />
      </div>
      <div role="status" aria-live="polite">
        {error && <div className="notice notice-bad mt-12">Couldn't load workflows: {error}</div>}
        {!error && loading && query && <p className="hint mt-12">Loading workflows…</p>}
        {!error && !loading && query && matches.length > 0 && (
          <ul className="wf-mini">
            {matches.map((w) => (
              <li key={w.name}>
                <span className="mono">{w.name}</span>
                <span className="badge badge-ok">
                  <Icon name="check" size={11} strokeWidth={3} />
                  Available
                </span>
              </li>
            ))}
          </ul>
        )}
        {!error && !loading && query && matches.length === 0 && (
          <div className="notice notice-bad mt-12">
            <strong>Not available.</strong> No workflow matches “{q.trim()}”. Ask the TDaaS team to add it.
          </div>
        )}
      </div>
    </section>
  )
}
