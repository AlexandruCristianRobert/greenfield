import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProgressStore } from '../src/stores/progress.js'
import { useGameStore } from '../src/stores/game.js'
import { ERAS } from '../src/data/eras.js'
import { featuresOf } from '../src/data/featuresLanguage.js'

beforeEach(() => setActivePinia(createPinia()))

function buyEraCards(progress, game, eraId, n) {
  const cards = featuresOf(eraId).slice(0, n)
  for (const c of cards) {
    game.addLoc(c.cost)
    expect(progress.buyCard(c)).toBe(true)
  }
  return cards
}

describe('cards & knowledge', () => {
  it('buyCard spends LoC, marks owned, grants +1 Knowledge on FIRST read only', () => {
    const progress = useProgressStore()
    const game = useGameStore()
    const card = featuresOf('cs2')[0]
    game.addLoc(card.cost)
    expect(progress.buyCard(card)).toBe(true)
    expect(progress.ownedCards[card.id]).toBe(true)
    expect(progress.knowledge).toBe(1)
    expect(progress.buyCard(card)).toBe(false) // already owned
    expect(progress.knowledge).toBe(1)
  })
  it('owned card effects flow into mods', () => {
    const progress = useProgressStore()
    const game = useGameStore()
    buyEraCards(progress, game, 'cs2', 1) // cs2-generics: lpsMult 1.25
    expect(progress.mods.lpsMult).toBeCloseTo(1.25)
  })
})

describe('era gate', () => {
  it('fundRelease spends the era release cost (× releaseMult) once', () => {
    const progress = useProgressStore()
    const game = useGameStore()
    game.addLoc(ERAS[0].releaseCost)
    expect(progress.fundRelease()).toBe(true)
    expect(progress.releaseFunded).toBe(true)
    expect(progress.fundRelease()).toBe(false) // already funded
  })
  it('beginExam refuses until funded + ≥50% cards; passing advances the era', () => {
    const progress = useProgressStore()
    const game = useGameStore()
    expect(progress.beginExam()).toBe(null)
    game.addLoc(1e6)
    progress.fundRelease()
    expect(progress.beginExam()).toBe(null) // 0 cards owned
    buyEraCards(progress, game, 'cs2', 3)   // 50%
    const drawn = progress.beginExam(() => 0.5)
    expect(drawn.length).toBeGreaterThanOrEqual(3)
    const perfect = drawn.map((q) => q.answer)
    const result = progress.finishExam(perfect)
    expect(result.passed).toBe(true)
    expect(progress.examsPassed).toContain('cs2')
    expect(progress.eraIndex).toBe(1)
    expect(progress.releaseFunded).toBe(false)
    expect(progress.knowledge).toBe(3 + 3) // 3 first reads + 3 exam
    expect(progress.finishExam(perfect)).toBe(null) // exam consumed — double-fire can't skip an era
  })
  it('finishExam without an active exam is a no-op', () => {
    const progress = useProgressStore()
    expect(progress.finishExam([0, 0, 0])).toBe(null)
  })
  it('failing sets the cooldown and does not advance', () => {
    const progress = useProgressStore()
    const game = useGameStore()
    game.addLoc(1e6)
    progress.fundRelease()
    buyEraCards(progress, game, 'cs2', 3)
    const drawn = progress.beginExam(() => 0.5)
    const allWrong = drawn.map((q) => (q.answer + 1) % 4)
    const result = progress.finishExam(allWrong)
    expect(result.passed).toBe(false)
    expect(progress.eraIndex).toBe(0)
    expect(progress.lastExamFailAt).toBeGreaterThan(0)
    expect(progress.beginExam()).toBe(null) // cooldown
  })
})

describe('skills', () => {
  it('allocates within the free-Knowledge budget with rising node costs', () => {
    const progress = useProgressStore()
    progress.knowledge = 4
    expect(progress.allocateSkill('language')).toBe(true)  // costs 1
    expect(progress.allocateSkill('language')).toBe(true)  // costs 2
    expect(progress.knowledgeFree).toBe(1)
    expect(progress.allocateSkill('language')).toBe(false) // costs 3 > 1 free
    expect(progress.skills.language).toBe(2)
    expect(progress.mods.clickMult).toBeCloseTo(1.12 * 1.12)
  })
})

describe('hydrate sanitization', () => {
  it('rejects hostile junk and unknown ids', () => {
    const progress = useProgressStore()
    progress.hydrate({
      eraIndex: 99, knowledge: 'poison', releaseFunded: 'yes',
      ownedCards: { 'cs2-generics': true, 'fake-card': true },
      examsPassed: ['cs2', 'fake-era'], firstReads: { 'fake-card': true },
      skills: { language: 99, hax: 3 }, lastExamFailAt: -5,
    })
    expect(progress.eraIndex).toBe(ERAS.length - 1)
    expect(progress.knowledge).toBe(0)
    expect(progress.releaseFunded).toBe(true) // truthy coerced is fine
    expect(progress.ownedCards['fake-card']).toBeUndefined()
    expect(progress.examsPassed).toEqual(['cs2'])
    expect(progress.skills.language).toBe(5)
    expect(progress.skills.hax).toBeUndefined()
  })
  it('round-trips toSave → hydrate', () => {
    const progress = useProgressStore()
    const game = useGameStore()
    buyEraCards(progress, game, 'cs2', 2)
    progress.knowledge = 10
    progress.allocateSkill('data')
    const slice = progress.toSave()
    setActivePinia(createPinia())
    const fresh = useProgressStore()
    fresh.hydrate(slice)
    expect(fresh.ownedCards['cs2-generics']).toBe(true)
    expect(fresh.knowledge).toBe(10)
    expect(fresh.skills.data).toBe(1)
  })
})
