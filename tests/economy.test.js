import { describe, it, expect } from 'vitest'
import { costOf, milestoneMultiplier, contributorLps, totalLps } from '../src/lib/economy.js'

describe('costOf', () => {
  it('returns base cost when none owned', () => {
    expect(costOf(15, 0)).toBe(15)
  })
  it('grows 15% per owned, rounded up', () => {
    expect(costOf(15, 1)).toBe(18)
    expect(costOf(100, 10)).toBe(Math.ceil(100 * 1.15 ** 10))
  })
})

describe('milestoneMultiplier', () => {
  it('doubles at 25, 50 and 100 owned (cumulative)', () => {
    expect(milestoneMultiplier(0)).toBe(1)
    expect(milestoneMultiplier(24)).toBe(1)
    expect(milestoneMultiplier(25)).toBe(2)
    expect(milestoneMultiplier(50)).toBe(4)
    expect(milestoneMultiplier(100)).toBe(8)
    expect(milestoneMultiplier(500)).toBe(8)
  })
})

describe('production', () => {
  it('contributorLps = base × owned × milestone multiplier', () => {
    expect(contributorLps(0.1, 10)).toBeCloseTo(1)
    expect(contributorLps(1, 25)).toBe(50)
  })
  it('totalLps sums across the ladder, missing ids count as 0', () => {
    const ladder = [{ id: 'a', baseLps: 1 }, { id: 'b', baseLps: 8 }]
    expect(totalLps(ladder, { a: 2, b: 1 })).toBe(10)
    expect(totalLps(ladder, {})).toBe(0)
  })
})
