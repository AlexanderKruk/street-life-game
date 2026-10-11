import { useState } from 'react'
import { formatTime, isOpen, type Location } from './game'
import { Icon, locationIcon } from './Icon'

const positions: Record<string, [number, number]> = {
  support: [18, 30], daycenter: [64, 38], hospital: [85, 19], jobcenter: [16, 9],
  shop: [26, 51], shelter: [80, 62], street: [13, 73], work: [85, 46],
  station: [49, 91], 'residential-shelter': [83, 80],
}

export default function CityMap({ places, currentId, minutes, reservedBed, routeId, onRoute }: {
  places: Location[]; currentId: string; minutes: number; reservedBed: boolean; routeId: string | null; onRoute: (id: string) => void
}) {
  const [focusedId, setFocusedId] = useState(currentId)
  const selected = places.find(place => place.id === (routeId ?? focusedId)) ?? places.find(place => place.id === currentId) ?? places[0]
  function status(place: Location) {
    if (place.id === currentId) return 'You are here'
    if (place.id === 'shelter') return reservedBed ? 'Bed reserved' : 'Registration 19:00–22:00'
    return isOpen(place, minutes) ? 'Open' : `Closed · ${formatTime(place.open)}`
  }
  if (!selected) return null
  const origin = positions[currentId]
  const target = positions[selected.id]
  return <section className="district-map" aria-label="City map">
    <div className="district-map-heading"><h2>City map</h2><span>Tap a place to explore</span></div>
    <div className="district-scene">
      <img src="/street-life-game/assets/city-night.webp" alt="Rainy city rooftops, warm windows and a railway station beside the river at night" />
      {origin && target && selected.id !== currentId && <svg className="district-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d={`M ${origin[0]} ${origin[1]} C ${origin[0] + (target[0] - origin[0]) * .55} ${origin[1]}, ${origin[0] + (target[0] - origin[0]) * .2} ${target[1]}, ${target[0]} ${target[1]}`} /></svg>}
      {places.map(place => {
        const [x, y] = positions[place.id] ?? [50, 50]
        const here = place.id === currentId
        const active = place.id === selected.id
        return <button key={place.id} className={`district-pin${x > 55 ? ' label-left' : ''}${here ? ' here' : ''}${active ? ' selected' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => setFocusedId(place.id)} aria-pressed={active} aria-label={`${place.name} ${status(place)}`}>
          <span className="district-marker" aria-hidden="true" /><span className="district-label"><strong>{place.name}</strong>{(here || active) && <small>{status(place)}</small>}</span>
        </button>
      })}
      <small className="district-note">District overview · route illustration</small>
    </div>
    <div className="district-card" aria-live="polite">
      <div className="district-place-icon"><Icon name={locationIcon(selected.id)} /></div>
      <div className="district-place-copy"><h3>{selected.name}</h3><p>{status(selected)}</p><small>{selected.id === 'shelter' ? reservedBed ? 'Use your reserved bed during admission hours.' : 'A place is not guaranteed.' : selected.description}</small></div>
      <button className="district-route-button" onClick={() => onRoute(selected.id)}>{selected.id === currentId ? 'Open location' : selected.id === 'street' ? 'Step outside' : 'Go →'}</button>
    </div>
  </section>
}
