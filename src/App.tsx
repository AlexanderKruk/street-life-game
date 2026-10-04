import { useEffect, useMemo, useState } from 'react'
import { actions, applyAction, formatTime, initialState, isOpen, locations, type GameState } from './game'

const SAVE_KEY = 'street-life-save-v3'

function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    return raw ? { ...initialState, ...JSON.parse(raw) } : initialState
  } catch {
    return initialState
  }
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return <div className="stat"><span>{icon}</span><div><div className="stat-label">{label}</div><div className="bar"><i style={{ width: `${value}%` }} /></div></div><b>{value}</b></div>
}

export default function App() {
  const [game, setGame] = useState<GameState>(loadGame)
  const [message, setMessage] = useState('Morning. You have a little cash and no plan yet.')
  const current = useMemo(() => locations.find((x) => x.id === game.locationId) ?? locations[0], [game.locationId])
  const currentActions = actions.filter((x) => x.locationId === current.id)
  const open = isOpen(current, game.minutes)

  useEffect(() => { localStorage.setItem(SAVE_KEY, JSON.stringify(game)) }, [game])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setGame((prev) => applyAction(prev, { minutes: 1 }))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  function travel(id: string) {
    const destination = locations.find((x) => x.id === id)
    if (!destination || destination.id === game.locationId) return
    setGame((prev) => {
      const next = applyAction(prev, { minutes: destination.travelMinutes })
      setMessage(`You walked to ${destination.name}. ${destination.travelMinutes} minutes passed.`)
      return { ...next, locationId: destination.id }
    })
  }

  function act(actionId: string) {
    const action = actions.find((x) => x.id === actionId)
    if (!action) return
    if (!open && action.requiresOpen !== false) {
      setMessage(`${current.name} is closed. Come back during opening hours.`)
      return
    }
    if (action.cost && game.money < action.cost) {
      setMessage(`You need ${action.cost.toFixed(2)} zł for that.`)
      return
    }
    setGame((prev) => {
      const result = action.resolve(prev)
      setMessage(result.message ?? 'Time passes.')
      return applyAction(prev, result)
    })
  }

  function reset() {
    localStorage.removeItem(SAVE_KEY)
    setGame(initialState)
    setMessage('New run started.')
  }

  return <main className="shell">
    <header><div><p className="eyebrow">STREET LIFE · STAGE 2</p><h1>Day {game.day} <span>{formatTime(game.minutes)}</span></h1></div><div className="money">{game.money.toFixed(2)} zł</div></header>

    <section className="needs">
      <Stat icon="🍞" label="Food" value={game.hunger} />
      <Stat icon="💧" label="Thirst" value={game.thirst} />
      <Stat icon="⚡" label="Energy" value={game.energy} />
      <Stat icon="❤️" label="Health" value={game.health} />
      <Stat icon="🚿" label="Hygiene" value={game.hygiene} />
      <Stat icon="🙂" label="Mood" value={game.mood} />
    </section>

    <section className="current">
      <div className="location-icon">{current.icon}</div>
      <div><p className="eyebrow">YOU ARE HERE · {open ? 'OPEN' : 'CLOSED'}</p><h2>{current.name}</h2><p>{current.description}</p></div>
    </section>

    <section className="event"><span>●</span><p>{message}</p></section>

    <div className="section-title"><h2>What do you do?</h2><span>Actions move time forward</span></div>
    <section className="actions">
      {currentActions.length ? currentActions.map((action) => {
        const unavailable = (!open && action.requiresOpen !== false) || (!!action.cost && game.money < action.cost)
        return <button className="action" key={action.id} onClick={() => act(action.id)} disabled={unavailable}>
          <div><strong>{action.name}</strong><small>{action.description}</small></div>
          <span>{action.cost ? `${action.cost} zł · ` : ''}~{action.minutes} min</span>
        </button>
      }) : <p className="empty">Nothing useful to do here yet. This location comes in the next stage.</p>}
    </section>

    <div className="section-title city-title"><h2>City</h2><span>Travel costs time</span></div>
    <section className="grid">
      {locations.map((location) => {
        const locationOpen = isOpen(location, game.minutes)
        const here = location.id === game.locationId
        return <button key={location.id} className={here ? 'place here' : 'place'} onClick={() => travel(location.id)} disabled={here}>
          <div className="place-top"><span className="place-icon">{location.icon}</span><span className={locationOpen ? 'open' : 'closed'}>{locationOpen ? 'OPEN' : 'CLOSED'}</span></div>
          <strong>{location.name}</strong><small>{here ? 'Current location' : `~${location.travelMinutes} min`}</small>
          <em>{formatTime(location.open)}–{location.close === 1440 ? '24:00' : formatTime(location.close)}</em>
        </button>
      })}
    </section>

    <footer><p>Stage 2: six survival stats now react differently to time and choices.</p><button className="reset" onClick={reset}>Reset save</button></footer>
  </main>
}
