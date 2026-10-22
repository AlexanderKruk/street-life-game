import { memo, useId, type ReactNode } from 'react'

export type IconName = 'thought' | 'hand' | 'chat' | 'laundry' | 'target-arrow' | 'notepad' | 'search' | 'history' | 'info' | 'map' | 'backpack' | 'person' | 'journal' | 'phone' | 'globe' | 'cloud' | 'rain' | 'sun' | 'moon' | 'bench' | 'bottle' | 'walk' | 'bed' | 'station' | 'bus' | 'headphones' | 'work' | 'help' | 'building' | 'hospital' | 'shop' | 'pause' | 'clock' | 'coins' | 'banknote' | 'thief' | 'face-ok' | 'face-fair' | 'face-bad' | 'face-very-bad' | 'face-very-good' | 'chevron-left' | 'chevron-right' | 'chevron-down' | 'check' | 'food' | 'water' | 'energy' | 'heart' | 'shower' | 'house' | 'documents' | 'thermometer' | 'ticket' | 'signal' | 'renew' | 'navigation' | 'music' | 'video' | 'ambulance' | 'close' | 'umbrella' | 'heart-broken' | 'pill' | 'cigarette' | 'plug' | 'target' | 'newspaper' | 'cup' | 'box' | 'can' | 'bag' | 'trash'

const WalkingGlyph = memo(function WalkingGlyph() {
  const maskId = useId()
  return <><defs><mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24" style={{ maskType: 'alpha' }}><image href="/street-life-game/assets/travel-walker.webp" width="24" height="24" /></mask></defs><rect width="24" height="24" fill="currentColor" stroke="none" mask={`url(#${maskId})`} /></>
})

