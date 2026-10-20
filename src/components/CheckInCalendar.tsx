import { useState } from 'react'
import {
  categoriesForDate,
  categoryStreak,
  daysInMonth,
  formatDateKey,
  goalStreak,
  hasCategory,
  isFullDay,
  monthAnyCheckInCount,
  monthFullDayCount,
  parseDateKey,
} from '../checkIn'
import { todayKey } from '../storage'
import {
  CATEGORY_LABELS,
  CHECK_IN_CATEGORIES,
  type CategoryCheckIns,
  type CheckInCategory,
} from '../types'

interface Props {
  checkIns: CategoryCheckIns
  onToggleCategory: (category: CheckInCategory) => void
}

const WEEKDAY_HEADERS = ['日', '一', '二', '三', '四', '五', '六']

function monthCursorFromToday() {
  const d = parseDateKey(todayKey())
  return { year: d.getFullYear(), month: d.getMonth() }
}

export function CheckInCalendar({ checkIns, onToggleCategory }: Props) {
  const today = todayKey()
  const [cursor, setCursor] = useState(monthCursorFromToday)
  const [monthDir, setMonthDir] = useState<'left' | 'right' | null>(null)

  const streak = goalStreak(checkIns, today)
  const fullMonth = monthFullDayCount(checkIns, cursor.year, cursor.month)
  const anyMonth = monthAnyCheckInCount(checkIns, cursor.year, cursor.month)
  const todayCats = categoriesForDate(checkIns, today)
  const todayFull = isFullDay(checkIns, today)
  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay()
  const totalDays = daysInMonth(cursor.year, cursor.month)

  const cells: Array<{ key: string; day: number | null; dateKey?: string }> = []
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({ key: `pad-${i}`, day: null })
  }
  for (let day = 1; day <= totalDays; day += 1) {
    const dateKey = formatDateKey(new Date(cursor.year, cursor.month, day))
    cells.push({ key: dateKey, day, dateKey })
  }

  function shiftMonth(delta: number) {
    setMonthDir(delta > 0 ? 'left' : 'right')
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const monthKey = `${cursor.year}-${cursor.month}`
  const gridClass = [
    'calendar-grid',
    monthDir === 'left' ? 'month-enter-from-left' : '',
    monthDir === 'right' ? 'month-enter-from-right' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className="checkin-section" aria-labelledby="checkin-heading">
      <h2 id="checkin-heading" className="section-title">
        每日打卡
      </h2>

      <div className="checkin-goal-banner" role="status">
        <p className="checkin-goal-streak">
          {streak > 0
            ? `已連續跟到目標 ${streak} 日`
            : '今日未齊四類 — 做完就打卡啦'}
        </p>
        <p className="checkin-goal-hint">
          跟到目標 = 護膚 · 行程 · 健身 · 飲食 全日勾完
        </p>
      </div>

      <div className="checkin-summary">
        <p className="checkin-month-count">
          {cursor.year}年{cursor.month + 1}月：全日完成 {fullMonth} 日
          {anyMonth > fullMonth ? ` · 有打卡 ${anyMonth} 日` : ''}
        </p>
        <ul className="checkin-cat-streaks" aria-label="分類連續">
          {CHECK_IN_CATEGORIES.map((cat) => {
            const n = categoryStreak(checkIns, cat, today)
            return (
              <li key={cat} className={`cat-streak cat-${cat}`}>
                <span className="cat-dot" aria-hidden="true" />
                {CATEGORY_LABELS[cat]}連續 {n} 日
              </li>
            )
          })}
        </ul>
      </div>

      <div className="checkin-actions">
        <p className="checkin-toggle-label">今日分類打卡</p>
        <div
          className="checkin-cat-toggles"
          role="group"
          aria-label="今日分類打卡"
        >
          {CHECK_IN_CATEGORIES.map((cat) => {
            const on = hasCategory(checkIns, today, cat)
            return (
              <button
                key={cat}
                type="button"
                className={`cat-toggle cat-${cat}${on ? ' is-on' : ''}`}
                aria-pressed={on}
                onClick={() => onToggleCategory(cat)}
              >
                {CATEGORY_LABELS[cat]}
                {on ? ' ✓' : ''}
              </button>
            )
          })}
        </div>
        <p className="checkin-done" role="status">
          {todayFull
            ? '今日全日完成 ✓'
            : todayCats.length > 0
              ? `今日已勾 ${todayCats.map((c) => CATEGORY_LABELS[c]).join(' · ')}`
              : '未打卡 — 做完該類 checklist 會自動勾'}
        </p>
      </div>

      <div className="calendar-nav">
        <button
          type="button"
          className="ghost"
          aria-label="上個月"
          onClick={() => shiftMonth(-1)}
        >
          ‹
        </button>
        <p className="calendar-title">
          {cursor.year}年{cursor.month + 1}月
        </p>
        <button
          type="button"
          className="ghost"
          aria-label="下個月"
          onClick={() => shiftMonth(1)}
        >
          ›
        </button>
      </div>

      <div className="calendar-legend" aria-hidden="true">
        {CHECK_IN_CATEGORIES.map((cat) => (
          <span key={cat} className={`legend-item cat-${cat}`}>
            <span className="cat-dot" />
            {CATEGORY_LABELS[cat]}
          </span>
        ))}
      </div>

      <div
        key={monthKey}
        className={gridClass}
        role="grid"
        aria-label="打卡月曆"
      >
        {WEEKDAY_HEADERS.map((label) => (
          <div key={label} className="calendar-weekday" role="columnheader">
            {label}
          </div>
        ))}
        {cells.map((cell, index) => {
          if (cell.day == null || !cell.dateKey) {
            return <div key={cell.key} className="calendar-cell is-empty" />
          }
          const cats = categoriesForDate(checkIns, cell.dateKey)
          const full = isFullDay(checkIns, cell.dateKey)
          const isToday = cell.dateKey === today
          const catNames = cats.map((c) => CATEGORY_LABELS[c]).join('、')
          return (
            <div
              key={cell.key}
              role="gridcell"
              className={[
                'calendar-cell',
                cats.length > 0 ? 'has-marks' : '',
                full ? 'is-full' : '',
                isToday ? 'is-today' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ animationDelay: `${0.012 * index}s` }}
              aria-label={`${cell.dateKey}${
                full
                  ? '，全日完成'
                  : cats.length > 0
                    ? `，已勾${catNames}`
                    : ''
              }`}
            >
              <span className="calendar-day">{cell.day}</span>
              {cats.length > 0 ? (
                <span className="calendar-dots" aria-hidden="true">
                  {CHECK_IN_CATEGORIES.map((cat) =>
                    cats.includes(cat) ? (
                      <span key={cat} className={`calendar-dot cat-${cat}`} />
                    ) : null,
                  )}
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
