import type { GameState } from './game'
import type { StreetEventChoice } from './events'
import type { Inventory, EventDiceState } from './stateTypes'

export function eventCheckModifier(game: GameState, choice: StreetEventChoice) {
  if (choice.check?.stat === 'persuasion') {
    const hygiene = game.hygiene >= 80 ? 2 : game.hygiene >= 60 ? 1 : game.hygiene < 20 ? -3 : game.hygiene < 40 ? -2 : 0
    const mood = game.mood >= 75 ? 1 : game.mood < 25 ? -1 : 0
    return hygiene + mood
  }
  if (game.energy >= 80) return 2
  if (game.energy >= 60) return 1
  if (game.energy < 20) return -2
  if (game.energy < 40) return -1
  return 0
}

export type EventChoiceBlock =
  | { id: 'known-place'; placeId: string }
  | { id: 'money' | 'battery' | 'health' | 'energy'; required: number }
  | { id: 'phone'; message: string }

export function eventChoiceBlock(choice: StreetEventChoice, game: GameState, inventory: Inventory, discoveredLocations: string[], phoneUnavailable: string | null): EventChoiceBlock | null {
  if (choice.undiscoveredLocationRequired && discoveredLocations.includes(choice.undiscoveredLocationRequired)) return { id: 'known-place', placeId: choice.undiscoveredLocationRequired }
  if (choice.moneyRequired !== undefined && game.money < choice.moneyRequired) return { id: 'money', required: choice.moneyRequired }
  if (choice.phoneBatteryRequired !== undefined) {
    if (phoneUnavailable !== null) return { id: 'phone', message: phoneUnavailable }
    if (inventory.phoneBattery < choice.phoneBatteryRequired) return { id: 'battery', required: choice.phoneBatteryRequired }
  }
  const requirements = choice.check?.requirements
  if (!requirements) return null
  if (requirements.minHealth !== undefined && game.health < requirements.minHealth) return { id: 'health', required: requirements.minHealth }
  if (requirements.minEnergy !== undefined && game.energy < requirements.minEnergy) return { id: 'energy', required: requirements.minEnergy }
  return null
}


export function diceOutcome(dice: EventDiceState) {
  if (!dice.choice.check || dice.roll === null) return null
  const check = dice.choice.check
  const roll = dice.roll
  const success = roll === 20 || (roll !== 1 && roll + dice.modifier >= check.dc)
  const outcome = roll === 20 && check.criticalSuccess ? check.criticalSuccess
    : roll === 1 && check.criticalFailure ? check.criticalFailure
    : success ? check.success : check.failure
  return { success, outcome }
}
