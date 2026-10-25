import { formatTime, locations } from './game'
import type { ResultPresentation } from './ResultCard'

const services: Record<string, string> = {
  support: 'Accommodation, documents and benefits',
  daycenter: 'A place indoors, shower, laundry and phone charging',
  'free-clinic': 'Free basic medical care · no insurance needed',
  shelter: 'A bed for the night, meals and a shower. Try to arrive before 18:00 for a better chance of getting a bed.',
  shop: 'A small shop selling affordable food and water. Registered Night Shelter guests can also get free meals.',
  station: 'Outlet in the waiting room · +60% charge in one hour, capped at 100%',
}

const answers: Record<string, Pick<ResultPresentation, 'heading' | 'lead' | 'notice' | 'illustration'>> = {
  morning: { heading: 'Help for tomorrow', lead: 'Places saved on your map.', notice: 'Services may be full.' },
  bed: { heading: 'A place for the night', lead: '' },
  'no-place': { heading: 'If there is no bed', lead: 'Try registration earlier the next evening. Ask Help Center about accommodation and a Schronisko referral.', notice: 'Day Center is daytime only. Station benches and outdoor cover do not guarantee safe sleep.' },
  supplies: { heading: 'Food and water', lead: '' },
  work: { heading: 'Day work', lead: '', notice: 'Check the opening hours and arrive with enough energy for a shift.' },
  clinic: { heading: 'Free medical help', lead: '', notice: 'No insurance needed for basic care.' },
  charging: { heading: 'An outlet at the station', lead: '', notice: 'No internet needed. The station is open around the clock.' },
}

export function locationPresentation(placeIds: string[], mapStatus = 'On map'): ResultPresentation {
  return {
    heading: 'Information found', label: 'INFORMATION', lead: '', compact: true, mapStatus,
    places: placeIds.flatMap(placeId => {
      const place = locations.find(location => location.id === placeId)
      if (!place) return []
      return [{
        id: place.id, name: place.name,
        hours: place.open === 0 && place.close === 1440 ? '24 hours' : `${formatTime(place.open)}–${formatTime(place.close)}`,
        detail: services[place.id] ?? place.description,
      }]
    }),
  }
}

export function questionPresentation(id: string, placeIds: string[], _saved = false, _alreadyKnown = false): ResultPresentation | undefined {
  const answer = answers[id]
  if (!answer) return undefined
  const places = locationPresentation(placeIds)
  return {
    ...places, ...answer,
    ...(id === 'morning' ? { heading: places.places?.[0]?.name ?? 'No new information', lead: places.places?.length ? '' : 'You found no new places.', notice: undefined } : {}),
  }
}
