import { Children, Fragment, cloneElement, isValidElement, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { actions, applyAction as applyGameAction, applySleepTime as applyGameSleepTime, WEATHER, temperatureAt, energyCap, formatTime, initialState, createInitialState, isOpen, locations, type ActionResult, type GameState } from './game'
import { pickStreetEvent, type EventOutcome, type StreetEvent, type StreetEventChoice } from './events'
import { summarizeResult, type ResultSnapshot, type ResultSummary } from './results'
import { BatteryIcon, Icon, choiceIcon, locationIcon, type IconName } from './Icon'
import CityMap from './CityMap'
import ShopCard from './ShopCard'
import ClosedContent from './ClosedContent'
import ResultCard, { type ResultCardData } from './ResultCard'
import { questionPresentation } from './resultPresentation'

const BUILD_VERSION = 'v2026.10.11-112'

const PHONE_ACTIVITY_KEY = 'street-life-phone-activity-v1'
const PHONE_SEARCH_ESTIMATE = 15
const PHONE_SEARCH_MIN = 10
const PHONE_SEARCH_MAX = 25
const PHONE_SEARCH_DRAIN_PER_MINUTE = 0.2
type PhoneActivity = { questionId: string; total: number; remaining: number; before: ResultSnapshot }

function loadPhoneActivity(): PhoneActivity | null {
  try {
    const saved = JSON.parse(localStorage.getItem(PHONE_ACTIVITY_KEY) ?? 'null')
    if (!saved || !['morning', 'bed', 'no-place', 'supplies'].includes(saved.questionId) || !Number.isInteger(saved.remaining) || saved.remaining < 0 || saved.remaining > 30 || !saved.before?.game || !saved.before?.inventory || !Array.isArray(saved.before?.effects) || loadGame().locationId !== 'street') return null
    // Older fixed searches retain the ten-minute migration; new searches keep
    // their originally selected duration across reloads.
    const elapsed = absoluteMinutes(loadGame()) - absoluteMinutes(saved.before.game)
    if (!Number.isFinite(elapsed) || elapsed < 0) return null
    const total = Number.isInteger(saved.total) && saved.total >= PHONE_SEARCH_MIN && saved.total <= PHONE_SEARCH_MAX ? saved.total : 10
    return { ...saved, total, remaining: Math.min(saved.remaining, Math.max(0, total - elapsed)) }
  } catch { return null }
}

const SAVE_KEY = 'street-life-save-v3'
const DISCOVERY_KEY = 'street-life-discovered-v1'
const GOAL_KEY = 'street-life-goal-v1'
const JOURNAL_GOALS_KEY = 'street-life-journal-goals-v1'
const JOURNAL_HISTORY_KEY = 'street-life-journal-history-v1'
type JournalEntry = { day: number; minute: number; title: string; text: string; summary: ResultSummary }
type JournalGoals = { morning: boolean; shelter: boolean; support: boolean; work: boolean }
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function weekday(day: number) {
  return WEEKDAYS[(day - 1) % WEEKDAYS.length]
}

function formatTravelTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

type Screen = 'location' | 'map' | 'inventory' | 'status' | 'journal' | 'travel'
type TravelMode = 'walk' | 'transit' | 'fare-dodge'
type Trip = { destinationId: string; mode: TravelMode; total: number; remaining: number; before?: ResultSnapshot }
type ShelterDeparture = { day: number; startAbsolute: number; before: ResultSnapshot }
type ShelterQueue = { day: number; remaining: number; joinedAt: number; vacancies: number; peopleAhead: number; before: ResultSnapshot }
type SleepState = { kind: 'ground' | 'bench' | 'shelter' | 'residential'; total: number; remaining: number; startAbsolute: number; realStartedAt: number; realWakeAt: number; forced?: boolean; before?: ResultSnapshot }
type Inventory = { clothingCleanliness: number; showerGel: number; bread: number; breadFreshness: number; cannedFood: number; wipes: number; water: number; food: number; foodFreshness: number; bottles: number; phoneBattery: number; phoneCondition: number; jacket: number; documents: boolean; cigarettes: number; medicines: number; transitCard: boolean }
type ShopItem = { id: 'water' | 'food' | 'bread' | 'cannedFood' | 'wipes' | 'showerGel' | 'cigarettes' | 'medicines'; name: string; icon: string; price: number; quantity: number; description: string; impacts: string[] }
type EffectId = 'cold' | 'free-transit' | 'well-fed'
type ActiveEffect = { id: EffectId; expiresAt: number }
type LifeSituation = { housing: 'Street' | 'Night shelter' | 'Schronisko'; housingUntil?: number; employment: 'Unemployed' | 'Day work'; income: 'None' | 'Irregular'; schroniskoReferral?: boolean; shelterRegisteredDay?: number; shelterUntilDay?: number; shelterLastStayDay?: number; shelterAuditDay?: number; shelterMisses?: number; shelterMissMonth?: number; shelterStrikes?: number; shelterBlockedUntilDay?: number; shelterRenewals?: number; shelterPlan?: 'jobcenter' | 'daywork' | 'documents' | 'benefits'; shelterDinnerDay?: number; shelterBreakfastDay?: number; shelterLaundryDropDay?: number; shelterVacancyDay?: number; shelterVacancies?: number; shelterRegistrationAttemptDay?: number; shelterCheckoutDay?: number }
type StoredItems = { documents: boolean; medicines: number; cigarettes: number; food: number; foodFreshness: number }
type TrashItem = { id: number; layer: number; icon: string; x: number; y: number; rotation: number; scale: number; bottle: boolean; returnable: boolean; collected?: boolean; cleared?: boolean }

const INITIAL_LIFE: LifeSituation = { housing: 'Street', employment: 'Unemployed', income: 'None', shelterMisses: 0, shelterStrikes: 0 }
const INITIAL_INVENTORY: Inventory = { clothingCleanliness: 80, showerGel: 0, bread: 0, breadFreshness: 100, cannedFood: 0, wipes: 0, water: 2, food: 2, foodFreshness: 100, bottles: 0, phoneBattery: 62, phoneCondition: 72, jacket: 78, documents: true, cigarettes: 0, medicines: 2, transitCard: true }
const BACKPACK_CAPACITY = 8
const INITIAL_STORAGE: StoredItems = { documents: false, medicines: 0, cigarettes: 0, food: 0, foodFreshness: 100 }
const SCHRONISKO_FOOD_CAPACITY = 4
const FOOD_FRESHNESS_PER_MINUTE = 100 / (48 * 60)
const BREAD_FRESHNESS_PER_MINUTE = 100 / (24 * 60)
const WIPES_STACK_SIZE = 5
const SHOWER_GEL_USES_PER_SLOT = 20
const NIGHT_SHELTER_STORAGE = 6
const SCHRONISKO_STORAGE = 16
const STACK_SIZE = 4
const CIGARETTE_STACK_SIZE = 20
const BOTTLE_STACK_SIZE = 8
const BOTTLE_DEPOSIT = 0.5
const SLEEP_HOURS = [2, 4, 6, 8] as const
const DEBUG_SLEEP_SPEED = 10
const SHELTER_CHECKOUT_WARNING = 7 * 60 + 30
const SHELTER_DEPARTURE_MINUTES = 30
const SHELTER_QUEUE_MINUTES = 20
const SHELTER_REGISTRATION_OPEN = 19 * 60
const EFFECTS: Record<EffectId, { icon: string; name: string; kind: 'positive' | 'negative'; impacts: string[] }> = {
  cold: { icon: '🤒', name: 'Cold', kind: 'negative', impacts: ['Energy −−', 'Mood −'] },
  'free-transit': { icon: '🎫', name: 'Free transport', kind: 'positive', impacts: ['Travel +++'] },
  'well-fed': { icon: '🍲', name: 'Well fed', kind: 'positive', impacts: ['Food +++', 'Mood +'] },
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 'water', name: 'Water', icon: '💧', price: 3, quantity: 3, description: '', impacts: ['Thirst +++'] },
  { id: 'food', name: 'Cheap food', icon: '🥪', price: 5, quantity: 1, description: 'Sandwich · stack 4', impacts: ['Food ++', 'Mood +'] },
  { id: 'bread', name: 'Bread roll', icon: '🥖', price: 1, quantity: 1, description: 'Stack 4 · fresh for a short time', impacts: ['Food +'] },
  { id: 'cannedFood', name: 'Canned food', icon: '🥫', price: 6, quantity: 1, description: 'Pull-tab can · stack 4 · keeps well', impacts: ['Food ++', 'Mood +'] },
  { id: 'wipes', name: 'Wet wipes', icon: '🧻', price: 5, quantity: 5, description: '5 uses · stack 5', impacts: ['Hygiene +'] },
  { id: 'showerGel', name: '3-in-1 shower gel', icon: '🧴', price: 10, quantity: 20, description: '20 showers · used automatically', impacts: ['Hygiene +++'] },
  { id: 'cigarettes', name: 'Cigarettes', icon: '🚬', price: 6, quantity: 5, description: 'Pack of 5 · stack 20', impacts: ['Mood +', 'Health −'] },
  { id: 'medicines', name: 'Medicine', icon: '💊', price: 9, quantity: 1, description: 'Basic medicine · stack 4', impacts: ['Removes Cold'] },
]

function foodFreshnessLabel(value: number) {
  if (value > 50) return 'Fresh'
  if (value > 20) return 'Stale'
  return 'Spoiled'
}

function mixFreshness(currentCount: number, currentFreshness: number, addedCount: number, addedFreshness: number) {
  const total = currentCount + addedCount
  return total <= 0 ? 100 : (currentCount * currentFreshness + addedCount * addedFreshness) / total
}

function phoneDrainMultiplier(condition: number) {
  return 1 + (100 - Math.max(0, Math.min(100, condition))) * 0.007
}

function stackSlots(count: number) {
  return count > 0 ? Math.ceil(count / STACK_SIZE) : 0
}

function storageSlots(storage: StoredItems) {
  return (storage.documents ? 1 : 0) + stackSlots(storage.medicines) + (storage.cigarettes > 0 ? Math.ceil(storage.cigarettes / CIGARETTE_STACK_SIZE) : 0)
}

function backpackSlots(inventory: Inventory) {
  return (inventory.showerGel > 0 ? Math.ceil(inventory.showerGel / SHOWER_GEL_USES_PER_SLOT) : 0) + stackSlots(inventory.bread) + stackSlots(inventory.cannedFood) + (inventory.wipes > 0 ? Math.ceil(inventory.wipes / WIPES_STACK_SIZE) : 0) + stackSlots(inventory.water) + stackSlots(inventory.food) + (inventory.bottles > 0 ? Math.ceil(inventory.bottles / BOTTLE_STACK_SIZE) : 0) + (inventory.cigarettes > 0 ? Math.ceil(inventory.cigarettes / CIGARETTE_STACK_SIZE) : 0) + stackSlots(inventory.medicines)
}

function absoluteMinutes(game: GameState) {
  return (game.day - 1) * 1440 + game.minutes
}

// A sheltered night always ends at 07:30, including saved sleep sessions.
function shelterSleepMinutes(startAbsolute: number, requested: number) {
  const minute = startAbsolute % 1440
  const untilCheckout = (minute < SHELTER_CHECKOUT_WARNING ? SHELTER_CHECKOUT_WARNING : 1440 + SHELTER_CHECKOUT_WARNING) - minute
  return Math.min(requested, untilCheckout)
}

function availableSleepHours(energy: number): readonly number[] {
  if (energy > 75) return [2]
  if (energy > 50) return [2, 4]
  if (energy > 25) return [4, 6]
  return [6, 8]
}

function sleepDurationUnavailable(hours: number, energy: number) {
  const available = availableSleepHours(energy)
  if (available.includes(hours)) return null
  return hours < available[0] ? 'Too tired for a short sleep.' : 'Not tired enough for a long sleep.'
}

function remainingEffect(expiresAt: number, game: GameState) {
  const left = Math.max(0, expiresAt - absoluteMinutes(game))
  if (left >= 1440) return `${Math.ceil(left / 1440)} days`
  if (left >= 60) return `${Math.ceil(left / 60)}h`
  return `${left}m`
}

function canAddToBackpack(inventory: Inventory, item: ShopItem) {
  const next = { ...inventory, [item.id]: inventory[item.id] + item.quantity }
  return backpackSlots(next) <= BACKPACK_CAPACITY
}

function addShopItem(inventory: Inventory, item: ShopItem): Inventory {
  const next = { ...inventory, [item.id]: inventory[item.id] + item.quantity }
  if (item.id === 'food') next.foodFreshness = mixFreshness(inventory.food, inventory.foodFreshness, item.quantity, 100)
  if (item.id === 'bread') next.breadFreshness = mixFreshness(inventory.bread, inventory.breadFreshness, item.quantity, 100)
  return next
}

function fitEventSupplies(inventory: Inventory, outcome: EventOutcome) {
  const next = { ...inventory,
    food: Math.max(0, inventory.food + Math.min(0, outcome.food ?? 0)),
    water: Math.max(0, inventory.water + Math.min(0, outcome.water ?? 0)),
  }
  const rejected: string[] = []
  for (const item of ['food', 'water'] as const) {
    const requested = Math.max(0, outcome[item] ?? 0)
    const otherSlots = backpackSlots(next) - stackSlots(next[item])
    const capacity = Math.max(0, BACKPACK_CAPACITY - otherSlots) * STACK_SIZE
    const accepted = Math.min(requested, Math.max(0, capacity - next[item]))
    if (item === 'food' && accepted > 0) next.foodFreshness = mixFreshness(next.food, next.foodFreshness, accepted, 100)
    next[item] += accepted
    if (requested > accepted) rejected.push(`${requested - accepted} ${item}`)
  }
  if (next.food <= 0) next.foodFreshness = 100
  return { inventory: next, rejected }
}

function loadTrip(): Trip | null {
  try {
    const raw = localStorage.getItem('street-life-trip-v1')
    if (!raw) return null
    const saved = JSON.parse(raw) as Trip
    return locations.some(location => location.id === saved.destinationId) &&
      ['walk', 'transit', 'fare-dodge'].includes(saved.mode) &&
      Number.isFinite(saved.total) && saved.total > 0 && Number.isFinite(saved.remaining) &&
      saved.remaining >= 0 && saved.remaining <= saved.total ? saved : null
  } catch { return null }
}

function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    return raw ? { ...initialState, ...JSON.parse(raw) } : createInitialState()
  } catch {
    return createInitialState()
  }
}

// Flatten conditional fragments before sorting, so custom and configured
// actions share one available-first ordering and keep their order within a group.
function AvailableFirst({ children, className, tag = 'section', thoughtsOnly = false, choiceGroups }: { children: ReactNode; className: string; tag?: 'section' | 'div'; thoughtsOnly?: boolean; choiceGroups?: string[][] }) {
  function flatten(nodes: ReactNode): ReactNode[] {
    return Children.toArray(nodes).flatMap(node =>
      isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment ? flatten(node.props.children) : [node])
  }
  function thoughtOnly(node: ReactNode): ReactNode {
    if (!isValidElement<{ children?: ReactNode; 'data-choice'?: string }>(node) || node.type !== 'button') return node
    const icon = choiceIcon(node.props['data-choice'] ?? '')
    return cloneElement(node, {}, Children.toArray(node.props.children)
      .filter(part => !isValidElement(part) || part.type !== 'span')
      .map(part => isValidElement<{ children?: ReactNode }>(part) && part.type === 'div'
        ? cloneElement(part, {}, <Icon name={icon} className="story-action-icon" />, Children.toArray(part.props.children)
          .filter(detail => !isValidElement<{ className?: string }>(detail) || detail.type !== 'small' || detail.props.className === 'choice-estimate')
          .map(detail => isValidElement<{ children?: ReactNode }>(detail) && detail.type === 'strong'
            ? cloneElement(detail, {}, Children.toArray(detail.props.children)
              .filter(text => !isValidElement(text) || text.type !== 'span')
              .map(text => typeof text === 'string' ? text.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]+\s*/u, '') : text))
            : detail))
        : part))
  }
  const nodes = flatten(children).map(node => thoughtsOnly ? thoughtOnly(node) : node)
  const disabled = (node: ReactNode) => isValidElement<{ disabled?: boolean }>(node) && !!node.props.disabled
  if (thoughtsOnly && choiceGroups) {
    const find = (id: string) => nodes.find(node => isValidElement<{ 'data-choice'?: string }>(node) && node.props['data-choice'] === id)
    const selected = choiceGroups.slice(0, 3).flatMap(group => {
      const candidates = group.map(find).filter(node => node !== undefined)
      const selected = candidates.find(node => !disabled(node)) ?? candidates[0]
      return selected ? [selected] : []
    })
    const Tag = tag
    return <Tag className={className}>{selected.filter(node => !disabled(node))}{selected.filter(disabled)}</Tag>
  }
  const available = nodes.filter(node => !disabled(node))
  const unavailable = nodes.filter(disabled)
  const Tag = tag
  return <Tag className={className}>{available}{unavailable.length > 0 && <p className="unavailable-heading">Unavailable now</p>}{unavailable}</Tag>
}

function Stat({ label, value, icon, compact = false }: { label: string; value: number; icon: string; compact?: boolean }) {
  const level = value > 60 ? 'good' : value > 30 ? 'warning' : 'critical'
  return <div className={compact ? 'stat compact' : 'stat'}><span>{icon}</span><div><div className="stat-label"><span>{label}</span>{!compact && <b>{Math.round(value)}</b>}</div><div className="bar"><i className={level} style={{ width: `${value}%` }} /></div></div></div>
}

function overallStatus(game: GameState) {
  const values = [game.hunger, game.thirst, game.energy, game.health, game.hygiene, game.mood]
  const lowest = Math.min(...values)
  if (lowest <= 30) return { label: 'BAD', icon: '☹️', level: 'bad' }
  if (lowest <= 60) return { label: 'FAIR', icon: '😐', level: 'fair' }
  return { label: 'OK', icon: '🙂', level: 'ok' }
}

