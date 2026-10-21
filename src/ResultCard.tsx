import { memo, useEffect, useRef } from 'react'
import { responsiveImageProps } from './responsiveImages'
import { Icon, type IconName } from './Icon'
import Stat from './Stat'
import type { ResultChange, ResultSummary } from './results'

export type ResultPlace = { id: string; name: string; hours: string; detail: string }
export type ResultPresentation = { heading: string; label: string; lead: string; places?: ResultPlace[]; notice?: string; illustration?: string; compact?: boolean; mapStatus?: string }
export type ResultCardData = { title: string; text: string; label?: string; reflection?: string; illustration?: string; illustrationAlt?: string; presentation?: ResultPresentation; bottleSearch?: { found: number } } & Partial<ResultSummary>

export function resultLabel(label: string) {
  return label.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]+\s*/u, '')
}

// Keep gains and meaningful consequences; omit small ongoing stat drain entirely.
export function isMajorChange(change: ResultChange) {
  if (change.kind === 'negative' && change.consumed) return false
  if (change.kind !== 'negative') return true
  const amount = Number(change.value.replace('−', '-').match(/^[+-]?\d+(?:\.\d+)?/)?.[0])
  const passiveNeeds = ['Food', 'Water', 'Energy', 'Health', 'Hygiene', 'Mood', 'Battery', 'Phone condition', 'Clothing cleanliness', 'Clothing condition'].includes(resultLabel(change.label))
  return !passiveNeeds || !Number.isFinite(amount) || Math.abs(amount) >= 5
}

function ResultStat({ change }: { change: ResultChange }) {
  const label = resultLabel(change.label)
  const meter = change.meter!
  const icons: Record<string, IconName> = { Food: 'food', Water: 'water', Energy: 'energy', Health: 'heart', Hygiene: 'shower', Battery: 'phone', 'Phone condition': 'phone', 'Clothing cleanliness': 'shower', 'Clothing condition': 'person' }
  const icon = icons[label] ?? 'person'
  return <Stat label={label === 'Water' ? 'Thirst' : label} value={meter.after} icon={<Icon name={icon} />} cap={meter.cap} capReason={meter.capReason} change={{ from: meter.before, value: change.value, kind: change.kind }} />
}

function ChangeRows({ changes }: { changes: ResultChange[] }) {
  return <div className="result-change-list">{changes.map(change => <div key={change.label} className={`result-change ${change.kind}`}><span>{resultLabel(change.label)}</span><strong>{change.value}</strong></div>)}</div>
}

