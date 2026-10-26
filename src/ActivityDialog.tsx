import type { Ref } from 'react'
import ActivityStatus from './ActivityStatus'
import { PhoneSearchIcon, TravelHeading } from './LocationPresentation'
import { ModalOverlay, ModalPanel } from './Modal'
import { t } from './i18n'

type CommonProps = { visible: boolean; panelRef: Ref<HTMLElement>; elapsed: number; phase: string }
type PhoneProps = CommonProps & { kind: 'phone'; calling: boolean; title: string; timeLabel: string }
type TravelProps = CommonProps & { kind: 'travel'; from: string; to?: string; walking: boolean; moving: boolean }

// Presentation only: elapsed time, phase and visibility come from the owning
// gameplay process. Search/calls and journeys keep their own timing rules.
export default function ActivityDialog(props: PhoneProps | TravelProps) {
  const phone = props.kind === 'phone'
  return <ModalOverlay className={phone ? 'travel-overlay phone-activity-overlay' : 'travel-overlay'} inert={!props.visible} aria-hidden={!props.visible || undefined}>
    <ModalPanel className={phone ? 'travel-screen phone-activity' : 'travel-screen'} role="dialog" aria-modal="true"
      aria-labelledby={phone ? 'phone-activity-title' : undefined} aria-label={phone ? undefined : t('activity.travel')}
      aria-busy={phone || undefined} tabIndex={-1} ref={props.panelRef}>
      {props.kind === 'phone' ? <>
        <PhoneSearchIcon calling={props.calling} />
        <div className="travel-route-heading"><h2 id="phone-activity-title">{props.title}</h2></div>
      </> : <TravelHeading from={props.from} to={props.to} walking={props.walking} moving={props.moving} />}
      <ActivityStatus elapsed={props.elapsed} timeLabel={props.kind === 'phone' ? props.timeLabel : t('activity.elapsedTravel')} label={props.phase} />
    </ModalPanel>
  </ModalOverlay>
}
