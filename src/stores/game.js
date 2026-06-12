import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useShopStore } from './shop.js'
import { useProgressStore } from './progress.js'
import { useAwardsStore } from './awards.js'

// Saves can arrive from the world-writable cloud table — never trust them.
function toCount(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export const useGameStore = defineStore('game', () => {
  const loc = ref(0)         // spendable LoC
  const lifetimeLoc = ref(0) // never decreases — feeds the future Blueprint formula
  const clickPower = ref(1)

  const combo = ref(0) // 0..100, builds on clicks, decays when idle
  let lastClickAt = 0

  const comboMult = computed(() => 1 + combo.value / 100)

  function addLoc(amount) {
    loc.value += amount
    lifetimeLoc.value += amount
  }

  // What one click actually yields (base × card/skill multipliers × combo) —
  // the UI must show this number, not the raw base.
  const effectiveClick = computed(() => {
    const progress = useProgressStore()
    return clickPower.value * progress.mods.clickMult * comboMult.value
  })

  function click() {
    combo.value = Math.min(100, combo.value + 2)
    lastClickAt = Date.now()
    useAwardsStore().noteCombo(combo.value)
    addLoc(effectiveClick.value)
  }

  function decayCombo(dtSeconds, now = Date.now()) {
    if (combo.value > 0 && now - lastClickAt > 1_000) {
      combo.value = Math.max(0, combo.value - 60 * dtSeconds)
    }
  }

  function spend(amount) {
    if (loc.value < amount) return false
    loc.value -= amount
    return true
  }

  function tick(dtSeconds) {
    if (!(dtSeconds > 0)) return
    decayCombo(dtSeconds)
    const shop = useShopStore()
    if (shop.lps > 0) addLoc(shop.lps * dtSeconds)
  }

  function toSave() {
    return { loc: loc.value, lifetimeLoc: lifetimeLoc.value }
  }

  function hydrate(slice) {
    loc.value = toCount(slice.loc)
    lifetimeLoc.value = toCount(slice.lifetimeLoc)
  }

  return { loc, lifetimeLoc, clickPower, combo, comboMult, effectiveClick, addLoc, click, spend, decayCombo, tick, toSave, hydrate }
})
