import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePrestigeStore } from '../src/stores/prestige.js'
import { useGameStore } from '../src/stores/game.js'
import { useShopStore } from '../src/stores/shop.js'

beforeEach(() => setActivePinia(createPinia()))

describe('DI auto-buy', () => {
  it('autoBuy purchases the cheapest affordable contributor and reports it', () => {
    const game = useGameStore()
    const shop = useShopStore()
    game.addLoc(20)
    expect(shop.autoBuy()).toBe('intern') // 15 LoC
    expect(shop.countOf('intern')).toBe(1)
    expect(shop.autoBuy()).toBe(null) // 5 left < next intern (18) and < junior (100)
  })
})

describe('Caching pattern', () => {
  it('halves combo decay and doubles the grace period', () => {
    const prestige = usePrestigeStore()
    const game = useGameStore()
    for (let i = 0; i < 10; i++) game.click() // combo 20
    const now = Date.now()
    game.decayCombo(0.1, now + 1_500) // past 1s grace, no pattern: −6
    expect(game.combo).toBeCloseTo(14)
    prestige.hydrate({ patterns: { 'pat-caching': true } })
    game.decayCombo(0.1, now + 1_500) // within DOUBLED grace (2s): no decay
    expect(game.combo).toBeCloseTo(14)
    game.decayCombo(0.1, now + 2_500) // past 2s grace, halved rate: −3
    expect(game.combo).toBeCloseTo(11)
  })
})

describe('Event Sourcing pattern', () => {
  it('doubles the offline multiplier helper', async () => {
    const prestige = usePrestigeStore()
    const { offlineMultiplier } = await import('../src/stores/meta.js')
    expect(offlineMultiplier(prestige)).toBe(1)
    prestige.hydrate({ patterns: { 'pat-event-sourcing': true } })
    expect(offlineMultiplier(prestige)).toBe(2)
  })
})
