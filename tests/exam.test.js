import { describe, it, expect } from 'vitest'
import { EXAM_SIZE, EXAM_COOLDOWN_MS, poolFor, drawExam, passMarkFor, gradeExam, examEligibility } from '../src/lib/exam.js'

const Q = (id, feature) => ({ id, era: 'cs2', feature, text: 't', options: ['a', 'b', 'c', 'd'], answer: 1 })
const QUESTIONS = [
  Q('q1', 'cs2-generics'), Q('q2', 'cs2-generics'), Q('q3', 'cs2-iterators'),
  Q('q4', 'cs2-iterators'), Q('q5', 'cs2-partial-types'), Q('q6', 'cs2-static-classes'),
  Q('q7', 'cs2-nullable-value-types'), { ...Q('q8', 'cs3-linq'), era: 'cs3' },
]

describe('poolFor', () => {
  it('filters by era AND owned feature cards', () => {
    const pool = poolFor(QUESTIONS, 'cs2', ['cs2-generics', 'cs2-iterators', 'cs3-linq'])
    expect(pool.map((q) => q.id)).toEqual(['q1', 'q2', 'q3', 'q4'])
  })
})

describe('drawExam', () => {
  it('draws min(EXAM_SIZE, pool) distinct questions using the injected rand', () => {
    const pool = poolFor(QUESTIONS, 'cs2', ['cs2-generics', 'cs2-iterators', 'cs2-partial-types', 'cs2-static-classes', 'cs2-nullable-value-types'])
    expect(pool).toHaveLength(7)
    const drawn = drawExam(pool, () => 0.42)
    expect(drawn).toHaveLength(EXAM_SIZE)
    expect(new Set(drawn.map((q) => q.id)).size).toBe(EXAM_SIZE)
  })
  it('draws the whole pool when it is smaller than EXAM_SIZE', () => {
    const pool = poolFor(QUESTIONS, 'cs2', ['cs2-generics'])
    expect(drawExam(pool, () => 0.1)).toHaveLength(2)
  })
})

describe('grading', () => {
  it('pass mark is size − 1 (minimum 1)', () => {
    expect(passMarkFor(6)).toBe(5)
    expect(passMarkFor(3)).toBe(2)
    expect(passMarkFor(1)).toBe(1)
  })
  it('grades answers against the answer index', () => {
    const drawn = [Q('q1', 'f'), Q('q2', 'f'), Q('q3', 'f')]
    expect(gradeExam(drawn, [1, 1, 0])).toEqual({ correct: 2, size: 3, passed: true })
    expect(gradeExam(drawn, [0, 0, 0])).toEqual({ correct: 0, size: 3, passed: false })
  })
})

describe('examEligibility', () => {
  const base = { releaseFunded: true, ownedEraCount: 3, eraCardCount: 6, lastExamFailAt: 0, now: 1_000_000 }
  it('eligible when funded, ≥50% cards, off cooldown', () => {
    expect(examEligibility(base)).toEqual({ eligible: true, reason: null })
  })
  it('blocks without Release funding', () => {
    expect(examEligibility({ ...base, releaseFunded: false }).reason).toBe('release')
  })
  it('blocks under 50% card ownership', () => {
    expect(examEligibility({ ...base, ownedEraCount: 2 }).reason).toBe('cards')
  })
  it('blocks during the fail cooldown', () => {
    expect(examEligibility({ ...base, lastExamFailAt: base.now - EXAM_COOLDOWN_MS + 1 }).reason).toBe('cooldown')
    expect(examEligibility({ ...base, lastExamFailAt: base.now - EXAM_COOLDOWN_MS }).eligible).toBe(true)
  })
})
