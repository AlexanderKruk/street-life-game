import { actionName, showerResult } from './actionText'
import { formatMoney } from './i18n/formatters'
import { t } from './i18n'
import { locationName } from './locationText'
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
  const { deferActionEncounter } = queue
  function actionUnavailableReason(action: (typeof actions)[number]) {
    return locationActionUnavailable(action, { game, inventory, life, current, open, shelterBooked, shelterAdmitted })
  }

  function actImpl(actionId: string) {
    const action = actions.find((x) => x.id === actionId)
    if (!action || action.locationId !== current.id || activeEvent || shelterQueue) return
    const unavailable = actionUnavailableReason(action)
    if (unavailable !== null) { setMessage(unavailable); return }
    if (actionId === 'shelter-social-worker') { beginShelterInterview(); return }
    if (!open && action.requiresOpen !== false) { setMessage(t('location.closedRefusal', { place: locationName(current.id) })); return }
    if (current.id === 'shelter' && (game.minutes >= 1320 || game.minutes < 360) && actionId !== 'shelter-rest') {
      setMessage(t('action.controller.quiet'))
      return
    }
    if (action.cost && game.money < action.cost) { setMessage(t('action.controller.money', { cost: formatMoney(Number(action.cost.toFixed(2)), true) })); return }
    if (actionId.endsWith('-refill-water')) {
      setInventory(previous => ({ ...previous, water: Math.max(previous.water, FREE_WATER_LIMIT) }))
      setGame(previous => applyAction(previous, { minutes: action.minutes }))
      setMessage(t('action.controller.water', { count: FREE_WATER_LIMIT }))
      return
    }
    if ((current.id === 'daycenter' || current.id === 'free-clinic') && actionId.startsWith('daycenter-')) {
      const hour = game.minutes / 60
      const chance = hour < 10 ? 0.9 : hour < 12 ? 0.75 : hour < 14 ? 0.55 : 0.35
      if (Math.random() > chance) {
        setGame((prev) => applyAction(prev, { minutes: 15, mood: -2 }))
        setMessage(current.id === 'free-clinic' ? t('action.controller.clinicFull') : t('action.controller.daycenterFull'))
        return { kind: 'action' as const, failed: true }
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
      message: showerResult(true, 100) } : baseResult
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
    setMessage(isShower ? showerResult(useGel, hygieneLimit) : result.message ?? t('action.controller.timePasses'))

    if (!finishRestAction(actionId, actionName(action.id), result, next)) {
      deferActionEncounter('location', next, result.minutes)
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

  function act(id: string) {
    const action = actions.find(action => action.id === id)
    runWithResult({ id: `location:${id}`, title: action ? actionName(action.id) : t('action.controller.complete') }, () => actImpl(id), resultSnapshot(), true, false, ['shelter-shower', 'daycenter-shower'].includes(id) ? ['showerGel'] : [])
  }
  return { act, actionUnavailableReason }
}
