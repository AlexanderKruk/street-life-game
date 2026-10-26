// Frozen 9064851 controller copy, conditions and numeric commands.
import type { ActionResult, GameState } from '../src/game'
import { phoneDrainMultiplier } from '../src/phonePower'
import type { ActiveEffect, Inventory, Screen, Trip } from '../src/stateTypes'
import type { GameSetter, RunWithResult, Setter } from '../src/controllerTypes'
type Context = {
  game: GameState
  inventory: Inventory
  currentId: string
  open: boolean
  activeEvent: boolean
  shelterPhoneCharging: boolean
}
type Host = {
  setGame: GameSetter
  setInventory: Setter<Inventory>
  setEffects: Setter<ActiveEffect[]>
  setMessage: Setter<string>
  setSelectedDestination: Setter<string | null>
  setTrip: Setter<Trip | null>
  setScreen: Setter<Screen>
  applyAction: (state: GameState, action: ActionResult) => GameState
  runWithResult: RunWithResult
}
export function createMedicalController(context: Context, host: Host) {
  const { game, inventory, currentId, open, activeEvent, shelterPhoneCharging } = context
  const { setGame, setInventory, setEffects, setMessage, setSelectedDestination, setTrip, setScreen, applyAction, runWithResult } = host
  function hospitalVisitImpl() {
    if (activeEvent || currentId !== 'hospital') return
    if (!open) { setMessage('Regular medical care is closed.'); return }
    if (!inventory.documents) { setMessage('You need your documents for a regular medical appointment.'); return }
    setGame((prev) => {
      const afterTime = applyAction(prev, { minutes: 90, mood: 3 })
      return { ...afterTime, health: Math.max(afterTime.health, 65) }
    })
    setEffects((active) => active.filter((effect) => effect.id !== 'cold'))
    setMessage('A doctor examines you and treats what they can. Your condition is brought back to a stable level.')
  }

  function callAmbulanceImpl() {
    if (activeEvent) return
    if (shelterPhoneCharging) { setMessage('Collect your phone from the charger first.'); return }
    if (game.health > 20) { setMessage('Emergency care requires Health 20 or lower. Visit a doctor for regular care.'); return }
    if (inventory.phoneBattery <= 0 || inventory.phoneCondition <= 0) { setMessage('Your phone is not working, so you cannot call an ambulance.'); return }
    const hours = 4 + Math.floor(Math.random() * 5)
    setInventory((prev) => ({ ...prev, phoneBattery: Math.max(0, prev.phoneBattery - 2 * phoneDrainMultiplier(prev.phoneCondition)) }))
    setGame((prev) => {
      const afterTime = applyAction(prev, { minutes: hours * 60, energy: -15, mood: -5 })
      return { ...afterTime, health: Math.max(afterTime.health, 35), locationId: 'hospital' }
    })
    setSelectedDestination(null)
    setTrip(null)
    setScreen('location')
    setMessage(`You call an ambulance. Emergency staff stabilise your condition without requiring documents. About ${hours} hours pass.`)
  }

  function hospitalVisit() { runWithResult({ id: 'medical-appointment', title: 'Medical appointment' }, hospitalVisitImpl) }
  function callAmbulance() { runWithResult({ id: 'emergency-care', title: 'Emergency care' }, callAmbulanceImpl) }
  return { hospitalVisit, callAmbulance }
}
