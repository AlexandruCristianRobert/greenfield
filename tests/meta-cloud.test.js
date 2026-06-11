import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../src/lib/supabase.js', () => ({
  hasSupabase: true,
  fetchSave: vi.fn(),
  upsertSave: vi.fn(),
}))

import { fetchSave, upsertSave } from '../src/lib/supabase.js'
import { useMetaStore } from '../src/stores/meta.js'
import { useGameStore } from '../src/stores/game.js'
import { SAVE_VERSION } from '../src/lib/save.js'

beforeEach(() => {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  }
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

function cloudRow(save) {
  return { nickname: 'Tester', save, updated_at: new Date().toISOString() }
}
function cloudSave(loc) {
  return { v: SAVE_VERSION, savedAt: 1000, game: { loc, lifetimeLoc: loc }, shop: { owned: { intern: 2 } } }
}

describe('syncCloud gating (Supabase configured)', () => {
  it('refuses to upsert while the cloud state is unknown', async () => {
    const meta = useMetaStore()
    meta.saveNickname('Tester')
    fetchSave.mockResolvedValue({ ok: false, row: null })
    expect(await meta.syncCloud()).toBe(false)
    expect(upsertSave).not.toHaveBeenCalled()
  })

  it('recovers an existing cloud save on a fresh device, then upserts', async () => {
    const meta = useMetaStore()
    await meta.boot() // no nickname yet → no fetch; fresh device
    meta.saveNickname('Tester')
    fetchSave.mockResolvedValue({ ok: true, row: cloudRow(cloudSave(777)) })
    upsertSave.mockResolvedValue(true)
    expect(await meta.syncCloud()).toBe(true)
    expect(useGameStore().loc).toBe(777)
    expect(upsertSave).toHaveBeenCalledTimes(1)
  })

  it('fetches only once: cloudReady persists across syncs', async () => {
    const meta = useMetaStore()
    await meta.boot()
    meta.saveNickname('Tester')
    fetchSave.mockResolvedValue({ ok: true, row: null })
    upsertSave.mockResolvedValue(true)
    await meta.syncCloud()
    await meta.syncCloud()
    expect(fetchSave).toHaveBeenCalledTimes(1)
    expect(upsertSave).toHaveBeenCalledTimes(2)
  })

  it('never upserts over a cloud save written by a newer build', async () => {
    const meta = useMetaStore()
    meta.saveNickname('Tester')
    fetchSave.mockResolvedValue({ ok: true, row: cloudRow({ v: SAVE_VERSION + 1, savedAt: 9 }) })
    expect(await meta.syncCloud()).toBe(false)
    expect(upsertSave).not.toHaveBeenCalled()
  })

  it('keeps in-session progress when the device booted with a local save', async () => {
    // seed nickname + local save in a first session
    const meta = useMetaStore()
    meta.saveNickname('Tester')
    useGameStore().addLoc(50)
    meta.saveLocal()
    // second session: boot fetch fails, local applied
    setActivePinia(createPinia())
    fetchSave.mockResolvedValueOnce({ ok: false, row: null })
    const meta2 = useMetaStore()
    await meta2.boot()
    expect(useGameStore().loc).toBe(50)
    // later sync succeeds and finds a cloud row — must NOT stomp local progress
    fetchSave.mockResolvedValueOnce({ ok: true, row: cloudRow(cloudSave(777)) })
    upsertSave.mockResolvedValue(true)
    expect(await meta2.syncCloud()).toBe(true)
    expect(useGameStore().loc).toBe(50)
  })
})
