import { describe, it, expect } from 'vitest'
import { BASE_MODS, EFFECT_TYPES, combineMods } from '../src/lib/modifiers.js'

describe('combineMods', () => {
  it('returns base (all ×1) for empty input', () => {
    expect(combineMods([])).toEqual(BASE_MODS)
    expect(combineMods()).toEqual(BASE_MODS)
  })
  it('multiplies same-type effects together', () => {
    const mods = combineMods([
      { type: 'clickMult', value: 2 },
      { type: 'clickMult', value: 1.5 },
      { type: 'lpsMult', value: 1.25 },
      { type: 'costMult', value: 0.9 },
      { type: 'releaseMult', value: 0.95 },
      { type: 'tpMult', value: 2 },
    ])
    expect(mods.clickMult).toBeCloseTo(3)
    expect(mods.lpsMult).toBeCloseTo(1.25)
    expect(mods.costMult).toBeCloseTo(0.9)
    expect(mods.releaseMult).toBeCloseTo(0.95)
    expect(mods.tpMult).toBeCloseTo(2)
  })
  it('ignores unknown types and junk values (hostile save data)', () => {
    const mods = combineMods([
      { type: 'hax', value: 99 },
      { type: 'clickMult', value: 'NaN' },
      { type: 'clickMult', value: -2 },
      { type: 'clickMult', value: Infinity },
      null,
    ])
    expect(mods).toEqual(BASE_MODS)
  })
  it('exposes the canonical effect type list', () => {
    expect(EFFECT_TYPES).toEqual(['clickMult', 'lpsMult', 'costMult', 'releaseMult', 'tpMult'])
  })
})
