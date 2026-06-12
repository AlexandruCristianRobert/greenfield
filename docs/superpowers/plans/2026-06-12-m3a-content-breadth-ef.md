# Greenfield M3a — Content Breadth + EF Data Track Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the era ladder to C# 14 (7 new eras, 42 doc-verified Feature Cards, 70 exam questions), add instant-pass Release advancement for already-certified eras, and ship the EF Data track — 9 purchasable EF tiers + ~17 EF Feature Cards driving the Persistence Ratio → a ×1→×3 global production multiplier; save schema v3.

**Architecture:** New eras/cards reuse the M2 content pipeline (skeletons with locked ids/costs/effects → web-research fills → adversarial fact-check). The EF track is a new `ef` Pinia store: `shop` splits `lps` into `baseLps` (contributors × lpsMult) and `lps = baseLps × ef.dataMult`; `ef.ratio = min(1, throughput / max(baseLps,1))` and `dataMult = tier owned ? 1 + 2×ratio : 1` — emission uses baseLps so there is no feedback recursion. EF cards reuse the Feature Card shape and the (genericized) FeatureCardItem component; a new `tpMult` effect type joins the modifiers engine. Save v3 adds `ef` plus empty `achievements`/`stats` slices reserved for M3b.

**Tech Stack:** unchanged (Vue 3 + Pinia + Vite + Vitest, plain JS; WebSearch/WebFetch for research tasks; learn.microsoft.com is the source of truth — EF content under learn.microsoft.com/ef).

**Out of scope (M3b plan):** PR events, combo meter, golden NuGets, achievements logic, offline progress. (v3 save reserves their slices now so M3b needs no bump.)

---

## Contracts (exact names)

- `EFFECT_TYPES` gains `'tpMult'`; `BASE_MODS.tpMult = 1`.
- EF tier: `{ id, name, requiresEra, cost, baseThroughput }`. EF card: same shape as language Feature Cards but `effect.type === 'tpMult'`.
- `ef` store: `tierIndex` (−1 = track not started), `ownedCards`, `firstReads` (permanent, Knowledge dedup), `currentTier`, `nextTier`, `nextTierUnlocked`, `throughput` (tier base × tpMult of owned EF cards), `ratio`, `dataMult`, `buyNextTier()`, `buyCard(card)`, `toSave()/hydrate()`.
- `progress.addKnowledge(n)` new action (ef store grants +1 per EF first read).
- `progress.fundRelease()` instant-pass: funding the Release of an era whose exam is already in `examsPassed` advances immediately (no exam) — covers M2→M3 transition players parked on a certified cs7 AND pre-implements M4 Rewrite replays.
- Save v3: `migrate` v2→v3 injects `{ ef: {}, achievements: {}, stats: {} }`; `buildSave/applySave` carry `ef` (achievements/stats stay opaque until M3b).
- Test scoping during the content gap: `tests/content.test.js` gets `const AUTHORED = new Set(['cs2','cs3','cs4','cs5','cs6','cs7'])`; the questions-per-era and blurb-length tests iterate only AUTHORED eras until the fact-check task (Task 9) restores full-ERAS iteration. Every commit stays green.

## File structure

```
src/data/eras.js                 T1 modify — 7 new eras (cs8–cs14)
src/data/content/cs8.js…cs14.js  T1 skeletons → T5/T6/T7 research fills
src/data/featuresLanguage.js     T1 modify — 7 new imports
src/stores/progress.js           T1 modify — fundRelease instant-pass + addKnowledge
src/components/EraPanel.vue      T1 modify — certified-era copy + banner text
src/lib/modifiers.js             T2 modify — tpMult
src/data/ef.js                   T2 — EF_TIERS (9)
src/data/content/ef.js           T2 skeleton → T8 research fills
src/data/efFeatures.js           T2 — EF_FEATURES aggregator (frozen) + efFeaturesOf(tierId)
src/stores/ef.js                 T3 — the Data track store
src/stores/shop.js               T3 modify — baseLps/lps split
src/lib/save.js                  T3 modify — SAVE_VERSION 3 + migration
src/stores/meta.js               T3 modify — ef in stores()
src/components/FeatureCardItem.vue  T4 modify — dumb component (props owned/affordable, emit buy)
src/components/FeatureList.vue   T4 modify — passes progress bindings
src/components/EfPanel.vue       T4 — Data tab (persistence bar, tier ladder, EF cards)
src/components/ShopPanel.vue     T4 modify — Data tab added
src/components/HeaderBar.vue     T4 modify — 💾 persistence chip
src/styles/index.css             T4 append
tests/: content.test.js (T1/T2/T9), progress.test.js (T1), ef.test.js (T3), save.test.js (T3), stores.test.js (T3)
```

