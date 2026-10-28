import type { GameState } from './game'
import { absoluteMinutes } from './gameTime'
import type { ActiveEffect, Inventory, JournalGoals, LifeSituation } from './stateTypes'

export function initialJournalGoals(battery: number): JournalGoals {
  return { version: 2, shelter: false, charge: false, work: false, cold: false,
    chargeKnown: false, workKnown: false, coldKnown: false, battery }
}

export function loadJournalGoals(raw: unknown, battery: number): JournalGoals {
  const initial = initialJournalGoals(battery)
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return initial
  const saved = raw as Record<string, unknown>
  // Legacy work meant a search/visit, not paid work. Only shelter is equivalent.
  initial.shelter = saved.shelter === true
  if (saved.version !== 2) return initial
  for (const key of ['charge', 'work', 'cold', 'chargeKnown', 'workKnown', 'coldKnown'] as const) {
    initial[key] = saved[key] === true
  }
  if (typeof saved.battery === 'number' && Number.isFinite(saved.battery) && saved.battery >= 0 && saved.battery <= 100) initial.battery = saved.battery
  return initial
}

type Context = {
  game: GameState; inventory: Inventory; life: LifeSituation; effects: ActiveEffect[]
  discoveredLocations: string[]; answeredQuestions: string[]
}
export function progressJournalGoals(previous: JournalGoals, context: Context): JournalGoals {
  const { game, inventory, life, effects, discoveredLocations, answeredQuestions } = context
  const coldActive = effects.some(effect => effect.id === 'cold' && effect.expiresAt > absoluteMinutes(game))
  const charged = inventory.phoneBattery > previous.battery
  const worked = life.employment === 'Day work'
  const next: JournalGoals = { ...previous,
    shelter: previous.shelter || life.housing === 'Schronisko' || (life.shelterUntilDay ?? 0) >= game.day,
    charge: previous.charge || charged,
    chargeKnown: previous.chargeKnown || inventory.phoneBattery <= 20 || charged,
    work: previous.work || worked,
    workKnown: previous.workKnown || worked || discoveredLocations.includes('work') || game.locationId === 'work' || answeredQuestions.includes('work'),
    cold: previous.cold || (previous.coldKnown && !coldActive),
    coldKnown: previous.coldKnown || coldActive,
    battery: inventory.phoneBattery,
  }
  return (Object.keys(next) as (keyof JournalGoals)[]).every(key => next[key] === previous[key]) ? previous : next
}

export function journalGoalKnown(goals: JournalGoals, id: 'shelter' | 'charge' | 'work' | 'cold') {
  return { shelter: true, charge: goals.chargeKnown, work: goals.workKnown, cold: goals.coldKnown }[id]
}
