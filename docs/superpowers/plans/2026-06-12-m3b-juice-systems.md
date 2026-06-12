# Greenfield M3b — Juice Systems Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The session-to-session juice layer — PR events (snippet quizzes → production frenzies), a flow-state combo meter, golden NuGet drops, 26 achievements (+1% each), and offline progress ("CI ran overnight") with a Tooling-extended cap.

**Architecture:** A new `events` store owns transient buffs and the PR/NuGet spawn scheduler (driven by a 1 s App tick, injectable `rand`/`now` for tests); a new `awards` store owns achievements + stats (slices reserved in save v3 — **no version bump**) and exposes `achMult = 1.01^unlocked`. The lps chain becomes `baseLps × ef.dataMult × awards.achMult × events.buffMult` (emission for the EF ratio stays `baseLps` — buffs never distort persistence). Combo lives in the game store (click-built, tick-decayed) and multiplies clicks only. Offline gains compute in `meta.boot()` from the applied save's `savedAt`, capped at `(2 + 2×tooling) hours`.

**Tech Stack:** unchanged. PR bank content (39 snippet questions, 3/era × 13 eras) is web-researched + adversarially fact-checked like all content.

---

## Contracts

- Buff: `{ kind: 'frenzy'|'conflict', mult, until }` — `FRENZY_MULT 7`, `CONFLICT_MULT 0.5`, both 30 000 ms. `events.buffMult` is a plain number ref maintained by `events.tick(now)`.
- Spawns: PR gap 180–360 s, toast lifetime 20 s; NuGet gap 120–300 s, lifetime 12 s. Never two offers at once of the same kind; answering/expiry schedules the next.
- PR question: `{ id: 'pr-cs3-01', era, text, snippet, options: [4], answer }` — 3 per era, answerable by someone who learned that era's cards; pool filtered to `era index ≤ progress.eraIndex`.
- PR rewards: correct → frenzy buff + `progress.addKnowledge(1)` + `stats.prsCorrect++`; wrong → conflict buff. NuGet click: 70% frenzy, else instant LoC `max(shop.lps × 600, game.effectiveClick × 100)`; `stats.nuggetsClicked++`.
- Combo: +2 per click, cap 100; decays 60/s after 1 s without clicks; `comboMult = 1 + combo/100` (≤ ×2) multiplies `effectiveClick` only. `awards.noteCombo(combo)` maintains `stats.maxCombo`.
- Achievements: pure `check(ctx)` predicates over `ctx = { lifetimeLoc, totalContributors, maxSingleContributor, cardsOwned, examsPassed, skillsAllocated, maxBranchNodes, maxCombo, nuggetsClicked, prsCorrect, efTierIndex }`; `awards.evaluate()` runs every 5 s from App; unlocks are permanent, queued to `toastQueue`.
- Save: v3 slices `achievements: { unlocked }` and `stats` now owned by `awards` — `buildSave` swaps its `{}` literals for `awards.achievementsToSave()` / `awards.statsToSave()`; `applySave` calls `awards.hydrate(save.achievements || {}, save.stats || {})`.
- Offline: in `boot()` after a save is applied — `away > 60 s` → gain `shop.lps × min(away, cap)`, `cap = (2 + 2×progress.skills.tooling) × 3600`; sets `meta.offlineReport = { gain, seconds, capped }`; App shows OfflineModal once. Skills blurb for tooling becomes `'−6% Release funding cost · +2h offline cap per point'`.

## Files

```
src/data/achievements.js       T1 — 26 entries with check(ctx)
src/data/content/prs-cs2-7.js  T1 skeleton → T4 (web) fills
src/data/content/prs-cs8-14.js T1 skeleton → T5 (web) fills
src/data/prs.js                T1 — PR_QUESTIONS aggregator (frozen) + prPoolFor(eraIndex, ERAS)
src/data/skills.js             T1 — tooling blurb update
src/stores/events.js           T2 — buffs + spawn scheduler
src/stores/awards.js           T3 — achievements/stats/achMult
src/stores/game.js             T3 — combo + effectiveClick × comboMult
src/stores/shop.js             T3 — lps × achMult × buffMult
src/lib/save.js + stores/meta.js  T3 — awards slices + offline in boot()
src/components/PrToast.vue, PrModal.vue, NuggetSprite.vue  T6
src/components/HeaderBar.vue   T6 — buff chip
src/App.vue                    T6 — events tick + components; T7 — toasts/modals
src/components/ComboBar.vue, AwardsPanel.vue, AchievementToast.vue, OfflineModal.vue  T7
src/components/ClickTarget.vue T7 — ComboBar slot
src/components/ShopPanel.vue   T7 — Awards tab
tests/: prs+achievements (T1), events (T2), combo/awards/offline/save (T3), fact-check coverage (T8)
```

