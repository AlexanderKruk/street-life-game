import type { StreetEvent, StreetEventChoice } from './events'
import type { EventDiceState } from './stateTypes'
import type { ResultCardData } from './ResultCard'

export type StoryStamp = { day: number; minute: number; locationId: string; locationName: string }
export type StoryScene = {
  eventId: string; title: string; text: string; illustration?: string; at: StoryStamp
  choice?: { id: string; label: string; at: StoryStamp }
  earlierChoices?: { id: string; label: string; at: StoryStamp }[]
  roll?: { value: number; modifier: number; target: number; stat: string }
}
export type StoryEpisode = {
  id: number; source: 'encounter' | 'rain' | 'check' | 'inventory'; sourceId: string
  status: 'active' | 'awaiting-ack' | 'complete' | 'interrupted'
  scenes: StoryScene[]; result?: ResultCardData; endedAt?: StoryStamp
  resultIdentity?: { actionId: string; outcomeId?: string }
}
export type StoryStore = { version: 1; nextId: number; episodes: StoryEpisode[] }
export const emptyStory = (): StoryStore => ({ version: 1, nextId: 1, episodes: [] })
export const sceneFromEvent = (event: StreetEvent, at: StoryStamp): StoryScene => ({ eventId: event.id, title: event.title, text: event.text, illustration: event.illustration, at })
export const storyRoll = (dice: EventDiceState) => dice.roll === null || !dice.choice.check ? undefined : ({ value: dice.roll, modifier: dice.modifier, target: dice.choice.check.dc, stat: dice.choice.check.stat })
export function chooseStoryScene(scene: StoryScene, choice: StreetEventChoice, at: StoryStamp, dice?: EventDiceState): StoryScene {
  const id = choice.id ?? 'attempt'
  const earlierChoices = scene.choice && scene.choice.id !== id ? [...(scene.earlierChoices ?? []), scene.choice] : scene.earlierChoices
  return { ...scene, ...(earlierChoices ? { earlierChoices } : {}), choice: { id, label: choice.label, at: scene.choice?.id === id ? scene.choice.at : at }, ...(dice && storyRoll(dice) ? { roll: storyRoll(dice) } : {}) }
}

const record = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value)
const text = (value: unknown): value is string => typeof value === 'string' && value.length <= 40000
const image = (value: unknown) => value === undefined || typeof value === 'string' && /^\/street-life-game\/assets\/[\w-]+\.webp$/.test(value)
const stamp = (value: unknown): value is StoryStamp => record(value) && Number.isInteger(value.day) && value.day >= 1 && Number.isFinite(value.minute) && value.minute >= 0 && value.minute < 1440 && text(value.locationId) && text(value.locationName)
function validScene(value: unknown): value is StoryScene {
  return record(value) && text(value.eventId) && text(value.title) && text(value.text) && image(value.illustration) && stamp(value.at)
    && (value.choice === undefined || record(value.choice) && text(value.choice.id) && text(value.choice.label) && stamp(value.choice.at))
    && (value.earlierChoices === undefined || Array.isArray(value.earlierChoices) && value.earlierChoices.length <= 32 && value.earlierChoices.every((choice: unknown) => record(choice) && text(choice.id) && text(choice.label) && stamp(choice.at)))
    && (value.roll === undefined || record(value.roll) && Number.isInteger(value.roll.value) && value.roll.value >= 1 && value.roll.value <= 20 && Number.isFinite(value.roll.modifier) && Number.isFinite(value.roll.target) && text(value.roll.stat))
}
function validResult(value: unknown): value is ResultCardData {
  if (!record(value) || !text(value.title) || !text(value.text) || !image(value.illustration)) return false
  for (const key of ['label', 'reflection', 'illustrationAlt', 'rainResultId', 'closingText']) if (value[key] !== undefined && !text(value[key])) return false
  if (value.batteryInSummary !== undefined && typeof value.batteryInSummary !== 'boolean') return false
  if (value.visibleStats !== undefined && (!Array.isArray(value.visibleStats) || !value.visibleStats.every(text))) return false
  if (value.bottleSearch !== undefined && (!record(value.bottleSearch) || !Number.isFinite(value.bottleSearch.found))) return false
  for (const key of ['costs', 'changes']) {
    const rows = value[key]
    if (rows === undefined) continue
    if (!Array.isArray(rows) || rows.length > 100 || !rows.every((row: unknown) => {
      if (!record(row) || !text(row.label) || !text(row.value) || !['positive', 'negative', 'neutral'].includes(row.kind) || (row.id !== undefined && !text(row.id)) || (row.amount !== undefined && !Number.isFinite(row.amount))) return false
      const meter = row.meter
      return meter === undefined || record(meter) && Number.isFinite(meter.before) && Number.isFinite(meter.after) && (meter.cap === undefined || Number.isFinite(meter.cap)) && (meter.capReason === undefined || text(meter.capReason))
    })) return false
  }
  const p = value.presentation
  return p === undefined || record(p) && ['heading', 'label', 'lead'].every(key => text(p[key])) && image(p.illustration) && (p.notice === undefined || text(p.notice)) && (p.mapStatus === undefined || text(p.mapStatus)) && (p.compact === undefined || typeof p.compact === 'boolean') && (p.places === undefined || Array.isArray(p.places) && p.places.length <= 50 && p.places.every((place: unknown) => record(place) && ['id', 'name', 'hours', 'detail'].every(key => text(place[key]))))
}
/** Optional, versioned archive. Never reconstruct scenes or run commands on load. */
export function loadStory(value: unknown): StoryStore {
  if (!record(value) || value.version !== 1 || !Array.isArray(value.episodes)) return emptyStory()
  const ids = new Set<number>()
  const episodes = value.episodes.filter((entry: unknown): entry is StoryEpisode => {
    if (!record(entry) || !Number.isSafeInteger(entry.id) || entry.id < 1 || ids.has(entry.id) || !['encounter', 'rain', 'check', 'inventory'].includes(entry.source) || !text(entry.sourceId) || !['active', 'awaiting-ack', 'complete', 'interrupted'].includes(entry.status) || !Array.isArray(entry.scenes) || !entry.scenes.length || entry.scenes.length > 32 || !entry.scenes.every(validScene) || (entry.result !== undefined && !validResult(entry.result)) || (entry.endedAt !== undefined && !stamp(entry.endedAt)) || (entry.resultIdentity !== undefined && (!record(entry.resultIdentity) || !text(entry.resultIdentity.actionId) || (entry.resultIdentity.outcomeId !== undefined && !text(entry.resultIdentity.outcomeId)))) || (['awaiting-ack', 'complete'].includes(entry.status) && (!entry.result || !entry.endedAt))) return false
    ids.add(entry.id); return true
  }).slice(-500)
  return { version: 1, nextId: Math.max(1, Number.isSafeInteger(value.nextId) ? value.nextId : 1, ...episodes.map(entry => entry.id + 1)), episodes }
}
