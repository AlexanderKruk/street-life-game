import { locationName } from '../src/locationText'
import { locations, type GameState } from '../src/game'
import type { StreetEventChoice } from '../src/events'
import type { Inventory, EventDiceState } from '../src/stateTypes'

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

export function eventChoiceUnavailable(choice: StreetEventChoice, game: GameState, inventory: Inventory, discoveredLocations: string[], phoneUnavailable: string | null) {
  if (choice.undiscoveredLocationRequired && discoveredLocations.includes(choice.undiscoveredLocationRequired)) {
    const place = locations.find(location => location.id === choice.undiscoveredLocationRequired)
    return `You already know about the ${locationName(place?.id ?? '')}.`
  }
  if (choice.moneyRequired !== undefined && game.money < choice.moneyRequired) return `Need ${choice.moneyRequired} zł`
  if (choice.phoneBatteryRequired !== undefined) {
    if (phoneUnavailable) return phoneUnavailable
    if (inventory.phoneBattery < choice.phoneBatteryRequired) return `Need ${choice.phoneBatteryRequired}% battery`
  }
  const requirements = choice.check?.requirements
  if (!requirements) return null
  if (requirements.minHealth !== undefined && game.health < requirements.minHealth) return `Too weak · need Health ${requirements.minHealth}`
  if (requirements.minEnergy !== undefined && game.energy < requirements.minEnergy) return `Too exhausted · need Energy ${requirements.minEnergy}`
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
