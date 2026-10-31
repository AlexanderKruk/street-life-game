import { useMemo } from 'react'

/** Reserve only a started word. Every glyph stays in normal flow, even while
 * invisible: no absolute text layer, duplicate word or paragraph measurement. */
export default function StoryText({ text, shown, animate, characterKey }: { text: string; shown: number; animate: boolean; characterKey: string }) {
  const words = useMemo(() => {
    let start = 0
    return (text.match(/[ \t\r\n]+|[^ \t\r\n]+/gu) ?? []).map(value => {
      const letters = Array.from(value)
      const word = { start, letters, space: /^[ \t\r\n]+$/.test(value) }
      start += letters.length
      return word
    })
  }, [text])
  return <>{words.map(word => {
    const count = Math.max(0, Math.min(word.letters.length, shown - word.start))
    if (!count) return null
    if (word.space) return <span key={word.start}>{word.letters.slice(0, count).join('')}</span>
    return <span className="story-word" key={word.start}>{word.letters.map((letter, index) => {
      const visible = index < count
      return <span key={`${characterKey}-${word.start + index}`} className={visible ? `story-character${animate ? ' story-letter' : ''}` : 'story-reserved-character'}
        data-character={visible ? undefined : letter} aria-hidden={visible ? undefined : true}>{visible ? letter : null}</span>
    })}</span>
  })}</>
}
