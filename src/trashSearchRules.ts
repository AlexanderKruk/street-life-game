import type { ResultSnapshot } from './results'
export type TrashArt = 'cup' | 'paper' | 'tray' | 'wrapper' | 'can-crushed' | 'plastic' | 'plastic-crushed' | 'can'
// Physical proportions follow the object, never whether its deposit is valid.
export const TRASH_ITEM_SCALE: Record<TrashArt, number> = {
  plastic: 2.5, 'plastic-crushed': 2.5,
  can: 2, 'can-crushed': 2,
  cup: 1.55, paper: 2, tray: 2.1, wrapper: 1.9,
}
export type TrashItem = { id: number; layer: number; art: TrashArt; x: number; y: number; rotation: number; scale: number; bottle: boolean; returnable: boolean; collected?: boolean; cleared?: boolean }

export type TrashSearch = { items: TrashItem[]; startedAt: number; found: number; before: ResultSnapshot }
export type TrashDrag = { id: number; offsetX: number; offsetY: number; startX: number; startY: number; moved: boolean }
export type TrashBounds = { left: number; top: number; width: number; height: number }
export function trashSearchMinutes(startedAt: number) {
  const seconds = Math.max(5, Math.floor((Date.now() - startedAt) / 1000))
  return Math.min(60, Math.max(10, Math.ceil(seconds / 5) * 5))
}
