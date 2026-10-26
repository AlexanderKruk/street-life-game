import { t } from './i18n'
import { formatMoney } from './i18n/formatters'
import type { InventoryHistoryFacts } from './inventoryHistory'
import type { ResultActionId } from './resultActions'
import { FOOD_OUTCOME_PRESENTATION, foodConsumption } from './foodConsumption'
import { addFoodPortions, consumeFood, discardFood, foodPortionIndex, foodPortions, isPerishableFood, withFoodPortions, type FoodCondition } from './foodInventory'
import { type ActionResult, type GameState } from './game'
import { absoluteMinutes } from './gameTime'
import { BACKPACK_CAPACITY, BOTTLE_DEPOSIT, NIGHT_SHELTER_STORAGE, SCHRONISKO_FOOD_CAPACITY, SCHRONISKO_STORAGE, STACK_SIZE, addShopItem, backpackSlots, canAddToBackpack, storageSlots } from './inventory'
import type { ResultCardData } from './ResultCard'
import type { ConsumedItem } from './results'
import type { ActiveEffect, BackpackItemId, Inventory, ShopItem, StoredItems } from './stateTypes'

type StoredItem = 'documents' | 'medicines' | 'cigarettes'
type UsableItem = 'water' | 'food' | 'bread' | 'cannedFood' | 'readyMeal' | 'wipes'
export type InventoryCommand =
  | { type: 'buy'; item: ShopItem }
  | { type: 'use'; item: UsableItem; slotIndex?: number; condition?: FoodCondition }
  | { type: 'medicine' | 'smoke' | 'return-bottles' | 'store-food' | 'take-food' }
  | { type: 'store' | 'take'; item: StoredItem }
  | { type: 'discard'; id: BackpackItemId; quantity: number; slotIndex: number; spoiledOnly: boolean }

export type InventoryCommandContext = {
  game: GameState
  inventory: Inventory
  storage: StoredItems
  effects: ActiveEffect[]
  locationId: string
  open: boolean
  insideNightShelter: boolean
}

type Update<T> = (previous: T) => T
// Resolve once in the event handler. Updates are deterministic and safe for
// React to replay. App applies action through its existing clock/mood/exposure
// rules, then lets pendingResult wait for aging and stat caps before summarizing.
export type InventoryCommandChanges = {
  history?: InventoryHistoryFacts
  inventory?: Update<Inventory>
  storage?: Update<StoredItems>
  effects?: Update<ActiveEffect[]>
  game?: Update<GameState>
  action?: ActionResult
  message?: string
  info?: ResultCardData
}

export function inventoryCommandResult(command: InventoryCommand): { id: ResultActionId; title: string; inventoryHistory: InventoryHistoryFacts; always?: boolean; consumedItems?: ConsumedItem[] } | null {
  switch (command.type) {
    case 'buy': return { inventoryHistory: { status: 'success', itemName: command.item.name }, id: `buy:${command.item.id}`, title: t('inventory.action.buy', { name: command.item.name }) }
    case 'use': return { inventoryHistory: { status: 'success' }, id: `use:${command.item}`, title: t(command.item === 'water' ? 'inventory.action.water' : command.item === 'wipes' ? 'inventory.action.wipes' : 'inventory.action.food'), consumedItems: [command.item] }
    case 'medicine': return { inventoryHistory: { status: 'success' }, id: 'use-medicine', title: t('inventory.action.medicine'), always: true }
    case 'smoke': return { inventoryHistory: { status: 'success' }, id: 'smoke', title: t('inventory.action.smoke'), consumedItems: ['cigarettes'] }
    case 'return-bottles': return { inventoryHistory: { status: 'success' }, id: 'return-containers', title: t('inventory.action.return') }
    case 'store': return { inventoryHistory: { status: 'success' }, id: 'store-belongings', title: t('inventory.action.store') }
    case 'take': return { inventoryHistory: { status: 'success' }, id: 'collect-belongings', title: t('inventory.action.collect') }
    case 'store-food': return { inventoryHistory: { status: 'success' }, id: 'store-food', title: t('inventory.action.storeFood') }
    case 'take-food': return { inventoryHistory: { status: 'success' }, id: 'collect-food', title: t('inventory.action.collectFood') }
    // Discard has its own confirmation and has never opened an action result.
    case 'discard': return null
  }
}