Execution: T1 → wave [T2, T4, T5] → T3 → wave [T6, T8] → T7 → T9 (final review + deploy). Commit trailer as always.

---

### Task 1: Data scaffolding (achievements, PR skeletons, tooling blurb)

- [ ] **Step 1: Create `src/data/achievements.js`:**

```js
// Achievements are permanent (survive Rewrites) and each grants +1% LoC/s
// (awards.achMult = 1.01^unlocked). check(ctx) predicates are pure.
export const ACHIEVEMENTS = [
  { id: 'ach-loc-1',     name: 'Hello World',       icon: '👋', desc: '1K lifetime LoC',              check: (c) => c.lifetimeLoc >= 1e3 },
  { id: 'ach-loc-2',     name: 'Shipping',          icon: '📦', desc: '1M lifetime LoC',              check: (c) => c.lifetimeLoc >= 1e6 },
  { id: 'ach-loc-3',     name: 'Unicorn',           icon: '🦄', desc: '1B lifetime LoC',              check: (c) => c.lifetimeLoc >= 1e9 },
  { id: 'ach-loc-4',     name: 'Hyperscale',        icon: '🌌', desc: '1T lifetime LoC',              check: (c) => c.lifetimeLoc >= 1e12 },
  { id: 'ach-loc-5',     name: 'Singularity',       icon: '🤖', desc: '1Qa lifetime LoC',             check: (c) => c.lifetimeLoc >= 1e15 },
  { id: 'ach-team-1',    name: 'First Standup',     icon: '🧍', desc: '10 Contributors',              check: (c) => c.totalContributors >= 10 },
  { id: 'ach-team-2',    name: 'Scale-Up',          icon: '🏢', desc: '50 Contributors',              check: (c) => c.totalContributors >= 50 },
  { id: 'ach-team-3',    name: 'Enterprise',        icon: '🏛️', desc: '150 Contributors',             check: (c) => c.totalContributors >= 150 },
  { id: 'ach-team-4',    name: 'Megacorp',          icon: '🌐', desc: '400 Contributors',             check: (c) => c.totalContributors >= 400 },
  { id: 'ach-team-100x', name: 'Centurion',         icon: '💯', desc: '100 of one Contributor',       check: (c) => c.maxSingleContributor >= 100 },
  { id: 'ach-cards-1',   name: 'Bookworm',          icon: '📖', desc: '5 Feature Cards',              check: (c) => c.cardsOwned >= 5 },
  { id: 'ach-cards-2',   name: 'Scholar',           icon: '🎓', desc: '20 Feature Cards',             check: (c) => c.cardsOwned >= 20 },
  { id: 'ach-cards-3',   name: 'Polyglot',          icon: '🗣️', desc: '50 Feature Cards',             check: (c) => c.cardsOwned >= 50 },
  { id: 'ach-cards-4',   name: 'Completionist',     icon: '🏅', desc: 'Every Feature Card',           check: (c) => c.cardsOwned >= 95 },
  { id: 'ach-exam-1',    name: 'Certified',         icon: '✅', desc: 'Pass an exam',                 check: (c) => c.examsPassed >= 1 },
  { id: 'ach-exam-2',    name: 'Veteran',           icon: '🎖️', desc: 'Pass 6 exams',                 check: (c) => c.examsPassed >= 6 },
  { id: 'ach-exam-3',    name: 'Cutting Edge',      icon: '🔪', desc: 'Pass all 13 exams',            check: (c) => c.examsPassed >= 13 },
  { id: 'ach-skills-focus', name: 'Focused',        icon: '🎯', desc: 'Max one Skill branch',         check: (c) => c.maxBranchNodes >= 5 },
  { id: 'ach-combo-100', name: 'Flow State',        icon: '🌊', desc: 'Reach 100 combo',              check: (c) => c.maxCombo >= 100 },
  { id: 'ach-nugget-1',  name: 'Package Hunter',    icon: '🥇', desc: 'Catch a golden NuGet',         check: (c) => c.nuggetsClicked >= 1 },
  { id: 'ach-nugget-10', name: 'Dependency Addict', icon: '📦', desc: 'Catch 10 golden NuGets',       check: (c) => c.nuggetsClicked >= 10 },
  { id: 'ach-pr-1',      name: 'First Merge',       icon: '🔀', desc: 'Answer a PR correctly',        check: (c) => c.prsCorrect >= 1 },
  { id: 'ach-pr-10',     name: 'Reviewer',          icon: '🧐', desc: '10 correct PRs',               check: (c) => c.prsCorrect >= 10 },
  { id: 'ach-pr-25',     name: 'Maintainer',        icon: '🛠️', desc: '25 correct PRs',               check: (c) => c.prsCorrect >= 25 },
  { id: 'ach-ef-1',      name: 'Persistent',        icon: '💾', desc: 'Adopt Entity Framework',       check: (c) => c.efTierIndex >= 0 },
  { id: 'ach-ef-9',      name: 'Preview Rider',     icon: '🚀', desc: 'Reach EF 11 (preview)',        check: (c) => c.efTierIndex >= 8 },
]
```

