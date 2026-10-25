import { useEffect, type Dispatch, type SetStateAction } from 'react'
import type { ActionResult, GameState } from './game'
import { absoluteMinutes } from './gameTime'
import { CALL_BATTERY_PER_MINUTE, OPENING_CALLS, openingCall } from './openingCalls'
import { PHONE_SEARCH_MIN, PHONE_SEARCH_MAX, phoneActivityEnd, phoneActivityTick, pausePhoneActivity, phoneUnavailableReason } from './phoneActivity'
import { phoneDrainMultiplier, phoneScreenDrain } from './phonePower'
import { practicalQuestions } from './phoneQuestions'
import type { PhoneSession } from './phoneSession'
import type { PhoneApp } from './PhoneScreen'
import type { ResultCardData } from './ResultCard'
import { locationPresentation, questionPresentation } from './resultPresentation'
import type { ResultSnapshot } from './results'
import { SHELTER_ENTRY_OPEN } from './shelterRules'
import type { Inventory, JournalGoals, Screen } from './stateTypes'

type Setter<T> = Dispatch<SetStateAction<T>>
type PhoneContext = {
  game: GameState; inventory: Inventory; currentId: string; open: boolean; screen: Screen
  firstNight: boolean; eventInteractionBlocked: boolean; sleeping: boolean; trip: boolean; gameOver: boolean
  insideNightShelter: boolean; shelterDeparture: boolean; shelterCheckoutDue: boolean; shelterBooked: boolean
  discoveredLocations: string[]; inventoryAgedAt: number
}
type PhoneHost = {
  setGame: Setter<GameState>; setInventory: Setter<Inventory>; setMessage: Setter<string>; setInfoModal: Setter<ResultCardData | null>
  setPhoneOpen: Setter<boolean>; setPhoneApp: Setter<PhoneApp>; setMusicOn: Setter<boolean>
  setDiscoveredLocations: Setter<string[]>; setJournalGoals: Setter<JournalGoals>
  setActiveGoal: Setter<{ type: 'night-shelter'; day: number; minute: number } | null>
  applyAction: (game: GameState, action: ActionResult) => GameState
  moodCap: (game: GameState) => number; resultSnapshot: () => ResultSnapshot
  runWithResult: (title: string, action: () => void, before?: ResultSnapshot, includeTime?: boolean, always?: boolean) => void
  onOpeningSearch: () => void
}

