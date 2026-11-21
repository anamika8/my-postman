import { useState } from 'react'
import { suggestPrompts } from '../api/client'
import { Icon } from '../components/Icon'
import { config } from '../config'
import { useCopy } from '../hooks'
import jiraTemplate from '../templates/jira-ticket-template.txt?raw'
import type { RetrieveForm } from '../types'

type Status = 'idle' | 'loading' | 'found' | 'none' | 'error'

interface Props {
  form: RetrieveForm
  onUsePrompts: (prompts: string[]) => void
}

function fillTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => values[k] || `<${k.replace(/_/g, ' ')}>`)
}

export function SuggestPage({ form, onUsePrompts }: Props) {
  const [need, setNeed] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [ticketOpen, setTicketOpen] = useState(false)
  const [ticket, setTicket] = useState('')
  const { copied, copy } = useCopy()

  const buildTicket = (requirement: string) =>
    fillTemplate(jiraTemplate, {
      requirement: requirement.trim(),
      application_name: form.app.trim(),
      test_case_id: form.testCaseId.trim(),
      customer_name: form.customer.trim(),
      date: new Date().toLocaleDateString(),
    })

  const run = async () => {
    if (!need.trim() || status === 'loading') return
    setStatus('loading')
    setTicketOpen(false)
    try {
      const prompts = await suggestPrompts(need.trim())
      setSuggestions(prompts)
      setStatus(prompts.length ? 'found' : 'none')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStatus('error')
    }
  }

  const openTicket = () => {
    setTicket(buildTicket(need))
    setTicketOpen(true)
    setTimeout(() => document.getElementById('ticket')?.focus(), 0)
  }

  return (
    <main className="main main-mid">
      <div className="page-head">
        <h1>Suggest prompts</h1>
        <p>
          Not sure what to type? Describe the test data you need in your own words and we'll suggest prompts that TDaaS
          understands.
        </p>
      </div>

      <form
        className="card card-raised"
        onSubmit={(e) => {
          e.preventDefault()
          void run()
        }}
      >
        <h2 className="h-small">
          <label htmlFor="need">What do you need to test?</label>
        </h2>
        <p className="hint mb-12">Mention the kind of record, its state, and how records relate to each other.</p>
        <textarea
          id="need"
          rows={4}
          className="textarea-lg"
          value={need}
          onChange={(e) => setNeed(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void run()
          }}
          placeholder="e.g. I need a policy holder whose claim was approved last week, so I can test the payout screen"
        />
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary btn-lg"
            onClick={() => {
              setNeed('')
              setStatus('idle')
              setTicketOpen(false)
            }}
          >
            Clear
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={!need.trim() || status === 'loading'}>
            <Icon name="sparkle" size={18} />
            {status === 'loading' ? 'Finding prompts…' : 'Suggest prompts'}
          </button>
        </div>
      </form>

      <div role="status" aria-live="polite" className="mt-28">
        {status === 'loading' && (
          <div className="card loading-row">
            <span className="pulse" />
            Finding prompts that match your description…
          </div>
        )}

        {status === 'error' && (
          <div role="alert" className="notice notice-bad">
            <Icon name="alert" size={20} />
            <span>
              <strong>Couldn't get suggestions.</strong> {error}{' '}
              <button type="button" className="inline-link" onClick={() => void run()}>
                Try again
              </button>
            </span>
          </div>
        )}

        {status === 'found' && (
          <section aria-labelledby="sugHead">
            <div className="row-between mb-16 align-end">
              <div>
                <h2 id="sugHead" className="h-mid">
                  Suggested prompts
                </h2>
                <p className="muted small">Use them in this order. You can still edit them before you retrieve.</p>
              </div>
              <button type="button" className="btn btn-primary btn-lg" onClick={() => onUsePrompts(suggestions)}>
                Use these prompts
                <Icon name="arrow" size={16} strokeWidth={2} />
              </button>
            </div>
            <ol className="sug-list">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <span className="step-num">{i + 1}</span>
                  <div className="sug-text">{s}</div>
                  <button
                    type="button"
                    className="icon-btn icon-btn-outline"
                    aria-label={`Copy prompt ${i + 1}`}
                    title={copied === `s${i}` ? 'Copied' : 'Copy'}
                    onClick={() => void copy(s, `s${i}`)}
                  >
                    <Icon name={copied === `s${i}` ? 'check' : 'copy'} size={16} strokeWidth={1.8} />
                  </button>
                </li>
              ))}
            </ol>
            <p className="muted small mt-16">
              Not quite right?{' '}
              <button type="button" className="inline-link" onClick={openTicket}>
                Raise a Jira ticket instead
              </button>
            </p>
          </section>
        )}

        {status === 'none' && (
          <section aria-labelledby="noneHead" className="warn-card">
            <div className="warn-card-top">
              <span className="warn-icon">
                <Icon name="warn" size={20} strokeWidth={2} />
              </span>
              <div>
                <h2 id="noneHead" className="h-mid">
                  We couldn't find a prompt for this yet
                </h2>
                <p>
                  Your requirement is new to TDaaS, or something in it doesn't look right. Raise a Jira ticket and the
                  TDaaS team will look at it. We've filled the ticket in for you.
                </p>
              </div>
            </div>
            <div className="warn-card-actions">
              <button type="button" className="btn btn-primary btn-lg" onClick={openTicket}>
                Raise a Jira ticket
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                onClick={() => {
                  setStatus('idle')
                  document.getElementById('need')?.focus()
                }}
              >
                Change my description
              </button>
            </div>
          </section>
        )}

        {ticketOpen && (
          <section aria-labelledby="ticketHead" className="card card-flush mt-20">
            <div className="ticket-head">
              <div>
                <h2 id="ticketHead" className="h-small">
                  Your Jira ticket
                </h2>
                <p className="hint">Filled in from the team's ticket template. Check it, then copy it into Jira.</p>
              </div>
              <button type="button" className="icon-btn" aria-label="Close ticket" onClick={() => setTicketOpen(false)}>
                <Icon name="x" size={18} strokeWidth={1.8} />
              </button>
            </div>
            <div className="ticket-body">
              <label htmlFor="ticket" className="sr-only">
                Ticket text
              </label>
              <textarea id="ticket" rows={14} className="ticket-text" value={ticket} onChange={(e) => setTicket(e.target.value)} />
              <div className="form-actions start">
                <button type="button" className="btn btn-primary btn-lg" onClick={() => void copy(ticket, 'ticket')}>
                  <Icon name="copy" size={16} strokeWidth={1.8} />
                  {copied === 'ticket' ? 'Copied' : 'Copy ticket text'}
                </button>
                {config.jiraUrl && (
                  <a className="btn btn-secondary btn-lg" href={config.jiraUrl} target="_blank" rel="noreferrer">
                    Open Jira
                    <Icon name="external" size={15} />
                  </a>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
