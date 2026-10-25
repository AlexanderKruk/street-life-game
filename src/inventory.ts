import type { Inventory, StoredItems, ShopItem } from './stateTypes'
import type { EventOutcome } from './events'
import { addFoodPortions, foodPortions, isPerishableFood, withFoodPortions } from './foodInventory'

export const INITIAL_INVENTORY: Inventory = { clothingCleanliness: 80, showerGel: 0, bread: 0, breadFreshness: 100, cannedFood: 0, readyMeal: 0, readyMealFreshness: 100, wipes: 0, water: 2, food: 2, foodFreshness: 100, bottles: 0, phoneBattery: 62, phoneCondition: 72, jacket: 78, documents: true, cigarettes: 0, medicines: 2, transitCard: false }

export const BACKPACK_CAPACITY = 8

export const FREE_WATER_LIMIT = 4

export const INITIAL_STORAGE: StoredItems = { documents: false, medicines: 0, cigarettes: 0, food: 0, foodFreshness: 100 }

export const SCHRONISKO_FOOD_CAPACITY = 4

export const WIPES_STACK_SIZE = 5

export const SHOWER_GEL_USES_PER_SLOT = 20

export const NIGHT_SHELTER_STORAGE = 6

export const SCHRONISKO_STORAGE = 16

export const STACK_SIZE = 4

export const CIGARETTE_STACK_SIZE = 20

export const BOTTLE_STACK_SIZE = 8

export const BOTTLE_DEPOSIT = 0.5


export const SHOP_ITEMS: ShopItem[] = [
  { id: 'water', name: 'Water', icon: '💧', price: 3, quantity: 3, description: '', impacts: ['Thirst+++'] },
  { id: 'food', name: 'Cheap food', icon: '🥪', price: 5, quantity: 1, description: 'Sandwich · stack 4', impacts: ['Food++', 'Mood+'] },
  { id: 'bread', name: 'Bread roll', icon: '🥖', price: 1, quantity: 1, description: 'Stack 4 · fresh for a short time', impacts: ['Food+'] },
  { id: 'cannedFood', name: 'Canned food', icon: '🥫', price: 10, quantity: 1, description: 'Pull-tab can · stack 4 · keeps well', impacts: ['Food++', 'Mood+'] },
  { id: 'readyMeal', name: 'Ready meal', icon: '🍝', price: 12, quantity: 1, description: 'Pasta with meat and herbs · plastic container · stack 4 · ready to eat', impacts: ['Food+++'] },
  { id: 'wipes', name: 'Wet wipes', icon: '🧻', price: 5, quantity: 5, description: '5 uses · stack 5', impacts: ['Hygiene+'] },
  { id: 'showerGel', name: '3-in-1 shower gel', icon: '🧴', price: 10, quantity: 20, description: '20 showers · used automatically', impacts: ['Hygiene+++'] },
  { id: 'cigarettes', name: 'Cigarettes', icon: '🚬', price: 6, quantity: 5, description: 'Pack of 5 · stack 20', impacts: ['Mood+', 'Health−'] },
  { id: 'medicines', name: 'Medicine', icon: '💊', price: 9, quantity: 1, description: 'One dose per Cold · stack 4', impacts: ['Recovery ×3'] },
]


export function foodFreshnessLabel(value: number) {
  if (value > 50) return 'Fresh'
  if (value > 20) return 'Stale'
  return 'Spoiled'
}


export function stackSlots(count: number) {
  return count > 0 ? Math.ceil(count / STACK_SIZE) : 0
}


export function storageSlots(storage: StoredItems) {
  return (storage.documents ? 1 : 0) + stackSlots(storage.medicines) + (storage.cigarettes > 0 ? Math.ceil(storage.cigarettes / CIGARETTE_STACK_SIZE) : 0)
}


export function backpackSlots(inventory: Inventory) {
  return (inventory.showerGel > 0 ? Math.ceil(inventory.showerGel / SHOWER_GEL_USES_PER_SLOT) : 0) + stackSlots(inventory.bread) + stackSlots(inventory.cannedFood) + stackSlots(inventory.readyMeal) + (inventory.wipes > 0 ? Math.ceil(inventory.wipes / WIPES_STACK_SIZE) : 0) + stackSlots(inventory.water) + stackSlots(inventory.food) + (inventory.bottles > 0 ? Math.ceil(inventory.bottles / BOTTLE_STACK_SIZE) : 0) + (inventory.cigarettes > 0 ? Math.ceil(inventory.cigarettes / CIGARETTE_STACK_SIZE) : 0) + stackSlots(inventory.medicines)
}


export function canAddToBackpack(inventory: Inventory, item: ShopItem) {
  const next = { ...inventory, [item.id]: inventory[item.id] + item.quantity }
  return backpackSlots(next) <= BACKPACK_CAPACITY
}


export function addShopItem(inventory: Inventory, item: ShopItem): Inventory {
  return isPerishableFood(item.id) ? addFoodPortions(inventory, item.id, Array(item.quantity).fill(100))
    : { ...inventory, [item.id]: inventory[item.id] + item.quantity }
}


export function fitEventSupplies(inventory: Inventory, outcome: EventOutcome) {
  let next = { ...withFoodPortions(inventory, 'food', foodPortions(inventory, 'food').slice(Math.max(0, -(outcome.food ?? 0)))),
    water: Math.max(0, inventory.water + Math.min(0, outcome.water ?? 0)),
  }
  const rejected: string[] = []
  for (const item of ['food', 'water'] as const) {
    const requested = Math.max(0, outcome[item] ?? 0)
    const otherSlots = backpackSlots(next) - stackSlots(next[item])
    const capacity = Math.max(0, BACKPACK_CAPACITY - otherSlots) * STACK_SIZE
    const accepted = Math.min(requested, Math.max(0, capacity - next[item]))
    if (item === 'food') next = addFoodPortions(next, 'food', Array(accepted).fill(100))
    else next[item] += accepted
    if (requested > accepted) rejected.push(`${requested - accepted} ${item}`)
  }
  if (next.food <= 0) next.foodFreshness = 100
  return { inventory: next, rejected }
}