## Execution order (≤5 agents)

T1 → T2 → **parallel wave:** [T3, T5, T6, T7, T8] → T4 → T9 (fact-check + strict tests) → T10 (deploy). Commits carry the `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` trailer; parallel agents stage only their own files and retry on index.lock.

---

### Task 1: Era expansion cs8–cs14 + instant-pass Release

**Files:** Modify `src/data/eras.js`, `src/stores/progress.js`, `src/components/EraPanel.vue`, `tests/content.test.js`, `tests/progress.test.js` · Create `src/data/content/cs8.js` … `cs14.js` · Modify `src/data/featuresLanguage.js`

- [ ] **Step 1: Append 7 eras to `ERAS` in `src/data/eras.js`:**

```js
  { id: 'cs8',  csVersion: 'C# 8',  year: 2019, name: 'The Nullable Era',     releaseCost: 1.2e9,  color: '#e8a87c' },
  { id: 'cs9',  csVersion: 'C# 9',  year: 2020, name: 'The Records Era',      releaseCost: 1.4e10, color: '#e8d27c' },
  { id: 'cs10', csVersion: 'C# 10', year: 2021, name: 'The Global Era',       releaseCost: 1.7e11, color: '#c2e87c' },
  { id: 'cs11', csVersion: 'C# 11', year: 2022, name: 'The Raw Strings Era',  releaseCost: 2e12,   color: '#7ce8b9' },
  { id: 'cs12', csVersion: 'C# 12', year: 2023, name: 'The Primary Ctor Era', releaseCost: 2.4e13, color: '#7cd4e8' },
  { id: 'cs13', csVersion: 'C# 13', year: 2024, name: 'The Params Era',       releaseCost: 3e14,   color: '#a89ce8' },
  { id: 'cs14', csVersion: 'C# 14', year: 2025, name: 'The Extensions Era',   releaseCost: 3.5e15, color: '#e89cd8' },
```

- [ ] **Step 2: Create skeletons `src/data/content/cs8.js` … `cs14.js`** — same shell as the existing era files (`export const ERA_CONTENT = { features: [...], questions: [] }`, every entry with `blurb: '', snippet: ''`). Entries (locked design — transcribe exactly):

cs8: `cs8-nullable-reference-types` "Nullable Reference Types" 1e8 lpsMult 1.40 'All Contributors +40% LoC/s' · `cs8-async-streams` "Async Streams" 1.4e8 lpsMult 1.60 'All Contributors +60% LoC/s' · `cs8-switch-expressions` "Switch Expressions" 1.9e8 clickMult 1.40 'Click power +40%' · `cs8-ranges-indices` "Ranges & Indices" 2.6e8 clickMult 1.30 'Click power +30%' · `cs8-default-interface-methods` "Default Interface Methods" 3.6e8 costMult 0.92 'Contributor costs −8%' · `cs8-using-declarations` "using Declarations" 5e8 costMult 0.94 'Contributor costs −6%'

cs9: `cs9-records` "Records" 1.2e9 lpsMult 1.60 · `cs9-init-only-setters` "Init-Only Setters" 1.7e9 costMult 0.92 · `cs9-top-level-statements` "Top-Level Statements" 2.3e9 clickMult 1.45 · `cs9-pattern-enhancements` "Relational & Logical Patterns" 3.1e9 lpsMult 1.30 · `cs9-target-typed-new` "Target-Typed new" 4.2e9 clickMult 1.30 · `cs9-source-generators` "Source Generators" 5.8e9 lpsMult 1.40

cs10: `cs10-global-usings` "Global Usings" 1.4e10 clickMult 1.50 · `cs10-file-scoped-namespaces` "File-Scoped Namespaces" 2e10 costMult 0.90 · `cs10-record-structs` "Record Structs" 2.7e10 lpsMult 1.45 · `cs10-lambda-improvements` "Lambda Improvements" 3.7e10 lpsMult 1.35 · `cs10-const-interpolated-strings` "Constant Interpolated Strings" 5e10 clickMult 1.30 · `cs10-extended-property-patterns` "Extended Property Patterns" 7e10 lpsMult 1.30

cs11: `cs11-raw-string-literals` "Raw String Literals" 1.7e11 clickMult 1.50 · `cs11-generic-math` "Generic Math (static abstracts)" 2.4e11 lpsMult 1.70 · `cs11-list-patterns` "List Patterns" 3.2e11 lpsMult 1.35 · `cs11-required-members` "Required Members" 4.4e11 costMult 0.90 · `cs11-file-local-types` "File-Local Types" 6e11 costMult 0.94 · `cs11-utf8-string-literals` "UTF-8 String Literals" 8.2e11 lpsMult 1.35