const paths: Record<IconName, ReactNode> = {
  thought: <><path d="M7 16a6 6 0 1 1 10 0H7Z" /><circle cx="6" cy="19" r="1.5" /><path d="M3 22h.01" /></>,
  hand: <><path d="M4 14h4l3-3h5a2 2 0 0 1 0 4h-4m-4-1 3 5h6l5-6M2 13h3v8H2z" /></>,
  chat: <path d="M21 11a8 8 0 0 1-8 8H8l-5 3V11a9 9 0 0 1 18 0ZM7 9h10M7 13h6" />,
  laundry: <><rect x="3" y="2" width="18" height="20" rx="2" /><circle cx="12" cy="14" r="5" /><path d="M3 7h18M7 4.5h.01M10 4.5h.01M7 14c3-3 7 3 10 0" /></>,
  'target-arrow': <><path d="M18.4 9.1a8.5 8.5 0 1 1-3.5-3.5M15.5 12a4.5 4.5 0 1 1-3.5-3.5" /><path d="m10.5 13.5 10-10m-5.5 0h5.5V9" /></>,
  notepad: <><rect x="4" y="4" width="16" height="18" rx="2" /><path d="M8 2v4m8-4v4M8 10h8m-8 4h8m-8 4h5" /></>,
  search: <><circle cx="10.5" cy="10.5" r="7.5" /><path d="m16 16 5 5" /></>,
  history: <><path d="M3.5 8.5a9 9 0 1 1 .6 8.2M2.5 3.5l1 5.5L9 8M12 6.5V12l4 2" /></>,
  trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
  newspaper: <><path d="M5 4h16v16H5a2 2 0 0 1-2-2V8h2V4Zm0 4v12M9 8h8m-8 4h8m-8 4h3m3 0h2" /></>,
  cup: <><path d="M5 7h14l-2 14H7L5 7Zm-1 0h16M13 7l2-5h4" /></>,
  box: <><path d="m3 7 9-5 9 5v10l-9 5-9-5V7Zm0 0 9 5 9-5M12 12v10M7 5l10 5" /></>,
  can: <><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v14c0 4 14 4 14 0V5M8 10h8m-8 6h8" /></>,
  bag: <><path d="M4 7h16l-1 14H5L4 7Zm4 0V5a4 4 0 0 1 8 0v2" /></>,
  pill: <><path d="M9 3a5 5 0 0 1 7 7l-6 6a5 5 0 0 1-7-7l6-6Z" transform="translate(2 2)" /><path d="m8 8 8 8" /></>,
  cigarette: <><path d="M3 15h18v5H3zM16 15v5M7 3c-3 4 4 4 1 8m6-10c-3 5 4 5 1 10" /></>,
  plug: <><path d="M8 3v5m8-5v5M6 8h12v4a6 6 0 0 1-12 0V8Zm6 10v4" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  umbrella: <><path d="M3 12a9 9 0 0 1 18 0H3ZM12 3V1m0 11v8a2 2 0 0 0 4 0" /></>,
  'heart-broken': <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /><path d="m12 5.6-2 4.4 4 3-3 4 1 4" /></>,
  signal: <><path d="M5 20v-4m5 4v-8m5 8V8m5 12V4" /></>,
  renew: <><path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5" /></>,
  navigation: <><circle cx="12" cy="12" r="9" /><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z" /></>,
  music: <><path d="M9 18V5l12-2v13M9 8l12-2" /><ellipse cx="6" cy="18" rx="3" ry="3" /><ellipse cx="18" cy="16" rx="3" ry="3" /></>,
  video: <><path d="m3 8 17-5 1 5H3v12h18V8M7 7l2-3m4 2 2-3m2 2 2-3" /><path d="m10 12 5 3-5 3v-6Z" /></>,
  ambulance: <><path d="M3 17V6h11v11M14 9h4l3 4v4H3M17 10v4h4M8 9v5m-2.5-2.5h5" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  food: <><path d="M5 3v5a3 3 0 0 0 6 0V3M8 3v18M19 21V3c-3 2-4 5-4 9h4" /></>,
  water: <path d="M12 2c-2 4-7 8-7 13a7 7 0 0 0 14 0c0-5-5-9-7-13Z" />,
  energy: <path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" />,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
  shower: <><path d="M3 3h3l4 4m-3 3 6-6 4 4-6 6-4-4Zm7 6 1 1m3-5 1 1m-6 7 1 1m3-5 1 1m3-5 1 1m-4 7 1 1m3-5 1 1" /></>,
  building: <><rect x="4" y="2" width="16" height="20" rx="1" /><path d="M2 22h20M9 22v-5h6v5M8 6h2m4 0h2M8 10h2m4 0h2M8 14h2m4 0h2" /></>,
  house: <><path d="m3 10 9-8 9 8M5 8v13h14V8M9 21v-8h6v8" /></>,
  documents: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM14 2v6h6M8 12h8m-8 4h6" /></>,
  thermometer: <><path d="M9 15V5a3 3 0 0 1 6 0v10a5 5 0 1 1-6 0Z" /><path d="M12 8v10" /><circle cx="12" cy="18" r="1" /></>,
  ticket: <><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7Z" /><path d="M15 5v2m0 3v1m0 3v1m0 2v2" /></>,
  'chevron-down': <path d="m5 9 7 7 7-7" />,
  check: <path d="m5 12 4 4L19 6" />,
  'chevron-left': <path d="m15 5-7 7 7 7" />,
  'chevron-right': <path d="m9 5 7 7-7 7" />,
  thief: <><path d="M3 22v-1c0-3 3-5 6-6M21 22v-1c0-3-3-5-6-6M6 10V8a6 6 0 0 1 12 0v2M6 10c-1 2-1 4 1 5l5 3 5-3c2-1 2-3 1-5Z" /><path d="M6 10c3-2 9-2 12 0l-1 3-5-1-5 1Z" /><path d="M9 10.5h.01m6 0h.01" /></>,
  'face-ok': <><circle cx="12" cy="12" r="9" /><path d="M8 9h.01M16 9h.01M8 14a4.5 4.5 0 0 0 8 0" /></>,
  'face-fair': <><circle cx="12" cy="12" r="9" /><path d="M8 9h.01M16 9h.01M8 15h8" /></>,
  'face-bad': <><circle cx="12" cy="12" r="9" /><path d="M8 9h.01M16 9h.01M8 16a4.5 4.5 0 0 1 8 0" /></>,
  'face-very-bad': <><circle cx="12" cy="12" r="9" /><path d="m6.5 8 3 3m0-3-3 3m8-3 3 3m0-3-3 3M7.5 17a4.5 4.5 0 0 1 9 0Z" /></>,
  'face-very-good': <><circle cx="12" cy="12" r="9" /><path d="m6.5 10 2-2 2 2m3 0 2-2 2 2M7 13.5h10a5 5 0 0 1-10 0Z" /></>,
  banknote: <><rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M5 9h.01M19 15h.01" /></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" /><path d="M9 3v15m6-12v15" /></>,
  backpack: <><rect x="5" y="6" width="14" height="15" rx="3" /><path d="M9 6V4a3 3 0 0 1 6 0v2M8 12h8v6H8zM3 10v7m18-7v7" /></>,
  person: <><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2Z" /></>,
  journal: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6M9 11h6M9 15h4M3 7h2m-2 5h2m-2 5h2" /></>,
  phone: <><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M10 5h4m-3 14h2" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a16 16 0 0 0 0 18 16 16 0 0 0 0-18Z" /></>,
  cloud: <path d="M7 18a5 5 0 1 1 .4-10A6 6 0 0 1 19 10a4 4 0 1 1 0 8Z" />,
  rain: <><path d="M7 14a4 4 0 1 1 .3-8A5 5 0 0 1 17 7a3.5 3.5 0 1 1 0 7Z" /><path d="m8 17-1 3m6-3-1 3m6-3-1 3" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5" /></>,
  moon: <path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" />,
  bench: <><path d="M4 4h16v6H4zM2 13h20v4H2zM5 10v3m14-3v3M5 17v4m14-4v4" /></>,
  bottle: <path d="M10 2h4v4l2 4v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10l2-4Z" />,
  walk: <WalkingGlyph />,
  bed: <><path d="M3 5v16m18-9v9M3 17h18M3 12h15a3 3 0 0 1 3 3v2H3z" /><path d="M6 9h5v3H6z" /></>,
  station: <><rect x="5" y="2" width="14" height="16" rx="3" /><path d="M5 7h14m-9-5v5m4-5v5M8 21l2-3m6 3-2-3M8 13h1m6 0h1" /></>,
  bus: <><path d="M8 6v6m7-6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2v-2c0-.4-.1-.8-.2-1.2L20 5c-.3-.6-.8-1-1.4-1H5c-1.7 0-3 1.3-3 3v11h3M9 18h5" /><circle cx="7" cy="18" r="2" /><circle cx="16" cy="18" r="2" /></>,
  headphones: <><path d="M4 14v-3a8 8 0 0 1 16 0v3" /><rect x="3" y="12" width="4" height="8" rx="2" /><rect x="17" y="12" width="4" height="8" rx="2" /></>,
  work: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V3h8v4M3 13a24 24 0 0 0 18 0m-9 0v3" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 8.5a2.5 2.5 0 1 1 4 2c-1.5 1-1.5 1-1.5 3M12 17h.01" /></>,
  hospital: <><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z" /></>,
  shop: <><path d="M3 10 5 3h14l2 7M4 10v11h16V10M9 21v-7h6v7" /><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /></>,
  pause: <><circle cx="12" cy="12" r="9" /><path d="M9 8v8m6-8v8" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  coins: <><ellipse cx="10" cy="5" rx="7" ry="3" /><path d="M3 5v5c0 1.7 3.1 3 7 3m-7-3v5c0 1.7 3.1 3 7 3m7-13v5" /><ellipse cx="17" cy="14" rx="4" ry="2" /><path d="M13 14v5c0 1.1 1.8 2 4 2s4-.9 4-2v-5" /></>,
}

