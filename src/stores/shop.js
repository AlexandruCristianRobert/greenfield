import { reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import { CONTRIBUTORS } from '../data/contributors.js'
import { costOf, totalLps } from '../lib/economy.js'
import { useGameStore } from './game.js'

// Saves can arrive from the world-writable cloud table — never trust them.
function toCount(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export const useShopStore = defineStore('shop', () => {
  const owned = reactive({}) // { [contributorId]: count }

  const lps = computed(() => totalLps(CONTRIBUTORS, owned))

  function countOf(id) {
    return owned[id] || 0
  }

  function nextCostOf(contributor) {
    return costOf(contributor.baseCost, countOf(contributor.id))
  }

  function buy(contributor) {
    const game = useGameStore()
    if (!game.spend(nextCostOf(contributor))) return false
    owned[contributor.id] = countOf(contributor.id) + 1
    return true
  }

  function toSave() {
    return { owned: { ...owned } }
  }

  function hydrate(slice) {
    for (const k of Object.keys(owned)) delete owned[k]
    for (const [id, count] of Object.entries(slice.owned || {})) {
      const n = Math.floor(toCount(count))
      if (n > 0) owned[id] = n
    }
  }

  return { owned, lps, countOf, nextCostOf, buy, toSave, hydrate }
})
