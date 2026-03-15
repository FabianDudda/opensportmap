import { OpeningHours } from '@/lib/supabase/types'

export const DAY_ORDER = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const
export type DayKey = typeof DAY_ORDER[number]

export const DAY_SHORT_DE: Record<DayKey, string> = {
  monday: 'Mo', tuesday: 'Di', wednesday: 'Mi', thursday: 'Do',
  friday: 'Fr', saturday: 'Sa', sunday: 'So',
}

export const DAY_LONG_DE: Record<DayKey, string> = {
  monday: 'Montag', tuesday: 'Dienstag', wednesday: 'Mittwoch', thursday: 'Donnerstag',
  friday: 'Freitag', saturday: 'Samstag', sunday: 'Sonntag',
}

function getNowInBerlin(): { dayKey: DayKey; timeStr: string } {
  try {
    const now = new Date()
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Berlin',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now)
    const weekday = parts.find(p => p.type === 'weekday')?.value.toLowerCase() as DayKey
    const hour = (parts.find(p => p.type === 'hour')?.value ?? '00').padStart(2, '0')
    const minute = (parts.find(p => p.type === 'minute')?.value ?? '00').padStart(2, '0')
    return { dayKey: weekday, timeStr: `${hour}:${minute}` }
  } catch {
    const now = new Date()
    const days: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return {
      dayKey: days[now.getDay()],
      timeStr: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    }
  }
}

export function getCurrentDayKey(): DayKey {
  return getNowInBerlin().dayKey
}

function findNextOpen(
  hours: OpeningHours,
  fromDayIdx: number,
): { dayKey: DayKey; openTime: string } | null {
  for (let i = 1; i <= 7; i++) {
    const key = DAY_ORDER[(fromDayIdx + i) % 7]
    const day = hours[key]
    if (day && !day.closed && day.open) return { dayKey: key, openTime: day.open }
  }
  return null
}

export interface OpeningStatus {
  isOpen: boolean
  isUnknown: boolean
  statusText: string
}

export function getOpeningStatus(hours: OpeningHours): OpeningStatus {
  const { dayKey, timeStr } = getNowInBerlin()
  const todayIdx = DAY_ORDER.indexOf(dayKey)
  const today = hours[dayKey]

  // No entry for today = unknown, not "closed"
  if (today === undefined) {
    return { isOpen: false, isUnknown: true, statusText: 'Öffnungszeiten unvollständig' }
  }

  // Explicitly closed today
  if (today.closed || !today.open || !today.close) {
    const next = findNextOpen(hours, todayIdx)
    if (next) {
      return { isOpen: false, isUnknown: false, statusText: `Jetzt geschlossen · Öffnet ${DAY_SHORT_DE[next.dayKey]} um ${next.openTime} Uhr` }
    }
    return { isOpen: false, isUnknown: false, statusText: 'Jetzt geschlossen' }
  }

  if (timeStr >= today.open && timeStr < today.close) {
    return { isOpen: true, isUnknown: false, statusText: `Jetzt geöffnet · Schließt um ${today.close} Uhr` }
  } else if (timeStr < today.open) {
    return { isOpen: false, isUnknown: false, statusText: `Jetzt geschlossen · Öffnet um ${today.open} Uhr` }
  } else {
    const next = findNextOpen(hours, todayIdx)
    if (next) {
      return { isOpen: false, isUnknown: false, statusText: `Jetzt geschlossen · Öffnet ${DAY_SHORT_DE[next.dayKey]} um ${next.openTime} Uhr` }
    }
    return { isOpen: false, isUnknown: false, statusText: 'Jetzt geschlossen' }
  }
}
