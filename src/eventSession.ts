import { useRef, useState } from 'react'
import { STREET_EVENTS, prepareStreetEvent, type StreetEvent } from './events'
import { eventCheckModifier } from './eventChecks'
import { fareInspectionDice } from './travelInspection'
import type { GameState } from './game'
import type { EventDiceState, FirstNightEvents, SleepState, Trip } from './stateTypes'

type InitialEvents = { firstNightEvents: FirstNightEvents; encounters: FirstNightEvents; leftHome: boolean; sleeping: SleepState | null; trip?: Trip | null }
export function useEventSession(initial: InitialEvents, game: GameState) {
  const [firstNightEvents, setFirstNightEvents] = useState(initial.firstNightEvents)
  const [leftHome, setLeftHome] = useState(initial.leftHome)
  const [encounters, setEncounters] = useState(initial.encounters)
  const openingSearchObservation = useRef(false)
  const ambientEventClock = useRef({ locationId: game.locationId, minutes: 0 })
  const deferredClock = useRef<{ token: number; at: number | null } | null>(null)
  const [activeEvent, setActiveEvent] = useState<StreetEvent | null>(() => {
    const event = STREET_EVENTS.find(event => event.id === (initial.firstNightEvents.pendingId ?? initial.encounters.pendingId))
    return event ? prepareStreetEvent(event, { locationId: game.locationId, housing: game.locationId === 'shelter' ? 'Night shelter' : 'Street', sleepKind: initial.sleeping?.kind ?? (game.locationId === 'station' ? 'bench' : 'ground') }) : null
  })
  const [diceCheck, setDiceCheck] = useState<EventDiceState | null>(() => {
    if (initial.trip?.inspection?.status === 'rolling') return fareInspectionDice(initial.trip, game)
    const roll = initial.encounters.pendingRoll
    const choice = activeEvent && ['borrow-phone-slip', 'park-company'].includes(activeEvent.id) ? activeEvent.choices[0] : undefined
    return choice?.check && roll ? { choice, roll, modifier: eventCheckModifier(game, choice), resolved: false } : null
  })
  const acceptedDice = useRef<EventDiceState | null>(null)
  function claimDice(dice: EventDiceState) {
    if (acceptedDice.current === dice) return false
    acceptedDice.current = dice
    return true
  }
  function resetEventSession() {
    setFirstNightEvents({ seen: [], lastAt: null, pendingId: null })
    setEncounters({ seen: [], lastAt: null, pendingId: null })
    setActiveEvent(null); setDiceCheck(null); setLeftHome(false)
    openingSearchObservation.current = false
    ambientEventClock.current = { locationId: 'street', minutes: 0 }
    deferredClock.current = null
    acceptedDice.current = null
  }
  return { firstNightEvents, setFirstNightEvents, encounters, setEncounters, leftHome, setLeftHome,
    activeEvent, setActiveEvent, diceCheck, setDiceCheck, openingSearchObservation, ambientEventClock, deferredClock, claimDice, resetEventSession }
}
export type EventSession = ReturnType<typeof useEventSession>
