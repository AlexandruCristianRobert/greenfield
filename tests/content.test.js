import { describe, it, expect } from 'vitest'
import { ERAS } from '../src/data/eras.js'
import { SKILL_BRANCHES, MAX_SKILL_NODES, skillNodeCost } from '../src/data/skills.js'
import { EFFECT_TYPES } from '../src/lib/modifiers.js'
import { LANGUAGE_FEATURES, featuresOf } from '../src/data/featuresLanguage.js'
import { QUESTIONS } from '../src/data/questions.js'

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

describe('LANGUAGE_FEATURES structure', () => {
  it('has 36 cards, 6 per era, unique ids, era-prefixed', () => {
    expect(LANGUAGE_FEATURES).toHaveLength(36)
    expect(new Set(LANGUAGE_FEATURES.map((f) => f.id)).size).toBe(36)
    for (const era of ERAS) expect(featuresOf(era.id)).toHaveLength(6)
    for (const f of LANGUAGE_FEATURES) expect(f.id.startsWith(f.era + '-')).toBe(true)
  })
  it('costs rise within each era and effects use valid types', () => {
    for (const era of ERAS) {
      const cards = featuresOf(era.id)
      for (let i = 1; i < cards.length; i++) expect(cards[i].cost).toBeGreaterThan(cards[i - 1].cost)
      for (const c of cards) {
        expect(EFFECT_TYPES).toContain(c.effect.type)
        expect(c.effect.value).toBeGreaterThan(0)
        expect(typeof c.effectText).toBe('string')
      }
    }
  })
})

describe('QUESTIONS content', () => {
  it('has exactly 10 per era, valid shape, answerable feature refs', () => {
    for (const era of ERAS) {
      const qs = QUESTIONS.filter((q) => q.era === era.id)
      expect(qs, era.id).toHaveLength(10)
      const perFeature = {}
      for (const q of qs) {
        expect(q.options).toHaveLength(4)
        expect(q.answer).toBeGreaterThanOrEqual(0)
        expect(q.answer).toBeLessThanOrEqual(3)
        expect(q.text.length).toBeGreaterThan(10)
        const card = LANGUAGE_FEATURES.find((f) => f.id === q.feature)
        expect(card, q.id).toBeTruthy()
        expect(card.era).toBe(era.id)
        perFeature[q.feature] = (perFeature[q.feature] || 0) + 1
      }
      for (const f of featuresOf(era.id)) {
        expect(perFeature[f.id], f.id).toBeGreaterThanOrEqual(1)
        expect(perFeature[f.id], f.id).toBeLessThanOrEqual(2)
      }
    }
  })
  it('every card has non-empty blurb and snippet within length caps', () => {
    for (const f of LANGUAGE_FEATURES) {
      expect(f.blurb.length, f.id).toBeGreaterThan(20)
      expect(f.blurb.length, f.id).toBeLessThanOrEqual(160)
      expect(f.snippet.length, f.id).toBeGreaterThan(10)
      expect(f.snippet.length, f.id).toBeLessThanOrEqual(220)
    }
  })
})