- [ ] **Step 2: PR skeletons + aggregator.** `src/data/content/prs-cs2-7.js` and `prs-cs8-14.js` each `export const PR_CONTENT = { questions: [] }` with a `// Authored by a research task against learn.microsoft.com` header. `src/data/prs.js`:

```js
import { PR_CONTENT as a } from './content/prs-cs2-7.js'
import { PR_CONTENT as b } from './content/prs-cs8-14.js'
import { ERAS } from './eras.js'

const ERA_INDEX = new Map(ERAS.map((e, i) => [e.id, i]))
export const PR_QUESTIONS = [...a.questions, ...b.questions].map((q) => Object.freeze(Object.assign(q, { options: Object.freeze(q.options) })))
export function prPoolFor(eraIndex) {
  return PR_QUESTIONS.filter((q) => ERA_INDEX.get(q.era) <= eraIndex)
}
```

- [ ] **Step 3: `src/data/skills.js`** — tooling blurb → `'−6% Release funding cost · +2h offline cap per point'`.
- [ ] **Step 4: Tests** — create `tests/awards-data.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { ACHIEVEMENTS } from '../src/data/achievements.js'
import { PR_QUESTIONS, prPoolFor } from '../src/data/prs.js'

const BASE_CTX = { lifetimeLoc: 0, totalContributors: 0, maxSingleContributor: 0, cardsOwned: 0, examsPassed: 0, skillsAllocated: 0, maxBranchNodes: 0, maxCombo: 0, nuggetsClicked: 0, prsCorrect: 0, efTierIndex: -1 }

describe('ACHIEVEMENTS', () => {
  it('has 26 unique entries, none unlocked at zero state', () => {
    expect(ACHIEVEMENTS).toHaveLength(26)
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(26)
    for (const a of ACHIEVEMENTS) expect(a.check(BASE_CTX), a.id).toBe(false)
  })
  it('milestone checks fire at their thresholds', () => {
    expect(ACHIEVEMENTS.find((a) => a.id === 'ach-loc-1').check({ ...BASE_CTX, lifetimeLoc: 1e3 })).toBe(true)
    expect(ACHIEVEMENTS.find((a) => a.id === 'ach-ef-1').check({ ...BASE_CTX, efTierIndex: 0 })).toBe(true)
    expect(ACHIEVEMENTS.find((a) => a.id === 'ach-combo-100').check({ ...BASE_CTX, maxCombo: 100 })).toBe(true)
  })
})

describe('PR bank structure', () => {
  it('every question is well-formed (counts enforced after research lands)', () => {
    for (const q of PR_QUESTIONS) {
      expect(q.options).toHaveLength(4)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThanOrEqual(3)
      expect(typeof q.snippet).toBe('string')
    }
    expect(prPoolFor(-1)).toHaveLength(0)
  })
})
```

- [ ] **Step 5:** `npm test` green (94 + 3). **Step 6: Commit** → `feat: achievements table + PR bank scaffolding` (+ trailer)

---

### Task 2: Events store (`stores/events.js`)

- [ ] **Step 1: Failing tests** — `tests/events.test.js`:

```js
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
```

- [ ] **Step 2:** FAIL. **Step 3: Implement `src/stores/events.js`:**

