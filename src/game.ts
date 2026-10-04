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

export type ActionResult = {
  minutes: number
  money?: number
  hunger?: number
  energy?: number
  hygiene?: number
  message?: string
}

export type GameAction = {
  id: string
  locationId: string
  name: string
  description: string
  minutes: number
  cost?: number
  requiresOpen?: boolean
  resolve: (state: GameState) => ActionResult
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
  day: 1, minutes: 8 * 60, money: 18, hunger: 72, energy: 68, hygiene: 55, locationId: 'station',
}

const clamp = (value: number) => Math.max(0, Math.min(100, value))

export function formatTime(minutes: number) {
  const normalized = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function applyAction(state: GameState, result: ActionResult): GameState {
  const total = state.minutes + result.minutes
  const extraDays = Math.floor(total / 1440)
  return {
    ...state,
    day: state.day + extraDays,
    minutes: total % 1440,
    money: Math.max(0, state.money + (result.money ?? 0)),
    hunger: clamp(state.hunger - Math.ceil(result.minutes / 22) + (result.hunger ?? 0)),
    energy: clamp(state.energy - Math.ceil(result.minutes / 30) + (result.energy ?? 0)),
    hygiene: clamp(state.hygiene - Math.ceil(result.minutes / 70) + (result.hygiene ?? 0)),
  }
}

export function isOpen(location: Location, minutes: number) {
  if (location.open === 0 && location.close === 1440) return true
  return minutes >= location.open && minutes < location.close
}

export const actions: GameAction[] = [
  {
    id: 'station-bottles', locationId: 'station', name: 'Look for returnable bottles',
    description: 'Search bins and platforms. Slow, dirty, and unpredictable.', minutes: 45, requiresOpen: false,
    resolve: () => {
      const roll = Math.random()
      const earned = roll < .25 ? 0 : roll < .75 ? 3 : 7
      return { minutes: 45, money: earned, hygiene: -8, energy: -3, message: earned ? `You found enough bottles to make ${earned} zł.` : 'Nothing worth returning this time. You only lost time.' }
    },
  },
  {
    id: 'station-rest', locationId: 'station', name: 'Sit and recover',
    description: 'Rest on a bench. Free, but the day keeps moving.', minutes: 40, requiresOpen: false,
    resolve: () => ({ minutes: 40, energy: 13, message: 'You rested for a while. Your legs feel a little better.' }),
  },
  {
    id: 'shop-roll', locationId: 'shop', name: 'Buy bread and a roll',
    description: 'Cheap calories. Enough to keep going.', minutes: 10, cost: 5,
    resolve: () => ({ minutes: 10, money: -5, hunger: 22, message: 'You spent 5 zł on cheap food and ate outside.' }),
  },
  {
    id: 'shop-meal', locationId: 'shop', name: 'Buy a filling meal',
    description: 'Costs more, but buys you breathing room.', minutes: 15, cost: 12,
    resolve: () => ({ minutes: 15, money: -12, hunger: 48, message: 'A proper meal helps. 12 zł gone, but hunger is no longer urgent.' }),
  },
  {
    id: 'shelter-shower', locationId: 'shelter', name: 'Ask for a shower',
    description: 'There may be a queue, but it restores hygiene.', minutes: 35,
    resolve: () => ({ minutes: 35, hygiene: 55, energy: 4, message: 'You got a shower after waiting your turn.' }),
  },
  {
    id: 'shelter-rest', locationId: 'shelter', name: 'Try to get a bed',
    description: 'A place is not guaranteed. Trying still costs time.', minutes: 30,
    resolve: () => Math.random() < .7
      ? { minutes: 8 * 60, energy: 85, hygiene: 5, message: 'You got a bed. The night passes indoors.' }
      : { minutes: 30, message: 'No beds left tonight. You waited in line for nothing.' },
  },
]
