# Greenfield M4 — The Rewrite (Prestige) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Layer-1 prestige — the Rewrite resets the run economy while everything *learned* persists, awarding **Blueprints** spent in a permanent 5-Pattern tree; each run rolls a **client contract** modifier; save v4; plus the design-mandated headless **balance simulation** asserting slow-burn pacing bands.

**Architecture:** A new `prestige` store owns blueprints/patterns/rewrites/contract and exposes an `effects` array (CQRS, Clean Architecture, contract modifiers) consumed by `progress.mods` and `ef.throughput` through the existing `combineMods` engine — so prestige bonuses flow through every existing multiplier path with zero new math. Behavioral patterns hook three existing seams: DI → `shop.autoBuy()` on a 10 s cadence, Event Sourcing → ×2 in `meta.boot()`'s offline block, Caching → gentler constants in `game.decayCombo`. Every store gains a `rewriteReset()`; `meta.performRewrite()` orchestrates (prestige must not import meta — that would be a cycle). The balance sim drives the REAL stores headlessly in vitest (same Pinia-in-node pattern as all store tests) with a greedy bot policy.

**Tech Stack:** unchanged. No web research needed (no new educational content).

**Out of scope:** The Exit / GitHub Stars (layer 2 — the save reserves its slice), art asset generation from the manifest, leaderboard.

---

## Contracts (exact names)

- `blueprintsFor(lifetimeLoc) = Math.floor(Math.cbrt(Math.max(0, lifetimeLoc) / 1e9))` — per-RUN lifetime (resets each Rewrite). Rewrite available when pending ≥ 1 (i.e. run lifetime ≥ 1e9).
- Pattern: `{ id, name, icon, cost, desc, effects: Effect[] }` — effects use the existing EFFECT_TYPES; behavioral patterns have `effects: []` and are checked via `prestige.hasPattern(id)`. Buying SPENDS blueprints. Single-purchase each.
- Contract: `{ id, name, desc, effects: Effect[] }`. Run 0 (never rewritten) = `ct-balanced`. Each Rewrite rolls uniformly among the four non-balanced contracts (injectable rand).
- **Rewrite resets:** game (loc, lifetimeLoc, combo), shop (owned), progress (eraIndex, releaseFunded, ownedCards, activeExam, lastExamFailAt, skill ALLOCATIONS), ef (tierIndex, ownedCards). **Persists:** knowledge (budget), examsPassed (→ instant-pass Releases re-climb, already shipped), firstReads (both stores — no Knowledge re-farming), achievements, stats, blueprints/patterns/rewrites.
- Save v4: migrate v3→v4 injects `prestige: {}`; prestige slice `{ blueprints, patterns, rewrites, contract, exit: {} }` (exit reserved for layer 2).
- `progress.mods` composes `[...card effects, ...skill effects, ...prestige.effects]`; `ef.throughput` composes `[...EF card effects, ...prestige.effects]` (tpMult from the fintech contract flows in).

## Files

```
src/data/patterns.js        T1 — 5 patterns
src/data/contracts.js       T1 — 5 contracts + rollContract(rand)
src/lib/prestige.js         T1 — blueprintsFor (pure)
src/stores/prestige.js      T2 — blueprints/patterns/contract/effects + doRewrite orchestration
src/stores/{game,shop,progress,ef}.js  T2 — rewriteReset() each; mods/throughput compose prestige.effects
src/lib/save.js             T2 — SAVE_VERSION 4 + prestige slice
src/stores/meta.js          T2 — prestige in stores(); performRewrite(); T3 — Event Sourcing offline ×2
src/stores/shop.js          T3 — autoBuy()
src/stores/game.js          T3 — Caching decay constants
src/App.vue                 T3 — DI auto-buy every 10th second-tick; T4 — components
src/components/PrestigePanel.vue, RewriteModal.vue, PatternsPanel.vue  T4
src/components/ShopPanel.vue (Patterns tab), HeaderBar.vue (📐 chip)   T4
tests/prestige.test.js T1+T2 · tests/prestige-integration.test.js T3 · tests/balance.test.js T5
```

Execution: T1 → T2 → T3 → [T4, T5 parallel] → final review → deploy. Commit trailer as always.

---

### Task 1: Prestige data + formula (`data/patterns.js`, `data/contracts.js`, `lib/prestige.js`)

