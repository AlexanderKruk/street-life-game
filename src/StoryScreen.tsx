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
import { createStoryTyping, storyCharactersShown, STORY_PIECE_PAUSE_MS, STORY_STAMP_STEP_MS, storyStampDuration } from './storyTyping'
import type { StoryEpisode, StoryStamp } from './story'
import StoryLiveControls, { type StoryInteraction } from './StoryLiveControls'
import { useStoryScroll } from './useStoryScroll'
import { useStoryClock } from './useStoryClock'
import { useStoryChoiceMotion } from './useStoryChoiceMotion'

type Piece = { kind: 'text' | 'image' | 'choice' | 'stats'; text: string; at: StoryStamp; image?: string; resultStart?: boolean; sealAfter?: number; stamp?: StoryStamp; partBody?: boolean; pendingPart?: boolean }
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
  const sealPart = (contentStart: number, at: StoryStamp, result = false) => {
    if (pieces.length === contentStart) return
    let start = contentStart
    // The saved answer belongs to the part it produces, including continuation scenes.
    while (start > 0 && pieces[start - 1].kind === 'choice') start--
    pieces[start].sealAfter = pieces.length - 1
    pieces[start].stamp = at
    pieces[start].resultStart = result
    if (start < contentStart) pieces[contentStart].partBody = true
  }
  for (const scene of episode.scenes) {
    const start = pieces.length
    if (scene.thought) pieces.push({ kind: 'choice', text: scene.thought, at: scene.at })
    addText(scene.text, scene.at)
    if (scene.illustration) pieces.push({ kind: 'image', text: scene.text || scene.title, image: scene.illustration, at: scene.at })
    sealPart(start, scene.at)
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
    sealPart(start, at, true)
  } else if (pieces.at(-1)?.kind === 'choice') {
    // A check/process can wait between the selected answer and its outcome.
    // Reserve that joint part's stamp row now, without inventing a finish time.
    let start = pieces.length - 1
    while (start > 0 && pieces[start - 1].kind === 'choice') start--
    Object.assign(pieces[start], { sealAfter: Infinity, stamp: pieces[start].at, resultStart: true, pendingPart: true })
  }
  if (episode.source === 'phone' && pieces.length) {
    for (const piece of pieces) {
      delete piece.sealAfter; delete piece.stamp; delete piece.resultStart; delete piece.partBody; delete piece.pendingPart
    }
    Object.assign(pieces[0], { sealAfter: episode.result ? pieces.length - 1 : Infinity,
      stamp: episode.endedAt ?? episode.scenes[0].at, pendingPart: !episode.result })
    if (pieces[1]) pieces[1].partBody = true
  }
  return pieces
}
function StoryResult({ episode, animate }: { episode: StoryEpisode; animate: boolean }) {
  const result = episode.result!
  return <div className="story-result-effects">
    {episode.scenes.filter(scene => scene.roll).map((scene, index) => <p key={index} className="story-roll">{t('story.roll', { roll: scene.roll!.value, modifier: scene.roll!.modifier, target: scene.roll!.target })}</p>)}
    {result.presentation?.places?.map(place => <div className="story-place" key={place.id}><strong>{place.name}</strong><span>{place.hours}</span><p>{place.detail}</p></div>)}
    {result.presentation?.notice && <p>{result.presentation.notice}</p>}
    <ResultIndicators changes={resultDisplay(result).indicators} animate={animate} />
  </div>
}
function Episode({ episode, live, disabled, continuous, archiveControls = true, onPlayback, onLivePlayback }: { episode: StoryEpisode; live?: StoryInteraction; disabled?: boolean; continuous?: boolean; archiveControls?: boolean; onPlayback?: (id: number, playing: boolean) => void; onLivePlayback?: (playing: boolean) => void }) {
  const pieces = useMemo(() => episodePieces(episode), [episode])
  const typing = useMemo(() => pieces.map(piece => createStoryTyping(piece.text)), [pieces])
  const track = useRef<HTMLDivElement>(null)
  const nodes = useRef<(HTMLDivElement | null)[]>([])
  const [replay, setReplay] = useState(0)
  const [animation, setAnimation] = useState<{ index: number; shown: number; progress: number; y: number; minute: number; running: boolean; instant: boolean; sealStart?: number; stampShown?: number } | null>(null)
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
    let frame = 0, last: number | null = null, elapsed = 0, clockElapsed = 0, index = isLive ? completedPieces.current : 0, phase: 'typing' | 'hold' | 'move' = 'typing', y = isLive ? position.current.y : 0, from = y
    if (index >= pieces.length) { setAnimation(null); return }
    if (!isLive) onPlayback?.(episode.id, true)
    const startMinute = episode.scenes[0].at.minute
    const minute = () => isLive ? liveMinute.current ?? startMinute : startMinute + Math.floor(clockElapsed / 1000)
    let skipped = false, instant = false
    const revealText = (event: Event) => { if (!(event.target as HTMLElement).closest('.story-live-controls')) skipped = true }
    const element = track.current
    const gap = element ? parseFloat(window.getComputedStyle(element).getPropertyValue('--story-gap')) || 12 : 12
    const partEnds = new Set(pieces.flatMap(piece => piece.sealAfter === undefined ? [] : [piece.sealAfter]))
    const partStart = (end: number) => pieces.findIndex(piece => piece.sealAfter === end)
    element?.addEventListener('click', revealText)
    const tick = (now: number) => {
      const delta = last === null ? 0 : Math.min(80, now - last); last = now; elapsed += delta
      const piece = pieces[index]
      if (!piece) {
        // Keep the final clock/line where they stopped instead of jumping to the archive layout.
        setRestingCursor({ y, minute: minute() }); setAnimation(null); if (!isLive) onPlayback?.(episode.id, false); return
      }
      // A selected answer and its outcome are one running presentation, not an open choice menu.
      // Replay uses an ephemeral clock; live events display the shared game clock.
      // Fixed stamps always use the saved StoryStamp.
      clockElapsed += delta
      const length = Array.from(piece.text).length
      let shown = piece.kind === 'image' || piece.kind === 'choice' ? length : storyCharactersShown(typing[index], elapsed)
      let progress = 0
      if (phase === 'hold') {
        shown = length
        progress = 1
        // Paragraph/media pauses do not release the part's cursor. Only its
        // final piece (including all consequences) lets it settle below the block.
        const start = partStart(index)
        const duration = start >= 0 ? storyStampDuration(stampLabel(pieces[start].stamp ?? pieces[start].at).slice(5)) : STORY_PIECE_PAUSE_MS
        if (partEnds.has(index)) {
          const node = nodes.current[index]
          const end = node ? Math.max(from, node.offsetTop + node.offsetHeight + gap) : from
          y = from + (end - from) * (1 - Math.pow(1 - Math.min(1, elapsed / duration), 3))
        }
        if (elapsed >= duration) { index++; phase = 'typing'; elapsed = 0; progress = 0; skipped = false; instant = false }
      } else if (piece.kind === 'choice') {
        // The answer and its entire outcome share one cursor above their stamp.
        if (elapsed >= 650) { phase = 'hold'; elapsed = 0; from = y; skipped = false }
      } else if (phase === 'typing') {
        if (piece.kind === 'image' || piece.kind === 'stats') { phase = 'move'; elapsed = 0; from = y }
        else if (skipped || elapsed >= typing[index].settledAt) { instant = skipped; shown = length; phase = 'hold'; elapsed = 0; from = y; skipped = false }
      } else {
        shown = length
        const current = pieces[index]
        const indicatorCount = current.kind === 'stats' ? resultDisplay(episode.result!).indicators.length : 0
        progress = Math.min(1, elapsed / (current.kind === 'image' ? 1150 : indicatorCount ? resultIndicatorDuration(indicatorCount) : 450))
        const ease = 1 - Math.pow(1 - progress, 3)
        const node = nodes.current[index]
        if (current.kind === 'image') {
          // Update image geometry before measuring the line endpoint, just as reveal/layout do
          // in the reference. React commits the same values below on this frame.
          const media = node?.querySelector<HTMLElement>('.story-media')
          if (media) { media.style.gridTemplateRows = `${ease}fr` }
        }
        if (progress === 1) {
          phase = 'hold'; elapsed = 0; from = y
        }
      }
      const current = pieces[index]
      if (isLive) { completedPieces.current = index; position.current.y = y }
      const currentShown = !current || current.kind === 'image' ? 0 : current.kind === 'choice' ? Array.from(current.text).length : storyCharactersShown(typing[index], elapsed)
      const start = phase === 'hold' ? partStart(index) : -1
      setAnimation({ index, shown: phase === 'typing' ? currentShown : shown, progress, y, minute: minute(), running: !!current, instant,
        ...(start >= 0 ? { sealStart: start, stampShown: Math.floor(elapsed / STORY_STAMP_STEP_MS) } : {}) })
      frame = window.requestAnimationFrame(tick)
    }
    setAnimation({ index, shown: pieces[index]?.kind === 'choice' ? Array.from(pieces[index].text).length : 0, progress: 0, y, minute: minute(), running: !!pieces[index], instant: false })
    frame = window.requestAnimationFrame(tick)
    return () => { window.cancelAnimationFrame(frame); element?.removeEventListener('click', revealText); if (!isLive) onPlayback?.(episode.id, false) }
  }, [replay, pieces, typing, episode, isLive])
  const first = episode.scenes[0]
  const last = episode.endedAt ?? first.at
  const cursor = animation ?? (isLive ? { y: position.current.y, minute: live.minute } : restingCursor)
  return <article className="story-episode" data-story-id={episode.id}>
    {archiveControls && !isLive && <div className="story-episode-heading">
      <ModalAction variant="secondary" disabled={disabled} onClick={() => setReplay(value => value + 1)}>{t('story.replay')}</ModalAction></div>}
    <div className={`story-track${cursor ? ' has-replay' : ''}${animation?.sealStart !== undefined ? ' is-settling' : ''}${continuous && !isLive && !animation ? ' is-archived' : ''}${animation ? ' is-replaying' : ''}${animation?.running || isLive && !live.waitingForDecision ? ' is-running' : ''}`} ref={track} style={{ '--story-y': `${cursor?.y ?? 0}px` } as CSSProperties} onClickCapture={event => { if (isLive && (event.target as HTMLElement).closest('.story-live-controls button')) choiceMotion.reserve() }}>
      <div className="story-thread" aria-hidden="true" />
      <div className="story-choice-motion" ref={choiceMotion.layer} aria-hidden="true" inert />
      <div className="story-pieces" aria-label={animation ? t('story.skip') : undefined}>
        {pieces.map((piece, index) => {
          const future = !!animation && index > animation.index
          const current = !!animation && index === animation.index
          const imageProgress = !animation || index < animation.index ? 1 : current ? animation.progress : 0
          const visibleText = current ? Array.from(piece.text).slice(0, animation.shown).join('') : piece.text
          const startsPart = piece.sealAfter !== undefined
          const stamping = animation?.sealStart === index
          const sealed = !piece.pendingPart && (!animation || animation.index > piece.sealAfter! || stamping)
          const label = stampLabel(piece.stamp ?? piece.at)
          return <div ref={node => { nodes.current[index] = node }} key={index} className={`story-piece story-${piece.kind}${startsPart ? ' story-part-start' : ''}${piece.resultStart ? ' story-result-start' : ''}${piece.partBody ? ' story-part-body' : ''}${current && piece.kind === 'choice' ? ' story-choice-enter' : ''}`} hidden={future}>
            {startsPart && <><span className={`story-part-imprint${piece.resultStart ? ' story-result-imprint' : ''}`} hidden={!sealed} aria-hidden="true" /><time className={`story-part-stamp${piece.resultStart ? ' story-result-stamp' : ''}`} data-story-stamp={sealed ? 'sealed' : 'pending'} aria-hidden={!sealed}>{stamping ? <>{label.slice(0, 5)}{Array.from(label.slice(5)).slice(0, animation.stampShown).map((character, letter) => <span className="story-letter" key={`${replay}-${index}-stamp-${letter}`}>{character}</span>)}</> : label}</time></>}
            {piece.kind === 'stats' ? !future && <StoryResult episode={episode} animate={!!animation} /> : piece.kind === 'image' ? <div className="story-media" style={{ gridTemplateRows: `${1 - Math.pow(1 - imageProgress, 3)}fr` }}><div><img {...responsiveImageProps(piece.image!)} alt={piece.text} style={{ opacity: .25 + imageProgress * .75, filter: `brightness(${.08 + .92 * Math.pow(imageProgress, 1.5)}) saturate(${.6 + .4 * imageProgress})` }} /></div></div>
              : <p className={current ? 'story-reveal' : undefined} role={current ? 'button' : undefined} tabIndex={current ? 0 : undefined} aria-label={current ? t('story.skip') : undefined}
                onKeyDown={current ? event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click() } } : undefined}>
                {current && piece.kind === 'text' && !animation.instant ? Array.from(visibleText).map((character, letter) => <span className="story-letter" key={`${replay}-${index}-${letter}`}>{character}</span>) : visibleText}
              </p>}
          </div>
        })}
        {isLive && (!animation || !live.contentAfterIntro && !live.waitingForDecision && live.content) && (live.actions.length > 0 || live.content) && <StoryLiveControls interaction={live} onSelect={button => choiceMotion.choose(button, pieces.length)} />}
      </div>
      {(isLive || animation || !continuous) && <div className="story-head" aria-hidden="true"><span /><time>{formatTime(live?.gameClock ? live.minute : cursor?.minute ?? last.minute)}</time></div>}
    </div>
    {archiveControls && !animation && !isLive && <div className="story-episode-end">
      {episode.status === 'active' && <p className="story-note">{t('story.pending')}</p>}
      {episode.status === 'interrupted' && <p className="story-note">{t('story.unfinished')}</p>}
    </div>}
  </article>
}

