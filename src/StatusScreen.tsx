import type { ComponentProps } from 'react'
import { CLOTHING_WETNESS_ENABLED } from './gameplayFeatures'
import type { GameState, Need } from './game'
import type { ActiveEffect } from './stateTypes'
import type { LimitingEffect } from './limitingEffects'
import { Icon, type IconName } from './Icon'
import Stat from './Stat'
import LifeSituation from './LifeSituation'
import { EFFECTS, remainingEffect } from './statusEffects'

export type StatusNeed = { id: Need; label: string; value: number; icon: IconName; cap?: number; capReason?: string }
type Props = {
  game: GameState; statusEffects: ActiveEffect[]; statLimits: LimitingEffect[]; separateLimits: LimitingEffect[]
  statusNeeds: StatusNeed[]; focusedNeed: StatusNeed | null; situation: ComponentProps<typeof LifeSituation>
}
export default function StatusScreen({ game, statusEffects, statLimits, separateLimits, statusNeeds, focusedNeed, situation }: Props) {
  const statusEffectCount = statusEffects.length + separateLimits.length + (CLOTHING_WETNESS_ENABLED && (game.wetness ?? 0) > 0 ? 1 : 0)
  return <section className="status-screen" aria-label="Status">
      {!!statusEffectCount && <section className="status-effects" aria-labelledby="status-effects-heading">
        <div className="effects-heading"><h3 id="status-effects-heading">Effects</h3><span>{statusEffectCount}</span></div>
        <div className="effects-list">
          {CLOTHING_WETNESS_ENABLED && (game.wetness ?? 0) > 0 && <div className="effect negative wet-clothes">
            <span><Icon name="water" /></span><strong className="effect-name">Wet clothes</strong>
            <div className="effect-details"><div className="effect-impact"><b>Energy−</b><b>Mood−</b></div><small className="effect-time">{Math.max(1, Math.round(game.wetness!))}%</small></div>
          </div>}
          {separateLimits.map(effect => <div className="effect negative limit-effect" data-limit-reason={effect.reason} data-mood-limit={effect.limits.some(limit => limit.stat === 'Mood') ? effect.reason : undefined} key={effect.reason}>
            <span><Icon name={effect.icon} /></span><strong className="effect-name" title={effect.name}>{effect.name}</strong>
            <div className="effect-impact">{effect.limits.map(limit => <b key={limit.stat}>{limit.stat} ≤ {Math.round(limit.cap)}%</b>)}</div>
          </div>)}
          {statusEffects.map(active => {
            const effect = EFFECTS[active.id]
            const coldLimit = active.id === 'cold' ? statLimits.find(limit => limit.reason === 'Cold') : undefined
            return <div className={`effect ${effect.kind}${active.id === 'cold' ? ' illness' : ''}`} key={active.id}>
              <span><Icon name={effect.icon} /></span><strong className="effect-name" title={active.id === 'cold' && active.treated ? 'Cold · treated: recovery ×3' : effect.name}>{effect.name}{active.id === 'cold' && active.treated ? ' · treated' : ''}</strong>
              <div className="effect-details"><div className="effect-impact">{effect.impacts.map(impact => <b key={impact}>{impact}{impact === 'Mood−' && coldLimit ? ` · ≤ ${Math.round(coldLimit.limits[0].cap)}%` : ''}</b>)}</div>{active.id !== 'cold' && <small className="effect-time">{remainingEffect(active.expiresAt, game)}</small>}</div>
            </div>
          })}
        </div>
      </section>}
      <div className="condition-heading"><h3>Condition</h3></div>
      {focusedNeed && <Stat id={focusedNeed.id} label={focusedNeed.label} value={focusedNeed.value} icon={<Icon name={focusedNeed.icon} />} cap={focusedNeed.cap} capReason={focusedNeed.capReason} focus />}
      <div className="status-needs" aria-label={focusedNeed ? 'Other condition indicators' : 'Condition indicators'}>
        {statusNeeds.filter(need => need.id !== focusedNeed?.id).map(need => <Stat key={need.id} id={need.id} label={need.label} value={need.value} icon={<Icon name={need.icon} />} cap={need.cap} capReason={need.capReason} />)}
      </div>
      <LifeSituation {...situation} />
    </section>
}
