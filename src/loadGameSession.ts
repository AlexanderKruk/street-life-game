import { STREET_EVENTS,firstNightTime,firstMorningTime } from './events'
import { createInitialState,applySleepTime as applyGameSleepTime,locations,type GameState } from './game'
import { absoluteMinutes } from './gameTime'
import { INITIAL_INVENTORY,INITIAL_STORAGE } from './inventory'
import { loadJournalEntries } from './journal'
import { CLOSING_NOTICE_KEY } from './locationClosing'
import { loadOpeningCallIndex,openingCall } from './openingCalls'
import { readSavedGame,loadDiscoveredLocations,type SaveReader } from './saveCompatibility'
import { SHELTER_PHONE_CHARGE_KEY } from './shelterCharging'
import { SHELTER_ENTRY_OPEN,SHELTER_QUEUE_MINUTES,SHELTER_REGISTRATION_OPEN } from './shelterRules'
import { DEBUG_SLEEP_SPEED,shelterSleepMinutes } from './sleepRules'
import { loadChoiceSeed } from './streetChoiceOrder'
import type { ResultSnapshot } from './results'
import type { ActiveEffect,FirstNightEvents,Inventory,JournalGoals,LifeSituation,PhoneActivity,Screen,ShelterArrival,ShelterDeparture,ShelterQueue,SleepState,StoredItems,Trip } from './stateTypes'
import { FIRST_NIGHT_EVENTS_KEY,ENCOUNTERS_KEY,LEFT_HOME_KEY,PHONE_ACTIVITY_KEY,MUSIC_WALK_USED_KEY,GOAL_KEY,JOURNAL_GOALS_KEY,JOURNAL_HISTORY_KEY,SHELTER_ARRIVAL_KEY,SAVE_KEYS } from './saveKeys'

import { PHONE_SEARCH_MIN, PHONE_SEARCH_MAX } from './phoneActivity'
export { PHONE_SEARCH_MIN, PHONE_SEARCH_MAX } from './phoneActivity'
export const SHELTER_DEPARTURE_MINUTES = 30
export const INITIAL_LIFE: LifeSituation = { housing: 'Street', employment: 'Unemployed', income: 'None', shelterMisses: 0, shelterStrikes: 0 }

function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function validSnapshot(value: unknown): value is ResultSnapshot {
  return isRecord(value) && isRecord(value.game) && Number.isInteger(value.game.day) && value.game.day >= 1
    && Number.isFinite(value.game.minutes) && value.game.minutes >= 0 && value.game.minutes < 1440
    && isRecord(value.inventory) && Array.isArray(value.effects)
}

function validSleep(value: unknown): value is SleepState {
  return isRecord(value) && ['ground', 'bench', 'shelter', 'residential'].includes(value.kind)
    && Number.isFinite(value.total) && value.total > 0 && Number.isFinite(value.remaining)
    && value.remaining >= 0 && value.remaining <= value.total
    && Number.isFinite(value.startAbsolute) && value.startAbsolute >= 0
    && Number.isFinite(value.realStartedAt) && value.realStartedAt >= 0
    && (value.before === undefined || validSnapshot(value.before))
}

// Known scalar fields fall back independently; valid stock and mixed freshness
// arrays retain their old schema and are reconciled by foodInventory as before.
function restoreStock<T extends object>(defaults: T, value: unknown): T {
  if (!isRecord(value)) return { ...defaults }
  const next = { ...defaults, ...value } as Record<string, unknown>
  for (const [key, fallback] of Object.entries(defaults)) {
    const saved = value[key]
    if (typeof fallback === 'number' && (typeof saved !== 'number' || !Number.isFinite(saved) || saved < 0)
      || typeof fallback === 'boolean' && typeof saved !== 'boolean') next[key] = fallback
  }
  return next as T
}

export function loadLeftHome(storage: SaveReader) {
  const saved = readSavedGame(storage)
  if (!saved) return false
  if (saved.locationId !== 'street' || !firstNightTime(saved)) return true
  try {
    if (JSON.parse(storage.getItem(LEFT_HOME_KEY) ?? 'false') === true) return true
    if (JSON.parse(storage.getItem(SAVE_KEYS.trip) ?? 'null')) return true
    // Older saves did not record departure explicitly; an arrival/stopped trip
    // in History proves that the initial neighbourhood has already been left.
    const history = JSON.parse(storage.getItem(JOURNAL_HISTORY_KEY) ?? '[]')
    return Array.isArray(history) && history.some(entry => ['Arrival', 'Journey stopped'].includes(entry?.actionTitle))
  } catch { return true }
}