- [ ] **Step 1: Failing tests** — create `tests/prestige.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { blueprintsFor } from '../src/lib/prestige.js'
import { PATTERNS } from '../src/data/patterns.js'
import { CONTRACTS, rollContract } from '../src/data/contracts.js'
import { EFFECT_TYPES } from '../src/lib/modifiers.js'

describe('blueprintsFor', () => {
  it('is the floored cube root of run lifetime / 1e9', () => {
    expect(blueprintsFor(0)).toBe(0)
    expect(blueprintsFor(999_999_999)).toBe(0)
    expect(blueprintsFor(1e9)).toBe(1)
    expect(blueprintsFor(8e9)).toBe(2)
    expect(blueprintsFor(1e12)).toBe(10)
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
```

- [ ] **Step 2:** FAIL. **Step 3: `src/lib/prestige.js`:**

```js
// Blueprints awarded at a Rewrite — cube-root curve over the RUN's lifetime
// LoC (per design: each ascension meaningful, longer runs superlinear-ish).
export function blueprintsFor(lifetimeLoc) {
  const n = Number(lifetimeLoc)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.floor(Math.cbrt(n / 1e9))
}
```

- [ ] **Step 4: `src/data/patterns.js`:**

```js
// Permanent architecture Patterns, bought with Blueprints (spent, single-purchase).
// Patterns with effects flow through combineMods; behavioral ones ([] effects)
// are checked via prestige.hasPattern(id) at their integration seams.
export const PATTERNS = [
  { id: 'pat-di',                 name: 'Dependency Injection', icon: '💉', cost: 1, desc: 'Auto-buys the cheapest affordable Contributor every 10s', effects: [] },
  { id: 'pat-cqrs',               name: 'CQRS',                 icon: '⚖️', cost: 2, desc: 'Click power +75% · all Contributors +25% LoC/s',           effects: [{ type: 'clickMult', value: 1.75 }, { type: 'lpsMult', value: 1.25 }] },
  { id: 'pat-event-sourcing',     name: 'Event Sourcing',       icon: '📜', cost: 2, desc: 'Offline earnings ×2',                                      effects: [] },
  { id: 'pat-caching',            name: 'Caching',              icon: '⚡', cost: 3, desc: 'Combo decays half as fast, grace period doubled',          effects: [] },
  { id: 'pat-clean-architecture', name: 'Clean Architecture',   icon: '🏛️', cost: 4, desc: 'All Contributors ×2 LoC/s',                                effects: [{ type: 'lpsMult', value: 2.0 }] },
]
```

- [ ] **Step 5: `src/data/contracts.js`:**

```js
// Client contracts — each Rewrite run rolls one (variety per design). Run 0 is balanced.
export const CONTRACTS = [
  { id: 'ct-balanced',   name: 'Balanced Backlog',    desc: 'No modifiers — a calm client.',                          effects: [] },
  { id: 'ct-startup',    name: 'Startup Sprint',      desc: 'Click power +50%, Contributors −25% LoC/s',              effects: [{ type: 'clickMult', value: 1.5 }, { type: 'lpsMult', value: 0.75 }] },
  { id: 'ct-enterprise', name: 'Enterprise Retainer', desc: 'Contributors +50% LoC/s, click power −25%',              effects: [{ type: 'lpsMult', value: 1.5 }, { type: 'clickMult', value: 0.75 }] },
  { id: 'ct-agency',     name: 'Agency Hustle',       desc: 'Contributor costs −20%, Releases +25% dearer',           effects: [{ type: 'costMult', value: 0.8 }, { type: 'releaseMult', value: 1.25 }] },
  { id: 'ct-fintech',    name: 'Fintech Compliance',  desc: 'Persistence throughput +50%, Contributor costs +15%',    effects: [{ type: 'tpMult', value: 1.5 }, { type: 'costMult', value: 1.15 }] },
]

const ROLLABLE = CONTRACTS.filter((c) => c.id !== 'ct-balanced')

export function rollContract(rand = Math.random) {
  return ROLLABLE[Math.min(Math.floor(rand() * ROLLABLE.length), ROLLABLE.length - 1)]
}
```

- [ ] **Step 6:** PASS. **Step 7: Commit** → `feat: prestige data — patterns, contracts, blueprint formula` (+ trailer)

