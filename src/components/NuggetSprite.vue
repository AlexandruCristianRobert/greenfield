<script setup>
import { useEventsStore } from '../stores/events.js'

const events = useEventsStore()
</script>

<template>
  <button
    v-if="events.nugget"
    class="nugget"
    :style="{ left: events.nugget.xPct + '%', top: events.nugget.yPct + '%' }"
    aria-label="Golden NuGet"
    @click="events.clickNugget(Date.now())"
  >📦</button>
</template>
