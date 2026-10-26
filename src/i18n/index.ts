import { inventoryHistory } from '../locales/en/inventoryHistory'
import { eventHistory } from '../locales/en/eventHistory'
import { common } from '../locales/en/common'
import { dialogs } from '../locales/en/dialogs'
import { results } from '../locales/en/results'
import { createTranslator } from './core'
import type { TranslationCatalog } from './types'

export const en = { ...common, ...dialogs, ...results, ...eventHistory, ...inventoryHistory } as const
export type MessageKey = keyof typeof en
export type Catalog = TranslationCatalog<typeof en>
export const locale = 'en-GB'
export const t = createTranslator(locale, en)
export { createTranslator, validateCatalog } from './core'
