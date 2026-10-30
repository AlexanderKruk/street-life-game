import { useId, useState, type CSSProperties } from 'react'
import { BatteryIcon, Icon, type IconName } from './Icon'
import MoodIcon from './MoodIcon'
import { plainResultLabel, resultChangeAmount, resultChangeId } from './legacyResultCompatibility'
import type { ResultResourceId } from './resultResources'
import type { ResultChange } from './results'
import { t } from './i18n'

export const RESULT_INDICATOR_STEP = 260
const REVEAL_DELAY = 500
const REVEAL_DURATION = 260
export const resultIndicatorDuration = (count: number) => REVEAL_DELAY + Math.max(0, count - 1) * RESULT_INDICATOR_STEP + REVEAL_DURATION

const icons: Partial<Record<ResultResourceId, IconName>> = {
  money: 'banknote', hunger: 'food', thirst: 'water', energy: 'energy', health: 'heart',
  hygiene: 'shower', mood: 'face-fair', intoxication: 'cup', wetness: 'water',
  phoneCondition: 'phone', clothingCleanliness: 'shower', jacket: 'person',
  water: 'bottle', food: 'food', bottles: 'bottle', bread: 'food', cannedFood: 'can',
  readyMeal: 'food', wipes: 'shower', showerGel: 'shower', cigarettes: 'cigarette',
  medicines: 'pill', documents: 'documents', cold: 'thermometer', 'free-transit': 'ticket',
  'well-fed': 'food', coldRecovery: 'pill',
}

// Presentation only: the caller supplies the shared, already-filtered consequences.
export default function ResultIndicators({ changes, animate = false, animationReady = true }: {
  changes: ResultChange[]; animate?: boolean; animationReady?: boolean
}) {
  const tooltipId = useId()
  const [expanded, setExpanded] = useState<number | null>(null)
  if (!changes.length) return null
  return <div className={`result-indicators${animate ? ' is-animated' : ''}${animationReady ? ' is-ready' : ''}`} role="group" aria-label={t('result.actionSummary')} style={{ '--result-indicator-duration': `${REVEAL_DURATION}ms` } as CSSProperties}>
    {changes.map((change, index) => {
      const id = resultChangeId(change)
      const label = id === 'thirst' ? t('stat.thirst') : plainResultLabel(change.label)
      const namedValue = !Number.isFinite(resultChangeAmount(change)) && !change.meter
      return <button type="button" key={`${id ?? label}-${index}`} className={`result-indicator ${change.kind}`} data-resource-id={id} data-stat={label}
        style={{ '--result-indicator-delay': `${REVEAL_DELAY + index * RESULT_INDICATOR_STEP}ms` } as CSSProperties}
        title={label} aria-label={`${label} ${change.value}`} aria-describedby={expanded === index ? tooltipId : undefined}
        onClick={() => setExpanded(value => value === index ? null : index)} onBlur={() => setExpanded(null)}>
        {id === 'mood' ? <MoodIcon value={change.meter?.after ?? 50} /> : id === 'phoneBattery' ? <BatteryIcon charge={change.meter?.after ?? 0} /> : <Icon name={id && icons[id] || 'info'} />}
        <span className={namedValue ? 'result-indicator-name' : 'sr-only'}>{label} </span><strong>{change.value}</strong>
        {expanded === index && <span role="tooltip" id={tooltipId} className="result-indicator-tooltip">{label}</span>}
      </button>
    })}
  </div>
}
