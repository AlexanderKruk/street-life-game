import { locations } from './game'
import { t } from './i18n'
import { locationName, locationHours, locationService } from './locationText'
import type { ResultPresentation } from './ResultCard'

const answers: Record<string, Pick<ResultPresentation, 'heading' | 'lead' | 'notice' | 'illustration'>> = {
  morning: { heading: 'Help for tomorrow', lead: 'Places saved on your map.', notice: 'Services may be full.' },
  bed: { heading: 'A place for the night', lead: '' },
  'no-place': { heading: 'If there is no bed', lead: 'Try registration earlier the next evening. Ask Help Center about accommodation and a Schronisko referral.', notice: 'Day Center is daytime only. Station benches and outdoor cover do not guarantee safe sleep.' },
  supplies: { heading: 'Food and water', lead: '' },
  work: { heading: 'Day work', lead: '', notice: 'Check the opening hours and arrive with enough energy for a shift.' },
  clinic: { heading: 'Free medical help', lead: '', notice: 'No insurance needed for basic care.' },
  charging: { heading: 'An outlet at the station', lead: '', notice: 'No internet needed. The station is open around the clock.' },
}

export function locationPresentation(placeIds: string[], mapStatus = t('location.onMap')): ResultPresentation {
  return {
    heading: t('location.informationTitle'), label: t('location.informationLabel'), lead: '', compact: true, mapStatus,
    places: placeIds.flatMap(placeId => {
      const place = locations.find(location => location.id === placeId)
      if (!place) return []
      return [{
        id: place.id, name: locationName(place.id),
        hours: locationHours(place),
        detail: locationService(place.id),
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
