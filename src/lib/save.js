// Versioned save format. The save schema is the contract between runs AND with
// the Supabase snapshot — bump SAVE_VERSION and add a migration step whenever
// the shape changes. Layer-2 prestige fields will be added here in a later
// milestone via migration, per the design spec.
export const SAVE_VERSION = 2
export const SAVE_KEY = 'gf_save'

export function buildSave({ game, shop, progress }) {
  return {
    v: SAVE_VERSION,
    savedAt: Date.now(),
    game: game.toSave(),
    shop: shop.toSave(),
    progress: progress.toSave(),
  }
}

// True only for a structurally-sane save written by a NEWER build — the one
// case where a stale client must never overwrite the row. Unparseable junk
// does NOT qualify: overwriting junk with a real save is recovery, not loss.
export function isNewerVersion(raw) {
  return Boolean(raw && typeof raw === 'object' && typeof raw.v === 'number' && raw.v > SAVE_VERSION)
}

export function migrate(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.v !== 'number') return null
  if (raw.v > SAVE_VERSION) return null // newer than this build understands
  let save = raw
  if (save.v === 1) save = { ...save, v: 2, progress: {} }
  return save.v === SAVE_VERSION ? save : null
}

export function applySave(save, { game, shop, progress }) {
  game.hydrate(save.game || {})
  shop.hydrate(save.shop || {})
  progress.hydrate(save.progress || {})
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
