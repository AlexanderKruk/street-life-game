import type { WeatherConditions } from './weather'
import type { ImpactId } from './effectChips'
import type { IconName } from './Icon'
import { CLOTHING_WETNESS_ENABLED } from './gameplayFeatures'
import { sleepIllnessHazard, type SleepKind } from './sleepIllness'
import { RAIN, rainRisk, type RainEpisode } from './rain'

export type Need = 'hunger' | 'thirst' | 'energy' | 'health' | 'hygiene' | 'mood'
export type Housing = 'Street' | 'Night shelter' | 'Schronisko' | 'Hostel' | 'Room' | 'Apartment'
export type MoodLimitReason = Housing | 'Hunger' | 'Thirst' | 'Health' | 'Tiredness' | 'Hygiene' | 'Cold'
export const HOUSING_MOOD_CAP: Record<Housing, number> = {
  Street: 50, 'Night shelter': 60, Schronisko: 70, Hostel: 80, Room: 90, Apartment: 100,
}

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
  rainUntil?: number
  rainSystemStarted?: boolean
  nextRainAt?: number
  rainScheduleDay?: number
  rainStartsToday?: number
  rain?: RainEpisode
  rainResults?: RainEpisode[]
  wetness?: number
  wetSleepLoss?: number
  sleepIllnessDose?: number
  sleepIllnessMinutes?: number
}

export type Location = {
  id: string
  name: string
  icon: string
  description: string
  open: number
  close: number
  travelMinutes: number
  travelRange?: { min: number; max: number }
}

export function travelTimeRange(baseMinutes: number) {
  const min = Math.max(1, Math.ceil(baseMinutes * 0.95))
  return { min, max: Math.max(min, Math.floor(baseMinutes * 1.2)) }
}

// Sample once per trip: ordinary routes use -5% / +20%, nearby routes can supply a range.
export function randomTravelMinutes(baseMinutes: number | { min: number; max: number }, random = Math.random) {
  const { min, max } = typeof baseMinutes === 'number' ? travelTimeRange(baseMinutes) : baseMinutes
  return min + Math.floor(random() * (max - min + 1))
}

export function destinationTravelTimeRange(destination: Location, mode: 'walk' | 'transit' | 'fare-dodge') {
  // Nearby shops take as long by bus once walking to a stop and waiting count.
  return destination.travelRange ?? travelTimeRange(mode === 'walk' ? destination.travelMinutes : Math.ceil(destination.travelMinutes * 0.5))
}

export type ActionResult = {
  minutes: number
  money?: number
  hunger?: number
  thirst?: number
  energy?: number
  health?: number
  hygiene?: number
  hygieneCap?: number
  mood?: number
  intoxication?: number
  message?: string
}

export type GameAction = {
  icon: IconName
  id: string
  locationId: string
  name: string
  description: string
  minutes: number
  cost?: number
  impacts?: ImpactId[]
  requiresOpen?: boolean
  resolve: (state: GameState) => ActionResult
}

