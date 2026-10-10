import { useEffect, useRef } from 'react'
import { Icon } from './Icon'
import type { ResultChange, ResultSummary } from './results'

export type ResultPlace = { id: string; name: string; hours: string; detail: string }
export type ResultPresentation = { heading: string; label: string; lead: string; places?: ResultPlace[]; notice?: string; illustration?: string }
export type ResultCardData = { title: string; text: string; presentation?: ResultPresentation } & Partial<ResultSummary>

export function resultLabel(label: string) {
  return label.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]+\s*/u, '')
}

// Gains, meaningful losses and persistent consequences stay in the first view.
// Small passive losses remain available in the expandable, complete summary.
export function isMajorChange(change: ResultChange) {
  if (change.kind !== 'negative') return true
  if (resultLabel(change.label) === 'Health') return true
  const amount = Number(change.value.replace('−', '-').match(/^[+-]?\d+(?:\.\d+)?/)?.[0])
  const passiveNeeds = ['Food', 'Water', 'Energy', 'Hygiene', 'Clothing cleanliness'].includes(resultLabel(change.label))
  return !Number.isFinite(amount) || Math.abs(amount) >= (passiveNeeds ? 5 : 1)
}

function ChangeRows({ changes }: { changes: ResultChange[] }) {
  return <div className="result-change-list">{changes.map(change => <div key={change.label} className={`result-change ${change.kind}`}><span>{resultLabel(change.label)}</span><strong>{change.value}</strong></div>)}</div>
}

export default function ResultCard({ result, onClose, inline = false }: { result: ResultCardData; onClose: () => void; inline?: boolean }) {
  const dialog = useRef<HTMLElement>(null)
  const confirm = useRef<HTMLButtonElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    confirm.current?.focus({ preventScroll: true })
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); return }
      if (inline || event.key !== 'Tab' || !dialog.current) return
      const focusable = Array.from(dialog.current.querySelectorAll<HTMLElement>('button, summary, a[href], [tabindex="0"]')).filter(element => !element.closest('details:not([open]) > :not(summary)'))
      const index = focusable.indexOf(document.activeElement as HTMLElement)
      event.preventDefault()
      focusable[(index + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length]?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); if (previous?.isConnected) previous.focus({ preventScroll: true }) }
  }, [inline])

  useEffect(() => {
    if (inline) return
    // Fixed body also prevents background touch scrolling in mobile Safari.
    const body = document.body
    const root = document.documentElement
    const x = window.scrollX
    const y = window.scrollY
    const saved = { position: body.style.position, top: body.style.top, left: body.style.left, width: body.style.width, overflow: body.style.overflow, rootOverflow: root.style.overflow }
    body.style.position = 'fixed'
    body.style.top = `${-y}px`
    body.style.left = `${-x}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    root.style.overflow = 'hidden'
    return () => {
      body.style.position = saved.position
      body.style.top = saved.top
      body.style.left = saved.left
      body.style.width = saved.width
      body.style.overflow = saved.overflow
      root.style.overflow = saved.rootOverflow
      window.scrollTo(x, y)
    }
  }, [inline])

  const presentation = result.presentation
  const changes = result.changes ?? []
  const gains = changes.filter(change => change.kind === 'positive')
  const consequences = changes.filter(change => change.kind !== 'positive' && isMajorChange(change))
  const minor = changes.filter(change => !isMajorChange(change))
  const costs = result.costs ?? []

  return <div className={inline ? "result-inline" : "phone-overlay result-overlay"}>
    <section className="phone-modal result-modal" role="dialog" aria-modal={!inline} aria-labelledby="result-title" ref={dialog}>
      <div className="result-card-heading">
        <p className="result-card-label">{presentation?.label ?? 'AFTER THE ACTION'}</p>
        <h2 id="result-title">{presentation?.heading ?? result.title}</h2>
      </div>
      <div className="result-card-content">
        {presentation ? <>
          <p className="result-lead">{presentation.lead}</p>
          {!!presentation.places?.length && <div className="result-places">{presentation.places.map(place => <div className="result-place" key={place.id}>
            <Icon name="map" />
            <div><div className="result-place-title"><strong>{place.name}</strong><span>{place.hours}</span></div><p>{place.detail}</p></div>
          </div>)}</div>}
          {presentation.notice && <p className="result-notice">{presentation.notice}</p>}
        </> : <p className="result-description">{result.text}</p>}
        {gains.length > 0 && <div className="result-gains"><ChangeRows changes={gains} /></div>}
        {consequences.length > 0 && <div className="result-consequences"><ChangeRows changes={consequences} /></div>}
        {costs.length > 0 && <div className="result-cost-line" aria-label="Spent">{costs.map(cost => <span key={cost.label} title={resultLabel(cost.label)}><Icon name={resultLabel(cost.label) === 'Time' ? 'clock' : resultLabel(cost.label) === 'Battery' ? 'phone' : 'coins'} /><span className="sr-only">{resultLabel(cost.label)} </span>{cost.value}</span>)}</div>}
        {(presentation || minor.length > 0) && <details className="result-details">
          <summary>{presentation ? 'Full answer & details' : 'All changes'}</summary>
          {presentation && <p className="result-description">{result.text}</p>}
          <ChangeRows changes={changes} />
          {costs.length > 0 && <ChangeRows changes={costs} />}
        </details>}
      </div>
      <button className="result-confirm" ref={confirm} onClick={onClose}>Got it</button>
    </section>
  </div>
}
