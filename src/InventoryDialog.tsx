import { ModalOverlay, ModalPanel } from './Modal'
import { useEffect, useRef, type ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { t } from './i18n'

export default function InventoryDialog({ title, description, label = t('inventoryDialog.paused'), icon, onCancel, children }: { title: string; description?: string; label?: string; icon: IconName; onCancel: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onCancel(); return }
      if (event.key !== 'Tab') return
      const buttons = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
      if (!buttons.length) return
      event.preventDefault()
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
      buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus()
    }
    document.addEventListener('keydown', keydown)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', keydown)
      if (previous?.isConnected && !document.querySelector('[role="dialog"]')) previous.focus({ preventScroll: true })
    }
  }, [onCancel])
  return <ModalOverlay className="phone-overlay result-overlay" onClick={event => { if (event.target === event.currentTarget) onCancel() }}>
    <ModalPanel ref={dialog} size="compact" className="phone-modal discard-modal" role="dialog" aria-modal="true" aria-labelledby="inventory-dialog-title" aria-describedby={description ? 'inventory-dialog-description' : undefined}>
      <div className="timed-heading"><Icon name={icon} /><div><p className="eyebrow">{label}</p><h2 id="inventory-dialog-title">{title}</h2></div></div>
      {description && <p id="inventory-dialog-description" className="modal-narrative">{description}</p>}
      {children}
    </ModalPanel>
  </ModalOverlay>
}
