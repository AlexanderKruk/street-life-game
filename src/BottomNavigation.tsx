import { conditionBand, type Location } from './game'
import type { Screen } from './stateTypes'
import { Icon, locationIcon, type IconName } from './Icon'

type Props = { screen: Screen; blocked: boolean; phoneBusy: boolean; travelling: boolean; current: Pick<Location, 'id' | 'name'>; mood: number; onNavigate: (screen: Screen) => void }
export default function BottomNavigation({ screen, blocked, phoneBusy, travelling, current, mood, onNavigate }: Props) {
  const moodBand = conditionBand(mood)
  const nav = (target: Screen, icon: IconName, label: string) =>
    <button disabled={phoneBusy || travelling || blocked} className={screen === target ? 'nav-item active' : 'nav-item'} aria-current={screen === target ? 'page' : undefined} onClick={() => onNavigate(target)}><Icon name={icon} /><small>{label}</small></button>
  return <nav inert={blocked} aria-hidden={blocked || undefined} className={`bottom-nav${screen === 'travel' || phoneBusy ? ' travelling' : ''}${blocked ? ' event-background-blocked' : ''}`} aria-label="Main navigation">
      {nav('map', 'map', 'Map')}
      {nav('inventory', 'backpack', 'Inventory')}
      <button disabled={phoneBusy || travelling || blocked} className={screen === 'location' ? 'nav-item home active' : 'nav-item home'} aria-current={screen === 'location' ? 'page' : undefined} onClick={() => onNavigate('location')}><Icon name={locationIcon(current.id)} /><small>{current.name}</small></button>
      <button disabled={phoneBusy || travelling || blocked} className={screen === 'status' ? 'nav-item active' : 'nav-item'} aria-current={screen === 'status' ? 'page' : undefined} onClick={() => onNavigate('status')} aria-label="Status" title={moodBand.label}><Icon name="person" /><small>Status</small><i className={`nav-condition ${moodBand.level}`} aria-hidden="true" /></button>
      {nav('phone', 'phone', 'Phone')}
    </nav>
}
