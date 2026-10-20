import { useEffect, useState, type ReactNode } from 'react'
import type { AppState, IntakeAnswers, Routines, View } from './types'
import {
  clearState,
  getOrCreateCompletion,
  loadState,
  saveState,
  todayKey,
} from './storage'
import {
  hasCheckIn,
  isDayFullyChecked,
  withCheckIn,
  withoutCheckIn,
} from './checkIn'
import { decodeImportParam } from './importSetup'
import { mealForToday } from './today'
import { Home } from './components/Home'
import { SetupFlow } from './components/SetupFlow'
import { RoutinesEdit } from './components/RoutinesEdit'
import { Settings } from './components/Settings'
import './App.css'

type Boot = {
  state: AppState
  view: View
  notice: string | null
}

function bootApp(): Boot {
  const loaded = loadState()
  const params = new URLSearchParams(window.location.search)
  const raw = params.get('import')
  if (raw == null) {
    return {
      state: loaded,
      view: loaded.setupComplete ? 'home' : 'setup',
      notice: null,
    }
  }

  params.delete('import')
  const next =
    params.toString().length > 0
      ? `${window.location.pathname}?${params}`
      : window.location.pathname
  window.history.replaceState({}, '', next)

  const result = decodeImportParam(raw)
  if (!result.ok) {
    return {
      state: loaded,
      view: loaded.setupComplete ? 'home' : 'setup',
      notice: `匯入失敗：${result.error}`,
    }
  }

  return {
    state: {
      ...loaded,
      setupComplete: true,
      intake: result.intake,
      routines: result.routines,
    },
    view: 'home',
    notice: '已由網址參數匯入設定。',
  }
}

let cachedBoot: Boot | undefined

function getBoot(): Boot {
  if (!cachedBoot) cachedBoot = bootApp()
  return cachedBoot
}

export default function App() {
  const boot = getBoot()
  const [state, setState] = useState<AppState>(boot.state)
  const [view, setView] = useState<View>(boot.view)
  const [importNotice, setImportNotice] = useState<string | null>(boot.notice)

  useEffect(() => {
    saveState(state)
  }, [state])

  // 今日 checklist 做晒但未打卡 → 自動補上（render 調整，唔用 effect）
  const today = todayKey()
  if (
    state.setupComplete &&
    !hasCheckIn(state.checkIns, today) &&
    isDayFullyChecked(state, today)
  ) {
    setState((prev) => {
      if (hasCheckIn(prev.checkIns, today) || !isDayFullyChecked(prev, today)) {
        return prev
      }
      return { ...prev, checkIns: withCheckIn(prev.checkIns, today) }
    })
  }

  function toggleItem(itemId: string) {
    const date = todayKey()
    setState((prev) => {
      const current = getOrCreateCompletion(prev.completions, date)
      const checked = { ...current.checked, [itemId]: !current.checked[itemId] }
      const next: AppState = {
        ...prev,
        completions: {
          ...prev.completions,
          [date]: { ...current, checked },
        },
      }
      // 做晒今日 checklist → 自動打卡（唔會自動取消）
      if (isDayFullyChecked(next, date)) {
        next.checkIns = withCheckIn(next.checkIns, date)
      }
      return next
    })
  }

  function markCheckIn() {
    const date = todayKey()
    setState((prev) => ({
      ...prev,
      checkIns: withCheckIn(prev.checkIns, date),
    }))
  }

  function unmarkCheckIn() {
    const date = todayKey()
    setState((prev) => ({
      ...prev,
      checkIns: withoutCheckIn(prev.checkIns, date),
    }))
  }

  function swapMeal(slot: 'lunch' | 'dinner') {
    const date = todayKey()
    setState((prev) => {
      const current = getOrCreateCompletion(prev.completions, date)
      const pool = prev.routines.meals.filter((m) => m.slot === slot)
      if (pool.length < 2) return prev
      const overrideKey = slot === 'lunch' ? 'lunchId' : 'dinnerId'
      const currentId =
        current.mealOverrides?.[overrideKey] ??
        mealForToday(prev.routines.meals, slot)?.id
      const idx = pool.findIndex((m) => m.id === currentId)
      const next = pool[(idx + 1) % pool.length]
      return {
        ...prev,
        completions: {
          ...prev.completions,
          [date]: {
            ...current,
            mealOverrides: {
              ...current.mealOverrides,
              [overrideKey]: next.id,
            },
          },
        },
      }
    })
  }

  function completeSetup(intake: IntakeAnswers, routines: Routines) {
    setState((prev) => ({
      ...prev,
      setupComplete: true,
      intake,
      routines,
    }))
    setView('home')
  }

  function clearAll() {
    clearState()
    const fresh = loadState()
    setState(fresh)
    setView('setup')
  }

  let body: ReactNode
  if (view === 'setup' || !state.setupComplete) {
    body = (
      <SetupFlow
        settings={state.settings}
        initialIntake={state.intake}
        onComplete={completeSetup}
        onCancel={
          state.setupComplete ? () => setView('home') : undefined
        }
      />
    )
  } else if (view === 'routines') {
    body = (
      <RoutinesEdit
        routines={state.routines}
        onSave={(routines) => setState((prev) => ({ ...prev, routines }))}
        onNavigate={setView}
        onRerunSetup={() => setView('setup')}
      />
    )
  } else if (view === 'settings') {
    body = (
      <Settings
        settings={state.settings}
        onSave={(settings) => setState((prev) => ({ ...prev, settings }))}
        onNavigate={setView}
        onClearAll={clearAll}
        onRerunSetup={() => setView('setup')}
        onImportSetup={completeSetup}
      />
    )
  } else {
    body = (
      <Home
        state={state}
        onToggle={toggleItem}
        onSwapMeal={swapMeal}
        onMarkCheckIn={markCheckIn}
        onUnmarkCheckIn={unmarkCheckIn}
        onNavigate={setView}
      />
    )
  }

  return (
    <>
      {importNotice ? (
        <div className="import-toast" role="status">
          <span>{importNotice}</span>
          <button type="button" className="ghost" onClick={() => setImportNotice(null)}>
            關閉
          </button>
        </div>
      ) : null}
      {body}
    </>
  )
}
