// Frozen e4b5fe7 decision order and refusal copy for migration parity.
import { actions, formatTime, type GameState } from '../src/game'
import { displayDay } from '../src/gameDate'
import { weekday } from '../src/gameTime'
import { BACKPACK_CAPACITY, FREE_WATER_LIMIT, backpackSlots } from '../src/inventory'
import type { Inventory, LifeSituation } from '../src/stateTypes'
type Context = { game: GameState; inventory: Inventory; life: LifeSituation; current: { id: string; open: number }; open: boolean; shelterBooked: boolean; shelterAdmitted: boolean }
export function locationActionUnavailable(action: (typeof actions)[number], context: Context): string | null {
  const { game, inventory, life, current, open, shelterBooked, shelterAdmitted } = context
    const id = action.id
    if (action.locationId !== current.id) return 'This action is available at another location.'
    if (current.id === 'shelter' && !shelterBooked && id !== 'shelter-rest') return 'Register for a place first.'
    if (current.id === 'shelter' && shelterBooked && !shelterAdmitted && id !== 'shelter-social-worker') return 'Entry 18:00–22:00. You are outside; missing entry counts as a missed night.'
    if (id === 'shelter-rest') {
      if ((life.shelterBlockedUntilDay ?? 0) > game.day) return `Registration blocked until Day ${displayDay(life.shelterBlockedUntilDay ?? game.day)}.`
      if (!shelterBooked) {
        if (life.shelterRegistrationAttemptDay === game.day) return 'You already queued today. Arrive before 18:00 tomorrow.'
        if (game.minutes < 480 || game.minutes >= 1320) return 'Come back during the day to queue. Doors 18:00 · registration 18:20–22:00.'
        return null // Waiting outside is possible before the doors open.
      } else {
        if (!open) return 'Night shelter opens at 18:00.'
        if (!shelterAdmitted) return 'Entry 18:00–22:00. You are outside; missing entry counts as a missed night.'
        if (game.intoxication > 10) return 'Too intoxicated: sober up before using your bed.'
      }
    }
    if (id === 'shelter-social-worker') {
      if ((weekday(game.day) !== 'Tu' && weekday(game.day) !== 'Fr') || game.minutes < 960 || game.minutes >= 1200) return 'Social worker: Tuesday / Friday, 16:00–20:00.'
      return null // Appointment hours are separate from overnight opening hours.
    }
    if (id === 'shelter-dinner') {
      if (game.minutes < 1140 || game.minutes >= 1230) return 'Dinner 19:00–20:30.'
      if (life.shelterDinnerDay === game.day) return 'You already had dinner today.'
    }
    if (id === 'shelter-breakfast') {
      if (game.minutes < 390 || game.minutes >= 420) return 'Breakfast 06:30–07:00.'
      if (life.shelterBreakfastDay === game.day) return 'You already had breakfast today.'
    }
    if (id === 'shelter-laundry-drop') {
      if (weekday(game.day) !== 'Th' || game.minutes < 390 || game.minutes >= 480) return 'Leave laundry: Thursday, 06:30–08:00.'
      if (life.shelterLaundryDropDay === game.day) return 'Your clothes are already in the laundry.'
    }
    if (id === 'shelter-laundry-pickup') {
      if (weekday(game.day) !== 'Th' || game.minutes < 1080 || game.minutes >= 1320) return 'Collect laundry: Thursday, 18:00–22:00.'
      if (life.shelterLaundryDropDay !== game.day) return 'Leave your clothes for laundry first.'
    }
    if (!open && action.requiresOpen !== false) return `Closed · opens at ${formatTime(current.open)}.`
    if (current.id === 'shelter' && (game.minutes >= 1320 || game.minutes < 360) && id !== 'shelter-rest') return 'Quiet hours 22:00–06:00 · sleeping only.'
    if (id.endsWith('-refill-water')) {
      if (inventory.water >= FREE_WATER_LIMIT) return 'You already carry 4 or more water portions.'
      if (backpackSlots({ ...inventory, water: FREE_WATER_LIMIT }) > BACKPACK_CAPACITY) return 'Backpack full · make room for water.'
    }
    if (action.cost && game.money < action.cost) return `Need ${action.cost.toFixed(2)} zł.`
    return null
  }
