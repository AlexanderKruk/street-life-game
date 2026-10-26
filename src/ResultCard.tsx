import { ModalOverlay, ModalPanel, ModalAction } from './Modal'
import { memo, useEffect, useRef, useState } from 'react'
import { responsiveImageProps } from './responsiveImages'
import { BatteryIcon, Icon, type IconName } from './Icon'
import Stat from './Stat'
import type { ResultChange, ResultSummary } from './results'
import { plainResultLabel, resultChangeAmount, resultChangeId } from './legacyResultCompatibility'
import type { ResultResourceId } from './resultResources'
import { t } from './i18n'
import { formatMoney, formatResultDelta } from './i18n/formatters'

export type ResultPlace = { id: string; name: string; hours: string; detail: string }
export type ResultPresentation = { heading: string; label: string; lead: string; places?: ResultPlace[]; notice?: string; illustration?: string; compact?: boolean; mapStatus?: string }
export type ResultCardData = { title: string; text: string; label?: string; reflection?: string; illustration?: string; illustrationAlt?: string; presentation?: ResultPresentation; batteryInSummary?: boolean; visibleStats?: ResultResourceId[]; rainResultId?: string; bottleSearch?: { found: number } } & Partial<ResultSummary>

export function resultLabel(label: string) {
  return plainResultLabel(label)
}

function wholeStatDelta(change: ResultChange) {
  const amount = resultChangeAmount(change)
  const id = resultChangeId(change)
  return id && Number.isFinite(amount) ? formatResultDelta((amount < 0 ? -1 : 1) * Math.max(1, Math.round(Math.abs(amount))), id, 0) : change.value
}

// Keep gains and meaningful consequences; omit small ongoing stat drain entirely.
export function isMajorChange(change: ResultChange) {
  if (change.kind === 'negative' && change.consumed) return false
  if (change.kind !== 'negative') return true
  const amount = resultChangeAmount(change)
  const passiveNeeds = ['hunger', 'thirst', 'energy', 'health', 'hygiene', 'phoneBattery', 'phoneCondition', 'clothingCleanliness', 'jacket'].includes(resultChangeId(change) ?? '')
  return !passiveNeeds || !Number.isFinite(amount) || Math.abs(amount) >= 5
}

function ResultStat({ change, animationReady }: { change: ResultChange; animationReady: boolean }) {
  const label = resultLabel(change.label)
  const id = resultChangeId(change)
  const meter = change.meter!
  const icons: Partial<Record<ResultResourceId, IconName>> = { hunger: 'food', thirst: 'water', energy: 'energy', health: 'heart', hygiene: 'shower', phoneBattery: 'phone', phoneCondition: 'phone', clothingCleanliness: 'shower', jacket: 'person' }
  const icon = (id && icons[id]) || 'person'
  return <Stat id={id} label={id === 'thirst' ? t('stat.thirst') : label} value={meter.after} icon={<Icon name={icon} />} cap={meter.cap} capReason={meter.capReason} change={{ from: meter.before, value: change.value, kind: change.kind }} animationReady={animationReady} />
}

function ChangeRows({ changes }: { changes: ResultChange[] }) {
  return <div className="result-change-list">{changes.map(change => <div key={change.label} className={`result-change ${change.kind}`}><span>{resultLabel(change.label)}</span><strong>{change.value}</strong></div>)}</div>
}

