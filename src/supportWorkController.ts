import { weatherAt, temperatureAt, type ActionResult, type GameState } from './game'
import { absoluteMinutes } from './gameTime'
import type { ActiveEffect, Inventory, LifeSituation, StoredItems } from './stateTypes'
import type { GameSetter, RunWithResult, Setter } from './controllerTypes'
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
      return
    }
    if (kind === 'housing') {
      setDiscoveredLocations(prev => prev.includes('residential-shelter') ? prev : [...prev, 'residential-shelter'])
      if (life.schroniskoReferral) {
        setMessage('You already have a referral to Schronisko. It is available on the map.')
        return
      }
      setGame((prev) => applyAction(prev, { minutes: 35, mood: 3 }))
      setLife((status) => ({ ...status, schroniskoReferral: true }))
      setMessage('The social worker issued a referral. Schronisko 24/7 is now available on the map.')
      return
    }
    if (kind === 'documents') {
      if (inventory.documents) {
        setMessage('Your basic documents are currently complete.')
        return
      }
      setGame((prev) => applyAction(prev, { minutes: 60, mood: 3 }))
      setInventory((prev) => ({ ...prev, documents: true }))
      setMessage('The social worker helped you restore your basic documents.')
      return
    }
    if (kind === 'transport') {
      const expiresAt = absoluteMinutes(game) + 3 * 1440
      setGame((prev) => applyAction(prev, { minutes: 25 }))
      setEffects((active) => [...active.filter((effect) => effect.id !== 'free-transit'), { id: 'free-transit', expiresAt }])
      setMessage('You received free public transport for 3 days.')
      return
    }
    setGame((prev) => applyAction(prev, { minutes: 30, mood: 2 }))
    setMessage('The social worker explained which benefits may be available. Applications will be added as the progression expands.')
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
    setMessage('You completed a 3-hour physical shift. +35 zł. Physical work increases hunger, thirst and hygiene loss, especially in warm weather.')
  }

  function socialSupport(kind: 'housing' | 'documents' | 'transport' | 'benefits') { runWithResult('Social support', () => socialSupportImpl(kind)) }
  function takeDayWork() { runWithResult('Day work', takeDayWorkImpl) }
  return { socialSupport, takeDayWork }
}
