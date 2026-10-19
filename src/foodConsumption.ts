import type { ActionResult } from './game'
import { foodCondition, type FoodKind } from './foodInventory'

export function foodConsumption(kind: FoodKind, freshness: number, random = Math.random): ActionResult & { message: string } {
  const condition = foodCondition(freshness)
  const food = kind === 'food' ? 'food' : kind === 'bread' ? 'bread roll' : 'ready meal'
  const hunger = { food: [28, 20, 10], bread: [12, 8, 4], readyMeal: [48, 34, 16] }[kind][condition === 'fresh' ? 0 : condition === 'stale' ? 1 : 2]
  if (condition === 'fresh') return { minutes: 0, hunger, mood: kind === 'food' ? 2 : 0, message: `You ate the ${food} from your backpack.` }

  // Resolve once in the event handler, never in a React state updater.
  const roll = random()
  const safeChance = condition === 'stale' ? 0.90 : 0.25
  const vomitThreshold = condition === 'stale' ? 0.98 : 0.70
  const prefix = `You ate ${condition} ${food}.`
  if (roll < safeChance) return { minutes: 0, hunger, message: `${prefix} Luckily, you feel fine, though it was less filling.` }
  if (roll < vomitThreshold) return { minutes: 0, hunger, mood: -3, message: `${prefix} You feel nauseous (Mood −3). The food stayed down.` }
  return {
    minutes: 0, hunger: -10, thirst: -20, energy: -(5 + Math.floor(random() * 6)), health: -5,
    message: `${prefix} You vomited. The portion gave you no nourishment. You feel hungrier, thirsty and weak.`,
  }
}
