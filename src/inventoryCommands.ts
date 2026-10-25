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
  inventory?: Update<Inventory>
  storage?: Update<StoredItems>
  effects?: Update<ActiveEffect[]>
  game?: Update<GameState>
  action?: ActionResult
  message?: string
  info?: ResultCardData
}

export function inventoryCommandResult(command: InventoryCommand): { title: string; always?: boolean; consumedItems?: ConsumedItem[] } | null {
  switch (command.type) {
    case 'buy': return { title: `Buy ${command.item.name}` }
    case 'use': return { title: command.item === 'water' ? 'Drink water' : command.item === 'wipes' ? 'Use wet wipes' : 'Eat food', consumedItems: [command.item] }
    case 'medicine': return { title: 'Use medicine', always: true }
    case 'smoke': return { title: 'Smoke a cigarette', consumedItems: ['cigarettes'] }
    case 'return-bottles': return { title: 'Return containers' }
    case 'store': return { title: 'Store belongings' }
    case 'take': return { title: 'Collect belongings' }
    case 'store-food': return { title: 'Store food' }
    case 'take-food': return { title: 'Collect food' }
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
      if (game.money < item.price) return { message: `You need ${item.price.toFixed(2)} zł for that.` }
      if (!canAddToBackpack(inventory, item)) return { message: 'Backpack full. Use or remove something first.' }
      return {
        inventory: previous => addShopItem(previous, item), action: { minutes: 3, money: -item.price },
        message: `Bought ${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''} for ${item.price.toFixed(2)} zł.`,
      }
    }
    case 'return-bottles': {
      if (!open || locationId !== 'shop' || inventory.bottles <= 0) return {}
      const count = inventory.bottles
      const payout = count * BOTTLE_DEPOSIT
      return {
        inventory: previous => ({ ...previous, bottles: 0 }), action: { minutes: 5, money: payout },
        message: `Returned ${count} container${count === 1 ? '' : 's'} for ${payout.toFixed(2)} zł.`,
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
          ...(result.outcome ? { info: { ...FOOD_OUTCOME_PRESENTATION[result.outcome], text: result.message, label: 'AFTER EATING' } } : {}),
        }
      }
      if (item === 'wipes') {
        if (game.hygiene >= 60) return { message: 'Wet wipes cannot improve Hygiene above 60. Find a shower.' }
        return {
          inventory: previous => ({ ...previous, wipes: previous.wipes - 1 }),
          game: previous => ({ ...previous, hygiene: Math.min(60, previous.hygiene + 10) }),
          message: 'You cleaned up with wet wipes. Hygiene improves, up to 60.',
        }
      }
      if (item === 'cannedFood') return {
        inventory: previous => ({ ...previous, cannedFood: previous.cannedFood - 1 }), action: { minutes: 0, hunger: 32, mood: 1 },
        message: 'You opened the pull-tab can and ate the food.',
      }
      return {
        inventory: previous => ({ ...previous, water: previous.water - 1 }), action: { minutes: 0, thirst: 38 }, message: 'You drank water.',
      }
    }
    case 'medicine': {
      if (inventory.medicines <= 0) return {}
      const explain = (title: string, text: string, label = 'MEDICINE'): InventoryCommandChanges => ({ message: text, info: { title, text, label } })
      const now = absoluteMinutes(game)
      const cold = effects.find(effect => effect.id === 'cold' && effect.expiresAt > now)
      if (!cold) return explain('No fever', 'You have no fever. There is no need to take a tablet now.\n\nYour medicine has been kept for when you need it.')
      if (cold.treated) return explain('One dose is enough', 'The first tablet is already helping you recover faster.\n\nA second tablet will not speed things up or remove the symptoms. You kept it for later.')
      return {
        inventory: previous => ({ ...previous, medicines: previous.medicines - 1 }),
        effects: previous => previous.map(effect => effect.id === 'cold' && effect.expiresAt > now && !effect.treated
          ? { ...effect, treated: true, expiresAt: now + (effect.expiresAt - now) / 3 } : effect),
        ...explain('Recovery accelerated', 'You took one tablet. It speeds up recovery from this cold by three times, but does not cure it immediately.\n\nSymptoms continue until you recover. One dose is enough for this illness.', 'AFTER THE ACTION'),
      }
    }
    case 'smoke':
      if (inventory.cigarettes <= 0) return {}
      return {
        inventory: previous => ({ ...previous, cigarettes: previous.cigarettes - 1 }),
        game: previous => ({ ...previous, mood: Math.min(100, previous.mood + 5), health: Math.max(0, previous.health - 0.5) }),
        message: 'You smoked a cigarette. Mood+, health slightly worse.',
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
          message: storing ? 'Documents stored safely. They are no longer carried on the street.' : 'You took your documents with you.',
        }
      }
      const amount = Math.min(item === 'medicines' ? 4 : 20, storing ? inventory[item] : storage[item])
      if (amount <= 0) return {}
      if (storing && storageSlots({ ...storage, [item]: storage[item] + amount }) > capacity) return { message: 'Storage is full.' }
      if (!storing && backpackSlots({ ...inventory, [item]: inventory[item] + amount }) > BACKPACK_CAPACITY) return { message: 'Backpack full.' }
      return {
        inventory: previous => ({ ...previous, [item]: previous[item] + (storing ? -amount : amount) }),
        storage: previous => ({ ...previous, [item]: previous[item] + (storing ? amount : -amount) }),
        message: storing ? `Stored ${amount} ${item}.` : `Took ${amount} ${item} from storage.`,
      }
    }
    case 'store-food': {
      if (locationId !== 'residential-shelter' || inventory.food <= 0 || storage.food >= SCHRONISKO_FOOD_CAPACITY) return {}
      const amount = Math.min(inventory.food, SCHRONISKO_FOOD_CAPACITY - storage.food)
      const portions = foodPortions(inventory, 'food').slice(0, amount)
      return {
        inventory: previous => withFoodPortions(previous, 'food', foodPortions(previous, 'food').slice(amount)),
        storage: previous => addFoodPortions(previous, 'food', portions), message: `Stored ${amount} food in Schronisko.`,
      }
    }
    case 'take-food': {
      if (locationId !== 'residential-shelter' || storage.food <= 0) return {}
      const amount = Math.min(storage.food, STACK_SIZE)
      if (backpackSlots({ ...inventory, food: inventory.food + amount }) > BACKPACK_CAPACITY) return { message: 'Backpack full.' }
      const portions = foodPortions(storage, 'food').slice(0, amount)
      return {
        storage: previous => withFoodPortions(previous, 'food', foodPortions(previous, 'food').slice(amount)),
        inventory: previous => addFoodPortions(previous, 'food', portions), message: `Took ${amount} food from Schronisko storage.`,
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
