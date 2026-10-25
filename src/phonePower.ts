import { weatherAt, type GameState } from './game'
import { absoluteMinutes } from './gameTime'

export function phoneDrainMultiplier(condition: number) {
  return 1 + (100 - Math.max(0, Math.min(100, condition))) * 0.007
}


// Charge screen-on activities for each elapsed game minute so dawn, dusk,
// midnight and rain ending can change brightness within the same activity.
export function phoneScreenDrain(state: GameState, condition: number, usage: 'browsing' | 'navigation', minutes = 1) {
  let drain = 0
  for (let elapsed = 0; elapsed < minutes; elapsed++) {
    const absolute = absoluteMinutes(state) + elapsed
    const minute = absolute % 1440
    const day = Math.floor(absolute / 1440) + 1
    const daylight = minute >= 360 && minute < 1200
    const clear = weatherAt({ ...state, day, minutes: minute }).label === 'Clear'
    const hourly = (usage === 'browsing' ? 18 : 12) + (daylight ? clear ? 12 : 6 : 0)
    drain += hourly / 60 * phoneDrainMultiplier(condition) * Math.min(1, minutes - elapsed)
  }
  return drain
}

