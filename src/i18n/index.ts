import { loadLanguage } from './language'
import { pl } from '../locales/pl'
import { ru } from '../locales/ru'
import { app } from '../locales/en/app'
import { phoneAnswers } from '../locales/en/phoneAnswers'
import { trash } from '../locales/en/trash'
import { journalUi } from '../locales/en/journalUi'
import { phoneUi } from '../locales/en/phoneUi'
import { phoneProcess } from '../locales/en/phoneProcess'
import { phoneContent } from '../locales/en/phoneContent'
import { events } from '../locales/en/events'
import { eventUi } from '../locales/en/eventUi'
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
import type { ParameterValue, TranslationCatalog } from './types'

export const en = { ...app, ...phoneAnswers, ...trash, ...journalUi, ...phoneUi, ...phoneProcess, ...phoneContent, ...events, ...eventUi, ...eventController, ...travel, ...rain, ...sleep, ...shelter, ...controllerActions, ...actions, ...locations, ...hud, ...status, ...inventory, ...effects, ...common, ...dialogs, ...results, ...eventHistory, ...inventoryHistory, ...actionHistory } as const
export type MessageKey = keyof typeof en
export type Catalog = TranslationCatalog<typeof en>
export const language = loadLanguage()
export const locale = { en: 'en-GB', pl: 'pl-PL', ru: 'ru-RU' }[language]
const overrides = language === 'pl' ? pl : language === 'ru' ? ru : {}
const english = createTranslator('en-GB', en)
const translated = createTranslator(locale, { ...en, ...overrides } as typeof en)
type RuntimeTranslator = (key: string, params?: Record<string, ParameterValue>) => string
export const t = ((key: string, params?: Record<string, ParameterValue>) =>
  ((Object.hasOwn(overrides, key) ? translated : english) as RuntimeTranslator)(key, params)) as typeof english
export { createTranslator, validateCatalog } from './core'
