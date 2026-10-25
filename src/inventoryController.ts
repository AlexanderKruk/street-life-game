import { inventoryCommandResult, resolveInventoryCommand, type InventoryCommand, type InventoryCommandContext } from './inventoryCommands'
import type { FoodCondition } from './foodInventory'
import type { ActionResult, GameState } from './game'
import type { ActiveEffect, Inventory, ShopItem, StoredItems } from './stateTypes'
import type { ResultCardData } from './ResultCard'
import type { ResultSnapshot } from './results'
import type { GameSetter, RunWithResult, Setter } from './controllerTypes'
type Host = {
  setInventory: Setter<Inventory>
  setStorage: Setter<StoredItems>
  setEffects: Setter<ActiveEffect[]>
  setGame: GameSetter
  setMessage: Setter<string>
  setInfoModal: Setter<ResultCardData | null>
  applyAction: (state: GameState, action: ActionResult) => GameState
  runWithResult: RunWithResult
  resultSnapshot: () => ResultSnapshot
}
export function createInventoryController(context: InventoryCommandContext, host: Host) {
  const { setInventory, setStorage, setEffects, setGame, setMessage, setInfoModal, applyAction, runWithResult, resultSnapshot } = host
  // Resolve from the current render only after runWithResult accepts the action.
  // Never resolve random food outcomes inside a state updater or an effect.
  function executeInventoryCommand(command: InventoryCommand) {
    const perform = () => {
      const changes = resolveInventoryCommand(context, command)
      if (changes.inventory) setInventory(changes.inventory)
      if (changes.storage) setStorage(changes.storage)
      if (changes.effects) setEffects(changes.effects)
      if (changes.game) setGame(changes.game)
      const action = changes.action
      if (action) setGame(previous => applyAction(previous, action))
      if (changes.message !== undefined) setMessage(changes.message)
      if (changes.info) setInfoModal(changes.info)
    }
    const result = inventoryCommandResult(command)
    if (result) runWithResult(result.title, perform, resultSnapshot(), true, result.always ?? false, result.consumedItems ?? [])
    else perform()
  }

  function returnBottles() { executeInventoryCommand({ type: 'return-bottles' }) }
  function storeItem(item: 'documents' | 'medicines' | 'cigarettes') { executeInventoryCommand({ type: 'store', item }) }
  function takeStoredItem(item: 'documents' | 'medicines' | 'cigarettes') { executeInventoryCommand({ type: 'take', item }) }
  function storeFood() { executeInventoryCommand({ type: 'store-food' }) }
  function takeStoredFood() { executeInventoryCommand({ type: 'take-food' }) }
  function buyItem(item: ShopItem) { executeInventoryCommand({ type: 'buy', item }) }
  function useSupply(item: 'bread' | 'cannedFood' | 'readyMeal' | 'wipes', slotIndex = 0, condition?: FoodCondition) { executeInventoryCommand({ type: 'use', item, slotIndex, condition }) }
  function useMedicine() { executeInventoryCommand({ type: 'medicine' }) }
  function smokeCigarette() { executeInventoryCommand({ type: 'smoke' }) }
  function useItem(item: 'water' | 'food', slotIndex = 0, condition?: FoodCondition) { executeInventoryCommand({ type: 'use', item, slotIndex, condition }) }

  return { executeInventoryCommand, returnBottles, storeItem, takeStoredItem, storeFood, takeStoredFood, buyItem, useSupply, useMedicine, smokeCigarette, useItem }
}
