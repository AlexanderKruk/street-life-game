import { memo, useEffect, useState, type ReactNode } from 'react'
import { conditionBand } from './game'
import MoodIcon from './MoodIcon'

type StatChange = { from: number; value: string; kind: 'positive' | 'negative' | 'neutral' }

export default memo(function Stat({ label, value, icon, cap = 100, capReason, focus = false, change, animationReady = true }: { label: string; value: number; icon: ReactNode; cap?: number; capReason?: string; focus?: boolean; change?: StatChange; animationReady?: boolean }) {
  const [animatedValue, setAnimatedValue] = useState(change?.from ?? value)
  const from = change?.from
  const loss = from !== undefined && from > value
  useEffect(() => {
    if (from === undefined) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setAnimatedValue(value)
      return
    }
    setAnimatedValue(from)
    if (!animationReady) return
    let frame = 0
    let started: number | undefined
    function animate(now: number) {
      started ??= now
      const progress = Math.min(1, Math.max(0, (now - started - 300) / (loss ? 1600 : 1200)))
      const eased = loss ? progress * progress * (3 - 2 * progress) : 1 - (1 - progress) ** 3
      setAnimatedValue(from! + (value - from!) * eased)
      if (progress < 1) frame = window.requestAnimationFrame(animate)
    }
    frame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frame)
  }, [from, value, loss, animationReady])
  const displayed = change ? animatedValue : value
  const level = displayed > 60 ? 'good' : displayed > 30 ? 'warning' : 'critical'
  const blocked = (label === 'Hygiene' || label === 'Mood') && cap < 100
  const restriction = capReason ?? (label === 'Hygiene' ? 'dirty clothes' : 'housing and physical needs')
  return <div className={`stat status-stat ${level}${focus ? ' status-focus' : ''}${change ? ' result-stat' : ''}`} data-stat={label}>
    <span className="status-stat-icon">{label === 'Mood' ? <MoodIcon value={displayed} /> : icon}</span>
    <div className="status-stat-label">{focus && level !== 'good' && <span className="status-focus-label">{level === 'critical' ? 'Needs attention' : 'Keep an eye on this'}</span>}<strong>{label}</strong>{cap < 100 && !blocked && <small>Max {cap}%</small>}{blocked && label === 'Mood' && capReason && <small>{capReason}</small>}</div>
    <div className={blocked ? 'bar capped-bar' : 'bar'} role="meter" aria-label={`${label}: ${conditionBand(displayed).label}${blocked ? `, maximum ${Math.round(cap)}% due to ${restriction}` : ''}`} aria-valuenow={displayed} aria-valuemin={0} aria-valuemax={100} title={blocked ? `Limited by ${restriction}` : undefined}>
      {blocked && <span className="bar-blocked" style={{ left: `${cap}%` }} aria-hidden="true" />}
      {loss && <span className={`bar-loss-trail ${from > 60 ? 'good' : from > 30 ? 'warning' : 'critical'}`} style={{ left: `${value}%`, width: `${from - value}%` }} aria-hidden="true" />}
      <i className={level} style={{ width: `${displayed}%` }} />
      {blocked && <span className="bar-cap-marker" style={{ left: `${cap}%` }} aria-hidden="true" />}
    </div>
    <b className="status-stat-value"><span>{Math.round(displayed)}%</span>{change && <small className={`result-stat-delta ${change.kind}`}>{change.value}</small>}</b>
  </div>
})
