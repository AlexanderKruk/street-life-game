import type { GameState } from '../src/game'
import { absoluteMinutes } from '../src/gameTime'
import { CALL_BATTERY_PER_MINUTE, openingCall } from '../src/openingCalls'
import { phoneDrainMultiplier, phoneScreenDrain } from '../src/phonePower'
import { SHELTER_CHARGE_PER_HOUR, shelterChargingMinutes } from '../src/shelterCharging'
import type { Inventory, PhoneActivity } from '../src/stateTypes'

export const PHONE_SEARCH_MIN = 10
export const PHONE_SEARCH_MAX = 25

export function phoneUnavailableReason(inventory: Inventory, charging: boolean) {
  return charging ? 'Collect your phone from the charger at Night Shelter.'
    : inventory.phoneCondition <= 0 ? 'Your phone is broken.'
    : inventory.phoneBattery <= 0 ? 'The battery is empty. Find somewhere to charge it.' : null
}

export function phoneActivityTick(activity: PhoneActivity, game: GameState, condition: number) {
  const call = openingCall(activity.questionId)
  const batteryCost = call ? CALL_BATTERY_PER_MINUTE * phoneDrainMultiplier(condition) : phoneScreenDrain(game, condition, 'browsing')
  return { batteryCost, advance: (previous: PhoneActivity | null) => previous ? { ...previous, remaining: Math.max(0, previous.remaining - 1) } : null }
}

export function pausePhoneActivity(previous: PhoneActivity | null) {
  return previous ? { ...previous, pausedMinutes: (previous.pausedMinutes ?? 0) + 1 } : previous
}

// Preserve completion priorities: the last call minute wins over checkout,
// whereas checkout interrupts even a just-finished search.
export function phoneActivityEnd(activity: PhoneActivity, inventory: Inventory, serviceActive: boolean, gameOver: boolean, checkoutDue: boolean) {
  const call = openingCall(activity.questionId)
  if (call) {
    if (activity.remaining === 0) return 'complete'
    if (inventory.phoneBattery <= 0 || inventory.phoneCondition <= 0 || gameOver || checkoutDue) return 'interrupted'
  } else {
    if (checkoutDue) return 'checkout'
    if (activity.remaining === 0) return 'complete'
    if (inventory.phoneBattery <= 0 || !serviceActive || gameOver) return 'interrupted'
  }
  return null
}

export function elapsedPhoneBattery(inventory: Inventory, game: GameState, options: {
  from: number; now: number; movingMinutes: number; travelling: boolean; navigationOn: boolean; musicOn: boolean; charging: boolean
}) {
  const { from, now, movingMinutes, travelling, navigationOn, musicOn, charging } = options
  const navigationDrain = travelling && navigationOn && movingMinutes > 0 ? phoneScreenDrain({ ...game, minutes: game.minutes - movingMinutes }, inventory.phoneCondition, 'navigation', movingMinutes) : 0
  const musicDrain = musicOn ? 4 / 60 * phoneDrainMultiplier(inventory.phoneCondition) * (now - from) : 0
  const chargingGain = charging && game.locationId === 'shelter' && !travelling ? shelterChargingMinutes(from, now) * SHELTER_CHARGE_PER_HOUR / 60 : 0
  return Math.min(100, Math.max(0, inventory.phoneBattery + chargingGain - navigationDrain - musicDrain))
}
