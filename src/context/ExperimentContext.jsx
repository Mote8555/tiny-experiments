import { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react'
import { useAuth } from './AuthContext'
import * as experimentService from '../lib/experimentService'

const ExperimentContext = createContext(null)

const STORAGE_KEY = 'experiments'
const ONBOARDING_KEY = 'onboarding_done'

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch { return [] }
}

function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }
  catch (e) { console.error('Failed to save:', e) }
}

const initial = {
  experiments: [],
  currentSection: 'dashboard',
  currentExperimentId: null,
  showOnboarding: !localStorage.getItem(ONBOARDING_KEY),
  toast: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_EXPERIMENTS': {
      save(action.payload)
      return { ...state, experiments: action.payload }
    }
    case 'ADD_EXPERIMENT': {
      const experiments = [...state.experiments, action.payload]
      save(experiments)
      return { ...state, experiments }
    }
    case 'UPDATE_EXPERIMENT': {
      const experiments = state.experiments.map(e =>
        e.id === action.payload.id ? { ...e, ...action.payload } : e
      )
      save(experiments)
      return { ...state, experiments }
    }
    case 'ADD_LOG': {
      const experiments = state.experiments.map(e =>
        e.id === action.payload.experimentId
          ? { ...e, logs: [...e.logs, action.payload.log] }
          : e
      )
      save(experiments)
      return { ...state, experiments }
    }
    case 'SET_REFLECTION': {
      const experiments = state.experiments.map(e =>
        e.id === action.payload.experimentId
          ? { ...e, reflection: action.payload.reflection }
          : e
      )
      save(experiments)
      return { ...state, experiments }
    }
    case 'SOFT_DELETE': {
      const deleted = state.experiments.find(e => e.id === action.payload)
      if (!deleted) return state
      const kept = state.experiments.filter(e => e.id !== action.payload)
      save(kept)
      return {
        ...state,
        experiments: kept,
        toast: { experiment: deleted, message: 'Experiment deleted' },
      }
    }
    case 'RESTORE_EXPERIMENT': {
      if (!state.toast?.experiment) return state
      const experiments = [...state.experiments, state.toast.experiment]
      save(experiments)
      return { ...state, experiments, toast: null }
    }
    case 'HARD_DELETE': {
      if (!state.toast) return state
      return { ...state, toast: null }
    }
    case 'DISMISS_TOAST':
      return { ...state, toast: null }
    case 'SET_SECTION':
      return { ...state, currentSection: action.payload }
    case 'SET_CURRENT_EXPERIMENT':
      return { ...state, currentExperimentId: action.payload }
    case 'DISMISS_ONBOARDING': {
      localStorage.setItem(ONBOARDING_KEY, 'true')
      return { ...state, showOnboarding: false }
    }
    default:
      return state
  }
}

export function ExperimentProvider({ children }) {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(reducer, initial)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      const local = load()
      dispatch({ type: 'SET_EXPERIMENTS', payload: local })
      setLoading(false)
      return
    }

    experimentService
      .fetchExperiments(user.id)
      .then((experiments) => {
        dispatch({ type: 'SET_EXPERIMENTS', payload: experiments })
      })
      .catch((e) => {
        console.error('Failed to load from Supabase, using local backup', e)
        const local = load()
        dispatch({ type: 'SET_EXPERIMENTS', payload: local })
      })
      .finally(() => setLoading(false))
  }, [user?.id])

  const addExperiment = useCallback(
    async (formData, id) => {
      if (!user) return
      try {
        const experiment = await experimentService.createExperiment(formData, user.id, id)
        dispatch({ type: 'ADD_EXPERIMENT', payload: experiment })
        return experiment
      } catch (e) {
        console.error('Failed to create experiment:', e)
      }
    },
    [user, dispatch]
  )

  const addLog = useCallback(
    async (experimentId, logData) => {
      if (!user) return
      try {
        const log = await experimentService.addLog(experimentId, logData)
        dispatch({ type: 'ADD_LOG', payload: { experimentId, log } })
      } catch (e) {
        console.error('Failed to save log:', e)
      }
    },
    [user, dispatch]
  )

  const addReflection = useCallback(
    async (experimentId, reflectionData) => {
      if (!user) return
      try {
        const reflection = await experimentService.addReflection(experimentId, reflectionData)
        dispatch({ type: 'SET_REFLECTION', payload: { experimentId, reflection } })
      } catch (e) {
        console.error('Failed to save reflection:', e)
      }
    },
    [user, dispatch]
  )

  const updateStatus = useCallback(
    async (experimentId, status) => {
      if (!user) return
      try {
        await experimentService.updateStatus(experimentId, status)
        dispatch({ type: 'UPDATE_EXPERIMENT', payload: { id: experimentId, status } })
      } catch (e) {
        console.error('Failed to update status:', e)
      }
    },
    [user, dispatch]
  )

  const softDelete = useCallback(
    (id) => {
      if (!user) return
      experimentService.deleteExperiment(id).catch((e) => {
        console.error('Failed to delete from Supabase:', e)
      })
      dispatch({ type: 'SOFT_DELETE', payload: id })
      setTimeout(() => {
        dispatch({ type: 'HARD_DELETE', payload: id })
      }, 5000)
    },
    [user, dispatch]
  )

  const restore = useCallback(async () => {
    if (!user || !state.toast?.experiment) return
    try {
      await experimentService.restoreExperiment(state.toast.experiment, user.id)
      dispatch({ type: 'RESTORE_EXPERIMENT' })
    } catch (e) {
      console.error('Failed to restore experiment:', e)
    }
  }, [user, state.toast, dispatch])

  return (
    <ExperimentContext.Provider
      value={{
        state,
        dispatch,
        loading,
        addExperiment,
        addLog,
        addReflection,
        updateStatus,
        softDelete,
        restore,
      }}
    >
      {children}
    </ExperimentContext.Provider>
  )
}

export function useExperiments() {
  const ctx = useContext(ExperimentContext)
  if (!ctx) throw new Error('useExperiments must be used within ExperimentProvider')
  return ctx
}
