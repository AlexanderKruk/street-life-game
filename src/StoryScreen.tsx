import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { t } from './i18n'
import { formatTime } from './game'
import { formatNumber } from './i18n/formatters'
import { displayDay } from './gameDate'
import { responsiveImageProps } from './responsiveImages'
import { resultDisplay } from './ResultCard'
import ResultIndicators, { resultIndicatorDuration } from './ResultIndicators'
import { ModalAction } from './Modal'
import StoryComparison from './StoryComparison'
import { createStoryTyping, storyCharactersShown } from './storyTyping'
import type { StoryEpisode, StoryStamp } from './story'

type Piece = { kind: 'text' | 'image' | 'choice' | 'stats'; text: string; at: StoryStamp; image?: string; resultStart?: boolean; sealAfter?: number; stamp?: StoryStamp; partBody?: boolean }
const stampLabel = (at: StoryStamp) => `${formatTime(at.minute)} · ${at.locationName} · ${t('hud.day', { day: formatNumber(displayDay(at.day)) })}`
function episodePieces(episode: StoryEpisode): Piece[] {
  const pieces: Piece[] = []
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
    if (scene.text) pieces.push({ kind: 'text', text: scene.text, at: scene.at })
    if (scene.illustration) pieces.push({ kind: 'image', text: scene.text || scene.title, image: scene.illustration, at: scene.at })
    sealPart(start, scene.at)
    for (const choice of [...(scene.earlierChoices ?? []), ...(scene.choice ? [scene.choice] : [])]) pieces.push({ kind: 'choice', text: t('story.chosen', { choice: choice.label }), at: choice.at })
  }
  if (episode.result) {
    const result = episode.result
    const at = episode.endedAt ?? episode.scenes[0].at
    const start = pieces.length
    if (result.text) pieces.push({ kind: 'text', text: result.text, at })
    const art = result.illustration ?? result.presentation?.illustration
    if (art) pieces.push({ kind: 'image', text: result.illustrationAlt ?? result.text, image: art, at })
    if (resultDisplay(result).indicators.length || result.presentation?.places?.length || result.presentation?.notice || episode.scenes.some(scene => scene.roll)) pieces.push({ kind: 'stats', text: '', at })
    sealPart(start, at, true)
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
function Episode({ episode }: { episode: StoryEpisode }) {
  const pieces = useMemo(() => episodePieces(episode), [episode])
  const typing = useMemo(() => pieces.map(piece => createStoryTyping(piece.text)), [pieces])
  const track = useRef<HTMLDivElement>(null)
  const nodes = useRef<(HTMLDivElement | null)[]>([])
  const [replay, setReplay] = useState(0)
  const [animation, setAnimation] = useState<{ index: number; shown: number; progress: number; y: number; minute: number; running: boolean; instant: boolean } | null>(null)
  const [restingCursor, setRestingCursor] = useState<{ y: number; minute: number } | null>(null)
  useEffect(() => {
    if (!replay) return
    setRestingCursor(null)
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setAnimation(null); return }
    let frame = 0, last: number | null = null, elapsed = 0, clockElapsed = 0, index = 0, phase: 'typing' | 'pause' | 'move' = 'typing', y = 0, from = 0
    const startMinute = episode.scenes[0].at.minute
    const minute = () => startMinute + Math.floor(clockElapsed / 1000)
    let skipped = false, instant = false
    const revealText = () => { skipped = true }
    const element = track.current
    const gap = element ? parseFloat(window.getComputedStyle(element).getPropertyValue('--story-gap')) || 12 : 12
    element?.addEventListener('click', revealText)
    const tick = (now: number) => {
      const delta = last === null ? 0 : Math.min(80, now - last); last = now; elapsed += delta
      const piece = pieces[index]
      if (!piece) {
        // Keep the final clock/line where they stopped instead of jumping to the archive layout.
        setRestingCursor({ y, minute: minute() }); setAnimation(null); return
      }
      // A selected answer and its outcome are one running presentation, not an open choice menu.
      // This is an ephemeral visual clock: fixed stamps always use the saved StoryStamp.
      clockElapsed += delta
      const length = Array.from(piece.text).length
      let shown = piece.kind === 'image' || piece.kind === 'choice' ? length : storyCharactersShown(typing[index], elapsed)
      let progress = 0
      if (piece.kind === 'choice') {
        // Reference choices enter whole, with the cursor settling gently above the selected text.
        const node = nodes.current[index]
        const anchor = node ? node.offsetTop - (piece.sealAfter === undefined ? 28 : 0) : y
        y += (anchor - y) * Math.min(1, delta / 100)
        if (elapsed >= 650) { index++; phase = 'typing'; elapsed = 0; skipped = false; instant = false }
      } else if (phase === 'typing') {
        if (piece.kind === 'image' || piece.kind === 'stats') { phase = 'move'; elapsed = 0; from = y }
        else if (skipped || elapsed >= typing[index].duration) { instant = skipped; shown = length; phase = 'pause'; elapsed = 0; skipped = false }
      } else if (phase === 'pause') {
        shown = length
        if (elapsed >= 250) {
          elapsed = 0
          if (pieces[index + 1]?.kind === 'image') index++
          phase = 'move'; from = y
        }
      } else {
        shown = length
        const current = pieces[index]
        progress = Math.min(1, elapsed / (current.kind === 'image' ? 1150 : current.kind === 'stats' ? Math.max(450, resultIndicatorDuration(resultDisplay(episode.result!).indicators.length)) : 750))
        const ease = 1 - Math.pow(1 - progress, 3)
        const node = nodes.current[index]
        if (current.kind === 'image') {
          // Update image geometry before measuring the line endpoint, just as reveal/layout do
          // in the reference. React commits the same values below on this frame.
          const media = node?.querySelector<HTMLElement>('.story-media')
          if (media) { media.style.gridTemplateRows = `${ease}fr` }
        }
        const end = node ? Math.max(from, node.offsetTop + node.offsetHeight + gap) : from
        y = from + (end - from) * ease
        if (progress === 1) { index++; phase = 'typing'; elapsed = 0; progress = 0; skipped = false; instant = false }
      }
      const current = pieces[index]
      const currentShown = !current || current.kind === 'image' ? 0 : current.kind === 'choice' ? Array.from(current.text).length : storyCharactersShown(typing[index], elapsed)
      setAnimation({ index, shown: phase === 'typing' ? currentShown : shown, progress, y, minute: minute(), running: !!current, instant })
      frame = window.requestAnimationFrame(tick)
    }
    setAnimation({ index: 0, shown: 0, progress: 0, y: 0, minute: startMinute, running: !!pieces[0], instant: false })
    frame = window.requestAnimationFrame(tick)
    return () => { window.cancelAnimationFrame(frame); element?.removeEventListener('click', revealText) }
  }, [replay, pieces, typing, episode])
  const first = episode.scenes[0]
  const last = episode.endedAt ?? first.at
  const cursor = animation ?? restingCursor
  return <article className="story-episode" data-story-id={episode.id}>
    <div className="story-episode-heading">
      <ModalAction variant="secondary" onClick={() => setReplay(value => value + 1)}>{t('story.replay')}</ModalAction></div>
    <div className={`story-track${cursor ? ' has-replay' : ''}${animation ? ' is-replaying' : ''}${animation?.running ? ' is-running' : ''}`} ref={track} style={{ '--story-y': `${cursor?.y ?? 0}px` } as CSSProperties}>
      <div className="story-thread" aria-hidden="true" />
      <div className="story-pieces" aria-label={animation ? t('story.skip') : undefined}>
        {pieces.map((piece, index) => {
          const future = !!animation && index > animation.index
          const current = !!animation && index === animation.index
          const imageProgress = !animation || index < animation.index ? 1 : current ? animation.progress : 0
          const visibleText = current ? Array.from(piece.text).slice(0, animation.shown).join('') : piece.text
          const startsPart = piece.sealAfter !== undefined
          const sealed = !animation || animation.index > piece.sealAfter!
          return <div ref={node => { nodes.current[index] = node }} key={index} className={`story-piece story-${piece.kind}${startsPart ? ' story-part-start' : ''}${piece.resultStart ? ' story-result-start' : ''}${piece.partBody ? ' story-part-body' : ''}${current && piece.kind === 'choice' ? ' story-choice-enter' : ''}`} hidden={future}>
            {startsPart && <><span className={`story-part-imprint${piece.resultStart ? ' story-result-imprint' : ''}`} hidden={!sealed} aria-hidden="true" /><time className={`story-part-stamp${piece.resultStart ? ' story-result-stamp' : ''}`} data-story-stamp={sealed ? 'sealed' : 'pending'} aria-hidden={!sealed}>{stampLabel(piece.stamp ?? piece.at)}</time></>}
            {piece.kind === 'stats' ? !future && <StoryResult episode={episode} animate={!!animation} /> : piece.kind === 'image' ? <div className="story-media" style={{ gridTemplateRows: `${1 - Math.pow(1 - imageProgress, 3)}fr` }}><div><img {...responsiveImageProps(piece.image!)} alt={piece.text} style={{ opacity: .25 + imageProgress * .75, filter: `brightness(${.08 + .92 * Math.pow(imageProgress, 1.5)}) saturate(${.6 + .4 * imageProgress})` }} /></div></div>
              : current ? <button type="button" className="story-reveal" aria-label={t('story.skip')}>{piece.kind === 'text' && !animation.instant ? Array.from(visibleText).map((character, letter) => <span className="story-letter" key={`${replay}-${index}-${letter}`}>{character}</span>) : visibleText}</button> : <p>{visibleText}</p>}
          </div>
        })}
      </div>
      <div className="story-head" aria-hidden="true"><span /><time>{formatTime(cursor?.minute ?? last.minute)}</time></div>
    </div>
    {!animation && <div className="story-episode-end">
      {episode.status === 'active' && <p className="story-note">{t('story.pending')}</p>}
      {episode.status === 'interrupted' && <p className="story-note">{t('story.unfinished')}</p>}
    </div>}
  </article>
}

export default function StoryScreen({ episodes }: { episodes: StoryEpisode[] }) {
  const [comparison, setComparison] = useState(false)
  const [visible, setVisible] = useState(30)
  const start = Math.max(0, episodes.length - visible)
  return <section className="story-screen">
    <div className="story-toolbar"><h1>{t('story.nav')}</h1><ModalAction variant="secondary" onClick={() => setComparison(value => !value)}>{t(comparison ? 'story.recordings' : 'story.comparison')}</ModalAction></div>
    {comparison ? <StoryComparison /> : <>
      {!episodes.length && <p className="story-note">{t('story.empty')}</p>}
      {start > 0 && <ModalAction variant="secondary" onClick={() => setVisible(value => value + 30)}>{t('story.earlier')}</ModalAction>}
      {episodes.slice(start).map(episode => <Episode episode={episode} key={episode.id} />)}
    </>}
  </section>
}
