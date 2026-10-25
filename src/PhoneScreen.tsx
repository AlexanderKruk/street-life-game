import { useEffect, useRef, type ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export type PhoneApp = 'home' | 'goals' | 'notes' | 'history' | 'search'
const apps: { id: Exclude<PhoneApp, 'home'>; label: string; icon: IconName }[] = [
  { id: 'search', label: 'Find Help', icon: 'search' },
  { id: 'goals', label: 'Goals', icon: 'target-arrow' },
  { id: 'notes', label: 'Notes', icon: 'notepad' },
  { id: 'history', label: 'History', icon: 'history' },
]

type Props = {
  busy?: boolean; app: PhoneApp; onApp: (app: PhoneApp) => void; pendingGoals: number;
  unavailable: string | null; serviceActive: boolean; serviceMinutesLeft: number;
  onPlan: () => void; children: ReactNode;
}
export default function PhoneScreen({ busy = false, app, onApp, pendingGoals, unavailable, serviceActive, serviceMinutesLeft, onPlan, children }: Props) {
  const heading = useRef<HTMLHeadingElement>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const previous = useRef(app)
  useEffect(() => {
    if (previous.current !== app) (app === 'home' ? launcher.current : heading.current)?.focus({ preventScroll: true })
    previous.current = app
  }, [app])
  const selected = apps.find(entry => entry.id === app)
  return <section className="phone-screen" aria-label="Phone" inert={busy} aria-hidden={busy || undefined}>
    <header className={`phone-screen-header${app === 'home' ? ' phone-home-header' : ''}`}>
      <div className="phone-screen-heading">
        {app !== 'home' && !unavailable && <button type="button" className="phone-back" aria-label="Back to phone" onClick={() => onApp('home')}><Icon name="chevron-left" /></button>}
        <h2 ref={heading} tabIndex={-1}>{selected?.label ?? 'Phone'}</h2>
        {app === 'goals' && <span className="phone-goals-count" aria-label={`${pendingGoals} incomplete goals`}>{pendingGoals}</span>}
      </div>
      <button type="button" className={`phone-plan-status ${serviceActive ? 'paid' : 'unpaid'}`} aria-label="Mobile plan" disabled={!!unavailable} onClick={event => { event.currentTarget.focus({ preventScroll: true }); onPlan() }} title={serviceActive ? `Mobile internet: ${serviceMinutesLeft >= 60 ? Math.ceil(serviceMinutesLeft / 60) + 'h' : serviceMinutesLeft + 'm'} left. Manage plan.` : 'Mobile internet is unpaid. Manage plan.'}>
        <span>1 zł/day</span><span aria-hidden="true">·</span><i aria-hidden="true" /><span>{serviceActive ? 'Paid' : 'Unpaid'}</span>
      </button>
    </header>
    {unavailable ? <div className="phone-unavailable" role="status"><Icon name="phone" /><h3>Phone unavailable</h3><p>{unavailable}</p><p>You can still use the map to reach places you know.</p></div>
      : app === 'home' ? <div className="phone-app-grid" aria-label="Phone apps">{apps.map(entry => <button type="button" className={`phone-app ${entry.id}`} key={entry.id} ref={entry.id === (serviceActive ? 'search' : 'goals') ? launcher : undefined} aria-label={entry.label} disabled={entry.id === 'search' && !serviceActive} onClick={() => onApp(entry.id)}>
        <span className="phone-app-art"><Icon name={entry.icon} />{entry.id === 'goals' && pendingGoals > 0 && <span className="phone-app-badge" aria-label={`${pendingGoals} active goals`}>{pendingGoals}</span>}</span>
        <span>{entry.label}</span>{entry.id === 'search' && !serviceActive && <small>Internet unpaid</small>}
      </button>)}</div>
      : <div className={`phone-app-content phone-${app}`}>{children}</div>}
  </section>
}