cs12: `cs12-primary-constructors` "Primary Constructors" 2e12 lpsMult 1.50 · `cs12-collection-expressions` "Collection Expressions" 2.8e12 lpsMult 1.60 · `cs12-ref-readonly-parameters` "ref readonly Parameters" 3.9e12 costMult 0.90 · `cs12-default-lambda-parameters` "Default Lambda Parameters" 5.3e12 clickMult 1.40 · `cs12-alias-any-type` "Alias Any Type" 7.2e12 clickMult 1.35 · `cs12-inline-arrays` "Inline Arrays" 9.8e12 lpsMult 1.40

cs13: `cs13-params-collections` "params Collections" 2.4e13 lpsMult 1.60 · `cs13-new-lock-object` "System.Threading.Lock" 3.4e13 lpsMult 1.40 · `cs13-escape-sequence-e` "Escape Sequence \\e" 4.6e13 clickMult 1.30 · `cs13-partial-properties` "Partial Properties" 6.3e13 costMult 0.90 · `cs13-implicit-index-initializers` "Implicit Index in Initializers" 8.6e13 clickMult 1.40 · `cs13-overload-resolution-priority` "OverloadResolutionPriority" 1.2e14 lpsMult 1.35

cs14: `cs14-extension-members` "Extension Members" 2.9e14 lpsMult 1.80 · `cs14-field-keyword` "The field Keyword" 4e14 clickMult 1.50 · `cs14-null-conditional-assignment` "Null-Conditional Assignment" 5.5e14 lpsMult 1.45 · `cs14-nameof-unbound-generics` "nameof Unbound Generics" 7.5e14 clickMult 1.35 · `cs14-partial-events-ctors` "Partial Events & Constructors" 1e15 costMult 0.90 · `cs14-lambda-param-modifiers` "Lambda Parameter Modifiers" 1.4e15 lpsMult 1.35

(effectText strings follow the M2 pattern: lpsMult → `All Contributors +N% LoC/s`, clickMult → `Click power +N%`, costMult → `Contributor costs −N%`.)

- [ ] **Step 3: Register the 7 new content files in `src/data/featuresLanguage.js`** (imports + ALL array, same pattern).
- [ ] **Step 4: Scope the content tests.** In `tests/content.test.js`: change the ERAS id-list assertion to the 13-era list; change card-count expectations 36 → 78 and per-era 6 (unchanged); add at the top `const AUTHORED = new Set(['cs2', 'cs3', 'cs4', 'cs5', 'cs6', 'cs7'])` and make the `QUESTIONS content` per-era loop iterate `ERAS.filter((e) => AUTHORED.has(e.id))` and the blurb/snippet-length loop iterate `LANGUAGE_FEATURES.filter((f) => AUTHORED.has(f.era))`. Add a comment: `// AUTHORED expands to all eras in the M3a fact-check task — do not ship without it.`
- [ ] **Step 5: Instant-pass in `src/stores/progress.js`** — replace `fundRelease` and add `addKnowledge`:

```js
  function fundRelease() {
    if (releaseFunded.value || allErasDone.value) return false
    const game = useGameStore()
    if (!game.spend(releaseCost.value)) return false
    // Instant-pass: an era whose exam is already certified (M2→M3 transition,
    // M4 Rewrite replays) needs only the Release — advance immediately.
    if (examsPassed.value.includes(currentEra.value.id)) {
      if (eraIndex.value < ERAS.length - 1) eraIndex.value += 1
      return true
    }
    releaseFunded.value = true
    return true
  }

  function addKnowledge(n) {
    knowledge.value += Math.max(0, Math.floor(Number(n) || 0))
  }
```
Export `addKnowledge` in the return object.

- [ ] **Step 6: Failing tests in `tests/progress.test.js`** (append to the era-gate describe):

```js
  it('funding the Release of an already-certified era advances without an exam', () => {
    const progress = useProgressStore()
    const game = useGameStore()
    progress.hydrate({ eraIndex: 0, examsPassed: ['cs2'] })
    game.addLoc(1e6)
    expect(progress.fundRelease()).toBe(true)
    expect(progress.eraIndex).toBe(1)
    expect(progress.releaseFunded).toBe(false)
  })
  it('addKnowledge floors junk to non-negative integers', () => {
    const progress = useProgressStore()
    progress.addKnowledge(2.9)
    progress.addKnowledge(-5)
    progress.addKnowledge('x')
    expect(progress.knowledge).toBe(2)
  })
```

- [ ] **Step 7: `src/components/EraPanel.vue`** — add `const certified = computed(() => progress.examsPassed.includes(progress.currentEra.id))` (import `computed` already present) and adjust the template's not-funded branch:

