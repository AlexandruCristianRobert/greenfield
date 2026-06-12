<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game.js'
import { useProgressStore } from '../stores/progress.js'
import { formatNumber } from '../lib/format.js'

const props = defineProps({ card: { type: Object, required: true } })

const game = useGameStore()
const progress = useProgressStore()
const showSnippet = ref(false)

const owned = computed(() => Boolean(progress.ownedCards[props.card.id]))
const affordable = computed(() => game.loc >= props.card.cost)
</script>

<template>
  <div class="feature-card card" :class="{ owned }">
    <div class="feature-head">
      <strong>{{ card.name }}</strong>
      <button v-if="!owned" class="btn" :disabled="!affordable" @click="progress.buyCard(card)">
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
