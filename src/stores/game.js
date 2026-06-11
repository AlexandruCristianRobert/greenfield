import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useShopStore } from './shop.js'

export const useGameStore = defineStore('game', () => {
  const loc = ref(0)         // spendable LoC
  const lifetimeLoc = ref(0) // never decreases — feeds the future Blueprint formula
  const clickPower = ref(1)

  function addLoc(amount) {
    loc.value += amount
    lifetimeLoc.value += amount
  }

  function click() {
    addLoc(clickPower.value)
  }

  function spend(amount) {
    if (loc.value < amount) return false
    loc.value -= amount
    return true
  }

  function tick(dtSeconds) {
    if (!(dtSeconds > 0)) return
    const shop = useShopStore()
    if (shop.lps > 0) addLoc(shop.lps * dtSeconds)
  }

  function toSave() {
    return { loc: loc.value, lifetimeLoc: lifetimeLoc.value }
  }

  function hydrate(slice) {
    loc.value = slice.loc ?? 0
    lifetimeLoc.value = slice.lifetimeLoc ?? 0
  }

  return { loc, lifetimeLoc, clickPower, addLoc, click, spend, tick, toSave, hydrate }
})
