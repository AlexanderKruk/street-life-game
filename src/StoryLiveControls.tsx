import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { orderChoiceNodes } from './ChoiceOptions'
import { t } from './i18n'

export type StoryLiveAction = { id: string; label: string; detail?: string; disabled?: boolean; primary?: boolean; onChoose: () => void }
export type StoryInteraction = {
  episodeId: number; key: string; minute: number; actions: StoryLiveAction[]
  seed: number; decision: string; fixed?: boolean; content?: ReactNode
  waitingForDecision?: boolean; onPresented?: () => void
}

/** UI only: commands and eligibility still belong to the existing controllers. */
export default function StoryLiveControls({ interaction }: { interaction: StoryInteraction }) {
  const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [elapsed, setElapsed] = useState(0)
  const claimed = useRef<string | null>(null)
  const ordered = orderChoiceNodes(interaction.actions.map(action => <button key={action.id} data-order-id={action.id} />), interaction.seed, interaction.decision, interaction.fixed) as ReactElement<{ 'data-order-id': string }>[]
  const actions = ordered.map(node => interaction.actions.find(action => action.id === node.props['data-order-id'])!)
  let delay = 0
  const choices = actions.map(action => {
    const at = delay
    delay += 650 + Math.max(0, Array.from(action.label).length - 10) * 25
    return { action, at }
  })
  const signature = choices.map(({ action, at }) => `${action.id}:${at}`).join('|')
  useEffect(() => {
    claimed.current = null
    setElapsed(0)
    if (reduced || !choices.length) return
    let frame = 0, last: number | null = null, time = 0
    const end = choices.at(-1)!.at + 650
    const tick = (now: number) => {
      time += last === null ? 0 : Math.min(80, now - last); last = now
      setElapsed(time)
      if (time < end) frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [interaction.key, signature, reduced])
  const panel = useRef<HTMLDivElement>(null)
  const focused = useRef<string | null>(null)
  useEffect(() => {
    if (focused.current === interaction.key) return
    const first = panel.current?.querySelector<HTMLButtonElement>('button:not(:disabled):not([hidden])')
    if (first) { first.focus({ preventScroll: true }); focused.current = interaction.key }
  }, [interaction.key, elapsed])
  return <div className="story-live-controls" ref={panel} aria-label={t('story.choices')}>
    {interaction.content}
    <div className="story-live-actions">{choices.map(({ action, at }) => <button key={`${interaction.key}:${action.id}`} type="button"
      className={`story-live-choice${action.primary ? ' is-primary' : ''}`} data-order-id={action.id} hidden={!reduced && elapsed < at}
      disabled={action.disabled || (!reduced && elapsed < at + 650)}
      onClick={() => { if (claimed.current === interaction.key || action.disabled) return; claimed.current = interaction.key; action.onChoose() }}>
      <span>{action.label}</span>{action.detail && <small>{action.detail}</small>}
    </button>)}</div>
  </div>
}
