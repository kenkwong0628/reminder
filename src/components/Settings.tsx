import { useState } from 'react'
import type { AppSettings, IntakeAnswers, Routines, View } from '../types'
import { ImportPaste } from './ImportPaste'

interface Props {
  settings: AppSettings
  onSave: (settings: AppSettings) => void
  onNavigate: (view: View) => void
  onClearAll: () => void
  onRerunSetup: () => void
  onImportSetup: (intake: IntakeAnswers, routines: Routines) => void
}

export function Settings({
  settings: initial,
  onSave,
  onNavigate,
  onClearAll,
  onRerunSetup,
  onImportSetup,
}: Props) {
  const [settings, setSettings] = useState<AppSettings>({ ...initial })
  const [saved, setSaved] = useState(false)

  function save() {
    onSave(settings)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="page settings-page">
      <header className="sub-header">
        <button type="button" className="ghost" onClick={() => onNavigate('home')}>
          ← 返今日
        </button>
        <h1>設定</h1>
      </header>

      <p className="lede">
        AI 設定只喺瀏覽器本地儲存。每日 checklist 唔會 call AI — 只靠已儲存嘅 routines。
      </p>

      <label className="field">
        <span>API key（OpenAI-compatible）</span>
        <input
          type="password"
          autoComplete="off"
          value={settings.apiKey}
          onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value }))}
          placeholder="sk-…"
        />
      </label>
      <label className="field">
        <span>API base URL</span>
        <input
          value={settings.apiBaseUrl}
          onChange={(e) =>
            setSettings((s) => ({ ...s, apiBaseUrl: e.target.value }))
          }
          placeholder="https://api.openai.com/v1"
        />
      </label>
      <label className="field">
        <span>Model</span>
        <input
          value={settings.model}
          onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))}
          placeholder="gpt-4o-mini"
        />
      </label>

      <div className="actions">
        <button type="button" className="primary" onClick={save}>
          {saved ? '已儲存' : '儲存設定'}
        </button>
        <button type="button" className="ghost" onClick={onRerunSetup}>
          重新第一次設定
        </button>
        <button
          type="button"
          className="danger-text"
          onClick={() => {
            if (window.confirm('確定清晒所有本地資料？')) onClearAll()
          }}
        >
          清除全部本地資料
        </button>
      </div>

      <ImportPaste
        compact
        onImported={(intake, routines) => {
          if (
            window.confirm(
              '匯入會覆寫而家嘅 routines 同問卷答案，並標記第一次設定完成。繼續？',
            )
          ) {
            onImportSetup(intake, routines)
          }
        }}
      />

      <aside className="help-box">
        <h2>AI 點用</h2>
        <ul>
          <li>API key 只存 localStorage，唔會上傳到 Reminder 伺服器（呢個 app 係純靜態站）。</li>
          <li>第一次設定可以揀「本地模板」完全唔使 key；或者「貼上匯入」chat JSON。</li>
          <li>用 AI 時會由你部瀏覽器直接打去你填嘅 API；注意 CORS／供應商限制。</li>
          <li>MVP 冇 push 通知。</li>
        </ul>
      </aside>
    </div>
  )
}
