# Greenfield M2 — Learning Spine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The learning spine — six Eras (C# 2 → C# 7) with doc-verified Feature Cards, the two-step Era Gate (fund the Release → pass the Certification Exam), Knowledge earned and allocated into a four-branch Skill Tree, all feeding a new modifiers engine; save schema v2 with migration.

**Architecture:** A pure `modifiers.js` lib composes multiplicative effects (`clickMult`/`lpsMult`/`costMult`/`releaseMult`) from owned Feature Cards + Skill allocations; a new `progress` Pinia store owns era state, cards, exams, Knowledge, and skills, and exposes a `mods` computed that `game`/`shop` consume lazily. Content lives in one file per era (`src/data/content/cs2.js` … `cs7.js`) so two web-research agents can author in parallel without file conflicts; aggregators re-export the combined sets. Save bumps to v2 with a step migration (v1 saves gain an empty `progress` slice).

**Tech Stack:** Same as M1 — Vue 3 + Pinia + Vite + Vitest, plain JS. New: WebSearch/WebFetch for content-authoring tasks (learn.microsoft.com is the source of truth).

**Design spec:** `docs/superpowers/specs/2026-06-11-greenfield-design.md` · **Glossary:** `CONTEXT.md` (canonical terms: Era, Era Gate, Release, Certification Exam, Feature Card, Knowledge, Skill Tree — never "level/wall/test/perk/XP/tech tree")

**Out of scope for M2** (do NOT build): C# 8–14 eras, EF/Data track, PR events, combo meter, golden NuGets, achievements, offline gains, prestige/Rewrite (exam auto-pass replay arrives with it), leaderboard, art assets (emoji/text placeholders stay). Balance numbers are provisional until M4's simulation.

---

## Design contracts (used by every task — keep names EXACT)

- **Effect:** `{ type: 'clickMult'|'lpsMult'|'costMult'|'releaseMult', value: number }` — multiplicative, composed by `combineMods`.
- **Feature Card:** `{ id, era, name, cost, effect, effectText, blurb, snippet }` — `id` is `cs<N>-<slug>`; `blurb` ≤ 160 chars, one factual sentence; `snippet` ≤ 220 chars of valid era-appropriate C#.
- **Question:** `{ id: 'q-cs<N>-<NN>', era, feature, text, options: [4 strings], answer: 0-3 }` — 10 per era, every feature has 1–2, answerable from that card's blurb+snippet alone (teach first, test second).
- **Exam:** size = `min(6, pool)`, pass mark = `size − 1`, pool = era questions whose `feature` card is owned; eligibility = Release funded AND owned ≥ 50% of the era's cards; fail cooldown 90 s.
- **Knowledge:** +1 on first-ever purchase of a card (`firstReads`, permanent), +3 per exam pass. Allocated (never consumed): free = total − Σ allocated node costs. Node `i` (0-based) costs `i+1`; 5 nodes per branch.
- **Save v2:** adds `progress` slice; v1 → v2 migration injects `progress: {}`.

## File structure

```
src/lib/modifiers.js            T1 — combineMods (pure)
src/lib/exam.js                 T2 — pool/draw/grade/eligibility (pure)
src/data/eras.js                T3 — 6 eras: id, csVersion, year, name, releaseCost, color
src/data/skills.js              T3 — 4 branches × 5 nodes
src/data/content/cs2.js…cs7.js  T4 skeletons → T5/T6 (web) fill blurbs/snippets/questions
src/data/featuresLanguage.js    T4 — aggregator (LANGUAGE_FEATURES)
src/data/questions.js           T4 — aggregator (QUESTIONS)
src/stores/progress.js          T7 — era/cards/exams/knowledge/skills + mods computed
src/lib/save.js                 T7 — SAVE_VERSION 2 + migration step
src/stores/meta.js              T7 — progress wired into stores()/buildSave/applySave
src/stores/game.js              T8 — click × mods.clickMult
src/stores/shop.js              T8 — lps × mods.lpsMult, costs × mods.costMult
src/components/ShopPanel.vue    T9 — becomes tab host (Contributors | Features | Skills)
src/components/FeatureCardItem.vue  T9
src/components/FeatureList.vue      T9
src/components/SkillTreePanel.vue   T9
src/components/EraPanel.vue     T10 — era status, Release funding, exam entry
src/components/ExamModal.vue    T10
src/components/HeaderBar.vue    T10 — era chip + Knowledge counter
src/App.vue                     T10 — EraPanel in left pane
src/styles/index.css            T9/T10 — appended styles
tests/modifiers.test.js T1 · exam.test.js T2 · content.test.js T4(+T5/T6 enable) ·
progress.test.js T7 · stores.test.js T8 (modify) · save.test.js T7 (modify)
```

## Execution order / parallelism (2–5 subagents)

- **Wave 1 (parallel):** T1, T2, T3 — independent pure modules/data.
- **T4 alone** (needs T1's effect types + T3's era ids).
- **Wave 2 (parallel, web-enabled):** T5 (cs2–cs4), T6 (cs5–cs7) — disjoint files.
- **T6.5: adversarial fact-check** (web-enabled) of ALL content — runs as its own task after Wave 2.
- **Sequential tail:** T7 → T8 → T9 → T10 → T11 (integration + deploy).
- Commits end with `-m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`. Parallel agents stage ONLY their own files; retry on index.lock. All commands from `E:\Projects\Vue\Greenfield`.

---

### Task 1: Modifiers engine (`lib/modifiers.js`)

**Files:** Create `src/lib/modifiers.js` · Test `tests/modifiers.test.js`

- [ ] **Step 1: Failing tests**

```js
import { describe, it, expect } from 'vitest'
import { BASE_MODS, EFFECT_TYPES, combineMods } from '../src/lib/modifiers.js'

describe('combineMods', () => {
  it('returns base (all ×1) for empty input', () => {
    expect(combineMods([])).toEqual(BASE_MODS)
    expect(combineMods()).toEqual(BASE_MODS)
  })
  it('multiplies same-type effects together', () => {
    const mods = combineMods([
      { type: 'clickMult', value: 2 },
      { type: 'clickMult', value: 1.5 },
      { type: 'lpsMult', value: 1.25 },
      { type: 'costMult', value: 0.9 },
      { type: 'releaseMult', value: 0.95 },
    ])
    expect(mods.clickMult).toBeCloseTo(3)
    expect(mods.lpsMult).toBeCloseTo(1.25)
    expect(mods.costMult).toBeCloseTo(0.9)
    expect(mods.releaseMult).toBeCloseTo(0.95)
  })
  it('ignores unknown types and junk values (hostile save data)', () => {
    const mods = combineMods([
      { type: 'hax', value: 99 },
      { type: 'clickMult', value: 'NaN' },
      { type: 'clickMult', value: -2 },
      { type: 'clickMult', value: Infinity },
      null,
    ])
    expect(mods).toEqual(BASE_MODS)
  })
  it('exposes the canonical effect type list', () => {
    expect(EFFECT_TYPES).toEqual(['clickMult', 'lpsMult', 'costMult', 'releaseMult'])
  })
})
```

- [ ] **Step 2:** `npx vitest run tests/modifiers.test.js` — FAIL (module not found).
- [ ] **Step 3: Implement `src/lib/modifiers.js`**

```js
// Multiplicative modifier composition. Effects come from owned Feature Cards
// and Skill Tree allocations — and therefore, via saves, from the world-
// writable cloud table: validate every entry, never trust values.
export const EFFECT_TYPES = ['clickMult', 'lpsMult', 'costMult', 'releaseMult']
export const BASE_MODS = Object.freeze({ clickMult: 1, lpsMult: 1, costMult: 1, releaseMult: 1 })

export function combineMods(effects) {
  const mods = { ...BASE_MODS }
  for (const e of effects || []) {
    if (!e || !EFFECT_TYPES.includes(e.type)) continue
    const v = Number(e.value)
    if (!Number.isFinite(v) || v <= 0) continue
    mods[e.type] *= v
  }
  return mods
}
```

