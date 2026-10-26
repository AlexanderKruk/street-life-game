export const OPENING_CALLS_KEY = 'street-life-opening-calls-v1'
export const CALL_BATTERY_PER_MINUTE = 0.2

export const OPENING_CALLS = [
  {
    id: 'call-university', minutes: 2, moodLoss: 2,
    label: 'Maybe I could stay with someone I know. I’ll call a friend from university. We used to be close.',
    callingTitle: 'Calling a university friend', title: 'No answer',
    text: 'The phone keeps ringing. You wait, watching the windows across the street. Eventually, the call ends. No answer.',
    illustration: 'event-call-no-answer',
  },
  {
    id: 'call-colleague', minutes: 5, moodLoss: 5,
    label: 'I’ll try my old colleague. We worked together for years. Maybe he could put me up for a couple of nights.',
    callingTitle: 'Calling an old colleague', title: 'A call to an old colleague',
    text: '“I talked to my wife. With the kids here… she’s not comfortable having someone stay, even for a couple of nights. I’m sorry. We can’t.”\n\nYou hear a child calling him from another room.',
    illustration: 'event-call-family',
  },
  {
    id: 'call-friend', minutes: 5, moodLoss: 5,
    label: 'There’s one more friend I could try. I helped him move here last year. We haven’t seen each other since.',
    callingTitle: 'Calling another friend', title: 'Nowhere to put you',
    text: '“I’m renting a single room myself. There’s barely enough space for my bed and my things. I’ve got nowhere to put you.”',
    illustration: 'event-call-small-room',
  },
] as const

export function openingCall(id: string) {
  return OPENING_CALLS.find(call => call.id === id)
}

export function loadOpeningCallIndex(storage: Pick<Storage, 'getItem'>, existingGame: boolean): number {
  try {
    const raw = storage.getItem(OPENING_CALLS_KEY)
    const index = raw === null ? null : JSON.parse(raw)
    if (Number.isInteger(index) && index >= 0 && index <= OPENING_CALLS.length) return index
  } catch { /* Invalid progression must not rewrite an existing run. */ }
  return existingGame ? OPENING_CALLS.length : 0
}
