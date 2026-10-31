import { t } from './i18n'
import { formatTime, type Location, type LocationId } from './game'

const locationIds = {
  street: true, station: true, shop: true, shelter: true, support: true,
  'residential-shelter': true, daycenter: true, 'free-clinic': true,
  hospital: true, jobcenter: true, work: true,
} satisfies Record<LocationId, boolean>
const knownLocation = (id: string): id is LocationId => Object.hasOwn(locationIds, id)

export function locationName(id: string) { return knownLocation(id) ? t(`location.name.${id}`) : t('location.unknown') }
export function locationDescription(id: string) { return knownLocation(id) ? t(`location.description.${id}`) : '' }
export function locationService(id: LocationId) {
  return id === 'support' || id === 'daycenter' || id === 'free-clinic' || id === 'shelter' || id === 'shop' || id === 'station'
    ? t(`location.service.${id}`) : locationDescription(id)
}

export function formatOpeningTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}${minutes % 60 ? `:${String(minutes % 60).padStart(2, '0')}` : ''}`
}

// Keep the map's compact hours distinct from the full discovery/Notes format.
export function locationHours(place: Pick<Location, 'open' | 'close'>, context: 'map' | 'result' = 'result') {
  if (place.open === 0 && place.close === 1440) return t(context === 'map' ? 'location.hours.allDayMap' : 'location.hours.allDayResult')
  const time = (minutes: number) => context === 'map'
    ? formatOpeningTime(minutes)
    : formatTime(minutes)
  return t(context === 'map' ? 'location.hours.mapRange' : 'location.hours.range', { open: time(place.open), close: time(place.close) })
}
export function mapPinAccessible(place: Location, open: boolean, here: boolean) {
  return t(open ? here ? 'location.pin.openHere' : 'location.pin.open' : here ? 'location.pin.closedHere' : 'location.pin.closed', { place: locationName(place.id), hours: locationHours(place, 'map') })
}
