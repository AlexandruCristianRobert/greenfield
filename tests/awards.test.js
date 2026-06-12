import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAwardsStore } from '../src/stores/awards.js'
import { useGameStore } from '../src/stores/game.js'
import { useShopStore } from '../src/stores/shop.js'

beforeEach(() => setActivePinia(createPinia()))

describe('awards store', () => {
  it('evaluate unlocks reached achievements exactly once and queues toasts', () => {
    const awards = useAwardsStore()
    const game = useGameStore()
    game.addLoc(1e3)
    awards.evaluate()
    expect(awards.unlocked['ach-loc-1']).toBe(true)
    expect(awards.toastQueue.length).toBe(1)
    awards.evaluate()
    expect(awards.toastQueue.length).toBe(1) // no re-queue
  })
  it('achMult compounds 1.01 per unlock and feeds lps', () => {
    const awards = useAwardsStore()
    const shop = useShopStore()
    awards.hydrate({ unlocked: { 'ach-loc-1': true, 'ach-loc-2': true } }, {})
    expect(awards.achMult).toBeCloseTo(1.01 * 1.01)
    shop.owned['junior'] = 10
    expect(shop.lps).toBeCloseTo(10 * awards.achMult)
  })
  it('hydrate drops unknown achievement ids and junk stats', () => {
    const awards = useAwardsStore()
    awards.hydrate({ unlocked: { fake: true, 'ach-pr-1': true } }, { prsCorrect: 'x', maxCombo: 7, hax: 9 })
    expect(awards.unlocked['fake']).toBeUndefined()
    expect(awards.unlocked['ach-pr-1']).toBe(true)
    expect(awards.stats.prsCorrect).toBe(0)
    expect(awards.stats.maxCombo).toBe(7)
    expect(awards.stats.hax).toBeUndefined()
  })
})

describe('combo', () => {
  it('clicks build combo (+2, cap 100) and multiply effectiveClick', () => {
    const game = useGameStore()
    for (let i = 0; i < 10; i++) game.click()
    expect(game.combo).toBe(20)
    expect(game.effectiveClick).toBeCloseTo(1 * 1.2)
  })
  it('combo decays in tick after the idle grace period', () => {
    const game = useGameStore()
    for (let i = 0; i < 10; i++) game.click()
    game.decayCombo(1.0, Date.now() + 2_000) // 1s of decay at 60/s, after grace
    expect(game.combo).toBe(0)
  })
  it('clicking reports maxCombo to awards stats', () => {
    const game = useGameStore()
    const awards = useAwardsStore()
    game.click()
    expect(awards.stats.maxCombo).toBe(2)
  })
})
