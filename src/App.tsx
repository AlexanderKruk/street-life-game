import { useEffect, useMemo, useState } from 'react'
import { actions, applyAction, energyCap, formatTime, healthEnergyMultiplier, initialState, isOpen, locations, type GameState } from './game'
import { pickStreetEvent, type EventOutcome, type StreetEvent, type StreetEventChoice } from './events'

const SAVE_KEY = 'street-life-save-v3'
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const WEATHER = [
  { icon: '☁️', label: 'Cloudy', temp: 9, energyDrain: 0, thirstDrain: 0 },
  { icon: '🌧️', label: 'Rain', temp: 7, energyDrain: 0.025, thirstDrain: 0 },
  { icon: '☀️', label: 'Clear', temp: 16, energyDrain: 0, thirstDrain: 0.02 },
  { icon: '🌬️', label: 'Windy', temp: 6, energyDrain: 0.035, thirstDrain: 0 },
  { icon: '🌦️', label: 'Showers', temp: 10, energyDrain: 0.015, thirstDrain: 0 },
]

function weekday(day: number) {
  return WEEKDAYS[(day - 1) % WEEKDAYS.length]
}

function temperatureAt(base: number, minutes: number) {
  const hour = minutes / 60
  // Coldest around 05:00, warmest around 15:00.
  const dailySwing = -Math.cos(((hour - 5) / 10) * Math.PI)
  return Math.round(base + dailySwing * 4)
}
type Screen = 'location' | 'map' | 'inventory' | 'status' | 'journal' | 'travel'
type TravelMode = 'walk' | 'transit'
type Trip = { destinationId: string; mode: TravelMode; total: number; remaining: number }
type Inventory = { water: number; food: number; foodFreshness: number; bottles: number; phoneBattery: number; phoneCondition: number; jacket: number; documents: boolean; cigarettes: number; medicines: number; transitCard: boolean }
type ShopItem = { id: 'water' | 'food' | 'cigarettes' | 'medicines'; name: string; icon: string; price: number; quantity: number; description: string; impacts: string[] }
type EffectId = 'cold' | 'free-transit' | 'well-fed'
type ActiveEffect = { id: EffectId; expiresAt: number }
type LifeSituation = { housing: 'Street' | 'Night shelter' | 'Schronisko'; housingUntil?: number; employment: 'Unemployed' | 'Day work'; income: 'None' | 'Irregular'; schroniskoReferral?: boolean }
type StoredItems = { documents: boolean; medicines: number; cigarettes: number; food: number; foodFreshness: number }

const INITIAL_LIFE: LifeSituation = { housing: 'Street', employment: 'Unemployed', income: 'None' }
const INITIAL_INVENTORY: Inventory = { water: 2, food: 2, foodFreshness: 100, bottles: 0, phoneBattery: 62, phoneCondition: 72, jacket: 78, documents: true, cigarettes: 6, medicines: 2, transitCard: true }
const BACKPACK_CAPACITY = 8
const INITIAL_STORAGE: StoredItems = { documents: false, medicines: 0, cigarettes: 0, food: 0, foodFreshness: 100 }
const SCHRONISKO_FOOD_CAPACITY = 4
const FOOD_FRESHNESS_PER_MINUTE = 100 / (48 * 60)
const NIGHT_SHELTER_STORAGE = 6
const SCHRONISKO_STORAGE = 16
const STACK_SIZE = 4
const CIGARETTE_STACK_SIZE = 20
const BOTTLE_STACK_SIZE = 8
const BOTTLE_DEPOSIT = 0.5
const EFFECTS: Record<EffectId, { icon: string; name: string; kind: 'positive' | 'negative'; impacts: string[] }> = {
  cold: { icon: '🤒', name: 'Cold', kind: 'negative', impacts: ['Energy −−', 'Mood −'] },
  'free-transit': { icon: '🎫', name: 'Free transport', kind: 'positive', impacts: ['Travel +++'] },
  'well-fed': { icon: '🍲', name: 'Well fed', kind: 'positive', impacts: ['Food +++', 'Mood +'] },
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 'water', name: 'Water', icon: '💧', price: 3, quantity: 1, description: 'Bottle · stack 4', impacts: ['Thirst +++'] },
  { id: 'food', name: 'Cheap food', icon: '🥪', price: 5, quantity: 1, description: 'Sandwich · stack 4', impacts: ['Food ++', 'Mood +'] },
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
  return stackSlots(inventory.water) + stackSlots(inventory.food) + (inventory.bottles > 0 ? Math.ceil(inventory.bottles / BOTTLE_STACK_SIZE) : 0) + (inventory.cigarettes > 0 ? Math.ceil(inventory.cigarettes / CIGARETTE_STACK_SIZE) : 0) + stackSlots(inventory.medicines)
}

function absoluteMinutes(game: GameState) {
  return (game.day - 1) * 1440 + game.minutes
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

const mapPositions: Record<string, { left: string; top: string }> = {
  street: { left: '35%', top: '17%' },
  station: { left: '13%', top: '18%' },
  shop: { left: '64%', top: '14%' },
  support: { left: '40%', top: '38%' },
  jobcenter: { left: '70%', top: '51%' },
  shelter: { left: '16%', top: '65%' },
  work: { left: '53%', top: '76%' },
  'residential-shelter': { left: '80%', top: '75%' },
}

function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    return raw ? { ...initialState, ...JSON.parse(raw) } : initialState
  } catch {
    return initialState
  }
}

function Stat({ label, value, icon, compact = false }: { label: string; value: number; icon: string; compact?: boolean }) {
  const level = value > 60 ? 'good' : value > 30 ? 'warning' : 'critical'
  return <div className={compact ? 'stat compact' : 'stat'}><span>{icon}</span><div><div className="stat-label"><span>{label}</span>{!compact && <b>{Math.round(value)}</b>}</div><div className="bar"><i className={level} style={{ width: `${value}%` }} /></div></div></div>
}

