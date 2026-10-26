import type { Ref } from 'react'
import ActivityStatus from './ActivityStatus'
import { t } from './i18n'
import ChoiceButton from './ChoiceButton'
import ChoiceOptions from './ChoiceOptions'
import { EventBody, EventFrame } from './EventDialog'
import { RAIN, rainArt, type RainChoice, type RainEpisode } from './rain'

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
  const opening = RAIN[rain.level]
  const waitingText = rain.choice === 'proper'
    ? rain.searchRemaining > 0 ? 'You head along the street, looking for a roof that will keep the rain off.' : 'You stand well inside the covered passage, watching the rain outside.'
    : rain.shelter === 'tree' ? 'The leaves catch some of the rain, but drops still fall onto your shoulders.' : 'You stand close to the wall beneath the little awning. Some rain still reaches you.'
  const illustrationAlt = waiting ? rain.choice === 'proper' ? 'You find a deep covered passage on the rainy street.' : rain.shelter === 'tree' ? 'You take partial cover beneath a street tree.' : 'You wait beneath a small shop awning.' : opening.text
  return <EventFrame titleId="rain-event-title" illustration={rainArt(rain, waiting ? rain.choice! : 'opening')} illustrationAlt={illustrationAlt} panelRef={panelRef}>
    <EventBody titleId="rain-event-title" title={opening.title} label={waiting ? 'WAITING OUT THE RAIN' : 'STREET EVENT'} description={waiting ? waitingText : opening.text}>
      {waiting ? <>
        <ActivityStatus elapsed={elapsed} timeLabel="Elapsed waiting time" label={rain.searchRemaining > 0 ? 'Looking for shelter' : 'Waiting for the rain to stop'} />
        {rain.choice === 'nearby' && <ChoiceButton icon="search" aria-label="Find proper shelter" label="Find proper shelter" duration={t('choice.duration.searchMinutes', { minutes: 5 })} onClick={onFindProperShelter} detail={<small>Leave this cover and look for a dry passage</small>} />}
        <ChoiceButton icon="walk" aria-label="Carry on" label="Carry on" onClick={onContinue} detail={<small>Leave cover and continue in the rain</small>} />
      </> : <ChoiceOptions className="event-choices" seed={orderSeed} decision={`${decisionKey}|rain:${rain.id}`}>
        <ChoiceButton icon="umbrella" aria-label="Take cover nearby" label="Take cover nearby" data-order-id="rain:nearby" onClick={() => onChoose('nearby')} detail={<small>Quick shelter, but it may offer little protection</small>} />
        <ChoiceButton icon="search" aria-label="Find proper shelter" label="Find proper shelter" data-order-id="rain:proper" onClick={() => onChoose('proper')} duration={t('choice.duration.searchMinutes', { minutes: 5 })} detail={<small>Stay in the rain while you look for somewhere dry</small>} />
        <ChoiceButton icon="walk" aria-label="Carry on" label="Carry on" data-order-id="rain:continue" onClick={() => onChoose('continue')} detail={<small>Continue what you were doing, exposed to the rain</small>} />
      </ChoiceOptions>}
    </EventBody>
  </EventFrame>
}
