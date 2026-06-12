import { describe, it, expect } from 'vitest'
import { ERAS } from '../src/data/eras.js'
import { SKILL_BRANCHES, MAX_SKILL_NODES, skillNodeCost } from '../src/data/skills.js'

// Deviation (parallel-safety): EFFECT_TYPES declared locally until modifiers.js exists
const EFFECT_TYPES = ['clickMult', 'lpsMult', 'costMult', 'releaseMult']

describe('ERAS', () => {
  it('has the six M2 eras in chronological order with rising Release costs', () => {
    expect(ERAS.map((e) => e.id)).toEqual(['cs2', 'cs3', 'cs4', 'cs5', 'cs6', 'cs7'])
    for (let i = 1; i < ERAS.length; i++) {
      expect(ERAS[i].releaseCost).toBeGreaterThan(ERAS[i - 1].releaseCost)
      expect(ERAS[i].year).toBeGreaterThan(ERAS[i - 1].year)
    }
  })
  it('every era has the required fields', () => {
    for (const e of ERAS) {
      expect(typeof e.csVersion).toBe('string')
      expect(typeof e.name).toBe('string')
      expect(e.releaseCost).toBeGreaterThan(0)
      expect(e.color).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})

describe('SKILL_BRANCHES', () => {
  it('has the four canonical branches with valid effect types', () => {
    expect(SKILL_BRANCHES.map((b) => b.id)).toEqual(['language', 'data', 'performance', 'tooling'])
    for (const b of SKILL_BRANCHES) {
      expect(EFFECT_TYPES).toContain(b.effectType)
      expect(b.perNode).toBeGreaterThan(0)
      expect(typeof b.blurb).toBe('string')
    }
  })
  it('node costs are 1..5 and the full tree costs 60 (> max M2 Knowledge of 54)', () => {
    expect([0, 1, 2, 3, 4].map(skillNodeCost)).toEqual([1, 2, 3, 4, 5])
    expect(MAX_SKILL_NODES).toBe(5)
    const fullTree = SKILL_BRANCHES.length * [0, 1, 2, 3, 4].reduce((s, i) => s + skillNodeCost(i), 0)
    expect(fullTree).toBe(60)
  })
})
