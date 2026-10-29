import { t } from './i18n'
import { formatMoney, formatNumber } from './i18n/formatters'
import { weatherLabel, weatherIcon, weekdayLabel } from './hudPresentation'
import type { WeatherId } from './weather'
import { conditionLabel } from './statusPresentation'
import { conditionBand, formatTime, type GameState } from './game'
import { displayDay } from './gameDate'
import { BatteryIcon, Icon } from './Icon'
import MoodIcon from './MoodIcon'

type Props = { game: GameState; weatherId: WeatherId; temperature: number; battery: number }
export default function GameHeader({ game, weatherId, temperature, battery }: Props) {
  const moodBand = conditionBand(game.mood)
  const moodLabel = conditionLabel(moodBand.level)
  const day = formatNumber(displayDay(game.day))
  const weekday = weekdayLabel(game.day)
  const time = formatTime(game.minutes)
  // Rainy and Showers describe the day between timed rain episodes, not rain falling now.
  const displayedWeatherId = game.rainSystemStarted && (weatherId === 'Rainy' || weatherId === 'Showers') ? 'Cloudy' : weatherId
  const weather = weatherLabel(displayedWeatherId)
  const degrees = formatNumber(temperature)
  const charge = t('format.percent', { amount: formatNumber(Math.round(battery)) })
  const money = Number(game.money.toFixed(2))
  return <header className="game-header">
      <div className="header-state-row">
        <h1 aria-label={t('hud.dateAccessible', { day, weekday, time })}><time>{time}</time><span className="game-day">{t('hud.day', { day })} <span className="weekday">{weekday}</span></span></h1>
        <div className="weather" title={weather} aria-label={t('hud.weatherAccessible', { weather, temperature: degrees })}><Icon name={weatherIcon(displayedWeatherId, game.minutes)} />{t('hud.temperature', { temperature: degrees })}</div>
        <div className="header-info">
          <span className={`header-condition ${moodBand.level}`} role="img" aria-label={t('condition.moodAccessible', { condition: moodLabel })} title={t('condition.moodTitle', { percent: Math.round(game.mood), condition: moodLabel })}><MoodIcon value={game.mood} /></span>
          <div className="money" aria-label={t('hud.moneyAccessible', { amount: formatMoney(money, true) })}><Icon name="banknote" />{formatMoney(money)}</div>
        </div>
        <div className={`phone-charge${battery < 30 ? ' low' : ''}`} aria-label={t('hud.batteryAccessible', { charge })} title={t('hud.batteryTitle')}><BatteryIcon charge={battery} /><strong>{charge}</strong></div>
      </div>
    </header>
}
