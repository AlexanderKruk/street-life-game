import type { RefObject } from 'react'
import { actions, applyAction as applyGameAction, type ActionResult, type GameState, type Housing, type Location, type TimeContext } from './game'
import { absoluteMinutes } from './gameTime'
import { FREE_WATER_LIMIT } from './inventory'
import { clothingHygieneCap } from './hygieneRules'
import { locationActionUnavailable } from './locationActionRules'
import type { EncounterQueue } from './encounterQueue'
import type { ActiveEffect, Inventory, LifeSituation, SleepState } from './stateTypes'
import type { GameSetter, RunWithResult, Setter } from './controllerTypes'
type Context = {
  game: GameState
  inventory: Inventory
  life: LifeSituation
  current: Location
  open: boolean
  activeEvent: boolean
  shelterQueue: boolean
  shelterBooked: boolean
  shelterAdmitted: boolean
  hygieneLimit: number
}
type Host = {
  setGame: GameSetter; setInventory: Setter<Inventory>; setLife: Setter<LifeSituation>; setEffects: Setter<ActiveEffect[]>; setMessage: Setter<string>; laundryCleanAt: RefObject<number>
  runWithResult: RunWithResult; resultSnapshot: () => import('./results').ResultSnapshot; applyAction: (state: GameState, action: ActionResult) => GameState; moodContext: (state: GameState, housing?: Housing) => TimeContext
  beginShelterInterview: () => void; prepareShelterAction: (id: string) => boolean; requestSleep: (kind: SleepState['kind']) => void
  finishRestAction: (id: string, name: string, result: ActionResult, next: GameState) => boolean; finishLocationPhoneCharge: (id: string) => void
}
export function createLocationController(context: Context, host: Host, queue: EncounterQueue) {
  const { game, inventory, life, current, open, activeEvent, shelterQueue, shelterBooked, shelterAdmitted, hygieneLimit } = context
  const { setGame, setInventory, setLife, setEffects, setMessage, laundryCleanAt, runWithResult, resultSnapshot, applyAction, moodContext, beginShelterInterview, prepareShelterAction, requestSleep, finishRestAction, finishLocationPhoneCharge } = host
  const { observeFirstNight, observeOrdinaryEvent } = queue
  function actionUnavailableReason(action: (typeof actions)[number]) {
    return locationActionUnavailable(action, { game, inventory, life, current, open, shelterBooked, shelterAdmitted })
  }

  function actImpl(actionId: string) {
    const action = actions.find((x) => x.id === actionId)
    if (!action || action.locationId !== current.id || activeEvent || shelterQueue) return
    const unavailable = actionUnavailableReason(action)
    if (unavailable) { setMessage(unavailable); return }
    if (actionId === 'shelter-social-worker') { beginShelterInterview(); return }
    if (!open && action.requiresOpen !== false) { setMessage(`${current.name} is closed. Come back during opening hours.`); return }
    if (current.id === 'shelter' && (game.minutes >= 1320 || game.minutes < 360) && actionId !== 'shelter-rest') {
      setMessage('Quiet hours are 22:00–06:00. Only sleeping is allowed right now.')
      return
    }
    if (action.cost && game.money < action.cost) { setMessage(`You need ${action.cost.toFixed(2)} zł for that.`); return }
    if (actionId.endsWith('-refill-water')) {
      setInventory(previous => ({ ...previous, water: Math.max(previous.water, FREE_WATER_LIMIT) }))
      setGame(previous => applyAction(previous, { minutes: action.minutes }))
      setMessage(`You refill your water for free. You now carry ${FREE_WATER_LIMIT} portions.`)
      return
    }
    if ((current.id === 'daycenter' || current.id === 'free-clinic') && actionId.startsWith('daycenter-')) {
      const hour = game.minutes / 60
      const chance = hour < 10 ? 0.9 : hour < 12 ? 0.75 : hour < 14 ? 0.55 : 0.35
      if (Math.random() > chance) {
        setGame((prev) => applyAction(prev, { minutes: 15, mood: -2 }))
        setMessage(current.id === 'free-clinic' ? 'The free clinic is full right now. You wait for a while, but no appointment opens up.' : 'Day Center is full right now. You wait for a while, but no place opens up.')
        return
      }
    }

    if (actionId === 'street-sleep') { requestSleep('ground'); return }
    if (actionId === 'station-sleep') { requestSleep('bench'); return }
    if (prepareShelterAction(actionId)) return
    if (actionId === 'residential-sleep') { requestSleep('residential'); return }

    const isShower = actionId === 'shelter-shower' || actionId === 'daycenter-shower'
    const useGel = isShower && inventory.showerGel > 0
    const baseResult = action.resolve(game)
    const result = useGel ? { ...baseResult, hygiene: (baseResult.hygiene ?? 0) * 1.5, hygieneCap: 100,
      message: 'You wash with 3-in-1 shower gel and rinse it off. It helps you get cleaner.' } : baseResult
    if (useGel) setInventory(prev => ({ ...prev, showerGel: prev.showerGel - 1 }))
    const washedClothes = actionId === 'daycenter-laundry' || actionId === 'shelter-laundry-pickup'
    const next = actionId === 'residential-stay' ? applyGameAction(game, result, moodContext(game, 'Schronisko')) : applyAction(game, result)
    if (washedClothes) {
      next.wetness = 0
      laundryCleanAt.current = absoluteMinutes(next)
      setInventory(prev => ({ ...prev, clothingCleanliness: 100 }))
    } else {
      const endCleanliness = Math.max(0, inventory.clothingCleanliness - result.minutes * (20 / 1440))
      next.hygiene = Math.min(next.hygiene, clothingHygieneCap(endCleanliness))
    }
    setGame(next, actionId === 'residential-stay' ? 'Schronisko' : undefined)
    setMessage((result.message ?? 'Time passes.') + (isShower && hygieneLimit < 100 ? ` Dirty clothes limit Hygiene to ${hygieneLimit}. Wash your clothes to raise the limit.` : ''))

    if (!finishRestAction(actionId, action.name, result, next)) {
      if (!observeFirstNight('location', next)) observeOrdinaryEvent('location', next, undefined, { observation: 'action', elapsedMinutes: result.minutes })
    }
    if (actionId === 'residential-stay') setLife((status) => ({ ...status, housing: 'Schronisko', housingUntil: undefined }))
    if (actionId === 'shop-meal') {
      const expiresAt = absoluteMinutes(next) + 240
      setEffects((active) => [...active.filter((effect) => effect.id !== 'well-fed'), { id: 'well-fed', expiresAt }])
    }
    finishLocationPhoneCharge(actionId)
    if (actionId === 'daycenter-doctor') {
      setEffects((active) => active.filter((effect) => effect.id !== 'cold'))
    }
  }

  function act(id: string) { runWithResult({ id: `location:${id}`, title: actions.find(action => action.id === id)?.name ?? 'Action complete' }, () => actImpl(id), resultSnapshot(), true, false, ['shelter-shower', 'daycenter-shower'].includes(id) ? ['showerGel'] : []) }
  return { act, actionUnavailableReason }
}
