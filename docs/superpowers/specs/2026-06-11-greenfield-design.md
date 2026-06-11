# Greenfield — a C#/EF Learning Clicker (Rough Design)

## Context

A brand-new standalone browser game — no existing project; `E:\Projects\Vue` is just the workspace, so the game lives in a new sibling folder (e.g. `Greenfield/`) with its own `package.json`, independently runnable and deployable like `Net-Trainer/` and `English-Trainer/`.

**Goal:** an incremental/clicker game that teaches modern C# (through C# 14) and Entity Framework (through EF 11 previews) by making knowledge the progression axis. It extends Cristian's trainer-app portfolio with a gamified learning layer.

**Decisions locked during brainstorming:**
- Theme: C#/.NET programming career — you modernize a legacy codebase through twenty years of C# history.
- Learning mode: **mandatory era exams** gate level progression + **PR quiz events** grant buffs (option "gates + events").
- Prestige: **two layers, staged** — layer 1 (the Rewrite) ships in v1; layer 2 (The Exit) is designed and architected in now (save format, balance curve), implemented as the first content update.
- Backend: minimal Supabase, nickname-keyed with no auth (same identity pattern as the other trainers); localStorage hot save + cloud snapshot per nickname.

This is a *rough plan* intended as input to the writing-plans skill (or similar) for a detailed implementation plan.

---

## Game design

### Fantasy & core loop

