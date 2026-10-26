import { t } from './i18n'
import { formatMoney } from './i18n/formatters'
import { actions, formatTime, type GameState } from './game'
import { displayDay } from './gameDate'
import { weekday } from './gameTime'
import { BACKPACK_CAPACITY, FREE_WATER_LIMIT, backpackSlots } from './inventory'
import type { Inventory, LifeSituation } from './stateTypes'
type Context = { game: GameState; inventory: Inventory; life: LifeSituation; current: { id: string; open: number }; open: boolean; shelterBooked: boolean; shelterAdmitted: boolean }
export type LocationActionBlock =
  | { id: 'other-location' | 'registration-required' | 'outside' | 'already-queued' | 'queue-hours' | 'shelter-closed' | 'intoxicated' | 'worker-hours' | 'dinner-hours' | 'dinner-used' | 'breakfast-hours' | 'breakfast-used' | 'laundry-drop-hours' | 'laundry-dropped' | 'laundry-pickup-hours' | 'laundry-not-dropped' | 'quiet-hours' | 'water-stock' | 'water-capacity' }
  | { id: 'registration-blocked'; day: number }
  | { id: 'closed'; opensAt: number }
  | { id: 'money'; cost: number }

export function locationActionBlock(action: (typeof actions)[number], context: Context): LocationActionBlock | null {
  const { game, inventory, life, current, open, shelterBooked, shelterAdmitted } = context
    const id = action.id
    if (action.locationId !== current.id) return { id: 'other-location' }
    if (current.id === 'shelter' && !shelterBooked && id !== 'shelter-rest') return { id: 'registration-required' }
    if (current.id === 'shelter' && shelterBooked && !shelterAdmitted && id !== 'shelter-social-worker') return { id: 'outside' }
    if (id === 'shelter-rest') {
      if ((life.shelterBlockedUntilDay ?? 0) > game.day) return { id: 'registration-blocked', day: displayDay(life.shelterBlockedUntilDay ?? game.day) }
      if (!shelterBooked) {
        if (life.shelterRegistrationAttemptDay === game.day) return { id: 'already-queued' }
        if (game.minutes < 480 || game.minutes >= 1320) return { id: 'queue-hours' }
        return null // Waiting outside is possible before the doors open.
      } else {
        if (!open) return { id: 'shelter-closed' }
        if (!shelterAdmitted) return { id: 'outside' }
        if (game.intoxication > 10) return { id: 'intoxicated' }
      }
    }
    if (id === 'shelter-social-worker') {
      if ((weekday(game.day) !== 'Tu' && weekday(game.day) !== 'Fr') || game.minutes < 960 || game.minutes >= 1200) return { id: 'worker-hours' }
      return null // Appointment hours are separate from overnight opening hours.
    }
    if (id === 'shelter-dinner') {
      if (game.minutes < 1140 || game.minutes >= 1230) return { id: 'dinner-hours' }
      if (life.shelterDinnerDay === game.day) return { id: 'dinner-used' }
    }
    if (id === 'shelter-breakfast') {
      if (game.minutes < 390 || game.minutes >= 420) return { id: 'breakfast-hours' }
      if (life.shelterBreakfastDay === game.day) return { id: 'breakfast-used' }
    }
    if (id === 'shelter-laundry-drop') {
      if (weekday(game.day) !== 'Th' || game.minutes < 390 || game.minutes >= 480) return { id: 'laundry-drop-hours' }
      if (life.shelterLaundryDropDay === game.day) return { id: 'laundry-dropped' }
    }
    if (id === 'shelter-laundry-pickup') {
      if (weekday(game.day) !== 'Th' || game.minutes < 1080 || game.minutes >= 1320) return { id: 'laundry-pickup-hours' }
      if (life.shelterLaundryDropDay !== game.day) return { id: 'laundry-not-dropped' }
    }
    if (!open && action.requiresOpen !== false) return { id: 'closed', opensAt: current.open }
    if (current.id === 'shelter' && (game.minutes >= 1320 || game.minutes < 360) && id !== 'shelter-rest') return { id: 'quiet-hours' }
    if (id.endsWith('-refill-water')) {
      if (inventory.water >= FREE_WATER_LIMIT) return { id: 'water-stock' }
      if (backpackSlots({ ...inventory, water: FREE_WATER_LIMIT }) > BACKPACK_CAPACITY) return { id: 'water-capacity' }
    }
    if (action.cost && game.money < action.cost) return { id: 'money', cost: action.cost }
    return null
  }


// Text is optional presentation. Only null means that the action is available.
export function locationActionBlockLabel(block: LocationActionBlock): string {
  if (block.id === 'registration-blocked') return t('action.unavailable.registration-blocked', { day: block.day })
  if (block.id === 'closed') return t('action.unavailable.closed', { time: formatTime(block.opensAt) })
  if (block.id === 'money') return t('action.unavailable.money', { cost: formatMoney(Number(block.cost.toFixed(2)), true) })
  return t(`action.unavailable.${block.id}`)
}
export function locationActionUnavailable(action: (typeof actions)[number], context: Context): string | null {
  const block = locationActionBlock(action, context)
  return block === null ? null : locationActionBlockLabel(block)
}
