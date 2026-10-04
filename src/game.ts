export type Need = 'hunger' | 'energy' | 'hygiene'

export type GameState = {
  day: number
  minutes: number
  money: number
  hunger: number
  energy: number
  hygiene: number
  locationId: string
}

export type Location = {
  id: string
  name: string
  icon: string
  description: string
  open: number
  close: number
  travelMinutes: number
}

export const locations: Location[] = [
  { id: 'station', name: 'Station', icon: '🚉', description: 'Crowds, benches and small chances to earn.', open: 0, close: 1440, travelMinutes: 10 },
  { id: 'shop', name: 'Discount shop', icon: '🛒', description: 'Cheap food, if you can afford it.', open: 420, close: 1320, travelMinutes: 15 },
  { id: 'shelter', name: 'Shelter', icon: '🛏️', description: 'A bed and shower, but places are limited.', open: 1020, close: 1320, travelMinutes: 20 },
  { id: 'support', name: 'Social support', icon: '🏢', description: 'Documents, advice and access to help.', open: 480, close: 960, travelMinutes: 25 },
  { id: 'jobcenter', name: 'Job centre', icon: '📋', description: 'Vacancies and appointments.', open: 480, close: 900, travelMinutes: 25 },
  { id: 'work', name: 'Day work', icon: '📦', description: 'Short shifts. Pay is not guaranteed.', open: 420, close: 1080, travelMinutes: 30 },
]

export const initialState: GameState = {
  day: 1,
  minutes: 8 * 60,
  money: 18,
  hunger: 72,
  energy: 68,
  hygiene: 55,
  locationId: 'station',
}

export function formatTime(minutes: number) {
  const normalized = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function advance(state: GameState, minutes: number): GameState {
  const total = state.minutes + minutes
  const extraDays = Math.floor(total / 1440)
  return {
    ...state,
    day: state.day + extraDays,
    minutes: total % 1440,
    hunger: Math.max(0, state.hunger - Math.ceil(minutes / 22)),
    energy: Math.max(0, state.energy - Math.ceil(minutes / 30)),
    hygiene: Math.max(0, state.hygiene - Math.ceil(minutes / 70)),
  }
}

export function isOpen(location: Location, minutes: number) {
  if (location.open === 0 && location.close === 1440) return true
  return minutes >= location.open && minutes < location.close
}
