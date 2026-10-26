import { t } from './i18n'
import type { ActionResult, GameState } from './game'
import { phoneDrainMultiplier } from './phonePower'
import type { ActiveEffect, Inventory, Screen, Trip } from './stateTypes'
import type { GameSetter, RunWithResult, Setter } from './controllerTypes'
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
    if (!open) { setMessage(t("controller.medical.regular.closed")); return }
    if (!inventory.documents) { setMessage(t("controller.medical.regular.documents")); return }
    setGame((prev) => {
      const afterTime = applyAction(prev, { minutes: 90, mood: 3 })
      return { ...afterTime, health: Math.max(afterTime.health, 65) }
    })
    setEffects((active) => active.filter((effect) => effect.id !== 'cold'))
    setMessage(t("controller.medical.regular.treated"))
  }

  function callAmbulanceImpl() {
    if (activeEvent) return
    if (shelterPhoneCharging) { setMessage(t("controller.medical.emergency.charging")); return }
    if (game.health > 20) { setMessage(t("controller.medical.emergency.health")); return }
    if (inventory.phoneBattery <= 0 || inventory.phoneCondition <= 0) { setMessage(t("controller.medical.emergency.phone")); return }
    const hours = 4 + Math.floor(Math.random() * 5)
    setInventory((prev) => ({ ...prev, phoneBattery: Math.max(0, prev.phoneBattery - 2 * phoneDrainMultiplier(prev.phoneCondition)) }))
    setGame((prev) => {
      const afterTime = applyAction(prev, { minutes: hours * 60, energy: -15, mood: -5 })
      return { ...afterTime, health: Math.max(afterTime.health, 35), locationId: 'hospital' }
    })
    setSelectedDestination(null)
    setTrip(null)
    setScreen('location')
    setMessage(t('controller.medical.emergency.treated', { hours }))
  }

  function hospitalVisit() { runWithResult({ id: 'medical-appointment', title: t("controller.medical.regular.title") }, hospitalVisitImpl) }
  function callAmbulance() { runWithResult({ id: 'emergency-care', title: t("controller.medical.emergency.title") }, callAmbulanceImpl) }
  return { hospitalVisit, callAmbulance }
}