---

### Task 2: Prestige store + rewriteReset + save v4

**Files:** Create `src/stores/prestige.js` · Modify `src/stores/game.js`, `shop.js`, `progress.js`, `ef.js`, `src/lib/save.js`, `src/stores/meta.js` · Test: append to `tests/prestige.test.js`, modify `tests/save.test.js`

- [ ] **Step 1: Failing tests** — append to `tests/prestige.test.js`:

```js
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach } from 'vitest'
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
    game.addLoc(8e9)
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
    game.addLoc(1e9)
    expect(meta.performRewrite(() => 0)).toBe(true)
    const saved = JSON.parse(localStorage.getItem('gf_save'))
    expect(saved.prestige.blueprints).toBe(1)
    expect(saved.game.loc).toBe(0)
  })
})
```
And in `tests/save.test.js`: extend `fakeStores()` with `prestige: { state: { blueprints: 4 }, toSave() { return { ...this.state } }, hydrate(s) { this.state = { ...s } } }`, assert round-trip `save.prestige.blueprints === 4`, and add the migration test:
```js
  it('migrates a v3 save by injecting the prestige slice', () => {
    const v3 = { v: 3, savedAt: 5, game: {}, shop: {}, progress: {}, ef: {}, achievements: {}, stats: {} }
    const out = migrate(v3)
    expect(out.v).toBe(SAVE_VERSION)
    expect(out.prestige).toEqual({})
  })
```

- [ ] **Step 2:** FAIL. **Step 3: Create `src/stores/prestige.js`:**

```js
import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import { PATTERNS } from '../data/patterns.js'
import { CONTRACTS, rollContract } from '../data/contracts.js'
import { blueprintsFor } from '../lib/prestige.js'
import { useGameStore } from './game.js'
import { useShopStore } from './shop.js'
import { useProgressStore } from './progress.js'
import { useEfStore } from './ef.js'

const PATTERN_BY_ID = new Map(PATTERNS.map((p) => [p.id, p]))
const CONTRACT_BY_ID = new Map(CONTRACTS.map((c) => [c.id, c]))

function toCount(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export const usePrestigeStore = defineStore('prestige', () => {
  const blueprints = ref(0)
  const patterns = reactive({}) // { [patternId]: true } — permanent
  const rewrites = ref(0)
  const contractId = ref('ct-balanced')

  const contract = computed(() => CONTRACT_BY_ID.get(contractId.value) ?? CONTRACTS[0])
  const pendingBlueprints = computed(() => blueprintsFor(useGameStore().lifetimeLoc))

  // Everything multiplier-shaped from prestige: owned pattern effects + the
  // current contract. Consumed by progress.mods AND ef.throughput.
  const effects = computed(() => {
    const out = [...contract.value.effects]
    for (const id of Object.keys(patterns)) {
      const p = PATTERN_BY_ID.get(id)
      if (p) out.push(...p.effects)
    }
    return out
  })

  function hasPattern(id) {
    return Boolean(patterns[id])
  }

  function buyPattern(id) {
    const p = PATTERN_BY_ID.get(id)
    if (!p || patterns[id] || blueprints.value < p.cost) return false
    blueprints.value -= p.cost
    patterns[id] = true
    return true
  }

  function doRewrite(rand = Math.random) {
    const pending = pendingBlueprints.value
    if (pending < 1) return false
    blueprints.value += pending
    rewrites.value += 1
    contractId.value = rollContract(rand).id
    useGameStore().rewriteReset()
    useShopStore().rewriteReset()
    useProgressStore().rewriteReset()
    useEfStore().rewriteReset()
    return true
  }

  function toSave() {
    return { blueprints: blueprints.value, patterns: { ...patterns }, rewrites: rewrites.value, contract: contractId.value, exit: {} }
  }

  function hydrate(slice) {
    const s = slice || {}
    blueprints.value = Math.floor(toCount(s.blueprints))
    for (const k of Object.keys(patterns)) delete patterns[k]
    for (const id of Object.keys(s.patterns || {})) if (PATTERN_BY_ID.has(id)) patterns[id] = true
    rewrites.value = Math.floor(toCount(s.rewrites))
    contractId.value = CONTRACT_BY_ID.has(s.contract) ? s.contract : 'ct-balanced'
  }

  return { blueprints, patterns, rewrites, contractId, contract, pendingBlueprints, effects, hasPattern, buyPattern, doRewrite, toSave, hydrate }
})
```

