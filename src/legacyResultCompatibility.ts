import type { ResultChange } from './results'
import type { ResultResourceId } from './resultResources'

// Explicit adapter for old summaries/fixtures lacking structured fields.
// Never infer an ID from a new translated label: an explicit ID always wins.
const legacyLabels: Record<string, ResultResourceId> = {
  Time: 'time', Money: 'money', Food: 'hunger', Water: 'thirst', Thirst: 'thirst', Energy: 'energy', Health: 'health', Hygiene: 'hygiene', Mood: 'mood',
  Intoxication: 'intoxication', 'Clothing wetness': 'wetness', Battery: 'phoneBattery', 'Phone condition': 'phoneCondition',
  'Clothing cleanliness': 'clothingCleanliness', 'Clothing condition': 'jacket', 'Water portions': 'water', 'Food portions': 'food',
  'Deposit containers': 'bottles', 'Returnable bottles': 'bottles', 'Bread rolls': 'bread', 'Canned food': 'cannedFood', 'Ready meals': 'readyMeal',
  'Wet wipes': 'wipes', '3-in-1 gel uses': 'showerGel', Cigarettes: 'cigarettes', Medicine: 'medicines', Documents: 'documents',
  Cold: 'cold', 'Free transport': 'free-transit', 'Well fed': 'well-fed', 'Cold recovery': 'coldRecovery',
}
export function plainResultLabel(label: string) { return label.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]+\s*/u, '') }
export function legacyResourceId(label: string) { return Object.hasOwn(legacyLabels, plainResultLabel(label)) ? legacyLabels[plainResultLabel(label)] : undefined }
export function resultChangeId(change: Pick<ResultChange, 'id' | 'label'>) { return change.id ?? legacyResourceId(change.label) }
export function resultChangeAmount(change: ResultChange) {
  return change.amount ?? Number(change.value.replace('−', '-').match(/^[+-]?\d+(?:\.\d+)?/)?.[0])
}
