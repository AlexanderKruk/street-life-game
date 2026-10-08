import { absoluteMinutes, type GameState } from './game'

export type ResultInventory = {
  water: number; food: number; bottles: number; phoneBattery: number; phoneCondition: number
  jacket: number; documents: boolean; cigarettes: number; medicines: number; transitCard: boolean
}
export type ResultSnapshot = {
  game: GameState
  inventory: ResultInventory
  effects: { id: string; expiresAt: number }[]
}
export type ResultChange = { label: string; value: string; kind: 'positive' | 'negative' | 'neutral' }
export type ResultSummary = { costs: ResultChange[]; changes: ResultChange[] }

function number(value: number, precision = 1) {
  return Number(value.toFixed(precision)).toString()
}

export function summarizeResult(before: ResultSnapshot, after: ResultSnapshot, includeTime = true): ResultSummary {
  const costs: ResultChange[] = []
  const changes: ResultChange[] = []
  const minutes = absoluteMinutes(after.game) - absoluteMinutes(before.game)
  if (includeTime && minutes > 0) costs.push({ label: '⏱ Time', value: `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)} h ` : ''}${minutes % 60 ? `${minutes % 60} min` : ''}`.trim(), kind: 'neutral' })
  function add(label: string, delta: number, suffix = '', negativeIsGood = false, cost = false, precision = 1) {
    const rounded = Number(delta.toFixed(precision))
    if (rounded === 0) return
    const kind = (rounded > 0) !== negativeIsGood ? 'positive' : 'negative'
    const row: ResultChange = { label, value: `${rounded > 0 ? '+' : '−'}${number(Math.abs(rounded), precision)}${suffix}`, kind }
    ;(cost && rounded < 0 ? costs : changes).push(row)
  }
  add('💰 Money', after.game.money - before.game.money, ' zł', false, true, 2)
  for (const [key, label] of [
    ['hunger', '🍽 Food'], ['thirst', '💧 Water'], ['energy', '⚡ Energy'],
    ['health', '❤️ Health'], ['hygiene', '🧼 Hygiene'], ['mood', '🙂 Mood'],
  ] as const) add(label, after.game[key] - before.game[key])
  add('🍺 Intoxication', after.game.intoxication - before.game.intoxication, '', true)
  for (const [key, label, suffix] of [
    ['phoneBattery', '🔋 Battery', '%'], ['phoneCondition', '📱 Phone condition', '%'],
    ['jacket', '🧥 Jacket condition', '%'], ['water', '💧 Water portions', ''],
    ['food', '🥪 Food portions', ''], ['bottles', '♻️ Returnable bottles', ''],
    ['cigarettes', '🚬 Cigarettes', ''], ['medicines', '💊 Medicine', ''],
  ] as const) add(label, after.inventory[key] - before.inventory[key], suffix, false, key === 'phoneBattery')
  if (after.inventory.documents !== before.inventory.documents) changes.push({ label: '📄 Documents', value: after.inventory.documents ? 'Now carried' : 'No longer carried', kind: after.inventory.documents ? 'positive' : 'negative' })
  const names: Record<string, string> = { cold: '🤒 Cold', 'free-transit': '🎫 Free transport', 'well-fed': '🍲 Well fed' }
  const activeBefore = new Set(before.effects.filter(effect => effect.expiresAt > absoluteMinutes(before.game)).map(effect => effect.id))
  const activeAfter = new Set(after.effects.filter(effect => effect.expiresAt > absoluteMinutes(after.game)).map(effect => effect.id))
  for (const id of activeAfter) if (!activeBefore.has(id)) changes.push({ label: names[id] ?? id, value: 'Started', kind: id === 'cold' ? 'negative' : 'positive' })
  for (const id of activeBefore) if (!activeAfter.has(id)) changes.push({ label: names[id] ?? id, value: 'Ended', kind: id === 'cold' ? 'positive' : 'negative' })
  return { costs, changes }
}