export default memo(function ResultCard({ result, onClose }: { result: ResultCardData; onClose: () => void }) {
  const dialog = useRef<HTMLElement>(null)
  const confirm = useRef<HTMLButtonElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    confirm.current?.focus({ preventScroll: true })
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); return }
      if (event.key !== 'Tab' || !dialog.current) return
      const focusable = Array.from(dialog.current.querySelectorAll<HTMLElement>('button, summary, a[href], [tabindex="0"]')).filter(element => !element.closest('details:not([open]) > :not(summary)'))
      const index = focusable.indexOf(document.activeElement as HTMLElement)
      event.preventDefault()
      focusable[(index + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length]?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); if (previous?.isConnected) previous.focus({ preventScroll: true }) }
  }, [])

  useEffect(() => {
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
  }, [])

  const presentation = result.presentation
  const compactInfo = !!presentation?.compact
  const compactPlace = compactInfo && presentation?.places?.length === 1 ? presentation.places[0] : undefined
  const changes = (result.changes ?? []).filter(isMajorChange)
  const gains = changes.filter(change => change.kind === 'positive')
  const consequences = changes.filter(change => change.kind !== 'positive' && isMajorChange(change))
  const costs = (result.costs ?? []).filter(cost => isMajorChange(cost) || (compactInfo && resultLabel(cost.label) === 'Battery'))
  const meters = [...gains, ...consequences, ...costs].filter(change => change.meter)
  const compactMood = compactInfo ? meters.find(change => resultLabel(change.label) === 'Mood') : undefined
  const statMeters = meters.filter(change => change !== compactMood)
  const gainRows = gains.filter(change => !change.meter && !(result.bottleSearch && resultLabel(change.label) === 'Deposit containers'))
  const consequenceRows = consequences.filter(change => !change.meter)
  const costRows = costs.filter(change => !change.meter)

  return <div className="phone-overlay result-overlay">
    <section className={`phone-modal result-modal${result.illustration ? ' illustrated-result' : ''}${compactInfo ? ' compact-info-result' : ''}`} role="dialog" aria-modal="true" aria-labelledby="result-title" ref={dialog}>
      {result.illustration && <img className="result-illustration" {...responsiveImageProps(result.illustration)} alt={result.illustrationAlt ?? result.title} />}
      <div className="result-card-heading">
        {!result.bottleSearch && !compactInfo && <p className="result-card-label">{presentation?.label ?? result.label ?? 'AFTER THE ACTION'}</p>}
        <div className={compactInfo ? 'compact-info-heading' : undefined}>
          <h2 id="result-title">{compactInfo && <Icon name="info" />}<span>{compactPlace?.name ?? (result.bottleSearch ? 'Bottle & can search' : presentation?.heading ?? result.title)}</span></h2>
          {compactPlace && <span className="compact-info-hours">{compactPlace.hours}</span>}
          {compactPlace && presentation?.mapStatus && <span className="compact-info-saved"><Icon name="check" />{presentation.mapStatus}</span>}
        </div>
      </div>
      <div className="result-card-content">
        {result.bottleSearch ? <>
          <p className="bottle-search-reward">{result.bottleSearch.found > 0 ? <>+{result.bottleSearch.found} <span className="sr-only">returnable </span>container{result.bottleSearch.found === 1 ? '' : 's'}</> : 'Nothing useful found'}</p>
          {result.bottleSearch.found > 0 && <p className="result-description">Return at Cheap Shop · {(result.bottleSearch.found * .5).toFixed(2)} zł</p>}
        </> : compactInfo ? <>
          {compactPlace ? <p className="result-description">{compactPlace.detail}</p> : !!presentation?.places?.length && <div className="result-places">{presentation.places.map(place => <div className="result-place" key={place.id}>
            <div><div className="result-place-title"><strong>{place.name}</strong><span>{place.hours}</span></div><p>{place.detail}</p></div>
          </div>)}</div>}
          {presentation?.lead && <p className="result-description result-narrative">{presentation.lead}</p>}
          {!compactPlace && !!presentation?.places?.length && presentation.mapStatus && <p className="compact-info-saved"><Icon name="check" />{presentation.mapStatus}</p>}
          {presentation?.notice && <p className="result-notice">{presentation.notice}</p>}
          {result.reflection && <p className="result-description result-narrative">{result.reflection}</p>}
        </> : presentation ? <>
          <p className="result-lead result-narrative">{presentation.lead}</p>
          {!!presentation.places?.length && <div className="result-places">{presentation.places.map(place => <div className="result-place" key={place.id}>
            <Icon name="map" />
            <div><div className="result-place-title"><strong>{place.name}</strong><span>{place.hours}</span></div><p>{place.detail}</p></div>
          </div>)}</div>}
          {presentation.notice && <p className="result-notice">{presentation.notice}</p>}
        </> : <p className="result-description result-narrative">{result.text}</p>}
        {statMeters.length > 0 && <div className="status-needs result-stat-panel">{statMeters.map(change => <ResultStat key={change.label} change={change} />)}</div>}
        {gainRows.length > 0 && <div className="result-gains"><ChangeRows changes={gainRows} /></div>}
        {consequenceRows.length > 0 && <div className="result-consequences"><ChangeRows changes={consequenceRows} /></div>}
        {(costRows.length > 0 || compactMood) && <div className={`result-cost-line${compactInfo ? ' compact-info-summary' : ''}`} aria-label={compactInfo ? 'Action summary' : 'Spent'}>
          {costRows.map(cost => <span key={cost.label} title={resultLabel(cost.label)}><Icon name={resultLabel(cost.label) === 'Time' ? 'clock' : 'coins'} /><span className="sr-only">{resultLabel(cost.label)} </span>{cost.value}</span>)}
          {compactMood && <span className={`compact-info-mood ${compactMood.kind}`}><Icon name="face-fair" />Mood {compactMood.value}</span>}
        </div>}
        {presentation && !compactInfo && <details className="result-details">
          <summary>Full answer & details</summary>
          <p className="result-description">{result.text}</p>
        </details>}
      </div>
      <button className="result-confirm" ref={confirm} onClick={onClose}>Got it</button>
    </section>
  </div>
})
