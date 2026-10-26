import { t } from './i18n'
import { conditionLabel } from './statusPresentation'
import { conditionBand, formatTime, type GameState } from './game'
import { displayDay } from './gameDate'
import { weekday } from './gameTime'
import { BatteryIcon, Icon } from './Icon'
import MoodIcon from './MoodIcon'

type Props = { game: GameState; weatherLabel: string; temperature: number; battery: number }
export default function GameHeader({ game, weatherLabel, temperature, battery }: Props) {
  const moodBand = conditionBand(game.mood)
  const moodLabel = conditionLabel(moodBand.level)
  return <header className="game-header">
      <div className="header-state-row">
        <h1 aria-label={`Day ${displayDay(game.day)} ${weekday(game.day)} ${formatTime(game.minutes)}`}><time>{formatTime(game.minutes)}</time><span className="game-day">D{displayDay(game.day)} <span className="weekday">{weekday(game.day)}</span></span></h1>
        <div className="weather" title={weatherLabel} aria-label={`${weatherLabel}, ${temperature}°C`}><Icon name={['Rain', 'Rainy', 'Showers', 'Drizzle', 'Downpour'].includes(weatherLabel) ? 'rain' : weatherLabel === 'Clear' ? game.minutes >= 360 && game.minutes < 1200 ? 'sun' : 'moon' : 'cloud'} />{temperature}°</div>
        <div className="header-info">
          <span className={`header-condition ${moodBand.level}`} role="img" aria-label={t('condition.moodAccessible', { condition: moodLabel })} title={t('condition.moodTitle', { percent: Math.round(game.mood), condition: moodLabel })}><MoodIcon value={game.mood} /></span>
          <div className="money" aria-label={`Money: ${game.money.toFixed(2)} zł`}><Icon name="banknote" />{Number(game.money.toFixed(2))} zł</div>
        </div>
        <div className={`phone-charge${battery < 30 ? ' low' : ''}`} aria-label={`Phone battery: ${Math.round(battery)}%`} title="Your phone battery"><BatteryIcon charge={battery} /><strong>{Math.round(battery)}%</strong></div>
      </div>
    </header>
}
