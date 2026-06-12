<script setup>
import { ref } from 'vue'
import { useEventsStore } from '../stores/events.js'

const events = useEventsStore()
const outcome = ref(null) // null | true | false

function pick(i) {
  if (outcome.value !== null) return
  outcome.value = events.answerPr(i, Date.now())
}
function close() {
  outcome.value = null
}
</script>

<template>
  <div v-if="events.activePr || outcome !== null" class="modal-overlay">
    <div class="modal card exam-modal" role="dialog" aria-modal="true" aria-label="Pull request review">
      <template v-if="outcome === null && events.activePr">
        <p class="muted exam-progress">🔀 Incoming pull request</p>
        <h2 class="exam-question">{{ events.activePr.text }}</h2>
        <pre class="snippet"><code>{{ events.activePr.snippet }}</code></pre>
        <button v-for="(opt, i) in events.activePr.options" :key="i" class="btn exam-option" @click="pick(i)">
          {{ opt }}
        </button>
      </template>
      <template v-else>
        <h2>{{ outcome ? '✅ Merged!' : '💥 Merge conflict' }}</h2>
        <p class="muted">{{ outcome ? 'Production frenzy ×7 for 30 seconds (+1 Knowledge).' : 'Production halved for 30 seconds. Review more carefully!' }}</p>
        <button class="btn btn-primary" @click="close">Continue</button>
      </template>
    </div>
  </div>
</template>