- [ ] **Step 4:** tests PASS. — [ ] **Step 5: Commit** `git add src/lib/modifiers.js tests/modifiers.test.js && git commit -m "feat: modifiers engine — multiplicative effect composition"` (+ trailer)

---

### Task 2: Exam logic (`lib/exam.js`)

**Files:** Create `src/lib/exam.js` · Test `tests/exam.test.js`

- [ ] **Step 1: Failing tests**

```js
import { describe, it, expect } from 'vitest'
import { EXAM_SIZE, EXAM_COOLDOWN_MS, poolFor, drawExam, passMarkFor, gradeExam, examEligibility } from '../src/lib/exam.js'

const Q = (id, feature) => ({ id, era: 'cs2', feature, text: 't', options: ['a', 'b', 'c', 'd'], answer: 1 })
const QUESTIONS = [
  Q('q1', 'cs2-generics'), Q('q2', 'cs2-generics'), Q('q3', 'cs2-iterators'),
  Q('q4', 'cs2-iterators'), Q('q5', 'cs2-partial-types'), Q('q6', 'cs2-static-classes'),
  Q('q7', 'cs2-nullable-value-types'), { ...Q('q8', 'cs3-linq'), era: 'cs3' },
]

describe('poolFor', () => {
  it('filters by era AND owned feature cards', () => {
    const pool = poolFor(QUESTIONS, 'cs2', ['cs2-generics', 'cs2-iterators', 'cs3-linq'])
    expect(pool.map((q) => q.id)).toEqual(['q1', 'q2', 'q3', 'q4'])
  })
})

describe('drawExam', () => {
  it('draws min(EXAM_SIZE, pool) distinct questions using the injected rand', () => {
    const pool = poolFor(QUESTIONS, 'cs2', ['cs2-generics', 'cs2-iterators', 'cs2-partial-types', 'cs2-static-classes', 'cs2-nullable-value-types'])
    expect(pool).toHaveLength(7)
    const drawn = drawExam(pool, () => 0.42)
    expect(drawn).toHaveLength(EXAM_SIZE)
    expect(new Set(drawn.map((q) => q.id)).size).toBe(EXAM_SIZE)
  })
  it('draws the whole pool when it is smaller than EXAM_SIZE', () => {
    const pool = poolFor(QUESTIONS, 'cs2', ['cs2-generics'])
    expect(drawExam(pool, () => 0.1)).toHaveLength(2)
  })
})

describe('grading', () => {
  it('pass mark is size − 1 (minimum 1)', () => {
    expect(passMarkFor(6)).toBe(5)
    expect(passMarkFor(3)).toBe(2)
    expect(passMarkFor(1)).toBe(1)
  })
  it('grades answers against the answer index', () => {
    const drawn = [Q('q1', 'f'), Q('q2', 'f'), Q('q3', 'f')]
    expect(gradeExam(drawn, [1, 1, 0])).toEqual({ correct: 2, size: 3, passed: true })
    expect(gradeExam(drawn, [0, 0, 0])).toEqual({ correct: 0, size: 3, passed: false })
  })
})

describe('examEligibility', () => {
  const base = { releaseFunded: true, ownedEraCount: 3, eraCardCount: 6, lastExamFailAt: 0, now: 1_000_000 }
  it('eligible when funded, ≥50% cards, off cooldown', () => {
    expect(examEligibility(base)).toEqual({ eligible: true, reason: null })
  })
  it('blocks without Release funding', () => {
    expect(examEligibility({ ...base, releaseFunded: false }).reason).toBe('release')
  })
  it('blocks under 50% card ownership', () => {
    expect(examEligibility({ ...base, ownedEraCount: 2 }).reason).toBe('cards')
  })
  it('blocks during the fail cooldown', () => {
    expect(examEligibility({ ...base, lastExamFailAt: base.now - EXAM_COOLDOWN_MS + 1 }).reason).toBe('cooldown')
    expect(examEligibility({ ...base, lastExamFailAt: base.now - EXAM_COOLDOWN_MS }).eligible).toBe(true)
  })
})
```

- [ ] **Step 2:** run — FAIL. — [ ] **Step 3: Implement `src/lib/exam.js`**

```js
// Certification Exam mechanics (pure). Design contract: exam draws only from
// questions whose Feature Card is OWNED (teach first, test second); the gate
// itself additionally requires the Release funded and ≥50% era cards owned.
export const EXAM_SIZE = 6
export const EXAM_COOLDOWN_MS = 90_000

export function poolFor(questions, eraId, ownedCardIds) {
  const owned = new Set(ownedCardIds)
  return questions.filter((q) => q.era === eraId && owned.has(q.feature))
}

// Fisher–Yates with injectable rand so tests are deterministic.
export function drawExam(pool, rand = Math.random) {
  const deck = [...pool]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck.slice(0, Math.min(EXAM_SIZE, deck.length))
}

export function passMarkFor(size) {
  return Math.max(1, size - 1)
}

export function gradeExam(drawn, answers) {
  const correct = drawn.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0)
  return { correct, size: drawn.length, passed: correct >= passMarkFor(drawn.length) }
}

export function examEligibility({ releaseFunded, ownedEraCount, eraCardCount, lastExamFailAt, now }) {
  if (!releaseFunded) return { eligible: false, reason: 'release' }
  if (ownedEraCount * 2 < eraCardCount) return { eligible: false, reason: 'cards' }
  if (now - lastExamFailAt < EXAM_COOLDOWN_MS) return { eligible: false, reason: 'cooldown' }
  return { eligible: true, reason: null }
}
```

- [ ] **Step 4:** PASS. — [ ] **Step 5: Commit** `git add src/lib/exam.js tests/exam.test.js && git commit -m "feat: exam logic — pool, deterministic draw, grading, eligibility"` (+ trailer)

---

### Task 3: Eras + Skill Tree data (`data/eras.js`, `data/skills.js`)

**Files:** Create `src/data/eras.js`, `src/data/skills.js` · Test `tests/content.test.js` (first half)

- [ ] **Step 1: Failing tests** (`tests/content.test.js`)

```js
import { describe, it, expect } from 'vitest'
import { ERAS } from '../src/data/eras.js'
import { SKILL_BRANCHES, MAX_SKILL_NODES, skillNodeCost } from '../src/data/skills.js'
import { EFFECT_TYPES } from '../src/lib/modifiers.js'

describe('ERAS', () => {
  it('has the six M2 eras in chronological order with rising Release costs', () => {
    expect(ERAS.map((e) => e.id)).toEqual(['cs2', 'cs3', 'cs4', 'cs5', 'cs6', 'cs7'])
    for (let i = 1; i < ERAS.length; i++) {
      expect(ERAS[i].releaseCost).toBeGreaterThan(ERAS[i - 1].releaseCost)
      expect(ERAS[i].year).toBeGreaterThan(ERAS[i - 1].year)
    }
  })
  it('every era has the required fields', () => {
    for (const e of ERAS) {
      expect(typeof e.csVersion).toBe('string')
      expect(typeof e.name).toBe('string')
      expect(e.releaseCost).toBeGreaterThan(0)
      expect(e.color).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})

describe('SKILL_BRANCHES', () => {
  it('has the four canonical branches with valid effect types', () => {
    expect(SKILL_BRANCHES.map((b) => b.id)).toEqual(['language', 'data', 'performance', 'tooling'])
    for (const b of SKILL_BRANCHES) {
      expect(EFFECT_TYPES).toContain(b.effectType)
      expect(b.perNode).toBeGreaterThan(0)
      expect(typeof b.blurb).toBe('string')
    }
  })
  it('node costs are 1..5 and the full tree costs 60 (> max M2 Knowledge of 54)', () => {
    expect([0, 1, 2, 3, 4].map(skillNodeCost)).toEqual([1, 2, 3, 4, 5])
    expect(MAX_SKILL_NODES).toBe(5)
    const fullTree = SKILL_BRANCHES.length * [0, 1, 2, 3, 4].reduce((s, i) => s + skillNodeCost(i), 0)
    expect(fullTree).toBe(60)
  })
})
```

