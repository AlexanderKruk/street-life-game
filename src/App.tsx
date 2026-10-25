import { FIRST_NIGHT_EVENTS_KEY,ENCOUNTERS_KEY,LEFT_HOME_KEY,RAIN_RESPONSE_KEY,PHONE_ACTIVITY_KEY,MUSIC_WALK_USED_KEY,GOAL_KEY,JOURNAL_GOALS_KEY,JOURNAL_HISTORY_KEY,SHELTER_ARRIVAL_KEY,SAVE_KEYS } from './saveKeys'
import { INITIAL_LIFE,SHELTER_DEPARTURE_MINUTES,loadGameSession } from './loadGameSession'
import { useCallback,useEffect,useMemo,useRef,useState } from 'react'
import ActivityDialog from './ActivityDialog'
import BottomNavigation from './BottomNavigation'
import ChoiceButton from './ChoiceButton'
import CityMap from './CityMap'
import DiceDialog from './DiceDialog'
import TravelPlanningDialog from './TravelPlanningDialog'
import DiscardDialog from './DiscardDialog'
import EventDialog from './EventDialog'
import FoodChoiceDialog from './FoodChoiceDialog'
import GameHeader from './GameHeader'
import { Icon,type IconName } from './Icon'
import InventoryDialog from './InventoryDialog'
import InventoryScreen from './InventoryScreen'
import { JournalGoals } from './JournalSections'
import LocationScreen from './LocationScreen'
import { ModalAction,ModalOverlay,ModalPanel } from './Modal'
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
import StatusScreen from './StatusScreen'
import TrashSearchTime,{ trashSearchMinutes } from './TrashSearchTime'
import { firstNightTime } from './events'
import { ageFood,foodSlot,type FoodCondition,type FoodKind } from './foodInventory'
import { actions,applyAction as applyGameAction,conditionBand,createInitialState,energyCap,formatTime,isOpen,limitMood,locations,moodLimit,temperatureAt,weatherAt,weatherExposure,type ActionResult,type GameState,type Housing } from './game'
import { displayDay } from './gameDate'
import { absoluteMinutes,formatTravelTime,weekday } from './gameTime'
import { CLOTHING_WETNESS_ENABLED } from './gameplayFeatures'
import { BACKPACK_CAPACITY,BOTTLE_STACK_SIZE,FREE_WATER_LIMIT,INITIAL_INVENTORY,INITIAL_STORAGE,NIGHT_SHELTER_STORAGE,SCHRONISKO_STORAGE,SHOP_ITEMS,backpackSlots,storageSlots } from './inventory'
import { inventoryCommandResult,resolveInventoryCommand,type InventoryCommand } from './inventoryCommands'
import { journalReflection,type JournalEntry } from './journal'
import { limitingEffects } from './limitingEffects'
import { CLOSING_NOTICE_KEY,locationClosedSince } from './locationClosing'
import { OPENING_CALLS,OPENING_CALLS_KEY,openingCall } from './openingCalls'
import { phoneDrainMultiplier } from './phonePower'
import { locationPresentation } from './resultPresentation'
import { summarizeResult,type ConsumedItem,type ResultSnapshot } from './results'
import { DISCOVERY_KEY,SAVE_KEY } from './saveCompatibility'
import { SHELTER_PHONE_CHARGE_KEY } from './shelterCharging'
import { SHELTER_ENTRY_OPEN,shelterAccess } from './shelterRules'
import { SLEEP_HOURS,sleepDurationUnavailable } from './sleepRules'
import type { ActiveEffect,BackpackItemId,Inventory,JournalGoals as JournalGoalState,LifeSituation,Screen,ShopItem,StoredItems,TravelMode,Trip } from './stateTypes'
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
import { locationActionUnavailable } from './locationActionRules'
import { useLatestAction } from './useLatestAction'

