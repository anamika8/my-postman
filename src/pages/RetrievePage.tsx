import { useMemo, useState } from 'react'
import { ApiError, retrieve } from '../api/client'
import type { HealthState, Workflow } from '../api/types'
import { Icon } from '../components/Icon'
import { JiraTicket } from '../components/JiraTicket'
import { fillTemplate } from '../templates/fillTemplate'
import savedEnvironments from '../environments.json'
import envTicketTemplate from '../templates/new-environment-ticket-template.txt?raw'
import { WorkflowQuickCheck } from '../components/WorkflowQuickCheck'
import { useCopy } from '../hooks'
import { config } from '../config'
import { looksLikeHost, toRequest, type RetrieveForm, type SavedEnvironment } from '../types'
import { ResultsView, type RetrieveOutcome } from './ResultsView'

const ENVIRONMENTS: SavedEnvironment[] = savedEnvironments

interface Props {
  form: RetrieveForm
  setForm: (updater: (f: RetrieveForm) => RetrieveForm) => void
  health: HealthState
  workflows: { workflows: Workflow[]; loading: boolean; error: string | null }
}

export function RetrievePage({ form, setForm, health, workflows }: Props) {
  const [sending, setSending] = useState(false)
  const [outcome, setOutcome] = useState<RetrieveOutcome | null>(null)
  const [touched, setTouched] = useState(false)
  const [envTicket, setEnvTicket] = useState<string | null>(null)
  const { copied, copy } = useCopy()

  const body = useMemo(() => toRequest(form), [form])
  const payload = JSON.stringify(body, null, 2)

  const set = <K extends keyof RetrieveForm>(k: K, v: RetrieveForm[K]) => setForm((f) => ({ ...f, [k]: v }))
  /** Editing an environment field by hand turns the selection into "Enter manually". */
  const setEnvField = (k: 'apiHost' | 'targetIp' | 'customer', v: string) => setForm((f) => ({ ...f, [k]: v, envId: '' }))
  const chosenEnv = ENVIRONMENTS.find((e) => e.id === form.envId)
  const pickEnvironment = (id: string) => {
    const env = ENVIRONMENTS.find((e) => e.id === id)
    setForm((f) =>
      env
        ? { ...f, envId: env.id, apiHost: env.apiHostIp, targetIp: env.targetServerIp, customer: env.customerName }
        : { ...f, envId: '' },
    )
  }
  const openEnvTicket = () =>
    setEnvTicket(
      fillTemplate(envTicketTemplate, {
        environment_name: '',
        api_host_ip: chosenEnv ? '' : form.apiHost.trim(),
        target_server_ip: chosenEnv ? '' : form.targetIp.trim(),
        customer_name: chosenEnv ? '' : form.customer.trim(),
        application_name: form.app.trim(),
        date: new Date().toLocaleDateString(),
      }),
    )

  const hostBad = form.apiHost.trim() !== '' && !looksLikeHost(form.apiHost)
  const targetBad = form.targetIp.trim() !== '' && !looksLikeHost(form.targetIp)
  const envOk = looksLikeHost(form.apiHost) && looksLikeHost(form.targetIp) && form.customer.trim() !== ''
  const checks = [
    { label: 'Application name', ok: body.application_name !== '' },
    { label: 'Test case ID', ok: body.test_case_id !== '' },
    { label: 'Environment details', ok: envOk },
    {
      label: body.prompts.length === 0 ? 'At least 1 prompt' : body.prompts.length === 1 ? '1 prompt' : `${body.prompts.length} prompts`,
      ok: body.prompts.length > 0,
    },
  ]
  const ready = checks.every((c) => c.ok)

  const addPrompt = () =>
    setForm((f) => ({
      ...f,
      prompts: [...f.prompts, { key: Math.max(0, ...f.prompts.map((p) => p.key)) + 1, text: '' }],
    }))
  const removePrompt = (key: number) =>
    setForm((f) => (f.prompts.length > 1 ? { ...f, prompts: f.prompts.filter((p) => p.key !== key) } : f))
  const changePrompt = (key: number, text: string) =>
    setForm((f) => ({ ...f, prompts: f.prompts.map((p) => (p.key === key ? { ...p, text } : p)) }))

  const submit = async () => {
    setTouched(true)
    if (!ready || sending) return
    setSending(true)
    const sent = body
    try {
      const res = await retrieve(sent)
      setOutcome({ ok: true, request: sent, response: res.raw, status: res.status, durationMs: res.durationMs, at: new Date() })
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError(String(e), 0, null)
      setOutcome({ ok: false, request: sent, response: err.raw, status: err.status, error: err.message, at: new Date() })
    } finally {
      setSending(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (outcome) {
    return (
      <ResultsView
        outcome={outcome}
        onBack={() => setOutcome(null)}
        onRunAgain={() => {
          setOutcome(null)
          void submit()
        }}
      />
    )
  }

  const req = (ok: boolean) => (touched && !ok ? 'invalid' : undefined)

  return (
    <main className="main">
      {health === 'down' && (
        <div role="alert" className="notice notice-bad mb-24">
          <Icon name="alert" size={20} />
          <span>
            <strong>The service isn't responding right now.</strong> You can still fill in the form. Try again in a few
            minutes, or let the TDaaS team know.
          </span>
        </div>
      )}

      <div className="page-head">
        <h1>Retrieve test data</h1>
        <p>Tell TDaaS which application and environment to use, then describe the data you need in plain words.</p>
      </div>

      <form
        className="split"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
        noValidate
      >
        <div className="split-main">
          <section className="card" aria-labelledby="appHead">
            <div className="step-head">
              <span className="step-num">1</span>
              <h2 id="appHead">Application and test case</h2>
            </div>
            <div className="grid grid-240">
              <div className="field">
                <label htmlFor="appName">
                  Application name <span className="req">*</span>
                </label>
                <input
                  id="appName"
                  value={form.app}
                  onChange={(e) => set('app', e.target.value)}
                  placeholder="e.g. Claims Portal"
                  aria-invalid={req(body.application_name !== '') ? true : undefined}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="tcid">
                  Test case ID <span className="req">*</span>
                </label>
                <input
                  id="tcid"
                  className="mono"
                  value={form.testCaseId}
                  onChange={(e) => set('testCaseId', e.target.value)}
                  placeholder="e.g. TC-10482"
                  aria-invalid={req(body.test_case_id !== '') ? true : undefined}
                  aria-describedby="tcidHint"
                  required
                />
                <span id="tcidHint" className="hint">
                  Links this data to your test so you can find it later.
                </span>
              </div>
            </div>
          </section>

          <section className="card" aria-labelledby="envHead">
            <div className="step-head">
              <span className="step-num">2</span>
              <h2 id="envHead">Environment</h2>
            </div>
            <div className="env-pick">
              <div className="field">
                <label htmlFor="envPreset">Saved environment</label>
                <select id="envPreset" value={form.envId ?? ''} onChange={(e) => pickEnvironment(e.target.value)}>
                  <option value="">Enter manually</option>
                  {ENVIRONMENTS.map((env) => (
                    <option key={env.id} value={env.id}>
                      {env.name} ({env.customerName})
                    </option>
                  ))}
                </select>
              </div>
              <p className="hint env-pick-hint">
                {chosenEnv
                  ? 'Values filled in from the saved environment. Change any of them to enter your own.'
                  : 'Pick a saved environment, or type the values below.'}{' '}
                Missing one?{' '}
                <button type="button" className="inline-link" onClick={openEnvTicket}>
                  Request a new saved environment
                </button>
              </p>
            </div>
            <div className="grid grid-200">
              <div className="field">
                <label htmlFor="apiHost">
                  API host IP <span className="req">*</span>
                </label>
                <input
                  id="apiHost"
                  className="mono"
                  value={form.apiHost}
                  onChange={(e) => setEnvField('apiHost', e.target.value)}
                  placeholder="10.0.0.1"
                  inputMode="url"
                  autoComplete="off"
                  aria-invalid={hostBad || req(looksLikeHost(form.apiHost)) ? true : undefined}
                  aria-describedby={hostBad ? 'apiHostErr' : undefined}
                  required
                />
                {hostBad && (
                  <span id="apiHostErr" className="error-text">
                    Enter an IP address like 10.20.4.15
                  </span>
                )}
              </div>
              <div className="field">
                <label htmlFor="targetIp">
                  Target server IP <span className="req">*</span>
                </label>
                <input
                  id="targetIp"
                  className="mono"
                  value={form.targetIp}
                  onChange={(e) => setEnvField('targetIp', e.target.value)}
                  placeholder="10.0.0.2"
                  inputMode="url"
                  autoComplete="off"
                  aria-invalid={targetBad || req(looksLikeHost(form.targetIp)) ? true : undefined}
                  aria-describedby={targetBad ? 'targetIpErr' : undefined}
                  required
                />
                {targetBad && (
                  <span id="targetIpErr" className="error-text">
                    Enter an IP address like 10.20.8.42
                  </span>
                )}
              </div>
              <div className="field">
                <label htmlFor="customer">
                  Customer name <span className="req">*</span>
                </label>
                <input
                  id="customer"
                  value={form.customer}
                  onChange={(e) => setEnvField('customer', e.target.value)}
                  placeholder="e.g. Acme Insurance"
                  aria-invalid={req(form.customer.trim() !== '') ? true : undefined}
                  required
                />
              </div>
            </div>
            {envTicket !== null && (
              <JiraTicket
                key={envTicket}
                title="Request a new saved environment"
                initialText={envTicket}
                onClose={() => setEnvTicket(null)}
              />
            )}
          </section>

          <section className="card" aria-labelledby="promptHead">
            <div className="step-head">
              <span className="step-num">3</span>
              <h2 id="promptHead">What data do you need?</h2>
            </div>
            <p className="step-sub">
              Write one step per prompt, in plain words. Steps run in order. Not sure what to write?{' '}
              <a href="#/suggest" className="link">
                Get suggestions
              </a>
            </p>
            <ol className="prompts">
              {form.prompts.map((p, i) => (
                <li key={p.key}>
                  <span className="prompt-num">{i + 1}</span>
                  <label htmlFor={`prompt-${p.key}`} className="sr-only">
                    Prompt {i + 1}
                  </label>
                  <textarea
                    id={`prompt-${p.key}`}
                    rows={2}
                    value={p.text}
                    onChange={(e) => changePrompt(p.key, e.target.value)}
                    placeholder="e.g. Create a user with an active policy"
                    aria-invalid={touched && body.prompts.length === 0 && i === 0 ? true : undefined}
                  />
                  {form.prompts.length > 1 && (
                    <button
                      type="button"
                      className="icon-btn icon-btn-outline"
                      aria-label={`Remove prompt ${i + 1}`}
                      title="Remove prompt"
                      onClick={() => removePrompt(p.key)}
                    >
                      <Icon name="trash" size={18} strokeWidth={1.8} />
                    </button>
                  )}
                </li>
              ))}
            </ol>
            <button type="button" className="btn btn-dashed add-prompt" onClick={addPrompt}>
              <Icon name="plus" size={16} strokeWidth={2} />
              Add another prompt
            </button>
          </section>

          <section className="card" aria-labelledby="optHead">
            <div className="step-head">
              <span className="step-num">4</span>
              <h2 id="optHead">Options</h2>
            </div>
            <label htmlFor="bypass" className="check-row">
              <input
                id="bypass"
                type="checkbox"
                checked={form.bypassCache}
                onChange={(e) => set('bypassCache', e.target.checked)}
              />
              <span>
                <span className="check-title">Bypass cache</span>
                <span className="check-desc">
                  Always create fresh data instead of reusing a recent match. Slower, but nothing is shared with earlier
                  runs.
                </span>
              </span>
            </label>
          </section>
        </div>

        <aside aria-label="Request summary" className="split-side">
          <div className="card card-raised">
            <h2 className="eyebrow">Before you send</h2>
            <ul className="checks">
              {checks.map((c) => (
                <li key={c.label}>
                  {c.ok ? (
                    <span className="check-ok">
                      <Icon name="check" size={13} strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="check-todo" />
                  )}
                  <span className={c.ok ? undefined : 'muted'}>
                    {c.label} {!c.ok && <span className="req">(needed)</span>}
                  </span>
                </li>
              ))}
            </ul>
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={sending} aria-disabled={!ready}>
              {sending ? (
                <>
                  <Icon name="refresh" size={18} className="spin" />
                  Retrieving…
                </>
              ) : (
                <>
                  <Icon name="play" size={18} />
                  Retrieve test data
                </>
              )}
            </button>
            {touched && !ready && <p className="error-text mt-8">Fill in everything marked as needed above.</p>}

            <details className="dev">
              <summary>View request body (for developers)</summary>
              <div className="code">
                <div className="code-head">
                  <span>POST {config.paths.retrieve}</span>
                  <button type="button" className="code-copy" onClick={() => void copy(payload, 'payload')}>
                    <Icon name="copy" size={13} />
                    {copied === 'payload' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre>{payload}</pre>
              </div>
            </details>
          </div>

          <WorkflowQuickCheck {...workflows} />
        </aside>
      </form>
    </main>
  )
}
