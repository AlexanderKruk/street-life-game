import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { t } from './i18n'

export type ChoiceEstimate = { minutes: number; maxMinutes?: number; atLeast?: boolean }

// Estimates are intentionally coarse; clocks and elapsed timers never use this formatter.
const roundedMinutes = (minutes: number) => minutes > 0 ? Math.max(5, Math.round(minutes / 5) * 5) : 0
export function approximateDuration(minutes: number): string {
  const rounded = roundedMinutes(minutes)
  const hours = Math.floor(rounded / 60)
  const rest = rounded % 60
  return hours && rest ? t('choice.duration.hoursMinutes', { hours, minutes: rest })
    : hours ? t('choice.duration.hours', { hours }) : t('choice.duration.minutes', { minutes: rest })
}

export function formatChoiceEstimate(estimate: ChoiceEstimate): string {
  const duration = estimate.maxMinutes === undefined ? approximateDuration(estimate.minutes)
    : t('choice.duration.range', { min: roundedMinutes(estimate.minutes), max: roundedMinutes(estimate.maxMinutes) })
  return estimate.atLeast ? t('choice.duration.atLeast', { duration }) : duration
}

export type ChoiceButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName; label: ReactNode; detail?: ReactNode; duration?: ReactNode
  estimate?: ChoiceEstimate; thoughtEstimate?: ChoiceEstimate
}

export default function ChoiceButton({ icon, label, detail, duration, estimate, thoughtEstimate: _thoughtEstimate, className = '', ...props }: ChoiceButtonProps) {
  const time = estimate ? formatChoiceEstimate(estimate) : duration
  return <button {...props} className={`${className} choice-button`}>
    <Icon name={icon} className="choice-icon story-action-icon" />
    <div className="choice-copy"><strong>{label}</strong>{detail}</div>
    {time && <small className="choice-time choice-estimate choice-duration event-choice-time">{time}</small>}
  </button>
}
