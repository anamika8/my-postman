import { useState } from 'react'
import type { RetrieveRequest } from '../api/types'
import { Icon } from '../components/Icon'
import { config } from '../config'
import { useCopy } from '../hooks'

export interface RetrieveOutcome {
  ok: boolean
  request: RetrieveRequest
  response: unknown
  status: number
  durationMs?: number
  error?: string
  at: Date
}

interface Group {
  title: string
  subtitle?: string
  fields: { label: string; value: string }[]
}

const humanize = (k: string) =>
  k
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, (c) => c.toUpperCase())

const show = (v: unknown) => (v === null || v === undefined ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v))

function flatten(obj: Record<string, unknown>, prefix = ''): { label: string; value: string }[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? flatten(v as Record<string, unknown>, prefix + humanize(k) + ' › ')
      : [{ label: prefix + humanize(k), value: show(v) }],
  )
}

/**
 * Turns the /retrieve response into readable groups. The response shape is not known yet,
 * so this looks for a list under results/data/items and otherwise shows the top-level fields.
 */
function toGroups(raw: unknown, prompts: string[]): Group[] {
  if (!raw || typeof raw !== 'object') return []
  const o = raw as Record<string, unknown>
  const list = Array.isArray(raw) ? raw : (o.results ?? o.data ?? o.items)
  if (Array.isArray(list) && list.length) {
    return list.map((item, i) => {
      if (!item || typeof item !== 'object') return { title: prompts[i] ?? `Result ${i + 1}`, fields: [{ label: 'Value', value: show(item) }] }
      const r = item as Record<string, unknown>
      const { prompt, workflow, tool, data, output, result, ...rest } = r
      const payload = data ?? output ?? result
      const fields =
        payload && typeof payload === 'object' && !Array.isArray(payload)
          ? flatten(payload as Record<string, unknown>)
          : payload !== undefined
            ? [{ label: 'Value', value: show(payload) }]
            : flatten(rest)
      const wf = workflow ?? tool
      return {
        title: typeof prompt === 'string' ? prompt : (prompts[i] ?? `Result ${i + 1}`),
        subtitle: typeof wf === 'string' ? wf : undefined,
        fields,
      }
    })
  }
  if (Array.isArray(raw)) return []
  const fields = flatten(o)
  return fields.length ? [{ title: 'Response', fields }] : []
}

interface Props {
  outcome: RetrieveOutcome
  onBack: () => void
  onRunAgain: () => void
}

export function ResultsView({ outcome, onBack, onRunAgain }: Props) {
  const { request: req } = outcome
  const groups = outcome.ok ? toGroups(outcome.response, req.prompts) : []
  const [view, setView] = useState<'easy' | 'raw'>(groups.length ? 'easy' : 'raw')
  const { copied, copy } = useCopy()
  const rawText =
    typeof outcome.response === 'string' ? outcome.response : JSON.stringify(outcome.response, null, 2) ?? ''

  const download = () => {
    const blob = new Blob([rawText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tdaas-${req.test_case_id || 'result'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const chips: [string, string, boolean?][] = [
    ['Test case', req.test_case_id, true],
    ['Application', req.application_name],
    ['Customer', req.environment.customer_name],
    ['Server', req.environment.target_server_ip, true],
    ['Bypass cache', req.bypass_cache ? 'On' : 'Off'],
  ]

  return (
    <main className="main">
      <button type="button" className="back-link" onClick={onBack}>
        <Icon name="back" size={16} strokeWidth={2} />
        Edit request
      </button>

      <div className="results-head">
        <div className="minw0">
          <div className="status-line">
            {outcome.ok ? (
              <span className="badge badge-ok badge-lg">
                <Icon name="check" size={14} strokeWidth={2.4} />
                Ready
              </span>
            ) : (
              <span className="badge badge-bad badge-lg">
                <Icon name="xCircle" size={14} strokeWidth={2.2} />
                Failed
              </span>
            )}
            <span className="hint">
              {outcome.status ? `${outcome.status} · ` : ''}
              {outcome.durationMs !== undefined ? `${(outcome.durationMs / 1000).toFixed(1)}s · ` : ''}
              {outcome.at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
          <h1 className="h-results">{outcome.ok ? 'Your test data is ready' : "We couldn't create your test data"}</h1>
          <div className="chips">
            {chips.map(([k, v, mono]) => (
              <span key={k} className="chip">
                {k} <strong className={mono ? 'mono' : undefined}>{v || '—'}</strong>
              </span>
            ))}
          </div>
        </div>
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={onRunAgain}>
            <Icon name="refresh" size={16} />
            Run again
          </button>
          {outcome.ok && (
            <>
              <button type="button" className="btn btn-secondary" onClick={() => void copy(rawText, 'all')}>
                <Icon name="copy" size={16} strokeWidth={1.8} />
                {copied === 'all' ? 'Copied' : 'Copy all'}
              </button>
              <button type="button" className="btn btn-primary" onClick={download}>
                <Icon name="download" size={16} strokeWidth={2} />
                Download
              </button>
            </>
          )}
        </div>
      </div>

      {!outcome.ok && (
        <div role="alert" className="notice notice-bad mb-24">
          <Icon name="alert" size={20} />
          <span>
            <strong>{outcome.error}</strong> Check the environment details and prompts, then run it again. If it keeps
            failing, share the raw response below with the TDaaS team.
          </span>
        </div>
      )}

      <div className="row-between mb-16">
        <h2 className="h-small">{outcome.ok ? 'What was created' : 'Response'}</h2>
        {groups.length > 0 && (
          <div role="group" aria-label="View as" className="segmented">
            <button type="button" aria-pressed={view === 'easy'} onClick={() => setView('easy')}>
              Easy view
            </button>
            <button type="button" aria-pressed={view === 'raw'} onClick={() => setView('raw')}>
              Raw response
            </button>
          </div>
        )}
      </div>

      {view === 'easy' && groups.length > 0 ? (
        <ol className="result-list">
          {groups.map((g, gi) => (
            <li key={gi} className="result-card">
              <div className="result-card-head">
                <div className="result-title">
                  <span className="step-num">{gi + 1}</span>
                  <div className="minw0">
                    <div className="strong">{g.title}</div>
                    {g.subtitle && (
                      <div className="hint">
                        Ran <span className="mono">{g.subtitle}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <dl className="kv">
                {g.fields.map((f, fi) => (
                  <div key={fi} className="kv-item">
                    <div className="minw0">
                      <dt>{f.label}</dt>
                      <dd className="mono">{f.value}</dd>
                    </div>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Copy ${f.label}`}
                      title={copied === `${gi}-${fi}` ? 'Copied' : 'Copy'}
                      onClick={() => void copy(f.value, `${gi}-${fi}`)}
                    >
                      <Icon name={copied === `${gi}-${fi}` ? 'check' : 'copy'} size={16} strokeWidth={1.8} />
                    </button>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ol>
      ) : (
        <div className="code code-lg">
          <div className="code-head">
            <span>
              {outcome.status || 'No response'} · POST {config.paths.retrieve}
            </span>
            <button type="button" className="code-copy" onClick={() => void copy(rawText, 'raw')}>
              <Icon name="copy" size={13} />
              {copied === 'raw' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre>{rawText || '(empty body)'}</pre>
        </div>
      )}
    </main>
  )
}
