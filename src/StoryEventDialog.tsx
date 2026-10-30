import { useEffect, useRef } from 'react'
import { Icon } from './Icon'
import { t } from './i18n'
import { ModalOverlay, ModalPanel } from './Modal'
import StoryScreen from './StoryScreen'
import type { StoryEpisode } from './story'
import type { StoryInteraction } from './StoryLiveControls'

/** One modal shell around the same live episode used by the Story tab. */
export default function StoryEventDialog({ episode, interaction, minute, label, canClose, onClose }: {
  episode?: StoryEpisode; interaction?: StoryInteraction; minute: number; label: string; canClose: boolean; onClose: () => void
}) {
  const current = useRef({ canClose, onClose })
  current.current = { canClose, onClose }
  const panel = useRef<HTMLElement>(null)
  // Capture before the same commit makes the previous screen inert/disabled.
  const previousFocus = useRef(document.activeElement as HTMLElement | null)
  useEffect(() => {
    const previous = previousFocus.current
    const body = document.body, root = document.documentElement
    const x = window.scrollX, y = window.scrollY
    const saved = { position: body.style.position, top: body.style.top, left: body.style.left, width: body.style.width, overflow: body.style.overflow, rootOverflow: root.style.overflow }
    body.style.position = 'fixed'; body.style.top = `${-y}px`; body.style.left = `${-x}px`; body.style.width = '100%'; body.style.overflow = 'hidden'; root.style.overflow = 'hidden'
    panel.current?.focus({ preventScroll: true })
    const trap = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); if (current.current.canClose) current.current.onClose(); return }
      if (event.key !== 'Tab') return
      event.preventDefault(); event.stopImmediatePropagation()
      const controls = [...Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]') ?? []), ...(current.current.canClose ? Array.from(document.querySelectorAll<HTMLElement>('.bottom-nav button:not(:disabled)')) : [])].filter(node => !node.closest('[hidden], [inert]'))
      if (!controls.length) { panel.current?.focus({ preventScroll: true }); return }
      const index = controls.indexOf(document.activeElement as HTMLElement)
      controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus({ preventScroll: true })
    }
    document.addEventListener('keydown', trap, true)
    return () => {
      document.removeEventListener('keydown', trap, true)
      Object.assign(body.style, { position: saved.position, top: saved.top, left: saved.left, width: saved.width, overflow: saved.overflow })
      root.style.overflow = saved.rootOverflow
      window.scrollTo(x, y)
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [])
  return <ModalOverlay className="story-event-overlay" role="dialog" aria-modal={!canClose || undefined} aria-label={label} onClick={event => { if (canClose && event.target === event.currentTarget) onClose() }}>
    <ModalPanel ref={panel} tabIndex={-1} className="story-event-panel">
      {canClose && <button className="sheet-close story-event-close" aria-label={t('common.close')} onClick={onClose}><Icon name="close" /></button>}
      <div className="story-event-content"><StoryScreen episodes={episode ? [episode] : []} interaction={interaction} currentMinute={minute} presentation="event" /></div>
    </ModalPanel>
  </ModalOverlay>
}
