export const SHELTER_QUEUE_MINUTES = 20

export const SHELTER_ENTRY_OPEN = 18 * 60

export const SHELTER_REGISTRATION_OPEN = SHELTER_ENTRY_OPEN + 20


export function shelterPeopleAhead(arrivalMinute: number) {
  // Applicants gather before the doors open; earlier arrival keeps priority.
  return Math.floor(Math.max(0, arrivalMinute - 17 * 60) / 45)
}


export function shelterQueueMinutes(minute: number) {
  return Math.max(SHELTER_QUEUE_MINUTES, SHELTER_REGISTRATION_OPEN - minute)
}