export function loadFirstNightEvents(storage: SaveReader, key = FIRST_NIGHT_EVENTS_KEY): FirstNightEvents {
  try {
    const saved = JSON.parse(storage.getItem(key) ?? 'null')
    const ids = new Set(STREET_EVENTS.filter(event => key === ENCOUNTERS_KEY || event.id.startsWith('first-night-')).map(event => event.id))
    // Old dawn saves must not open the new 08:00 scene before services open.
    const state = readSavedGame(storage)
    const morningPendingValid = saved?.pendingId !== 'city-waking' || !!state && state.locationId === 'street' && firstMorningTime(state)
    const pendingId = typeof saved?.pendingId === 'string' && ids.has(saved.pendingId)
      && morningPendingValid && !(['first-night-door', 'first-night-dog'].includes(saved.pendingId) && loadLeftHome(storage)) ? saved.pendingId : null
    const seen = Array.isArray(saved?.seen) ? saved.seen.filter((id: unknown): id is string => typeof id === 'string' && ids.has(id)) : []
    const pendingRoll = ['borrow-phone-slip', 'park-company'].includes(pendingId ?? '') && Number.isInteger(saved?.pendingRoll) && saved.pendingRoll >= 1 && saved.pendingRoll <= 20 ? saved.pendingRoll : null
    return { seen: [...new Set<string>([...seen, ...(pendingId ? [pendingId] : [])])], lastAt: Number.isFinite(saved?.lastAt) && saved.lastAt >= 0 ? saved.lastAt : null, pendingId, ...(pendingRoll ? { pendingRoll } : {}) }
  } catch { return { seen: [], lastAt: null, pendingId: null } }
}

export function loadPhoneActivity(storage: SaveReader, game = loadGame(storage)): PhoneActivity | null {
  try {
    const saved = JSON.parse(storage.getItem(PHONE_ACTIVITY_KEY) ?? 'null')
    if (!saved || (!['morning', 'bed', 'no-place', 'supplies', 'work', 'clinic'].includes(saved.questionId) && !openingCall(saved.questionId)) || !Number.isInteger(saved.remaining) || saved.remaining < 0 || saved.remaining > 30 || !validSnapshot(saved.before)) return null
    // Older fixed searches retain the ten-minute migration; new searches keep
    // their originally selected duration across reloads.
    const pausedMinutes = Number.isFinite(saved.pausedMinutes) && saved.pausedMinutes >= 0 ? saved.pausedMinutes : 0
    const elapsed = absoluteMinutes(game) - absoluteMinutes(saved.before.game) - pausedMinutes
    if (!Number.isFinite(elapsed) || elapsed < 0) return null
    const call = openingCall(saved.questionId)
    const total = call ? call.minutes : Number.isInteger(saved.total) && saved.total >= PHONE_SEARCH_MIN && saved.total <= PHONE_SEARCH_MAX ? saved.total : 10
    return { ...saved, total, remaining: Math.min(saved.remaining, Math.max(0, total - elapsed)), ...(saved.pausedMinutes !== undefined ? { pausedMinutes } : {}) }
  } catch { return null }
}

export function loadTrip(storage: SaveReader): Trip | null {
  try {
    const raw = storage.getItem(SAVE_KEYS.trip)
    if (!raw) return null
    const saved = JSON.parse(raw) as Trip
    return locations.some(location => location.id === saved.destinationId) &&
      ['walk', 'transit', 'fare-dodge'].includes(saved.mode) &&
      Number.isFinite(saved.total) && saved.total > 0 && Number.isFinite(saved.remaining) &&
      saved.remaining >= 0 && saved.remaining <= saved.total && (saved.before === undefined || validSnapshot(saved.before)) ? saved : null
  } catch { return null }
}

export function loadGame(storage: SaveReader): GameState {
  const game = readSavedGame(storage) ?? createInitialState()
  try {
    const sleep = JSON.parse(storage.getItem(SAVE_KEYS.sleep) ?? 'null') as SleepState | null
    if (validSleep(sleep) && (sleep.kind === 'ground' || sleep.kind === 'bench') && game.sleepIllnessDose === undefined) {
      const elapsed = Math.min(sleep.total, Math.max(0, absoluteMinutes(game) - sleep.startAbsolute))
      if (Number.isFinite(elapsed) && elapsed > 0) {
        const start = { ...(sleep.before?.game ?? game), day: Math.floor(sleep.startAbsolute / 1440) + 1, minutes: sleep.startAbsolute % 1440, locationId: game.locationId }
        const restored = applyGameSleepTime(start, elapsed, { sleepKind: sleep.kind, exposure: sleep.kind === 'bench' && game.locationId !== 'street' ? 'indoors' : 'outside' })
        return { ...game, sleepIllnessDose: restored.sleepIllnessDose, sleepIllnessMinutes: elapsed }
      }
    }
  } catch { /* Existing saves without an active outdoor sleep need no migration. */ }
  return game
}

