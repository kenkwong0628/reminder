import type {
  AppState,
  CategoryCheckIns,
  CheckInCategory,
} from './types'
import { CHECK_IN_CATEGORIES } from './types'
import { getOrCreateCompletion, todayKey } from './storage'
import {
  fitnessForToday,
  mealForToday,
  scheduleForToday,
  skincareForToday,
} from './today'

/** Checklist item ids that count toward one category. */
export function categoryChecklistIds(
  state: Pick<AppState, 'routines' | 'completions'>,
  category: CheckInCategory,
  date = todayKey(),
  d = new Date(),
): string[] {
  const { routines } = state
  const completion = getOrCreateCompletion(state.completions, date)

  switch (category) {
    case 'skincare': {
      const skin = skincareForToday(routines.skincare, d)
      return [
        ...skin.am.map((s) => s.id),
        ...skin.pm.map((s) => s.id),
        ...skin.any.map((s) => s.id),
      ]
    }
    case 'schedule':
      return scheduleForToday(routines.schedule, d).map((s) => s.id)
    case 'fitness': {
      const fitness = fitnessForToday(routines.fitness, d)
      if (!fitness || fitness.isRest) return []
      return fitness.exercises.map((ex) => ex.id)
    }
    case 'meals': {
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
      const ids: string[] = []
      if (lunch) ids.push(`meal_${lunch.id}`)
      if (dinner) ids.push(`meal_${dinner.id}`)
      return ids
    }
  }
}

/** True when this category’s items are done (or fitness rest day). Empty ≠ done. */
export function isCategoryItemsDone(
  state: Pick<AppState, 'routines' | 'completions'>,
  category: CheckInCategory,
  date = todayKey(),
  d = new Date(),
): boolean {
  if (category === 'fitness') {
    const fitness = fitnessForToday(state.routines.fitness, d)
    if (fitness?.isRest) return true
  }
  const ids = categoryChecklistIds(state, category, date, d)
  if (ids.length === 0) return false
  const checked = getOrCreateCompletion(state.completions, date).checked
  return ids.every((id) => Boolean(checked[id]))
}

export function categoriesForDate(
  checkIns: CategoryCheckIns,
  date: string,
): CheckInCategory[] {
  return checkIns[date] ?? []
}

export function hasCategory(
  checkIns: CategoryCheckIns,
  date: string,
  category: CheckInCategory,
): boolean {
  return categoriesForDate(checkIns, date).includes(category)
}

export function withCategory(
  checkIns: CategoryCheckIns,
  date: string,
  category: CheckInCategory,
): CategoryCheckIns {
  const current = categoriesForDate(checkIns, date)
  if (current.includes(category)) return checkIns
  return {
    ...checkIns,
    [date]: [...current, category],
  }
}

export function withoutCategory(
  checkIns: CategoryCheckIns,
  date: string,
  category: CheckInCategory,
): CategoryCheckIns {
  const current = categoriesForDate(checkIns, date)
  if (!current.includes(category)) return checkIns
  const next = current.filter((c) => c !== category)
  if (next.length === 0) {
    const rest = { ...checkIns }
    delete rest[date]
    return rest
  }
  return { ...checkIns, [date]: next }
}

export function toggleCategory(
  checkIns: CategoryCheckIns,
  date: string,
  category: CheckInCategory,
): CategoryCheckIns {
  return hasCategory(checkIns, date, category)
    ? withoutCategory(checkIns, date, category)
    : withCategory(checkIns, date, category)
}

/** Mark every category whose checklist is already complete (does not unmark). */
export function withAutoCategoryMarks(
  state: AppState,
  date = todayKey(),
  d = new Date(),
): CategoryCheckIns {
  let next = state.checkIns
  for (const cat of CHECK_IN_CATEGORIES) {
    if (hasCategory(next, date, cat)) continue
    if (isCategoryItemsDone(state, cat, date, d)) {
      next = withCategory(next, date, cat)
    }
  }
  return next
}

/** 「跟到目標」= all four categories marked that day. */
export function isFullDay(
  checkIns: CategoryCheckIns,
  date: string,
): boolean {
  const set = new Set(categoriesForDate(checkIns, date))
  return CHECK_IN_CATEGORIES.every((c) => set.has(c))
}

export function fullDayDates(checkIns: CategoryCheckIns): string[] {
  return Object.keys(checkIns)
    .filter((date) => isFullDay(checkIns, date))
    .sort()
}

export function datesWithCategory(
  checkIns: CategoryCheckIns,
  category: CheckInCategory,
): string[] {
  return Object.keys(checkIns)
    .filter((date) => hasCategory(checkIns, date, category))
    .sort()
}

/** Consecutive days ending at `endDate` (inclusive). */
export function currentStreak(
  dates: string[],
  endDate = todayKey(),
): number {
  const set = new Set(dates)
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

/** Main streak: consecutive full days (all four categories). */
export function goalStreak(
  checkIns: CategoryCheckIns,
  endDate = todayKey(),
): number {
  return currentStreak(fullDayDates(checkIns), endDate)
}

export function categoryStreak(
  checkIns: CategoryCheckIns,
  category: CheckInCategory,
  endDate = todayKey(),
): number {
  return currentStreak(datesWithCategory(checkIns, category), endDate)
}

export function monthFullDayCount(
  checkIns: CategoryCheckIns,
  year: number,
  monthIndex: number,
): number {
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}-`
  return Object.keys(checkIns).filter(
    (d) => d.startsWith(prefix) && isFullDay(checkIns, d),
  ).length
}

/** Days in month with at least one category marked. */
export function monthAnyCheckInCount(
  checkIns: CategoryCheckIns,
  year: number,
  monthIndex: number,
): number {
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}-`
  return Object.keys(checkIns).filter(
    (d) => d.startsWith(prefix) && categoriesForDate(checkIns, d).length > 0,
  ).length
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