export const locations: Location[] = [
  { id: 'street', name: 'Street', icon: '🌆', description: 'Chance encounters, small opportunities and unexpected trouble.', open: 0, close: 1440, travelMinutes: 60 },
  { id: 'station', name: 'Station', icon: '🚉', description: 'Crowds, benches and small chances to earn.', open: 0, close: 1440, travelMinutes: 65 },
  { id: 'shop', name: 'Small Shop', icon: '🛒', description: 'Affordable food, water and everyday supplies.', open: 420, close: 1320, travelMinutes: 10, travelRange: { min: 5, max: 15 } },
  { id: 'shelter', name: 'Night Shelter', icon: '🛏️', description: 'Overnight accommodation. Open from 18:00 until 08:00; places are limited.', open: 1080, close: 480, travelMinutes: 90 },
  { id: 'support', name: 'Help Center', icon: '🤝', description: 'Social workers can help with documents, benefits, accommodation and other support.', open: 480, close: 960, travelMinutes: 105 },
  { id: 'residential-shelter', name: 'Schronisko', icon: '🏠', description: '24/7 supported accommodation. Access requires a referral from Help Center.', open: 0, close: 1440, travelMinutes: 120 },
  { id: 'daycenter', name: 'Day Center', icon: '🧼', description: 'A warm place indoors with free showers, laundry and phone charging.', open: 480, close: 960, travelMinutes: 90 },
  { id: 'free-clinic', name: 'Free Clinic', icon: '🩺', description: 'Free basic medical care. No insurance needed.', open: 480, close: 960, travelMinutes: 90 },
  { id: 'hospital', name: 'Hospital', icon: '🏥', description: 'Regular medical care requires documents. Emergency care is available for critical conditions.', open: 480, close: 1080, travelMinutes: 105 },
  { id: 'jobcenter', name: 'Job Centre', icon: '📋', description: 'Vacancies and appointments.', open: 480, close: 900, travelMinutes: 105 },
  { id: 'work', name: 'Day Work', icon: '📦', description: 'Short shifts of physical work, paid when you finish.', open: 420, close: 1080, travelMinutes: 120 },
]

export const initialState: GameState = {
  day: 1,
  minutes: 22 * 60,
  money: 25,
  hunger: 72,
  thirst: 66,
  energy: 68,
  health: 90,
  hygiene: 75,
  mood: 30,
  intoxication: 0,
  locationId: 'street',
}

export function createInitialState(): GameState {
  return { ...initialState, money: 25 + Math.floor(Math.random() * 26) }
}

const clamp = (value: number) => Math.max(0, Math.min(100, value))

export function conditionBand(value: number) {
  if (value <= 20) return { level: 'very-bad' as const }
  if (value <= 40) return { level: 'bad' as const }
  if (value <= 60) return { level: 'fair' as const }
  if (value <= 80) return { level: 'ok' as const }
  return { level: 'very-good' as const }
}

// Compatibility name for callers: there is one Mood, never a second average.
export function overallCondition(state: GameState) {
  return conditionBand(state.mood)
}

export function moodLimit(state: GameState, context: TimeContext = {}) {
  const housing = context.housing ?? 'Street'
  const limits: { reason: MoodLimitReason; cap: number }[] = [
    { reason: housing, cap: HOUSING_MOOD_CAP[housing] ?? HOUSING_MOOD_CAP.Street },
    { reason: 'Hunger', cap: Math.min(100, 20 + clamp(state.hunger) * 2) },
    { reason: 'Thirst', cap: Math.min(100, 20 + clamp(state.thirst) * 2) },
    { reason: 'Health', cap: Math.min(100, 20 + clamp(state.health) * 2) },
    { reason: 'Tiredness', cap: Math.min(100, 40 + clamp(state.energy)) },
    // Hygiene alone is a mild restriction, rather than another severe need.
    { reason: 'Hygiene', cap: Math.min(100, 80 + clamp(state.hygiene) * .4) },
  ]
  if (context.effects?.some(effect => effect.id === 'cold' && effect.expiresAt > absoluteMinutes(state))) {
    limits.push({ reason: 'Cold', cap: 60 })
  }
  const cap = Math.min(...limits.map(limit => limit.cap))
  return { cap, reasons: cap < 100 ? limits.filter(limit => Math.abs(limit.cap - cap) < .001).map(limit => limit.reason) : [] }
}

export function limitMood(state: GameState, context: TimeContext = {}): GameState {
  const mood = Math.min(clamp(state.mood), moodLimit(state, context).cap)
  return mood === state.mood ? state : { ...state, mood }
}

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

// Baseline full meters: Food 48h, Water 24h, awake Energy 36h.
export const NEED_DRAIN = { food: 100 / (48 * 60), water: 100 / (24 * 60), energy: 100 / (36 * 60) }
const WALKING_NEED_MULTIPLIER = 1.25