const BUILD_VERSION = 'v2026.10.25-331'
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
  const [message, setMessage] = useState('')
  const [infoModal, setInfoModal] = useState<ResultCardData | null>(null)
  const [closingNotice, setClosingNotice] = useState<string | null>(() => initial.closingNotice)
  const [pendingResult, setPendingResult] = useState<{ title: string; before: ResultSnapshot; includeTime: boolean; always: boolean; consumedItems: ConsumedItem[] } | null>(null)
  const [eventResultOpen, setEventResultOpen] = useState(false)
  const closeResult = useCallback(() => {
    if (infoModal?.rainResultId) commitGame(previous => ({ ...previous, rainResults: previous.rainResults?.filter(rain => rain.id !== infoModal.rainResultId) }))
    setInfoModal(null); setEventResultOpen(false)
  }, [infoModal?.rainResultId])
  const buyShopItem = useLatestAction((id: string) => { const item = SHOP_ITEMS.find(item => item.id === id); if (item) buyItem(item) })
  const stealShopItem = useLatestAction((id: string) => { const item = SHOP_ITEMS.find(item => item.id === id); if (item) stealItem(item) })
  const [discoveredLocations, setDiscoveredLocations] = useState<string[]>(() => initial.discoveredLocations)
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => initial.journalEntries)
  const [musicWalkUsed, setMusicWalkUsed] = useState(() => initial.musicWalkUsed)
  const lastRecordedResult = useRef<unknown>(null)
  const [journalGoals, setJournalGoals] = useState<JournalGoalState>(() => initial.journalGoals)
  const [activeGoal, setActiveGoal] = useState<{ type: 'night-shelter'; day: number; minute: number } | null>(() => initial.activeGoal)
  const [screen, setScreen] = useState<Screen>(() => initial.screen)
  const [phoneApp, setPhoneApp] = useState<PhoneApp>('home')
  const [scrollResetRequest, setScrollResetRequest] = useState(0)
  useEffect(() => {
    if (scrollResetRequest) window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
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
  const [trashGame, setTrashGame] = useState<{ items: TrashItem[]; startedAt: number; found: number; before: ResultSnapshot } | null>(null)
  const trashDrag = useRef<{ id: number; offsetX: number; offsetY: number; startX: number; startY: number; moved: boolean } | null>(null)
  const eventModalRef = useRef<HTMLElement>(null)
  const eventSession = useEventSession(initial, game)
  const { firstNightEvents, leftHome, encounters, openingSearchObservation,
    ambientEventClock, activeEvent, setActiveEvent, diceCheck, setDiceCheck, resetEventSession } = eventSession
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
    { id: 'morning' as const, title: 'Get through the morning', description: `Stay alive until Day ${displayDay(2)}, 12:00.` },
    { id: 'shelter' as const, title: 'Find a safe place to sleep', description: activeGoal ? `Be at Night Shelter on Day ${displayDay(activeGoal.day)} at ${formatTime(activeGoal.minute)} for registration. A bed is not guaranteed.` : 'Register for a shelter bed or move into Schronisko.' },
    { id: 'support' as const, title: 'Visit social support', description: 'Visit Help Center during opening hours.' },
    { id: 'work' as const, title: 'Look for work', description: 'Search online for work or visit Job Centre or Day Work while open.' },
  ], [activeGoal])
  const firstNight = firstNightTime(game) && life.housing === 'Street'
  const openingCallsActive = firstNight && openingCallIndex < OPENING_CALLS.length
  const nextOpeningCall = openingCallsActive ? OPENING_CALLS[openingCallIndex] : undefined
  const completedGoals = useMemo(() => goals.filter(goal => journalGoals[goal.id]), [goals, journalGoals])
  const pendingGoals = useMemo(() => goals.filter(goal => !journalGoals[goal.id])
    .sort((a, b) => Number(!!activeGoal && b.id === 'shelter') - Number(!!activeGoal && a.id === 'shelter')), [goals, journalGoals, activeGoal])
  useEffect(() => {
    setJournalGoals(previous => {
      const next = {
        morning: previous.morning || (game.health > 0 && (game.day > 2 || (game.day === 2 && game.minutes >= 720))),
        shelter: previous.shelter || life.housing === 'Schronisko' || (life.shelterUntilDay ?? 0) >= game.day,
        support: previous.support || life.schroniskoReferral === true || (current.id === 'support' && open && !trip),
        work: previous.work || life.employment === 'Day work' || ((current.id === 'jobcenter' || current.id === 'work') && open && !trip),
      }
      return goals.every(goal => previous[goal.id] === next[goal.id]) ? previous : next
    })
  }, [game.day, game.minutes, game.health, life.housing, life.shelterUntilDay, life.schroniskoReferral, life.employment, current.id, open, trip])
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
  useEffect(() => { if (travelVisible) travelModalRef.current?.focus({ preventScroll: true }) }, [travelVisible])
  const phoneSearchVisible = !!phoneActivity && !(activeEvent || diceCheck || pendingResult || infoModal || rainChoice || rainWaiting || gameOver || closingNotice)
  const streetEventVisible = !!activeEvent && !diceCheck && !sleeping && !infoModal && !pendingResult && !gameOver
  const visibleEventChoices = activeEvent?.choices.filter(choice => !choice.undiscoveredLocationRequired || !discoveredLocations.includes(choice.undiscoveredLocationRequired)) ?? []
  const { respondToRain, findProperShelter, continueInRain } = useRainScheduling({ game, gameOver, currentExposure, sleeping: !!sleeping, currentId: current.id }, setGame, setRainChoice)
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
  const eventInteractionBlocked = inventoryDialogOpen || !!activeEvent || !!diceCheck || rainWaiting || (rainChoice && !infoModal && !pendingResult) || eventResultOpen || !!infoModal || !!pendingResult || !!closingNotice
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
  const navigationOn = mobileServiceActive && !phoneUnavailable && !sleeping && !gameOver
  const dayWorkEnergyRequired = 55
  const storageCapacity = current.id === 'residential-shelter' ? SCHRONISKO_STORAGE : NIGHT_SHELTER_STORAGE
  const usedStorageSlots = storageSlots(storage)

  const laundryCleanAt = useRef(-1)
  const clothingHygieneCap = (cleanliness: number) => cleanliness >= 70 ? 100 : cleanliness >= 40 ? 80 : 60
  const hygieneLimit = clothingHygieneCap(inventory.clothingCleanliness)
  const statusNeeds = [
    { id: 'hunger', label: 'Food', value: game.hunger, icon: 'food' as IconName },
    { id: 'thirst', label: 'Thirst', value: game.thirst, icon: 'water' as IconName },
    { id: 'energy', label: 'Energy', value: game.energy, icon: 'energy' as IconName, cap: energyCap(game.health) },
    { id: 'health', label: 'Health', value: game.health, icon: 'heart' as IconName },
    { id: 'hygiene', label: 'Hygiene', value: game.hygiene, icon: 'shower' as IconName, cap: hygieneLimit },
    { id: 'mood', label: 'Mood', value: game.mood, icon: `face-${conditionBand(game.mood).level}` as IconName, cap: moodCeiling.cap, capReason: moodCeiling.reasons.join(', ') },
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

  const encounterQueue = createEncounterQueue(eventSession, { game, life, inventory, weather, trip: !!trip, infoModal: !!infoModal, currentId: current.id, firstNight })
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
  const { requestSleep, chosenSleepMinutes, wakeLabel, sleep, finishSleep, tickSleep, finishRestAction } = sleepController

  const { checkUnavailableReason, resolveStreetEvent, rollDice, acceptDiceResult, stealItem } = createEventController(eventSession, {
    game, inventory, storage, life, discoveredLocations, phoneUnavailable, shelterBooked, currentId: current.id, open,
  }, {
    setGame, setInventory, setMessage, setInfoModal, setEventResultOpen, setDiscoveredLocations, setActiveGoal,
    openPage, resultSnapshot, runWithResult, applyAction, startFareDodgeTrip: (id, outcome) => startFareDodgeTrip(id, outcome),
  })

  function runWithResult(title: string, action: () => void, before = resultSnapshot(), includeTime = true, always = false, consumedItems: ConsumedItem[] = []) {
    if (sleepChoice && title !== 'Start sleeping') return
    if (shelterQueue && title !== 'Shelter registration') return
    if (shelterDeparture && title !== 'Shelter checkout') return
    if (shelterCheckoutDue && !activeEvent && !diceCheck && !shelterInterview && title !== 'Sleep complete' && title !== 'Search interrupted') return
    action()
    setPendingResult({ title, before, includeTime, always, consumedItems })
  }

  // Resolve from the current render only after runWithResult accepts the action.
  // Never resolve random food outcomes inside a state updater or an effect.
  function executeInventoryCommand(command: InventoryCommand) {
    const perform = () => {
      const changes = resolveInventoryCommand({ game, inventory, storage, effects, locationId: current.id, open, insideNightShelter }, command)
      if (changes.inventory) setInventory(changes.inventory)
      if (changes.storage) setStorage(changes.storage)
      if (changes.effects) setEffects(changes.effects)
      if (changes.game) setGame(changes.game)
      const action = changes.action
      if (action) setGame(previous => applyAction(previous, action))
      if (changes.message !== undefined) setMessage(changes.message)
      if (changes.info) setInfoModal(changes.info)
    }
    const result = inventoryCommandResult(command)
    if (result) runWithResult(result.title, perform, resultSnapshot(), true, result.always ?? false, result.consumedItems ?? [])
    else perform()
  }

  function returnBottles() { executeInventoryCommand({ type: 'return-bottles' }) }
  function storeItem(item: 'documents' | 'medicines' | 'cigarettes') { executeInventoryCommand({ type: 'store', item }) }
  function takeStoredItem(item: 'documents' | 'medicines' | 'cigarettes') { executeInventoryCommand({ type: 'take', item }) }
  function storeFood() { executeInventoryCommand({ type: 'store-food' }) }
  function takeStoredFood() { executeInventoryCommand({ type: 'take-food' }) }
  function buyItem(item: ShopItem) { executeInventoryCommand({ type: 'buy', item }) }
  function useSupply(item: 'bread' | 'cannedFood' | 'readyMeal' | 'wipes', slotIndex = 0, condition?: FoodCondition) { executeInventoryCommand({ type: 'use', item, slotIndex, condition }) }
  function useMedicine() { executeInventoryCommand({ type: 'medicine' }) }
  function smokeCigarette() { executeInventoryCommand({ type: 'smoke' }) }
  function useItem(item: 'water' | 'food', slotIndex = 0, condition?: FoodCondition) { executeInventoryCommand({ type: 'use', item, slotIndex, condition }) }

  useEffect(() => {
    if (!pendingResult || inventoryAgedAt !== absoluteMinutes(game) || game.hygiene > hygieneLimit || game.mood > moodCeiling.cap) return
    setPendingResult(null)
    if (sleeping || sleepChoice || shelterQueue || shelterDeparture || trashGame || shelterInterview || diceCheck) return
    const summary = summarizeResult(pendingResult.before, resultSnapshot(), pendingResult.includeTime, pendingResult.consumedItems)
    if (!pendingResult.always && summary.costs.length === 0 && summary.changes.length === 0 && !infoModal) return
    const memories = [
      { id: 'office-routine', titles: ['Walk through the city'], text: 'In your late thirties, you had a steady office job and a desk by the window. Then came the redundancy notice.' },
      { id: 'redundancy-savings', titles: ['Rest on the bench', 'Sit and recover', 'Shelter from the rain'], text: 'After the redundancy, you expected to find another job in a few weeks. As the search dragged on, rent and ordinary expenses used up what you had put aside.' },
      { id: 'unanswered-applications', titles: ['Where can I get help in the morning?'], text: 'Your last job application still has no reply. The redundancy email is still in your inbox.' },
      { id: 'lost-home', titles: ['How can I get a shelter bed?'], text: 'Until recently, you were looking for a place to live. Tonight, you need somewhere just until morning.' },
    ]
    const memory = memories.find(fragment => fragment.titles.includes(pendingResult.title) && !seenMemories.includes(fragment.id))
    const resultText = (infoModal?.text ?? message) + (memory ? `\n\n${memory.text}` : '')
    if (memory) setSeenMemories(previous => [...new Set([...previous, memory.id])])
    if (lastRecordedResult.current !== pendingResult) {
      lastRecordedResult.current = pendingResult
      const actionTitle = pendingResult.title
      const reflection = journalReflection(infoModal?.title ?? actionTitle, resultText, summary, memory?.id)
      const entry: JournalEntry = { day: game.day, minute: game.minutes, actionTitle, reflection: true, ...reflection }
      setJournalEntries(previous => [...previous, entry].slice(-500))
    }
    setInfoModal(previous => ({ ...previous, title: previous?.title ?? pendingResult.title, text: resultText, reflection: memory?.text, ...summary }))
  }, [pendingResult, game, inventory, effects, sleeping, sleepChoice, trashGame, shelterInterview, shelterQueue, shelterDeparture, diceCheck, message, inventoryAgedAt])

  useRainResults({ game, effects, blocked: !!(gameOver || activeEvent || diceCheck || infoModal || pendingResult || sleeping || sleepChoice || shelterInterview || shelterQueue || shelterDeparture || closingNotice || inventoryDialogOpen || trashGame || trip?.remaining === 0 || phoneActivity?.remaining === 0) }, {
    setGame, setEffects, setInfoModal, setEventResultOpen, setJournalEntries, resultSnapshot,
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
    setJournalEntries(entries => [...entries, { day: game.day, minute: game.minutes, title: 'Back on the street', reflection: true as const, actionTitle: 'Closing time', text: `${current.name} closed. You stepped outside onto the street.` }].slice(-500))
  }, [game.day, game.minutes, current, !!trip, gameOver])

  function hospitalVisit(...args: Parameters<typeof hospitalVisitImpl>) { runWithResult('Medical appointment', () => hospitalVisitImpl(...args)) }
  function callAmbulance(...args: Parameters<typeof callAmbulanceImpl>) { runWithResult('Emergency care', () => callAmbulanceImpl(...args)) }
  function askForMoney(...args: Parameters<typeof askForMoneyImpl>) { runWithResult('Ask for money', () => askForMoneyImpl(...args)) }
  function finishTrashSearch(...args: Parameters<typeof finishTrashSearchImpl>) { runWithResult('Trash search results', () => finishTrashSearchImpl(...args), trashGame?.before ?? resultSnapshot()) }
  function streetAction(...args: Parameters<typeof streetActionImpl>) { runWithResult(args[0] === 'find-bench' ? 'Is there a bench nearby? My legs could use a break.' : 'Rest on the bench', () => streetActionImpl(...args)) }
  function act(...args: Parameters<typeof actImpl>) { runWithResult(actions.find(action => action.id === args[0])?.name ?? 'Action complete', () => actImpl(...args), resultSnapshot(), true, false, ['shelter-shower', 'daycenter-shower'].includes(args[0]) ? ['showerGel'] : []) }
  function socialSupport(...args: Parameters<typeof socialSupportImpl>) { runWithResult('Social support', () => socialSupportImpl(...args)) }
  function takeDayWork(...args: Parameters<typeof takeDayWorkImpl>) { runWithResult('Day work', () => takeDayWorkImpl(...args)) }

  useShelterProcesses(shelterSession, shelterController, { game, life, current, trip: !!trip, shelterBooked, shelterDepartureRemaining, gameOver }, setLife)
  useEffect(() => {
    const now = absoluteMinutes(game)
    setEffects((prev) => { const next = prev.filter((effect) => effect.expiresAt > now); return next.length === prev.length ? prev : next })
  }, [game.day, game.minutes])
  useShelterAttendance(game, life, setLife, setMessage)

  useForcedSleep(sleepSession, game, !!(locationIsClosing || closingNotice || inventoryDialogOpen || phoneActivity || rainChoice || gameOver || activeEvent || diceCheck || shelterInterview || shelterQueue || shelterCheckoutDue || shelterDeparture || trip || infoModal || pendingResult), sleepController)

  const tickGameClock = useLatestAction(() => {
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
    const tickMinutes = trip ? Math.min(1, trip.remaining) : 1
    if (shelterQueue) tickShelterQueue(tickMinutes)
    setGame(prev => applyAction(prev, { minutes: tickMinutes }))
    if (!underRainCover) setTrip(active => advanceTrip(active, tickMinutes))
    if (!trip && !shelterQueue && !shelterDeparture) observeIdle(tickMinutes, () => applyAction(game, { minutes: tickMinutes }))
  })
  const gameClockInterval = trip || shelterDeparture || phoneActivity || rainWaiting ? ACTIVITY_TICK_MS : 1000
  useEffect(() => {
    const timer = window.setInterval(tickGameClock, gameClockInterval)
    return () => window.clearInterval(timer)
  }, [tickGameClock, gameClockInterval])

  const { chooseDestination, confirmStreetExit, attemptFareDodge, startTravel, startFareDodgeTrip } = useTravelController(eventSession, encounterQueue, {
    game, trip, selectedDestination, streetExitPending, blocked: !!(sleepChoice || shelterQueue || shelterDeparture || shelterCheckoutDue),
    freeTransitActive, shelterPhoneCharging, shelterBooked, shelterNightDay,
  }, {
    setGame, setTrip, setSelectedDestination, setStreetExitPending, setStreetBenchFound, setShelterArrival, setLife, setScreen,
    setMessage, openPage, recordShelterDeparture, resultSnapshot, runWithResult, applyAction,
  })

  useEncounterObservers(encounterQueue, eventSession, { game, currentId: current.id, firstNight,
    blocked: !!(eventInteractionBlocked || sleeping || sleepChoice || trip || phoneActivity || trashGame || shelterQueue || shelterDeparture || shelterInterview || gameOver),
  })

  useEffect(() => {
    if (!sleepChoice) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSleepChoice(null) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [sleepChoice])

  useSleepCompletion(sleepSession, game, sleepController)

  function hospitalVisitImpl() {
    if (activeEvent || current.id !== 'hospital') return
    if (!open) { setMessage('Regular medical care is closed.'); return }
    if (!inventory.documents) { setMessage('You need your documents for a regular medical appointment.'); return }
    setGame((prev) => {
      const afterTime = applyAction(prev, { minutes: 90, mood: 3 })
      return { ...afterTime, health: Math.max(afterTime.health, 65) }
    })
    setEffects((active) => active.filter((effect) => effect.id !== 'cold'))
    setMessage('A doctor examines you and treats what they can. Your condition is brought back to a stable level.')
  }

  function callAmbulanceImpl() {
    if (activeEvent) return
    if (shelterPhoneCharging) { setMessage('Collect your phone from the charger first.'); return }
    if (game.health > 20) { setMessage('An ambulance is only available as a gameplay emergency option at Health 20 or lower.'); return }
    if (inventory.phoneBattery <= 0 || inventory.phoneCondition <= 0) { setMessage('Your phone is not working, so you cannot call an ambulance.'); return }
    const hours = 4 + Math.floor(Math.random() * 5)
    setInventory((prev) => ({ ...prev, phoneBattery: Math.max(0, prev.phoneBattery - 2 * phoneDrainMultiplier(prev.phoneCondition)) }))
    setGame((prev) => {
      const afterTime = applyAction(prev, { minutes: hours * 60, energy: -15, mood: -5 })
      return { ...afterTime, health: Math.max(afterTime.health, 35), locationId: 'hospital' }
    })
    setSelectedDestination(null)
    setTrip(null)
    setScreen('location')
    setMessage(`You call an ambulance. Emergency staff stabilize you without requiring documents. About ${hours} hours pass and your Health is stabilized to 35.`)
  }

  function askForMoneyImpl() {
    if (activeEvent || current.id !== 'street') return
    const attemptsToday = begging.day === game.day ? begging.attempts : 0
    if (attemptsToday >= 3) {
      setMessage('You have already asked around enough today. People in this area have stopped responding.')
      return
    }
    setBegging({ day: game.day, attempts: attemptsToday + 1 })
    const roll = Math.random()
    const earned = roll < 0.35 ? 0 : roll < 0.65 ? 1 : roll < 0.85 ? 2 : roll < 0.96 ? 3 : 5
    setGame((prev) => applyAction(prev, { minutes: 45, money: earned, energy: -2, mood: earned > 0 ? 1 : -3 }))
    setMessage(earned > 0 ? `You spend 45 minutes asking passers-by for help and collect ${earned.toFixed(2)} zł in small change.` : 'You spend 45 minutes asking passers-by for help. Nobody gives you anything.')
  }

  function searchStreetBottles() {
    if (activeEvent || current.id !== 'street' || trashGame) return
    const clutter: TrashArt[] = ['paper', 'cup', 'tray', 'wrapper']
    const layers = 6
    const perLayer = 3
    const count = layers * perLayer
    const bottleCount = 2 + Math.floor(Math.random() * 5)
    const shuffled = Array.from({ length: count }, (_, id) => id)
    for (let index = count - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1))
      ;[shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]]
    }
    const bottleIndexes = new Set(shuffled.slice(0, bottleCount))
    const items: TrashItem[] = Array.from({ length: count }, (_, id) => {
      const bottle = bottleIndexes.has(id)
      const layer = Math.floor(id / perLayer)
      const slot = id % perLayer
      const base = [
        { x: 22, y: 32 },
        { x: 70, y: 28 },
        { x: 48, y: 68 },
      ][slot]
      const appearance = Math.random()
      const can = bottle && appearance < .35
      const returnable = bottle && Math.random() < (can ? .78 : .65)
      const art: TrashArt = bottle ? can ? returnable ? 'can' : 'can-crushed' : returnable ? 'plastic' : 'plastic-crushed' : clutter[Math.floor(appearance * clutter.length)]
      return {
        id,
        layer,
        art,
        x: base.x + (Math.random() * 14 - 7),
        y: base.y + (Math.random() * 14 - 7),
        rotation: Math.random() * 360,
        scale: TRASH_ITEM_SCALE[art] + Math.random() * .2,
        bottle,
        returnable,
      }
    })
    setTrashGame({ items, startedAt: Date.now(), before: resultSnapshot(), found: 0 })
  }

  function startTrashDrag(id: number, clientX: number, clientY: number, bounds: DOMRect) {
    const item = trashGame?.items.find((entry) => entry.id === id)
    if (!item || item.collected || !trashGame) return false
    const pointerX = ((clientX - bounds.left) / bounds.width) * 100
    const pointerY = ((clientY - bounds.top) / bounds.height) * 100
    trashDrag.current = { id, offsetX: pointerX - item.x, offsetY: pointerY - item.y, startX: clientX, startY: clientY, moved: false }
    return true
  }

  function moveTrashItem(id: number, clientX: number, clientY: number, bounds: DOMRect) {
    const drag = trashDrag.current
    if (!drag || drag.id !== id) return
    if (!drag.moved && Math.hypot(clientX - drag.startX, clientY - drag.startY) < 5) return
    const pointerX = ((clientX - bounds.left) / bounds.width) * 100
    const pointerY = ((clientY - bounds.top) / bounds.height) * 100
    const nextX = Math.max(-30, Math.min(110, pointerX - drag.offsetX))
    const nextY = Math.max(-30, Math.min(110, pointerY - drag.offsetY))
    drag.moved = true
    const draggedItem = trashGame?.items.find((entry) => entry.id === id)
    const halfWidth = 18 * (draggedItem?.scale ?? 1) / bounds.width * 100
    const halfHeight = 20 * (draggedItem?.scale ?? 1) / bounds.height * 100
    // Rectangular field: clear only the dragged item as it reaches an edge,
    // and discard rubbish once roughly a quarter has crossed that edge.
    const cleared = nextX - halfWidth < 0 || nextX + halfWidth > 100 || nextY - halfHeight < 0 || nextY + halfHeight > 100
    const outside = nextX - halfWidth * .5 < 0 || nextX + halfWidth * .5 > 100 || nextY - halfHeight * .5 < 0 || nextY + halfHeight * .5 > 100
    setTrashGame((active) => active ? { ...active, items: active.items.map((item) => item.id === id ? {
      ...item,
      x: nextX,
      y: nextY,
      cleared: item.cleared || cleared,
      collected: !item.returnable && outside ? true : item.collected,
    } : item) } : null)
  }

  function collectTrashBottle(id: number) {
    if (!trashGame) return
    const item = trashGame.items.find((entry) => entry.id === id)
    if (!item || !item.returnable || item.collected) return
    const currentBottleSlots = inventory.bottles > 0 ? Math.ceil(inventory.bottles / BOTTLE_STACK_SIZE) : 0
    const otherSlots = backpackSlots(inventory) - currentBottleSlots
    const bottleCapacity = Math.max(0, BACKPACK_CAPACITY - otherSlots) * BOTTLE_STACK_SIZE
    if (inventory.bottles >= bottleCapacity) { setMessage('Your backpack has no room for another container.'); return }
    setInventory((prev) => ({ ...prev, bottles: prev.bottles + 1 }))
    setTrashGame((active) => active ? { ...active, found: active.found + 1, items: active.items.map((entry) => entry.id === id ? { ...entry, collected: true } : entry) } : null)
  }

  function finishTrashSearchImpl() {
    if (!trashGame) return
    const minutes = trashSearchMinutes(trashGame.startedAt)
    const { found } = trashGame
    setGame((prev) => applyAction(prev, { minutes, energy: -Math.max(1, minutes / 15), hygiene: -Math.max(2, minutes / 5), mood: found > 0 ? 1 : -2 }))
    setTrashGame(null)
    const text = found > 0 ? `You searched the trash for ${minutes} minutes and kept ${found} returnable container${found === 1 ? '' : 's'}.` : `You searched for ${minutes} minutes and found nothing useful.`
    setMessage(text)
    setInfoModal({ title: 'Trash search results', text, bottleSearch: { found } })
  }

  const checkTrashDeadline = useLatestAction(() => {
    if (trashGame && Date.now() - trashGame.startedAt >= 60_000) finishTrashSearch()
  })

  const walkMusicCost = 2 * phoneDrainMultiplier(inventory.phoneCondition)
  const canWalkWithMusic = !musicWalkUsed && mobileServiceActive && inventory.phoneCondition > 0 && inventory.phoneBattery >= walkMusicCost
  function walkCity(withMusic = false) {
    if (current.id !== 'street' || sleeping || trip || activeEvent || infoModal) return
    if (withMusic && !canWalkWithMusic) return
    // The authored music walk has one +3 reward, rather than stacked walking/music bonuses.
    const passiveMusic = !withMusic && musicOn
    const musicText = 'You listen to your favorite songs as you walk. You feel a little better.'
    const musicIllustration = '/street-life-game/assets/event-music-walk.webp'
    runWithResult(withMusic ? 'Walk with music' : 'Walk through the city', () => {
      if (withMusic) setMusicWalkUsed(true)
      setRainChoice(false)
      let next = applyGameAction(game, { minutes: 15, energy: -1 }, { ...moodContext(), walking: true, music: passiveMusic })
      next = applyGameAction(next, { minutes: 15, energy: -1, mood: withMusic ? 0 : 2 }, { ...moodContext(next), walking: true, music: passiveMusic })
      if (withMusic) next.mood = Math.min(moodLimit(next, moodContext(next)).cap, next.mood + 3)
      setInventory(previous => ({ ...previous, phoneBattery: Math.max(0, previous.phoneBattery - (withMusic && !musicOn ? walkMusicCost : 0)), clothingCleanliness: Math.max(0, previous.clothingCleanliness - 30 * (10 / 1440)) }))
      setGame(next)
        setMessage(withMusic ? musicText : 'You pass lit windows and closed shops. At the next crossing, the signal changes for an empty road. Half an hour has passed. You are still outside.')
        if (withMusic) setInfoModal({ title: 'Walk with music', text: musicText, illustration: musicIllustration, illustrationAlt: 'You walk through the neighbourhood wearing full-size over-ear headphones.', batteryInSummary: true })
        if (!observeFirstNight('walk', next)) observeOrdinaryEvent('travel', next, 'walk')
    }, resultSnapshot(), true, true)
  }

  // Street offers one phone entry; all individual searches live in Find Help.
  const exhausted = game.energy <= 40
  const lastAction = journalEntries.at(-1)?.actionTitle
  const justWalked = lastAction === 'Walk through the city' || lastAction === 'Walk with music'
  const wantsBench = answeredQuestions.includes('bed') && !exhausted && lastAction !== 'Rest on the bench' && !justWalked
  const bodyChoices = exhausted ? ['bench-sleep', 'street-sleep', 'bench-rest', 'find-bench']
    : openingCallsActive ? ['music-walk', 'walk']
    : wantsBench ? [firstNight || (game.minutes >= 360 && game.minutes < 1380) ? 'bench-rest' : 'bench-sleep', 'find-bench', 'walk', 'street-sleep']
    : (game.minutes >= 1380 || game.minutes < 360) && !justWalked ? ['street-sleep', 'bench-sleep', 'walk']
    : game.mood <= 30 ? ['music-walk', 'walk'] : ['walk', 'music-walk']
  const practicalChoices = shelterBooked ? ['shelter-route', 'station-route']
    : firstNight || !discoveredLocations.includes('work') ? ['station-route']
    : game.money < 50 ? ['beg', 'bottles', 'station-route']
    : ['bottles', 'station-route', 'work-route']
  const streetChoiceGroups = [
    [openingCallsActive ? 'phone-call' : 'phone-help'],
    bodyChoices,
    ...(openingCallsActive ? [] : [practicalChoices]),
  ]
  const lastDecision = journalEntries.at(-1)
  const choiceDecisionKey = JSON.stringify([journalEntries.length, lastDecision?.day, lastDecision?.minute, lastDecision?.actionTitle])

  function streetActionImpl(kind: 'find-bench' | 'bench-rest' | 'bench-sleep') {
    if (activeEvent || current.id !== 'street') return
    if (kind === 'find-bench') {
      const found = Math.random() < 0.7
      setGame((prev) => applyGameAction(prev, { minutes: 20, energy: -2, mood: found ? 1 : -2 }, { ...moodContext(prev), exposure: 'outside', music: musicOn }))
      setStreetBenchFound(found)
      setMessage(found ? 'You found a usable bench nearby.' : 'You looked around, but every decent place to sit is occupied or unusable.')
      return
    }
    if (!streetBenchFound) return
    if (kind === 'bench-rest') {
      const next = applyGameAction(game, { minutes: 45, energy: 18, mood: 2 }, { ...moodContext(), exposure: 'outside', music: musicOn })
      setGame(next)
      setMessage('You sit on the bench and get off your feet for a while.')
      if (!observeFirstNight('bench', next)) observeOrdinaryEvent('location', next, undefined, { observation: 'action', elapsedMinutes: 45 })
      return
    }
    requestSleep('bench')
  }

  function actionUnavailableReason(action: (typeof actions)[number]) {
    return locationActionUnavailable(action, { game, inventory, life, current, open, shelterBooked, shelterAdmitted })
  }

  function actImpl(actionId: string) {
    const action = actions.find((x) => x.id === actionId)
    if (!action || action.locationId !== current.id || activeEvent || shelterQueue) return
    const unavailable = actionUnavailableReason(action)
    if (unavailable) { setMessage(unavailable); return }
    if (actionId === 'shelter-social-worker') { beginShelterInterview(); return }
    if (!open && action.requiresOpen !== false) { setMessage(`${current.name} is closed. Come back during opening hours.`); return }
    if (current.id === 'shelter' && (game.minutes >= 1320 || game.minutes < 360) && actionId !== 'shelter-rest') {
      setMessage('Quiet hours are 22:00–06:00. Only sleeping is allowed right now.')
      return
    }
    if (action.cost && game.money < action.cost) { setMessage(`You need ${action.cost.toFixed(2)} zł for that.`); return }
    if (actionId.endsWith('-refill-water')) {
      const added = FREE_WATER_LIMIT - inventory.water
      setInventory(previous => ({ ...previous, water: Math.max(previous.water, FREE_WATER_LIMIT) }))
      setGame(previous => applyAction(previous, { minutes: action.minutes }))
      setMessage(`You refilled your water for free. Backpack: ${FREE_WATER_LIMIT} portions (+${added}).`)
      return
    }
    if ((current.id === 'daycenter' || current.id === 'free-clinic') && actionId.startsWith('daycenter-')) {
      const hour = game.minutes / 60
      const chance = hour < 10 ? 0.9 : hour < 12 ? 0.75 : hour < 14 ? 0.55 : 0.35
      if (Math.random() > chance) {
        setGame((prev) => applyAction(prev, { minutes: 15, mood: -2 }))
        setMessage(current.id === 'free-clinic' ? 'The free clinic is full right now. You wait for a while, but no appointment opens up.' : 'The day center is full right now. You wait for a while, but no place opens up.')
        return
      }
    }

    if (actionId === 'street-sleep') { requestSleep('ground'); return }
    if (actionId === 'station-sleep') { requestSleep('bench'); return }
    if (prepareShelterAction(actionId)) return
    if (actionId === 'residential-sleep') { requestSleep('residential'); return }

    const isShower = actionId === 'shelter-shower' || actionId === 'daycenter-shower'
    const useGel = isShower && inventory.showerGel > 0
    const baseResult = action.resolve(game)
    const result = useGel ? { ...baseResult, hygiene: (baseResult.hygiene ?? 0) * 1.5, hygieneCap: 100,
      message: 'You showered with 3-in-1 gel. Hygiene gain ×1.5, up to 100. One use spent.' } : baseResult
    if (useGel) setInventory(prev => ({ ...prev, showerGel: prev.showerGel - 1 }))
    const washedClothes = actionId === 'daycenter-laundry' || actionId === 'shelter-laundry-pickup'
    const next = actionId === 'residential-stay' ? applyGameAction(game, result, moodContext(game, 'Schronisko')) : applyAction(game, result)
    if (washedClothes) {
      next.wetness = 0
      laundryCleanAt.current = absoluteMinutes(next)
      setInventory(prev => ({ ...prev, clothingCleanliness: 100 }))
    } else {
      const endCleanliness = Math.max(0, inventory.clothingCleanliness - result.minutes * (20 / 1440))
      next.hygiene = Math.min(next.hygiene, clothingHygieneCap(endCleanliness))
    }
    setGame(next, actionId === 'residential-stay' ? 'Schronisko' : undefined)
    setMessage((result.message ?? 'Time passes.') + (isShower && hygieneLimit < 100 ? ` Dirty clothes limit Hygiene to ${hygieneLimit}. Wash your clothes to raise the limit.` : ''))

    if (!finishRestAction(actionId, action.name, result, next)) {
      if (!observeFirstNight('location', next)) observeOrdinaryEvent('location', next, undefined, { observation: 'action', elapsedMinutes: result.minutes })
    }
    if (actionId === 'residential-stay') setLife((status) => ({ ...status, housing: 'Schronisko', housingUntil: undefined }))
    if (actionId === 'shop-meal') {
      const expiresAt = absoluteMinutes(next) + 240
      setEffects((active) => [...active.filter((effect) => effect.id !== 'well-fed'), { id: 'well-fed', expiresAt }])
    }
    finishLocationPhoneCharge(actionId)
    if (actionId === 'daycenter-doctor') {
      setEffects((active) => active.filter((effect) => effect.id !== 'cold'))
    }
  }

  function socialSupportImpl(kind: 'housing' | 'documents' | 'transport' | 'benefits') {
    if (!open || current.id !== 'support') return
    if ((kind === 'transport' || kind === 'benefits') && !inventory.documents) {
      setMessage(storage.documents ? 'Your documents are stored at the shelter. Take them with you for this application.' : 'You need basic documents for this application. Ask for help restoring them first.')
      return
    }
    if (kind === 'housing') {
      setDiscoveredLocations(prev => prev.includes('residential-shelter') ? prev : [...prev, 'residential-shelter'])
      if (life.schroniskoReferral) {
        setMessage('You already have a referral to Schronisko. It is available on the map.')
        return
      }
      setGame((prev) => applyAction(prev, { minutes: 35, mood: 3 }))
      setLife((status) => ({ ...status, schroniskoReferral: true }))
      setMessage('The social worker issued a referral. Schronisko 24/7 is now available on the map.')
      return
    }
    if (kind === 'documents') {
      if (inventory.documents) {
        setMessage('Your basic documents are currently complete.')
        return
      }
      setGame((prev) => applyAction(prev, { minutes: 60, mood: 3 }))
      setInventory((prev) => ({ ...prev, documents: true }))
      setMessage('The social worker helped you restore your basic documents.')
      return
    }
    if (kind === 'transport') {
      const expiresAt = absoluteMinutes(game) + 3 * 1440
      setGame((prev) => applyAction(prev, { minutes: 25 }))
      setEffects((active) => [...active.filter((effect) => effect.id !== 'free-transit'), { id: 'free-transit', expiresAt }])
      setMessage('You received free public transport for 3 days.')
      return
    }
    setGame((prev) => applyAction(prev, { minutes: 30, mood: 2 }))
    setMessage('The social worker explained which benefits may be available. Applications will be added as the progression expands.')
  }

  function takeDayWorkImpl() {
    if (!open || current.id !== 'work') return
    if (game.energy < dayWorkEnergyRequired) { setMessage(`You need at least ${dayWorkEnergyRequired} Energy to start this shift.`); return }
    setGame((prev) => {
      const weather = weatherAt(prev)
      const temperature = temperatureAt(weather.temp, prev.minutes + 90)
      const heatMultiplier = temperature >= 25 ? 1.5 : temperature >= 18 ? 1.2 : 1
      return applyAction(prev, {
        minutes: 180,
        money: 35,
        hunger: -10 * heatMultiplier,
        thirst: -14 * heatMultiplier,
        energy: -5,
        hygiene: -8 * heatMultiplier,
        mood: 3,
      })
    })
    setLife((status) => ({ ...status, employment: 'Day work', income: 'Irregular' }))
    setMessage('You completed a 3-hour physical shift. +35 zł. Physical work increases hunger, thirst and hygiene loss, especially in warm weather.')
  }

  function reset() {
    autosave.resetPending()
    setChoiceSeed(newChoiceSeed())
    localStorage.removeItem(SAVE_KEY)
    localStorage.removeItem(DISCOVERY_KEY)
    localStorage.removeItem(SAVE_KEYS.discoveryVersion)
    setDiscoveredLocations(['street', 'station', 'shop'])
    setActiveGoal(null)
    setJournalGoals({ morning: false, shelter: false, support: false, work: false })
    setJournalEntries([])
    setMusicWalkUsed(false)
    localStorage.removeItem(MUSIC_WALK_USED_KEY)
    setSelectedJournalDay(null)
    setPhoneApp('home')
    lastRecordedResult.current = null
    localStorage.removeItem(JOURNAL_HISTORY_KEY)
    localStorage.removeItem(JOURNAL_GOALS_KEY)
    localStorage.removeItem(GOAL_KEY)
    setGame(createInitialState())
    setMessage('New run started.')
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
    setShelterPhoneCharging(false)
    localStorage.removeItem(SHELTER_PHONE_CHARGE_KEY)
    setActiveEvent(null)
    resetEventSession()
    localStorage.removeItem(LEFT_HOME_KEY)
    localStorage.removeItem(FIRST_NIGHT_EVENTS_KEY)
    localStorage.removeItem(ENCOUNTERS_KEY)
    setDiceCheck(null)
    laundryCleanAt.current = -1
    groundSleepWindow.current = null
    setInventory(INITIAL_INVENTORY)
    setStorage(INITIAL_STORAGE)
    setLife(INITIAL_LIFE)
    setEffects([])
    resetSleepSession()
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

  function discoverLocation(id: string, label: string) {
    setDiscoveredLocations((prev) => prev.includes(id) ? prev : [...prev, id])
    setMessage(`${label} added to your map.`)
    openPage('map')
  }

  const autosave = useGameAutosave({
    [SAVE_KEY]: game,
    [CHOICE_SEED_KEY]: choiceSeed,
    [DISCOVERY_KEY]: discoveredLocations,
    [SAVE_KEYS.discoveryVersion]: 2,
    [GOAL_KEY]: activeGoal,
    [JOURNAL_GOALS_KEY]: journalGoals,
    [JOURNAL_HISTORY_KEY]: journalEntries,
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
    [SAVE_KEYS.screen]: screen === 'travel' ? undefined : screen,
    [SAVE_KEYS.mobileServiceUntil]: mobileServiceUntil,
    [SAVE_KEYS.mobileAutoRenew]: mobileAutoRenew,
    [SAVE_KEYS.mobileRenewedDay]: mobileRenewedDay,
    [SAVE_KEYS.trip]: trip,
    [SAVE_KEYS.sleep]: sleeping,
    [SAVE_KEYS.shelterQueue]: shelterQueue,
    [SHELTER_ARRIVAL_KEY]: shelterArrival,
    [SAVE_KEYS.shelterDeparture]: shelterDeparture,
  }, inventoryAgedAt === absoluteMinutes(game) && game.hygiene <= hygieneLimit && !pendingResult, [
    discoveredLocations, activeGoal, journalGoals, journalEntries, musicWalkUsed, answeredQuestions, seenMemories, firstNightEvents, leftHome, encounters, choiceSeed,
    rainChoice, screen, life, effects, begging, mobileServiceUntil, mobileAutoRenew, mobileRenewedDay,
    game.day, gameOver, !!trip, !!sleeping, !!shelterQueue, !!shelterDeparture, shelterArrival,
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
    {streetExitPending && <InventoryDialog icon="exit" label="TIME PAUSED" title={`Leave ${current.name}?`} onCancel={cancelStreetExit}>
      <div className="sleep-choice-buttons"><ModalAction variant="secondary" type="button" onClick={cancelStreetExit}>Cancel</ModalAction><ModalAction type="button" className="confirm-action" onClick={confirmStreetExit}>Go to Street</ModalAction></div>
    </InventoryDialog>}
    {foodChoice && <FoodChoiceDialog name={foodChoice.name} counts={foodSlot(inventory, foodChoice.kind, foodChoice.slotIndex)} onCancel={cancelFoodChoice} onChoose={chooseFood} />}
    {discardItem && <DiscardDialog name={discardItem.name} quantity={discardItem.quantity} spoiledQuantity={discardItem.spoiledQuantity} onCancel={cancelDiscard} onConfirm={() => confirmDiscard(false)} onDiscardSpoiled={() => confirmDiscard(true)} />}
    {sleepChoice && <SleepPlanningDialog
      kind={sleepChoice} dateLabel={`Day ${displayDay(game.day)} ${weekday(game.day)} · ${formatTime(game.minutes)}`} energy={game.energy}
      options={SLEEP_HOURS.map(hours => ({ hours, wakeLabel: wakeLabel(hours, sleepChoice), unavailableReason: sleepDurationUnavailable(hours, game.energy) }))}
      selectedHours={sleepHours} durationLabel={formatTravelTime(chosenSleepMinutes(sleepHours, sleepChoice))}
      wetClothesWarning={CLOTHING_WETNESS_ENABLED && (sleepChoice === 'ground' || (sleepChoice === 'bench' && current.id === 'street')) && ((game.wetness ?? 0) > 0 || weather.label === 'Rain' || weather.label === 'Showers')}
      wetnessEnabled={CLOTHING_WETNESS_ENABLED} onSelect={setSleepHours} onCancel={() => setSleepChoice(null)}
      onConfirm={() => runWithResult('Start sleeping', () => sleep(sleepHours, sleepChoice))}
    />}
    {infoModal && <ResultCard result={infoModal} onClose={closeResult} />}
    {closingNotice && !infoModal && !pendingResult && !activeEvent && !diceCheck && !sleeping && !gameOver && <ResultCard result={{
      title: `${locations.find(place => place.id === closingNotice)?.name} has closed`,
      label: 'CLOSING TIME · TIME PAUSED',
      text: 'It’s closing time. You have to leave. You step outside and find yourself back on the street.',
      illustration: '/street-life-game/assets/event-closing-time.webp',
      illustrationAlt: 'You stand outside with your backpack after the doors have closed behind you.',
    }} onClose={() => setClosingNotice(null)} />}
    {trashGame && <ModalOverlay className="trash-overlay">
      <ModalPanel size="compact" className="trash-card" role="dialog" aria-modal="true" aria-labelledby="trash-title">
        <div className="trash-head"><Icon name="bottle" /><h2 id="trash-title">Look for bottles</h2></div>
        <p className="trash-tip">Drag rubbish out. Tap intact bottles & cans.</p>
        <div className="trash-search-row"><TrashSearchTime startedAt={trashGame.startedAt} onDeadline={checkTrashDeadline} /><span aria-label={`${trashGame.found} containers kept`}><Icon name="bottle" /><strong>{trashGame.found}</strong></span></div>
        <div className="trash-bin">
          <div className="trash-pile">
          {trashGame.items.map((item, index) => !item.collected && <button
            key={item.id}
            className={item.bottle ? 'trash-piece bottle-piece' : 'trash-piece'}
            aria-label={item.returnable ? item.art === 'can' ? 'Pick up can' : 'Pick up plastic bottle' : 'Drag rubbish aside · arrow keys to move'}
            data-art={item.art}
            style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`, zIndex: index + 2 }}
            onPointerDown={(e) => { const bounds = e.currentTarget.parentElement!.getBoundingClientRect(); if (startTrashDrag(item.id, e.clientX, e.clientY, bounds)) e.currentTarget.setPointerCapture(e.pointerId) }}
            onPointerMove={(e) => { if (!e.currentTarget.hasPointerCapture(e.pointerId)) return; moveTrashItem(item.id, e.clientX, e.clientY, e.currentTarget.parentElement!.getBoundingClientRect()) }}
            onPointerUp={(e) => { const tapped = trashDrag.current?.id === item.id && !trashDrag.current.moved; trashDrag.current = null; if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); if (tapped && item.returnable) collectTrashBottle(item.id) }}
            onPointerCancel={() => { trashDrag.current = null }}
            onClick={e => { if (e.detail === 0 && item.returnable) collectTrashBottle(item.id) }}
            onKeyDown={e => {
              const direction = ({ ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] } as Record<string, number[]>)[e.key]
              if (!direction) return
              e.preventDefault()
              const bounds = e.currentTarget.parentElement!.getBoundingClientRect()
              const x = bounds.left + item.x / 100 * bounds.width
              const y = bounds.top + item.y / 100 * bounds.height
              if (startTrashDrag(item.id, x, y, bounds)) moveTrashItem(item.id, x + direction[0], y + direction[1], bounds)
              trashDrag.current = null
            }}
          ><img src={`/street-life-game/assets/trash-${item.art}.webp`} alt="" draggable={false} decoding="async" width="192" height="192" /></button>)}
          </div>
        </div>
        <ModalAction className="trash-stop" onClick={finishTrashSearch}>Finish searching</ModalAction>
      </ModalPanel>
    </ModalOverlay>}

    {phoneOpen && !phoneUnavailable && <PhoneDialog
      battery={inventory.phoneBattery} serviceActive={mobileServiceActive} serviceMinutesLeft={mobileServiceMinutesLeft} canBuyService={game.money >= 1}
      autoRenew={mobileAutoRenew} onClose={() => setPhoneOpen(false)} onBuyService={() => { setPhoneOpen(false); buyMobileService() }}
      onAutoRenew={() => setMobileAutoRenew(value => !value)}
      blocked={eventInteractionBlocked || !!sleeping || !!sleepChoice || !!gameOver}
    />}

    <div className={`game-background${eventInteractionBlocked ? ' event-background-blocked' : ''}`} inert={eventInteractionBlocked} aria-hidden={eventInteractionBlocked || undefined} onClickCapture={event => { if (eventInteractionBlocked) { event.preventDefault(); event.stopPropagation() } }}>
    <GameHeader game={game} weatherLabel={weather.label} temperature={temperature} battery={inventory.phoneBattery} />

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
      calling={!!activeCall} title={activeCall?.callingTitle ?? 'Looking for information'}
      elapsed={phoneActivity.total - phoneActivity.remaining} timeLabel={activeCall ? 'Elapsed call time' : 'Elapsed browsing time'}
      phase={activeCall ? activeCall.id === 'call-university' || phoneActivity.remaining === phoneActivity.total ? 'Ringing' : 'Talking' : phoneActivity.remaining > phoneActivity.total * 2 / 3 ? 'Searching' : phoneActivity.remaining > phoneActivity.total / 3 ? 'Reading options' : 'Saving addresses'}
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
        from={current.name} to={destination?.name} walking={trip.mode === 'walk'} moving={phase.walking}
        elapsed={elapsed} phase={underRainCover ? 'Under cover' : phase.label}
      />
    })()}

    {selectedDestination && screen === 'map' && <TravelPlanningDialog destination={locations.find(location => location.id === selectedDestination)}
      panelRef={travelChoiceRef} choiceSeed={choiceSeed} choiceDecisionKey={choiceDecisionKey} freeTransitActive={freeTransitActive}
      money={game.money} onClose={() => setSelectedDestination(null)} onStart={startTravel} onFareDodge={attemptFareDodge} />}

    {screen === 'inventory' && <InventoryScreen inventory={inventory} hygiene={game.hygiene} usedBackpackSlots={usedBackpackSlots} shelterPhoneCharging={shelterPhoneCharging}
      onUseItem={useItem} onUseSupply={useSupply} onSmoke={smokeCigarette} onMedicine={useMedicine} onRequestFood={requestFood} onDiscard={setDiscardItem} />}
    {screen === 'status' && <StatusScreen game={game} statusEffects={statusEffects} statLimits={statLimits} separateLimits={separateLimits} statusNeeds={statusNeeds} focusedNeed={focusedNeed}
      situation={{ housing: life.housing, employment: life.employment, income: life.income, documents: inventory.documents ? 'With you' : storage.documents ? 'Stored safely' : 'Missing' }} />}
    {screen === 'phone' && <PhoneScreen busy={!!phoneActivity} app={phoneApp} onApp={openPhoneApp} pendingGoals={pendingGoals.length} unavailable={phoneUnavailable} serviceActive={mobileServiceActive} serviceMinutesLeft={mobileServiceMinutesLeft} onPlan={() => setPhoneOpen(true)}>
      {phoneApp === 'goals' && <JournalGoals pending={pendingGoals} completed={completedGoals} />}
      {phoneApp === 'history' && <PhoneHistoryScreen journalDay={journalDay} today={game.day} entries={journalEntries} onDayChange={setSelectedJournalDay} />}
      {phoneApp === 'notes' && <PhoneNotesScreen mapPlaces={mapPlaces} answeredQuestions={answeredQuestions} />}
      {phoneApp === 'search' && <PhoneSearchScreen serviceActive={mobileServiceActive} answeredQuestions={answeredQuestions} battery={inventory.phoneBattery} phoneSearchCost={phoneSearchCost}
        onOpenNotes={() => openPhoneApp('notes')} onSearch={answerPracticalQuestion} />}
    </PhoneScreen>}
    {screen === 'phone' && phoneApp === 'home' && !phoneUnavailable && game.health <= 20 && <ChoiceButton className="action phone-emergency" aria-label="Call ambulance" onClick={callAmbulance} icon="ambulance" label="Call ambulance" detail={<small>Emergency care · no internet required</small>} />}

    </div>

    {gameOver && <ModalOverlay className="game-over-overlay" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
      <ModalPanel size="compact" className="game-over-card">
        <p className="eyebrow">RUN OVER</p>
        <div className="game-over-emblem"><Icon name="heart-broken" /></div>
        <h2 id="game-over-title">Your health reached zero</h2>
        <p className="game-over-day"><strong>Day {displayDay(game.day)}</strong><span>Your run ended here</span></p>
        <p className="game-over-description modal-narrative">Food, water and medicine can stop causes of damage, but lost health needs proper recovery and care.</p>
        <ModalAction onClick={reset}>Start new run</ModalAction>
      </ModalPanel>
    </ModalOverlay>}

    {!gameOver && !closingNotice && (rainChoice || rainWaiting) && game.rain && !sleeping && !infoModal && !pendingResult && !activeEvent && !diceCheck && <RainEventDialog
      rain={game.rain} waiting={rainWaiting} elapsed={Math.floor(absoluteMinutes(game) - (game.rain.choiceAt ?? game.rain.start))}
      orderSeed={choiceSeed} decisionKey={choiceDecisionKey} panelRef={rainModalRef} onChoose={respondToRain}
      onFindProperShelter={findProperShelter} onContinue={continueInRain}
    />}
    {!gameOver && diceCheck?.choice.check && <DiceDialog diceCheck={diceCheck} eventText={activeEvent?.text}
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

    {autosave.saveFailed && <p role="alert" className="save-warning">Progress could not be saved on this device. Keep the game open and try again.</p>}
    <footer inert={activityOverlay || eventInteractionBlocked} aria-hidden={eventInteractionBlocked || undefined} className={eventInteractionBlocked ? 'event-background-blocked' : undefined}><button className="reset" disabled={eventInteractionBlocked} onClick={() => { if (!eventInteractionBlocked) reset() }}>Reset save</button><small className="header-version" title={BUILD_VERSION} aria-label={`Build ${BUILD_VERSION}`}>v{BUILD_VERSION.split('-').pop()}</small></footer>
    <BottomNavigation screen={screen} blocked={eventInteractionBlocked} phoneBusy={!!phoneActivity} travelling={travelling} current={current} mood={game.mood} onNavigate={setScreen} />
  </main>
}
