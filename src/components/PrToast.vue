<script setup>
import { useEventsStore } from '../stores/events.js'

const events = useEventsStore()
</script>

<template>
  <button v-if="events.prOffer && !events.activePr" class="pr-toast card" @click="events.openPr(Date.now())">
    📬 <strong>A pull request needs review!</strong>
    <span class="muted">Click to review — correct merge = ×7 frenzy</span>
  </button>
</template>
