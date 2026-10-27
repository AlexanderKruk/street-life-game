import type { ReactNode, Ref } from 'react'
import ActivityStatus from './ActivityStatus'
import { PhoneSearchIcon, RainActivityIcon, TravelHeading } from './LocationPresentation'
import { ModalAction, ModalOverlay, ModalPanel } from './Modal'
import { Icon } from './Icon'
import { t } from './i18n'

type CommonProps = { visible: boolean; panelRef: Ref<HTMLElement>; elapsed: number; phase: string; actions?: ReactNode }
type PhoneProps = CommonProps & { kind: 'phone'; calling: boolean; title: string; timeLabel: string }
type TravelProps = CommonProps & { kind: 'travel'; from: string; to?: string; walking: boolean; moving: boolean }

type RainProps = CommonProps & { kind: 'rain'; searching: boolean; title: string }

export function ActivityCancel({ onClick }: { onClick: () => void }) {
  return <ModalAction variant="outline" iconOnly className="activity-cancel" aria-label={t('common.cancel')} onClick={onClick}><Icon name="close" /></ModalAction>
}

// Presentation only: elapsed time, phase and visibility come from the owning
// gameplay process. Search/calls and journeys keep their own timing rules.
export default function ActivityDialog(props: PhoneProps | TravelProps | RainProps) {
  const phone = props.kind === 'phone'
  return <ModalOverlay className={phone ? 'travel-overlay phone-activity-overlay' : 'travel-overlay'} inert={!props.visible} aria-hidden={!props.visible || undefined}>
    <ModalPanel className={`travel-screen${phone ? ' phone-activity' : ''}${props.actions ? ' activity-with-actions' : ''}`} role="dialog" aria-modal="true"
      aria-labelledby={phone ? 'phone-activity-title' : props.kind === 'rain' ? 'rain-activity-title' : undefined} aria-label={props.kind === 'travel' ? t('activity.travel') : undefined}
      aria-busy={props.kind !== 'travel' || undefined} tabIndex={-1} ref={props.panelRef}>
      {props.kind === 'phone' ? <>
        <PhoneSearchIcon calling={props.calling} />
        <div className="travel-route-heading"><h2 id="phone-activity-title">{props.title}</h2></div>
      </> : props.kind === 'rain' ? <>
        <RainActivityIcon searching={props.searching} />
        <div className="travel-route-heading"><h2 id="rain-activity-title">{props.title}</h2></div>
      </> : <TravelHeading from={props.from} to={props.to} walking={props.walking} moving={props.moving} />}
      <ActivityStatus elapsed={props.elapsed} timeLabel={props.kind === 'phone' ? props.timeLabel : t(props.kind === 'rain' ? 'rain.wait.elapsedAccessible' : 'activity.elapsedTravel')} label={props.phase} />
      {props.actions && <div className="activity-actions">{props.actions}</div>}
    </ModalPanel>
  </ModalOverlay>
}
