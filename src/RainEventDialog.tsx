import { rainOpening, rainWaitingAlt, rainWaitingText } from './rainText'
import type { Ref } from 'react'
import ActivityStatus from './ActivityStatus'
import { t } from './i18n'
import ChoiceButton from './ChoiceButton'
import ChoiceOptions from './ChoiceOptions'
import { EventBody, EventFrame } from './EventDialog'
import { rainArt, type RainChoice, type RainEpisode } from './rain'

type Props = {
  rain: RainEpisode
  waiting: boolean
  elapsed: number
  orderSeed: number
  decisionKey: string
  panelRef: Ref<HTMLElement>
  onChoose: (choice: RainChoice) => void
  onFindProperShelter: () => void
  onContinue: () => void
}

export default function RainEventDialog({ rain, waiting, elapsed, orderSeed, decisionKey, panelRef, onChoose, onFindProperShelter, onContinue }: Props) {
  const opening = rainOpening(rain.level)
  const waitingText = rainWaitingText(rain)
  const illustrationAlt = waiting ? rainWaitingAlt(rain) : opening.text
  return <EventFrame titleId="rain-event-title" illustration={rainArt(rain, waiting ? rain.choice! : 'opening')} illustrationAlt={illustrationAlt} panelRef={panelRef}>
    <EventBody titleId="rain-event-title" title={opening.title} label={t(waiting ? 'rain.wait.label' : 'rain.opening.label')} description={waiting ? waitingText : opening.text}>
      {waiting ? <>
        <ActivityStatus elapsed={elapsed} timeLabel={t('rain.wait.elapsedAccessible')} label={t(rain.searchRemaining > 0 ? 'rain.wait.searchingPhase' : 'rain.wait.waitingPhase')} />
        {rain.choice === 'nearby' && <ChoiceButton icon="search" aria-label={t('rain.choice.proper')} label={t('rain.choice.proper')} duration={t('choice.duration.searchMinutes', { minutes: 5 })} onClick={onFindProperShelter} detail={<small>{t('rain.wait.properDetail')}</small>} />}
        <ChoiceButton icon="walk" aria-label={t('rain.choice.continue')} label={t('rain.choice.continue')} onClick={onContinue} detail={<small>{t('rain.wait.continueDetail')}</small>} />
      </> : <ChoiceOptions className="event-choices" seed={orderSeed} decision={`${decisionKey}|rain:${rain.id}`}>
        <ChoiceButton icon="umbrella" aria-label={t('rain.choice.nearby')} label={t('rain.choice.nearby')} data-order-id="rain:nearby" onClick={() => onChoose('nearby')} detail={<small>{t('rain.choice.nearbyDetail')}</small>} />
        <ChoiceButton icon="search" aria-label={t('rain.choice.proper')} label={t('rain.choice.proper')} data-order-id="rain:proper" onClick={() => onChoose('proper')} duration={t('choice.duration.searchMinutes', { minutes: 5 })} detail={<small>{t('rain.choice.properDetail')}</small>} />
        <ChoiceButton icon="walk" aria-label={t('rain.choice.continue')} label={t('rain.choice.continue')} data-order-id="rain:continue" onClick={() => onChoose('continue')} detail={<small>{t('rain.choice.continueDetail')}</small>} />
      </ChoiceOptions>}
    </EventBody>
  </EventFrame>
}
