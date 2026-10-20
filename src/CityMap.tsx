import { memo, useState } from 'react'
import { isOpen, type Location } from './game'
import { Icon, locationIcon } from './Icon'
import { responsiveImageProps } from './responsiveImages'

const positions: Record<string, [number, number]> = {
  jobcenter: [6, 6], hospital: [94, 6], support: [6, 26], 'free-clinic': [94, 26],
  daycenter: [6, 46], work: [94, 46], shelter: [94, 65],
  'residential-shelter': [6, 80], station: [36, 95],
}

function hours(place: Location) {
  const shortTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}${minutes % 60 ? `:${String(minutes % 60).padStart(2, '0')}` : ''}`
  return place.open === 0 && place.close === 1440 ? '24/7' : `${shortTime(place.open)}-${shortTime(place.close)}`
}

type SceneProps = { places: Location[]; currentId: string; selectedId: string; openFlags: string; onFocus: (id: string) => void }
const DistrictScene = memo(function DistrictScene({ places, currentId, selectedId, openFlags, onFocus }: SceneProps) {
  const origin = positions[currentId]
  const target = positions[selectedId]
  return <><div className="district-backdrop">
      <img {...responsiveImageProps('/street-life-game/assets/city-map-dark.webp')} width="1024" height="1536" alt="Dark overhead city map with streets, neighborhoods, parks, a river and railway lines" />
    </div><div className="district-scene">
      {origin && target && selectedId !== currentId && <svg className="district-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d={`M ${origin[0]} ${origin[1]} C ${origin[0] + (target[0] - origin[0]) * .55} ${origin[1]}, ${origin[0] + (target[0] - origin[0]) * .2} ${target[1]}, ${target[0]} ${target[1]}`} /></svg>}
      {places.map((place, index) => {
        if (place.id === 'street' || place.id === 'shop') return null
        const [x, y] = positions[place.id] ?? [50, 50]
        const here = place.id === currentId
        const active = place.id === selectedId
        const open = openFlags[index] === '1'
        return <button key={place.id} className={`district-pin${x > 55 ? ' label-left' : ''}${here ? ' here' : ''}${active ? ' selected' : ''}${open ? '' : ' closed'}`} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => onFocus(place.id)} aria-pressed={active} aria-label={`${place.name} ${open ? 'Open' : 'Closed'} ${hours(place)}${here ? ' You are here' : ''}`}>
          <span className="district-marker" aria-hidden="true" /><span className="district-label"><strong>{place.name}</strong></span>
        </button>
      })}
    </div></>
})

export default function CityMap({ places, currentId, minutes, reservedBed, routeId, onRoute }: {
  places: Location[]; currentId: string; minutes: number; reservedBed: boolean; routeId: string | null; onRoute: (id: string) => void
}) {
  const [focusedId, setFocusedId] = useState(currentId)
  const selected = places.find(place => place.id === (routeId ?? focusedId)) ?? places.find(place => place.id === currentId) ?? places[0]
  if (!selected) return null
  const openFlags = places.map(place => isOpen(place, minutes) ? '1' : '0').join('')
  return <section className="district-map" aria-label="City map">
    <div className="district-map-heading"><h2>City map</h2></div>
    <div className="district-shortcuts" aria-label="Nearby places">
      <button className={`district-shortcut${selected.id === 'street' ? ' selected' : ''}`} disabled={currentId === 'street'} onClick={() => { setFocusedId('street'); onRoute('street') }}><Icon name="walk" /><span>Street</span></button>
      <button className={`district-shortcut${selected.id === 'shop' ? ' selected' : ''}`} disabled={currentId === 'shop'} onClick={() => { setFocusedId('shop'); onRoute('shop') }}><Icon name="shop" /><span>Nearest shop</span></button>
    </div>
    <DistrictScene places={places} currentId={currentId} selectedId={selected.id} openFlags={openFlags} onFocus={setFocusedId} />
    <div className="district-card" aria-live="polite">
      <div className="district-place-icon"><Icon name={locationIcon(selected.id)} /></div>
      <div className="district-place-copy"><div className="district-place-heading"><h3>{selected.name}</h3><p className={`district-hours ${isOpen(selected, minutes) ? 'open' : 'closed'}`}>{hours(selected)}</p></div><small>{selected.id === 'shelter' ? reservedBed ? 'Use your reserved bed during admission hours.' : 'A place is not guaranteed.' : selected.description}</small></div>
      <button className="district-route-button" onClick={() => onRoute(selected.id)}>Go →</button>
    </div>
  </section>
}