- [ ] **Step 2:** run `npx vitest run tests/content.test.js` — FAIL.
- [ ] **Step 3: Implement `src/data/eras.js`** (Release costs provisional — M4 simulation re-tunes)

```js
export const ERAS = [
  { id: 'cs2', csVersion: 'C# 2',  year: 2005, name: 'The Generics Era', releaseCost: 500,   color: '#d29b7c' },
  { id: 'cs3', csVersion: 'C# 3',  year: 2007, name: 'The LINQ Era',     releaseCost: 6_000, color: '#d7b65f' },
  { id: 'cs4', csVersion: 'C# 4',  year: 2010, name: 'The Dynamic Era',  releaseCost: 7e4,   color: '#a9c25f' },
  { id: 'cs5', csVersion: 'C# 5',  year: 2012, name: 'The Async Era',    releaseCost: 8e5,   color: '#5fcf9f' },
  { id: 'cs6', csVersion: 'C# 6',  year: 2015, name: 'The Roslyn Era',   releaseCost: 9e6,   color: '#72b8de' },
  { id: 'cs7', csVersion: 'C# 7',  year: 2017, name: 'The Pattern Era',  releaseCost: 1e8,   color: '#b491e8' },
]
```

- [ ] **Step 4: Implement `src/data/skills.js`**

```js
// Skill Tree: Knowledge is ALLOCATED here, never consumed (CONTEXT.md).
// Allocation resets at every Rewrite (M4); the budget never does.
export const MAX_SKILL_NODES = 5
export function skillNodeCost(nodeIndex) {
  return nodeIndex + 1 // 1+2+3+4+5 = 15 per full branch, 60 for the tree
}
export const SKILL_BRANCHES = [
  { id: 'language',    name: 'Language',    icon: '{ }', effectType: 'clickMult',   perNode: 1.12, blurb: '+12% click power per point' },
  { id: 'data',        name: 'Data',        icon: '🗄️',  effectType: 'lpsMult',     perNode: 1.10, blurb: '+10% LoC/s per point' },
  { id: 'performance', name: 'Performance', icon: '⏱️',  effectType: 'costMult',    perNode: 0.96, blurb: '−4% Contributor costs per point' },
  { id: 'tooling',     name: 'Tooling',     icon: '🔧',  effectType: 'releaseMult', perNode: 0.94, blurb: '−6% Release funding cost per point' },
]
```

- [ ] **Step 5:** content tests PASS (other suites untouched). — [ ] **Step 6: Commit** `git add src/data/eras.js src/data/skills.js tests/content.test.js && git commit -m "feat: era ladder + skill tree data"` (+ trailer)

---

### Task 4: Content skeletons + aggregators (`data/content/cs2.js`…`cs7.js`, `featuresLanguage.js`, `questions.js`)

**Files:** Create `src/data/content/cs2.js` … `cs7.js`, `src/data/featuresLanguage.js`, `src/data/questions.js` · Modify `tests/content.test.js` (append)

Every content file exports `ERA_CONTENT = { features: [...], questions: [] }`. Skeletons carry the FINAL ids/names/costs/effects (the game-design layer, fixed here); `blurb`/`snippet` are empty strings and `questions` empty arrays — Tasks 5/6 (web research) fill them. The exact entries follow; transcribe them verbatim.

- [ ] **Step 1: Write `src/data/content/cs2.js`**

```js
// C# 2 (2005) — content authored against learn.microsoft.com in Task 5; sources listed there.
export const ERA_CONTENT = {
  features: [
    { id: 'cs2-generics',             era: 'cs2', name: 'Generics',             cost: 60,  effect: { type: 'lpsMult',   value: 1.25 }, effectText: 'All Contributors +25% LoC/s',  blurb: '', snippet: '' },
    { id: 'cs2-nullable-value-types', era: 'cs2', name: 'Nullable Value Types', cost: 90,  effect: { type: 'clickMult', value: 1.25 }, effectText: 'Click power +25%',             blurb: '', snippet: '' },
    { id: 'cs2-anonymous-methods',    era: 'cs2', name: 'Anonymous Methods',    cost: 120, effect: { type: 'clickMult', value: 1.20 }, effectText: 'Click power +20%',             blurb: '', snippet: '' },
    { id: 'cs2-iterators',            era: 'cs2', name: 'Iterators (yield)',    cost: 160, effect: { type: 'lpsMult',   value: 1.15 }, effectText: 'All Contributors +15% LoC/s',  blurb: '', snippet: '' },
    { id: 'cs2-partial-types',        era: 'cs2', name: 'Partial Types',        cost: 200, effect: { type: 'costMult',  value: 0.95 }, effectText: 'Contributor costs −5%',        blurb: '', snippet: '' },
    { id: 'cs2-static-classes',       era: 'cs2', name: 'Static Classes',       cost: 250, effect: { type: 'clickMult', value: 1.15 }, effectText: 'Click power +15%',             blurb: '', snippet: '' },
  ],
  questions: [],
}
```

- [ ] **Step 2: Write `src/data/content/cs3.js`** — same shape, entries:

```js
    { id: 'cs3-linq',                era: 'cs3', name: 'LINQ',                    cost: 600,   effect: { type: 'lpsMult',   value: 1.50 }, effectText: 'All Contributors +50% LoC/s' },
    { id: 'cs3-lambdas',             era: 'cs3', name: 'Lambda Expressions',      cost: 800,   effect: { type: 'clickMult', value: 1.30 }, effectText: 'Click power +30%' },
    { id: 'cs3-extension-methods',   era: 'cs3', name: 'Extension Methods',       cost: 1_100, effect: { type: 'lpsMult',   value: 1.20 }, effectText: 'All Contributors +20% LoC/s' },
    { id: 'cs3-var',                 era: 'cs3', name: 'Implicit Typing (var)',   cost: 1_500, effect: { type: 'clickMult', value: 1.20 }, effectText: 'Click power +20%' },
    { id: 'cs3-auto-properties',     era: 'cs3', name: 'Auto-Properties',         cost: 1_900, effect: { type: 'costMult',  value: 0.93 }, effectText: 'Contributor costs −7%' },
    { id: 'cs3-object-initializers', era: 'cs3', name: 'Object Initializers',     cost: 2_400, effect: { type: 'lpsMult',   value: 1.15 }, effectText: 'All Contributors +15% LoC/s' },
```

- [ ] **Step 3: Write `src/data/content/cs4.js`** — entries:

```js
    { id: 'cs4-dynamic',             era: 'cs4', name: 'dynamic',                  cost: 7e3,   effect: { type: 'clickMult', value: 1.25 }, effectText: 'Click power +25%' },
    { id: 'cs4-named-arguments',     era: 'cs4', name: 'Named Arguments',          cost: 9e3,   effect: { type: 'clickMult', value: 1.15 }, effectText: 'Click power +15%' },
    { id: 'cs4-optional-parameters', era: 'cs4', name: 'Optional Parameters',      cost: 1.2e4, effect: { type: 'costMult',  value: 0.93 }, effectText: 'Contributor costs −7%' },
    { id: 'cs4-generic-variance',    era: 'cs4', name: 'Generic Variance',         cost: 1.6e4, effect: { type: 'lpsMult',   value: 1.20 }, effectText: 'All Contributors +20% LoC/s' },
    { id: 'cs4-tpl',                 era: 'cs4', name: 'Task Parallel Library',    cost: 2.2e4, effect: { type: 'lpsMult',   value: 1.35 }, effectText: 'All Contributors +35% LoC/s' },
    { id: 'cs4-tuple-class',         era: 'cs4', name: 'Tuple<T> Classes',         cost: 3e4,   effect: { type: 'lpsMult',   value: 1.10 }, effectText: 'All Contributors +10% LoC/s' },
```

