import { formatTime, locations } from './game'
import type { ResultPresentation } from './ResultCard'

const services: Record<string, string> = {
  support: 'Accommodation, documents and benefits',
  daycenter: 'A place indoors, shower, laundry and phone charging',
  'free-clinic': 'Free basic medical care · no insurance needed',
  shelter: 'Arrive by 19:00 · 20-minute queue · 0–3 free beds',
  shop: 'Water 3 zł · roll 1 zł · sandwich 5 zł · hot meal 8 zł',
  station: 'Outlet in the waiting room · +60% charge in one hour, capped at 100%',
}

const answers: Record<string, Pick<ResultPresentation, 'heading' | 'lead' | 'notice' | 'illustration'>> = {
  morning: { heading: 'Help for tomorrow', lead: 'Places saved on your map.', notice: 'Services may be full.' },
  bed: { heading: 'A place for the night', lead: '', notice: 'A bed is not guaranteed. Successful registration reserves seven nights.' },
  'no-place': { heading: 'If there is no bed', lead: 'Try registration earlier the next evening. Ask Help Center about accommodation and a Schronisko referral.', notice: 'Day Center is daytime only. Station benches and outdoor cover do not guarantee safe sleep.' },
  supplies: { heading: 'Food and water', lead: 'You can also use supplies in your backpack.', notice: 'Registered shelter guests: dinner 19:00–20:30 · breakfast 06:30–07:00.' },
  charging: { heading: 'An outlet at the station', lead: '', notice: 'No internet needed. The station is available tonight.' },
}

export function locationPresentation(placeIds: string[], mapStatus = 'Added to map'): ResultPresentation {
  return {
    heading: 'Information found', label: 'INFORMATION', lead: '', compact: true, mapStatus,
    places: placeIds.flatMap(placeId => {
      const place = locations.find(location => location.id === placeId)
      if (!place) return []
      return [{
        id: place.id, name: place.name,
        hours: place.id === 'shelter' ? '19:00–22:00' : place.open === 0 && place.close === 1440 ? '24 hours' : `${formatTime(place.open)}–${formatTime(place.close)}`,
        detail: services[place.id] ?? place.description,
      }]
    }),
  }
}

export function questionPresentation(id: string, placeIds: string[], saved = false, alreadyKnown = false): ResultPresentation | undefined {
  const answer = answers[id]
  if (!answer) return undefined
  const places = locationPresentation(placeIds, saved ? 'Saved on map' : alreadyKnown ? 'On your map' : 'Added to map')
  return {
    ...places, ...answer,
    ...(id === 'morning' ? { heading: places.places?.[0]?.name ?? 'No new information', lead: places.places?.length ? '' : 'You found no new places.', notice: undefined } : {}),
  }
}
