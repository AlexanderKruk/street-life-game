import { encounterDelayMs } from './deferredEncounter'
import type { WeatherId } from './weather'
import { useEffect } from 'react'
import { STREET_EVENTS, firstNightTime, firstMorningTime, nextStreetEvent, type EventContext, type EventTrigger, type StreetEvent } from './events'
import { temperatureAt, weatherAt, type GameState } from './game'
import { absoluteMinutes } from './gameTime'
import type { Inventory, LifeSituation, TravelMode } from './stateTypes'
import type { EventSession } from './eventSession'

type QueueContext = {
  game: GameState
  life: LifeSituation
  inventory: Inventory
  weather: { id: WeatherId }
  trip: boolean
  infoModal: boolean
  currentId: string
  firstNight: boolean
  deferredBlocked?: boolean
}
export function createEncounterQueue(session: EventSession, context: QueueContext) {
  const { firstNightEvents, setFirstNightEvents, encounters, setEncounters, leftHome, activeEvent, setActiveEvent, openingSearchObservation, ambientEventClock, deferredClock } = session
  const { game, life, inventory, weather, trip, infoModal, currentId, firstNight, deferredBlocked } = context
  function rememberFirstNightEvent(event: StreetEvent, state = game) {
    setFirstNightEvents(previous => ({ seen: [...new Set([...previous.seen, event.id])], lastAt: absoluteMinutes(state), pendingId: event.id }))
    openingSearchObservation.current = false
    rememberEncounter(event, state)
  }

  function encounterDue(state: GameState) {
    const previous = [firstNightEvents.lastAt, encounters.lastAt].filter((time): time is number => time !== null)
    return !previous.length || absoluteMinutes(state) - Math.max(...previous) >= 45
  }

  function rememberEncounter(event: StreetEvent, state: GameState) {
    setEncounters(previous => ({ seen: [...new Set([...previous.seen, event.id])], lastAt: absoluteMinutes(state), pendingId: event.id }))
    ambientEventClock.current.minutes = 0
    setActiveEvent(event)
  }

  function observeFirstNight(trigger: Extract<EventTrigger, 'walk' | 'bench' | 'location'>, state: GameState, locationId = state.locationId, releaseDeferred = false) {
    if (encounters.deferred && !releaseDeferred) return
    if (!firstNightTime(state) || life.housing !== 'Street' || activeEvent || infoModal || firstNightEvents.pendingId) return
    if (!encounterDue(state)) return
    const event = nextStreetEvent(trigger, { locationId, minutes: state.minutes, weather: weather.id, housing: life.housing, documents: inventory.documents, firstNight: true, nearHome: !leftHome && !trip, seenEventIds: [...firstNightEvents.seen, ...STREET_EVENTS.filter(event => !event.id.startsWith('first-night-')).map(event => event.id)] })
    if (event?.id.startsWith('first-night-')) { rememberFirstNightEvent(event, state); return true }
    return false
  }

  function observeOrdinaryEvent(trigger: 'travel' | 'location', state: GameState, travelMode?: TravelMode, observation: Pick<EventContext, 'observation' | 'elapsedMinutes'> = {}, releaseDeferred = false) {
    if (activeEvent || firstNightEvents.pendingId || encounters.pendingId) return
    if (encounters.deferred && !releaseDeferred && trigger === 'location' && observation.observation !== 'arrival' &&
      !(state.locationId === 'street' && firstMorningTime(state))) return
    // Opening observations keep priority; D1+ night encounters can occur away from home
    // even when the player skipped the at-home encounters on D0.
    const eventWeather = weatherAt(state)
    const event = nextStreetEvent(trigger, { locationId: state.locationId, day: state.day, minutes: state.minutes, temperature: temperatureAt(eventWeather.temp, state.minutes), ...observation, travelMode, weather: eventWeather.id, housing: life.housing, documents: inventory.documents, firstNight: firstNightTime(state),
      seenEventIds: [...encounters.seen, ...STREET_EVENTS.filter(event => event.id.startsWith('first-night-')).map(event => event.id)] })
    // The first-morning decision takes priority over ordinary cooldowns.
    if (event?.id !== 'city-waking' && !encounterDue(state)) return
    if (firstNightTime(state) && !firstNightEvents.seen.length && !['night-rustle', 'borrow-phone', 'park-company', 'night-patrol'].includes(event?.id ?? '')) return
    if (event) rememberEncounter(event, state)
  }

  function deferActionEncounter(trigger: 'location' | 'bench', state: GameState, elapsedMinutes: number) {
    if (!['street', 'station'].includes(state.locationId)) return
    const delayMs = encounterDelayMs()
    deferredClock.current = null
    setEncounters(previous => ({ ...previous, deferred: { token: (previous.deferred?.token ?? 0) + 1,
      locationId: state.locationId, trigger, elapsedMinutes, delayMs, remainingMs: delayMs } }))
    ambientEventClock.current.minutes = 0
  }

  function syncDeferredEncounter() {
    const pending = encounters.deferred
    if (!pending) { deferredClock.current = null; return }
    if (pending.locationId !== currentId || trip) {
      setEncounters(previous => previous.deferred ? { ...previous, deferred: undefined } : previous)
      deferredClock.current = null
      return
    }
    if (deferredBlocked || activeEvent || document.visibilityState !== 'visible') {
      deferredClock.current = null
      // A fresh activity or hidden tab must leave a full breathing space on return.
      setEncounters(previous => previous.deferred?.token === pending.token && previous.deferred.remainingMs !== previous.deferred.delayMs
        ? { ...previous, deferred: { ...previous.deferred, remainingMs: previous.deferred.delayMs } } : previous)
      return
    }
    if (!deferredClock.current || deferredClock.current.token !== pending.token) deferredClock.current = { token: pending.token, at: Date.now() }
  }

  function tickDeferredEncounter(advanceObservation: () => GameState) {
    const pending = encounters.deferred
    if (!pending) return false
    syncDeferredEncounter()
    const clock = deferredClock.current
    if (!clock || clock.at === null) return false
    const now = Date.now()
    const remainingMs = Math.max(0, pending.remainingMs - Math.max(0, now - clock.at))
    clock.at = now
    if (remainingMs > 0) {
      setEncounters(previous => previous.deferred?.token === pending.token
        ? { ...previous, deferred: { ...previous.deferred, remainingMs } } : previous)
      return false
    }
    deferredClock.current = null
    setEncounters(previous => previous.deferred?.token === pending.token ? { ...previous, deferred: undefined } : previous)
    const state = advanceObservation()
    if (!observeFirstNight(pending.trigger, state, currentId, true)) observeOrdinaryEvent('location', state, undefined,
      { observation: 'action', elapsedMinutes: pending.elapsedMinutes }, true)
    // Replace this tick’s ordinary idle observation; the shared clock still advances.
    return true
  }

  function observeIdle(minutes: number, advanceObservation: () => GameState) {
    if (encounters.deferred || !['street', 'station'].includes(currentId)) return
    const clock = ambientEventClock.current
    if (clock.locationId !== currentId) { clock.locationId = currentId; clock.minutes = 0 }
    clock.minutes += minutes
    if (clock.minutes < (firstNight ? 15 : 30)) return
    clock.minutes = 0
    // Eligibility uses the minute already queued by the shared clock.
    const state = advanceObservation()
    if (!observeFirstNight(currentId === 'station' ? 'location' : 'walk', state)) observeOrdinaryEvent('location', state, undefined, { observation: 'idle', elapsedMinutes: firstNight ? 15 : 30 })
  }

  return { rememberFirstNightEvent, rememberEncounter, observeFirstNight, observeOrdinaryEvent, encounterDue, observeIdle, deferActionEncounter, syncDeferredEncounter, tickDeferredEncounter }
}
export type EncounterQueue = ReturnType<typeof createEncounterQueue>

