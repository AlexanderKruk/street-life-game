import type { Ref } from 'react'
import { locations } from './game'
import ChoiceButton from './ChoiceButton'
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
      const estimate = (minutes: number) => destination.travelRange ? { minutes: destination.travelRange.min, maxMinutes: destination.travelRange.max } : { minutes }
  return <ModalOverlay className="travel-choice-overlay"><ModalPanel className="travel-sheet" role="dialog" aria-modal="true" aria-label={`Travel to ${destination.name}`} tabIndex={-1} ref={panelRef}>
        <button className="sheet-close" aria-label="Close travel options" onClick={() => onClose()}>×</button>
        <p className="eyebrow">TRAVEL TO</p>
        <h2><Icon name={locationIcon(destination.id)} /> {destination.name}</h2>
        <ChoiceOptions seed={choiceSeed} decision={`${choiceDecisionKey}|travel:${destination.id}`}>
        <ChoiceButton className="travel-option" data-order-id="travel:walk" icon="person" label="Walk" estimate={estimate(destination.travelMinutes)} onClick={() => onStart('walk')} detail={<small>free · more hunger &amp; thirst</small>} />
        <ChoiceButton className="travel-option" data-order-id="travel:transit" icon="bus" label="Public transport" estimate={estimate(transitMinutes)} onClick={() => onStart('transit')} disabled={!freeTransitActive && money < 4.4} detail={<small>{freeTransitActive ? 'FREE' : '4.40 zł'} · {destination.travelRange ? 'includes waiting' : 'less physical strain'}</small>} />
        {!freeTransitActive && <ChoiceButton className="travel-option" data-order-id="travel:fare-dodge" icon="coins" label="Ride without ticket" estimate={estimate(transitMinutes)} onClick={onFareDodge} detail={<><small>free{destination.travelRange ? ' · includes waiting' : ''}</small><small className="choice-description">Risk: 20–35 zł fine</small></>} />}
        </ChoiceOptions>

      </ModalPanel></ModalOverlay>
}
