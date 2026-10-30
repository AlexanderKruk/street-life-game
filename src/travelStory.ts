import { t } from './i18n'
import { getTravelDisplayPhase } from './travelPhases'
import type { Trip } from './stateTypes'

const phaseKeys = {
  walking: 'travel.story.walking', approachingCrossing: 'travel.story.approachingCrossing',
  waitingForGreen: 'travel.story.waitingForGreen', crossingRoad: 'travel.story.crossingRoad',
  walkingOn: 'travel.story.walkingOn', toStop: 'travel.story.toStop', waiting: 'travel.story.waiting',
  riding: 'travel.story.riding', toDestination: 'travel.story.toDestination',
} as const

/** Identity is stable across ticks, interruptions and reload; no new RNG. */
export function travelStoryKey(trip: Trip) {
  const start = trip.before?.game
  return JSON.stringify([start?.day, start?.minutes, start?.locationId, trip.destinationId, trip.mode, trip.total])
}
export function travelStoryPhase(trip: Trip, underCover: boolean) {
  const id = underCover ? 'underCover' : getTravelDisplayPhase(trip).id
  return { id, text: id === 'underCover' ? t('travel.story.underCover') : t(phaseKeys[id as keyof typeof phaseKeys]) }
}

export function arrivalStoryText(destinationId: string, name: string) {
  return destinationId === 'station' ? t('travel.story.arrivedStation') : t('travel.story.arrived', { place: name })
}
