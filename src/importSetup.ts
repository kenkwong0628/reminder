import type { IntakeAnswers, Routines, Weekday } from './types'
import { defaultIntake } from './types'
import { uid } from './today'

/** Chat / paste import payload. Stored app state key remains `reminder.app.v1`. */
export interface ImportPayload {
  version?: number
  intake?: Partial<IntakeAnswers> | null
  routines: Routines
}

export type ImportResult =
  | { ok: true; intake: IntakeAnswers; routines: Routines }
  | { ok: false; error: string }

const WEEKDAYS = new Set([0, 1, 2, 3, 4, 5, 6])

export function stripCodeFence(raw: string): string {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fenced ? fenced[1].trim() : trimmed
}

export function normalizeRoutines(raw: Partial<Routines>): Routines {
  return {
    skincare: (raw.skincare ?? []).map((s, i) => ({
      id: typeof s.id === 'string' && s.id ? s.id : uid('skin'),
      name: s.name || `步驟 ${i + 1}`,
      dayPart: s.dayPart === 'pm' || s.dayPart === 'any' ? s.dayPart : 'am',
      weekdays: sanitizeWeekdays(s.weekdays),
      everyNDays:
        typeof s.everyNDays === 'number' && s.everyNDays > 0
          ? s.everyNDays
          : undefined,
      order: typeof s.order === 'number' ? s.order : i,
    })),
    schedule: (raw.schedule ?? []).map((s) => ({
      id: typeof s.id === 'string' && s.id ? s.id : uid('sch'),
      title: s.title || '行程',
      time: typeof s.time === 'string' && s.time ? s.time : undefined,
      weekdays: sanitizeWeekdays(s.weekdays),
      date: typeof s.date === 'string' && s.date ? s.date : undefined,
    })),
    fitness: (raw.fitness ?? []).map((f) => ({
      id: typeof f.id === 'string' && f.id ? f.id : uid('fit'),
      name: f.name || '訓練',
      weekdays: sanitizeWeekdays(f.weekdays)?.length
        ? (sanitizeWeekdays(f.weekdays) as Weekday[])
        : ([1, 3, 5] as Weekday[]),
      isRest: Boolean(f.isRest),
      exercises: (f.exercises ?? []).map((e) => ({
        id: typeof e.id === 'string' && e.id ? e.id : uid('ex'),
        name: e.name || '動作',
        detail: typeof e.detail === 'string' ? e.detail : undefined,
      })),
    })),
    meals: (raw.meals ?? []).map((m) => ({
      id: typeof m.id === 'string' && m.id ? m.id : uid('meal'),
      name: m.name || '餐',
      slot: m.slot === 'dinner' ? 'dinner' : 'lunch',
      weekdays: sanitizeWeekdays(m.weekdays),
    })),
  }
}

function sanitizeWeekdays(raw: unknown): Weekday[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const days = raw
    .map((d) => (typeof d === 'number' ? d : Number(d)))
    .filter((d): d is Weekday => WEEKDAYS.has(d))
  return days.length ? days : undefined
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function coerceIntake(raw: unknown): IntakeAnswers {
  const base = defaultIntake()
  if (!isObject(raw)) return base
  const pick = (key: keyof IntakeAnswers) =>
    typeof raw[key] === 'string' ? (raw[key] as string) : base[key]
  return {
    skinGoals: pick('skinGoals'),
    productsOnHand: pick('productsOnHand'),
    scheduleNotes: pick('scheduleNotes'),
    fitnessGoals: pick('fitnessGoals'),
    fitnessDays: pick('fitnessDays'),
    mealPrefs: pick('mealPrefs'),
    cookingHabit: pick('cookingHabit'),
  }
}

/** Accept wrapped `{ version, intake, routines }` or bare `routines` object. */
export function parseImportJson(rawText: string): ImportResult {
  const text = stripCodeFence(rawText)
  if (!text) return { ok: false, error: '未見任何 JSON 內容。' }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'JSON 解唔開 — 請檢查有冇漏逗號／引號。' }
  }

  if (!isObject(parsed)) {
    return { ok: false, error: '匯入內容要係一個 JSON object。' }
  }

  const hasRoutinesKey = 'routines' in parsed
  const routinesRaw = hasRoutinesKey ? parsed.routines : parsed

  if (!isObject(routinesRaw)) {
    return { ok: false, error: '缺少 routines object。' }
  }

  const looksLikeRoutines =
    'skincare' in routinesRaw ||
    'schedule' in routinesRaw ||
    'fitness' in routinesRaw ||
    'meals' in routinesRaw

  if (!looksLikeRoutines) {
    return {
      ok: false,
      error: '唔似 Reminder setup JSON（要有 skincare／schedule／fitness／meals）。',
    }
  }

  if (hasRoutinesKey && parsed.version != null && typeof parsed.version !== 'number') {
    return { ok: false, error: 'version 要係數字（而家用 1）。' }
  }

  const routines = normalizeRoutines(routinesRaw as Partial<Routines>)
  const total =
    routines.skincare.length +
    routines.schedule.length +
    routines.fitness.length +
    routines.meals.length

  if (total === 0) {
    return { ok: false, error: 'routines 全部係空 — 冇嘢可以匯入。' }
  }

  const intake = coerceIntake(hasRoutinesKey ? parsed.intake : undefined)
  return { ok: true, intake, routines }
}

/** Decode `?import=` value: URI-encoded JSON, or base64 / base64url JSON. */
export function decodeImportParam(param: string): ImportResult {
  const value = param.trim()
  if (!value) return { ok: false, error: 'import 參數係空。' }

  const attempts: string[] = []

  try {
    attempts.push(decodeURIComponent(value))
  } catch {
    attempts.push(value)
  }

  const b64 = tryDecodeBase64(value)
  if (b64) attempts.push(b64)

  let last: ImportResult = { ok: false, error: '解唔開 import 參數。' }
  for (const candidate of attempts) {
    last = parseImportJson(candidate)
    if (last.ok) return last
  }
  return last
}

function tryDecodeBase64(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
    const binary = atob(normalized + pad)
    // Prefer UTF-8 when available
    if (typeof TextDecoder !== 'undefined') {
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
      return new TextDecoder().decode(bytes)
    }
    return binary
  } catch {
    return null
  }
}
