import { t } from './i18n'
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
      setMessage(storage.documents ? t("controller.support.documents.stored") : t("controller.support.documents.required"))
      return { kind: 'action' as const, supportOutcome: 'needed' as const }
    }
    if (kind === 'housing') {
      setDiscoveredLocations(prev => prev.includes('residential-shelter') ? prev : [...prev, 'residential-shelter'])
      if (life.schroniskoReferral) {
        setMessage(t("controller.support.housing.existing"))
        return { kind: 'action' as const, supportOutcome: 'unchanged' as const }
      }
      setGame((prev) => applyAction(prev, { minutes: 35, mood: 3 }))
      setLife((status) => ({ ...status, schroniskoReferral: true }))
      setMessage(t("controller.support.housing.granted"))
      return { kind: 'action' as const, supportOutcome: 'referral' as const }
    }
    if (kind === 'documents') {
      if (inventory.documents) {
        setMessage(t("controller.support.documents.complete"))
        return { kind: 'action' as const, supportOutcome: 'unchanged' as const }
      }
      setGame((prev) => applyAction(prev, { minutes: 60, mood: 3 }))
      setInventory((prev) => ({ ...prev, documents: true }))
      setMessage(t("controller.support.documents.restored"))
      return { kind: 'action' as const, supportOutcome: 'restored' as const }
    }
    if (kind === 'transport') {
      const expiresAt = absoluteMinutes(game) + 3 * 1440
      setGame((prev) => applyAction(prev, { minutes: 25 }))
      setEffects((active) => [...active.filter((effect) => effect.id !== 'free-transit'), { id: 'free-transit', expiresAt }])
      setMessage(t("controller.support.transport.granted"))
      return { kind: 'action' as const, supportOutcome: 'transport' as const }
    }
    setGame((prev) => applyAction(prev, { minutes: 30, mood: 2 }))
    setMessage(t("controller.support.benefits.information"))
    return { kind: 'action' as const, supportOutcome: 'benefits' as const }
  }

  function takeDayWorkImpl() {
    if (!open || currentId !== 'work') return
    if (game.energy < dayWorkEnergyRequired) { setMessage(t('controller.work.energy', { required: dayWorkEnergyRequired })); return }
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
    setMessage(t("controller.work.completed"))
  }

  function socialSupport(kind: 'housing' | 'documents' | 'transport' | 'benefits') { runWithResult({ id: 'social-support', title: t("controller.support.title") }, () => socialSupportImpl(kind)) }
  function takeDayWork() { runWithResult({ id: 'day-work', title: t("controller.work.title") }, takeDayWorkImpl) }
  return { socialSupport, takeDayWork }
}
