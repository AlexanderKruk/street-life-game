import { t, type MessageKey } from './i18n'
import { weekday, type WeekdayId } from './gameTime'
import type { WeatherId } from './weather'
import type { IconName } from './Icon'

const weatherMessages = {
  Cloudy: 'weather.cloudy', Rain: 'weather.rain', Clear: 'weather.clear',
  Windy: 'weather.windy', Showers: 'weather.showers', Rainy: 'weather.rainy',
  Drizzle: 'weather.drizzle', Downpour: 'weather.downpour',
} as const satisfies Record<WeatherId, MessageKey>
const weekdayMessages = {
  Mo: 'calendar.weekday.monday', Tu: 'calendar.weekday.tuesday',
  We: 'calendar.weekday.wednesday', Th: 'calendar.weekday.thursday',
  Fr: 'calendar.weekday.friday', Sa: 'calendar.weekday.saturday',
  Su: 'calendar.weekday.sunday',
} as const satisfies Record<WeekdayId, MessageKey>

export const weatherLabel = (id: WeatherId) => t(weatherMessages[id])
export const weekdayLabel = (day: number) => t(weekdayMessages[weekday(day)])

// Preserve the existing icon policy, including rain icons between showers.
export function weatherIcon(id: WeatherId, minutes: number): IconName {
  if (id === 'Clear') return minutes >= 360 && minutes < 1200 ? 'sun' : 'moon'
  return ['Rain', 'Rainy', 'Showers', 'Drizzle', 'Downpour'].includes(id) ? 'rain' : 'cloud'
}
