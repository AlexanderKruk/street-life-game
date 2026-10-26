import { t } from './i18n'
import { formatNumber } from './i18n/formatters'
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
      <header className="phone-list-header"><h2 id="phone-dialog-title">{t('phone.ui.plan')}</h2><span className="phone-list-battery" aria-label={t('phone.ui.battery', { amount: formatNumber(Math.round(props.battery)) })}><BatteryIcon charge={props.battery} />{t('format.percent', { amount: formatNumber(Math.round(props.battery)) })}</span><button className="sheet-close phone-list-close" aria-label={t('phone.ui.closePlan')} ref={closeButton} onClick={props.onClose}><Icon name="close" /></button></header>
      <div className="phone-list-service"><div className="phone-list-copy"><strong><Icon name="signal" />{t('phone.ui.service')}</strong><small className={props.serviceActive ? 'service-active' : undefined}>{props.serviceActive ? props.serviceMinutesLeft >= 60 ? t('phone.ui.service.hours', { hours: Math.ceil(props.serviceMinutesLeft / 60) }) : t('phone.ui.service.minutes', { minutes: props.serviceMinutesLeft }) : t('phone.ui.service.inactive')}</small></div><ModalAction variant="secondary" className="phone-list-pay" onClick={props.onBuyService} disabled={!props.canBuyService} aria-label={t('phone.ui.buyAccessible')}>{t('phone.ui.buyDuration')}<small>{t('phone.ui.buyPrice')}</small></ModalAction></div>
      <button className="phone-list-row" role="switch" aria-checked={props.autoRenew} aria-label={t('phone.ui.renew')} onClick={props.onAutoRenew}><Icon name="renew" /><span className="phone-list-copy"><strong>{t('phone.ui.renew')}</strong><small>{t('phone.ui.renewPrice')}</small></span><span className="phone-list-toggle"><span>{t(props.autoRenew ? 'phone.ui.on' : 'phone.ui.off')}</span><i className={props.autoRenew ? 'phone-switch on' : 'phone-switch'} aria-hidden="true" /></span></button>
    </ModalPanel>
  </ModalOverlay>
}
