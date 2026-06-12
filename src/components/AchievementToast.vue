<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAwardsStore } from '../stores/awards.js'

const awards = useAwardsStore()
const current = ref(null)
let pollHandle, hideHandle

onMounted(() => {
  pollHandle = setInterval(() => {
    if (!current.value) {
      const next = awards.shiftToast()
      if (next) {
        current.value = next
        hideHandle = setTimeout(() => { current.value = null }, 4000)
      }
    }
  }, 500)
})
onUnmounted(() => { clearInterval(pollHandle); clearTimeout(hideHandle) })
</script>

<template>
  <div v-if="current" class="ach-toast card">
    <span class="award-icon">{{ current.icon }}</span>
    <div><strong>Achievement: {{ current.name }}</strong><p class="muted" style="margin:0">{{ current.desc }} · +1% LoC/s</p></div>
  </div>
</template>
