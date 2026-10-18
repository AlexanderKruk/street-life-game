import { memo } from 'react'
import { formatTime } from './game'
import { responsiveImageProps } from './responsiveImages'
import { Icon, locationIcon } from './Icon'

type ArtProps = { phone: boolean; inline: boolean; illustration?: string; night: boolean }
export const StreetArt = memo(function StreetArt({ phone, inline, illustration, night }: ArtProps) {
  const source = phone ? '/street-life-game/assets/phone-search.webp' : illustration ?? '/street-life-game/assets/street-hero.webp'
  return <div className={`street-art${phone || inline ? ' phone-art' : !illustration && night ? ' night' : ''}`} aria-hidden="true">
    <img {...responsiveImageProps(source)} alt="" width="1400" height={phone || inline ? 1050 : 788} fetchPriority="high" />
    {illustration && <span className="result-art-caption">Looking ahead</span>}
  </div>
})

type SummaryProps = { id: string; name: string; description: string; open: boolean; opensAt: number }
export const LocationSummary = memo(function LocationSummary({ id, name, description, open, opensAt }: SummaryProps) {
  return <section className={id === 'street' ? 'current location-summary story-scene' : 'current location-summary'}>
    {id !== 'street' && <div className="location-icon"><Icon name={locationIcon(id)} /></div>}
    <div><p className="eyebrow">{id === 'street' ? 'A MOMENT ON THE STREET' : `YOU ARE HERE · ${open ? 'OPEN' : `CLOSED · OPENS AT ${formatTime(opensAt)}`}`} </p><h2>{name}</h2><p>{description}</p></div>
  </section>
})

type ShopHeroProps = { name: string; open: boolean; opensAt: number; closesAt: number }
export const ShopHero = memo(function ShopHero({ name, open, opensAt, closesAt }: ShopHeroProps) {
  return <section className="shop-hero" aria-label="Shop"><img {...responsiveImageProps('/street-life-game/assets/shop-interior.webp')} className="shop-hero-image" alt="" aria-hidden="true" /><h2>{name}</h2><p>{open ? 'Open' : 'Closed'} · {formatTime(opensAt)}–{formatTime(closesAt)}</p></section>
})

type TravelHeadingProps = { from: string; to?: string; walking: boolean }
export const TravelHeading = memo(function TravelHeading({ from, to, walking }: TravelHeadingProps) {
  return <>
    <div className={`travel-visual ${walking ? 'walking' : 'transit'}`} aria-hidden="true">
      <span className={walking ? 'travel-path' : 'travel-trail'}><b /><b /><b />{walking && <b />}</span>
      {walking
        ? <img className="travel-walker" src="/street-life-game/assets/travel-walker.webp" width="90" height="90" alt="" />
        : <Icon name="bus" className="travel-bus" />}
    </div>
    <div className="travel-route-heading"><p>{walking ? 'Walking' : 'Public transport'}</p><h2>{from} <span>→</span> {to}</h2></div>
  </>
})

export const PhoneSearchIcon = memo(function PhoneSearchIcon() {
  return <div className="travel-visual phone-search-icon" aria-hidden="true">
    <Icon name="phone" className="phone-search-outline" />
    <Icon name="globe" className="phone-search-globe" />
    <span className="phone-activity-symbol"><span /><span /><span /></span>
  </div>
})

type SleepHeadingProps = { kind: 'ground' | 'bench' | 'shelter' | 'residential' }
export const SleepHeading = memo(function SleepHeading({ kind }: SleepHeadingProps) {
  return <div className="timed-heading"><Icon name="moon" /><div>
    <p className="eyebrow">SLEEPING</p>
    <h2>{kind === 'ground' ? 'On the ground' : kind === 'bench' ? 'On the bench' : kind === 'shelter' ? 'Night shelter' : 'Schronisko'}</h2>
  </div></div>
})
