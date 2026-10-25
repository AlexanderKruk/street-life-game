import { useRef, useState } from 'react'
import type { PhoneActivity } from './stateTypes'

export type InitialPhoneSession = {
  phoneActivity: PhoneActivity | null
  openingCallIndex: number
  answeredQuestions: string[]
  shelterPhoneCharging: boolean
  mobileServiceUntil: number
  mobileAutoRenew: boolean
  mobileRenewedDay: number
}

// One owner for phone progression; persistence and the shared clock stay in App.
export function usePhoneSession(initial: InitialPhoneSession) {
  const [phoneActivity, setPhoneActivity] = useState(initial.phoneActivity)
  const [openingCallIndex, setOpeningCallIndex] = useState(initial.openingCallIndex)
  const [answeredQuestions, setAnsweredQuestions] = useState(initial.answeredQuestions)
  const [shelterPhoneCharging, setShelterPhoneCharging] = useState(initial.shelterPhoneCharging)
  const [mobileServiceUntil, setMobileServiceUntil] = useState(initial.mobileServiceUntil)
  const [mobileAutoRenew, setMobileAutoRenew] = useState(initial.mobileAutoRenew)
  const [mobileRenewedDay, setMobileRenewedDay] = useState(initial.mobileRenewedDay)
  const completedActivity = useRef<PhoneActivity | null>(null)
  const renewalDay = useRef<number | null>(null)
  // StrictMode replays mount effects. Claim a transition before applying its
  // consequences; these refs are deliberately not persisted as extra save keys.
  function claimCompletion(activity: PhoneActivity) {
    if (completedActivity.current === activity) return false
    completedActivity.current = activity
    return true
  }
  function claimRenewal(day: number) {
    if (renewalDay.current === day) return false
    renewalDay.current = day
    return true
  }
  function resetPhoneSession() {
    completedActivity.current = null
    renewalDay.current = null
    setPhoneActivity(null)
    setOpeningCallIndex(0)
    setAnsweredQuestions([])
    setShelterPhoneCharging(false)
    setMobileServiceUntil(0)
    setMobileAutoRenew(true)
    setMobileRenewedDay(0)
  }
  return { phoneActivity, setPhoneActivity, openingCallIndex, setOpeningCallIndex, answeredQuestions, setAnsweredQuestions,
    shelterPhoneCharging, setShelterPhoneCharging, mobileServiceUntil, setMobileServiceUntil, mobileAutoRenew, setMobileAutoRenew,
    mobileRenewedDay, setMobileRenewedDay, resetPhoneSession, claimCompletion, claimRenewal }
}
export type PhoneSession = ReturnType<typeof usePhoneSession>