function overallStatus(game: GameState) {
  const values = [game.hunger, game.thirst, game.energy, game.health, game.hygiene, game.mood]
  const lowest = Math.min(...values)
  if (lowest <= 30) return { label: 'BAD', icon: '😣', level: 'bad' }
  if (lowest <= 60) return { label: 'FAIR', icon: '😐', level: 'fair' }
  return { label: 'OK', icon: '🙂', level: 'ok' }
}

export default function App() {
  const [game, setGame] = useState<GameState>(loadGame)
  const [message, setMessage] = useState('Morning. You have a little cash and no plan yet.')
  const [screen, setScreen] = useState<Screen>('location')
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [musicOn, setMusicOn] = useState(false)
  const [streetBenchFound, setStreetBenchFound] = useState(false)
  const [sleepHours, setSleepHours] = useState(8)
  const [begging, setBegging] = useState<{ day: number; attempts: number }>({ day: 1, attempts: 0 })
  const [navigationOn, setNavigationOn] = useState(true)
  const [activeEvent, setActiveEvent] = useState<StreetEvent | null>(null)
  const [diceCheck, setDiceCheck] = useState<{ choice: StreetEventChoice; roll: number | null; modifier: number; resolved: boolean } | null>(null)
  const [inventory, setInventory] = useState<Inventory>(() => {
    try {
      const raw = localStorage.getItem('street-life-inventory-v1')
      return raw ? { ...INITIAL_INVENTORY, ...JSON.parse(raw) } : INITIAL_INVENTORY
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
      return raw ? JSON.parse(raw) : [{ id: 'cold', expiresAt: 2 * 1440 + 480 }]
    } catch {
      return [{ id: 'cold', expiresAt: 2 * 1440 + 480 }]
    }
  })
  const current = useMemo(() => locations.find((x) => x.id === game.locationId) ?? locations[0], [game.locationId])
  const currentActions = actions.filter((x) => x.locationId === current.id)
  const open = isOpen(current, game.minutes)
  const overall = overallStatus(game)
  const weather = WEATHER[(game.day - 1) % WEATHER.length]
  const temperature = temperatureAt(weather.temp, game.minutes)
  const usedBackpackSlots = backpackSlots(inventory)
  const gameOver = game.health <= 0
  const dayWorkEnergyRequired = 55
  const storageCapacity = current.id === 'residential-shelter' ? SCHRONISKO_STORAGE : NIGHT_SHELTER_STORAGE
  const usedStorageSlots = storageSlots(storage)

  useEffect(() => { localStorage.setItem(SAVE_KEY, JSON.stringify(game)) }, [game])
  useEffect(() => { localStorage.setItem('street-life-inventory-v1', JSON.stringify(inventory)) }, [inventory])
  useEffect(() => { localStorage.setItem('street-life-storage-v1', JSON.stringify(storage)) }, [storage])
  useEffect(() => { localStorage.setItem('street-life-effects-v1', JSON.stringify(effects)) }, [effects])
  useEffect(() => { localStorage.setItem('street-life-situation-v1', JSON.stringify(life)) }, [life])
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
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible' || activeEvent || gameOver) return
      setGame((prev) => {
        const currentWeather = WEATHER[(prev.day - 1) % WEATHER.length]
        const next = applyAction(prev, { minutes: 1 })
        const cold = effects.some((effect) => effect.id === 'cold' && effect.expiresAt > absoluteMinutes(prev))
        const wellFed = effects.some((effect) => effect.id === 'well-fed' && effect.expiresAt > absoluteMinutes(prev))
        const hunger = Math.min(100, next.hunger + (wellFed ? 0.035 : 0))
        const thirst = Math.max(0, next.thirst - currentWeather.thirstDrain - (trip?.mode === 'walk' ? 0.04 : 0))
        const healthDamage =
          (thirst <= 0 ? 0.10 : thirst <= 10 ? 0.025 : 0) +
          (hunger <= 0 ? 0.035 : hunger <= 10 ? 0.012 : 0) +
          (cold ? 0.012 : 0)
        const health = Math.max(0, next.health - healthDamage)
        const movementDrain = (trip?.mode === 'walk' ? 0.12 : 0) * healthEnergyMultiplier(health)
        return {
          ...next,
          hunger,
          health,
          energy: Math.min(energyCap(health), Math.max(0, next.energy - currentWeather.energyDrain - movementDrain - (cold ? 0.045 : 0))),
          mood: Math.max(0, next.mood - (cold ? 0.012 : 0)),
          thirst,
        }
      })
      setStorage((prev) => prev.food > 0 ? { ...prev, foodFreshness: Math.max(0, prev.foodFreshness - FOOD_FRESHNESS_PER_MINUTE) } : prev)
      setInventory((prev) => {
        const sunny = WEATHER[(game.day - 1) % WEATHER.length].label === 'Clear'
        const drainMultiplier = phoneDrainMultiplier(prev.phoneCondition)
        const navigationDrain = trip && navigationOn ? ((sunny ? 15 : 12) / 60) * drainMultiplier : 0
        const musicDrain = musicOn ? (4 / 60) * drainMultiplier : 0
        return {
          ...prev,
          foodFreshness: prev.food > 0 ? Math.max(0, prev.foodFreshness - FOOD_FRESHNESS_PER_MINUTE) : 100,
          phoneBattery: Math.max(0, prev.phoneBattery - navigationDrain - musicDrain),
        }
      })
      if (musicOn) setGame((prev) => ({ ...prev, mood: Math.min(100, prev.mood + 0.012) }))
      setTrip((active) => {
        if (!active) return null
        if (active.remaining > 1) return { ...active, remaining: active.remaining - 1 }
        const destination = locations.find((x) => x.id === active.destinationId)
        if (destination) {
          setGame((prev) => ({ ...prev, locationId: destination.id }))
          setMessage(`You arrived at ${destination.name} by ${active.mode === 'walk' ? 'walking' : 'public transport'}.`)
          setScreen('location')
        }
        return null
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [trip, effects, musicOn, navigationOn, activeEvent, gameOver])

  function watchVideo() {
    const videoDrain = 9 * phoneDrainMultiplier(inventory.phoneCondition)
    if (inventory.phoneBattery < videoDrain) { setMessage('Not enough battery for 30 minutes of video.'); return }
    setInventory((prev) => ({ ...prev, phoneBattery: Math.max(0, prev.phoneBattery - videoDrain) }))
    setGame((prev) => applyAction(prev, { minutes: 30, mood: 8 }))
    setMessage('You watched videos for 30 minutes. Mood improved, but the worn phone used more battery.')
  }

  function chargePhone() {
    if (inventory.phoneBattery >= 100) { setMessage('Phone is already fully charged.'); return }
    if (current.id !== 'support' && current.id !== 'residential-shelter') return
    if (!open) return
    setInventory((prev) => ({ ...prev, phoneBattery: Math.min(100, prev.phoneBattery + 25) }))
    setGame((prev) => applyAction(prev, { minutes: 30 }))
    setMessage('You charged the phone for 30 minutes. Battery +25%.')
  }

  function chooseDestination(id: string) {
    if (id === game.locationId) {
      setScreen('location')
      return
    }
    if (id === 'street') {
      setGame((prev) => ({ ...prev, locationId: 'street' }))
      setSelectedDestination(null)
      setScreen('location')
      setMessage('You step outside onto the street.')
      return
    }
    setSelectedDestination(id)
  }

  function sleep(hours: number, kind: 'ground' | 'bench' | 'shelter' | 'residential') {
    if (activeEvent || hours < 1 || hours > 10) return
    const minutes = hours * 60
    const scale = hours / 8
    if (kind === 'bench' && (!streetBenchFound || current.id !== 'street')) return
    if (kind === 'ground' && current.id !== 'street') return
    if (kind === 'shelter' && current.id !== 'shelter') return
    if (kind === 'residential' && current.id !== 'residential-shelter') return
    if (kind === 'shelter' && game.intoxication > 10) {
      setMessage('The night shelter refuses admission because you are visibly intoxicated. You need to sober up first.')
      return
    }
    if (kind === 'shelter' && Math.random() >= .7) {
      setGame((prev) => applyAction(prev, { minutes: 30, mood: -8 }))
      setMessage('No beds left tonight. You waited in line for nothing.')
      return
    }
    const fed = game.hunger > 20 && game.thirst > 20
    const result = kind === 'ground'
      ? { minutes, energy: 52 * scale, hygiene: -12 * scale, mood: -9 * scale }
      : kind === 'bench'
        ? { minutes, energy: 66 * scale, hygiene: -7 * scale, mood: -5 * scale }
        : kind === 'shelter'
          ? { minutes, energy: 85 * scale, health: fed ? 2 * scale : 0, hygiene: 5 * scale, mood: 10 * scale }
          : { minutes, energy: 90 * scale, health: fed ? 3 * scale : 0, hygiene: 3 * scale, mood: 8 * scale }
    const next = applyAction(game, result)
    setGame(next)
    if (kind === 'ground' || kind === 'bench') {
      setLife((status) => ({ ...status, housing: 'Street', housingUntil: undefined }))
      const baseChance = kind === 'ground' ? 0.75 : 0.65
      const wakeEvent = pickStreetEvent('wake', { locationId: 'street', weather: weather.label, housing: 'Street', documents: inventory.documents }, Math.min(0.9, baseChance * scale))
      if (wakeEvent) setActiveEvent(wakeEvent)
    } else if (kind === 'shelter') {
      setLife((status) => ({ ...status, housing: 'Night shelter', housingUntil: absoluteMinutes(next) }))
      const wakeEvent = pickStreetEvent('wake', { locationId: current.id, weather: weather.label, housing: 'Night shelter', documents: inventory.documents }, Math.min(0.65, 0.45 * scale))
      if (wakeEvent) setActiveEvent(wakeEvent)
    } else {
      setLife((status) => ({ ...status, housing: 'Schronisko', housingUntil: undefined }))
    }
    setMessage(`You sleep for ${hours} hour${hours === 1 ? '' : 's'} ${kind === 'ground' ? 'on the ground' : kind === 'bench' ? 'on the bench' : kind === 'shelter' ? 'in the night shelter' : 'in your shelter place'}.${(kind === 'shelter' || kind === 'residential') && !fed ? ' Hunger or dehydration prevents health recovery.' : ''}`)
  }

  function askForMoney() {
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
    if (activeEvent || current.id !== 'street') return
    const found = Math.floor(Math.random() * 7)
    const returnable = Array.from({ length: found }, () => Math.random() < 0.65).filter(Boolean).length
    const currentBottleSlots = inventory.bottles > 0 ? Math.ceil(inventory.bottles / BOTTLE_STACK_SIZE) : 0
    const otherSlots = backpackSlots(inventory) - currentBottleSlots
    const bottleCapacity = Math.max(0, BACKPACK_CAPACITY - otherSlots) * BOTTLE_STACK_SIZE
    const collected = Math.min(returnable, Math.max(0, bottleCapacity - inventory.bottles))
    setGame((prev) => applyAction(prev, { minutes: 45, energy: -4, hygiene: -10, mood: collected > 0 ? 1 : -3 }))
    if (collected > 0) setInventory((prev) => ({ ...prev, bottles: prev.bottles + collected }))
    if (found === 0) setMessage('You searched the bins but found no bottles.')
    else if (returnable === 0) setMessage(`You found ${found} bottle${found === 1 ? '' : 's'}, but none can be returned for a deposit.`)
    else if (collected === 0) setMessage(`You found ${found} bottle${found === 1 ? '' : 's'}; ${returnable} were returnable, but your backpack has no room.`)
    else if (collected < returnable) setMessage(`You found ${found} bottle${found === 1 ? '' : 's'}; ${returnable} were returnable, but you could only carry ${collected}.`)
    else setMessage(`You found ${found} bottle${found === 1 ? '' : 's'}; ${returnable} can be returned. You keep those.`)
  }

  function returnBottles() {
    if (!open || current.id !== 'shop' || inventory.bottles <= 0) return
    const count = inventory.bottles
    const payout = count * BOTTLE_DEPOSIT
    setInventory((prev) => ({ ...prev, bottles: 0 }))
    setGame((prev) => applyAction(prev, { minutes: 5, money: payout }))
    setMessage(`Returned ${count} bottle${count === 1 ? '' : 's'} for ${payout.toFixed(2)} zł.`)
  }

  function streetAction(kind: 'find-bench' | 'bench-rest' | 'bench-sleep') {
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
    sleep(sleepHours, 'bench')
  }

  function startTravel(mode: TravelMode) {
    const destination = locations.find((x) => x.id === selectedDestination)
    if (!destination) return
    const total = mode === 'walk' ? destination.travelMinutes : Math.max(4, Math.ceil(destination.travelMinutes * 0.35))
    const freeTransit = effects.some((effect) => effect.id === 'free-transit' && effect.expiresAt > absoluteMinutes(game))
    const fare = freeTransit ? 0 : 4.4
    if (mode === 'transit' && game.money < fare) {
      setMessage('You do not have enough money for public transport.')
      return
    }
    if (mode === 'transit') setGame((prev) => ({ ...prev, money: Math.max(0, prev.money - fare) }))
    setStreetBenchFound(false)
    setTrip({ destinationId: destination.id, mode, total, remaining: total })
    setSelectedDestination(null)
    setScreen('travel')
    if (!activeEvent) {
      const event = pickStreetEvent('travel', { locationId: game.locationId, travelMode: mode, weather: weather.label, housing: life.housing, documents: inventory.documents }, mode === 'walk' ? 0.30 : 0.18)
      if (event) setActiveEvent(event)
    }
  }

  function act(actionId: string) {
    const action = actions.find((x) => x.id === actionId)
    if (!action || activeEvent) return
    if (!open && action.requiresOpen !== false) { setMessage(`${current.name} is closed. Come back during opening hours.`); return }
    if (action.cost && game.money < action.cost) { setMessage(`You need ${action.cost.toFixed(2)} zł for that.`); return }

    if (actionId === 'street-sleep') { sleep(sleepHours, 'ground'); return }
    if (actionId === 'shelter-rest') { sleep(sleepHours, 'shelter'); return }
    if (actionId === 'residential-sleep') { sleep(sleepHours, 'residential'); return }

    const result = action.resolve(game)
    const next = applyAction(game, result)
    setGame(next)
    setMessage(result.message ?? 'Time passes.')

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
  }

  function applyEventOutcome(outcome: EventOutcome) {
    setGame((prev) => applyAction(prev, {
      minutes: outcome.minutes ?? 0,
      money: outcome.money,
      mood: outcome.mood,
      energy: outcome.energy,
      health: outcome.health,
      hygiene: outcome.hygiene,
    }))
    setInventory((prev) => ({
      ...prev,
      food: Math.max(0, prev.food + (outcome.food ?? 0)),
      foodFreshness: (outcome.food ?? 0) > 0 ? mixFreshness(prev.food, prev.foodFreshness, outcome.food ?? 0, 100) : prev.foodFreshness,
      water: Math.max(0, prev.water + (outcome.water ?? 0)),
      phoneCondition: Math.max(0, Math.min(100, prev.phoneCondition + (outcome.phoneCondition ?? 0))),
      jacket: Math.max(0, Math.min(100, prev.jacket + (outcome.jacketCondition ?? 0))),
      documents: outcome.loseDocuments ? false : prev.documents,
    }))
    setMessage(outcome.message)
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
    setDiceCheck(null)
    setActiveEvent(null)
  }

  function storeItem(item: 'documents' | 'medicines' | 'cigarettes') {
    if (current.id !== 'shelter' && current.id !== 'residential-shelter') return
    if (!open) return
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

  function takeStoredItem(item: 'documents' | 'medicines' | 'cigarettes') {
    if (current.id !== 'shelter' && current.id !== 'residential-shelter') return
    if (!open) return
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

  function storeFood() {
    if (current.id !== 'residential-shelter' || inventory.food <= 0 || storage.food >= SCHRONISKO_FOOD_CAPACITY) return
    const amount = Math.min(inventory.food, SCHRONISKO_FOOD_CAPACITY - storage.food)
    const freshness = inventory.foodFreshness
    setInventory((prev) => ({ ...prev, food: prev.food - amount, foodFreshness: prev.food <= amount ? 100 : prev.foodFreshness }))
    setStorage((prev) => ({ ...prev, food: prev.food + amount, foodFreshness: mixFreshness(prev.food, prev.foodFreshness, amount, freshness) }))
    setMessage(`Stored ${amount} food in Schronisko.`)
  }

  function takeStoredFood() {
    if (current.id !== 'residential-shelter' || storage.food <= 0) return
    const amount = Math.min(storage.food, STACK_SIZE)
    const candidate = { ...inventory, food: inventory.food + amount }
    if (backpackSlots(candidate) > BACKPACK_CAPACITY) { setMessage('Backpack full.'); return }
    const freshness = storage.foodFreshness
    setStorage((prev) => ({ ...prev, food: prev.food - amount, foodFreshness: prev.food <= amount ? 100 : prev.foodFreshness }))
    setInventory({ ...candidate, foodFreshness: mixFreshness(inventory.food, inventory.foodFreshness, amount, freshness) })
    setMessage(`Took ${amount} food from Schronisko storage.`)
  }

  function socialSupport(kind: 'housing' | 'documents' | 'transport' | 'benefits') {
    if (!open || current.id !== 'support') return
    if ((kind === 'transport' || kind === 'benefits') && !inventory.documents) {
      setMessage(storage.documents ? 'Your documents are stored at the shelter. Take them with you for this application.' : 'You need basic documents for this application. Ask for help restoring them first.')
      return
    }
    if (kind === 'housing') {
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

  function takeDayWork() {
    if (!open || current.id !== 'work') return
    if (game.energy < dayWorkEnergyRequired) { setMessage(`You need at least ${dayWorkEnergyRequired} Energy to start this shift.`); return }
    setGame((prev) => applyAction(prev, { minutes: 180, money: 35, energy: -18, thirst: -8, hygiene: -10, mood: 3 }))
    setLife((status) => ({ ...status, employment: 'Day work', income: 'Irregular' }))
    setMessage('You completed a short shift. +35 zł. Day work is now part of your current situation.')
  }

  function buyItem(item: ShopItem) {
    if (!open || current.id !== 'shop') return
    if (game.money < item.price) {
      setMessage(`You need ${item.price.toFixed(2)} zł for that.`)
      return
    }
    if (!canAddToBackpack(inventory, item)) {
      setMessage('Backpack full. Use or remove something first.')
      return
    }
    setInventory((prev) => item.id === 'food'
      ? { ...prev, food: prev.food + item.quantity, foodFreshness: mixFreshness(prev.food, prev.foodFreshness, item.quantity, 100) }
      : { ...prev, [item.id]: prev[item.id] + item.quantity })
    setGame((prev) => applyAction(prev, { minutes: 3, money: -item.price }))
    setMessage(`Bought ${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''} for ${item.price.toFixed(2)} zł.`)
  }

  function useMedicine() {
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

  function smokeCigarette() {
    if (inventory.cigarettes <= 0) return
    setInventory((prev) => ({ ...prev, cigarettes: prev.cigarettes - 1 }))
    setGame((prev) => ({ ...prev, mood: Math.min(100, prev.mood + 5), health: Math.max(0, prev.health - 0.5) }))
    setMessage('You smoked a cigarette. Mood +, health slightly worse.')
  }

  function useItem(item: 'water' | 'food') {
    if (inventory[item] <= 0) return
    setInventory((prev) => ({ ...prev, [item]: prev[item] - 1 }))
    setGame((prev) => item === 'water'
      ? { ...prev, thirst: Math.min(100, prev.thirst + 38) }
      : { ...prev, hunger: Math.min(100, prev.hunger + 28), mood: Math.min(100, prev.mood + 2) })
    setMessage(item === 'water' ? 'You drank a bottle of water.' : 'You ate the food from your backpack.')
  }

  function reset() {
    localStorage.removeItem(SAVE_KEY)
    setGame(initialState)
    setMessage('New run started.')
    setScreen('location')
    setTrip(null)
    setSelectedDestination(null)
    setMusicOn(false)
    setStreetBenchFound(false)
    setBegging({ day: 1, attempts: 0 })
    setNavigationOn(true)
    setActiveEvent(null)
    setDiceCheck(null)
    setInventory(INITIAL_INVENTORY)
    setStorage(INITIAL_STORAGE)
    setLife(INITIAL_LIFE)
    setEffects([{ id: 'cold', expiresAt: 2 * 1440 + 480 }])
    localStorage.removeItem('street-life-inventory-v1')
    localStorage.removeItem('street-life-storage-v1')
    localStorage.removeItem('street-life-effects-v1')
    localStorage.removeItem('street-life-situation-v1')
  }

  const nav = (target: Screen, icon: string, label: string) =>
    <button className={screen === target ? 'nav-item active' : 'nav-item'} onClick={() => setScreen(target)}><span>{icon}</span><small>{label}</small></button>

  return <main className="shell">
    <header>
      <div><p className="eyebrow">STREET LIFE</p><h1>Day {game.day} <span className="weekday">{weekday(game.day)}</span> <span>{formatTime(game.minutes)}</span></h1></div>
      <div className="header-info">
        <div className="weather" title={weather.label}><span>{weather.icon}</span>{temperature}°C</div>
        <button className={`overall-status ${overall.level}`} onClick={() => setScreen('status')}><span>{overall.icon}</span>{overall.label}</button>
        <div className="money">{game.money.toFixed(2)} zł</div>
      </div>
    </header>

    {screen === 'location' && <>
      <section className="current">
        <div className="location-icon">{current.icon}</div>
        <div><p className="eyebrow">YOU ARE HERE · {open ? 'OPEN' : `CLOSED · OPENS AT ${formatTime(current.open)}`}</p><h2>{current.name}</h2><p>{current.description}</p></div>
      </section>
      <section className="event"><span>●</span><p>{message}</p></section>
      {current.id === 'shop' && open && <section className="shop">
        <div className="shop-heading"><div><p className="eyebrow">STORE SHELF</p><h2>Buy supplies</h2></div><span>🎒 {usedBackpackSlots}/{BACKPACK_CAPACITY}</span></div>
        <div className="shop-grid">
          {inventory.bottles > 0 && <button className="shop-item" onClick={returnBottles}><span>♻️</span><div><strong>Return bottles ×{inventory.bottles}</strong><small>Deposit return · 0.50 zł each</small><div className="shop-impact"><em className="positive">Cash +{(inventory.bottles * BOTTLE_DEPOSIT).toFixed(2)} zł</em></div></div><b>RETURN</b></button>}
          {SHOP_ITEMS.map((item) => {
            const fits = canAddToBackpack(inventory, item)
            const affordable = game.money >= item.price
            return <button className="shop-item" key={item.id} onClick={() => buyItem(item)} disabled={!fits || !affordable}>
              <span>{item.icon}</span><div><strong>{item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''}</strong><small>{item.description}</small><div className="shop-impact">{item.impacts.map((impact) => <em className={impact.includes('−') ? 'negative' : 'positive'} key={impact}>{impact}</em>)}</div></div>
              <b>{!fits ? 'FULL' : `${item.price.toFixed(2)} zł`}</b>
            </button>
          })}
        </div>
        <button className="shop-meal" onClick={() => act('shop-meal')} disabled={game.money < 12}><span>🍲</span><div><strong>Hot meal · eat now</strong><small>Does not use backpack space · ~15 min</small><div className="shop-impact"><em className="positive">Food +++</em><em className="positive">Thirst +</em><em className="positive">Mood +</em><em className="positive">Well fed · 4h</em></div></div><b>12.00 zł</b></button>
      </section>}
      {current.id === 'support' && <section className="support-menu">
        <div className="section-title"><h2>Talk to a social worker</h2><span>Choose what you need help with</span></div>
        <div className="support-grid">
          <button onClick={() => socialSupport('housing')} disabled={!open}><span>🏠</span><div><strong>Housing</strong><small>{life.schroniskoReferral ? 'Referral issued · Schronisko unlocked' : 'Ask about stable accommodation'}</small></div></button>
          <button onClick={() => socialSupport('documents')} disabled={!open}><span>📄</span><div><strong>Documents</strong><small>{inventory.documents ? 'Documents complete' : 'Restore missing documents'}</small></div></button>
          <button onClick={() => socialSupport('transport')} disabled={!open || !inventory.documents}><span>🎫</span><div><strong>Transport</strong><small>Apply for 3 days of free public transport</small></div></button>
          <button onClick={() => socialSupport('benefits')} disabled={!open || !inventory.documents}><span>💰</span><div><strong>Benefits</strong><small>Ask what financial support is available</small></div></button>
        </div>
      </section>}
      {(current.id === 'shelter' || current.id === 'residential-shelter') && <section className="storage-panel">
        <div className="storage-heading"><div><p className="eyebrow">SAFE STORAGE</p><h2>Stored belongings</h2></div><span>{usedStorageSlots}/{storageCapacity} slots</span></div>
        <p className="storage-note">{current.id === 'residential-shelter' ? 'Schronisko gives you more long-term storage.' : 'Night shelter has limited storage.'} {current.id === 'residential-shelter' ? ' Water must stay in your backpack; Schronisko has a separate small food shelf.' : ' Food and water must stay in your backpack.'}</p>
        <div className="storage-grid">
          <div><strong>🪪 Documents</strong><small>{storage.documents ? 'Stored safely' : inventory.documents ? 'Carried with you' : 'Missing'}</small><button onClick={() => storage.documents ? takeStoredItem('documents') : storeItem('documents')} disabled={storage.documents ? inventory.documents : !inventory.documents}>{storage.documents ? 'Take' : 'Store'}</button></div>
          <div><strong>💊 Medicine ×{storage.medicines}</strong><small>Store/take up to one stack</small><button onClick={() => inventory.medicines > 0 ? storeItem('medicines') : takeStoredItem('medicines')} disabled={inventory.medicines <= 0 && storage.medicines <= 0}>{inventory.medicines > 0 ? 'Store' : 'Take'}</button></div>
          <div><strong>🚬 Cigarettes ×{storage.cigarettes}</strong><small>Store/take up to one stack</small><button onClick={() => inventory.cigarettes > 0 ? storeItem('cigarettes') : takeStoredItem('cigarettes')} disabled={inventory.cigarettes <= 0 && storage.cigarettes <= 0}>{inventory.cigarettes > 0 ? 'Store' : 'Take'}</button></div>
          {current.id === 'residential-shelter' && <div><strong>🥪 Food ×{storage.food}/{SCHRONISKO_FOOD_CAPACITY}</strong><small>Separate food shelf · {storage.food > 0 ? `${foodFreshnessLabel(storage.foodFreshness)} · ${Math.round(storage.foodFreshness)}%` : 'empty'}</small><div className="freshness-bar"><i style={{ width: `${storage.food > 0 ? storage.foodFreshness : 0}%` }} /></div><button onClick={() => inventory.food > 0 && storage.food < SCHRONISKO_FOOD_CAPACITY ? storeFood() : takeStoredFood()} disabled={(inventory.food <= 0 || storage.food >= SCHRONISKO_FOOD_CAPACITY) && storage.food <= 0}>{inventory.food > 0 && storage.food < SCHRONISKO_FOOD_CAPACITY ? 'Store' : 'Take'}</button></div>}
        </div>
      </section>}
      {(current.id === 'support' || current.id === 'residential-shelter') && <section className="charging-station">
        <button className="action" onClick={chargePhone} disabled={!open || inventory.phoneBattery >= 100}>
          <div><strong>🔌 Charge phone</strong><small>Use a public socket for 30 minutes.</small></div><span>+25% · ~30 min</span>
        </button>
      </section>}
      {current.id === 'work' && <section className="actions">
        <button className="action" onClick={takeDayWork} disabled={!open || game.energy < dayWorkEnergyRequired}>
          <div><strong>Take a short shift</strong><small>{game.energy < dayWorkEnergyRequired ? `Need at least ${dayWorkEnergyRequired} Energy · current ${Math.floor(game.energy)}` : 'Three hours of physical work. Pays 35 zł.'}</small></div><span>+35 zł · ~180 min</span>
        </button>
      </section>}
      {current.id !== 'shop' && current.id !== 'work' && current.id !== 'support' && <>
        <div className="section-title"><h2>What do you do?</h2><span>Actions move time forward</span></div>
        <section className="actions">
          {(current.id === 'street' || current.id === 'shelter' || current.id === 'residential-shelter') && <label className="sleep-hours">Sleep <select value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))}>{Array.from({ length: 10 }, (_, i) => i + 1).map((hours) => <option key={hours} value={hours}>{hours} h</option>)}</select></label>}
          {current.id === 'street' && <>
            <button className="action" onClick={askForMoney} disabled={(begging.day === game.day ? begging.attempts : 0) >= 3}><div><strong>🤲 Ask passers-by for money</strong><small>{(begging.day === game.day ? begging.attempts : 0) >= 3 ? 'No useful attempts left today.' : `Spend time asking for small change · ${3 - (begging.day === game.day ? begging.attempts : 0)}/3 attempts left today.`}</small></div><span>~45 min</span></button>
            <button className="action" onClick={searchStreetBottles}><div><strong>♻️ Search bins for bottles</strong><small>Look for returnable bottles. They take backpack space and can be returned at the shop.</small></div><span>~45 min</span></button>
            {!streetBenchFound && <button className="action" onClick={() => streetAction('find-bench')}><div><strong>🪑 Look for a bench</strong><small>Search nearby for somewhere usable to sit or sleep.</small></div><span>~20 min</span></button>}
            {streetBenchFound && <button className="action" onClick={() => streetAction('bench-rest')}><div><strong>🪑 Sit on the bench</strong><small>Get off your feet and recover some Energy.</small></div><span>~45 min</span></button>}
            {streetBenchFound && <button className="action" onClick={() => streetAction('bench-sleep')}><div><strong>😴 Sleep on the bench</strong><small>Still exposed, but better than sleeping on the ground.</small></div><span>{sleepHours} h</span></button>}
          </>}
          {currentActions.length ? currentActions.map((action) => {
            const unavailable = (!open && action.requiresOpen !== false) || (!!action.cost && game.money < action.cost)
            return <button className="action" key={action.id} onClick={() => act(action.id)} disabled={unavailable}>
              <div><strong>{action.name}</strong><small>{action.description}</small></div>
              <span>{action.cost ? `${action.cost} zł · ` : ''}~{action.minutes} min</span>
            </button>
          }) : <p className="empty">Nothing useful to do here yet.</p>}
        </section>
      </>}
    </>}

    {screen === 'map' && <>
      <div className="section-title map-title"><h2>City map</h2><span>Tap a place to travel</span></div>
      <section className="city-map">
        <div className="road road-a" /><div className="road road-b" /><div className="road road-c" />
        {locations.filter((location) => location.id !== 'residential-shelter' || life.schroniskoReferral || life.housing === 'Schronisko').map((location) => {
          const here = location.id === game.locationId
          const locationOpen = isOpen(location, game.minutes)
          const pos = mapPositions[location.id] ?? { left: '45%', top: '45%' }
          return <button key={location.id} className={here ? 'map-pin here' : 'map-pin'} style={pos} onClick={() => chooseDestination(location.id)}>
            <span className="pin-icon">{location.icon}</span>
            <strong>{location.name}</strong>
            <small>{here ? 'You are here' : `${location.travelMinutes} min · ${locationOpen ? 'open' : 'closed'}`}</small>
          </button>
        })}
      </section>
      <section className="map-legend"><span>● Current location</span><span>Walking adds travel time</span></section>
    </>}

    {screen === 'travel' && trip && (() => {
      const destination = locations.find((x) => x.id === trip.destinationId)
      const progress = ((trip.total - trip.remaining) / trip.total) * 100
      return <section className="travel-screen">
        <div className="travel-icon">{trip.mode === 'walk' ? '🚶' : '🚌'}</div>
        <p className="eyebrow">ON THE WAY</p>
        <h2>{current.name} → {destination?.name}</h2>
        <p>{trip.mode === 'walk' ? 'Walking costs more energy and a little extra water.' : 'Public transport is faster and saves your energy.'}</p>
        <div className="travel-progress"><i style={{ width: `${progress}%` }} /></div>
        <strong>{trip.remaining} min remaining</strong>
        <small>{trip.remaining} real seconds</small>
      </section>
    })()}

    {selectedDestination && screen === 'map' && (() => {
      const destination = locations.find((x) => x.id === selectedDestination)
      if (!destination) return null
      const transitMinutes = Math.max(4, Math.ceil(destination.travelMinutes * 0.35))
      return <div className="travel-sheet">
        <button className="sheet-close" onClick={() => setSelectedDestination(null)}>×</button>
        <p className="eyebrow">TRAVEL TO</p>
        <h2>{destination.icon} {destination.name}</h2>
        <button className="travel-option" onClick={() => startTravel('walk')}>
          <span>🚶</span><div><strong>Walk</strong><small>{destination.travelMinutes} min · free · more energy</small></div>
        </button>
        <button className="travel-option" onClick={() => startTravel('transit')} disabled={!effects.some((effect) => effect.id === 'free-transit') && game.money < 4.4}>
          <span>🚌</span><div><strong>Public transport</strong><small>{transitMinutes} min · {effects.some((effect) => effect.id === 'free-transit') ? 'FREE' : '4.40 zł'} · less energy</small></div>
        </button>
      </div>
    })()}

    {screen === 'inventory' && <section className="inventory-screen">
      <div className="inventory-heading"><div><p className="eyebrow">INVENTORY</p><h2>Your things</h2></div></div>

      <div className="inventory-section-heading"><div><strong>🎒 Backpack</strong><small>Consumables use slots</small></div><span>{usedBackpackSlots} / {BACKPACK_CAPACITY} slots</span></div>
      <div className="backpack-capacity"><i style={{ width: `${(usedBackpackSlots / BACKPACK_CAPACITY) * 100}%` }} /><small>{BACKPACK_CAPACITY - usedBackpackSlots} free</small></div>
      <div className="inventory-grid backpack-grid">
        <button className="inventory-item usable" onClick={() => useItem('water')} disabled={inventory.water <= 0}>
          <span className="item-icon">💧</span><div><strong>Water</strong><small>{inventory.water > 0 ? `×${inventory.water} · tap to drink` : 'Empty'}</small></div>
        </button>
        <button className="inventory-item usable" onClick={() => useItem('food')} disabled={inventory.food <= 0}>
          <span className="item-icon">🥪</span><div><strong>Food</strong><small>{inventory.food > 0 ? `×${inventory.food} · tap to eat` : 'Empty'}</small></div>
        </button>
        <div className="inventory-item"><span className="item-icon">♻️</span><div><strong>Returnable bottles</strong><small>{inventory.bottles > 0 ? `×${inventory.bottles} · stack ${BOTTLE_STACK_SIZE} · 0.50 zł each` : 'Empty · return at Discount shop'}</small></div></div>
        <button className="inventory-item usable" onClick={smokeCigarette} disabled={inventory.cigarettes <= 0}>
          <span className="item-icon">🚬</span><div><strong>Cigarettes</strong><small>{inventory.cigarettes > 0 ? `×${inventory.cigarettes} · tap to smoke` : 'Empty'}</small></div>
        </button>
        <button className="inventory-item usable" onClick={useMedicine} disabled={inventory.medicines <= 0}>
          <span className="item-icon">💊</span><div><strong>Medicine</strong><small>{inventory.medicines > 0 ? `×${inventory.medicines} · treats Cold` : 'Empty'}</small></div>
        </button>
      </div>
      <p className="inventory-note">Water, food and medicine stack up to {STACK_SIZE} per slot. Bottles stack up to {BOTTLE_STACK_SIZE}. Cigarettes stack up to {CIGARETTE_STACK_SIZE} per slot.</p>

      <div className="inventory-section-heading essentials-heading"><div><strong>👤 Equipped & essentials</strong><small>These do not use backpack slots</small></div><span>FREE</span></div>
      <div className="phone-panel">
        <div className="phone-panel-heading"><strong>📱 Phone use</strong><span>{Math.round(inventory.phoneBattery)}%</span></div>
        <div className="phone-actions">
          <button onClick={() => setNavigationOn((value) => !value)} disabled={inventory.phoneBattery <= 0}><span>🧭</span><div><strong>Navigation {navigationOn ? 'ON' : 'OFF'}</strong><small>{weather.label === 'Clear' ? '15%/h in bright sun' : '12%/h while travelling'}</small></div></button>
          <button onClick={() => setMusicOn((value) => !value)} disabled={inventory.phoneBattery <= 0}><span>🎵</span><div><strong>Music {musicOn ? 'ON' : 'OFF'}</strong><small>4%/h · slowly improves Mood</small></div></button>
          <button onClick={watchVideo} disabled={inventory.phoneBattery < 9 * phoneDrainMultiplier(inventory.phoneCondition)}><span>🎬</span><div><strong>Watch video</strong><small>30 min · ~−{Math.round(9 * phoneDrainMultiplier(inventory.phoneCondition))}% · Mood +</small></div></button>
        </div>
      </div>
      <div className="inventory-grid essentials-grid">
        <div className="inventory-item">
          <span className="item-icon">📱</span><div><strong>Phone</strong><small>Battery {Math.round(inventory.phoneBattery)}% · {inventory.phoneBattery <= 0 ? 'OFF' : inventory.phoneBattery <= 5 ? 'CRITICAL' : inventory.phoneBattery <= 20 ? 'LOW' : 'Ready'}</small><div className="item-meter"><i style={{ width: `${inventory.phoneBattery}%` }} /></div><small>Condition {Math.round(inventory.phoneCondition)}% · {inventory.phoneCondition > 70 ? 'Used' : inventory.phoneCondition > 40 ? 'Worn' : inventory.phoneCondition > 15 ? 'Damaged' : 'Barely working'} · drain ×{phoneDrainMultiplier(inventory.phoneCondition).toFixed(1)}</small><div className="item-meter"><i style={{ width: `${inventory.phoneCondition}%` }} /></div></div>
        </div>
        <div className="inventory-item">
          <span className="item-icon">🧥</span><div><strong>Jacket</strong><small>Condition {inventory.jacket}%</small><div className="item-meter"><i style={{ width: `${inventory.jacket}%` }} /></div></div>
        </div>
        <div className="inventory-item">
          <span className="item-icon">🪪</span><div><strong>Documents</strong><small>{inventory.documents ? 'With you' : 'Missing'}</small></div>
        </div>
        <div className="inventory-item">
          <span className="item-icon">🎫</span><div><strong>Transit card</strong><small>{inventory.transitCard ? 'Active' : 'Missing'}</small></div>
        </div>
      </div>
    </section>}
    {screen === 'status' && <section className="status-screen">
      <div className="status-heading"><div><p className="eyebrow">YOUR CONDITION</p><h2>{overall.icon} {overall.label}</h2></div><p>Your weakest need determines the overall condition.</p></div>
      <div className="status-needs">
        <Stat icon="🍞" label="Food" value={game.hunger} compact />
        <Stat icon="💧" label="Thirst" value={game.thirst} compact />
        <Stat icon="⚡" label={energyCap(game.health) < 100 ? `Energy · max ${energyCap(game.health)}` : 'Energy'} value={game.energy} compact />
        <Stat icon="❤️" label="Health" value={game.health} compact />
        <Stat icon="🚿" label="Hygiene" value={game.hygiene} compact />
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
        <div><p className="eyebrow">NEXT IMPORTANT</p><strong>Social support opens at 08:00</strong><small>Visit the office and ask what help is available.</small></div>
        <b>08:00</b>
      </div>

      <div className="journal-section-title"><h3>🎯 Goals</h3><span>1 / 4</span></div>
      <div className="goal-list">
        <div className="goal done"><span>✓</span><div><strong>Get through the morning</strong><small>Find your bearings and check what you have.</small></div></div>
        <div className="goal"><span>○</span><div><strong>Find a safe place to sleep</strong><small>Check the shelter before it fills up.</small></div></div>
        <div className="goal"><span>○</span><div><strong>Visit social support</strong><small>Ask about documents, benefits and available help.</small></div></div>
        <div className="goal"><span>○</span><div><strong>Look for work</strong><small>Visit the job centre or find a day job.</small></div></div>
      </div>

      <div className="journal-section-title"><h3>📝 Today</h3><span>Day {game.day}</span></div>
      <div className="timeline">
        <div className="timeline-entry"><time>08:00</time><i /><div><strong>Woke up at the station</strong><small>You have a little cash and need to make a plan for the day.</small></div></div>
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

    {!gameOver && activeEvent && !diceCheck && <div className="event-overlay">
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
    <nav className={screen === 'travel' ? 'bottom-nav travelling' : 'bottom-nav'}>
      {nav('map', '🗺️', 'Map')}
      {nav('inventory', '🎒', 'Inventory')}
      <button className={screen === 'location' ? 'nav-item home active' : 'nav-item home'} onClick={() => setScreen('location')}><span>{current.icon}</span><small>Place</small></button>
      {nav('status', '👤', 'Status')}
      {nav('journal', '📓', 'Journal')}
    </nav>
  </main>
}
