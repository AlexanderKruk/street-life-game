import { absoluteMinutes, energyCap, moodLimit, type GameState, type Housing } from './game'

export type ResultInventory = {
  clothingCleanliness?: number; showerGel?: number; bread?: number; cannedFood?: number; wipes?: number; water: number; food: number; bottles: number; phoneBattery: number; phoneCondition: number
  jacket: number; documents: boolean; cigarettes: number; medicines: number; transitCard: boolean
}
export type ResultSnapshot = {
  game: GameState
  housing?: Housing
  inventory: ResultInventory
  effects: { id: string; expiresAt: number }[]
}
export type ConsumedItem = 'water' | 'food' | 'bread' | 'cannedFood' | 'wipes' | 'showerGel' | 'cigarettes' | 'medicines'
export type ResultChange = { label: string; value: string; kind: 'positive' | 'negative' | 'neutral'; consumed?: boolean; meter?: { before: number; after: number; cap?: number; capReason?: string } }
export type ResultSummary = { costs: ResultChange[]; changes: ResultChange[] }

function number(value: number, precision = 1) {
  return Number(value.toFixed(precision)).toString()
}

export function summarizeResult(before: ResultSnapshot, after: ResultSnapshot, includeTime = true, consumedItems: readonly ConsumedItem[] = []): ResultSummary {
  const costs: ResultChange[] = []
  const changes: ResultChange[] = []
  const minutes = absoluteMinutes(after.game) - absoluteMinutes(before.game)
  if (includeTime && minutes > 0) costs.push({ label: '⏱ Time', value: `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)} h ` : ''}${minutes % 60 ? `${minutes % 60} min` : ''}`.trim(), kind: 'neutral' })
  function add(label: string, delta: number, suffix = '', negativeIsGood = false, cost = false, precision = 1, meter?: ResultChange['meter'], consumed = false) {
    const rounded = Number(delta.toFixed(precision))
    if (rounded === 0) return
    const kind = (rounded > 0) !== negativeIsGood ? 'positive' : 'negative'
    const row: ResultChange = { label, value: `${rounded > 0 ? '+' : '−'}${number(Math.abs(rounded), precision)}${suffix}`, kind, ...(meter ? { meter } : {}), ...(consumed && rounded < 0 ? { consumed: true } : {}) }
    ;(cost && rounded < 0 ? costs : changes).push(row)
  }
  add('💰 Money', after.game.money - before.game.money, ' zł', false, true, 2)
  for (const [key, label] of [
    ['hunger', '🍽 Food'], ['thirst', '💧 Water'], ['energy', '⚡ Energy'],
    ['health', '❤️ Health'], ['hygiene', '🧼 Hygiene'], ['mood', '🙂 Mood'],
  ] as const) {
    const cleanliness = after.inventory.clothingCleanliness ?? 100
    const mood = key === 'mood' ? moodLimit(after.game, { housing: after.housing, effects: after.effects }) : undefined
    const cap = key === 'energy' ? energyCap(after.game.health) : key === 'hygiene' ? cleanliness >= 70 ? 100 : cleanliness >= 40 ? 80 : 60 : mood?.cap
    add(label, after.game[key] - before.game[key], '', false, false, 1, { before: before.game[key], after: after.game[key], ...(cap !== undefined ? { cap } : {}), ...(mood ? { capReason: mood.reasons.join(', ') } : {}) })
  }
  add('🍺 Intoxication', after.game.intoxication - before.game.intoxication, '', true)
  add('💧 Clothing wetness', (after.game.wetness ?? 0) - (before.game.wetness ?? 0), '%', true, false, 0)
  const consumedKeys = new Set<string>(consumedItems)
  for (const [key, label, suffix] of [
    ['phoneBattery', '🔋 Battery', '%'], ['phoneCondition', '📱 Phone condition', '%'],
    ['clothingCleanliness', '🧥 Clothing cleanliness', '%'], ['jacket', '🧥 Clothing condition', '%'], ['water', '💧 Water portions', ''],
    ['food', '🥪 Food portions', ''], ['bottles', '♻️ Deposit containers', ''],
    ['bread', '🥖 Bread rolls', ''], ['cannedFood', '🥫 Canned food', ''], ['wipes', '🧻 Wet wipes', ''], ['showerGel', '🧴 3-in-1 gel uses', ''],
    ['cigarettes', '🚬 Cigarettes', ''], ['medicines', '💊 Medicine', ''],
  ] as const) {
    const previous = before.inventory[key] ?? (key === 'clothingCleanliness' ? after.inventory[key] ?? 0 : 0)
    const current = after.inventory[key] ?? 0
    const meter = ['phoneBattery', 'phoneCondition', 'clothingCleanliness', 'jacket'].includes(key) ? { before: previous, after: current } : undefined
    add(label, current - previous, suffix, false, key === 'phoneBattery', 1, meter, consumedKeys.has(key))
  }
  if (after.inventory.documents !== before.inventory.documents) changes.push({ label: '📄 Documents', value: after.inventory.documents ? 'Now carried' : 'No longer carried', kind: after.inventory.documents ? 'positive' : 'negative' })
  const names: Record<string, string> = { cold: '🤒 Cold', 'free-transit': '🎫 Free transport', 'well-fed': '🍲 Well fed' }
  const activeBefore = new Set(before.effects.filter(effect => effect.expiresAt > absoluteMinutes(before.game)).map(effect => effect.id))
  const activeAfter = new Set(after.effects.filter(effect => effect.expiresAt > absoluteMinutes(after.game)).map(effect => effect.id))
  for (const id of activeAfter) if (!activeBefore.has(id)) changes.push({ label: names[id] ?? id, value: 'Started', kind: id === 'cold' ? 'negative' : 'positive' })
  for (const id of activeBefore) if (!activeAfter.has(id)) changes.push({ label: names[id] ?? id, value: 'Ended', kind: id === 'cold' ? 'positive' : 'negative' })
  return { costs, changes }
}