```vue
      <button
        v-if="!progress.releaseFunded"
        class="btn btn-primary"
        :disabled="game.loc < progress.releaseCost"
        @click="progress.fundRelease()"
      >
        🚀 Fund the Release — {{ formatNumber(progress.releaseCost) }} LoC{{ certified ? ' (already certified — advance)' : '' }}
      </button>
```
Also change the allErasDone banner text to: `🏆 All eras certified — you've reached the cutting edge of C#.`

- [ ] **Step 8:** `npm test` — full suite green (83 + 2 new = 85; content tests pass via AUTHORED scoping). `npm run build` green.
- [ ] **Step 9: Commit** `git add src/data/eras.js src/data/content/ src/data/featuresLanguage.js src/stores/progress.js src/components/EraPanel.vue tests/content.test.js tests/progress.test.js` → `feat: eras C#8–14 skeletons + instant-pass release advance` (+ trailer)

---

### Task 2: EF data + tpMult (`lib/modifiers.js`, `data/ef.js`, `data/content/ef.js`, `data/efFeatures.js`)

- [ ] **Step 1: Failing tests** — append to `tests/content.test.js`:

```js
import { EF_TIERS } from '../src/data/ef.js'
import { EF_FEATURES, efFeaturesOf } from '../src/data/efFeatures.js'

describe('EF track data', () => {
  it('has 9 tiers with rising costs and known era requirements', () => {
    expect(EF_TIERS.map((t) => t.id)).toEqual(['ef6', 'efcore1', 'efcore3', 'efcore6', 'ef7', 'ef8', 'ef9', 'ef10', 'ef11'])
    const eraIds = new Set(ERAS.map((e) => e.id))
    for (let i = 0; i < EF_TIERS.length; i++) {
      const t = EF_TIERS[i]
      expect(eraIds.has(t.requiresEra), t.id).toBe(true)
      expect(t.baseThroughput).toBeGreaterThan(0)
      if (i > 0) expect(t.cost).toBeGreaterThan(EF_TIERS[i - 1].cost)
    }
  })
  it('EF cards are tpMult-typed, unique, tier-valid, rising cost per tier', () => {
    expect(EF_FEATURES.length).toBeGreaterThanOrEqual(17)
    expect(new Set(EF_FEATURES.map((f) => f.id)).size).toBe(EF_FEATURES.length)
    const tierIds = new Set(EF_TIERS.map((t) => t.id))
    for (const f of EF_FEATURES) {
      expect(tierIds.has(f.tier), f.id).toBe(true)
      expect(f.effect.type).toBe('tpMult')
      expect(f.effect.value).toBeGreaterThan(1)
    }
    for (const t of EF_TIERS) {
      const cards = efFeaturesOf(t.id)
      for (let i = 1; i < cards.length; i++) expect(cards[i].cost).toBeGreaterThan(cards[i - 1].cost)
    }
  })
})
```
And in `tests/modifiers.test.js`, update the canonical-list test to `['clickMult', 'lpsMult', 'costMult', 'releaseMult', 'tpMult']` and add `{ type: 'tpMult', value: 2 }` to the multiply test asserting `mods.tpMult ≈ 2`.

- [ ] **Step 2:** run both test files — FAIL.
- [ ] **Step 3: `src/lib/modifiers.js`** — add `'tpMult'` to EFFECT_TYPES and `tpMult: 1` to BASE_MODS.
- [ ] **Step 4: Create `src/data/ef.js`:**

```js
// The EF ladder: each tier is a one-time LoC purchase, gated by reaching an
// era. baseThroughput is Data/sec persisted before EF-card multipliers.
export const EF_TIERS = [
  { id: 'ef6',     name: 'Entity Framework 6', requiresEra: 'cs5',  cost: 5e5,   baseThroughput: 30 },
  { id: 'efcore1', name: 'EF Core 1',          requiresEra: 'cs7',  cost: 2e7,   baseThroughput: 300 },
  { id: 'efcore3', name: 'EF Core 3.1',        requiresEra: 'cs8',  cost: 4e8,   baseThroughput: 2_500 },
  { id: 'efcore6', name: 'EF Core 6',          requiresEra: 'cs10', cost: 9e9,   baseThroughput: 2e4 },
  { id: 'ef7',     name: 'EF Core 7',          requiresEra: 'cs11', cost: 2e11,  baseThroughput: 1.6e5 },
  { id: 'ef8',     name: 'EF Core 8',          requiresEra: 'cs12', cost: 5e12,  baseThroughput: 1.3e6 },
  { id: 'ef9',     name: 'EF Core 9',          requiresEra: 'cs13', cost: 1.2e14, baseThroughput: 1e7 },
  { id: 'ef10',    name: 'EF Core 10',         requiresEra: 'cs14', cost: 3e15,  baseThroughput: 8e7 },
  { id: 'ef11',    name: 'EF 11 (preview)',    requiresEra: 'cs14', cost: 8e16,  baseThroughput: 6e8 },
]
```

