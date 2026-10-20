import type { ReactNode } from 'react'

interface Props {
  title: string
  emptyHint: string
  children: ReactNode
  isEmpty?: boolean
  onEmptyAction?: () => void
  emptyActionLabel?: string
}

export function ChecklistSection({
  title,
  emptyHint,
  children,
  isEmpty,
  onEmptyAction,
  emptyActionLabel = '去設定',
}: Props) {
  return (
    <section className="checklist-section">
      <h2 className="section-title">{title}</h2>
      {isEmpty ? (
        <div className="empty-block">
          <p>{emptyHint}</p>
          {onEmptyAction ? (
            <button type="button" className="linkish" onClick={onEmptyAction}>
              {emptyActionLabel}
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="check-list">{children}</ul>
      )}
    </section>
  )
}

interface ItemProps {
  id: string
  label: string
  meta?: string
  checked: boolean
  onToggle: (id: string) => void
}

export function CheckItem({ id, label, meta, checked, onToggle }: ItemProps) {
  return (
    <li className={`check-item${checked ? ' is-done' : ''}`}>
      <label>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(id)}
        />
        <span className="check-label">
          <span className="check-name">{label}</span>
          {meta ? <span className="check-meta">{meta}</span> : null}
        </span>
      </label>
    </li>
  )
}
