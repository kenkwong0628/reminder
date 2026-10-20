import type { AppSettings, IntakeAnswers, Routines } from '../types'
import { generateFromTemplate } from './templateGenerator'
import { uid } from '../today'

const SYSTEM_PROMPT = `你係一個貼地嘅粵語生活助手。根據用家嘅簡單問卷，產出一組可重複使用嘅日常 routines（唔係只得今日一次）。
必須回傳純 JSON（唔好 markdown），結構如下：
{
  "skincare": [{"name":"string","dayPart":"am"|"pm"|"any","order":0}],
  "schedule": [{"title":"string","time":"HH:mm"|null,"weekdays":[1,2,3,4,5]}],
  "fitness": [{"name":"string","weekdays":[1,3,5],"exercises":[{"name":"string","detail":"string"}],"isRest":false}],
  "meals": [{"name":"string","slot":"lunch"|"dinner","weekdays":[0]}]
}
規則：weekdays 用 0=日 … 6=六；護膚要有 AM/PM；健身要有訓練日同至少一個休息日；飲食要有 lunch + dinner 各至少 3 個；用自然粵語短句做名稱。`

export type ProposeMode = 'ai' | 'template'

export async function proposeRoutines(
  intake: IntakeAnswers,
  settings: AppSettings,
  mode: ProposeMode,
): Promise<{ routines: Routines; modeUsed: ProposeMode; note?: string }> {
  if (mode === 'template' || !settings.apiKey.trim()) {
    return {
      routines: generateFromTemplate(intake),
      modeUsed: 'template',
      note: settings.apiKey.trim()
        ? undefined
        : '未填 API key，已用本地模板產生建議。',
    }
  }

  try {
    const routines = await callOpenAICompatible(intake, settings)
    return { routines, modeUsed: 'ai' }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      routines: generateFromTemplate(intake),
      modeUsed: 'template',
      note: `AI 呼叫失敗（${message}），已改用本地模板。`,
    }
  }
}

async function callOpenAICompatible(
  intake: IntakeAnswers,
  settings: AppSettings,
): Promise<Routines> {
  const base = settings.apiBaseUrl.replace(/\/$/, '')
  const userContent = JSON.stringify(intake, null, 2)

  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: settings.model || 'gpt-4o-mini',
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `根據呢份問卷產出 routines JSON：\n${userContent}`,
        },
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${text.slice(0, 120)}`)
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('空回應')

  const parsed = JSON.parse(content) as Partial<Routines>
  return normalizeRoutines(parsed)
}

function normalizeRoutines(raw: Partial<Routines>): Routines {
  return {
    skincare: (raw.skincare ?? []).map((s, i) => ({
      id: uid('skin'),
      name: s.name || `步驟 ${i + 1}`,
      dayPart: s.dayPart === 'pm' || s.dayPart === 'any' ? s.dayPart : 'am',
      weekdays: s.weekdays,
      order: typeof s.order === 'number' ? s.order : i,
    })),
    schedule: (raw.schedule ?? []).map((s) => ({
      id: uid('sch'),
      title: s.title || '行程',
      time: s.time || undefined,
      weekdays: s.weekdays,
      date: s.date,
    })),
    fitness: (raw.fitness ?? []).map((f) => ({
      id: uid('fit'),
      name: f.name || '訓練',
      weekdays: f.weekdays?.length ? f.weekdays : [1, 3, 5],
      isRest: Boolean(f.isRest),
      exercises: (f.exercises ?? []).map((e) => ({
        id: uid('ex'),
        name: e.name || '動作',
        detail: e.detail,
      })),
    })),
    meals: (raw.meals ?? []).map((m) => ({
      id: uid('meal'),
      name: m.name || '餐',
      slot: m.slot === 'dinner' ? 'dinner' : 'lunch',
      weekdays: m.weekdays,
    })),
  }
}
