import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// The PR bank is authored by parallel research tasks — these tests must not
// depend on real content. Mock the module the events store consumes.
vi.mock('../src/data/prs.js', () => {
  const q = { id: 'pr-test', era: 'cs2', text: 't', snippet: 's', options: ['a', 'b', 'c', 'd'], answer: 2 }
  return { PR_QUESTIONS: [q], prPoolFor: () => [q] }
})

import { useEventsStore, PR_MIN_GAP, NUGGET_MIN_GAP, FRENZY_MULT, CONFLICT_MULT, BUFF_MS } from '../src/stores/events.js'
import { useGameStore } from '../src/stores/game.js'
import { useProgressStore } from '../src/stores/progress.js'
import { useAwardsStore } from '../src/stores/awards.js'

beforeEach(() => setActivePinia(createPinia()))

const FAKE_PR = Object.freeze({ id: 'pr-test', era: 'cs2', text: 't', snippet: 's', options: Object.freeze(['a', 'b', 'c', 'd']), answer: 2 })

describe('spawn scheduling', () => {
  it('offers a PR after the gap elapses, expires the toast after its lifetime', () => {
    const events = useEventsStore()
    events.init(1_000_000, () => 0) // rand 0 → min gaps
    events.tick(1_000_000 + PR_MIN_GAP - 1)
    expect(events.prOffer).toBe(null)
    events.tick(1_000_000 + PR_MIN_GAP + 1)
    expect(events.prOffer).not.toBe(null)
    events.tick(1_000_000 + PR_MIN_GAP + 25_000) // > 20s lifetime
    expect(events.prOffer).toBe(null)
  })
  it('offers a nugget independently', () => {
    const events = useEventsStore()
    events.init(0, () => 0)
    events.tick(NUGGET_MIN_GAP + 1)
    expect(events.nugget).not.toBe(null)
  })
})

describe('PR answering', () => {
  it('correct answer grants frenzy buff, knowledge, and a stat', () => {
    const events = useEventsStore()
    const progress = useProgressStore()
    const awards = useAwardsStore()
    events.init(0, () => 0)
    events.forcePr(FAKE_PR, 10_000)
    events.answerPr(2, 10_000)
    expect(events.buffMult).toBe(FRENZY_MULT)
    expect(progress.knowledge).toBe(1)
    expect(awards.stats.prsCorrect).toBe(1)
    events.tick(10_000 + BUFF_MS + 1)
    expect(events.buffMult).toBe(1)
  })
  it('wrong answer applies the merge-conflict debuff', () => {
    const events = useEventsStore()
    events.init(0, () => 0)
    events.forcePr(FAKE_PR, 10_000)
    events.answerPr(0, 10_000)
    expect(events.buffMult).toBe(CONFLICT_MULT)
  })
})

describe('nugget rewards', () => {
  it('rand < 0.7 grants frenzy; otherwise instant LoC', () => {
    const events = useEventsStore()
    const game = useGameStore()
    events.init(0, () => 0)
    events.tick(NUGGET_MIN_GAP + 1)
    events.clickNugget(NUGGET_MIN_GAP + 2, () => 0.1) // frenzy path
    expect(events.buffMult).toBe(FRENZY_MULT)
    events.init(0, () => 0)
    events.tick(NUGGET_MIN_GAP + 1)
    const before = game.loc
    events.clickNugget(NUGGET_MIN_GAP + 2, () => 0.9) // loc path (lps 0 → effectiveClick × 100)
    expect(game.loc).toBeGreaterThan(before)
  })
})