- [ ] **Step 4: Write `src/data/content/cs5.js`** — entries:

```js
    { id: 'cs5-async-await',     era: 'cs5', name: 'async / await',             cost: 8e4,   effect: { type: 'lpsMult',   value: 2.00 }, effectText: 'Parallel production — all Contributors ×2' },
    { id: 'cs5-tap',             era: 'cs5', name: 'Task-based Async Pattern',  cost: 1.1e5, effect: { type: 'lpsMult',   value: 1.25 }, effectText: 'All Contributors +25% LoC/s' },
    { id: 'cs5-caller-info',     era: 'cs5', name: 'Caller Info Attributes',    cost: 1.5e5, effect: { type: 'clickMult', value: 1.20 }, effectText: 'Click power +20%' },
    { id: 'cs5-cancellation',    era: 'cs5', name: 'CancellationToken',         cost: 2e5,   effect: { type: 'costMult',  value: 0.92 }, effectText: 'Contributor costs −8%' },
    { id: 'cs5-iprogress',       era: 'cs5', name: 'IProgress<T>',              cost: 2.6e5, effect: { type: 'lpsMult',   value: 1.15 }, effectText: 'All Contributors +15% LoC/s' },
    { id: 'cs5-async-streams-precursor', era: 'cs5', name: 'Awaitable Anything', cost: 3.5e5, effect: { type: 'clickMult', value: 1.25 }, effectText: 'Click power +25%' },
```

- [ ] **Step 5: Write `src/data/content/cs6.js`** — entries:

```js
    { id: 'cs6-string-interpolation', era: 'cs6', name: 'String Interpolation',      cost: 9e5,   effect: { type: 'clickMult', value: 1.35 }, effectText: 'Click power +35%' },
    { id: 'cs6-null-conditional',     era: 'cs6', name: 'Null-Conditional (?.)',     cost: 1.2e6, effect: { type: 'lpsMult',   value: 1.25 }, effectText: 'All Contributors +25% LoC/s' },
    { id: 'cs6-nameof',               era: 'cs6', name: 'nameof',                    cost: 1.6e6, effect: { type: 'costMult',  value: 0.92 }, effectText: 'Contributor costs −8%' },
    { id: 'cs6-expression-bodied',    era: 'cs6', name: 'Expression-Bodied Members', cost: 2.1e6, effect: { type: 'clickMult', value: 1.25 }, effectText: 'Click power +25%' },
    { id: 'cs6-auto-property-init',   era: 'cs6', name: 'Auto-Property Initializers', cost: 2.9e6, effect: { type: 'lpsMult',  value: 1.20 }, effectText: 'All Contributors +20% LoC/s' },
    { id: 'cs6-exception-filters',    era: 'cs6', name: 'Exception Filters',          cost: 4e6,  effect: { type: 'lpsMult',  value: 1.15 }, effectText: 'All Contributors +15% LoC/s' },
```

- [ ] **Step 6: Write `src/data/content/cs7.js`** — entries:

```js
    { id: 'cs7-pattern-matching', era: 'cs7', name: 'Pattern Matching',     cost: 1e7,   effect: { type: 'lpsMult',   value: 1.50 }, effectText: 'All Contributors +50% LoC/s' },
    { id: 'cs7-tuples',           era: 'cs7', name: 'Value Tuples',         cost: 1.4e7, effect: { type: 'clickMult', value: 1.40 }, effectText: 'Click power +40%' },
    { id: 'cs7-local-functions',  era: 'cs7', name: 'Local Functions',      cost: 1.9e7, effect: { type: 'lpsMult',   value: 1.25 }, effectText: 'All Contributors +25% LoC/s' },
    { id: 'cs7-out-var',          era: 'cs7', name: 'out var',              cost: 2.5e7, effect: { type: 'clickMult', value: 1.25 }, effectText: 'Click power +25%' },
    { id: 'cs7-ref-returns',      era: 'cs7', name: 'ref Returns & Locals', cost: 3.4e7, effect: { type: 'costMult',  value: 0.90 }, effectText: 'Contributor costs −10%' },
    { id: 'cs7-throw-expressions', era: 'cs7', name: 'Throw Expressions',   cost: 4.5e7, effect: { type: 'lpsMult',   value: 1.20 }, effectText: 'All Contributors +20% LoC/s' },
```

(Each of Steps 2–6 wraps its entries in the same `export const ERA_CONTENT = { features: [...], questions: [] }` shell as Step 1, with `blurb: '', snippet: ''` on every entry.)

- [ ] **Step 7: Write aggregators**

`src/data/featuresLanguage.js`:
```js
import { ERA_CONTENT as cs2 } from './content/cs2.js'
import { ERA_CONTENT as cs3 } from './content/cs3.js'
import { ERA_CONTENT as cs4 } from './content/cs4.js'
import { ERA_CONTENT as cs5 } from './content/cs5.js'
import { ERA_CONTENT as cs6 } from './content/cs6.js'
import { ERA_CONTENT as cs7 } from './content/cs7.js'

const ALL = [cs2, cs3, cs4, cs5, cs6, cs7]
export const LANGUAGE_FEATURES = ALL.flatMap((c) => c.features)
export const QUESTIONS = ALL.flatMap((c) => c.questions)
export function featuresOf(eraId) {
  return LANGUAGE_FEATURES.filter((f) => f.era === eraId)
}
```

`src/data/questions.js`:
```js
export { QUESTIONS } from './featuresLanguage.js'
```

- [ ] **Step 8: Append structure tests to `tests/content.test.js`**

```js
import { LANGUAGE_FEATURES, featuresOf } from '../src/data/featuresLanguage.js'
import { QUESTIONS } from '../src/data/questions.js'

describe('LANGUAGE_FEATURES structure', () => {
  it('has 36 cards, 6 per era, unique ids, era-prefixed', () => {
    expect(LANGUAGE_FEATURES).toHaveLength(36)
    expect(new Set(LANGUAGE_FEATURES.map((f) => f.id)).size).toBe(36)
    for (const era of ERAS) expect(featuresOf(era.id)).toHaveLength(6)
    for (const f of LANGUAGE_FEATURES) expect(f.id.startsWith(f.era + '-')).toBe(true)
  })
  it('costs rise within each era and effects use valid types', () => {
    for (const era of ERAS) {
      const cards = featuresOf(era.id)
      for (let i = 1; i < cards.length; i++) expect(cards[i].cost).toBeGreaterThan(cards[i - 1].cost)
      for (const c of cards) {
        expect(EFFECT_TYPES).toContain(c.effect.type)
        expect(c.effect.value).toBeGreaterThan(0)
        expect(typeof c.effectText).toBe('string')
      }
    }
  })
})
```

(QUESTIONS content invariants arrive with Tasks 5/6 when questions exist.)

- [ ] **Step 9:** `npm test` — all suites green. — [ ] **Step 10: Commit** `git add src/data/content/ src/data/featuresLanguage.js src/data/questions.js tests/content.test.js && git commit -m "feat: era content skeletons — 36 cards with costs/effects, aggregators"` (+ trailer)

---

### Task 5 (WEB RESEARCH): Author cs2–cs4 content · Task 6 (WEB RESEARCH): Author cs5–cs7 content

Two parallel agents; identical instructions, disjoint files. T5 owns `src/data/content/cs2.js`, `cs3.js`, `cs4.js`; T6 owns `cs5.js`, `cs6.js`, `cs7.js`. Each also appends its half of the question-invariant tests (T5 creates the shared describe block; T6 runs after a short stagger or retries on conflict — they may BOTH simply rely on the era-parameterized test below, added by T5 only).

