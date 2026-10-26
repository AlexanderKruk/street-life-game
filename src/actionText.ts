import { t } from './i18n'
import type { LocationActionId } from './game'

export const actionName = (id: LocationActionId) => t(`action.name.${id}`)
export const actionDescription = (id: LocationActionId) => t(`action.description.${id}`)

export function showerDescription(gel: boolean, cap: number) {
  if (gel) return t(cap < 100 ? 'action.shower.gelLimitedDescription' : 'action.shower.gelDescription', { cap })
  return cap < 100 ? t('action.shower.waterLimitedDescription', { waterCap: Math.min(70, cap), cap })
    : t('action.shower.waterDescription', { cap: Math.min(70, cap) })
}
export function showerResult(gel: boolean, cap: number) {
  if (cap < 100) return t(gel ? 'action.shower.gelLimitedResult' : 'action.shower.waterLimitedResult', { cap })
  return t(gel ? 'action.shower.gelResult' : 'action.result.daycenter-shower')
}