```js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { prPoolFor } from '../data/prs.js'
import { useGameStore } from './game.js'
import { useShopStore } from './shop.js'
import { useProgressStore } from './progress.js'
import { useAwardsStore } from './awards.js'

export const PR_MIN_GAP = 180_000
export const PR_MAX_GAP = 360_000
export const NUGGET_MIN_GAP = 120_000
export const NUGGET_MAX_GAP = 300_000
export const PR_TOAST_MS = 20_000
export const NUGGET_MS = 12_000
export const FRENZY_MULT = 7
export const CONFLICT_MULT = 0.5
export const BUFF_MS = 30_000

export const useEventsStore = defineStore('events', () => {
  const prOffer = ref(null)    // { until }
  const activePr = ref(null)   // question (modal open)
  const nugget = ref(null)     // { until, xPct, yPct }
  const buff = ref(null)       // { kind, mult, until }
  const buffMult = ref(1)

  let nextPrAt = Infinity
  let nextNuggetAt = Infinity
  let rand = Math.random

  function gap(min, max) {
    return min + rand() * (max - min)
  }

  function init(now, r = Math.random) {
    rand = r
    prOffer.value = null
    activePr.value = null
    nugget.value = null
    buff.value = null
    buffMult.value = 1
    nextPrAt = now + gap(PR_MIN_GAP, PR_MAX_GAP)
    nextNuggetAt = now + gap(NUGGET_MIN_GAP, NUGGET_MAX_GAP)
  }

  function tick(now) {
    if (buff.value && now >= buff.value.until) buff.value = null
    buffMult.value = buff.value ? buff.value.mult : 1
    if (prOffer.value && now >= prOffer.value.until) {
      prOffer.value = null
      nextPrAt = now + gap(PR_MIN_GAP, PR_MAX_GAP)
    }
    if (nugget.value && now >= nugget.value.until) {
      nugget.value = null
      nextNuggetAt = now + gap(NUGGET_MIN_GAP, NUGGET_MAX_GAP)
    }
    if (!prOffer.value && !activePr.value && now >= nextPrAt) {
      const pool = prPoolFor(useProgressStore().eraIndex)
      if (pool.length > 0) prOffer.value = { until: now + PR_TOAST_MS }
      else nextPrAt = now + gap(PR_MIN_GAP, PR_MAX_GAP)
    }
    if (!nugget.value && now >= nextNuggetAt) {
      nugget.value = { until: now + NUGGET_MS, xPct: 10 + rand() * 70, yPct: 20 + rand() * 50 }
    }
  }

  function applyBuff(kind, mult, now) {
    buff.value = { kind, mult, until: now + BUFF_MS }
    buffMult.value = mult
  }

  function openPr(now) {
    if (!prOffer.value) return null
    const pool = prPoolFor(useProgressStore().eraIndex)
    if (pool.length === 0) return null
    prOffer.value = null
    activePr.value = pool[Math.floor(rand() * pool.length)]
    nextPrAt = now + gap(PR_MIN_GAP, PR_MAX_GAP)
    return activePr.value
  }

  // Test hook: place a specific PR in the modal regardless of scheduling.
  function forcePr(question, now) {
    activePr.value = question
    nextPrAt = now + gap(PR_MIN_GAP, PR_MAX_GAP)
  }

  function answerPr(optionIndex, now) {
    if (!activePr.value) return null
    const correct = optionIndex === activePr.value.answer
    activePr.value = null
    if (correct) {
      applyBuff('frenzy', FRENZY_MULT, now)
      useProgressStore().addKnowledge(1)
      useAwardsStore().bumpStat('prsCorrect')
    } else {
      applyBuff('conflict', CONFLICT_MULT, now)
    }
    return correct
  }

  function clickNugget(now, r = rand) {
    if (!nugget.value) return false
    nugget.value = null
    nextNuggetAt = now + gap(NUGGET_MIN_GAP, NUGGET_MAX_GAP)
    useAwardsStore().bumpStat('nuggetsClicked')
    if (r() < 0.7) {
      applyBuff('frenzy', FRENZY_MULT, now)
    } else {
      const game = useGameStore()
      const shop = useShopStore()
      game.addLoc(Math.max(shop.lps * 600, game.effectiveClick * 100))
    }
    return true
  }

  return { prOffer, activePr, nugget, buff, buffMult, init, tick, openPr, forcePr, answerPr, clickNugget }
})
```