**Authoring rules (the spec for both tasks):**
1. **Source of truth:** learn.microsoft.com — "The history of C#" page and each version's "What's new in C# N" / language-reference pages. WebFetch the relevant pages; do NOT write facts from memory. Record fetched URLs in a `// Sources:` comment at the top of each era file.
2. **blurb** (≤160 chars): one sentence stating what the feature does and its real benefit — factual, no marketing fluff. Example shape: `'Type-safe collections without boxing — List<T> replaced ArrayList and cut casting bugs at compile time.'`
3. **snippet** (≤220 chars): minimal VALID C# legal in that language version (no later-version syntax — e.g. no `var` in cs2 snippets, no string interpolation in cs5-or-earlier snippets). Plain string with `\n` escapes.
4. **questions:** exactly 10 per era; every feature gets 1–2; 4 options; exactly one correct (`answer` = its 0-based index); the question MUST be answerable by someone who only read that card's blurb+snippet (teach first, test second); wrong options must be plausible but unambiguously wrong. Mix "what does it do", "what's the benefit", and "what does this snippet print/do" styles. Ids `q-cs2-01`…`q-cs2-10` etc.
5. Do not touch ids, costs, effects, effectText — those are locked game design.
6. One commit per era file is fine, or one per task; stage only your own files.

- [ ] **T5/T6 Step 1:** WebFetch the version's official docs; fill blurbs + snippets for your six-per-era cards.
- [ ] **T5/T6 Step 2:** author 10 questions per era following rule 4.
- [ ] **T5 Step 3 (T5 ONLY): append the question invariants to `tests/content.test.js`:**

```js
describe('QUESTIONS content', () => {
  it('has exactly 10 per era, valid shape, answerable feature refs', () => {
    for (const era of ERAS) {
      const qs = QUESTIONS.filter((q) => q.era === era.id)
      expect(qs, era.id).toHaveLength(10)
      const perFeature = {}
      for (const q of qs) {
        expect(q.options).toHaveLength(4)
        expect(q.answer).toBeGreaterThanOrEqual(0)
        expect(q.answer).toBeLessThanOrEqual(3)
        expect(q.text.length).toBeGreaterThan(10)
        const card = LANGUAGE_FEATURES.find((f) => f.id === q.feature)
        expect(card, q.id).toBeTruthy()
        expect(card.era).toBe(era.id)
        perFeature[q.feature] = (perFeature[q.feature] || 0) + 1
      }
      for (const f of featuresOf(era.id)) {
        expect(perFeature[f.id], f.id).toBeGreaterThanOrEqual(1)
        expect(perFeature[f.id], f.id).toBeLessThanOrEqual(2)
      }
    }
  })
  it('every card has non-empty blurb and snippet within length caps', () => {
    for (const f of LANGUAGE_FEATURES) {
      expect(f.blurb.length, f.id).toBeGreaterThan(20)
      expect(f.blurb.length, f.id).toBeLessThanOrEqual(160)
      expect(f.snippet.length, f.id).toBeGreaterThan(10)
      expect(f.snippet.length, f.id).toBeLessThanOrEqual(220)
    }
  })
})
```

NOTE: this test fails until BOTH T5 and T6 are complete — T5 runs `npx vitest run tests/content.test.js` and accepts failures ONLY in the other task's eras; the controller runs the full suite after both land.

- [ ] **T5/T6 Step 4:** Commit your three era files (T5 also commits the test append).
  `git commit -m "content: doc-verified cs2–cs4 cards + questions"` / `"content: doc-verified cs5–cs7 cards + questions"` (+ trailer)

### Task 6.5 (WEB RESEARCH): Adversarial fact-check of ALL content

Fresh web-enabled agent. For every one of the 36 cards and 60 questions: (a) verify the blurb's factual claims and version attribution against learn.microsoft.com (a C# 3 feature credited to C# 2 is an ERROR); (b) verify the snippet is syntactically valid for its version; (c) verify exactly one option is correct and the marked `answer` is it; (d) verify the question is answerable from its card's blurb+snippet alone. Fix errors inline (content text only — never ids/costs/effects), run `npm test` (all green incl. content invariants), commit `fix(content): fact-check corrections — <list>` (+ trailer), and report every error found with its correction. Zero errors found is a SUSPICIOUS result — re-check the 5 most subtle claims before reporting it.

---

### Task 7: Progress store + save v2 (`stores/progress.js`, `lib/save.js`, `stores/meta.js`)

**Files:** Create `src/stores/progress.js` · Modify `src/lib/save.js`, `src/stores/meta.js` · Test `tests/progress.test.js` (new), `tests/save.test.js` (modify)

- [ ] **Step 1: Failing tests** (`tests/progress.test.js`)

```js
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
```

- [ ] **Step 2:** run — FAIL. — [ ] **Step 3: Implement `src/stores/progress.js`**

