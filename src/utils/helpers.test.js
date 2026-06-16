import { describe, it, expect } from 'vitest'
import {
  calculateStreak,
  calculateProgress,
  currentDay,
  isExperimentExpired,
  generateId,
  getCategoryLabel,
  CATEGORIES,
  CATEGORY_COLORS,
  DECISION_LABELS,
} from './helpers'

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string')
  })

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, generateId))
    expect(ids.size).toBe(100)
  })
})

describe('calculateStreak', () => {
  it('returns 0 for empty or undefined logs', () => {
    expect(calculateStreak([])).toBe(0)
    expect(calculateStreak(null)).toBe(0)
    expect(calculateStreak(undefined)).toBe(0)
  })

  it('returns 1 for a single log', () => {
    const logs = [{ date: '2024-01-15' }]
    expect(calculateStreak(logs)).toBe(1)
  })

  it('counts consecutive days', () => {
    const logs = [
      { date: '2024-01-05' },
      { date: '2024-01-04' },
      { date: '2024-01-03' },
    ]
    expect(calculateStreak(logs)).toBe(3)
  })

  it('breaks streak on gap (only consecutive from most recent count)', () => {
    const logs = [
      { date: '2024-01-05' },
      { date: '2024-01-04' },
      { date: '2024-01-02' },
    ]
    expect(calculateStreak(logs)).toBe(2)
  })

  it('deduplicates same-day logs', () => {
    const logs = [
      { date: '2024-01-05' },
      { date: '2024-01-05' },
      { date: '2024-01-04' },
    ]
    expect(calculateStreak(logs)).toBe(2)
  })
})

describe('calculateProgress', () => {
  it('returns 0 for an experiment that just started', () => {
    const exp = {
      createdAt: new Date().toISOString(),
      duration: 10,
    }
    expect(calculateProgress(exp)).toBe(0)
  })

  it('returns 100 for an experiment past its duration', () => {
    const past = new Date()
    past.setDate(past.getDate() - 20)
    const exp = {
      createdAt: past.toISOString(),
      duration: 10,
    }
    expect(calculateProgress(exp)).toBe(100)
  })

  it('respects explicit endDate', () => {
    const exp = {
      createdAt: '2024-01-01',
      endDate: '2024-01-10',
      duration: 100,
    }
    // Since endDate is before now, progress should be 100
    expect(calculateProgress(exp)).toBe(100)
  })

  it('returns 50 when halfway through', () => {
    const start = new Date()
    start.setDate(start.getDate() - 5)
    const exp = {
      createdAt: start.toISOString(),
      duration: 10,
    }
    const result = calculateProgress(exp)
    expect(result).toBeGreaterThanOrEqual(40)
    expect(result).toBeLessThanOrEqual(60)
  })
})

describe('currentDay', () => {
  it('returns 1 on the first day', () => {
    const exp = {
      createdAt: new Date().toISOString(),
      duration: 10,
    }
    expect(currentDay(exp)).toBe(1)
  })

  it('caps at duration', () => {
    const past = new Date()
    past.setDate(past.getDate() - 30)
    const exp = {
      createdAt: past.toISOString(),
      duration: 7,
    }
    expect(currentDay(exp)).toBe(7)
  })
})

describe('isExperimentExpired', () => {
  it('returns false for non-active experiments', () => {
    expect(isExperimentExpired({ status: 'completed' })).toBe(false)
    expect(isExperimentExpired({ status: 'paused' })).toBe(false)
    expect(isExperimentExpired({ status: 'draft' })).toBe(false)
  })

  it('returns false for active experiments within duration', () => {
    const exp = {
      status: 'active',
      createdAt: new Date().toISOString(),
      duration: 14,
    }
    expect(isExperimentExpired(exp)).toBe(false)
  })

  it('returns true for active experiments past endDate', () => {
    const past = new Date()
    past.setDate(past.getDate() - 20)
    const exp = {
      status: 'active',
      createdAt: past.toISOString(),
      duration: 7,
    }
    expect(isExperimentExpired(exp)).toBe(true)
  })
})

describe('getCategoryLabel', () => {
  it('returns the label for a known key', () => {
    expect(getCategoryLabel('health')).toBe('Health & Energy')
    expect(getCategoryLabel('creativity')).toBe('Creativity')
  })

  it('returns the key for unknown keys', () => {
    expect(getCategoryLabel('unknown')).toBe('unknown')
  })
})

describe('constants', () => {
  it('CATEGORIES includes all expected entries', () => {
    expect(CATEGORIES.find(c => c.key === 'health')).toBeTruthy()
    expect(CATEGORIES.find(c => c.key === 'creativity')).toBeTruthy()
    expect(CATEGORIES.find(c => c.key === 'social')).toBeTruthy()
    expect(CATEGORIES.find(c => c.key === 'all')).toBeTruthy()
  })

  it('CATEGORY_COLORS has entries for every category', () => {
    CATEGORIES.filter(c => c.key !== 'all').forEach(c => {
      expect(CATEGORY_COLORS[c.key]).toBeTruthy()
    })
  })

  it('DECISION_LABELS contains persist, pause, pivot', () => {
    expect(DECISION_LABELS.persist).toBe('Persist')
    expect(DECISION_LABELS.pause).toBe('Pause')
    expect(DECISION_LABELS.pivot).toBe('Pivot')
  })
})