- [ ] **Step 4: rewriteReset() on the four stores** (each exported in its return object):

game.js:
```js
  function rewriteReset() {
    loc.value = 0
    lifetimeLoc.value = 0
    combo.value = 0
  }
```
shop.js:
```js
  function rewriteReset() {
    for (const k of Object.keys(owned)) delete owned[k]
  }
```
progress.js (skill ALLOCATIONS reset — the knowledge budget, exams, firstReads persist):
```js
  function rewriteReset() {
    eraIndex.value = 0
    releaseFunded.value = false
    for (const k of Object.keys(ownedCards)) delete ownedCards[k]
    activeExam.value = null
    lastExamFailAt.value = 0
    for (const b of SKILL_BRANCHES) skills[b.id] = 0
  }
```
ef.js:
```js
  function rewriteReset() {
    tierIndex.value = -1
    for (const k of Object.keys(ownedCards)) delete ownedCards[k]
  }
```

- [ ] **Step 5: Compose prestige effects.** In progress.js `mods` computed, after the skills loop add:
```js
    effects.push(...usePrestigeStore().effects)
```
(with `import { usePrestigeStore } from './prestige.js'` — prestige imports progress too, but all cross-access is lazy inside computeds: the established safe pattern.) In ef.js `throughput`:
```js
    const effects = Object.keys(ownedCards).map((id) => CARD_BY_ID.get(id)?.effect).filter(Boolean)
    effects.push(...usePrestigeStore().effects)
    return currentTier.value.baseThroughput * combineMods(effects).tpMult
```
(+ import.)

- [ ] **Step 6: save v4.** save.js: `SAVE_VERSION = 4`; migration chain adds `if (save.v === 3) save = { ...save, v: 4, prestige: {} }`; `buildSave({ game, shop, progress, ef, awards, prestige })` adds `prestige: prestige.toSave()`; `applySave` adds `prestige.hydrate(save.prestige || {})`. The v1 and v3 migration tests chain to 4 — update their `out.v` expectations via `SAVE_VERSION` import (already the pattern).

- [ ] **Step 7: meta.js** — add prestige to `stores()` (import); add:
```js
  function performRewrite(rand = Math.random) {
    const prestige = usePrestigeStore()
    if (!prestige.doRewrite(rand)) return false
    saveLocal()
    syncCloud()
    return true
  }
```
(export it; `usePrestigeStore` import.)

- [ ] **Step 8:** Full suite green (111 + ~8 ≈ 119; exact reported). **Step 9: Commit** → `feat: the Rewrite — prestige store, per-store resets, save v4` (+ trailer)

---

### Task 3: Behavioral patterns (DI auto-buy, Event Sourcing, Caching)

**Files:** Modify `src/stores/shop.js`, `src/stores/game.js`, `src/stores/meta.js`, `src/App.vue` · Test: `tests/prestige-integration.test.js` (new)

- [ ] **Step 1: Failing tests:**

```js
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
```

- [ ] **Step 2:** FAIL. **Step 3: shop.js `autoBuy`:**

```js
  // DI pattern: buy the single cheapest affordable contributor. Returns its id or null.
  function autoBuy() {
    const game = useGameStore()
    let best = null
    let bestCost = Infinity
    for (const c of CONTRIBUTORS) {
      const cost = nextCostOf(c)
      if (cost <= game.loc && cost < bestCost) {
        best = c
        bestCost = cost
      }
    }
    if (!best) return null
    return buy(best) ? best.id : null
  }
```
(export it.)

- [ ] **Step 4: game.js `decayCombo` honors Caching:**

```js
  function decayCombo(dtSeconds, now = Date.now()) {
    if (combo.value <= 0) return
    const cached = usePrestigeStore().hasPattern('pat-caching')
    const grace = cached ? 2_000 : 1_000
    const rate = cached ? 30 : 60
    if (now - lastClickAt > grace) {
      combo.value = Math.max(0, combo.value - rate * dtSeconds)
    }
  }
```
(+ import `usePrestigeStore`.)

