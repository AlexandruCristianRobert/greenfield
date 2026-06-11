import { ref } from 'vue'
import { defineStore } from 'pinia'
import { keyOf } from '../lib/names.js'
import { buildSave, applySave, readLocal, writeLocal, migrate } from '../lib/save.js'
import { decideSource } from '../lib/cloud.js'
import { hasSupabase, fetchSave, upsertSave } from '../lib/supabase.js'
import { useGameStore } from './game.js'
import { useShopStore } from './shop.js'

const NICKNAME_KEY = 'gf_nickname'

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
    localStorage.setItem(NICKNAME_KEY, name)
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
      // clobbering it.
      const res = await fetchSave(keyOf(nickname.value))
      if (!res.ok) return false
      cloudReady.value = true
      const cloudSave = migrate(res.row?.save)
      if (cloudSave && !hadLocalAtBoot) applySave(cloudSave, stores())
    }
    const ok = await upsertSave(keyOf(nickname.value), nickname.value, buildSave(stores()))
    if (ok) lastCloudSync.value = Date.now()
    return ok
  }

  // Load order: nickname → local save + cloud snapshot → newest savedAt wins.
  async function boot() {
    nickname.value = localStorage.getItem(NICKNAME_KEY) || ''
    const local = readLocal()
    hadLocalAtBoot = Boolean(local)
    cloudReady.value = !hasSupabase // offline mode: nothing to protect
    let cloud = null
    if (nickname.value && hasSupabase) {
      const res = await fetchSave(keyOf(nickname.value))
      if (res.ok) {
        cloudReady.value = true
        cloud = migrate(res.row?.save) ?? null
      }
    }
    const source = decideSource(local, cloud)
    if (source === 'local') applySave(local, stores())
    if (source === 'cloud') applySave(cloud, stores())
    booted.value = true
  }

  return { nickname, booted, lastCloudSync, cloudReady, saveNickname, saveLocal, syncCloud, boot }
})
