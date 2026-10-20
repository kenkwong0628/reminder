import type {
  FitnessPlan,
  MealIdea,
  ScheduleItem,
  SkincareStep,
  Weekday,
} from './types'

export function weekdayOf(d = new Date()): Weekday {
  return d.getDay() as Weekday
}

function matchesWeekdays(
  weekdays: Weekday[] | undefined,
  today: Weekday,
): boolean {
  if (!weekdays || weekdays.length === 0) return true
  return weekdays.includes(today)
}

export function skincareForToday(
  steps: SkincareStep[],
  d = new Date(),
): { am: SkincareStep[]; pm: SkincareStep[]; any: SkincareStep[] } {
  const wd = weekdayOf(d)
  const active = steps
    .filter((s) => matchesWeekdays(s.weekdays, wd))
    .sort((a, b) => a.order - b.order)

  return {
    am: active.filter((s) => s.dayPart === 'am'),
    pm: active.filter((s) => s.dayPart === 'pm'),
    any: active.filter((s) => s.dayPart === 'any'),
  }
}

export function scheduleForToday(
  items: ScheduleItem[],
  d = new Date(),
): ScheduleItem[] {
  const wd = weekdayOf(d)
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return items
    .filter((item) => {
      if (item.date) return item.date === key
      return matchesWeekdays(item.weekdays, wd)
    })
    .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'))
}

export function fitnessForToday(
  plans: FitnessPlan[],
  d = new Date(),
): FitnessPlan | null {
  const wd = weekdayOf(d)
  const match = plans.find((p) => p.weekdays.includes(wd))
  return match ?? null
}

export function mealForToday(
  meals: MealIdea[],
  slot: 'lunch' | 'dinner',
  d = new Date(),
  overrideId?: string,
): MealIdea | null {
  const pool = meals.filter((m) => m.slot === slot)
  if (pool.length === 0) return null
  if (overrideId) {
    const found = pool.find((m) => m.id === overrideId)
    if (found) return found
  }
  const wd = weekdayOf(d)
  const weekdayHits = pool.filter((m) => matchesWeekdays(m.weekdays, wd))
  const candidates = weekdayHits.length > 0 ? weekdayHits : pool
  // Stable weekday rotation when enough items
  const index = wd % candidates.length
  return candidates[index] ?? null
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

export function formatCantoneseDate(d = new Date()): string {
  const m = d.getMonth() + 1
  const day = d.getDate()
  const wd = WEEKDAY_LABELS[d.getDay()]
  return `${m}月${day}日（星期${wd}）`
}

export function greetingForHour(h = new Date().getHours()): string {
  if (h < 12) return '早晨'
  if (h < 18) return '午安'
  return '晚上好'
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}