You inherit a .NET Framework-era legacy codebase. Click = write code → earn **LoC** → hire a team and build infrastructure that produces LoC per second → advance through **Language Eras** (real C# versions) by passing **Certification Exams** → unlock that era's real features as upgrades → ship v1.0 and perform a **Rewrite** (ascension) → eventually take **The Exit** (meta-rebirth).

### Currencies

| Currency | Earned by | Spent on |
|---|---|---|
| **LoC** (lines of code) | clicking, Contributors/sec | Contributors, click upgrades, Feature Cards, Release funding |
| **Knowledge** | exams, PR events, first read of a feature card | *allocated* (never consumed) into the Skill Tree; budget persists forever, allocation resets each Rewrite |
| **Blueprints** | layer-1 prestige (the Rewrite): ∝ ∛(lifetime LoC) | Patterns tree (permanent) |
| **GitHub Stars** | layer-2 prestige (The Exit): converts Blueprints+Patterns | meta-perks (permanent across everything) |

### Levels = Language Eras (C# versions)

Each era unlocks that version's real features as purchasable upgrades; the ordering itself teaches the language's evolution. Early eras are short/cheap; modern eras are deep. Rough ladder:

C# 2 (generics — tutorial) → C# 3 (LINQ, lambdas) → C# 4 (dynamic) → C# 5 (async/await) → C# 6 (interpolation) → C# 7 (tuples, pattern matching, Span begins) → C# 8 (nullable ref types, async streams) → C# 9 (records) → C# 10 (global usings) → C# 11 (raw strings, generic math) → C# 12 (primary constructors, collection expressions) → C# 13 (params collections) → C# 14 (extension members, `field`).

**Era Gate (two-step):** ① **Fund the Release** — a large one-time LoC sink, the era's economy wall. ② **Certification Exam** — unlocks once the Release is funded *and* ≥50% of the era's feature cards are owned (so the question pool can't be gamed thin); 5–7 questions drawn per attempt from the era's 10-question pool, restricted to owned cards, so retries differ (teach first, test second). Fail = short retry cooldown, no harsh penalty. **Across Rewrites:** the Release must be re-funded each run (economy pacing stays), but passed exams auto-pass forever — prestige replays are about economy speed, not re-quizzing.

**Parallel Data track (EF lane):** the codebase emits **Data** at a rate proportional to LoC/sec (never stockpiled). Your EF stack (current EF version + bought EF Feature Cards) provides **Persistence Throughput** (Data/sec capacity). The **Persistence Ratio** = min(1, throughput ÷ emission) drives a global LoC multiplier scaling ×1 (0%) → ×3 (100%). Because emission grows with your economy, throughput keeps falling behind — you continually reinvest in EF to keep the multiplier up, mirroring EF's real job: the data layer must keep up with the app. UI: a single "Persistence: 73%" bar. EF ladder: EF6 → EF Core 1/2/3 → EF Core 5/6 → EF 7 (bulk `ExecuteUpdate`) → EF 8 (complex types, JSON columns) → EF 9 → EF 10 → EF 11 (preview features). Feature-to-version mapping verified against Microsoft docs during content authoring.

### Shop categories

1. **Click upgrades** — IDE, Rider, dual monitors, mechanical keyboard; click power + crit ("multi-strike") chance.
2. **Contributors (LoC/sec)** — Intern → Junior → Senior → Pair-Programming Duo → Build Agent → CI/CD Pipeline → Source Generator → AI Copilot Agent → Distributed Team → OSS Community. Cost `base × 1.15^owned`; ownership milestones at 25/50/100 → ×2 output.
3. **Language features (era-gated)** — every card is a real feature with a one-line explanation + tiny code snippet; game effect is a metaphor for the real benefit (perf features → cost reductions, productivity features → multipliers). E.g. `Span<T>`: −15% Contributor costs; `async/await`: unlocks parallel production.
4. **Data/EF features (EF-tier-gated)** — same card format; boosts Data throughput → global multiplier.
5. **Patterns (prestige shop)** — see layer 1.

### Learning systems

- **Feature cards** (passive): buying = reading; first read grants Knowledge.
- **Certification Exams** (active, mandatory): era gates as above.
- **PR events** (active, optional): a pull request slides in with a code snippet — "Does this compile?" / "What does this print?" Correct → merge → ×7 production frenzy (~30s). Wrong → merge conflict (small, short debuff). Drawn from a dedicated PR bank filtered to eras already reached — players are never quizzed on unseen material. Knowledge is literally profitable.
- **Skill Tree** (build shaping): Knowledge allocates into Language / Data / Performance / Tooling branches. Allocation resets at every Rewrite (free respec), so each run supports a different build — active-clicker, idle, or EF-focused. The budget itself never resets and only grows through learning.
- Question bank lives in data tables alongside feature cards; each question tagged by era/feature.

### Prestige layer 1 — The Rewrite (v1)

Reset LoC, Contributors, era *economy* progress; keep Knowledge and passed exams. Feature Cards are re-bought each run (their effects are per-run economy); first-read Knowledge bonuses don't repeat. Earn **Blueprints** = ∛(lifetime LoC / 1e9)-style curve (tune later). Spend in a permanent **Patterns tree**: Dependency Injection (auto-buyers), CQRS (click & idle bonuses split, both amplified), Event Sourcing (offline earnings ×), Caching (combo decays slower), Clean Architecture (global ×). Each Rewrite run rolls a "client contract" modifier (e.g. +X% LoC value / −Y% click power) for variety.

### Prestige layer 2 — The Exit / Open-Source Release (post-v1, architected now)

Unlocks after reaching C# 14 / EF 11 and several Rewrites. Resets Blueprints + Patterns, converting them into **GitHub Stars** for permanent meta-perks: start Rewrites at a later era, keep 1–2 Patterns through resets, author "NuGet packages" (permanent equipment-style passives), unlock challenge contracts (modified runs, unique rewards). Save schema must reserve fields for this from day one.

### Pacing targets (classic idle slow-burn)

- Early eras: minutes-to-hours each. Late eras: **days each**. First Rewrite: ~1–2 days of play. First climb to C# 14: **weeks** of daily returns.
- Consequence 1 — **offline progress is a core engine**, not garnish: between-session gains drive the slow-burn; the offline cap (Tooling Skills + Event Sourcing Pattern) must be generous enough that a daily check-in always shows real movement.
- Consequence 2 — **PR events carry the learning between era gates**: with days between exams, PR frequency is tuned so every session includes learning moments (a handful per active hour).
- The balance simulation (see Verification) asserts era-arrival times against these bands.

### Supporting systems

Achievements (each +1% permanent, themed: "Allocation Annihilator", "LINQ Padawan") · flow-state combo meter (sustained clicking, decaying multiplier) · golden NuGet packages drifting across screen (click → temp buffs) · offline progress ("CI ran overnight" — cap extended by Tooling-branch Skills like *Nightly CI*, multiplied by the Event Sourcing Pattern; no separate logistics category exists) · stats page · settings (number notation 1.5M vs 1.5e6, save export/import string).

---

## Technical structure

- **Stack:** Vue 3 + Vite + Pinia, plain JS, plus a minimal **Supabase** connection (same pattern as the other trainers).
- **Identity:** first-load "insert your name" modal (reuse the Net-Trainer UsernameModal pattern); the **nickname** lives in localStorage and keys all DB rows. No auth, no protection — anyone can type any name and play as it (accepted by design, as in the other apps).
- **Saves:** localStorage is the hot save (versioned schema, autosave every 30s, export/import string). Supabase holds a cloud snapshot per nickname — a single `saves` table (`nickname` PK, `save` jsonb, `updated_at`) upserted every ~5 min and on key events (exam pass, Rewrite). When both exist at load, newest `updated_at` wins. The same table later feeds a leaderboard (lifetime LoC, era reached, Rewrite count) with no schema change.
- **Game loop:** `setInterval` 100 ms economy tick with elapsed-time catch-up (correct under tab throttling); `requestAnimationFrame` for visuals only. Offline gains computed from `lastSeen` on load.
- **Numbers:** native doubles (ample for this scope) + suffix formatting (K/M/B/T…).
- **Content is data, not code** (same pattern as the trainers): `src/data/eras.js`, `contributors.js`, `featuresLanguage.js`, `featuresEf.js`, `questions.js`, `patterns.js`, `achievements.js`, `contracts.js`.
- **Pinia stores:** `game` (resources, tick, buffs), `shop` (Contributors/upgrades owned), `progress` (eras, exams, knowledge, skill tree), `prestige` (blueprints, patterns, layer-2 fields reserved), `meta` (nickname, settings, save/load/migrate, cloud sync).
- **UI:** single page, tabbed panels (no router needed): UsernameModal, ClickTarget, ContributorRow, FeatureCard, EraProgress/ExamModal, PrEventToast, PrestigeModal, BuffBar, StatsPanel, SettingsPanel. UI language: English.
- **Deploy:** GitHub Pages via Actions workflow, same as the other trainers.

## Staged milestones

- **M1 — playable core:** click → LoC, Contributor ladder, buying, tick loop, local save/load, nickname modal + Supabase snapshot sync. 
- **M2 — learning spine:** eras + feature cards + exam gates (first ~6 eras), Knowledge + Skill Tree.
- **M3 — juice & breadth:** PR events, EF data track, combo meter, golden NuGets, achievements, offline progress, remaining eras to C# 14.
- **M4 — ascension:** the Rewrite, Blueprints, Patterns tree, client contracts. ← v1 ships here.
- **Post-v1:** The Exit / GitHub Stars, challenge contracts, NuGet equipment, leaderboard/ranking page (the `saves` table already carries the data).

## Content authoring note

Feature lists, version mappings (especially EF 9/10/11 and C# 13/14), explanations, and quiz questions must be **verified against official docs during authoring** (web research step in the implementation plan), not written from memory.

**Content budget (lean):** ~6 Feature Cards per C# era + ~3 per EF tier ≈ 100 cards total · exam pools of 10 questions per era ≈ 130 questions · PR bank ≈ 40 snippet questions. Every item doc-verified.

## Asset manifest (visual content to generate)

A dedicated file, `docs/asset-manifest.md` in the project, enumerates **every visual asset the game needs** so they can be batch-generated (AI image gen or designer). One line per asset: path, dimensions, format, and a generation-ready description. Example entry format:

```
assets/contributors/intern.png — 256×256 PNG, transparent bg — flat-style icon: young dev with
oversized laptop and coffee cup, friendly, two-tone palette matching era colors
```

Expected asset groups (final counts fixed when the manifest is authored):

| Group | ~Count | Notes |
|---|---|---|
| Contributor icons | 10 | one per ladder tier, consistent style |
| Era badges | 13 | one per C# version, used on era progress + exam screens |
| EF tier badges | 8 | EF6 → EF 11 |
| Pattern icons (prestige) | 6–10 | DI, CQRS, Event Sourcing, … |
| Skill Tree branch icons | 4 | Language / Data / Performance / Tooling |
| Event sprites | 3–5 | golden NuGet package, PR toast, merge-conflict |
| Achievement badges | 3–5 templates | tiered recolors, not unique art per achievement |
| Chrome | 3 | logo, favicon, click-target art (the "codebase" you click) |

UI chrome beyond this (bars, buttons, panels) is CSS, not images. The manifest is authored as its own task in the implementation plan, **before** any art generation, and kept current as content grows.

## Verification

- `npm run dev` and play each milestone end-to-end (click, buy, gate, exam, prestige).
- Unit tests for pure economy math: cost curves, milestone multipliers, offline calculation, Blueprint formula, save migration (follow the `tests/` convention used in Net-Trainer).
- Balance smoke: a small headless simulation script that auto-plays N days of game time (active sessions + offline gaps) and asserts era-arrival times land in the slow-burn bands from Pacing targets. Not optional given weeks-long balance can't be playtested by hand.

## Glossary (seeds the project's CONTEXT.md at scaffold time)

**Era**:
A game level themed on a real C# language version (C# 2 … C# 14). Unlocks that version's Feature Cards.
_Avoid_: level, stratum, stage

**Era Gate**:
The two-step barrier between Eras: fund the Release, then pass the Certification Exam.
_Avoid_: wall, boss

**Release**:
The one-time LoC sink that ends an Era's economy. Must be re-funded every run, including after a Rewrite.

**Certification Exam**:
The 5–7 question quiz gating Era advancement. Requires the Release funded and ≥50% of the Era's Feature Cards owned; once passed, auto-passes in all future runs.
_Avoid_: test, boss fight

**Feature Card**:
A purchasable upgrade representing one real C#/EF feature, carrying a one-line explanation and code snippet. Buying it applies a game effect that metaphors the feature's real benefit.
_Avoid_: upgrade card, perk

**Contributor**:
A purchasable LoC/sec producer — human or automated (Intern … OSS Community). The game's generator ladder.
_Avoid_: machine, building, generator, dev, team member

**Data**:
The stream your codebase emits at a rate proportional to LoC/sec. Never stockpiled — only persisted or lost.
_Avoid_: data points, records (overloaded with C# records)

**Persistence Throughput**:
The Data/sec capacity provided by the current EF version plus owned EF Feature Cards.

**Persistence Ratio**:
min(1, Persistence Throughput ÷ Data emission). Drives the global LoC multiplier (×1 at 0% → ×3 at 100%).
_Avoid_: efficiency, data score

**Knowledge**:
The permanent budget earned through Certification Exams, PR events, and first-time Feature Card reads. Allocated into the Skill Tree, never consumed.
_Avoid_: XP, research points

**Nickname**:
The unauthenticated identity chosen at first load. Lives in localStorage and keys every Supabase row; anyone may use any name.
_Avoid_: username, account, user

**Skill Tree**:
The four-branch (Language / Data / Performance / Tooling) allocation target for Knowledge. Allocations reset at every Rewrite; the budget does not.
_Avoid_: tech tree, talents

**Rewrite**:
The layer-1 prestige reset: LoC, Contributors, and era economy progress reset; Knowledge, passed Exams, and Patterns persist. Awards Blueprints.
_Avoid_: ascension, rebirth, greenfield rewrite (collides with the game's name)

**Blueprint**:
The layer-1 prestige currency, awarded at each Rewrite proportional to lifetime LoC. Spent permanently in the Patterns tree.
_Avoid_: architecture stars, architecture points

**Pattern**:
A permanent architecture perk (DI, CQRS, Event Sourcing, …) bought with Blueprints. Survives Rewrites; consumed by The Exit.
_Avoid_: prestige upgrade

**The Exit**:
The layer-2 meta-prestige: converts all Blueprints and Patterns into GitHub Stars. Post-v1.
_Avoid_: open-source release (flavor text only), second ascension

**GitHub Stars**:
The layer-2 currency for permanent meta-perks. Never reset by anything.
_Avoid_: stars (unqualified)

## Next step

Hand this design to the **writing-plans** skill to produce the detailed implementation plan (starting with M1).
