import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { t } from './i18n'
import { formatTime } from './game'
import { displayDay } from './gameDate'
import { responsiveImageProps } from './responsiveImages'
import { ModalAction } from './Modal'
import StoryComparison from './StoryComparison'
import type { StoryEpisode, StoryStamp } from './story'

type Piece = { kind: 'text' | 'image' | 'choice'; text: string; at: StoryStamp; image?: string }
const timeLabel = (at: StoryStamp) => `${formatTime(at.minute)} · D${displayDay(at.day)}`
function episodePieces(episode: StoryEpisode): Piece[] {
  const pieces: Piece[] = []
  for (const scene of episode.scenes) {
    if (scene.text) pieces.push({ kind: 'text', text: scene.text, at: scene.at })
    if (scene.illustration) pieces.push({ kind: 'image', text: scene.text || scene.title, image: scene.illustration, at: scene.at })
    for (const choice of [...(scene.earlierChoices ?? []), ...(scene.choice ? [scene.choice] : [])]) pieces.push({ kind: 'choice', text: t('story.chosen', { choice: choice.label }), at: choice.at })
  }
  if (episode.result) {
    const result = episode.result
    const at = episode.endedAt ?? episode.scenes[0].at
    if (result.text) pieces.push({ kind: 'text', text: result.text, at })
    const art = result.illustration ?? result.presentation?.illustration
    if (art) pieces.push({ kind: 'image', text: result.illustrationAlt ?? result.text, image: art, at })
  }
  return pieces
}
function Episode({ episode }: { episode: StoryEpisode }) {
  const pieces = useMemo(() => episodePieces(episode), [episode])
  const track = useRef<HTMLDivElement>(null)
  const nodes = useRef<(HTMLDivElement | null)[]>([])
  const [replay, setReplay] = useState(0)
  const [animation, setAnimation] = useState<{ index: number; shown: number; progress: number; y: number } | null>(null)
  useEffect(() => {
    if (!replay) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setAnimation(null); return }
    let frame = 0, last: number | null = null, elapsed = 0, index = 0, phase: 'typing' | 'pause' | 'move' = 'typing', y = 0, from = 0
    let skipped = false
    const revealText = () => { skipped = true }
    const element = track.current
    element?.addEventListener('click', revealText)
    const tick = (now: number) => {
      elapsed += last === null ? 0 : Math.min(80, now - last); last = now
      const piece = pieces[index]
      if (!piece) { setAnimation(null); return }
      const length = Array.from(piece.text).length
      let shown = piece.kind === 'image' ? length : Math.min(length, Math.floor(elapsed / 28))
      let progress = 0
      if (phase === 'typing') {
        if (piece.kind === 'image') { phase = 'move'; elapsed = 0; from = y }
        else if (skipped || shown >= length) { shown = length; phase = 'pause'; elapsed = 0; skipped = false }
      } else if (phase === 'pause') {
        shown = length
        if (elapsed >= 250) {
          elapsed = 0
          if (pieces[index + 1]?.kind === 'image') { index++; phase = 'move'; from = y }
          else { phase = 'move'; from = y }
        }
      } else {
        shown = length
        const current = pieces[index]
        progress = Math.min(1, elapsed / (current.kind === 'image' ? 1150 : 750))
        const node = nodes.current[index]
        const end = node && track.current ? node.offsetTop + node.offsetHeight : from
        y = from + (end - from) * (1 - Math.pow(1 - progress, 3))
        if (progress === 1) { index++; phase = 'typing'; elapsed = 0; progress = 0; skipped = false }
      }
      setAnimation({ index, shown: phase === 'typing' ? (pieces[index]?.kind === 'image' ? 0 : Math.min(Array.from(pieces[index]?.text ?? '').length, Math.floor(elapsed / 28))) : shown, progress, y })
      frame = window.requestAnimationFrame(tick)
    }
    setAnimation({ index: 0, shown: 0, progress: 0, y: 0 })
    frame = window.requestAnimationFrame(tick)
    return () => { window.cancelAnimationFrame(frame); element?.removeEventListener('click', revealText) }
  }, [replay, pieces])
  const first = episode.scenes[0]
  const last = episode.endedAt ?? first.at
  const cursorAt = animation ? pieces[animation.index]?.at ?? last : last
  const summary = [...(episode.result?.costs ?? []), ...(episode.result?.changes ?? [])]
  return <article className="story-episode" data-story-id={episode.id}>
    <div className="story-episode-heading"><div className="story-stamp"><time>{formatTime(first.at.minute)}</time><span> · {first.at.locationName} · D{displayDay(first.at.day)}</span></div>
      <ModalAction variant="secondary" onClick={() => setReplay(value => value + 1)}>{t('story.replay')}</ModalAction></div>
    <div className={`story-track${animation ? ' is-replaying' : ''}`} ref={track} style={{ '--story-y': `${animation?.y ?? 0}px` } as CSSProperties}>
      <div className="story-thread" aria-hidden="true" />
      <span className="story-imprint" aria-hidden="true" />
      <div className="story-pieces" aria-label={animation ? t('story.skip') : undefined}>
        {pieces.map((piece, index) => {
          const future = !!animation && index > animation.index
          const current = !!animation && index === animation.index
          const imageProgress = !animation || index < animation.index ? 1 : current ? animation.progress : 0
          const visibleText = current ? Array.from(piece.text).slice(0, animation.shown).join('') : piece.text
          return <div ref={node => { nodes.current[index] = node }} key={index} className={`story-piece story-${piece.kind}`} hidden={future}>
            {piece.kind === 'image' ? <div className="story-media" style={{ gridTemplateRows: `${imageProgress}fr` }}><div><img {...responsiveImageProps(piece.image!)} alt={piece.text} style={{ opacity: .25 + imageProgress * .75, filter: `brightness(${.08 + .92 * Math.pow(imageProgress, 1.5)}) saturate(${.6 + .4 * imageProgress})` }} /></div></div>
              : current ? <button type="button" className="story-reveal" aria-label={t('story.skip')}>{visibleText}</button> : <p>{visibleText}</p>}
          </div>
        })}
      </div>
      <div className="story-head" aria-hidden="true"><span /><time>{timeLabel(cursorAt)}</time></div>
    </div>
    {!animation && <div className="story-episode-end">
      {episode.scenes.filter(scene => scene.roll).map((scene, index) => <p key={index} className="story-roll">{t('story.roll', { roll: scene.roll!.value, modifier: scene.roll!.modifier, target: scene.roll!.target })}</p>)}
      {episode.result?.presentation?.places?.map(place => <div className="story-place" key={place.id}><strong>{place.name}</strong><span>{place.hours}</span><p>{place.detail}</p></div>)}
      {episode.result?.presentation?.notice && <p>{episode.result.presentation.notice}</p>}
      {!!summary.length && <ul className="story-summary">{summary.map((change, index) => <li className={change.kind} key={index}><span>{change.label}</span><strong>{change.value}</strong></li>)}</ul>}
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