- [ ] **Step 5: meta.js offline ×2** — export a pure helper and use it in boot's offline block:

```js
export function offlineMultiplier(prestige) {
  return prestige.hasPattern('pat-event-sourcing') ? 2 : 1
}
```
and in the boot offline block: `const gain = shop.lps * effSec * offlineMultiplier(usePrestigeStore())`.

- [ ] **Step 6: App.vue DI cadence** — in the 1 s interval callback (which already does events.tick + every-5th awards.evaluate), add every-10th: `if (tickCount % 10 === 0 && prestige.hasPattern('pat-di')) shop.autoBuy()` (script: import/use `usePrestigeStore` + `useShopStore` if not already).

- [ ] **Step 7:** Full suite green. **Step 8: Commit** → `feat: behavioral patterns — DI auto-buy, Event Sourcing offline, Caching combo` (+ trailer)

---

### Task 4: Prestige UI (PrestigePanel, RewriteModal, PatternsPanel, tab, chip)

- [ ] **Step 1: `src/components/RewriteModal.vue`:**

```vue
<script setup>
import { useMetaStore } from '../stores/meta.js'
import { usePrestigeStore } from '../stores/prestige.js'

const emit = defineEmits(['close'])
const meta = useMetaStore()
const prestige = usePrestigeStore()

function confirm() {
  meta.performRewrite()
  emit('close')
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal card" role="dialog" aria-modal="true" aria-label="Greenfield rewrite">
      <h2>🌱 Rewrite from scratch?</h2>
      <p>Ship this codebase and start a greenfield rewrite for <strong class="loc-counter">📐 {{ prestige.pendingBlueprints }} Blueprints</strong>.</p>
      <p class="muted">Resets: LoC, Contributors, era progress, Feature Cards, EF stack, Skill allocations.<br />
      Keeps: Knowledge, passed Exams (instant-pass their Releases), Achievements, Blueprints &amp; Patterns.</p>
      <p class="muted">A new client contract is rolled for the next run.</p>
      <div class="modal-actions-row">
        <button class="btn" @click="emit('close')">Keep coding</button>
        <button class="btn btn-primary" @click="confirm">🚀 Rewrite</button>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: `src/components/PrestigePanel.vue`** (left pane, under EraPanel; visible once relevant):

```vue
<script setup>
import { ref } from 'vue'
import { usePrestigeStore } from '../stores/prestige.js'
import RewriteModal from './RewriteModal.vue'

const prestige = usePrestigeStore()
const confirming = ref(false)
</script>

<template>
  <div v-if="prestige.pendingBlueprints >= 1 || prestige.rewrites > 0" class="era-panel card">
    <RewriteModal v-if="confirming" @close="confirming = false" />
    <p class="ef-line"><strong>📐 The Rewrite</strong> <span class="muted">· run #{{ prestige.rewrites + 1 }} · {{ prestige.contract.name }}</span></p>
    <p class="muted ef-line">{{ prestige.contract.desc }}</p>
    <button class="btn btn-primary" :disabled="prestige.pendingBlueprints < 1" @click="confirming = true">
      🌱 Rewrite — bank {{ prestige.pendingBlueprints }} Blueprint{{ prestige.pendingBlueprints === 1 ? '' : 's' }}
    </button>
    <p v-if="prestige.pendingBlueprints < 1" class="muted ef-line">Reach 1B run LoC to unlock the next Rewrite.</p>
  </div>
</template>
```

- [ ] **Step 3: `src/components/PatternsPanel.vue`** (Patterns tab body):

```vue
<script setup>
import { usePrestigeStore } from '../stores/prestige.js'
import { PATTERNS } from '../data/patterns.js'

const prestige = usePrestigeStore()
</script>

