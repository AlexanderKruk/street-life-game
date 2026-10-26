import { t } from '../src/i18n'

t('nav.map')
t('discard.title', { name: 'Bread', quantity: 2 })
t('result.containers', { count: 3 })
// @ts-expect-error Message keys are closed, not arbitrary runtime strings.
t('missing.key')
// @ts-expect-error Named parameters are required.
t('discard.title')
// @ts-expect-error Parameter names must match the whole message.
t('discard.title', { item: 'Bread', quantity: 2 })
// @ts-expect-error Plural selectors accept numbers, not formatted strings.
t('result.containers', { count: '3' })
// @ts-expect-error Parameter-free messages take no parameter object.
t('nav.map', { unused: 1 })
