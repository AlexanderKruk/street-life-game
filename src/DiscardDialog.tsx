import { useEffect, useRef } from 'react'
import { Icon } from './Icon'

export default function DiscardDialog({ name, quantity, onCancel, onConfirm }: { name: string; quantity: number; onCancel: () => void; onConfirm: () => void }) {
  const dialog = useRef<HTMLElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onCancel(); return }
      if (event.key !== 'Tab') return
      const buttons = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])
      if (!buttons.length) return
      event.preventDefault()
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
      buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus()
    }
    document.addEventListener('keydown', keydown)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', keydown)
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [onCancel])
  return <div className="phone-overlay result-overlay" onClick={event => { if (event.target === event.currentTarget) onCancel() }}>
    <section ref={dialog} className="phone-modal discard-modal" role="dialog" aria-modal="true" aria-labelledby="discard-title" aria-describedby="discard-description">
      <div className="timed-heading"><Icon name="trash" /><div><p className="eyebrow">BACKPACK · TIME PAUSED</p><h2 id="discard-title">Discard {name} ×{quantity}?</h2></div></div>
      <p id="discard-description">This removes the contents of this slot from your backpack. You cannot get them back.</p>
      <div className="sleep-choice-buttons"><button type="button" onClick={onCancel}>Cancel</button><button type="button" className="discard-confirm" onClick={onConfirm}>Discard</button></div>
    </section>
  </div>
}
