import { useEffect, useRef } from 'react'
import { locations, destinationTravelTimeRange, randomTravelMinutes, type GameState, type ActionResult } from './game'
import type { EventOutcome, StreetEventChoice } from './events'
import { eventCheckModifier } from './eventChecks'
import type { EncounterQueue } from './encounterQueue'
import type { EventSession } from './eventSession'
import type { LifeSituation, Screen, ShelterArrival, TravelMode, Trip } from './stateTypes'
import type { ResultSnapshot } from './results'
import type { GameSetter, RunWithResult, Setter } from './controllerTypes'

type Context = {
  game: GameState
  trip: Trip | null
  selectedDestination: string | null
  streetExitPending: boolean
  blocked: boolean
  freeTransitActive: boolean
  shelterPhoneCharging: boolean
  shelterBooked: boolean
  shelterNightDay: number
}
type Host = {
  setGame: GameSetter
  setTrip: Setter<Trip | null>
  setSelectedDestination: Setter<string | null>
  setStreetExitPending: Setter<boolean>
  setStreetBenchFound: Setter<boolean>
  setShelterArrival: Setter<ShelterArrival | null>
  setLife: Setter<LifeSituation>
  setScreen: Setter<Screen>
  setMessage: Setter<string>
  openPage: (screen: Screen) => void
  recordShelterDeparture: (id: string) => void
  resultSnapshot: () => ResultSnapshot
  runWithResult: RunWithResult
  applyAction: (state: GameState, action: ActionResult) => GameState
}
export function advanceTrip(previous: Trip | null, minutes: number): Trip | null {
  return previous ? { ...previous, remaining: Math.max(0, previous.remaining - minutes) } : null
}
export function useTravelController(session: EventSession, queue: EncounterQueue, context: Context, host: Host) {
  const { setLeftHome, setDiceCheck, ambientEventClock } = session
  const { game, trip, selectedDestination, streetExitPending, blocked, freeTransitActive, shelterPhoneCharging, shelterBooked, shelterNightDay } = context
  const { setGame, setTrip, setSelectedDestination, setStreetExitPending, setStreetBenchFound, setShelterArrival, setLife, setScreen, setMessage, openPage, recordShelterDeparture, resultSnapshot, runWithResult, applyAction } = host
  const { observeFirstNight, observeOrdinaryEvent } = queue
  const lastArrival = useRef<Trip | null>(null)
  useEffect(() => {
    if (!trip || trip.remaining > 0 || lastArrival.current === trip) return
    const destination = locations.find(location => location.id === trip.destinationId)
    if (!destination) { setTrip(null); return }
    runWithResult({ id: 'arrival', title: 'Arrival', actionHistory: { kind: 'action', destinationName: destination.id === 'shelter' && shelterBooked && !(game.minutes >= 1080 && game.minutes <= 1320 && game.intoxication <= 10) ? undefined : destination.name } }, () => {
      if (lastArrival.current === trip) return
      lastArrival.current = trip
      setGame(previous => ({ ...previous, locationId: destination.id }))
      const shelterArrival = destination.id === 'shelter' && shelterBooked
      const admitted = game.minutes >= 1080 && game.minutes <= 1320 && game.intoxication <= 10
      if (shelterArrival) setLife(status => ({ ...status, shelterEntry: { night: shelterNightDay, admitted }, ...(admitted ? { shelterLastStayDay: shelterNightDay, housing: 'Night shelter' as const } : {}) }))
      setMessage(shelterArrival && !admitted
        ? 'You are outside Night Shelter. Entry is 18:00–22:00. If you miss entry, this counts as a missed night.'
        : `You arrived at ${destination.name} by ${trip.mode === 'walk' ? 'walking' : 'public transport'}.`)
      setScreen('location')
      setTrip(null)
      const arrived = { ...game, locationId: destination.id }
      if (!observeFirstNight('location', arrived)) observeOrdinaryEvent('location', arrived, undefined, { observation: 'arrival' })
    }, trip.before ?? resultSnapshot(), true, true)
  }, [trip])

  function chooseDestination(id: string) {
    if (blocked) return
    if (id === game.locationId) {
      setSelectedDestination(null)
      openPage('location')
      return
    }
    if (id === 'street') {
      setSelectedDestination(null)
      setStreetExitPending(true)
      return
    }
    setSelectedDestination(id)
  }

  function confirmStreetExit() {
    if (!streetExitPending) return
    setStreetExitPending(false)
    setLeftHome(true)
    recordShelterDeparture('street')
    if (shelterPhoneCharging) setMessage('You collected your phone from the charger before leaving Night Shelter.')
    setStreetBenchFound(false)
    setShelterArrival(null)
    ambientEventClock.current = { locationId: 'street', minutes: 0 }
    setGame(previous => ({ ...previous, locationId: 'street' }))
    openPage('location')
  }

  function attemptFareDodge() {
    if (freeTransitActive || blocked) return
    const destination = locations.find((x) => x.id === selectedDestination)
    if (!destination) return
    const choice: StreetEventChoice = {
      label: 'Ride without a ticket · Reflex DC 12',
      check: {
        stat: 'reflex', dc: 12,
        success: { message: 'No ticket inspection this time. You ride for free.' },
        failure: { money: -20, mood: -8, message: 'A ticket inspector catches you. You receive a 20 zł penalty.' },
        criticalSuccess: { mood: 2, message: 'You avoid inspection completely and ride for free.' },
        criticalFailure: { money: -35, mood: -12, message: 'Bad luck: inspectors catch you immediately. The penalty is 35 zł.' },
      },
    }
    setDiceCheck({ choice, roll: null, modifier: eventCheckModifier(game, choice), resolved: false, fareDodgeDestinationId: destination.id })
  }

  function startTravel(mode: TravelMode) {
    if (blocked) return
    const destination = locations.find((x) => x.id === selectedDestination)
    if (!destination) return
    const fare = freeTransitActive ? 0 : 4.4
    if (mode === 'transit' && game.money < fare) {
      setMessage('You do not have enough money for public transport.')
      return
    }
    const total = randomTravelMinutes(destinationTravelTimeRange(destination, mode))
    setLeftHome(true)
    recordShelterDeparture(destination.id)
    if (shelterPhoneCharging) setMessage('You collected your phone from the charger before leaving Night Shelter.')
    if (mode === 'transit') setGame((prev) => ({ ...prev, money: Math.max(0, prev.money - fare) }))
    setStreetBenchFound(false)
    setTrip({ destinationId: destination.id, mode, total, remaining: total, before: resultSnapshot() })
    setSelectedDestination(null)
    setScreen('travel')
    observeOrdinaryEvent('travel', game, mode)
  }

  function startFareDodgeTrip(id: string, outcome: EventOutcome) {
    const destination = locations.find(entry => entry.id === id)
    if (!destination) return
    const total = randomTravelMinutes(destinationTravelTimeRange(destination, 'fare-dodge'))
    setLeftHome(true)
    recordShelterDeparture(destination.id)
    setStreetBenchFound(false)
    setTrip({ destinationId: destination.id, mode: 'fare-dodge', total, remaining: total, before: { ...resultSnapshot(), game: applyAction(game, { ...outcome, minutes: outcome.minutes ?? 0 }) } })
    setSelectedDestination(null)
    setScreen('travel')
  }
  return { chooseDestination, confirmStreetExit, attemptFareDodge, startTravel, startFareDodgeTrip }
}
