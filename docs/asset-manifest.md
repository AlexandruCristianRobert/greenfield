# Greenfield — Asset Manifest

Every visual asset the game needs, one line per asset: path, dimensions, format, and a
generation-ready description. Batch-generate from this file (AI image gen or designer).
**M1 ships with emoji/CSS placeholders** — this manifest is the contract for replacing them.

Style baseline for ALL assets: flat vector look, two-tone + accent, dark-theme friendly,
transparent background, consistent 8% padding inside the canvas.

## Contributor icons (`src/assets/contributors/`) — needed from M1 (placeholders OK)

| File | Size | Description |
|---|---|---|
| intern.png | 256×256 | young dev with oversized laptop and coffee cup, friendly |
| junior.png | 256×256 | dev at small desk, single monitor, sticky notes |
| senior.png | 256×256 | calm dev, mechanical keyboard, dual monitors, plant |
| pair-duo.png | 256×256 | two devs sharing one keyboard, speech bubbles with brackets |
| build-agent.png | 256×256 | friendly robot arm stacking green-check boxes |
| cicd-pipeline.png | 256×256 | stylized pipeline tubes with code tokens flowing through |
| source-generator.png | 256×256 | gear emitting angle-bracket code fragments |
| copilot-agent.png | 256×256 | glowing AI orb hovering over a keyboard |
| distributed-team.png | 256×256 | globe with connected avatar nodes |
| oss-community.png | 256×256 | crowd of tiny avatars around a git branch tree |

## Chrome — needed from M1 (placeholders OK)

| File | Size | Description |
|---|---|---|
| logo.png | 512×512 | "Greenfield" wordmark: sprouting seedling growing out of `{ }` braces |
| favicon.svg | vector | seedling-in-braces glyph, single color |
| click-target.png | 512×512 | the legacy codebase: weathered monolith block of code being chipped into fresh green code |

## Era badges (`src/assets/eras/`) — M2

13 badges, 128×128 each, `cs2.png` … `cs14.png`: hexagonal version badge with the C#
version number, color ramps from rusty brown (C# 2) through blues to vivid green (C# 14).

## EF tier badges (`src/assets/ef/`) — M3

8 badges, 128×128, `ef6.png`, `efcore1.png`, `efcore3.png`, `efcore6.png`, `ef7.png` …
`ef11.png`: cylinder/database silhouette with version tag, same color-ramp idea.

## Event sprites (`src/assets/events/`) — M3

| File | Size | Description |
|---|---|---|
| golden-nuget.png | 192×192 | glowing golden NuGet package logo with sparkle trail |
| pr-toast.png | 128×128 | pull-request branch arrow icon in a speech bubble |
| merge-conflict.png | 128×128 | two clashing arrows with red zigzag |

## Pattern icons (`src/assets/patterns/`) — M4

6–10 icons, 128×128: di.png (injection syringe into socket), cqrs.png (split arrows
read/write), event-sourcing.png (timeline of dots), caching.png (lightning in a box),
clean-architecture.png (concentric rings), microservices.png (hex cluster).

## Skill Tree branch icons (`src/assets/skills/`) — M2

4 icons, 96×96: language.png (`{ }`), data.png (database cylinder), performance.png
(speedometer), tooling.png (wrench).

## Achievement badge templates (`src/assets/achievements/`) — M3

3 tiers, 128×128: badge-bronze.png / badge-silver.png / badge-gold.png — laurel ring,
center left empty for an overlaid glyph.