- [ ] **Step 5: Create skeleton `src/data/content/ef.js`** (`export const EF_CONTENT = { features: [...] }`, every entry `blurb: '', snippet: ''`):

`ef6-code-first-migrations` "Code-First Migrations" tier ef6 2.5e5 tpMult 1.6 'Persistence throughput ×1.6' · `ef6-async-queries` "Async Queries" ef6 4e5 tpMult 1.8 · `efcore1-crossplatform` "Cross-Platform Core" efcore1 1e7 tpMult 1.6 · `efcore1-inmemory-provider` "InMemory Provider" efcore1 1.6e7 tpMult 1.8 · `efcore3-linq-translation` "Restructured LINQ Translation" efcore3 2e8 tpMult 1.7 · `efcore3-interceptors` "Interceptors" efcore3 3.2e8 tpMult 1.8 · `efcore6-compiled-models` "Compiled Models" efcore6 4.5e9 tpMult 1.8 · `efcore6-temporal-tables` "Temporal Tables" efcore6 7e9 tpMult 1.7 · `ef7-executeupdate` "ExecuteUpdate / ExecuteDelete" ef7 1e11 tpMult 2.0 · `ef7-json-columns` "JSON Columns" ef7 1.6e11 tpMult 1.8 · `ef8-complex-types` "Complex Types" ef8 2.5e12 tpMult 1.9 · `ef8-primitive-collections` "Primitive Collections" ef8 4e12 tpMult 1.8 · `ef9-azure-cosmos` "Cosmos Overhaul" ef9 6e13 tpMult 1.8 · `ef9-linq-improvements` "Smarter LINQ Translation" ef9 9.5e13 tpMult 1.9 · `ef10-leftjoin` "LeftJoin Operator" ef10 1.5e15 tpMult 1.9 · `ef10-named-query-filters` "Named Query Filters" ef10 2.4e15 tpMult 1.9 · `ef11-preview` "EF 11 Preview" ef11 4e16 tpMult 2.2

(effectText: `Persistence throughput ×<value>`.)

- [ ] **Step 6: Create `src/data/efFeatures.js`:**

```js
import { EF_CONTENT } from './content/ef.js'

export const EF_FEATURES = EF_CONTENT.features.map((f) => Object.freeze(Object.assign(f, { effect: Object.freeze(f.effect) })))
export function efFeaturesOf(tierId) {
  return EF_FEATURES.filter((f) => f.tier === tierId)
}
```

- [ ] **Step 7:** `npm test` green. **Step 8: Commit** → `feat: EF ladder data + tpMult effect type` (+ trailer)

---

### Task 3: EF store + save v3 (`stores/ef.js`, `stores/shop.js`, `lib/save.js`, `stores/meta.js`)

- [ ] **Step 1: Failing tests** — create `tests/ef.test.js`:

```js
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
    shop.owned['junior'] = 60 // baseLps 60 → ratio 0.5
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
```
And in `tests/save.test.js`: extend `fakeStores()` with `ef: { state: { tierIndex: 2 }, toSave() { return { ...this.state } }, hydrate(s) { this.state = { ...s } } }`, assert `save.ef.tierIndex === 2` in the round-trip, and add:
```js
  it('migrates a v2 save by injecting ef/achievements/stats slices', () => {
    const v2 = { v: 2, savedAt: 5, game: {}, shop: {}, progress: {} }
    const out = migrate(v2)
    expect(out.v).toBe(SAVE_VERSION)
    expect(out.ef).toEqual({})
    expect(out.achievements).toEqual({})
    expect(out.stats).toEqual({})
  })
```
(The existing v1 migration test now expects `out.v === SAVE_VERSION` — it chains v1→v2→v3; keep its progress assertion.)

- [ ] **Step 2:** run — FAIL. **Step 3: Create `src/stores/ef.js`:**