// Read each persisted key once per mount. The snapshot is read-only: loaders
// never advance a timer or apply an action's money, battery or reward changes.
export function loadGameSession(source: SaveReader) {
  const values = new Map<string, string | null>()
  const reader: SaveReader = { getItem(key) {
    if (!values.has(key)) {
      try { values.set(key, source.getItem(key)) } catch { values.set(key, null) }
    }
    return values.get(key) ?? null
  } }
  const readNumber = (key: string) => {
    const value = Number(reader.getItem(key) ?? 0)
    return Number.isFinite(value) && value >= 0 ? value : 0
  }
  const game = loadGame(reader)
  const phoneActivity = loadPhoneActivity(reader, game)
  const trip = loadTrip(reader)
  const closingNotice: string | null = (() => {
    try {
      const id = JSON.parse(reader.getItem(CLOSING_NOTICE_KEY) ?? 'null')
      return locations.some(place => place.id === id && place.id !== 'shelter' && !(place.open === 0 && place.close === 1440)) ? id : null
    } catch { return null }
  })()
  const journalEntries = (() => {
    try {
      const saved = JSON.parse(reader.getItem(JOURNAL_HISTORY_KEY) ?? '[]')
      return loadJournalEntries(saved)
    } catch { return [] }
  })()
  const musicWalkUsed = (() => {
    const inHistory = journalEntries.some(entry => entry.actionTitle === 'Walk with music')
    try { return reader.getItem(MUSIC_WALK_USED_KEY) === 'true' || inHistory } catch { return inHistory }
  })()
  const journalGoals: JournalGoals = (() => {
    try {
      const raw = JSON.parse(reader.getItem(JOURNAL_GOALS_KEY) ?? '{}')
      return { morning: raw.morning === true, shelter: raw.shelter === true, support: raw.support === true, work: raw.work === true }
    } catch { return { morning: false, shelter: false, support: false, work: false } }
  })()
  const activeGoal: { type: 'night-shelter'; day: number; minute: number } | null = (() => {
    try {
      const saved = JSON.parse(reader.getItem(GOAL_KEY) ?? 'null')
      return saved?.type === 'night-shelter' && Number.isInteger(saved.day) && saved.day >= 1
        ? { ...saved, minute: SHELTER_ENTRY_OPEN } : null
    } catch { return null }
  })()
  const screen: Screen = (() => {
    if (phoneActivity) return 'location'
    if (trip) return 'travel'
    const saved = reader.getItem(SAVE_KEYS.screen)
    if (saved === 'journal') return 'phone'
    return saved === 'map' || saved === 'inventory' || saved === 'location' || saved === 'status' || saved === 'phone' ? saved : 'location'
  })()
  const answeredQuestions = (() => {
    try { const saved = JSON.parse(reader.getItem(SAVE_KEYS.answers) ?? '[]'); return Array.isArray(saved) ? saved.filter(value => typeof value === 'string') : [] } catch { return [] }
  })()
  const seenMemories = (() => {
    try { const saved = JSON.parse(reader.getItem(SAVE_KEYS.memories) ?? '[]'); return Array.isArray(saved) ? saved.filter(value => typeof value === 'string') : [] } catch { return [] }
  })()
  const shelterPhoneCharging = (() => {
    try { return reader.getItem(SHELTER_PHONE_CHARGE_KEY) === 'true' } catch { return false }
  })()
  const mobileServiceUntil = readNumber(SAVE_KEYS.mobileServiceUntil)
  const mobileAutoRenew = (() => reader.getItem(SAVE_KEYS.mobileAutoRenew) !== 'false')()
  const mobileRenewedDay = readNumber(SAVE_KEYS.mobileRenewedDay)
  const shelterQueue: ShelterQueue | null = (() => {
    try {
      const raw = reader.getItem(SAVE_KEYS.shelterQueue)
      if (!raw) return null
      const saved = JSON.parse(raw) as ShelterQueue
      const total = saved.total ?? SHELTER_QUEUE_MINUTES
      return saved.day === game.day && game.locationId === 'shelter' && Number.isInteger(total) && total >= SHELTER_QUEUE_MINUTES && total <= SHELTER_REGISTRATION_OPEN - 480 && Number.isFinite(saved.remaining) && saved.remaining >= 0 && saved.remaining <= total && validSnapshot(saved.before) ? saved : null
    } catch { return null }
  })()
  const shelterArrival: ShelterArrival | null = (() => {
    if (game.locationId !== 'shelter' || trip || game.minutes < 480 || game.minutes >= 1320) return null
    try {
      const saved = JSON.parse(reader.getItem(SHELTER_ARRIVAL_KEY) ?? 'null')
      if (saved?.day === game.day && Number.isInteger(saved.minute) && saved.minute >= 480 && saved.minute <= game.minutes) return saved
    } catch { /* Older saves start with their current arrival time. */ }
    return { day: game.day, minute: game.minutes }
  })()
  const shelterDeparture: ShelterDeparture | null = (() => {
    try {
      const raw = reader.getItem(SAVE_KEYS.shelterDeparture)
      if (!raw) return null
      const saved = JSON.parse(raw) as ShelterDeparture
      const elapsed = absoluteMinutes(game) - saved.startAbsolute
      return saved.day === game.day && game.locationId === 'shelter' && Number.isFinite(elapsed) && elapsed >= 0 && elapsed <= SHELTER_DEPARTURE_MINUTES && validSnapshot(saved.before) ? saved : null
    } catch { return null }
  })()
  const sleeping: SleepState | null = (() => {
    try {
      const raw = reader.getItem(SAVE_KEYS.sleep)
      if (!raw) return null
      const saved = JSON.parse(raw)
      if (!validSleep(saved)) return null
      if (saved.kind !== 'shelter') return saved
      const total = shelterSleepMinutes(saved.startAbsolute, saved.total)
      return { ...saved, total, remaining: Math.min(saved.remaining, total), realWakeAt: saved.realStartedAt + total * 1000 / DEBUG_SLEEP_SPEED }
    } catch { return null }
  })()
  const begging = (() => {
    try {
      const raw = reader.getItem(SAVE_KEYS.begging)
      const saved = raw ? JSON.parse(raw) : null
      return saved && Number.isInteger(saved.day) && saved.day >= 1 && Number.isInteger(saved.attempts) && saved.attempts >= 0
        ? { day: saved.day, attempts: Math.min(3, saved.attempts) } : { day: game.day, attempts: 0 }
    } catch { return { day: game.day, attempts: 0 } }
  })()
  const inventory: Inventory = (() => {
    try {
      const raw = reader.getItem(SAVE_KEYS.inventory)
      if (!raw) return INITIAL_INVENTORY
      const saved = JSON.parse(raw)
      if (!isRecord(saved)) return { ...INITIAL_INVENTORY }
      return { ...restoreStock(INITIAL_INVENTORY, saved), clothingCleanliness: typeof saved.clothingCleanliness === 'number' && Number.isFinite(saved.clothingCleanliness) ? Math.max(0, Math.min(100, saved.clothingCleanliness)) : Math.max(80, game.hygiene) }
    } catch {
      return INITIAL_INVENTORY
    }
  })()
  const storage: StoredItems = (() => {
    try {
      const raw = reader.getItem(SAVE_KEYS.storage)
      return restoreStock(INITIAL_STORAGE, raw ? JSON.parse(raw) : null)
    } catch {
      return INITIAL_STORAGE
    }
  })()
  const life: LifeSituation = (() => {
    try {
      const raw = reader.getItem(SAVE_KEYS.situation)
      const saved = raw ? JSON.parse(raw) : null
      if (!isRecord(saved)) return { ...INITIAL_LIFE }
      return { ...INITIAL_LIFE, ...saved,
        housing: ['Street', 'Night shelter', 'Schronisko', 'Hostel', 'Room', 'Apartment'].includes(saved.housing) ? saved.housing : INITIAL_LIFE.housing,
        employment: ['Unemployed', 'Day work'].includes(saved.employment) ? saved.employment : INITIAL_LIFE.employment,
        income: ['None', 'Irregular'].includes(saved.income) ? saved.income : INITIAL_LIFE.income,
      }
    } catch {
      return INITIAL_LIFE
    }
  })()
  const effects: ActiveEffect[] = (() => {
    try {
      const raw = reader.getItem(SAVE_KEYS.effects)
      const saved = raw ? JSON.parse(raw) : []
      return Array.isArray(saved) ? saved.filter(effect => isRecord(effect) && ['cold', 'free-transit', 'well-fed'].includes(effect.id) && Number.isFinite(effect.expiresAt)) : []
    } catch {
      return []
    }
  })()
  return { game,phoneActivity,trip,closingNotice,journalEntries,musicWalkUsed,journalGoals,activeGoal,screen,answeredQuestions,seenMemories,shelterPhoneCharging,mobileServiceUntil,mobileAutoRenew,mobileRenewedDay,shelterQueue,shelterArrival,shelterDeparture,sleeping,begging,inventory,storage,life,effects,
    choiceSeed: loadChoiceSeed(reader), openingCallIndex: loadOpeningCallIndex(reader, !!readSavedGame(reader)),
    discoveredLocations: loadDiscoveredLocations(reader), firstNightEvents: loadFirstNightEvents(reader),
    encounters: loadFirstNightEvents(reader, ENCOUNTERS_KEY), leftHome: loadLeftHome(reader),
  }
}
