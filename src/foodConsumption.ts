import { t } from './i18n'
import type { ActionResult } from './game'
import { foodCondition, type FoodKind } from './foodInventory'

type FoodOutcome = 'fine' | 'nausea' | 'vomiting'
export const FOOD_OUTCOME_PRESENTATION = {
  fine: { title: t('inventory.foodOutcome.fine.title'), illustration: '/street-life-game/assets/event-food-fine.webp', illustrationAlt: t('inventory.foodOutcome.fine.alt') },
  nausea: { title: t('inventory.foodOutcome.nausea.title'), illustration: '/street-life-game/assets/event-food-nausea.webp', illustrationAlt: t('inventory.foodOutcome.nausea.alt') },
  vomiting: { title: t('inventory.foodOutcome.vomiting.title'), illustration: '/street-life-game/assets/event-food-vomiting.webp', illustrationAlt: t('inventory.foodOutcome.vomiting.alt') },
} satisfies Record<FoodOutcome, { title: string; illustration: string; illustrationAlt: string }>

export function foodConsumption(kind: FoodKind, freshness: number, random = Math.random): ActionResult & { message: string; outcome?: FoodOutcome } {
  const condition = foodCondition(freshness)
  const hunger = { food: [28, 20, 10], bread: [12, 8, 4], readyMeal: [48, 34, 16] }[kind][condition === 'fresh' ? 0 : condition === 'stale' ? 1 : 2]
  if (condition === 'fresh') return { minutes: 0, hunger, mood: kind === 'food' ? 2 : 0, message: t(`inventory.food.${kind}.fresh`) }

  // Resolve once in the event handler, never in a React state updater.
  const roll = random()
  const safeChance = condition === 'stale' ? 0.90 : 0.25
  const vomitThreshold = condition === 'stale' ? 0.98 : 0.70
  if (roll < safeChance) return { minutes: 0, hunger, outcome: 'fine', message: t(`inventory.food.${kind}.${condition}.fine`) }
  if (roll < vomitThreshold) return { minutes: 0, hunger, mood: -3, outcome: 'nausea', message: t(`inventory.food.${kind}.${condition}.nausea`) }
  return {
    minutes: 0, hunger: -10, thirst: -20, energy: -(5 + Math.floor(random() * 6)), health: -5, outcome: 'vomiting',
    message: t(`inventory.food.${kind}.${condition}.vomiting`),
  }
}
