import { useStorySession } from './useStorySession'
import type { StoryStamp } from './story'
import type { StreetEventChoice } from './events'
import type { EventDiceState } from './stateTypes'
import { STORY_KEY } from './saveKeys'
import { rainOpening } from './rainText'
import { rainArt, rainResultActionId, type RainChoice, type RainEpisode } from './rain'
import GoalCompletedDialog from './GoalCompletedDialog'
import { initialJournalGoals, progressJournalGoals, journalGoalKnown } from './journalGoals'
import PhoneSettingsScreen from './PhoneSettingsScreen'
import { languageReturn, clearLanguageReturn } from './i18n/language'
import { travelPhaseLabel } from './travelText'
import { sleepUnavailableReason } from './sleepText'
import { locationName } from './locationText'
import { limitReasonsLabel } from './statusPresentation'
import { t } from './i18n'
import { journalPresentation, journalDecisionKey } from './journalIdentity'
import type { ActionHistoryFacts } from './actionHistory'
import type { InventoryHistoryFacts } from './inventoryHistory'
import { FIRST_NIGHT_EVENTS_KEY,ENCOUNTERS_KEY,LEFT_HOME_KEY,RAIN_RESPONSE_KEY,PHONE_ACTIVITY_KEY,MUSIC_WALK_USED_KEY,GOAL_KEY,JOURNAL_GOALS_KEY,JOURNAL_HISTORY_KEY,SHELTER_ARRIVAL_KEY,SAVE_KEYS } from './saveKeys'
import { INITIAL_LIFE,SHELTER_DEPARTURE_MINUTES,loadGameSession } from './loadGameSession'
import { useCallback,useEffect,useMemo,useRef,useState } from 'react'
import ActivityDialog, { ActivityCancel } from './ActivityDialog'
import BottomNavigation from './BottomNavigation'
import StoryScreen from './StoryScreen'
import ChoiceButton from './ChoiceButton'
import CityMap from './CityMap'
import DiceDialog from './DiceDialog'
import TravelPlanningDialog from './TravelPlanningDialog'
import DiscardDialog from './DiscardDialog'
import EventDialog from './EventDialog'
import FoodChoiceDialog from './FoodChoiceDialog'
import GameHeader from './GameHeader'
import type { IconName } from './Icon'
import InventoryDialog from './InventoryDialog'
import InventoryScreen from './InventoryScreen'
import { JournalGoals } from './JournalSections'
import LocationScreen from './LocationScreen'
import { ModalAction } from './Modal'
import PhoneDialog from './PhoneDialog'
import PhoneHistoryScreen from './PhoneHistoryScreen'
import PhoneNotesScreen from './PhoneNotesScreen'
import PhoneScreen,{ type PhoneApp } from './PhoneScreen'
import PhoneSearchScreen from './PhoneSearchScreen'
import RainEventDialog from './RainEventDialog'
import ResultCard,{ type ResultCardData } from './ResultCard'
import SleepProgressDialog from './SleepProgressDialog'
import ShelterQueueDialog from './ShelterQueueDialog'
import { ShelterCheckoutWarning,ShelterDepartureDialog } from './ShelterCheckoutDialog'
import SleepPlanningDialog from './SleepPlanningDialog'
import StatusScreen, { type StatusNeed } from './StatusScreen'
import TrashSearchDialog from './TrashSearchDialog'
import GameOverDialog from './GameOverDialog'
import { firstNightTime } from './events'
import { ageFood,foodSlot,type FoodCondition,type FoodKind } from './foodInventory'
import { actions,applyAction as applyGameAction,conditionBand,createInitialState,energyCap,formatTime,isOpen,limitMood,locations,moodLimit,temperatureAt,weatherAt,weatherExposure,type ActionResult,type GameState,type Housing } from './game'
import { displayDay } from './gameDate'
import { absoluteMinutes,formatTravelTime } from './gameTime'
import { CLOTHING_WETNESS_ENABLED } from './gameplayFeatures'
import { INITIAL_INVENTORY,INITIAL_STORAGE,NIGHT_SHELTER_STORAGE,SCHRONISKO_STORAGE,SHOP_ITEMS,backpackSlots,storageSlots } from './inventory'
import { type JournalEntry } from './journal'
import { resultActionAllowed, type ResultAction } from './resultActions'
import { limitingEffects } from './limitingEffects'
import { CLOSING_NOTICE_KEY,locationClosedSince } from './locationClosing'
import { OPENING_CALLS,OPENING_CALLS_KEY,openingCall } from './openingCalls'
import { summarizeResult,type ConsumedItem,type ResultSnapshot } from './results'
import { DISCOVERY_KEY,SAVE_KEY } from './saveCompatibility'
import { SHELTER_PHONE_CHARGE_KEY } from './shelterCharging'
import { SHELTER_ENTRY_OPEN,shelterAccess } from './shelterRules'
import { SLEEP_HOURS } from './sleepRules'
import type { ActiveEffect,BackpackItemId,Inventory,JournalGoals as JournalGoalState,LifeSituation,Screen,StoredItems,Trip } from './stateTypes'
import { CHOICE_SEED_KEY,newChoiceSeed } from './streetChoiceOrder'
import { getTravelDisplayPhase,getTravelPhase } from './travelPhases'
import { useGameAutosave } from './useGameAutosave'
import { elapsedPhoneBattery,phoneUnavailableReason } from './phoneActivity'
import { usePhoneSession } from './phoneSession'
import { usePhoneController } from './usePhoneController'
import { useEventSession } from './eventSession'
import { createEncounterQueue,useEncounterObservers } from './encounterQueue'
import { createEventController } from './eventController'
import { useTravelController,advanceTrip } from './useTravelController'
import { useRainScheduling,useRainResults } from './useRainController'
import { useSleepSession,useShelterSession } from './restSessions'
import { createSleepController,useForcedSleep,useSleepCompletion } from './sleepController'
import { createShelterController } from './shelterController'
import { useShelterAdmission,useShelterProcesses,useShelterAttendance } from './useShelterLifecycle'
import { useTrashSession,useTrashController } from './trashSearchController'
import { createMedicalController } from './medicalController'
import { createSupportWorkController } from './supportWorkController'
import { createStreetController } from './streetController'
import { createLocationController } from './locationController'
import { createInventoryController } from './inventoryController'
import { clothingHygieneCap } from './hygieneRules'
import { useLatestAction } from './useLatestAction'

const BUILD_VERSION = 'v2026.10.29-348'
const ACTIVITY_TICK_MS = 250

type TrashArt = 'cup' | 'paper' | 'tray' | 'wrapper' | 'can-crushed' | 'plastic' | 'plastic-crushed' | 'can'
// Physical proportions follow the object, never whether its deposit is valid.
const TRASH_ITEM_SCALE: Record<TrashArt, number> = {
  plastic: 2.5, 'plastic-crushed': 2.5,
  can: 2, 'can-crushed': 2,
  cup: 1.55, paper: 2, tray: 2.1, wrapper: 1.9,
}
type TrashItem = { id: number; layer: number; art: TrashArt; x: number; y: number; rotation: number; scale: number; bottle: boolean; returnable: boolean; collected?: boolean; cleared?: boolean }