export const WEATHER: WeatherConditions[] = [
  { icon: '☁️', id: 'Cloudy', temp: 9, energyDrain: 0, thirstDrain: 0 },
  { icon: '🌧️', id: 'Rain', temp: 7, energyDrain: 0.025, thirstDrain: 0 },
  { icon: '☀️', id: 'Clear', temp: 16, energyDrain: 0, thirstDrain: NEED_DRAIN.water * 0.15 },
  { icon: '🌬️', id: 'Windy', temp: 6, energyDrain: 0.035, thirstDrain: 0 },
  { icon: '🌦️', id: 'Showers', temp: 10, energyDrain: 0.015, thirstDrain: 0 },
]

export function rainDailyLimit(day: number) {
  if (day <= 1) return 0 // The opening two-hour evening remains dry.
  const weather = WEATHER[(day - 1) % WEATHER.length].id
  return weather === 'Cloudy' ? 1 : weather === 'Rain' || weather === 'Showers' ? Infinity : 0
}

// Calendar saves are 1-based. Release rain can start on the first full day (D1).
export function weatherAt(state: Pick<GameState, 'day' | 'minutes' | 'rainUntil' | 'rain' | 'rainSystemStarted'>): WeatherConditions {
  if (state.day <= 1 || (state.day <= 2 && (!state.rainSystemStarted || CLOTHING_WETNESS_ENABLED))) return WEATHER[0]
  if (state.rainSystemStarted) {
    if (state.rain && state.rain.end > absoluteMinutes(state)) {
      const level = state.rain.level
      return { ...WEATHER[1], id: level === 'drizzle' ? 'Drizzle' : level === 'downpour' ? 'Downpour' : 'Rain', energyDrain: 0 }
    }
    const base = WEATHER[(state.day - 1) % WEATHER.length]
    // The separate, experimental moisture model retains its legacy weather
    // inputs for tuning. Release gameplay uses only temporary rain episodes.
    if (CLOTHING_WETNESS_ENABLED) return base
    // Rainy describes the day between showers, without applying rain exposure.
    return base.id === 'Rain' ? { ...base, id: 'Rainy', energyDrain: 0 }
      : base.id === 'Showers' ? { ...base, energyDrain: 0 } : base
  }
  return (state.rainUntil ?? 0) > absoluteMinutes(state) ? WEATHER[1] : WEATHER[(state.day - 1) % WEATHER.length]
}

export function temperatureAt(base: number, minutes: number) {
  return Math.round(base - Math.cos(((minutes / 60 - 5) / 10) * Math.PI) * 4)
}

export type TimeContext = {
  housing?: Housing
  effects?: readonly { id: string; expiresAt: number }[]
  sleeping?: boolean
  sleepKind?: SleepKind
  walking?: boolean
  music?: boolean
  exposure?: 'outside' | 'cover' | 'indoors' | 'transit'
}

export function weatherExposure(state: GameState, context: TimeContext = {}) {
  if (context.exposure) return context.exposure
  if (context.walking) return 'outside'
  const place = locations.find(place => place.id === state.locationId)
  return place && !['street', 'work'].includes(place.id) && isOpen(place, state.minutes) ? 'indoors' : 'outside'
}

