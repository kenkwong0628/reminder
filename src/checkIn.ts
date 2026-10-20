import type { AppState } from './types'
import { getOrCreateCompletion, todayKey } from './storage'
import {
  fitnessForToday,
  mealForToday,
  scheduleForToday,
  skincareForToday,
} from './today'

/** Collect checklist item ids that count toward「今日做晒」. */
export function todayChecklistIds(
  state: Pick<AppState, 'routines' | 'completions'>,
  date = todayKey(),
  d = new Date(),
): string[] {
  const { routines } = state
  const completion = getOrCreateCompletion(state.completions, date)
  const skin = skincareForToday(routines.skincare, d)
  const schedule = scheduleForToday(routines.schedule, d)
  const fitness = fitnessForToday(routines.fitness, d)
  const lunch = mealForToday(
    routines.meals,
    'lunch',
    d,
    completion.mealOverrides?.lunchId,
  )
  const dinner = mealForToday(
    routines.meals,
    'dinner',
    d,
    completion.mealOverrides?.dinnerId,
  )

  const ids: string[] = [
    ...skin.am.map((s) => s.id),
    ...skin.pm.map((s) => s.id),
    ...skin.any.map((s) => s.id),
    ...schedule.map((s) => s.id),
  ]

  if (fitness && !fitness.isRest) {
    ids.push(...fitness.exercises.map((ex) => ex.id))
  }

  if (lunch) ids.push(`meal_${lunch.id}`)
  if (dinner) ids.push(`meal_${dinner.id}`)

  return ids
}

export function isDayFullyChecked(
  state: AppState,
  date = todayKey(),
  d = new Date(),
): boolean {
  const ids = todayChecklistIds(state, date, d)
  if (ids.length === 0) return false
  const checked = getOrCreateCompletion(state.completions, date).checked
  return ids.every((id) => Boolean(checked[id]))
}

export function hasCheckIn(checkIns: string[], date: string): boolean {
  return checkIns.includes(date)
}

export function withCheckIn(checkIns: string[], date: string): string[] {
  if (checkIns.includes(date)) return checkIns
  return [...checkIns, date].sort()
}

export function withoutCheckIn(checkIns: string[], date: string): string[] {
  return checkIns.filter((d) => d !== date)
}

/** Consecutive days ending at `endDate` (inclusive). */
export function currentStreak(
  checkIns: string[],
  endDate = todayKey(),
): number {
  const set = new Set(checkIns)
  let streak = 0
  const cursor = parseDateKey(endDate)
  while (true) {
    const key = formatDateKey(cursor)
    if (!set.has(key)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function monthCheckInCount(
  checkIns: string[],
  year: number,
  monthIndex: number,
): number {
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}-`
  return checkIns.filter((d) => d.startsWith(prefix)).length
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}
