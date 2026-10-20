import { useEffect, useState } from 'react'
import type { AppState, IntakeAnswers, Routines, View } from './types'
import {
  clearState,
  getOrCreateCompletion,
  loadState,
  saveState,
  todayKey,
} from './storage'
import { mealForToday } from './today'
import { Home } from './components/Home'
import { SetupFlow } from './components/SetupFlow'
import { RoutinesEdit } from './components/RoutinesEdit'
import { Settings } from './components/Settings'
import './App.css'

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [view, setView] = useState<View>(() =>
    loadState().setupComplete ? 'home' : 'setup',
  )

  useEffect(() => {
    saveState(state)
  }, [state])

  function toggleItem(itemId: string) {
    const date = todayKey()
    setState((prev) => {
      const current = getOrCreateCompletion(prev.completions, date)
      const checked = { ...current.checked, [itemId]: !current.checked[itemId] }
      return {
        ...prev,
        completions: {
          ...prev.completions,
          [date]: { ...current, checked },
        },
      }
    })
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

  if (view === 'setup' || !state.setupComplete) {
    return (
      <SetupFlow
        settings={state.settings}
        initialIntake={state.intake}
        onComplete={completeSetup}
        onCancel={
          state.setupComplete ? () => setView('home') : undefined
        }
      />
    )
  }

  if (view === 'routines') {
    return (
      <RoutinesEdit
        routines={state.routines}
        onSave={(routines) => setState((prev) => ({ ...prev, routines }))}
        onNavigate={setView}
        onRerunSetup={() => setView('setup')}
      />
    )
  }

  if (view === 'settings') {
    return (
      <Settings
        settings={state.settings}
        onSave={(settings) => setState((prev) => ({ ...prev, settings }))}
        onNavigate={setView}
        onClearAll={clearAll}
        onRerunSetup={() => setView('setup')}
      />
    )
  }

  return (
    <Home
      state={state}
      onToggle={toggleItem}
      onSwapMeal={swapMeal}
      onNavigate={setView}
    />
  )
}
