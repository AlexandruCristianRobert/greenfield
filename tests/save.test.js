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
  it('maps NFD and NFC spellings to the same key', () => {
    expect(keyOf('José')).toBe(keyOf('José')) // NFD vs NFC é
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
  it('treats missing savedAt as 0 (ties go local)', () => {
    expect(decideSource({}, {})).toBe('local')
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
  it('migrate rejects junk shapes', () => {
    expect(migrate({})).toBe(null)
    expect(migrate('string')).toBe(null)
    expect(migrate(null)).toBe(null)
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
