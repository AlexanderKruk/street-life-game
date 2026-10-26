import { t } from './i18n'
import { formatTime } from './game'
import { locationName, locationDescription, locationHours, mapPinAccessible } from './locationText'
import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { isOpen, type Location } from './game'
import { Icon, locationIcon } from './Icon'
import { responsiveImageProps } from './responsiveImages'

// Percent coordinates in the 1024×1536 artwork, attached to city blocks and rail buildings.
const positions: Record<string, [number, number]> = {
  hospital: [81.3, 14.1], jobcenter: [37.3, 20.2], support: [11.2, 21.5],
  'free-clinic': [85.1, 29.8], work: [50.4, 40.5], daycenter: [11.2, 47.5],
  shelter: [89.3, 38.5], 'residential-shelter': [16.1, 63.2], station: [34.5, 65.8],
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
  return <div className="district-plot"><div ref={backdropRef} className="district-backdrop">
      <img {...responsiveImageProps('/street-life-game/assets/city-map-dark.webp')} width="1024" height="1536" alt={t('location.mapAlt')} />
    </div><div ref={sceneRef} className="district-scene"><div className="district-anchors" style={projection ?? undefined}>
      {origin && target && selectedId !== currentId && <svg className="district-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d={`M ${origin[0]} ${origin[1]} C ${origin[0] + (target[0] - origin[0]) * .55} ${origin[1]}, ${origin[0] + (target[0] - origin[0]) * .2} ${target[1]}, ${target[0]} ${target[1]}`} /></svg>}
      {places.map((place, index) => {
        if (place.id === 'street' || place.id === 'shop') return null
        const [x, y] = positions[place.id] ?? [50, 50]
        const here = place.id === currentId
        const active = place.id === selectedId
        const open = openFlags[index] === '1'
        return <button key={place.id} className={`district-pin${x > 55 || place.id === 'work' ? ' label-left' : ''}${here ? ' here' : ''}${active ? ' selected' : ''}${open ? '' : ' closed'}`} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => onFocus(place.id)} aria-pressed={active} aria-label={mapPinAccessible(place, open, here)}>
          <span className="district-marker" aria-hidden="true" /><span className="district-label"><strong>{locationName(place.id)}</strong></span>
        </button>
      })}
    </div></div></div>
})

export default function CityMap({ places, currentId, initialFocusId, minutes, reservedBed, routeId, onRoute }: {
  places: Location[]; currentId: string; initialFocusId?: string; minutes: number; reservedBed: boolean; routeId: string | null; onRoute: (id: string) => void
}) {
  const [focusedId, setFocusedId] = useState(initialFocusId ?? currentId)
  const selected = places.find(place => place.id === (routeId ?? focusedId)) ?? places.find(place => place.id === currentId) ?? places[0]
  const shop = places.find(place => place.id === 'shop')
  const hour = Math.floor(minutes / 60)
  const shopOpen = useMemo(() => !!shop && isOpen(shop, hour * 60), [shop, hour])
  if (!selected) return null
  const shopHours = shop ? shopOpen ? t('location.map.shopOpen', { open: formatTime(shop.open), close: formatTime(shop.close) }) : t('location.opensAt', { time: formatTime(shop.open) }) : ''
  const openFlags = places.map(place => (place.id === 'shop' ? shopOpen : isOpen(place, minutes)) ? '1' : '0').join('')
  return <section className="district-map" aria-label={t('location.mapAccessible')}>
    <div className="district-map-heading">
      <div className="district-shortcuts" aria-label={t('location.nearbyAccessible')}>
        <button className={`district-shortcut${selected.id === 'street' ? ' selected' : ''}`} aria-label={locationName('street')} aria-describedby="street-shortcut-hours" onClick={() => { setFocusedId('street'); onRoute('street') }}><Icon name="walk" /><span className="district-shortcut-copy"><span>{locationName('street')}</span><small id="street-shortcut-hours">{t('location.map.openAllDay')}</small></span></button>
        <button className={`district-shortcut${selected.id === 'shop' ? ' selected' : ''}`} aria-label={locationName('shop')} aria-describedby="shop-shortcut-hours" disabled={!shopOpen} onClick={() => { setFocusedId('shop'); onRoute('shop') }}><Icon name="shop" /><span className="district-shortcut-copy"><span>{locationName('shop')}</span><small id="shop-shortcut-hours">{shopHours}</small></span></button>
      </div>
    </div>
    <DistrictScene places={places} currentId={currentId} selectedId={selected.id} openFlags={openFlags} onFocus={setFocusedId} />
    {selected.id !== 'street' && selected.id !== 'shop' && <div className="district-card" aria-live="polite">
      <div className="district-place-icon"><Icon name={locationIcon(selected.id)} /></div>
      <div className="district-place-copy"><div className="district-place-heading"><h3>{locationName(selected.id)}</h3><p className={`district-hours ${isOpen(selected, minutes) ? 'open' : 'closed'}`}>{locationHours(selected, 'map')}</p></div><small>{selected.id === 'shelter' ? reservedBed ? t('location.map.shelterReserved') : t('location.map.shelterUnreserved') : locationDescription(selected.id)}</small></div>
      <button className="district-route-button" onClick={() => onRoute(selected.id)}>{t('location.map.go')}</button>
    </div>}
  </section>
}
