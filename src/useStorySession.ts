import { useRef, useState } from 'react'
import type { StreetEvent, StreetEventChoice } from './events'
import type { EventDiceState } from './stateTypes'
import type { ResultCardData } from './ResultCard'
import type { ResultAction } from './resultActions'
import type { ResultInventory } from './results'
import { appendMusicStory } from './musicStory'
import { appendInventoryStory } from './inventoryStory'
import { chooseStoryScene, emptyStory, sceneFromEvent, type StoryEpisode, type StoryScene, type StoryStamp, type StoryStore } from './story'

/** Passive archive commands; no RNG, game commands, storage or gameplay clock. */
export function useStorySession(initial: StoryStore) {
  const [store, setStore] = useState(initial)
  const latest = useRef(store)
  function commit(update: (previous: StoryStore) => StoryStore) {
    const next = update(latest.current)
    if (next === latest.current) return
    latest.current = next
    setStore(next)
  }
  function begin(source: StoryEpisode['source'], sourceId: string, scene: StoryScene, continuation = false) {
    let episode = latest.current.episodes.find(entry => entry.source === source && entry.sourceId === sourceId && entry.status === 'active')
    if (!episode && continuation) episode = [...latest.current.episodes].reverse().find(entry => entry.source === source && entry.status === 'active')
    if (episode) {
      if (episode.scenes.at(-1)?.eventId !== scene.eventId) {
        const id = episode.id
        commit(previous => ({ ...previous, episodes: previous.episodes.map(entry => entry.id === id ? { ...entry, scenes: [...entry.scenes, scene] } : entry) }))
      }
      return episode.id
    }
    const id = latest.current.nextId
    commit(previous => ({ ...previous, nextId: id + 1, episodes: [...previous.episodes, { id, source, sourceId, status: 'active' as const, scenes: [scene] }].slice(-500) }))
    return id
  }
  function openEvent(event: StreetEvent, at: StoryStamp) {
    // The last scene can be a continuation restored after a reload.
    const existing = latest.current.episodes.find(entry => entry.source === 'encounter' && entry.status === 'active' && entry.scenes.at(-1)?.eventId === event.id)
    return existing?.id ?? begin('encounter', event.id, sceneFromEvent(event, at), event.continuationOnly)
  }
  function choose(event: StreetEvent, choice: StreetEventChoice, at: StoryStamp, dice?: EventDiceState) {
    const id = openEvent(event, at)
    commit(previous => ({ ...previous, episodes: previous.episodes.map(entry => entry.id === id ? { ...entry, scenes: entry.scenes.map((scene, index) => index === entry.scenes.length - 1 ? chooseStoryScene(scene, choice, at, dice) : scene) } : entry) }))
    return id
  }
  function chooseScene(id: number, choice: StreetEventChoice, at: StoryStamp, dice?: EventDiceState) {
    commit(previous => ({ ...previous, episodes: previous.episodes.map(entry => entry.id === id ? { ...entry, scenes: entry.scenes.map((scene, index) => index === entry.scenes.length - 1 ? chooseStoryScene(scene, choice, at, dice) : scene) } : entry) }))
    return id
  }
  function finish(id: number, result: ResultCardData, at: StoryStamp, resultIdentity?: StoryEpisode['resultIdentity'], completed = false) {
    commit(previous => {
      const entry = previous.episodes.find(entry => entry.id === id)
      if (!entry || entry.status !== 'active') return previous
      return { ...previous, episodes: previous.episodes.map(entry => entry.id === id ? { ...entry, status: completed ? 'complete' : 'awaiting-ack', result, endedAt: at, ...(resultIdentity ? { resultIdentity } : {}) } : entry) }
    })
  }
  function acknowledge() {
    commit(previous => previous.episodes.some(entry => entry.status === 'awaiting-ack') ? { ...previous, episodes: previous.episodes.map(entry => entry.status === 'awaiting-ack' ? { ...entry, status: 'complete' } : entry) } : previous)
  }
  function recordInventoryResult(identity: ResultAction, result: ResultCardData, before: ResultInventory, after: ResultInventory, startedAt: StoryStamp, endedAt: StoryStamp) {
    commit(previous => appendInventoryStory(previous, identity, result, before, after, startedAt, endedAt))
  }
  function recordMusicResult(identity: ResultAction, result: ResultCardData, startedAt: StoryStamp, endedAt: StoryStamp, thought: string) {
    commit(previous => appendMusicStory(previous, identity, result, startedAt, endedAt, thought))
  }
  function interrupt(id: number) {
    commit(previous => ({ ...previous, episodes: previous.episodes.map(entry => entry.id === id && entry.status === 'active' ? { ...entry, status: 'interrupted' } : entry) }))
  }
  function reset() { commit(() => emptyStory()) }
  return { store, current: () => latest.current, begin, openEvent, choose, chooseScene, finish, recordInventoryResult, recordMusicResult, acknowledge, interrupt, reset }
}
export type StorySession = ReturnType<typeof useStorySession>
