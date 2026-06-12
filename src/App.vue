<script setup>
import { onMounted, onUnmounted } from 'vue'
import HeaderBar from './components/HeaderBar.vue'
import ClickTarget from './components/ClickTarget.vue'
import ShopPanel from './components/ShopPanel.vue'
import NicknameModal from './components/NicknameModal.vue'
import EraPanel from './components/EraPanel.vue'
import { useGameStore } from './stores/game.js'
import { useMetaStore } from './stores/meta.js'

const game = useGameStore()
const meta = useMetaStore()

let tickHandle, saveHandle, cloudHandle, lastTick

function onBeforeUnload() {
  meta.saveLocal()
}

function onVisibilityChange() {
  // beforeunload is unreliable on mobile Safari — also save when backgrounded
  if (document.visibilityState === 'hidden') meta.saveLocal()
}

onMounted(async () => {
  await meta.boot()
  lastTick = performance.now()
  tickHandle = setInterval(() => {
    const now = performance.now()
    game.tick((now - lastTick) / 1000) // dt = real elapsed time → correct under tab throttling
    lastTick = now
  }, 100)
  saveHandle = setInterval(() => meta.saveLocal(), 30_000)
  cloudHandle = setInterval(() => meta.syncCloud(), 300_000)
  window.addEventListener('beforeunload', onBeforeUnload)
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  clearInterval(tickHandle)
  clearInterval(saveHandle)
  clearInterval(cloudHandle)
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
  <!-- Gate on booted so clicks can't land before the saved state is applied -->
  <main v-if="meta.booted" class="layout">
    <section class="pane">
      <ClickTarget />
      <EraPanel />
    </section>
    <section class="pane"><ShopPanel /></section>
  </main>
</template>
