import { useEffect, useMemo, useState } from 'react'
import { actions, applyAction, formatTime, initialState, isOpen, locations, type GameState } from './game'

const SAVE_KEY = 'street-life-save-v3'
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function weekday(day: number) {
  return WEEKDAYS[(day - 1) % WEEKDAYS.length]
}
type Screen = 'location' | 'map' | 'inventory' | 'status' | 'journal' | 'travel'
type TravelMode = 'walk' | 'transit'
type Trip = { destinationId: string; mode: TravelMode; total: number; remaining: number }

const mapPositions: Record<string, { left: string; top: string }> = {
  station: { left: '13%', top: '18%' },
  shop: { left: '64%', top: '14%' },
  support: { left: '40%', top: '38%' },
  jobcenter: { left: '70%', top: '51%' },
  shelter: { left: '16%', top: '65%' },
  work: { left: '53%', top: '76%' },
}

function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    return raw ? { ...initialState, ...JSON.parse(raw) } : initialState
  } catch {
    return initialState
  }
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  const level = value > 60 ? 'good' : value > 30 ? 'warning' : 'critical'
  return <div className="stat"><span>{icon}</span><div><div className="stat-label"><span>{label}</span><b>{Math.round(value)}</b></div><div className="bar"><i className={level} style={{ width: `${value}%` }} /></div></div></div>
}

function overallStatus(game: GameState) {
  const values = [game.hunger, game.thirst, game.energy, game.health, game.hygiene, game.mood]
  const lowest = Math.min(...values)
  if (lowest <= 30) return { label: 'BAD', icon: '😣', level: 'bad' }
  if (lowest <= 60) return { label: 'FAIR', icon: '😐', level: 'fair' }
  return { label: 'OK', icon: '🙂', level: 'ok' }
}

