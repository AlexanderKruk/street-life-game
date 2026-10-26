import type { WeatherId } from './weather'
import { CLOTHING_WETNESS_ENABLED } from './gameplayFeatures'
export type SleepKind = 'ground' | 'bench' | 'shelter' | 'residential'
export type SleepExposure = 'outside' | 'cover' | 'indoors' | 'transit'

// Calibrated to the existing eight-hour chances in constant conditions.
// Hazards add across minutes, so one long jump and many ticks are equivalent.
export function sleepIllnessHazard(kind: SleepKind, temperature: number, weather: WeatherId, wetness: number, exposure: SleepExposure) {
  if (kind !== 'ground' && kind !== 'bench') return 0
  const cold = temperature <= 5 ? 0.28 : temperature <= 10 ? 0.16 : temperature <= 15 ? 0.07 : 0
  const weatherRisk = exposure === 'outside' ? weather === 'Rain' || weather === 'Downpour' ? 0.22 : weather === 'Drizzle' ? 0.08 : weather === 'Showers' ? 0.14 : weather === 'Windy' ? 0.10 : 0 : 0
  const damp = CLOTHING_WETNESS_ENABLED ? Math.max(0, Math.min(100, wetness)) / 100 * 0.2 * (temperature <= 10 ? 1 : temperature <= 15 ? 0.5 : 0) : 0
  const eightHourRisk = Math.min(0.65, 0.08 + (kind === 'ground' ? 0.08 : 0) + cold + weatherRisk + damp)
  return -Math.log1p(-eightHourRisk) / 480
}

export function sleepIllnessChance(dose: number) {
  return Math.min(0.65, -Math.expm1(-Math.max(0, dose)))
}
