export default function ActivityStatus({ elapsed, label, timeLabel }: { elapsed: number; label: string; timeLabel: string }) {
  const minutes = Math.max(1, elapsed)
  const time = minutes < 60 ? `${String(minutes).padStart(2, '0')}m` : `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
  return <div className="activity-status">
    <strong className="travel-elapsed" aria-label={timeLabel}>{time}</strong>
    <span className="activity-phase travel-action-label">{label}<span className="travel-phase-dots" aria-hidden="true"><i /><i /><i /></span></span>
  </div>
}