export const Icon = memo(function Icon({ name, className }: { name: IconName; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>
})

export const BatteryIcon = memo(function BatteryIcon({ charge }: { charge: number }) {
  const value = Math.max(0, Math.min(100, charge))
  return <svg className="battery-icon" viewBox="0 0 28 16" aria-hidden="true" focusable="false"><rect x="1" y="2" width="23" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M26 6v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><rect x="3.5" y="4.5" width={18 * value / 100} height="7" rx=".5" fill="currentColor" /></svg>
})

export function choiceIcon(id: string, label = ''): IconName {
  const value = `${id} ${label}`.toLowerCase()
  if (/music|listen to|headphone/.test(value)) return 'headphones'
  if (/think.*call|phone|question-|search|remember/.test(value) && !/bottle|bench|details/.test(value)) return 'phone'
  if (/ticket|transport/.test(value)) return 'ticket'
  if (/documents|officer/.test(value)) return 'documents'
  if (/laundry|clothes/.test(value)) return 'laundry'
  if (/shower/.test(value)) return 'shower'
  if (/refill|water/.test(value)) return 'water'
  if (/dinner|breakfast|meal|snack|food|take it|^ accept$/.test(value)) return 'food'
  if (/sleep|bed|shelter-rest|shelter-route|spend the night/.test(value)) return 'bed'
  if (/station-route|departure board/.test(value)) return 'station'
  if (/bottle/.test(value)) return 'bottle'
  if (/bench|seat|sit|rest/.test(value)) return 'bench'
  if (/charge|plug/.test(value)) return 'plug'
  if (/work|shift|job|income/.test(value)) return 'work'
  if (/health|medical|clinic|doctor/.test(value)) return 'hospital'
  if (/housing|accommodation/.test(value)) return 'house'
  if (/beg|give.*zł|change|benefits|afford/.test(value)) return 'coins'
  if (/hand|catch|grab/.test(value)) return 'hand'
  if (/ask|answer|call after|listen|say|sorry|promise/.test(value)) return 'chat'
  if (/think|nothing concrete/.test(value)) return 'thought'
  if (/look|check/.test(value)) return 'search'
  if (/wait|moment|stay|watch/.test(value)) return 'clock'
  if (/rain/.test(value)) return 'rain'
  if (/cover/.test(value)) return 'umbrella'
  if (/stop/.test(value)) return 'pause'
  if (/help|support/.test(value)) return 'help'
  if (/walk|move|going|keep|gather|leave|outside|decline|no thanks/.test(value)) return 'walk'
  return 'person'
}

export function locationIcon(id: string): IconName {
  return ({ street: 'walk', station: 'station', shop: 'shop', shelter: 'bed', 'residential-shelter': 'bed', support: 'building', jobcenter: 'work', work: 'work', hospital: 'hospital', 'free-clinic': 'hospital', daycenter: 'building' } as Record<string, IconName>)[id] ?? 'building'
}
