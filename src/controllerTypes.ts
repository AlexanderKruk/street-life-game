import type { ActionHistoryFacts } from './actionHistory'
import type { InventoryHistoryFacts } from './inventoryHistory'
import type { Dispatch, SetStateAction } from 'react'
import type { GameState, Housing } from './game'
import type { ConsumedItem, ResultSnapshot } from './results'
import type { ResultAction } from './resultActions'
export type Setter<T> = Dispatch<SetStateAction<T>>
export type GameSetter = (update: GameState | ((previous: GameState) => GameState), housing?: Housing) => void
export type RunWithResult = (identity: ResultAction, action: () => void | InventoryHistoryFacts | ActionHistoryFacts, before?: ResultSnapshot, includeTime?: boolean, always?: boolean, consumedItems?: ConsumedItem[]) => void
