import { eventController } from '../locales/en/eventController'
import { travel } from '../locales/en/travel'
import { rain } from '../locales/en/rain'
import { sleep } from '../locales/en/sleep'
import { shelter } from '../locales/en/shelter'
import { controllerActions } from '../locales/en/controllerActions'
import { actions } from '../locales/en/actions'
import { locations } from '../locales/en/locations'
import { hud } from '../locales/en/hud'
import { status } from '../locales/en/status'
import { inventory } from '../locales/en/inventory'
import { effects } from '../locales/en/effects'
import { actionHistory } from '../locales/en/actionHistory'
import { inventoryHistory } from '../locales/en/inventoryHistory'
import { eventHistory } from '../locales/en/eventHistory'
import { common } from '../locales/en/common'
import { dialogs } from '../locales/en/dialogs'
import { results } from '../locales/en/results'
import { createTranslator } from './core'
import type { TranslationCatalog } from './types'

export const en = { ...eventController, ...travel, ...rain, ...sleep, ...shelter, ...controllerActions, ...actions, ...locations, ...hud, ...status, ...inventory, ...effects, ...common, ...dialogs, ...results, ...eventHistory, ...inventoryHistory, ...actionHistory } as const
export type MessageKey = keyof typeof en
export type Catalog = TranslationCatalog<typeof en>
export const locale = 'en-GB'
export const t = createTranslator(locale, en)
export { createTranslator, validateCatalog } from './core'
