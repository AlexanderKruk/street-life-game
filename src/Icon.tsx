import type { ReactNode } from 'react'

export type IconName = 'map' | 'backpack' | 'street' | 'person' | 'journal' | 'phone' | 'cloud' | 'rain' | 'sun' | 'moon' | 'bench' | 'bottle' | 'walk' | 'bed' | 'station' | 'headphones' | 'work' | 'help' | 'hospital' | 'shop' | 'pause'

const paths: Record<IconName, ReactNode> = {
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" /><path d="M9 3v15m6-12v15" /></>,
  backpack: <><rect x="5" y="6" width="14" height="15" rx="3" /><path d="M9 6V4a3 3 0 0 1 6 0v2M8 12h8v6H8zM3 10v7m18-7v7" /></>,
  street: <><path d="M3 21V9h6v12M9 21V3h6v18m0 0V12h6v9M1 21h22M6 12v1m0 3v1m6-11v1m0 3v1m0 3v1m6 0v1" /></>,
  person: <><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2Z" /></>,
  journal: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6M9 11h6M9 15h4M3 7h2m-2 5h2m-2 5h2" /></>,
  phone: <><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M10 5h4m-3 14h2" /></>,
  cloud: <path d="M7 18a5 5 0 1 1 .4-10A6 6 0 0 1 19 10a4 4 0 1 1 0 8Z" />,
  rain: <><path d="M7 14a4 4 0 1 1 .3-8A5 5 0 0 1 17 7a3.5 3.5 0 1 1 0 7Z" /><path d="m8 17-1 3m6-3-1 3m6-3-1 3" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5" /></>,
  moon: <path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" />,
  bench: <><path d="M4 4h16v6H4zM2 13h20v4H2zM5 10v3m14-3v3M5 17v4m14-4v4" /></>,
  bottle: <path d="M10 2h4v4l2 4v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10l2-4Z" />,
  walk: <><circle cx="14" cy="4" r="2" /><path d="m7 21 4-7 3 3v4M9 12l2-5 4 1 2 4h3M4 12l4-2m3-3 1 7" /></>,
  bed: <><path d="M3 5v16m18-9v9M3 17h18M3 12h15a3 3 0 0 1 3 3v2H3z" /><path d="M6 9h5v3H6z" /></>,
  station: <><rect x="5" y="2" width="14" height="16" rx="3" /><path d="M5 7h14m-9-5v5m4-5v5M8 21l2-3m6 3-2-3M8 13h1m6 0h1" /></>,
  headphones: <><path d="M4 14v-3a8 8 0 0 1 16 0v3" /><rect x="3" y="12" width="4" height="8" rx="2" /><rect x="17" y="12" width="4" height="8" rx="2" /></>,
  work: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V3h8v4M3 13a24 24 0 0 0 18 0m-9 0v3" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 8.5a2.5 2.5 0 1 1 4 2c-1.5 1-1.5 1-1.5 3M12 17h.01" /></>,
  hospital: <><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z" /></>,
  shop: <><path d="M3 10 5 3h14l2 7M4 10v11h16V10M9 21v-7h6v7" /><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /></>,
  pause: <><circle cx="12" cy="12" r="9" /><path d="M9 8v8m6-8v8" /></>,
}

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>
}

export function BatteryIcon({ charge }: { charge: number }) {
  const value = Math.max(0, Math.min(100, charge))
  return <svg className="battery-icon" viewBox="0 0 28 16" aria-hidden="true" focusable="false"><rect x="1" y="2" width="23" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M26 6v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><rect x="3.5" y="4.5" width={18 * value / 100} height="7" rx=".5" fill="currentColor" /></svg>
}

export function choiceIcon(id: string): IconName {
  if (id === 'music-walk') return 'headphones'
  if (id === 'walk') return 'walk'
  if (id === 'station-route') return 'station'
  if (id === 'bottles') return 'bottle'
  if (id === 'find-bench' || id === 'bench-rest') return 'bench'
  if (id.includes('sleep') || id === 'shelter-route') return 'bed'
  if (id === 'work-route' || id === 'work-search' || id === 'beg') return 'work'
  if (id === 'help-search') return 'help'
  return 'phone'
}

export function locationIcon(id: string): IconName {
  return ({ street: 'street', station: 'station', shop: 'shop', shelter: 'bed', 'residential-shelter': 'bed', support: 'help', jobcenter: 'work', work: 'work', hospital: 'hospital' } as Record<string, IconName>)[id] ?? 'street'
}