```js
import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import { EF_TIERS } from '../data/ef.js'
import { EF_FEATURES } from '../data/efFeatures.js'
import { ERAS } from '../data/eras.js'
import { combineMods } from '../lib/modifiers.js'
import { useGameStore } from './game.js'
import { useShopStore } from './shop.js'
import { useProgressStore } from './progress.js'

const CARD_BY_ID = new Map(EF_FEATURES.map((f) => [f.id, f]))
const ERA_INDEX = new Map(ERAS.map((e, i) => [e.id, i]))

export const useEfStore = defineStore('ef', () => {
  const tierIndex = ref(-1) // -1 = Data track not started
  const ownedCards = reactive({})
  const firstReads = reactive({}) // permanent — Knowledge dedup across Rewrites

  const currentTier = computed(() => (tierIndex.value >= 0 ? EF_TIERS[tierIndex.value] : null))
  const nextTier = computed(() => EF_TIERS[tierIndex.value + 1] ?? null)
  const nextTierUnlocked = computed(() => {
    if (!nextTier.value) return false
    const progress = useProgressStore()
    return progress.eraIndex >= ERA_INDEX.get(nextTier.value.requiresEra)
  })

  const throughput = computed(() => {
    if (!currentTier.value) return 0
    const effects = Object.keys(ownedCards).map((id) => CARD_BY_ID.get(id)?.effect).filter(Boolean)
    return currentTier.value.baseThroughput * combineMods(effects).tpMult
  })

  // Emission = steady pre-Data production (shop.baseLps): using the PRE-multiplier
  // rate keeps the loop non-recursive and stable.
  const ratio = computed(() => {
    if (!currentTier.value) return 0
    const shop = useShopStore()
    return Math.min(1, throughput.value / Math.max(shop.baseLps, 1))
  })
  const dataMult = computed(() => (currentTier.value ? 1 + 2 * ratio.value : 1))

  function buyNextTier() {
    if (!nextTier.value || !nextTierUnlocked.value) return false
    const game = useGameStore()
    if (!game.spend(nextTier.value.cost)) return false
    tierIndex.value += 1
    return true
  }

  function buyCard(card) {
    if (ownedCards[card.id]) return false
    const game = useGameStore()
    if (!game.spend(card.cost)) return false
    ownedCards[card.id] = true
    if (!firstReads[card.id]) {
      firstReads[card.id] = true
      useProgressStore().addKnowledge(1)
    }
    return true
  }

  function toSave() {
    return { tierIndex: tierIndex.value, ownedCards: { ...ownedCards }, firstReads: { ...firstReads } }
  }

  function hydrate(slice) {
    const s = slice || {}
    const n = Number(s.tierIndex)
    tierIndex.value = Number.isInteger(n) ? Math.min(Math.max(n, -1), EF_TIERS.length - 1) : -1
    for (const k of Object.keys(ownedCards)) delete ownedCards[k]
    for (const id of Object.keys(s.ownedCards || {})) if (CARD_BY_ID.has(id)) ownedCards[id] = true
    for (const k of Object.keys(firstReads)) delete firstReads[k]
    for (const id of Object.keys(s.firstReads || {})) if (CARD_BY_ID.has(id)) firstReads[id] = true
  }

  return { tierIndex, ownedCards, firstReads, currentTier, nextTier, nextTierUnlocked, throughput, ratio, dataMult, buyNextTier, buyCard, toSave, hydrate }
})
```

- [ ] **Step 4: `src/stores/shop.js`** — split the lps computed:

```js
  // Steady production before the Data multiplier — also the EF track's emission.
  const baseLps = computed(() => {
    const progress = useProgressStore()
    return totalLps(CONTRIBUTORS, owned) * progress.mods.lpsMult
  })

  const lps = computed(() => {
    const ef = useEfStore()
    return baseLps.value * ef.dataMult
  })
```
(add `import { useEfStore } from './ef.js'`; export `baseLps` alongside `lps`.)

- [ ] **Step 5: `src/lib/save.js`** — `SAVE_VERSION = 3`; migration chain becomes:
```js
  if (save.v === 1) save = { ...save, v: 2, progress: {} }
  if (save.v === 2) save = { ...save, v: 3, ef: {}, achievements: {}, stats: {} }
```
`buildSave({ game, shop, progress, ef })` adds `ef: ef.toSave()` and carries `achievements: {}` / `stats: {}` literals for now (M3b stores will own them); `applySave` adds `ef.hydrate(save.ef || {})`.

- [ ] **Step 6: `src/stores/meta.js`** — `stores()` returns `{ game, shop, progress, ef: useEfStore() }` (add the import).
- [ ] **Step 7:** `npm test` — green (85 + 5 ef + 1 migration ≈ 91; report exact). **Step 8: Commit** → `feat: EF data track store + persistence ratio + save v3` (+ trailer)

---

### Task 4: Data tab UI (`EfPanel.vue` + FeatureCardItem genericization)

- [ ] **Step 1: Make `src/components/FeatureCardItem.vue` dumb** — replace its script+template so ownership/affordability/purchase come from the parent:

