import { Icon } from './Icon'
import { ModalOverlay, ModalPanel, ModalAction } from './Modal'
import { displayDay } from './gameDate'
import { t } from './i18n'
export default function GameOverDialog({ day, onReset }: { day: number; onReset: () => void }) {
  return <ModalOverlay className="game-over-overlay" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
      <ModalPanel size="compact" className="game-over-card">
        <p className="eyebrow">{t('gameOver.label')}</p>
        <div className="game-over-emblem"><Icon name="heart-broken" /></div>
        <h2 id="game-over-title">{t('gameOver.title')}</h2>
        <p className="game-over-day"><strong>{t('gameOver.day', { day: displayDay(day) })}</strong><span>{t('gameOver.ended')}</span></p>
        <p className="game-over-description modal-narrative">{t('gameOver.description')}</p>
        <ModalAction onClick={onReset}>{t('gameOver.restart')}</ModalAction>
      </ModalPanel>
    </ModalOverlay>
}
