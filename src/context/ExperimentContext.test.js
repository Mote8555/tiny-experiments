import { describe, it, expect, beforeEach, vi } from 'vitest'
import { reducer, getInitialState } from './ExperimentContext'

let store = {}

beforeEach(() => {
  store = {}
  vi.stubGlobal('localStorage', {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = value },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
  })
})

function makeExp(overrides = {}) {
  return {
    id: 'exp1',
    title: 'Test Experiment',
    hypothesis: 'Maybe it works',
    category: 'health',
    status: 'active',
    duration: 14,
    createdAt: '2024-01-01T00:00:00Z',
    logs: [],
    ...overrides,
  }
}

function makeLog(overrides = {}) {
  return { date: '2024-01-02', mood: 4, effort: 'medium', note: 'good', ...overrides }
}

function makeReflection(overrides = {}) {
  return { decision: 'persist', plus: 'good', minus: 'bad', next: 'keep going', ...overrides }
}

describe('reducer', () => {
  describe('SET_EXPERIMENTS', () => {
    it('replaces experiments array', () => {
      const state = getInitialState()
      const exps = [makeExp({ id: 'a' }), makeExp({ id: 'b' })]
      const next = reducer(state, { type: 'SET_EXPERIMENTS', payload: exps })
      expect(next.experiments).toHaveLength(2)
      expect(next.experiments[0].id).toBe('a')
    })

    it('persists to localStorage', () => {
      const state = getInitialState()
      const exps = [makeExp()]
      reducer(state, { type: 'SET_EXPERIMENTS', payload: exps })
      const stored = JSON.parse(localStorage.getItem('experiments'))
      expect(stored).toHaveLength(1)
    })
  })

  describe('ADD_EXPERIMENT', () => {
    it('appends an experiment', () => {
      const state = getInitialState()
      const next = reducer(state, { type: 'ADD_EXPERIMENT', payload: makeExp() })
      expect(next.experiments).toHaveLength(1)
      expect(next.experiments[0].title).toBe('Test Experiment')
    })
  })

  describe('UPDATE_EXPERIMENT', () => {
    it('merges payload into matching experiment', () => {
      const state = { ...getInitialState(), experiments: [makeExp()] }
      const next = reducer(state, {
        type: 'UPDATE_EXPERIMENT',
        payload: { id: 'exp1', title: 'Updated' },
      })
      expect(next.experiments[0].title).toBe('Updated')
      expect(next.experiments[0].hypothesis).toBe('Maybe it works')
    })
  })

  describe('ADD_LOG', () => {
    it('adds a log entry to the experiment', () => {
      const state = { ...getInitialState(), experiments: [makeExp()] }
      const log = makeLog()
      const next = reducer(state, { type: 'ADD_LOG', payload: { experimentId: 'exp1', log } })
      expect(next.experiments[0].logs).toHaveLength(1)
      expect(next.experiments[0].logs[0].date).toBe('2024-01-02')
    })
  })

  describe('SET_REFLECTION', () => {
    it('sets reflection on the experiment', () => {
      const state = { ...getInitialState(), experiments: [makeExp()] }
      const reflection = makeReflection()
      const next = reducer(state, {
        type: 'SET_REFLECTION',
        payload: { experimentId: 'exp1', reflection },
      })
      expect(next.experiments[0].reflection.decision).toBe('persist')
    })
  })

  describe('SOFT_DELETE', () => {
    it('removes the experiment and sets toast', () => {
      const state = { ...getInitialState(), experiments: [makeExp()] }
      const next = reducer(state, { type: 'SOFT_DELETE', payload: 'exp1' })
      expect(next.experiments).toHaveLength(0)
      expect(next.toast).not.toBeNull()
      expect(next.toast.experiment.id).toBe('exp1')
      expect(next.toast.message).toBe('Experiment deleted')
    })

    it('does nothing if id does not exist', () => {
      const state = { ...getInitialState(), experiments: [makeExp()] }
      const next = reducer(state, { type: 'SOFT_DELETE', payload: 'nonexistent' })
      expect(next.experiments).toHaveLength(1)
    })
  })

  describe('RESTORE_EXPERIMENT', () => {
    it('restores the deleted experiment from toast', () => {
      const state = { ...getInitialState(), toast: { experiment: makeExp(), message: 'deleted' } }
      const next = reducer(state, { type: 'RESTORE_EXPERIMENT' })
      expect(next.experiments).toHaveLength(1)
      expect(next.toast).toBeNull()
    })

    it('does nothing if no toast', () => {
      const state = getInitialState()
      const next = reducer(state, { type: 'RESTORE_EXPERIMENT' })
      expect(next.toast).toBeNull()
    })
  })

  describe('HARD_DELETE', () => {
    it('clears the toast', () => {
      const state = { ...getInitialState(), toast: { experiment: makeExp(), message: 'deleted' } }
      const next = reducer(state, { type: 'HARD_DELETE' })
      expect(next.toast).toBeNull()
    })
  })

  describe('DISMISS_TOAST', () => {
    it('clears the toast', () => {
      const state = { ...getInitialState(), toast: { experiment: makeExp(), message: 'hi' } }
      const next = reducer(state, { type: 'DISMISS_TOAST' })
      expect(next.toast).toBeNull()
    })
  })

  describe('SET_SECTION', () => {
    it('updates the current section', () => {
      const state = getInitialState()
      const next = reducer(state, { type: 'SET_SECTION', payload: 'create' })
      expect(next.currentSection).toBe('create')
    })
  })

  describe('SET_CURRENT_EXPERIMENT', () => {
    it('sets the current experiment id', () => {
      const state = getInitialState()
      const next = reducer(state, { type: 'SET_CURRENT_EXPERIMENT', payload: 'exp1' })
      expect(next.currentExperimentId).toBe('exp1')
    })
  })

  describe('DISMISS_ONBOARDING', () => {
    it('hides the onboarding and sets localStorage', () => {
      const state = { ...getInitialState(), showOnboarding: true }
      const next = reducer(state, { type: 'DISMISS_ONBOARDING' })
      expect(next.showOnboarding).toBe(false)
      expect(localStorage.getItem('onboarding_done')).toBe('true')
    })
  })

  describe('unknown action', () => {
    it('returns state unchanged', () => {
      const state = getInitialState()
      const next = reducer(state, { type: 'UNKNOWN' })
      expect(next).toEqual(state)
    })
  })
})
