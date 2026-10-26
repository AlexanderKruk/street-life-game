import { t } from './i18n'
import { formatMoney } from './i18n/formatters'
import { locationName } from './locationText'
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
  return <ModalOverlay className="travel-choice-overlay"><ModalPanel className="travel-sheet" role="dialog" aria-modal="true" aria-label={t('travel.plan.accessible', { place: locationName(destination.id) })} tabIndex={-1} ref={panelRef}>
        <button className="sheet-close" aria-label={t('travel.plan.close')} onClick={() => onClose()}>×</button>
        <p className="eyebrow">{t('travel.plan.label')}</p>
        <h2><Icon name={locationIcon(destination.id)} /> {locationName(destination.id)}</h2>
        <ChoiceOptions seed={choiceSeed} decision={`${choiceDecisionKey}|travel:${destination.id}`}>
        <ChoiceButton className="travel-option" data-order-id="travel:walk" icon="person" label={t('travel.plan.walk')} estimate={estimate(destination.travelMinutes)} onClick={() => onStart('walk')} detail={<small>{t('travel.plan.walkDetail')}</small>} />
        <ChoiceButton className="travel-option" data-order-id="travel:transit" icon="bus" label={t('travel.plan.transit')} estimate={estimate(transitMinutes)} onClick={() => onStart('transit')} disabled={!freeTransitActive && money < 4.4} detail={<small>{freeTransitActive ? t(destination.travelRange ? 'travel.plan.freeWaiting' : 'travel.plan.freeStrain') : t(destination.travelRange ? 'travel.plan.paidWaiting' : 'travel.plan.paidStrain', { fare: formatMoney(4.4, true) })}</small>} />
        {!freeTransitActive && <ChoiceButton className="travel-option" data-order-id="travel:fare-dodge" icon="coins" label={t('travel.plan.fareDodge')} estimate={estimate(transitMinutes)} onClick={onFareDodge} detail={<><small>{t(destination.travelRange ? 'travel.plan.dodgeWaiting' : 'travel.plan.dodgeDetail')}</small><small className="choice-description">{t('travel.plan.risk')}</small></>} />}
        </ChoiceOptions>

      </ModalPanel></ModalOverlay>
}
