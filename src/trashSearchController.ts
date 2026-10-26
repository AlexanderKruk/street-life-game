import { useRef, useState } from 'react'
import { BACKPACK_CAPACITY, BOTTLE_STACK_SIZE, backpackSlots } from './inventory'
import type { GameState, ActionResult } from './game'
import type { Inventory } from './stateTypes'
import type { ResultCardData } from './ResultCard'
import type { ResultSnapshot } from './results'
import { trashSearchMinutes, TRASH_ITEM_SCALE, type TrashArt, type TrashItem, type TrashSearch, type TrashDrag, type TrashBounds } from './trashSearchRules'
import type { GameSetter, RunWithResult, Setter } from './controllerTypes'
import { useLatestAction } from './useLatestAction'
export function useTrashSession() {
  const [trashGame, setTrashGame] = useState<TrashSearch | null>(null)
  const trashDrag = useRef<TrashDrag | null>(null)
  const acceptedIds = useRef(new Set<number>())
  const lastFinished = useRef<TrashSearch | null>(null)
  function resetTrashSession() { setTrashGame(null); trashDrag.current = null; acceptedIds.current.clear(); lastFinished.current = null }
  return { trashGame, setTrashGame, trashDrag, acceptedIds, lastFinished, resetTrashSession }
}
type Session = ReturnType<typeof useTrashSession>
type Context = {
  inventory: Inventory
  currentId: string
  activeEvent: boolean
}
type Host = {
  setInventory: Setter<Inventory>; setGame: GameSetter; setMessage: Setter<string>; setInfoModal: Setter<ResultCardData | null>
  applyAction: (state: GameState, action: ActionResult) => GameState; runWithResult: RunWithResult; resultSnapshot: () => ResultSnapshot
}
export function useTrashController(session: Session, context: Context, host: Host) {
  const { trashGame, setTrashGame, trashDrag, acceptedIds, lastFinished } = session
  const { inventory, currentId, activeEvent } = context
  const { setInventory, setGame, setMessage, setInfoModal, applyAction, runWithResult, resultSnapshot } = host
  function searchStreetBottles() {
    if (activeEvent || currentId !== 'street' || trashGame) return
    acceptedIds.current.clear()
    const clutter: TrashArt[] = ['paper', 'cup', 'tray', 'wrapper']
    const layers = 6
    const perLayer = 3
    const count = layers * perLayer
    const bottleCount = 2 + Math.floor(Math.random() * 5)
    const shuffled = Array.from({ length: count }, (_, id) => id)
    for (let index = count - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1))
      ;[shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]]
    }
    const bottleIndexes = new Set(shuffled.slice(0, bottleCount))
    const items: TrashItem[] = Array.from({ length: count }, (_, id) => {
      const bottle = bottleIndexes.has(id)
      const layer = Math.floor(id / perLayer)
      const slot = id % perLayer
      const base = [
        { x: 22, y: 32 },
        { x: 70, y: 28 },
        { x: 48, y: 68 },
      ][slot]
      const appearance = Math.random()
      const can = bottle && appearance < .35
      const returnable = bottle && Math.random() < (can ? .78 : .65)
      const art: TrashArt = bottle ? can ? returnable ? 'can' : 'can-crushed' : returnable ? 'plastic' : 'plastic-crushed' : clutter[Math.floor(appearance * clutter.length)]
      return {
        id,
        layer,
        art,
        x: base.x + (Math.random() * 14 - 7),
        y: base.y + (Math.random() * 14 - 7),
        rotation: Math.random() * 360,
        scale: TRASH_ITEM_SCALE[art] + Math.random() * .2,
        bottle,
        returnable,
      }
    })
    setTrashGame({ items, startedAt: Date.now(), before: resultSnapshot(), found: 0 })
  }

  function startTrashDrag(id: number, clientX: number, clientY: number, bounds: TrashBounds) {
    const item = trashGame?.items.find((entry) => entry.id === id)
    if (!item || item.collected || !trashGame) return false
    const pointerX = ((clientX - bounds.left) / bounds.width) * 100
    const pointerY = ((clientY - bounds.top) / bounds.height) * 100
    trashDrag.current = { id, offsetX: pointerX - item.x, offsetY: pointerY - item.y, startX: clientX, startY: clientY, moved: false }
    return true
  }

  function moveTrashItem(id: number, clientX: number, clientY: number, bounds: TrashBounds) {
    const drag = trashDrag.current
    if (!drag || drag.id !== id) return
    if (!drag.moved && Math.hypot(clientX - drag.startX, clientY - drag.startY) < 5) return
    const pointerX = ((clientX - bounds.left) / bounds.width) * 100
    const pointerY = ((clientY - bounds.top) / bounds.height) * 100
    const nextX = Math.max(-30, Math.min(110, pointerX - drag.offsetX))
    const nextY = Math.max(-30, Math.min(110, pointerY - drag.offsetY))
    drag.moved = true
    const draggedItem = trashGame?.items.find((entry) => entry.id === id)
    const halfWidth = 18 * (draggedItem?.scale ?? 1) / bounds.width * 100
    const halfHeight = 20 * (draggedItem?.scale ?? 1) / bounds.height * 100
    // Rectangular field: clear only the dragged item as it reaches an edge,
    // and discard rubbish once roughly a quarter has crossed that edge.
    const cleared = nextX - halfWidth < 0 || nextX + halfWidth > 100 || nextY - halfHeight < 0 || nextY + halfHeight > 100
    const outside = nextX - halfWidth * .5 < 0 || nextX + halfWidth * .5 > 100 || nextY - halfHeight * .5 < 0 || nextY + halfHeight * .5 > 100
    setTrashGame((active) => active ? { ...active, items: active.items.map((item) => item.id === id ? {
      ...item,
      x: nextX,
      y: nextY,
      cleared: item.cleared || cleared,
      collected: !item.returnable && outside ? true : item.collected,
    } : item) } : null)
  }

  function collectTrashBottle(id: number) {
    if (!trashGame) return
    const item = trashGame.items.find((entry) => entry.id === id)
    if (!item || !item.returnable || item.collected || acceptedIds.current.has(id)) return
    const currentBottleSlots = inventory.bottles > 0 ? Math.ceil(inventory.bottles / BOTTLE_STACK_SIZE) : 0
    const otherSlots = backpackSlots(inventory) - currentBottleSlots
    const bottleCapacity = Math.max(0, BACKPACK_CAPACITY - otherSlots) * BOTTLE_STACK_SIZE
    if (inventory.bottles >= bottleCapacity) { setMessage('Your backpack has no room for another container.'); return }
    acceptedIds.current.add(id)
    setInventory((prev) => ({ ...prev, bottles: prev.bottles + 1 }))
    setTrashGame((active) => active ? { ...active, found: active.found + 1, items: active.items.map((entry) => entry.id === id ? { ...entry, collected: true } : entry) } : null)
  }

  function finishTrashSearchImpl() {
    if (!trashGame || lastFinished.current === trashGame) return
    lastFinished.current = trashGame
    const minutes = trashSearchMinutes(trashGame.startedAt)
    const { found } = trashGame
    setGame((prev) => applyAction(prev, { minutes, energy: -Math.max(1, minutes / 15), hygiene: -Math.max(2, minutes / 5), mood: found > 0 ? 1 : -2 }))
    setTrashGame(null)
    const text = found > 0 ? `You searched the trash for ${minutes} minutes and kept ${found} returnable container${found === 1 ? '' : 's'}.` : `You searched for ${minutes} minutes and found nothing useful.`
    setMessage(text)
    setInfoModal({ title: 'Trash search results', text, bottleSearch: { found } })
  }

  const checkTrashDeadline = useLatestAction(() => {
    if (trashGame && Date.now() - trashGame.startedAt >= 60_000) finishTrashSearch()
  })

  function finishTrashSearch() { runWithResult({ id: 'trash-search', title: 'Trash search results', actionHistory: { kind: 'action', failed: trashGame?.found === 0 } }, finishTrashSearchImpl, trashGame?.before ?? resultSnapshot()) }
  function endTrashDrag(id: number) {
    const tapped = trashDrag.current?.id === id && !trashDrag.current.moved
    trashDrag.current = null
    return tapped
  }
  function cancelTrashDrag() { trashDrag.current = null }
  return { searchStreetBottles, startTrashDrag, moveTrashItem, collectTrashBottle, finishTrashSearch, checkTrashDeadline, endTrashDrag, cancelTrashDrag }
}
