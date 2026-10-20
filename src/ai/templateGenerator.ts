import type { IntakeAnswers, Routines, Weekday } from '../types'
import { uid } from '../today'

/** Offline fallback: build sensible Cantonese routines from intake text. */
export function generateFromTemplate(intake: IntakeAnswers): Routines {
  const products = splitList(intake.productsOnHand)
  const skinGoals = intake.skinGoals.trim() || '保濕、穩定膚況'

  const skincare =
    products.length > 0
      ? [
          ...products.slice(0, 4).map((name, i) => ({
            id: uid('skin'),
            name,
            dayPart: (i % 2 === 0 ? 'am' : 'pm') as 'am' | 'pm',
            order: i,
          })),
          {
            id: uid('skin'),
            name: `防曬（${skinGoals}）`,
            dayPart: 'am' as const,
            order: products.length,
          },
        ]
      : [
          { id: uid('skin'), name: '洗面', dayPart: 'am' as const, order: 0 },
          { id: uid('skin'), name: '精華／精華油', dayPart: 'am' as const, order: 1 },
          { id: uid('skin'), name: '保濕面霜', dayPart: 'am' as const, order: 2 },
          { id: uid('skin'), name: '防曬', dayPart: 'am' as const, order: 3 },
          { id: uid('skin'), name: '卸妝／洗面', dayPart: 'pm' as const, order: 4 },
          { id: uid('skin'), name: '精華', dayPart: 'pm' as const, order: 5 },
          { id: uid('skin'), name: '面霜／晚霜', dayPart: 'pm' as const, order: 6 },
        ]

  const scheduleNotes = splitList(intake.scheduleNotes)
  const schedule =
    scheduleNotes.length > 0
      ? scheduleNotes.map((title, i) => ({
          id: uid('sch'),
          title,
          time: i === 0 ? '09:30' : i === 1 ? '14:00' : undefined,
          weekdays: [1, 2, 3, 4, 5] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[],
        }))
      : [
          {
            id: uid('sch'),
            title: '睇消息／整理今日優先',
            time: '09:00',
            weekdays: [1, 2, 3, 4, 5] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[],
          },
          {
            id: uid('sch'),
            title: '散步／放空十分鐘',
            time: '18:30',
            weekdays: [0, 1, 2, 3, 4, 5, 6] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[],
          },
        ]

  const fitnessDays = parseFitnessDays(intake.fitnessDays)
  const goal = intake.fitnessGoals.trim() || '全身活動'
  const workoutDays: Weekday[] =
    fitnessDays.length > 0 ? fitnessDays : [1, 3, 5]
  const allDays: Weekday[] = [0, 1, 2, 3, 4, 5, 6]
  const restDays = allDays.filter((d) => !workoutDays.includes(d))

  const fitness = [
    {
      id: uid('fit'),
      name: `訓練日・${goal}`,
      weekdays: [...workoutDays],
      exercises: [
        { id: uid('ex'), name: '熱身 5 分鐘', detail: '輕鬆伸展／行路' },
        { id: uid('ex'), name: '主項動作', detail: goal },
        { id: uid('ex'), name: '收操伸展', detail: '2–3 分鐘' },
      ],
    },
    ...(restDays.length
      ? [
          {
            id: uid('fit'),
            name: '休息日',
            weekdays: [...restDays],
            exercises: [],
            isRest: true,
          },
        ]
      : []),
  ]

  const mealPrefs = splitList(intake.mealPrefs)
  const cook = intake.cookingHabit.trim() || '簡單家常'
  const lunchBase =
    mealPrefs.length > 0
      ? mealPrefs
      : ['牛肉飯', '刺身定食', '意粉', '沙律碗', '雲吞麵']
  const dinnerBase =
    mealPrefs.length > 1
      ? [...mealPrefs].reverse()
      : ['蒸魚＋菜', '番茄炒蛋飯', '咖喱雞', '火鍋／一人鍋', cook]

  const meals = [
    ...lunchBase.slice(0, 5).map((name, i) => ({
      id: uid('meal'),
      name,
      slot: 'lunch' as const,
      weekdays: [i % 7] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[],
    })),
    ...dinnerBase.slice(0, 5).map((name, i) => ({
      id: uid('meal'),
      name,
      slot: 'dinner' as const,
      weekdays: [i % 7] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[],
    })),
  ]

  return { skincare, schedule, fitness, meals }
}

function splitList(raw: string): string[] {
  return raw
    .split(/[,，、\n;/|]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseFitnessDays(raw: string): (0 | 1 | 2 | 3 | 4 | 5 | 6)[] {
  const map: Record<string, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
    日: 0,
    天: 0,
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  }
  const found = new Set<0 | 1 | 2 | 3 | 4 | 5 | 6>()
  const lower = raw.toLowerCase()
  for (const [key, val] of Object.entries(map)) {
    if (lower.includes(key)) found.add(val)
  }
  return [...found].sort()
}