// Minute-sized steps make an instant action and timer ticks use the same rules,
// including effect expiry and changes of day/weather within an action.
export function advanceTime(state: GameState, minutes: number, context: TimeContext = {}): GameState {
  let next = { ...state }
  if (!CLOTHING_WETNESS_ENABLED) { delete next.wetness; delete next.wetSleepLoss }
  for (let left = Math.max(0, minutes); left > 0;) {
    const step = Math.min(1, left)
    left -= step
    const now = absoluteMinutes(next)
    const weather = weatherAt(next)
    const active = (id: string) => context.effects?.some(effect => effect.id === id && effect.expiresAt > now)
    const cold = active('cold')
    const wellFed = active('well-fed')
    const walkingExtra = context.walking ? WALKING_NEED_MULTIPLIER - 1 : 0
    const hunger = clamp(next.hunger - NEED_DRAIN.food * ((wellFed ? 0.5 : 1) + walkingExtra) * step)
    const thirst = clamp(next.thirst - (NEED_DRAIN.water * (1 + walkingExtra) + weather.thirstDrain) * step)
    const health = clamp(next.health - ((thirst <= 0 ? 0.10 : thirst <= 10 ? 0.025 : 0) +
      (hunger <= 0 ? 0.035 : hunger <= 10 ? 0.012 : 0) + (cold ? 0.012 : 0)) * step)
    const temperature = temperatureAt(weather.temp, next.minutes)
    const exposure = weatherExposure(next, context)
    const wetBefore = CLOTHING_WETNESS_ENABLED ? clamp(next.wetness ?? 0) : 0
    const rainGain = exposure === 'outside' ? weather.id === 'Rain' ? 1 : weather.id === 'Showers' ? 0.6 : 0 : 0
    const drying = exposure === 'indoors' ? next.locationId === 'station' || next.locationId === 'shop' ? 0.6 : 1.2
      : exposure === 'transit' ? 0.3 : exposure === 'cover' ? 0.15 : weather.id === 'Windy' ? 0.4 : 0.2
    const wetness = CLOTHING_WETNESS_ENABLED ? clamp(wetBefore + (rainGain || -drying) * step) : 0
    const wetStress = (wetBefore + wetness) / 200 * (temperature <= 10 ? 1 : temperature <= 15 ? 0.65 : 0.35)
      * (exposure === 'indoors' || exposure === 'transit' ? 0.25 : weather.id === 'Windy' ? 1.25 : 1)
    const wetSleepLoss = (next.wetSleepLoss ?? 0) + (context.sleeping && exposure !== 'indoors' && exposure !== 'transit' ? wetStress * 0.04 * step : 0)
    const trackSleepRisk = context.sleeping && (context.sleepKind === 'ground' || context.sleepKind === 'bench')
    const sleepIllnessDose = trackSleepRisk ? (next.sleepIllnessDose ?? 0) + sleepIllnessHazard(context.sleepKind!, temperature, weather.id, (wetBefore + wetness) / 2, exposure) * step : undefined
    const walkingHygiene = context.walking ? (temperature >= 25 ? 0.05 : temperature >= 18 ? 0.033 : 0.025) : 0
    const energyDrain = context.sleeping ? 0 :
      NEED_DRAIN.energy * step * healthEnergyMultiplier(next.health) + weather.energyDrain * step +
      (context.walking ? 0.01 * step * healthEnergyMultiplier(health) : 0) + (cold ? 0.045 * step : 0) + wetStress * 0.04 * step
    const energy = Math.min(energyCap(health), clamp(next.energy - energyDrain))
    const hygiene = clamp(next.hygiene - step / 180 - walkingHygiene * step)
    const total = next.minutes + step
    next = { ...next, day: next.day + Math.floor(total / 1440), minutes: total % 1440,
      hunger, thirst, health, energy, hygiene,
      ...(wetness > 0 || next.wetness !== undefined ? { wetness } : {}),
      ...(wetSleepLoss > 0 || next.wetSleepLoss !== undefined ? { wetSleepLoss } : {}),
      ...(trackSleepRisk ? { sleepIllnessDose, sleepIllnessMinutes: (next.sleepIllnessMinutes ?? 0) + step } : {}),
      mood: clamp(next.mood - (cold ? 0.012 * step : 0) - wetStress * 0.025 * step + (context.music ? 0.012 * step : 0)),
      intoxication: clamp(next.intoxication - step / 6),
    }
    next = limitMood(next, context)
    // Rain has its own minute-by-minute exposure, entirely separate from the
    // disabled clothing-moisture feature. Indoor/transit minutes are protected.
    if (next.rain && next.rainSystemStarted) {
      let rain = { ...next.rain }
      const activeMinutes = Math.max(0, Math.min(step, rain.end - now))
      const outside = exposure === 'outside' && !context.sleeping
      const searching = rain.choice === 'proper' && rain.searchRemaining > 0
      const protectedHere = rain.locationId === next.locationId
      const fraction = !outside || !rain.choice ? 0 : rain.choice === 'nearby' && protectedHere ? 1 - rain.protection
        : rain.choice === 'proper' && protectedHere ? Math.min(activeMinutes, rain.searchRemaining) / (activeMinutes || 1) : 1
      const exposureMinutes = activeMinutes * fraction
      const energyLoss = Math.min(next.energy, RAIN[rain.level].energy * exposureMinutes)
      const moodLoss = Math.min(next.mood, RAIN[rain.level].mood * exposureMinutes)
      rain = { ...rain, energyLoss: rain.energyLoss + energyLoss, moodLoss: rain.moodLoss + moodLoss,
        exposure: rain.exposure + exposureMinutes * (temperature <= 10 ? 1 : temperature <= 15 ? .5 : .1),
        searchRemaining: searching ? Math.max(0, rain.searchRemaining - activeMinutes) : rain.searchRemaining,
        waited: rain.waited + (rain.choice === 'nearby' || rain.choice === 'proper' ? activeMinutes : 0) }
      next = { ...next, energy: next.energy - energyLoss, mood: next.mood - moodLoss, rain }
      if (absoluteMinutes(next) >= rain.end) {
        const completed = { ...rain, cold: !active('cold') && rain.coldRoll < rainRisk(rain) }
        next = { ...next, rain: undefined, rainResults: rain.choice ? [...(next.rainResults ?? []), completed] : next.rainResults }
      }
    }
  }
  return next
}