export function resolveInventoryCommand(context: InventoryCommandContext, command: InventoryCommand, random = Math.random): InventoryCommandChanges {
  const { game, inventory, storage, effects, locationId, open, insideNightShelter } = context
  switch (command.type) {
    case 'buy': {
      const { item } = command
      if (!open || locationId !== 'shop') return {}
      if (game.money < item.price) return { history: { status: 'purchase-blocked', itemName: item.name }, message: t('inventory.result.needMoney', { price: formatMoney(item.price, true) }) }
      if (!canAddToBackpack(inventory, item)) return { history: { status: 'purchase-blocked', itemName: item.name }, message: t('inventory.result.full') }
      return {
        inventory: previous => addShopItem(previous, item), action: { minutes: 3, money: -item.price },
        message: t('inventory.result.bought'),
      }
    }
    case 'return-bottles': {
      if (!open || locationId !== 'shop' || inventory.bottles <= 0) return {}
      const count = inventory.bottles
      const payout = count * BOTTLE_DEPOSIT
      return {
        inventory: previous => ({ ...previous, bottles: 0 }), action: { minutes: 5, money: payout },
        message: t('inventory.result.returned', { count }),
      }
    }
    case 'use': {
      const { item, slotIndex = 0, condition } = command
      if (inventory[item] <= 0) return {}
      if (isPerishableFood(item)) {
        const freshness = foodPortions(inventory, item)[foodPortionIndex(inventory, item, slotIndex, condition)]
        if (freshness === undefined) return {}
        const result = foodConsumption(item, freshness, random)
        return {
          inventory: previous => consumeFood(previous, item, slotIndex, condition), action: result, message: result.message,
          ...(result.outcome ? { history: { status: `food-${result.outcome}` as const }, info: { ...FOOD_OUTCOME_PRESENTATION[result.outcome], text: result.message, label: t('inventory.result.afterEating') } } : {}),
        }
      }
      if (item === 'wipes') {
        if (game.hygiene >= 60) return { message: t('inventory.result.wipesLimited') }
        return {
          inventory: previous => ({ ...previous, wipes: previous.wipes - 1 }),
          game: previous => ({ ...previous, hygiene: Math.min(60, previous.hygiene + 10) }),
          message: t('inventory.result.wipes'),
        }
      }
      if (item === 'cannedFood') return {
        inventory: previous => ({ ...previous, cannedFood: previous.cannedFood - 1 }), action: { minutes: 0, hunger: 32, mood: 1 },
        message: t('inventory.result.cannedFood'),
      }
      return {
        inventory: previous => ({ ...previous, water: previous.water - 1 }), action: { minutes: 0, thirst: 38 }, message: t('inventory.result.water'),
      }
    }
    case 'medicine': {
      if (inventory.medicines <= 0) return {}
      const explain = (title: string, text: string, label = t('inventory.result.medicineLabel')): InventoryCommandChanges => ({ message: text, info: { title, text, label } })
      const now = absoluteMinutes(game)
      const cold = effects.find(effect => effect.id === 'cold' && effect.expiresAt > now)
      if (!cold) return { ...explain(t('inventory.result.noColdTitle'), t('inventory.result.noCold')), history: { status: 'medicine-none' } }
      if (cold.treated) return { ...explain(t('inventory.result.alreadyTreatedTitle'), t('inventory.result.alreadyTreated')), history: { status: 'medicine-treated' } }
      return {
        inventory: previous => ({ ...previous, medicines: previous.medicines - 1 }),
        effects: previous => previous.map(effect => effect.id === 'cold' && effect.expiresAt > now && !effect.treated
          ? { ...effect, treated: true, expiresAt: now + (effect.expiresAt - now) / 3 } : effect),
        history: { status: 'medicine-taken' },
        ...explain(t('inventory.result.treatedTitle'), t('inventory.result.treated'), t('inventory.result.afterAction')),
      }
    }
    case 'smoke':
      if (inventory.cigarettes <= 0) return {}
      return {
        inventory: previous => ({ ...previous, cigarettes: previous.cigarettes - 1 }),
        game: previous => ({ ...previous, mood: Math.min(100, previous.mood + 5), health: Math.max(0, previous.health - 0.5) }),
        message: t('inventory.result.smoked'),
      }
    case 'store':
    case 'take': {
      if (locationId !== 'shelter' && locationId !== 'residential-shelter') return {}
      if (!open || (locationId === 'shelter' && !insideNightShelter)) return {}
      const capacity = locationId === 'residential-shelter' ? SCHRONISKO_STORAGE : NIGHT_SHELTER_STORAGE
      const { item } = command
      const storing = command.type === 'store'
      if (item === 'documents') {
        if (storing ? !inventory.documents || storage.documents || storageSlots(storage) >= capacity : !storage.documents || inventory.documents) return {}
        return {
          inventory: previous => ({ ...previous, documents: !storing }), storage: previous => ({ ...previous, documents: storing }),
          message: storing ? t('inventory.result.storedDocuments') : t('inventory.result.collectedDocuments'),
        }
      }
      const amount = Math.min(item === 'medicines' ? 4 : 20, storing ? inventory[item] : storage[item])
      if (amount <= 0) return {}
      if (storing && storageSlots({ ...storage, [item]: storage[item] + amount }) > capacity) return { message: t('inventory.result.storageFull') }
      if (!storing && backpackSlots({ ...inventory, [item]: inventory[item] + amount }) > BACKPACK_CAPACITY) return { history: { status: 'storage-blocked' }, message: t('inventory.result.backpackFull') }
      const messageKey = item === 'medicines' ? storing ? 'inventory.result.storedMedicine' : 'inventory.result.collectedMedicine' : storing ? 'inventory.result.storedCigarettes' : 'inventory.result.collectedCigarettes'
      return {
        inventory: previous => ({ ...previous, [item]: previous[item] + (storing ? -amount : amount) }),
        storage: previous => ({ ...previous, [item]: previous[item] + (storing ? amount : -amount) }),
        message: t(messageKey, { count: amount }),
      }
    }
    case 'store-food': {
      if (locationId !== 'residential-shelter' || inventory.food <= 0 || storage.food >= SCHRONISKO_FOOD_CAPACITY) return {}
      const amount = Math.min(inventory.food, SCHRONISKO_FOOD_CAPACITY - storage.food)
      const portions = foodPortions(inventory, 'food').slice(0, amount)
      return {
        inventory: previous => withFoodPortions(previous, 'food', foodPortions(previous, 'food').slice(amount)),
        storage: previous => addFoodPortions(previous, 'food', portions), message: t('inventory.result.storedFood', { count: amount }),
      }
    }
    case 'take-food': {
      if (locationId !== 'residential-shelter' || storage.food <= 0) return {}
      const amount = Math.min(storage.food, STACK_SIZE)
      if (backpackSlots({ ...inventory, food: inventory.food + amount }) > BACKPACK_CAPACITY) return { history: { status: 'storage-blocked' }, message: t('inventory.result.backpackFull') }
      const portions = foodPortions(storage, 'food').slice(0, amount)
      return {
        storage: previous => withFoodPortions(previous, 'food', foodPortions(previous, 'food').slice(amount)),
        inventory: previous => addFoodPortions(previous, 'food', portions), message: t('inventory.result.collectedFood', { count: amount }),
      }
    }
    case 'discard': {
      const { id, quantity, slotIndex, spoiledOnly } = command
      return { inventory: previous => {
        if (isPerishableFood(id)) return discardFood(previous, id, slotIndex, spoiledOnly)
        return spoiledOnly ? previous : { ...previous, [id]: Math.max(0, previous[id] - quantity) }
      } }
    }
  }
}
