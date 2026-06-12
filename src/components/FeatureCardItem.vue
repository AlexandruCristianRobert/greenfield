<script setup>
import { ref } from 'vue'
import { formatNumber } from '../lib/format.js'

defineProps({
  card: { type: Object, required: true },
  owned: { type: Boolean, required: true },
  affordable: { type: Boolean, required: true },
})
const emit = defineEmits(['buy'])
const showSnippet = ref(false)
</script>

<template>
  <div class="feature-card card" :class="{ owned }">
    <div class="feature-head">
      <strong>{{ card.name }}</strong>
      <button v-if="!owned" class="btn" :disabled="!affordable" @click="emit('buy')">
        {{ formatNumber(card.cost) }} LoC
      </button>
      <span v-else class="feature-owned">✓ learned</span>
    </div>
    <p class="feature-effect">{{ card.effectText }}</p>
    <p class="muted feature-blurb">{{ card.blurb }}</p>
    <button class="snippet-toggle muted" @click="showSnippet = !showSnippet">
      {{ showSnippet ? 'hide code' : 'show code' }}
    </button>
    <pre v-if="showSnippet" class="snippet"><code>{{ card.snippet }}</code></pre>
  </div>
</template>
