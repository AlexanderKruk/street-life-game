// Existing key names are a compatibility contract, independent of build numbers.
export const FIRST_NIGHT_EVENTS_KEY = 'street-life-first-night-events-v1'
export const ENCOUNTERS_KEY = 'street-life-encounters-v1'
export const LEFT_HOME_KEY = 'street-life-left-home-v1'
export const RAIN_RESPONSE_KEY = 'street-life-rain-response-v1'
export const PHONE_ACTIVITY_KEY = 'street-life-phone-activity-v1'
export const MUSIC_WALK_USED_KEY = 'street-life-music-walk-used-v1'
export const GOAL_KEY = 'street-life-goal-v1'
export const JOURNAL_GOALS_KEY = 'street-life-journal-goals-v1'
export const JOURNAL_HISTORY_KEY = 'street-life-journal-history-v1'
export const SHELTER_ARRIVAL_KEY = 'street-life-shelter-arrival-v1'

export const SAVE_KEYS = {
  trip: 'street-life-trip-v1',
  sleep: 'street-life-sleep-v1',
  screen: 'street-life-screen',
  inventory: 'street-life-inventory-v1',
  storage: 'street-life-storage-v1',
  situation: 'street-life-situation-v1',
  effects: 'street-life-effects-v1',
  begging: 'street-life-begging-v1',
  shelterQueue: 'street-life-shelter-queue-v1',
  shelterDeparture: 'street-life-shelter-departure-v1',
  answers: 'street-life-answers-v1',
  memories: 'street-life-memories-v1',
  mobileServiceUntil: 'street-life-mobile-service-until',
  mobileAutoRenew: 'street-life-mobile-auto-renew',
  mobileRenewedDay: 'street-life-mobile-renewed-day',
  rainChoice: 'street-life-rain-choice-v1',
  discoveryVersion: 'street-life-discovery-version',
} as const

export const RAW_SAVE_KEYS: ReadonlySet<string> = new Set([SAVE_KEYS.screen, SAVE_KEYS.rainChoice, SAVE_KEYS.mobileServiceUntil, SAVE_KEYS.mobileAutoRenew, SAVE_KEYS.mobileRenewedDay])
