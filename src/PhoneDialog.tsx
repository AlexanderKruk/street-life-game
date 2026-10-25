import { ModalOverlay, ModalPanel, ModalAction } from './Modal'
import { useEffect, useRef } from 'react'
import { BatteryIcon, Icon } from './Icon'

type PhoneDialogProps = {
  battery: number; serviceActive: boolean; serviceMinutesLeft: number; canBuyService: boolean;
  autoRenew: boolean; blocked: boolean;
  onClose: () => void; onBuyService: () => void; onAutoRenew: () => void;
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
  return <ModalOverlay className="phone-overlay phone-list-overlay" inert={props.blocked} aria-hidden={props.blocked || undefined} onClick={() => { if (!props.blocked) props.onClose() }}>
    <ModalPanel size="compact" className="phone-modal phone-list-modal" role="dialog" aria-modal="true" aria-labelledby="phone-dialog-title" ref={dialog} onClick={event => event.stopPropagation()}>
      <header className="phone-list-header"><h2 id="phone-dialog-title">Mobile plan</h2><span className="phone-list-battery" aria-label={`Phone battery: ${Math.round(props.battery)}%`}><BatteryIcon charge={props.battery} />{Math.round(props.battery)}%</span><button className="sheet-close phone-list-close" aria-label="Close mobile plan" ref={closeButton} onClick={props.onClose}><Icon name="close" /></button></header>
      <div className="phone-list-service"><div className="phone-list-copy"><strong><Icon name="signal" />Mobile service</strong><small className={props.serviceActive ? 'service-active' : undefined}>{props.serviceActive ? `Active · ${props.serviceMinutesLeft >= 60 ? Math.ceil(props.serviceMinutesLeft / 60) + 'h left' : props.serviceMinutesLeft + 'm left'}` : 'No active service'}</small></div><ModalAction variant="secondary" className="phone-list-pay" onClick={props.onBuyService} disabled={!props.canBuyService} aria-label="Add 24 hours of mobile service for 1 zł">+24h<small>1 zł</small></ModalAction></div>
      <button className="phone-list-row" role="switch" aria-checked={props.autoRenew} aria-label="Auto-renew" onClick={props.onAutoRenew}><Icon name="renew" /><span className="phone-list-copy"><strong>Auto-renew</strong><small>1 zł when service expires</small></span><span className="phone-list-toggle"><span>{props.autoRenew ? 'ON' : 'OFF'}</span><i className={props.autoRenew ? 'phone-switch on' : 'phone-switch'} aria-hidden="true" /></span></button>
    </ModalPanel>
  </ModalOverlay>
}
