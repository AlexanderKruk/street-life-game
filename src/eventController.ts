import { eventChoiceUnavailable } from './eventChoiceText'
import { t, locale } from './i18n'
import { locationName } from './locationText'
import { STREET_EVENTS, resolveEventOutcome, type EventOutcome, type StreetEventChoice } from './events'
import { illustrateStreetEvent } from './eventArtwork'
import { locations, type GameState, type ActionResult } from './game'
import { displayDay } from './gameDate'
import { absoluteMinutes } from './gameTime'
import { SHOP_ITEMS, addShopItem, canAddToBackpack, fitEventSupplies } from './inventory'
import { locationPresentation } from './resultPresentation'
import { SHELTER_ENTRY_OPEN } from './shelterRules'
import { eventCheckModifier, eventChoiceBlock, diceOutcome } from './eventChecks'
import type { EventSession } from './eventSession'
import type { Inventory, LifeSituation, Screen, StoredItems } from './stateTypes'
import type { ResultCardData } from './ResultCard'
import type { ResultSnapshot } from './results'
import type { GameSetter, RunWithResult, Setter } from './controllerTypes'
import type { ResultActionId } from './resultActions'

type Context = {
  game: GameState
  inventory: Inventory
  storage: StoredItems
  life: LifeSituation
  discoveredLocations: string[]
  phoneUnavailable: string | null
  shelterBooked: boolean
  currentId: string
  open: boolean
}
type Host = {
  setGame: GameSetter
  setInventory: Setter<Inventory>
  setMessage: Setter<string>
  setInfoModal: Setter<ResultCardData | null>
  setEventResultOpen: Setter<boolean>
  setDiscoveredLocations: Setter<string[]>
  setActiveGoal: Setter<{ type: 'night-shelter'; day: number; minute: number } | null>
  openPage: (screen: Screen) => void
  resultSnapshot: () => ResultSnapshot
  runWithResult: RunWithResult
  applyAction: (state: GameState, action: ActionResult) => GameState
  startFareDodgeTrip: (id: string, outcome: EventOutcome) => void
}
export function createEventController(session: EventSession, context: Context, host: Host) {
  const { activeEvent, setActiveEvent, diceCheck, setDiceCheck, firstNightEvents, setFirstNightEvents, setEncounters, ambientEventClock, claimDice } = session
  const { game, inventory, storage, life, discoveredLocations, phoneUnavailable, shelterBooked, currentId, open } = context
  const { setGame, setInventory, setMessage, setInfoModal, setEventResultOpen, setDiscoveredLocations, setActiveGoal, openPage, resultSnapshot, runWithResult, applyAction, startFareDodgeTrip } = host
  const checkModifier = (choice: StreetEventChoice) => eventCheckModifier(game, choice)
  const checkUnavailableReason = (choice: StreetEventChoice) => eventChoiceUnavailable(choice, game, inventory, discoveredLocations, phoneUnavailable)
  function applyEventOutcome(outcome: EventOutcome, title?: string, actionId?: ResultActionId) {
    let resolved = resolveEventOutcome(outcome, Math.random, inventory.documents, storage.documents)
    if (activeEvent?.id === 'borrow-phone-slip' && resolved.phoneBreakMessage !== undefined && (resolved.phoneCondition ?? 0) < 0 && inventory.phoneCondition + resolved.phoneCondition! <= 0) {
      resolved = { ...resolved, message: resolved.phoneBreakMessage! }
    }
    if (activeEvent?.id === 'night-theft' && resolved.historyId === 'night-theft:check-bag:complete') {
      if (game.money <= 0 || !inventory.documents) {
        resolved = { ...resolved, message: t(game.money > 0 ? 'event.theft.cashOnly' : inventory.documents ? 'event.theft.documentsOnly' : 'event.theft.nothing') }
      }
    }
    runWithResult({ id: actionId ?? (activeEvent ? `event:${activeEvent.id}` : 'event-result'), title: title ?? activeEvent?.title ?? t('event.controller.resultTitle'), ...(resolved.historyId ? { eventHistory: { outcomeId: resolved.historyId, suppliesRejected: fitEventSupplies(inventory, resolved).rejected.length > 0, documents: inventory.documents ? 'carried' as const : storage.documents ? 'stored' as const : 'missing' as const } } : {}) }, () => { setEventResultOpen(true); applyEventOutcomeImpl(resolved) }, resultSnapshot(), true, true)
  }
  function applyEventOutcomeImpl(outcome: EventOutcome) {
    const { rejected } = fitEventSupplies(inventory, outcome)
    const knownPlaces = outcome.knownLocations?.filter(id => discoveredLocations.includes(id)).flatMap(id => locations.some(place => place.id === id) ? [locationName(id)] : [])
    const outcomeText = rejected.length
      ? t('event.controller.rejected', { items: new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(rejected) })
      : knownPlaces ? knownPlaces.length
        ? t('event.controller.known', { message: outcome.message, places: knownPlaces.join(', ') })
        : t('event.controller.unknown', { message: outcome.message })
      : outcome.message
    if (activeEvent?.illustration || outcome.illustration) {
      const place = locations.find(location => location.id === outcome.discoverLocation)
      const end = absoluteMinutes(game) + (outcome.minutes ?? 0)
      const goalDay = Math.floor(end / 1440) + 1 + (end % 1440 >= 1320 ? 1 : 0)
      setInfoModal(previous => ({ ...previous, title: activeEvent?.title ?? t('event.controller.afterChoice'), text: outcomeText, illustration: rejected.length ? activeEvent?.illustration : outcome.illustration ?? activeEvent?.illustration, illustrationAlt: outcomeText,
        visibleStats: ['night-rustle', 'park-company'].includes(activeEvent?.id ?? '') && outcome.energy ? ['energy'] : activeEvent?.id === 'borrow-phone-slip' && outcome.phoneCondition ? ['phoneCondition'] : undefined,
        batteryInSummary: !!outcome.phoneBattery,
        ...(place ? { presentation: { ...locationPresentation([place.id]), lead: outcomeText,
          ...(place.id === 'shelter' ? { notice: t('event.controller.shelterNotice', { day: displayDay(goalDay) }) } : {}) } } : {}) }))
    }
    setEncounters(previous => ({ ...previous, pendingId: null, pendingRoll: null }))
    if (firstNightEvents.pendingId === activeEvent?.id) setFirstNightEvents(previous => ({ ...previous, pendingId: null }))
    const foundPlace = locations.find(place => place.id === outcome.discoverLocation)
    if (foundPlace) {
      setDiscoveredLocations(previous => [...new Set([...previous, foundPlace.id])])
      if (foundPlace.id === 'shelter' && !shelterBooked) {
        const end = absoluteMinutes(game) + (outcome.minutes ?? 0)
        const day = Math.floor(end / 1440) + 1
        setActiveGoal({ type: 'night-shelter', day: end % 1440 >= 1320 ? day + 1 : day, minute: SHELTER_ENTRY_OPEN })
      }
    }
    setGame((prev) => {
      const next = applyAction(prev, {
        minutes: outcome.minutes ?? 0,
        money: outcome.money,
        mood: outcome.mood,
        energy: outcome.energy,
        health: outcome.health,
        hygiene: outcome.hygiene,
      })
      return outcome.moveToStreet ? { ...next, locationId: 'street' } : next
    })
    if (outcome.moveToStreet) {
      ambientEventClock.current = { locationId: 'street', minutes: 0 }
      openPage('location')
    }
    setInventory((prev) => ({
      ...fitEventSupplies(prev, outcome).inventory,
      phoneCondition: Math.max(0, Math.min(100, prev.phoneCondition + (outcome.phoneCondition ?? 0))),
      phoneBattery: Math.max(0, Math.min(100, prev.phoneBattery + (outcome.phoneBattery ?? 0))),
      jacket: Math.max(0, Math.min(100, prev.jacket + (outcome.jacketCondition ?? 0))),
      documents: outcome.loseDocuments ? false : prev.documents,
    }))
    setMessage(outcomeText)
  }

  function resolveStreetEvent(choice: StreetEventChoice) {
    if (eventChoiceBlock(choice, game, inventory, discoveredLocations, phoneUnavailable) !== null) return
    if (choice.followUp && Math.random() < choice.followUp.chance) {
      const event = STREET_EVENTS.find(event => event.id === choice.followUp!.eventId && event.continuationOnly)
      if (event) {
        setEncounters(previous => ({ ...previous, seen: [...new Set([...previous.seen, event.id])], pendingId: event.id, pendingRoll: null }))
        setActiveEvent(illustrateStreetEvent(event, { locationId: game.locationId, housing: life.housing }))
        return
      }
    }
    if (choice.check) {
      const unavailable = eventChoiceBlock(choice, game, inventory, discoveredLocations, phoneUnavailable)
      if (unavailable !== null) return
      setDiceCheck({ choice, roll: null, modifier: checkModifier(choice), resolved: false })
      return
    }
    if (choice.outcome) applyEventOutcome(choice.outcome)
    setActiveEvent(null)
  }

  function rollDice() {
    if (!diceCheck?.choice.check || diceCheck.roll !== null) return
    const roll = Math.floor(Math.random() * 20) + 1
    setDiceCheck({ ...diceCheck, roll, resolved: false })
    if (['borrow-phone-slip', 'park-company'].includes(activeEvent?.id ?? '')) setEncounters(previous => ({ ...previous, pendingRoll: roll }))
  }

  function acceptDiceResult() {
    if (!diceCheck?.choice.check || diceCheck.roll === null) return
    if (!claimDice(diceCheck)) return
    const { success, outcome } = diceOutcome(diceCheck)!
    applyEventOutcome(outcome, diceCheck.stealItemId ? success ? t('event.controller.stolen') : t('event.controller.caught') : undefined, diceCheck.stealItemId ? success ? 'item-stolen' : 'caught-stealing' : undefined)
    if (diceCheck.fareDodgeDestinationId) startFareDodgeTrip(diceCheck.fareDodgeDestinationId, outcome)
    if (diceCheck.stealItemId && success) {
      const item = SHOP_ITEMS.find((entry) => entry.id === diceCheck.stealItemId)
      if (item) setInventory((prev) => addShopItem(prev, item))
    }
    setDiceCheck(null)
    setActiveEvent(null)
  }

  function stealItem(item: (typeof SHOP_ITEMS)[number]) {
    if (!open || currentId !== 'shop') return
    if (!canAddToBackpack(inventory, item)) {
      setMessage(t('event.controller.full'))
      return
    }
    const choice: StreetEventChoice = {
      label: t('event.controller.stealChoice', { item: item.name }),
      check: {
        stat: 'reflex', dc: 12,
        success: { minutes: 5, message: t('event.controller.stealSuccess', { item: item.name }) },
        failure: { minutes: 5, mood: -8, moveToStreet: true, message: t('event.controller.stealFailure') },
        criticalSuccess: { minutes: 3, mood: 2, message: t('event.controller.stealCritical', { item: item.name }) },
        criticalFailure: { minutes: 10, mood: -12, moveToStreet: true, message: t('event.controller.stealCriticalFailure') },
      },
    }
    setDiceCheck({ choice, roll: null, modifier: checkModifier(choice), resolved: false, stealItemId: item.id })
  }

  return { applyEventOutcome, checkUnavailableReason, resolveStreetEvent, rollDice, acceptDiceResult, stealItem }
}
