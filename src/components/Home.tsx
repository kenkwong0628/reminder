import type { AppState, CheckInCategory, View } from '../types'
import {
  fitnessForToday,
  formatCantoneseDate,
  greetingForHour,
  mealForToday,
  scheduleForToday,
  skincareForToday,
} from '../today'
import { getOrCreateCompletion, todayKey } from '../storage'
import { goalStreak } from '../checkIn'
import { CheckItem, ChecklistSection } from './ChecklistSection'
import { CheckInCalendar } from './CheckInCalendar'

interface Props {
  state: AppState
  onToggle: (itemId: string) => void
  onSwapMeal: (slot: 'lunch' | 'dinner') => void
  onToggleCategory: (category: CheckInCategory) => void
  onNavigate: (view: View) => void
}

export function Home({
  state,
  onToggle,
  onSwapMeal,
  onToggleCategory,
  onNavigate,
}: Props) {
  const date = todayKey()
  const completion = getOrCreateCompletion(state.completions, date)
  const skin = skincareForToday(state.routines.skincare)
  const schedule = scheduleForToday(state.routines.schedule)
  const fitness = fitnessForToday(state.routines.fitness)
  const lunch = mealForToday(
    state.routines.meals,
    'lunch',
    new Date(),
    completion.mealOverrides?.lunchId,
  )
  const dinner = mealForToday(
    state.routines.meals,
    'dinner',
    new Date(),
    completion.mealOverrides?.dinnerId,
  )

  const skinEmpty =
    skin.am.length + skin.pm.length + skin.any.length === 0
  const streak = goalStreak(state.checkIns, date)

  return (
    <div className="page home-page">
      <header className="home-header">
        <p className="brand">Reminder</p>
        <p className="date-line">{formatCantoneseDate()}</p>
        <h1 className="greeting">{greetingForHour()}，今日就跟住做啦</h1>
        <p className="home-streak" role="status">
          {streak > 0
            ? `已連續跟到目標 ${streak} 日`
            : '未有連續全日 — 四類都勾完就計'}
        </p>
      </header>

      <nav className="top-nav" aria-label="主要導覽">
        <button type="button" onClick={() => onNavigate('routines')}>
          改 routines
        </button>
        <button type="button" onClick={() => onNavigate('settings')}>
          設定
        </button>
      </nav>

      <ChecklistSection
        title="護膚"
        emptyHint="未有護膚步驟"
        isEmpty={skinEmpty}
        onEmptyAction={() => onNavigate('routines')}
      >
        {skin.am.length > 0 ? (
          <>
            <li className="part-label">朝早</li>
            {skin.am.map((s) => (
              <CheckItem
                key={s.id}
                id={s.id}
                label={s.name}
                checked={Boolean(completion.checked[s.id])}
                onToggle={onToggle}
              />
            ))}
          </>
        ) : null}
        {skin.pm.length > 0 ? (
          <>
            <li className="part-label">夜晚</li>
            {skin.pm.map((s) => (
              <CheckItem
                key={s.id}
                id={s.id}
                label={s.name}
                checked={Boolean(completion.checked[s.id])}
                onToggle={onToggle}
              />
            ))}
          </>
        ) : null}
        {skin.any.map((s) => (
          <CheckItem
            key={s.id}
            id={s.id}
            label={s.name}
            checked={Boolean(completion.checked[s.id])}
            onToggle={onToggle}
          />
        ))}
      </ChecklistSection>

      <ChecklistSection
        title="行程"
        emptyHint="今日未有行程"
        isEmpty={schedule.length === 0}
        onEmptyAction={() => onNavigate('routines')}
      >
        {schedule.map((s) => (
          <CheckItem
            key={s.id}
            id={s.id}
            label={s.title}
            meta={s.time}
            checked={Boolean(completion.checked[s.id])}
            onToggle={onToggle}
          />
        ))}
      </ChecklistSection>

      <ChecklistSection
        title="健身"
        emptyHint="未設定健身計劃"
        isEmpty={!fitness}
        onEmptyAction={() => onNavigate('routines')}
      >
        {fitness?.isRest ? (
          <li className="rest-day">今日休息日 — 放鬆下都得</li>
        ) : (
          fitness?.exercises.map((ex) => (
            <CheckItem
              key={ex.id}
              id={ex.id}
              label={ex.name}
              meta={ex.detail}
              checked={Boolean(completion.checked[ex.id])}
              onToggle={onToggle}
            />
          ))
        )}
      </ChecklistSection>

      <ChecklistSection
        title="飲食"
        emptyHint="未有餐單建議"
        isEmpty={!lunch && !dinner}
        onEmptyAction={() => onNavigate('routines')}
      >
        {lunch ? (
          <>
            <CheckItem
              id={`meal_${lunch.id}`}
              label={`午餐：${lunch.name}`}
              checked={Boolean(completion.checked[`meal_${lunch.id}`])}
              onToggle={onToggle}
            />
            <li className="meal-swap">
              <button
                type="button"
                className="swap-btn"
                onClick={() => onSwapMeal('lunch')}
              >
                換一個午餐
              </button>
            </li>
          </>
        ) : null}
        {dinner ? (
          <>
            <CheckItem
              id={`meal_${dinner.id}`}
              label={`晚餐：${dinner.name}`}
              checked={Boolean(completion.checked[`meal_${dinner.id}`])}
              onToggle={onToggle}
            />
            <li className="meal-swap">
              <button
                type="button"
                className="swap-btn"
                onClick={() => onSwapMeal('dinner')}
              >
                換一個晚餐
              </button>
            </li>
          </>
        ) : null}
      </ChecklistSection>

      <CheckInCalendar
        checkIns={state.checkIns}
        onToggleCategory={onToggleCategory}
      />
    </div>
  )
}
