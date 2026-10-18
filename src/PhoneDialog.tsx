import { useEffect, useRef } from 'react'
import { BatteryIcon, Icon, type IconName } from './Icon'
import { shuffleChoiceOrder } from './streetChoiceOrder'

type PhoneDialogProps = {
  orderSeed?: number; decisionKey?: string;
  battery: number; serviceActive: boolean; serviceMinutesLeft: number; canBuyService: boolean;
  autoRenew: boolean; navigation: boolean; music: boolean; navigationRate: number; navigationInBrightSun: boolean; videoDrain: number;
  showAi: boolean; canAskAi: boolean; canNavigate: boolean; canWatchVideo: boolean; canCallAmbulance: boolean; lowHealth: boolean; blocked: boolean;
  onClose: () => void; onBuyService: () => void; onAutoRenew: () => void; onNavigation: () => void;
  onMusic: () => void; onAskAi: () => void; onWatchVideo: () => void; onCallAmbulance: () => void;
}

export default function PhoneDialog(props: PhoneDialogProps) {
  const dialog = useRef<HTMLElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const latest = useRef(props)
  latest.current = props
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const body = document.body
    const root = document.documentElement
    const x = window.scrollX, y = window.scrollY
    const saved = { position: body.style.position, top: body.style.top, left: body.style.left, width: body.style.width, overflow: body.style.overflow, rootOverflow: root.style.overflow }
    body.style.position = 'fixed'
    body.style.top = `${-y}px`
    body.style.left = `${-x}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    root.style.overflow = 'hidden'
    closeButton.current?.focus({ preventScroll: true })
    function onKey(event: KeyboardEvent) {
      if (latest.current.blocked) return
      if (event.key === 'Escape') { event.preventDefault(); latest.current.onClose(); return }
      if (event.key !== 'Tab' || !dialog.current) return
      const buttons = Array.from(dialog.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
      if (!buttons.length) return
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
      event.preventDefault()
      buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      body.style.position = saved.position
      body.style.top = saved.top
      body.style.left = saved.left
      body.style.width = saved.width
      body.style.overflow = saved.overflow
      root.style.overflow = saved.rootOverflow
      window.scrollTo(x, y)
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [])
  type Row = { id: string; label: string; icon: IconName; detail: string; disabled: boolean; onClick: () => void; checked?: boolean; minutes?: string }
  const rows: Row[] = [
    ...(props.showAi ? [{ id: 'ai', label: 'Ask AI', icon: 'help' as IconName, detail: 'Searches for one new place', minutes: '≈15m', disabled: !props.canAskAi, onClick: props.onAskAi }] : []),
    { id: 'navigation', label: 'Navigation', icon: 'navigation', detail: `${props.navigationRate}%/h ${props.navigationInBrightSun ? 'in bright sun' : 'while travelling'}`, disabled: !props.canNavigate, checked: props.navigation, onClick: props.onNavigation },
    { id: 'music', label: 'Music', icon: 'music', detail: '4%/h · slowly improves Mood', disabled: !props.canNavigate, checked: props.music, onClick: props.onMusic },
    { id: 'video', label: 'Watch video', icon: 'video', detail: `Battery ≈−${props.videoDrain}% · Mood+`, minutes: '30m', disabled: !props.canWatchVideo, onClick: props.onWatchVideo },
    { id: 'ambulance', label: 'Call ambulance', icon: 'ambulance', detail: props.lowHealth ? 'Emergency · no documents required' : 'Available at Health 20 or lower', disabled: !props.canCallAmbulance, onClick: props.onCallAmbulance },
  ]
  const actions = shuffleChoiceOrder(rows.filter(row => row.checked === undefined), props.orderSeed ?? 0, `${props.decisionKey ?? ''}|phone`)
  let actionIndex = 0
  const orderedRows = rows.map(row => row.checked !== undefined ? row : actions[actionIndex++])
  function renderRow(row: Row) {
    return <button key={row.id} className="phone-list-row" disabled={row.disabled} onClick={row.onClick} aria-label={row.label} role={row.checked !== undefined ? 'switch' : undefined} aria-checked={row.checked}>
      <Icon name={row.icon} />
      <span className="phone-list-copy"><strong>{row.label}</strong><small>{row.detail}</small></span>
      {row.checked !== undefined ? <span className="phone-list-toggle"><span>{row.checked ? 'ON' : 'OFF'}</span><i className={row.checked ? 'phone-switch on' : 'phone-switch'} aria-hidden="true" /></span> : row.minutes ? <span className="phone-list-time"><Icon name="clock" />{row.minutes}</span> : null}
    </button>
  }
  return <div className="phone-overlay phone-list-overlay" inert={props.blocked} aria-hidden={props.blocked || undefined} onClick={() => { if (!props.blocked) props.onClose() }}>
    <section className="phone-modal phone-list-modal" role="dialog" aria-modal="true" aria-labelledby="phone-dialog-title" ref={dialog} onClick={event => event.stopPropagation()}>
      <header className="phone-list-header"><h2 id="phone-dialog-title">Phone</h2><span className="phone-list-battery" aria-label={`Phone battery: ${Math.round(props.battery)}%`}><BatteryIcon charge={props.battery} />{Math.round(props.battery)}%</span><button className="sheet-close phone-list-close" aria-label="Close phone" ref={closeButton} onClick={props.onClose}><Icon name="close" /></button></header>
      <div className="phone-list-service"><div className="phone-list-copy"><strong><Icon name="signal" />Mobile service</strong><small className={props.serviceActive ? 'service-active' : undefined}>{props.serviceActive ? `Active · ${props.serviceMinutesLeft >= 60 ? Math.ceil(props.serviceMinutesLeft / 60) + 'h left' : props.serviceMinutesLeft + 'm left'}` : 'No active service'}</small></div><button className="phone-list-pay" onClick={props.onBuyService} disabled={!props.canBuyService} aria-label="Add 24 hours of mobile service for 1 zł">+24h<small>1 zł</small></button></div>
      <button className="phone-list-row" role="switch" aria-checked={props.autoRenew} aria-label="Auto-renew" onClick={props.onAutoRenew}><Icon name="renew" /><span className="phone-list-copy"><strong>Auto-renew</strong><small>1 zł when service expires</small></span><span className="phone-list-toggle"><span>{props.autoRenew ? 'ON' : 'OFF'}</span><i className={props.autoRenew ? 'phone-switch on' : 'phone-switch'} aria-hidden="true" /></span></button>
      <div className="phone-list-actions">{orderedRows.filter(row => !row.disabled).map(renderRow)}{orderedRows.some(row => row.disabled) && <p className="unavailable-heading">Unavailable now</p>}{orderedRows.filter(row => row.disabled).map(renderRow)}</div>
    </section>
  </div>
}
