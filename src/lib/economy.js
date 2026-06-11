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
