import { t } from './i18n'
import { formatNumber } from './i18n/formatters'
import { locationName } from './locationText'
import { eventChoiceBlock } from './eventChecks'

export function eventChoiceUnavailable(...args: Parameters<typeof eventChoiceBlock>) {
  const block = eventChoiceBlock(...args)
  if (block === null) return null
  if (block.id === 'phone') return block.message
  if (block.id === 'known-place') return t('event.block.knownPlace', { place: locationName(block.placeId) })
  return t(`event.block.${block.id}`, { amount: formatNumber(block.required) })
}
