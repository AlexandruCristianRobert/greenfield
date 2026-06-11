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
