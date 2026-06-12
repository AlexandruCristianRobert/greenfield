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
  it('saveNickname persists to localStorage under gf_nickname', () => {
    const meta = useMetaStore()
    meta.saveNickname('Linq Padawan')
    expect(localStorage.getItem('gf_nickname')).toBe('Linq Padawan')
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
  it('syncCloud is a no-op without a nickname', async () => {
    const meta = useMetaStore()
    expect(await meta.syncCloud()).toBe(false)
  })
  it('boot grants capped offline gains and reports them', async () => {
    const meta = useMetaStore()
    const game = useGameStore()
    const shop = useShopStore()
    shop.owned['junior'] = 10 // lps 10
    game.addLoc(0)
    // hand-write a save stamped 3 hours ago
    const save = JSON.parse(JSON.stringify(buildSaveForTest()))
    function buildSaveForTest() {
      meta.saveLocal()
      return JSON.parse(localStorage.getItem(SAVE_KEY))
    }
    save.savedAt = Date.now() - 3 * 3600 * 1000
    localStorage.setItem(SAVE_KEY, JSON.stringify(save))
    setActivePinia(createPinia())
    const meta2 = useMetaStore()
    await meta2.boot()
    const shop2 = useShopStore()
    expect(useGameStore().loc).toBeCloseTo(shop2.lps * 2 * 3600, -2) // capped at 2h (tooling 0)
    expect(meta2.offlineReport).not.toBe(null)
    expect(meta2.offlineReport.capped).toBe(true)
  })
})
