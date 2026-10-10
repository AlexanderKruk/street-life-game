import { formatTime, locations } from './game'
import type { ResultPresentation } from './ResultCard'

const services: Record<string, string> = {
  support: 'Accommodation, documents and benefits',
  daycenter: 'A place indoors, shower, laundry and phone charging',
  shelter: 'Registration · wait 20 minutes · limited beds',
  shop: 'Water 3 zł · roll 1 zł · sandwich 5 zł · hot meal 8 zł',
  station: 'Waiting-room outlet · +60% charge in one hour, capped at 100%',
}

const answers: Record<string, Pick<ResultPresentation, 'heading' | 'lead' | 'notice' | 'illustration'>> = {
  morning: { heading: 'Help for tomorrow', lead: 'Places saved on your map.', notice: 'Services may be full.', illustration: '/street-life-game/assets/help-morning.webp' },
  bed: { heading: 'A place for the night', lead: 'Arrive by 19:00. A bed is not guaranteed.', notice: 'Successful registration reserves seven nights.' },
  'no-place': { heading: 'If there is no bed', lead: 'Ask Help Center about a Schronisko referral.', notice: 'Day Center is a daytime option, not an overnight bed.' },
  supplies: { heading: 'Food and water', lead: 'Use supplies in your backpack or visit the shop.', notice: 'Shelter meals are for registered guests.' },
  charging: { heading: 'An outlet at the station', lead: 'You remember the outlet in the waiting room.', notice: 'No internet needed. The station is available tonight.' },
}

export function questionPresentation(id: string, placeIds: string[], saved = false): ResultPresentation | undefined {
  const answer = answers[id]
  if (!answer) return undefined
  return {
    ...answer,
    label: saved ? 'SAVED INFORMATION' : id === 'charging' ? 'A REMEMBERED PLACE' : 'FOUND INFORMATION',
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