export default function App() {
  const [game, setGame] = useState<GameState>(loadGame)
  const [phoneActivity, setPhoneActivity] = useState<PhoneActivity | null>(loadPhoneActivity)
  useEffect(() => {
    if (phoneActivity) localStorage.setItem(PHONE_ACTIVITY_KEY, JSON.stringify(phoneActivity))
    else localStorage.removeItem(PHONE_ACTIVITY_KEY)
  }, [phoneActivity])
  const [message, setMessage] = useState('')
  const [infoModal, setInfoModal] = useState<ResultCardData | null>(null)
  const [pendingResult, setPendingResult] = useState<{ title: string; before: ResultSnapshot; includeTime: boolean; always: boolean } | null>(null)
  const [discoveredLocations, setDiscoveredLocations] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(DISCOVERY_KEY)
      if (raw) return [...new Set((JSON.parse(raw) as string[]).map(id => id === 'night-shelter' ? 'shelter' : id))]
      return localStorage.getItem(SAVE_KEY) ? locations.map((location) => location.id) : ['street', 'station', 'shop']
    } catch {
      return ['street', 'station', 'shop']
    }
  })
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(JOURNAL_HISTORY_KEY) ?? '[]')
      return Array.isArray(saved) ? saved.filter(entry => entry && Number.isInteger(entry.day) && entry.day > 0 && Number.isFinite(entry.minute) && entry.minute >= 0 && entry.minute < 1440 && typeof entry.title === 'string' && typeof entry.text === 'string' && Array.isArray(entry.summary?.costs) && Array.isArray(entry.summary?.changes)).slice(-500) : []
    } catch { return [] }
  })
  const lastRecordedResult = useRef<unknown>(null)
  useEffect(() => { localStorage.setItem(JOURNAL_HISTORY_KEY, JSON.stringify(journalEntries)) }, [journalEntries])
  const [journalGoals, setJournalGoals] = useState<JournalGoals>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(JOURNAL_GOALS_KEY) ?? '{}')
      return { morning: raw.morning === true, shelter: raw.shelter === true, support: raw.support === true, work: raw.work === true }
    } catch { return { morning: false, shelter: false, support: false, work: false } }
  })
  const [activeGoal, setActiveGoal] = useState<{ type: 'night-shelter'; day: number; minute: number } | null>(() => {
    try { const raw = localStorage.getItem(GOAL_KEY); return raw ? JSON.parse(raw) : null } catch { return null }
  })
  const [shelterInterview, setShelterInterview] = useState<{ step: 'reason' | 'action' | 'plan'; reason?: string; action?: string } | null>(null)
  const [screen, setScreen] = useState<Screen>(() => {
    if (loadPhoneActivity()) return 'location'
    if (loadTrip()) return 'travel'
    const saved = localStorage.getItem('street-life-screen')
    return saved === 'map' || saved === 'inventory' || saved === 'location' || saved === 'status' || saved === 'journal' ? saved : 'location'
  })
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null)
  const [rainChoice, setRainChoice] = useState(() => localStorage.getItem('street-life-rain-choice-v1') === 'true' && loadGame().locationId === 'street')
  const [coverPlanning, setCoverPlanning] = useState(false)
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>(() => {
    try { const saved = JSON.parse(localStorage.getItem('street-life-answers-v1') ?? '[]'); return Array.isArray(saved) ? saved.filter(value => typeof value === 'string') : [] } catch { return [] }
  })
  useEffect(() => { localStorage.setItem('street-life-answers-v1', JSON.stringify(answeredQuestions)) }, [answeredQuestions])
  const [seenMemories, setSeenMemories] = useState<string[]>(() => {
    try { const saved = JSON.parse(localStorage.getItem('street-life-memories-v1') ?? '[]'); return Array.isArray(saved) ? saved.filter(value => typeof value === 'string') : [] } catch { return [] }
  })
  useEffect(() => { localStorage.setItem('street-life-memories-v1', JSON.stringify(seenMemories)) }, [seenMemories])
  useEffect(() => { localStorage.setItem('street-life-rain-choice-v1', String(rainChoice)) }, [rainChoice])
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [trip, setTrip] = useState<Trip | null>(loadTrip)
  const [musicOn, setMusicOn] = useState(false)
  const [mobileServiceUntil, setMobileServiceUntil] = useState<number>(() => Number(localStorage.getItem('street-life-mobile-service-until') ?? 0))
  const [mobileAutoRenew, setMobileAutoRenew] = useState<boolean>(() => localStorage.getItem('street-life-mobile-auto-renew') !== 'false')
  const [mobileRenewedDay, setMobileRenewedDay] = useState<number>(() => Number(localStorage.getItem('street-life-mobile-renewed-day') ?? 0))
  const [shelterQueue, setShelterQueue] = useState<ShelterQueue | null>(() => {
    try {
      const raw = localStorage.getItem('street-life-shelter-queue-v1')
      if (!raw) return null
      const saved = JSON.parse(raw) as ShelterQueue
      return saved.day === game.day && game.locationId === 'shelter' && saved.remaining >= 0 && saved.remaining <= SHELTER_QUEUE_MINUTES && saved.before ? saved : null
    } catch { return null }
  })
  const [shelterDeparture, setShelterDeparture] = useState<ShelterDeparture | null>(() => {
    try {
      const raw = localStorage.getItem('street-life-shelter-departure-v1')
      if (!raw) return null
      const saved = JSON.parse(raw) as ShelterDeparture
      const elapsed = absoluteMinutes(game) - saved.startAbsolute
      return saved.day === game.day && game.locationId === 'shelter' && Number.isFinite(elapsed) && elapsed >= 0 && elapsed <= SHELTER_DEPARTURE_MINUTES && saved.before ? saved : null
    } catch { return null }
  })
  const [streetBenchFound, setStreetBenchFound] = useState(false)
  const [sleepHours, setSleepHours] = useState(8)
  const [sleepChoice, setSleepChoice] = useState<SleepState['kind'] | null>(null)
  const [sleeping, setSleeping] = useState<SleepState | null>(() => {
    try {
      const raw = localStorage.getItem('street-life-sleep-v1')
      if (!raw) return null
      const saved = JSON.parse(raw) as SleepState
      if (saved.kind !== 'shelter') return saved
      const total = shelterSleepMinutes(saved.startAbsolute, saved.total)
      return { ...saved, total, remaining: Math.min(saved.remaining, total), realWakeAt: saved.realStartedAt + total * 1000 / DEBUG_SLEEP_SPEED }
    } catch { return null }
  })
  const [begging, setBegging] = useState<{ day: number; attempts: number }>(() => {
    try {
      const raw = localStorage.getItem('street-life-begging-v1')
      const saved = raw ? JSON.parse(raw) : null
      return saved && Number.isInteger(saved.day) && saved.day >= 1 && Number.isInteger(saved.attempts) && saved.attempts >= 0
        ? { day: saved.day, attempts: Math.min(3, saved.attempts) } : { day: game.day, attempts: 0 }
    } catch { return { day: game.day, attempts: 0 } }
  })
  const [trashGame, setTrashGame] = useState<{ items: TrashItem[]; startedAt: number; found: number; rejected: number; before: ResultSnapshot } | null>(null)
  const trashDrag = useRef<{ id: number; offsetX: number; offsetY: number; moved: boolean } | null>(null)
  const [navigationOn, setNavigationOn] = useState(true)
  const [activeEvent, setActiveEvent] = useState<StreetEvent | null>(null)
  const [diceCheck, setDiceCheck] = useState<{ choice: StreetEventChoice; roll: number | null; modifier: number; resolved: boolean; stealItemId?: ShopItem['id']; fareDodgeDestinationId?: string } | null>(null)
  const [inventory, setInventory] = useState<Inventory>(() => {
    try {
      const raw = localStorage.getItem('street-life-inventory-v1')
      if (!raw) return INITIAL_INVENTORY
      const saved = JSON.parse(raw)
      return { ...INITIAL_INVENTORY, ...saved, clothingCleanliness: typeof saved.clothingCleanliness === 'number' && Number.isFinite(saved.clothingCleanliness) ? Math.max(0, Math.min(100, saved.clothingCleanliness)) : Math.max(80, loadGame().hygiene) }
    } catch {
      return INITIAL_INVENTORY
    }
  })
  const [storage, setStorage] = useState<StoredItems>(() => {
    try {
      const raw = localStorage.getItem('street-life-storage-v1')
      return raw ? { ...INITIAL_STORAGE, ...JSON.parse(raw) } : INITIAL_STORAGE
    } catch {
      return INITIAL_STORAGE
    }
  })
  const [life, setLife] = useState<LifeSituation>(() => {
    try {
      const raw = localStorage.getItem('street-life-situation-v1')
      return raw ? { ...INITIAL_LIFE, ...JSON.parse(raw) } : INITIAL_LIFE
    } catch {
      return INITIAL_LIFE
    }
  })
  const [effects, setEffects] = useState<ActiveEffect[]>(() => {
    try {
      const raw = localStorage.getItem('street-life-effects-v1')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const current = useMemo(() => locations.find((x) => x.id === game.locationId) ?? locations[0], [game.locationId])
  const shelterBooked = (life.shelterUntilDay ?? 0) >= game.day
  const currentActions = actions.filter(x => x.locationId === current.id && (current.id !== 'shelter' || shelterBooked || x.id === 'shelter-rest'))
  const open = isOpen(current, game.minutes)
  const inlineResult = screen === 'location' && current.id === 'street' && !!infoModal?.presentation
  const overall = overallStatus(game)
  const weather = (game.rainUntil ?? 0) > absoluteMinutes(game) ? WEATHER[1] : WEATHER[(game.day - 1) % WEATHER.length]
  const temperature = temperatureAt(weather.temp, game.minutes)
  const goals = [
    { id: 'morning' as const, title: 'Get through the morning', description: 'Get through your first night and stay alive until noon tomorrow.' },
    { id: 'shelter' as const, title: 'Find a safe place to sleep', description: 'Register for a shelter bed or move into Schronisko.' },
    { id: 'support' as const, title: 'Visit social support', description: 'Visit Help Center during opening hours.' },
    { id: 'work' as const, title: 'Look for work', description: 'Search online for work or visit Job Centre or Day Work while open.' },
  ]
  const storyDecision = current.id === 'street' && !trip && !sleeping && !shelterQueue && !shelterDeparture && !trashGame
  const firstNight = (game.day === 1 && game.minutes >= 1320 || game.day === 2 && game.minutes < 360) && life.housing === 'Street'
  const openingScene = game.day === 1 && game.minutes < 1380
    ? 'You stand on the street with your backpack. There is nowhere to go back to tonight. The station windows are still lit.'
    : game.day === 1 ? 'The shops have lowered their shutters. Fewer people pass the station now. You are outside with your backpack; the waiting room is still lit.'
    : game.minutes < 240 ? 'Most windows above the shops are dark. A bus passes without stopping. The station waiting room is still lit. Morning is several hours away.'
    : 'The street is almost empty. Delivery vans have begun to pass the closed shops. The station lights are still on; the help centers will not open until eight.'
  const streetScene = firstNight && game.day === 1 && game.minutes === 1320 ? openingScene : [
    firstNight ? openingScene : '',
    !firstNight && (game.minutes >= 1200 || game.minutes < 360) ? 'The street has grown quiet. Light spills from the station entrance, but it is no bed for the night.' : firstNight ? '' : game.minutes >= 1020 ? 'The daylight is fading. People hurry past the station while you decide where to spend the night.' : 'People pass the station, each on their way somewhere. You stop and think about your next step.',
    weather.label === 'Rain' || weather.label === 'Showers' ? 'Rain reaches your clothes; somewhere dry would make a difference.' : temperature < 10 ? 'The air is cold against your face.' : 'The pavement is dry for now.',
    game.energy < 30 ? 'Your legs feel heavy. Rest is becoming urgent.' : game.thirst < 30 ? 'Your mouth is dry. You need something to drink.' : game.hunger < 30 ? 'You have not eaten enough. Your stomach is empty.' : '',
    shelterBooked ? 'You have a reserved shelter bed, if you can get there in time.' : discoveredLocations.includes('shelter') ? 'You know the shelter address, but a place is not guaranteed.' : 'You do not yet know where you can sleep safely.',
  ].filter(Boolean).join(' ')
  const completedGoals = goals.filter(goal => journalGoals[goal.id]).length
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
  useEffect(() => { localStorage.setItem(JOURNAL_GOALS_KEY, JSON.stringify(journalGoals)) }, [journalGoals])
  useEffect(() => {
    if (!activeGoal) return
    if ((life.shelterUntilDay ?? 0) >= game.day || life.housing === 'Schronisko' ||
        (current.id === 'shelter' && !trip && game.day >= activeGoal.day && game.minutes >= activeGoal.minute && game.minutes < 1320)) {
      setActiveGoal(null)
    } else if (game.day > activeGoal.day || (game.day === activeGoal.day && game.minutes >= 1320)) {
      setActiveGoal({ type: 'night-shelter', day: game.minutes >= 1320 ? game.day + 1 : game.day, minute: 1140 })
    }
  }, [activeGoal, game.day, game.minutes, current.id, trip, life.shelterUntilDay, life.housing])
  const nextJournalGoal = goals.find(goal => !journalGoals[goal.id])
  const usedBackpackSlots = backpackSlots(inventory)
  const gameOver = game.health <= 0
  const shelterCheckoutDue = current.id === 'shelter' && !shelterDeparture && !trip &&
    life.shelterCheckoutDay !== game.day && game.minutes >= SHELTER_CHECKOUT_WARNING && game.minutes < 12 * 60 &&
    (game.minutes < 8 * 60 || life.shelterLastStayDay === game.day - 1)
  const shelterDepartureRemaining = shelterDeparture ? Math.max(0, SHELTER_DEPARTURE_MINUTES - (absoluteMinutes(game) - shelterDeparture.startAbsolute)) : 0
  const freeTransitActive = inventory.transitCard || effects.some(effect => effect.id === 'free-transit' && effect.expiresAt > absoluteMinutes(game))
  const mobileServiceActive = mobileServiceUntil > absoluteMinutes(game)
  const mobileServiceMinutesLeft = Math.max(0, mobileServiceUntil - absoluteMinutes(game))
  const dayWorkEnergyRequired = 55
  const storageCapacity = current.id === 'residential-shelter' ? SCHRONISKO_STORAGE : NIGHT_SHELTER_STORAGE
  const usedStorageSlots = storageSlots(storage)

  const laundryCleanAt = useRef(-1)
  const groundSleepWindow = useRef<{ start: number; end: number } | null>(sleeping?.kind === 'ground' ? { start: sleeping.startAbsolute, end: sleeping.startAbsolute + sleeping.total } : null)
  const clothingHygieneCap = (cleanliness: number) => cleanliness >= 70 ? 100 : cleanliness >= 40 ? 80 : 60
  const hygieneLimit = clothingHygieneCap(inventory.clothingCleanliness)
  useEffect(() => {
    if (game.hygiene > hygieneLimit) setGame(prev => ({ ...prev, hygiene: Math.min(prev.hygiene, hygieneLimit) }))
  }, [game.hygiene, hygieneLimit])

  function applyAction(state: GameState, result: ActionResult) {
    return applyGameAction(state, result, { effects, walking: trip?.mode === 'walk', music: musicOn })
  }

  function applySleepTime(state: GameState, minutes: number) {
    return applyGameSleepTime(state, minutes, { effects })
  }

  const [inventoryAgedAt, setInventoryAgedAt] = useState(absoluteMinutes(game))
  const agedThrough = useRef(absoluteMinutes(game))
  useEffect(() => {
    const now = absoluteMinutes(game)
    const elapsed = Math.max(0, now - agedThrough.current)
    agedThrough.current = now
    setInventoryAgedAt(now)
    if (elapsed === 0) return
    setStorage(prev => prev.food > 0 ? { ...prev, foodFreshness: Math.max(0, prev.foodFreshness - FOOD_FRESHNESS_PER_MINUTE * elapsed) } : prev)
    const groundWindow = groundSleepWindow.current
    const extraDirt = groundWindow ? Math.max(0, Math.min(now, groundWindow.end) - Math.max(now - elapsed, groundWindow.start)) * (40 / 1440) : 0
    const wornMinutes = Math.max(0, now - Math.max(now - elapsed, laundryCleanAt.current))
    setInventory(prev => {
      const multiplier = phoneDrainMultiplier(prev.phoneCondition)
      const navigationDrain = trip && navigationOn ? (weather.label === 'Clear' ? 15 : 12) / 60 * multiplier * elapsed : 0
      const musicDrain = musicOn ? 4 / 60 * multiplier * elapsed : 0
      return { ...prev,
        clothingCleanliness: Math.max(0, prev.clothingCleanliness - wornMinutes * (20 / 1440) * (trip?.mode === 'walk' ? 1.5 : 1) - extraDirt),
        foodFreshness: prev.food > 0 ? Math.max(0, prev.foodFreshness - FOOD_FRESHNESS_PER_MINUTE * elapsed) : 100,
        breadFreshness: prev.bread > 0 ? Math.max(0, prev.breadFreshness - BREAD_FRESHNESS_PER_MINUTE * elapsed) : 100,
        phoneBattery: Math.max(0, prev.phoneBattery - navigationDrain - musicDrain),
      }
    })
  }, [game.day, game.minutes])

  // Repair older saves that already received a referral without its map address.
  useEffect(() => {
    if (life.schroniskoReferral || life.housing === 'Schronisko') {
      setDiscoveredLocations(prev => prev.includes('residential-shelter') ? prev : [...prev, 'residential-shelter'])
    }
  }, [life.schroniskoReferral, life.housing])

  function resultSnapshot(): ResultSnapshot {
    return { game: { ...game }, inventory: { ...inventory }, effects: effects.map(effect => ({ ...effect })) }
  }

  function runWithResult(title: string, action: () => void, before = resultSnapshot(), includeTime = true, always = false) {
    if (sleepChoice && title !== 'Start sleeping') return
    if (shelterQueue && title !== 'Shelter registration') return
    if (shelterDeparture && title !== 'Shelter checkout') return
    if (shelterCheckoutDue && !activeEvent && !diceCheck && !shelterInterview && title !== 'Sleep complete') return
    action()
    setPendingResult({ title, before, includeTime, always })
  }

  useEffect(() => {
    if (!pendingResult || inventoryAgedAt !== absoluteMinutes(game) || game.hygiene > hygieneLimit) return
    setPendingResult(null)
    if (sleeping || sleepChoice || shelterQueue || shelterDeparture || trashGame || shelterInterview || diceCheck) return
    const summary = summarizeResult(pendingResult.before, resultSnapshot(), pendingResult.includeTime)
    if (!pendingResult.always && summary.costs.length === 0 && summary.changes.length === 0 && !infoModal) return
    const memories = [
      { id: 'office-routine', titles: ['Walk through the city', 'Walk with music'], text: 'In your late thirties, you had a steady office job and a desk by the window. Then came the redundancy notice.' },
      { id: 'redundancy-savings', titles: ['Rest on the bench', 'Sit and recover', 'Shelter from the rain'], text: 'After the redundancy, you expected to find another job in a few weeks. As the search dragged on, rent and ordinary expenses used up what you had put aside.' },
      { id: 'unanswered-applications', titles: ['Where can I get help in the morning?'], text: 'Your last job application still has no reply. The redundancy email is still in your inbox.' },
      { id: 'lost-home', titles: ['How can I get a shelter bed?'], text: 'Until recently, you were looking for a place to live. Tonight, you need somewhere just until morning.' },
    ]
    const memory = memories.find(fragment => fragment.titles.includes(pendingResult.title) && !seenMemories.includes(fragment.id))
    const resultText = (infoModal?.text ?? message) + (memory ? `\n\n${memory.text}` : '')
    if (memory) setSeenMemories(previous => [...new Set([...previous, memory.id])])
    if (lastRecordedResult.current !== pendingResult) {
      lastRecordedResult.current = pendingResult
      const entry: JournalEntry = { day: game.day, minute: game.minutes, title: infoModal?.title ?? pendingResult.title, text: resultText, summary }
      setJournalEntries(previous => [...previous, entry].slice(-500))
    }
    setInfoModal(previous => ({ ...previous, title: previous?.title ?? pendingResult.title, text: resultText, ...summary }))
  }, [pendingResult, game, inventory, effects, sleeping, sleepChoice, trashGame, shelterInterview, shelterQueue, shelterDeparture, diceCheck, message, inventoryAgedAt])

  function buyMobileService(...args: Parameters<typeof buyMobileServiceImpl>) { runWithResult('Mobile service', () => buyMobileServiceImpl(...args)) }
  function watchVideo(...args: Parameters<typeof watchVideoImpl>) { runWithResult('Watch videos', () => watchVideoImpl(...args)) }
  function chargePhone(...args: Parameters<typeof chargePhoneImpl>) { runWithResult('Charge phone', () => chargePhoneImpl(...args)) }
  function hospitalVisit(...args: Parameters<typeof hospitalVisitImpl>) { runWithResult('Medical appointment', () => hospitalVisitImpl(...args)) }
  function callAmbulance(...args: Parameters<typeof callAmbulanceImpl>) { runWithResult('Emergency care', () => callAmbulanceImpl(...args)) }
  function askForMoney(...args: Parameters<typeof askForMoneyImpl>) { runWithResult('Ask for money', () => askForMoneyImpl(...args)) }
  function finishTrashSearch(...args: Parameters<typeof finishTrashSearchImpl>) { runWithResult('Trash search results', () => finishTrashSearchImpl(...args), trashGame?.before ?? resultSnapshot()) }
  function returnBottles(...args: Parameters<typeof returnBottlesImpl>) { runWithResult('Return bottles', () => returnBottlesImpl(...args)) }
  function searchOnlineFor(...args: Parameters<typeof searchOnlineForImpl>) { runWithResult('Online search', () => searchOnlineForImpl(...args)) }
  function streetAction(...args: Parameters<typeof streetActionImpl>) { runWithResult(args[0] === 'find-bench' ? 'Is there a bench nearby? My legs could use a break.' : 'Rest on the bench', () => streetActionImpl(...args)) }
  function act(...args: Parameters<typeof actImpl>) { runWithResult(actions.find(action => action.id === args[0])?.name ?? 'Action complete', () => actImpl(...args)) }
  function answerShelterInterview(...args: Parameters<typeof answerShelterInterviewImpl>) { runWithResult('Shelter extension', () => answerShelterInterviewImpl(...args)) }
  function applyEventOutcome(...args: Parameters<typeof applyEventOutcomeImpl>) { runWithResult(activeEvent?.title ?? 'Event result', () => applyEventOutcomeImpl(...args), resultSnapshot(), true, true) }
  function storeItem(...args: Parameters<typeof storeItemImpl>) { runWithResult('Store belongings', () => storeItemImpl(...args)) }
  function takeStoredItem(...args: Parameters<typeof takeStoredItemImpl>) { runWithResult('Collect belongings', () => takeStoredItemImpl(...args)) }
  function storeFood(...args: Parameters<typeof storeFoodImpl>) { runWithResult('Store food', () => storeFoodImpl(...args)) }
  function takeStoredFood(...args: Parameters<typeof takeStoredFoodImpl>) { runWithResult('Collect food', () => takeStoredFoodImpl(...args)) }
  function socialSupport(...args: Parameters<typeof socialSupportImpl>) { runWithResult('Social support', () => socialSupportImpl(...args)) }
  function takeDayWork(...args: Parameters<typeof takeDayWorkImpl>) { runWithResult('Day work', () => takeDayWorkImpl(...args)) }
  function buyItem(...args: Parameters<typeof buyItemImpl>) { runWithResult(`Buy ${args[0].name}`, () => buyItemImpl(...args)) }
  function useSupply(...args: Parameters<typeof useSupplyImpl>) { runWithResult(args[0] === 'wipes' ? 'Use wet wipes' : 'Eat food', () => useSupplyImpl(...args)) }
  function useMedicine(...args: Parameters<typeof useMedicineImpl>) { runWithResult('Use medicine', () => useMedicineImpl(...args)) }
  function smokeCigarette(...args: Parameters<typeof smokeCigaretteImpl>) { runWithResult('Smoke a cigarette', () => smokeCigaretteImpl(...args)) }
  function useItem(...args: Parameters<typeof useItemImpl>) { runWithResult(args[0] === 'water' ? 'Drink water' : 'Eat food', () => useItemImpl(...args)) }

  useEffect(() => { localStorage.setItem('street-life-begging-v1', JSON.stringify(begging)) }, [begging])
  useEffect(() => { localStorage.setItem(SAVE_KEY, JSON.stringify(game)) }, [game])
  useEffect(() => { localStorage.setItem(DISCOVERY_KEY, JSON.stringify(discoveredLocations)) }, [discoveredLocations])
  useEffect(() => { if (activeGoal) localStorage.setItem(GOAL_KEY, JSON.stringify(activeGoal)); else localStorage.removeItem(GOAL_KEY) }, [activeGoal])
  useEffect(() => { localStorage.setItem('street-life-inventory-v1', JSON.stringify(inventory)) }, [inventory])
  useEffect(() => {
    if (screen !== 'travel') localStorage.setItem('street-life-screen', screen)
  }, [screen])

  useEffect(() => { localStorage.setItem('street-life-mobile-service-until', String(mobileServiceUntil)) }, [mobileServiceUntil])
  useEffect(() => { localStorage.setItem('street-life-mobile-auto-renew', String(mobileAutoRenew)) }, [mobileAutoRenew])
  useEffect(() => { localStorage.setItem('street-life-mobile-renewed-day', String(mobileRenewedDay)) }, [mobileRenewedDay])
  useEffect(() => {
    if (!mobileAutoRenew || mobileServiceUntil > absoluteMinutes(game) || mobileRenewedDay >= game.day) return
    setMobileRenewedDay(game.day)
    if (game.money < 1) {
      setMessage('Mobile service auto-renewal failed: you need 1 zł.')
      return
    }
    setGame((prev) => ({ ...prev, money: Math.max(0, prev.money - 1) }))
    setMobileServiceUntil(until => Math.max(until, absoluteMinutes(game)) + 1440)
  }, [game.day, game.minutes, game.money, mobileAutoRenew, mobileRenewedDay, mobileServiceUntil])
  useEffect(() => { if (!mobileServiceActive) { setMusicOn(false); setNavigationOn(false) } }, [mobileServiceActive])
  useEffect(() => { localStorage.setItem('street-life-storage-v1', JSON.stringify(storage)) }, [storage])
  useEffect(() => { localStorage.setItem('street-life-effects-v1', JSON.stringify(effects)) }, [effects])
  useEffect(() => { localStorage.setItem('street-life-situation-v1', JSON.stringify(life)) }, [life])
  useEffect(() => {
    if (current.id !== 'shelter' || life.shelterVacancyDay === game.day) return
    setLife(status => ({ ...status, shelterVacancyDay: game.day, shelterVacancies: Math.floor(Math.random() * 4) }))
  }, [current.id, game.day, life.shelterVacancyDay])
  useEffect(() => {
    if (shelterQueue) localStorage.setItem('street-life-shelter-queue-v1', JSON.stringify(shelterQueue))
    else localStorage.removeItem('street-life-shelter-queue-v1')
  }, [shelterQueue])
  useEffect(() => {
    if (shelterDeparture) localStorage.setItem('street-life-shelter-departure-v1', JSON.stringify(shelterDeparture))
    else localStorage.removeItem('street-life-shelter-departure-v1')
  }, [shelterDeparture])

  useEffect(() => {
    if (!shelterDeparture || shelterDepartureRemaining > 0 || gameOver) return
    const departure = shelterDeparture
    runWithResult('Shelter checkout', () => {
      setShelterDeparture(null)
      setGame(previous => ({ ...previous, locationId: 'street' }))
      setLife(previous => ({ ...previous, housing: 'Street', housingUntil: undefined, shelterCheckoutDay: departure.day }))
      setSelectedDestination(null)
      setPhoneOpen(false)
      setScreen('location')
      setMessage('You packed your things and left the night shelter. After 30 minutes you are on the street.' + (shelterBooked ? ' Your reserved place remains available for tonight.' : ''))
    }, departure.before, true, true)
  }, [shelterDeparture, shelterDepartureRemaining, gameOver])

  function startShelterDeparture() {
    if (!shelterCheckoutDue || sleeping || infoModal || pendingResult || activeEvent || diceCheck || gameOver) return
    setMusicOn(false)
    setNavigationOn(false)
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
          shelterUntilDay: queued.day + 6, shelterLastStayDay: queued.day, shelterAuditDay: queued.day,
          shelterMisses: 0, shelterMissMonth: Math.floor((queued.day - 1) / 30), shelterStrikes: 0 }))
        setGame(prev => applyAction(prev, { minutes: 0, mood: 3 }))
        setActiveGoal(goal => goal?.type === 'night-shelter' ? null : goal)
        setMessage('After 20 minutes in the queue, a place is available. You are registered for 7 days. Shelter services and your bed are now available.')
      } else {
        setGame(prev => applyAction(prev, { minutes: 0, mood: -5 }))
        setMessage(queued.vacancies === 0 ? 'You waited 20 minutes, but there are no free places today. Try tomorrow from 19:00.' :
          'You waited 20 minutes, but people ahead of you took the remaining places. Try arriving earlier tomorrow, from 19:00.')
      }
      setScreen('location')
    }, queued.before, true, true)
  }, [shelterQueue, gameOver])
  useEffect(() => { if (trip) localStorage.setItem('street-life-trip-v1', JSON.stringify(trip)); else localStorage.removeItem('street-life-trip-v1') }, [trip])
  useEffect(() => { if (sleeping) localStorage.setItem('street-life-sleep-v1', JSON.stringify(sleeping)); else localStorage.removeItem('street-life-sleep-v1') }, [sleeping])
  useEffect(() => {
    if (life.housing === 'Night shelter' && life.housingUntil !== undefined && absoluteMinutes(game) >= life.housingUntil) {
      setLife((status) => ({ ...status, housing: 'Street', housingUntil: undefined }))
    }
  }, [game.day, game.minutes, life.housing, life.housingUntil])
  useEffect(() => {
    const now = absoluteMinutes(game)
    setEffects((prev) => prev.filter((effect) => effect.expiresAt > now))
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
        setMessage(`You missed three shelter nights this month. Your place was cancelled; you can register again on Day ${blockedUntil}.`)
        return { ...status, housing: 'Street', housingUntil: undefined, shelterUntilDay: undefined, shelterAuditDay: previousDay, shelterMisses: misses, shelterMissMonth: month, shelterBlockedUntilDay: blockedUntil }
      }
      return { ...status, shelterAuditDay: previousDay, shelterMisses: misses, shelterMissMonth: month }
    })
  }, [game.day, life.shelterRegisteredDay, life.shelterUntilDay, life.shelterAuditDay, life.shelterLastStayDay])

  useEffect(() => {
    if (phoneActivity || rainChoice || game.energy > 0 || sleeping || sleepChoice || gameOver || activeEvent || diceCheck || shelterInterview || shelterQueue || shelterCheckoutDue || shelterDeparture || trip || infoModal || pendingResult) return
    const safeKind = current.id === 'residential-shelter'
      ? 'residential'
      : current.id === 'shelter' && shelterBooked && open && game.intoxication <= 10
        ? 'shelter'
        : 'ground'
    const hours = 8
    const realStartedAt = Date.now()
    setMusicOn(false)
    setNavigationOn(false)
    setTrip(null)
    if (safeKind === 'ground' && current.id !== 'street') setGame((prev) => ({ ...prev, locationId: 'street' }))
    const total = safeKind === 'shelter' ? shelterSleepMinutes(absoluteMinutes(game), hours * 60) : hours * 60
    groundSleepWindow.current = safeKind === 'ground' ? { start: absoluteMinutes(game), end: absoluteMinutes(game) + total } : null
    setSleeping({ kind: safeKind, total, remaining: total, startAbsolute: absoluteMinutes(game), realStartedAt, realWakeAt: realStartedAt + (total * 1000) / DEBUG_SLEEP_SPEED, before: resultSnapshot(), forced: true })
    setMessage(safeKind === 'ground' ? `You collapse from exhaustion and fall asleep outside. You may sleep for up to ${hours} hours.` : 'You are too exhausted to stay awake and fall asleep.')
  }, [game.energy, sleeping, sleepChoice, gameOver, activeEvent, diceCheck, shelterInterview, shelterQueue, shelterCheckoutDue, shelterDeparture, shelterBooked, trip, current.id, open, game.intoxication, infoModal, pendingResult, rainChoice, phoneActivity])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (phoneActivity || rainChoice || storyDecision || (document.visibilityState !== 'visible' && !sleeping) || activeEvent || diceCheck || shelterInterview || gameOver || infoModal || pendingResult || sleepChoice || trashGame || (shelterCheckoutDue && !sleeping) || (shelterDeparture && shelterDepartureRemaining === 0)) return
      if (sleeping) {
        const elapsed = Math.min(sleeping.total, Math.max(0, Math.floor(((Date.now() - sleeping.realStartedAt) / 1000) * DEBUG_SLEEP_SPEED)))
        const targetAbsolute = sleeping.startAbsolute + elapsed
        setGame((prev) => {
          const delta = Math.max(0, targetAbsolute - absoluteMinutes(prev))
          return delta > 0 ? applySleepTime(prev, delta) : prev
        })
      }
      if (sleeping) return
      const tickMinutes = trip ? Math.min(10, trip.remaining) : 1
      if (shelterQueue) setShelterQueue(active => active ? { ...active, remaining: Math.max(0, active.remaining - tickMinutes) } : null)
      setGame(prev => applyAction(prev, { minutes: tickMinutes }))
      setTrip(active => active ? { ...active, remaining: Math.max(0, active.remaining - tickMinutes) } : null)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [trip, effects, musicOn, navigationOn, activeEvent, diceCheck, shelterInterview, gameOver, sleeping, sleepChoice, shelterQueue, shelterCheckoutDue, shelterDeparture, shelterDepartureRemaining, infoModal, pendingResult, trashGame, storyDecision, rainChoice, phoneActivity])

  useEffect(() => {
    if (!trip || trip.remaining > 0) return
    const destination = locations.find(location => location.id === trip.destinationId)
    if (!destination) { setTrip(null); return }
    runWithResult('Arrival', () => {
      setGame(previous => ({ ...previous, locationId: destination.id }))
      setMessage(`You arrived at ${destination.name} by ${trip.mode === 'walk' ? 'walking' : 'public transport'}.`)
      setScreen('location')
      setTrip(null)
    }, trip.before ?? resultSnapshot(), true, true)
  }, [trip])

  function buyMobileServiceImpl() {
    if (game.money < 1) { setMessage('You need 1 zł to activate mobile service for 24 hours.'); return }
    const now = absoluteMinutes(game)
    setGame((prev) => ({ ...prev, money: Math.max(0, prev.money - 1) }))
    setMobileServiceUntil((until) => Math.max(until, now) + 1440)
    setMessage('Mobile service activated for another 24 hours. Cost: 1 zł.')
  }

  function watchVideoImpl() {
    if (!mobileServiceActive) { setMessage('You need active mobile service to use online video.'); return }
    const videoDrain = 9 * phoneDrainMultiplier(inventory.phoneCondition)
    if (inventory.phoneBattery < videoDrain) { setMessage('Not enough battery for 30 minutes of video.'); return }
    setInventory((prev) => ({ ...prev, phoneBattery: Math.max(0, prev.phoneBattery - videoDrain) }))
    setGame((prev) => applyAction(prev, { minutes: 30, mood: 8 }))
    setMessage('You watched videos for 30 minutes. Mood improved, but the worn phone used more battery.')
  }

  function chargePhoneImpl() {
    if (inventory.phoneBattery >= 100) { setMessage('Phone is already fully charged.'); return }
    if (current.id !== 'support' && current.id !== 'residential-shelter') return
    if (!open) return
    setInventory((prev) => ({ ...prev, phoneBattery: Math.min(100, prev.phoneBattery + 25) }))
    setGame((prev) => applyAction(prev, { minutes: 30 }))
    setMessage('You charged the phone for 30 minutes. Battery +25%.')
  }

  function recordShelterDeparture(id: string) {
    if (game.locationId === 'shelter' && id !== 'shelter' && game.minutes > 480 && game.minutes < 1080 && (life.shelterUntilDay ?? 0) >= game.day) {
      const strikes = (life.shelterStrikes ?? 0) + 1
      const evicted = strikes >= 3
      const month = Math.floor((game.day - 1) / 30)
      const blockedUntil = (month + 1) * 30 + 1
      setLife((status) => ({ ...status, shelterStrikes: strikes, ...(evicted ? { housing: 'Street' as const, housingUntil: undefined, shelterUntilDay: undefined, shelterBlockedUntilDay: blockedUntil } : {}) }))
      setMessage(evicted ? `Third shelter rule violation: your place was cancelled. You can register again on Day ${blockedUntil}.` : `You left the shelter after 08:00. Rule violation ${strikes}/3.`)
    }
  }

  function chooseDestination(id: string) {
    if (sleepChoice || shelterQueue || shelterDeparture || shelterCheckoutDue) return
    if (id === game.locationId) {
      setScreen('location')
      return
    }
    if (id === 'street') {
      recordShelterDeparture(id)
      setGame((prev) => ({ ...prev, locationId: 'street' }))
      setSelectedDestination(null)
      setScreen('location')
      setMessage('You step outside onto the street.')
      return
    }
    setSelectedDestination(id)
  }

  function canStartSleep(kind: SleepState['kind']) {
    if (activeEvent || shelterQueue || shelterDeparture || shelterCheckoutDue || sleeping || trip || screen === 'travel' || gameOver) return false
    if (kind === 'bench' && current.id !== 'station' && (!streetBenchFound || current.id !== 'street')) return false
    if (kind === 'ground' && current.id !== 'street') return false
    if (kind === 'shelter' && (current.id !== 'shelter' || !shelterBooked || !open || game.intoxication > 10)) return false
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
    return `Day ${day} ${weekday(day)} · ${formatTime(wake % 1440)}`
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
    setNavigationOn(false)
    const realStartedAt = Date.now()
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
    setSleeping(null)
    const before = sleep.before ?? { ...resultSnapshot(), game: { ...game, day: Math.floor(sleep.startAbsolute / 1440) + 1, minutes: sleep.startAbsolute % 1440 } }
    runWithResult('Sleep complete', () => {
      setGame(previous => applySleepTime(previous, Math.max(0, sleep.startAbsolute + sleep.total - absoluteMinutes(previous))))
      finishSleepImpl(sleep)
    }, before, false, true)
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
    setGame((prev) => applyAction(prev, result))
    let illnessText = ''
    if (sleep.kind === 'ground' || sleep.kind === 'bench') {
      setLife((status) => ({ ...status, housing: 'Street', housingUntil: undefined }))
      const sleepWeather = (wakeState.rainUntil ?? 0) > absoluteMinutes(wakeState) ? WEATHER[1] : WEATHER[(wakeState.day - 1) % WEATHER.length]
      const sleepTemp = temperatureAt(sleepWeather.temp, wakeState.minutes)
      const illnessChance = Math.min(0.65, Math.max(0.05,
        0.08 +
        (sleepTemp <= 5 ? 0.28 : sleepTemp <= 10 ? 0.16 : sleepTemp <= 15 ? 0.07 : 0) +
        (sleepWeather.label === 'Rain' ? 0.22 : sleepWeather.label === 'Showers' ? 0.14 : sleepWeather.label === 'Windy' ? 0.10 : 0) +
        (sleep.kind === 'ground' ? 0.08 : 0)
      ))
      if (Math.random() < illnessChance) {
        setEffects((active) => active.some((effect) => effect.id === 'cold' && effect.expiresAt > absoluteMinutes(wakeState))
          ? active
          : [...active, { id: 'cold', expiresAt: absoluteMinutes(wakeState) + 2 * 1440 }])
        if (!effects.some(effect => effect.id === 'cold' && effect.expiresAt > absoluteMinutes(wakeState))) illnessText = ` You woke up with a cold after sleeping outside in ${sleepWeather.label.toLowerCase()} weather.`
      }
      const baseChance = sleep.kind === 'ground' ? 0.75 : 0.65
      const wakeEvent = pickStreetEvent('wake', { locationId: 'street', weather: weather.label, housing: 'Street', documents: inventory.documents }, Math.min(0.9, baseChance * scale))
      if (wakeEvent) setActiveEvent(wakeEvent)
    } else if (sleep.kind === 'shelter') {
      const sleepStartDay = Math.floor(sleep.startAbsolute / 1440) + 1
      const stayNightDay = sleep.startAbsolute % 1440 < 480 ? sleepStartDay - 1 : sleepStartDay
      setLife((status) => ({ ...status, housing: 'Night shelter', shelterLastStayDay: Math.max(status.shelterLastStayDay ?? 0, stayNightDay) }))
      const wakeEvent = pickStreetEvent('wake', { locationId: current.id, weather: weather.label, housing: 'Night shelter', documents: inventory.documents }, Math.min(0.65, 0.45 * scale))
      if (wakeEvent && wakeState.minutes < SHELTER_CHECKOUT_WARNING) setActiveEvent(wakeEvent)
    } else {
      setLife((status) => ({ ...status, housing: 'Schronisko', housingUntil: undefined }))
    }
    setMessage(`You slept for ${Number.isInteger(hours) ? `${hours} hour${hours === 1 ? '' : 's'}` : formatTravelTime(sleep.total)}.${illnessText}`)
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
    const clutter = ['📰','🥤','📦','🍌','🥫','🧻','🛍️','🍕','🧤','🥡','🧃','🗞️']
    const layers = 6
    const perLayer = 3
    const count = layers * perLayer
    const bottleCount = 2 + Math.floor(Math.random() * 5)
    const bottleIndexes = new Set<number>()
    while (bottleIndexes.size < bottleCount) bottleIndexes.add(Math.floor(Math.random() * count))
    const items: TrashItem[] = Array.from({ length: count }, (_, id) => {
      const bottle = bottleIndexes.has(id)
      const layer = Math.floor(id / perLayer)
      const slot = id % perLayer
      const base = [
        { x: 19, y: 31 },
        { x: 48, y: 19 },
        { x: 40, y: 53 },
      ][slot]
      return {
        id,
        layer,
        icon: bottle ? (Math.random() < .5 ? '🍾' : '🧴') : clutter[Math.floor(Math.random() * clutter.length)],
        x: base.x + (Math.random() * 14 - 7),
        y: base.y + (Math.random() * 14 - 7),
        rotation: -75 + Math.random() * 150,
        scale: bottle ? 1.45 + Math.random() * .35 : 1.9 + Math.random() * .55,
        bottle,
        returnable: bottle && Math.random() < .65,
      }
    })
    setTrashGame({ items, startedAt: Date.now(), before: resultSnapshot(), found: 0, rejected: 0 })
  }

  function startTrashDrag(id: number, clientX: number, clientY: number, bounds: DOMRect) {
    const item = trashGame?.items.find((entry) => entry.id === id)
    if (!item || item.collected || !trashGame) return false
    const pointerX = ((clientX - bounds.left) / bounds.width) * 100
    const pointerY = ((clientY - bounds.top) / bounds.height) * 100
    trashDrag.current = { id, offsetX: pointerX - item.x, offsetY: pointerY - item.y, moved: false }
    return true
  }

  function moveTrashItem(id: number, clientX: number, clientY: number, bounds: DOMRect) {
    const drag = trashDrag.current
    if (!drag || drag.id !== id) return
    const pointerX = ((clientX - bounds.left) / bounds.width) * 100
    const pointerY = ((clientY - bounds.top) / bounds.height) * 100
    const nextX = Math.max(-30, Math.min(110, pointerX - drag.offsetX))
    const nextY = Math.max(-30, Math.min(110, pointerY - drag.offsetY))
    drag.moved = true
    const draggedItem = trashGame?.items.find((entry) => entry.id === id)
    const itemRadius = 9 * (draggedItem?.scale ?? 1)
    const centerX = nextX + 9
    const centerY = nextY + 9
    const dx = centerX - 50
    const dy = centerY - 50
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy)
    // An item becomes cleared as soon as its outer edge reaches the rim.
    const cleared = distanceFromCenter + itemRadius > 38
    // Discard only the item currently being dragged, once roughly 25% of its
    // size has crossed the rim. Untouched items are never evaluated here.
    const outside = distanceFromCenter + itemRadius * 0.5 > 40
    setTrashGame((active) => active ? { ...active, items: active.items.map((item) => item.id === id ? {
      ...item,
      x: nextX,
      y: nextY,
      cleared: item.cleared || cleared,
      collected: !item.bottle && outside ? true : item.collected,
    } : item) } : null)
  }

  function collectTrashBottle(id: number) {
    if (!trashGame) return
    const item = trashGame.items.find((entry) => entry.id === id)
    if (!item || !item.bottle || item.collected) return
    if (!item.returnable) {
      setTrashGame((active) => active ? { ...active, rejected: active.rejected + 1, items: active.items.map((entry) => entry.id === id ? { ...entry, collected: true } : entry) } : null)
      return
    }
    const currentBottleSlots = inventory.bottles > 0 ? Math.ceil(inventory.bottles / BOTTLE_STACK_SIZE) : 0
    const otherSlots = backpackSlots(inventory) - currentBottleSlots
    const bottleCapacity = Math.max(0, BACKPACK_CAPACITY - otherSlots) * BOTTLE_STACK_SIZE
    if (inventory.bottles >= bottleCapacity) { setMessage('Your backpack has no room for another bottle.'); return }
    setInventory((prev) => ({ ...prev, bottles: prev.bottles + 1 }))
    setTrashGame((active) => active ? { ...active, found: active.found + 1, items: active.items.map((entry) => entry.id === id ? { ...entry, collected: true } : entry) } : null)
  }

  function finishTrashSearchImpl() {
    if (!trashGame) return
    const realSeconds = Math.max(5, Math.floor((Date.now() - trashGame.startedAt) / 1000))
    const minutes = Math.min(60, Math.max(10, Math.ceil(realSeconds / 5) * 5))
    const { found, rejected } = trashGame
    setGame((prev) => applyAction(prev, { minutes, energy: -Math.max(1, minutes / 15), hygiene: -Math.max(2, minutes / 5), mood: found > 0 ? 1 : -2 }))
    setTrashGame(null)
    setMessage(found > 0 ? `You searched the trash for ${minutes} minutes and kept ${found} returnable bottle${found === 1 ? '' : 's'}.` : rejected > 0 ? `You searched for ${minutes} minutes. The bottles you found were not returnable.` : `You searched for ${minutes} minutes and found nothing useful.`)
  }

  useEffect(() => {
    if (!trashGame) return
    const timer = window.setInterval(() => {
      if (Date.now() - trashGame.startedAt >= 60_000) finishTrashSearch()
    }, 250)
    return () => window.clearInterval(timer)
  }, [trashGame])

  function returnBottlesImpl() {
    if (!open || current.id !== 'shop' || inventory.bottles <= 0) return
    const count = inventory.bottles
    const payout = count * BOTTLE_DEPOSIT
    setInventory((prev) => ({ ...prev, bottles: 0 }))
    setGame((prev) => applyAction(prev, { minutes: 5, money: payout }))
    setMessage(`Returned ${count} bottle${count === 1 ? '' : 's'} for ${payout.toFixed(2)} zł.`)
  }

  function searchOnlineForImpl(kind: 'shelter' | 'work' | 'help') {
    if (current.id !== 'street') return
    if (!mobileServiceActive) { setMessage('You need mobile internet to search online.'); return }
    if (inventory.phoneBattery < 2) { setMessage('Your phone battery is too low to search online.'); return }

    const result = kind === 'shelter'
      ? { id: 'shelter', label: 'Night Shelter', message: 'You find information about a night shelter and save its address.' }
      : kind === 'work'
        ? { id: 'work', label: 'Day Work', message: 'You find a place advertising casual day work and save the address.' }
        : { id: 'support', label: 'Help Center', message: 'You find a local help center and save its address.' }

    setInventory((prev) => ({ ...prev, phoneBattery: Math.max(0, prev.phoneBattery - 2) }))
    setGame((prev) => applyAction(prev, { minutes: 15 }))
    setDiscoveredLocations((prev) => prev.includes(result.id) ? prev : [...prev, result.id])
    if (kind === 'work') setJournalGoals(previous => ({ ...previous, work: true }))
    if (kind === 'shelter' && game.minutes >= 22 * 60) {
      setActiveGoal({ type: 'night-shelter', day: game.day + 1, minute: 19 * 60 })
      setInfoModal({ title: 'Night Shelter found', text: 'Registration is closed for tonight. Come tomorrow from 19:00 to request a place. The address has been added to your map.',  })
    } else if (kind === 'help' && !isOpen(locations.find(location => location.id === 'support')!, game.minutes)) {
      setInfoModal({ title: 'Help Center found', text: 'You find the Help Center address, but its services are closed now. It opens at 08:00. You save the address for tomorrow; tonight you still need somewhere to stay.' })
    } else {
      setInfoModal({ title: `${result.label} found`, text: `${result.message} It has been added to your map.`,  })
    }
  }

  const walkMusicCost = 2 * phoneDrainMultiplier(inventory.phoneCondition)
  const canWalkWithMusic = mobileServiceActive && inventory.phoneCondition > 0 && inventory.phoneBattery >= walkMusicCost
  function walkCity(withMusic = false) {
    if (current.id !== 'street' || sleeping || trip || activeEvent || infoModal) return
    if (withMusic && !canWalkWithMusic) return
    const playingMusic = withMusic || musicOn
    runWithResult(withMusic ? 'Walk with music' : 'Walk through the city', () => {
      setRainChoice(false)
      setCoverPlanning(false)
      const startsRain = weather.label !== 'Rain' && weather.label !== 'Showers' && (game.minutes >= 1200 || game.minutes < 360) && Math.random() < 0.35
      let next = applyGameAction(game, { minutes: 15, energy: -1 }, { effects, walking: true, music: playingMusic })
      if (startsRain) next = { ...next, rainUntil: absoluteMinutes(next) + 180 }
      next = applyGameAction(next, { minutes: 15, energy: -1, mood: 2, hygiene: startsRain || weather.label === 'Rain' || weather.label === 'Showers' ? -3 : 0 }, { effects, walking: true, music: playingMusic })
      if (withMusic) next.mood += Math.max(0, Math.min(8, 60 - next.mood))
      const wet = (next.rainUntil ?? 0) > absoluteMinutes(next) || weather.label === 'Rain' || weather.label === 'Showers'
      setInventory(previous => ({ ...previous, phoneBattery: Math.max(0, previous.phoneBattery - (withMusic && !musicOn ? walkMusicCost : 0)), clothingCleanliness: Math.max(0, previous.clothingCleanliness - 30 * (10 / 1440) - (wet ? 5 : 0)) }))
      setGame(next)
      const musicText = withMusic ? ' You put on familiar music. A few songs play as you pass the dark shop windows.' : ''
      if (wet) {
        setRainChoice(true)
        setMessage((startsRain ? 'A few drops become steady rain as you walk. Your clothes begin to get wet. Water collects along the edge of the pavement.' : 'Rain darkens the shoulders of your clothes. A narrow canopy covers the entrance to a closed shop.') + musicText)
      } else setMessage('You pass lit windows and closed shops. At the next crossing, the signal changes for an empty road. Half an hour has passed. You are still outside.' + musicText)
    }, resultSnapshot(), true, true)
  }

  const practicalQuestions = [
    { id: 'morning', icon: '💬', title: 'Where can I get help in the morning?', text: 'Help Center opens at 08:00 and closes at 16:00. Ask a social worker about accommodation, documents and benefits. Day Center & Clinic is also open 08:00–16:00: you can stay indoors, ask for a shower or laundry, and charge your phone. Services may be full. The addresses are saved on your map.', locations: ['support', 'daycenter'] },
    { id: 'bed', icon: '🛏️', title: 'How can I get a shelter bed?', text: 'First registration at Night Shelter runs 19:00–22:00. Arrive by 19:00, wait the full 20-minute queue, and then find out whether there is a place. There are only 0–3 free places each day; earlier arrivals have a better chance. A successful registration reserves seven nights. The address is saved on your map.', locations: ['shelter'] },
    { id: 'no-place', icon: '🤔', title: 'What if the shelter has no places?', text: 'A discovered address does not guarantee a bed. Try registration earlier the following evening. During the day, ask Help Center about a Schronisko referral; that is a separate housing route. Day Center can offer daytime shelter, but is not an overnight bed. Station benches and outdoor cover are temporary alternatives, with no guarantee of safe sleep.', locations: ['support', 'daycenter'] },
    { id: 'supplies', icon: '🥪', title: 'Where can I get food and water?', text: 'Cheap Shop opens 07:00–22:00. Water costs 3 zł for three drinks; a bread roll costs 1 zł, a sandwich 5 zł, and a hot meal 8 zł. The shop is closed at the start of the night. You can use food and water already in your backpack. Registered shelter guests can get dinner 19:00–20:30 and breakfast 06:30–07:00; finding its address alone does not give access.', locations: ['shop'] },
    { id: 'charging', icon: '🔋', title: 'Where can I charge my phone?', text: 'You glance at the battery and remember an outlet in the waiting room at Station. You can go there tonight: it is available around the clock. Charging takes one hour and adds 60% battery, up to 100%. The station address is on your map. You do not need internet to remember this.', locations: ['station'] },
  ]
  const visibleQuestions = practicalQuestions.filter(question => answeredQuestions.includes(question.id)
    || question.id === 'morning'
    || (question.id === 'bed' && (answeredQuestions.includes('morning') || discoveredLocations.includes('shelter')))
    || (question.id === 'no-place' && answeredQuestions.includes('bed'))
    || (question.id === 'supplies' && (game.hunger <= 45 || game.thirst <= 45))
    || (question.id === 'charging' && inventory.phoneBattery <= 30))
  // One thought per direction. Urgent needs interrupt the ordered questions.
  // No random draws or reshuffling while the player is deciding.
  const nextQuestion = inventory.phoneBattery <= 30 ? 'charging'
    : game.hunger <= 45 || game.thirst <= 45 ? 'supplies'
    : ['morning', 'bed', 'no-place'].find(id => !answeredQuestions.includes(id)) ?? 'morning'
  const exhausted = game.energy <= 40
  const lastAction = journalEntries.at(-1)?.title
  const justWalked = lastAction === 'Walk through the city' || lastAction === 'Walk with music'
  const wantsBench = answeredQuestions.includes('bed') && !exhausted && lastAction !== 'Rest on the bench' && !justWalked
  const bodyChoices = exhausted ? ['bench-sleep', 'street-sleep', 'bench-rest', 'find-bench']
    : wantsBench ? [firstNight ? 'bench-rest' : 'bench-sleep', 'find-bench', 'walk', 'street-sleep']
    : (game.minutes >= 1380 && !justWalked) || !firstNight ? ['street-sleep', 'bench-sleep', 'walk']
    : game.mood <= 30 ? ['music-walk', 'walk'] : ['walk', 'music-walk']
  const practicalChoices = shelterBooked ? ['shelter-route', 'station-route']
    : firstNight ? ['station-route']
    : !discoveredLocations.includes('work') ? ['work-search', 'station-route']
    : game.money < 50 ? ['beg', 'bottles', 'station-route']
    : ['bottles', 'station-route', 'work-route']
  const streetChoiceGroups = [
    [`question-${nextQuestion}`, 'question-morning', 'shelter-search', 'help-search'],
    bodyChoices,
    practicalChoices,
  ]
  const phoneSearchCost = PHONE_SEARCH_MIN * PHONE_SEARCH_DRAIN_PER_MINUTE * phoneDrainMultiplier(inventory.phoneCondition)

  function finishPracticalQuestion(id: string, before = resultSnapshot()) {
    const question = practicalQuestions.find(entry => entry.id === id)
    if (!question) return
    const memory = id === 'charging'
    runWithResult(question.title, () => {
      const next = { ...game }
      next.mood = Math.max(next.mood, Math.min(60, next.mood + 5))
      setGame(next)
      setAnsweredQuestions(previous => [...new Set([...previous, id])])
      setDiscoveredLocations(previous => [...new Set([...previous, ...question.locations])])
      if (id === 'bed' && !shelterBooked) setActiveGoal({ type: 'night-shelter', day: game.minutes >= 1320 ? game.day + 1 : game.day, minute: 1140 })
      setInfoModal({ title: question.title, text: `${memory ? 'You remember' : 'AI'}\n\n${question.text}`, presentation: questionPresentation(id, question.locations) })
    }, before)
  }

  function answerPracticalQuestion(id: string) {
    const question = practicalQuestions.find(entry => entry.id === id)
    if (!question || phoneActivity || current.id !== 'street' || !visibleQuestions.includes(question)) return
    if (answeredQuestions.includes(id)) {
      setInfoModal({ title: question.title, text: `${id === 'charging' ? 'A remembered place' : 'AI · Saved answer'}\n\n${question.text}`, presentation: questionPresentation(id, question.locations, true), costs: [], changes: [] })
      return
    }
    if (id === 'charging') { finishPracticalQuestion(id); return }
    if (!mobileServiceActive || inventory.phoneCondition <= 0 || inventory.phoneBattery < phoneSearchCost) return
    setPhoneOpen(false)
    setScreen('location')
    const total = PHONE_SEARCH_MIN + Math.floor(Math.random() * (PHONE_SEARCH_MAX - PHONE_SEARCH_MIN + 1))
    setPhoneActivity({ questionId: id, total, remaining: total, before: resultSnapshot() })
  }

  useEffect(() => {
    if (phoneActivity && phoneActivity.remaining === phoneActivity.total) window.scrollTo?.({ top: 0, behavior: 'instant' })
  }, [phoneActivity?.questionId])

  useEffect(() => {
    if (!phoneActivity || phoneActivity.remaining === 0 || gameOver) return
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      setGame(previous => applyAction(previous, { minutes: 1 }))
      setInventory(previous => ({ ...previous, phoneBattery: Math.max(0, previous.phoneBattery - PHONE_SEARCH_DRAIN_PER_MINUTE * phoneDrainMultiplier(previous.phoneCondition)) }))
      setPhoneActivity(previous => previous ? { ...previous, remaining: Math.max(0, previous.remaining - 1) } : null)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [phoneActivity, gameOver, effects, musicOn])

  useEffect(() => {
    if (!phoneActivity || inventoryAgedAt !== absoluteMinutes(game)) return
    if (phoneActivity.remaining === 0) {
      setPhoneActivity(null)
      finishPracticalQuestion(phoneActivity.questionId, phoneActivity.before)
    } else if (inventory.phoneBattery <= 0 || !mobileServiceActive || gameOver) {
      setPhoneActivity(null)
      runWithResult('Search interrupted', () => setInfoModal({ title: 'Search interrupted', text: gameOver ? 'You could not finish the search.' : inventory.phoneBattery <= 0 ? 'Your phone ran out of battery before you could save the information.' : 'Mobile service expired before you could save the information.' }), phoneActivity.before, true, true)
    }
  }, [phoneActivity, inventoryAgedAt, inventory.phoneBattery, mobileServiceActive, gameOver])

  function takeRainCover(minutes: number) {
    runWithResult('Shelter from the rain', () => {
      setRainChoice(false)
      setCoverPlanning(false)
      const next = applyAction(game, { minutes, mood: 1 })
      setGame(next)
      setMessage(`You stand under an entrance canopy for ${minutes < 60 ? `${minutes} minutes` : `${minutes / 60} hour${minutes > 60 ? 's' : ''}`}, watching the street. You do not sleep. ${next.minutes >= 360 && next.minutes < 720 ? 'Morning is finally here.' : 'For now, you are out of the rain.'}`)
    }, resultSnapshot(), true, true)
  }

  function streetActionImpl(kind: 'find-bench' | 'bench-rest' | 'bench-sleep') {
    if (activeEvent || current.id !== 'street') return
    if (kind === 'find-bench') {
      const found = Math.random() < 0.7
      setGame((prev) => applyAction(prev, { minutes: 20, energy: -2, mood: found ? 1 : -2 }))
      setStreetBenchFound(found)
      setMessage(found ? 'You found a usable bench nearby.' : 'You looked around, but every decent place to sit is occupied or unusable.')
      return
    }
    if (!streetBenchFound) return
    if (kind === 'bench-rest') {
      setGame((prev) => applyAction(prev, { minutes: 45, energy: 18, mood: 2 }))
      setMessage('You sit on the bench and get off your feet for a while.')
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
    const total = mode === 'walk' ? destination.travelMinutes : Math.ceil(destination.travelMinutes * 0.5)
    const fare = freeTransitActive ? 0 : 4.4
    if (mode === 'transit' && game.money < fare) {
      setMessage('You do not have enough money for public transport.')
      return
    }
    recordShelterDeparture(destination.id)
    if (mode === 'transit') setGame((prev) => ({ ...prev, money: Math.max(0, prev.money - fare) }))
    setStreetBenchFound(false)
    setTrip({ destinationId: destination.id, mode, total, remaining: total, before: resultSnapshot() })
    setSelectedDestination(null)
    setScreen('travel')
    if (!activeEvent) {
      const event = pickStreetEvent('travel', { locationId: game.locationId, travelMode: mode, weather: weather.label, housing: life.housing, documents: inventory.documents }, mode === 'walk' ? 0.30 : 0.18)
      if (event) setActiveEvent(event)
    }
  }

  function actionUnavailableReason(action: (typeof actions)[number]): string | null {
    const id = action.id
    if (action.locationId !== current.id) return 'This action is available at another location.'
    if (current.id === 'shelter' && !shelterBooked && id !== 'shelter-rest') return 'Register for a place first.'
    if (id === 'shelter-rest') {
      if ((life.shelterBlockedUntilDay ?? 0) > game.day) return `Registration blocked until Day ${life.shelterBlockedUntilDay}.`
      if (!shelterBooked) {
        if (life.shelterRegistrationAttemptDay === game.day) return 'You already queued today. Try tomorrow from 19:00.'
        if (game.minutes < SHELTER_REGISTRATION_OPEN || game.minutes >= 1320) return 'Registration 19:00–22:00.'
      } else {
        const nightDay = game.minutes < 480 ? game.day - 1 : game.day
        const alreadyAdmitted = life.shelterLastStayDay === nightDay
        if (!open) return 'Night shelter opens at 18:00.'
        if (!alreadyAdmitted && (game.minutes < 1080 || game.minutes > 1320)) return 'Bed check-in 18:00–22:00.'
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
    if (current.id === 'daycenter' && actionId.startsWith('daycenter-')) {
      const hour = game.minutes / 60
      const chance = hour < 10 ? 0.9 : hour < 12 ? 0.75 : hour < 14 ? 0.55 : 0.35
      if (Math.random() > chance) {
        setGame((prev) => applyAction(prev, { minutes: 15, mood: -2 }))
        setMessage('The day center is full right now. You wait for a while, but no place opens up.')
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
      if (blocked) { setMessage(`You lost your shelter place. You can register again on Day ${life.shelterBlockedUntilDay}.`); return }
      const activeBooking = (life.shelterUntilDay ?? 0) >= game.day
      if (!activeBooking) {
        if (game.minutes < SHELTER_REGISTRATION_OPEN || game.minutes >= 1320) { setMessage('Join the registration queue between 19:00 and 22:00.'); return }
        if (life.shelterRegistrationAttemptDay === game.day) { setMessage('You already waited for registration today. Try tomorrow from 19:00.'); return }
        // Earlier applicants arrive about every 30 minutes after registration opens.
        // Keep today's vacancies and the player's queue position fixed across reloads.
        const vacancies = life.shelterVacancyDay === game.day ? life.shelterVacancies ?? 0 : Math.floor(Math.random() * 4)
        const peopleAhead = Math.floor((game.minutes - SHELTER_REGISTRATION_OPEN) / 30)
        setLife(status => ({ ...status, shelterVacancyDay: game.day, shelterVacancies: vacancies, shelterRegistrationAttemptDay: game.day }))
        setShelterQueue({ day: game.day, remaining: SHELTER_QUEUE_MINUTES, joinedAt: game.minutes, vacancies, peopleAhead, before: resultSnapshot() })
        setMusicOn(false)
        setMessage('You join the registration queue. You will know whether there is a place after 20 minutes.')
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
    const next = applyAction(game, result)
    if (washedClothes) {
      laundryCleanAt.current = absoluteMinutes(next)
      setInventory(prev => ({ ...prev, clothingCleanliness: 100 }))
    } else {
      const endCleanliness = Math.max(0, inventory.clothingCleanliness - result.minutes * (20 / 1440))
      next.hygiene = Math.min(next.hygiene, clothingHygieneCap(endCleanliness))
    }
    setGame(next)
    setMessage((result.message ?? 'Time passes.') + (isShower && hygieneLimit < 100 ? ` Dirty clothes limit Hygiene to ${hygieneLimit}. Wash your clothes to raise the limit.` : ''))

    if (actionId === 'street-sleep') {
      setLife((status) => ({ ...status, housing: 'Street', housingUntil: undefined }))
      const wakeEvent = pickStreetEvent('wake', { locationId: current.id, weather: weather.label, housing: 'Street', documents: inventory.documents }, 0.75)
      if (wakeEvent) setActiveEvent(wakeEvent)
    } else if (actionId === 'shelter-rest' && result.minutes >= 8 * 60) {
      setLife((status) => ({ ...status, housing: 'Night shelter', housingUntil: absoluteMinutes(next) }))
      const wakeEvent = pickStreetEvent('wake', { locationId: current.id, weather: weather.label, housing: 'Night shelter', documents: inventory.documents }, 0.45)
      if (wakeEvent) setActiveEvent(wakeEvent)
    } else {
      const locationEvent = pickStreetEvent('location', { locationId: current.id, weather: weather.label, housing: life.housing, documents: inventory.documents }, 0.20)
      if (locationEvent) setActiveEvent(locationEvent)
    }
    if (actionId === 'residential-stay') setLife((status) => ({ ...status, housing: 'Schronisko', housingUntil: undefined }))
    if (actionId === 'shop-meal') {
      const expiresAt = absoluteMinutes(next) + 240
      setEffects((active) => [...active.filter((effect) => effect.id !== 'well-fed'), { id: 'well-fed', expiresAt }])
    }
    if (actionId === 'daycenter-charge') {
      setInventory((prev) => ({ ...prev, phoneBattery: 100 }))
      setMessage('You wait indoors while your phone charges to 100%.')
    }
    if (actionId === 'station-charge') {
      setInventory((prev) => ({ ...prev, phoneBattery: Math.min(100, prev.phoneBattery + 60) }))
      setMessage('You spend an hour charging your phone at the station.')
    }
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
    setGame((prev) => applyAction(prev, {
      minutes: outcome.minutes ?? 0,
      money: outcome.money,
      mood: outcome.mood,
      energy: outcome.energy,
      health: outcome.health,
      hygiene: outcome.hygiene,
    }))
    setInventory((prev) => ({
      ...fitEventSupplies(prev, outcome).inventory,
      phoneCondition: Math.max(0, Math.min(100, prev.phoneCondition + (outcome.phoneCondition ?? 0))),
      jacket: Math.max(0, Math.min(100, prev.jacket + (outcome.jacketCondition ?? 0))),
      documents: outcome.loseDocuments ? false : prev.documents,
    }))
    const { rejected } = fitEventSupplies(inventory, outcome)
    setMessage(rejected.length ? `There was no backpack room for ${rejected.join(' and ')}; you left it behind.` : outcome.message)
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
    const requirements = choice.check?.requirements
    if (!requirements) return null
    if (requirements.minHealth !== undefined && game.health < requirements.minHealth) return `Too weak · need Health ${requirements.minHealth}`
    if (requirements.minEnergy !== undefined && game.energy < requirements.minEnergy) return `Too exhausted · need Energy ${requirements.minEnergy}`
    return null
  }

  function resolveStreetEvent(choice: StreetEventChoice) {
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
    applyEventOutcome(outcome)
    if (diceCheck.fareDodgeDestinationId) {
      const destination = locations.find((entry) => entry.id === diceCheck.fareDodgeDestinationId)
      if (destination) {
        const total = Math.ceil(destination.travelMinutes * 0.5)
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

  function storeItemImpl(item: 'documents' | 'medicines' | 'cigarettes') {
    if (current.id !== 'shelter' && current.id !== 'residential-shelter') return
    if (!open || (current.id === 'shelter' && !shelterBooked)) return
    if (item === 'documents') {
      if (!inventory.documents || storage.documents || usedStorageSlots >= storageCapacity) return
      setInventory((prev) => ({ ...prev, documents: false }))
      setStorage((prev) => ({ ...prev, documents: true }))
      setMessage('Documents stored safely. They are no longer carried on the street.')
      return
    }
    const amount = item === 'medicines' ? Math.min(4, inventory.medicines) : Math.min(20, inventory.cigarettes)
    if (amount <= 0) return
    const candidate = { ...storage, [item]: storage[item] + amount }
    if (storageSlots(candidate) > storageCapacity) { setMessage('Storage is full.'); return }
    setInventory((prev) => ({ ...prev, [item]: prev[item] - amount }))
    setStorage(candidate)
    setMessage(`Stored ${amount} ${item}.`)
  }

  function takeStoredItemImpl(item: 'documents' | 'medicines' | 'cigarettes') {
    if (current.id !== 'shelter' && current.id !== 'residential-shelter') return
    if (!open || (current.id === 'shelter' && !shelterBooked)) return
    if (item === 'documents') {
      if (!storage.documents || inventory.documents) return
      setStorage((prev) => ({ ...prev, documents: false }))
      setInventory((prev) => ({ ...prev, documents: true }))
      setMessage('You took your documents with you.')
      return
    }
    const amount = item === 'medicines' ? Math.min(4, storage.medicines) : Math.min(20, storage.cigarettes)
    if (amount <= 0) return
    const candidate = { ...inventory, [item]: inventory[item] + amount }
    if (backpackSlots(candidate) > BACKPACK_CAPACITY) { setMessage('Backpack full.'); return }
    setStorage((prev) => ({ ...prev, [item]: prev[item] - amount }))
    setInventory(candidate)
    setMessage(`Took ${amount} ${item} from storage.`)
  }

  function storeFoodImpl() {
    if (current.id !== 'residential-shelter' || inventory.food <= 0 || storage.food >= SCHRONISKO_FOOD_CAPACITY) return
    const amount = Math.min(inventory.food, SCHRONISKO_FOOD_CAPACITY - storage.food)
    const freshness = inventory.foodFreshness
    setInventory((prev) => ({ ...prev, food: prev.food - amount, foodFreshness: prev.food <= amount ? 100 : prev.foodFreshness }))
    setStorage((prev) => ({ ...prev, food: prev.food + amount, foodFreshness: mixFreshness(prev.food, prev.foodFreshness, amount, freshness) }))
    setMessage(`Stored ${amount} food in Schronisko.`)
  }

  function takeStoredFoodImpl() {
    if (current.id !== 'residential-shelter' || storage.food <= 0) return
    const amount = Math.min(storage.food, STACK_SIZE)
    const candidate = { ...inventory, food: inventory.food + amount }
    if (backpackSlots(candidate) > BACKPACK_CAPACITY) { setMessage('Backpack full.'); return }
    const freshness = storage.foodFreshness
    setStorage((prev) => ({ ...prev, food: prev.food - amount, foodFreshness: prev.food <= amount ? 100 : prev.foodFreshness }))
    setInventory({ ...candidate, foodFreshness: mixFreshness(inventory.food, inventory.foodFreshness, amount, freshness) })
    setMessage(`Took ${amount} food from Schronisko storage.`)
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
      const weather = WEATHER[(prev.day - 1) % WEATHER.length]
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

  function buyItemImpl(item: ShopItem) {
    if (!open || current.id !== 'shop') return
    if (game.money < item.price) {
      setMessage(`You need ${item.price.toFixed(2)} zł for that.`)
      return
    }
    if (!canAddToBackpack(inventory, item)) {
      setMessage('Backpack full. Use or remove something first.')
      return
    }
    setInventory((prev) => addShopItem(prev, item))
    setGame((prev) => applyAction(prev, { minutes: 3, money: -item.price }))
    setMessage(`Bought ${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''} for ${item.price.toFixed(2)} zł.`)
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
        failure: { minutes: 5, mood: -8, message: 'Store staff catch you trying to steal. You leave without the item.' },
        criticalSuccess: { minutes: 3, mood: 2, message: `Perfect timing. You take ${item.name} without drawing attention.` },
        criticalFailure: { minutes: 10, mood: -12, message: 'You make an obvious attempt and store staff stop you immediately.' },
      },
    }
    setDiceCheck({ choice, roll: null, modifier: checkModifier(choice), resolved: false, stealItemId: item.id })
  }

  function useSupplyImpl(item: 'bread' | 'cannedFood' | 'wipes') {
    if (inventory[item] <= 0) return
    if (item === 'wipes') {
      if (game.hygiene >= 60) { setMessage('Wet wipes cannot improve Hygiene above 60. Find a shower.'); return }
      setInventory(prev => ({ ...prev, wipes: prev.wipes - 1 }))
      setGame(prev => ({ ...prev, hygiene: Math.min(60, prev.hygiene + 10) }))
      setMessage('You cleaned up with wet wipes. Hygiene improves, up to 60.')
      return
    }
    const stale = item === 'bread' && inventory.breadFreshness <= 50
    const spoiled = item === 'bread' && inventory.breadFreshness <= 20
    setInventory(prev => ({ ...prev, [item]: prev[item] - 1,
      breadFreshness: item === 'bread' && prev.bread <= 1 ? 100 : prev.breadFreshness }))
    setGame(prev => applyAction(prev, { minutes: 0,
      hunger: item === 'cannedFood' ? 32 : spoiled ? 4 : stale ? 8 : 12,
      mood: item === 'cannedFood' ? 1 : spoiled ? -2 : 0, health: spoiled ? -3 : 0 }))
    setMessage(item === 'cannedFood' ? 'You opened the pull-tab can and ate the food.' :
      spoiled ? 'You ate a spoiled bread roll. It damaged your health and mood.' :
      stale ? 'You ate a stale bread roll. It was less filling.' : 'You ate a bread roll.')
  }

  function useMedicineImpl() {
    if (inventory.medicines <= 0) return
    const hasCold = effects.some((effect) => effect.id === 'cold')
    if (!hasCold) {
      setMessage('You are not sick. No reason to use medicine now.')
      return
    }
    setInventory((prev) => ({ ...prev, medicines: prev.medicines - 1 }))
    setEffects((prev) => prev.filter((effect) => effect.id !== 'cold'))
    setMessage('The medicine helped. Cold removed.')
  }

  function smokeCigaretteImpl() {
    if (inventory.cigarettes <= 0) return
    setInventory((prev) => ({ ...prev, cigarettes: prev.cigarettes - 1 }))
    setGame((prev) => ({ ...prev, mood: Math.min(100, prev.mood + 5), health: Math.max(0, prev.health - 0.5) }))
    setMessage('You smoked a cigarette. Mood +, health slightly worse.')
  }

  function useItemImpl(item: 'water' | 'food') {
    if (inventory[item] <= 0) return
    const freshness = inventory.foodFreshness
    setInventory(prev => ({ ...prev, [item]: prev[item] - 1,
      foodFreshness: item === 'food' && prev.food <= 1 ? 100 : prev.foodFreshness }))
    if (item === 'water') {
      setGame(prev => applyAction(prev, { minutes: 0, thirst: 38 }))
      setMessage('You drank water.')
    } else {
      const spoiled = freshness <= 20
      const stale = freshness <= 50
      setGame(prev => applyAction(prev, { minutes: 0,
        hunger: spoiled ? 10 : stale ? 20 : 28,
        health: spoiled ? -8 : 0, mood: spoiled ? -4 : stale ? 0 : 2 }))
      setMessage(spoiled ? 'You ate spoiled food. It eased hunger a little, but damaged your health and mood.' :
        stale ? 'You ate stale food. It was less filling.' : 'You ate the food from your backpack.')
    }
  }

  function reset() {
    localStorage.removeItem(SAVE_KEY)
    localStorage.removeItem(DISCOVERY_KEY)
    setDiscoveredLocations(['street', 'station', 'shop'])
    setActiveGoal(null)
    setJournalGoals({ morning: false, shelter: false, support: false, work: false })
    setJournalEntries([])
    lastRecordedResult.current = null
    localStorage.removeItem(JOURNAL_HISTORY_KEY)
    localStorage.removeItem(JOURNAL_GOALS_KEY)
    localStorage.removeItem(GOAL_KEY)
    setGame(createInitialState())
    setMessage('New run started.')
    setInfoModal(null)
    setPhoneActivity(null)
    setPendingResult(null)
    setScreen('location')
    setRainChoice(false)
    setCoverPlanning(false)
    setAnsweredQuestions([])
    setSeenMemories([])
    setTrip(null)
    setShelterQueue(null)
    setShelterDeparture(null)
    setSelectedDestination(null)
    setMusicOn(false)
    setStreetBenchFound(false)
    setBegging({ day: 1, attempts: 0 })
    setNavigationOn(true)
    setActiveEvent(null)
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
    localStorage.removeItem('street-life-inventory-v1')
    localStorage.removeItem('street-life-storage-v1')
    localStorage.removeItem('street-life-effects-v1')
    localStorage.removeItem('street-life-situation-v1')
    localStorage.removeItem('street-life-sleep-v1')
    localStorage.removeItem('street-life-trip-v1')
    localStorage.removeItem('street-life-begging-v1')
    localStorage.removeItem('street-life-shelter-queue-v1')
    localStorage.removeItem('street-life-shelter-departure-v1')
    setMobileServiceUntil(0)
    setMobileAutoRenew(true)
    setMobileRenewedDay(0)
    localStorage.removeItem('street-life-mobile-service-until')
    localStorage.removeItem('street-life-mobile-auto-renew')
    localStorage.removeItem('street-life-mobile-renewed-day')
  }

  function discoverLocation(id: string, label: string) {
    setDiscoveredLocations((prev) => prev.includes(id) ? prev : [...prev, id])
    setMessage(`${label} added to your map.`)
    setScreen('map')
  }

  const nav = (target: Screen, icon: IconName, label: string) =>
    <button disabled={!!phoneActivity} className={screen === target ? 'nav-item active' : 'nav-item'} aria-current={screen === target ? 'page' : undefined} onClick={() => setScreen(target)}><Icon name={icon} /><small>{label}</small></button>

  return <main className={`shell${screen === 'location' && current.id === 'street' ? ' street-screen' : screen === 'location' && current.id === 'shop' ? ' shop-screen' : ''}`}>
    {sleepChoice && <div className="phone-overlay result-overlay">
      <section className="phone-modal sleep-choice-modal" role="dialog" aria-modal="true" aria-labelledby="sleep-choice-title">
        <p className="eyebrow">PLAN YOUR SLEEP · TIME PAUSED</p>
        <h2 id="sleep-choice-title">How long do you want to sleep?</h2>
        <p className="muted">{sleepChoice === 'ground' ? 'On the ground' : sleepChoice === 'bench' ? 'On the bench' : sleepChoice === 'shelter' ? 'Night shelter' : 'Schronisko'}</p>
        <p className="sleep-choice-energy">Energy {Math.round(game.energy)}/100 · {game.energy > 75 ? 'Rested' : game.energy > 50 ? 'Slightly tired' : game.energy > 25 ? 'Tired' : 'Exhausted'}</p>
        <div className="sleep-duration-options" role="group" aria-label="Sleep duration">
          {SLEEP_HOURS.map(hours => {
            const reason = sleepDurationUnavailable(hours, game.energy)
            return <button key={hours} className={hours === sleepHours ? 'sleep-duration-option selected' : 'sleep-duration-option'} aria-pressed={hours === sleepHours} disabled={reason !== null} autoFocus={hours === sleepHours} onClick={() => setSleepHours(hours)}>
              <strong>{hours} h</strong><small>Wake {wakeLabel(hours, sleepChoice)}</small>
              {reason && <em>{reason}</em>}
            </button>
          })}
        </div>
        <div className="sleep-choice-preview">
          <div><small>Current time</small><strong>Day {game.day} {weekday(game.day)} · {formatTime(game.minutes)}</strong></div>
          <div><small>Wake up at</small><strong>{wakeLabel(sleepHours, sleepChoice)}</strong></div>
        </div>
        <p className="muted">Sleep time: {formatTravelTime(chosenSleepMinutes(sleepHours, sleepChoice))}.</p>
        {sleepChoice === 'shelter' && <p className="muted">Night shelter sleep ends by 07:30 so you can leave by 08:00. Longer choices are shortened automatically.</p>}
        <div className="sleep-choice-buttons">
          <button onClick={() => setSleepChoice(null)}>Cancel</button>
          <button className="trash-stop" disabled={sleepDurationUnavailable(sleepHours, game.energy) !== null} onClick={() => runWithResult('Start sleeping', () => sleep(sleepHours, sleepChoice))}>Start sleeping</button>
        </div>
      </section>
    </div>}
    {infoModal && !inlineResult && <ResultCard result={infoModal} onClose={() => setInfoModal(null)} />}
    {trashGame && <div className="trash-overlay">
      <section className="trash-card">
        <div className="trash-head"><div><p className="eyebrow">SEARCHING TRASH</p><h2>Dig for bottles</h2></div><div><strong>♻️ {trashGame.found}</strong><small> kept</small></div></div>
        <p className="trash-tip">Drag rubbish aside. Tap a bottle to check whether it can be returned.</p>
        <div className="trash-bin">
          <div className="trash-bin-rim">BIN</div>
          {trashGame.items.map((item, index) => !item.collected && <button
            key={item.id}
            className={item.bottle ? 'trash-piece bottle-piece' : 'trash-piece'}
            style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `rotate(${item.rotation}deg) scale(${item.scale})`, zIndex: index + 2 }}
            onPointerDown={(e) => { const bounds = e.currentTarget.parentElement!.getBoundingClientRect(); if (startTrashDrag(item.id, e.clientX, e.clientY, bounds)) e.currentTarget.setPointerCapture(e.pointerId) }}
            onPointerMove={(e) => { if (!e.currentTarget.hasPointerCapture(e.pointerId)) return; moveTrashItem(item.id, e.clientX, e.clientY, e.currentTarget.parentElement!.getBoundingClientRect()) }}
            onPointerUp={(e) => { const moved = trashDrag.current?.id === item.id && trashDrag.current.moved; trashDrag.current = null; if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); if (item.bottle && !moved) collectTrashBottle(item.id) }}
          >{item.icon}</button>)}
        </div>
        <div className="trash-result"><span>🎒 Bottles: {inventory.bottles}</span><span>🚫 Rejected: {trashGame.rejected}</span></div>
        <div className="trash-build">Build 2026.10.10-94</div>
        <button className="trash-stop" onClick={finishTrashSearch}>Stop searching</button>
      </section>
    </div>}

    <header className="game-header">
      <div className="header-brand-row">
        <p className="game-brand"><span>STREET LIFE</span><small className="header-version" title={BUILD_VERSION} aria-label={`Build ${BUILD_VERSION}`}>v{BUILD_VERSION.split('-').pop()}</small></p>
        <div className={`phone-charge${inventory.phoneBattery <= 20 ? ' low' : ''}`} aria-label={`Phone battery: ${Math.round(inventory.phoneBattery)}%`} title="Your phone battery">
          <Icon name="phone" /><BatteryIcon charge={inventory.phoneBattery} /><strong>{Math.round(inventory.phoneBattery)}%</strong>
        </div>
      </div>
      <div className="header-state-row">
        <h1><span className="game-day">Day {game.day} <span className="weekday">{weekday(game.day)}</span></span><time>{formatTime(game.minutes)}</time></h1>
        <div className="header-info">
          <div className="money">{game.money.toFixed(2)} zł</div>
          <div className="weather" title={weather.label} aria-label={`${weather.label}, ${temperature}°C`}><Icon name={weather.label === 'Rain' || weather.label === 'Showers' ? 'rain' : weather.label === 'Clear' ? game.minutes >= 360 && game.minutes < 1200 ? 'sun' : 'moon' : 'cloud'} />{temperature}°C</div>
        </div>
      </div>
    </header>

    {activeGoal?.type === 'night-shelter' && <section className="event"><span>🎯</span><p><strong>Goal:</strong> Be at Night Shelter on Day {activeGoal.day} at {formatTime(activeGoal.minute)} for registration.</p></section>}

    {screen === 'location' && <>
      {current.id === 'street' && <div className={`street-art${phoneActivity || inlineResult ? ' phone-art' : !infoModal?.presentation?.illustration && (game.minutes >= 1200 || game.minutes < 360) ? ' night' : ''}`} aria-hidden="true"><img src={phoneActivity ? '/street-life-game/assets/phone-search.webp' : infoModal?.presentation?.illustration ?? (inlineResult ? '/street-life-game/assets/phone-search.webp' : '/street-life-game/assets/street-hero.webp')} alt="" width="1400" height={phoneActivity || inlineResult ? 1050 : 788} fetchPriority="high" />{infoModal?.presentation?.illustration && <span className="result-art-caption">Looking ahead</span>}</div>}
      {phoneActivity ? <section className="phone-activity" aria-labelledby="phone-activity-title" aria-busy="true">
        <div className="phone-activity-heading"><p className="eyebrow">USING YOUR PHONE</p><div className="phone-activity-symbol" aria-hidden="true"><span /><span /><span /></div></div>
        <h2 id="phone-activity-title">{phoneActivity.remaining > phoneActivity.total * 2 / 3 ? 'Looking for information' : phoneActivity.remaining > phoneActivity.total / 3 ? 'Reading through the options' : 'Saving useful addresses'}</h2>
        <p>{practicalQuestions.find(question => question.id === phoneActivity.questionId)?.title}<br />Checking addresses and opening hours.</p>
        <div className="phone-activity-progress uncertain" role="progressbar" aria-label="Phone search in progress"><i /></div>
        <div className="phone-activity-meta"><span><Icon name="clock" />{phoneActivity.total - phoneActivity.remaining} min spent</span><span>Usually about {PHONE_SEARCH_ESTIMATE} min</span></div>
        <small>Time passes while you search.</small>
      </section> : inlineResult && infoModal ? <ResultCard inline result={infoModal} onClose={() => setInfoModal(null)} /> : <>
      {current.id === 'shop' ? <section className="shop-hero" aria-label="Shop"><h2>{current.name}</h2><p>{open ? 'Open' : 'Closed'} · {formatTime(current.open)}–{formatTime(current.close)}</p></section> : <section className={current.id === 'street' ? 'current location-summary story-scene' : 'current location-summary'}>
        {current.id !== 'street' && <div className="location-icon">{current.icon}</div>}
        <div><p className="eyebrow">{current.id === 'street' ? 'A MOMENT ON THE STREET' : `YOU ARE HERE · ${open ? 'OPEN' : `CLOSED · OPENS AT ${formatTime(current.open)}`}`} </p><h2>{current.name}</h2><p>{current.id === 'street' ? streetScene : current.description}</p></div>
      </section>}
      {message && current.id !== 'street' && <section className="event"><span>●</span><p>{message}</p></section>}
      <ClosedContent closed={!open && current.id !== 'hospital' && !currentActions.some(action => actionUnavailableReason(action) === null)} opensAt={formatTime(current.open)}>
      {shelterInterview && <section className="shop">
        <div className="shop-heading"><div><p className="eyebrow">SOCIAL WORKER</p><h2>{shelterInterview.step === 'reason' ? 'Why do you still need a place?' : shelterInterview.step === 'action' ? 'What are you doing about your situation?' : 'What will you do next?'}</h2></div></div>
        <div className="shop-grid">
          {shelterInterview.step === 'reason' && <>
            <button className="shop-item" onClick={() => answerShelterInterview('work')}><div><strong>I still cannot afford housing</strong><small>I am trying to get enough stable income.</small></div></button>
            <button className="shop-item" onClick={() => answerShelterInterview('documents')}><div><strong>I am sorting out documents/support</strong><small>The process is not finished yet.</small></div></button>
            <button className="shop-item" onClick={() => answerShelterInterview('health')}><div><strong>Health is making things difficult</strong><small>I need more time to stabilize.</small></div></button>
          </>}
          {shelterInterview.step === 'action' && <>
            <button className="shop-item" onClick={() => answerShelterInterview('job')}><div><strong>I am looking for work</strong><small>Applications and job-search activity.</small></div></button>
            <button className="shop-item" onClick={() => answerShelterInterview('documents')}><div><strong>I am working on documents or benefits</strong><small>Administrative steps are already underway.</small></div></button>
            <button className="shop-item" onClick={() => answerShelterInterview('nothing')}><div><strong>Nothing concrete yet</strong><small>I have not made much progress.</small></div></button>
          </>}
          {shelterInterview.step === 'plan' && <>
            <button className="shop-item" onClick={() => answerShelterInterview('jobcenter')}><div><strong>Go to the Job Centre</strong><small>Take a concrete step toward regular work.</small></div></button>
            <button className="shop-item" onClick={() => answerShelterInterview('daywork')}><div><strong>Take available day work</strong><small>Start earning while looking for something stable.</small></div></button>
            <button className="shop-item" onClick={() => answerShelterInterview('documents')}><div><strong>Finish document/support matters</strong><small>Continue the administrative process.</small></div></button>
            <button className="shop-item" onClick={() => answerShelterInterview('nothing')}><div><strong>I cannot promise anything yet</strong><small>No concrete next step.</small></div></button>
          </>}
        </div>
      </section>}
      {current.id === 'shop' && <section className="shop">
        <div className="shop-capacity"><Icon name="backpack" /><strong>Backpack</strong><span>{usedBackpackSlots} / {BACKPACK_CAPACITY} slots</span><div className="shop-capacity-bar" role="meter" aria-label="Backpack capacity" aria-valuenow={usedBackpackSlots} aria-valuemin={0} aria-valuemax={BACKPACK_CAPACITY}><i style={{ width: `${usedBackpackSlots / BACKPACK_CAPACITY * 100}%` }} /></div></div>
        {inventory.bottles > 0 && <button className="shop-return" onClick={returnBottles} disabled={!open}><Icon name="bottle" /><span><strong>Return bottles ×{inventory.bottles}</strong><small>Deposit return · 0.50 zł each</small></span><b>+{(inventory.bottles * BOTTLE_DEPOSIT).toFixed(2)} zł</b></button>}
        {[{ title: 'Food & drink', items: SHOP_ITEMS.slice(0, 4) }, { title: 'Care', items: SHOP_ITEMS.slice(4) }].map(group => <section className="shop-category" key={group.title} aria-label={group.title}>
          <h3>{group.title}</h3><div className="shop-grid supply-grid">{group.items.map(item => <ShopCard key={item.id} item={item} open={open} fits={canAddToBackpack(inventory, item)} affordable={game.money >= item.price} onBuy={() => buyItem(item)} onSteal={() => stealItem(item)} />)}</div>
        </section>)}
        <button className="shop-meal" onClick={() => act('shop-meal')} disabled={!open || game.money < 8}><span>🍲</span><div><strong>Hot meal · eat now</strong><small>Does not use backpack space · ~15 min</small><div className="shop-impact"><em className="positive">Food +++</em><em className="positive">Thirst +</em><em className="positive">Mood +</em><em className="positive">Well fed · 4h</em></div></div><b>8.00 zł</b></button>
      </section>}
      {current.id === 'support' && <section className="support-menu">
        <div className="section-title"><h2>Talk to a social worker</h2><span>Choose what you need help with</span></div>
        <AvailableFirst tag="div" className="support-grid">
          <button onClick={() => socialSupport('housing')} disabled={!open}><span>🏠</span><div><strong>Housing</strong><small>{life.schroniskoReferral ? 'Referral issued · Schronisko unlocked' : 'Ask about stable accommodation'}</small></div></button>
          <button onClick={() => socialSupport('documents')} disabled={!open}><span>📄</span><div><strong>Documents</strong><small>{inventory.documents ? 'Documents complete' : 'Restore missing documents'}</small></div></button>
          <button onClick={() => socialSupport('transport')} disabled={!open || !inventory.documents}><span>🎫</span><div><strong>Transport</strong><small>Apply for 3 days of free public transport</small></div></button>
          <button onClick={() => socialSupport('benefits')} disabled={!open || !inventory.documents}><span>💰</span><div><strong>Benefits</strong><small>Ask what financial support is available</small></div></button>
        </AvailableFirst>
      </section>}
      {((current.id === 'shelter' && shelterBooked) || current.id === 'residential-shelter') && <section className="storage-panel">
        <div className="storage-heading"><div><p className="eyebrow">SAFE STORAGE</p><h2>Stored belongings</h2></div><span>{usedStorageSlots}/{storageCapacity} slots</span></div>
        <p className="storage-note">{current.id === 'residential-shelter' ? 'Schronisko gives you more long-term storage.' : 'Night shelter has limited storage.'} {current.id === 'residential-shelter' ? ' Water must stay in your backpack; Schronisko has a separate small food shelf.' : ' Food and water must stay in your backpack.'}</p>
        <div className="storage-grid">
          <div><strong>🪪 Documents</strong><small>{storage.documents ? 'Stored safely' : inventory.documents ? 'Carried with you' : 'Missing'}</small><button onClick={() => storage.documents ? takeStoredItem('documents') : storeItem('documents')} disabled={!open || (storage.documents ? inventory.documents : !inventory.documents)}>{storage.documents ? 'Take' : 'Store'}</button></div>
          <div><strong>💊 Medicine ×{storage.medicines}</strong><small>Store/take up to one stack</small><button onClick={() => inventory.medicines > 0 ? storeItem('medicines') : takeStoredItem('medicines')} disabled={!open || (inventory.medicines <= 0 && storage.medicines <= 0)}>{inventory.medicines > 0 ? 'Store' : 'Take'}</button></div>
          <div><strong>🚬 Cigarettes ×{storage.cigarettes}</strong><small>Store/take up to one stack</small><button onClick={() => inventory.cigarettes > 0 ? storeItem('cigarettes') : takeStoredItem('cigarettes')} disabled={!open || (inventory.cigarettes <= 0 && storage.cigarettes <= 0)}>{inventory.cigarettes > 0 ? 'Store' : 'Take'}</button></div>
          {current.id === 'residential-shelter' && <div><strong>🥪 Food ×{storage.food}/{SCHRONISKO_FOOD_CAPACITY}</strong><small>Separate food shelf · {storage.food > 0 ? `${foodFreshnessLabel(storage.foodFreshness)} · ${Math.round(storage.foodFreshness)}%` : 'empty'}</small><div className="freshness-bar"><i style={{ width: `${storage.food > 0 ? storage.foodFreshness : 0}%` }} /></div><button onClick={() => inventory.food > 0 && storage.food < SCHRONISKO_FOOD_CAPACITY ? storeFood() : takeStoredFood()} disabled={!open || ((inventory.food <= 0 || storage.food >= SCHRONISKO_FOOD_CAPACITY) && storage.food <= 0)}>{inventory.food > 0 && storage.food < SCHRONISKO_FOOD_CAPACITY ? 'Store' : 'Take'}</button></div>}
        </div>
      </section>}
      {(current.id === 'support' || current.id === 'residential-shelter') && <section className="charging-station">
        <button className="action" onClick={chargePhone} disabled={!open || inventory.phoneBattery >= 100}>
          <div><strong>🔌 Charge phone</strong><small>Use a public socket for 30 minutes.</small></div><span>+25% · ~30 min</span>
        </button>
      </section>}
      {current.id === 'work' && <AvailableFirst className="actions">
        <button className="action" onClick={takeDayWork} disabled={!open || game.energy < dayWorkEnergyRequired}>
          <div><strong>Take a short shift</strong><small>{game.energy < dayWorkEnergyRequired ? `Need at least ${dayWorkEnergyRequired} Energy · current ${Math.floor(game.energy)}` : 'Three hours of physical work. Pays 35 zł.'}</small></div><span>+35 zł · ~180 min</span>
        </button>
      </AvailableFirst>}
      {current.id !== 'shop' && current.id !== 'work' && current.id !== 'support' && <>
        {current.id === 'street' ? <section className="story-choices">
          <p className="eyebrow"><Icon name="pause" />TIME PAUSED</p>
          <h2>What matters most right now?</h2>
        </section> : <div className="section-title"><h2>What do you do?</h2><span>Actions move time forward</span></div>}
        <AvailableFirst className={current.id === 'street' ? 'actions story-actions' : 'actions'} thoughtsOnly={current.id === 'street'} choiceGroups={streetChoiceGroups}>
          {current.id === 'hospital' && <>
            <button className="action" onClick={hospitalVisit} disabled={!open || !inventory.documents}><div><strong>🩺 Regular medical appointment</strong><small>{!inventory.documents ? 'Documents required.' : open ? 'See a doctor and receive proper treatment.' : 'Regular care is closed.'}</small></div><span>~90 min</span></button>
          </>}
          {current.id === 'street' && <>
            <button className="action" data-choice="question-morning" aria-label="Where can I get help in the morning?" onClick={() => answerPracticalQuestion('morning')} disabled={!answeredQuestions.includes('morning') && (!mobileServiceActive || inventory.phoneCondition <= 0 || inventory.phoneBattery < phoneSearchCost)}><div><strong><span className="choice-emoji" aria-hidden="true">📱</span>{answeredQuestions.includes('morning') ? 'What did it say about getting help in the morning?' : 'Maybe my phone can help… I need somewhere to start.'}</strong><small className="choice-estimate">{answeredQuestions.includes('morning') ? 'Saved answer · free' : `Approx. ${PHONE_SEARCH_ESTIMATE} min`}</small></div><span>{answeredQuestions.includes('morning') ? 'Notes' : `Approx. ${PHONE_SEARCH_ESTIMATE} min · uses battery`}</span></button>
            {visibleQuestions.filter(question => question.id !== 'morning').map(question => {
              const saved = answeredQuestions.includes(question.id)
              const memory = question.id === 'charging'
              return <button className="action" data-choice={`question-${question.id}`} aria-label={question.title} key={question.id} onClick={() => answerPracticalQuestion(question.id)} disabled={!saved && !memory && (!mobileServiceActive || inventory.phoneCondition <= 0 || inventory.phoneBattery < phoneSearchCost)}><div><strong><span className="choice-emoji" aria-hidden="true">{question.icon}</span>{question.title}</strong><small className="choice-estimate">{memory ? 'Remember · free' : saved ? 'Saved answer · free' : `Approx. ${PHONE_SEARCH_ESTIMATE} min`}</small></div><span>{saved ? 'Notes' : memory ? 'Remember · free' : `Approx. ${PHONE_SEARCH_ESTIMATE} min · uses battery`}</span></button>
            })}
            {<button className="action" data-choice="music-walk" onClick={() => walkCity(true)} disabled={!canWalkWithMusic}><div><strong><span className="choice-emoji" aria-hidden="true">🎧</span>Something familiar to listen to… I don’t want this silence.</strong><small>{canWalkWithMusic ? 'You have a few familiar songs on your phone. The walk still takes time and uses battery.' : 'Needs a working phone, mobile service and enough battery.'}</small></div><span>~30 min · −{walkMusicCost.toFixed(1)}% battery</span></button>}
            {<button className="action" aria-label="Just one more street. I’m not ready to lie down." data-choice="walk" onClick={() => walkCity()}><div><strong><span className="choice-emoji" aria-hidden="true">🚶</span>Just one more street. I’m not ready to lie down.</strong><small>Closed shops, lit windows, another crossing. You can keep moving for half an hour.</small></div><span>~30 min</span></button>}
            {discoveredLocations.includes('shelter') && <button className="action" data-choice="shelter-route" disabled={firstNight && !shelterBooked} onClick={() => { setScreen('map'); chooseDestination('shelter') }}><div><strong><span className="choice-emoji" aria-hidden="true">🛏️</span>What about Night Shelter? Maybe there is a place.</strong><small>{shelterBooked ? 'You have a reserved bed.' : firstNight ? 'Registration is closed tonight. Come tomorrow at 19:00; a place is not guaranteed.' : 'Registration starts at 19:00; places are limited.'}</small></div><span>Choose route</span></button>}
            {!firstNight && discoveredLocations.includes('work') && <button className="action" data-choice="work-route" onClick={() => { setScreen('map'); chooseDestination('work') }}><div><strong>Go to Day Work</strong><small>Ask about a short shift.</small></div><span>Choose route</span></button>}
            {<button className="action" data-choice="station-route" aria-label="Maybe the station? At least I could sit down." onClick={() => { setScreen('map'); chooseDestination('station') }}><div><strong><span className="choice-emoji" aria-hidden="true">🚉</span>Maybe the station? At least I could sit down.</strong><small>A place to sit; safe sleep is not guaranteed.</small></div><span>Choose route</span></button>}
            {!discoveredLocations.includes('shelter') && <button className="action" data-choice="shelter-search" onClick={() => searchOnlineFor('shelter')} disabled={!mobileServiceActive || inventory.phoneBattery < 2}><div><strong>📱 There must be somewhere to sleep… Let me look.</strong><small>{mobileServiceActive ? 'Look for somewhere safer to spend the night.' : 'Mobile internet required.'}</small></div><span>~15 min</span></button>}
            {!firstNight && !discoveredLocations.includes('work') && <button className="action" data-choice="work-search" onClick={() => searchOnlineFor('work')} disabled={!mobileServiceActive || inventory.phoneBattery < 2}><div><strong>💰 Could I find a little work? I need to keep some money.</strong><small>{mobileServiceActive ? 'Look for a way to earn some money.' : 'Mobile internet required.'}</small></div><span>~15 min</span></button>}
            {!discoveredLocations.includes('support') && <button className="action" data-choice="help-search" onClick={() => searchOnlineFor('help')} disabled={!mobileServiceActive || inventory.phoneBattery < 2}><div><strong>🆘 Someone must know what I can do tomorrow.</strong><small>{mobileServiceActive ? 'Find an organization that can explain your options.' : 'Mobile internet required.'}</small></div><span>~15 min</span></button>}
            {!firstNight && <button className="action" data-choice="beg" onClick={askForMoney} disabled={(begging.day === game.day ? begging.attempts : 0) >= 3}><div><strong>🤲 Ask someone for change? It’s hard, but I could try.</strong><small>{(begging.day === game.day ? begging.attempts : 0) >= 3 ? 'No useful attempts left today.' : `Spend time asking for small change · ${3 - (begging.day === game.day ? begging.attempts : 0)}/3 attempts left today.`}</small></div><span>~45 min</span></button>}
            {!firstNight && <button className="action" data-choice="bottles" onClick={searchStreetBottles}><div><strong>♻️ Maybe there are bottles I could return for a little money.</strong><small>Dig through the pile yourself. Move rubbish aside and tap bottles you uncover.</small></div><span>~10–60 min</span></button>}
            {!streetBenchFound && <button className="action" data-choice="find-bench" onClick={() => streetAction('find-bench')}><div><strong>🪑 Is there a bench nearby? My legs could use a break.</strong><small>Search nearby for somewhere usable to sit or sleep.</small></div><span>~20 min</span></button>}
            {streetBenchFound && <button className="action" data-choice="bench-rest" onClick={() => streetAction('bench-rest')}><div><strong>🪑 I’ll sit for a bit. Just get off my feet.</strong><small>Get off your feet and recover some Energy.</small></div><span>~45 min</span></button>}
            {streetBenchFound && <button className="action" data-choice="bench-sleep" onClick={() => streetAction('bench-sleep')}><div><strong>😴 Could I sleep here? What about my backpack…</strong><small>Still exposed, but better than sleeping on the ground.</small></div><span>Choose duration</span></button>}
          </>}
          {currentActions.length ? currentActions.map((action) => {
            const registering = action.id === 'shelter-rest' && !shelterBooked
            const selectableSleep = action.id === 'street-sleep' || action.id === 'station-sleep' || (action.id === 'shelter-rest' && shelterBooked) || action.id === 'residential-sleep'
            const unavailableReason = actionUnavailableReason(action)
            const unavailable = unavailableReason !== null
            return <button className="action" data-choice={action.id} key={action.id} onClick={() => act(action.id)} disabled={unavailable}>
              <div><strong>{action.id === 'street-sleep' && <span className="choice-emoji" aria-hidden="true">🛌</span>}{registering ? 'Join registration queue' : action.id === 'shelter-rest' ? 'Use your reserved bed' : action.id === 'street-sleep' ? 'Lie down here? I’m not sure… But I could try.' : action.name}</strong><small>{registering ? life.shelterRegistrationAttemptDay === game.day ? 'No places left for you today. Try tomorrow from 19:00.' : 'Registration 19:00–22:00 · wait 20 min. Earlier arrivals have a better chance; places are limited.' : action.id === 'shelter-rest' ? 'Use your reserved bed · arrive 18:00–22:00 and leave by 08:00.' : action.id === 'shelter-shower' || action.id === 'daycenter-shower' ? inventory.showerGel > 0 ? `3-in-1 gel: Hygiene gain ×1.5, max ${hygieneLimit} · uses 1 automatically.` : `Water only: Hygiene max ${Math.min(70, hygieneLimit)}. Bring 3-in-1 shower gel for better cleaning.` : action.description}{(action.id === 'shelter-shower' || action.id === 'daycenter-shower') && hygieneLimit < 100 && ` Dirty clothes: Hygiene max ${hygieneLimit}.`}{unavailableReason && <em className="action-unavailable-reason">{unavailableReason}</em>}</small></div>
              <span>{selectableSleep ? 'Choose duration' : <>{action.cost ? `${action.cost} zł · ` : ''}~{registering ? SHELTER_QUEUE_MINUTES : action.minutes} min</>}</span>
            </button>
          }) : <p className="empty">Nothing useful to do here yet.</p>}
        </AvailableFirst>
      </>}
      </ClosedContent>
      </>}
    </>}


    {screen === 'map' && <CityMap
      places={locations.filter(location => discoveredLocations.includes(location.id) && (location.id !== 'residential-shelter' || life.schroniskoReferral || life.housing === 'Schronisko'))}
      currentId={game.locationId} minutes={game.minutes} reservedBed={shelterBooked} routeId={selectedDestination} onRoute={chooseDestination}
    />}

    {screen === 'travel' && trip && (() => {
      const destination = locations.find((x) => x.id === trip.destinationId)
      const progress = ((trip.total - trip.remaining) / trip.total) * 100
      return <section className="travel-screen">
        <div className="travel-icon">{trip.mode === 'walk' ? '🚶' : '🚌'}</div>
        <p className="eyebrow">ON THE WAY</p>
        <h2>{current.name} → {destination?.name}</h2>
        <p>{trip.mode === 'walk' ? 'Walking costs more energy and a little extra water.' : 'Public transport is faster and saves your energy.'}</p>
        <div className="travel-progress"><i style={{ width: `${progress}%` }} /></div>
        <strong>{formatTravelTime(trip.remaining)} remaining</strong>
        <small>{trip.remaining} real seconds</small>
      </section>
    })()}

    {selectedDestination && screen === 'map' && (() => {
      const destination = locations.find((x) => x.id === selectedDestination)
      if (!destination) return null
      const transitMinutes = Math.ceil(destination.travelMinutes * 0.5)
      return <div className="travel-sheet">
        <button className="sheet-close" onClick={() => setSelectedDestination(null)}>×</button>
        <p className="eyebrow">TRAVEL TO</p>
        <h2><Icon name={locationIcon(destination.id)} /> {destination.name}</h2>
        <button className="travel-option" onClick={() => startTravel('walk')}>
          <Icon name="walk" /><div><strong>Walk</strong><small>{formatTravelTime(destination.travelMinutes)} · free · more hunger & thirst</small></div>
        </button>
        <button className="travel-option" onClick={() => startTravel('transit')} disabled={!freeTransitActive && game.money < 4.4}>
          <Icon name="station" /><div><strong>Public transport</strong><small>{formatTravelTime(transitMinutes)} · {freeTransitActive ? 'FREE' : '4.40 zł'} · less physical strain</small></div>
        </button>
        {!freeTransitActive && <button className="travel-option" onClick={attemptFareDodge}>
          <Icon name="coins" /><div><strong>Ride without ticket</strong><small>{formatTravelTime(transitMinutes)} · free</small><small>Risk: 20–35 zł fine</small></div>
        </button>}

      </div>
    })()}

    {screen === 'inventory' && <section className="inventory-screen">
      <div className="inventory-heading"><div><p className="eyebrow">INVENTORY</p><h2>Your things</h2></div></div>

      <div className="inventory-section-heading"><div><strong>🎒 Backpack</strong><small>Consumables use slots</small></div><span>{usedBackpackSlots} / {BACKPACK_CAPACITY} slots</span></div>
      <div className="backpack-capacity"><i style={{ width: `${(usedBackpackSlots / BACKPACK_CAPACITY) * 100}%` }} /></div>
      <div className="inventory-grid backpack-grid">
        {inventory.water > 0 && <button className="inventory-item usable" onClick={() => useItem('water')}>
          <span className="item-icon">💧</span><div><strong>Water ×{inventory.water}</strong><small>tap to drink</small></div>
        </button>}
        {inventory.food > 0 && <button className="inventory-item usable" onClick={() => useItem('food')}>
          <span className="item-icon">🥪</span><div><strong>Food</strong><small>×{inventory.food} · tap to eat</small></div>
        </button>}
        {inventory.bread > 0 && <button className="inventory-item usable" onClick={() => useSupply('bread')}>
          <span className="item-icon">🥖</span><div><strong>Bread roll ×{inventory.bread}</strong><small>{foodFreshnessLabel(inventory.breadFreshness)} · tap to eat</small></div>
        </button>}
        {inventory.cannedFood > 0 && <button className="inventory-item usable" onClick={() => useSupply('cannedFood')}>
          <span className="item-icon">🥫</span><div><strong>Canned food ×{inventory.cannedFood}</strong><small>Keeps well · tap to eat</small></div>
        </button>}
        {inventory.wipes > 0 && <button className="inventory-item usable" onClick={() => useSupply('wipes')} disabled={game.hygiene >= 60}>
          <span className="item-icon">🧻</span><div><strong>Wet wipes ×{inventory.wipes}</strong><small>{game.hygiene >= 60 ? 'Hygiene 60+ · find a shower' : 'tap to clean · Hygiene +'}</small></div>
        </button>}
        {inventory.bottles > 0 && Array.from({ length: Math.ceil(inventory.bottles / BOTTLE_STACK_SIZE) }, (_, stackIndex) => {
          const stackCount = Math.min(BOTTLE_STACK_SIZE, inventory.bottles - stackIndex * BOTTLE_STACK_SIZE)
          return <div className="inventory-item" key={`bottle-stack-${stackIndex}`}><span className="item-icon">♻️</span><div><strong>Returnable bottles</strong><small>×{stackCount} / {BOTTLE_STACK_SIZE} · 0.50 zł each</small></div></div>
        })}
        {inventory.cigarettes > 0 && <button className="inventory-item usable" onClick={smokeCigarette}>
          <span className="item-icon">🚬</span><div><strong>Cigarettes</strong><small>×{inventory.cigarettes} · tap to smoke</small></div>
        </button>}
        {inventory.medicines > 0 && <button className="inventory-item usable" onClick={useMedicine}>
          <span className="item-icon">💊</span><div><strong>Medicine</strong><small>×{inventory.medicines} · treats Cold</small></div>
        </button>}
      </div>

      <div className="inventory-section-heading essentials-heading"><div><strong>👤 Equipped & essentials</strong><small>{inventory.showerGel > 0 ? 'Gel uses backpack space; other equipment is slot-free' : 'These do not use backpack slots'}</small></div></div>
      {phoneOpen && <div className="phone-overlay" onClick={() => setPhoneOpen(false)}><div className="phone-modal" onClick={(event) => event.stopPropagation()}><button className="sheet-close" onClick={() => setPhoneOpen(false)}>×</button><div className="phone-panel">
        <div className="phone-panel-heading"><strong>📱 Phone use</strong><span>{Math.round(inventory.phoneBattery)}%</span></div>
        <button className="action" onClick={buyMobileService} disabled={game.money < 1}><div><strong>📶 Mobile service</strong><small>{mobileServiceActive ? `Active · ${mobileServiceMinutesLeft >= 60 ? Math.ceil(mobileServiceMinutesLeft / 60) + 'h left' : mobileServiceMinutesLeft + 'm left'}` : 'No active service'} · Navigation, Music & Video</small></div><span>1 zł · +24h</span></button>
        <button className="action" onClick={() => setMobileAutoRenew((value) => !value)}><div><strong>⚙️ Auto-renew mobile service</strong><small>Renew expired service automatically for 1 zł</small></div><span>{mobileAutoRenew ? 'ON' : 'OFF'}</span></button>
        <AvailableFirst tag="div" className="phone-actions">
          {current.id === 'street' && <button disabled={!answeredQuestions.includes('morning') && (!mobileServiceActive || inventory.phoneCondition <= 0 || inventory.phoneBattery < phoneSearchCost)} onClick={() => { setPhoneOpen(false); setScreen('location'); answerPracticalQuestion('morning') }}><span>💬</span><div><strong>Ask AI</strong><small>Approx. 15 min for a new answer · saved answers free</small></div></button>}
          <button onClick={() => setNavigationOn((value) => !value)} disabled={inventory.phoneBattery <= 0 || !mobileServiceActive}><span>🧭</span><div><strong>Navigation {navigationOn ? 'ON' : 'OFF'}</strong><small>{weather.label === 'Clear' ? '15%/h in bright sun' : '12%/h while travelling'}</small></div></button>
          <button onClick={() => setMusicOn((value) => !value)} disabled={inventory.phoneBattery <= 0 || !mobileServiceActive}><span>🎵</span><div><strong>Music {musicOn ? 'ON' : 'OFF'}</strong><small>4%/h · slowly improves Mood</small></div></button>
          <button onClick={watchVideo} disabled={!mobileServiceActive || inventory.phoneBattery < 9 * phoneDrainMultiplier(inventory.phoneCondition)}><span>🎬</span><div><strong>Watch video</strong><small>30 min · ~−{Math.round(9 * phoneDrainMultiplier(inventory.phoneCondition))}% · Mood +</small></div></button>
          <button onClick={callAmbulance} disabled={game.health > 20 || inventory.phoneBattery <= 0 || inventory.phoneCondition <= 0}><span>🚑</span><div><strong>Call ambulance</strong><small>{game.health <= 20 ? 'Emergency · no documents required' : 'Available at Health 20 or lower'}</small></div></button>
        </AvailableFirst>
      </div></div></div>}
      <div className="inventory-grid essentials-grid">
        <button className="inventory-item usable" onClick={() => setPhoneOpen(true)}>
          <span className="item-icon">📱</span><div><strong>Phone</strong><small>Battery {Math.round(inventory.phoneBattery)}% · tap to open</small><div className="item-meter"><i style={{ width: `${inventory.phoneBattery}%` }} /></div></div>
        </button>
        <div className="inventory-item">
          <span className="item-icon">🧥</span><div><strong>Clothing</strong><small>Condition {Math.round(inventory.jacket)}% · Cleanliness {Math.round(inventory.clothingCleanliness)}%</small><div className="item-meter"><i style={{ width: `${inventory.clothingCleanliness}%` }} /></div><small>Hygiene max {hygieneLimit}</small></div>
        </div>
        <div className="inventory-item">
          <span className="item-icon">🪪</span><div><strong>Documents</strong><small>{inventory.documents ? 'With you' : 'Missing'}</small></div>
        </div>
        <div className="inventory-item">
          <span className="item-icon">🎫</span><div><strong>Transit card</strong><small>{inventory.transitCard ? 'Active' : 'Missing'}</small></div>
        </div>
        {inventory.showerGel > 0 && <div className="inventory-item">
          <span className="item-icon">🧴</span><div><strong>3-in-1 shower gel ×{inventory.showerGel}</strong><small>Uses left · automatic with a shower · Hygiene max 100</small></div>
        </div>}
      </div>
    </section>}
    {screen === 'status' && <section className="status-screen">
      <div className="status-needs">
        <Stat icon="🍞" label="Food" value={game.hunger} compact />
        <Stat icon="💧" label="Thirst" value={game.thirst} compact />
        <Stat icon="⚡" label={energyCap(game.health) < 100 ? `Energy · max ${energyCap(game.health)}` : 'Energy'} value={game.energy} compact />
        <Stat icon="❤️" label="Health" value={game.health} compact />
        <Stat icon="🚿" label={hygieneLimit < 100 ? `Hygiene · max ${hygieneLimit}` : 'Hygiene'} value={game.hygiene} compact />
        <Stat icon="🙂" label="Mood" value={game.mood} compact />
      </div>
      <div className="life-heading"><h3>Life situation</h3><span>Current status</span></div>
      <div className="life-situation">
        <div className="life-card"><span>🏠</span><div><small>Housing</small><strong>{life.housing}</strong></div></div>
        <div className="life-card"><span>💼</span><div><small>Employment</small><strong>{life.employment}</strong></div></div>
        <div className="life-card"><span>💰</span><div><small>Income</small><strong>{life.income}</strong></div></div>
        <div className="life-card"><span>📄</span><div><small>Documents</small><strong>{inventory.documents ? 'With you' : storage.documents ? 'Stored safely' : 'Missing'}</strong></div></div>
      </div>
      <div className="effects-heading"><h3>Effects</h3><span>{effects.length} active</span></div>
      <div className="effects-list">
        {effects.length ? effects.map((active) => {
          const effect = EFFECTS[active.id]
          return <div className={`effect ${effect.kind}`} key={active.id}><span>{effect.icon}</span><div className="effect-body"><strong>{effect.name}</strong><div className="effect-impact">{effect.impacts.map((impact) => <b key={impact}>{impact}</b>)}</div></div><small className="effect-time">{remainingEffect(active.expiresAt, game)}</small></div>
        }) : <p className="empty">No active effects.</p>}
      </div>
    </section>}
    {screen === 'journal' && <section className="journal-screen">
      <div className="journal-heading"><div><p className="eyebrow">DAY {game.day} · {weekday(game.day)}</p><h2>Journal</h2></div><span>📓</span></div>

      <div className="next-event">
        <div className="next-event-icon">⏰</div>
        <div><p className="eyebrow">NEXT IMPORTANT</p><strong>{activeGoal ? `Night Shelter · Day ${activeGoal.day} at ${formatTime(activeGoal.minute)}` : nextJournalGoal?.title ?? 'All starting goals completed'}</strong><small>{activeGoal ? 'Arrive for registration; a bed is not guaranteed.' : nextJournalGoal?.description ?? 'Keep managing your needs and plan your next day.'}</small></div>
        {activeGoal && <b>{formatTime(activeGoal.minute)}</b>}
      </div>

      <div className="journal-section-title"><h3>🎯 Goals</h3><span>{completedGoals} / {goals.length}</span></div>
      <div className="goal-list">
        {goals.map(goal => <div className={journalGoals[goal.id] ? 'goal done' : 'goal'} key={goal.id}>
          <span>{journalGoals[goal.id] ? '✓' : '○'}</span><div><strong>{goal.title}</strong><small>{goal.description}</small></div>
        </div>)}
      </div>

      <div className="journal-section-title"><h3>📝 Today</h3><span>Day {game.day}</span></div>
      <div className="timeline">
        {journalEntries.filter(entry => entry.day === game.day).map((entry, index) => <div className="timeline-entry" key={`${entry.day}-${index}`}>
          <time>{formatTime(entry.minute)}</time><i /><div><strong>{entry.title}</strong><small>{entry.text}</small>
            <div className="journal-result-changes">{[...entry.summary.costs, ...entry.summary.changes].map((change, changeIndex) => <span className={`journal-result-change ${change.kind}`} key={changeIndex}>{change.label} {change.value}</span>)}</div>
          </div>
        </div>)}
        {!journalEntries.some(entry => entry.day === game.day) && <p className="empty">No recorded actions today yet.</p>}
        <div className="timeline-entry"><time>{formatTime(game.minutes)}</time><i /><div><strong>Current situation</strong><small>You are at {current.name}. Condition: {overall.label.toLowerCase()}.</small></div></div>
      </div>
    </section>}

    {gameOver && <div className="game-over-overlay">
      <section className="game-over-card">
        <div className="game-over-icon">❤️‍🩹</div>
        <p className="eyebrow">RUN OVER</p>
        <h2>Your health reached zero</h2>
        <p>You made it to Day {game.day}. Food, water and medicine can stop causes of damage, but lost health needs proper recovery and care.</p>
        <button onClick={reset}>Start new run</button>
      </section>
    </div>}

    {!gameOver && rainChoice && !infoModal && !pendingResult && <div className="event-overlay" role="dialog" aria-modal="true" aria-label="Rain on the street">
      <section className="sleep-card"><p className="eyebrow">RAIN · TIME PAUSED</p><h2>{coverPlanning ? 'Wait out the night' : 'The rain is getting heavier'}</h2><p>{coverPlanning ? 'You can stay under the canopy without lying down. You remain awake; hunger, thirst and tiredness keep growing while you wait.' : 'Rain runs off the edge of a nearby canopy. The shop behind it is closed. Light is still on at the station.'}</p>
        <div className="story-intents">
          {coverPlanning ? <>
            {[15, 60, 240].map(minutes => <button key={minutes} onClick={() => takeRainCover(minutes)}><span className="choice-emoji" aria-hidden="true">⏳</span>{minutes === 15 ? 'Just fifteen minutes. Then I’ll see.' : minutes === 60 ? 'Maybe an hour here. Stay out of the rain.' : minutes === 180 ? 'Three hours… I could wait it out here.' : 'Maybe four hours. I can wait here.'} · until {formatTime((game.minutes + minutes) % 1440)}</button>)}
            <button onClick={() => setCoverPlanning(false)}>Choose another option</button>
          </> : <>
          <button onClick={() => setCoverPlanning(true)}><span className="choice-emoji" aria-hidden="true">☔</span>At least it looks dry under that canopy.</button>
          <button onClick={() => { setRainChoice(false); setScreen('map'); chooseDestination('station') }}><span className="choice-emoji" aria-hidden="true">🚉</span>Maybe the station? At least I could sit down.</button>
          <button data-choice="walk" onClick={() => walkCity()}><span className="choice-emoji" aria-hidden="true">🚶</span>I can’t just stand here. I’ll keep going.</button>
          </>}
        </div>
      </section>
    </div>}
    {!gameOver && diceCheck?.choice.check && <div className="dice-overlay">
      <section className="dice-card">
        <p className="eyebrow">{diceCheck.choice.check.stat.toUpperCase()} CHECK · DC {diceCheck.choice.check.dc}</p>
        <div className={diceCheck.roll === null ? 'd20 rolling-ready' : diceCheck.roll === 20 ? 'd20 critical' : diceCheck.roll === 1 ? 'd20 critical-fail' : 'd20'}>{diceCheck.roll ?? 'D20'}</div>
        <div className="dice-math">{diceCheck.roll === null ? `${diceCheck.choice.check.stat === 'persuasion' ? 'Hygiene + Mood' : 'Energy'} modifier ${diceCheck.modifier >= 0 ? '+' : ''}${diceCheck.modifier}` : `${diceCheck.roll} ${diceCheck.modifier >= 0 ? '+' : '−'} ${Math.abs(diceCheck.modifier)} = ${diceCheck.roll + diceCheck.modifier}`}</div>
        {diceCheck.roll === null
          ? <button onClick={rollDice}>Roll D20</button>
          : <><strong className="dice-result">{diceCheck.roll === 20 ? 'CRITICAL SUCCESS' : diceCheck.roll === 1 ? 'CRITICAL FAILURE' : diceCheck.roll + diceCheck.modifier >= diceCheck.choice.check.dc ? 'SUCCESS' : 'FAILURE'}</strong><button onClick={acceptDiceResult}>Continue</button></>}
      </section>
    </div>}

    {!gameOver && shelterQueue && <div className="sleep-overlay queue-overlay" role="dialog" aria-modal="true" aria-label="Shelter registration queue">
      <section className="sleep-card">
        <div className="sleep-icon">🕒</div>
        <p className="eyebrow">NIGHT SHELTER</p>
        <h2>Registration queue</h2>
        <p>You must wait until your turn. A place is not guaranteed.</p>
        <div className="sleep-clock"><strong>{formatTime(game.minutes)}</strong><span>{shelterQueue.remaining} min remaining</span></div>
        <div className="sleep-progress"><i style={{ width: `${(1 - shelterQueue.remaining / SHELTER_QUEUE_MINUTES) * 100}%` }} /></div>
        <small>Earlier arrivals have a better chance of getting one of today's 0–3 places.</small>
      </section>
    </div>}

    {!gameOver && shelterCheckoutDue && !sleeping && !infoModal && !pendingResult && !activeEvent && !diceCheck && <div className="sleep-overlay checkout-overlay" role="dialog" aria-modal="true" aria-label="Leave the night shelter">
      <section className="sleep-card">
        <div className="sleep-icon">🌅</div>
        <p className="eyebrow">NIGHT SHELTER · MORNING CHECKOUT</p>
        <h2>Time to leave the night shelter</h2>
        <p>You must leave by 08:00. Packing your things and leaving takes 30 minutes.</p>
        <div className="sleep-clock"><strong>{formatTime(game.minutes)}</strong><span>On the street at {formatTime((game.minutes + SHELTER_DEPARTURE_MINUTES) % 1440)}</span></div>
        <button className="sleep-debug-wake" autoFocus onClick={startShelterDeparture}>Leave the night shelter · 30 min</button>
      </section>
    </div>}

    {!gameOver && shelterDeparture && <div className="sleep-overlay checkout-overlay" role="dialog" aria-modal="true" aria-label="Leaving the night shelter">
      <section className="sleep-card">
        <div className="sleep-icon">🎒</div>
        <p className="eyebrow">MORNING CHECKOUT</p>
        <h2>Leaving the night shelter</h2>
        <p>You are packing your things and heading outside.</p>
        <div className="sleep-clock"><strong>{formatTime(game.minutes)}</strong><span>{shelterDepartureRemaining} min remaining</span></div>
        <div className="sleep-progress"><i style={{ width: `${(1 - shelterDepartureRemaining / SHELTER_DEPARTURE_MINUTES) * 100}%` }} /></div>
        <small>You will be on the street when the 30 minutes are over.</small>
      </section>
    </div>}

    {sleeping && <div className="sleep-overlay">
      <section className="sleep-card">
        <div className="sleep-icon">😴</div>
        <p className="eyebrow">SLEEPING</p>
        <h2>{sleeping.kind === 'ground' ? 'On the ground' : sleeping.kind === 'bench' ? 'On the bench' : sleeping.kind === 'shelter' ? 'Night shelter' : 'Schronisko'}</h2>
        <div className="sleep-clock"><strong>{formatTime(game.minutes)}</strong><span>Wake at {formatTime((sleeping.startAbsolute + sleeping.total) % 1440)}</span></div>
        {(() => {
          const elapsed = Math.min(sleeping.total, Math.max(0, Math.floor(((Date.now() - sleeping.realStartedAt) / 1000) * DEBUG_SLEEP_SPEED)))
          return <>
            <div className="sleep-progress"><i style={{ width: `${(elapsed / sleeping.total) * 100}%` }} /></div>
            <p>{Math.floor(elapsed / 60)}h {elapsed % 60}m / {formatTravelTime(sleeping.total)}</p>
          </>
        })()}
        <small>{sleeping.kind === 'shelter' ? 'Night shelter sleep ends by 07:30 so you can leave by 08:00.' : 'You cannot perform other actions until you wake up.'}</small>
        <button className="sleep-debug-wake" onClick={() => { const active = sleeping; setSleeping(null); finishSleep(active) }}>Wake up (debug)</button>
      </section>
    </div>}

    {!gameOver && activeEvent && !diceCheck && !sleeping && !infoModal && !pendingResult && <div className="event-overlay">
      <section className="event-card">
        <div className="event-card-icon">{activeEvent.icon}</div>
        <p className="eyebrow">STREET EVENT</p>
        <h2>{activeEvent.title}</h2>
        <p>{activeEvent.text}</p>
        <div className="event-choices">{activeEvent.choices.map((choice) => {
          const unavailable = checkUnavailableReason(choice)
          return <button key={choice.label} onClick={() => resolveStreetEvent(choice)} disabled={!!unavailable}><span>{choice.label}</span>{unavailable && <small>{unavailable}</small>}</button>
        })}</div>
      </section>
    </div>}

    <footer><button className="reset" onClick={reset}>Reset save</button></footer>
    <nav className={screen === 'travel' || phoneActivity ? 'bottom-nav travelling' : 'bottom-nav'} aria-label="Main navigation">
      {nav('map', 'map', 'Map')}
      {nav('inventory', 'backpack', 'Inventory')}
      <button disabled={!!phoneActivity} className={screen === 'location' ? 'nav-item home active' : 'nav-item home'} aria-current={screen === 'location' ? 'page' : undefined} onClick={() => setScreen('location')}><Icon name={locationIcon(current.id)} /><small>{current.name}</small></button>
      <button disabled={!!phoneActivity} className={screen === 'status' ? 'nav-item active' : 'nav-item'} aria-current={screen === 'status' ? 'page' : undefined} onClick={() => setScreen('status')} aria-label="Status" title={overall.label}><Icon name="person" /><small>Status</small><i className={`nav-condition ${overall.level}`} aria-hidden="true" /></button>
      {nav('journal', 'journal', 'Journal')}
    </nav>
  </main>
}