// Phone lifecycle only: no independent clock, storage access or global pause
// policy. App calls tick/pause from its shared clock and supplies action context.
export function usePhoneController(phone: PhoneSession, context: PhoneContext, host: PhoneHost) {
  const { phoneActivity, setPhoneActivity, openingCallIndex, setOpeningCallIndex, answeredQuestions, setAnsweredQuestions,
    shelterPhoneCharging, setShelterPhoneCharging, mobileServiceUntil, setMobileServiceUntil, mobileAutoRenew,
    mobileRenewedDay, setMobileRenewedDay, claimCompletion, claimRenewal } = phone
  const { game, inventory, currentId, open, screen, firstNight, eventInteractionBlocked, sleeping, trip, gameOver,
    insideNightShelter, shelterDeparture, shelterCheckoutDue, shelterBooked, discoveredLocations, inventoryAgedAt } = context
  const { setGame, setInventory, setMessage, setInfoModal, setPhoneOpen, setPhoneApp, setMusicOn, setDiscoveredLocations,
    setJournalGoals, setActiveGoal, applyAction, moodCap, resultSnapshot, runWithResult, onOpeningSearch } = host
  const activeCall = phoneActivity ? openingCall(phoneActivity.questionId) : undefined
  const nextOpeningCall = firstNight && openingCallIndex < OPENING_CALLS.length ? OPENING_CALLS[openingCallIndex] : undefined
  const mobileServiceActive = mobileServiceUntil > absoluteMinutes(game)
  const phoneUnavailable = phoneUnavailableReason(inventory, shelterPhoneCharging)
  const remainingHelpPlaces = practicalQuestions[0].locations.filter(id => !discoveredLocations.includes(id))
  const phoneSearchCost = phoneScreenDrain(game, inventory.phoneCondition, 'browsing', PHONE_SEARCH_MIN)
  useEffect(() => {
    if (!shelterPhoneCharging) return
    setPhoneOpen(false)
    setMusicOn(false)
    if (!insideNightShelter && !shelterDeparture) setShelterPhoneCharging(false)
  }, [shelterPhoneCharging, insideNightShelter, shelterDeparture])
  useEffect(() => {
    if (!mobileAutoRenew || mobileServiceUntil > absoluteMinutes(game) || mobileRenewedDay >= game.day) return
    if (!claimRenewal(game.day)) return
    setMobileRenewedDay(game.day)
    if (game.money < 1) {
      setMessage('Mobile service auto-renewal failed: you need 1 zł.')
      return
    }
    setGame((prev) => ({ ...prev, money: Math.max(0, prev.money - 1) }))
    setMobileServiceUntil(until => Math.max(until, absoluteMinutes(game)) + 1440)
  }, [game.day, game.minutes, game.money, mobileAutoRenew, mobileRenewedDay, mobileServiceUntil])
  useEffect(() => { if (!mobileServiceActive) setMusicOn(false) }, [mobileServiceActive])
  function buyMobileServiceImpl() {
    if (game.money < 1) { setMessage('You need 1 zł to activate mobile service for 24 hours.'); return }
    const now = absoluteMinutes(game)
    setGame((prev) => ({ ...prev, money: Math.max(0, prev.money - 1) }))
    setMobileServiceUntil((until) => Math.max(until, now) + 1440)
    setMessage('Mobile service activated for another 24 hours. Cost: 1 zł.')
  }

  function chargePhoneImpl() {
    if (inventory.phoneBattery >= 100) { setMessage('Phone is already fully charged.'); return }
    if (currentId !== 'support' && currentId !== 'residential-shelter') return
    if (!open) return
    setInventory((prev) => ({ ...prev, phoneBattery: Math.min(100, prev.phoneBattery + 25) }))
    setGame((prev) => applyAction(prev, { minutes: 30 }))
    setMessage('You charged the phone for 30 minutes. Battery +25%.')
  }

  function toggleShelterPhoneCharging() {
    if (!insideNightShelter || sleeping || shelterDeparture || shelterCheckoutDue || gameOver) return
    if (!shelterPhoneCharging && (inventory.phoneBattery >= 100 || inventory.phoneCondition <= 0)) return
    runWithResult(shelterPhoneCharging ? 'Collect phone' : 'Phone charging', () => {
      setShelterPhoneCharging(!shelterPhoneCharging)
      setPhoneOpen(false)
      setMusicOn(false)
      setMessage(shelterPhoneCharging
        ? `You collected your phone. Battery: ${Math.round(inventory.phoneBattery)}%.`
        : 'You left your phone plugged in at Night Shelter. It gains up to 60% battery per hour while you do other things or sleep. Collect it whenever you need it; you cannot use it while it is left charging.')
    }, resultSnapshot(), true, true)
  }

  function startOpeningCall() {
    if (!nextOpeningCall || currentId !== 'street' || phoneUnavailable || phoneActivity || eventInteractionBlocked || sleeping || trip || gameOver) return
    const cost = nextOpeningCall.minutes * CALL_BATTERY_PER_MINUTE * phoneDrainMultiplier(inventory.phoneCondition)
    if (inventory.phoneBattery < cost) return
    setPhoneActivity({ questionId: nextOpeningCall.id, total: nextOpeningCall.minutes, remaining: nextOpeningCall.minutes, before: resultSnapshot() })
  }

  function finishOpeningCall(id: string, before: ResultSnapshot) {
    const call = openingCall(id)
    if (!call || OPENING_CALLS[openingCallIndex]?.id !== id) return
    runWithResult(call.title, () => {
      setOpeningCallIndex(index => index + 1)
      setGame(previous => ({ ...previous, mood: Math.max(0, previous.mood - call.moodLoss) }))
      setInfoModal({ title: call.title, text: call.text, label: 'PHONE CALL', illustration: `/street-life-game/assets/${call.illustration}.webp`, illustrationAlt: call.title, batteryInSummary: true })
    }, before, true, true)
  }

  function finishPracticalQuestion(id: string, before = resultSnapshot()) {
    const question = practicalQuestions.find(entry => entry.id === id)
    if (!question) return
    const memory = id === 'charging'
    const foundPlace = id === 'morning' ? remainingHelpPlaces[0] : undefined
    const foundPlaces = id === 'morning' ? foundPlace ? [foundPlace] : [] : question.locations
    const presentation = questionPresentation(id, foundPlaces, false, foundPlaces.every(placeId => discoveredLocations.includes(placeId)))
    const answerText = id === 'morning'
      ? foundPlace && presentation?.places?.[0]
        ? `${presentation.places[0].name} · ${presentation.places[0].hours}. ${presentation.places[0].detail}. The address is saved on your map.`
        : 'You checked the available information again, but found no new places.'
      : question.text
    runWithResult(id === 'morning' && !foundPlace ? 'Searched for more help' : question.title, () => {
      const next = { ...game }
      if (id !== 'morning' || foundPlace) next.mood = Math.max(next.mood, Math.min(moodCap(next), before.game.mood + 3))
      setGame(next)
      setAnsweredQuestions(previous => [...new Set([...previous, id])])
      setDiscoveredLocations(previous => [...new Set([...previous, ...foundPlaces])])
      if (id === 'work') setJournalGoals(previous => ({ ...previous, work: true }))
      if (id === 'bed' && !shelterBooked) setActiveGoal({ type: 'night-shelter', day: game.minutes >= 1320 ? game.day + 1 : game.day, minute: SHELTER_ENTRY_OPEN })
      setInfoModal({ title: id === 'morning' && !foundPlace ? 'No new information' : question.title, text: `${memory ? 'You remember' : 'AI'}\n\n${answerText}`, presentation })
    }, before)
  }

  function answerPracticalQuestion(id: string) {
    const question = practicalQuestions.find(entry => entry.id === id)
    if (!question || phoneActivity || screen !== 'phone' || phoneUnavailable) return
    if (id !== 'morning' && answeredQuestions.includes(id)) {
      setInfoModal({ title: question.title, text: `${id === 'charging' ? 'A remembered place' : 'AI · Saved answer'}\n\n${question.text}`, presentation: questionPresentation(id, question.locations, true), costs: [], changes: [] })
      return
    }
    if (id === 'charging') { finishPracticalQuestion(id); return }
    if (!mobileServiceActive || inventory.phoneCondition <= 0 || inventory.phoneBattery < phoneSearchCost) return
    setPhoneOpen(false)
    const total = PHONE_SEARCH_MIN + Math.floor(Math.random() * (PHONE_SEARCH_MAX - PHONE_SEARCH_MIN + 1))
    setPhoneActivity({ questionId: id, total, remaining: total, before: resultSnapshot() })
  }

  useEffect(() => {
    if (!phoneActivity || inventoryAgedAt !== absoluteMinutes(game)) return
    const end = phoneActivityEnd(phoneActivity, inventory, mobileServiceActive, gameOver, shelterCheckoutDue)
    if (!end || !claimCompletion(phoneActivity)) return
    if (activeCall) {
      if (end === 'complete') {
        setPhoneActivity(null)
        finishOpeningCall(activeCall.id, phoneActivity.before)
      } else if (end === 'interrupted') {
        setPhoneActivity(null)
        runWithResult('Call interrupted', () => setInfoModal({ title: 'Call interrupted', text: 'The call ends before you can finish. Time and battery already spent are not returned. You can try again once your phone is working.', illustration: `/street-life-game/assets/${activeCall.illustration}.webp`, batteryInSummary: true }), phoneActivity.before, true, true)
      }
      return
    }
    if (end === 'checkout') {
      setPhoneActivity(null)
      const text = 'It is time to leave Night Shelter. You put the phone away before finishing the search.'
      runWithResult('Search interrupted', () => setInfoModal({ title: 'Search interrupted', text, presentation: { ...locationPresentation([]), heading: 'Search interrupted', lead: text } }), phoneActivity.before, true, true)
    } else if (end === 'complete') {
      setPhoneActivity(null)
      finishPracticalQuestion(phoneActivity.questionId, phoneActivity.before)
    } else if (end === 'interrupted') {
      setPhoneActivity(null)
      const text = gameOver ? 'You could not finish the search.' : inventory.phoneBattery <= 0 ? 'Your phone ran out of battery before you could save the information.' : 'Mobile service expired before you could save the information.'
      runWithResult('Search interrupted', () => setInfoModal({ title: 'Search interrupted', text, presentation: { ...locationPresentation([]), heading: 'Search interrupted', lead: text } }), phoneActivity.before, true, true)
    }
  }, [phoneActivity, inventoryAgedAt, inventory.phoneBattery, inventory.phoneCondition, mobileServiceActive, gameOver, shelterCheckoutDue])

  function buyMobileService() { runWithResult('Mobile service', buyMobileServiceImpl) }
  function chargePhone() { runWithResult('Charge phone', chargePhoneImpl) }
  // Called only after the owning location action has passed its access checks
  // and applied its duration; do not charge those minutes a second time.
  function finishLocationPhoneCharge(actionId: string) {
    if (actionId === 'daycenter-charge') {
      setInventory(previous => ({ ...previous, phoneBattery: 100 }))
      setMessage('You wait indoors while your phone charges to 100%.')
    }
    if (actionId === 'station-charge') {
      setInventory(previous => ({ ...previous, phoneBattery: Math.min(100, previous.phoneBattery + 60) }))
      setMessage('You spend an hour charging your phone at the station.')
    }
  }
  function tickPhoneActivity() {
    if (!phoneActivity) return
    if (!activeCall && firstNight && absoluteMinutes(game) + 1 >= 1335) onOpeningSearch()
    const tick = phoneActivityTick(phoneActivity, game, inventory.phoneCondition)
    setGame(previous => applyAction(previous, { minutes: 1 }))
    // Battery uses the updater's latest condition, as the shared aging step does.
    setInventory(previous => ({ ...previous, phoneBattery: Math.max(0, previous.phoneBattery - phoneActivityTick(phoneActivity, game, previous.phoneCondition).batteryCost) }))
    setPhoneActivity(tick.advance)
  }
  function pausePhone() { setPhoneActivity(pausePhoneActivity) }
  useEffect(() => {
    if (phoneUnavailable) { setPhoneApp('home'); setPhoneOpen(false) }
  }, [phoneUnavailable])
  return { startOpeningCall, answerPracticalQuestion, buyMobileService, chargePhone, toggleShelterPhoneCharging,
    tickPhoneActivity, pausePhone, phoneSearchCost, finishLocationPhoneCharge }
}
