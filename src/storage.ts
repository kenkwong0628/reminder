import {
  type AppSettings,
  type AppState,
  type DailyCompletion,
  type Routines,
  defaultAppState,
  defaultSettings,
} from './types'

const STORAGE_KEY = 'reminder.app.v1'

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultAppState()
    const parsed = JSON.parse(raw) as Partial<AppState>
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
