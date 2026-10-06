export type Need = 'hunger' | 'thirst' | 'energy' | 'health' | 'hygiene' | 'mood'

export type GameState = {
  day: number
  minutes: number
  money: number
  hunger: number
  thirst: number
  energy: number
  health: number
  hygiene: number
  mood: number
  intoxication: number
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
  thirst?: number
  energy?: number
  health?: number
  hygiene?: number
  mood?: number
  intoxication?: number
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
  { id: 'street', name: 'Street', icon: '🌆', description: 'An exposed city block. Free to stay, but there is little safety or real rest.', open: 0, close: 1440, travelMinutes: 60 },
  { id: 'station', name: 'Station', icon: '🚉', description: 'Crowds, benches and small chances to earn.', open: 0, close: 1440, travelMinutes: 65 },
  { id: 'shop', name: 'Discount shop', icon: '🛒', description: 'Cheap food and water, if you can afford them.', open: 420, close: 1320, travelMinutes: 75 },
  { id: 'shelter', name: 'Night shelter', icon: '🛏️', description: 'Overnight accommodation. Open from 18:00 until 08:00; places are limited.', open: 1080, close: 480, travelMinutes: 90 },
  { id: 'support', name: 'Help center', icon: '🤝', description: 'Social workers can help with documents, benefits, accommodation and other support.', open: 480, close: 960, travelMinutes: 105 },
  { id: 'residential-shelter', name: 'Schronisko', icon: '🏠', description: '24/7 supported accommodation. Access requires a referral from the help center.', open: 0, close: 1440, travelMinutes: 120 },
  { id: 'daycenter', name: 'Day Center & Clinic', icon: '🧼', description: 'A daytime drop-in center with showers, laundry, phone charging, a warm indoor space and basic medical help.', open: 480, close: 960, travelMinutes: 90 },
  { id: 'hospital', name: 'Hospital', icon: '🏥', description: 'Regular medical care requires documents. Emergency care is available for critical conditions.', open: 480, close: 1080, travelMinutes: 105 },
  { id: 'jobcenter', name: 'Job centre', icon: '📋', description: 'Vacancies and appointments.', open: 480, close: 900, travelMinutes: 105 },
  { id: 'work', name: 'Day work', icon: '📦', description: 'Short shifts. Pay is not guaranteed.', open: 420, close: 1080, travelMinutes: 120 },
]

export const initialState: GameState = {
  day: 1,
  minutes: 8 * 60,
  money: 18,
  hunger: 72,
  thirst: 66,
  energy: 68,
  health: 82,
  hygiene: 55,
  mood: 58,
  intoxication: 0,
  locationId: 'street',
}

const clamp = (value: number) => Math.max(0, Math.min(100, value))

export function energyCap(health: number) {
  if (health < 20) return 60
  if (health < 40) return 75
  return 100
}

export function healthEnergyMultiplier(health: number) {
  if (health < 20) return 1.6
  if (health < 40) return 1.3
  if (health < 70) return 1.15
  return 1
}