- [ ] **Step 4:** tests PASS (awards store arrives in T3 — for THIS task create a minimal placeholder? NO: T2's tests import the awards store. ORDERING NOTE: T2 runs in the same wave as T4/T5 but BEFORE T3 — to keep T2 self-contained, T2 ALSO creates a minimal `src/stores/awards.js` stub with just `stats` + `bumpStat` (T3 replaces it wholesale):

```js
import { reactive } from 'vue'
import { defineStore } from 'pinia'

// Minimal stub — Task 3 replaces this with the full achievements store.
export const useAwardsStore = defineStore('awards', () => {
  const stats = reactive({ maxCombo: 0, nuggetsClicked: 0, prsCorrect: 0 })
  function bumpStat(key, value = 1) {
    if (key in stats) stats[key] += value
  }
  return { stats, bumpStat }
})
```

- [ ] **Step 5: Commit** `src/stores/events.js src/stores/awards.js tests/events.test.js` → `feat: events store — PR/nugget scheduler + buffs (awards stub)` (+ trailer)

---

### Task 3: Combo + awards + lps chain + offline (`game.js`, `awards.js`, `shop.js`, `save.js`, `meta.js`)

- [ ] **Step 1: Failing tests** — `tests/awards.test.js`:

```js
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
```

And in `tests/meta.test.js` append:

```js
  it('boot grants capped offline gains and reports them', async () => {
    const meta = useMetaStore()
    const game = useGameStore()
    const shop = useShopStore()
    shop.owned['junior'] = 10 // lps 10
    game.addLoc(0)
    // hand-write a save stamped 3 hours ago
    const save = JSON.parse(JSON.stringify(buildSaveForTest()))
    function buildSaveForTest() {
      meta.saveLocal()
      return JSON.parse(localStorage.getItem(SAVE_KEY))
    }
    save.savedAt = Date.now() - 3 * 3600 * 1000
    localStorage.setItem(SAVE_KEY, JSON.stringify(save))
    setActivePinia(createPinia())
    const meta2 = useMetaStore()
    await meta2.boot()
    const shop2 = useShopStore()
    expect(useGameStore().loc).toBeCloseTo(shop2.lps * 2 * 3600, -2) // capped at 2h (tooling 0)
    expect(meta2.offlineReport).not.toBe(null)
    expect(meta2.offlineReport.capped).toBe(true)
  })
```
(import `useShopStore` at the top of meta.test.js if missing.)

And in `tests/save.test.js`: extend `fakeStores()` with `awards: { state: { unlocked: { x: true }, stats: { maxCombo: 3 } }, achievementsToSave() { return { unlocked: { ...this.state.unlocked } } }, statsToSave() { return { ...this.state.stats } }, hydrate(a, s) { this.state = { unlocked: { ...(a.unlocked || {}) }, stats: { ...(s || {}) } } } }` and assert the round-trip carries `save.achievements.unlocked.x === true` and `save.stats.maxCombo === 3`.

- [ ] **Step 2:** FAIL. **Step 3: Replace `src/stores/awards.js`** (full store):

```js
import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import { ACHIEVEMENTS } from '../data/achievements.js'
import { CONTRIBUTORS } from '../data/contributors.js'
import { SKILL_BRANCHES } from '../data/skills.js'
import { useGameStore } from './game.js'
import { useShopStore } from './shop.js'
import { useProgressStore } from './progress.js'
import { useEfStore } from './ef.js'

const KNOWN_IDS = new Set(ACHIEVEMENTS.map((a) => a.id))
const STAT_KEYS = ['maxCombo', 'nuggetsClicked', 'prsCorrect']

function toCount(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export const useAwardsStore = defineStore('awards', () => {
  const unlocked = reactive({})
  const stats = reactive({ maxCombo: 0, nuggetsClicked: 0, prsCorrect: 0 })
  const toastQueue = ref([])

  const achMult = computed(() => 1.01 ** Object.keys(unlocked).length)

  function bumpStat(key, value = 1) {
    if (key in stats) stats[key] += value
  }

  function noteCombo(combo) {
    if (combo > stats.maxCombo) stats.maxCombo = combo
  }

  function buildCtx() {
    const game = useGameStore()
    const shop = useShopStore()
    const progress = useProgressStore()
    const ef = useEfStore()
    const counts = CONTRIBUTORS.map((c) => shop.countOf(c.id))
    return {
      lifetimeLoc: game.lifetimeLoc,
      totalContributors: counts.reduce((s, n) => s + n, 0),
      maxSingleContributor: Math.max(0, ...counts),
      cardsOwned: Object.keys(progress.ownedCards).length + Object.keys(ef.ownedCards).length,
      examsPassed: progress.examsPassed.length,
      skillsAllocated: SKILL_BRANCHES.reduce((s, b) => s + (progress.skills[b.id] || 0), 0),
      maxBranchNodes: Math.max(...SKILL_BRANCHES.map((b) => progress.skills[b.id] || 0)),
      maxCombo: stats.maxCombo,
      nuggetsClicked: stats.nuggetsClicked,
      prsCorrect: stats.prsCorrect,
      efTierIndex: ef.tierIndex,
    }
  }

  function evaluate() {
    const ctx = buildCtx()
    for (const a of ACHIEVEMENTS) {
      if (!unlocked[a.id] && a.check(ctx)) {
        unlocked[a.id] = true
        toastQueue.value.push(a)
      }
    }
  }

  function shiftToast() {
    return toastQueue.value.shift() ?? null
  }

  function achievementsToSave() {
    return { unlocked: { ...unlocked } }
  }
  function statsToSave() {
    return { ...stats }
  }
  function hydrate(achSlice, statsSlice) {
    for (const k of Object.keys(unlocked)) delete unlocked[k]
    for (const id of Object.keys(achSlice?.unlocked || {})) if (KNOWN_IDS.has(id)) unlocked[id] = true
    for (const k of STAT_KEYS) stats[k] = Math.floor(toCount(statsSlice?.[k]))
  }

  return { unlocked, stats, toastQueue, achMult, bumpStat, noteCombo, evaluate, shiftToast, achievementsToSave, statsToSave, hydrate }
})
```

- [ ] **Step 4: `src/stores/game.js`** — combo. Add state + change click/effectiveClick, add `decayCombo`:

```js
  const combo = ref(0) // 0..100, builds on clicks, decays when idle
  let lastClickAt = 0

  const comboMult = computed(() => 1 + combo.value / 100)

  const effectiveClick = computed(() => {
    const progress = useProgressStore()
    return clickPower.value * progress.mods.clickMult * comboMult.value
  })

  function click() {
    combo.value = Math.min(100, combo.value + 2)
    lastClickAt = Date.now()
    useAwardsStore().noteCombo(combo.value)
    addLoc(effectiveClick.value)
  }

  function decayCombo(dtSeconds, now = Date.now()) {
    if (combo.value > 0 && now - lastClickAt > 1_000) {
      combo.value = Math.max(0, combo.value - 60 * dtSeconds)
    }
  }

  function tick(dtSeconds) {
    if (!(dtSeconds > 0)) return
    decayCombo(dtSeconds)
    const shop = useShopStore()
    if (shop.lps > 0) addLoc(shop.lps * dtSeconds)
  }
```
(import `useAwardsStore`; export `combo`, `comboMult`, `decayCombo` alongside existing.) Combo is per-run, transient — NOT saved.

- [ ] **Step 5: `src/stores/shop.js`** — lps chain becomes:

```js
  const lps = computed(() => {
    const ef = useEfStore()
    const awards = useAwardsStore()
    const events = useEventsStore()
    return baseLps.value * ef.dataMult * awards.achMult * events.buffMult
  })
```
(add the two imports.)

- [ ] **Step 6: `src/lib/save.js`** — `buildSave({ game, shop, progress, ef, awards })`: `achievements: awards.achievementsToSave(), stats: awards.statsToSave()` replace the literals; `applySave` adds `awards.hydrate(save.achievements || {}, save.stats || {})`. (No version bump — v3 already carries these keys.)

- [ ] **Step 7: `src/stores/meta.js`** — add awards to `stores()`; offline gains in `boot()`: add `const offlineReport = ref(null)` and, immediately after the `if (source === …) applySave(…)` lines:

```js
    const applied = source === 'local' ? local : source === 'cloud' ? cloud : null
    if (applied?.savedAt) {
      const awaySec = (Date.now() - applied.savedAt) / 1000
      if (awaySec > 60) {
        const progress = useProgressStore()
        const shop = useShopStore()
        const capSec = (2 + 2 * (progress.skills.tooling || 0)) * 3600
        const effSec = Math.min(awaySec, capSec)
        const gain = shop.lps * effSec
        if (gain > 0) {
          useGameStore().addLoc(gain)
          offlineReport.value = { gain, seconds: effSec, capped: awaySec > capSec }
          saveLocal() // persist immediately so a crash can't double-grant
        }
      }
    }
```
(add `useShopStore` import if absent; export `offlineReport`.)

- [ ] **Step 8:** full suite green (97 + ~7 new ≈ 104; exact count reported). **Step 9: Commit** → `feat: combo, achievements, buff/ach lps chain, offline progress` (+ trailer)

---

### Task 4 (WEB): PR bank cs2–cs7 (18 questions) · Task 5 (WEB): PR bank cs8–cs14 (21 questions)

Parallel; disjoint files (`src/data/content/prs-cs2-7.js` / `prs-cs8-14.js`). Rules: 3 questions per era; id `pr-<era>-01..03`; shape `{ id, era, text, snippet, options: [4 ≤80 chars], answer }`; snippet (≤220 chars) is a short code sample valid for that era, question asks what it prints/does/whether it compiles; verify EVERY claim against learn.microsoft.com (WebFetch; `// Sources:` comment); answerable by someone who learned that era's Feature Cards; exactly one correct option; no markdown backticks. Verify with `npx vitest run tests/awards-data.test.js` (shape test). Commit own file: `content: PR bank cs2–7` / `content: PR bank cs8–14` (+ trailer).

### Task 6: Event UI (PrToast, PrModal, NuggetSprite, buff chip, App wiring)

- [ ] **Step 1: `src/components/PrToast.vue`:**

```vue
<script setup>
import { useEventsStore } from '../stores/events.js'

const events = useEventsStore()
</script>

<template>
  <button v-if="events.prOffer && !events.activePr" class="pr-toast card" @click="events.openPr(Date.now())">
    📬 <strong>A pull request needs review!</strong>
    <span class="muted">Click to review — correct merge = ×7 frenzy</span>
  </button>
</template>
```

- [ ] **Step 2: `src/components/PrModal.vue`:**

```vue
<script setup>
import { ref } from 'vue'
import { useEventsStore } from '../stores/events.js'

const events = useEventsStore()
const outcome = ref(null) // null | true | false

function pick(i) {
  if (outcome.value !== null) return
  outcome.value = events.answerPr(i, Date.now())
}
function close() {
  outcome.value = null
}
</script>

<template>
  <div v-if="events.activePr || outcome !== null" class="modal-overlay">
    <div class="modal card exam-modal" role="dialog" aria-modal="true" aria-label="Pull request review">
      <template v-if="outcome === null && events.activePr">
        <p class="muted exam-progress">🔀 Incoming pull request</p>
        <h2 class="exam-question">{{ events.activePr.text }}</h2>
        <pre class="snippet"><code>{{ events.activePr.snippet }}</code></pre>
        <button v-for="(opt, i) in events.activePr.options" :key="i" class="btn exam-option" @click="pick(i)">
          {{ opt }}
        </button>
      </template>
      <template v-else>
        <h2>{{ outcome ? '✅ Merged!' : '💥 Merge conflict' }}</h2>
        <p class="muted">{{ outcome ? 'Production frenzy ×7 for 30 seconds (+1 Knowledge).' : 'Production halved for 30 seconds. Review more carefully!' }}</p>
        <button class="btn btn-primary" @click="close">Continue</button>
      </template>
    </div>
  </div>
</template>
```

- [ ] **Step 3: `src/components/NuggetSprite.vue`:**

```vue
<script setup>
import { useEventsStore } from '../stores/events.js'

const events = useEventsStore()
</script>

<template>
  <button
    v-if="events.nugget"
    class="nugget"
    :style="{ left: events.nugget.xPct + '%', top: events.nugget.yPct + '%' }"
    aria-label="Golden NuGet"
    @click="events.clickNugget(Date.now())"
  >📦</button>
</template>
```

- [ ] **Step 4: `src/components/HeaderBar.vue`** — buff chip after the 💾 chip: `<span v-if="events.buff" class="buff-chip" :class="events.buff.kind">{{ events.buff.kind === 'frenzy' ? '🔥 ×7' : '💥 ×0.5' }}</span>` (script: import/use `useEventsStore`).
- [ ] **Step 5: `src/App.vue`** — wire the 1 s events clock + components: import PrToast/PrModal/NuggetSprite + `useEventsStore`; in onMounted after `await meta.boot()` add `events.init(Date.now())` and a `secondHandle = setInterval(() => events.tick(Date.now()), 1000)` (clear in onUnmounted); add `<PrToast />`, `<PrModal />`, `<NuggetSprite />` after `<HeaderBar />`.
- [ ] **Step 6: styles append:**

```css
/* ── events ── */
.pr-toast { position: fixed; right: 18px; bottom: 18px; z-index: 40; display: flex; flex-direction: column; gap: 4px; cursor: pointer; text-align: left; border-color: var(--accent-2); }
.nugget { position: fixed; z-index: 39; font-size: 2.2rem; background: none; border: none; cursor: pointer; filter: drop-shadow(0 0 8px gold); animation: bob 1.2s ease-in-out infinite alternate; }
@keyframes bob { from { transform: translateY(-4px); } to { transform: translateY(4px); } }
.buff-chip { border-radius: 999px; padding: 2px 10px; font-size: 0.85rem; border: 1px solid var(--accent); }
.buff-chip.conflict { border-color: var(--bad); }
```

- [ ] **Step 7:** `npm test` (no regressions) + build + dev smoke. **Step 8: Commit** → `feat: PR/nugget event UI + buff chip` (+ trailer)

### Task 7: ComboBar, Awards tab, toasts, OfflineModal

- [ ] **Step 1: `src/components/ComboBar.vue`:**

```vue
<script setup>
import { useGameStore } from '../stores/game.js'

const game = useGameStore()
</script>

<template>
  <div class="combo-wrap" v-show="game.combo > 0">
    <div class="combo-bar"><div class="combo-fill" :style="{ width: game.combo + '%' }" /></div>
    <span class="muted combo-label">🌊 flow ×{{ game.comboMult.toFixed(2) }}</span>
  </div>
</template>
```
Mount inside `ClickTarget.vue` under the existing `<p class="muted">` line (import + `<ComboBar />`).

- [ ] **Step 2: `src/components/AwardsPanel.vue`:**

```vue
<script setup>
import { useAwardsStore } from '../stores/awards.js'
import { ACHIEVEMENTS } from '../data/achievements.js'

const awards = useAwardsStore()
</script>

<template>
  <div class="shop-list">
    <p class="knowledge-line">🏆 {{ Object.keys(awards.unlocked).length }} / {{ ACHIEVEMENTS.length }} · production ×{{ awards.achMult.toFixed(2) }}</p>
    <div v-for="a in ACHIEVEMENTS" :key="a.id" class="card award" :class="{ locked: !awards.unlocked[a.id] }">
      <span class="award-icon">{{ a.icon }}</span>
      <div class="contributor-info">
        <strong>{{ a.name }}</strong>
        <span class="muted">{{ a.desc }} · +1% LoC/s</span>
      </div>
    </div>
  </div>
</template>
```
`ShopPanel.vue`: TABS gains `{ id: 'awards', label: 'Awards' }` last; `<AwardsPanel v-else-if="active === 'awards'" />`.

- [ ] **Step 3: `src/components/AchievementToast.vue`** (App polls the queue):

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAwardsStore } from '../stores/awards.js'