```js
import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import { ERAS } from '../data/eras.js'
import { LANGUAGE_FEATURES, featuresOf } from '../data/featuresLanguage.js'
import { QUESTIONS } from '../data/questions.js'
import { SKILL_BRANCHES, MAX_SKILL_NODES, skillNodeCost } from '../data/skills.js'
import { combineMods } from '../lib/modifiers.js'
import { poolFor, drawExam, gradeExam, examEligibility } from '../lib/exam.js'
import { useGameStore } from './game.js'

const KNOWN_CARD_IDS = new Set(LANGUAGE_FEATURES.map((f) => f.id))
const KNOWN_ERA_IDS = new Set(ERAS.map((e) => e.id))
const CARD_BY_ID = new Map(LANGUAGE_FEATURES.map((f) => [f.id, f]))

function toCount(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export const useProgressStore = defineStore('progress', () => {
  const eraIndex = ref(0)
  const releaseFunded = ref(false)
  const ownedCards = reactive({})   // per-run (reset at Rewrite in M4)
  const examsPassed = ref([])       // permanent era ids
  const knowledge = ref(0)          // permanent budget
  const firstReads = reactive({})   // permanent card ids
  const skills = reactive({ language: 0, data: 0, performance: 0, tooling: 0 })
  const lastExamFailAt = ref(0)

  const currentEra = computed(() => ERAS[eraIndex.value])
  const allErasDone = computed(() => examsPassed.value.includes(ERAS[ERAS.length - 1].id))
  const eraFeatures = computed(() => featuresOf(currentEra.value.id))
  const ownedEraCount = computed(() => eraFeatures.value.filter((f) => ownedCards[f.id]).length)

  const mods = computed(() => {
    const effects = []
    for (const id of Object.keys(ownedCards)) {
      const card = CARD_BY_ID.get(id)
      if (card) effects.push(card.effect)
    }
    for (const branch of SKILL_BRANCHES) {
      for (let i = 0; i < (skills[branch.id] || 0); i++) {
        effects.push({ type: branch.effectType, value: branch.perNode })
      }
    }
    return combineMods(effects)
  })

  const allocatedKnowledge = computed(() =>
    SKILL_BRANCHES.reduce((sum, b) => {
      let cost = 0
      for (let i = 0; i < (skills[b.id] || 0); i++) cost += skillNodeCost(i)
      return sum + cost
    }, 0),
  )
  const knowledgeFree = computed(() => knowledge.value - allocatedKnowledge.value)

  const releaseCost = computed(() => Math.ceil(currentEra.value.releaseCost * mods.value.releaseMult))

  function eligibility(now = Date.now()) {
    return examEligibility({
      releaseFunded: releaseFunded.value,
      ownedEraCount: ownedEraCount.value,
      eraCardCount: eraFeatures.value.length,
      lastExamFailAt: lastExamFailAt.value,
      now,
    })
  }

  function buyCard(card) {
    if (ownedCards[card.id]) return false
    const game = useGameStore()
    if (!game.spend(card.cost)) return false
    ownedCards[card.id] = true
    if (!firstReads[card.id]) {
      firstReads[card.id] = true
      knowledge.value += 1
    }
    return true
  }

  function fundRelease() {
    if (releaseFunded.value || allErasDone.value) return false
    const game = useGameStore()
    if (!game.spend(releaseCost.value)) return false
    releaseFunded.value = true
    return true
  }

  // The active exam lives in the STORE, not the component: finishExam grades
  // only the store-held draw and consumes it, so a double-fire can't skip an
  // era and a console call can't forge a pass with a fabricated exam.
  // Not persisted: refreshing mid-exam abandons it (no fail recorded).
  const activeExam = ref(null)

  function beginExam(rand = Math.random) {
    if (activeExam.value) return activeExam.value
    if (allErasDone.value || !eligibility().eligible) return null
    const pool = poolFor(QUESTIONS, currentEra.value.id, Object.keys(ownedCards))
    if (pool.length === 0) return null
    activeExam.value = drawExam(pool, rand)
    return activeExam.value
  }

  function finishExam(answers) {
    if (!activeExam.value) return null
    const result = gradeExam(activeExam.value, answers)
    activeExam.value = null
    if (result.passed) {
      if (!examsPassed.value.includes(currentEra.value.id)) examsPassed.value.push(currentEra.value.id)
      knowledge.value += 3
      if (eraIndex.value < ERAS.length - 1) {
        eraIndex.value += 1
        releaseFunded.value = false
      }
    } else {
      lastExamFailAt.value = Date.now()
    }
    return result
  }

  function allocateSkill(branchId) {
    const branch = SKILL_BRANCHES.find((b) => b.id === branchId)
    if (!branch) return false
    const nodes = skills[branchId] || 0
    if (nodes >= MAX_SKILL_NODES) return false
    if (knowledgeFree.value < skillNodeCost(nodes)) return false
    skills[branchId] = nodes + 1
    return true
  }

  function toSave() {
    return {
      eraIndex: eraIndex.value,
      releaseFunded: releaseFunded.value,
      ownedCards: { ...ownedCards },
      examsPassed: [...examsPassed.value],
      knowledge: knowledge.value,
      firstReads: { ...firstReads },
      skills: { ...skills },
      lastExamFailAt: lastExamFailAt.value,
    }
  }

  function hydrate(slice) {
    const s = slice || {}
    eraIndex.value = Math.min(Math.floor(toCount(s.eraIndex)), ERAS.length - 1)
    releaseFunded.value = Boolean(s.releaseFunded)
    for (const k of Object.keys(ownedCards)) delete ownedCards[k]
    for (const id of Object.keys(s.ownedCards || {})) if (KNOWN_CARD_IDS.has(id)) ownedCards[id] = true
    examsPassed.value = (Array.isArray(s.examsPassed) ? s.examsPassed : []).filter((id) => KNOWN_ERA_IDS.has(id))
    knowledge.value = toCount(s.knowledge)
    for (const k of Object.keys(firstReads)) delete firstReads[k]
    for (const id of Object.keys(s.firstReads || {})) if (KNOWN_CARD_IDS.has(id)) firstReads[id] = true
    for (const b of SKILL_BRANCHES) skills[b.id] = Math.min(Math.floor(toCount(s.skills?.[b.id])), MAX_SKILL_NODES)
    // Clamp to the past: a future timestamp (hostile cloud save or clock skew)
    // would otherwise lock the exam cooldown forever.
    lastExamFailAt.value = Math.min(toCount(s.lastExamFailAt), Date.now())
  }

  return {
    eraIndex, releaseFunded, ownedCards, examsPassed, knowledge, firstReads, skills, lastExamFailAt, activeExam,
    currentEra, allErasDone, eraFeatures, ownedEraCount, mods, knowledgeFree, allocatedKnowledge, releaseCost,
    eligibility, buyCard, fundRelease, beginExam, finishExam, allocateSkill, toSave, hydrate,
  }
})
```

- [ ] **Step 4: Bump `src/lib/save.js` to v2** — change the version line and the migrate step:

```js
export const SAVE_VERSION = 2
```
and inside `migrate`, replace the comment line with a real step:
```js
  let save = raw
  if (save.v === 1) save = { ...save, v: 2, progress: {} }
  return save.v === SAVE_VERSION ? save : null
```
Update `buildSave`/`applySave` to carry the third slice:
```js
export function buildSave({ game, shop, progress }) {
  return {
    v: SAVE_VERSION,
    savedAt: Date.now(),
    game: game.toSave(),
    shop: shop.toSave(),
    progress: progress.toSave(),
  }
}

export function applySave(save, { game, shop, progress }) {
  game.hydrate(save.game || {})
  shop.hydrate(save.shop || {})
  progress.hydrate(save.progress || {})
}
```

- [ ] **Step 5: Update `tests/save.test.js`** — extend `fakeStores()` with a progress fake and add a migration test:

```js
    progress: {
      state: { knowledge: 7 },
      toSave() { return { ...this.state } },
      hydrate(s) { this.state = { ...s } },
    },
```
(add to the object returned by `fakeStores()`), update the round-trip assertions to also check `save.progress.knowledge === 7`, and add:
```js
  it('migrates a v1 save by injecting an empty progress slice', () => {
    const v1 = { v: 1, savedAt: 5, game: { loc: 9, lifetimeLoc: 9 }, shop: { owned: {} } }
    const out = migrate(v1)
    expect(out.v).toBe(SAVE_VERSION)
    expect(out.progress).toEqual({})
    expect(out.game.loc).toBe(9)
  })
```

- [ ] **Step 6: Wire `src/stores/meta.js`** — import `useProgressStore` (`import { useProgressStore } from './progress.js'`) and change `stores()`:

```js
  function stores() {
    return { game: useGameStore(), shop: useShopStore(), progress: useProgressStore() }
  }
```

- [ ] **Step 7:** `npm test` — ALL suites pass (meta/meta-cloud exercise the new slice through boot/sync automatically).
- [ ] **Step 8: Commit** `git add src/stores/progress.js src/lib/save.js src/stores/meta.js tests/progress.test.js tests/save.test.js && git commit -m "feat: progress store (eras, cards, exams, knowledge, skills) + save v2 migration"` (+ trailer)

---

### Task 8: Economy integration (`stores/game.js`, `stores/shop.js`)

**Files:** Modify `src/stores/game.js`, `src/stores/shop.js` · Modify `tests/stores.test.js`

- [ ] **Step 1: Failing tests** — append to `tests/stores.test.js`:

```js
import { useProgressStore } from '../src/stores/progress.js'
import { featuresOf } from '../src/data/featuresLanguage.js'

describe('modifier integration', () => {
  it('click power scales with clickMult mods', () => {
    const game = useGameStore()
    const progress = useProgressStore()
    progress.knowledge = 1
    progress.allocateSkill('language') // clickMult ×1.12
    game.click()
    expect(game.loc).toBeCloseTo(1.12)
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
```

- [ ] **Step 2:** run — FAIL (mods not applied). — [ ] **Step 3: Apply mods in `src/stores/game.js`** — add the import and change `click`:

```js
import { useProgressStore } from './progress.js'
```
```js
  function click() {
    const progress = useProgressStore()
    addLoc(clickPower.value * progress.mods.clickMult)
  }
```

- [ ] **Step 4: Apply mods in `src/stores/shop.js`** — add the import and change `lps` + `nextCostOf`:

```js
import { useProgressStore } from './progress.js'
```
```js
  const lps = computed(() => {
    const progress = useProgressStore()
    return totalLps(CONTRIBUTORS, owned) * progress.mods.lpsMult
  })

  function nextCostOf(contributor) {
    const progress = useProgressStore()
    return Math.ceil(costOf(contributor.baseCost, countOf(contributor.id)) * progress.mods.costMult)
  }
```
NOTE: `useProgressStore()` inside a computed is Pinia-safe (same lazy pattern as game↔shop). The pre-existing stores tests still pass because BASE mods are all ×1 with no cards/skills.

- [ ] **Step 5:** `npm test` — all green. — [ ] **Step 6: Commit** `git add src/stores/game.js src/stores/shop.js tests/stores.test.js && git commit -m "feat: card and skill modifiers drive click, lps, and costs"` (+ trailer)

---

### Task 9: Shop tabs UI (`ShopPanel`, `FeatureList`, `FeatureCardItem`, `SkillTreePanel`)

