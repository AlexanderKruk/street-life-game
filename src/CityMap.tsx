import { memo, useLayoutEffect, useRef, useState } from 'react'
import { isOpen, type Location } from './game'
import { Icon, locationIcon } from './Icon'
import { responsiveImageProps } from './responsiveImages'

// Percent coordinates in the 1024×1536 artwork, attached to city blocks and rail buildings.
const positions: Record<string, [number, number]> = {
  hospital: [81.3, 14.1], jobcenter: [37.3, 20.2], support: [11.2, 21.5],
  'free-clinic': [85.1, 29.8], work: [50.4, 40.5], daycenter: [11.2, 47.5],
  shelter: [89.3, 38.5], 'residential-shelter': [16.1, 63.2], station: [34.5, 65.8],
}

function hours(place: Location) {
  const shortTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}${minutes % 60 ? `:${String(minutes % 60).padStart(2, '0')}` : ''}`
  return place.open === 0 && place.close === 1440 ? '24/7' : `${shortTime(place.open)}-${shortTime(place.close)}`
}

type SceneProps = { places: Location[]; currentId: string; selectedId: string; openFlags: string; onFocus: (id: string) => void }
const DistrictScene = memo(function DistrictScene({ places, currentId, selectedId, openFlags, onFocus }: SceneProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const [projection, setProjection] = useState<{ left: number; top: number; width: number; height: number } | null>(null)
  useLayoutEffect(() => {
    const backdrop = backdropRef.current, scene = sceneRef.current
    if (!backdrop || !scene) return
    const update = () => {
      const background = backdrop.getBoundingClientRect(), area = scene.getBoundingClientRect()
      if (!background.width || !background.height) return
      const scale = Math.max(background.width / 1024, background.height / 1536)
      const width = 1024 * scale, height = 1536 * scale
      const next = { left: background.left - area.left + (background.width - width) / 2, top: background.top - area.top + (background.height - height) / 2, width, height }
      setProjection(previous => previous && Object.keys(next).every(key => previous[key as keyof typeof next] === next[key as keyof typeof next]) ? previous : next)
    }
    update()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    observer?.observe(backdrop)
    observer?.observe(scene)
    window.addEventListener('resize', update)
    return () => { observer?.disconnect(); window.removeEventListener('resize', update) }
  }, [])
  const origin = positions[currentId]
  const target = positions[selectedId]
  return <><div ref={backdropRef} className="district-backdrop">
      <img {...responsiveImageProps('/street-life-game/assets/city-map-dark.webp')} width="1024" height="1536" alt="Dark overhead city map with streets, neighborhoods, parks, a river and railway lines" />
    </div><div ref={sceneRef} className="district-scene"><div className="district-anchors" style={projection ?? undefined}>
      {origin && target && selectedId !== currentId && <svg className="district-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d={`M ${origin[0]} ${origin[1]} C ${origin[0] + (target[0] - origin[0]) * .55} ${origin[1]}, ${origin[0] + (target[0] - origin[0]) * .2} ${target[1]}, ${target[0]} ${target[1]}`} /></svg>}
      {places.map((place, index) => {
        if (place.id === 'street' || place.id === 'shop') return null
        const [x, y] = positions[place.id] ?? [50, 50]
        const here = place.id === currentId
        const active = place.id === selectedId
        const open = openFlags[index] === '1'
        return <button key={place.id} className={`district-pin${x > 55 || place.id === 'work' ? ' label-left' : ''}${here ? ' here' : ''}${active ? ' selected' : ''}${open ? '' : ' closed'}`} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => onFocus(place.id)} aria-pressed={active} aria-label={`${place.name} ${open ? 'Open' : 'Closed'} ${hours(place)}${here ? ' You are here' : ''}`}>
          <span className="district-marker" aria-hidden="true" /><span className="district-label"><strong>{place.name}</strong></span>
        </button>
      })}
    </div></div></>
})

export default function CityMap({ places, currentId, minutes, reservedBed, routeId, onRoute }: {
  places: Location[]; currentId: string; minutes: number; reservedBed: boolean; routeId: string | null; onRoute: (id: string) => void
}) {
  const [focusedId, setFocusedId] = useState(currentId)
  const selected = places.find(place => place.id === (routeId ?? focusedId)) ?? places.find(place => place.id === currentId) ?? places[0]
  if (!selected) return null
  const openFlags = places.map(place => isOpen(place, minutes) ? '1' : '0').join('')
  return <section className="district-map" aria-label="City map">
    <div className="district-map-heading"><h2>Map</h2>
      <div className="district-shortcuts" aria-label="Nearby places">
        <button className={`district-shortcut${selected.id === 'street' ? ' selected' : ''}`} disabled={currentId === 'street'} onClick={() => { setFocusedId('street'); onRoute('street') }}><Icon name="walk" /><span>Street</span></button>
        <button className={`district-shortcut${selected.id === 'shop' ? ' selected' : ''}`} disabled={currentId === 'shop'} onClick={() => { setFocusedId('shop'); onRoute('shop') }}><Icon name="shop" /><span>Nearest shop</span></button>
      </div>
    </div>
    <DistrictScene places={places} currentId={currentId} selectedId={selected.id} openFlags={openFlags} onFocus={setFocusedId} />
    <div className="district-card" aria-live="polite">
      <div className="district-place-icon"><Icon name={locationIcon(selected.id)} /></div>
      <div className="district-place-copy"><div className="district-place-heading"><h3>{selected.name}</h3><p className={`district-hours ${isOpen(selected, minutes) ? 'open' : 'closed'}`}>{hours(selected)}</p></div><small>{selected.id === 'shelter' ? reservedBed ? 'Use your reserved bed during admission hours.' : 'A place is not guaranteed.' : selected.description}</small></div>
      <button className="district-route-button" onClick={() => onRoute(selected.id)}>Go →</button>
    </div>
  </section>
}