const awards = useAwardsStore()
const current = ref(null)
let pollHandle, hideHandle

onMounted(() => {
  pollHandle = setInterval(() => {
    if (!current.value) {
      const next = awards.shiftToast()
      if (next) {
        current.value = next
        hideHandle = setTimeout(() => { current.value = null }, 4000)
      }
    }
  }, 500)
})
onUnmounted(() => { clearInterval(pollHandle); clearTimeout(hideHandle) })
</script>

<template>
  <div v-if="current" class="ach-toast card">
    <span class="award-icon">{{ current.icon }}</span>
    <div><strong>Achievement: {{ current.name }}</strong><p class="muted" style="margin:0">{{ current.desc }} · +1% LoC/s</p></div>
  </div>
</template>
```

- [ ] **Step 4: `src/components/OfflineModal.vue`:**

```vue
<script setup>
import { useMetaStore } from '../stores/meta.js'
import { formatNumber } from '../lib/format.js'

const meta = useMetaStore()

function hours(s) {
  return (s / 3600).toFixed(1)
}
</script>

<template>
  <div v-if="meta.offlineReport" class="modal-overlay">
    <div class="modal card" role="dialog" aria-modal="true" aria-label="While you were away">
      <h2>🌙 CI ran overnight</h2>
      <p>Your Contributors produced <strong class="loc-counter">{{ formatNumber(meta.offlineReport.gain) }} LoC</strong> over {{ hours(meta.offlineReport.seconds) }}h.</p>
      <p v-if="meta.offlineReport.capped" class="muted">Capped — Tooling skill points extend the offline window (+2h each).</p>
      <button class="btn btn-primary" @click="meta.offlineReport = null">Nice</button>
    </div>
  </div>
