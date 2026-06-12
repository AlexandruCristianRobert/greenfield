<script setup>
import { onMounted, onUnmounted } from 'vue'
import HeaderBar from './components/HeaderBar.vue'
import ClickTarget from './components/ClickTarget.vue'
import ShopPanel from './components/ShopPanel.vue'
import NicknameModal from './components/NicknameModal.vue'
import EraPanel from './components/EraPanel.vue'
import PrestigePanel from './components/PrestigePanel.vue'
import PrToast from './components/PrToast.vue'
import PrModal from './components/PrModal.vue'
import NuggetSprite from './components/NuggetSprite.vue'
import AchievementToast from './components/AchievementToast.vue'
import OfflineModal from './components/OfflineModal.vue'
import { useGameStore } from './stores/game.js'
import { useMetaStore } from './stores/meta.js'
import { useEventsStore } from './stores/events.js'
import { useAwardsStore } from './stores/awards.js'
import { usePrestigeStore } from './stores/prestige.js'
import { useShopStore } from './stores/shop.js'

const game = useGameStore()
const meta = useMetaStore()
const events = useEventsStore()
const awards = useAwardsStore()
const prestige = usePrestigeStore()
const shop = useShopStore()

let tickHandle, saveHandle, cloudHandle, secondHandle, lastTick
let tickCount = 0

function onBeforeUnload() {
  meta.saveLocal()
}

function onVisibilityChange() {
  // beforeunload is unreliable on mobile Safari — also save when backgrounded
  if (document.visibilityState === 'hidden') meta.saveLocal()
}

onMounted(async () => {
  await meta.boot()
  events.init(Date.now())
  lastTick = performance.now()
  tickHandle = setInterval(() => {
    const now = performance.now()
    game.tick((now - lastTick) / 1000) // dt = real elapsed time → correct under tab throttling
    lastTick = now
  }, 100)
  saveHandle = setInterval(() => meta.saveLocal(), 30_000)
  cloudHandle = setInterval(() => meta.syncCloud(), 300_000)
  secondHandle = setInterval(() => {
    events.tick(Date.now())
    tickCount++
    if (tickCount % 5 === 0) awards.evaluate()
    if (tickCount % 10 === 0 && prestige.hasPattern('pat-di')) shop.autoBuy()
  }, 1000)
  window.addEventListener('beforeunload', onBeforeUnload)
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  clearInterval(tickHandle)
  clearInterval(saveHandle)
  clearInterval(cloudHandle)
  clearInterval(secondHandle)
  window.removeEventListener('beforeunload', onBeforeUnload)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

function onSaveName(name) {
  meta.saveNickname(name)
  meta.saveLocal()
  meta.syncCloud()
}
</script>

<template>
  <NicknameModal :open="meta.booted && !meta.nickname" @save="onSaveName" />
  <HeaderBar />
  <PrToast />
  <PrModal />
  <NuggetSprite />
  <AchievementToast />
  <OfflineModal />
  <!-- Gate on booted so clicks can't land before the saved state is applied -->
  <main v-if="meta.booted" class="layout">
    <section class="pane">
      <ClickTarget />
      <EraPanel />
      <PrestigePanel />
    </section>
    <section class="pane"><ShopPanel /></section>
  </main>
</template>
