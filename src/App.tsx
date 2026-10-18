import { Children, Fragment, cloneElement, isValidElement, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { actions, applyAction as applyGameAction, applySleepTime as applyGameSleepTime, WEATHER, weatherExposure, temperatureAt, energyCap, moodLimit, limitMood, formatTime, createInitialState, isOpen, locations, conditionBand, destinationTravelTimeRange, randomTravelMinutes, type ActionResult, type GameState, type Housing } from './game'
import { pickStreetEvent, firstNightTime, STREET_EVENTS, resolveEventOutcome, type EventTrigger, type EventOutcome, type StreetEvent, type StreetEventChoice } from './events'
import { summarizeResult, type ConsumedItem, type ResultSnapshot } from './results'
import { journalReflection, loadJournalEntries, type JournalEntry } from './journal'
import { BatteryIcon, Icon, choiceIcon, locationIcon, type IconName } from './Icon'
import CityMap from './CityMap'
import ShopCard from './ShopCard'
import ItemArt, { type ItemArtId } from './ItemArt'
import InventorySlot from './InventorySlot'
import ClosedContent from './ClosedContent'
import { responsiveImageProps } from './responsiveImages'
import ResultCard, { type ResultCardData } from './ResultCard'
import { locationPresentation, questionPresentation } from './resultPresentation'
import { CHOICE_SEED_KEY, loadChoiceSeed, newChoiceSeed, shuffleChoiceOrder } from './streetChoiceOrder'
import ChoiceOptions, { orderChoiceNodes } from './ChoiceOptions'
import { StreetArt, LocationSummary, ShopHero, TravelHeading, PhoneSearchIcon, SleepHeading } from './LocationPresentation'
import { useLatestAction } from './useLatestAction'
import { getTravelPhase, getTravelDisplayPhase } from './travelPhases'
import { JournalGoals, JournalTimeline } from './JournalSections'
import LifeSituation from './LifeSituation'
import Stat from './Stat'
import MoodIcon from './MoodIcon'
import { limitingEffects } from './limitingEffects'
import PhoneDialog from './PhoneDialog'
import CompactStreetEvent from './CompactStreetEvent'
import TrashSearchTime, { trashSearchMinutes } from './TrashSearchTime'
import { useGameAutosave } from './useGameAutosave'
import { SAVE_KEY, DISCOVERY_KEY, readSavedGame, loadDiscoveredLocations } from './saveCompatibility'

const BUILD_VERSION = 'v2026.10.18-235'
const ACTIVITY_TICK_MS = 250

const FIRST_NIGHT_EVENTS_KEY = 'street-life-first-night-events-v1'
type FirstNightEvents = { seen: string[]; lastAt: number | null; pendingId: string | null }
function loadFirstNightEvents(): FirstNightEvents {
  try {
    const saved = JSON.parse(localStorage.getItem(FIRST_NIGHT_EVENTS_KEY) ?? 'null')
    const ids = new Set(STREET_EVENTS.filter(event => event.id.startsWith('first-night-')).map(event => event.id))
    const pendingId = typeof saved?.pendingId === 'string' && ids.has(saved.pendingId) ? saved.pendingId : null
    const seen = Array.isArray(saved?.seen) ? saved.seen.filter((id: unknown): id is string => typeof id === 'string' && ids.has(id)) : []
    return { seen: [...new Set<string>([...seen, ...(pendingId ? [pendingId] : [])])], lastAt: Number.isFinite(saved?.lastAt) && saved.lastAt >= 0 ? saved.lastAt : null, pendingId }
  } catch { return { seen: [], lastAt: null, pendingId: null } }
}

const RAIN_RESPONSE_KEY = 'street-life-rain-response-v1'
type RainResponse = { episode: string; locationId: string; sheltered: boolean }
function rainEpisode(state: GameState) {
  if ((state.rainUntil ?? 0) > absoluteMinutes(state)) return `shower:${state.rainUntil}`
  return ['Rain', 'Showers'].includes(WEATHER[(state.day - 1) % WEATHER.length].label) ? `weather:${state.day}` : null
}
function loadRainResponse(): RainResponse | null {
  try {
    const saved = JSON.parse(localStorage.getItem(RAIN_RESPONSE_KEY) ?? 'null')
    return typeof saved?.episode === 'string' && typeof saved.locationId === 'string' && typeof saved.sheltered === 'boolean' ? saved : null
  } catch { return null }
}

const PHONE_ACTIVITY_KEY = 'street-life-phone-activity-v1'
const PHONE_SEARCH_ESTIMATE = 15
function approximateDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return `≈${hours ? `${hours}h` : ''}${remainder || !hours ? `${remainder}m` : ''}`
}
const PHONE_SEARCH_MIN = 10
const PHONE_SEARCH_MAX = 25
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

const GOAL_KEY = 'street-life-goal-v1'
const JOURNAL_GOALS_KEY = 'street-life-journal-goals-v1'
const JOURNAL_HISTORY_KEY = 'street-life-journal-history-v1'
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
type Inventory = { clothingCleanliness: number; showerGel: number; bread: number; breadFreshness: number; cannedFood: number; readyMeal: number; readyMealFreshness: number; wipes: number; water: number; food: number; foodFreshness: number; bottles: number; phoneBattery: number; phoneCondition: number; jacket: number; documents: boolean; cigarettes: number; medicines: number; transitCard: boolean }
type ShopItem = { id: 'water' | 'food' | 'bread' | 'cannedFood' | 'readyMeal' | 'wipes' | 'showerGel' | 'cigarettes' | 'medicines'; name: string; icon: string; price: number; quantity: number; description: string; impacts: string[] }
type EffectId = 'cold' | 'free-transit' | 'well-fed'
type ActiveEffect = { id: EffectId; expiresAt: number; treated?: boolean }
type LifeSituation = { housing: Housing; housingUntil?: number; employment: 'Unemployed' | 'Day work'; income: 'None' | 'Irregular'; schroniskoReferral?: boolean; shelterRegisteredDay?: number; shelterUntilDay?: number; shelterLastStayDay?: number; shelterAuditDay?: number; shelterMisses?: number; shelterMissMonth?: number; shelterStrikes?: number; shelterBlockedUntilDay?: number; shelterRenewals?: number; shelterPlan?: 'jobcenter' | 'daywork' | 'documents' | 'benefits'; shelterDinnerDay?: number; shelterBreakfastDay?: number; shelterLaundryDropDay?: number; shelterVacancyDay?: number; shelterVacancies?: number; shelterRegistrationAttemptDay?: number; shelterCheckoutDay?: number }
type StoredItems = { documents: boolean; medicines: number; cigarettes: number; food: number; foodFreshness: number }
type TrashArt = 'cup' | 'paper' | 'tray' | 'wrapper' | 'can-crushed' | 'plastic' | 'plastic-crushed' | 'can'
// Physical proportions follow the object, never whether its deposit is valid.
const TRASH_ITEM_SCALE: Record<TrashArt, number> = {
  plastic: 2.5, 'plastic-crushed': 2.5,
  can: 2, 'can-crushed': 2,
  cup: 1.55, paper: 2, tray: 2.1, wrapper: 1.9,
}
type TrashItem = { id: number; layer: number; art: TrashArt; x: number; y: number; rotation: number; scale: number; bottle: boolean; returnable: boolean; collected?: boolean; cleared?: boolean }

const INITIAL_LIFE: LifeSituation = { housing: 'Street', employment: 'Unemployed', income: 'None', shelterMisses: 0, shelterStrikes: 0 }
const INITIAL_INVENTORY: Inventory = { clothingCleanliness: 80, showerGel: 0, bread: 0, breadFreshness: 100, cannedFood: 0, readyMeal: 0, readyMealFreshness: 100, wipes: 0, water: 2, food: 2, foodFreshness: 100, bottles: 0, phoneBattery: 62, phoneCondition: 72, jacket: 78, documents: true, cigarettes: 0, medicines: 2, transitCard: false }
const BACKPACK_CAPACITY = 8
const FREE_WATER_LIMIT = 4
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
const EFFECTS: Record<EffectId, { icon: IconName; name: string; kind: 'positive' | 'negative'; impacts: string[] }> = {
  cold: { icon: 'thermometer', name: 'Cold', kind: 'negative', impacts: ['Energy−−', 'Mood−'] },
  'free-transit': { icon: 'ticket', name: 'Free transport', kind: 'positive', impacts: ['Travel+++'] },
  'well-fed': { icon: 'food', name: 'Well fed', kind: 'positive', impacts: ['Food+++', 'Mood+'] },
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 'water', name: 'Water', icon: '💧', price: 3, quantity: 3, description: '', impacts: ['Thirst+++'] },
  { id: 'food', name: 'Cheap food', icon: '🥪', price: 5, quantity: 1, description: 'Sandwich · stack 4', impacts: ['Food++', 'Mood+'] },
  { id: 'bread', name: 'Bread roll', icon: '🥖', price: 1, quantity: 1, description: 'Stack 4 · fresh for a short time', impacts: ['Food+'] },
  { id: 'cannedFood', name: 'Canned food', icon: '🥫', price: 10, quantity: 1, description: 'Pull-tab can · stack 4 · keeps well', impacts: ['Food++', 'Mood+'] },
  { id: 'readyMeal', name: 'Ready meal', icon: '🍝', price: 12, quantity: 1, description: 'Pasta with meat and herbs · plastic container · stack 4 · ready to eat', impacts: ['Food+++'] },
  { id: 'wipes', name: 'Wet wipes', icon: '🧻', price: 5, quantity: 5, description: '5 uses · stack 5', impacts: ['Hygiene+'] },
  { id: 'showerGel', name: '3-in-1 shower gel', icon: '🧴', price: 10, quantity: 20, description: '20 showers · used automatically', impacts: ['Hygiene+++'] },
  { id: 'cigarettes', name: 'Cigarettes', icon: '🚬', price: 6, quantity: 5, description: 'Pack of 5 · stack 20', impacts: ['Mood+', 'Health−'] },
  { id: 'medicines', name: 'Medicine', icon: '💊', price: 9, quantity: 1, description: 'One dose per Cold · stack 4', impacts: ['Cold recovery ×3'] },
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

// Charge screen-on activities for each elapsed game minute so dawn, dusk,
// midnight and rain ending can change brightness within the same activity.
function phoneScreenDrain(state: GameState, condition: number, usage: 'browsing' | 'navigation', minutes = 1) {
  let drain = 0
  for (let elapsed = 0; elapsed < minutes; elapsed++) {
    const absolute = absoluteMinutes(state) + elapsed
    const minute = absolute % 1440
    const day = Math.floor(absolute / 1440) + 1
    const daylight = minute >= 360 && minute < 1200
    const clear = (state.rainUntil ?? 0) <= absolute && WEATHER[(day - 1) % WEATHER.length].label === 'Clear'
    const hourly = (usage === 'browsing' ? 18 : 12) + (daylight ? clear ? 12 : 6 : 0)
    drain += hourly / 60 * phoneDrainMultiplier(condition) * Math.min(1, minutes - elapsed)
  }
  return drain
}

function stackSlots(count: number) {
  return count > 0 ? Math.ceil(count / STACK_SIZE) : 0
}

function storageSlots(storage: StoredItems) {
  return (storage.documents ? 1 : 0) + stackSlots(storage.medicines) + (storage.cigarettes > 0 ? Math.ceil(storage.cigarettes / CIGARETTE_STACK_SIZE) : 0)
}

function backpackSlots(inventory: Inventory) {
  return (inventory.showerGel > 0 ? Math.ceil(inventory.showerGel / SHOWER_GEL_USES_PER_SLOT) : 0) + stackSlots(inventory.bread) + stackSlots(inventory.cannedFood) + stackSlots(inventory.readyMeal) + (inventory.wipes > 0 ? Math.ceil(inventory.wipes / WIPES_STACK_SIZE) : 0) + stackSlots(inventory.water) + stackSlots(inventory.food) + (inventory.bottles > 0 ? Math.ceil(inventory.bottles / BOTTLE_STACK_SIZE) : 0) + (inventory.cigarettes > 0 ? Math.ceil(inventory.cigarettes / CIGARETTE_STACK_SIZE) : 0) + stackSlots(inventory.medicines)
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
  if (item.id === 'readyMeal') next.readyMealFreshness = mixFreshness(inventory.readyMeal, inventory.readyMealFreshness, item.quantity, 100)
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
  return readSavedGame(localStorage) ?? createInitialState()
}