**Files:** Modify `src/components/ShopPanel.vue` · Create `src/components/FeatureList.vue`, `src/components/FeatureCardItem.vue`, `src/components/SkillTreePanel.vue` · Modify `src/styles/index.css` (append). No unit tests (presentation only — logic already tested); verify via `npm test` (no regressions) + `npm run build`.

- [ ] **Step 1: Rewrite `src/components/ShopPanel.vue`** as the tab host:

```vue
<script setup>
import { ref } from 'vue'
import { CONTRIBUTORS } from '../data/contributors.js'
import ContributorRow from './ContributorRow.vue'
import FeatureList from './FeatureList.vue'
import SkillTreePanel from './SkillTreePanel.vue'

const TABS = [
  { id: 'contributors', label: 'Contributors' },
  { id: 'features', label: 'Features' },
  { id: 'skills', label: 'Skills' },
]
const active = ref('contributors')
</script>

<template>
  <div class="shop">
    <nav class="shop-tabs">
      <button
        v-for="t in TABS"
        :key="t.id"
        class="shop-tab"
        :class="{ active: active === t.id }"
        @click="active = t.id"
      >{{ t.label }}</button>
    </nav>
    <div v-if="active === 'contributors'" class="shop-list">
      <ContributorRow v-for="c in CONTRIBUTORS" :key="c.id" :contributor="c" />
    </div>
    <FeatureList v-else-if="active === 'features'" />
    <SkillTreePanel v-else />
  </div>
</template>
```

- [ ] **Step 2: Create `src/components/FeatureCardItem.vue`**

```vue
<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game.js'
import { useProgressStore } from '../stores/progress.js'
import { formatNumber } from '../lib/format.js'

const props = defineProps({ card: { type: Object, required: true } })

const game = useGameStore()
const progress = useProgressStore()
const showSnippet = ref(false)

const owned = computed(() => Boolean(progress.ownedCards[props.card.id]))
const affordable = computed(() => game.loc >= props.card.cost)
</script>

<template>
  <div class="feature-card card" :class="{ owned }">
    <div class="feature-head">
      <strong>{{ card.name }}</strong>
      <button v-if="!owned" class="btn" :disabled="!affordable" @click="progress.buyCard(card)">
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

- [ ] **Step 3: Create `src/components/FeatureList.vue`** — current era first, earlier eras collapsed below:

```vue
<script setup>
import { computed } from 'vue'
import { useProgressStore } from '../stores/progress.js'
import { ERAS } from '../data/eras.js'
import { featuresOf } from '../data/featuresLanguage.js'
import FeatureCardItem from './FeatureCardItem.vue'

const progress = useProgressStore()
const unlockedEras = computed(() =>
  ERAS.slice(0, progress.eraIndex + 1).slice().reverse(), // current era first
)
</script>

<template>
  <div class="shop-list">
    <section v-for="era in unlockedEras" :key="era.id" class="era-section">
      <h3 class="era-heading" :style="{ color: era.color }">
        {{ era.csVersion }} — {{ era.name }} ({{ era.year }})
      </h3>
      <FeatureCardItem v-for="card in featuresOf(era.id)" :key="card.id" :card="card" />
    </section>
  </div>
</template>
```

- [ ] **Step 4: Create `src/components/SkillTreePanel.vue`**

```vue
<script setup>
import { useProgressStore } from '../stores/progress.js'
import { SKILL_BRANCHES, MAX_SKILL_NODES, skillNodeCost } from '../data/skills.js'

const progress = useProgressStore()

function nextCost(branchId) {
  return skillNodeCost(progress.skills[branchId] || 0)
}
</script>

<template>
  <div class="shop-list">
    <p class="knowledge-line">
      🧠 Knowledge: <strong>{{ progress.knowledgeFree }}</strong> free / {{ progress.knowledge }} total
    </p>
    <p class="muted">Earn Knowledge by learning Feature Cards (first read) and passing Certification Exams. Allocation respecs at every Rewrite.</p>
    <div v-for="b in SKILL_BRANCHES" :key="b.id" class="skill-branch card">
      <div class="skill-head">
        <span class="skill-icon">{{ b.icon }}</span>
        <div class="skill-info">
          <strong>{{ b.name }}</strong>
          <span class="muted">{{ b.blurb }}</span>
        </div>
        <button
          class="btn"
          :disabled="(progress.skills[b.id] || 0) >= MAX_SKILL_NODES || progress.knowledgeFree < nextCost(b.id)"
          @click="progress.allocateSkill(b.id)"
        >
          {{ (progress.skills[b.id] || 0) >= MAX_SKILL_NODES ? 'MAX' : `+1 (${nextCost(b.id)} 🧠)` }}
        </button>
      </div>
      <div class="skill-pips">
        <span v-for="i in MAX_SKILL_NODES" :key="i" class="pip" :class="{ filled: i <= (progress.skills[b.id] || 0) }" />
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 5: Append styles to `src/styles/index.css`**

```css
/* ── shop tabs ── */
.shop-tabs { display: flex; gap: 6px; margin-bottom: 4px; }
.shop-tab {
  flex: 1; padding: 8px 0; border-radius: 8px; cursor: pointer;
  background: var(--panel); color: var(--muted); border: 1px solid var(--border);
}
.shop-tab.active { background: var(--panel-2); color: var(--text); border-color: var(--accent-2); }
.shop-list { display: flex; flex-direction: column; gap: 10px; }

/* ── feature cards ── */
.era-section { display: flex; flex-direction: column; gap: 8px; }
.era-heading { margin: 8px 0 0; font-size: 0.95rem; }
.feature-card { display: flex; flex-direction: column; gap: 6px; }
.feature-card.owned { border-color: var(--accent-2); }
.feature-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.feature-owned { color: var(--accent); font-size: 0.9rem; }
.feature-effect { margin: 0; color: var(--accent); font-size: 0.9rem; }
.feature-blurb { margin: 0; font-size: 0.88rem; }
.snippet-toggle { background: none; border: none; cursor: pointer; align-self: flex-start; padding: 0; font-size: 0.8rem; text-decoration: underline; }
.snippet {
  margin: 0; padding: 10px; background: var(--bg); border: 1px solid var(--border);
  border-radius: 8px; font-size: 0.8rem; overflow-x: auto; white-space: pre-wrap;
}

/* ── skill tree ── */
.knowledge-line { margin: 0; }
.skill-branch { display: flex; flex-direction: column; gap: 8px; }
.skill-head { display: flex; align-items: center; gap: 12px; }
.skill-icon { font-size: 1.4rem; width: 34px; text-align: center; }
.skill-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.skill-pips { display: flex; gap: 6px; }
.pip { width: 18px; height: 8px; border-radius: 4px; background: var(--border); }
.pip.filled { background: var(--accent); }
```

- [ ] **Step 6:** `npm test` (no regressions) + `npm run build` (success).
- [ ] **Step 7: Commit** `git add src/components/ShopPanel.vue src/components/FeatureList.vue src/components/FeatureCardItem.vue src/components/SkillTreePanel.vue src/styles/index.css && git commit -m "feat: shop tabs — Features and Skills join Contributors"` (+ trailer)

---

### Task 10: Era Gate UI (`EraPanel`, `ExamModal`, `HeaderBar`, `App`)

**Files:** Create `src/components/EraPanel.vue`, `src/components/ExamModal.vue` · Modify `src/components/HeaderBar.vue`, `src/App.vue`, `src/styles/index.css` (append). Logic is store-tested; verify via full suite + build + dev-server smoke.

- [ ] **Step 1: Create `src/components/ExamModal.vue`** — one question at a time, grade at the end:

