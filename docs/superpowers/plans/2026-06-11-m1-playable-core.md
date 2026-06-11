# Greenfield M1 — Playable Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A playable clicker core — click → LoC, the 10-tier Contributor ladder with buying and milestone multipliers, a 100 ms economy tick, versioned localStorage saves, and nickname identity with a Supabase cloud-snapshot sync.

**Architecture:** New standalone Vue 3 + Vite + Pinia app in `E:\Projects\Vue\Greenfield\` (its own git repo, like the sibling trainers). All economy math lives in pure functions under `src/lib/` (unit-tested); Pinia stores hold state and orchestrate; components are thin. Supabase is optional at runtime (`hasSupabase` guard — the game fully works offline-only), one `saves` table keyed by normalized nickname.

**Tech Stack:** Vue ^3.5, Pinia ^2.3, Vite ^6, Vitest ^2, @supabase/supabase-js ^2. Plain JS. Tests in `tests/*.test.js` (Net-Trainer convention).

**Design spec:** `docs/superpowers/specs/2026-06-11-greenfield-design.md` · **Glossary:** `CONTEXT.md` (use its canonical terms in ALL identifiers and UI strings — e.g. Contributor, never "machine")

**Out of scope for M1** (do NOT build, even if tempting): Eras, Feature Cards, exams, PR events, Knowledge/Skill Tree, Data track, offline *gains* (we only record `savedAt`), click upgrades, combo meter, achievements, prestige, leaderboard. M1 baseline numbers (contributor costs/rates) are provisional — M4's simulation re-tunes them.

---

## File structure

```
Greenfield/
├── .github/workflows/deploy.yml   Task 10 — GitHub Pages deploy (English-Trainer pattern)
├── .gitignore                     Task 1
├── .env                           Task 6 — VITE_SUPABASE_* (committed on purpose, like English-Trainer)
├── index.html                     Task 1
├── package.json                   Task 1
├── vite.config.js                 Task 1 — base '/greenfield/', port 5175
├── CONTEXT.md                     (already authored)
├── docs/…                         (already authored: spec, this plan, asset-manifest.md)
├── supabase/schema.sql            Task 6 — saves table + RLS
├── src/
│   ├── main.js                    Task 1
│   ├── App.vue                    Task 1 (stub) → Task 9 (real layout + loops)
│   ├── styles/tokens.css          Task 1 — dark GitHub-ish palette
│   ├── styles/index.css           Task 1 — base styles; Task 9 adds component styles
│   ├── data/contributors.js       Task 4 — the 10-tier ladder (data only)
│   ├── lib/format.js              Task 2 — number suffix formatting (pure)
│   ├── lib/economy.js             Task 3 — cost curve, milestones, production (pure)
│   ├── lib/names.js               Task 5 — keyOf() nickname normalization (pure)
│   ├── lib/cloud.js               Task 5 — decideSource() newest-wins (pure)
│   ├── lib/save.js                Task 5 — versioned save build/migrate/apply + localStorage
│   ├── lib/supabase.js            Task 6 — client + fetchSave/upsertSave
│   ├── stores/game.js             Task 7 — loc, lifetimeLoc, click, spend, tick
│   ├── stores/shop.js             Task 7 — owned contributors, lps, buy
│   ├── stores/meta.js             Task 8 — nickname, boot, saveLocal, syncCloud
│   └── components/
│       ├── UsernameModal.vue      Task 8
│       ├── HeaderBar.vue          Task 9
│       ├── ClickTarget.vue        Task 9
│       ├── ContributorRow.vue     Task 9
│       └── ShopPanel.vue          Task 9
└── tests/
    ├── format.test.js             Task 2
    ├── economy.test.js            Task 3
    ├── contributors.test.js       Task 4
    ├── save.test.js               Task 5 (also covers names.js + cloud.js)
    ├── stores.test.js             Task 7
    └── meta.test.js               Task 8
```

## Execution order / parallelism (2–5 subagents)

- **Task 1 first, alone** (scaffold + git init).
- **Wave A in parallel (up to 5 agents):** Tasks 2, 3, 4, 5, 6 — mutually independent pure modules.
- **Sequential tail:** Task 7 (needs 3+4) → Task 8 (needs 5+6+7) → Task 9 (needs all) → Task 10.
- Every commit message ends with a second `-m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`.
- All commands run from `E:\Projects\Vue\Greenfield` unless stated. Use the Bash tool (commands below are POSIX).

---

### Task 1: Scaffold project + git init

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `.gitignore`, `src/main.js`, `src/App.vue`, `src/styles/tokens.css`, `src/styles/index.css`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "greenfield",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": {
    "node": ">=18"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.47.0",
    "pinia": "^2.3.0",
    "vue": "^3.5.13"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.1",
    "vite": "^6.0.7",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Write `vite.config.js`** (English-Trainer pattern; ports 5173/5174 are taken by the sibling apps)

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Greenfield — C#/EF learning clicker. Vue 3 + Vite.
// `base` targets the GitHub Pages project site on build; '/' for local dev.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/greenfield/' : '/',
  plugins: [vue()],
  server: { port: 5175 },
}))
```

- [ ] **Step 3: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌱</text></svg>" />
    <title>Greenfield — the C# clicker</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 4: Write `.gitignore`** (note: `.env` is NOT ignored — committed on purpose, same as English-Trainer)

```
node_modules/
dist/
```

- [ ] **Step 5: Write `src/main.js`**

```js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/tokens.css'
import './styles/index.css'

createApp(App).use(createPinia()).mount('#app')
```

- [ ] **Step 6: Write stub `src/App.vue`** (replaced in Task 9)

```vue
<template>
  <main style="padding: 2rem">
    <h1>🌱 Greenfield</h1>
    <p class="muted">M1 scaffold — game shell lands in Task 9.</p>
  </main>
</template>
```

- [ ] **Step 7: Write `src/styles/tokens.css`**

```css
:root {
  --bg: #0d1117;
  --panel: #161b22;
  --panel-2: #1c2330;
  --border: #2d333b;
  --text: #e6edf3;
  --muted: #8b949e;
  --accent: #3fb950;
  --accent-2: #2ea043;
  --bad: #f85149;
}
```

- [ ] **Step 8: Write `src/styles/index.css`** (base only; component styles arrive in Task 9)

```css
* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

.muted { color: var(--muted); }

.card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
}

.btn {
  border: 1px solid var(--border);
  background: var(--panel-2);
  color: var(--text);
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 0.95rem;
  cursor: pointer;
}
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-primary { background: var(--accent-2); border-color: var(--accent-2); font-weight: 600; }

.text-input {
  width: 100%;
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 1rem;
}
```

- [ ] **Step 9: Install and verify dev server boots**

Run: `npm install`
Then: `npm run dev` — expect `Local: http://localhost:5175/`, page shows the scaffold heading. Stop the server.

- [ ] **Step 10: Init repo and commit everything authored so far** (docs were pre-created by the planning session)

```bash
git init
git add -A
git commit -m "chore: scaffold Greenfield (Vue 3 + Vite + Pinia), commit design docs + glossary + asset manifest" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Number formatting (`lib/format.js`)

**Files:**
- Create: `src/lib/format.js`
- Test: `tests/format.test.js`

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect } from 'vitest'
import { formatNumber, formatRate } from '../src/lib/format.js'

describe('formatNumber', () => {
  it('shows integers below 1000 floored', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(999.9)).toBe('999')
  })
  it('uses suffixes with 3 significant digits', () => {
    expect(formatNumber(1000)).toBe('1.00K')
    expect(formatNumber(15_300)).toBe('15.3K')
    expect(formatNumber(123_456)).toBe('123K')
    expect(formatNumber(2_350_000)).toBe('2.35M')
    expect(formatNumber(7.5e10)).toBe('75.0B')
  })
  it('falls back to exponential beyond the suffix table', () => {
    expect(formatNumber(1e33)).toBe('1.00e+33')
  })
})

describe('formatRate', () => {
  it('keeps one decimal under 1000', () => {
    expect(formatRate(0.1)).toBe('0.1')
    expect(formatRate(47)).toBe('47')
  })
  it('delegates to suffixes at 1000+', () => {
    expect(formatRate(1400)).toBe('1.40K')
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run tests/format.test.js`
Expected: FAIL — cannot resolve `../src/lib/format.js`.

- [ ] **Step 3: Implement `src/lib/format.js`**

```js
// Number display: integers under 1000, then K/M/B/T… with 3 significant digits,
// exponential past the suffix table. LoC totals use formatNumber; per-second
// rates use formatRate (keeps one decimal for small rates like 0.1 LoC/s).
const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No']

export function formatNumber(n) {
  if (!Number.isFinite(n)) return '∞'
  if (n < 0) return '-' + formatNumber(-n)
  if (n < 1000) return String(Math.floor(n))
  const tier = Math.floor(Math.log10(n) / 3)
  if (tier >= SUFFIXES.length) return n.toExponential(2)
  const scaled = n / 10 ** (tier * 3)
  const digits = scaled < 10 ? 2 : scaled < 100 ? 1 : 0
  return scaled.toFixed(digits) + SUFFIXES[tier]
}

export function formatRate(n) {
  if (!Number.isFinite(n)) return '∞'
  if (n < 1000) return String(Math.round(n * 10) / 10)
  return formatNumber(n)
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npx vitest run tests/format.test.js` — Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.js tests/format.test.js
git commit -m "feat: number formatting with K/M/B suffixes" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Economy math (`lib/economy.js`)

**Files:**
- Create: `src/lib/economy.js`
- Test: `tests/economy.test.js`

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect } from 'vitest'
import { costOf, milestoneMultiplier, contributorLps, totalLps } from '../src/lib/economy.js'

describe('costOf', () => {
  it('returns base cost when none owned', () => {
    expect(costOf(15, 0)).toBe(15)
  })
  it('grows 15% per owned, rounded up', () => {
    expect(costOf(15, 1)).toBe(18)
    expect(costOf(100, 10)).toBe(Math.ceil(100 * 1.15 ** 10))
  })
})

describe('milestoneMultiplier', () => {
  it('doubles at 25, 50 and 100 owned (cumulative)', () => {
    expect(milestoneMultiplier(0)).toBe(1)
    expect(milestoneMultiplier(24)).toBe(1)
    expect(milestoneMultiplier(25)).toBe(2)
    expect(milestoneMultiplier(50)).toBe(4)
    expect(milestoneMultiplier(100)).toBe(8)
    expect(milestoneMultiplier(500)).toBe(8)
  })
})

describe('production', () => {
  it('contributorLps = base × owned × milestone multiplier', () => {
    expect(contributorLps(0.1, 10)).toBeCloseTo(1)
    expect(contributorLps(1, 25)).toBe(50)
  })
  it('totalLps sums across the ladder, missing ids count as 0', () => {
    const ladder = [{ id: 'a', baseLps: 1 }, { id: 'b', baseLps: 8 }]
    expect(totalLps(ladder, { a: 2, b: 1 })).toBe(10)
    expect(totalLps(ladder, {})).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run tests/economy.test.js` — Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/lib/economy.js`**

```js
// Pure economy math. Balance constants here are the M1 baseline from the design
// spec (docs/superpowers/specs/…): cost × 1.15^owned, ×2 output at 25/50/100 owned.
export const COST_GROWTH = 1.15
export const MILESTONES = [25, 50, 100]

export function costOf(baseCost, owned) {
  return Math.ceil(baseCost * Math.pow(COST_GROWTH, owned))
}

export function milestoneMultiplier(owned) {
  return 2 ** MILESTONES.filter((m) => owned >= m).length
}

export function contributorLps(baseLps, owned) {
  return baseLps * owned * milestoneMultiplier(owned)
}

export function totalLps(contributors, owned) {
  return contributors.reduce(
    (sum, c) => sum + contributorLps(c.baseLps, owned[c.id] || 0),
    0,
  )
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npx vitest run tests/economy.test.js` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/economy.js tests/economy.test.js
git commit -m "feat: economy math — cost curve, milestones, production" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Contributor ladder data (`data/contributors.js`)

**Files:**
- Create: `src/data/contributors.js`
- Test: `tests/contributors.test.js`

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect } from 'vitest'
import { CONTRIBUTORS } from '../src/data/contributors.js'

describe('CONTRIBUTORS data', () => {
  it('has 10 tiers with unique ids', () => {
    expect(CONTRIBUTORS).toHaveLength(10)
    expect(new Set(CONTRIBUTORS.map((c) => c.id)).size).toBe(10)
  })
  it('is sorted by strictly increasing cost', () => {
    for (let i = 1; i < CONTRIBUTORS.length; i++) {
      expect(CONTRIBUTORS[i].baseCost).toBeGreaterThan(CONTRIBUTORS[i - 1].baseCost)
    }
  })
  it('every entry has the required fields', () => {
    for (const c of CONTRIBUTORS) {
      expect(typeof c.id).toBe('string')
      expect(typeof c.name).toBe('string')
      expect(typeof c.icon).toBe('string')
      expect(typeof c.flavor).toBe('string')
      expect(c.baseCost).toBeGreaterThan(0)
      expect(c.baseLps).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run tests/contributors.test.js` — Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/data/contributors.js`** (emoji icons are M1 placeholders — see `docs/asset-manifest.md`; numbers are the provisional baseline, re-tuned by the M4 simulation)

```js
export const CONTRIBUTORS = [
  { id: 'intern',           name: 'Intern',               icon: '🎓', baseCost: 15,       baseLps: 0.1,       flavor: 'Knows just enough C# to be dangerous.' },
  { id: 'junior',           name: 'Junior Dev',           icon: '👩‍💻', baseCost: 100,      baseLps: 1,         flavor: 'Ships features. Occasionally the right ones.' },
  { id: 'senior',           name: 'Senior Dev',           icon: '🧙', baseCost: 1_100,     baseLps: 8,         flavor: 'Deletes more code than they write. Output goes up anyway.' },
  { id: 'pair-duo',         name: 'Pair-Programming Duo', icon: '👯', baseCost: 12_000,    baseLps: 47,        flavor: 'Two keyboards, one very good brain cell.' },
  { id: 'build-agent',      name: 'Build Agent',          icon: '🤖', baseCost: 130_000,   baseLps: 260,       flavor: 'Green checkmarks around the clock.' },
  { id: 'cicd-pipeline',    name: 'CI/CD Pipeline',       icon: '🔁', baseCost: 1.4e6,     baseLps: 1_400,     flavor: 'Push on Friday. What could go wrong?' },
  { id: 'source-generator', name: 'Source Generator',     icon: '⚙️', baseCost: 2e7,       baseLps: 7_800,     flavor: 'Writes code that writes code.' },
  { id: 'copilot-agent',    name: 'AI Copilot Agent',     icon: '✨', baseCost: 3.3e8,     baseLps: 44_000,    flavor: 'Autocomplete that took over the standup.' },
  { id: 'distributed-team', name: 'Distributed Team',     icon: '🌍', baseCost: 5.1e9,     baseLps: 260_000,   flavor: 'The sun never sets on the sprint.' },
  { id: 'oss-community',    name: 'OSS Community',        icon: '🌱', baseCost: 7.5e10,    baseLps: 1.6e6,     flavor: 'Ten thousand strangers fixing your bugs for free.' },
]
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npx vitest run tests/contributors.test.js` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/contributors.js tests/contributors.test.js
git commit -m "feat: 10-tier Contributor ladder data" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Save system + nickname key + newest-wins (`lib/save.js`, `lib/names.js`, `lib/cloud.js`)

**Files:**
- Create: `src/lib/names.js`, `src/lib/cloud.js`, `src/lib/save.js`
- Test: `tests/save.test.js`

These are pure modules: `save.js` talks to stores only through duck-typed `{ toSave(), hydrate() }` objects, so this task does NOT depend on Task 7 — tests use plain fakes.

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { keyOf } from '../src/lib/names.js'
import { decideSource } from '../src/lib/cloud.js'
import { SAVE_VERSION, SAVE_KEY, buildSave, migrate, applySave, writeLocal, readLocal } from '../src/lib/save.js'

// node test env has no localStorage — install a Map-backed stub
beforeEach(() => {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  }
})

function fakeStores() {
  return {
    game: {
      state: { loc: 50, lifetimeLoc: 120 },
      toSave() { return { ...this.state } },
      hydrate(s) { this.state = { ...s } },
    },
    shop: {
      state: { owned: { intern: 3 } },
      toSave() { return { owned: { ...this.state.owned } } },
      hydrate(s) { this.state = { owned: { ...(s.owned || {}) } } },
    },
  }
}

describe('keyOf', () => {
  it('normalizes trim + lowercase + collapsed spaces', () => {
    expect(keyOf('  Linq  Padawan ')).toBe('linq padawan')
    expect(keyOf('')).toBe('')
  })
})

describe('decideSource', () => {
  it('picks whichever side exists', () => {
    expect(decideSource(null, null)).toBe(null)
    expect(decideSource({ savedAt: 1 }, null)).toBe('local')
    expect(decideSource(null, { savedAt: 1 })).toBe('cloud')
  })
  it('newest savedAt wins, ties go local', () => {
    expect(decideSource({ savedAt: 100 }, { savedAt: 200 })).toBe('cloud')
    expect(decideSource({ savedAt: 200 }, { savedAt: 100 })).toBe('local')
    expect(decideSource({ savedAt: 100 }, { savedAt: 100 })).toBe('local')
  })
})

describe('save round-trip', () => {
  it('buildSave stamps version and savedAt', () => {
    const save = buildSave(fakeStores())
    expect(save.v).toBe(SAVE_VERSION)
    expect(save.savedAt).toBeGreaterThan(0)
    expect(save.game.loc).toBe(50)
    expect(save.shop.owned.intern).toBe(3)
  })
  it('writeLocal/readLocal round-trips through localStorage', () => {
    const save = buildSave(fakeStores())
    writeLocal(save)
    expect(JSON.parse(localStorage.getItem(SAVE_KEY)).v).toBe(SAVE_VERSION)
    expect(readLocal()).toEqual(save)
  })
  it('readLocal returns null for garbage or missing data', () => {
    expect(readLocal()).toBe(null)
    localStorage.setItem(SAVE_KEY, 'not json{')
    expect(readLocal()).toBe(null)
  })
  it('migrate rejects saves newer than this build', () => {
    expect(migrate({ v: SAVE_VERSION + 1 })).toBe(null)
  })
  it('applySave hydrates both stores', () => {
    const src = fakeStores()
    src.game.state.loc = 999
    const save = buildSave(src)
    const dst = fakeStores()
    applySave(save, dst)
    expect(dst.game.state.loc).toBe(999)
    expect(dst.shop.state.owned.intern).toBe(3)
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run tests/save.test.js` — Expected: FAIL, modules not found.

- [ ] **Step 3: Implement `src/lib/names.js`** (same normalization as English-Trainer's `keyOf`)

```js
// Normalized nickname → DB key: trim, lowercase, collapse inner whitespace.
export function keyOf(name) {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ')
}
```

- [ ] **Step 4: Implement `src/lib/cloud.js`**

```js
// Newest-wins between the local hot save and the cloud snapshot.
// Both args are plain save objects (or null). Ties go to local.
export function decideSource(local, cloud) {
  if (!local && !cloud) return null
  if (!cloud) return 'local'
  if (!local) return 'cloud'
  return (cloud.savedAt || 0) > (local.savedAt || 0) ? 'cloud' : 'local'
}
```

- [ ] **Step 5: Implement `src/lib/save.js`**

```js
// Versioned save format. The save schema is the contract between runs AND with
// the Supabase snapshot — bump SAVE_VERSION and add a migration step whenever
// the shape changes. Layer-2 prestige fields will be added here in a later
// milestone via migration, per the design spec.
export const SAVE_VERSION = 1
export const SAVE_KEY = 'gf_save'

export function buildSave({ game, shop }) {
  return {
    v: SAVE_VERSION,
    savedAt: Date.now(),
    game: game.toSave(),
    shop: shop.toSave(),
  }
}

export function migrate(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.v !== 'number') return null
  if (raw.v > SAVE_VERSION) return null // newer than this build understands
  const save = raw
  // future versions: step-upgrade here, e.g. if (save.v === 1) save = v1ToV2(save)
  return save.v === SAVE_VERSION ? save : null
}

export function applySave(save, { game, shop }) {
  game.hydrate(save.game || {})
  shop.hydrate(save.shop || {})
}

export function writeLocal(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save))
  } catch {
    // quota exceeded / private mode — losing one autosave tick is acceptable
  }
}

export function readLocal() {
  try {
    return migrate(JSON.parse(localStorage.getItem(SAVE_KEY)))
  } catch {
    return null
  }
}
```

- [ ] **Step 6: Run tests, verify they pass**

Run: `npx vitest run tests/save.test.js` — Expected: PASS (8 tests).

- [ ] **Step 7: Commit**

```bash
git add src/lib/names.js src/lib/cloud.js src/lib/save.js tests/save.test.js
git commit -m "feat: versioned saves, nickname normalization, newest-wins cloud decision" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Supabase client + schema (`lib/supabase.js`, `supabase/schema.sql`, `.env`)

**Files:**
- Create: `src/lib/supabase.js`, `supabase/schema.sql`, `.env`

No unit tests — `fetchSave`/`upsertSave` are thin network wrappers behind the `hasSupabase` guard; they're exercised manually in Task 10's checklist. Everything testable (key normalization, merge decision) already lives in Task 5's pure modules.

- [ ] **Step 1: Write `src/lib/supabase.js`** (English-Trainer's graceful-degradation pattern)

```js
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const hasSupabase = Boolean(url && key)
export const supabase = hasSupabase ? createClient(url, key) : null

// Cloud snapshot row: { nickname, save, updated_at } or null.
export async function fetchSave(nicknameKey) {
  if (!hasSupabase || !nicknameKey) return null
  const { data, error } = await supabase
    .from('saves')
    .select('nickname, save, updated_at')
    .eq('nickname_key', nicknameKey)
    .maybeSingle()
  return error ? null : data
}

export async function upsertSave(nicknameKey, nickname, save) {
  if (!hasSupabase || !nicknameKey) return false
  const { error } = await supabase.from('saves').upsert({
    nickname_key: nicknameKey,
    nickname,
    save,
    updated_at: new Date().toISOString(),
  })
  return !error
}
```

- [ ] **Step 2: Write `supabase/schema.sql`**

```sql
-- Greenfield — Supabase schema
-- Run in the Supabase SQL editor. One cloud snapshot per nickname (see design
-- doc: identity is an honor-system nickname; world-writable BY DESIGN).

create table if not exists public.saves (
  nickname_key text primary key,            -- normalized: trim+lower+collapse spaces
  nickname     text        not null,        -- display casing as entered
  save         jsonb       not null,        -- full versioned game save (v field inside)
  updated_at   timestamptz not null default now()
);

alter table public.saves enable row level security;

-- World-readable (feeds the future leaderboard) and world-writable (no auth by
-- design — anyone can play as any nickname, same as the sibling trainers).
drop policy if exists "saves_read_all" on public.saves;
create policy "saves_read_all"
  on public.saves for select
  to anon
  using (true);

drop policy if exists "saves_insert_valid" on public.saves;
create policy "saves_insert_valid"
  on public.saves for insert
  to anon
  with check (
    char_length(nickname) between 2 and 20
    and char_length(nickname_key) between 2 and 20
  );

drop policy if exists "saves_update_valid" on public.saves;
create policy "saves_update_valid"
  on public.saves for update
  to anon
  using (true)
  with check (char_length(nickname) between 2 and 20);
-- No DELETE policy → deletes denied for anon.
```

- [ ] **Step 3: Write `.env`** (committed on purpose, like English-Trainer — values filled by the project owner; empty values mean the game runs in offline-only mode)

```
# Supabase project for Greenfield cloud snapshots. Anon key is public by design.
# Empty values = offline-only mode (hasSupabase=false), everything still works.
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

- [ ] **Step 4: Verify the app still builds with the new import**

Run: `npm run build` — Expected: build succeeds (supabase module tree-shakes cleanly; no env vars needed).

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase.js supabase/schema.sql .env
git commit -m "feat: Supabase client + saves table schema (nickname-keyed, no auth by design)" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Game + shop stores (`stores/game.js`, `stores/shop.js`)

**Files:**
- Create: `src/stores/game.js`, `src/stores/shop.js`
- Test: `tests/stores.test.js`

Both stores in one task because they're mutually recursive (game.tick reads shop.lps; shop.buy calls game.spend) — cross-store access happens lazily inside actions/computeds, which Pinia supports.

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../src/stores/game.js'
import { useShopStore } from '../src/stores/shop.js'
import { CONTRIBUTORS } from '../src/data/contributors.js'

beforeEach(() => setActivePinia(createPinia()))

describe('game store', () => {
  it('click adds clickPower to loc and lifetimeLoc', () => {
    const game = useGameStore()
    game.click()
    game.click()
    expect(game.loc).toBe(2)
    expect(game.lifetimeLoc).toBe(2)
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
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run tests/stores.test.js` — Expected: FAIL, modules not found.

- [ ] **Step 3: Implement `src/stores/game.js`**

```js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useShopStore } from './shop.js'

export const useGameStore = defineStore('game', () => {
  const loc = ref(0)         // spendable LoC
  const lifetimeLoc = ref(0) // never decreases — feeds the future Blueprint formula
  const clickPower = ref(1)

  function addLoc(amount) {
    loc.value += amount
    lifetimeLoc.value += amount
  }

  function click() {
    addLoc(clickPower.value)
  }

  function spend(amount) {
    if (loc.value < amount) return false
    loc.value -= amount
    return true
  }

  function tick(dtSeconds) {
    if (dtSeconds <= 0) return
    const shop = useShopStore()
    if (shop.lps > 0) addLoc(shop.lps * dtSeconds)
  }

  function toSave() {
    return { loc: loc.value, lifetimeLoc: lifetimeLoc.value }
  }

  function hydrate(slice) {
    loc.value = slice.loc ?? 0
    lifetimeLoc.value = slice.lifetimeLoc ?? 0
  }

  return { loc, lifetimeLoc, clickPower, addLoc, click, spend, tick, toSave, hydrate }
})
```

- [ ] **Step 4: Implement `src/stores/shop.js`**

```js
import { reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import { CONTRIBUTORS } from '../data/contributors.js'
import { costOf, totalLps } from '../lib/economy.js'
import { useGameStore } from './game.js'

export const useShopStore = defineStore('shop', () => {
  const owned = reactive({}) // { [contributorId]: count }

  const lps = computed(() => totalLps(CONTRIBUTORS, owned))

  function countOf(id) {
    return owned[id] || 0
  }

  function nextCostOf(contributor) {
    return costOf(contributor.baseCost, countOf(contributor.id))
  }

  function buy(contributor) {
    const game = useGameStore()
    if (!game.spend(nextCostOf(contributor))) return false
    owned[contributor.id] = countOf(contributor.id) + 1
    return true
  }

  function toSave() {
    return { owned: { ...owned } }
  }

  function hydrate(slice) {
    for (const k of Object.keys(owned)) delete owned[k]
    Object.assign(owned, slice.owned || {})
  }

  return { owned, lps, countOf, nextCostOf, buy, toSave, hydrate }
})
```

- [ ] **Step 5: Run tests, verify they pass**

Run: `npx vitest run tests/stores.test.js` — Expected: PASS (8 tests).

- [ ] **Step 6: Run the whole suite**

Run: `npm test` — Expected: all test files pass.

- [ ] **Step 7: Commit**

```bash
git add src/stores/game.js src/stores/shop.js tests/stores.test.js
git commit -m "feat: game + shop stores (click, spend, tick, buy)" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Meta store + UsernameModal (`stores/meta.js`, `components/UsernameModal.vue`)

**Files:**
- Create: `src/stores/meta.js`, `src/components/UsernameModal.vue`
- Test: `tests/meta.test.js`

- [ ] **Step 1: Write the failing tests** (with empty `VITE_SUPABASE_*`, `hasSupabase` is false, so `boot()` exercises the local-only path deterministically)

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMetaStore } from '../src/stores/meta.js'
import { useGameStore } from '../src/stores/game.js'
import { useShopStore } from '../src/stores/shop.js'
import { SAVE_KEY } from '../src/lib/save.js'

beforeEach(() => {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  }
  setActivePinia(createPinia())
})

describe('meta store', () => {
  it('saveNickname persists to localStorage under gf_user', () => {
    const meta = useMetaStore()
    meta.saveNickname('Linq Padawan')
    expect(localStorage.getItem('gf_user')).toBe('Linq Padawan')
    expect(meta.nickname).toBe('Linq Padawan')
  })
  it('saveLocal writes a snapshot that boot() restores', async () => {
    const meta = useMetaStore()
    const game = useGameStore()
    game.addLoc(42)
    meta.saveLocal()
    expect(localStorage.getItem(SAVE_KEY)).toBeTruthy()

    // simulate a fresh session
    setActivePinia(createPinia())
    const meta2 = useMetaStore()
    await meta2.boot()
    expect(useGameStore().loc).toBe(42)
    expect(meta2.booted).toBe(true)
  })
  it('boot() with no saves leaves a fresh game', async () => {
    const meta = useMetaStore()
    await meta.boot()
    expect(useGameStore().loc).toBe(0)
    expect(useShopStore().lps).toBe(0)
    expect(meta.booted).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run tests/meta.test.js` — Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/stores/meta.js`**

```js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { keyOf } from '../lib/names.js'
import { buildSave, applySave, readLocal, writeLocal } from '../lib/save.js'
import { decideSource } from '../lib/cloud.js'
import { fetchSave, upsertSave } from '../lib/supabase.js'
import { useGameStore } from './game.js'
import { useShopStore } from './shop.js'

const USER_KEY = 'gf_user'

export const useMetaStore = defineStore('meta', () => {
  const nickname = ref('')
  const booted = ref(false)
  const lastCloudSync = ref(0)

  function stores() {
    return { game: useGameStore(), shop: useShopStore() }
  }

  function saveNickname(name) {
    nickname.value = name
    localStorage.setItem(USER_KEY, name)
  }

  function saveLocal() {
    writeLocal(buildSave(stores()))
  }

  async function syncCloud() {
    if (!nickname.value) return false
    const ok = await upsertSave(keyOf(nickname.value), nickname.value, buildSave(stores()))
    if (ok) lastCloudSync.value = Date.now()
    return ok
  }

  // Load order: nickname → local save + cloud snapshot → newest savedAt wins.
  async function boot() {
    nickname.value = localStorage.getItem(USER_KEY) || ''
    const local = readLocal()
    let cloud = null
    if (nickname.value) {
      const row = await fetchSave(keyOf(nickname.value))
      cloud = row?.save ?? null
    }
    const source = decideSource(local, cloud)
    if (source === 'local') applySave(local, stores())
    if (source === 'cloud') applySave(cloud, stores())
    booted.value = true
  }

  return { nickname, booted, lastCloudSync, saveNickname, saveLocal, syncCloud, boot }
})
```

- [ ] **Step 4: Implement `src/components/UsernameModal.vue`** (simplified from English-Trainer's modal — same validation rules; not dismissable in M1 because a nickname is required before play)

```vue
<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  initial: { type: String, default: '' },
})
const emit = defineEmits(['save'])

const val = ref(props.initial)
const inputRef = ref(null)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      val.value = props.initial || ''
      setTimeout(() => inputRef.value?.focus(), 30)
    }
  },
  { immediate: true },
)

function isValid() {
  const t = val.value.trim()
  return t.length >= 2 && t.length <= 20 && /^[\p{L}\p{N} _-]+$/u.test(t)
}

function submit(e) {
  e.preventDefault()
  if (isValid()) emit('save', val.value.trim())
}
</script>

<template>
  <div v-if="open" class="modal-overlay">
    <form class="modal card" role="dialog" aria-modal="true" aria-label="Choose your nickname" @submit="submit">
      <h2>Welcome to Greenfield 🌱</h2>
      <p class="muted">
        Pick a nickname — it identifies your save (and future leaderboard entries).
        No password, no account.
      </p>
      <input
        ref="inputRef"
        v-model="val"
        class="text-input"
        maxlength="24"
        placeholder="e.g. LinqPadawan"
        autocomplete="off"
      />
      <p class="hint" :class="{ bad: val.trim().length > 0 && !isValid() }">
        2–20 characters: letters, numbers, spaces, _ or -
      </p>
      <button type="submit" class="btn btn-primary" :disabled="!isValid()">Start coding</button>
    </form>
  </div>
</template>
```

- [ ] **Step 5: Run tests, verify they pass**

Run: `npx vitest run tests/meta.test.js` — Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/stores/meta.js src/components/UsernameModal.vue tests/meta.test.js
git commit -m "feat: meta store (nickname, boot, cloud sync) + username modal" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Game UI shell + loops (`App.vue` + remaining components + styles)

**Files:**
- Create: `src/components/HeaderBar.vue`, `src/components/ClickTarget.vue`, `src/components/ContributorRow.vue`, `src/components/ShopPanel.vue`
- Modify: `src/App.vue` (replace stub), `src/styles/index.css` (append component styles)

- [ ] **Step 1: Write `src/components/HeaderBar.vue`**

```vue
<script setup>
import { useGameStore } from '../stores/game.js'
import { useShopStore } from '../stores/shop.js'
import { useMetaStore } from '../stores/meta.js'
import { formatNumber, formatRate } from '../lib/format.js'

const game = useGameStore()
const shop = useShopStore()
const meta = useMetaStore()
</script>

<template>
  <header class="header">
    <span class="brand">🌱 Greenfield</span>
    <div class="counters">
      <strong class="loc-counter">{{ formatNumber(game.loc) }} LoC</strong>
      <span class="muted">{{ formatRate(shop.lps) }} LoC/s</span>
    </div>
    <span class="muted">{{ meta.nickname || '—' }}</span>
  </header>
</template>
```

- [ ] **Step 2: Write `src/components/ClickTarget.vue`**

```vue
<script setup>
import { useGameStore } from '../stores/game.js'

const game = useGameStore()
</script>

<template>
  <div class="click-pane">
    <button class="click-target" aria-label="Write code" @click="game.click()">💻</button>
    <p class="muted">Write code — +{{ game.clickPower }} LoC per click</p>
  </div>
</template>
```

- [ ] **Step 3: Write `src/components/ContributorRow.vue`**

```vue
<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game.js'
import { useShopStore } from '../stores/shop.js'
import { formatNumber, formatRate } from '../lib/format.js'
import { contributorLps } from '../lib/economy.js'

const props = defineProps({ contributor: { type: Object, required: true } })

const game = useGameStore()
const shop = useShopStore()

const ownedCount = computed(() => shop.countOf(props.contributor.id))
const cost = computed(() => shop.nextCostOf(props.contributor))
const lps = computed(() => contributorLps(props.contributor.baseLps, ownedCount.value))
const affordable = computed(() => game.loc >= cost.value)
</script>

<template>
  <div class="contributor-row card" :title="contributor.flavor">
    <span class="contributor-icon">{{ contributor.icon }}</span>
    <div class="contributor-info">
      <strong>{{ contributor.name }}</strong>
      <span class="muted">{{ formatRate(lps) }} LoC/s · owned {{ ownedCount }}</span>
    </div>
    <button class="btn" :disabled="!affordable" @click="shop.buy(contributor)">
      {{ formatNumber(cost) }} LoC
    </button>
  </div>
</template>
```

- [ ] **Step 4: Write `src/components/ShopPanel.vue`**

```vue
<script setup>
import { CONTRIBUTORS } from '../data/contributors.js'
import ContributorRow from './ContributorRow.vue'
</script>

<template>
  <div class="shop">
    <h2>Contributors</h2>
    <ContributorRow v-for="c in CONTRIBUTORS" :key="c.id" :contributor="c" />
  </div>
</template>
```

- [ ] **Step 5: Replace `src/App.vue`** — wires the three loops: 100 ms economy tick (elapsed-time catch-up per the design spec), 30 s local autosave, 5 min cloud sync; saves on tab close

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue'
import HeaderBar from './components/HeaderBar.vue'
import ClickTarget from './components/ClickTarget.vue'
import ShopPanel from './components/ShopPanel.vue'
import UsernameModal from './components/UsernameModal.vue'
import { useGameStore } from './stores/game.js'
import { useMetaStore } from './stores/meta.js'

const game = useGameStore()
const meta = useMetaStore()

let tickHandle, saveHandle, cloudHandle, lastTick

function onBeforeUnload() {
  meta.saveLocal()
}

onMounted(async () => {
  await meta.boot()
  lastTick = performance.now()
  tickHandle = setInterval(() => {
    const now = performance.now()
    game.tick((now - lastTick) / 1000) // dt = real elapsed time → correct under tab throttling
    lastTick = now
  }, 100)
  saveHandle = setInterval(() => meta.saveLocal(), 30_000)
  cloudHandle = setInterval(() => meta.syncCloud(), 300_000)
  window.addEventListener('beforeunload', onBeforeUnload)
})

onUnmounted(() => {
  clearInterval(tickHandle)
  clearInterval(saveHandle)
  clearInterval(cloudHandle)
  window.removeEventListener('beforeunload', onBeforeUnload)
})

function onSaveName(name) {
  meta.saveNickname(name)
  meta.saveLocal()
  meta.syncCloud()
}
</script>

<template>
  <UsernameModal :open="meta.booted && !meta.nickname" @save="onSaveName" />
  <HeaderBar />
  <main class="layout">
    <section class="pane"><ClickTarget /></section>
    <section class="pane"><ShopPanel /></section>
  </main>
</template>
```

- [ ] **Step 6: Append component styles to `src/styles/index.css`**

```css
/* ── layout ── */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--panel);
}
.brand { font-weight: 700; font-size: 1.05rem; }
.counters { display: flex; align-items: baseline; gap: 12px; }
.loc-counter { font-size: 1.3rem; color: var(--accent); }

