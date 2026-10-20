export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6 // Sun–Sat

export type DayPart = 'am' | 'pm' | 'any'

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
})
