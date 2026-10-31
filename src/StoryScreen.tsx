import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { t } from './i18n'
import { formatTime } from './game'
import { formatNumber } from './i18n/formatters'
import { displayDay } from './gameDate'
import { responsiveImageProps } from './responsiveImages'
import { resultDisplay } from './ResultCard'
import ResultIndicators, { resultIndicatorDuration } from './ResultIndicators'
import { ModalAction } from './Modal'
import StoryComparison from './StoryComparison'
import { createStoryTyping, storyCharactersShown, STORY_PIECE_PAUSE_MS } from './storyTyping'
import StoryText from './StoryText'
import type { StoryEpisode, StoryStamp } from './story'
import StoryLiveControls, { type StoryInteraction } from './StoryLiveControls'
import { useStoryScroll } from './useStoryScroll'
import { useStoryChoiceMotion } from './useStoryChoiceMotion'

type Piece = { kind: 'text' | 'image' | 'choice' | 'stats'; text: string; at: StoryStamp; image?: string; resultStart?: boolean; partBody?: boolean }
const stampLabel = (at: StoryStamp) => `${formatTime(at.minute)} · ${at.locationName} · ${t('story.day', { day: formatNumber(displayDay(at.day)) })}`
function episodePieces(episode: StoryEpisode): Piece[] {
  const pieces: Piece[] = []
  const addText = (text: string, at: StoryStamp) => {
    // Authored blank lines mark paragraphs; visual wrapping and single line
    // breaks inside a paragraph do not create extra reading pauses.
    for (const paragraph of text.split(/\r?\n(?:[ \t]*\r?\n)+/)) {
      if (paragraph.trim()) pieces.push({ kind: 'text', text: paragraph, at })
    }
  }
  for (const scene of episode.scenes) {
    if (scene.thought) pieces.push({ kind: 'choice', text: scene.thought, at: scene.at })
    addText(scene.text, scene.at)
    if (scene.illustration) pieces.push({ kind: 'image', text: scene.text || scene.title, image: scene.illustration, at: scene.at })
    for (const choice of [...(scene.earlierChoices ?? []), ...(scene.choice ? [scene.choice] : [])]) pieces.push({ kind: 'choice', text: choice.label, at: choice.at })
  }
  if (episode.result) {
    const result = episode.result
    const at = episode.endedAt ?? episode.scenes[0].at
    const start = pieces.length
    addText(result.text, at)
    const art = result.illustration ?? result.presentation?.illustration
    if (art) pieces.push({ kind: 'image', text: result.illustrationAlt ?? result.text, image: art, at })
    if (result.closingText) addText(result.closingText, at)
    if (resultDisplay(result).indicators.length || result.presentation?.places?.length || result.presentation?.notice || episode.scenes.some(scene => scene.roll)) pieces.push({ kind: 'stats', text: '', at })
    let resultStart = start
    while (resultStart > 0 && pieces[resultStart - 1].kind === 'choice') resultStart--
    if (pieces[resultStart]) pieces[resultStart].resultStart = true
    if (start > 0 && pieces[start]) pieces[start].partBody = true
  }
  return pieces
}
function StoryResult({ episode, animate }: { episode: StoryEpisode; animate: boolean }) {
  const result = episode.result!
  return <div className="story-result-effects">
    {episode.scenes.filter(scene => scene.roll).map((scene, index) => <p key={index} className="story-roll">{t('story.roll', { roll: scene.roll!.value, modifier: scene.roll!.modifier, target: scene.roll!.target })}</p>)}
    {result.presentation?.places?.map(place => <div className="story-place" key={place.id}><strong>{place.name}</strong><span>{place.hours}</span><p>{place.detail}</p></div>)}
    {result.presentation?.notice && <p>{result.presentation.notice}</p>}
    <ResultIndicators changes={resultDisplay(result).indicators} animate={animate} showLevels />
  </div>
}
function Episode({ episode, live, currentMinute, disabled, continuous, archiveControls = true, onPlayback, onLivePlayback }: { episode: StoryEpisode; live?: StoryInteraction; currentMinute?: number; disabled?: boolean; continuous?: boolean; archiveControls?: boolean; onPlayback?: (id: number, playing: boolean) => void; onLivePlayback?: (playing: boolean) => void }) {
  const pieces = useMemo(() => episodePieces(episode), [episode])
  const typing = useMemo(() => pieces.map(piece => createStoryTyping(piece.text)), [pieces])
  const track = useRef<HTMLDivElement>(null)
  const nodes = useRef<(HTMLDivElement | null)[]>([])
  const [replay, setReplay] = useState(0)
  const [animation, setAnimation] = useState<{ index: number; shown: number; progress: number; y: number; minute: number; running: boolean; instant: boolean } | null>(null)
  const [restingCursor, setRestingCursor] = useState<{ y: number; minute: number } | null>(null)
  const completedPieces = useRef(0)
  const position = useRef({ y: 0 })
  const liveMinute = useRef(live?.minute)
  liveMinute.current = live?.minute
  const isLive = !!live
  const choiceMotion = useStoryChoiceMotion(track, nodes, isLive, replay)
  const acknowledged = useRef(false)
  useEffect(() => {
    if (!isLive) return
    onLivePlayback?.(!!animation)
    live.onPlayback?.(!!animation)
    return () => { onLivePlayback?.(false); live.onPlayback?.(false) }
  }, [isLive, !!animation, onLivePlayback, live?.onPlayback])
  useEffect(() => {
    if (isLive && !animation && completedPieces.current >= pieces.length && live.onPresented && !acknowledged.current) {
      acknowledged.current = true
      live.onPresented()
    }
  }, [isLive, animation, pieces.length, live?.onPresented])
  // Choices/process controls can grow after the narrative's last animation.
  // Follow their real height with the same cursor, without creating a stamp.
  useLayoutEffect(() => {
    const element = track.current, content = element?.querySelector<HTMLElement>('.story-pieces')
    if (!isLive || animation || !element || !content) return
    const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let frame = 0, last: number | null = null, target = position.current.y
    const write = () => element.style.setProperty('--story-y', `${position.current.y}px`)
    const tick = (now: number) => {
      const delta = last === null ? 16 : Math.min(80, now - last); last = now
      position.current.y += (target - position.current.y) * (1 - Math.exp(-delta / 80))
      if (target - position.current.y < .5) position.current.y = target
      write()
      frame = position.current.y < target ? window.requestAnimationFrame(tick) : 0
    }
    const update = () => {
      const gap = parseFloat(window.getComputedStyle(element).getPropertyValue('--story-gap')) || 12
      target = Math.max(target, content.offsetTop + content.offsetHeight + gap)
      if (reduced) { position.current.y = target; write() }
      else if (!frame && target > position.current.y) { last = null; frame = window.requestAnimationFrame(tick) }
    }
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    observer?.observe(content); update()
    return () => { observer?.disconnect(); if (frame) window.cancelAnimationFrame(frame) }
  }, [isLive, !!animation, live?.key, pieces.length])
  useLayoutEffect(() => {
    if (!replay && !isLive) return
    if (!isLive) setRestingCursor(null)
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      if (isLive) {
        completedPieces.current = pieces.length
        const node = nodes.current[pieces.length - 1]
        position.current.y = node ? node.offsetTop + node.offsetHeight + 12 : 0
        setRestingCursor({ y: position.current.y, minute: liveMinute.current ?? episode.scenes[0].at.minute })
      }
      setAnimation(null); return
    }
    let frame = 0, last: number | null = null, elapsed = 0, index = isLive ? completedPieces.current : 0, phase: 'typing' | 'hold' | 'move' = 'typing', y = isLive ? position.current.y : 0
    if (index >= pieces.length) { setAnimation(null); return }
    if (!isLive) onPlayback?.(episode.id, true)
    const startMinute = episode.scenes[0].at.minute
    const minute = () => isLive ? liveMinute.current ?? startMinute : episode.endedAt?.minute ?? startMinute
    let skipped = false, instant = false
    const revealText = (event: Event) => { if (!(event.target as HTMLElement).closest('.story-live-controls')) skipped = true }
    const element = track.current
    const gap = element ? parseFloat(window.getComputedStyle(element).getPropertyValue('--story-gap')) || 12 : 12
    element?.addEventListener('click', revealText)
    const tick = (now: number) => {
      const delta = last === null ? 0 : Math.min(80, now - last); last = now; elapsed += delta
      const piece = pieces[index]
      if (!piece) {
        // Keep the final clock/line where they stopped instead of jumping to the archive layout.
        setRestingCursor({ y, minute: minute() }); setAnimation(null); if (!isLive) onPlayback?.(episode.id, false); return
      }
      const length = Array.from(piece.text).length
      let shown = piece.kind === 'image' || piece.kind === 'choice' ? length : storyCharactersShown(typing[index], elapsed)
      let progress = 0
      if (phase === 'hold') {
        shown = length
        progress = 1
        const duration = STORY_PIECE_PAUSE_MS
        if (elapsed >= duration) { index++; phase = 'typing'; elapsed = 0; progress = 0; skipped = false; instant = false }
      } else if (piece.kind === 'choice') {
        // Preserve the existing selected-answer entrance inside the event.
        if (elapsed >= 650) { phase = 'hold'; elapsed = 0; skipped = false }
      } else if (phase === 'typing') {
        if (piece.kind === 'image' || piece.kind === 'stats') { phase = 'move'; elapsed = 0 }
        else if (skipped || elapsed >= typing[index].settledAt) { instant = skipped; shown = length; phase = 'hold'; elapsed = 0; skipped = false }
      } else {
        shown = length
        const current = pieces[index]
        const indicators = current.kind === 'stats' ? resultDisplay(episode.result!).indicators : []
        progress = Math.min(1, elapsed / (current.kind === 'image' ? 1150 : indicators.length ? resultIndicatorDuration(indicators) : 450))
        const ease = 1 - Math.pow(1 - progress, 3)
        const node = nodes.current[index]
        if (current.kind === 'image') {
          // Update image geometry before measuring the line endpoint, just as reveal/layout do
          // in the reference. React commits the same values below on this frame.
          const media = node?.querySelector<HTMLElement>('.story-media')
          if (media) { media.style.gridTemplateRows = `${ease}fr` }
        }
        if (progress === 1) {
          phase = 'hold'; elapsed = 0
        }
      }
      // Follow the content as it grows, rather than waiting for a stamped part
      // to finish. The line never retracts when the choices become a result.
      const node = nodes.current[Math.min(index, pieces.length - 1)]
      const target = node ? Math.max(y, node.offsetTop + node.offsetHeight + gap) : y
      y += (target - y) * (1 - Math.exp(-delta / 80))
      if (target - y < .5) y = target
      const current = pieces[index]
      if (isLive) { completedPieces.current = index; position.current.y = y }
      const currentShown = !current || current.kind === 'image' ? 0 : current.kind === 'choice' ? Array.from(current.text).length : storyCharactersShown(typing[index], elapsed)
      setAnimation({ index, shown: phase === 'typing' ? currentShown : shown, progress, y, minute: minute(), running: !!current, instant })
      frame = window.requestAnimationFrame(tick)
    }
    setAnimation({ index, shown: pieces[index]?.kind === 'choice' ? Array.from(pieces[index].text).length : 0, progress: 0, y, minute: minute(), running: !!pieces[index], instant: false })
    frame = window.requestAnimationFrame(tick)
    return () => { window.cancelAnimationFrame(frame); element?.removeEventListener('click', revealText); if (!isLive) onPlayback?.(episode.id, false) }
  }, [replay, pieces, typing, episode, isLive])
  const first = episode.scenes[0]
  const last = episode.endedAt ?? first.at
  const cursor = animation ?? (isLive ? { y: position.current.y, minute: live.minute } : continuous ? null : restingCursor)
  return <article className="story-episode" data-story-id={episode.id}>
    {archiveControls && !isLive && <div className="story-episode-heading">
      <ModalAction variant="secondary" disabled={disabled} onClick={() => setReplay(value => value + 1)}>{t('story.replay')}</ModalAction></div>}
    <div className={`story-track${cursor ? ' has-replay' : ''}${continuous && !isLive && !animation ? ' is-archived' : ''}${animation ? ' is-replaying' : ''}${animation?.running || isLive && !live.waitingForDecision ? ' is-running' : ''}`} ref={track} style={{ '--story-y': `${cursor?.y ?? 0}px` } as CSSProperties} onClickCapture={event => { if (isLive && (event.target as HTMLElement).closest('.story-live-controls button')) choiceMotion.reserve() }}>
      <div className="story-thread" aria-hidden="true" />
      <div className="story-event-heading story-part-start"><span className="story-part-imprint" aria-hidden="true" /><time className="story-part-stamp" data-story-stamp="sealed">{stampLabel(first.at)}</time></div>
      <div className="story-choice-motion" ref={choiceMotion.layer} aria-hidden="true" inert />
      <div className="story-pieces" aria-label={animation ? t('story.skip') : undefined}>
        {pieces.map((piece, index) => {
          const future = !!animation && index > animation.index
          const current = !!animation && index === animation.index
          const imageProgress = !animation || index < animation.index ? 1 : current ? animation.progress : 0
          const visibleText = current ? Array.from(piece.text).slice(0, animation.shown).join('') : piece.text
          return <div ref={node => { nodes.current[index] = node }} key={index} className={`story-piece story-${piece.kind}${piece.resultStart ? ' story-result-start' : ''}${piece.partBody ? ' story-part-body' : ''}${current && piece.kind === 'choice' ? ' story-choice-enter' : ''}`} hidden={future}>
            {piece.kind === 'stats' ? !future && <StoryResult episode={episode} animate={!!animation} /> : piece.kind === 'image' ? <div className="story-media" data-story-revealing={current && imageProgress > 0 && imageProgress < 1 ? 'true' : undefined} style={{ gridTemplateRows: `${1 - Math.pow(1 - imageProgress, 3)}fr` }}><div><img {...responsiveImageProps(piece.image!)} alt={piece.text} style={{ opacity: .25 + imageProgress * .75, filter: `brightness(${.08 + .92 * Math.pow(imageProgress, 1.5)}) saturate(${.6 + .4 * imageProgress})` }} /></div></div>
              : <p className={current ? 'story-reveal' : undefined} role={current ? 'button' : undefined} tabIndex={current ? 0 : undefined} aria-label={current ? t('story.skip') : undefined}
                onKeyDown={current ? event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click() } } : undefined}>
                {piece.kind === 'text' ? <StoryText text={piece.text} shown={current ? animation.shown : Array.from(piece.text).length} animate={current && !animation.instant} characterKey={`${replay}-${index}`} /> : visibleText}
              </p>}
          </div>
        })}
        {isLive && (!animation || !live.contentAfterIntro && !live.waitingForDecision && live.content) && (live.actions.length > 0 || live.content) && <StoryLiveControls interaction={live} onSelect={button => choiceMotion.choose(button, pieces.length)} />}
      </div>
      {(isLive || animation || !continuous) && <div className="story-head" aria-hidden="true"><span /><time hidden={!!animation || isLive && !episode.result}>{formatTime(currentMinute ?? (live ? live.minute : cursor?.minute ?? last.minute))}</time></div>}
    </div>
    {archiveControls && !animation && !isLive && <div className="story-episode-end">
      {episode.status === 'active' && <p className="story-note">{t('story.pending')}</p>}
      {episode.status === 'interrupted' && <p className="story-note">{t('story.unfinished')}</p>}
    </div>}
  </article>
}

