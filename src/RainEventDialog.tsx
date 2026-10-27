import { rainOpening } from './rainText'
import type { Ref } from 'react'
import ActivityDialog, { ActivityCancel } from './ActivityDialog'
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
  onContinue: () => void
}

export default function RainEventDialog({ rain, waiting, elapsed, orderSeed, decisionKey, panelRef, onChoose, onContinue }: Props) {
  const opening = rainOpening(rain.level)
  if (waiting) return <ActivityDialog kind="rain" visible panelRef={panelRef} elapsed={elapsed}
    searching={rain.choice === 'proper' && rain.searchRemaining > 0} title={opening.title}
    phase={t(rain.searchRemaining > 0 ? 'rain.wait.searchingPhase' : 'rain.wait.waitingPhase')}
    actions={<ActivityCancel onClick={onContinue} />} />
  return <EventFrame titleId="rain-event-title" illustration={rainArt(rain, 'opening')} illustrationAlt={opening.text} panelRef={panelRef}>
    <EventBody titleId="rain-event-title" title={opening.title} label={t('rain.opening.label')} description={opening.text}>
      <ChoiceOptions className="event-choices" seed={orderSeed} decision={`${decisionKey}|rain:${rain.id}`}>
        <ChoiceButton icon="umbrella" aria-label={t('rain.choice.nearby')} label={t('rain.choice.nearby')} data-order-id="rain:nearby" onClick={() => onChoose('nearby')} detail={<small>{t('rain.choice.nearbyDetail')}</small>} />
        <ChoiceButton icon="search" aria-label={t('rain.choice.proper')} label={t('rain.choice.proper')} data-order-id="rain:proper" onClick={() => onChoose('proper')} duration={t('choice.duration.searchMinutes', { minutes: 5 })} detail={<small>{t('rain.choice.properDetail')}</small>} />
        <ChoiceButton icon="walk" aria-label={t('rain.choice.continue')} label={t('rain.choice.continue')} data-order-id="rain:continue" onClick={() => onChoose('continue')} detail={<small>{t('rain.choice.continueDetail')}</small>} />
      </ChoiceOptions>
    </EventBody>
  </EventFrame>
}
