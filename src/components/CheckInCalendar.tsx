import { useState } from 'react'
import {
  currentStreak,
  daysInMonth,
  formatDateKey,
  hasCheckIn,
  monthCheckInCount,
  parseDateKey,
} from '../checkIn'
import { todayKey } from '../storage'

interface Props {
  checkIns: string[]
  onMarkToday: () => void
  onUnmarkToday: () => void
}

const WEEKDAY_HEADERS = ['日', '一', '二', '三', '四', '五', '六']

function monthCursorFromToday() {
  const d = parseDateKey(todayKey())
  return { year: d.getFullYear(), month: d.getMonth() }
}

export function CheckInCalendar({
  checkIns,
  onMarkToday,
  onUnmarkToday,
}: Props) {
  const today = todayKey()
  const [cursor, setCursor] = useState(monthCursorFromToday)

  const checkedToday = hasCheckIn(checkIns, today)
  const streak = currentStreak(checkIns, today)
  const monthCount = monthCheckInCount(checkIns, cursor.year, cursor.month)
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
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  return (
    <section className="checkin-section" aria-labelledby="checkin-heading">
      <h2 id="checkin-heading" className="section-title">
        每日打卡
      </h2>

      <div className="checkin-summary">
        <p className="checkin-streak">
          {streak > 0
            ? `連續打卡 ${streak} 日`
            : '今日未打卡 — 做完就撳一下啦'}
        </p>
        <p className="checkin-month-count">
          {cursor.year}年{cursor.month + 1}月已打卡 {monthCount} 日
        </p>
      </div>

      <div className="checkin-actions">
        {checkedToday ? (
          <>
            <p className="checkin-done" role="status">
              今日已打卡 ✓
            </p>
            <button
              type="button"
              className="ghost"
              onClick={onUnmarkToday}
            >
              取消今日打卡
            </button>
          </>
        ) : (
          <button type="button" className="primary checkin-btn" onClick={onMarkToday}>
            今日打卡
          </button>
        )}
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

      <div className="calendar-grid" role="grid" aria-label="打卡月曆">
        {WEEKDAY_HEADERS.map((label) => (
          <div key={label} className="calendar-weekday" role="columnheader">
            {label}
          </div>
        ))}
        {cells.map((cell, index) => {
          if (cell.day == null || !cell.dateKey) {
            return <div key={cell.key} className="calendar-cell is-empty" />
          }
          const marked = hasCheckIn(checkIns, cell.dateKey)
          const isToday = cell.dateKey === today
          return (
            <div
              key={cell.key}
              role="gridcell"
              className={[
                'calendar-cell',
                marked ? 'is-checked' : '',
                isToday ? 'is-today' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ animationDelay: `${0.012 * index}s` }}
              aria-label={`${cell.dateKey}${marked ? '，已打卡' : ''}`}
            >
              <span className="calendar-day">{cell.day}</span>
              {marked ? <span className="calendar-dot" aria-hidden="true" /> : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