export default function StoryScreen({ episodes, interaction, currentMinute, onPauseChange, onLivePlaybackChange, presentation = 'archive' }: { episodes: StoryEpisode[]; interaction?: StoryInteraction; currentMinute?: number; onPauseChange?: (paused: boolean) => void; onLivePlaybackChange?: (playing: boolean) => void; presentation?: 'archive' | 'event' }) {
  const scrollRoot = useRef<HTMLElement>(null)
  useStoryScroll(scrollRoot, presentation === 'archive')
  const [comparison, setComparison] = useState(false)
  const [visible, setVisible] = useState(30)
  const [playing, setPlaying] = useState<Set<number>>(() => new Set())
  const playback = (id: number, active: boolean) => setPlaying(previous => { if (previous.has(id) === active) return previous; const next = new Set(previous); if (active) next.add(id); else next.delete(id); return next })
  const paused = comparison || playing.size > 0
  const [livePlaying, setLivePlaying] = useState(false)
  useEffect(() => { onLivePlaybackChange?.(livePlaying) }, [livePlaying, onLivePlaybackChange])
  useEffect(() => { onPauseChange?.(paused); return () => onPauseChange?.(false) }, [paused, onPauseChange])
  const liveIndex = interaction ? episodes.findIndex(episode => episode.id === interaction.episodeId) : -1
  const end = liveIndex >= 0 ? liveIndex + 1 : episodes.length
  const start = Math.max(0, end - visible)
  return <section ref={scrollRoot} className={`story-screen${presentation === 'event' ? ' story-screen-event' : ''}`}>
    {presentation === 'archive' && <div className="story-toolbar"><h1>{t('story.nav')}</h1><ModalAction variant="secondary" disabled={!!interaction} onClick={() => setComparison(value => !value)}>{t(comparison ? 'story.recordings' : 'story.comparison')}</ModalAction></div>}
    {comparison ? <StoryComparison /> : <>
      {!episodes.length && presentation === 'archive' && <p className="story-note">{t('story.empty')}</p>}
      {start > 0 && <ModalAction variant="secondary" onClick={() => setVisible(value => value + 30)}>{t('story.earlier')}</ModalAction>}
      {episodes.slice(start, end).map(episode => <Episode episode={episode} key={episode.id} currentMinute={currentMinute} live={interaction?.episodeId === episode.id ? { ...interaction, minute: currentMinute ?? interaction.minute } : undefined} disabled={!!interaction} continuous={currentMinute !== undefined} archiveControls={presentation === 'archive'} onPlayback={playback} onLivePlayback={setLivePlaying} />)}
      {!interaction && !paused && currentMinute !== undefined && <div className="story-idle story-track is-running"><div className="story-head" aria-hidden="true"><span /><time>{formatTime(currentMinute)}</time></div></div>}
    </>}
  </section>
}