.layout {
  display: grid;
  grid-template-columns: 1fr 440px;
  gap: 20px;
  padding: 20px;
  max-width: 1100px;
  margin: 0 auto;
}
@media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }

/* ── click pane ── */
.click-pane {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 320px;
}
.click-target {
  font-size: 5rem;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  border: 2px solid var(--accent-2);
  background: var(--panel-2);
  cursor: pointer;
  transition: transform 60ms ease;
  user-select: none;
}
.click-target:active { transform: scale(0.93); }

/* ── shop ── */
.shop { display: flex; flex-direction: column; gap: 10px; }
.shop h2 { margin: 0 0 4px; font-size: 1.05rem; }
.contributor-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.contributor-icon { font-size: 1.7rem; width: 40px; text-align: center; }
.contributor-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.contributor-row .btn { min-width: 110px; }

/* ── modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.modal { width: min(420px, 92vw); display: flex; flex-direction: column; gap: 10px; }
.modal h2 { margin: 0; }
.hint { font-size: 0.85rem; color: var(--muted); margin: 0; }
.hint.bad { color: var(--bad); }
```

- [ ] **Step 7: Full suite + manual smoke test**

Run: `npm test` — Expected: ALL tests pass.
Run: `npm run dev`, open `http://localhost:5175/` and verify, in order:
1. Username modal appears; invalid names ("x", "a$b") keep the button disabled; a valid name dismisses it.
2. Clicking the 💻 increments the LoC counter by 1 per click.
3. Click to 15 LoC → buy an Intern → LoC drops by 15, "0.1 LoC/s" shows in the header, the counter creeps up on its own, the Intern's next cost reads 18 LoC.
4. Reload the page → nickname and progress survive (localStorage restore).
5. No console errors (Supabase silently off with empty .env).
Stop the server.

- [ ] **Step 8: Commit**

```bash
git add src/App.vue src/components/ src/styles/index.css
git commit -m "feat: playable M1 shell — click target, shop, header, tick/save loops" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: Deploy workflow + final verification

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write `.github/workflows/deploy.yml`** (English-Trainer's workflow + a test gate)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: "true"

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
      - name: Install dependencies
        run: npm ci
      - name: Test
        run: npm test
      - name: Build (reads .env for VITE_SUPABASE_* — committed on purpose)
        run: npm run build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Final verification pass**

Run: `npm test` — Expected: all suites green.
Run: `npm run build` — Expected: `dist/` produced without warnings that matter.
Check: `git status` shows only `.github/` untracked; nothing else dirty.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: GitHub Pages deploy with test gate" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Manual follow-ups for the project owner** (report, don't do):
- Create the GitHub repo + push; enable Pages (Actions source).
- Create/reuse a Supabase project, run `supabase/schema.sql`, fill `.env`, commit.
- After `.env` is filled: manual cloud check — play, wait for a sync (or trigger one by setting the nickname), verify a row in `saves`, open the site in a second browser with the same nickname and confirm the newer save wins.
