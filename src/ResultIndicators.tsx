import { useEffect, useId, useState, type CSSProperties } from 'react'
import { BatteryIcon, Icon, type IconName } from './Icon'
import MoodIcon from './MoodIcon'
import { plainResultLabel, resultChangeAmount, resultChangeId } from './legacyResultCompatibility'
import type { ResultResourceId } from './resultResources'
import type { ResultChange } from './results'
import { t } from './i18n'
import { formatNumber } from './i18n/formatters'

const REVEAL_DURATION = 260
const VALUE_HOLD = 600
const VALUE_DURATION = 650
const NEXT_PAUSE = 220
const indicatorDuration = (change: ResultChange) => change.meter ? VALUE_HOLD + VALUE_DURATION : REVEAL_DURATION
export const resultIndicatorDuration = (changes: readonly ResultChange[]) => changes.reduce((total, change) => total + indicatorDuration(change), 0) + Math.max(0, changes.length - 1) * NEXT_PAUSE
const percentage = (value: number) => t('format.percent', { amount: formatNumber(Math.round(value), 0) })

function IndicatorValue({ before, after, animate, ready, delay }: { before: number; after: number; animate: boolean; ready: boolean; delay: number }) {
  const [value, setValue] = useState(before)
  useEffect(() => {
    if (!animate) return
    setValue(before)
    if (!ready) return
    let frame = 0, start: number | undefined
    const tick = (now: number) => {
      start ??= now
      const progress = Math.max(0, Math.min(1, (now - start - delay - VALUE_HOLD) / VALUE_DURATION))
      const eased = progress * progress * (3 - 2 * progress)
      setValue(before + (after - before) * eased)
      if (progress < 1) frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [before, after, animate, ready, delay])
  return <strong>{percentage(animate ? value : after)}</strong>
}

const icons: Partial<Record<ResultResourceId, IconName>> = {
  money: 'banknote', hunger: 'food', thirst: 'water', energy: 'energy', health: 'heart',
  hygiene: 'shower', mood: 'face-fair', intoxication: 'cup', wetness: 'water',
  phoneCondition: 'phone', clothingCleanliness: 'shower', jacket: 'person',
  water: 'water', food: 'food', bottles: 'bottle', bread: 'food', cannedFood: 'can',
  readyMeal: 'food', wipes: 'shower', showerGel: 'shower', cigarettes: 'cigarette',
  medicines: 'pill', documents: 'documents', cold: 'thermometer', 'free-transit': 'ticket',
  'well-fed': 'food', coldRecovery: 'pill',
}

// Presentation only: the caller supplies the shared, already-filtered consequences.
export default function ResultIndicators({ changes, animate = false, animationReady = true, showLevels = false }: {
  changes: ResultChange[]; animate?: boolean; animationReady?: boolean; showLevels?: boolean
}) {
  const tooltipId = useId()
  const [expanded, setExpanded] = useState<number | null>(null)
  const animated = animate && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  let nextDelay = 0
  if (!changes.length) return null
  return <div className={`result-indicators${animated ? ' is-animated' : ''}${animationReady ? ' is-ready' : ''}`} role="group" aria-label={t('result.actionSummary')} style={{ '--result-indicator-duration': `${REVEAL_DURATION}ms`, '--result-indicator-value-duration': `${VALUE_DURATION}ms` } as CSSProperties}>
    {changes.map((change, index) => {
      const id = resultChangeId(change)
      const label = id === 'thirst' ? t('stat.thirst') : plainResultLabel(change.label)
      const namedValue = !Number.isFinite(resultChangeAmount(change)) && !change.meter
      const meter = showLevels ? change.meter : undefined
      const delay = nextDelay
      nextDelay += (showLevels ? indicatorDuration(change) + NEXT_PAUSE : REVEAL_DURATION)
      return <button type="button" key={`${id ?? label}-${index}`} className={`result-indicator ${change.kind}${meter ? ' is-level' : ''}`} data-resource-id={id} data-stat={label}
        style={{ '--result-indicator-delay': `${delay}ms`, '--result-indicator-value-delay': `${delay + VALUE_HOLD}ms` } as CSSProperties}
        title={label} aria-label={`${label} ${meter ? percentage(meter.after) : change.value}`} aria-describedby={expanded === index ? tooltipId : undefined}
        onClick={() => setExpanded(value => value === index ? null : index)} onBlur={() => setExpanded(null)}>
        {id === 'mood' ? <MoodIcon value={change.meter?.after ?? 50} /> : id === 'phoneBattery' ? <BatteryIcon charge={change.meter?.after ?? 0} /> : <Icon name={id && icons[id] || 'info'} />}
        <span className={namedValue ? 'result-indicator-name' : 'sr-only'}>{label} </span>{meter ? <IndicatorValue before={meter.before} after={meter.after} animate={animated} ready={animationReady} delay={delay} /> : <strong>{change.value}</strong>}
        {expanded === index && <span role="tooltip" id={tooltipId} className="result-indicator-tooltip">{label}</span>}
      </button>
    })}
  </div>
}
