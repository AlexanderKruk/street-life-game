import { t } from './i18n'
import { formatNumber } from './i18n/formatters'
import { displayDay } from './gameDate'
import { formatTime } from './game'
import { weekdayLabel } from './hudPresentation'
import { sleepDurationBlock } from './sleepRules'
import type { SleepState } from './stateTypes'

export const sleepKindLabel = (kind: SleepState['kind']) => t(`sleep.kind.${kind}`)
export const sleepDayLabel = (day: number) => t('sleep.date.day', { day: formatNumber(displayDay(day)), weekday: weekdayLabel(day) })
export const sleepDateLabel = (day: number, minutes: number) => t('sleep.date.full', { date: sleepDayLabel(day), time: formatTime(minutes) })
export function sleepUnavailableReason(hours: number, energy: number) {
  const reason = sleepDurationBlock(hours, energy)
  return reason === null ? null : t(reason === 'too-tired' ? 'sleep.unavailable.tooTired' : 'sleep.unavailable.notTired')
}
export function sleepCompletionText(total: number, wet: boolean, ill: boolean) {
  const hours = total / 60
  const duration = Number.isInteger(hours) ? t('sleep.duration.hours', { hours }) : formatSleepDuration(total)
  return t(ill ? wet ? 'sleep.complete.wetIll' : 'sleep.complete.ill' : wet ? 'sleep.complete.wet' : 'sleep.complete.rested', { duration })
}

export function formatSleepDuration(total: number) {
  const hours = Math.floor(total / 60), minutes = total % 60
  return hours === 0 ? t('sleep.duration.compactMinutes', { minutes })
    : minutes === 0 ? t('sleep.duration.compactHours', { hours })
    : t('sleep.duration.compactHoursMinutes', { hours, minutes })
}