export default function App() {
  const [initial] = useState(() => loadGameSession(localStorage))
  const [languageResumed] = useState(languageReturn)
  useEffect(() => { if (languageResumed) clearLanguageReturn() }, [languageResumed])
  const [game, commitGame] = useState<GameState>(() => initial.game)
  const [choiceSeed, setChoiceSeed] = useState(() => initial.choiceSeed)
  const sleepSession = useSleepSession(initial)
  const { sleeping, sleepChoice, setSleepChoice, sleepHours, setSleepHours, groundSleepWindow, resetSleepSession } = sleepSession
  const shelterSession = useShelterSession(initial)
  const { shelterQueue, shelterArrival, setShelterArrival, shelterDeparture, shelterInterview, resetShelterSession } = shelterSession
  const phone = usePhoneSession(initial)
  const { phoneActivity, openingCallIndex, answeredQuestions, shelterPhoneCharging, setShelterPhoneCharging,
    mobileServiceUntil, mobileAutoRenew, setMobileAutoRenew, mobileRenewedDay, resetPhoneSession } = phone
  const activeCall = phoneActivity ? openingCall(phoneActivity.questionId) : undefined
  const story = useStorySession(initial.story)
  const restoredStoryResult = initial.story.episodes.find(entry => entry.status === 'awaiting-ack')?.result
  const [message, setMessage] = useState('')
  const [infoModal, setInfoModal] = useState<ResultCardData | null>(() => restoredStoryResult ?? null)
  const [closingNotice, setClosingNotice] = useState<string | null>(() => initial.closingNotice)
  const [pendingResult, setPendingResult] = useState<(ResultAction & { before: ResultSnapshot; includeTime: boolean; always: boolean; consumedItems: ConsumedItem[] }) | null>(null)
  const [eventResultOpen, setEventResultOpen] = useState(!!restoredStoryResult)
  const closeResult = useCallback(() => {
    if (infoModal?.rainResultId) commitGame(previous => ({ ...previous, rainResults: previous.rainResults?.filter(rain => rain.id !== infoModal.rainResultId) }))
    story.acknowledge()
    setInfoModal(null); setEventResultOpen(false)
  }, [infoModal?.rainResultId])
  const buyShopItem = useLatestAction((id: string) => { const item = SHOP_ITEMS.find(item => item.id === id); if (item) buyItem(item) })
  const stealShopItem = useLatestAction((id: string) => { const item = SHOP_ITEMS.find(item => item.id === id); if (item) stealItem(item) })
  const [discoveredLocations, setDiscoveredLocations] = useState<string[]>(() => initial.discoveredLocations)
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => initial.journalEntries)
  const [musicWalkUsed, setMusicWalkUsed] = useState(() => initial.musicWalkUsed)
  const lastRecordedResult = useRef<unknown>(null)
  const [journalGoals, setJournalGoals] = useState<JournalGoalState>(() => initial.journalGoals)
  const goalsObserved = useRef(false)
  const acknowledgeGoalCompletion = useCallback(() => {
    setJournalGoals(previous => ({ ...previous, pendingCompletions: previous.pendingCompletions?.slice(1) ?? [] }))
  }, [])
  const [activeGoal, setActiveGoal] = useState<{ type: 'night-shelter'; day: number; minute: number } | null>(() => initial.activeGoal)
  const [screen, setScreen] = useState<Screen>(() => languageResumed ? 'phone' : initial.screen)
  const [phoneApp, setPhoneApp] = useState<PhoneApp>(() => languageResumed ? 'language' : 'home')
  const contentRef = useRef<HTMLDivElement>(null)
  const [scrollResetRequest, setScrollResetRequest] = useState(0)
  useEffect(() => {
    if (scrollResetRequest) contentRef.current?.scrollTo?.({ top: 0, left: 0, behavior: 'instant' })
  }, [scrollResetRequest])
  // Only links inside a page request this reset. Bottom navigation keeps the
  // existing scroll behavior; ticks and closing a modal do not move the page.
  function openPage(target: Screen) {
    setScreen(target)
    if (target === 'phone') setPhoneApp('home')
    setScrollResetRequest(previous => previous + 1)
  }
  function openPhoneApp(app: PhoneApp) {
    setPhoneApp(app)
    setScrollResetRequest(previous => previous + 1)
  }
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null)
  const [mapInitialFocus, setMapInitialFocus] = useState<string | undefined>()
  const [selectedJournalDay, setSelectedJournalDay] = useState<number | null>(null)
  const journalDay = Math.max(1, Math.min(selectedJournalDay ?? game.day, game.day))
  useEffect(() => {
    if (screen !== 'phone') setPhoneApp('home')
    if (screen !== 'map') setMapInitialFocus(undefined)
    if (screen !== 'phone' || phoneApp !== 'history') setSelectedJournalDay(null)
  }, [screen, phoneApp])
  const [rainChoice, setRainChoice] = useState(false)
  const rainModalRef = useRef<HTMLElement>(null)
  const [seenMemories, setSeenMemories] = useState<string[]>(() => initial.seenMemories)
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [discardItem, setDiscardItem] = useState<{ id: BackpackItemId; name: string; quantity: number; slotIndex: number; spoiledQuantity?: number } | null>(null)
  const cancelDiscard = useCallback(() => setDiscardItem(null), [])
  const [foodChoice, setFoodChoice] = useState<{ kind: FoodKind; name: string; slotIndex: number } | null>(null)
  const cancelFoodChoice = useCallback(() => setFoodChoice(null), [])
  const [streetExitPending, setStreetExitPending] = useState(false)
  const cancelStreetExit = useCallback(() => setStreetExitPending(false), [])
  const inventoryDialogOpen = !!discardItem || !!foodChoice || streetExitPending
  const [trip, setTrip] = useState<Trip | null>(() => initial.trip)
  const travelModalRef = useRef<HTMLElement>(null)
  const travelChoiceRef = useRef<HTMLElement>(null)
  const travelChoiceOpen = screen === 'map' && !!selectedDestination
  useEffect(() => {
    if (!travelChoiceOpen) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    travelChoiceRef.current?.focus({ preventScroll: true })
    const trap = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setSelectedDestination(null); return }
      if (event.key !== 'Tab') return
      const buttons = Array.from(travelChoiceRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
      if (!buttons.length) return
      event.preventDefault()
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
      buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus()
    }
    document.addEventListener('keydown', trap)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', trap)
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [travelChoiceOpen])
  const phoneSearchModalRef = useRef<HTMLElement>(null)
  const travelling = screen === 'travel' && !!trip
  const activityOverlay = travelling || !!phoneActivity
  useEffect(() => {
    if (!activityOverlay) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = overflow }
  }, [activityOverlay])
  const [musicOn, setMusicOn] = useState(false)
  const [streetBenchFound, setStreetBenchFound] = useState(false)
  const [begging, setBegging] = useState<{ day: number; attempts: number }>(() => initial.begging)
  const trashSession = useTrashSession()
  const { trashGame, resetTrashSession } = trashSession
  const eventModalRef = useRef<HTMLElement>(null)
  const eventSession = useEventSession(initial, game)
  const { firstNightEvents, leftHome, encounters, openingSearchObservation,
    ambientEventClock, activeEvent, setActiveEvent, diceCheck, setDiceCheck, resetEventSession } = eventSession
  function storyStamp(): StoryStamp { return { day: game.day, minute: game.minutes, locationId: game.locationId, locationName: locationName(game.locationId) } }
  function recordStoryChoice(choice: StreetEventChoice, dice?: EventDiceState | null) {
    if (activeEvent) return story.choose(activeEvent, choice, storyStamp(), dice ?? undefined)
    const sourceId = dice?.stealItemId ? `steal:${dice.stealItemId}` : `fare:${dice?.fareDodgeDestinationId ?? game.locationId}`
    const id = story.begin('check', sourceId, { eventId: sourceId, title: choice.label, text: '', at: storyStamp() })
    return story.chooseScene(id, choice, storyStamp(), dice ?? undefined)
  }
  useEffect(() => {
    if (activeEvent) story.openEvent(activeEvent, storyStamp())
    if (diceCheck && !activeEvent) recordStoryChoice(diceCheck.choice, diceCheck)
    if (diceCheck?.roll !== null && diceCheck?.roll !== undefined && activeEvent) story.choose(activeEvent, diceCheck.choice, storyStamp(), diceCheck)
  }, [activeEvent, diceCheck])
  useEffect(() => {
    // Old/cancelled checks without a restorable owner remain readable as unfinished.
    for (const entry of story.current().episodes) {
      if (entry.status !== 'active') continue
      const stillActive = entry.source === 'encounter' ? entry.scenes.at(-1)?.eventId === activeEvent?.id
        : entry.source === 'check' ? !!diceCheck
        : game.rain?.id === entry.sourceId || game.rainResults?.some(rain => rain.id === entry.sourceId)
      if (!stillActive && !pendingResult) story.interrupt(entry.id)
    }
  }, [activeEvent, diceCheck, game.rain, game.rainResults, pendingResult])
  const [inventory, setInventory] = useState<Inventory>(() => initial.inventory)
  const [storage, setStorage] = useState<StoredItems>(() => initial.storage)
  const [life, setLife] = useState<LifeSituation>(() => initial.life)
  const [effects, setEffects] = useState<ActiveEffect[]>(() => initial.effects)
  function moodContext(state = game, housing?: Housing) {
    return { effects, housing: housing ?? (life.housing === 'Street' && (life.shelterUntilDay ?? 0) >= state.day ? 'Night shelter' as const : life.housing) }
  }
  function setGame(update: GameState | ((previous: GameState) => GameState), housing?: Housing) {
    commitGame(previous => {
      const next = typeof update === 'function' ? update(previous) : update
      return limitMood(next, moodContext(next, housing))
    })
  }
  const moodCeiling = moodLimit(game, moodContext())
  const statLimits = limitingEffects(game, moodContext(), inventory.clothingCleanliness)
  const separateLimits = statLimits.filter(effect => effect.reason !== 'Cold')
  const statusEffects = effects.filter(effect => effect.id !== 'free-transit')
  // Reconcile existing saves and changes of accommodation/effects without a gain.
  useEffect(() => { setGame(previous => previous) }, [moodCeiling.cap])
  const current = useMemo(() => locations.find((x) => x.id === game.locationId) ?? locations[0], [game.locationId])
  const open = isOpen(current, game.minutes)
  const { shelterNightDay, shelterBooked, shelterAdmitted, insideNightShelter, shelterCheckoutDue } = shelterAccess(game, life, current.id, !!trip, open, !!shelterDeparture)
  const currentActions = useMemo(() => actions.filter(x => x.locationId === current.id && (current.id !== 'shelter' || shelterBooked || x.id === 'shelter-rest')), [current.id, shelterBooked])
  const mapPlaces = useMemo(() => locations.filter(location => discoveredLocations.includes(location.id) && (location.id !== 'residential-shelter' || life.schroniskoReferral || life.housing === 'Schronisko')), [discoveredLocations, life.schroniskoReferral, life.housing])
  useShelterAdmission(insideNightShelter, shelterNightDay, life, setLife)
  const weather = weatherAt(game)
  const rainWaiting = !!game.rain && (game.rain.choice === 'nearby' || game.rain.choice === 'proper') && game.rain.end > absoluteMinutes(game)
  const underRainCover = rainWaiting
  const travelPhase = trip ? getTravelPhase(trip) : null
  const currentExposure = underRainCover ? 'cover' : travelPhase?.exposure ?? weatherExposure(game)
  const temperature = temperatureAt(weather.temp, game.minutes)
  const goals = useMemo(() => [
    { id: 'shelter' as const, title: t('journal.ui.goal.shelter.title'), description: activeGoal ? t('journal.ui.goal.shelter.booked', { day: displayDay(activeGoal.day), time: formatTime(activeGoal.minute) }) : t('journal.ui.goal.shelter.description') },
    { id: 'charge' as const, title: t('journal.ui.goal.charge.title'), description: t('journal.ui.goal.charge.description') },
    { id: 'work' as const, title: t('journal.ui.goal.work.title'), description: t('journal.ui.goal.work.description') },
    { id: 'cold' as const, title: t('journal.ui.goal.cold.title'), description: t('journal.ui.goal.cold.description') },
  ], [activeGoal])
  const firstNight = firstNightTime(game) && life.housing === 'Street'
  const openingCallsActive = firstNight && openingCallIndex < OPENING_CALLS.length
  const nextOpeningCall = openingCallsActive ? OPENING_CALLS[openingCallIndex] : undefined
  const completedGoals = useMemo(() => goals.filter(goal => journalGoals[goal.id]), [goals, journalGoals])
  const pendingGoals = useMemo(() => goals.filter(goal => !journalGoals[goal.id] && journalGoalKnown(journalGoals, goal.id))
    .sort((a, b) => Number(!!activeGoal && b.id === 'shelter') - Number(!!activeGoal && a.id === 'shelter')), [goals, journalGoals, activeGoal])
  useEffect(() => {
    // Reconcile historical saves without congratulating already achieved progress.
    const announce = goalsObserved.current
    goalsObserved.current = true
    setJournalGoals(previous => progressJournalGoals(previous, { game, inventory, life, effects, discoveredLocations, answeredQuestions }, announce))
  }, [game.day, game.minutes, game.locationId, inventory.phoneBattery, life.housing, life.shelterUntilDay, life.employment, effects, discoveredLocations, answeredQuestions])
  useEffect(() => {
    if (!activeGoal) return
    if ((life.shelterUntilDay ?? 0) >= game.day || life.housing === 'Schronisko' ||
        (current.id === 'shelter' && !trip && game.day >= activeGoal.day && game.minutes >= activeGoal.minute && game.minutes < 1320)) {
      setActiveGoal(null)
    } else if (game.day > activeGoal.day || (game.day === activeGoal.day && game.minutes >= 1320)) {
      setActiveGoal({ type: 'night-shelter', day: game.minutes >= 1320 ? game.day + 1 : game.day, minute: SHELTER_ENTRY_OPEN })
    }
  }, [activeGoal, game.day, game.minutes, current.id, trip, life.shelterUntilDay, life.housing])
  const usedBackpackSlots = backpackSlots(inventory)
  const gameOver = game.health <= 0
  const travelVisible = travelling && !(activeEvent || diceCheck || pendingResult || infoModal || rainChoice || rainWaiting || gameOver)
  useEffect(() => {
    if (!travelVisible) return
    const panel = travelModalRef.current
    panel?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      event.preventDefault()
      panel?.querySelector<HTMLButtonElement>('button')?.focus()
    }
    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [travelVisible])
  const phoneSearchVisible = !!phoneActivity && !(activeEvent || diceCheck || pendingResult || infoModal || rainChoice || rainWaiting || gameOver || closingNotice)
  const streetEventVisible = !!activeEvent && !diceCheck && !sleeping && !infoModal && !pendingResult && !gameOver
  const visibleEventChoices = activeEvent?.choices.filter(choice => !choice.undiscoveredLocationRequired || !discoveredLocations.includes(choice.undiscoveredLocationRequired)) ?? []
  const { respondToRain, continueInRain } = useRainScheduling({ game, gameOver, currentExposure, sleeping: !!sleeping, currentId: current.id }, setGame, setRainChoice)
  function rainStoryId(rain: RainEpisode) {
    const existing = story.current().episodes.find(entry => entry.source === 'rain' && entry.sourceId === rain.id)
    if (existing) return existing.id
    const opening = rainOpening(rain.level)
    return story.begin('rain', rain.id, { eventId: rain.id, title: opening.title, text: rain.choice ? '' : opening.text, illustration: rain.choice ? undefined : rainArt(rain, 'opening'), at: storyStamp() })
  }
  function recordRainChoice(choice: RainChoice) {
    if (!game.rain) return
    const id = rainStoryId(game.rain)
    story.chooseScene(id, { id: choice, label: t(`rain.choice.${choice}`) }, storyStamp())
  }
  useEffect(() => {
    if (rainChoice && game.rain && !activeEvent && !diceCheck && !infoModal && !pendingResult && !sleeping && !gameOver) rainStoryId(game.rain)
  }, [rainChoice, game.rain?.id, activeEvent, diceCheck, infoModal, pendingResult, sleeping, gameOver])
  useEffect(() => {
    if ((!rainChoice && !rainWaiting) || infoModal || pendingResult || activeEvent || diceCheck) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    const ownsScrollLock = !activityOverlay
    if (ownsScrollLock) document.body.style.overflow = 'hidden'
    rainModalRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const buttons = Array.from(rainModalRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])
      if (!buttons.length) return
      event.preventDefault()
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
      buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus()
    }
    document.addEventListener('keydown', trap)
    return () => { if (ownsScrollLock) document.body.style.overflow = overflow; document.removeEventListener('keydown', trap); if (previous?.isConnected) previous.focus({ preventScroll: true }) }
  }, [rainChoice, rainWaiting, infoModal, pendingResult, activeEvent, diceCheck, activityOverlay])
  const completedGoalId = journalGoals.pendingCompletions?.[0]
  const goalCompletionVisible = !!completedGoalId && !(gameOver || activeEvent || diceCheck || pendingResult || infoModal || eventResultOpen ||
    closingNotice || sleeping || sleepChoice || shelterInterview || shelterQueue || shelterCheckoutDue || shelterDeparture ||
    trashGame || trip || phoneActivity || phoneOpen || travelChoiceOpen || inventoryDialogOpen || rainChoice || rainWaiting ||
    (game.rain && !game.rain.choice && currentExposure === 'outside'))
  const eventInteractionBlocked = goalCompletionVisible || (shelterCheckoutDue && !sleeping) || !!shelterDeparture || inventoryDialogOpen || !!activeEvent || !!diceCheck || rainWaiting || (rainChoice && !infoModal && !pendingResult) || eventResultOpen || !!infoModal || !!pendingResult || !!closingNotice
  useEffect(() => {
    if (!streetEventVisible) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    eventModalRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true })
    function trap(event: KeyboardEvent) {
      if (event.key !== 'Tab') return
      const buttons = Array.from(eventModalRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
      if (!buttons.length) return
      event.preventDefault()
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
      buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus()
    }
    document.addEventListener('keydown', trap)
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', trap); if (previous?.isConnected && !document.querySelector('.result-modal')) previous.focus({ preventScroll: true }) }
  }, [streetEventVisible])
  useEffect(() => { if (phoneSearchVisible) phoneSearchModalRef.current?.focus({ preventScroll: true }) }, [phoneSearchVisible])
  const shelterDepartureRemaining = shelterDeparture ? Math.max(0, SHELTER_DEPARTURE_MINUTES - (absoluteMinutes(game) - shelterDeparture.startAbsolute)) : 0
  const freeTransitActive = inventory.transitCard || effects.some(effect => effect.id === 'free-transit' && effect.expiresAt > absoluteMinutes(game))
  const mobileServiceActive = mobileServiceUntil > absoluteMinutes(game)
  const mobileServiceMinutesLeft = Math.max(0, mobileServiceUntil - absoluteMinutes(game))
  const phoneUnavailable = phoneUnavailableReason(inventory, shelterPhoneCharging)
  const navigationOn = mobileServiceActive && phoneUnavailable === null && !sleeping && !gameOver
  const dayWorkEnergyRequired = 55
  const storageCapacity = current.id === 'residential-shelter' ? SCHRONISKO_STORAGE : NIGHT_SHELTER_STORAGE
  const usedStorageSlots = storageSlots(storage)

  const laundryCleanAt = useRef(-1)
  const hygieneLimit = clothingHygieneCap(inventory.clothingCleanliness)
  const statusNeeds: StatusNeed[] = [
    { id: 'hunger', label: t('stat.hunger'), value: game.hunger, icon: 'food' as IconName },
    { id: 'thirst', label: t('stat.thirst'), value: game.thirst, icon: 'water' as IconName },
    { id: 'energy', label: t('stat.energy'), value: game.energy, icon: 'energy' as IconName, cap: energyCap(game.health) },
    { id: 'health', label: t('stat.health'), value: game.health, icon: 'heart' as IconName },
    { id: 'hygiene', label: t('stat.hygiene'), value: game.hygiene, icon: 'shower' as IconName, cap: hygieneLimit },
    { id: 'mood', label: t('stat.mood'), value: game.mood, icon: `face-${conditionBand(game.mood).level}` as IconName, cap: moodCeiling.cap, capReason: limitReasonsLabel(moodCeiling.reasons) },
  ]
  // Dangerous physical needs take precedence over a lower mood score.
  const dangerousNeeds = statusNeeds.filter(need => need.id !== 'mood' && need.value <= 20)
  const lowestNeed = (dangerousNeeds.length ? dangerousNeeds : statusNeeds)
    .reduce((lowest, need) => need.value < lowest.value ? need : lowest)
  const focusedNeed = lowestNeed.value <= 60 ? lowestNeed : null
  useEffect(() => {
    if (game.hygiene > hygieneLimit) setGame(prev => ({ ...prev, hygiene: Math.min(prev.hygiene, hygieneLimit) }))
  }, [game.hygiene, hygieneLimit])

  function applyAction(state: GameState, result: ActionResult) {
    return applyGameAction(state, result, { ...moodContext(state), walking: !!travelPhase?.walking && !underRainCover, ...(rainWaiting ? { exposure: 'outside' as const } : travelPhase ? { exposure: travelPhase.exposure } : {}), music: musicOn })
  }

  const [inventoryAgedAt, setInventoryAgedAt] = useState(absoluteMinutes(game))
  const agedThrough = useRef(absoluteMinutes(game))
  const pausedNavigationMinutes = useRef(0)
  useEffect(() => {
    const now = absoluteMinutes(game)
    const from = agedThrough.current
    const elapsed = Math.max(0, now - from)
    agedThrough.current = now
    setInventoryAgedAt(now)
    if (elapsed === 0) return
    const movingMinutes = Math.max(0, elapsed - pausedNavigationMinutes.current)
    pausedNavigationMinutes.current = Math.max(0, pausedNavigationMinutes.current - elapsed)
    setStorage(prev => ageFood(prev, elapsed))
    const groundWindow = groundSleepWindow.current
    const extraDirt = groundWindow ? Math.max(0, Math.min(now, groundWindow.end) - Math.max(now - elapsed, groundWindow.start)) * (40 / 1440) : 0
    const wornMinutes = Math.max(0, now - Math.max(now - elapsed, laundryCleanAt.current))
    setInventory(prev => ({ ...ageFood(prev, elapsed),
        clothingCleanliness: Math.max(0, prev.clothingCleanliness - wornMinutes * (20 / 1440) * (trip?.mode === 'walk' ? 1 + .5 * movingMinutes / elapsed : 1) - extraDirt),
        phoneBattery: elapsedPhoneBattery(prev, game, { from, now, movingMinutes, travelling: !!trip, navigationOn, musicOn, charging: shelterPhoneCharging }),
    }))
  }, [game.day, game.minutes])

  const { startOpeningCall, answerPracticalQuestion, buyMobileService, chargePhone, toggleShelterPhoneCharging,
    tickPhoneActivity, pausePhone, phoneSearchCost, finishLocationPhoneCharge } = usePhoneController(phone, {
    game, inventory, currentId: current.id, open, screen, firstNight, eventInteractionBlocked, sleeping: !!sleeping,
    trip: !!trip, gameOver, insideNightShelter, shelterDeparture: !!shelterDeparture, shelterCheckoutDue, shelterBooked,
    discoveredLocations, inventoryAgedAt,
  }, {
    setGame, setInventory, setMessage, setInfoModal, setPhoneOpen, setPhoneApp, setMusicOn, setDiscoveredLocations,
    setJournalGoals, setActiveGoal, applyAction, moodCap: state => moodLimit(state, moodContext(state)).cap,
    resultSnapshot, runWithResult, onOpeningSearch: () => { openingSearchObservation.current = true },
  })

  // Repair older saves that already received a referral without its map address.
  useEffect(() => {
    if (life.schroniskoReferral || life.housing === 'Schronisko') {
      setDiscoveredLocations(prev => prev.includes('residential-shelter') ? prev : [...prev, 'residential-shelter'])
    }
  }, [life.schroniskoReferral, life.housing])

  function resultSnapshot(): ResultSnapshot {
    return { game: { ...game }, housing: moodContext().housing, inventory: { ...inventory }, effects: effects.map(effect => ({ ...effect })) }
  }

  const encounterQueue = createEncounterQueue(eventSession, { game, life, inventory, weather, trip: !!trip, infoModal: !!infoModal, currentId: current.id, firstNight,
    deferredBlocked: !!(eventInteractionBlocked || sleeping || sleepChoice || trip || phoneActivity || trashGame || shelterQueue || shelterDeparture || shelterInterview || gameOver || phoneOpen || travelChoiceOpen),
  })
  const { observeFirstNight, observeOrdinaryEvent, observeIdle } = encounterQueue
  const shelterController = createShelterController(shelterSession, { game, life, current, shelterCheckoutDue,
    departureBlocked: !!(sleeping || infoModal || pendingResult || activeEvent || diceCheck || gameOver), shelterPhoneCharging, shelterBooked,
  }, { setGame, setLife, setMessage, setMusicOn, setPhoneOpen, setShelterPhoneCharging, setSelectedDestination, setScreen, setActiveGoal,
    applyAction, moodContext, requestSleep: kind => requestSleep(kind), resultSnapshot, runWithResult })
  const { recordShelterDeparture, startShelterDeparture, answerShelterInterview, beginShelterInterview, prepareShelterAction, tickShelterQueue } = shelterController
  const sleepController = createSleepController(sleepSession, eventSession, encounterQueue, { game, inventory, effects, current, weather, underRainCover,
    insideNightShelter, streetBenchFound, blocked: !!(activeEvent || shelterQueue || shelterDeparture || shelterCheckoutDue || trip || screen === 'travel' || gameOver),
  }, { setGame, setLife, setEffects, setMessage, setInfoModal, setMusicOn, setTrip, setSelectedDestination, setPhoneOpen, setScreen,
    recordShelterDeparture, moodContext, applyAction, resultSnapshot, runWithResult })
  const { requestSleep, sleep, finishSleep, tickSleep, finishRestAction } = sleepController

  const { checkUnavailableReason, resolveStreetEvent, rollDice, acceptDiceResult, stealItem } = createEventController(eventSession, {
    game, inventory, storage, life, discoveredLocations, phoneUnavailable, shelterBooked, currentId: current.id, open,
  }, {
    setGame, setInventory, setMessage, setInfoModal, setEventResultOpen, setDiscoveredLocations, setActiveGoal,
    openPage, resultSnapshot, runWithResult, applyAction, startFareDodgeTrip: (id, outcome) => startFareDodgeTrip(id, outcome),
    recordStoryChoice,
    recordFareInspectionRoll: roll => setTrip(previous => previous?.mode === 'fare-dodge' && previous.inspection?.status === 'rolling'
      ? { ...previous, inspection: { ...previous.inspection, roll } } : previous),
  })

  const { executeInventoryCommand, returnBottles, storeItem, takeStoredItem, storeFood, takeStoredFood, buyItem, useSupply, useMedicine, smokeCigarette, useItem } = createInventoryController(
    { game, inventory, storage, effects, locationId: current.id, open, insideNightShelter },
    { setInventory, setStorage, setEffects, setGame, setMessage, setInfoModal, applyAction, runWithResult, resultSnapshot })
  const { hospitalVisit, callAmbulance } = createMedicalController(
    { game, inventory, currentId: current.id, open, activeEvent: !!activeEvent, shelterPhoneCharging },
    { setGame, setInventory, setEffects, setMessage, setSelectedDestination, setTrip, setScreen, applyAction, runWithResult })
  const { socialSupport, takeDayWork } = createSupportWorkController(
    { game, inventory, storage, life, currentId: current.id, open, dayWorkEnergyRequired },
    { setGame, setInventory, setEffects, setLife, setMessage, setDiscoveredLocations, applyAction, runWithResult })
  const { act, actionUnavailableReason } = createLocationController(
    { game, inventory, life, current, open, activeEvent: !!activeEvent, shelterQueue: !!shelterQueue, shelterBooked, shelterAdmitted, hygieneLimit },
    { setGame, setInventory, setLife, setEffects, setMessage, laundryCleanAt, runWithResult, resultSnapshot, applyAction, moodContext,
      beginShelterInterview, prepareShelterAction, requestSleep, finishRestAction, finishLocationPhoneCharge }, encounterQueue)
  const { walkMusicCost, canWalkWithMusic, walkCity, askForMoney, streetAction } = createStreetController(
    { game, inventory, currentId: current.id, activeEvent: !!activeEvent, sleeping: !!sleeping, trip: !!trip, infoModal: !!infoModal,
      musicWalkUsed, mobileServiceActive, musicOn, streetBenchFound, begging },
    { setGame, setInventory, setInfoModal, setMessage, setBegging, setMusicWalkUsed, setRainChoice, setStreetBenchFound, moodContext, resultSnapshot, runWithResult, applyAction, requestSleep }, encounterQueue)
  const { searchStreetBottles, startTrashDrag, moveTrashItem, collectTrashBottle, finishTrashSearch, checkTrashDeadline, endTrashDrag, cancelTrashDrag } = useTrashController(
    trashSession, { inventory, currentId: current.id, activeEvent: !!activeEvent },
    { setInventory, setGame, setMessage, setInfoModal, applyAction, runWithResult, resultSnapshot })

  function runWithResult(identity: ResultAction, action: () => void | InventoryHistoryFacts | ActionHistoryFacts, before = resultSnapshot(), includeTime = true, always = false, consumedItems: ConsumedItem[] = []) {
    if (!resultActionAllowed(identity.id, { sleepChoice: !!sleepChoice, shelterQueue: !!shelterQueue, shelterDeparture: !!shelterDeparture, shelterCheckoutDue, activeEvent: !!activeEvent, diceCheck: !!diceCheck, shelterInterview: !!shelterInterview })) return
    const facts = action()
    const inventoryHistory = facts && !('kind' in facts) ? facts : identity.inventoryHistory
    const actionHistory = facts && 'kind' in facts ? facts : identity.actionHistory
    setPendingResult({ ...identity, inventoryHistory, actionHistory, before, includeTime, always, consumedItems })
  }

  useEffect(() => {
    if (!pendingResult || inventoryAgedAt !== absoluteMinutes(game) || game.hygiene > hygieneLimit || game.mood > moodCeiling.cap) return
    setPendingResult(null)
    if (sleeping || sleepChoice || shelterQueue || shelterDeparture || trashGame || shelterInterview || diceCheck) return
    const summary = summarizeResult(pendingResult.before, resultSnapshot(), pendingResult.includeTime, pendingResult.consumedItems)
    if (!pendingResult.always && summary.costs.length === 0 && summary.changes.length === 0 && !infoModal) return
    const memories = [
      { id: 'office-routine', actions: ['city-walk'], text: t('journal.ui.memory.office-routine') },
      { id: 'redundancy-savings', actions: ['bench-rest', 'location:station-rest', 'rain-cover'], text: t('journal.ui.memory.redundancy-savings') },
      { id: 'unanswered-applications', actions: ['question:morning'], text: t('journal.ui.memory.unanswered-applications') },
    ]
    const memory = memories.find(fragment => fragment.actions.includes(pendingResult.id) && !seenMemories.includes(fragment.id))
    const resultText = memory ? t('journal.ui.resultWithMemory', { result: infoModal?.text ?? message, memory: memory.text }) : infoModal?.text ?? message
    if (memory) setSeenMemories(previous => [...new Set([...previous, memory.id])])
    if (lastRecordedResult.current !== pendingResult) {
      lastRecordedResult.current = pendingResult
      const actionTitle = pendingResult.title
      const reflection = journalPresentation(pendingResult, summary, memory?.id)
      const entry: JournalEntry = { day: game.day, minute: game.minutes, actionId: pendingResult.id, ...(pendingResult.eventHistory ? { outcomeId: pendingResult.eventHistory.outcomeId } : {}), actionTitle, reflection: true, ...reflection }
      setJournalEntries(previous => [...previous, entry].slice(-500))
    }
    const result = { ...infoModal, title: infoModal?.title ?? pendingResult.title, text: resultText, reflection: memory?.text, ...summary }
    if (pendingResult.storyEpisodeId !== undefined) story.finish(pendingResult.storyEpisodeId, result, storyStamp(), { actionId: pendingResult.id, ...(pendingResult.eventHistory ? { outcomeId: pendingResult.eventHistory.outcomeId } : {}) })
    setInfoModal(result)
  }, [pendingResult, game, inventory, effects, sleeping, sleepChoice, trashGame, shelterInterview, shelterQueue, shelterDeparture, diceCheck, message, inventoryAgedAt])

  useRainResults({ game, effects, blocked: !!(goalCompletionVisible || gameOver || activeEvent || diceCheck || infoModal || pendingResult || sleeping || sleepChoice || shelterInterview || shelterQueue || shelterDeparture || closingNotice || inventoryDialogOpen || trashGame || trip?.remaining === 0 || phoneActivity?.remaining === 0) }, {
    setGame, setEffects, setInfoModal, setEventResultOpen, setJournalEntries, resultSnapshot,
    recordStoryResult: (rain, result) => story.finish(rainStoryId(rain), result, storyStamp(), { actionId: rainResultActionId(rain) }),
  })

  const closingWatch = useRef({ id: game.locationId, minute: absoluteMinutes(game), travelling: !!trip })
  const locationIsClosing = !trip && !closingWatch.current.travelling && closingWatch.current.id === current.id && locationClosedSince(current, closingWatch.current.minute, absoluteMinutes(game))
  useEffect(() => {
    const previous = closingWatch.current
    const now = absoluteMinutes(game)
    closingWatch.current = { id: current.id, minute: now, travelling: !!trip }
    if (gameOver || trip || previous.travelling || previous.id !== current.id || !locationClosedSince(current, previous.minute, now)) return
    setClosingNotice(current.id)
    setGame(state => ({ ...state, locationId: 'street' }))
    setSelectedDestination(null)
    setPhoneOpen(false)
    setScreen('location')
    setJournalEntries(entries => [...entries, { day: game.day, minute: game.minutes, title: t('location.history.closingTitle'), reflection: true as const, actionId: 'closing-time' as const, decisionId: 'closing-time', groupId: JSON.stringify(['closing-time', current.id]), actionTitle: t('location.history.closingAction'), text: t('location.history.closingText', { place: locationName(current.id) }) }].slice(-500))
  }, [game.day, game.minutes, current, !!trip, gameOver])


  useShelterProcesses(shelterSession, shelterController, { game, life, current, trip: !!trip, shelterBooked, shelterDepartureRemaining, gameOver }, setLife)
  useEffect(() => {
    const now = absoluteMinutes(game)
    setEffects((prev) => { const next = prev.filter((effect) => effect.expiresAt > now); return next.length === prev.length ? prev : next })
  }, [game.day, game.minutes])
  useShelterAttendance(game, life, setLife, setMessage)

  useForcedSleep(sleepSession, game, !!(goalCompletionVisible || locationIsClosing || closingNotice || inventoryDialogOpen || phoneActivity || rainChoice || gameOver || activeEvent || diceCheck || shelterInterview || shelterQueue || shelterCheckoutDue || shelterDeparture || trip || infoModal || pendingResult), sleepController)

  const tickGameClock = useLatestAction(() => {
    if (screen === 'story') return
    if (goalCompletionVisible) return
    if (closingNotice) return
    if (rainChoice || (game.rain && !game.rain.choice && currentExposure === 'outside' && !sleeping)) return
    // Waiting/searching pauses the interrupted trip or phone activity, but time
    // and ordinary needs continue at the shared action speed.
    if (rainWaiting) {
      if (infoModal || pendingResult || activeEvent || diceCheck || inventoryDialogOpen || gameOver || document.visibilityState !== 'visible') return
      pausedNavigationMinutes.current += 1
      setGame(previous => applyAction(previous, { minutes: 1 }))
      pausePhone()
      return
    }
    if (phoneActivity) {
      if (phoneActivity.remaining <= 0 || gameOver || activeEvent || diceCheck || infoModal || pendingResult || inventoryDialogOpen || document.visibilityState !== 'visible') return
      tickPhoneActivity()
      return
    }
    if (inventoryDialogOpen || rainChoice || (document.visibilityState !== 'visible' && !sleeping) || activeEvent || diceCheck || shelterInterview || gameOver || infoModal || pendingResult || sleepChoice || trashGame || (shelterCheckoutDue && !sleeping) || (shelterDeparture && shelterDepartureRemaining === 0)) return
    if (sleeping) tickSleep()
    if (sleeping) return
    const observationReleased = encounterQueue.tickDeferredEncounter(() => applyAction(game, { minutes: 1 }))
    const tickMinutes = trip ? Math.min(1, trip.remaining) : 1
    if (shelterQueue) tickShelterQueue(tickMinutes)
    setGame(prev => applyAction(prev, { minutes: tickMinutes }))
    if (!underRainCover) setTrip(active => advanceTrip(active, tickMinutes))
    if (!observationReleased && !trip && !shelterQueue && !shelterDeparture) observeIdle(tickMinutes, () => applyAction(game, { minutes: tickMinutes }))
  })
  const gameClockInterval = activeCall ? 1000 : trip || shelterDeparture || phoneActivity || rainWaiting ? ACTIVITY_TICK_MS : 1000
  useEffect(() => {
    const timer = window.setInterval(tickGameClock, gameClockInterval)
    return () => window.clearInterval(timer)
  }, [tickGameClock, gameClockInterval])

  const { cancelTravel, chooseDestination, confirmStreetExit, attemptFareDodge, startTravel, startFareDodgeTrip } = useTravelController(eventSession, encounterQueue, {
    game, trip, selectedDestination, streetExitPending, blocked: !!(sleepChoice || shelterQueue || shelterDeparture || shelterCheckoutDue),
    inspectionBlocked: !!(infoModal || pendingResult || gameOver || rainChoice || rainWaiting || goalCompletionVisible || inventoryDialogOpen || closingNotice || sleeping || phoneActivity),
    freeTransitActive, shelterPhoneCharging, shelterBooked, shelterNightDay,
  }, {
    setGame, setTrip, setSelectedDestination, setStreetExitPending, setStreetBenchFound, setShelterArrival, setLife, setScreen,
    setMessage, openPage, recordShelterDeparture, resultSnapshot, runWithResult, applyAction,
  })

  useEncounterObservers(encounterQueue, eventSession, { game, currentId: current.id, firstNight,
    blocked: !!(eventInteractionBlocked || sleeping || sleepChoice || trip || phoneActivity || trashGame || shelterQueue || shelterDeparture || shelterInterview || gameOver || phoneOpen || travelChoiceOpen),
  })

  useEffect(() => {
    if (!sleepChoice) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSleepChoice(null) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [sleepChoice])

  useSleepCompletion(sleepSession, game, sleepController)

  // Street offers one phone entry; all individual searches live in Find Help.
  const exhausted = game.energy <= 40
  const lastAction = journalEntries.at(-1)?.actionId
  const justWalked = lastAction === 'city-walk' || lastAction === 'music-walk'
  const wantsBench = answeredQuestions.includes('bed') && !exhausted && lastAction !== 'bench-rest' && !justWalked
  const bodyChoices = exhausted ? ['bench-sleep', 'street-sleep', 'bench-rest', 'find-bench']
    : openingCallsActive ? ['music-walk']
    : wantsBench ? [firstNight || (game.minutes >= 360 && game.minutes < 1380) ? 'bench-rest' : 'bench-sleep', 'find-bench', 'street-sleep']
    : (game.minutes >= 1380 || game.minutes < 360) && !justWalked ? ['street-sleep', 'bench-sleep']
    : ['music-walk']
  const practicalChoices = shelterBooked ? ['shelter-route', 'station-route']
    : firstNight || !discoveredLocations.includes('work') ? ['station-route']
    : game.money < 50 ? ['beg', 'bottles', 'station-route']
    : ['bottles', 'station-route', 'work-route']
  const streetChoiceGroups = [
    [openingCallsActive ? 'phone-call' : 'phone-help'],
    bodyChoices,
    ...(openingCallsActive ? [] : [practicalChoices]),
  ]
  const choiceDecisionKey = journalDecisionKey(journalEntries)

  function reset() {
    autosave.resetPending()
    setChoiceSeed(newChoiceSeed())
    localStorage.removeItem(SAVE_KEY)
    localStorage.removeItem(DISCOVERY_KEY)
    localStorage.removeItem(SAVE_KEYS.discoveryVersion)
    setDiscoveredLocations(['street', 'station', 'shop'])
    setActiveGoal(null)
    setJournalGoals(initialJournalGoals(INITIAL_INVENTORY.phoneBattery))
    setJournalEntries([])
    story.reset()
    localStorage.removeItem(STORY_KEY)
    setMusicWalkUsed(false)
    localStorage.removeItem(MUSIC_WALK_USED_KEY)
    setSelectedJournalDay(null)
    setPhoneApp('home')
    lastRecordedResult.current = null
    localStorage.removeItem(JOURNAL_HISTORY_KEY)
    localStorage.removeItem(JOURNAL_GOALS_KEY)
    localStorage.removeItem(GOAL_KEY)
    setGame(createInitialState())
    setMessage(t('app.newRun'))
    setInfoModal(null)
    setClosingNotice(null)
    localStorage.removeItem(CLOSING_NOTICE_KEY)
    setEventResultOpen(false)
    resetPhoneSession()
    setDiscardItem(null)
    setStreetExitPending(false)
    setFoodChoice(null)
    setPendingResult(null)
    setScreen('location')
    setRainChoice(false)
    setSeenMemories([])
    setTrip(null)
    resetShelterSession()
    setSelectedDestination(null)
    setMusicOn(false)
    setStreetBenchFound(false)
    setBegging({ day: 1, attempts: 0 })
    localStorage.removeItem(SHELTER_PHONE_CHARGE_KEY)
    resetEventSession()
    localStorage.removeItem(LEFT_HOME_KEY)
    localStorage.removeItem(FIRST_NIGHT_EVENTS_KEY)
    localStorage.removeItem(ENCOUNTERS_KEY)
    laundryCleanAt.current = -1
    setInventory(INITIAL_INVENTORY)
    setStorage(INITIAL_STORAGE)
    setLife(INITIAL_LIFE)
    setEffects([])
    resetSleepSession()
    resetTrashSession()
    localStorage.removeItem(SAVE_KEYS.inventory)
    localStorage.removeItem(SAVE_KEYS.storage)
    localStorage.removeItem(SAVE_KEYS.effects)
    localStorage.removeItem(SAVE_KEYS.situation)
    localStorage.removeItem(SAVE_KEYS.sleep)
    localStorage.removeItem(SAVE_KEYS.trip)
    localStorage.removeItem(SAVE_KEYS.begging)
    localStorage.removeItem(SAVE_KEYS.shelterQueue)
    localStorage.removeItem(SAVE_KEYS.shelterDeparture)
    localStorage.removeItem(SAVE_KEYS.mobileServiceUntil)
    localStorage.removeItem(SAVE_KEYS.mobileAutoRenew)
    localStorage.removeItem(SAVE_KEYS.mobileRenewedDay)
  }

  const autosave = useGameAutosave({
    [SAVE_KEY]: game,
    [CHOICE_SEED_KEY]: choiceSeed,
    [DISCOVERY_KEY]: discoveredLocations,
    [SAVE_KEYS.discoveryVersion]: 2,
    [GOAL_KEY]: activeGoal,
    [JOURNAL_GOALS_KEY]: journalGoals,
    [JOURNAL_HISTORY_KEY]: journalEntries,
    [STORY_KEY]: story.store,
    [MUSIC_WALK_USED_KEY]: musicWalkUsed,
    [PHONE_ACTIVITY_KEY]: phoneActivity,
    [OPENING_CALLS_KEY]: openingCallIndex,
    [SAVE_KEYS.inventory]: inventory,
    [SHELTER_PHONE_CHARGE_KEY]: shelterPhoneCharging || null,
    [CLOSING_NOTICE_KEY]: closingNotice,
    [SAVE_KEYS.storage]: storage,
    [SAVE_KEYS.effects]: effects,
    [SAVE_KEYS.situation]: life,
    [SAVE_KEYS.begging]: begging,
    [SAVE_KEYS.answers]: answeredQuestions,
    [SAVE_KEYS.memories]: seenMemories,
    [FIRST_NIGHT_EVENTS_KEY]: firstNightEvents,
    [LEFT_HOME_KEY]: leftHome,
    [ENCOUNTERS_KEY]: encounters,
    [SAVE_KEYS.rainChoice]: rainChoice,
    [RAIN_RESPONSE_KEY]: null,
    [SAVE_KEYS.screen]: screen === 'travel' || screen === 'story' ? undefined : screen,
    [SAVE_KEYS.mobileServiceUntil]: mobileServiceUntil,
    [SAVE_KEYS.mobileAutoRenew]: mobileAutoRenew,
    [SAVE_KEYS.mobileRenewedDay]: mobileRenewedDay,
    [SAVE_KEYS.trip]: trip,
    [SAVE_KEYS.sleep]: sleeping,
    [SAVE_KEYS.shelterQueue]: shelterQueue,
    [SHELTER_ARRIVAL_KEY]: shelterArrival,
    [SAVE_KEYS.shelterDeparture]: shelterDeparture,
  }, inventoryAgedAt === absoluteMinutes(game) && game.hygiene <= hygieneLimit && !pendingResult, [
    story.store, discoveredLocations, activeGoal, journalGoals, journalEntries, musicWalkUsed, answeredQuestions, seenMemories, firstNightEvents, leftHome, encounters, choiceSeed,
    rainChoice, screen, life, effects, begging, mobileServiceUntil, mobileAutoRenew, mobileRenewedDay,
    game.day, gameOver, !!trip, trip?.inspection, !!sleeping, !!shelterQueue, !!shelterDeparture, shelterArrival,
    phoneActivity?.questionId ?? null, openingCallIndex, infoModal, shelterPhoneCharging, closingNotice,
  ])

  function eatFromSlot(kind: FoodKind, slotIndex: number, condition?: FoodCondition) {
    if (kind === 'food') useItem(kind, slotIndex, condition)
    else useSupply(kind, slotIndex, condition)
  }

  function requestFood(kind: FoodKind, name: string, slotIndex: number) {
    const slot = foodSlot(inventory, kind, slotIndex)
    if (slot.quantity === 0) return
    if (slot.fresh === slot.quantity) { eatFromSlot(kind, slotIndex); return }
    setFoodChoice({ kind, name, slotIndex })
  }

  function chooseFood(condition: FoodCondition) {
    if (!foodChoice) return
    const { kind, slotIndex } = foodChoice
    setFoodChoice(null)
    eatFromSlot(kind, slotIndex, condition)
  }

  function confirmDiscard(spoiledOnly: boolean) {
    if (!discardItem) return
    executeInventoryCommand({ type: 'discard', ...discardItem, spoiledOnly })
    setDiscardItem(null)
  }

  return <main className={`shell${screen === 'location' ? ' location-screen' : ''}${screen === 'phone' ? ' phone-shell' : ''}${screen === 'map' || travelling ? ' map-screen' : ''}${screen === 'location' && current.id === 'street' ? ' street-screen' : screen === 'location' && current.id === 'shop' ? ' shop-screen' : ''}`}>
    {streetExitPending && <InventoryDialog icon="exit" label={t('location.leaveLabel')} title={t('location.leaveTitle', { place: locationName(current.id) })} onCancel={cancelStreetExit}>
      <div className="sleep-choice-buttons"><ModalAction variant="secondary" type="button" onClick={cancelStreetExit}>{t('common.cancel')}</ModalAction><ModalAction type="button" className="confirm-action" onClick={confirmStreetExit}>{t('location.goToStreet')}</ModalAction></div>
    </InventoryDialog>}
    {foodChoice && <FoodChoiceDialog name={foodChoice.name} counts={foodSlot(inventory, foodChoice.kind, foodChoice.slotIndex)} onCancel={cancelFoodChoice} onChoose={chooseFood} />}
    {discardItem && <DiscardDialog name={discardItem.name} quantity={discardItem.quantity} spoiledQuantity={discardItem.spoiledQuantity} onCancel={cancelDiscard} onConfirm={() => confirmDiscard(false)} onDiscardSpoiled={() => confirmDiscard(true)} />}
    {sleepChoice && <SleepPlanningDialog
      kind={sleepChoice} energy={game.energy}
      options={SLEEP_HOURS.map(hours => ({ hours, unavailableReason: sleepUnavailableReason(hours, game.energy) }))}
      selectedHours={sleepHours}
      wetClothesWarning={CLOTHING_WETNESS_ENABLED && (sleepChoice === 'ground' || (sleepChoice === 'bench' && current.id === 'street')) && ((game.wetness ?? 0) > 0 || weather.id === 'Rain' || weather.id === 'Showers')}
      onSelect={setSleepHours} onCancel={() => setSleepChoice(null)}
      onConfirm={() => runWithResult({ id: 'sleep-start', title: t('sleep.start.title') }, () => sleep(sleepHours, sleepChoice))}
    />}
    {goalCompletionVisible && <GoalCompletedDialog key={completedGoalId} title={goals.find(goal => goal.id === completedGoalId)!.title} onClose={acknowledgeGoalCompletion} />}
    {infoModal && <ResultCard result={infoModal} onClose={closeResult} />}
    {closingNotice && !infoModal && !pendingResult && !activeEvent && !diceCheck && !sleeping && !gameOver && <ResultCard result={{
      title: t('location.closedTitle', { place: locationName(closingNotice) }),
      label: t('location.closingLabel'),
      text: t('location.closingText'),
      illustration: '/street-life-game/assets/event-closing-time.webp',
      illustrationAlt: t('location.closingAlt'),
    }} onClose={() => setClosingNotice(null)} />}
    {trashGame && <TrashSearchDialog trashGame={trashGame} checkTrashDeadline={checkTrashDeadline} finishTrashSearch={finishTrashSearch}
      startTrashDrag={startTrashDrag} moveTrashItem={moveTrashItem} collectTrashBottle={collectTrashBottle} endTrashDrag={endTrashDrag} cancelTrashDrag={cancelTrashDrag} />}

    {phoneOpen && phoneUnavailable === null && <PhoneDialog
      battery={inventory.phoneBattery} serviceActive={mobileServiceActive} serviceMinutesLeft={mobileServiceMinutesLeft} canBuyService={game.money >= 1}
      autoRenew={mobileAutoRenew} onClose={() => setPhoneOpen(false)} onBuyService={() => { setPhoneOpen(false); buyMobileService() }}
      onAutoRenew={() => setMobileAutoRenew(value => !value)}
      blocked={eventInteractionBlocked || !!sleeping || !!sleepChoice || !!gameOver}
    />}

    <div className={`game-background${eventInteractionBlocked ? ' event-background-blocked' : ''}`} inert={eventInteractionBlocked} aria-hidden={eventInteractionBlocked || undefined} onClickCapture={event => { if (eventInteractionBlocked) { event.preventDefault(); event.stopPropagation() } }}>
    <GameHeader game={game} weatherId={weather.id} temperature={temperature} battery={inventory.phoneBattery} />
    <div className="game-content" ref={contentRef}>

    {screen === 'story' && <StoryScreen episodes={story.store.episodes} />}
    {screen !== 'story' && <>
    {screen === 'location' && <LocationScreen state={{
      current, open, firstNight, game, message, currentActions, shelterInterview, choiceSeed, choiceDecisionKey,
      usedBackpackSlots, inventory, life, insideNightShelter, usedStorageSlots, storageCapacity, storage,
      shelterPhoneCharging, dayWorkEnergyRequired, streetChoiceGroups, nextOpeningCall, phoneUnavailable,
      musicWalkUsed, canWalkWithMusic, walkMusicCost, shelterBooked, discoveredLocations, begging, streetBenchFound, hygieneLimit,
      underRainCover, travelling: !!trip, busy: !!phoneActivity,
      streetIllustration: current.id === 'street' && !infoModal?.illustration ? infoModal?.presentation?.illustration : undefined,
    }} handlers={{
      answerShelterInterview, returnBottles, buyShopItem, stealShopItem, socialSupport, takeStoredItem, storeItem,
      storeFood, takeStoredFood, chargePhone, toggleShelterPhoneCharging, takeDayWork, hospitalVisit, startOpeningCall,
      walkCity, askForMoney, searchStreetBottles, streetAction, act, actionUnavailableReason,
      openPhone: () => openPage('phone'),
      goToShelter: () => { openPage('map'); chooseDestination('shelter') },
      goToWork: () => { openPage('map'); chooseDestination('work') },
      goToStation: () => { setSelectedDestination(null); setMapInitialFocus('station'); openPage('map') },
    }} />}

    {phoneActivity && <ActivityDialog kind="phone" visible={phoneSearchVisible} panelRef={phoneSearchModalRef}
      calling={!!activeCall} title={activeCall?.callingTitle ?? t('phone.ui.searchTitle')}
      elapsed={phoneActivity.total - phoneActivity.remaining} timeLabel={activeCall ? t('phone.ui.elapsedCall') : t('phone.ui.elapsedBrowsing')}
      phase={activeCall ? activeCall.id === 'call-university' || phoneActivity.remaining === phoneActivity.total ? t('phone.ui.phase.ringing') : t('phone.ui.phase.talking') : phoneActivity.remaining > phoneActivity.total * 2 / 3 ? t('phone.ui.phase.searching') : phoneActivity.remaining > phoneActivity.total / 3 ? t('phone.ui.phase.reading') : t('phone.ui.phase.saving')}
    />}

    {(screen === 'map' || travelling) && <div className="map-surface" inert={travelling} aria-hidden={travelling || undefined}><CityMap
      places={mapPlaces}
      currentId={game.locationId} initialFocusId={mapInitialFocus} minutes={game.minutes} reservedBed={shelterBooked} routeId={travelling ? trip!.destinationId : selectedDestination} onRoute={chooseDestination}
    /></div>}

    {screen === 'travel' && trip && (() => {
      const destination = locations.find((x) => x.id === trip.destinationId)
      const elapsed = Math.max(0, trip.total - trip.remaining)
      const phase = getTravelDisplayPhase(trip)
      return <ActivityDialog kind="travel" visible={travelVisible} panelRef={travelModalRef}
        from={locationName(current.id)} to={destination ? locationName(destination.id) : undefined} walking={trip.mode === 'walk'} moving={phase.walking}
        actions={<ActivityCancel onClick={() => { if (travelVisible) cancelTravel() }} />}
        elapsed={elapsed} phase={underRainCover ? t('travel.underCover') : travelPhaseLabel(phase.id)}
      />
    })()}

    {selectedDestination && screen === 'map' && <TravelPlanningDialog destination={locations.find(location => location.id === selectedDestination)}
      panelRef={travelChoiceRef} choiceSeed={choiceSeed} choiceDecisionKey={choiceDecisionKey} freeTransitActive={freeTransitActive}
      money={game.money} onClose={() => setSelectedDestination(null)} onStart={startTravel} onFareDodge={attemptFareDodge} />}

    {screen === 'inventory' && <InventoryScreen inventory={inventory} hygiene={game.hygiene} usedBackpackSlots={usedBackpackSlots} shelterPhoneCharging={shelterPhoneCharging}
      onUseItem={useItem} onUseSupply={useSupply} onSmoke={smokeCigarette} onMedicine={useMedicine} onRequestFood={requestFood} onDiscard={setDiscardItem} />}
    {screen === 'status' && <StatusScreen game={game} statusEffects={statusEffects} statLimits={statLimits} separateLimits={separateLimits} statusNeeds={statusNeeds} focusedNeed={focusedNeed}
      situation={{ housing: life.housing, employment: life.employment, income: life.income, documents: inventory.documents ? 'carried' : storage.documents ? 'stored' : 'missing' }} />}
    {screen === 'phone' && <PhoneScreen busy={!!phoneActivity} app={phoneApp} onApp={openPhoneApp} pendingGoals={pendingGoals.length} unavailable={phoneUnavailable} serviceActive={mobileServiceActive} serviceMinutesLeft={mobileServiceMinutesLeft} onPlan={() => setPhoneOpen(true)}>
      {(phoneApp === 'settings' || phoneApp === 'language') && <PhoneSettingsScreen page={phoneApp} onLanguage={() => openPhoneApp('language')} />}
      {phoneApp === 'goals' && <JournalGoals pending={pendingGoals} completed={completedGoals} />}
      {phoneApp === 'history' && <PhoneHistoryScreen journalDay={journalDay} today={game.day} entries={journalEntries} onDayChange={setSelectedJournalDay} />}
      {phoneApp === 'notes' && <PhoneNotesScreen mapPlaces={mapPlaces} answeredQuestions={answeredQuestions} />}
      {phoneApp === 'search' && <PhoneSearchScreen serviceActive={mobileServiceActive} answeredQuestions={answeredQuestions} battery={inventory.phoneBattery} phoneSearchCost={phoneSearchCost}
        onOpenNotes={() => openPhoneApp('notes')} onSearch={answerPracticalQuestion} />}
    </PhoneScreen>}
    {screen === 'phone' && phoneApp === 'home' && phoneUnavailable === null && game.health <= 20 && <ChoiceButton className="action phone-emergency" aria-label={t('app.emergency')} onClick={callAmbulance} icon="ambulance" label={t('app.emergency')} detail={<small>{t('app.emergencyDescription')}</small>} />}

    {autosave.saveFailed && <p role="alert" className="save-warning">{t('app.saveFailed')}</p>}
    <footer inert={activityOverlay || eventInteractionBlocked} aria-hidden={eventInteractionBlocked || undefined} className={eventInteractionBlocked ? 'event-background-blocked' : undefined}><button className="reset" disabled={eventInteractionBlocked} onClick={() => { if (!eventInteractionBlocked) reset() }}>{t('app.reset')}</button><small className="header-version" title={BUILD_VERSION} aria-label={t('app.buildAccessible', { version: BUILD_VERSION })}>{t('app.buildShort', { version: BUILD_VERSION.split('-').pop() ?? '' })}</small></footer>
    </>}
    </div>
    </div>

    {gameOver && <GameOverDialog day={game.day} onReset={reset} />}

    {!gameOver && !closingNotice && (rainChoice || rainWaiting) && game.rain && !sleeping && !infoModal && !pendingResult && !activeEvent && !diceCheck && <RainEventDialog
      rain={game.rain} waiting={rainWaiting} elapsed={Math.floor(absoluteMinutes(game) - (game.rain.choiceAt ?? game.rain.start))}
      orderSeed={choiceSeed} decisionKey={choiceDecisionKey} panelRef={rainModalRef} onChoose={choice => { recordRainChoice(choice); respondToRain(choice) }}
      onContinue={() => { recordRainChoice('continue'); continueInRain() }}
    />}
    {!gameOver && diceCheck?.choice.check && <DiceDialog diceCheck={diceCheck}
      onRoll={rollDice} onAccept={acceptDiceResult} onCancel={() => setDiceCheck(null)} />}

    {!gameOver && shelterQueue && <ShelterQueueDialog shelterQueue={shelterQueue} minute={game.minutes} />}

    {!gameOver && shelterCheckoutDue && !sleeping && !infoModal && !pendingResult && !activeEvent && !diceCheck && <ShelterCheckoutWarning minute={game.minutes} onStart={startShelterDeparture} />}

    {!gameOver && shelterDeparture && <ShelterDepartureDialog minute={game.minutes} shelterDeparture={shelterDeparture}
      shelterDepartureRemaining={shelterDepartureRemaining} shelterPhoneCharging={shelterPhoneCharging} />}

    {sleeping && <SleepProgressDialog sleeping={sleeping} minute={game.minutes} onWake={() => finishSleep(sleeping)} />}

    {!gameOver && activeEvent && !diceCheck && !sleeping && !infoModal && !pendingResult && <EventDialog
      event={activeEvent} choices={visibleEventChoices} onChoose={resolveStreetEvent} unavailableReason={checkUnavailableReason}
      orderSeed={choiceSeed} decisionKey={choiceDecisionKey} panelRef={eventModalRef}
    />}

    <BottomNavigation screen={screen} blocked={eventInteractionBlocked} phoneBusy={!!phoneActivity} travelling={travelling} current={current} mood={game.mood} onNavigate={setScreen} />
  </main>
}
