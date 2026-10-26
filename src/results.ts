import { clothingHygieneCap } from './hygieneRules'
import { CLOTHING_WETNESS_ENABLED } from './gameplayFeatures'
import { absoluteMinutes, energyCap, moodLimit, type GameState, type Housing } from './game'
import { t } from './i18n'
import { formatResultDelta, formatResultDuration } from './i18n/formatters'
import { resultResourceLabel, type ResultResourceId } from './resultResources'

export type ResultInventory = {
  clothingCleanliness?: number; showerGel?: number; bread?: number; cannedFood?: number; readyMeal?: number; wipes?: number; water: number; food: number; bottles: number; phoneBattery: number; phoneCondition: number
  jacket: number; documents: boolean; cigarettes: number; medicines: number; transitCard: boolean
}
export type ResultSnapshot = {
  game: GameState
  housing?: Housing
  inventory: ResultInventory
  effects: { id: string; expiresAt: number; treated?: boolean }[]
}
export type ConsumedItem = 'water' | 'food' | 'bread' | 'cannedFood' | 'readyMeal' | 'wipes' | 'showerGel' | 'cigarettes' | 'medicines'
export type ResultChange = { id?: ResultResourceId; amount?: number; effectTransition?: 'started' | 'ended'; label: string; value: string; kind: 'positive' | 'negative' | 'neutral'; consumed?: boolean; meter?: { before: number; after: number; cap?: number; capReason?: string } }
export type ResultSummary = { costs: ResultChange[]; changes: ResultChange[] }

export function summarizeResult(before: ResultSnapshot, after: ResultSnapshot, includeTime = true, consumedItems: readonly ConsumedItem[] = []): ResultSummary {
  const costs: ResultChange[] = []
  const changes: ResultChange[] = []
  const minutes = absoluteMinutes(after.game) - absoluteMinutes(before.game)
  if (includeTime && minutes > 0) costs.push({ id: 'time', amount: minutes, label: resultResourceLabel('time'), value: formatResultDuration(minutes), kind: 'neutral' })
  function add(id: ResultResourceId, delta: number, negativeIsGood = false, cost = false, precision = 1, meter?: ResultChange['meter'], consumed = false) {
    const rounded = Number(delta.toFixed(precision))
    if (rounded === 0) return
    const kind = (rounded > 0) !== negativeIsGood ? 'positive' : 'negative'
    const row: ResultChange = { id, amount: rounded, label: resultResourceLabel(id), value: formatResultDelta(rounded, id, precision), kind, ...(meter ? { meter } : {}), ...(consumed && rounded < 0 ? { consumed: true } : {}) }
    ;(cost && rounded < 0 ? costs : changes).push(row)
  }
  add('money', after.game.money - before.game.money, false, true, 2)
  for (const key of ['hunger', 'thirst', 'energy', 'health', 'hygiene', 'mood'] as const) {
    const cleanliness = after.inventory.clothingCleanliness ?? 100
    const mood = key === 'mood' ? moodLimit(after.game, { housing: after.housing, effects: after.effects }) : undefined
    const cap = key === 'energy' ? energyCap(after.game.health) : key === 'hygiene' ? clothingHygieneCap(cleanliness) : mood?.cap
    add(key, after.game[key] - before.game[key], false, false, 1, { before: before.game[key], after: after.game[key], ...(cap !== undefined ? { cap } : {}), ...(mood ? { capReason: mood.reasons.join(', ') } : {}) })
  }
  add('intoxication', after.game.intoxication - before.game.intoxication, true)
  if (CLOTHING_WETNESS_ENABLED) add('wetness', (after.game.wetness ?? 0) - (before.game.wetness ?? 0), true, false, 0)
  const consumedKeys = new Set<string>(consumedItems)
  for (const key of ['phoneBattery', 'phoneCondition', 'clothingCleanliness', 'jacket', 'water', 'food', 'bottles', 'bread', 'cannedFood', 'readyMeal', 'wipes', 'showerGel', 'cigarettes', 'medicines'] as const) {
    const previous = before.inventory[key] ?? (key === 'clothingCleanliness' ? after.inventory[key] ?? 0 : 0)
    const current = after.inventory[key] ?? 0
    const meter = ['phoneBattery', 'phoneCondition', 'clothingCleanliness', 'jacket'].includes(key) ? { before: previous, after: current } : undefined
    add(key, current - previous, false, key === 'phoneBattery', 1, meter, consumedKeys.has(key))
  }
  if (after.inventory.documents !== before.inventory.documents) changes.push({ id: 'documents', label: resultResourceLabel('documents'), value: t(after.inventory.documents ? 'result.documentsCarried' : 'result.documentsNotCarried'), kind: after.inventory.documents ? 'positive' : 'negative' })
  const names: Record<string, ResultResourceId> = { cold: 'cold', 'free-transit': 'free-transit', 'well-fed': 'well-fed' }
  const activeBefore = new Set(before.effects.filter(effect => effect.expiresAt > absoluteMinutes(before.game)).map(effect => effect.id))
  const activeAfter = new Set(after.effects.filter(effect => effect.expiresAt > absoluteMinutes(after.game)).map(effect => effect.id))
  if (activeBefore.has('cold') && activeAfter.has('cold')
    && !before.effects.find(effect => effect.id === 'cold' && effect.expiresAt > absoluteMinutes(before.game))?.treated
    && after.effects.find(effect => effect.id === 'cold' && effect.expiresAt > absoluteMinutes(after.game))?.treated) {
    changes.push({ id: 'coldRecovery', label: resultResourceLabel('coldRecovery'), value: '×3', kind: 'positive' })
  }
  for (const id of activeAfter) if (!activeBefore.has(id)) changes.push({ ...(names[id] ? { id: names[id] } : {}), effectTransition: 'started', label: names[id] ? resultResourceLabel(names[id]) : id, value: t('result.effectStarted'), kind: id === 'cold' ? 'negative' : 'positive' })
  for (const id of activeBefore) if (!activeAfter.has(id)) changes.push({ ...(names[id] ? { id: names[id] } : {}), effectTransition: 'ended', label: names[id] ? resultResourceLabel(names[id]) : id, value: t('result.effectEnded'), kind: id === 'cold' ? 'positive' : 'negative' })
  return { costs, changes }
}
