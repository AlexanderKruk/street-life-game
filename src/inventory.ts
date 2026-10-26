import { itemName, shopItemDescription, rejectedSupplyLabel } from './itemPresentation'
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
  { id: 'water', name: itemName('water'), icon: '💧', price: 3, quantity: 3, description: shopItemDescription('water'), impacts: ['thirst-large'] },
  { id: 'food', name: itemName('food'), icon: '🥪', price: 5, quantity: 1, description: shopItemDescription('food'), impacts: ['food-medium', 'mood-gain'] },
  { id: 'bread', name: itemName('bread'), icon: '🥖', price: 1, quantity: 1, description: shopItemDescription('bread'), impacts: ['food-small'] },
  { id: 'cannedFood', name: itemName('cannedFood'), icon: '🥫', price: 10, quantity: 1, description: shopItemDescription('cannedFood'), impacts: ['food-medium', 'mood-gain'] },
  { id: 'readyMeal', name: itemName('readyMeal'), icon: '🍝', price: 12, quantity: 1, description: shopItemDescription('readyMeal'), impacts: ['food-large'] },
  { id: 'wipes', name: itemName('wipes'), icon: '🧻', price: 5, quantity: 5, description: shopItemDescription('wipes'), impacts: ['hygiene-small'] },
  { id: 'showerGel', name: itemName('showerGel'), icon: '🧴', price: 10, quantity: 20, description: shopItemDescription('showerGel'), impacts: ['hygiene-large'] },
  { id: 'cigarettes', name: itemName('cigarettes'), icon: '🚬', price: 6, quantity: 5, description: shopItemDescription('cigarettes'), impacts: ['mood-gain', 'health-loss'] },
  { id: 'medicines', name: itemName('medicines'), icon: '💊', price: 9, quantity: 1, description: shopItemDescription('medicines'), impacts: ['recovery-fast'] },
]


export { foodFreshnessLabel } from './effectChips'


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
    if (requested > accepted) rejected.push(rejectedSupplyLabel(item, requested - accepted))
  }
  if (next.food <= 0) next.foodFreshness = 100
  return { inventory: next, rejected }
}

