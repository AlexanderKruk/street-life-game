import { FIRST_NIGHT_EVENTS_KEY,ENCOUNTERS_KEY,LEFT_HOME_KEY,RAIN_RESPONSE_KEY,PHONE_ACTIVITY_KEY,MUSIC_WALK_USED_KEY,GOAL_KEY,JOURNAL_GOALS_KEY,JOURNAL_HISTORY_KEY,SHELTER_ARRIVAL_KEY,SAVE_KEYS } from './saveKeys'
import { INITIAL_LIFE,SHELTER_DEPARTURE_MINUTES,loadGameSession } from './loadGameSession'
import { useCallback,useEffect,useMemo,useRef,useState } from 'react'
import ActivityDialog from './ActivityDialog'
import BottomNavigation from './BottomNavigation'
import ChoiceButton from './ChoiceButton'
import ChoiceOptions from './ChoiceOptions'
import CityMap from './CityMap'
import DiscardDialog from './DiscardDialog'
import EventDialog from './EventDialog'
import FoodChoiceDialog from './FoodChoiceDialog'
import GameHeader from './GameHeader'
import { Icon,locationIcon,type IconName } from './Icon'
import InventoryDialog from './InventoryDialog'
import InventoryScreen from './InventoryScreen'
import { JournalGoals } from './JournalSections'
import { SleepHeading } from './LocationPresentation'
import LocationScreen from './LocationScreen'
import { ModalAction,ModalOverlay,ModalPanel } from './Modal'
import PhoneDialog from './PhoneDialog'
import PhoneHistoryScreen from './PhoneHistoryScreen'
import PhoneNotesScreen from './PhoneNotesScreen'
import PhoneScreen,{ type PhoneApp } from './PhoneScreen'
import PhoneSearchScreen from './PhoneSearchScreen'
import RainEventDialog from './RainEventDialog'
import ResultCard,{ type ResultCardData } from './ResultCard'
import SleepPlanningDialog from './SleepPlanningDialog'
import StatusScreen from './StatusScreen'
import TrashSearchTime,{ trashSearchMinutes } from './TrashSearchTime'
import { illustrateStreetEvent } from './eventArtwork'
import { STREET_EVENTS,firstMorningTime,firstNightTime,nextStreetEvent,resolveEventOutcome,type EventContext,type EventOutcome,type EventTrigger,type StreetEvent,type StreetEventChoice } from './events'
import { ageFood,foodSlot,type FoodCondition,type FoodKind } from './foodInventory'
import { actions,applyAction as applyGameAction,applySleepTime as applyGameSleepTime,conditionBand,createInitialState,destinationTravelTimeRange,energyCap,formatTime,isOpen,limitMood,locations,moodLimit,rainDailyLimit,randomTravelMinutes,temperatureAt,weatherAt,weatherExposure,type ActionResult,type GameState,type Housing } from './game'
import { displayDay } from './gameDate'
import { absoluteMinutes,formatTravelTime,weekday } from './gameTime'
import { CLOTHING_WETNESS_ENABLED } from './gameplayFeatures'
import { BACKPACK_CAPACITY,BOTTLE_STACK_SIZE,FREE_WATER_LIMIT,INITIAL_INVENTORY,INITIAL_STORAGE,NIGHT_SHELTER_STORAGE,SCHRONISKO_STORAGE,SHOP_ITEMS,addShopItem,backpackSlots,canAddToBackpack,fitEventSupplies,storageSlots } from './inventory'
import { inventoryCommandResult,resolveInventoryCommand,type InventoryCommand } from './inventoryCommands'
import { journalReflection,type JournalEntry } from './journal'
import { limitingEffects } from './limitingEffects'
import { CLOSING_NOTICE_KEY,locationClosedSince } from './locationClosing'
import { OPENING_CALLS,OPENING_CALLS_KEY,openingCall } from './openingCalls'
import { phoneDrainMultiplier } from './phonePower'
import { chooseRain,createRain,planRainDay,rainArt,rainResultText,type RainChoice } from './rain'
import { locationPresentation } from './resultPresentation'
import { summarizeResult,type ConsumedItem,type ResultSnapshot } from './results'
import { DISCOVERY_KEY,SAVE_KEY } from './saveCompatibility'
import { SHELTER_PHONE_CHARGE_KEY } from './shelterCharging'
import { SHELTER_ENTRY_OPEN,SHELTER_QUEUE_MINUTES,SHELTER_REGISTRATION_OPEN,shelterPeopleAhead,shelterQueueMinutes } from './shelterRules'
import { sleepIllnessChance } from './sleepIllness'
import { DEBUG_SLEEP_SPEED,SHELTER_CHECKOUT_WARNING,SLEEP_HOURS,availableSleepHours,shelterSleepMinutes,sleepDurationUnavailable } from './sleepRules'
import type { ActiveEffect,BackpackItemId,FirstNightEvents,Inventory,JournalGoals as JournalGoalState,LifeSituation,Screen,ShelterArrival,ShelterDeparture,ShelterQueue,ShopItem,SleepState,StoredItems,TravelMode,Trip } from './stateTypes'
import { CHOICE_SEED_KEY,newChoiceSeed } from './streetChoiceOrder'
import { getTravelDisplayPhase,getTravelPhase } from './travelPhases'
import { useGameAutosave } from './useGameAutosave'
import { elapsedPhoneBattery,phoneUnavailableReason } from './phoneActivity'
import { usePhoneSession } from './phoneSession'
import { usePhoneController } from './usePhoneController'
import { useLatestAction } from './useLatestAction'

const BUILD_VERSION = 'v2026.10.25-329'
const ACTIVITY_TICK_MS = 250

type TrashArt = 'cup' | 'paper' | 'tray' | 'wrapper' | 'can-crushed' | 'plastic' | 'plastic-crushed' | 'can'
// Physical proportions follow the object, never whether its deposit is valid.
const TRASH_ITEM_SCALE: Record<TrashArt, number> = {
  plastic: 2.5, 'plastic-crushed': 2.5,
  can: 2, 'can-crushed': 2,
  cup: 1.55, paper: 2, tray: 2.1, wrapper: 1.9,
}
type TrashItem = { id: number; layer: number; art: TrashArt; x: number; y: number; rotation: number; scale: number; bottle: boolean; returnable: boolean; collected?: boolean; cleared?: boolean }

function clearSleepIllness(game: GameState): GameState {
  if (game.sleepIllnessDose === undefined && game.sleepIllnessMinutes === undefined) return game
  const next = { ...game }
  delete next.sleepIllnessDose
  delete next.sleepIllnessMinutes
  return next
}

