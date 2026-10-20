export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6 // Sun–Sat

export type DayPart = 'am' | 'pm' | 'any'

/** Checklist sections that can be打卡 separately */
export type CheckInCategory = 'skincare' | 'schedule' | 'fitness' | 'meals'

export const CHECK_IN_CATEGORIES: readonly CheckInCategory[] = [
  'skincare',
  'schedule',
  'fitness',
  'meals',
] as const

export const CATEGORY_LABELS: Record<CheckInCategory, string> = {
  skincare: '護膚',
  schedule: '行程',
  fitness: '健身',
  meals: '飲食',
}

/** date (YYYY-MM-DD) → which categories were勾完 that day */
export type CategoryCheckIns = Record<string, CheckInCategory[]>

export interface SkincareStep {
  id: string
  name: string
  dayPart: DayPart
  weekdays?: Weekday[] // undefined = every day
  everyNDays?: number
  order: number
}

export interface ScheduleItem {
  id: string
  title: string
  time?: string // HH:mm
  weekdays?: Weekday[]
  date?: string // YYYY-MM-DD one-off
}

export interface FitnessExercise {
  id: string
  name: string
  detail?: string
}

export interface FitnessPlan {
  id: string
  name: string
  weekdays: Weekday[]
  exercises: FitnessExercise[]
  isRest?: boolean
}

export interface MealIdea {
  id: string
  name: string
  slot: 'lunch' | 'dinner'
  weekdays?: Weekday[]
}

export interface Routines {
  skincare: SkincareStep[]
  schedule: ScheduleItem[]
  fitness: FitnessPlan[]
  meals: MealIdea[]
}

export interface IntakeAnswers {
  skinGoals: string
  productsOnHand: string
  scheduleNotes: string
  fitnessGoals: string
  fitnessDays: string
  mealPrefs: string
  cookingHabit: string
}

export interface AppSettings {
  apiKey: string
  apiBaseUrl: string
  model: string
}

export interface DailyCompletion {
  date: string // YYYY-MM-DD
  checked: Record<string, boolean>
  mealOverrides?: {
    lunchId?: string
    dinnerId?: string
  }
}

export interface AppState {
  setupComplete: boolean
  intake: IntakeAnswers | null
  routines: Routines
  settings: AppSettings
  completions: Record<string, DailyCompletion>
  /**
   * Per-category打卡 by date.
   * Legacy whole-day `string[]` is migrated on load → all four categories.
   */
  checkIns: CategoryCheckIns
}

export type View = 'home' | 'setup' | 'routines' | 'settings'

export const defaultIntake = (): IntakeAnswers => ({
  skinGoals: '',
  productsOnHand: '',
  scheduleNotes: '',
  fitnessGoals: '',
  fitnessDays: '',
  mealPrefs: '',
  cookingHabit: '',
})

export const defaultRoutines = (): Routines => ({
  skincare: [],
  schedule: [],
  fitness: [],
  meals: [],
})

export const defaultSettings = (): AppSettings => ({
  apiKey: '',
  apiBaseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
})

export const defaultAppState = (): AppState => ({
  setupComplete: false,
  intake: null,
  routines: defaultRoutines(),
  settings: defaultSettings(),
  completions: {},
  checkIns: {},
})
