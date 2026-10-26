import { t } from './i18n'
import ChoiceButton from './ChoiceButton'
import { choiceAccessibleLabel, choiceCheckDetail } from './choiceCheckPresentation'
import { Icon, type IconName } from './Icon'
import ChoiceOptions from './ChoiceOptions'
import type { StreetEvent, StreetEventChoice } from './events'

const eventIcons: Record<string, IconName> = {
  'street-patrol-wake': 'documents', 'station-patrol-wake': 'ticket',
  'night-rustle': 'search', 'cold-hands': 'thermometer', 'city-waking': 'sun',
  'station-cleaning': 'shower', 'platform-question': 'station',
  'spare-change': 'coins', 'dropped-glove': 'person',
  'phone-drop': 'phone', 'rain-phone': 'rain', 'free-snack': 'food',
  'borrow-phone': 'phone', 'borrow-phone-slip': 'phone',
  'park-company': 'chat', 'night-patrol': 'chat',
  'ticket-check': 'ticket', 'station-food': 'food',
  'rough-crowd': 'person', 'quiet-night': 'moon', 'night-theft': 'backpack',
}

export default function CompactStreetEvent({ event, onChoose, unavailableReason, orderSeed = 0, decisionKey = '' }: {
  event: StreetEvent
  onChoose: (choice: StreetEventChoice) => void
  unavailableReason: (choice: StreetEventChoice) => string | null
  orderSeed?: number
  decisionKey?: string
}) {
  const icon = eventIcons[event.id] ?? 'help'
  return <div className="event-body">
    <div className="compact-event-heading"><Icon name={icon} /><div>
      <p className="eyebrow">{t('event.ui.label')}</p><h2 id="street-event-title">{event.title}</h2>
    </div></div>
    <p className="compact-event-description modal-narrative">{event.text}</p>
    <ChoiceOptions className="event-choices" fixed={event.choiceOrder === 'fixed'} seed={orderSeed} decision={`${decisionKey}|event:${event.id}`}>{event.choices.map(choice => {
      const unavailable = unavailableReason(choice)
      const label = choice.label
      return <ChoiceButton key={choice.id} data-order-id={`event:${event.id}:${choice.id}`} aria-label={choiceAccessibleLabel(choice)} disabled={unavailable !== null} onClick={() => onChoose(choice)}
        icon={choice.icon ?? 'person'} label={label}
        detail={<>{choice.check && <small>{choiceCheckDetail(choice.check)}</small>}{unavailable !== null && <small>{unavailable}</small>}</>}
        estimate={(choice.durationMinutes ?? choice.outcome?.minutes) ? { minutes: (choice.durationMinutes ?? choice.outcome?.minutes)! } : undefined} />
    })}</ChoiceOptions>
    <p className="compact-event-pause"><Icon name="pause" />{t('event.ui.paused')}</p>
  </div>
}