export function applyAction(state: GameState, result: ActionResult, context: TimeContext = {}): GameState {
  const next = advanceTime(state, result.minutes, context)
  const health = clamp(next.health + (result.health ?? 0))
  return limitMood({ ...next,
    money: Math.max(0, next.money + (result.money ?? 0)),
    hunger: clamp(next.hunger + (result.hunger ?? 0)),
    thirst: clamp(next.thirst + (result.thirst ?? 0)),
    energy: Math.min(energyCap(health), clamp(next.energy + (result.energy ?? 0))),
    health,
    hygiene: clamp((result.hygiene ?? 0) > 0
      ? Math.max(next.hygiene, Math.min(result.hygieneCap ?? 100, next.hygiene + (result.hygiene ?? 0)))
      : next.hygiene + (result.hygiene ?? 0)),
    mood: clamp(next.mood + (result.mood ?? 0)),
    intoxication: clamp(next.intoxication + (result.intoxication ?? 0)),
  }, context)
}

export function applySleepTime(state: GameState, minutes: number, context: TimeContext = {}): GameState {
  return advanceTime(state, minutes, { ...context, sleeping: true, walking: false, music: false })
}

export function isOpen(location: Location, minutes: number) {
  if (location.open === 0 && location.close === 1440) return true
  if (location.open > location.close) return minutes >= location.open || minutes < location.close
  return minutes >= location.open && minutes < location.close
}

