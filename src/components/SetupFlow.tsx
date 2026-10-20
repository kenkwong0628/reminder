import { useState } from 'react'
import type { AppSettings, IntakeAnswers, Routines } from '../types'
import { defaultIntake } from '../types'
import { proposeRoutines, type ProposeMode } from '../ai/proposeRoutines'
import { ImportPaste } from './ImportPaste'

interface Props {
  settings: AppSettings
  initialIntake?: IntakeAnswers | null
  onComplete: (intake: IntakeAnswers, routines: Routines) => void
  onCancel?: () => void
}

type Step = 'intake' | 'generating' | 'review'

export function SetupFlow({
  settings,
  initialIntake,
  onComplete,
  onCancel,
}: Props) {
  const [step, setStep] = useState<Step>('intake')
  const [intake, setIntake] = useState<IntakeAnswers>(
    initialIntake ?? defaultIntake(),
  )
  const [mode, setMode] = useState<ProposeMode>(
    settings.apiKey.trim() ? 'ai' : 'template',
  )
  const [routines, setRoutines] = useState<Routines | null>(null)
  const [note, setNote] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)

  function updateField<K extends keyof IntakeAnswers>(
    key: K,
    value: IntakeAnswers[K],
  ) {
    setIntake((prev) => ({ ...prev, [key]: value }))
  }

  async function runGenerate() {
    setError(null)
    setStep('generating')
    try {
      const result = await proposeRoutines(intake, settings, mode)
      setRoutines(result.routines)
      setNote(result.note)
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStep('intake')
    }
  }

  if (step === 'generating') {
    return (
      <div className="page setup-page">
        <p className="brand">Reminder</p>
        <h1>產生緊你嘅 routines…</h1>
        <p className="muted">稍等陣，搞掂就畀你睇建議。</p>
        <div className="pulse-bar" aria-hidden />
      </div>
    )
  }

  if (step === 'review' && routines) {
    return (
      <div className="page setup-page">
        <p className="brand">Reminder</p>
        <h1>睇下啱唔啱</h1>
        <p className="muted">接受就可以開始用；之後隨時改。</p>
        {note ? <p className="banner">{note}</p> : null}

        <ReviewBlock title="護膚" items={routines.skincare.map((s) => `${s.dayPart === 'pm' ? '夜' : s.dayPart === 'am' ? '朝' : ''} ${s.name}`)} />
        <ReviewBlock title="行程" items={routines.schedule.map((s) => `${s.time ? s.time + ' ' : ''}${s.title}`)} />
        <ReviewBlock
          title="健身"
          items={routines.fitness.map(
            (f) =>
              `${f.name}${f.isRest ? '（休息）' : ` · ${f.exercises.length} 個動作`}`,
          )}
        />
        <ReviewBlock
          title="飲食"
          items={routines.meals.map(
            (m) => `${m.slot === 'lunch' ? '午' : '晚'}：${m.name}`,
          )}
        />

        <div className="actions">
          <button type="button" className="primary" onClick={() => onComplete(intake, routines)}>
            接受，開始用
          </button>
          <button type="button" className="ghost" onClick={() => setStep('intake')}>
            返去改問卷
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page setup-page">
      <p className="brand">Reminder</p>
      <h1>第一次設定</h1>
      <p className="lede">
        答幾條就得 — AI（或者本地模板）會幫你砌好護膚、行程、健身、飲食 routines。
        如果你喺 chat 已經砌好 JSON，可以直接「貼上匯入」。
      </p>

      <div className="import-entry">
        <ImportPaste onImported={onComplete} />
      </div>

      <label className="field">
        <span>皮膚想點？（例如保濕、去痘）</span>
        <textarea
          value={intake.skinGoals}
          onChange={(e) => updateField('skinGoals', e.target.value)}
          rows={2}
          placeholder="想穩定膚況、朝早有防曬"
        />
      </label>
      <label className="field">
        <span>而家手上有咩產品？</span>
        <textarea
          value={intake.productsOnHand}
          onChange={(e) => updateField('productsOnHand', e.target.value)}
          rows={2}
          placeholder="洗面、精華、面霜…"
        />
      </label>
      <label className="field">
        <span>一週典型行程／固定事項</span>
        <textarea
          value={intake.scheduleNotes}
          onChange={(e) => updateField('scheduleNotes', e.target.value)}
          rows={2}
          placeholder="返工、上堂、約人…"
        />
      </label>
      <label className="field">
        <span>健身目標</span>
        <textarea
          value={intake.fitnessGoals}
          onChange={(e) => updateField('fitnessGoals', e.target.value)}
          rows={2}
          placeholder="增肌、減脂、保持活動"
        />
      </label>
      <label className="field">
        <span>邊幾日練？（一／三／五…）</span>
        <input
          value={intake.fitnessDays}
          onChange={(e) => updateField('fitnessDays', e.target.value)}
          placeholder="一、三、五"
        />
      </label>
      <label className="field">
        <span>飲食喜好／忌口</span>
        <textarea
          value={intake.mealPrefs}
          onChange={(e) => updateField('mealPrefs', e.target.value)}
          rows={2}
          placeholder="少油、鍾意粉麵、唔食辣"
        />
      </label>
      <label className="field">
        <span>煮食習慣</span>
        <input
          value={intake.cookingHabit}
          onChange={(e) => updateField('cookingHabit', e.target.value)}
          placeholder="簡單家常／外食為主"
        />
      </label>

      <fieldset className="mode-pick">
        <legend>點樣產生建議</legend>
        <label>
          <input
            type="radio"
            name="mode"
            checked={mode === 'template'}
            onChange={() => setMode('template')}
          />
          本地模板（唔使 API key）
        </label>
        <label>
          <input
            type="radio"
            name="mode"
            checked={mode === 'ai'}
            onChange={() => setMode('ai')}
          />
          AI（用設定入面嘅 API key，client-side）
        </label>
      </fieldset>

      {error ? <p className="error">{error}</p> : null}

      <div className="actions">
        <button type="button" className="primary" onClick={runGenerate}>
          產生建議
        </button>
        {onCancel ? (
          <button type="button" className="ghost" onClick={onCancel}>
            取消
          </button>
        ) : null}
      </div>
    </div>
  )
}

function ReviewBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="review-block">
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p className="muted">（空）</p>
      ) : (
        <ul>
          {items.map((item, i) => (
            <li key={`${title}-${i}`}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