export default function StoryScreen({ episodes, interaction, currentMinute, onPauseChange, presentation = 'archive' }: { episodes: StoryEpisode[]; interaction?: StoryInteraction; currentMinute?: number; onPauseChange?: (paused: boolean) => void; presentation?: 'archive' | 'event' }) {
  const scrollRoot = useRef<HTMLElement>(null)
  useStoryScroll(scrollRoot, presentation === 'archive')
  const [comparison, setComparison] = useState(false)
  const [visible, setVisible] = useState(30)
  const [playing, setPlaying] = useState<Set<number>>(() => new Set())
  const playback = (id: number, active: boolean) => setPlaying(previous => { if (previous.has(id) === active) return previous; const next = new Set(previous); if (active) next.add(id); else next.delete(id); return next })
  const paused = comparison || playing.size > 0
  const [livePlaying, setLivePlaying] = useState(false)
  const running = !paused && !interaction?.gameClock && (!interaction?.waitingForDecision || livePlaying)
  const clockMinute = useStoryClock(currentMinute, running)
  useEffect(() => { onPauseChange?.(paused); return () => onPauseChange?.(false) }, [paused, onPauseChange])
  const start = Math.max(0, episodes.length - visible)
  return <section ref={scrollRoot} className={`story-screen${presentation === 'event' ? ' story-screen-event' : ''}`}>
    {presentation === 'archive' && <div className="story-toolbar"><h1>{t('story.nav')}</h1><ModalAction variant="secondary" disabled={!!interaction} onClick={() => setComparison(value => !value)}>{t(comparison ? 'story.recordings' : 'story.comparison')}</ModalAction></div>}
    {comparison ? <StoryComparison /> : <>
      {!episodes.length && presentation === 'archive' && <p className="story-note">{t('story.empty')}</p>}
      {start > 0 && <ModalAction variant="secondary" onClick={() => setVisible(value => value + 30)}>{t('story.earlier')}</ModalAction>}
      {episodes.slice(start).map(episode => <Episode episode={episode} key={episode.id} live={interaction?.episodeId === episode.id ? { ...interaction, minute: interaction.gameClock ? currentMinute ?? interaction.minute : clockMinute ?? interaction.minute } : undefined} disabled={!!interaction} continuous={currentMinute !== undefined} archiveControls={presentation === 'archive'} onPlayback={playback} onLivePlayback={setLivePlaying} />)}
      {!interaction && !paused && currentMinute !== undefined && <div className="story-idle story-track is-running"><div className="story-head" aria-hidden="true"><span /><time>{formatTime(clockMinute ?? currentMinute)}</time></div></div>}
    </>}
  </section>
}
