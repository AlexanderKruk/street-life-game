import type { ResultAction } from './resultActions'
import type { ResultCardData } from './ResultCard'
import type { StoryEpisode, StoryStamp, StoryStore } from './story'

/** Observe one settled command; never advance time or apply music rewards here. */
export function appendMusicStory(store: StoryStore, identity: ResultAction, result: ResultCardData,
  startedAt: StoryStamp, endedAt: StoryStamp, thought: string): StoryStore {
  if (identity.id !== 'music-walk') return store
  const episode: StoryEpisode = {
    id: store.nextId, source: 'action', sourceId: identity.id, status: 'awaiting-ack',
    scenes: [{ eventId: identity.id, title: identity.title, text: '', thought, at: startedAt }],
    result, endedAt, resultIdentity: { actionId: identity.id },
  }
  // The command may already have selected an encounter at its end. Preserve
  // that selection and its RNG, but show the action before that encounter.
  const started = startedAt.day * 1440 + startedAt.minute
  const next = store.episodes.findIndex(entry => entry.status === 'active'
    && entry.scenes[0].at.day * 1440 + entry.scenes[0].at.minute >= started)
  const episodes = [...store.episodes]
  episodes.splice(next < 0 ? episodes.length : next, 0, episode)
  return { ...store, nextId: store.nextId + 1, episodes: episodes.slice(-500) }
}
