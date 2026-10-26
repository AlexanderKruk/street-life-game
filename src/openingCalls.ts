import { t } from './i18n'
export const OPENING_CALLS_KEY = 'street-life-opening-calls-v1'
export const CALL_BATTERY_PER_MINUTE = 0.2

export const OPENING_CALLS = [
  {
    id: 'call-university', minutes: 2, moodLoss: 2,
    label: t('phone.call.call-university.label'),
    callingTitle: t('phone.call.call-university.callingTitle'), title: t('phone.call.call-university.title'),
    text: t('phone.call.call-university.text'),
    illustration: 'event-call-no-answer',
  },
  {
    id: 'call-colleague', minutes: 5, moodLoss: 5,
    label: t('phone.call.call-colleague.label'),
    callingTitle: t('phone.call.call-colleague.callingTitle'), title: t('phone.call.call-colleague.title'),
    text: t('phone.call.call-colleague.text'),
    illustration: 'event-call-family',
  },
  {
    id: 'call-friend', minutes: 5, moodLoss: 5,
    label: t('phone.call.call-friend.label'),
    callingTitle: t('phone.call.call-friend.callingTitle'), title: t('phone.call.call-friend.title'),
    text: t('phone.call.call-friend.text'),
    illustration: 'event-call-small-room',
  },
] as const

export function openingCall(id: string) {
  return OPENING_CALLS.find(call => call.id === id)
}

export function loadOpeningCallIndex(storage: Pick<Storage, 'getItem'>, existingGame: boolean): number {
  try {
    const raw = storage.getItem(OPENING_CALLS_KEY)
    const index = raw === null ? null : JSON.parse(raw)
    if (Number.isInteger(index) && index >= 0 && index <= OPENING_CALLS.length) return index
  } catch { /* Invalid progression must not rewrite an existing run. */ }
  return existingGame ? OPENING_CALLS.length : 0
}
