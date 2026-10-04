import { useEffect, useMemo, useState } from 'react'
import { advance, formatTime, initialState, isOpen, locations, type GameState } from './game'

const SAVE_KEY = 'street-life-save-v1'

function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    return raw ? { ...initialState, ...JSON.parse(raw) } : initialState
  } catch {
    return initialState
  }
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="stat">
      <span>{icon}</span>
      <div>
        <div className="stat-label">{label}</div>
        <div className="bar"><i style={{ width: `${value}%` }} /></div>
      </div>
      <b>{value}</b>
    </div>
  )
}

export default function App() {
  const [game, setGame] = useState<GameState>(loadGame)
  const current = useMemo(() => locations.find((x) => x.id === game.locationId) ?? locations[0], [game.locationId])

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game))
  }, [game])

  function travel(id: string) {
    const destination = locations.find((x) => x.id === id)
    if (!destination || destination.id === game.locationId) return
    setGame((prev) => ({ ...advance(prev, destination.travelMinutes), locationId: destination.id }))
  }

  function reset() {
    localStorage.removeItem(SAVE_KEY)
    setGame(initialState)
  }

  return (
    <main className="shell">
      <header>
        <div>
          <p className="eyebrow">STREET LIFE · PROTOTYPE</p>
          <h1>Day {game.day} <span>{formatTime(game.minutes)}</span></h1>
        </div>
        <div className="money">{game.money.toFixed(2)} zł</div>
      </header>

      <section className="needs">
        <Stat icon="🍞" label="Food" value={game.hunger} />
        <Stat icon="⚡" label="Energy" value={game.energy} />
        <Stat icon="💧" label="Hygiene" value={game.hygiene} />
      </section>

      <section className="current">
        <div className="location-icon">{current.icon}</div>
        <div>
          <p className="eyebrow">YOU ARE HERE</p>
          <h2>{current.name}</h2>
          <p>{current.description}</p>
        </div>
      </section>

      <div className="section-title">
        <h2>City</h2>
        <span>Travel costs time</span>
      </div>

      <section className="grid">
        {locations.map((location) => {
          const open = isOpen(location, game.minutes)
          const here = location.id === game.locationId
          return (
            <button key={location.id} className={here ? 'place here' : 'place'} onClick={() => travel(location.id)} disabled={here}>
              <div className="place-top">
                <span className="place-icon">{location.icon}</span>
                <span className={open ? 'open' : 'closed'}>{open ? 'OPEN' : 'CLOSED'}</span>
              </div>
              <strong>{location.name}</strong>
              <small>{here ? 'Current location' : `~${location.travelMinutes} min`}</small>
              <em>{formatTime(location.open)}–{location.close === 1440 ? '24:00' : formatTime(location.close)}</em>
            </button>
          )
        })}
      </section>

      <footer>
        <p>Stage 1: movement changes the clock and slowly drains your needs. Actions and events come next.</p>
        <button className="reset" onClick={reset}>Reset save</button>
      </footer>
    </main>
  )
}
