import type { Ref } from 'react'
import { locations } from './game'
import { formatTravelTime } from './gameTime'
import { Icon, locationIcon } from './Icon'
import ChoiceOptions from './ChoiceOptions'
import { ModalOverlay, ModalPanel } from './Modal'
import type { TravelMode } from './stateTypes'
type Props = {
  destination?: (typeof locations)[number]
  panelRef: Ref<HTMLElement>
  choiceSeed: number
  choiceDecisionKey: string
  freeTransitActive: boolean
  money: number
  onClose: () => void
  onStart: (mode: TravelMode) => void
  onFareDodge: () => void
}
export default function TravelPlanningDialog({ destination, panelRef, choiceSeed, choiceDecisionKey, freeTransitActive, money, onClose, onStart, onFareDodge }: Props) {
  if (!destination) return null
      const transitMinutes = Math.ceil(destination.travelMinutes * 0.5)
      const nearbyTime = destination.travelRange ? `${destination.travelRange.min}–${destination.travelRange.max}m` : null
  return <ModalOverlay className="travel-choice-overlay"><ModalPanel className="travel-sheet" role="dialog" aria-modal="true" aria-label={`Travel to ${destination.name}`} tabIndex={-1} ref={panelRef}>
        <button className="sheet-close" aria-label="Close travel options" onClick={() => onClose()}>×</button>
        <p className="eyebrow">TRAVEL TO</p>
        <h2><Icon name={locationIcon(destination.id)} /> {destination.name}</h2>
        <ChoiceOptions seed={choiceSeed} decision={`${choiceDecisionKey}|travel:${destination.id}`}>
        <button className="travel-option" onClick={() => onStart('walk')}>
          <img className="travel-option-walker" src="/street-life-game/assets/travel-walker.webp" width="24" height="24" alt="" aria-hidden="true" /><div><strong>Walk</strong><small>≈{nearbyTime ?? formatTravelTime(destination.travelMinutes)} · free · more hunger & thirst</small></div>
        </button>
        <button className="travel-option" onClick={() => onStart('transit')} disabled={!freeTransitActive && money < 4.4}>
          <Icon name="bus" /><div><strong>Public transport</strong><small>≈{nearbyTime ?? formatTravelTime(transitMinutes)} · {freeTransitActive ? 'FREE' : '4.40 zł'} · {nearbyTime ? 'includes waiting' : 'less physical strain'}</small></div>
        </button>
        {!freeTransitActive && <button className="travel-option" onClick={onFareDodge}>
          <Icon name="coins" /><div><strong>Ride without ticket</strong><small>≈{nearbyTime ?? formatTravelTime(transitMinutes)} · free{nearbyTime ? ' · includes waiting' : ''}</small><small>Risk: 20–35 zł fine</small></div>
        </button>}
        </ChoiceOptions>

      </ModalPanel></ModalOverlay>
}
