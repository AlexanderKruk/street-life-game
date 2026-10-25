import type { Dispatch, SetStateAction } from 'react'
import type { GameState, Housing } from './game'
import type { ConsumedItem, ResultSnapshot } from './results'
export type Setter<T> = Dispatch<SetStateAction<T>>
export type GameSetter = (update: GameState | ((previous: GameState) => GameState), housing?: Housing) => void
export type RunWithResult = (title: string, action: () => void, before?: ResultSnapshot, includeTime?: boolean, always?: boolean, consumedItems?: ConsumedItem[]) => void
