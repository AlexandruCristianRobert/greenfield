import { describe, it, expect } from 'vitest'
import { formatNumber, formatRate } from '../src/lib/format.js'

describe('formatNumber', () => {
  it('shows integers below 1000 floored', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(999.9)).toBe('999')
  })
  it('uses suffixes with 3 significant digits', () => {
    expect(formatNumber(1000)).toBe('1.00K')
    expect(formatNumber(15_300)).toBe('15.3K')
    expect(formatNumber(123_456)).toBe('123K')
    expect(formatNumber(2_350_000)).toBe('2.35M')
    expect(formatNumber(7.5e10)).toBe('75.0B')
  })
  it('falls back to exponential beyond the suffix table', () => {
    expect(formatNumber(1e33)).toBe('1.00e+33')
  })
  it('rounds across tier boundaries without 4-digit artifacts', () => {
    expect(formatNumber(999_999)).toBe('1.00M')
    expect(formatNumber(9_996)).toBe('10.0K')
    expect(formatNumber(99_960)).toBe('100K')
  })
})

describe('formatRate', () => {
  it('keeps one decimal under 1000', () => {
    expect(formatRate(0.1)).toBe('0.1')
    expect(formatRate(47)).toBe('47')
  })
  it('delegates to suffixes at 1000+', () => {
    expect(formatRate(1400)).toBe('1.40K')
  })
  it('floors sub-1000 values that would round up to 1000', () => {
    expect(formatRate(999.96)).toBe('999')
  })
})
