import { isOpen, type Location } from './game'

export const CLOSING_NOTICE_KEY = 'street-life-closing-notice-v1'

export function locationClosedSince(place: Location, from: number, to: number) {
  // Night Shelter has its own morning checkout; 24-hour places never close.
  if (place.id === 'shelter' || (place.open === 0 && place.close === 1440) || to <= from || !isOpen(place, from % 1440)) return false
  const nextClose = Math.floor((from - place.close) / 1440 + 1) * 1440 + place.close
  return to >= nextClose
}
