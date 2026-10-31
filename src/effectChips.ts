import { t } from './i18n'
import type { ResultResourceId } from './resultResources'
import { foodCondition, type FoodCondition, type FoodKind, type foodSlot } from './foodInventory'

// Domain IDs and visual meaning are independent of the catalogue's wording.
export const EFFECT_CHIPS = {
  'thirst-large': { resourceId: 'thirst', kind: 'positive', message: 'effectChip.thirst.large' },
  'food-small': { resourceId: 'hunger', kind: 'positive', message: 'effectChip.food.small' },
  'food-medium': { resourceId: 'hunger', kind: 'positive', message: 'effectChip.food.medium' },
  'food-large': { resourceId: 'hunger', kind: 'positive', message: 'effectChip.food.large' },
  'mood-gain': { resourceId: 'mood', kind: 'positive', message: 'effectChip.mood.gain' },
  'mood-loss': { resourceId: 'mood', kind: 'negative', message: 'effectChip.mood.loss' },
  'energy-loss': { resourceId: 'energy', kind: 'negative', message: 'effectChip.energy.loss' },
  'energy-strong-loss': { resourceId: 'energy', kind: 'negative', message: 'effectChip.energy.strongLoss' },
  'health-loss': { resourceId: 'health', kind: 'negative', message: 'effectChip.health.loss' },
  'hygiene-small': { resourceId: 'hygiene', kind: 'positive', message: 'effectChip.hygiene.small' },
  'hygiene-large': { resourceId: 'hygiene', kind: 'positive', message: 'effectChip.hygiene.large' },
  'travel-large': { kind: 'positive', message: 'effectChip.travel.large' },
  'recovery-fast': { resourceId: 'coldRecovery', kind: 'positive', message: 'effectChip.recovery.fast' },
  'deposit-value': { resourceId: 'money', kind: 'positive', message: 'effectChip.deposit' },
} as const
export type ImpactId = keyof typeof EFFECT_CHIPS
export type EffectChip = { id: ImpactId | `freshness:${FoodCondition}`; kind: 'positive' | 'negative' | 'warning'; label: string; resourceId?: ResultResourceId; count?: number }

export function impactChip(id: ImpactId, translate: typeof t = t): EffectChip {
  const definition = EFFECT_CHIPS[id]
  return { id, kind: definition.kind, label: translate(definition.message), ...('resourceId' in definition ? { resourceId: definition.resourceId } : {}) }
}
const conditionKinds = { fresh: 'positive', stale: 'warning', spoiled: 'negative' } as const
export function foodConditionLabel(condition: FoodCondition, translate: typeof t = t) { return translate(`freshness.${condition}`) }
export function freshnessChip(condition: FoodCondition, count?: number, translate: typeof t = t): EffectChip {
  return { id: `freshness:${condition}`, kind: conditionKinds[condition], label: count === undefined ? foodConditionLabel(condition, translate) : translate(`freshness.${condition}.count`, { count }), ...(count === undefined ? {} : { count }) }
}
export function foodFreshnessLabel(value: number) { return foodConditionLabel(foodCondition(value)) }

// Keep the existing per-slot average and stale/spoiled counts. This is only the
// preview; consumption and poisoning continue to use foodConsumption/commands.
export function foodEffectChips(kind: FoodKind, slot: ReturnType<typeof foodSlot>): EffectChip[] {
  const condition = foodCondition(slot.freshness)
  const food: ImpactId = kind === 'bread' ? 'food-small' : kind === 'readyMeal' && condition === 'fresh' ? 'food-large' : condition !== 'spoiled' ? 'food-medium' : 'food-small'
  return [impactChip(food), ...(kind === 'food' && condition === 'fresh' ? [impactChip('mood-gain')] : []),
    ...(slot.stale ? [freshnessChip('stale', slot.stale)] : []), ...(slot.spoiled ? [freshnessChip('spoiled', slot.spoiled)] : [])]
}