<template>
  <div class="shop-list">
    <p class="knowledge-line">📐 Blueprints: <strong>{{ prestige.blueprints }}</strong> · earned via the Rewrite (∛ of run LoC / 1B)</p>
    <p class="muted">Patterns are permanent — they survive every Rewrite.</p>
    <div v-for="p in PATTERNS" :key="p.id" class="card skill-branch">
      <div class="skill-head">
        <span class="skill-icon">{{ p.icon }}</span>
        <div class="skill-info">
          <strong>{{ p.name }}</strong>
          <span class="muted">{{ p.desc }}</span>
        </div>
        <button
          v-if="!prestige.patterns[p.id]"
          class="btn"
          :disabled="prestige.blueprints < p.cost"
          @click="prestige.buyPattern(p.id)"
        >{{ p.cost }} 📐</button>
        <span v-else class="feature-owned">✓ built</span>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 4: wiring.** ShopPanel.vue: TABS gains `{ id: 'patterns', label: 'Patterns' }` last + `<PatternsPanel v-else-if="active === 'patterns'" />`. App.vue: import PrestigePanel, place `<PrestigePanel />` directly under `<EraPanel />`. HeaderBar.vue: after the 💾 chip add `<span v-if="prestige.blueprints > 0 || prestige.rewrites > 0" class="muted">📐 {{ prestige.blueprints }}</span>` (+ store import/use).
- [ ] **Step 5: styles append:** `.modal-actions-row { display: flex; gap: 10px; justify-content: flex-end; }`
- [ ] **Step 6:** suite + build + dev smoke 200. **Step 7: Commit** → `feat: prestige UI — rewrite panel/modal, patterns tab, blueprint chip` (+ trailer)

---

### Task 5: Balance simulation (design-mandated)

**Files:** Create `tests/balance.test.js`. The sim drives the REAL stores (same node+Pinia pattern as every store test) with a greedy bot. Bands are WIDE sanity rails, not tight targets — if a band fails, REPORT the arrival table and stop; tuning constants is a controller decision, never silent.

- [ ] **Step 1: Write `tests/balance.test.js`:**

```js
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

describe('balance simulation (slow-burn bands — WIDE sanity rails)', () => {
  it('a daily player progresses inside the designed pacing bands', () => {
    const r = simulate(120)
    console.table(Object.entries(r.arrivals).map(([era, day]) => ({ era, day: day.toFixed(2) })))
    console.log('first rewrite day:', r.firstRewriteDay, 'final era:', r.finalEra, 'lifetime:', r.lifetime.toExponential(2))
    // early eras: minutes-to-hours
    expect(r.arrivals['cs3']).toBeLessThanOrEqual(1)
    expect(r.arrivals['cs5']).toBeLessThanOrEqual(3)
    // mid eras: days
    expect(r.arrivals['cs8'] ?? Infinity).toBeLessThanOrEqual(30)
    expect(r.arrivals['cs8'] ?? 0).toBeGreaterThanOrEqual(0.05)
    // the full climb: weeks, not forever — and not a weekend
    expect(r.arrivals['cs14'] ?? Infinity).toBeLessThanOrEqual(120)
    expect(r.arrivals['cs14'] ?? 0).toBeGreaterThanOrEqual(1)
    // first Rewrite within the first two weeks of daily play
    expect(r.firstRewriteDay).not.toBe(null)
    expect(r.firstRewriteDay).toBeLessThanOrEqual(14)
  }, 120_000)
})
```

- [ ] **Step 2:** Run `npx vitest run tests/balance.test.js` (long: up to ~2 min budgeted). If the bands FAIL: print the arrival table in your report, do NOT tune any constants, report DONE_WITH_CONCERNS with the numbers — the controller decides tuning.
- [ ] **Step 3:** Full suite + commit → `test: headless balance simulation with slow-burn pacing bands` (+ trailer)

---

### Task 6: Final review + deploy

Full suite + build + clean tree → final whole-M4 quality review (controller dispatches) → push → CI watch → live bundle spot-check (`pat-cqrs`, `Blueprints`, `ct-fintech` in served JS) → owner checklist: reach 1B run LoC → Rewrite → verify reset+persistence, buy a Pattern, watch DI auto-buy.

## Self-review notes (applied)

- prestige↔progress import cycle is lazy-safe (computed-time access, the established pattern; prestige.effects never reads progress).
- Achievements intentionally evaluate against PER-RUN lifetimeLoc after a Rewrite — already-unlocked ones persist; re-climbing re-satisfies thresholds naturally.
- No Knowledge farming post-Rewrite: card first-reads persist in both stores; exams auto-advance via fundRelease (no exam, no +3); finishExam unreachable for certified eras.
- Layer-2 reserve: `exit: {}` written in every v4 prestige slice.
- Balance bot uses the REAL stores — any future economy change that breaks pacing fails this test loudly.
