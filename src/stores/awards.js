import { reactive } from 'vue'
import { defineStore } from 'pinia'

// Minimal stub — Task 3 replaces this with the full achievements store.
export const useAwardsStore = defineStore('awards', () => {
  const stats = reactive({ maxCombo: 0, nuggetsClicked: 0, prsCorrect: 0 })
  function bumpStat(key, value = 1) {
    if (key in stats) stats[key] += value
  }
  return { stats, bumpStat }
})
