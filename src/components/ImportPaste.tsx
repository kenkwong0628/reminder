import { useState } from 'react'
import type { IntakeAnswers, Routines } from '../types'
import { parseImportJson } from '../importSetup'

interface Props {
  onImported: (intake: IntakeAnswers, routines: Routines) => void
  /** Compact mode for settings page */
  compact?: boolean
}

export function ImportPaste({ onImported, compact }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  function runImport() {
    const result = parseImportJson(text)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    onImported(result.intake, result.routines)
  }

  if (!open) {
    return (
      <button
        type="button"
        className={compact ? 'ghost' : 'ghost import-toggle'}
        onClick={() => setOpen(true)}
      >
        貼上匯入
      </button>
    )
  }

  return (
    <section className="import-panel">
      <h2>{compact ? '匯入設定 JSON' : '貼上匯入'}</h2>
      <p className="muted small">
        由 chat 產生嘅 Reminder setup JSON 貼喺下面。會寫入 routines、完成第一次設定，然後去今日 checklist。
        亦可以用網址參數{' '}
        <code>?import=</code>（URI 編碼 JSON 或者 base64）。
      </p>
      <label className="field">
        <span>Setup JSON</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={compact ? 8 : 12}
          placeholder='{"version":1,"intake":{…},"routines":{…}}'
          spellCheck={false}
        />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <div className="actions">
        <button type="button" className="primary" onClick={runImport}>
          匯入並開始用
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setOpen(false)
            setError(null)
          }}
        >
          取消
        </button>
      </div>
    </section>
  )
}
