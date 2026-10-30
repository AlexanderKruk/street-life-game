import type { ResultAction } from './resultActions'
import type { ResultCardData } from './ResultCard'
import type { ConsumedItem, ResultInventory } from './results'
import type { StoryEpisode, StoryStamp, StoryStore } from './story'

const consumedItems: Partial<Record<ResultAction['id'], ConsumedItem>> = {
  'use:water': 'water', 'use:food': 'food', 'use:bread': 'bread',
  'use:cannedFood': 'cannedFood', 'use:readyMeal': 'readyMeal',
  'use:wipes': 'wipes', 'use-medicine': 'medicines', smoke: 'cigarettes',
}

/** Observe the settled command; never consume, reroll or infer success from copy. */
export function appendInventoryStory(store: StoryStore, identity: ResultAction, result: ResultCardData,
  before: ResultInventory, after: ResultInventory, startedAt: StoryStamp, endedAt: StoryStamp): StoryStore {
  const item = consumedItems[identity.id]
  if (!item || (after[item] ?? 0) >= (before[item] ?? 0)) return store
  const id = store.nextId
  const episode: StoryEpisode = {
    id, source: 'inventory', sourceId: identity.id, status: 'awaiting-ack',
    // The existing result owns the only narrative and consequence block.
    scenes: [{ eventId: identity.id, title: identity.title, text: '', at: startedAt }],
    result, endedAt, resultIdentity: { actionId: identity.id },
  }
  return { ...store, nextId: id + 1, episodes: [...store.episodes, episode].slice(-500) }
}