// Flatten conditional fragments before sorting, so custom and configured
// actions share one available-first ordering and keep their order within a group.
function AvailableFirst({ children, className, tag = 'section', thoughtsOnly = false, choiceGroups, orderSeed = 0, decisionKey = '' }: { children: ReactNode; className: string; tag?: 'section' | 'div'; thoughtsOnly?: boolean; choiceGroups?: string[][]; orderSeed?: number; decisionKey?: string }) {
  function flatten(nodes: ReactNode): ReactNode[] {
    return Children.toArray(nodes).flatMap(node =>
      isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment ? flatten(node.props.children) : [node])
  }
  function thoughtOnly(node: ReactNode): ReactNode {
    if (!isValidElement<{ children?: ReactNode; 'data-choice'?: string }>(node) || node.type !== 'button') return node
    const id = node.props['data-choice'] ?? ''
    const icon = choiceIcon(id)
    const route = { 'station-route': 'station', 'shelter-route': 'shelter', 'work-route': 'work' }[id as 'station-route' | 'shelter-route' | 'work-route']
    function textOf(children: ReactNode): string {
      return Children.toArray(children).map(child => isValidElement<{ children?: ReactNode }>(child) ? textOf(child.props.children) : String(child)).join('')
    }
    const metadata = Children.toArray(node.props.children).find(part => isValidElement(part) && part.type === 'span')
    const text = isValidElement<{ children?: ReactNode }>(metadata) ? textOf(metadata.props.children) : ''
    const minutes = text.match(/~(\d+)(?:[–-](\d+))? min/)
    const destination = route ? locations.find(place => place.id === route) : undefined
    const duration = destination ? `${approximateDuration(destinationTravelTimeRange(destination, 'transit').min)}+`
      : text === 'Choose duration' ? `${approximateDuration(SLEEP_HOURS[0] * 60)}+`
      : minutes ? minutes[2] ? `≈${minutes[1]}–${minutes[2]}m` : approximateDuration(Number(minutes[1])) : null
    return cloneElement(node, {}, Children.toArray(node.props.children)
      .filter(part => !isValidElement(part) || part.type !== 'span')
      .map(part => isValidElement<{ children?: ReactNode }>(part) && part.type === 'div'
        ? cloneElement(part, {}, <Icon name={icon} className="story-action-icon" />, Children.toArray(part.props.children)
          .filter(detail => !isValidElement<{ className?: string }>(detail) || detail.type !== 'small' || detail.props.className?.split(' ').includes('choice-estimate'))
          .map(detail => isValidElement<{ children?: ReactNode }>(detail) && detail.type === 'strong'
            ? cloneElement(detail, {}, Children.toArray(detail.props.children)
              .filter(text => !isValidElement(text) || text.type !== 'span')
              .map(text => typeof text === 'string' ? text.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]+\s*/u, '') : text))
            : detail), duration && !Children.toArray(part.props.children).some(detail => isValidElement<{ className?: string }>(detail) && detail.props.className?.split(' ').includes('choice-estimate'))
              ? <small className="choice-estimate choice-duration">{duration}</small> : null)
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
    const ids = selected.map(node => isValidElement<{ 'data-choice'?: string }>(node) ? node.props['data-choice'] : '').join('|')
    const ordered = shuffleChoiceOrder(selected, orderSeed, `${decisionKey}|${ids}`)
    const Tag = tag
    return <Tag className={className}>{ordered.filter(node => !disabled(node))}{ordered.filter(disabled)}</Tag>
  }
  const ordered = orderChoiceNodes(nodes, orderSeed, decisionKey)
  const available = ordered.filter(node => !disabled(node))
  const unavailable = ordered.filter(disabled)
  const Tag = tag
  return <Tag className={className}>{available}{unavailable.length > 0 && <p className="unavailable-heading">Unavailable now</p>}{unavailable}</Tag>
}


