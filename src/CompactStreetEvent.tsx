import { Icon, type IconName } from './Icon'
import ChoiceOptions from './ChoiceOptions'
import type { StreetEvent, StreetEventChoice } from './events'

const eventIcons: Record<string, IconName> = {
  'spare-change': 'coins', 'dropped-glove': 'person',
  'phone-drop': 'phone', 'rain-phone': 'rain', 'free-snack': 'food',
  'ticket-check': 'ticket', 'station-food': 'food', 'useful-tip': 'help',
  'rough-crowd': 'person', 'quiet-night': 'moon', 'night-theft': 'backpack',
}

const choiceIcons: Record<string, IconName> = {
  'Give 1 zł': 'coins', 'Sorry, I can’t': 'person', 'Keep my distance': 'walk', 'Call after them': 'person',
  'Let it fall': 'phone', 'Hide it under the jacket': 'person', 'Keep moving': 'walk',
  'Take it': 'food', 'No thanks': 'walk', 'Show your ticket': 'ticket',
  'Just listen': 'help', 'Keep going': 'walk', 'Move away': 'walk',
  'Stay where you are': 'person', 'Get up': 'walk', 'Check your things': 'backpack',
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
      return <button key={choice.label} aria-label={choice.label} disabled={!!unavailable} onClick={() => onChoose(choice)}>
        <span className="compact-event-choice-copy"><strong>{label}</strong>
          {choice.check && <small>{choice.check.stat === 'reflex' ? 'Reflex' : 'Persuasion'} check · DC {choice.check.dc}</small>}
          {unavailable ? <small>{unavailable}</small> : !!choice.outcome?.minutes && <small className="event-choice-time">≈{choice.outcome.minutes}m</small>}
        </span>
        <Icon name={choice.check ? choice.check.stat === 'reflex' ? 'energy' : 'person' : choiceIcons[choice.label] ?? icon} />
      </button>
    })}</ChoiceOptions>
    <p className="compact-event-pause"><Icon name="pause" />Time paused</p>
  </div>
}
