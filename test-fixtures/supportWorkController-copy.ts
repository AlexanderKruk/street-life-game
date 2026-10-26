// Frozen 9064851 controller copy, conditions and numeric commands.
import { weatherAt, temperatureAt, type ActionResult, type GameState } from '../src/game'
import { absoluteMinutes } from '../src/gameTime'
import type { ActiveEffect, Inventory, LifeSituation, StoredItems } from '../src/stateTypes'
import type { GameSetter, RunWithResult, Setter } from '../src/controllerTypes'
type Context = {
  game: GameState
  inventory: Inventory
  storage: StoredItems
  life: LifeSituation
  currentId: string
  open: boolean
  dayWorkEnergyRequired: number
}
type Host = {
  setGame: GameSetter
  setInventory: Setter<Inventory>
  setEffects: Setter<ActiveEffect[]>
  setLife: Setter<LifeSituation>
  setMessage: Setter<string>
  setDiscoveredLocations: Setter<string[]>
  applyAction: (state: GameState, action: ActionResult) => GameState
  runWithResult: RunWithResult
}
export function createSupportWorkController(context: Context, host: Host) {
  const { game, inventory, storage, life, currentId, open, dayWorkEnergyRequired } = context
  const { setGame, setInventory, setEffects, setLife, setMessage, setDiscoveredLocations, applyAction, runWithResult } = host
  function socialSupportImpl(kind: 'housing' | 'documents' | 'transport' | 'benefits') {
    if (!open || currentId !== 'support') return
    if ((kind === 'transport' || kind === 'benefits') && !inventory.documents) {
      setMessage(storage.documents ? 'Your documents are stored at the shelter. Take them with you for this application.' : 'You need basic documents for this application. Ask for help restoring them first.')
      return { kind: 'action' as const, supportOutcome: 'needed' as const }
    }
    if (kind === 'housing') {
      setDiscoveredLocations(prev => prev.includes('residential-shelter') ? prev : [...prev, 'residential-shelter'])
      if (life.schroniskoReferral) {
        setMessage('You already have a referral to Schronisko. It is available on the map.')
        return { kind: 'action' as const, supportOutcome: 'unchanged' as const }
      }
      setGame((prev) => applyAction(prev, { minutes: 35, mood: 3 }))
      setLife((status) => ({ ...status, schroniskoReferral: true }))
      setMessage('The social worker gives you a referral to Schronisko. The address is saved on your map.')
      return { kind: 'action' as const, supportOutcome: 'referral' as const }
    }
    if (kind === 'documents') {
      if (inventory.documents) {
        setMessage('Your basic documents are currently complete.')
        return { kind: 'action' as const, supportOutcome: 'unchanged' as const }
      }
      setGame((prev) => applyAction(prev, { minutes: 60, mood: 3 }))
      setInventory((prev) => ({ ...prev, documents: true }))
      setMessage('The social worker helps you replace your missing documents.')
      return { kind: 'action' as const, supportOutcome: 'restored' as const }
    }
    if (kind === 'transport') {
      const expiresAt = absoluteMinutes(game) + 3 * 1440
      setGame((prev) => applyAction(prev, { minutes: 25 }))
      setEffects((active) => [...active.filter((effect) => effect.id !== 'free-transit'), { id: 'free-transit', expiresAt }])
      setMessage('You receive a pass for 3 days of free public transport.')
      return { kind: 'action' as const, supportOutcome: 'transport' as const }
    }
    setGame((prev) => applyAction(prev, { minutes: 30, mood: 2 }))
    setMessage('The social worker explains which benefits may be available. You leave with information about your options.')
    return { kind: 'action' as const, supportOutcome: 'benefits' as const }
  }

  function takeDayWorkImpl() {
    if (!open || currentId !== 'work') return
    if (game.energy < dayWorkEnergyRequired) { setMessage(`You need at least ${dayWorkEnergyRequired} Energy to start this shift.`); return }
    setGame((prev) => {
      const weather = weatherAt(prev)
      const temperature = temperatureAt(weather.temp, prev.minutes + 90)
      const heatMultiplier = temperature >= 25 ? 1.5 : temperature >= 18 ? 1.2 : 1
      return applyAction(prev, {
        minutes: 180,
        money: 35,
        hunger: -10 * heatMultiplier,
        thirst: -14 * heatMultiplier,
        energy: -5,
        hygiene: -8 * heatMultiplier,
        mood: 3,
      })
    })
    setLife((status) => ({ ...status, employment: 'Day work', income: 'Irregular' }))
    setMessage('You finish the shift and collect your pay. After three hours of physical work, you could use something to eat and drink.')
  }

  function socialSupport(kind: 'housing' | 'documents' | 'transport' | 'benefits') { runWithResult({ id: 'social-support', title: 'Social support' }, () => socialSupportImpl(kind)) }
  function takeDayWork() { runWithResult({ id: 'day-work', title: 'Day work' }, takeDayWorkImpl) }
  return { socialSupport, takeDayWork }
}