```vue
<script setup>
import { ref } from 'vue'
import { formatNumber } from '../lib/format.js'

defineProps({
  card: { type: Object, required: true },
  owned: { type: Boolean, required: true },
  affordable: { type: Boolean, required: true },
})
const emit = defineEmits(['buy'])
const showSnippet = ref(false)
</script>

<template>
  <div class="feature-card card" :class="{ owned }">
    <div class="feature-head">
      <strong>{{ card.name }}</strong>
      <button v-if="!owned" class="btn" :disabled="!affordable" @click="emit('buy')">
        {{ formatNumber(card.cost) }} LoC
      </button>
      <span v-else class="feature-owned">✓ learned</span>
    </div>
    <p class="feature-effect">{{ card.effectText }}</p>
    <p class="muted feature-blurb">{{ card.blurb }}</p>
    <button class="snippet-toggle muted" @click="showSnippet = !showSnippet">
      {{ showSnippet ? 'hide code' : 'show code' }}
    </button>
    <pre v-if="showSnippet" class="snippet"><code>{{ card.snippet }}</code></pre>
  </div>
</template>
```

- [ ] **Step 2: Update `src/components/FeatureList.vue`** to supply the bindings:

```vue
      <FeatureCardItem
        v-for="card in featuresOf(era.id)"
        :key="card.id"
        :card="card"
        :owned="Boolean(progress.ownedCards[card.id])"
        :affordable="game.loc >= card.cost"
        @buy="progress.buyCard(card)"
      />
```
(script gains `import { useGameStore } from '../stores/game.js'` + `const game = useGameStore()`.)

- [ ] **Step 3: Create `src/components/EfPanel.vue`** (exactly this):

```vue
<script setup>
import { computed } from 'vue'
import { useEfStore } from '../stores/ef.js'
import { useGameStore } from '../stores/game.js'
import { useShopStore } from '../stores/shop.js'
import { ERAS } from '../data/eras.js'
import { efFeaturesOf } from '../data/efFeatures.js'
import { formatNumber, formatRate } from '../lib/format.js'
import FeatureCardItem from './FeatureCardItem.vue'

const ef = useEfStore()
const game = useGameStore()
const shop = useShopStore()

const requiredEraName = computed(() => {
  if (!ef.nextTier) return ''
  const era = ERAS.find((e) => e.id === ef.nextTier.requiresEra)
  return era ? era.csVersion : ''
})
const tierCards = computed(() => (ef.tierIndex >= 0 ? efFeaturesOf(ef.currentTier.id) : []))
</script>

<template>
  <div class="shop-list">
    <div class="card ef-status">
      <template v-if="ef.tierIndex >= 0">
        <p class="ef-line"><strong>{{ ef.currentTier.name }}</strong> — your data layer</p>
        <div class="persistence-bar">
          <div class="persistence-fill" :style="{ width: Math.round(ef.ratio * 100) + '%' }" />
        </div>
        <p class="muted ef-line">
          Persistence: {{ Math.round(ef.ratio * 100) }}% · throughput {{ formatRate(ef.throughput) }} vs
          emission {{ formatRate(shop.baseLps) }} · production ×{{ ef.dataMult.toFixed(2) }}
        </p>
      </template>
      <p v-else class="muted ef-line">
        Your app emits Data as it grows — without a data layer it's all lost.
        Adopt Entity Framework to persist it and multiply production (up to ×3).
      </p>
      <button
        v-if="ef.nextTier"
        class="btn btn-primary"
        :disabled="!ef.nextTierUnlocked || game.loc < ef.nextTier.cost"
        @click="ef.buyNextTier()"
      >
        💾 {{ ef.tierIndex >= 0 ? 'Upgrade to' : 'Adopt' }} {{ ef.nextTier.name }} — {{ formatNumber(ef.nextTier.cost) }} LoC
      </button>
      <p v-if="ef.nextTier && !ef.nextTierUnlocked" class="muted ef-line">Requires the {{ requiredEraName }} era.</p>
    </div>
    <template v-if="ef.tierIndex >= 0">
      <h3 class="era-heading">{{ ef.currentTier.name }} features</h3>
      <FeatureCardItem
        v-for="card in tierCards"
        :key="card.id"
        :card="card"
        :owned="Boolean(ef.ownedCards[card.id])"
        :affordable="game.loc >= card.cost"
        @buy="ef.buyCard(card)"
      />
    </template>
  </div>
</template>
```

- [ ] **Step 4: `src/components/ShopPanel.vue`** — TABS gains `{ id: 'data', label: 'Data' }` between features and skills; template gains `<EfPanel v-else-if="active === 'data'" />` (+ import).
- [ ] **Step 5: `src/components/HeaderBar.vue`** — add after the 🧠 span: `<span v-if="ef.tierIndex >= 0" class="muted">💾 {{ Math.round(ef.ratio * 100) }}%</span>` (script: import/use `useEfStore`).
- [ ] **Step 6: styles append to `src/styles/index.css`:**