export function formatTime(minutes: number) {
  const normalized = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function applyAction(state: GameState, result: ActionResult): GameState {
  const total = state.minutes + result.minutes
  const extraDays = Math.floor(total / 1440)
  const hunger = clamp(state.hunger - result.minutes / 14.4 + (result.hunger ?? 0))
  const thirst = clamp(state.thirst - result.minutes / 10.8 + (result.thirst ?? 0))
  const energySpent = result.minutes / 9.6 * healthEnergyMultiplier(state.health)
  const nextHealth = clamp(state.health + (result.health ?? 0))
  const energy = Math.min(energyCap(nextHealth), clamp(state.energy - energySpent + (result.energy ?? 0)))
  const hygiene = clamp(state.hygiene - result.minutes / 43.2 + (result.hygiene ?? 0))
  // Abstract gameplay scale, not BAC/promille. Roughly 10 points wear off per game hour.
  const intoxication = clamp(state.intoxication - result.minutes / 6 + (result.intoxication ?? 0))

  return {
    ...state,
    day: state.day + extraDays,
    minutes: total % 1440,
    money: Math.max(0, state.money + (result.money ?? 0)),
    hunger,
    thirst,
    energy,
    health: nextHealth,
    hygiene,
    mood: clamp(state.mood + (result.mood ?? 0)),
    intoxication,
  }
}

export function applySleepTime(state: GameState, minutes: number): GameState {
  const total = state.minutes + minutes
  const extraDays = Math.floor(total / 1440)
  return {
    ...state,
    day: state.day + extraDays,
    minutes: total % 1440,
    hunger: clamp(state.hunger - minutes / 14.4),
    thirst: clamp(state.thirst - minutes / 10.8),
    hygiene: clamp(state.hygiene - minutes / 43.2),
    intoxication: clamp(state.intoxication - minutes / 6),
  }
}

export function isOpen(location: Location, minutes: number) {
  if (location.open === 0 && location.close === 1440) return true
  if (location.open > location.close) return minutes >= location.open || minutes < location.close
  return minutes >= location.open && minutes < location.close
}

export const actions: GameAction[] = [
  {
    id: 'street-sleep', locationId: 'street', name: 'Sleep on the ground',
    description: 'Lie down wherever you can. Free, exposed, dirty, and barely restorative.', minutes: 8 * 60, requiresOpen: false,
    resolve: () => ({ minutes: 8 * 60, energy: 52, hygiene: -12, mood: -9, message: 'You sleep on the ground in short, uneasy stretches. You wake stiff, dirty and exhausted.' }),
  },
  {
    id: 'station-rest', locationId: 'station', name: 'Sit and recover',
    description: 'Rest on a bench. Free, but the day keeps moving.', minutes: 40, requiresOpen: false,
    resolve: () => ({ minutes: 40, energy: 13, mood: 2, message: 'You rested for a while. Your legs feel a little better.' }),
  },
  {
    id: 'station-charge', locationId: 'station', name: 'Charge phone',
    description: 'Use a public power outlet for an hour.', minutes: 60, requiresOpen: false,
    resolve: () => ({ minutes: 60, energy: 5, mood: 1, message: 'You spend an hour near a power outlet at the station.' }),
  },
  {
    id: 'station-sleep', locationId: 'station', name: 'Try to sleep',
    description: 'Try to get some sleep on a station bench. Risks will be added later.', minutes: 8 * 60, requiresOpen: false,
    resolve: () => ({ minutes: 0, message: 'You try to sleep on a station bench.' }),
  },
  {
    id: 'shop-water', locationId: 'shop', name: 'Buy water',
    description: 'A bottle of water. Cheap and immediately useful.', minutes: 5, cost: 3,
    resolve: () => ({ minutes: 5, money: -3, thirst: 38, message: 'You drank a bottle of water. 3 zł spent.' }),
  },
  {
    id: 'shop-roll', locationId: 'shop', name: 'Buy bread and a roll',
    description: 'Cheap calories. Enough to keep going.', minutes: 10, cost: 5,
    resolve: () => ({ minutes: 10, money: -5, hunger: 22, mood: 1, message: 'You spent 5 zł on cheap food and ate outside.' }),
  },
  {
    id: 'shop-meal', locationId: 'shop', name: 'Buy a filling meal',
    description: 'Costs more, but buys you breathing room.', minutes: 15, cost: 12,
    resolve: () => ({ minutes: 15, money: -12, hunger: 48, thirst: 8, mood: 5, message: 'A proper meal helps. 12 zł gone, but you feel much better.' }),
  },
  {
    id: 'daycenter-stay', locationId: 'daycenter', name: 'Stay indoors',
    description: 'Spend some time somewhere warm and safe during the day.', minutes: 60,
    resolve: () => ({ minutes: 60, energy: 10, mood: 5, message: 'You spend an hour indoors, warm up and get off your feet.' }),
  },
  {
    id: 'daycenter-shower', locationId: 'daycenter', name: 'Take a shower',
    description: 'Use the free shower. There may be a short wait.', minutes: 40,
    resolve: () => ({ minutes: 40, hygiene: 50, mood: 4, message: 'You shower and feel much cleaner.' }),
  },
  {
    id: 'daycenter-laundry', locationId: 'daycenter', name: 'Do laundry',
    description: 'Wash and dry your clothes while you are here.', minutes: 90,
    resolve: () => ({ minutes: 90, hygiene: 18, mood: 5, message: 'Your clothes are washed and dried.' }),
  },
  {
    id: 'daycenter-charge', locationId: 'daycenter', name: 'Charge phone',
    description: 'Leave your phone charging while you wait.', minutes: 60,
    resolve: () => ({ minutes: 60, energy: 4, message: 'You spend an hour by a power outlet.' }),
  },
  {
    id: 'daycenter-doctor', locationId: 'daycenter', name: 'See the clinic',
    description: 'Ask for basic medical help at the free clinic.', minutes: 60,
    resolve: (state) => ({ minutes: 60, health: state.health < 65 ? 12 : 4, mood: 3, message: 'You are seen at the clinic and receive basic medical care.' }),
  },
  {
    id: 'support-worker', locationId: 'support', name: 'Talk to a social worker',
    description: 'Explain your situation and find out what support you can apply for.', minutes: 30,
    resolve: () => ({ minutes: 30, mood: 4, message: 'The social worker listened to your situation and explained what help may be available. More support options will unlock here as you progress.' }),
  },
  {
    id: 'residential-stay', locationId: 'residential-shelter', name: 'Settle into your place',
    description: 'Use your assigned place in the 24/7 shelter.', minutes: 30,
    resolve: () => ({ minutes: 30, energy: 8, hygiene: 4, mood: 8, message: 'You settle into your place. You now have stable 24/7 shelter accommodation.' }),
  },
  {
    id: 'residential-sleep', locationId: 'residential-shelter', name: 'Sleep safely',
    description: 'Sleep for eight hours in your assigned place. Recovery is better when fed and hydrated.', minutes: 8 * 60,
    resolve: (state) => ({ minutes: 8 * 60, energy: 90, health: state.hunger > 20 && state.thirst > 20 ? 3 : 0, hygiene: 3, mood: 8, message: state.hunger > 20 && state.thirst > 20 ? 'A safe full night restores some health.' : 'You sleep safely, but hunger or dehydration prevents physical recovery.' }),
  },
  {
    id: 'shelter-shower', locationId: 'shelter', name: 'Ask for a shower',
    description: 'There may be a queue, but it restores hygiene.', minutes: 35,
    resolve: () => ({ minutes: 35, hygiene: 55, energy: 4, mood: 4, message: 'You got a shower after waiting your turn.' }),
  },
  {
    id: 'shelter-rest', locationId: 'shelter', name: 'Try to get a bed',
    description: 'A place is not guaranteed. Trying still costs time.', minutes: 30,
    resolve: (state) => Math.random() < .7
      ? { minutes: 8 * 60, energy: 85, health: state.hunger > 20 && state.thirst > 20 ? 2 : 0, hygiene: 5, mood: 10, message: state.hunger > 20 && state.thirst > 20 ? 'You got a bed. Safe sleep restores a little health.' : 'You got a bed. You rest indoors, but hunger or dehydration prevents physical recovery.' }
      : { minutes: 30, mood: -8, message: 'No beds left tonight. You waited in line for nothing.' },
  },
]


export function absoluteMinutes(state: GameState) {
  return (state.day - 1) * 1440 + state.minutes
}
