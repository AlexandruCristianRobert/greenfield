# Greenfield

A browser incremental game that teaches modern C# (through C# 14) and Entity Framework (through EF 11) by making knowledge the progression axis. You inherit a legacy codebase and modernize it through twenty years of C# history.

## Language

**Era**:
A game level themed on a real C# language version (C# 2 … C# 14). Unlocks that version's Feature Cards.
_Avoid_: level, stratum, stage

**Era Gate**:
The two-step barrier between Eras: fund the Release, then pass the Certification Exam.
_Avoid_: wall, boss

**Release**:
The one-time LoC sink that ends an Era's economy. Must be re-funded every run, including after a Rewrite.

**Certification Exam**:
The up-to-6-question quiz (fewer when few Feature Cards are owned) gating Era advancement. Requires the Release funded and ≥50% of the Era's Feature Cards owned; once passed, auto-passes in all future runs.
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

**LoC**:
Lines of code — the primary currency, earned by clicking and by Contributors.
_Avoid_: money, credits, points
