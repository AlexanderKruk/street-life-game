import { Icon } from './Icon'
import { ModalOverlay, ModalPanel, ModalAction } from './Modal'
import { displayDay } from './gameDate'
export default function GameOverDialog({ day, onReset }: { day: number; onReset: () => void }) {
  return <ModalOverlay className="game-over-overlay" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
      <ModalPanel size="compact" className="game-over-card">
        <p className="eyebrow">RUN OVER</p>
        <div className="game-over-emblem"><Icon name="heart-broken" /></div>
        <h2 id="game-over-title">Your health reached zero</h2>
        <p className="game-over-day"><strong>Day {displayDay(day)}</strong><span>Your run ended here</span></p>
        <p className="game-over-description modal-narrative">Food, water and medicine can stop causes of damage, but lost health needs proper recovery and care.</p>
        <ModalAction onClick={onReset}>Start new run</ModalAction>
      </ModalPanel>
    </ModalOverlay>
}
