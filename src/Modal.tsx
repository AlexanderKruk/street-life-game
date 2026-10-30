import type { ComponentProps } from 'react'

// Visual primitives only. Each caller retains its existing pause, focus,
// dismissal and save behavior; opening a modal must not change gameplay.
export function ModalOverlay({ className = '', ...props }: ComponentProps<'div'>) {
  return <div {...props} className={`modal-overlay ${className}`} />
}

export function ModalPanel({ className = '', size = 'regular', ...props }: ComponentProps<'section'> & { size?: 'regular' | 'compact' }) {
  return <section {...props} className={`modal-panel modal-panel--${size} ${className}`} />
}

export function ModalAction({ className = '', variant = 'primary', type = 'button', iconOnly = false, floating = false, ...props }: ComponentProps<'button'> & { variant?: 'primary' | 'secondary' | 'danger' | 'outline'; iconOnly?: boolean; floating?: boolean }) {
  return <button {...props} type={type} className={`modal-action modal-action--${variant}${iconOnly ? ' modal-action--icon-only' : ''}${floating ? ' modal-action--floating' : ''} ${className}`} />
}
