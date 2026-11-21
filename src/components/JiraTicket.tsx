import { useEffect, useRef, useState } from 'react'
import { config } from '../config'
import { useCopy } from '../hooks'
import { Icon } from './Icon'

interface Props {
  title?: string
  initialText: string
  onClose: () => void
}

/** Editable, copyable Jira ticket text, with an optional link to Jira (VITE_JIRA_URL). */
export function JiraTicket({ title = 'Your Jira ticket', initialText, onClose }: Props) {
  const [text, setText] = useState(initialText)
  const { copied, copy } = useCopy()
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    ref.current?.focus()
    ref.current?.setSelectionRange(0, 0)
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  return (
    <section aria-labelledby="ticketHead" className="card card-flush mt-20">
      <div className="ticket-head">
        <div>
          <h2 id="ticketHead" className="h-small">
            {title}
          </h2>
          <p className="hint">Filled in from the team's ticket template. Check it, then copy it into Jira.</p>
        </div>
        <button type="button" className="icon-btn" aria-label="Close ticket" onClick={onClose}>
          <Icon name="x" size={18} strokeWidth={1.8} />
        </button>
      </div>
      <div className="ticket-body">
        <label htmlFor="ticket" className="sr-only">
          Ticket text
        </label>
        <textarea ref={ref} id="ticket" rows={14} className="ticket-text" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="form-actions start">
          <button type="button" className="btn btn-primary btn-lg" onClick={() => void copy(text, 'ticket')}>
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
  )
}
