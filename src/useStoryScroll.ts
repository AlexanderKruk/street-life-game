import { useEffect, useRef, useState, type RefObject } from 'react'

/** Presentation only: one moving target, never a queue of smooth-scroll requests. */
export function useStoryScroll(root: RefObject<HTMLElement | null>, enabled = true, onAtBottom?: () => void) {
  const [awayFromBottom, setAway] = useState(false)
  const bottomCallback = useRef(onAtBottom)
  bottomCallback.current = onAtBottom
  const jump = useRef<() => void>(() => {})
  useEffect(() => {
    const element = root.current
    const scroller = element?.closest<HTMLElement>('.story-event-content, .game-content')
    if (!enabled || !element || !scroller) return
    const target = element === scroller ? element.firstElementChild : element
    let following = true, frame = 0, last: number | null = null, expected = -1
    const bottom = () => Math.max(0, scroller.scrollHeight - scroller.clientHeight)
    const reduced = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const cancel = () => { window.cancelAnimationFrame(frame); frame = 0; last = null }
    const update = () => {
      const away = bottom() - scroller.scrollTop > 64
      if (!away) bottomCallback.current?.()
      setAway(away)
    }
    const write = (value: number) => { scroller.scrollTop = value; expected = scroller.scrollTop }
    const tick = (now: number) => {
      const delta = last === null ? 16 : Math.min(64, now - last); last = now
      const distance = bottom() - scroller.scrollTop
      if (!following) { cancel(); return }
      if (reduced() || Math.abs(distance) < .75) {
        write(bottom()); cancel(); update(); return
      }
      const movement = Math.max(1, Math.abs(distance) * (1 - Math.exp(-delta / 100)))
      write(scroller.scrollTop + Math.sign(distance) * Math.min(Math.abs(distance), movement))
      frame = window.requestAnimationFrame(tick)
    }
    const follow = () => {
      if (!following) { update(); return }
      if (reduced()) { write(bottom()); update() }
      else if (!frame) frame = window.requestAnimationFrame(tick)
    }
    const scroll = () => {
      if (Math.abs(scroller.scrollTop - expected) < 1) return
      cancel(); expected = -1
      following = bottom() - scroller.scrollTop <= 64
      update()
    }
    const interrupt = (event: Event) => {
      if (event instanceof window.KeyboardEvent && !['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) return
      if (event instanceof window.KeyboardEvent && (event.target as HTMLElement)?.closest('button, [role="button"], input, textarea')) return
      following = false; expected = -1; cancel()
    }
    // Initial opening starts at the live end; subsequent growth glides there.
    write(bottom()); update()
    jump.current = () => {
      cancel(); expected = -1
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: reduced() ? 'instant' : 'smooth' })
      following = reduced()
      update()
    }
    scroller.addEventListener('scroll', scroll)
    scroller.addEventListener('wheel', interrupt, { passive: true })
    scroller.addEventListener('touchmove', interrupt, { passive: true })
    scroller.addEventListener('keydown', interrupt)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(follow)
    if (target) observer?.observe(target)
    observer?.observe(scroller)
    return () => {
      cancel(); observer?.disconnect(); jump.current = () => {}
      scroller.removeEventListener('scroll', scroll)
      scroller.removeEventListener('wheel', interrupt)
      scroller.removeEventListener('touchmove', interrupt)
      scroller.removeEventListener('keydown', interrupt)
    }
  }, [root, enabled])
  return { awayFromBottom, scrollToBottom: () => jump.current() }
}
