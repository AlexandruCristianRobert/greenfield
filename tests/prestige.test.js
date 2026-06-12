import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { blueprintsFor } from '../src/lib/prestige.js'
import { PATTERNS } from '../src/data/patterns.js'
import { CONTRACTS, rollContract } from '../src/data/contracts.js'
import { EFFECT_TYPES } from '../src/lib/modifiers.js'
import { usePrestigeStore } from '../src/stores/prestige.js'
import { useGameStore } from '../src/stores/game.js'
import { useShopStore } from '../src/stores/shop.js'
import { useProgressStore } from '../src/stores/progress.js'
import { useEfStore } from '../src/stores/ef.js'
import { useMetaStore } from '../src/stores/meta.js'
import { featuresOf } from '../src/data/featuresLanguage.js'

beforeEach(() => {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  }
  setActivePinia(createPinia())
})

describe('blueprintsFor', () => {
  it('is the floored cube root of run lifetime / 1e14', () => {
    expect(blueprintsFor(0)).toBe(0)
    expect(blueprintsFor(1e14 - 1)).toBe(0)
    expect(blueprintsFor(1e14)).toBe(1)
    expect(blueprintsFor(8e14)).toBe(2)
    expect(blueprintsFor(1e17)).toBe(10)
    expect(blueprintsFor(-5)).toBe(0)
    expect(blueprintsFor(NaN)).toBe(0)
  })
})

describe('PATTERNS', () => {
  it('has the five designed patterns with valid effects and positive costs', () => {
    expect(PATTERNS.map((p) => p.id)).toEqual(['pat-di', 'pat-cqrs', 'pat-event-sourcing', 'pat-caching', 'pat-clean-architecture'])
    for (const p of PATTERNS) {
      expect(p.cost).toBeGreaterThan(0)
      for (const e of p.effects) expect(EFFECT_TYPES).toContain(e.type)
    }
  })
})

describe('CONTRACTS', () => {
  it('has balanced + four modifier contracts; rollContract never returns balanced', () => {
    expect(CONTRACTS.map((c) => c.id)).toEqual(['ct-balanced', 'ct-startup', 'ct-enterprise', 'ct-agency', 'ct-fintech'])
    expect(CONTRACTS[0].effects).toEqual([])
    for (let r = 0; r < 1; r += 0.26) {
      const rolled = rollContract(() => r)
      expect(rolled.id).not.toBe('ct-balanced')
    }
  })
})

describe('prestige store', () => {
  it('pendingBlueprints tracks run lifetime; doRewrite below threshold refuses', () => {
    const prestige = usePrestigeStore()
    expect(prestige.pendingBlueprints).toBe(0)
    expect(prestige.doRewrite(() => 0)).toBe(false)
  })
  it('doRewrite banks blueprints, rolls a contract, resets run state, keeps learning', () => {
    const prestige = usePrestigeStore()
    const game = useGameStore()
    const shop = useShopStore()
    const progress = useProgressStore()
    const ef = useEfStore()
    // build a run worth 8 blueprints with some owned state
    game.addLoc(512e14)
    shop.owned['junior'] = 30
    const card = featuresOf('cs2')[0]
    progress.hydrate({ eraIndex: 4, examsPassed: ['cs2', 'cs3'], knowledge: 12, releaseFunded: true, ownedCards: { [card.id]: true }, firstReads: { [card.id]: true }, skills: { language: 2, data: 0, performance: 0, tooling: 0 } })
    ef.hydrate({ tierIndex: 0, ownedCards: { 'ef6-async-queries': true }, firstReads: { 'ef6-async-queries': true } })
    expect(prestige.pendingBlueprints).toBe(8)
    expect(prestige.doRewrite(() => 0)).toBe(true)
    // banked + rolled
    expect(prestige.blueprints).toBe(8)
    expect(prestige.rewrites).toBe(1)
    expect(prestige.contract.id).not.toBe('ct-balanced')
    // run state reset
    expect(game.loc).toBe(0)
    expect(game.lifetimeLoc).toBe(0)
    expect(shop.countOf('junior')).toBe(0)
    expect(progress.eraIndex).toBe(0)
    expect(progress.releaseFunded).toBe(false)
    expect(progress.ownedCards[card.id]).toBeUndefined()
    expect(progress.skills.language).toBe(0)
    expect(ef.tierIndex).toBe(-1)
    expect(ef.ownedCards['ef6-async-queries']).toBeUndefined()
    // learning persists
    expect(progress.knowledge).toBe(12)
    expect(progress.examsPassed).toEqual(['cs2', 'cs3'])
    expect(progress.firstReads[card.id]).toBe(true)
    expect(ef.firstReads['ef6-async-queries']).toBe(true)
  })
  it('buyPattern spends blueprints once; pattern and contract effects reach mods and throughput', () => {
    const prestige = usePrestigeStore()
    const progress = useProgressStore()
    prestige.hydrate({ blueprints: 3, rewrites: 1, contract: 'ct-startup' })
    expect(prestige.buyPattern('pat-cqrs')).toBe(true) // cost 2
    expect(prestige.blueprints).toBe(1)
    expect(prestige.buyPattern('pat-cqrs')).toBe(false) // owned
    expect(prestige.buyPattern('pat-clean-architecture')).toBe(false) // cost 4 > 1
    // CQRS 1.75 × startup 1.5 on clicks; CQRS 1.25 × startup 0.75 on lps
    expect(progress.mods.clickMult).toBeCloseTo(1.75 * 1.5)
    expect(progress.mods.lpsMult).toBeCloseTo(1.25 * 0.75)
  })
  it('hydrate sanitizes hostile slices', () => {
    const prestige = usePrestigeStore()
    prestige.hydrate({ blueprints: 'x', patterns: { 'pat-di': true, fake: true }, rewrites: -3, contract: 'ct-fake' })
    expect(prestige.blueprints).toBe(0)
    expect(prestige.patterns['fake']).toBeUndefined()
    expect(prestige.patterns['pat-di']).toBe(true)
    expect(prestige.rewrites).toBe(0)
    expect(prestige.contract.id).toBe('ct-balanced')
  })
  it('meta.performRewrite persists the reset state', async () => {
    const meta = useMetaStore()
    const game = useGameStore()
    game.addLoc(1e14)
    expect(meta.performRewrite(() => 0)).toBe(true)
    const saved = JSON.parse(localStorage.getItem('gf_save'))
    expect(saved.prestige.blueprints).toBe(1)
    expect(saved.game.loc).toBe(0)
  })
})
