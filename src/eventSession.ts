import { useRef, useState } from 'react'
import { STREET_EVENTS, type StreetEvent } from './events'
import { illustrateStreetEvent } from './eventArtwork'
import { eventCheckModifier } from './eventChecks'
import type { GameState } from './game'
import type { EventDiceState, FirstNightEvents, SleepState } from './stateTypes'

type InitialEvents = { firstNightEvents: FirstNightEvents; encounters: FirstNightEvents; leftHome: boolean; sleeping: SleepState | null }
export function useEventSession(initial: InitialEvents, game: GameState) {
  const [firstNightEvents, setFirstNightEvents] = useState(initial.firstNightEvents)
  const [leftHome, setLeftHome] = useState(initial.leftHome)
  const [encounters, setEncounters] = useState(initial.encounters)
  const openingSearchObservation = useRef(false)
  const ambientEventClock = useRef({ locationId: game.locationId, minutes: 0 })
  const [activeEvent, setActiveEvent] = useState<StreetEvent | null>(() => {
    const event = STREET_EVENTS.find(event => event.id === (initial.firstNightEvents.pendingId ?? initial.encounters.pendingId))
    return event ? illustrateStreetEvent(event, { locationId: game.locationId, housing: game.locationId === 'shelter' ? 'Night shelter' : 'Street', sleepKind: initial.sleeping?.kind ?? (game.locationId === 'station' ? 'bench' : 'ground') }) : null
  })
  const [diceCheck, setDiceCheck] = useState<EventDiceState | null>(() => {
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
    acceptedDice.current = null
  }
  return { firstNightEvents, setFirstNightEvents, encounters, setEncounters, leftHome, setLeftHome,
    activeEvent, setActiveEvent, diceCheck, setDiceCheck, openingSearchObservation, ambientEventClock, claimDice, resetEventSession }
}
export type EventSession = ReturnType<typeof useEventSession>