export default function App() {
  const [initial] = useState(() => loadGameSession(localStorage))
  const [game, commitGame] = useState<GameState>(() => initial.game)
  const [choiceSeed, setChoiceSeed] = useState(() => initial.choiceSeed)
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
  const [shelterInterview, setShelterInterview] = useState<{ step: 'reason' | 'action' | 'plan'; reason?: string; action?: string } | null>(null)
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
  const [shelterQueue, setShelterQueue] = useState<ShelterQueue | null>(() => initial.shelterQueue)
  const [shelterArrival, setShelterArrival] = useState<ShelterArrival | null>(() => initial.shelterArrival)
  const [shelterDeparture, setShelterDeparture] = useState<ShelterDeparture | null>(() => initial.shelterDeparture)
  const [streetBenchFound, setStreetBenchFound] = useState(false)
  const [sleepHours, setSleepHours] = useState(8)
  const [sleepChoice, setSleepChoice] = useState<SleepState['kind'] | null>(null)
  const [sleeping, setSleeping] = useState<SleepState | null>(() => initial.sleeping)
  const [begging, setBegging] = useState<{ day: number; attempts: number }>(() => initial.begging)
  const lastFinishedSleep = useRef<SleepState | null>(null)
  const [trashGame, setTrashGame] = useState<{ items: TrashItem[]; startedAt: number; found: number; before: ResultSnapshot } | null>(null)
  const trashDrag = useRef<{ id: number; offsetX: number; offsetY: number; startX: number; startY: number; moved: boolean } | null>(null)
  const eventModalRef = useRef<HTMLElement>(null)
  const [firstNightEvents, setFirstNightEvents] = useState<FirstNightEvents>(() => initial.firstNightEvents)
  const [leftHome, setLeftHome] = useState(() => initial.leftHome)
  const [encounters, setEncounters] = useState<FirstNightEvents>(() => initial.encounters)
  const openingSearchObservation = useRef(false)
  const ambientEventClock = useRef({ locationId: game.locationId, minutes: 0 })
  const [activeEvent, setActiveEvent] = useState<StreetEvent | null>(() => {
    const event = STREET_EVENTS.find(event => event.id === (initial.firstNightEvents.pendingId ?? initial.encounters.pendingId))
    return event ? illustrateStreetEvent(event, { locationId: game.locationId, housing: game.locationId === 'shelter' ? 'Night shelter' : 'Street', sleepKind: sleeping?.kind ?? (game.locationId === 'station' ? 'bench' : 'ground') }) : null
  })
  const [diceCheck, setDiceCheck] = useState<{ choice: StreetEventChoice; roll: number | null; modifier: number; resolved: boolean; stealItemId?: ShopItem['id']; fareDodgeDestinationId?: string } | null>(() => {
    const roll = initial.encounters.pendingRoll
    const choice = activeEvent && ['borrow-phone-slip', 'park-company'].includes(activeEvent.id) ? activeEvent.choices[0] : undefined
    return choice?.check && roll ? { choice, roll, modifier: checkModifier(choice), resolved: false } : null
  })
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
  const shelterNightDay = game.minutes < 480 ? game.day - 1 : game.day
  const shelterBooked = (life.shelterUntilDay ?? 0) > 0 && (life.shelterUntilDay ?? 0) >= shelterNightDay
  const currentActions = useMemo(() => actions.filter(x => x.locationId === current.id && (current.id !== 'shelter' || shelterBooked || x.id === 'shelter-rest')), [current.id, shelterBooked])
  const mapPlaces = useMemo(() => locations.filter(location => discoveredLocations.includes(location.id) && (location.id !== 'residential-shelter' || life.schroniskoReferral || life.housing === 'Schronisko')), [discoveredLocations, life.schroniskoReferral, life.housing])
  const open = isOpen(current, game.minutes)
  // Old saves at this location already represent a guest inside. New arrivals
  // explicitly record admission (or refusal), independently of using the bed.
  const shelterCanEnterNow = game.minutes >= 1080 && game.minutes <= 1320 && game.intoxication <= 10
  const shelterAdmitted = shelterBooked && (shelterCanEnterNow || life.shelterEntry?.night !== shelterNightDay || life.shelterEntry.admitted)
  const insideNightShelter = current.id === 'shelter' && !trip && open && game.intoxication <= 10 &&
    shelterAdmitted
  useEffect(() => {
    if (!insideNightShelter || (life.shelterEntry?.night === shelterNightDay && life.shelterEntry.admitted)) return
    setLife(status => ({ ...status, shelterEntry: { night: shelterNightDay, admitted: true }, shelterLastStayDay: shelterNightDay }))
  }, [insideNightShelter, shelterNightDay, life.shelterEntry?.night, life.shelterEntry?.admitted])
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
  useEffect(() => {
    if (gameOver || (game.rainSystemStarted && game.rainScheduleDay === game.day)) return
    const plan = planRainDay(game, rainDailyLimit(game.day))
    setGame(previous => previous.rainSystemStarted && previous.rainScheduleDay === previous.day ? previous
      : { ...previous, ...plan, rainSystemStarted: true, rainUntil: undefined })
  }, [game.day, game.rainSystemStarted, game.rainScheduleDay, gameOver])
  useEffect(() => {
    const limit = rainDailyLimit(game.day)
    if (!game.rainSystemStarted || game.rainScheduleDay !== game.day || (game.rainStartsToday ?? 0) >= limit || game.rain || game.rainResults?.length || gameOver || absoluteMinutes(game) < (game.nextRainAt ?? Infinity)) return
    const rain = createRain(absoluteMinutes(game))
    // Keep the inter-episode deadline across midnight even after a cloudy day
    // uses its allowance. The daily counter blocks another episode today.
    const nextRainAt = rain.end + 180 + Math.floor(Math.random() * 301)
    setGame(previous => previous.rain || previous.rainResults?.length || (previous.rainStartsToday ?? 0) >= rainDailyLimit(previous.day) ? previous
      : { ...previous, rain, nextRainAt, rainStartsToday: (previous.rainStartsToday ?? 0) + 1 })
  }, [game.day, game.minutes, game.rainSystemStarted, game.rainScheduleDay, game.rainStartsToday, game.rain, game.rainResults, game.nextRainAt, gameOver])
  useEffect(() => {
    const eligible = !!game.rain && !game.rain.choice && currentExposure === 'outside' && !sleeping && !gameOver
    setRainChoice(eligible)
  }, [game.rain, currentExposure, sleeping, gameOver])
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
  const shelterCheckoutDue = current.id === 'shelter' && shelterAdmitted && !shelterDeparture && !trip &&
    life.shelterCheckoutDay !== game.day && game.minutes >= SHELTER_CHECKOUT_WARNING && game.minutes < 12 * 60 &&
    (game.minutes < 8 * 60 || life.shelterLastStayDay === game.day - 1)
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
  const groundSleepWindow = useRef<{ start: number; end: number } | null>(sleeping?.kind === 'ground' ? { start: sleeping.startAbsolute, end: sleeping.startAbsolute + sleeping.total } : null)
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

  function applySleepTime(state: GameState, minutes: number) {
    const kind = sleeping?.kind ?? sleepChoice
    return applyGameSleepTime(state, minutes, { ...moodContext(state), ...(kind ? { sleepKind: kind, exposure: kind === 'ground' || (kind === 'bench' && state.locationId === 'street') ? underRainCover ? 'cover' as const : 'outside' as const : 'indoors' as const } : {}) })
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

  function observeFirstNight(trigger: Extract<EventTrigger, 'walk' | 'bench' | 'location'>, state: GameState, locationId = state.locationId) {
    if (!firstNightTime(state) || life.housing !== 'Street' || activeEvent || infoModal || firstNightEvents.pendingId) return
    if (!encounterDue(state)) return
    const event = nextStreetEvent(trigger, { locationId, minutes: state.minutes, weather: weather.label, housing: life.housing, documents: inventory.documents, firstNight: true, nearHome: !leftHome && !trip, seenEventIds: [...firstNightEvents.seen, ...STREET_EVENTS.filter(event => !event.id.startsWith('first-night-')).map(event => event.id)] })
    if (event?.id.startsWith('first-night-')) { rememberFirstNightEvent(event, state); return true }
    return false
  }

  function observeOrdinaryEvent(trigger: 'travel' | 'location', state: GameState, travelMode?: TravelMode, observation: Pick<EventContext, 'observation' | 'elapsedMinutes'> = {}) {
    if (activeEvent || firstNightEvents.pendingId || encounters.pendingId) return
    // Opening observations keep priority; D1+ night encounters can occur away from home
    // even when the player skipped the at-home encounters on D0.
    const eventWeather = weatherAt(state)
    const event = nextStreetEvent(trigger, { locationId: state.locationId, day: state.day, minutes: state.minutes, temperature: temperatureAt(eventWeather.temp, state.minutes), ...observation, travelMode, weather: eventWeather.label, housing: life.housing, documents: inventory.documents, firstNight: firstNightTime(state),
      seenEventIds: [...encounters.seen, ...STREET_EVENTS.filter(event => event.id.startsWith('first-night-')).map(event => event.id)] })
    // The first-morning decision takes priority over ordinary cooldowns.
    if (event?.id !== 'city-waking' && !encounterDue(state)) return
    if (firstNightTime(state) && !firstNightEvents.seen.length && !['night-rustle', 'borrow-phone', 'park-company', 'night-patrol'].includes(event?.id ?? '')) return
    if (event) rememberEncounter(event, state)
  }

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

  useEffect(() => {
    const rain = game.rainResults?.[0]
    if (!rain || gameOver || activeEvent || diceCheck || infoModal || pendingResult || sleeping || sleepChoice || shelterInterview || shelterQueue || shelterDeparture || closingNotice || inventoryDialogOpen || trashGame || trip?.remaining === 0 || phoneActivity?.remaining === 0) return
    const granted = rain.coldGranted ?? (!!rain.cold && !effects.some(effect => effect.id === 'cold' && effect.expiresAt > absoluteMinutes(game)))
    if (!rain.reported) {
      if (granted) setEffects(previous => [...previous.filter(effect => effect.id !== 'cold'), { id: 'cold', expiresAt: absoluteMinutes(game) + 2 * 1440 }])
      setGame(previous => ({ ...previous, rainResults: previous.rainResults?.map(item => item.id === rain.id ? { ...item, reported: true, coldGranted: granted } : item) }))
    }
    const title = rain.choice === 'proper' && rain.searchRemaining > 0 ? 'The rain has stopped' : rain.choice === 'continue' ? 'The rain has passed' : 'Shelter from the rain'
    const text = rainResultText(rain) + (granted ? ' A chill lingers, and your throat feels sore. You have caught a cold.' : '')
    const after = resultSnapshot()
    const before = { ...after, game: { ...game, energy: Math.min(100, game.energy + rain.energyLoss), mood: Math.min(100, game.mood + rain.moodLoss) } }
    const summary = summarizeResult(before, after, false)
    if (rain.choice === 'continue') {
      // Background costs may already have been offset by eating/resting. Report
      // the recorded rain totals, without fabricating a before/after stat meter.
      summary.changes = []
      for (const [label, loss] of [['⚡ Energy', rain.energyLoss], ['🙂 Mood', rain.moodLoss]] as const) {
        const amount = Number(loss.toFixed(1))
        if (amount > 0) summary.changes.push({ label, value: `−${amount}`, kind: 'negative' })
      }
    }
    // Only the rain's own losses belong here. Purchases, food, recovery and
    // ordinary passive costs during a background episode are unrelated.
    if (rain.choice !== 'continue' && rain.waited > 0) summary.costs.push({ label: '⏱ Time', value: `${Math.round(rain.waited)} min`, kind: 'neutral' })
    if (granted) summary.changes.push({ label: '🤒 Cold', value: 'Started', kind: 'negative' })
    const illustration = rain.choice === 'proper' && rain.searchRemaining > 0
      ? '/street-life-game/assets/event-rain-stopped-search.webp'
      : rainArt(rain, rain.choice ?? 'continue')
    setInfoModal({ title, text, label: 'AFTER THE RAIN', illustration, illustrationAlt: text, visibleStats: ['Energy', 'Mood'], rainResultId: rain.id, ...summary })
    setEventResultOpen(true)
    if (!rain.reported) setJournalEntries(previous => [...previous, { day: game.day, minute: game.minutes, title, text, actionTitle: title, reflection: true as const }].slice(-500))
  }, [game, effects, activeEvent, diceCheck, infoModal, pendingResult, sleeping, sleepChoice, shelterInterview, shelterQueue, shelterDeparture, closingNotice, inventoryDialogOpen, trashGame, trip?.remaining, phoneActivity?.remaining, gameOver])

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
  function answerShelterInterview(...args: Parameters<typeof answerShelterInterviewImpl>) { runWithResult('Shelter extension', () => answerShelterInterviewImpl(...args)) }
  function applyEventOutcome(outcome: EventOutcome, title?: string) {
    let resolved = resolveEventOutcome(outcome, Math.random, inventory.documents, storage.documents)
    if (activeEvent?.id === 'borrow-phone-slip' && (resolved.phoneCondition ?? 0) < 0 && inventory.phoneCondition + resolved.phoneCondition! <= 0) {
      resolved = { ...resolved, message: resolved.message.replace('The screen still works.', 'You try the screen, but it stays black.') }
    }
    runWithResult(title ?? activeEvent?.title ?? 'Event result', () => { setEventResultOpen(true); applyEventOutcomeImpl(resolved) }, resultSnapshot(), true, true)
  }
  function socialSupport(...args: Parameters<typeof socialSupportImpl>) { runWithResult('Social support', () => socialSupportImpl(...args)) }
  function takeDayWork(...args: Parameters<typeof takeDayWorkImpl>) { runWithResult('Day work', () => takeDayWorkImpl(...args)) }

  useEffect(() => {
    if (current.id !== 'shelter' || life.shelterVacancyDay === game.day) return
    setLife(status => ({ ...status, shelterVacancyDay: game.day, shelterVacancies: Math.floor(Math.random() * 4) }))
  }, [current.id, game.day, life.shelterVacancyDay])
  useEffect(() => {
    const waitingHere = current.id === 'shelter' && !trip && !shelterBooked && game.minutes >= 480 && game.minutes < 1320
    setShelterArrival(previous => waitingHere
      ? previous?.day === game.day ? previous : { day: game.day, minute: game.minutes }
      : previous === null ? previous : null)
  }, [current.id, !!trip, shelterBooked, game.day, game.minutes])

  useEffect(() => {
    if (!shelterDeparture || shelterDepartureRemaining > 0 || gameOver) return
    const departure = shelterDeparture
    runWithResult('Shelter checkout', () => {
      setShelterDeparture(null)
      setGame(previous => ({ ...previous, locationId: 'street' }))
      setLife(previous => ({ ...previous, housing: 'Street', housingUntil: undefined, shelterCheckoutDay: departure.day }))
      setSelectedDestination(null)
      setPhoneOpen(false)
      setShelterPhoneCharging(false)
      setScreen('location')
      setMessage('You packed your things and left the night shelter. After 30 minutes you are on the street.' + (shelterPhoneCharging ? ' You collected your phone from the charger.' : '') + (shelterBooked ? ' Your reserved place remains available for tonight.' : ''))
    }, departure.before, true, true)
  }, [shelterDeparture, shelterDepartureRemaining, gameOver])

  function startShelterDeparture() {
    if (!shelterCheckoutDue || sleeping || infoModal || pendingResult || activeEvent || diceCheck || gameOver) return
    setMusicOn(false)
    setPhoneOpen(false)
    setShelterDeparture({ day: game.day, startAbsolute: absoluteMinutes(game), before: resultSnapshot() })
    setMessage('Packing your things and leaving the night shelter. This takes 30 minutes.')
  }

  useEffect(() => {
    if (!shelterQueue || shelterQueue.remaining > 0 || gameOver) return
    const queued = shelterQueue
    runWithResult('Shelter registration', () => {
      setShelterQueue(null)
      if (queued.vacancies > queued.peopleAhead) {
        setLife(status => ({ ...status, housing: 'Night shelter', shelterRegisteredDay: queued.day,
          shelterUntilDay: queued.day + 6, shelterLastStayDay: queued.day, shelterAuditDay: queued.day, shelterEntry: { night: queued.day, admitted: true },
          shelterMisses: 0, shelterMissMonth: Math.floor((queued.day - 1) / 30), shelterStrikes: 0 }))
        setGame(prev => applyGameAction(prev, { minutes: 0, mood: 3 }, moodContext(prev, 'Night shelter')), 'Night shelter')
        setActiveGoal(goal => goal?.type === 'night-shelter' ? null : goal)
        setMessage('After waiting in the queue, a place is available. You are registered for 7 days. Shelter services and your bed are now available.')
      } else {
        setGame(prev => applyAction(prev, { minutes: 0, mood: -5 }))
        setMessage(queued.vacancies === 0 ? 'You waited, but there are no free places today. Try arriving before 18:00 tomorrow; registration starts at 18:20.' :
          'You waited, but people ahead of you took the remaining places. Try arriving before 18:00 tomorrow; registration starts at 18:20.')
      }
      setScreen('location')
    }, queued.before, true, true)
  }, [shelterQueue, gameOver])
  useEffect(() => {
    if (life.housing === 'Night shelter' && life.housingUntil !== undefined && absoluteMinutes(game) >= life.housingUntil) {
      setLife((status) => ({ ...status, housing: 'Street', housingUntil: undefined }))
    }
  }, [game.day, game.minutes, life.housing, life.housingUntil])
  useEffect(() => {
    const now = absoluteMinutes(game)
    setEffects((prev) => { const next = prev.filter((effect) => effect.expiresAt > now); return next.length === prev.length ? prev : next })
  }, [game.day, game.minutes])
  useEffect(() => {
    if (!life.shelterRegisteredDay || !life.shelterUntilDay) return
    const previousDay = game.day - 1
    if (previousDay < life.shelterRegisteredDay || (life.shelterAuditDay ?? 0) >= previousDay) return
    setLife((status) => {
      const month = Math.floor((previousDay - 1) / 30)
      const missesBefore = status.shelterMissMonth === month ? (status.shelterMisses ?? 0) : 0
      const missed = status.shelterLastStayDay !== previousDay
      const misses = missesBefore + (missed ? 1 : 0)
      if (misses >= 3) {
        const blockedUntil = (month + 1) * 30 + 1
        setMessage(`You missed three shelter nights this month. Your place was cancelled; you can register again on Day ${displayDay(blockedUntil)}.`)
        return { ...status, housing: 'Street', housingUntil: undefined, shelterUntilDay: undefined, shelterAuditDay: previousDay, shelterMisses: misses, shelterMissMonth: month, shelterBlockedUntilDay: blockedUntil }
      }
      return { ...status, shelterAuditDay: previousDay, shelterMisses: misses, shelterMissMonth: month }
    })
  }, [game.day, life.shelterRegisteredDay, life.shelterUntilDay, life.shelterAuditDay, life.shelterLastStayDay])

  useEffect(() => {
    if (locationIsClosing || closingNotice || inventoryDialogOpen || phoneActivity || rainChoice || game.energy > 0 || sleeping || sleepChoice || gameOver || activeEvent || diceCheck || shelterInterview || shelterQueue || shelterCheckoutDue || shelterDeparture || trip || infoModal || pendingResult) return
    const safeKind = current.id === 'residential-shelter' ? 'residential' : insideNightShelter ? 'shelter' : 'ground'
    const hours = 8
    const realStartedAt = Date.now()
    setGame(clearSleepIllness)
    setMusicOn(false)
    setTrip(null)
    if (safeKind === 'ground' && current.id !== 'street') {
      recordShelterDeparture('street')
      setGame((prev) => ({ ...prev, locationId: 'street' }))
      setSelectedDestination(null)
      setPhoneOpen(false)
      setScreen('location')
    }
    const total = safeKind === 'shelter' ? shelterSleepMinutes(absoluteMinutes(game), hours * 60) : hours * 60
    groundSleepWindow.current = safeKind === 'ground' ? { start: absoluteMinutes(game), end: absoluteMinutes(game) + total } : null
    setSleeping({ kind: safeKind, total, remaining: total, startAbsolute: absoluteMinutes(game), realStartedAt, realWakeAt: realStartedAt + (total * 1000) / DEBUG_SLEEP_SPEED, before: resultSnapshot(), forced: true })
    setMessage(safeKind === 'ground' ? `${current.id !== 'street' ? `You leave ${current.name} and step outside. ` : ''}You collapse from exhaustion and fall asleep outside. You may sleep for up to ${hours} hours.` : 'You are too exhausted to stay awake and fall asleep in your bed.')
  }, [game.energy, sleeping, sleepChoice, gameOver, activeEvent, diceCheck, shelterInterview, shelterQueue, shelterCheckoutDue, shelterDeparture, shelterBooked, trip, current.id, open, game.intoxication, infoModal, pendingResult, rainChoice, phoneActivity, inventoryDialogOpen, closingNotice, locationIsClosing])

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
    if (sleeping) {
      const elapsed = Math.min(sleeping.total, Math.max(0, Math.floor(((Date.now() - sleeping.realStartedAt) / 1000) * DEBUG_SLEEP_SPEED)))
      const targetAbsolute = sleeping.startAbsolute + elapsed
      setGame((prev) => {
        const delta = Math.max(0, targetAbsolute - absoluteMinutes(prev))
        return delta > 0 ? applySleepTime(prev, delta) : prev
      })
    }
    if (sleeping) return
    const tickMinutes = trip ? Math.min(1, trip.remaining) : 1
    if (shelterQueue) setShelterQueue(active => active ? { ...active, remaining: Math.max(0, active.remaining - tickMinutes) } : null)
    setGame(prev => applyAction(prev, { minutes: tickMinutes }))
    if (!underRainCover) setTrip(active => active ? { ...active, remaining: Math.max(0, active.remaining - tickMinutes) } : null)
    if (!trip && !shelterQueue && !shelterDeparture && ['street', 'station'].includes(current.id)) {
      const clock = ambientEventClock.current
      if (clock.locationId !== current.id) { clock.locationId = current.id; clock.minutes = 0 }
      clock.minutes += tickMinutes
      if (clock.minutes >= (firstNight ? 15 : 30)) {
        clock.minutes = 0
        // The tick is already queued above; eligibility must use its new clock,
        // especially when this minute crosses an encounter deadline or midnight.
        const observationState = applyAction(game, { minutes: tickMinutes })
        if (!observeFirstNight(current.id === 'station' ? 'location' : 'walk', observationState)) observeOrdinaryEvent('location', observationState, undefined, { observation: 'idle', elapsedMinutes: firstNight ? 15 : 30 })
      }
    }
  })
  const gameClockInterval = trip || shelterDeparture || phoneActivity || rainWaiting ? ACTIVITY_TICK_MS : 1000
  useEffect(() => {
    const timer = window.setInterval(tickGameClock, gameClockInterval)
    return () => window.clearInterval(timer)
  }, [tickGameClock, gameClockInterval])

  useEffect(() => {
    if (!trip || trip.remaining > 0) return
    const destination = locations.find(location => location.id === trip.destinationId)
    if (!destination) { setTrip(null); return }
    runWithResult('Arrival', () => {
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

  // The opening observation becomes due during a search too, then waits for
  // its result to be acknowledged instead of being silently skipped.
  useEffect(() => {
    if (!openingSearchObservation.current || !firstNight || firstNightEvents.seen.length || absoluteMinutes(game) < 1335 || !['street', 'station'].includes(current.id)) return
    if (document.visibilityState !== 'visible' || eventInteractionBlocked || sleeping || sleepChoice || trip || phoneActivity || trashGame || shelterQueue || shelterDeparture || shelterInterview || gameOver) return
    observeFirstNight(current.id === 'station' ? 'location' : 'walk', game)
  }, [firstNight, firstNightEvents, game.day, game.minutes, current.id, eventInteractionBlocked, sleeping, sleepChoice, trip, phoneActivity, trashGame, shelterQueue, shelterDeparture, shelterInterview, gameOver])

  // A key story scene does not wait for the 30-minute ambient observation tick.
  // Existing activities/results finish first, then the scene opens immediately.
  useEffect(() => {
    if (!firstMorningTime(game) || current.id !== 'street' || encounters.seen.includes('city-waking')) return
    if (document.visibilityState !== 'visible' || eventInteractionBlocked || sleeping || sleepChoice || trip || phoneActivity || trashGame || shelterQueue || shelterDeparture || shelterInterview || gameOver) return
    observeOrdinaryEvent('location', game)
  }, [game.day, game.minutes, current.id, encounters, firstNightEvents, eventInteractionBlocked, sleeping, sleepChoice, trip, phoneActivity, trashGame, shelterQueue, shelterDeparture, shelterInterview, gameOver])

  function recordShelterDeparture(id: string) {
    if (game.locationId === 'shelter' && id !== 'shelter') setShelterPhoneCharging(false)
    if (game.locationId === 'shelter' && id !== 'shelter' && game.minutes > 480 && game.minutes < 1080 && (life.shelterUntilDay ?? 0) >= game.day) {
      const strikes = (life.shelterStrikes ?? 0) + 1
      const evicted = strikes >= 3
      const month = Math.floor((game.day - 1) / 30)
      const blockedUntil = (month + 1) * 30 + 1
      setLife((status) => ({ ...status, shelterStrikes: strikes, ...(evicted ? { housing: 'Street' as const, housingUntil: undefined, shelterUntilDay: undefined, shelterBlockedUntilDay: blockedUntil } : {}) }))
      setMessage(evicted ? `Third shelter rule violation: your place was cancelled. You can register again on Day ${displayDay(blockedUntil)}.` : `You left the shelter after 08:00. Rule violation ${strikes}/3.`)
    }
  }

  function chooseDestination(id: string) {
    if (sleepChoice || shelterQueue || shelterDeparture || shelterCheckoutDue) return
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

  function canStartSleep(kind: SleepState['kind']) {
    if (activeEvent || shelterQueue || shelterDeparture || shelterCheckoutDue || sleeping || trip || screen === 'travel' || gameOver) return false
    if (kind === 'bench' && current.id !== 'station' && (!streetBenchFound || current.id !== 'street')) return false
    if (kind === 'ground' && current.id !== 'street') return false
    if (kind === 'shelter' && !insideNightShelter) return false
    if (kind === 'residential' && current.id !== 'residential-shelter') return false
    return true
  }

  function requestSleep(kind: SleepState['kind']) {
    if (sleepChoice || !canStartSleep(kind)) return
    const available = availableSleepHours(game.energy)
    setSleepHours(previous => available.includes(previous) ? previous : available[available.length - 1])
    setSleepChoice(kind)
  }

  function chosenSleepMinutes(hours: number, kind: SleepState['kind']) {
    return kind === 'shelter' ? shelterSleepMinutes(absoluteMinutes(game), hours * 60) : hours * 60
  }

  function wakeLabel(hours: number, kind: SleepState['kind']) {
    const wake = absoluteMinutes(game) + chosenSleepMinutes(hours, kind)
    const day = Math.floor(wake / 1440) + 1
    return `Day ${displayDay(day)} ${weekday(day)} · ${formatTime(wake % 1440)}`
  }

  useEffect(() => {
    if (!sleepChoice) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSleepChoice(null) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [sleepChoice])

  function sleep(hours: number, kind: SleepState['kind']) {
    if (!canStartSleep(kind) || sleepDurationUnavailable(hours, game.energy)) return
    setSleepChoice(null)
    if (kind === 'shelter') {
      const stayNightDay = game.minutes < 480 ? game.day - 1 : game.day
      setLife(status => ({ ...status, shelterLastStayDay: stayNightDay, housing: 'Night shelter' }))
    }
    setMusicOn(false)
    const realStartedAt = Date.now()
    setGame(clearSleepIllness)
    const total = chosenSleepMinutes(hours, kind)
    groundSleepWindow.current = kind === 'ground' ? { start: absoluteMinutes(game), end: absoluteMinutes(game) + total } : null
    setSleeping({ kind, total, remaining: total, startAbsolute: absoluteMinutes(game), realStartedAt, realWakeAt: realStartedAt + (total * 1000) / DEBUG_SLEEP_SPEED, before: resultSnapshot() })
    setMessage('You are sleeping.')
  }

  useEffect(() => {
    if (!sleeping || absoluteMinutes(game) < sleeping.startAbsolute + sleeping.total) return
    finishSleep(sleeping)
  }, [sleeping, game.day, game.minutes])

  function finishSleep(sleep: SleepState) {
    if (lastFinishedSleep.current === sleep) return
    lastFinishedSleep.current = sleep
    setSleeping(null)
    const before = sleep.before ?? { ...resultSnapshot(), game: { ...game, day: Math.floor(sleep.startAbsolute / 1440) + 1, minutes: sleep.startAbsolute % 1440 } }
    runWithResult('Sleep complete', () => {
      setGame(previous => applySleepTime(previous, Math.max(0, sleep.startAbsolute + sleep.total - absoluteMinutes(previous))))
      finishSleepImpl(sleep)
    }, before, false, true)
  }

  function presentWakeEvent(event: StreetEvent | null, title: string, completionText: string, state = game) {
    if (!event) return
    const outcome = event.choices[0]?.outcome
    rememberEncounter(event, state)
    if (event.id !== 'quiet-night' || !outcome) return
    setActiveEvent(null)
    setEncounters(previous => ({ ...previous, pendingId: null }))
    // Peaceful rest has no decision to make: fold its bonus and artwork into
    // the existing sleep result instead of asking for another confirmation.
    const text = `${completionText} ${outcome.message}`
    setGame(previous => applyAction(previous, { minutes: outcome.minutes ?? 0, energy: outcome.energy, mood: outcome.mood }))
    setMessage(text)
    setInfoModal({ title, text, label: 'AFTER REST', illustration: outcome.illustration ?? event.illustration, illustrationAlt: event.text })
  }

  function finishSleepImpl(sleep: SleepState) {
    const hours = sleep.total / 60
    const scale = hours / 8
    const wakeState = applySleepTime(game, Math.max(0, sleep.startAbsolute + sleep.total - absoluteMinutes(game)))
    const fed = wakeState.hunger > 20 && wakeState.thirst > 20
    const result = sleep.kind === 'ground'
      ? { minutes: 0, energy: 52 * scale, hygiene: -12 * scale, mood: -9 * scale }
      : sleep.kind === 'bench'
        ? { minutes: 0, energy: 66 * scale, hygiene: -7 * scale, mood: -5 * scale }
        : sleep.kind === 'shelter'
          ? { minutes: 0, energy: 100 * scale, health: fed ? 2 * scale : 0, hygiene: 5 * scale, mood: 10 * scale }
          : { minutes: 0, energy: 100 * scale, health: fed ? 3 * scale : 0, hygiene: 3 * scale, mood: 8 * scale }
    const wetRestLoss = CLOTHING_WETNESS_ENABLED ? Math.max(0, (wakeState.wetSleepLoss ?? 0) - (sleep.before?.game.wetSleepLoss ?? 0)) : 0
    setGame((prev) => {
      const next = applyAction(prev, { ...result, energy: Math.max(0, result.energy - wetRestLoss) })
      delete next.wetSleepLoss
      delete next.sleepIllnessDose
      delete next.sleepIllnessMinutes
      return next
    })
    let illnessText = ''
    let newlyIll = false
    let wakeEvent: StreetEvent | null = null
    if (sleep.kind === 'ground' || sleep.kind === 'bench') {
      setLife((status) => ({ ...status, housing: 'Street', housingUntil: undefined }))
      const sleepWeather = weatherAt(wakeState)
      const alreadyIll = effects.some(effect => effect.id === 'cold' && effect.expiresAt > absoluteMinutes(wakeState))
      newlyIll = !alreadyIll && Math.random() < sleepIllnessChance(wakeState.sleepIllnessDose ?? 0)
      if (newlyIll) {
        setEffects(active => [...active.filter(effect => effect.id !== 'cold'), { id: 'cold', expiresAt: absoluteMinutes(wakeState) + 2 * 1440 }])
        illnessText = ' Your throat feels sore, your nose is blocked, and a chill runs through you as you sit up. You feel unwell — you have caught a cold.'
      }
      const sleepStart = { day: Math.floor(sleep.startAbsolute / 1440) + 1, minutes: sleep.startAbsolute % 1440 }
      wakeEvent = newlyIll || !encounterDue(wakeState) ? null : nextStreetEvent('wake', { locationId: current.id, weather: sleepWeather.label, housing: 'Street', documents: inventory.documents, firstNight: firstNightTime(sleepStart), sleepKind: sleep.kind, seenEventIds: [...firstNightEvents.seen, ...encounters.seen, ...(firstNightTime(sleepStart) && sleep.kind === 'bench' && !firstNightEvents.seen.includes('first-night-bench-wake') ? ['quiet-night','night-theft'] : [])] })
      if (wakeEvent?.id.startsWith('first-night-')) { rememberFirstNightEvent(wakeEvent, wakeState); wakeEvent = null }
    } else if (sleep.kind === 'shelter') {
      const sleepStartDay = Math.floor(sleep.startAbsolute / 1440) + 1
      const stayNightDay = sleep.startAbsolute % 1440 < 480 ? sleepStartDay - 1 : sleepStartDay
      setLife((status) => ({ ...status, housing: 'Night shelter', shelterLastStayDay: Math.max(status.shelterLastStayDay ?? 0, stayNightDay) }))
      const event = !encounterDue(wakeState) ? null : nextStreetEvent('wake', { locationId: current.id, weather: weather.label, housing: 'Night shelter', documents: inventory.documents, sleepKind: sleep.kind, seenEventIds: [...encounters.seen, ...firstNightEvents.seen] })
      if (wakeState.minutes < SHELTER_CHECKOUT_WARNING) wakeEvent = event
    } else {
      setLife((status) => ({ ...status, housing: 'Schronisko', housingUntil: undefined }))
    }
    const completionText = `You slept for ${Number.isInteger(hours) ? `${hours} hour${hours === 1 ? '' : 's'}` : formatTravelTime(sleep.total)}.${wetRestLoss >= 0.5 ? ' Wet clothes made it harder to rest.' : ''}${illnessText}`
    setMessage(completionText)
    if (newlyIll) setInfoModal({ title: 'Feeling unwell', label: 'WAKE-UP EVENT', text: completionText,
      illustration: `/street-life-game/assets/event-sleep-cold-${sleep.kind === 'bench' ? 'bench' : 'ground'}.webp`,
      illustrationAlt: sleep.kind === 'bench' ? 'You wake on a bench with a sore throat and a blocked nose.' : 'You wake on the pavement, chilled and feeling unwell.',
    })
    else presentWakeEvent(wakeEvent, 'Sleep complete', completionText, wakeState)
  }

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

  function respondToRain(choice: RainChoice) {
    if (!game.rain || game.rain.choice) return
    const rain = chooseRain(game.rain, choice, absoluteMinutes(game), current.id)
    setRainChoice(false)
    setGame(previous => previous.rain?.id === rain.id && !previous.rain.choice ? { ...previous, rain } : previous)
  }

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

  function attemptFareDodge() {
    if (freeTransitActive || sleepChoice || shelterQueue || shelterDeparture || shelterCheckoutDue) return
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
    setDiceCheck({ choice, roll: null, modifier: checkModifier(choice), resolved: false, fareDodgeDestinationId: destination.id })
  }

  function startTravel(mode: TravelMode) {
    if (sleepChoice || shelterQueue || shelterDeparture || shelterCheckoutDue) return
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

  function actionUnavailableReason(action: (typeof actions)[number]): string | null {
    const id = action.id
    if (action.locationId !== current.id) return 'This action is available at another location.'
    if (current.id === 'shelter' && !shelterBooked && id !== 'shelter-rest') return 'Register for a place first.'
    if (current.id === 'shelter' && shelterBooked && !shelterAdmitted && id !== 'shelter-social-worker') return 'Entry 18:00–22:00. You are outside; missing entry counts as a missed night.'
    if (id === 'shelter-rest') {
      if ((life.shelterBlockedUntilDay ?? 0) > game.day) return `Registration blocked until Day ${displayDay(life.shelterBlockedUntilDay ?? game.day)}.`
      if (!shelterBooked) {
        if (life.shelterRegistrationAttemptDay === game.day) return 'You already queued today. Arrive before 18:00 tomorrow.'
        if (game.minutes < 480 || game.minutes >= 1320) return 'Come back during the day to queue. Doors 18:00 · registration 18:20–22:00.'
        return null // Waiting outside is possible before the doors open.
      } else {
        if (!open) return 'Night shelter opens at 18:00.'
        if (!shelterAdmitted) return 'Entry 18:00–22:00. You are outside; missing entry counts as a missed night.'
        if (game.intoxication > 10) return 'Too intoxicated: sober up before using your bed.'
      }
    }
    if (id === 'shelter-social-worker') {
      if ((weekday(game.day) !== 'Tu' && weekday(game.day) !== 'Fr') || game.minutes < 960 || game.minutes >= 1200) return 'Social worker: Tuesday / Friday, 16:00–20:00.'
      return null // Appointment hours are separate from overnight opening hours.
    }
    if (id === 'shelter-dinner') {
      if (game.minutes < 1140 || game.minutes >= 1230) return 'Dinner 19:00–20:30.'
      if (life.shelterDinnerDay === game.day) return 'You already had dinner today.'
    }
    if (id === 'shelter-breakfast') {
      if (game.minutes < 390 || game.minutes >= 420) return 'Breakfast 06:30–07:00.'
      if (life.shelterBreakfastDay === game.day) return 'You already had breakfast today.'
    }
    if (id === 'shelter-laundry-drop') {
      if (weekday(game.day) !== 'Th' || game.minutes < 390 || game.minutes >= 480) return 'Leave laundry: Thursday, 06:30–08:00.'
      if (life.shelterLaundryDropDay === game.day) return 'Your clothes are already in the laundry.'
    }
    if (id === 'shelter-laundry-pickup') {
      if (weekday(game.day) !== 'Th' || game.minutes < 1080 || game.minutes >= 1320) return 'Collect laundry: Thursday, 18:00–22:00.'
      if (life.shelterLaundryDropDay !== game.day) return 'Leave your clothes for laundry first.'
    }
    if (!open && action.requiresOpen !== false) return `Closed · opens at ${formatTime(current.open)}.`
    if (current.id === 'shelter' && (game.minutes >= 1320 || game.minutes < 360) && id !== 'shelter-rest') return 'Quiet hours 22:00–06:00 · sleeping only.'
    if (id.endsWith('-refill-water')) {
      if (inventory.water >= FREE_WATER_LIMIT) return 'You already carry 4 or more water portions.'
      if (backpackSlots({ ...inventory, water: FREE_WATER_LIMIT }) > BACKPACK_CAPACITY) return 'Backpack full · make room for water.'
    }
    if (action.cost && game.money < action.cost) return `Need ${action.cost.toFixed(2)} zł.`
    return null
  }

  function actImpl(actionId: string) {
    const action = actions.find((x) => x.id === actionId)
    if (!action || action.locationId !== current.id || activeEvent || shelterQueue) return
    const unavailable = actionUnavailableReason(action)
    if (unavailable) { setMessage(unavailable); return }
    if (actionId === 'shelter-social-worker') {
      const workerDay = weekday(game.day)
      if ((workerDay !== 'Tu' && workerDay !== 'Fr') || game.minutes < 960 || game.minutes >= 1200) {
        setMessage('The shelter social worker is available Tuesdays and Fridays from 16:00 to 20:00.')
        return
      }
      if ((life.shelterUntilDay ?? 0) < game.day) {
        setMessage('There is no active shelter booking to extend. Register at the shelter first.')
        return
      }
      setShelterInterview({ step: 'reason' })
      setMessage('The social worker asks why you still need the shelter place.')
      return
    }
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
    if (actionId === 'shelter-dinner') {
      if (game.minutes < 1140 || game.minutes >= 1230) { setMessage('Dinner is served from 19:00 to 20:30.'); return }
      if (life.shelterDinnerDay === game.day) { setMessage('You already had dinner here today.'); return }
      setLife((status) => ({ ...status, shelterDinnerDay: game.day }))
    }
    if (actionId === 'shelter-breakfast') {
      if (game.minutes < 390 || game.minutes >= 420) { setMessage('Breakfast is served from 06:30 to 07:00.'); return }
      if (life.shelterBreakfastDay === game.day) { setMessage('You already had breakfast here today.'); return }
      setLife((status) => ({ ...status, shelterBreakfastDay: game.day }))
    }
    if (actionId === 'shelter-laundry-drop') {
      if (weekday(game.day) !== 'Th' || game.minutes < 390 || game.minutes >= 480) { setMessage('Laundry can be left on Thursday morning, 06:30–08:00.'); return }
      if (life.shelterLaundryDropDay === game.day) { setMessage('Your clothes are already in the laundry. Collect them this evening.'); return }
      setLife((status) => ({ ...status, shelterLaundryDropDay: game.day }))
    }
    if (actionId === 'shelter-laundry-pickup') {
      if (weekday(game.day) !== 'Th' || game.minutes < 1080 || game.minutes >= 1320) { setMessage('Clean laundry can be collected Thursday evening, 18:00–22:00.'); return }
      if (life.shelterLaundryDropDay !== game.day) { setMessage('You did not leave clothes for laundry this morning.'); return }
      setLife((status) => ({ ...status, shelterLaundryDropDay: undefined }))
    }
    if (actionId === 'shelter-rest') {
      const blocked = (life.shelterBlockedUntilDay ?? 0) > game.day
      if (blocked) { setMessage(`You lost your shelter place. You can register again on Day ${displayDay(life.shelterBlockedUntilDay ?? game.day)}.`); return }
      const activeBooking = (life.shelterUntilDay ?? 0) >= game.day
      if (!activeBooking) {
        if (game.minutes < 480 || game.minutes >= 1320) { setMessage('Queue during the day. Doors open at 18:00; registration starts at 18:20.'); return }
        if (life.shelterRegistrationAttemptDay === game.day) { setMessage('You already waited for registration today. Arrive before 18:00 tomorrow.'); return }
        // Arrival, rather than the time the registration button is pressed,
        // fixes priority while the player stays here. Vacancies never reroll.
        const vacancies = life.shelterVacancyDay === game.day ? life.shelterVacancies ?? 0 : Math.floor(Math.random() * 4)
        const arrivalMinute = shelterArrival?.day === game.day ? shelterArrival.minute : game.minutes
        const peopleAhead = shelterPeopleAhead(arrivalMinute)
        const total = shelterQueueMinutes(game.minutes)
        setLife(status => ({ ...status, shelterVacancyDay: game.day, shelterVacancies: vacancies, shelterRegistrationAttemptDay: game.day }))
        setShelterQueue({ day: game.day, remaining: total, total, arrivalMinute, joinedAt: game.minutes, vacancies, peopleAhead, before: resultSnapshot() })
        setMusicOn(false)
        setMessage('You join the queue. Doors open at 18:00; registration starts at 18:20. Your arrival time keeps your priority while you stay here.')
        return
      }
      requestSleep('shelter')
      return
    }
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

    if (actionId === 'street-sleep') {
      setLife((status) => ({ ...status, housing: 'Street', housingUntil: undefined }))
      const wakeEvent = nextStreetEvent('wake', { locationId: current.id, weather: weather.label, housing: 'Street', documents: inventory.documents, sleepKind: current.id === 'station' ? 'bench' : 'ground', seenEventIds: encounters.seen })
      presentWakeEvent(wakeEvent, action.name, result.message ?? 'Time passes.')
    } else if (actionId === 'shelter-rest' && result.minutes >= 8 * 60) {
      setLife((status) => ({ ...status, housing: 'Night shelter', housingUntil: absoluteMinutes(next) }))
      const wakeEvent = nextStreetEvent('wake', { locationId: current.id, weather: weather.label, housing: 'Night shelter', documents: inventory.documents, seenEventIds: encounters.seen })
      presentWakeEvent(wakeEvent, action.name, result.message ?? 'Time passes.')
    } else {
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

  function answerShelterInterviewImpl(value: string) {
    if (!shelterInterview) return
    if (shelterInterview.step === 'reason') {
      setShelterInterview({ ...shelterInterview, reason: value, step: 'action' })
      return
    }
    if (shelterInterview.step === 'action') {
      setShelterInterview({ ...shelterInterview, action: value, step: 'plan' })
      return
    }
    const renewals = life.shelterRenewals ?? 0
    const realProgress = life.employment === 'Day work' || life.schroniskoReferral || shelterInterview.action === 'documents'
    const constructive = value !== 'nothing'
    let extension = renewals === 0 ? 30 : realProgress && constructive ? 30 : constructive ? 14 : 7
    if (renewals >= 2 && !realProgress) extension = constructive ? 14 : 7
    const plan = value === 'jobcenter' || value === 'daywork' || value === 'documents' || value === 'benefits' ? value : undefined
    setLife((status) => ({ ...status, shelterUntilDay: game.day + extension - 1, shelterRenewals: renewals + 1, shelterPlan: plan }))
    setGame((prev) => applyAction(prev, { minutes: 30, mood: extension >= 14 ? 3 : -2 }))
    setMessage(`After the interview, your shelter place is extended for ${extension} days.${plan ? ' The social worker expects you to follow the plan you agreed to.' : ''}`)
    setShelterInterview(null)
  }

  function applyEventOutcomeImpl(outcome: EventOutcome) {
    const { rejected } = fitEventSupplies(inventory, outcome)
    const knownPlaces = outcome.knownLocations?.filter(id => discoveredLocations.includes(id)).map(id => locations.find(place => place.id === id)?.name).filter(Boolean)
    const knowledgeText = knownPlaces
      ? `\n\n${knownPlaces.length ? `You already know about: ${knownPlaces.join(', ')}.` : 'You’re not sure where to start yet.'}\n\nYou can find out more by asking around or searching on your phone.`
      : ''
    const outcomeText = rejected.length ? `There was no backpack room for ${rejected.join(' and ')}; you left it behind.` : outcome.message + knowledgeText
    if (activeEvent?.illustration || outcome.illustration) {
      const place = locations.find(location => location.id === outcome.discoverLocation)
      const end = absoluteMinutes(game) + (outcome.minutes ?? 0)
      const goalDay = Math.floor(end / 1440) + 1 + (end % 1440 >= 1320 ? 1 : 0)
      setInfoModal(previous => ({ ...previous, title: activeEvent?.title ?? 'After your choice', text: outcomeText, illustration: rejected.length ? activeEvent?.illustration : outcome.illustration ?? activeEvent?.illustration, illustrationAlt: outcomeText,
        visibleStats: ['night-rustle', 'park-company'].includes(activeEvent?.id ?? '') && outcome.energy ? ['Energy'] : activeEvent?.id === 'borrow-phone-slip' && outcome.phoneCondition ? ['Phone condition'] : undefined,
        batteryInSummary: !!outcome.phoneBattery,
        ...(place ? { presentation: { ...locationPresentation([place.id], 'On map'), lead: outcomeText,
          ...(place.id === 'shelter' ? { notice: `Arrive before 18:00 on Day ${displayDay(goalDay)}. Doors open at 18:00; registration starts at 18:20.` } : {}) } } : {}) }))
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

  function checkModifier(choice: StreetEventChoice) {
    if (choice.check?.stat === 'persuasion') {
      const hygiene = game.hygiene >= 80 ? 2 : game.hygiene >= 60 ? 1 : game.hygiene < 20 ? -3 : game.hygiene < 40 ? -2 : 0
      const mood = game.mood >= 75 ? 1 : game.mood < 25 ? -1 : 0
      return hygiene + mood
    }
    if (game.energy >= 80) return 2
    if (game.energy >= 60) return 1
    if (game.energy < 20) return -2
    if (game.energy < 40) return -1
    return 0
  }

  function checkUnavailableReason(choice: StreetEventChoice) {
    if (choice.undiscoveredLocationRequired && discoveredLocations.includes(choice.undiscoveredLocationRequired)) {
      const place = locations.find(location => location.id === choice.undiscoveredLocationRequired)
      return `You already know about the ${place?.name ?? 'location'}.`
    }
    if (choice.moneyRequired !== undefined && game.money < choice.moneyRequired) return `Need ${choice.moneyRequired} zł`
    if (choice.phoneBatteryRequired !== undefined) {
      if (phoneUnavailable) return phoneUnavailable
      if (inventory.phoneBattery < choice.phoneBatteryRequired) return `Need ${choice.phoneBatteryRequired}% battery`
    }
    const requirements = choice.check?.requirements
    if (!requirements) return null
    if (requirements.minHealth !== undefined && game.health < requirements.minHealth) return `Too weak · need Health ${requirements.minHealth}`
    if (requirements.minEnergy !== undefined && game.energy < requirements.minEnergy) return `Too exhausted · need Energy ${requirements.minEnergy}`
    return null
  }

  function resolveStreetEvent(choice: StreetEventChoice) {
    if (checkUnavailableReason(choice)) return
    if (choice.followUp && Math.random() < choice.followUp.chance) {
      const event = STREET_EVENTS.find(event => event.id === choice.followUp!.eventId && event.continuationOnly)
      if (event) {
        setEncounters(previous => ({ ...previous, seen: [...new Set([...previous.seen, event.id])], pendingId: event.id, pendingRoll: null }))
        setActiveEvent(illustrateStreetEvent(event, { locationId: game.locationId, housing: life.housing }))
        return
      }
    }
    if (choice.check) {
      const unavailable = checkUnavailableReason(choice)
      if (unavailable) return
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
    const check = diceCheck.choice.check
    const roll = diceCheck.roll
    const success = roll === 20 || (roll !== 1 && roll + diceCheck.modifier >= check.dc)
    const outcome = roll === 20 && check.criticalSuccess
      ? check.criticalSuccess
      : roll === 1 && check.criticalFailure
        ? check.criticalFailure
        : success ? check.success : check.failure
    applyEventOutcome(outcome, diceCheck.stealItemId ? success ? 'Item stolen' : 'Caught stealing' : undefined)
    if (diceCheck.fareDodgeDestinationId) {
      const destination = locations.find((entry) => entry.id === diceCheck.fareDodgeDestinationId)
      if (destination) {
        const total = randomTravelMinutes(destinationTravelTimeRange(destination, 'fare-dodge'))
        setLeftHome(true)
        recordShelterDeparture(destination.id)
        setStreetBenchFound(false)
        setTrip({ destinationId: destination.id, mode: 'fare-dodge', total, remaining: total, before: { ...resultSnapshot(), game: applyAction(game, { ...outcome, minutes: outcome.minutes ?? 0 }) } })
        setSelectedDestination(null)
        setScreen('travel')
      }
    }
    if (diceCheck.stealItemId && success) {
      const item = SHOP_ITEMS.find((entry) => entry.id === diceCheck.stealItemId)
      if (item) setInventory((prev) => addShopItem(prev, item))
    }
    setDiceCheck(null)
    setActiveEvent(null)
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

  function stealItem(item: ShopItem) {
    if (!open || current.id !== 'shop') return
    if (!canAddToBackpack(inventory, item)) {
      setMessage('Backpack full. You have nowhere to hide the item.')
      return
    }
    const choice: StreetEventChoice = {
      label: `Steal ${item.name} · Reflex DC 12`,
      check: {
        stat: 'reflex', dc: 12,
        success: { minutes: 5, message: `You steal ${item.name} without being stopped.` },
        failure: { minutes: 5, mood: -8, moveToStreet: true, message: 'The shopkeeper catches you and orders you out. You find yourself back on the street, empty-handed.' },
        criticalSuccess: { minutes: 3, mood: 2, message: `Perfect timing. You take ${item.name} without drawing attention.` },
        criticalFailure: { minutes: 10, mood: -12, moveToStreet: true, message: 'The shopkeeper spots your attempt immediately and orders you out. You find yourself back on the street, empty-handed.' },
      },
    }
    setDiceCheck({ choice, roll: null, modifier: checkModifier(choice), resolved: false, stealItemId: item.id })
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
    setShelterQueue(null)
    setShelterArrival(null)
    setShelterDeparture(null)
    setSelectedDestination(null)
    setMusicOn(false)
    setStreetBenchFound(false)
    setBegging({ day: 1, attempts: 0 })
    setShelterPhoneCharging(false)
    localStorage.removeItem(SHELTER_PHONE_CHARGE_KEY)
    setActiveEvent(null)
    ambientEventClock.current = { locationId: 'street', minutes: 0 }
    openingSearchObservation.current = false
    setFirstNightEvents({ seen: [], lastAt: null, pendingId: null })
    setLeftHome(false)
    localStorage.removeItem(LEFT_HOME_KEY)
    localStorage.removeItem(FIRST_NIGHT_EVENTS_KEY)
    setEncounters({ seen: [], lastAt: null, pendingId: null })
    localStorage.removeItem(ENCOUNTERS_KEY)
    setDiceCheck(null)
    laundryCleanAt.current = -1
    groundSleepWindow.current = null
    setInventory(INITIAL_INVENTORY)
    setStorage(INITIAL_STORAGE)
    setLife(INITIAL_LIFE)
    setEffects([])
    setSleeping(null)
    setSleepChoice(null)
    setSleepHours(8)
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

    {selectedDestination && screen === 'map' && (() => {
      const destination = locations.find((x) => x.id === selectedDestination)
      if (!destination) return null
      const transitMinutes = Math.ceil(destination.travelMinutes * 0.5)
      const nearbyTime = destination.travelRange ? `${destination.travelRange.min}–${destination.travelRange.max}m` : null
      return <ModalOverlay className="travel-choice-overlay"><ModalPanel className="travel-sheet" role="dialog" aria-modal="true" aria-label={`Travel to ${destination.name}`} tabIndex={-1} ref={travelChoiceRef}>
        <button className="sheet-close" aria-label="Close travel options" onClick={() => setSelectedDestination(null)}>×</button>
        <p className="eyebrow">TRAVEL TO</p>
        <h2><Icon name={locationIcon(destination.id)} /> {destination.name}</h2>
        <ChoiceOptions seed={choiceSeed} decision={`${choiceDecisionKey}|travel:${destination.id}`}>
        <button className="travel-option" onClick={() => startTravel('walk')}>
          <img className="travel-option-walker" src="/street-life-game/assets/travel-walker.webp" width="24" height="24" alt="" aria-hidden="true" /><div><strong>Walk</strong><small>≈{nearbyTime ?? formatTravelTime(destination.travelMinutes)} · free · more hunger & thirst</small></div>
        </button>
        <button className="travel-option" onClick={() => startTravel('transit')} disabled={!freeTransitActive && game.money < 4.4}>
          <Icon name="bus" /><div><strong>Public transport</strong><small>≈{nearbyTime ?? formatTravelTime(transitMinutes)} · {freeTransitActive ? 'FREE' : '4.40 zł'} · {nearbyTime ? 'includes waiting' : 'less physical strain'}</small></div>
        </button>
        {!freeTransitActive && <button className="travel-option" onClick={attemptFareDodge}>
          <Icon name="coins" /><div><strong>Ride without ticket</strong><small>≈{nearbyTime ?? formatTravelTime(transitMinutes)} · free{nearbyTime ? ' · includes waiting' : ''}</small><small>Risk: 20–35 zł fine</small></div>
        </button>}
        </ChoiceOptions>

      </ModalPanel></ModalOverlay>
    })()}

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
      onFindProperShelter={() => {
        const rain = chooseRain(game.rain!, 'proper', absoluteMinutes(game), current.id)
        setGame(previous => previous.rain?.id === rain.id ? { ...previous, rain: { ...rain, choiceAt: previous.rain.choiceAt } } : previous)
      }}
      onContinue={() => setGame(previous => previous.rain ? { ...previous, rain: { ...previous.rain, choice: 'continue', searchRemaining: 0 } } : previous)}
    />}
    {!gameOver && diceCheck?.choice.check && <ModalOverlay className="dice-overlay" role="dialog" aria-modal="true" aria-labelledby="dice-action-title">
      <ModalPanel size="compact" className="dice-card">
        <h2 id="dice-action-title">{diceCheck.stealItemId ? `Steal ${SHOP_ITEMS.find(item => item.id === diceCheck.stealItemId)?.name.toLowerCase()}?` : diceCheck.choice.label.replace(/ · .* DC \d+$/, '')}</h2>
        <p className="dice-description modal-narrative">{diceCheck.stealItemId ? 'Try to take it without being noticed. If you’re caught, you’ll be thrown out without the item.' : diceCheck.fareDodgeDestinationId ? 'Try to ride without a ticket. If an inspector catches you, you’ll have to pay a penalty.' : activeEvent?.text}</p>
        <p className="eyebrow">{diceCheck.choice.check.stat.toUpperCase()} CHECK</p>
        <div className={diceCheck.roll === null ? 'd20 rolling-ready' : diceCheck.roll === 20 ? 'd20 critical' : diceCheck.roll === 1 ? 'd20 critical-fail' : 'd20'} aria-label={diceCheck.roll === null ? 'D20' : `Rolled ${diceCheck.roll}`}><Icon name="dice" />{diceCheck.roll !== null && <span>{diceCheck.roll}</span>}</div>
        <div className="dice-math" aria-label={`${diceCheck.choice.check.stat === 'persuasion' ? 'Hygiene and Mood' : 'Energy'} modifier ${diceCheck.modifier}; target ${diceCheck.choice.check.dc}`}>{diceCheck.roll === null ? `D20 ${diceCheck.modifier >= 0 ? '+' : '−'} ${Math.abs(diceCheck.modifier)} ≥ ${diceCheck.choice.check.dc}` : `${diceCheck.roll} ${diceCheck.modifier >= 0 ? '+' : '−'} ${Math.abs(diceCheck.modifier)} = ${diceCheck.roll + diceCheck.modifier}`}</div>
        {diceCheck.roll === null
          ? <div className="dice-actions"><ModalAction className="dice-attempt" onClick={rollDice}>{diceCheck.stealItemId ? 'Try to steal' : diceCheck.choice.label.replace(/ · .* DC \d+$/, '')}</ModalAction><ModalAction variant="secondary" className="dice-cancel" onClick={() => setDiceCheck(null)}>Cancel</ModalAction></div>
          : <><strong className="dice-result">{diceCheck.roll === 20 ? 'CRITICAL SUCCESS' : diceCheck.roll === 1 ? 'CRITICAL FAILURE' : diceCheck.roll + diceCheck.modifier >= diceCheck.choice.check.dc ? 'SUCCESS' : 'FAILURE'}</strong><ModalAction onClick={acceptDiceResult}>Continue</ModalAction></>}
      </ModalPanel>
    </ModalOverlay>}

    {!gameOver && shelterQueue && <ModalOverlay className="sleep-overlay queue-overlay timed-overlay" role="dialog" aria-modal="true" aria-label="Shelter registration queue">
      <ModalPanel size="compact" className="sleep-card timed-card rest-card">
        <div className="timed-heading"><Icon name="clock" /><div><p className="eyebrow">NIGHT SHELTER</p><h2>Registration queue</h2></div></div>
        <p className="timed-description modal-narrative">{game.minutes < SHELTER_ENTRY_OPEN ? 'Waiting outside. Doors open at 18:00.' : game.minutes < SHELTER_REGISTRATION_OPEN ? 'Waiting inside. Registration starts at 18:20.' : 'Waiting for your turn. A bed isn’t guaranteed.'}</p>
        <div className="sleep-clock"><strong>{formatTime(game.minutes)}</strong><span>{shelterQueue.remaining} min remaining</span></div>
        <div className="sleep-progress" role="progressbar" aria-label="Registration queue progress" aria-valuemin={0} aria-valuemax={shelterQueue.total ?? SHELTER_QUEUE_MINUTES} aria-valuenow={(shelterQueue.total ?? SHELTER_QUEUE_MINUTES) - shelterQueue.remaining}><i style={{ width: `${(1 - shelterQueue.remaining / (shelterQueue.total ?? SHELTER_QUEUE_MINUTES)) * 100}%` }} /></div>
        <p className="timed-footnote">Arrived at {formatTime(shelterQueue.arrivalMinute ?? shelterQueue.joinedAt)} · {shelterQueue.peopleAhead} ahead of you. Today’s availability: 0–3 places.</p>
      </ModalPanel>
    </ModalOverlay>}

    {!gameOver && shelterCheckoutDue && !sleeping && !infoModal && !pendingResult && !activeEvent && !diceCheck && <ModalOverlay className="sleep-overlay checkout-overlay timed-overlay" role="dialog" aria-modal="true" aria-label="Leave the night shelter">
      <ModalPanel size="compact" className="sleep-card timed-card">
        <div className="timed-heading"><Icon name="backpack" /><div><p className="eyebrow">MORNING CHECKOUT</p><h2>Time to leave the night shelter</h2></div></div>
        <p className="timed-description modal-narrative">You must leave by 08:00. Packing and leaving takes 30 minutes.</p>
        <div className="sleep-clock"><strong>{formatTime(game.minutes)}</strong><span>On the street at {formatTime((game.minutes + SHELTER_DEPARTURE_MINUTES) % 1440)}</span></div>
        <ModalAction className="checkout-start" autoFocus onClick={startShelterDeparture}>Leave the night shelter · 30 min</ModalAction>
      </ModalPanel>
    </ModalOverlay>}

    {!gameOver && shelterDeparture && <ModalOverlay className="sleep-overlay checkout-overlay timed-overlay" role="dialog" aria-modal="true" aria-label="Leaving the night shelter">
      <ModalPanel size="compact" className="sleep-card timed-card">
        <div className="timed-heading"><Icon name="backpack" /><div><p className="eyebrow">MORNING CHECKOUT</p><h2>Leaving the night shelter</h2></div></div>
        <p className="timed-description modal-narrative">Packing your things and heading outside.{shelterPhoneCharging && ' Your phone keeps charging until you collect it on the way out.'}</p>
        <div className="sleep-clock"><strong>{formatTime(game.minutes)}</strong><span>{shelterDepartureRemaining} min remaining</span></div>
        <div className="sleep-progress" role="progressbar" aria-label="Packing progress" aria-valuemin={0} aria-valuemax={SHELTER_DEPARTURE_MINUTES} aria-valuenow={SHELTER_DEPARTURE_MINUTES - shelterDepartureRemaining}><i style={{ width: `${(1 - shelterDepartureRemaining / SHELTER_DEPARTURE_MINUTES) * 100}%` }} /></div>
        <p className="timed-footnote"><Icon name="clock" />On the street at {formatTime((shelterDeparture.startAbsolute + SHELTER_DEPARTURE_MINUTES) % 1440)}</p>
      </ModalPanel>
    </ModalOverlay>}

    {sleeping && <ModalOverlay className="sleep-overlay timed-overlay" role="dialog" aria-modal="true" aria-label="Sleeping">
      <ModalPanel size="compact" className="sleep-card timed-card rest-card">
        <SleepHeading kind={sleeping.kind} />
        <p className="timed-description modal-narrative">{sleeping.kind === 'shelter' ? 'Resting in your reserved bed.' : sleeping.kind === 'residential' ? 'Resting in your room.' : sleeping.kind === 'bench' ? 'Resting on a bench, still exposed.' : 'Resting on the ground, out in the open.'}</p>
        <div className="sleep-clock"><strong>{formatTime(game.minutes)}</strong><span>Wake at {formatTime((sleeping.startAbsolute + sleeping.total) % 1440)}</span></div>
        {(() => {
          const elapsed = Math.min(sleeping.total, Math.max(0, Math.floor(((Date.now() - sleeping.realStartedAt) / 1000) * DEBUG_SLEEP_SPEED)))
          return <>
            <div className="sleep-progress" role="progressbar" aria-label="Sleep progress" aria-valuemin={0} aria-valuemax={sleeping.total} aria-valuenow={elapsed}><i style={{ width: `${(elapsed / sleeping.total) * 100}%` }} /></div>
            <div className="timed-progress-detail"><span>{Math.floor(elapsed / 60)}h {elapsed % 60}m of {formatTravelTime(sleeping.total)}</span><span>×{DEBUG_SLEEP_SPEED}</span></div>
          </>
        })()}
        <p className="timed-footnote">{sleeping.kind === 'shelter' ? 'Sleep ends by 07:30 for morning checkout.' : 'You cannot perform other actions until you wake up.'}</p>
        <button className="sleep-debug-wake" onClick={() => { const active = sleeping; setSleeping(null); finishSleep(active) }}>Wake up (debug)</button>
      </ModalPanel>
    </ModalOverlay>}

    {!gameOver && activeEvent && !diceCheck && !sleeping && !infoModal && !pendingResult && <EventDialog
      event={activeEvent} choices={visibleEventChoices} onChoose={resolveStreetEvent} unavailableReason={checkUnavailableReason}
      orderSeed={choiceSeed} decisionKey={choiceDecisionKey} panelRef={eventModalRef}
    />}

    {autosave.saveFailed && <p role="alert" className="save-warning">Progress could not be saved on this device. Keep the game open and try again.</p>}
    <footer inert={activityOverlay || eventInteractionBlocked} aria-hidden={eventInteractionBlocked || undefined} className={eventInteractionBlocked ? 'event-background-blocked' : undefined}><button className="reset" disabled={eventInteractionBlocked} onClick={() => { if (!eventInteractionBlocked) reset() }}>Reset save</button><small className="header-version" title={BUILD_VERSION} aria-label={`Build ${BUILD_VERSION}`}>v{BUILD_VERSION.split('-').pop()}</small></footer>
    <BottomNavigation screen={screen} blocked={eventInteractionBlocked} phoneBusy={!!phoneActivity} travelling={travelling} current={current} mood={game.mood} onNavigate={setScreen} />
  </main>
}
