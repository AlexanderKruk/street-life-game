import { t } from './i18n'
import { locationName } from './locationText'
import { useEffect, useRef } from 'react'
import { locations, destinationTravelTimeRange, randomTravelMinutes, type GameState, type ActionResult } from './game'
import type { EventOutcome } from './events'
import { fareInspectionDice, scheduleTripInspection } from './travelInspection'
import { getTravelPhase } from './travelPhases'
import { arrivalStoryText } from './travelStory'
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
  inspectionBlocked?: boolean
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
  recordTravelStart?: (trip: Trip) => number
  recordTravelCancel?: (trip: Trip) => void
}
export function advanceTrip(previous: Trip | null, minutes: number): Trip | null {
  return previous ? { ...previous, remaining: Math.max(0, previous.remaining - minutes) } : null
}
export function useTravelController(session: EventSession, queue: EncounterQueue, context: Context, host: Host) {
  const { setLeftHome, setDiceCheck, ambientEventClock } = session
  const { game, trip, selectedDestination, streetExitPending, blocked, inspectionBlocked, freeTransitActive, shelterPhoneCharging, shelterBooked, shelterNightDay } = context
  const { setGame, setTrip, setSelectedDestination, setStreetExitPending, setStreetBenchFound, setShelterArrival, setLife, setScreen, setMessage, openPage, recordShelterDeparture, resultSnapshot, runWithResult, applyAction } = host
  const { observeFirstNight, observeOrdinaryEvent } = queue
  const lastFinishedTrip = useRef<Trip | null>(null)
  const lastStartedInspection = useRef<Trip['inspection']>(undefined)
  useEffect(() => {
    const inspection = trip?.inspection
    if (!trip || !inspection || inspection.status !== 'scheduled' || blocked || inspectionBlocked || session.activeEvent || session.diceCheck ||
      trip.remaining <= 0 || trip.total - trip.remaining < inspection.at || lastStartedInspection.current === inspection) return
    lastStartedInspection.current = inspection
    // A restored trip already beyond the bus stage must not inspect at arrival.
    const riding = getTravelPhase(trip).id === 'riding'
    if (riding && trip.mode === 'fare-dodge') {
      const dice = fareInspectionDice(trip, game)
      setTrip(previous => previous === trip ? { ...trip, inspection: { ...inspection, status: 'rolling', roll: null, modifier: dice.modifier } } : previous)
      setDiceCheck(dice)
    } else {
      setTrip(previous => previous === trip ? { ...trip, inspection: { ...inspection, status: 'done' } } : previous)
      if (riding) observeOrdinaryEvent('travel', game, trip.mode)
    }
  }, [trip, blocked, inspectionBlocked, session.activeEvent, session.diceCheck])

  useEffect(() => {
    if (!trip || trip.remaining > 0 || lastFinishedTrip.current === trip || inspectionBlocked || session.activeEvent || session.diceCheck) return
    const destination = locations.find(location => location.id === trip.destinationId)
    if (!destination) { setTrip(null); return }
    const storyEpisodeId = host.recordTravelStart?.(trip)
    runWithResult({ id: 'arrival', title: t('travel.arrivalTitle'), ...(storyEpisodeId !== undefined ? { storyEpisodeId } : {}), actionHistory: { kind: 'action', destinationId: destination.id, destinationName: destination.id === 'shelter' && shelterBooked && !(game.minutes >= 1080 && game.minutes <= 1320 && game.intoxication <= 10) ? undefined : locationName(destination.id) } }, () => {
      if (lastFinishedTrip.current === trip) return
      lastFinishedTrip.current = trip
      setGame(previous => ({ ...previous, locationId: destination.id }))
      const shelterArrival = destination.id === 'shelter' && shelterBooked
      const admitted = game.minutes >= 1080 && game.minutes <= 1320 && game.intoxication <= 10
      if (shelterArrival) setLife(status => ({ ...status, shelterEntry: { night: shelterNightDay, admitted }, ...(admitted ? { shelterLastStayDay: shelterNightDay, housing: 'Night shelter' as const } : {}) }))
      setMessage(shelterArrival && !admitted
        ? t('location.arrival.outsideShelter')
        : host.recordTravelStart ? arrivalStoryText(destination.id, locationName(destination.id))
        : t(trip.mode === 'walk' ? 'location.arrival.walk' : 'location.arrival.transit', { place: locationName(destination.id) }))
      if (!host.recordTravelStart) setScreen('location')
      setTrip(null)
      const arrived = { ...game, locationId: destination.id }
      if (!observeFirstNight('location', arrived)) observeOrdinaryEvent('location', arrived, undefined, { observation: 'arrival' })
    }, trip.before ?? resultSnapshot(), true, true)
  }, [trip, inspectionBlocked, session.activeEvent, session.diceCheck])

  function cancelTravel() {
    if (!trip || trip.remaining <= 0 || blocked || session.activeEvent || session.diceCheck || lastFinishedTrip.current === trip) return
    lastFinishedTrip.current = trip
    host.recordTravelCancel?.(trip)
    setTrip(null)
    setSelectedDestination(null)
    setStreetExitPending(false)
    setStreetBenchFound(false)
    setShelterArrival(null)
    ambientEventClock.current = { locationId: 'street', minutes: 0 }
    // Keep the latest clock, needs and all costs already paid, including fares.
    setGame(previous => ({ ...previous, locationId: 'street' }))
    openPage('location')
  }

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
    if (shelterPhoneCharging) setMessage(t('travel.collectedPhone'))
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
    startTravel('fare-dodge')
  }

  function startTravel(mode: TravelMode) {
    if (blocked || (mode === 'fare-dodge' && freeTransitActive)) return
    const destination = locations.find((x) => x.id === selectedDestination)
    if (!destination) return
    const fare = freeTransitActive ? 0 : 4.4
    if (mode === 'transit' && game.money < fare) {
      setMessage(t('travel.noMoney'))
      return
    }
    const total = randomTravelMinutes(destinationTravelTimeRange(destination, mode))
    setLeftHome(true)
    recordShelterDeparture(destination.id)
    if (shelterPhoneCharging) setMessage(t('travel.collectedPhone'))
    if (mode === 'transit') setGame((prev) => ({ ...prev, money: Math.max(0, prev.money - fare) }))
    setStreetBenchFound(false)
    const next: Trip = { destinationId: destination.id, mode, total, remaining: total, before: resultSnapshot(), ...(mode !== 'walk' ? { inspection: scheduleTripInspection(total, mode) } : {}) }
    const storyEpisodeId = host.recordTravelStart?.(next)
    setTrip({ ...next, ...(storyEpisodeId !== undefined ? { storyEpisodeId } : {}) })
    setSelectedDestination(null)
    setScreen('travel')
    if (mode === 'walk') observeOrdinaryEvent('travel', game, mode)
  }

  function startFareDodgeTrip(id: string, outcome: EventOutcome) {
    if (trip?.mode === 'fare-dodge' && trip.destinationId === id && trip.inspection?.status === 'rolling') {
      // The outcome is already applied by the event controller. Resume this trip
      // with its original departure snapshot and exact remaining distance.
      setTrip(previous => previous === trip ? { ...trip, inspection: { ...trip.inspection!, status: 'done' } } : previous)
      return
    }
    const destination = locations.find(entry => entry.id === id)
    if (!destination) return
    const total = randomTravelMinutes(destinationTravelTimeRange(destination, 'fare-dodge'))
    setLeftHome(true)
    recordShelterDeparture(destination.id)
    setStreetBenchFound(false)
    const next: Trip = { destinationId: destination.id, mode: 'fare-dodge', total, remaining: total, before: { ...resultSnapshot(), game: applyAction(game, { ...outcome, minutes: outcome.minutes ?? 0 }) } }
    const storyEpisodeId = host.recordTravelStart?.(next)
    setTrip({ ...next, ...(storyEpisodeId !== undefined ? { storyEpisodeId } : {}) })
    setSelectedDestination(null)
    setScreen('travel')
  }
  return { cancelTravel, chooseDestination, confirmStreetExit, attemptFareDodge, startTravel, startFareDodgeTrip }
}
