// Stable domain identities, never player-facing labels or translation keys.
// Retain the established values used by weather, events and illness rules.
export type WeatherId = 'Cloudy' | 'Rain' | 'Clear' | 'Windy' | 'Showers' | 'Rainy' | 'Drizzle' | 'Downpour'
export type WeatherConditions = {
  id: WeatherId
  icon: string
  temp: number
  energyDrain: number
  thirstDrain: number
}
