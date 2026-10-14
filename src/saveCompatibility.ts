import { initialState, locations, type GameState } from './game'

// These are storage schema versions, not build versions. Browser saves do not
// expire when we publish a release; keep their readers and regression fixtures.
export const SAVE_KEY = 'street-life-save-v3'
export const GAME_SAVE_KEYS = [SAVE_KEY, 'street-life-save-v2', 'street-life-save-v1'] as const
export const DISCOVERY_KEY = 'street-life-discovered-v1'
type SaveReader = Pick<Storage, 'getItem'>

export function readSavedGame(storage: SaveReader): GameState | null {
  for (const key of GAME_SAVE_KEYS) {
    try {
      const raw = storage.getItem(key)
      if (!raw) continue
      const saved = JSON.parse(raw)
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)
        || !Number.isInteger(saved.day) || saved.day < 1
        || !Number.isFinite(saved.minutes) || saved.minutes < 0 || saved.minutes >= 1440) continue
      const next: GameState = { ...initialState, ...saved }
      for (const field of ['money', 'hunger', 'thirst', 'energy', 'health', 'hygiene', 'mood', 'intoxication'] as const) {
        const value = saved[field]
        next[field] = typeof value === 'number' && Number.isFinite(value)
          ? Math.max(0, field === 'money' ? value : Math.min(100, value)) : initialState[field]
      }
      const locationId = saved.locationId === 'night-shelter' ? 'shelter' : saved.locationId
      next.locationId = locations.some(location => location.id === locationId) ? locationId : initialState.locationId
      if (!Number.isFinite(next.rainUntil) || next.rainUntil! < 0) delete next.rainUntil
      return next
    } catch { /* A damaged entry must not prevent another valid save loading. */ }
  }
  return null
}

export function loadDiscoveredLocations(storage: SaveReader): string[] {
  try {
    const raw = storage.getItem(DISCOVERY_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      if (Array.isArray(saved)) {
        const known = saved.map(id => id === 'night-shelter' ? 'shelter' : id)
          .filter((id): id is string => typeof id === 'string' && locations.some(location => location.id === id))
        // Before discovery schema 2, Day Center included the clinic address.
        if (storage.getItem('street-life-discovery-version') !== '2' && known.includes('daycenter')) known.push('free-clinic')
        return [...new Set(known)]
      }
    }
    // Saves from before progressive discovery already had access to the map.
    if (readSavedGame(storage)) return locations.map(location => location.id)
  } catch { /* Keep the existing new-game fallback for unreadable discovery. */ }
  return ['street', 'station', 'shop']
}
