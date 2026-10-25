import type { GameState } from './game'

export const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']


export function weekday(day: number) {
  return WEEKDAYS[(day - 1) % WEEKDAYS.length]
}


export function formatTravelTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}


export function absoluteMinutes(game: GameState) {
  return (game.day - 1) * 1440 + game.minutes
}