export default function App() {
  const [game, commitGame] = useState<GameState>(loadGame)
  const [choiceSeed, setChoiceSeed] = useState(loadChoiceSeed)
  const [phoneActivity, setPhoneActivity] = useState<PhoneActivity | null>(loadPhoneActivity)
  const [message, setMessage] = useState('')
  const [infoModal, setInfoModal] = useState<ResultCardData | null>(null)
  const [pendingResult, setPendingResult] = useState<{ title: string; before: ResultSnapshot; includeTime: boolean; always: boolean; consumedItems: ConsumedItem[] } | null>(null)
  const [eventResultOpen, setEventResultOpen] = useState(false)
  const closeResult = useCallback(() => { setInfoModal(null); setEventResultOpen(false) }, [])
  const buyShopItem = useLatestAction((id: string) => { const item = SHOP_ITEMS.find(item => item.id === id); if (item) buyItem(item) })
  const stealShopItem = useLatestAction((id: string) => { const item = SHOP_ITEMS.find(item => item.id === id); if (item) stealItem(item) })
  const [discoveredLocations, setDiscoveredLocations] = useState<string[]>(() => loadDiscoveredLocations(localStorage))
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(JOURNAL_HISTORY_KEY) ?? '[]')
      return loadJournalEntries(saved)
    } catch { return [] }
  })
  const lastRecordedResult = useRef<unknown>(null)
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
  const [selectedJournalDay, setSelectedJournalDay] = useState<number | null>(null)
  const journalDay = Math.max(1, Math.min(selectedJournalDay ?? game.day, game.day))
  useEffect(() => { if (screen !== 'journal') setSelectedJournalDay(null) }, [screen])
  const [rainChoice, setRainChoice] = useState(() => localStorage.getItem('street-life-rain-choice-v1') === 'true')
  const [rainResponse, setRainResponse] = useState<RainResponse | null>(loadRainResponse)
  const rainModalRef = useRef<HTMLElement>(null)
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>(() => {
    try { const saved = JSON.parse(localStorage.getItem('street-life-answers-v1') ?? '[]'); return Array.isArray(saved) ? saved.filter(value => typeof value === 'string') : [] } catch { return [] }
  })
  const [seenMemories, setSeenMemories] = useState<string[]>(() => {
    try { const saved = JSON.parse(localStorage.getItem('street-life-memories-v1') ?? '[]'); return Array.isArray(saved) ? saved.filter(value => typeof value === 'string') : [] } catch { return [] }
  })
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [trip, setTrip] = useState<Trip | null>(loadTrip)
  const travelModalRef = useRef<HTMLElement>(null)
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
  const [trashGame, setTrashGame] = useState<{ items: TrashItem[]; startedAt: number; found: number; before: ResultSnapshot } | null>(null)
  const trashDrag = useRef<{ id: number; offsetX: number; offsetY: number; startX: number; startY: number; moved: boolean } | null>(null)
  const [navigationOn, setNavigationOn] = useState(true)
  const eventModalRef = useRef<HTMLElement>(null)
  const [firstNightEvents, setFirstNightEvents] = useState<FirstNightEvents>(loadFirstNightEvents)
  const [activeEvent, setActiveEvent] = useState<StreetEvent | null>(() => STREET_EVENTS.find(event => event.id === loadFirstNightEvents().pendingId) ?? null)
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
  const statusEffectCount = statusEffects.length + separateLimits.length + ((game.wetness ?? 0) > 0 ? 1 : 0)
  // Reconcile existing saves and changes of accommodation/effects without a gain.
  useEffect(() => { setGame(previous => previous) }, [moodCeiling.cap])
  const current = useMemo(() => locations.find((x) => x.id === game.locationId) ?? locations[0], [game.locationId])
  const shelterBooked = (life.shelterUntilDay ?? 0) >= game.day
  const currentActions = useMemo(() => actions.filter(x => x.locationId === current.id && (current.id !== 'shelter' || shelterBooked || x.id === 'shelter-rest')), [current.id, shelterBooked])
  const mapPlaces = useMemo(() => locations.filter(location => discoveredLocations.includes(location.id) && (location.id !== 'residential-shelter' || life.schroniskoReferral || life.housing === 'Schronisko')), [discoveredLocations, life.schroniskoReferral, life.housing])
  const open = isOpen(current, game.minutes)
  const inlineResult = screen === 'location' && current.id === 'street' && !!infoModal?.presentation && !infoModal.illustration
  const moodBand = conditionBand(game.mood)
  const weather = (game.rainUntil ?? 0) > absoluteMinutes(game) ? WEATHER[1] : WEATHER[(game.day - 1) % WEATHER.length]
  const navigationInBrightSun = weather.label === 'Clear' && game.minutes >= 360 && game.minutes < 1200
  const navigationDrainPerHour = phoneScreenDrain(game, inventory.phoneCondition, 'navigation') * 60
  const directSearchCost = phoneScreenDrain(game, inventory.phoneCondition, 'browsing', 15)
  const currentRainEpisode = rainEpisode(game)
  const underRainCover = !!rainResponse?.sheltered && rainResponse.episode === currentRainEpisode && rainResponse.locationId === current.id
  const travelPhase = trip ? getTravelPhase(trip) : null
  const currentExposure = underRainCover ? 'cover' : travelPhase?.exposure ?? weatherExposure(game)
  const temperature = temperatureAt(weather.temp, game.minutes)
  const goals = useMemo(() => [
    { id: 'morning' as const, title: 'Get through the morning', description: 'Stay alive until Day 2, 12:00.' },
    { id: 'shelter' as const, title: 'Find a safe place to sleep', description: activeGoal ? `Be at Night Shelter on Day ${activeGoal.day} at ${formatTime(activeGoal.minute)} for registration. A bed is not guaranteed.` : 'Register for a shelter bed or move into Schronisko.' },
    { id: 'support' as const, title: 'Visit social support', description: 'Visit Help Center during opening hours.' },
    { id: 'work' as const, title: 'Look for work', description: 'Search online for work or visit Job Centre or Day Work while open.' },
  ], [activeGoal])
  const firstNight = firstNightTime(game) && life.housing === 'Street'
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
      setActiveGoal({ type: 'night-shelter', day: game.minutes >= 1320 ? game.day + 1 : game.day, minute: 1140 })
    }
  }, [activeGoal, game.day, game.minutes, current.id, trip, life.shelterUntilDay, life.housing])
  const usedBackpackSlots = backpackSlots(inventory)
  const gameOver = game.health <= 0
  const travelVisible = travelling && !(activeEvent || diceCheck || pendingResult || infoModal || rainChoice || gameOver)
  useEffect(() => { if (travelVisible) travelModalRef.current?.focus({ preventScroll: true }) }, [travelVisible])
  const phoneSearchVisible = !!phoneActivity && !(activeEvent || diceCheck || pendingResult || infoModal || rainChoice || gameOver)
  const streetEventVisible = !!activeEvent && !diceCheck && !sleeping && !infoModal && !pendingResult && !gameOver
  const previousRainEpisode = useRef(currentRainEpisode)
  const previousExposure = useRef(currentExposure)
  useEffect(() => {
    if (activeEvent || diceCheck || infoModal || pendingResult || sleeping || gameOver || phoneActivity?.remaining === 0 || trip?.remaining === 0) return
    const leavingCover = previousExposure.current !== 'outside' && currentExposure === 'outside'
    previousExposure.current = currentExposure
    const previous = previousRainEpisode.current
    const began = currentRainEpisode !== null && previous === null
    previousRainEpisode.current = currentRainEpisode
    if (previous && currentRainEpisode && previous !== currentRainEpisode && rainResponse?.episode === previous) {
      setRainResponse({ ...rainResponse, episode: currentRainEpisode })
      return
    }
    if (!currentRainEpisode) { if (rainResponse) setRainResponse(null); return }
    if (!rainChoice && currentExposure === 'outside' && rainResponse?.episode !== currentRainEpisode && (began || leavingCover || !!phoneActivity)) setRainChoice(true)
  }, [currentRainEpisode, phoneActivity, trip, activeEvent, diceCheck, infoModal, pendingResult, sleeping, gameOver, rainChoice, rainResponse, game.locationId, currentExposure])
  useEffect(() => {
    if (!rainChoice || infoModal || pendingResult || activeEvent || diceCheck) return
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
  }, [rainChoice, infoModal, pendingResult, activeEvent, diceCheck, activityOverlay])
  const eventInteractionBlocked = !!activeEvent || !!diceCheck || (rainChoice && !infoModal && !pendingResult) || eventResultOpen
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
    return applyGameAction(state, result, { ...moodContext(state), walking: !!travelPhase?.walking && !underRainCover, ...(underRainCover ? { exposure: 'cover' as const } : travelPhase ? { exposure: travelPhase.exposure } : shelterQueue ? { exposure: 'outside' as const } : {}), music: musicOn })
  }

  function applySleepTime(state: GameState, minutes: number) {
    const kind = sleeping?.kind ?? sleepChoice
    return applyGameSleepTime(state, minutes, { ...moodContext(state), ...(kind ? { exposure: kind === 'ground' || (kind === 'bench' && state.locationId === 'street') ? underRainCover ? 'cover' as const : 'outside' as const : 'indoors' as const } : {}) })
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
      const navigationDrain = trip && !underRainCover && navigationOn ? phoneScreenDrain({ ...game, minutes: game.minutes - elapsed }, prev.phoneCondition, 'navigation', elapsed) : 0
      const musicDrain = musicOn ? 4 / 60 * multiplier * elapsed : 0
      return { ...prev,
        clothingCleanliness: Math.max(0, prev.clothingCleanliness - wornMinutes * (20 / 1440) * (trip?.mode === 'walk' ? 1.5 : 1) - extraDirt),
        foodFreshness: prev.food > 0 ? Math.max(0, prev.foodFreshness - FOOD_FRESHNESS_PER_MINUTE * elapsed) : 100,
        readyMealFreshness: prev.readyMeal > 0 ? Math.max(0, prev.readyMealFreshness - FOOD_FRESHNESS_PER_MINUTE * elapsed) : 100,
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
    return { game: { ...game }, housing: moodContext().housing, inventory: { ...inventory }, effects: effects.map(effect => ({ ...effect })) }
  }

  function rememberFirstNightEvent(event: StreetEvent, state = game) {
    setFirstNightEvents(previous => ({ seen: [...new Set([...previous.seen, event.id])], lastAt: absoluteMinutes(state), pendingId: event.id }))
    setActiveEvent(event)
  }

  function observeFirstNight(trigger: Extract<EventTrigger, 'walk' | 'bench' | 'location'>, state: GameState, locationId = state.locationId) {
    if (!firstNightTime(state) || life.housing !== 'Street' || activeEvent || infoModal || firstNightEvents.pendingId) return
    if (firstNightEvents.lastAt !== null && absoluteMinutes(state) - firstNightEvents.lastAt < 45) return
    const event = pickStreetEvent(trigger, { locationId, weather: weather.label, housing: life.housing, documents: inventory.documents, firstNight: true, seenEventIds: [...firstNightEvents.seen, ...STREET_EVENTS.filter(event => !event.id.startsWith('first-night-')).map(event => event.id)] }, 0.55)
    if (event?.id.startsWith('first-night-')) rememberFirstNightEvent(event, state)
  }

  function runWithResult(title: string, action: () => void, before = resultSnapshot(), includeTime = true, always = false, consumedItems: ConsumedItem[] = []) {
    if (sleepChoice && title !== 'Start sleeping') return
    if (shelterQueue && title !== 'Shelter registration') return
    if (shelterDeparture && title !== 'Shelter checkout') return
    if (shelterCheckoutDue && !activeEvent && !diceCheck && !shelterInterview && title !== 'Sleep complete') return
    action()
    setPendingResult({ title, before, includeTime, always, consumedItems })
  }

  useEffect(() => {
    if (!pendingResult || inventoryAgedAt !== absoluteMinutes(game) || game.hygiene > hygieneLimit || game.mood > moodCeiling.cap) return
    setPendingResult(null)
    if (sleeping || sleepChoice || shelterQueue || shelterDeparture || trashGame || shelterInterview || diceCheck) return
    const summary = summarizeResult(pendingResult.before, resultSnapshot(), pendingResult.includeTime, pendingResult.consumedItems)
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
      const actionTitle = pendingResult.title
      const reflection = journalReflection(infoModal?.title ?? actionTitle, resultText, summary, memory?.id)
      const entry: JournalEntry = { day: game.day, minute: game.minutes, actionTitle, reflection: true, ...reflection }
      setJournalEntries(previous => [...previous, entry].slice(-500))
    }
    setInfoModal(previous => ({ ...previous, title: previous?.title ?? pendingResult.title, text: resultText, reflection: memory?.text, ...summary }))
  }, [pendingResult, game, inventory, effects, sleeping, sleepChoice, trashGame, shelterInterview, shelterQueue, shelterDeparture, diceCheck, message, inventoryAgedAt])

  function buyMobileService(...args: Parameters<typeof buyMobileServiceImpl>) { runWithResult('Mobile service', () => buyMobileServiceImpl(...args)) }
  function watchVideo(...args: Parameters<typeof watchVideoImpl>) { runWithResult('Watch videos', () => watchVideoImpl(...args)) }
  function chargePhone(...args: Parameters<typeof chargePhoneImpl>) { runWithResult('Charge phone', () => chargePhoneImpl(...args)) }
  function hospitalVisit(...args: Parameters<typeof hospitalVisitImpl>) { runWithResult('Medical appointment', () => hospitalVisitImpl(...args)) }
  function callAmbulance(...args: Parameters<typeof callAmbulanceImpl>) { runWithResult('Emergency care', () => callAmbulanceImpl(...args)) }
  function askForMoney(...args: Parameters<typeof askForMoneyImpl>) { runWithResult('Ask for money', () => askForMoneyImpl(...args)) }
  function finishTrashSearch(...args: Parameters<typeof finishTrashSearchImpl>) { runWithResult('Trash search results', () => finishTrashSearchImpl(...args), trashGame?.before ?? resultSnapshot()) }
  function returnBottles(...args: Parameters<typeof returnBottlesImpl>) { runWithResult('Return containers', () => returnBottlesImpl(...args)) }
  function searchOnlineFor(...args: Parameters<typeof searchOnlineForImpl>) { runWithResult('Online search', () => searchOnlineForImpl(...args)) }
  function streetAction(...args: Parameters<typeof streetActionImpl>) { runWithResult(args[0] === 'find-bench' ? 'Is there a bench nearby? My legs could use a break.' : 'Rest on the bench', () => streetActionImpl(...args)) }
  function act(...args: Parameters<typeof actImpl>) { runWithResult(actions.find(action => action.id === args[0])?.name ?? 'Action complete', () => actImpl(...args), resultSnapshot(), true, false, ['shelter-shower', 'daycenter-shower'].includes(args[0]) ? ['showerGel'] : []) }
  function answerShelterInterview(...args: Parameters<typeof answerShelterInterviewImpl>) { runWithResult('Shelter extension', () => answerShelterInterviewImpl(...args)) }
  function applyEventOutcome(outcome: EventOutcome) { const resolved = resolveEventOutcome(outcome); runWithResult(activeEvent?.title ?? 'Event result', () => { setEventResultOpen(true); applyEventOutcomeImpl(resolved) }, resultSnapshot(), true, true) }
  function storeItem(...args: Parameters<typeof storeItemImpl>) { runWithResult('Store belongings', () => storeItemImpl(...args)) }
  function takeStoredItem(...args: Parameters<typeof takeStoredItemImpl>) { runWithResult('Collect belongings', () => takeStoredItemImpl(...args)) }
  function storeFood(...args: Parameters<typeof storeFoodImpl>) { runWithResult('Store food', () => storeFoodImpl(...args)) }
  function takeStoredFood(...args: Parameters<typeof takeStoredFoodImpl>) { runWithResult('Collect food', () => takeStoredFoodImpl(...args)) }
  function socialSupport(...args: Parameters<typeof socialSupportImpl>) { runWithResult('Social support', () => socialSupportImpl(...args)) }
  function takeDayWork(...args: Parameters<typeof takeDayWorkImpl>) { runWithResult('Day work', () => takeDayWorkImpl(...args)) }
  function buyItem(...args: Parameters<typeof buyItemImpl>) { runWithResult(`Buy ${args[0].name}`, () => buyItemImpl(...args)) }
  function useSupply(...args: Parameters<typeof useSupplyImpl>) { runWithResult(args[0] === 'wipes' ? 'Use wet wipes' : 'Eat food', () => useSupplyImpl(...args), resultSnapshot(), true, false, [args[0]]) }
  function useMedicine(...args: Parameters<typeof useMedicineImpl>) { runWithResult('Use medicine', () => useMedicineImpl(...args), resultSnapshot(), true, true) }
  function smokeCigarette(...args: Parameters<typeof smokeCigaretteImpl>) { runWithResult('Smoke a cigarette', () => smokeCigaretteImpl(...args), resultSnapshot(), true, false, ['cigarettes']) }
  function useItem(...args: Parameters<typeof useItemImpl>) { runWithResult(args[0] === 'water' ? 'Drink water' : 'Eat food', () => useItemImpl(...args), resultSnapshot(), true, false, [args[0]]) }

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
  useEffect(() => {
    if (current.id !== 'shelter' || life.shelterVacancyDay === game.day) return
    setLife(status => ({ ...status, shelterVacancyDay: game.day, shelterVacancies: Math.floor(Math.random() * 4) }))
  }, [current.id, game.day, life.shelterVacancyDay])

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
        setGame(prev => applyGameAction(prev, { minutes: 0, mood: 3 }, moodContext(prev, 'Night shelter')), 'Night shelter')
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

  const tickGameClock = useLatestAction(() => {
    if (rainChoice) return
    if (phoneActivity) {
      if (phoneActivity.remaining <= 0 || gameOver || document.visibilityState !== 'visible') return
      setGame(previous => applyAction(previous, { minutes: 1 }))
      setInventory(previous => ({ ...previous, phoneBattery: Math.max(0, previous.phoneBattery - phoneScreenDrain(game, previous.phoneCondition, 'browsing')) }))
      setPhoneActivity(previous => previous ? { ...previous, remaining: Math.max(0, previous.remaining - 1) } : null)
      return
    }
    if (rainChoice || (document.visibilityState !== 'visible' && !sleeping) || activeEvent || diceCheck || shelterInterview || gameOver || infoModal || pendingResult || sleepChoice || trashGame || (shelterCheckoutDue && !sleeping) || (shelterDeparture && shelterDepartureRemaining === 0)) return
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
  })
  const gameClockInterval = trip || shelterDeparture ? ACTIVITY_TICK_MS : 1000
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
      setMessage(`You arrived at ${destination.name} by ${trip.mode === 'walk' ? 'walking' : 'public transport'}.`)
      setScreen('location')
      setTrip(null)
      if (destination.id === 'station') observeFirstNight('location', { ...game, locationId: destination.id })
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

  function presentWakeEvent(event: StreetEvent | null, title: string, completionText: string) {
    if (!event) return
    const outcome = event.choices[0]?.outcome
    if (event.id !== 'quiet-night' || !outcome) { setActiveEvent(event); return }
    // A peaceful night has no decision to make: fold its bonus and artwork into
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
    const wetRestLoss = Math.max(0, (wakeState.wetSleepLoss ?? 0) - (sleep.before?.game.wetSleepLoss ?? 0))
    setGame((prev) => {
      const next = applyAction(prev, { ...result, energy: Math.max(0, result.energy - wetRestLoss) })
      delete next.wetSleepLoss
      return next
    })
    let illnessText = ''
    let wakeEvent: StreetEvent | null = null
    if (sleep.kind === 'ground' || sleep.kind === 'bench') {
      setLife((status) => ({ ...status, housing: 'Street', housingUntil: undefined }))
      const sleepWeather = (wakeState.rainUntil ?? 0) > absoluteMinutes(wakeState) ? WEATHER[1] : WEATHER[(wakeState.day - 1) % WEATHER.length]
      const sleepTemp = temperatureAt(sleepWeather.temp, wakeState.minutes)
      const illnessChance = Math.min(0.65, Math.max(0.05,
        0.08 +
        (sleepTemp <= 5 ? 0.28 : sleepTemp <= 10 ? 0.16 : sleepTemp <= 15 ? 0.07 : 0) +
        (sleepWeather.label === 'Rain' ? 0.22 : sleepWeather.label === 'Showers' ? 0.14 : sleepWeather.label === 'Windy' ? 0.10 : 0) +
        (sleep.kind === 'ground' ? 0.08 : 0) +
        Math.min(0.2, wetRestLoss / 100) * (sleepTemp <= 10 ? 1 : sleepTemp <= 15 ? 0.5 : 0)
      ))
      if (Math.random() < illnessChance) {
        setEffects((active) => active.some((effect) => effect.id === 'cold' && effect.expiresAt > absoluteMinutes(wakeState))
          ? active
          : [...active, { id: 'cold', expiresAt: absoluteMinutes(wakeState) + 2 * 1440 }])
        if (!effects.some(effect => effect.id === 'cold' && effect.expiresAt > absoluteMinutes(wakeState))) illnessText = ` You woke up with a cold after sleeping outside in ${sleepWeather.label.toLowerCase()} weather.`
      }
      const baseChance = sleep.kind === 'ground' ? 0.75 : 0.65
      const sleepStart = { day: Math.floor(sleep.startAbsolute / 1440) + 1, minutes: sleep.startAbsolute % 1440 }
      wakeEvent = pickStreetEvent('wake', { locationId: current.id, weather: sleepWeather.label, housing: 'Street', documents: inventory.documents, firstNight: firstNightTime(sleepStart), sleepKind: sleep.kind, seenEventIds: firstNightEvents.seen }, Math.min(0.9, baseChance * scale))
      if (wakeEvent?.id.startsWith('first-night-')) { rememberFirstNightEvent(wakeEvent, wakeState); wakeEvent = null }
    } else if (sleep.kind === 'shelter') {
      const sleepStartDay = Math.floor(sleep.startAbsolute / 1440) + 1
      const stayNightDay = sleep.startAbsolute % 1440 < 480 ? sleepStartDay - 1 : sleepStartDay
      setLife((status) => ({ ...status, housing: 'Night shelter', shelterLastStayDay: Math.max(status.shelterLastStayDay ?? 0, stayNightDay) }))
      const event = pickStreetEvent('wake', { locationId: current.id, weather: weather.label, housing: 'Night shelter', documents: inventory.documents, sleepKind: sleep.kind }, Math.min(0.65, 0.45 * scale))
      if (wakeState.minutes < SHELTER_CHECKOUT_WARNING) wakeEvent = event
    } else {
      setLife((status) => ({ ...status, housing: 'Schronisko', housingUntil: undefined }))
    }
    const completionText = `You slept for ${Number.isInteger(hours) ? `${hours} hour${hours === 1 ? '' : 's'}` : formatTravelTime(sleep.total)}.${wetRestLoss >= 0.5 ? ' Wet clothes made it harder to rest.' : ''}${illnessText}`
    setMessage(completionText)
    presentWakeEvent(wakeEvent, 'Sleep complete', completionText)
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
    setRainResponse(previous => previous ? { ...previous, sheltered: false } : null)
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

  function returnBottlesImpl() {
    if (!open || current.id !== 'shop' || inventory.bottles <= 0) return
    const count = inventory.bottles
    const payout = count * BOTTLE_DEPOSIT
    setInventory((prev) => ({ ...prev, bottles: 0 }))
    setGame((prev) => applyAction(prev, { minutes: 5, money: payout }))
    setMessage(`Returned ${count} container${count === 1 ? '' : 's'} for ${payout.toFixed(2)} zł.`)
  }

  function searchOnlineForImpl(kind: 'shelter' | 'work' | 'help') {
    if (current.id !== 'street') return
    if (!mobileServiceActive) { setMessage('You need mobile internet to search online.'); return }
    if (inventory.phoneCondition <= 0 || inventory.phoneBattery < directSearchCost) { setMessage('Your phone battery is too low or the phone is not working.'); return }

    const result = kind === 'shelter'
      ? { id: 'shelter', label: 'Night Shelter', message: 'You find information about a night shelter and save its address.' }
      : kind === 'work'
        ? { id: 'work', label: 'Day Work', message: 'You find a place advertising casual day work and save the address.' }
        : { id: 'support', label: 'Help Center', message: 'You find a local help center and save its address.' }
    const presentation = locationPresentation([result.id], discoveredLocations.includes(result.id) ? 'On your map' : 'Added to map')

    setInventory((prev) => ({ ...prev, phoneBattery: Math.max(0, prev.phoneBattery - directSearchCost) }))
    setGame((prev) => applyAction(prev, { minutes: 15 }))
    setDiscoveredLocations((prev) => prev.includes(result.id) ? prev : [...prev, result.id])
    if (kind === 'work') setJournalGoals(previous => ({ ...previous, work: true }))
    if (kind === 'shelter' && game.minutes >= 22 * 60) {
      setActiveGoal({ type: 'night-shelter', day: game.day + 1, minute: 19 * 60 })
      setInfoModal({ title: 'Night Shelter found', text: 'Registration is closed for tonight. Come tomorrow from 19:00 to request a place. The address has been added to your map.', presentation: { ...presentation, notice: 'Registration is closed tonight. Come tomorrow by 19:00. A bed is not guaranteed.' } })
    } else if (kind === 'help' && !isOpen(locations.find(location => location.id === 'support')!, game.minutes)) {
      setInfoModal({ title: 'Help Center found', text: 'You find the Help Center address, but its services are closed now. It opens at 08:00. You save the address for tomorrow; tonight you still need somewhere to stay.', presentation: { ...presentation, notice: 'Closed now · opens at 08:00. You still need somewhere to stay tonight.' } })
    } else {
      setInfoModal({ title: `${result.label} found`, text: `${result.message} It has been added to your map.`, presentation })
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
      setRainResponse(previous => previous ? { ...previous, sheltered: false } : null)
      const startsRain = weather.label !== 'Rain' && weather.label !== 'Showers' && (game.minutes >= 1200 || game.minutes < 360) && Math.random() < 0.35
      let next = applyGameAction(game, { minutes: 15, energy: -1 }, { ...moodContext(), walking: true, music: playingMusic })
      if (startsRain) next = { ...next, rainUntil: absoluteMinutes(next) + 180 }
      next = applyGameAction(next, { minutes: 15, energy: -1, mood: 2 }, { ...moodContext(next), walking: true, music: playingMusic })
      if (withMusic) next.mood = Math.min(moodLimit(next, moodContext(next)).cap, next.mood + 8)
      const wet = (next.rainUntil ?? 0) > absoluteMinutes(next) || weather.label === 'Rain' || weather.label === 'Showers'
      setInventory(previous => ({ ...previous, phoneBattery: Math.max(0, previous.phoneBattery - (withMusic && !musicOn ? walkMusicCost : 0)), clothingCleanliness: Math.max(0, previous.clothingCleanliness - 30 * (10 / 1440)) }))
      setGame(next)
      const musicText = withMusic ? ' You put on familiar music. A few songs play as you pass the dark shop windows.' : ''
      if (wet) {
        setRainChoice(rainResponse?.episode !== rainEpisode(next))
        const rainText = (startsRain ? 'A few drops become steady rain as you walk. Your clothes begin to get wet. Water collects along the edge of the pavement.' : 'Rain darkens the shoulders of your clothes. A narrow canopy covers the entrance to a closed shop.') + musicText
        setInfoModal({ title: withMusic ? 'Walk with music' : 'Walk through the city', text: rainText, illustration: '/street-life-game/assets/event-rain-street.webp', illustrationAlt: 'Rain grows heavier as you notice a canopy above a closed shop.' })
        setMessage(rainText)
      } else {
        setMessage('You pass lit windows and closed shops. At the next crossing, the signal changes for an empty road. Half an hour has passed. You are still outside.' + musicText)
        observeFirstNight('walk', next)
      }
    }, resultSnapshot(), true, true)
  }

  const practicalQuestions = [
    { id: 'morning', icon: '💬', title: 'Where can I get help in the morning?', text: '', locations: ['support', 'daycenter', 'free-clinic'] },
    { id: 'bed', icon: '🛏️', title: 'How can I get a shelter bed?', text: 'First registration at Night Shelter runs 19:00–22:00. Arrive by 19:00, wait the full 20-minute queue, and then find out whether there is a place. There are only 0–3 free places each day; earlier arrivals have a better chance. A successful registration reserves seven nights. The address is saved on your map.', locations: ['shelter'] },
    { id: 'no-place', icon: '🤔', title: 'What if the shelter has no places?', text: 'A discovered address does not guarantee a bed. Try registration earlier the following evening. During the day, ask Help Center about accommodation. Station benches and outdoor cover are temporary alternatives, with no guarantee of safe sleep.', locations: [] },
    { id: 'supplies', icon: '🥪', title: 'Where can I get food and water?', text: 'Cheap Shop opens 07:00–22:00. Water costs 3 zł for three drinks; a bread roll costs 1 zł, a sandwich 5 zł, canned food 10 zł, and a ready meal 12 zł. The shop is closed at the start of the night. You can use food and water already in your backpack. Registered shelter guests can get dinner 19:00–20:30 and breakfast 06:30–07:00; finding its address alone does not give access.', locations: ['shop'] },
    { id: 'charging', icon: '🔋', title: 'Where can I charge my phone?', text: 'You glance at the battery and remember an outlet in the waiting room at Station. You can go there tonight: it is available around the clock. Charging takes one hour and adds 60% battery, up to 100%. The station address is on your map. You do not need internet to remember this.', locations: ['station'] },
  ]
  const visibleQuestions = practicalQuestions.filter(question => answeredQuestions.includes(question.id)
    || question.id === 'morning'
    || (question.id === 'bed' && (answeredQuestions.includes('morning') || discoveredLocations.includes('shelter')))
    || (question.id === 'no-place' && answeredQuestions.includes('bed'))
    || (question.id === 'supplies' && (game.hunger <= 45 || game.thirst <= 45))
    || (question.id === 'charging' && inventory.phoneBattery <= 30))
  // One thought per direction. Urgent needs interrupt the ordered questions.
  // Choose the same useful directions; shuffle only their presentation below.
  const remainingHelpPlaces = practicalQuestions[0].locations.filter(id => !discoveredLocations.includes(id))
  const nextQuestion = inventory.phoneBattery <= 30 ? 'charging'
    : game.hunger <= 45 || game.thirst <= 45 ? 'supplies'
    : remainingHelpPlaces.length ? 'morning'
    : ['morning', 'bed', 'no-place'].find(id => !answeredQuestions.includes(id)) ?? 'morning'
  const exhausted = game.energy <= 40
  const lastAction = journalEntries.at(-1)?.actionTitle
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
  const lastDecision = journalEntries.at(-1)
  const choiceDecisionKey = JSON.stringify([journalEntries.length, lastDecision?.day, lastDecision?.minute, lastDecision?.actionTitle])
  const phoneSearchCost = phoneScreenDrain(game, inventory.phoneCondition, 'browsing', PHONE_SEARCH_MIN)

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
      if (id !== 'morning' || foundPlace) next.mood = Math.max(next.mood, Math.min(moodLimit(next, moodContext(next)).cap, before.game.mood + 3))
      setGame(next)
      setAnsweredQuestions(previous => [...new Set([...previous, id])])
      setDiscoveredLocations(previous => [...new Set([...previous, ...foundPlaces])])
      if (id === 'bed' && !shelterBooked) setActiveGoal({ type: 'night-shelter', day: game.minutes >= 1320 ? game.day + 1 : game.day, minute: 1140 })
      setInfoModal({ title: id === 'morning' && !foundPlace ? 'No new information' : question.title, text: `${memory ? 'You remember' : 'AI'}\n\n${answerText}`, presentation })
    }, before)
  }

  function answerPracticalQuestion(id: string) {
    const question = practicalQuestions.find(entry => entry.id === id)
    if (!question || phoneActivity || current.id !== 'street' || !visibleQuestions.includes(question)) return
    if (id !== 'morning' && answeredQuestions.includes(id)) {
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
    if (!phoneActivity || inventoryAgedAt !== absoluteMinutes(game)) return
    if (phoneActivity.remaining === 0) {
      setPhoneActivity(null)
      finishPracticalQuestion(phoneActivity.questionId, phoneActivity.before)
    } else if (inventory.phoneBattery <= 0 || !mobileServiceActive || gameOver) {
      setPhoneActivity(null)
      const text = gameOver ? 'You could not finish the search.' : inventory.phoneBattery <= 0 ? 'Your phone ran out of battery before you could save the information.' : 'Mobile service expired before you could save the information.'
      runWithResult('Search interrupted', () => setInfoModal({ title: 'Search interrupted', text, presentation: { ...locationPresentation([]), heading: 'Search interrupted', lead: text } }), phoneActivity.before, true, true)
    }
  }, [phoneActivity, inventoryAgedAt, inventory.phoneBattery, mobileServiceActive, gameOver])

  function respondToRain(choice: 'cover' | 'continue' | 'stop') {
    const response: RainResponse = { episode: currentRainEpisode ?? `weather:${game.day}`, locationId: current.id, sheltered: choice === 'cover' }
    setRainChoice(false)
    setRainResponse(response)
    if (choice === 'cover') {
      // Looking for an awning is a detour; the interrupted activity makes no progress.
      setGame(previous => applyGameAction(previous, { minutes: 5 }, { ...moodContext(previous), walking: true, exposure: 'outside', music: musicOn }))
      setMessage(phoneActivity ? 'You find an entrance canopy and continue browsing. Your clothes can slowly dry.' : trip ? 'You find cover. Your journey will resume when the rain stops; you can leave sooner.' : 'You find a canopy. You can carry on here without getting wetter.')
    } else if (choice === 'stop' && phoneActivity) {
      const before = phoneActivity.before
      setPhoneActivity(null)
      runWithResult('Search stopped', () => setInfoModal({ title: 'Search stopped', text: 'You put your phone away. Time and battery already spent are not returned. No new information was saved.', presentation: { ...locationPresentation([]), heading: 'Search stopped', lead: 'You put your phone away. No new information was saved.' } }), before, true, true)
    } else if (choice === 'stop' && trip) {
      const before = trip.before ?? resultSnapshot()
      setTrip(null)
      setScreen('location')
      runWithResult('Journey stopped', () => setMessage('You stop before reaching your destination. Time and battery already spent are not returned.'), before, true, true)
    }
  }

  function streetActionImpl(kind: 'find-bench' | 'bench-rest' | 'bench-sleep') {
    if (activeEvent || current.id !== 'street') return
    if (kind === 'find-bench') {
      setRainResponse(previous => previous ? { ...previous, sheltered: false } : null)
      const found = Math.random() < 0.7
      setGame((prev) => applyGameAction(prev, { minutes: 20, energy: -2, mood: found ? 1 : -2 }, { ...moodContext(prev), exposure: 'outside', music: musicOn }))
      setStreetBenchFound(found)
      setMessage(found ? 'You found a usable bench nearby.' : 'You looked around, but every decent place to sit is occupied or unusable.')
      return
    }
    if (!streetBenchFound) return
    if (kind === 'bench-rest') {
      setRainResponse(previous => previous ? { ...previous, sheltered: false } : null)
      const next = applyGameAction(game, { minutes: 45, energy: 18, mood: 2 }, { ...moodContext(), exposure: 'outside', music: musicOn })
      setGame(next)
      setMessage('You sit on the bench and get off your feet for a while.')
      observeFirstNight('bench', next)
      return
    }
    setRainResponse(previous => previous ? { ...previous, sheltered: false } : null)
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
    recordShelterDeparture(destination.id)
    if (mode === 'transit') setGame((prev) => ({ ...prev, money: Math.max(0, prev.money - fare) }))
    setStreetBenchFound(false)
    setRainResponse(previous => previous ? { ...previous, sheltered: false } : null)
    setTrip({ destinationId: destination.id, mode, total, remaining: total, before: resultSnapshot() })
    setSelectedDestination(null)
    setScreen('travel')
    if (!activeEvent) {
      const event = pickStreetEvent('travel', { locationId: game.locationId, travelMode: mode, weather: weather.label, housing: life.housing, documents: inventory.documents, firstNight }, mode === 'walk' ? 0.30 : 0.18)
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
      const wakeEvent = pickStreetEvent('wake', { locationId: current.id, weather: weather.label, housing: 'Street', documents: inventory.documents }, 0.75)
      presentWakeEvent(wakeEvent, action.name, result.message ?? 'Time passes.')
    } else if (actionId === 'shelter-rest' && result.minutes >= 8 * 60) {
      setLife((status) => ({ ...status, housing: 'Night shelter', housingUntil: absoluteMinutes(next) }))
      const wakeEvent = pickStreetEvent('wake', { locationId: current.id, weather: weather.label, housing: 'Night shelter', documents: inventory.documents }, 0.45)
      presentWakeEvent(wakeEvent, action.name, result.message ?? 'Time passes.')
    } else {
      if (firstNight) observeFirstNight('location', next)
      else {
        const locationEvent = pickStreetEvent('location', { locationId: current.id, weather: weather.label, housing: life.housing, documents: inventory.documents }, 0.20)
        if (locationEvent) setActiveEvent(locationEvent)
      }
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
    const { rejected } = fitEventSupplies(inventory, outcome)
    const outcomeText = rejected.length ? `There was no backpack room for ${rejected.join(' and ')}; you left it behind.` : outcome.message
    if (activeEvent?.illustration || outcome.illustration) {
      const place = locations.find(location => location.id === outcome.discoverLocation)
      const end = absoluteMinutes(game) + (outcome.minutes ?? 0)
      const goalDay = Math.floor(end / 1440) + 1 + (end % 1440 >= 1320 ? 1 : 0)
      setInfoModal(previous => ({ ...previous, title: activeEvent?.title ?? 'After your choice', text: outcomeText, illustration: rejected.length ? activeEvent?.illustration : outcome.illustration ?? activeEvent?.illustration, illustrationAlt: outcomeText,
        ...(place ? { presentation: { ...locationPresentation([place.id], discoveredLocations.includes(place.id) ? 'On your map' : 'Added to map'), lead: outcome.message,
          notice: `Come on Day ${goalDay} at 19:00 to request a bed.` } } : {}) }))
    }
    if (firstNightEvents.pendingId === activeEvent?.id) setFirstNightEvents(previous => ({ ...previous, pendingId: null }))
    const foundPlace = locations.find(place => place.id === outcome.discoverLocation)
    if (foundPlace) {
      setDiscoveredLocations(previous => [...new Set([...previous, foundPlace.id])])
      if (foundPlace.id === 'shelter' && !shelterBooked) {
        const end = absoluteMinutes(game) + (outcome.minutes ?? 0)
        const day = Math.floor(end / 1440) + 1
        setActiveGoal({ type: 'night-shelter', day: end % 1440 >= 1320 ? day + 1 : day, minute: 1140 })
      }
    }
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
        const total = randomTravelMinutes(destinationTravelTimeRange(destination, 'fare-dodge'))
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

  function useSupplyImpl(item: 'bread' | 'cannedFood' | 'readyMeal' | 'wipes') {
    if (inventory[item] <= 0) return
    if (item === 'wipes') {
      if (game.hygiene >= 60) { setMessage('Wet wipes cannot improve Hygiene above 60. Find a shower.'); return }
      setInventory(prev => ({ ...prev, wipes: prev.wipes - 1 }))
      setGame(prev => ({ ...prev, hygiene: Math.min(60, prev.hygiene + 10) }))
      setMessage('You cleaned up with wet wipes. Hygiene improves, up to 60.')
      return
    }
    if (item === 'readyMeal') {
      const stale = inventory.readyMealFreshness <= 50
      const spoiled = inventory.readyMealFreshness <= 20
      setInventory(prev => ({ ...prev, readyMeal: prev.readyMeal - 1, readyMealFreshness: prev.readyMeal <= 1 ? 100 : prev.readyMealFreshness }))
      setGame(prev => applyAction(prev, { minutes: 0, hunger: spoiled ? 16 : stale ? 34 : 48, health: spoiled ? -8 : 0, mood: spoiled ? -4 : 0 }))
      setMessage(spoiled ? 'You ate spoiled pasta with meat. It damaged your health and mood.' : stale ? 'You ate stale pasta with meat. It was less filling.' : 'You ate the ready meal: pasta with meat and a little parsley from the plastic container.')
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
    const explain = (title: string, text: string, label = 'MEDICINE') => {
      setMessage(text)
      setInfoModal({ title, text, label })
    }
    const now = absoluteMinutes(game)
    const cold = effects.find((effect) => effect.id === 'cold' && effect.expiresAt > now)
    if (!cold) {
      explain('No fever', 'You have no fever. There is no need to take a tablet now.\n\nYour medicine has been kept for when you need it.')
      return
    }
    if (cold.treated) {
      explain('One dose is enough', 'The first tablet is already helping you recover faster.\n\nA second tablet will not speed things up or remove the symptoms. You kept it for later.')
      return
    }
    setInventory((prev) => ({ ...prev, medicines: prev.medicines - 1 }))
    setEffects((prev) => prev.map(effect => effect.id === 'cold' && effect.expiresAt > now && !effect.treated
      ? { ...effect, treated: true, expiresAt: now + (effect.expiresAt - now) / 3 } : effect))
    explain('Recovery accelerated', 'You took one tablet. It speeds up recovery from this cold by three times, but does not cure it immediately.\n\nSymptoms continue until you recover. One dose is enough for this illness.', 'AFTER THE ACTION')
  }

  function smokeCigaretteImpl() {
    if (inventory.cigarettes <= 0) return
    setInventory((prev) => ({ ...prev, cigarettes: prev.cigarettes - 1 }))
    setGame((prev) => ({ ...prev, mood: Math.min(100, prev.mood + 5), health: Math.max(0, prev.health - 0.5) }))
    setMessage('You smoked a cigarette. Mood+, health slightly worse.')
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
    autosave.resetPending()
    setChoiceSeed(newChoiceSeed())
    localStorage.removeItem(SAVE_KEY)
    localStorage.removeItem(DISCOVERY_KEY)
    localStorage.removeItem('street-life-discovery-version')
    setDiscoveredLocations(['street', 'station', 'shop'])
    setActiveGoal(null)
    setJournalGoals({ morning: false, shelter: false, support: false, work: false })
    setJournalEntries([])
    setSelectedJournalDay(null)
    lastRecordedResult.current = null
    localStorage.removeItem(JOURNAL_HISTORY_KEY)
    localStorage.removeItem(JOURNAL_GOALS_KEY)
    localStorage.removeItem(GOAL_KEY)
    setGame(createInitialState())
    setMessage('New run started.')
    setInfoModal(null)
    setEventResultOpen(false)
    setPhoneActivity(null)
    setPendingResult(null)
    setScreen('location')
    setRainChoice(false)
    setRainResponse(null)
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
    setFirstNightEvents({ seen: [], lastAt: null, pendingId: null })
    localStorage.removeItem(FIRST_NIGHT_EVENTS_KEY)
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
    <button disabled={!!phoneActivity || travelling || eventInteractionBlocked} className={screen === target ? 'nav-item active' : 'nav-item'} aria-current={screen === target ? 'page' : undefined} onClick={() => setScreen(target)}><Icon name={icon} /><small>{label}</small></button>

  const autosave = useGameAutosave({
    [SAVE_KEY]: game,
    [CHOICE_SEED_KEY]: choiceSeed,
    [DISCOVERY_KEY]: discoveredLocations,
    'street-life-discovery-version': 2,
    [GOAL_KEY]: activeGoal,
    [JOURNAL_GOALS_KEY]: journalGoals,
    [JOURNAL_HISTORY_KEY]: journalEntries,
    [PHONE_ACTIVITY_KEY]: phoneActivity,
    'street-life-inventory-v1': inventory,
    'street-life-storage-v1': storage,
    'street-life-effects-v1': effects,
    'street-life-situation-v1': life,
    'street-life-begging-v1': begging,
    'street-life-answers-v1': answeredQuestions,
    'street-life-memories-v1': seenMemories,
    [FIRST_NIGHT_EVENTS_KEY]: firstNightEvents,
    'street-life-rain-choice-v1': rainChoice,
    [RAIN_RESPONSE_KEY]: rainResponse,
    'street-life-screen': screen === 'travel' ? undefined : screen,
    'street-life-mobile-service-until': mobileServiceUntil,
    'street-life-mobile-auto-renew': mobileAutoRenew,
    'street-life-mobile-renewed-day': mobileRenewedDay,
    'street-life-trip-v1': trip,
    'street-life-sleep-v1': sleeping,
    'street-life-shelter-queue-v1': shelterQueue,
    'street-life-shelter-departure-v1': shelterDeparture,
  }, inventoryAgedAt === absoluteMinutes(game) && game.hygiene <= hygieneLimit && !pendingResult, [
    discoveredLocations, activeGoal, journalGoals, journalEntries, answeredQuestions, seenMemories, firstNightEvents, choiceSeed,
    rainChoice, rainResponse, screen, life, effects, begging, mobileServiceUntil, mobileAutoRenew, mobileRenewedDay,
    game.day, gameOver, !!trip, !!sleeping, !!shelterQueue, !!shelterDeparture,
    phoneActivity?.questionId ?? null, infoModal,
  ])

  const backpackItems: { art: ItemArtId; name: string; count: number; stackSize: number; effects: string[]; hint: string; onUse?: () => void; disabled?: boolean }[] = [
    { art: 'water', name: 'Water', count: inventory.water, stackSize: STACK_SIZE, effects: ['Thirst+++'], hint: 'tap to drink', onUse: () => useItem('water') },
    { art: 'food', name: 'Food', count: inventory.food, stackSize: STACK_SIZE, effects: inventory.foodFreshness > 50 ? ['Food++', 'Mood+'] : inventory.foodFreshness > 20 ? ['Food++', 'Stale'] : ['Food+', 'Spoiled', 'Health−'], hint: `${foodFreshnessLabel(inventory.foodFreshness)} · tap to eat`, onUse: () => useItem('food') },
    { art: 'bread', name: 'Bread roll', count: inventory.bread, stackSize: STACK_SIZE, effects: ['Food+', ...(inventory.breadFreshness <= 50 ? [foodFreshnessLabel(inventory.breadFreshness)] : [])], hint: `${foodFreshnessLabel(inventory.breadFreshness)} · tap to eat`, onUse: () => useSupply('bread') },
    { art: 'cannedFood', name: 'Canned food', count: inventory.cannedFood, stackSize: STACK_SIZE, effects: ['Food++', 'Mood+'], hint: 'Keeps well · tap to eat', onUse: () => useSupply('cannedFood') },
    { art: 'readyMeal', name: 'Ready meal', count: inventory.readyMeal, stackSize: STACK_SIZE, effects: inventory.readyMealFreshness > 50 ? ['Food+++'] : inventory.readyMealFreshness > 20 ? ['Food++', 'Stale'] : ['Food+', 'Spoiled', 'Health−'], hint: `${foodFreshnessLabel(inventory.readyMealFreshness)} · tap to eat`, onUse: () => useSupply('readyMeal') },
    { art: 'wipes', name: 'Wet wipes', count: inventory.wipes, stackSize: WIPES_STACK_SIZE, effects: ['Hygiene+'], hint: game.hygiene >= 60 ? 'Hygiene 60+ · find a shower' : 'tap to clean', onUse: () => useSupply('wipes'), disabled: game.hygiene >= 60 },
    { art: 'bottles', name: 'Bottles & cans', count: inventory.bottles, stackSize: BOTTLE_STACK_SIZE, effects: ['0.50 zł'], hint: 'Deposit containers · 0.50 zł each · return at shop' },
    { art: 'cigarettes', name: 'Cigarettes', count: inventory.cigarettes, stackSize: CIGARETTE_STACK_SIZE, effects: ['Mood+', 'Health−'], hint: 'tap to smoke', onUse: smokeCigarette },
    { art: 'medicines', name: 'Medicine', count: inventory.medicines, stackSize: STACK_SIZE, effects: ['Cold recovery ×3'], hint: 'treats Cold · one dose per illness', onUse: useMedicine },
    { art: 'showerGel', name: '3-in-1 shower gel', count: inventory.showerGel, stackSize: SHOWER_GEL_USES_PER_SLOT, effects: ['Hygiene+++'], hint: 'Uses left · automatic with a shower · Hygiene max 100' },
  ]

  return <main className={`shell${screen === 'location' && current.id === 'street' ? ' street-screen' : screen === 'location' && current.id === 'shop' ? ' shop-screen' : ''}`}>
    {sleepChoice && <div className="phone-overlay result-overlay">
      <section className="phone-modal sleep-choice-modal" role="dialog" aria-modal="true" aria-labelledby="sleep-choice-title">
        <div className="timed-heading"><Icon name="moon" /><div><p className="eyebrow">PLAN YOUR SLEEP · TIME PAUSED</p><h2 id="sleep-choice-title">How long do you want to sleep?</h2></div></div>
        <div className="sleep-choice-context"><span>{sleepChoice === 'ground' ? 'On the ground' : sleepChoice === 'bench' ? 'On the bench' : sleepChoice === 'shelter' ? 'Night shelter' : 'Schronisko'}</span><span>Day {game.day} {weekday(game.day)} · {formatTime(game.minutes)}</span></div>
        <p className="sleep-choice-energy"><Icon name="energy" />Energy {Math.round(game.energy)}% · {game.energy > 75 ? 'Rested' : game.energy > 50 ? 'Slightly tired' : game.energy > 25 ? 'Tired' : 'Exhausted'}</p>
        <div className="sleep-duration-options" role="group" aria-label="Sleep duration">
          {SLEEP_HOURS.map(hours => {
            const reason = sleepDurationUnavailable(hours, game.energy)
            return <button key={hours} className={hours === sleepHours ? 'sleep-duration-option selected' : 'sleep-duration-option'} aria-pressed={hours === sleepHours} disabled={reason !== null} title={reason ?? undefined} autoFocus={hours === sleepHours} onClick={() => setSleepHours(hours)}>
              <strong>{hours} h</strong><span className="sr-only"> · Wake {wakeLabel(hours, sleepChoice)}{reason && ` · ${reason}`}</span>
            </button>
          })}
        </div>
        {SLEEP_HOURS.some(hours => sleepDurationUnavailable(hours, game.energy)) && <p className="sleep-choice-note">Available sleep lengths depend on your fatigue.</p>}
        {(sleepChoice === 'ground' || (sleepChoice === 'bench' && current.id === 'street')) && ((game.wetness ?? 0) > 0 || weather.label === 'Rain' || weather.label === 'Showers') && <p className="sleep-choice-note">Wet clothes reduce outdoor sleep recovery. Somewhere dry would help.</p>}
        <div className="sleep-choice-preview" aria-live="polite">
          <small>Wake up · {wakeLabel(sleepHours, sleepChoice).split(' · ')[0]}</small><span className="sr-only"> · </span><strong>{wakeLabel(sleepHours, sleepChoice).split(' · ')[1]}</strong>
        </div>
        <p className="sleep-choice-note">Sleep time: {formatTravelTime(chosenSleepMinutes(sleepHours, sleepChoice))}.</p>
        {(sleepChoice === 'ground' || sleepChoice === 'bench') && <p className="sleep-choice-note">Sleeping outside carries a risk of illness and theft.</p>}
        {sleepChoice === 'shelter' && <p className="sleep-choice-note">Sleep ends by 07:30 for morning checkout. Longer choices are shortened.</p>}
        <div className="sleep-choice-buttons">
          <button onClick={() => setSleepChoice(null)}>Cancel</button>
          <button className="trash-stop" disabled={sleepDurationUnavailable(sleepHours, game.energy) !== null} onClick={() => runWithResult('Start sleeping', () => sleep(sleepHours, sleepChoice))}>Start sleeping</button>
        </div>
      </section>
    </div>}
    {infoModal && !inlineResult && <ResultCard result={infoModal} onClose={closeResult} />}
    {trashGame && <div className="trash-overlay">
      <section className="trash-card" role="dialog" aria-modal="true" aria-labelledby="trash-title">
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
        <button className="trash-stop" onClick={finishTrashSearch}>Finish searching</button>
      </section>
    </div>}

    <div className={`game-background${eventInteractionBlocked ? ' event-background-blocked' : ''}`} inert={eventInteractionBlocked} aria-hidden={eventInteractionBlocked || undefined} onClickCapture={event => { if (eventInteractionBlocked) { event.preventDefault(); event.stopPropagation() } }}>
    <header className="game-header">
      <div className="header-state-row">
        <h1 aria-label={`Day ${game.day} ${weekday(game.day)} ${formatTime(game.minutes)}`}><time>{formatTime(game.minutes)}</time><span className="game-day">D{game.day} <span className="weekday">{weekday(game.day)}</span></span></h1>
        <div className="weather" title={weather.label} aria-label={`${weather.label}, ${temperature}°C`}><Icon name={weather.label === 'Rain' || weather.label === 'Showers' ? 'rain' : weather.label === 'Clear' ? game.minutes >= 360 && game.minutes < 1200 ? 'sun' : 'moon' : 'cloud'} />{temperature}°</div>
        <div className="header-info">
          <span className={`header-condition ${moodBand.level}`} role="img" aria-label={`Mood: ${moodBand.label}`} title={`Mood: ${Math.round(game.mood)}% · ${moodBand.label}`}><MoodIcon value={game.mood} /></span>
          <div className="money" aria-label={`Money: ${game.money.toFixed(2)} zł`}><Icon name="banknote" />{Number(game.money.toFixed(2))} zł</div>
        </div>
        <div className={`phone-charge${inventory.phoneBattery < 30 ? ' low' : ''}`} aria-label={`Phone battery: ${Math.round(inventory.phoneBattery)}%`} title="Your phone battery"><BatteryIcon charge={inventory.phoneBattery} /><strong>{Math.round(inventory.phoneBattery)}%</strong></div>
      </div>
    </header>

    {activeGoal?.type === 'night-shelter' && <section className="event goal-reminder"><Icon name="target" /><p><strong>Goal:</strong> Be at Night Shelter on Day {activeGoal.day} at {formatTime(activeGoal.minute)} for registration.</p></section>}

    {screen === 'location' && <div className="location-surface" inert={!!phoneActivity} aria-hidden={!!phoneActivity || undefined}>
      {current.id === 'street' && <StreetArt phone={false} inline={inlineResult} illustration={infoModal?.illustration ? undefined : infoModal?.presentation?.illustration} night={game.minutes >= 1200 || game.minutes < 360} />}
      {inlineResult && infoModal ? <ResultCard inline result={infoModal} onClose={closeResult} /> : <>
      {current.id === 'shop' ? <ShopHero name={current.name} open={open} opensAt={current.open} closesAt={current.close} /> : <LocationSummary id={current.id} name={current.name} description={current.id === 'street' ? streetScene : current.description} open={open} opensAt={current.open} />}
      {underRainCover && !trip && <p className="rain-cover-status"><Icon name="umbrella" />Under cover</p>}
      {message && current.id !== 'street' && <section className="event"><span>●</span><p>{message}</p></section>}
      <ClosedContent closed={!open && current.id !== 'hospital' && !currentActions.some(action => actionUnavailableReason(action) === null)} opensAt={formatTime(current.open)}>
      {shelterInterview && <section className="shop">
        <div className="shop-heading"><div><p className="eyebrow">SOCIAL WORKER</p><h2>{shelterInterview.step === 'reason' ? 'Why do you still need a place?' : shelterInterview.step === 'action' ? 'What are you doing about your situation?' : 'What will you do next?'}</h2></div></div>
        <ChoiceOptions className="shop-grid" seed={choiceSeed} decision={`${choiceDecisionKey}|interview:${shelterInterview.step}`}>
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
        </ChoiceOptions>
      </section>}
      {current.id === 'shop' && <section className="shop">
        <div className="shop-capacity"><Icon name="backpack" /><strong>Backpack</strong><span>{usedBackpackSlots} / {BACKPACK_CAPACITY} slots</span><div className="shop-capacity-bar" role="meter" aria-label="Backpack capacity" aria-valuenow={usedBackpackSlots} aria-valuemin={0} aria-valuemax={BACKPACK_CAPACITY}><i style={{ width: `${usedBackpackSlots / BACKPACK_CAPACITY * 100}%` }} /></div></div>
        {inventory.bottles > 0 && <button className="shop-return" onClick={returnBottles} disabled={!open}><Icon name="bottle" /><span><strong>Return bottles & cans ×{inventory.bottles}</strong><small>Deposit return · 0.50 zł each</small></span><b>+{(inventory.bottles * BOTTLE_DEPOSIT).toFixed(2)} zł</b></button>}
        {[{ title: 'Food & drink', items: SHOP_ITEMS.slice(0, 5) }, { title: 'Care', items: SHOP_ITEMS.slice(5) }].map(group => <section className="shop-category" key={group.title} aria-label={group.title}>
          <h3>{group.title}</h3><div className="shop-grid supply-grid">{group.items.map(item => <ShopCard key={item.id} item={item} open={open} fits={canAddToBackpack(inventory, item)} affordable={game.money >= item.price} onBuy={buyShopItem} onSteal={stealShopItem} />)}</div>
        </section>)}
      </section>}
      {current.id === 'support' && <section className="support-menu">
        <div className="section-title"><h2>Talk to a social worker</h2><span>Choose what you need help with</span></div>
        <AvailableFirst tag="div" className="support-grid" orderSeed={choiceSeed} decisionKey={`${choiceDecisionKey}|support`}>
          <button onClick={() => socialSupport('housing')} disabled={!open}><Icon name="house" /><div><strong>Housing</strong><small>{life.schroniskoReferral ? 'Referral issued · Schronisko unlocked' : 'Ask about stable accommodation'}</small></div></button>
          <button onClick={() => socialSupport('documents')} disabled={!open}><Icon name="documents" /><div><strong>Documents</strong><small>{inventory.documents ? 'Documents complete' : 'Restore missing documents'}</small></div></button>
          <button onClick={() => socialSupport('transport')} disabled={!open || !inventory.documents}><Icon name="ticket" /><div><strong>Transport</strong><small>Apply for 3 days of free public transport</small></div></button>
          <button onClick={() => socialSupport('benefits')} disabled={!open || !inventory.documents}><Icon name="banknote" /><div><strong>Benefits</strong><small>Ask what financial support is available</small></div></button>
        </AvailableFirst>
      </section>}
      {((current.id === 'shelter' && shelterBooked) || current.id === 'residential-shelter') && <section className="storage-panel">
        <div className="storage-heading"><div><p className="eyebrow">SAFE STORAGE</p><h2>Stored belongings</h2></div><span>{usedStorageSlots}/{storageCapacity} slots</span></div>
        <p className="storage-note">{current.id === 'residential-shelter' ? 'Schronisko gives you more long-term storage.' : 'Night shelter has limited storage.'} {current.id === 'residential-shelter' ? ' Water must stay in your backpack; Schronisko has a separate small food shelf.' : ' Food and water must stay in your backpack.'}</p>
        <div className="storage-grid">
          <div><strong><Icon name="documents" />Documents</strong><small>{storage.documents ? 'Stored safely' : inventory.documents ? 'Carried with you' : 'Missing'}</small><button onClick={() => storage.documents ? takeStoredItem('documents') : storeItem('documents')} disabled={!open || (storage.documents ? inventory.documents : !inventory.documents)}>{storage.documents ? 'Take' : 'Store'}</button></div>
          <div><strong><Icon name="pill" />Medicine ×{storage.medicines}</strong><small>Store/take up to one stack</small><button onClick={() => inventory.medicines > 0 ? storeItem('medicines') : takeStoredItem('medicines')} disabled={!open || (inventory.medicines <= 0 && storage.medicines <= 0)}>{inventory.medicines > 0 ? 'Store' : 'Take'}</button></div>
          <div><strong><Icon name="cigarette" />Cigarettes ×{storage.cigarettes}</strong><small>Store/take up to one stack</small><button onClick={() => inventory.cigarettes > 0 ? storeItem('cigarettes') : takeStoredItem('cigarettes')} disabled={!open || (inventory.cigarettes <= 0 && storage.cigarettes <= 0)}>{inventory.cigarettes > 0 ? 'Store' : 'Take'}</button></div>
          {current.id === 'residential-shelter' && <div><strong><Icon name="food" />Food ×{storage.food}/{SCHRONISKO_FOOD_CAPACITY}</strong><small>Separate food shelf · {storage.food > 0 ? `${foodFreshnessLabel(storage.foodFreshness)} · ${Math.round(storage.foodFreshness)}%` : 'empty'}</small><div className="freshness-bar"><i style={{ width: `${storage.food > 0 ? storage.foodFreshness : 0}%` }} /></div><button onClick={() => inventory.food > 0 && storage.food < SCHRONISKO_FOOD_CAPACITY ? storeFood() : takeStoredFood()} disabled={!open || ((inventory.food <= 0 || storage.food >= SCHRONISKO_FOOD_CAPACITY) && storage.food <= 0)}>{inventory.food > 0 && storage.food < SCHRONISKO_FOOD_CAPACITY ? 'Store' : 'Take'}</button></div>}
        </div>
      </section>}
      {(current.id === 'support' || current.id === 'residential-shelter') && <section className="charging-station">
        <button className="action" onClick={chargePhone} disabled={!open || inventory.phoneBattery >= 100}>
          <div><strong><Icon name="plug" className="action-label-icon" />Charge phone</strong><small>Use a public socket for 30 minutes.</small></div><span>+25% · ~30 min</span>
        </button>
      </section>}
      {current.id === 'work' && <AvailableFirst className="actions" orderSeed={choiceSeed} decisionKey={`${choiceDecisionKey}|work`}>
        <button className="action" onClick={takeDayWork} disabled={!open || game.energy < dayWorkEnergyRequired}>
          <div><strong>Take a short shift</strong><small>{game.energy < dayWorkEnergyRequired ? `Need at least ${dayWorkEnergyRequired} Energy · current ${Math.floor(game.energy)}` : 'Three hours of physical work. Pays 35 zł.'}</small></div><span>+35 zł · ~180 min</span>
        </button>
      </AvailableFirst>}
      {current.id !== 'shop' && current.id !== 'work' && current.id !== 'support' && <>
        {current.id === 'street' ? <section className="story-choices">
          <h2>What matters most right now?</h2>
        </section> : <div className="section-title"><h2>What do you do?</h2><span>Actions move time forward</span></div>}
        <AvailableFirst className={current.id === 'street' ? 'actions story-actions' : 'actions'} thoughtsOnly={current.id === 'street'} choiceGroups={streetChoiceGroups} orderSeed={choiceSeed} decisionKey={choiceDecisionKey}>
          {current.id === 'hospital' && <>
            <button className="action" onClick={hospitalVisit} disabled={!open || !inventory.documents}><div><strong><Icon name="hospital" className="action-label-icon" />Regular medical appointment</strong><small>{!inventory.documents ? 'Documents required.' : open ? 'See a doctor and receive proper treatment.' : 'Regular care is closed.'}</small></div><span>~90 min</span></button>
          </>}
          {current.id === 'street' && <>
            <button className="action" data-choice="question-morning" aria-label="Where can I get help in the morning?" onClick={() => answerPracticalQuestion('morning')} disabled={!mobileServiceActive || inventory.phoneCondition <= 0 || inventory.phoneBattery < phoneSearchCost}><div><strong><span className="choice-emoji" aria-hidden="true">📱</span>{answeredQuestions.includes('morning') ? remainingHelpPlaces.length ? 'What other help can I find?' : 'Try searching for more help.' : 'Maybe my phone can help… I need somewhere to start.'}</strong><small className="choice-estimate choice-duration">{approximateDuration(PHONE_SEARCH_ESTIMATE)}</small></div><span>{`Approx. ${PHONE_SEARCH_ESTIMATE} min · uses battery`}</span></button>
            {visibleQuestions.filter(question => question.id !== 'morning').map(question => {
              const saved = answeredQuestions.includes(question.id)
              const memory = question.id === 'charging'
              return <button className="action" data-choice={`question-${question.id}`} aria-label={question.title} key={question.id} onClick={() => answerPracticalQuestion(question.id)} disabled={!saved && !memory && (!mobileServiceActive || inventory.phoneCondition <= 0 || inventory.phoneBattery < phoneSearchCost)}><div><strong><span className="choice-emoji" aria-hidden="true">{question.icon}</span>{question.title}</strong><small className={`choice-estimate${saved || memory ? '' : ' choice-duration'}`}>{memory ? 'Remember · free' : saved ? 'Saved answer · free' : approximateDuration(PHONE_SEARCH_ESTIMATE)}</small></div><span>{saved ? 'Notes' : memory ? 'Remember · free' : `Approx. ${PHONE_SEARCH_ESTIMATE} min · uses battery`}</span></button>
            })}
            {<button className="action" data-choice="music-walk" onClick={() => walkCity(true)} disabled={!canWalkWithMusic}><div><strong><span className="choice-emoji" aria-hidden="true">🎧</span>Something familiar to listen to… I don’t want this silence.</strong><small>{canWalkWithMusic ? 'You have a few familiar songs on your phone. The walk still takes time and uses battery.' : 'Needs a working phone, mobile service and enough battery.'}</small></div><span>~30 min · −{walkMusicCost.toFixed(1)}% battery</span></button>}
            {<button className="action" aria-label="Just one more street. I’m not ready to lie down." data-choice="walk" onClick={() => walkCity()}><div><strong><span className="choice-emoji" aria-hidden="true">🚶</span>Just one more street. I’m not ready to lie down.</strong><small>Closed shops, lit windows, another crossing. You can keep moving for half an hour.</small></div><span>~30 min</span></button>}
            {discoveredLocations.includes('shelter') && <button className="action" data-choice="shelter-route" disabled={firstNight && !shelterBooked} onClick={() => { setScreen('map'); chooseDestination('shelter') }}><div><strong><span className="choice-emoji" aria-hidden="true">🛏️</span>What about Night Shelter? Maybe there is a place.</strong><small>{shelterBooked ? 'You have a reserved bed.' : firstNight ? 'Registration is closed tonight. Come tomorrow at 19:00; a place is not guaranteed.' : 'Registration starts at 19:00; places are limited.'}</small></div><span>Choose route</span></button>}
            {!firstNight && discoveredLocations.includes('work') && <button className="action" data-choice="work-route" onClick={() => { setScreen('map'); chooseDestination('work') }}><div><strong>Go to Day Work</strong><small>Ask about a short shift.</small></div><span>Choose route</span></button>}
            {<button className="action" data-choice="station-route" aria-label="Maybe the station? At least I could sit down." onClick={() => { setScreen('map'); chooseDestination('station') }}><div><strong><span className="choice-emoji" aria-hidden="true">🚉</span>Maybe the station? At least I could sit down.</strong><small>A place to sit; safe sleep is not guaranteed.</small></div><span>Choose route</span></button>}
            {!discoveredLocations.includes('shelter') && <button className="action" data-choice="shelter-search" onClick={() => searchOnlineFor('shelter')} disabled={!mobileServiceActive || inventory.phoneCondition <= 0 || inventory.phoneBattery < directSearchCost}><div><strong>📱 There must be somewhere to sleep… Let me look.</strong><small>{mobileServiceActive ? 'Look for somewhere safer to spend the night.' : 'Mobile internet required.'}</small></div><span>~15 min</span></button>}
            {!firstNight && !discoveredLocations.includes('work') && <button className="action" data-choice="work-search" onClick={() => searchOnlineFor('work')} disabled={!mobileServiceActive || inventory.phoneCondition <= 0 || inventory.phoneBattery < directSearchCost}><div><strong>💰 Could I find a little work? I need to keep some money.</strong><small>{mobileServiceActive ? 'Look for a way to earn some money.' : 'Mobile internet required.'}</small></div><span>~15 min</span></button>}
            {!discoveredLocations.includes('support') && <button className="action" data-choice="help-search" onClick={() => searchOnlineFor('help')} disabled={!mobileServiceActive || inventory.phoneCondition <= 0 || inventory.phoneBattery < directSearchCost}><div><strong>🆘 Someone must know what I can do tomorrow.</strong><small>{mobileServiceActive ? 'Find an organization that can explain your options.' : 'Mobile internet required.'}</small></div><span>~15 min</span></button>}
            {!firstNight && <button className="action" data-choice="beg" onClick={askForMoney} disabled={(begging.day === game.day ? begging.attempts : 0) >= 3}><div><strong>🤲 Ask someone for change? It’s hard, but I could try.</strong><small>{(begging.day === game.day ? begging.attempts : 0) >= 3 ? 'No useful attempts left today.' : `Spend time asking for small change · ${3 - (begging.day === game.day ? begging.attempts : 0)}/3 attempts left today.`}</small></div><span>~45 min</span></button>}
            {!firstNight && <button className="action" data-choice="bottles" onClick={searchStreetBottles}><div><strong>Maybe there are bottles I could return for a little money.</strong><small>Move rubbish aside. Collect intact deposit bottles and cans.</small></div><span>~10–60 min</span></button>}
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
              <div><strong>{action.id === 'street-sleep' && <span className="choice-emoji" aria-hidden="true">🛌</span>}{registering ? 'Join registration queue' : action.id === 'shelter-rest' ? 'Use your reserved bed' : action.id === 'street-sleep' ? 'Lie down here? I’m not sure… But I could try.' : action.name}</strong><small>{registering ? life.shelterRegistrationAttemptDay === game.day ? 'No places left for you today. Try tomorrow from 19:00.' : 'Registration 19:00–22:00 · wait 20 min. Earlier arrivals have a better chance; places are limited.' : action.id === 'shelter-rest' ? 'Use your reserved bed · arrive 18:00–22:00 and leave by 08:00.' : action.id === 'shelter-shower' || action.id === 'daycenter-shower' ? inventory.showerGel > 0 ? `3-in-1 gel: Hygiene gain ×1.5, max ${hygieneLimit} · uses 1 automatically.` : `Water only: Hygiene max ${Math.min(70, hygieneLimit)}. Bring 3-in-1 shower gel for better cleaning.` : action.description}{(action.id === 'shelter-shower' || action.id === 'daycenter-shower') && hygieneLimit < 100 && ` Dirty clothes: Hygiene max ${hygieneLimit}.`}{unavailableReason && <em className="action-unavailable-reason">{unavailableReason}</em>}</small>{action.impacts && <span className="shop-impact" aria-label="Effects">{action.impacts.map(impact => <em className="positive" key={impact}>{impact}</em>)}</span>}</div>
              <span>{selectableSleep ? 'Choose duration' : <>{action.cost ? `${action.cost} zł · ` : ''}~{registering ? SHELTER_QUEUE_MINUTES : action.minutes} min</>}</span>
            </button>
          }) : <p className="empty">Nothing useful to do here yet.</p>}
        </AvailableFirst>
      </>}
      </ClosedContent>
      </>}
    </div>}

    {phoneActivity && <div className="travel-overlay phone-activity-overlay" inert={!phoneSearchVisible} aria-hidden={!phoneSearchVisible || undefined}>
      <section className="travel-screen phone-activity" role="dialog" aria-modal="true" aria-labelledby="phone-activity-title" aria-busy="true" tabIndex={-1} ref={phoneSearchModalRef}>
        <PhoneSearchIcon />
        <div className="travel-route-heading"><p>{underRainCover ? 'Browsing · under cover' : 'Browsing'}</p><h2 id="phone-activity-title">{phoneActivity.remaining > phoneActivity.total * 2 / 3 ? 'Looking for information' : phoneActivity.remaining > phoneActivity.total / 3 ? 'Reading through options' : 'Saving useful addresses'}</h2></div>
        <div className="travel-elapsed phone-activity-meta" aria-label="Elapsed browsing time"><Icon name="clock" /><strong>{formatTravelTime(Math.max(0, phoneActivity.total - phoneActivity.remaining))}</strong></div>
      </section>
    </div>}


    {(screen === 'map' || travelling) && <div className="map-surface" inert={travelling} aria-hidden={travelling || undefined}><CityMap
      places={mapPlaces}
      currentId={game.locationId} minutes={game.minutes} reservedBed={shelterBooked} routeId={travelling ? trip!.destinationId : selectedDestination} onRoute={chooseDestination}
    /></div>}

    {screen === 'travel' && trip && (() => {
      const destination = locations.find((x) => x.id === trip.destinationId)
      const elapsed = Math.max(0, trip.total - trip.remaining)
      const phase = getTravelDisplayPhase(trip)
      return <div className="travel-overlay" inert={!travelVisible} aria-hidden={!travelVisible || undefined}><section className="travel-screen" role="dialog" aria-modal="true" aria-label="Time on the way" tabIndex={-1} ref={travelModalRef}>
        {underRainCover ? <><div className="travel-visual rain-cover-visual"><Icon name="umbrella" /></div><div className="travel-route-heading"><p>Journey paused</p><h2>Waiting under cover</h2></div><p className="rain-travel-note">Your journey resumes when the rain stops.</p><button className="rain-resume" onClick={() => setRainResponse(previous => previous ? { ...previous, sheltered: false } : null)}>Continue journey in the rain</button></> : <TravelHeading from={current.name} to={destination?.name} walking={trip.mode === 'walk'} phaseLabel={phase.label} moving={phase.walking} />}
        <div className="travel-elapsed" aria-label="Elapsed travel time"><Icon name="clock" /><strong>{formatTravelTime(elapsed)}</strong></div>
      </section></div>
    })()}

    {selectedDestination && screen === 'map' && (() => {
      const destination = locations.find((x) => x.id === selectedDestination)
      if (!destination) return null
      const transitMinutes = Math.ceil(destination.travelMinutes * 0.5)
      const nearbyTime = destination.travelRange ? `${destination.travelRange.min}–${destination.travelRange.max}m` : null
      return <div className="travel-sheet">
        <button className="sheet-close" onClick={() => setSelectedDestination(null)}>×</button>
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

      </div>
    })()}

    {screen === 'inventory' && <section className="inventory-screen">
      <div className="inventory-heading"><h2>Inventory</h2></div>
      <div className="inventory-section-heading"><strong>Backpack</strong><span>{usedBackpackSlots} / {BACKPACK_CAPACITY} slots</span></div>
      <div className="inventory-grid backpack-grid" role="group" aria-label="Backpack slots">
        {backpackItems.flatMap(item => Array.from({ length: Math.ceil(item.count / item.stackSize) }, (_, index) =>
          <InventorySlot key={`${item.art}-${index}`} art={item.art} name={item.name} quantity={Math.min(item.stackSize, item.count - index * item.stackSize)} effects={item.effects} hint={item.hint} onUse={item.onUse} disabled={item.disabled} />))}
      </div>
      {usedBackpackSlots === 0 && <p className="backpack-empty-message">Your backpack is empty.</p>}

      <div className="inventory-section-heading essentials-heading"><strong>Essentials</strong></div>
    {phoneOpen && <PhoneDialog orderSeed={choiceSeed} decisionKey={choiceDecisionKey}
        battery={inventory.phoneBattery} serviceActive={mobileServiceActive} serviceMinutesLeft={mobileServiceMinutesLeft} canBuyService={game.money >= 1}
        autoRenew={mobileAutoRenew} navigation={navigationOn} music={musicOn} navigationRate={Math.round(navigationDrainPerHour * 10) / 10} navigationInBrightSun={navigationInBrightSun}
        videoDrain={Math.round(9 * phoneDrainMultiplier(inventory.phoneCondition))}
        showAi={current.id === 'street'} canAskAi={mobileServiceActive && inventory.phoneCondition > 0 && inventory.phoneBattery >= phoneSearchCost}
        canNavigate={inventory.phoneBattery > 0 && mobileServiceActive} canWatchVideo={mobileServiceActive && inventory.phoneBattery >= 9 * phoneDrainMultiplier(inventory.phoneCondition)}
        canCallAmbulance={game.health <= 20 && inventory.phoneBattery > 0 && inventory.phoneCondition > 0} lowHealth={game.health <= 20}
        blocked={eventInteractionBlocked || !!infoModal || !!sleeping || !!sleepChoice || !!gameOver}
        onClose={() => setPhoneOpen(false)} onBuyService={() => { setPhoneOpen(false); buyMobileService() }}
        onAutoRenew={() => setMobileAutoRenew(value => !value)} onNavigation={() => setNavigationOn(value => !value)} onMusic={() => setMusicOn(value => !value)}
        onAskAi={() => { setPhoneOpen(false); setScreen('location'); answerPracticalQuestion('morning') }}
        onWatchVideo={() => { setPhoneOpen(false); watchVideo() }} onCallAmbulance={() => { setPhoneOpen(false); callAmbulance() }}
      />}
      <div className="inventory-grid essentials-grid">
        <button className="inventory-item usable" onClick={event => { event.currentTarget.focus({ preventScroll: true }); setPhoneOpen(true) }}>
          <ItemArt id="phone" /><div><strong>Phone</strong><small>Battery {Math.round(inventory.phoneBattery)}%<br />tap to open</small></div>
        </button>
        <button className="inventory-item usable" onClick={() => setInfoModal({ title: 'Clothing', text: `Clean ${Math.round(inventory.clothingCleanliness)}%\nCondition ${Math.round(inventory.jacket)}%\nWetness ${Math.round(game.wetness ?? 0)}%\n\nHygiene max ${hygieneLimit}. Washing your clothes improves cleanliness and the hygiene limit. Wet clothes drain Energy and Mood, especially in cold wind, and reduce outdoor sleep recovery. Dry indoors; a canopy stops new rain but dries clothes slowly.` })}>
          <ItemArt id="clothing" /><div><strong>Clothing</strong><small>Clean {Math.round(inventory.clothingCleanliness)}%<br />Condition {Math.round(inventory.jacket)}%</small></div>
        </button>
        <div className="inventory-item">
          <ItemArt id="documents" /><div><strong>Documents</strong><small>{inventory.documents ? 'With you' : 'Missing'}</small></div>
        </div>
        <div className="inventory-item">
          <ItemArt id="transitCard" /><div><strong>Transit card</strong><small>{inventory.transitCard ? 'Active' : 'Missing'}</small></div>
        </div>
      </div>
    </section>}
    {screen === 'status' && <section className="status-screen">
      <h2 className="status-title">Status</h2>
      {!!statusEffectCount && <section className="status-effects" aria-labelledby="status-effects-heading">
        <div className="effects-heading"><h3 id="status-effects-heading">Effects</h3><span>{statusEffectCount}</span></div>
        <div className="effects-list">
          {(game.wetness ?? 0) > 0 && <div className="effect negative wet-clothes">
            <span><Icon name="water" /></span><strong className="effect-name">Wet clothes</strong>
            <div className="effect-details"><div className="effect-impact"><b>Energy−</b><b>Mood−</b></div><small className="effect-time">{Math.max(1, Math.round(game.wetness!))}%</small></div>
          </div>}
          {separateLimits.map(effect => <div className="effect negative limit-effect" data-limit-reason={effect.reason} data-mood-limit={effect.limits.some(limit => limit.stat === 'Mood') ? effect.reason : undefined} key={effect.reason}>
            <span><Icon name={effect.icon} /></span><strong className="effect-name" title={effect.name}>{effect.name}</strong>
            <div className="effect-impact">{effect.limits.map(limit => <b key={limit.stat}>{limit.stat} ≤ {Math.round(limit.cap)}%</b>)}</div>
          </div>)}
          {statusEffects.map(active => {
            const effect = EFFECTS[active.id]
            const coldLimit = active.id === 'cold' ? statLimits.find(limit => limit.reason === 'Cold') : undefined
            return <div className={`effect ${effect.kind}${active.id === 'cold' ? ' illness' : ''}`} key={active.id}>
              <span><Icon name={effect.icon} /></span><strong className="effect-name" title={active.id === 'cold' && active.treated ? 'Cold · treated: recovery ×3' : effect.name}>{effect.name}{active.id === 'cold' && active.treated ? ' · treated' : ''}</strong>
              <div className="effect-details"><div className="effect-impact">{effect.impacts.map(impact => <b key={impact}>{impact}{impact === 'Mood−' && coldLimit ? ` · ≤ ${Math.round(coldLimit.limits[0].cap)}%` : ''}</b>)}</div>{active.id !== 'cold' && <small className="effect-time">{remainingEffect(active.expiresAt, game)}</small>}</div>
            </div>
          })}
        </div>
      </section>}
      <div className="condition-heading"><h3>Condition</h3></div>
      {focusedNeed && <Stat label={focusedNeed.label} value={focusedNeed.value} icon={<Icon name={focusedNeed.icon} />} cap={focusedNeed.cap} capReason={focusedNeed.capReason} focus />}
      <div className="status-needs" aria-label={focusedNeed ? 'Other condition indicators' : 'Condition indicators'}>
        {statusNeeds.filter(need => need.id !== focusedNeed?.id).map(need => <Stat key={need.id} label={need.label} value={need.value} icon={<Icon name={need.icon} />} cap={need.cap} capReason={need.capReason} />)}
      </div>
      <LifeSituation housing={life.housing} employment={life.employment} income={life.income} documents={inventory.documents ? 'With you' : storage.documents ? 'Stored safely' : 'Missing'} />
    </section>}
    {screen === 'journal' && <section className="journal-screen">
      <div className="journal-heading"><h2>Journal</h2></div>

      <JournalGoals pending={pendingGoals} completed={completedGoals} />

      <section className="journal-history" aria-labelledby="journal-day-heading">
        <div className="journal-day-switch" role="group" aria-label="Journal day">
          <button type="button" aria-label="Previous day" disabled={journalDay <= 1} onClick={() => setSelectedJournalDay(journalDay - 1)}><Icon name="chevron-left" /></button>
          <h3 id="journal-day-heading" aria-live="polite">Day {journalDay} · {weekday(journalDay)}</h3>
          <button type="button" aria-label="Next day" disabled={journalDay >= game.day} onClick={() => setSelectedJournalDay(journalDay + 1 === game.day ? null : journalDay + 1)}><Icon name="chevron-right" /></button>
        </div>
        <JournalTimeline entries={journalEntries} day={journalDay} today={journalDay === game.day} />
      </section>
    </section>}

    </div>

    {gameOver && <div className="game-over-overlay" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
      <section className="game-over-card">
        <p className="eyebrow">RUN OVER</p>
        <div className="game-over-emblem"><Icon name="heart-broken" /></div>
        <h2 id="game-over-title">Your health reached zero</h2>
        <p className="game-over-day"><strong>Day {game.day}</strong><span>Your run ended here</span></p>
        <p className="game-over-description">Food, water and medicine can stop causes of damage, but lost health needs proper recovery and care.</p>
        <button onClick={reset}>Start new run</button>
      </section>
    </div>}

    {!gameOver && rainChoice && !infoModal && !pendingResult && !activeEvent && !diceCheck && <div className="event-overlay" role="dialog" aria-modal="true" aria-label="Rain on the street">
      <section className="event-card illustrated-event compact-street-event rain-card" ref={rainModalRef}>
        <img className="event-illustration" {...responsiveImageProps('/street-life-game/assets/event-rain-street.webp')} alt="Rain falls beside a closed shop with an entrance canopy." />
        <div className="event-body">
          <div className="compact-event-heading"><Icon name="rain" /><div><p className="eyebrow">RAIN · TIME PAUSED</p><h2>It’s starting to rain</h2></div></div>
          <p className="compact-event-description">{phoneActivity ? 'Drops land on your screen. You could find a canopy and finish looking things up there.' : trip ? 'Rain catches you on the way. You could wait under cover before continuing your journey.' : 'Your clothes are getting wet. You could find a nearby canopy and carry on there.'}</p>
          <ChoiceOptions className="event-choices" seed={choiceSeed} decision={`${choiceDecisionKey}|rain`}>
            <button onClick={() => respondToRain('cover')}><span className="compact-event-choice-copy"><strong>{trip ? 'Find cover, then continue when it stops.' : 'Find cover and continue.'}</strong><small>≈5m to find shelter</small></span><Icon name="umbrella" /></button>
            <button onClick={() => respondToRain('continue')}><span className="compact-event-choice-copy"><strong>Continue as I am.</strong><small>You will keep getting wetter</small></span><Icon name="rain" /></button>
            <button onClick={() => respondToRain('stop')}><span className="compact-event-choice-copy"><strong>Stop what I’m doing.</strong><small>{phoneActivity ? 'Put the phone away' : trip ? 'Stop the journey' : 'Stay here for now'}</small></span><Icon name="pause" /></button>
          </ChoiceOptions>
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

    {!gameOver && shelterQueue && <div className="sleep-overlay queue-overlay timed-overlay" role="dialog" aria-modal="true" aria-label="Shelter registration queue">
      <section className="sleep-card timed-card rest-card">
        <div className="timed-heading"><Icon name="clock" /><div><p className="eyebrow">NIGHT SHELTER</p><h2>Registration queue</h2></div></div>
        <p className="timed-description">Waiting for your turn. A bed isn’t guaranteed.</p>
        <div className="sleep-clock"><strong>{formatTime(game.minutes)}</strong><span>{shelterQueue.remaining} min remaining</span></div>
        <div className="sleep-progress" role="progressbar" aria-label="Registration queue progress" aria-valuemin={0} aria-valuemax={SHELTER_QUEUE_MINUTES} aria-valuenow={SHELTER_QUEUE_MINUTES - shelterQueue.remaining}><i style={{ width: `${(1 - shelterQueue.remaining / SHELTER_QUEUE_MINUTES) * 100}%` }} /></div>
        <p className="timed-footnote">Today’s availability: 0–3 places. Earlier arrivals have a better chance.</p>
      </section>
    </div>}

    {!gameOver && shelterCheckoutDue && !sleeping && !infoModal && !pendingResult && !activeEvent && !diceCheck && <div className="sleep-overlay checkout-overlay timed-overlay" role="dialog" aria-modal="true" aria-label="Leave the night shelter">
      <section className="sleep-card timed-card">
        <div className="timed-heading"><Icon name="backpack" /><div><p className="eyebrow">MORNING CHECKOUT</p><h2>Time to leave the night shelter</h2></div></div>
        <p className="timed-description">You must leave by 08:00. Packing and leaving takes 30 minutes.</p>
        <div className="sleep-clock"><strong>{formatTime(game.minutes)}</strong><span>On the street at {formatTime((game.minutes + SHELTER_DEPARTURE_MINUTES) % 1440)}</span></div>
        <button className="checkout-start" autoFocus onClick={startShelterDeparture}>Leave the night shelter · 30 min</button>
      </section>
    </div>}

    {!gameOver && shelterDeparture && <div className="sleep-overlay checkout-overlay timed-overlay" role="dialog" aria-modal="true" aria-label="Leaving the night shelter">
      <section className="sleep-card timed-card">
        <div className="timed-heading"><Icon name="backpack" /><div><p className="eyebrow">MORNING CHECKOUT</p><h2>Leaving the night shelter</h2></div></div>
        <p className="timed-description">Packing your things and heading outside.</p>
        <div className="sleep-clock"><strong>{formatTime(game.minutes)}</strong><span>{shelterDepartureRemaining} min remaining</span></div>
        <div className="sleep-progress" role="progressbar" aria-label="Packing progress" aria-valuemin={0} aria-valuemax={SHELTER_DEPARTURE_MINUTES} aria-valuenow={SHELTER_DEPARTURE_MINUTES - shelterDepartureRemaining}><i style={{ width: `${(1 - shelterDepartureRemaining / SHELTER_DEPARTURE_MINUTES) * 100}%` }} /></div>
        <p className="timed-footnote"><Icon name="clock" />On the street at {formatTime((shelterDeparture.startAbsolute + SHELTER_DEPARTURE_MINUTES) % 1440)}</p>
      </section>
    </div>}

    {sleeping && <div className="sleep-overlay timed-overlay" role="dialog" aria-modal="true" aria-label="Sleeping">
      <section className="sleep-card timed-card rest-card">
        <SleepHeading kind={sleeping.kind} />
        <p className="timed-description">{sleeping.kind === 'shelter' ? 'Resting in your reserved bed.' : sleeping.kind === 'residential' ? 'Resting in your room.' : sleeping.kind === 'bench' ? 'Resting on a bench, still exposed.' : 'Resting on the ground, out in the open.'}</p>
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
      </section>
    </div>}

    {!gameOver && activeEvent && !diceCheck && !sleeping && !infoModal && !pendingResult && <div className="event-overlay" role="dialog" aria-modal="true" aria-labelledby="street-event-title">
      <section ref={eventModalRef} className={`event-card${activeEvent.illustration ? ' illustrated-event' : ' compact-street-event'}`}>
        {activeEvent.illustration && <img className="event-illustration" {...responsiveImageProps(activeEvent.illustration)} alt={activeEvent.text} />}
        {!activeEvent.illustration
          ? <CompactStreetEvent event={activeEvent} onChoose={resolveStreetEvent} unavailableReason={checkUnavailableReason} orderSeed={choiceSeed} decisionKey={choiceDecisionKey} />
          : <div className="event-body">
        <p className="eyebrow">STREET EVENT</p>
        <h2 id="street-event-title">{activeEvent.title}</h2>
        <p>{activeEvent.text}</p>
        <ChoiceOptions className="event-choices" seed={choiceSeed} decision={`${choiceDecisionKey}|event:${activeEvent.id}`}>{activeEvent.choices.map((choice) => {
          const unavailable = checkUnavailableReason(choice)
          return <button key={choice.label} aria-label={choice.label} onClick={() => resolveStreetEvent(choice)} disabled={!!unavailable}><span>{choice.label}</span>{unavailable ? <small>{unavailable}</small> : !!choice.outcome?.minutes && <small className="event-choice-time">≈{choice.outcome.minutes}m</small>}</button>
        })}</ChoiceOptions>
        </div>}
      </section>
    </div>}

    {autosave.saveFailed && <p role="alert" className="save-warning">Progress could not be saved on this device. Keep the game open and try again.</p>}
    <footer inert={activityOverlay || eventInteractionBlocked} aria-hidden={eventInteractionBlocked || undefined} className={eventInteractionBlocked ? 'event-background-blocked' : undefined}><button className="reset" disabled={eventInteractionBlocked} onClick={() => { if (!eventInteractionBlocked) reset() }}>Reset save</button><small className="header-version" title={BUILD_VERSION} aria-label={`Build ${BUILD_VERSION}`}>v{BUILD_VERSION.split('-').pop()}</small></footer>
    <nav inert={eventInteractionBlocked} aria-hidden={eventInteractionBlocked || undefined} className={`bottom-nav${screen === 'travel' || phoneActivity ? ' travelling' : ''}${eventInteractionBlocked ? ' event-background-blocked' : ''}`} aria-label="Main navigation">
      {nav('map', 'map', 'Map')}
      {nav('inventory', 'backpack', 'Inventory')}
      <button disabled={!!phoneActivity || travelling || eventInteractionBlocked} className={screen === 'location' ? 'nav-item home active' : 'nav-item home'} aria-current={screen === 'location' ? 'page' : undefined} onClick={() => setScreen('location')}><Icon name={locationIcon(current.id)} /><small>{current.name}</small></button>
      <button disabled={!!phoneActivity || travelling || eventInteractionBlocked} className={screen === 'status' ? 'nav-item active' : 'nav-item'} aria-current={screen === 'status' ? 'page' : undefined} onClick={() => setScreen('status')} aria-label="Status" title={moodBand.label}><Icon name="person" /><small>Status</small><i className={`nav-condition ${moodBand.level}`} aria-hidden="true" /></button>
      {nav('journal', 'journal', 'Journal')}
    </nav>
  </main>
}
