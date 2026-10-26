import { t } from './i18n'
export const PHONE_SEARCH_ESTIMATE = 15

export const practicalQuestions = [
    { id: 'morning', hasDetails: false, icon: '💬', title: t('phone.question.morning.title'), noteTitle: t('phone.question.morning.noteTitle'), text: t('phone.question.morning.text'), locations: ['support', 'daycenter', 'free-clinic'] },
    { id: 'bed', hasDetails: true, icon: '🛏️', title: t('phone.question.bed.title'), noteTitle: t('phone.question.bed.noteTitle'), text: t('phone.question.bed.text'), locations: ['shelter'] },
    { id: 'no-place', hasDetails: true, icon: '🤔', title: t('phone.question.no-place.title'), noteTitle: t('phone.question.no-place.noteTitle'), text: t('phone.question.no-place.text'), locations: [] },
    { id: 'supplies', hasDetails: true, icon: '🥪', title: t('phone.question.supplies.title'), noteTitle: t('phone.question.supplies.noteTitle'), text: t('phone.question.supplies.text'), locations: ['shop'] },
    { id: 'work', hasDetails: true, icon: '💼', title: t('phone.question.work.title'), noteTitle: t('phone.question.work.noteTitle'), text: t('phone.question.work.text'), locations: ['work'] },
    { id: 'clinic', hasDetails: true, icon: '🩺', title: t('phone.question.clinic.title'), noteTitle: t('phone.question.clinic.noteTitle'), text: t('phone.question.clinic.text'), locations: ['free-clinic'] },
    { id: 'charging', hasDetails: true, icon: '🔋', title: t('phone.question.charging.title'), noteTitle: t('phone.question.charging.noteTitle'), text: t('phone.question.charging.text'), locations: ['station'] },
  ]
