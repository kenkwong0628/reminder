import { useState } from 'react'
import type { Routines, View } from '../types'
import { uid } from '../today'

interface Props {
  routines: Routines
  onSave: (routines: Routines) => void
  onNavigate: (view: View) => void
  onRerunSetup: () => void
}

export function RoutinesEdit({
  routines: initial,
  onSave,
  onNavigate,
  onRerunSetup,
}: Props) {
  const [routines, setRoutines] = useState<Routines>(structuredClone(initial))

  function save() {
    onSave(routines)
    onNavigate('home')
  }

  return (
    <div className="page routines-page">
      <header className="sub-header">
        <button type="button" className="ghost" onClick={() => onNavigate('home')}>
          ← 返今日
        </button>
        <h1>改 routines</h1>
      </header>

      <section>
        <div className="section-head">
          <h2>護膚</h2>
          <button
            type="button"
            className="linkish"
            onClick={() =>
              setRoutines((r) => ({
                ...r,
                skincare: [
                  ...r.skincare,
                  {
                    id: uid('skin'),
                    name: '新步驟',
                    dayPart: 'am',
                    order: r.skincare.length,
                  },
                ],
              }))
            }
          >
            加一步
          </button>
        </div>
        {routines.skincare.map((s, i) => (
          <div key={s.id} className="edit-row">
            <input
              value={s.name}
              onChange={(e) => {
                const name = e.target.value
                setRoutines((r) => {
                  const skincare = [...r.skincare]
                  skincare[i] = { ...skincare[i], name }
                  return { ...r, skincare }
                })
              }}
            />
            <select
              value={s.dayPart}
              onChange={(e) => {
                const dayPart = e.target.value as 'am' | 'pm' | 'any'
                setRoutines((r) => {
                  const skincare = [...r.skincare]
                  skincare[i] = { ...skincare[i], dayPart }
                  return { ...r, skincare }
                })
              }}
            >
              <option value="am">朝</option>
              <option value="pm">夜</option>
              <option value="any">不限</option>
            </select>
            <button
              type="button"
              className="danger-text"
              onClick={() =>
                setRoutines((r) => ({
                  ...r,
                  skincare: r.skincare.filter((x) => x.id !== s.id),
                }))
              }
            >
              刪
            </button>
          </div>
        ))}
      </section>

      <section>
        <div className="section-head">
          <h2>行程</h2>
          <button
            type="button"
            className="linkish"
            onClick={() =>
              setRoutines((r) => ({
                ...r,
                schedule: [
                  ...r.schedule,
                  {
                    id: uid('sch'),
                    title: '新行程',
                    weekdays: [1, 2, 3, 4, 5],
                  },
                ],
              }))
            }
          >
            加一項
          </button>
        </div>
        {routines.schedule.map((s, i) => (
          <div key={s.id} className="edit-row">
            <input
              value={s.title}
              onChange={(e) => {
                const title = e.target.value
                setRoutines((r) => {
                  const schedule = [...r.schedule]
                  schedule[i] = { ...schedule[i], title }
                  return { ...r, schedule }
                })
              }}
            />
            <input
              type="time"
              value={s.time ?? ''}
              onChange={(e) => {
                const time = e.target.value || undefined
                setRoutines((r) => {
                  const schedule = [...r.schedule]
                  schedule[i] = { ...schedule[i], time }
                  return { ...r, schedule }
                })
              }}
            />
            <button
              type="button"
              className="danger-text"
              onClick={() =>
                setRoutines((r) => ({
                  ...r,
                  schedule: r.schedule.filter((x) => x.id !== s.id),
                }))
              }
            >
              刪
            </button>
          </div>
        ))}
      </section>

      <section>
        <div className="section-head">
          <h2>健身</h2>
        </div>
        {routines.fitness.map((f, i) => (
          <div key={f.id} className="edit-block">
            <input
              value={f.name}
              onChange={(e) => {
                const name = e.target.value
                setRoutines((r) => {
                  const fitness = [...r.fitness]
                  fitness[i] = { ...fitness[i], name }
                  return { ...r, fitness }
                })
              }}
            />
            <p className="muted small">
              星期：{f.weekdays.join(', ')} {f.isRest ? '· 休息日' : ''}
            </p>
            {!f.isRest
              ? f.exercises.map((ex, ei) => (
                  <input
                    key={ex.id}
                    className="nested"
                    value={ex.name}
                    onChange={(e) => {
                      const name = e.target.value
                      setRoutines((r) => {
                        const fitness = [...r.fitness]
                        const exercises = [...fitness[i].exercises]
                        exercises[ei] = { ...exercises[ei], name }
                        fitness[i] = { ...fitness[i], exercises }
                        return { ...r, fitness }
                      })
                    }}
                  />
                ))
              : null}
          </div>
        ))}
      </section>

      <section>
        <div className="section-head">
          <h2>飲食</h2>
          <button
            type="button"
            className="linkish"
            onClick={() =>
              setRoutines((r) => ({
                ...r,
                meals: [
                  ...r.meals,
                  { id: uid('meal'), name: '新餐', slot: 'lunch' },
                ],
              }))
            }
          >
            加一餐
          </button>
        </div>
        {routines.meals.map((m, i) => (
          <div key={m.id} className="edit-row">
            <input
              value={m.name}
              onChange={(e) => {
                const name = e.target.value
                setRoutines((r) => {
                  const meals = [...r.meals]
                  meals[i] = { ...meals[i], name }
                  return { ...r, meals }
                })
              }}
            />
            <select
              value={m.slot}
              onChange={(e) => {
                const slot = e.target.value as 'lunch' | 'dinner'
                setRoutines((r) => {
                  const meals = [...r.meals]
                  meals[i] = { ...meals[i], slot }
                  return { ...r, meals }
                })
              }}
            >
              <option value="lunch">午</option>
              <option value="dinner">晚</option>
            </select>
            <button
              type="button"
              className="danger-text"
              onClick={() =>
                setRoutines((r) => ({
                  ...r,
                  meals: r.meals.filter((x) => x.id !== m.id),
                }))
              }
            >
              刪
            </button>
          </div>
        ))}
      </section>

      <div className="actions">
        <button type="button" className="primary" onClick={save}>
          儲存
        </button>
        <button type="button" className="ghost" onClick={onRerunSetup}>
          重新跑第一次設定
        </button>
      </div>
    </div>
  )
}