export default memo(function ResultCard({ result, onClose }: { result: ResultCardData; onClose: () => void }) {
  const [readyIllustration, setReadyIllustration] = useState<string | null>(null)
  const animationReady = !result.illustration || readyIllustration === result.illustration
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
  const changes = (result.changes ?? []).filter(change => isMajorChange(change) || (resultChangeId(change) && result.visibleStats?.includes(resultChangeId(change)!)))
  const gains = changes.filter(change => change.kind === 'positive')
  const consequences = changes.filter(change => change.kind !== 'positive')
  const costs = (result.costs ?? []).filter(cost => isMajorChange(cost) || ((compactInfo || result.batteryInSummary) && resultChangeId(cost) === 'phoneBattery'))
  const meters = [...gains, ...consequences, ...costs].filter(change => change.meter)
  const summaryMood = compactInfo ? meters.find(change => resultChangeId(change) === 'mood') : undefined
  const summaryBattery = result.batteryInSummary ? costs.find(change => resultChangeId(change) === 'phoneBattery') : undefined
  const statMeters = meters.filter(change => change !== summaryMood && change !== summaryBattery)
  const gainRows = gains.filter(change => !change.meter && !(result.bottleSearch && resultChangeId(change) === 'bottles'))
  const consequenceRows = consequences.filter(change => !change.meter)
  const costRows = costs.filter(change => !change.meter || change === summaryBattery)

  return <ModalOverlay className="phone-overlay result-overlay">
    <ModalPanel className={`phone-modal result-modal${result.illustration ? ' illustrated-result' : ''}${compactInfo ? ' compact-info-result' : ''}`} role="dialog" aria-modal="true" aria-labelledby="result-title" ref={dialog}>
      {result.illustration && <img className="result-illustration" {...responsiveImageProps(result.illustration)} alt={result.illustrationAlt ?? result.title} onLoad={() => setReadyIllustration(result.illustration!)} onError={() => setReadyIllustration(result.illustration!)} />}
      <div className="result-card-heading">
        {!result.bottleSearch && !compactInfo && <p className="result-card-label">{presentation?.label ?? result.label ?? t('result.afterAction')}</p>}
        <div className={compactInfo ? 'compact-info-heading' : undefined}>
          <h2 id="result-title">{compactInfo && <Icon name="info" />}<span>{compactPlace?.name ?? (result.bottleSearch ? t('result.bottleSearch') : presentation?.heading ?? result.title)}</span></h2>
          {compactPlace && <span className="compact-info-hours">{compactPlace.hours}</span>}
          {compactPlace && presentation?.mapStatus && <span className="compact-info-saved"><Icon name="check" />{presentation.mapStatus}</span>}
        </div>
      </div>
      <div className="result-card-content">
        {result.bottleSearch ? <>
          <p className="bottle-search-reward">{result.bottleSearch.found > 0 ? <><span aria-hidden="true">{t('result.containers', { count: result.bottleSearch.found })}</span><span className="sr-only">{t('result.returnableContainers', { count: result.bottleSearch.found })}</span></> : t('result.noContainers')}</p>
          {result.bottleSearch.found > 0 && <p className="result-description">{t('result.returnAtShop', { amount: formatMoney(result.bottleSearch.found * .5, true) })}</p>}
        </> : compactInfo ? <>
          {compactPlace ? <p className="result-description">{compactPlace.detail}</p> : !!presentation?.places?.length && <div className="result-places">{presentation.places.map(place => <div className="result-place" key={place.id}>
            <div><div className="result-place-title"><strong>{place.name}</strong><span>{place.hours}</span></div><p>{place.detail}</p></div>
          </div>)}</div>}
          {presentation?.lead && <p className="result-description result-narrative modal-narrative">{presentation.lead}</p>}
          {!compactPlace && !!presentation?.places?.length && presentation.mapStatus && <p className="compact-info-saved"><Icon name="check" />{presentation.mapStatus}</p>}
          {presentation?.notice && <p className="result-notice">{presentation.notice}</p>}
          {result.reflection && <p className="result-description result-narrative modal-narrative">{result.reflection}</p>}
        </> : presentation ? <>
          <p className="result-lead result-narrative modal-narrative">{presentation.lead}</p>
          {!!presentation.places?.length && <div className="result-places">{presentation.places.map(place => <div className="result-place" key={place.id}>
            <Icon name="map" />
            <div><div className="result-place-title"><strong>{place.name}</strong><span>{place.hours}</span></div><p>{place.detail}</p></div>
          </div>)}</div>}
          {presentation.notice && <p className="result-notice">{presentation.notice}</p>}
        </> : <p className="result-description result-narrative modal-narrative">{result.text}</p>}
        {statMeters.length > 0 && <div className="status-needs result-stat-panel">{statMeters.map(change => <ResultStat key={change.label} change={change} animationReady={animationReady} />)}</div>}
        {gainRows.length > 0 && <div className="result-gains"><ChangeRows changes={gainRows} /></div>}
        {consequenceRows.length > 0 && <div className="result-consequences"><ChangeRows changes={consequenceRows} /></div>}
        {(costRows.length > 0 || summaryMood) && <div className={`result-cost-line${compactInfo ? ' compact-info-summary' : ''}`} aria-label={t(compactInfo || result.batteryInSummary ? 'result.actionSummary' : 'result.spent')}>
          {costRows.map(cost => <span key={cost.label} title={resultLabel(cost.label)}>{resultChangeId(cost) === 'phoneBattery' ? <BatteryIcon charge={cost.meter?.after ?? 0} /> : <Icon name={resultChangeId(cost) === 'time' ? 'clock' : 'coins'} />}<span className="sr-only">{resultLabel(cost.label)} </span>{resultChangeId(cost) === 'phoneBattery' ? wholeStatDelta(cost) : cost.value}</span>)}
          {summaryMood && <span className={`compact-info-mood ${summaryMood.kind}`}><Icon name="face-fair" />{t('result.moodDelta', { delta: wholeStatDelta(summaryMood) })}</span>}
        </div>}
        {presentation && !compactInfo && <details className="result-details">
          <summary>{t('result.fullAnswer')}</summary>
          <p className="result-description">{result.text}</p>
        </details>}
      </div>
      <ModalAction className="result-confirm" ref={confirm} onClick={onClose}>{t('common.gotIt')}</ModalAction>
    </ModalPanel>
  </ModalOverlay>
})
