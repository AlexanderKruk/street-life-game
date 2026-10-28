import { t } from './i18n'
import { useEffect, useRef, type ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export type PhoneApp = 'home' | 'goals' | 'notes' | 'history' | 'search' | 'settings' | 'language'
const apps: { id: Exclude<PhoneApp, 'home' | 'language'>; label: string; icon: IconName }[] = [
  { id: 'search', label: t('phone.ui.app.search'), icon: 'search' },
  { id: 'goals', label: t('phone.ui.app.goals'), icon: 'target-arrow' },
  { id: 'notes', label: t('phone.ui.app.notes'), icon: 'notepad' },
  { id: 'history', label: t('phone.ui.app.history'), icon: 'history' },
  { id: 'settings', label: t('phone.ui.app.settings'), icon: 'settings' },
]

type Props = {
  busy?: boolean; app: PhoneApp; onApp: (app: PhoneApp) => void; pendingGoals: number;
  unavailable: string | null; serviceActive: boolean; serviceMinutesLeft: number;
  onPlan: () => void; children: ReactNode;
}
export default function PhoneScreen({ busy = false, app, onApp, pendingGoals, unavailable, serviceActive, serviceMinutesLeft, onPlan, children }: Props) {
  const heading = useRef<HTMLHeadingElement>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const settingsLauncher = useRef<HTMLButtonElement>(null)
  const previous = useRef(app)
  useEffect(() => {
    if (previous.current !== app) (app === 'home' ? previous.current === 'settings' ? settingsLauncher.current : launcher.current : heading.current)?.focus({ preventScroll: true })
    previous.current = app
  }, [app])
  const selected = apps.find(entry => entry.id === app)
  return <section className="phone-screen" aria-label={t('phone.ui.phone')} inert={busy} aria-hidden={busy || undefined}>
    <header className={`phone-screen-header${app === 'home' ? ' phone-home-header' : ''}`}>
      <div className="phone-screen-heading">
        {app !== 'home' && unavailable === null && <button type="button" className="phone-back" aria-label={t(app === 'language' ? 'phone.ui.backSettings' : 'phone.ui.back')} onClick={() => onApp(app === 'language' ? 'settings' : 'home')}><Icon name="chevron-left" /></button>}
        <h2 ref={heading} tabIndex={-1}>{app === 'language' ? t('phone.ui.language') : selected?.label ?? t('phone.ui.phone')}</h2>
        {app === 'goals' && <span className="phone-goals-count" aria-label={t('phone.ui.incompleteGoals', { count: pendingGoals })}>{pendingGoals}</span>}
      </div>
      <button type="button" className={`phone-plan-status ${serviceActive ? 'paid' : 'unpaid'}`} aria-label={t('phone.ui.plan')} disabled={unavailable !== null} onClick={event => { event.currentTarget.focus({ preventScroll: true }); onPlan() }} title={serviceActive ? serviceMinutesLeft >= 60 ? t('phone.ui.plan.hours', { hours: Math.ceil(serviceMinutesLeft / 60) }) : t('phone.ui.plan.minutes', { minutes: serviceMinutesLeft }) : t('phone.ui.plan.unpaid')}>
        <span>{t('phone.ui.dailyPrice')}</span><span aria-hidden="true">·</span><i aria-hidden="true" /><span>{t(serviceActive ? 'phone.ui.paid' : 'phone.ui.unpaid')}</span>
      </button>
    </header>
    {unavailable !== null ? <div className="phone-unavailable" role="status"><Icon name="phone" /><h3>{t('phone.ui.unavailableTitle')}</h3><p>{unavailable}</p><p>{t('phone.ui.mapHint')}</p></div>
      : app === 'home' ? <div className="phone-app-grid" aria-label={t('phone.ui.apps')}>{apps.map(entry => <button type="button" className={`phone-app ${entry.id}`} key={entry.id} ref={entry.id === 'settings' ? settingsLauncher : entry.id === (serviceActive ? 'search' : 'goals') ? launcher : undefined} aria-label={entry.label} disabled={entry.id === 'search' && !serviceActive} onClick={() => onApp(entry.id)}>
        <span className="phone-app-art"><Icon name={entry.icon} />{entry.id === 'goals' && pendingGoals > 0 && <span className="phone-app-badge" aria-label={t('phone.ui.activeGoals', { count: pendingGoals })}>{pendingGoals}</span>}</span>
        <span>{entry.label}</span>{entry.id === 'search' && !serviceActive && <small>{t('phone.ui.internetUnpaid')}</small>}
      </button>)}</div>
      : <div className={`phone-app-content phone-${app}`}>{children}</div>}
  </section>
}
