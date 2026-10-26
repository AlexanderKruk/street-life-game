export type RainLevel = 'drizzle' | 'rain' | 'downpour'
export type RainChoice = 'nearby' | 'proper' | 'continue'
export type RainEpisode = {
  id: string; level: RainLevel; start: number; end: number
  choice: RainChoice | null; choiceAt?: number; searchRemaining: number
  protection: number; shelter: 'canopy' | 'tree'; locationId?: string
  exposure: number; energyLoss: number; moodLoss: number; waited: number
  coldRoll: number; cold?: boolean; reported?: boolean; coldGranted?: boolean
}
export const RAIN = {
  drizzle: { energy: 2 / 60, mood: 1 / 60, risk: .03 },
  rain: { energy: 6 / 60, mood: 4 / 60, risk: .12 },
  downpour: { energy: 12 / 60, mood: 8 / 60, risk: .25 },
} as const
const integer = (min: number, max: number, random: () => number) => min + Math.min(max - min, Math.floor(random() * (max - min + 1)))
export function planRainDay(state: { day: number; minutes: number; rain?: RainEpisode; rainResults?: RainEpisode[]; rainSystemStarted?: boolean; nextRainAt?: number }, limit: number, random = Math.random) {
  const start = (state.day - 1) * 1440
  const now = start + state.minutes
  // A shower carried across midnight already uses the cloudy day's one episode.
  const carried = [state.rain, ...(state.rainResults ?? [])].some(rain => rain && rain.start < start + 1440 && rain.end > start) ? 1 : 0
  let nextRainAt: number | undefined
  if (carried < limit) {
    const previous = state.rainSystemStarted && Number.isFinite(state.nextRainAt) && state.nextRainAt! >= now ? state.nextRainAt : undefined
    const candidate = now + (limit === 1 ? integer(1, Math.max(1, 1439 - state.minutes), random) : integer(90, 360, random))
    const earliestAfterExistingRain = carried ? Math.max(0, ...[state.rain, ...(state.rainResults ?? [])].map(rain => rain?.end ?? 0)) + 180 : 0
    nextRainAt = Math.max(earliestAfterExistingRain, limit === 1 ? Math.max(candidate, previous ?? now) : previous ?? candidate)
  }
  return { rainScheduleDay: state.day, rainStartsToday: carried, nextRainAt }
}
export function createRain(now: number, random = Math.random): RainEpisode {
  const level = (['drizzle', 'rain', 'downpour'] as const)[integer(0, 2, random)]
  return { id: `rain:${now}`, level, start: now, end: now + integer(1, 12, random) * 5,
    choice: null, searchRemaining: 0, protection: integer(30, 80, random) / 100,
    // Each level's nearby illustration depicts this particular shelter.
    shelter: level === 'rain' ? 'tree' : 'canopy', exposure: 0, energyLoss: 0, moodLoss: 0, waited: 0, coldRoll: random() }
}
export function chooseRain(rain: RainEpisode, choice: RainChoice, now: number, locationId: string, random = Math.random): RainEpisode {
  return { ...rain, choice, choiceAt: now, locationId, searchRemaining: choice === 'proper' ? integer(1, 5, random) : 0 }
}
export function rainRisk(rain: RainEpisode) {
  return RAIN[rain.level].risk * Math.min(1, Math.max(0, rain.exposure - 20) / 40)
}
export function rainArt(rain: Pick<RainEpisode, 'level'>, choice: RainChoice | 'opening') {
  return `/street-life-game/assets/event-rain-${rain.level}-${choice}.webp`
}
// Result identity is independent of displayed titles and prose, including old
// queued episodes whose choice is null.
export function rainResultActionId(rain: Pick<RainEpisode, 'choice' | 'searchRemaining'>) {
  return rain.choice === 'proper' && rain.searchRemaining > 0 ? 'rain-stopped'
    : rain.choice === 'continue' ? 'rain-passed' : 'rain-cover'
}

// Saved episodes and queued results are untrusted input. Never reset a whole save
// because its optional weather data belongs to an older version or is malformed.
export function validRain(value: unknown): value is RainEpisode {
  if (!value || typeof value !== 'object') return false
  const r = value as RainEpisode
  return typeof r.id === 'string' && ['drizzle', 'rain', 'downpour'].includes(r.level)
    && [null, 'nearby', 'proper', 'continue'].includes(r.choice)
    && ['canopy', 'tree'].includes(r.shelter)
    && ['start', 'end', 'searchRemaining', 'protection', 'exposure', 'energyLoss', 'moodLoss', 'waited', 'coldRoll'].every(key => Number.isFinite(r[key as keyof RainEpisode]) && Number(r[key as keyof RainEpisode]) >= 0)
    && r.end > r.start && r.end - r.start <= 60 && r.protection <= 1 && r.coldRoll <= 1 && r.searchRemaining <= 5
}