export function useEncounterObservers(queue: EncounterQueue, session: EventSession, context: { game: GameState; currentId: string; firstNight: boolean; blocked: boolean }) {
  const { game, currentId, firstNight, blocked } = context
  const { firstNightEvents, encounters, openingSearchObservation } = session
  const { observeFirstNight, observeOrdinaryEvent } = queue
  useEffect(() => {
    queue.syncDeferredEncounter()
    const visibility = () => queue.syncDeferredEncounter()
    document.addEventListener('visibilitychange', visibility)
    return () => document.removeEventListener('visibilitychange', visibility)
  }, [encounters.deferred?.token, blocked, currentId])
  // The opening observation becomes due during a search too, then waits for
  // its result to be acknowledged instead of being silently skipped.
  useEffect(() => {
    if (!openingSearchObservation.current || !firstNight || firstNightEvents.seen.length || absoluteMinutes(game) < 1335 || !['street', 'station'].includes(currentId)) return
    if (document.visibilityState !== 'visible' || blocked) return
    observeFirstNight(currentId === 'station' ? 'location' : 'walk', game)
  }, [firstNight, firstNightEvents, game.day, game.minutes, currentId, blocked])

  // A key story scene does not wait for the 30-minute ambient observation tick.
  // Existing activities/results finish first, then the scene opens immediately.
  useEffect(() => {
    if (!firstMorningTime(game) || currentId !== 'street' || encounters.seen.includes('city-waking')) return
    if (document.visibilityState !== 'visible' || blocked) return
    observeOrdinaryEvent('location', game)
  }, [game.day, game.minutes, currentId, encounters, firstNightEvents, blocked])

}
