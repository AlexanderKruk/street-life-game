import { locations } from './game'
import { t } from './i18n'
import { locationName, locationHours, locationService } from './locationText'
import type { ResultPresentation } from './ResultCard'

const answers: Record<string, Pick<ResultPresentation, 'heading' | 'lead' | 'notice' | 'illustration'>> = {
  morning: { heading: t('phone.answer.morning.heading'), lead: t('phone.answer.morning.lead'), notice: t('phone.answer.morning.notice') },
  bed: { heading: t('phone.answer.bed.heading'), lead: '' },
  'no-place': { heading: t('phone.answer.no-place.heading'), lead: t('phone.answer.no-place.lead'), notice: t('phone.answer.no-place.notice') },
  supplies: { heading: t('phone.answer.supplies.heading'), lead: '' },
  work: { heading: t('phone.answer.work.heading'), lead: '', notice: t('phone.answer.work.notice') },
  clinic: { heading: t('phone.answer.clinic.heading'), lead: '', notice: t('phone.answer.clinic.notice') },
  charging: { heading: t('phone.answer.charging.heading'), lead: '', notice: t('phone.answer.charging.notice') },
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
    ...(id === 'morning' ? { heading: places.places?.[0]?.name ?? t('phone.answer.noInfo'), lead: places.places?.length ? '' : t('phone.answer.noPlaces'), notice: undefined } : {}),
  }
}
