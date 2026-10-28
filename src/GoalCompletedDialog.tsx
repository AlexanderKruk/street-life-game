import { useEffect, useRef } from 'react'
import { Icon } from './Icon'
import { ModalOverlay, ModalPanel, ModalAction } from './Modal'
import { t } from './i18n'

export default function GoalCompletedDialog({ title, onClose }: { title: string; onClose: () => void }) {
  const confirm = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const body = document.body
    const root = document.documentElement
    const x = window.scrollX, y = window.scrollY
    const saved = { position: body.style.position, top: body.style.top, left: body.style.left,
      width: body.style.width, overflow: body.style.overflow, rootOverflow: root.style.overflow }
    Object.assign(body.style, { position: 'fixed', top: `${-y}px`, left: `${-x}px`, width: '100%', overflow: 'hidden' })
    root.style.overflow = 'hidden'
    confirm.current?.focus({ preventScroll: true })
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose() }
      if (event.key === 'Tab') { event.preventDefault(); confirm.current?.focus({ preventScroll: true }) }
    }
    document.addEventListener('keydown', keydown)
    return () => {
      Object.assign(body.style, { position: saved.position, top: saved.top, left: saved.left, width: saved.width, overflow: saved.overflow })
      root.style.overflow = saved.rootOverflow
      document.removeEventListener('keydown', keydown)
      window.scrollTo(x, y)
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [onClose])
  return <ModalOverlay className="result-overlay">
    <ModalPanel size="compact" className="goal-completed-modal" role="dialog" aria-modal="true" aria-labelledby="goal-completed-title" aria-describedby="goal-completed-label">
      <div className="goal-completed-emblem"><Icon name="party-popper" /></div>
      <p id="goal-completed-label" className="goal-completed-label">{t('journal.ui.goalCompleted')}</p>
      <h2 id="goal-completed-title">{title}</h2>
      <ModalAction ref={confirm} onClick={onClose}>{t('common.gotIt')}</ModalAction>
    </ModalPanel>
  </ModalOverlay>
}
