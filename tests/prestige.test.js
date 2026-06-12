import { describe, it, expect } from 'vitest'
import { blueprintsFor } from '../src/lib/prestige.js'
import { PATTERNS } from '../src/data/patterns.js'
import { CONTRACTS, rollContract } from '../src/data/contracts.js'
import { EFFECT_TYPES } from '../src/lib/modifiers.js'

describe('blueprintsFor', () => {
  it('is the floored cube root of run lifetime / 1e9', () => {
    expect(blueprintsFor(0)).toBe(0)
    expect(blueprintsFor(999_999_999)).toBe(0)
    expect(blueprintsFor(1e9)).toBe(1)
    expect(blueprintsFor(8e9)).toBe(2)
    expect(blueprintsFor(1e12)).toBe(10)
    expect(blueprintsFor(-5)).toBe(0)
    expect(blueprintsFor(NaN)).toBe(0)
  })
})

describe('PATTERNS', () => {
  it('has the five designed patterns with valid effects and positive costs', () => {
    expect(PATTERNS.map((p) => p.id)).toEqual(['pat-di', 'pat-cqrs', 'pat-event-sourcing', 'pat-caching', 'pat-clean-architecture'])
    for (const p of PATTERNS) {
      expect(p.cost).toBeGreaterThan(0)
      for (const e of p.effects) expect(EFFECT_TYPES).toContain(e.type)
    }
  })
})

describe('CONTRACTS', () => {
  it('has balanced + four modifier contracts; rollContract never returns balanced', () => {
    expect(CONTRACTS.map((c) => c.id)).toEqual(['ct-balanced', 'ct-startup', 'ct-enterprise', 'ct-agency', 'ct-fintech'])
    expect(CONTRACTS[0].effects).toEqual([])
    for (let r = 0; r < 1; r += 0.26) {
      const rolled = rollContract(() => r)
      expect(rolled.id).not.toBe('ct-balanced')
    }
  })
})
