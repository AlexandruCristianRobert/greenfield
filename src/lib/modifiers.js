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
