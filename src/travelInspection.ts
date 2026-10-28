import { t } from './i18n'
import { eventCheckModifier } from './eventChecks'
import { getTravelPhase } from './travelPhases'
import type { GameState } from './game'
import type { EventDiceState, TravelMode, Trip, TripInspection } from './stateTypes'

// Pick once at departure, strictly inside the on-board part of the route.
export function scheduleTripInspection(total: number, mode: TravelMode, random = Math.random): TripInspection | undefined {
  if (mode === 'walk') return undefined
  const start = Math.max(2, Math.round(total * .55))
  const end = Math.min(total - 1, Math.max(3, Math.round(total * .85)) - 1)
  if (end < start) return undefined
  return { at: start + Math.floor(random() * (end - start + 1)), status: 'scheduled' }
}

export function loadTripInspection(raw: unknown, trip: Pick<Trip, 'mode' | 'total'>): TripInspection | undefined {
  if (!raw || typeof raw !== 'object' || trip.mode === 'walk') return undefined
  const value = raw as TripInspection
  if (!Number.isInteger(value.at) || value.at <= 0 || value.at >= trip.total ||
    getTravelPhase({ ...trip, remaining: trip.total - value.at }).id !== 'riding') return undefined
  if (value.status === 'scheduled' || value.status === 'done') return { at: value.at, status: value.status }
  if (value.status !== 'rolling' || trip.mode !== 'fare-dodge' ||
    !Number.isInteger(value.modifier) || Math.abs(value.modifier!) > 20 ||
    !(value.roll === null || (Number.isInteger(value.roll) && value.roll! >= 1 && value.roll! <= 20))) return undefined
  return { at: value.at, status: 'rolling', roll: value.roll, modifier: value.modifier }
}

export function fareInspectionDice(trip: Trip, game: GameState): EventDiceState {
  const choice = {
    label: t('travel.inspection.choice'),
    check: {
      stat: 'reflex' as const, dc: 12,
      success: { message: t('travel.inspection.success') },
      failure: { money: -20, mood: -8, message: t('travel.fare.failure') },
      criticalSuccess: { mood: 2, message: t('travel.inspection.criticalSuccess') },
      criticalFailure: { money: -35, mood: -12, message: t('travel.inspection.criticalFailure') },
    },
  }
  return { choice, roll: trip.inspection?.roll ?? null, modifier: trip.inspection?.modifier ?? eventCheckModifier(game, choice),
    resolved: false, fareDodgeDestinationId: trip.destinationId, fareDodgeInTransit: true }
}
