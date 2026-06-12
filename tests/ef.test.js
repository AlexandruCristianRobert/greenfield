import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEfStore } from '../src/stores/ef.js'
import { useGameStore } from '../src/stores/game.js'
import { useShopStore } from '../src/stores/shop.js'
import { useProgressStore } from '../src/stores/progress.js'
import { EF_TIERS } from '../src/data/ef.js'
import { efFeaturesOf } from '../src/data/efFeatures.js'

beforeEach(() => setActivePinia(createPinia()))

describe('EF tier purchases', () => {
  it('starts with no tier, dataMult 1, throughput 0', () => {
    const ef = useEfStore()
    expect(ef.tierIndex).toBe(-1)
    expect(ef.dataMult).toBe(1)
    expect(ef.throughput).toBe(0)
  })
  it('blocks the next tier until its era is reached, then sells it once', () => {
    const ef = useEfStore()
    const game = useGameStore()
    const progress = useProgressStore()
    game.addLoc(1e7)
    expect(ef.nextTierUnlocked).toBe(false) // ef6 needs cs5 (era index 3)
    expect(ef.buyNextTier()).toBe(false)
    progress.hydrate({ eraIndex: 3 })
    expect(ef.nextTierUnlocked).toBe(true)
    expect(ef.buyNextTier()).toBe(true)
    expect(ef.tierIndex).toBe(0)
    expect(game.loc).toBe(1e7 - EF_TIERS[0].cost)
  })
  it('EF cards multiply throughput and grant first-read Knowledge', () => {
    const ef = useEfStore()
    const game = useGameStore()
    const progress = useProgressStore()
    progress.hydrate({ eraIndex: 3 })
    game.addLoc(2e6)
    ef.buyNextTier()
    const card = efFeaturesOf('ef6')[0] // tpMult 1.6
    expect(ef.buyCard(card)).toBe(true)
    expect(ef.throughput).toBeCloseTo(30 * 1.6)
    expect(progress.knowledge).toBe(1)
    expect(ef.buyCard(card)).toBe(false) // owned
  })
  it('ratio caps at 1 and dataMult spans 1→3', () => {
    const ef = useEfStore()
    const game = useGameStore()
    const shop = useShopStore()
    const progress = useProgressStore()
    progress.hydrate({ eraIndex: 3 })
    game.addLoc(1e6)
    ef.buyNextTier() // throughput 30
    shop.owned['junior'] = 10 // baseLps 10
    expect(ef.ratio).toBe(1) // 30 ≥ 10
    expect(ef.dataMult).toBe(3)
    shop.owned['junior'] = 30 // baseLps 60 (30 × 1 × milestone ×2) → ratio 0.5
    expect(ef.ratio).toBeCloseTo(0.5)
    expect(ef.dataMult).toBeCloseTo(2)
    expect(shop.lps).toBeCloseTo(60 * 2) // lps = baseLps × dataMult
  })
  it('hydrate sanitizes hostile slices', () => {
    const ef = useEfStore()
    ef.hydrate({ tierIndex: 99, ownedCards: { 'ef6-async-queries': true, fake: true }, firstReads: { fake: true } })
    expect(ef.tierIndex).toBe(EF_TIERS.length - 1)
    expect(ef.ownedCards['fake']).toBeUndefined()
    ef.hydrate({ tierIndex: 'junk' })
    expect(ef.tierIndex).toBe(-1)
  })
})
