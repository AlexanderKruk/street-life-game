import { sleepKindLabel } from './sleepText'
import { t } from './i18n'
import { memo } from 'react'
import { formatTime } from './game'
import { responsiveImageProps } from './responsiveImages'
import { Icon, locationIcon } from './Icon'

type ArtProps = { phone: boolean; inline: boolean; illustration?: string; night: boolean }
export const StreetArt = memo(function StreetArt({ phone, inline, illustration, night }: ArtProps) {
  const source = phone ? '/street-life-game/assets/phone-search.webp' : illustration ?? '/street-life-game/assets/street-hero.webp'
  return <div className={`street-art${phone || inline ? ' phone-art' : !illustration && night ? ' night' : ''}`} aria-hidden="true">
    <img {...responsiveImageProps(source)} alt="" width="1400" height={phone || inline ? 1050 : 788} fetchPriority="high" />
    {illustration && <span className="result-art-caption">{t('location.artCaption')}</span>}
  </div>
})

type SummaryProps = { id: string; name: string; description: string; open: boolean; opensAt: number; night?: boolean; streetIllustration?: string }
const locationIllustrations: Record<string, string> = {
  station: 'location-station',
  shelter: 'location-night-shelter',
  support: 'location-help-center',
  'residential-shelter': 'location-residential-shelter',
  daycenter: 'location-day-center',
  'free-clinic': 'location-free-clinic',
  hospital: 'location-hospital',
  jobcenter: 'location-job-center',
  work: 'location-day-work',
}
export const LocationSummary = memo(function LocationSummary({ id, name, description, open, opensAt, night = false, streetIllustration }: SummaryProps) {
  const illustration = locationIllustrations[id]
  return <section className={`current location-summary${id === 'street' ? ' story-scene location-hero' : illustration ? ' location-hero' : ''}`} data-location-id={id}>
    {id === 'street' && <StreetArt phone={false} inline={false} illustration={streetIllustration} night={night} />}
    {illustration && <img key={illustration} className="location-hero-image" {...responsiveImageProps(`/street-life-game/assets/${illustration}.webp`)} width="1600" height="900" alt="" aria-hidden="true" fetchPriority="high" />}
    {id !== 'street' && <div className="location-icon"><Icon name={locationIcon(id)} /></div>}
    <div>{id === 'street' ? <p className="eyebrow">{t('location.street.eyebrow')}</p> : !open && <p className="eyebrow">{t('location.closedEyebrow', { time: formatTime(opensAt) })}</p>}<h2>{name}</h2><p>{description}</p></div>
  </section>
})

type ShopHeroProps = { name: string; open: boolean; opensAt: number; closesAt: number }
export const ShopHero = memo(function ShopHero({ name, open, opensAt, closesAt }: ShopHeroProps) {
  return <section className="shop-hero" aria-label={t('location.shopAccessible')}><img {...responsiveImageProps('/street-life-game/assets/shop-interior.webp')} className="shop-hero-image" alt="" aria-hidden="true" /><h2>{name}</h2><p>{t(open ? 'location.shop.openHours' : 'location.shop.closedHours', { open: formatTime(opensAt), close: formatTime(closesAt) })}</p></section>
})

type TravelHeadingProps = { from: string; to?: string; walking: boolean; moving?: boolean }
export const TravelHeading = memo(function TravelHeading({ from, to, walking, moving = true }: TravelHeadingProps) {
  return <>
    <div className={`travel-visual ${walking ? 'walking' : 'transit'}${moving ? '' : ' waiting'}`} aria-hidden="true">
      <span className={walking ? 'travel-path' : 'travel-trail'}><b /><b /><b />{walking && <b />}</span>
      {walking
        ? <img className="travel-walker" src="/street-life-game/assets/travel-walker.webp" width="90" height="90" alt="" />
        : <Icon name="bus" className="travel-bus" />}
    </div>
    <div className="travel-route-heading">
      <h2 className="travel-route-summary">{from} <span>→</span> {to}</h2>
    </div>
  </>
})

export const RainActivityIcon = memo(function RainActivityIcon({ searching }: { searching: boolean }) {
  return <div className={`travel-visual walking rain-activity-icon${searching ? ' searching' : ' waiting'}`} aria-hidden="true">
    {!searching && <svg className="rain-canopy" viewBox="0 0 98 98" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M10 89V12H64" /></svg>}
    <img className="travel-walker" src="/street-life-game/assets/travel-walker.webp" width="90" height="90" alt="" />
    <span className="activity-rain"><i /><i /><i /><i /><i /><i /></span>
  </div>
})

export const PhoneSearchIcon = memo(function PhoneSearchIcon({ calling = false }: { calling?: boolean }) {
  return <div className="travel-visual phone-search-icon" aria-hidden="true">
    <Icon name="phone" className="phone-search-outline" />
    {!calling && <Icon name="globe" className="phone-search-globe" />}
    <span className="phone-activity-symbol"><span /><span /><span /></span>
  </div>
})

type SleepHeadingProps = { kind: 'ground' | 'bench' | 'shelter' | 'residential' }
export const SleepHeading = memo(function SleepHeading({ kind }: SleepHeadingProps) {
  return <div className="timed-heading"><Icon name="moon" /><div>
    <p className="eyebrow">{t('sleep.progress.label')}</p>
    <h2>{sleepKindLabel(kind)}</h2>
  </div></div>
})
