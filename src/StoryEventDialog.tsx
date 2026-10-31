import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { t } from './i18n'
import { ModalAction, ModalOverlay, ModalPanel } from './Modal'
import StoryScreen from './StoryScreen'
import type { StoryEpisode } from './story'
import type { StoryInteraction } from './StoryLiveControls'
import { useStoryScroll } from './useStoryScroll'
import { scheduleStoryClose } from './storyAutoClose'

/** The same chronology as the Story tab, opened at its live end. */
export default function StoryEventDialog({ episodes, interaction, minute, label, canClose, autoClose = false, onClose }: {
  episodes: StoryEpisode[]; interaction?: StoryInteraction; minute: number; label: string; canClose: boolean; autoClose?: boolean; onClose: () => void
}) {
  const current = useRef({ canClose, onClose })
  current.current = { canClose, onClose }
  const panel = useRef<HTMLElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const bottomControl = useRef<HTMLButtonElement>(null)
  const { awayFromBottom, scrollToBottom } = useStoryScroll(content, true, () => {
    if (bottomControl.current && document.activeElement === bottomControl.current) panel.current?.focus({ preventScroll: true })
  })
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden')
  const [closing, setClosing] = useState(false)
  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  useEffect(() => {
    setClosing(false)
    if (!autoClose || !canClose || awayFromBottom || !visible) return
    return scheduleStoryClose(window, () => setClosing(true), () => { if (current.current.canClose) current.current.onClose() },
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  }, [autoClose, canClose, awayFromBottom, visible, interaction?.episodeId])
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
      const controls = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]') ?? []).filter(node => !node.closest('[hidden], [inert]'))
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
  return <ModalOverlay className={`story-event-overlay${closing ? ' is-auto-closing' : ''}`} role="dialog" aria-modal="true" aria-label={label} onClick={event => { if (canClose && event.target === event.currentTarget) onClose() }}>
    <ModalPanel ref={panel} tabIndex={-1} className="story-event-panel">
      {canClose && <ModalAction variant="outline" iconOnly floating className="story-event-close" aria-label={t('common.close')} onClick={onClose}><Icon name="close" className="icon" /></ModalAction>}
      <div ref={content} className="story-event-content"><StoryScreen episodes={episodes} interaction={interaction} currentMinute={minute} presentation="event" /></div>
      {awayFromBottom && <ModalAction ref={bottomControl} variant="outline" iconOnly floating className="story-event-bottom" aria-label={t('story.latest')} onClick={scrollToBottom}><Icon name="arrow-down-to-line" className="icon" /></ModalAction>}
    </ModalPanel>
  </ModalOverlay>
}
