import { useMemo } from 'react'

// Presentation only: timing, pauses and skip still come from StoryScreen.
// Reserve the *current* whole word at its first character; no future words.
type WordToken = { start: number; characters: string[]; whitespace: boolean; word: string }
function tokensFor(text: string): WordToken[] {
  let start = 0
  return (text.match(/\s+|\S+/gu) ?? []).map(word => {
    const characters = Array.from(word)
    const token = { start, characters, whitespace: /^\s+$/u.test(word), word }
    start += characters.length
    return token
  })
}

export default function StoryWordReveal({ text, shown, animate, letterKey }: { text: string; shown: number; animate: boolean; letterKey: string }) {
  const tokens = useMemo(() => tokensFor(text), [text])
  return <>{tokens.map(token => {
    const count = Math.min(token.characters.length, Math.max(0, shown - token.start))
    if (!count) return null
    if (token.whitespace) return <span key={token.start}>{token.characters.slice(0, count).join('')}</span>
    return <span className="story-word" data-word={token.word} key={token.start}>
      <span className="story-word-visible">{token.characters.slice(0, count).map((character, letter) =>
        <span className={animate ? 'story-character story-letter' : 'story-character'} key={letterKey + '-' + (token.start + letter)}>{character}</span>
      )}</span>
    </span>
  })}</>
}
