import { ref } from 'vue'
import { defineStore } from 'pinia'
import { keyOf } from '../lib/names.js'
import { buildSave, applySave, readLocal, writeLocal, migrate } from '../lib/save.js'
import { decideSource } from '../lib/cloud.js'
import { hasSupabase, fetchSave, upsertSave } from '../lib/supabase.js'
import { useGameStore } from './game.js'
import { useShopStore } from './shop.js'

const NICKNAME_KEY = 'gf_nickname'

// localStorage can THROW on mere access in some privacy modes — degrade to
// memory-only identity instead of dying.
function safeGet(key) {
  try { return localStorage.getItem(key) } catch { return null }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, value) } catch { /* memory-only session */ }
}

export const useMetaStore = defineStore('meta', () => {
  const nickname = ref('')
  const booted = ref(false)
  const lastCloudSync = ref(0)
  // True once we've seen the cloud state for this nickname (or there is no cloud
  // at all). While false, upserts are forbidden: a failed boot fetch must never
  // let a fresh session overwrite an existing cloud save.
  const cloudReady = ref(false)
  let hadLocalAtBoot = false

  function stores() {
    return { game: useGameStore(), shop: useShopStore() }
  }

  function saveNickname(name) {
    nickname.value = name
    safeSet(NICKNAME_KEY, name)
  }

  function saveLocal() {
    writeLocal(buildSave(stores()))
  }

  async function syncCloud() {
    if (!nickname.value) return false
    if (!cloudReady.value) {
      // Cloud state unknown (boot fetch failed, or nickname was set after boot):
      // re-check before the first upsert. If a cloud save exists and this session
      // started without local progress, recover the cloud save instead of
      // clobbering it. (Narrow stomp window accepted for M1: if the modal-submit
      // fetch failed transiently, up to ~5 min of fresh-start progress yields to
      // the richer cloud save — the safer direction.)
      const res = await fetchSave(keyOf(nickname.value))
      if (!res.ok) return false
      const cloudSave = migrate(res.row?.save)
      // A row we can't migrate was written by a NEWER build — this stale client
      // must never upsert over it.
      if (res.row && !cloudSave) return false
      cloudReady.value = true
      if (cloudSave && !hadLocalAtBoot) {
        applySave(cloudSave, stores())
        saveLocal() // persist the recovery so a later failed upsert + tab death can't resurrect the stale local
      }
    }
    const ok = await upsertSave(keyOf(nickname.value), nickname.value, buildSave(stores()))
    if (ok) lastCloudSync.value = Date.now()
    return ok
  }

  // Load order: nickname → local save + cloud snapshot → newest savedAt wins.
  async function boot() {
    nickname.value = safeGet(NICKNAME_KEY) || ''
    const local = readLocal()
    hadLocalAtBoot = Boolean(local)
    cloudReady.value = !hasSupabase // offline mode: nothing to protect
    let cloud = null
    if (nickname.value && hasSupabase) {
      const res = await fetchSave(keyOf(nickname.value))
      if (res.ok) {
        cloud = migrate(res.row?.save) ?? null
        // A row we can't migrate was written by a NEWER build — keep cloudReady
        // false so this stale client never upserts over it.
        if (!res.row || cloud) cloudReady.value = true
      }
    }
    const source = decideSource(local, cloud)
    if (source === 'local') applySave(local, stores())
    if (source === 'cloud') applySave(cloud, stores())
    booted.value = true
  }

  return { nickname, booted, lastCloudSync, cloudReady, saveNickname, saveLocal, syncCloud, boot }
})