export default function App() {
  const [game, setGame] = useState<GameState>(loadGame)
  const [message, setMessage] = useState('Morning. You have a little cash and no plan yet.')
  const [screen, setScreen] = useState<Screen>('location')
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null)
  const [trip, setTrip] = useState<Trip | null>(null)
  const current = useMemo(() => locations.find((x) => x.id === game.locationId) ?? locations[0], [game.locationId])
  const currentActions = actions.filter((x) => x.locationId === current.id)
  const open = isOpen(current, game.minutes)
  const overall = overallStatus(game)

  useEffect(() => { localStorage.setItem(SAVE_KEY, JSON.stringify(game)) }, [game])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      setGame((prev) => {
        const next = applyAction(prev, { minutes: 1 })
        if (!trip || trip.mode !== 'walk') return next
        return {
          ...next,
          energy: Math.max(0, next.energy - 0.12),
          thirst: Math.max(0, next.thirst - 0.04),
        }
      })
      setTrip((active) => {
        if (!active) return null
        if (active.remaining > 1) return { ...active, remaining: active.remaining - 1 }
        const destination = locations.find((x) => x.id === active.destinationId)
        if (destination) {
          setGame((prev) => ({ ...prev, locationId: destination.id }))
          setMessage(`You arrived at ${destination.name} by ${active.mode === 'walk' ? 'walking' : 'public transport'}.`)
          setScreen('location')
        }
        return null
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [trip])

  function chooseDestination(id: string) {
    if (id === game.locationId) {
      setScreen('location')
      return
    }
    setSelectedDestination(id)
  }

  function startTravel(mode: TravelMode) {
    const destination = locations.find((x) => x.id === selectedDestination)
    if (!destination) return
    const total = mode === 'walk' ? destination.travelMinutes : Math.max(4, Math.ceil(destination.travelMinutes * 0.35))
    const fare = 4.4
    if (mode === 'transit' && game.money < fare) {
      setMessage('You do not have enough money for public transport.')
      return
    }
    if (mode === 'transit') setGame((prev) => ({ ...prev, money: Math.max(0, prev.money - fare) }))
    setTrip({ destinationId: destination.id, mode, total, remaining: total })
    setSelectedDestination(null)
    setScreen('travel')
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
    setScreen('location')
    setTrip(null)
    setSelectedDestination(null)
  }

  const nav = (target: Screen, icon: string, label: string) =>
    <button className={screen === target ? 'nav-item active' : 'nav-item'} onClick={() => setScreen(target)}><span>{icon}</span><small>{label}</small></button>

  return <main className="shell">
    <header>
      <div><p className="eyebrow">STREET LIFE</p><h1>Day {game.day} <span className="weekday">{weekday(game.day)}</span> <span>{formatTime(game.minutes)}</span></h1></div>
      <div className="header-info">
        <button className={`overall-status ${overall.level}`} onClick={() => setScreen('status')}><span>{overall.icon}</span>{overall.label}</button>
        <div className="money">{game.money.toFixed(2)} zł</div>
      </div>
    </header>

    {screen === 'location' && <>
      <section className="current">
        <div className="location-icon">{current.icon}</div>
        <div><p className="eyebrow">YOU ARE HERE · {open ? 'OPEN' : `CLOSED · OPENS AT ${formatTime(current.open)}`}</p><h2>{current.name}</h2><p>{current.description}</p></div>
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
        }) : <p className="empty">Nothing useful to do here yet.</p>}
      </section>
    </>}

    {screen === 'map' && <>
      <div className="section-title map-title"><h2>City map</h2><span>Tap a place to travel</span></div>
      <section className="city-map">
        <div className="road road-a" /><div className="road road-b" /><div className="road road-c" />
        {locations.map((location) => {
          const here = location.id === game.locationId
          const locationOpen = isOpen(location, game.minutes)
          const pos = mapPositions[location.id] ?? { left: '45%', top: '45%' }
          return <button key={location.id} className={here ? 'map-pin here' : 'map-pin'} style={pos} onClick={() => chooseDestination(location.id)}>
            <span className="pin-icon">{location.icon}</span>
            <strong>{location.name}</strong>
            <small>{here ? 'You are here' : `${location.travelMinutes} min · ${locationOpen ? 'open' : 'closed'}`}</small>
          </button>
        })}
      </section>
      <section className="map-legend"><span>● Current location</span><span>Walking adds travel time</span></section>
    </>}

    {screen === 'travel' && trip && (() => {
      const destination = locations.find((x) => x.id === trip.destinationId)
      const progress = ((trip.total - trip.remaining) / trip.total) * 100
      return <section className="travel-screen">
        <div className="travel-icon">{trip.mode === 'walk' ? '🚶' : '🚌'}</div>
        <p className="eyebrow">ON THE WAY</p>
        <h2>{current.name} → {destination?.name}</h2>
        <p>{trip.mode === 'walk' ? 'Walking costs more energy and a little extra water.' : 'Public transport is faster and saves your energy.'}</p>
        <div className="travel-progress"><i style={{ width: `${progress}%` }} /></div>
        <strong>{trip.remaining} min remaining</strong>
        <small>{trip.remaining} real seconds</small>
      </section>
    })()}

    {selectedDestination && screen === 'map' && (() => {
      const destination = locations.find((x) => x.id === selectedDestination)
      if (!destination) return null
      const transitMinutes = Math.max(4, Math.ceil(destination.travelMinutes * 0.35))
      return <div className="travel-sheet">
        <button className="sheet-close" onClick={() => setSelectedDestination(null)}>×</button>
        <p className="eyebrow">TRAVEL TO</p>
        <h2>{destination.icon} {destination.name}</h2>
        <button className="travel-option" onClick={() => startTravel('walk')}>
          <span>🚶</span><div><strong>Walk</strong><small>{destination.travelMinutes} min · free · more energy</small></div>
        </button>
        <button className="travel-option" onClick={() => startTravel('transit')} disabled={game.money < 4.4}>
          <span>🚌</span><div><strong>Public transport</strong><small>{transitMinutes} min · 4.40 zł · less energy</small></div>
        </button>
      </div>
    })()}

    {screen === 'inventory' && <section className="placeholder"><span>🎒</span><h2>Inventory</h2><p>Your backpack is almost empty. Food, water, phone and documents will live here.</p></section>}
    {screen === 'status' && <section className="status-screen">
      <div className="status-heading"><div><p className="eyebrow">YOUR CONDITION</p><h2>{overall.icon} {overall.label}</h2></div><p>Your weakest need determines the overall condition.</p></div>
      <div className="status-needs">
        <Stat icon="🍞" label="Food" value={game.hunger} />
        <Stat icon="💧" label="Thirst" value={game.thirst} />
        <Stat icon="⚡" label="Energy" value={game.energy} />
        <Stat icon="❤️" label="Health" value={game.health} />
        <Stat icon="🚿" label="Hygiene" value={game.hygiene} />
        <Stat icon="🙂" label="Mood" value={game.mood} />
      </div>
    </section>}
    {screen === 'journal' && <section className="placeholder"><span>📓</span><h2>Journal</h2><p>Objectives, appointments and important events will be recorded here.</p></section>}

    <footer><button className="reset" onClick={reset}>Reset save</button></footer>
    <nav className={screen === 'travel' ? 'bottom-nav travelling' : 'bottom-nav'}>
      {nav('map', '🗺️', 'Map')}
      {nav('inventory', '🎒', 'Inventory')}
      <button className={screen === 'location' ? 'nav-item home active' : 'nav-item home'} onClick={() => setScreen('location')}><span>{current.icon}</span><small>Place</small></button>
      {nav('status', '👤', 'Status')}
      {nav('journal', '📓', 'Journal')}
    </nav>
  </main>
}
