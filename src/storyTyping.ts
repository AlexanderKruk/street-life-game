export type StoryTyping = { at: number[]; duration: number }

/** Presentation only. Build once per paragraph, using Unicode characters. */
export function createStoryTyping(text: string): StoryTyping {
  const characters = Array.from(text)
  const at: number[] = []
  let duration = 0, pause = 0
  for (let index = 0; index < characters.length; index++) {
    const character = characters[index], previous = characters[index - 1] ?? '', next = characters[index + 1] ?? ''
    duration += 50
    at.push(duration)
    const betweenDigits = /\d/u.test(previous) && /\d/u.test(next)
    const dash = /[—–]/u.test(character) || character === '-' && /\s/u.test(previous) && /\s/u.test(next)
    if (character === ';' || character === ':' && !betweenDigits) pause = Math.max(pause, 180)
    if (!betweenDigits && dash) pause = Math.max(pause, 200)
    if (!betweenDigits && character === ',') pause = Math.max(pause, 120)
    if (/[.!?…]/u.test(character) && (character !== '.' || !betweenDigits)) pause = 300
    // Keep punctuation clusters and closing quotes together before pausing.
    if (!/[,:;.!?…—–»”"’')\]]/u.test(next)) { duration += pause; pause = 0 }
  }
  return { at, duration }
}

export function storyCharactersShown(typing: StoryTyping, elapsed: number): number {
  let start = 0, end = typing.at.length
  while (start < end) {
    const middle = Math.floor((start + end) / 2)
    if (typing.at[middle] <= elapsed) start = middle + 1
    else end = middle
  }
  return start
}
