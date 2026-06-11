import { describe, it, expect } from 'vitest'
import { CONTRIBUTORS } from '../src/data/contributors.js'

describe('CONTRIBUTORS data', () => {
  it('has 10 tiers with unique ids', () => {
    expect(CONTRIBUTORS).toHaveLength(10)
    expect(new Set(CONTRIBUTORS.map((c) => c.id)).size).toBe(10)
  })
  it('is sorted by strictly increasing cost', () => {
    for (let i = 1; i < CONTRIBUTORS.length; i++) {
      expect(CONTRIBUTORS[i].baseCost).toBeGreaterThan(CONTRIBUTORS[i - 1].baseCost)
    }
  })
  it('every entry has the required fields', () => {
    for (const c of CONTRIBUTORS) {
      expect(typeof c.id).toBe('string')
      expect(typeof c.name).toBe('string')
      expect(typeof c.icon).toBe('string')
      expect(typeof c.flavor).toBe('string')
      expect(c.baseCost).toBeGreaterThan(0)
      expect(c.baseLps).toBeGreaterThan(0)
    }
  })
})
