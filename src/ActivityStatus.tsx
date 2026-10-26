import { formatActivityElapsed } from './i18n/formatters'

export default function ActivityStatus({ elapsed, label, timeLabel }: { elapsed: number; label: string; timeLabel: string }) {
  const time = formatActivityElapsed(elapsed)
  return <div className="activity-status">
    <strong className="travel-elapsed" aria-label={timeLabel}>{time}</strong>
    <span className="activity-phase travel-action-label">{label}<span className="travel-phase-dots" aria-hidden="true"><i /><i /><i /></span></span>
  </div>
}
