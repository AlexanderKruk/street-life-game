import { locale, t } from './index'
import type { ResultResourceId } from '../resultResources'

// Formatting only. Rounding decisions and elapsed minutes remain with callers.
export function formatNumber(value: number, maximumFractionDigits = 1, minimumFractionDigits = 0) {
  return new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits, minimumFractionDigits }).format(value)
}
export function formatMoney(value: number, fixed = false) {
  return t('format.money', { amount: formatNumber(value, 2, fixed ? 2 : 0) })
}
export function formatResultDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours && rest ? t('format.hoursMinutes', { hours, minutes: rest })
    : hours ? t('format.hours', { hours }) : t('format.minutes', { minutes: rest })
}
export function formatActivityElapsed(elapsed: number) {
  const minutes = Math.max(1, elapsed)
  return minutes < 60 ? t('format.elapsedMinutes', { minutes: String(minutes).padStart(2, '0') })
    : t('format.elapsedHoursMinutes', { hours: Math.floor(minutes / 60), minutes: String(minutes % 60).padStart(2, '0') })
}
export function formatResultDelta(amount: number, id: ResultResourceId, precision = 1) {
  // Round exactly as before; only render the resulting magnitude by locale.
  const signed = t('format.signedNumber', { sign: amount > 0 ? '+' : '−', amount: formatNumber(Number(Math.abs(amount).toFixed(precision)), precision) })
  if (id === 'money') return t('format.money', { amount: signed })
  if (['wetness', 'phoneBattery', 'phoneCondition', 'clothingCleanliness', 'jacket'].includes(id)) return t('format.percent', { amount: signed })
  return signed
}
