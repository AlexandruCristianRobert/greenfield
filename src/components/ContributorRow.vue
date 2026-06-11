<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game.js'
import { useShopStore } from '../stores/shop.js'
import { formatNumber, formatRate } from '../lib/format.js'
import { contributorLps } from '../lib/economy.js'

const props = defineProps({ contributor: { type: Object, required: true } })

const game = useGameStore()
const shop = useShopStore()

const ownedCount = computed(() => shop.countOf(props.contributor.id))
const cost = computed(() => shop.nextCostOf(props.contributor))
const lps = computed(() => contributorLps(props.contributor.baseLps, ownedCount.value))
const affordable = computed(() => game.loc >= cost.value)
</script>

<template>
  <div class="contributor-row card" :title="contributor.flavor">
    <span class="contributor-icon">{{ contributor.icon }}</span>
    <div class="contributor-info">
      <strong>{{ contributor.name }}</strong>
      <span class="muted">{{ formatRate(lps) }} LoC/s · owned {{ ownedCount }}</span>
    </div>
    <button class="btn" :disabled="!affordable" @click="shop.buy(contributor)">
      {{ formatNumber(cost) }} LoC
    </button>
  </div>
</template>
