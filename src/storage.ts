import {
  CHECK_IN_CATEGORIES,
  type AppSettings,
  type AppState,
  type CategoryCheckIns,
  type CheckInCategory,
  type DailyCompletion,
  type Routines,
  defaultAppState,
  defaultSettings,
} from './types'

const STORAGE_KEY = 'reminder.app.v1'
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/

function isCategory(value: unknown): value is CheckInCategory {
  return (
    typeof value === 'string' &&
    (CHECK_IN_CATEGORIES as readonly string[]).includes(value)
  )
}

/** Migrate legacy `checkIns: string[]` (whole-day) → per-category map. */
export function migrateCheckIns(raw: unknown): CategoryCheckIns {
  if (raw == null) return {}

  // Legacy: whole-day dates → mark all four categories
  if (Array.isArray(raw)) {
    const out: CategoryCheckIns = {}
    for (const entry of raw) {
      if (typeof entry === 'string' && DATE_KEY_RE.test(entry)) {
        out[entry] = [...CHECK_IN_CATEGORIES]
      }
    }
    return out
  }

  if (typeof raw !== 'object') return {}

  const out: CategoryCheckIns = {}
  for (const [date, cats] of Object.entries(raw as Record<string, unknown>)) {
    if (!DATE_KEY_RE.test(date) || !Array.isArray(cats)) continue
    const next = [...new Set(cats.filter(isCategory))]
    if (next.length > 0) out[date] = next
  }
  return out
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultAppState()
    const parsed = JSON.parse(raw) as Partial<AppState> & {
      checkIns?: unknown
    }
    return {
      ...defaultAppState(),
      ...parsed,
      routines: {
        ...defaultAppState().routines,
        ...(parsed.routines ?? {}),
      },
      settings: {
        ...defaultSettings(),
        ...(parsed.settings ?? {}),
      },
      completions: parsed.completions ?? {},
      checkIns: migrateCheckIns(parsed.checkIns),
    }
  } catch {
    return defaultAppState()
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getOrCreateCompletion(
  completions: Record<string, DailyCompletion>,
  date: string,
): DailyCompletion {
  return (
    completions[date] ?? {
      date,
      checked: {},
      mealOverrides: {},
    }
  )
}

export function updateSettings(
  state: AppState,
  patch: Partial<AppSettings>,
): AppState {
  return {
    ...state,
    settings: { ...state.settings, ...patch },
  }
}

export function updateRoutines(state: AppState, routines: Routines): AppState {
  return { ...state, routines }
}
