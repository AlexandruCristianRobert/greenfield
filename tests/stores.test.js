import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../src/stores/game.js'
import { useShopStore } from '../src/stores/shop.js'
import { CONTRIBUTORS } from '../src/data/contributors.js'
import { useProgressStore } from '../src/stores/progress.js'
import { featuresOf } from '../src/data/featuresLanguage.js'

beforeEach(() => setActivePinia(createPinia()))

describe('game store', () => {
  it('click adds clickPower to loc and lifetimeLoc', () => {
    const game = useGameStore()
    game.click()
    game.click()
    expect(game.loc).toBeCloseTo(2.06) // first click ×1.02 combo, second ×1.04
    expect(game.lifetimeLoc).toBeCloseTo(2.06)
  })
  it('spend refuses overdraft and deducts otherwise (lifetime untouched)', () => {
    const game = useGameStore()
    game.addLoc(100)
    expect(game.spend(150)).toBe(false)
    expect(game.spend(40)).toBe(true)
    expect(game.loc).toBe(60)
    expect(game.lifetimeLoc).toBe(100)
  })
  it('tick adds lps × dt and ignores non-positive dt', () => {
    const game = useGameStore()
    const shop = useShopStore()
    shop.owned['junior'] = 10 // 10 × 1 LoC/s
    game.tick(2.5)
    expect(game.loc).toBeCloseTo(25)
    game.tick(0)
    game.tick(-5)
    expect(game.loc).toBeCloseTo(25)
  })
  it('hydrate restores a toSave round-trip', () => {
    const game = useGameStore()
    game.addLoc(77)
    const slice = game.toSave()
    setActivePinia(createPinia())
    const fresh = useGameStore()
    fresh.hydrate(slice)
    expect(fresh.loc).toBe(77)
    expect(fresh.lifetimeLoc).toBe(77)
  })
  it('hydrate sanitizes hostile or corrupt save data', () => {
    const game = useGameStore()
    game.hydrate({ loc: 'poison', lifetimeLoc: Infinity })
    expect(game.loc).toBe(0)
    expect(game.lifetimeLoc).toBe(0)
    game.hydrate({ loc: -50, lifetimeLoc: NaN })
    expect(game.loc).toBe(0)
    expect(game.lifetimeLoc).toBe(0)
  })
})

describe('shop store', () => {
  it('buy deducts the current cost, increments owned, and raises the next cost', () => {
    const game = useGameStore()
    const shop = useShopStore()
    const intern = CONTRIBUTORS[0]
    game.addLoc(100)
    expect(shop.buy(intern)).toBe(true)
    expect(shop.countOf('intern')).toBe(1)
    expect(game.loc).toBe(85) // 100 − 15
    expect(shop.nextCostOf(intern)).toBe(18) // ceil(15 × 1.15)
  })
  it('buy fails without enough LoC and changes nothing', () => {
    const game = useGameStore()
    const shop = useShopStore()
    game.addLoc(5)
    expect(shop.buy(CONTRIBUTORS[0])).toBe(false)
    expect(shop.countOf('intern')).toBe(0)
    expect(game.loc).toBe(5)
  })
  it('lps reflects owned contributors', () => {
    const shop = useShopStore()
    expect(shop.lps).toBe(0)
    shop.owned['junior'] = 2
    shop.owned['senior'] = 1
    expect(shop.lps).toBe(10) // 2×1 + 1×8
  })
  it('hydrate replaces owned counts wholesale', () => {
    const shop = useShopStore()
    shop.owned['intern'] = 5
    shop.hydrate({ owned: { junior: 2 } })
    expect(shop.countOf('intern')).toBe(0)
    expect(shop.countOf('junior')).toBe(2)
  })
  it('hydrate drops junk owned entries and floors fractional counts', () => {
    const shop = useShopStore()
    shop.hydrate({ owned: { junior: '3', senior: 2.9, intern: -4, ghost: 'NaN' } })
    expect(shop.countOf('junior')).toBe(3)
    expect(shop.countOf('senior')).toBe(2)
    expect(shop.countOf('intern')).toBe(0)
    expect(shop.countOf('ghost')).toBe(0)
    expect(shop.lps).toBeGreaterThan(0)
  })
})

describe('modifier integration', () => {
  it('click power scales with clickMult mods', () => {
    const game = useGameStore()
    const progress = useProgressStore()
    progress.knowledge = 1
    progress.allocateSkill('language') // clickMult ×1.12
    game.click()
    expect(game.loc).toBeCloseTo(1 * 1.12 * 1.02) // first click combo ×1.02
  })
  it('lps scales with lpsMult mods', () => {
    const game = useGameStore()
    const shop = useShopStore()
    const progress = useProgressStore()
    shop.owned['junior'] = 10
    const generics = featuresOf('cs2')[0] // lpsMult 1.25
    game.addLoc(generics.cost)
    progress.buyCard(generics)
    expect(shop.lps).toBeCloseTo(10 * 1.25)
  })
  it('contributor costs scale with costMult mods', () => {
    const shop = useShopStore()
    const progress = useProgressStore()
    progress.knowledge = 1
    progress.allocateSkill('performance') // costMult ×0.96
    expect(shop.nextCostOf(CONTRIBUTORS[1])).toBe(96) // junior: 100 × 0.96 — a value that actually differs unmodified
  })
})
