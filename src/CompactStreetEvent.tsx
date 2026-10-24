import ChoiceButton, { approximateDuration } from './ChoiceButton'
import { Icon, choiceIcon, type IconName } from './Icon'
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
  'ticket-check': 'ticket', 'station-food': 'food', 'useful-tip': 'help',
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
      <p className="eyebrow">STREET EVENT</p><h2 id="street-event-title">{event.title}</h2>
    </div></div>
    <p className="compact-event-description">{event.text}</p>
    <ChoiceOptions className="event-choices" seed={orderSeed} decision={`${decisionKey}|event:${event.id}`}>{event.choices.map(choice => {
      const unavailable = unavailableReason(choice)
      const label = choice.check ? choice.label.replace(/ · .* DC \d+$/, '') : choice.label
      return <ChoiceButton key={choice.label} aria-label={choice.label} disabled={!!unavailable} onClick={() => onChoose(choice)}
        icon={choice.icon ?? choiceIcon('', choice.label)} label={label}
        detail={<>{choice.check && <small>{choice.check.stat === 'reflex' ? 'Reflex' : 'Persuasion'} check · DC {choice.check.dc}</small>}{unavailable && <small>{unavailable}</small>}</>}
        duration={(choice.durationMinutes ?? choice.outcome?.minutes) ? approximateDuration((choice.durationMinutes ?? choice.outcome?.minutes)!) : undefined} />
    })}</ChoiceOptions>
    <p className="compact-event-pause"><Icon name="pause" />Time paused</p>
  </div>
}