```css
/* ── EF data track ── */
.ef-status { display: flex; flex-direction: column; gap: 8px; }
.ef-line { margin: 0; }
.persistence-bar { height: 10px; border-radius: 5px; background: var(--bg); border: 1px solid var(--border); overflow: hidden; }
.persistence-fill { height: 100%; background: var(--accent); transition: width 300ms ease; }
```

- [ ] **Step 7:** `npm test` (no regressions) + `npm run build` + dev-server HTTP 200 smoke. **Step 8: Commit** → `feat: Data tab — EF tier ladder, persistence bar, generic feature cards` (+ trailer)

---

### Tasks 5–7 (WEB RESEARCH, parallel): author cs8–cs10 / cs11–cs12 / cs13–cs14 content
### Task 8 (WEB RESEARCH, parallel): author EF card content

Same authoring rules as M2 (they are restated in full in each dispatch): learn.microsoft.com only (language: "What's new in C# N" + language reference; EF: learn.microsoft.com/ef + "What's New in EF Core N" pages — for C# 13/14 and EF 9/10/11 use the CURRENT docs, these are recent versions); `// Sources:` comment per file; blurb >20 ≤160 chars factual; snippet >10 ≤220 chars valid for that version (no later-version syntax); questions exactly 10 per era, 1–2 per feature, ids `q-cs8-01`…, 4 options ≤80 chars, single correct `answer` index, answerable from that card's blurb+snippet alone. EF cards get blurb+snippet only (NO questions — EF knowledge feeds M3b's PR bank instead). Locked fields (ids/costs/effects/effectText/tier) must not change — if research shows a feature NAME is version-misattributed, finish everything else and report it as DONE_WITH_CONCERNS for the controller.

Ownership: T5 → `content/cs8.js`, `cs9.js`, `cs10.js` · T6 → `cs11.js`, `cs12.js` · T7 → `cs13.js`, `cs14.js` · T8 → `content/ef.js`. Each task verifies its own files with a filtered vitest run (content suite stays green because strict coverage is still scoped to AUTHORED), then commits only its own files: `content: doc-verified <range>` (+ trailer).

---

### Task 9 (WEB RESEARCH): adversarial fact-check + restore strict coverage

Fresh agent. (a) Fact-check ALL new content (42 language cards, 70 questions, 17 EF cards) against learn.microsoft.com — version attribution, snippet validity for its version, single-correct-answer, answerable-from-card; fix text inline (never ids/costs/effects). (b) Then RESTORE strict tests in `tests/content.test.js`: delete the `AUTHORED` scoping so the questions-per-era loop iterates all `ERAS` and the blurb/snippet-length loop iterates all `LANGUAGE_FEATURES`; add EF content strictness:

```js
  it('every EF card has authored blurb and snippet', () => {
    for (const f of EF_FEATURES) {
      expect(f.blurb.length, f.id).toBeGreaterThan(20)
      expect(f.blurb.length, f.id).toBeLessThanOrEqual(160)
      expect(f.snippet.length, f.id).toBeGreaterThan(10)
      expect(f.snippet.length, f.id).toBeLessThanOrEqual(220)
    }
  })
```
(c) `npm test` — everything green with strict coverage. Commit `fix(content): M3a fact-check + strict coverage restored` (+ trailer). Report every error found+fixed with doc URLs; zero-errors is suspicious — re-verify the 5 subtlest claims (C# 13 Lock semantics, C# 14 extension members, EF10 LeftJoin, EF11 preview claims, cs8 default interface methods) before claiming it.

---

### Task 10: Integration + deploy

- [ ] `npm test` full green · `npm run build` · `git status` clean.
- [ ] Push `git push origin main`; watch CI (`gh run watch …  --exit-status`); fetch the live URL and confirm the new bundle hash + spot-check that 'cs14' and 'EF Core' appear in the served JS.
- [ ] Owner checklist (report): play from an M2 save — certified-cs7 player should advance to cs8 by funding the CURRENT (cs7-priced, 1e8) Release without a new exam; adopt EF6 from the Data tab once past cs5.

## Self-review notes (applied)

- v2 live saves migrate v2→v3 (chain test); deployed M2 clients refuse v3 rows (newer-build guard) until refresh — by design.
- `shop.baseLps` is the emission anchor: no dataMult recursion; transient M3b buffs will also be excluded from emission by reusing baseLps.
- `eraIndex` hydrate clamp now allows 0–12 (ERAS grew) automatically — no migration needed for M2 saves' eraIndex.
- Knowledge economy: max grows to 78 first-reads (language) + 17 (EF) + 13 exams × 3 = 134 vs full tree 60 — tree completable late-game; acceptable for M3 (M4 prestige re-tunes; noted for the balance sim).