</template>
```

- [ ] **Step 5: App.vue** — add `<AchievementToast />` + `<OfflineModal />`; in the 1 s interval also call `awards.evaluate()` every 5th tick (keep a counter). **Step 6: styles:**

```css
/* ── combo / awards / toasts ── */
.combo-wrap { display: flex; flex-direction: column; gap: 4px; align-items: center; min-height: 34px; }
.combo-bar { width: 180px; height: 8px; border-radius: 4px; background: var(--bg); border: 1px solid var(--border); overflow: hidden; }
.combo-fill { height: 100%; background: linear-gradient(90deg, var(--accent-2), var(--accent)); }
.combo-label { font-size: 0.8rem; }
.award { display: flex; align-items: center; gap: 12px; }
.award.locked { opacity: 0.35; }
.award-icon { font-size: 1.6rem; width: 36px; text-align: center; }
.ach-toast { position: fixed; top: 64px; left: 50%; transform: translateX(-50%); z-index: 45; display: flex; gap: 10px; align-items: center; border-color: var(--accent); }
```

- [ ] **Step 7:** suite + build + dev smoke. **Step 8: Commit** → `feat: combo bar, awards tab, achievement toasts, offline modal` (+ trailer)

### Task 8 (WEB): PR bank fact-check + count strictness

Adversarially verify all 39 PR questions (snippet validity for its era, single correct answer, settling doc URLs; fix text inline, never ids). Then add to `tests/awards-data.test.js`:

```js
  it('has exactly 3 PR questions per era', () => {
    for (const era of ERAS) {
      expect(PR_QUESTIONS.filter((q) => q.era === era.id), era.id).toHaveLength(3)
    }
    expect(new Set(PR_QUESTIONS.map((q) => q.id)).size).toBe(PR_QUESTIONS.length)
  })
```
(import ERAS). `npm test` fully green. Commit → `fix(content): PR bank fact-check + count strictness` (+ trailer). Report all errors with URLs; zero = re-verify 5 subtlest and say so.

### Task 9: Final review + deploy

Full suite + build + clean tree → push → CI watch → live bundle spot-check (`pr-cs14`, `ach-loc-1`, `Flow State` in served JS) → owner checklist: answer a PR (watch ×7), catch a NuGet, check Awards tab, close + reopen after 5 min for the offline modal.

## Self-review notes (applied)

- No save version bump: v3 already reserved `achievements`/`stats`; old M3a clients reading an M3b save see extra populated keys they ignore — forward-compatible; M3b reading M3a saves hydrates empty slices.
- Combo is deliberately not persisted (transient flow state); offline modal persists gains via saveLocal() immediately to prevent crash double-grants.
- Emission for EF ratio remains `baseLps` — frenzy buffs do not distort persistence ratio (documented in M3a plan).
- events.tick spawns nothing while `activePr` is open (no stacked offers); openPr re-rolls from the CURRENT era pool.
