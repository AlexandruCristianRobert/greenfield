import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../src/stores/game.js'
import { useShopStore } from '../src/stores/shop.js'
import { useProgressStore } from '../src/stores/progress.js'
import { useEfStore } from '../src/stores/ef.js'
import { usePrestigeStore } from '../src/stores/prestige.js'
import { CONTRIBUTORS } from '../src/data/contributors.js'
import { ERAS } from '../src/data/eras.js'
import { SKILL_BRANCHES } from '../src/data/skills.js'
import { EF_TIERS } from '../src/data/ef.js'
import { efFeaturesOf } from '../src/data/efFeatures.js'

// Greedy daily-player bot: 2h active (5 clicks/s, buys by priority), 22h offline
// (capped like the real game: 2h + 2h×tooling, Event Sourcing ×2 if owned).
// Steps are 1 simulated second during active play.
function simulate(maxDays) {
  setActivePinia(createPinia())
  const game = useGameStore()
  const shop = useShopStore()
  const progress = useProgressStore()
  const ef = useEfStore()
  const prestige = usePrestigeStore()

  const arrivals = {} // eraId -> day
  let firstRewriteDay = null
  arrivals[ERAS[0].id] = 0

  function buyPriorities() {
    // 1. fund release / instant-advance when affordable
    if (!progress.allErasDone && game.loc >= progress.releaseCost) {
      if (progress.releaseFunded || progress.ownedEraCount * 2 >= progress.eraFeatures.length || progress.examsPassed.includes(progress.currentEra.id)) {
        progress.fundRelease()
      }
    }
    // 2. pass the exam the instant it's eligible (bot has perfect knowledge)
    if (progress.releaseFunded) {
      const drawn = progress.beginExam(() => 0.5)
      if (drawn) progress.finishExam(drawn.map((q) => q.answer))
    }
    // 3. era cards (cheapest unowned first)
    for (const card of progress.eraFeatures) {
      if (!progress.ownedCards[card.id] && game.loc >= card.cost * 2) progress.buyCard(card)
    }
    // 4. EF: adopt/upgrade + cards
    if (ef.nextTier && ef.nextTierUnlocked && game.loc >= ef.nextTier.cost * 2) ef.buyNextTier()
    if (ef.tierIndex >= 0) {
      for (let t = 0; t <= ef.tierIndex; t++) {
        for (const card of efFeaturesOf(EF_TIERS[t].id)) {
          if (!ef.ownedCards[card.id] && game.loc >= card.cost * 2) ef.buyCard(card)
        }
      }
    }
    // 5. contributors: cheapest affordable, spending down to half bank
    let guard = 0
    while (guard++ < 50) {
      const id = shop.autoBuy()
      if (!id) break
    }
    // 6. skills round-robin
    for (const b of SKILL_BRANCHES) progress.allocateSkill(b.id)
  }

  for (let day = 0; day < maxDays; day++) {
    // active: 2h in 1s steps
    for (let s = 0; s < 7200; s++) {
      for (let c = 0; c < 5; c++) game.click()
      game.tick(1)
      if (s % 10 === 0) buyPriorities()
      const eraId = progress.currentEra.id
      if (!(eraId in arrivals)) arrivals[eraId] = day + s / 86400
      if (firstRewriteDay === null && prestige.pendingBlueprints >= 1) firstRewriteDay = day + s / 86400
    }
    // offline: 22h, capped exactly like meta.boot
    const capSec = (2 + 2 * (progress.skills.tooling || 0)) * 3600
    const effSec = Math.min(22 * 3600, capSec)
    game.addLoc(shop.lps * effSec * (prestige.hasPattern('pat-event-sourcing') ? 2 : 1))
    if (firstRewriteDay === null && prestige.pendingBlueprints >= 1) firstRewriteDay = day + 1
    const eraId = progress.currentEra.id
    if (!(eraId in arrivals)) arrivals[eraId] = day + 1
    if (progress.allErasDone && firstRewriteDay !== null) break
  }
  return { arrivals, firstRewriteDay, finalEra: progress.currentEra.id, lps: shop.lps, lifetime: game.lifetimeLoc }
}

describe('balance simulation (slow-burn bands — design-derived targets)', () => {
  it('a daily player progresses inside the designed pacing bands', () => {
    const r = simulate(120)
    console.table(Object.entries(r.arrivals).map(([era, day]) => ({ era, day: day.toFixed(3) })))
    console.log('first rewrite day:', r.firstRewriteDay, 'final era:', r.finalEra, 'lifetime:', r.lifetime.toExponential(2))
    // bot = fastest-possible player, so human pace ≈ 2–4× slower
    expect(r.arrivals['cs3']).toBeLessThanOrEqual(0.1)
    expect(r.arrivals['cs7'] ?? Infinity).toBeLessThanOrEqual(2)
    expect(r.arrivals['cs8'] ?? Infinity).toBeLessThanOrEqual(5)
    expect(r.arrivals['cs8'] ?? 0).toBeGreaterThanOrEqual(0.04)
    expect(r.arrivals['cs11'] ?? Infinity).toBeLessThanOrEqual(21)
    expect(r.arrivals['cs11'] ?? 0).toBeGreaterThanOrEqual(0.5)
    expect(r.arrivals['cs14'] ?? Infinity).toBeLessThanOrEqual(90)
    expect(r.arrivals['cs14'] ?? 0).toBeGreaterThanOrEqual(5)
    expect(r.firstRewriteDay).not.toBe(null)
    expect(r.firstRewriteDay).toBeLessThanOrEqual(14)
    expect(r.firstRewriteDay).toBeGreaterThanOrEqual(0.5)
  }, 120_000)
})
