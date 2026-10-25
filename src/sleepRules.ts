import type { GameState } from './game'
import type { SleepState } from './stateTypes'

export const SLEEP_HOURS = [2, 4, 6, 8] as const

export const DEBUG_SLEEP_SPEED = 10

export const SHELTER_CHECKOUT_WARNING = 7 * 60 + 30


// A sheltered night always ends at 07:30, including saved sleep sessions.
export function shelterSleepMinutes(startAbsolute: number, requested: number) {
  const minute = startAbsolute % 1440
  const untilCheckout = (minute < SHELTER_CHECKOUT_WARNING ? SHELTER_CHECKOUT_WARNING : 1440 + SHELTER_CHECKOUT_WARNING) - minute
  return Math.min(requested, untilCheckout)
}


export function availableSleepHours(energy: number): readonly number[] {
  if (energy > 75) return [2]
  if (energy > 50) return [2, 4]
  if (energy > 25) return [4, 6]
  return [6, 8]
}


export function sleepDurationUnavailable(hours: number, energy: number) {
  const available = availableSleepHours(energy)
  if (available.includes(hours)) return null
  return hours < available[0] ? 'Too tired for a short sleep.' : 'Not tired enough for a long sleep.'
}


export function clearSleepIllness(game: GameState): GameState {
  if (game.sleepIllnessDose === undefined && game.sleepIllnessMinutes === undefined) return game
  const next = { ...game }
  delete next.sleepIllnessDose
  delete next.sleepIllnessMinutes
  return next
}

export function sleepElapsed(sleep: SleepState, now = Date.now()) {
  return Math.min(sleep.total, Math.max(0, Math.floor(((now - sleep.realStartedAt) / 1000) * DEBUG_SLEEP_SPEED)))
}
