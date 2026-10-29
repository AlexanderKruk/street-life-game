import { conditionLabel } from './statusPresentation'
import { memo, useEffect, useState, type ReactNode } from 'react'
import { conditionBand } from './game'
import MoodIcon from './MoodIcon'
import { t } from './i18n'
import { legacyResourceId } from './legacyResultCompatibility'
import type { ResultResourceId } from './resultResources'

type StatChange = { from: number; value: string; kind: 'positive' | 'negative' | 'neutral' }

export default memo(function Stat({ id, label, value, icon, cap = 100, capReason, focus = false, change, animationReady = true, animate = true }: { id?: ResultResourceId; label: string; value: number; icon: ReactNode; cap?: number; capReason?: string; focus?: boolean; change?: StatChange; animationReady?: boolean; animate?: boolean }) {
  const resourceId = id ?? legacyResourceId(label)
  const [animatedValue, setAnimatedValue] = useState(animate ? change?.from ?? value : value)
  const from = change?.from
  const loss = from !== undefined && from > value
  useEffect(() => {
    if (from === undefined) return
    if (!animate || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setAnimatedValue(value)
      return
    }
    setAnimatedValue(from)
    if (!animationReady) return
    let frame = 0
    let started: number | undefined
    function animateFrame(now: number) {
      started ??= now
      const progress = Math.min(1, Math.max(0, (now - started - 300) / (loss ? 1600 : 1200)))
      const eased = loss ? progress * progress * (3 - 2 * progress) : 1 - (1 - progress) ** 3
      setAnimatedValue(from! + (value - from!) * eased)
      if (progress < 1) frame = window.requestAnimationFrame(animateFrame)
    }
    frame = window.requestAnimationFrame(animateFrame)
    return () => window.cancelAnimationFrame(frame)
  }, [from, value, loss, animationReady, animate])
  const displayed = change ? animatedValue : value
  const level = displayed > 60 ? 'good' : displayed > 30 ? 'warning' : 'critical'
  const blocked = (resourceId === 'hygiene' || resourceId === 'mood') && cap < 100
  const restriction = capReason ?? t(resourceId === 'hygiene' ? 'stat.dirtyClothes' : 'stat.housingAndNeeds')
  return <div className={`stat status-stat ${level}${focus ? ' status-focus' : ''}${change ? ' result-stat' : ''}`} data-stat={label} data-resource-id={resourceId}>
    <span className="status-stat-icon">{resourceId === 'mood' ? <MoodIcon value={displayed} /> : icon}</span>
    <div className="status-stat-label">{focus && level !== 'good' && <span className="status-focus-label">{t(level === 'critical' ? 'stat.needsAttention' : 'stat.keepAnEye')}</span>}<strong>{label}</strong>{cap < 100 && !blocked && <small>{t('stat.maximum', { cap })}</small>}{blocked && resourceId === 'mood' && capReason && <small>{capReason}</small>}</div>
    <div className={blocked ? 'bar capped-bar' : 'bar'} role="meter" aria-label={blocked ? t('stat.accessibleLimited', { label, condition: conditionLabel(conditionBand(displayed).level), cap: Math.round(cap), reason: restriction }) : t('stat.accessible', { label, condition: conditionLabel(conditionBand(displayed).level) })} aria-valuenow={displayed} aria-valuemin={0} aria-valuemax={100} title={blocked ? t('stat.limitedBy', { reason: restriction }) : undefined}>
      {blocked && <span className="bar-blocked" style={{ left: `${cap}%` }} aria-hidden="true" />}
      {loss && <span className={`bar-loss-trail ${from > 60 ? 'good' : from > 30 ? 'warning' : 'critical'}`} style={{ left: `${value}%`, width: `${from - value}%` }} aria-hidden="true" />}
      <i className={level} style={{ width: `${displayed}%` }} />
      {blocked && <span className="bar-cap-marker" style={{ left: `${cap}%` }} aria-hidden="true" />}
    </div>
    <b className="status-stat-value"><span>{t('format.percent', { amount: Math.round(displayed) })}</span>{change && <small className={`result-stat-delta ${change.kind}`}>{change.value}</small>}</b>
  </div>
})
