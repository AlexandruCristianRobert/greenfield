import { describe, it, expect } from 'vitest'
import { ACHIEVEMENTS } from '../src/data/achievements.js'
import { PR_QUESTIONS, prPoolFor } from '../src/data/prs.js'
import { ERAS } from '../src/data/eras.js'

const BASE_CTX = { lifetimeLoc: 0, totalContributors: 0, maxSingleContributor: 0, cardsOwned: 0, examsPassed: 0, skillsAllocated: 0, maxBranchNodes: 0, maxCombo: 0, nuggetsClicked: 0, prsCorrect: 0, efTierIndex: -1 }

describe('ACHIEVEMENTS', () => {
  it('has 26 unique entries, none unlocked at zero state', () => {
    expect(ACHIEVEMENTS).toHaveLength(26)
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(26)
    for (const a of ACHIEVEMENTS) expect(a.check(BASE_CTX), a.id).toBe(false)
  })
  it('milestone checks fire at their thresholds', () => {
    expect(ACHIEVEMENTS.find((a) => a.id === 'ach-loc-1').check({ ...BASE_CTX, lifetimeLoc: 1e3 })).toBe(true)
    expect(ACHIEVEMENTS.find((a) => a.id === 'ach-ef-1').check({ ...BASE_CTX, efTierIndex: 0 })).toBe(true)
    expect(ACHIEVEMENTS.find((a) => a.id === 'ach-combo-100').check({ ...BASE_CTX, maxCombo: 100 })).toBe(true)
  })
})

describe('PR bank structure', () => {
  it('every question is well-formed (counts enforced after research lands)', () => {
    for (const q of PR_QUESTIONS) {
      expect(q.options).toHaveLength(4)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThanOrEqual(3)
      expect(typeof q.snippet).toBe('string')
    }
    expect(prPoolFor(-1)).toHaveLength(0)
  })
  it('has exactly 3 PR questions per era with unique ids', () => {
    for (const era of ERAS) {
      expect(PR_QUESTIONS.filter((q) => q.era === era.id), era.id).toHaveLength(3)
    }
    expect(new Set(PR_QUESTIONS.map((q) => q.id)).size).toBe(PR_QUESTIONS.length)
  })
})