export const actions: GameAction[] = [
  {
    icon: 'bed',
    id: 'street-sleep', locationId: 'street', name: 'Sleep on the ground',
    description: 'Lie down wherever you can. Free, exposed, dirty, and barely restorative.', minutes: 8 * 60, requiresOpen: false,
    resolve: () => ({ minutes: 8 * 60, energy: 52, hygiene: -12, mood: -9, message: 'You sleep on the ground in short, uneasy stretches. You wake stiff, dirty and exhausted.' }),
  },
  {
    icon: 'bench',
    id: 'station-rest', locationId: 'station', name: 'Sit and recover',
    description: 'Rest on a bench and recover some Energy.', minutes: 40, requiresOpen: false,
    resolve: () => ({ minutes: 40, energy: 13, mood: 2, message: 'You sit for a while. Your legs feel a little better.' }),
  },
  {
    icon: 'phone',
    id: 'station-charge', locationId: 'station', name: 'Charge phone',
    description: 'Use the outlet in the waiting room.', minutes: 60, requiresOpen: false,
    resolve: () => ({ minutes: 60, energy: 5, mood: 1, message: 'You spend an hour near a power outlet at the station.' }),
  },
  {
    icon: 'bed',
    id: 'station-sleep', locationId: 'station', name: 'Try to sleep',
    description: 'Rest on a station bench. You may be disturbed, and your belongings are still at risk.', minutes: 8 * 60, requiresOpen: false,
    resolve: () => ({ minutes: 0, message: 'You try to sleep on a station bench.' }),
  },
  {
    icon: 'water',
    id: 'shop-water', locationId: 'shop', name: 'Buy water',
    description: 'A bottle of water. Cheap and immediately useful.', minutes: 5, cost: 3,
    resolve: () => ({ minutes: 5, money: -3, thirst: 38, message: 'You drink a bottle of water.' }),
  },
  {
    icon: 'person',
    id: 'shop-roll', locationId: 'shop', name: 'Buy bread and a roll',
    description: 'Cheap calories. Enough to keep going.', minutes: 10, cost: 5,
    resolve: () => ({ minutes: 10, money: -5, hunger: 22, mood: 1, message: 'You buy some food and eat outside.' }),
  },
  {
    icon: 'food',
    id: 'shop-meal', locationId: 'shop', name: 'Buy a filling meal',
    description: 'Costs more, but buys you breathing room.', minutes: 15, cost: 8,
    resolve: () => ({ minutes: 15, money: -8, hunger: 48, thirst: 8, mood: 5, message: 'You sit down to a filling meal. It helps to have something warm to eat.' }),
  },
  {
    icon: 'clock',
    id: 'daycenter-stay', locationId: 'daycenter', name: 'Stay indoors',
    description: 'Warm up and rest indoors.', minutes: 60,
    resolve: () => ({ minutes: 60, energy: 10, mood: 5, message: 'You spend an hour indoors, warm up and get off your feet.' }),
  },
  {
    icon: 'shower',
    id: 'daycenter-shower', locationId: 'daycenter', name: 'Take a shower',
    description: 'Use the free shower. There may be a short wait.', minutes: 40,
    resolve: () => ({ minutes: 40, hygiene: 50, hygieneCap: 70, mood: 4, message: 'You rinse off with water only. Shower gel would help you get cleaner.' }),
  },
  {
    icon: 'laundry',
    id: 'daycenter-laundry', locationId: 'daycenter', name: 'Do laundry',
    description: 'Wash and dry your clothes.', minutes: 90,
    resolve: () => ({ minutes: 90, hygiene: 18, mood: 5, message: 'Your clothes are washed and dried.' }),
  },
  {
    icon: 'phone',
    id: 'daycenter-charge', locationId: 'daycenter', name: 'Charge phone',
    description: 'Leave your phone charging while you wait.', minutes: 60,
    resolve: () => ({ minutes: 60, energy: 4, message: 'You spend an hour by a power outlet.' }),
  },
  {
    icon: 'hospital',
    id: 'daycenter-doctor', locationId: 'free-clinic', name: 'See a doctor',
    description: 'Free basic medical care. No insurance or documents needed.', minutes: 60,
    resolve: (state) => ({ minutes: 60, health: state.health < 65 ? 12 : 4, mood: 3, message: 'You are seen at the clinic and receive basic medical care.' }),
  },
  {
    icon: 'work',
    id: 'shelter-social-worker', locationId: 'shelter', name: 'Talk to shelter social worker',
    description: 'Available Tuesdays and Fridays, 16:00–20:00. Discuss extending your current place.', minutes: 30,
    resolve: () => ({ minutes: 30, mood: 2, message: 'You discuss extending your shelter place.' }),
  },
  {
    icon: 'work',
    id: 'support-worker', locationId: 'support', name: 'Talk to a social worker',
    description: 'Explain your situation and find out what support you can apply for.', minutes: 30,
    resolve: () => ({ minutes: 30, mood: 4, message: 'The social worker listens as you explain your situation, then talks you through the help available.' }),
  },
  {
    icon: 'clock',
    id: 'residential-stay', locationId: 'residential-shelter', name: 'Settle into your place',
    description: 'Use your assigned place in the 24/7 shelter.', minutes: 30,
    resolve: () => ({ minutes: 30, energy: 8, hygiene: 4, mood: 8, message: 'You settle into your place. You now have stable 24/7 shelter accommodation.' }),
  },
  {
    icon: 'bed',
    id: 'residential-sleep', locationId: 'residential-shelter', name: 'Sleep safely',
    description: 'Rest in your assigned bed. Recovery is better when fed and hydrated.', minutes: 8 * 60,
    resolve: (state) => ({ minutes: 8 * 60, energy: 90, health: state.hunger > 20 && state.thirst > 20 ? 3 : 0, hygiene: 3, mood: 8, message: state.hunger > 20 && state.thirst > 20 ? 'A safe full night restores some health.' : 'You sleep safely, but hunger or dehydration prevents physical recovery.' }),
  },
  {
    icon: 'water',
    id: 'residential-refill-water', locationId: 'residential-shelter', name: 'Refill water',
    description: 'Free · top up the water in your backpack to 4 portions.', minutes: 5,
    resolve: () => ({ minutes: 5, message: 'You refill your backpack water.' }),
  },
  {
    icon: 'water',
    id: 'shelter-refill-water', locationId: 'shelter', name: 'Refill water',
    description: 'Free · top up the water in your backpack to 4 portions.', minutes: 5,
    resolve: () => ({ minutes: 5, message: 'You refill your backpack water.' }),
  },
  {
    icon: 'shower',
    id: 'shelter-shower', locationId: 'shelter', name: 'Ask for a shower',
    description: 'There may be a queue, but it restores hygiene.', minutes: 35,
    resolve: () => ({ minutes: 35, hygiene: 55, hygieneCap: 70, energy: 4, mood: 4, message: 'You rinse off with water only. Shower gel would help you get cleaner.' }),
  },
  {
    icon: 'food',
    id: 'shelter-dinner', locationId: 'shelter', name: 'Dinner',
    description: 'Free meal with tea · 19:00–20:30.', minutes: 20,
    impacts: ['food-large', 'thirst-large', 'mood-gain'],
    resolve: () => ({ minutes: 20, hunger: 48, thirst: 38, mood: 4, message: 'You eat the free shelter dinner and drink tea.' }),
  },
  {
    icon: 'food',
    id: 'shelter-breakfast', locationId: 'shelter', name: 'Breakfast',
    description: 'Free meal with tea · 06:30–07:00.', minutes: 15,
    impacts: ['food-medium', 'thirst-large', 'mood-gain'],
    resolve: () => ({ minutes: 15, hunger: 28, thirst: 38, mood: 3, message: 'You eat breakfast and drink tea before leaving the shelter.' }),
  },
  {
    icon: 'laundry',
    id: 'shelter-laundry-drop', locationId: 'shelter', name: 'Leave clothes for laundry',
    description: 'Thursday morning only. Leave your clothes and collect them in the evening.', minutes: 10,
    resolve: () => ({ minutes: 10, mood: 1, message: 'You leave your clothes for the Thursday laundry.' }),
  },
  {
    icon: 'laundry',
    id: 'shelter-laundry-pickup', locationId: 'shelter', name: 'Collect clean laundry',
    description: 'Thursday evening. Collect the clothes you left in the morning.', minutes: 10,
    resolve: () => ({ minutes: 10, hygiene: 18, mood: 4, message: 'You collect your clean clothes.' }),
  },
  {
    icon: 'bed',
    id: 'shelter-rest', locationId: 'shelter', name: 'Registration / reserved bed',
    description: 'Arrive early to keep your place in the queue. Doors 18:00; registration 18:20–22:00. Reserved beds: check in 18:00–22:00.', minutes: 20, requiresOpen: false,
    // App owns the persisted queue and booking; this resolver cannot grant a bed.
    resolve: () => ({ minutes: 0, message: 'A bed requires successful registration.' }),
  },
]


export function absoluteMinutes(state: Pick<GameState, 'day' | 'minutes'>) {
  return (state.day - 1) * 1440 + state.minutes
}

