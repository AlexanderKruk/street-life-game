import type { ReactNode, Ref } from 'react'
import ChoiceButton, { approximateDuration } from './ChoiceButton'
import ChoiceOptions from './ChoiceOptions'
import CompactStreetEvent from './CompactStreetEvent'
import { ModalOverlay, ModalPanel } from './Modal'
import { responsiveImageProps } from './responsiveImages'
import type { StreetEvent, StreetEventChoice } from './events'

type FrameProps = { titleId: string; illustration?: string; illustrationAlt: string; panelRef: Ref<HTMLElement>; children: ReactNode }

// Authored encounters and weather scenes share framing, artwork and body layout.
// Their eligibility, pending-save state, focus and outcomes stay with the owner.
export function EventFrame({ titleId, illustration, illustrationAlt, panelRef, children }: FrameProps) {
  return <ModalOverlay className="event-overlay" role="dialog" aria-modal="true" aria-labelledby={titleId}>
    <ModalPanel size={illustration ? 'regular' : 'compact'} ref={panelRef} className={`event-card${illustration ? ' illustrated-event' : ' compact-street-event'}`}>
      {illustration && <img className="event-illustration" {...responsiveImageProps(illustration)} alt={illustrationAlt} />}
      {children}
    </ModalPanel>
  </ModalOverlay>
}

export function EventBody({ titleId, title, label = 'STREET EVENT', description, children }: {
  titleId: string; title: string; label?: string; description: ReactNode; children: ReactNode
}) {
  return <div className="event-body">
    <p className="eyebrow">{label}</p>
    <h2 id={titleId}>{title}</h2>
    <p className="modal-narrative">{description}</p>
    {children}
  </div>
}

type Props = {
  event: StreetEvent
  choices: StreetEvent['choices']
  onChoose: (choice: StreetEventChoice) => void
  unavailableReason: (choice: StreetEventChoice) => string | null
  orderSeed: number
  decisionKey: string
  panelRef: Ref<HTMLElement>
}

export default function EventDialog({ event, choices, onChoose, unavailableReason, orderSeed, decisionKey, panelRef }: Props) {
  return <EventFrame titleId="street-event-title" illustration={event.illustration} illustrationAlt={event.text} panelRef={panelRef}>
    {!event.illustration
      ? <CompactStreetEvent event={{ ...event, choices }} onChoose={onChoose} unavailableReason={unavailableReason} orderSeed={orderSeed} decisionKey={decisionKey} />
      : <EventBody titleId="street-event-title" title={event.title} description={event.text}>
        <ChoiceOptions className="event-choices" fixed={event.choiceOrder === 'fixed'} seed={orderSeed} decision={`${decisionKey}|event:${event.id}`}>{choices.map(choice => {
          const unavailable = unavailableReason(choice)
          return <ChoiceButton key={choice.id} data-order-id={`event:${event.id}:${choice.id}`} aria-label={choice.label} icon={choice.icon ?? 'person'} label={choice.check ? choice.label.replace(/ · .* DC \d+$/, '') : choice.label} onClick={() => onChoose(choice)} disabled={!!unavailable} detail={unavailable ? <small>{unavailable}</small> : choice.check ? <small>{choice.check.stat === 'reflex' ? 'Reflex' : 'Persuasion'} check · DC {choice.check.dc}</small> : undefined} duration={(choice.durationMinutes ?? choice.outcome?.minutes) ? approximateDuration((choice.durationMinutes ?? choice.outcome?.minutes)!) : undefined} />
        })}</ChoiceOptions>
      </EventBody>}
  </EventFrame>
}