```vue
<script setup>
import { ref, computed } from 'vue'
import { useProgressStore } from '../stores/progress.js'
import { passMarkFor } from '../lib/exam.js'

const props = defineProps({ drawn: { type: Array, required: true } })
const emit = defineEmits(['close'])

const progress = useProgressStore()
const index = ref(0)
const answers = ref([])
const result = ref(null)

const question = computed(() => props.drawn[index.value])

function pick(optionIndex) {
  if (result.value) return // exam already graded — ignore stray clicks
  answers.value[index.value] = optionIndex
  if (index.value < props.drawn.length - 1) {
    index.value += 1
  } else {
    result.value = progress.finishExam(answers.value)
  }
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal card exam-modal" role="dialog" aria-modal="true" aria-label="Certification Exam">
      <template v-if="!result">
        <p class="muted exam-progress">Question {{ index + 1 }} / {{ drawn.length }} · pass mark {{ passMarkFor(drawn.length) }}</p>
        <h2 class="exam-question">{{ question.text }}</h2>
        <button v-for="(opt, i) in question.options" :key="i" class="btn exam-option" @click="pick(i)">
          {{ opt }}
        </button>
      </template>
      <template v-else>
        <h2>{{ result.passed ? '🎓 Certified!' : '❌ Not yet' }}</h2>
        <p>{{ result.correct }} / {{ result.size }} correct.</p>
        <p class="muted">
          {{ result.passed
            ? 'The next era unlocks — new Feature Cards await.'
            : 'Review your Feature Cards and retry after the cooldown.' }}
        </p>
        <button class="btn btn-primary" @click="emit('close')">Continue</button>
      </template>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Create `src/components/EraPanel.vue`**

```vue
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/game.js'
import { useProgressStore } from '../stores/progress.js'
import { formatNumber } from '../lib/format.js'
import { EXAM_COOLDOWN_MS } from '../lib/exam.js'
import ExamModal from './ExamModal.vue'

const game = useGameStore()
const progress = useProgressStore()

const drawn = ref(null)
const now = ref(Date.now())
let clockHandle

onMounted(() => { clockHandle = setInterval(() => { now.value = Date.now() }, 1000) })
onUnmounted(() => clearInterval(clockHandle))

const eligibility = computed(() => progress.eligibility(now.value))
const cooldownLeft = computed(() =>
  Math.max(0, Math.ceil((progress.lastExamFailAt + EXAM_COOLDOWN_MS - now.value) / 1000)),
)

function startExam() {
  const d = progress.beginExam()
  if (d) drawn.value = d
}
</script>

<template>
  <div class="era-panel card">
    <ExamModal v-if="drawn" :drawn="drawn" @close="drawn = null" />
    <div class="era-title" :style="{ borderColor: progress.currentEra.color }">
      <strong>{{ progress.currentEra.csVersion }}</strong>
      <span class="muted">{{ progress.currentEra.name }} · {{ progress.currentEra.year }}</span>
    </div>

    <template v-if="progress.allErasDone">
      <p class="era-done">🏆 All M2 eras certified — C# 8+ arrives in the next update.</p>
    </template>
    <template v-else>
      <p class="muted era-cards-line">
        Feature Cards: {{ progress.ownedEraCount }} / {{ progress.eraFeatures.length }} (exam needs ≥ {{ Math.ceil(progress.eraFeatures.length / 2) }})
      </p>

      <button
        v-if="!progress.releaseFunded"
        class="btn btn-primary"
        :disabled="game.loc < progress.releaseCost"
        @click="progress.fundRelease()"
      >
        🚀 Fund the Release — {{ formatNumber(progress.releaseCost) }} LoC
      </button>

      <template v-else>
        <p class="release-ok">✅ Release funded</p>
        <button class="btn btn-primary" :disabled="!eligibility.eligible" @click="startExam">
          🎓 Take the Certification Exam
        </button>
        <p v-if="eligibility.reason === 'cards'" class="muted">Learn more of this era's Feature Cards first.</p>
        <p v-else-if="eligibility.reason === 'cooldown'" class="muted">Retry in {{ cooldownLeft }}s.</p>
      </template>
    </template>
  </div>
</template>
```

- [ ] **Step 3: Update `src/components/HeaderBar.vue`** — add the era chip + Knowledge to the counters block. Replace the template with:

```vue
<template>
  <header class="header">
    <span class="brand">🌱 Greenfield</span>
    <div class="counters">
      <span class="era-chip" :style="{ borderColor: progress.currentEra.color }">{{ progress.currentEra.csVersion }}</span>
      <strong class="loc-counter">{{ formatNumber(game.loc) }} LoC</strong>
      <span class="muted">{{ formatRate(shop.lps) }} LoC/s</span>
      <span class="muted">🧠 {{ progress.knowledgeFree }}</span>
    </div>
    <span class="muted">{{ meta.nickname || '—' }}</span>
  </header>
</template>
```
and add to the script setup imports/uses:
```js
import { useProgressStore } from '../stores/progress.js'
const progress = useProgressStore()
```

- [ ] **Step 4: Update `src/App.vue` template** — left pane gains the EraPanel (script gains `import EraPanel from './components/EraPanel.vue'`):

```vue
  <main v-if="meta.booted" class="layout">
    <section class="pane">
      <ClickTarget />
      <EraPanel />
    </section>
    <section class="pane"><ShopPanel /></section>
  </main>
```

- [ ] **Step 5: Append styles**

```css
/* ── era panel ── */
.era-panel { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }
.era-title { display: flex; flex-direction: column; gap: 2px; border-left: 4px solid; padding-left: 10px; }
.era-cards-line, .release-ok { margin: 0; }
.release-ok { color: var(--accent); }
.era-done { margin: 0; color: var(--accent); }
.era-chip { border: 1px solid; border-radius: 999px; padding: 2px 10px; font-size: 0.85rem; }

/* ── exam modal ── */
.exam-modal { max-height: 80vh; overflow-y: auto; }
.exam-progress { margin: 0; }
.exam-question { font-size: 1.05rem; margin: 0; }
.exam-option { text-align: left; }
```

- [ ] **Step 6:** `npm test` + `npm run build` + dev-server HTTP 200 smoke (background `npm run dev`, fetch `http://localhost:5175/`, kill).
- [ ] **Step 7: Commit** `git add src/components/EraPanel.vue src/components/ExamModal.vue src/components/HeaderBar.vue src/App.vue src/styles/index.css && git commit -m "feat: era gate UI — release funding, certification exam, era chip"` (+ trailer)

---

### Task 11: Integration verification + deploy

- [ ] **Step 1:** `npm test` — full suite green. `npm run build` — success.
- [ ] **Step 2:** Verify the full save round-trip ages well: in a node REPL or quick script is NOT needed — covered by tests. Instead `git log --oneline` sanity + `git status` clean.
- [ ] **Step 3:** Push: `git push origin main`. Watch CI: `gh run watch $(gh run list -R AlexandruCristianRobert/greenfield -L 1 --json databaseId -q '.[0].databaseId') -R AlexandruCristianRobert/greenfield --exit-status --interval 10`.
- [ ] **Step 4:** Verify live: fetch `https://alexandrucristianrobert.github.io/greenfield/` (200) and confirm the new bundle hash differs from the previous deploy.
- [ ] **Step 5: Owner checklist (report, don't do):** play on the live site — buy 3 cs2 cards, fund the Release (500 LoC), take the exam, verify era advances to C# 3 and the save survives reload + appears in Supabase.

## Self-review notes (already applied)

- v1 cloud saves from live players migrate cleanly (progress `{}` → hydrate defaults). The deployed M1 client refuses v2 rows (`migrate` returns null and `cloudReady` stays false) — by design; players must refresh to the new bundle, which Pages serves immediately.
- `progress.eligibility(now)` takes `now` so EraPanel's 1 s clock drives reactive cooldown UI; `beginExam` re-checks eligibility internally with real `Date.now()`.
- Max M2 Knowledge = 36 first-reads + 6 exams × 3 = 54 < 60 full-tree cost → allocation choices stay meaningful.
- `releaseMult` applies via `progress.releaseCost` (ceil) — both UI display and `fundRelease` use the same computed.
