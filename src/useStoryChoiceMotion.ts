import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

type Motion = { index: number; selected: HTMLElement; from: DOMRect; animations: Animation[]; started: boolean }

/** Ephemeral layout/paint only. The existing choice handler still commits immediately. */
export function useStoryChoiceMotion(track: RefObject<HTMLDivElement | null>, nodes: RefObject<(HTMLDivElement | null)[]>, active: boolean, replay: number) {
  const layer = useRef<HTMLDivElement>(null)
  const floor = useRef({ width: 0, height: 0 })
  const motion = useRef<Motion | null>(null)
  function clear() {
    const current = motion.current
    motion.current = null
    current?.animations.forEach(animation => animation.cancel())
    layer.current?.replaceChildren()
  }
  function reserve() {
    const element = track.current
    if (!element) return
    const box = element.getBoundingClientRect()
    if (box.width !== floor.current.width) {
      floor.current = { width: box.width, height: 0 }
      element.style.minHeight = ''
      clear()
    }
    const height = Math.ceil(element.getBoundingClientRect().height)
    if (height > floor.current.height) {
      floor.current.height = height
      element.style.minHeight = `${height}px`
    }
  }
  useEffect(() => {
    if (!active || !track.current || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(reserve)
    observer.observe(track.current)
    return () => observer.disconnect()
  }, [active])
  useLayoutEffect(() => {
    if (!replay) return
    clear()
    floor.current = { width: 0, height: 0 }
    if (track.current) {
      track.current.style.minHeight = ''
      track.current.querySelectorAll('[data-story-choice-motion]').forEach(node => node.removeAttribute('data-story-choice-motion'))
    }
  }, [replay])
  useEffect(() => clear, [])
  function choose(button: HTMLButtonElement, index: number) {
    reserve()
    clear()
    const element = track.current, overlay = layer.current
    const controls = button.closest<HTMLElement>('.story-live-controls')
    if (!element || !overlay || !controls || typeof button.animate !== 'function' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const base = element.getBoundingClientRect(), from = button.getBoundingClientRect(), group = controls.getBoundingClientRect()
    const copy = controls.cloneNode(true) as HTMLElement
    const ordinal = Array.from(controls.querySelectorAll('.story-live-choice')).indexOf(button)
    const selected = copy.querySelectorAll<HTMLElement>('.story-live-choice')[ordinal]
    if (!selected) return
    // Inert paint snapshots must not duplicate live IDs, focus targets or commands.
    copy.inert = true
    copy.setAttribute('aria-hidden', 'true')
    copy.querySelectorAll<HTMLElement>('*').forEach(node => {
      for (const attribute of ['id', 'data-order-id', 'data-choice', 'autofocus']) node.removeAttribute(attribute)
      node.style.animation = 'none'
    })
    Object.assign(copy.style, { position: 'absolute', left: `${group.left - base.left}px`, top: `${group.top - base.top}px`, width: `${group.width}px` })
    overlay.appendChild(copy)
    const spacer = document.createElement('div')
    spacer.style.height = `${from.height}px`
    selected.replaceWith(spacer)
    overlay.appendChild(selected)
    Object.assign(selected.style, { position: 'absolute', left: `${from.left - base.left}px`, top: `${from.top - base.top}px`, width: `${from.width}px`, height: `${from.height}px`, minHeight: '0', margin: '0', overflow: 'hidden' })
    const animations: Animation[] = []
    for (const node of copy.querySelectorAll<HTMLElement>('.story-live-choice')) animations.push(node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }))
    // If no new saved choice appears (for example a dismissed process), settle safely.
    const fallback = selected.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, fill: 'forwards' })
    animations.push(fallback)
    const current: Motion = { index, selected, from, animations, started: false }
    motion.current = current
    fallback.onfinish = () => { if (motion.current === current) clear() }
  }
  useLayoutEffect(() => {
    const current = motion.current, element = track.current
    const piece = current && nodes.current[current.index]
    const target = piece?.querySelector<HTMLElement>('.story-reveal, p')
    if (!current || current.started || !element || !piece?.classList.contains('story-choice') || !target?.textContent || piece.hidden) return
    current.started = true
    // Replace the usual answer entrance with this one shared 650ms movement.
    piece.dataset.storyChoiceMotion = 'true'
    const base = element.getBoundingClientRect(), destination = target.getBoundingClientRect()
    const end = { transform: `translate(${destination.left - current.from.left}px, ${destination.top - current.from.top}px)`, width: `${destination.width}px`, height: `${destination.height}px`, padding: '0px', backgroundColor: 'transparent', borderColor: 'transparent', color: window.getComputedStyle(target).color }
    const fallback = current.animations.at(-1)!
    fallback.onfinish = null; fallback.cancel()
    const detail = current.selected.querySelector('small')
    if (detail) current.animations.push(detail.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }))
    const flight = current.selected.animate([{ transform: 'translate(0, 0)', opacity: 1 }, { ...end, opacity: 1, offset: .85 }, { ...end, opacity: 0 }], { duration: 650, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' })
    const arrival = target.animate([{ opacity: 0 }, { opacity: 0, offset: .85 }, { opacity: 1 }], { duration: 650, fill: 'both' })
    current.animations.push(flight, arrival)
    flight.onfinish = () => { if (motion.current === current) clear() }
    // Keep the snapshot in track coordinates even when the scroller moves.
    current.selected.style.left = `${current.from.left - base.left}px`
    current.selected.style.top = `${current.from.top - base.top}px`
  })
  return { layer, choose, reserve }
}
