<script setup>
import { computed } from 'vue'
import { useEfStore } from '../stores/ef.js'
import { useGameStore } from '../stores/game.js'
import { useShopStore } from '../stores/shop.js'
import { ERAS } from '../data/eras.js'
import { efFeaturesOf } from '../data/efFeatures.js'
import { formatNumber, formatRate } from '../lib/format.js'
import FeatureCardItem from './FeatureCardItem.vue'

const ef = useEfStore()
const game = useGameStore()
const shop = useShopStore()

const requiredEraName = computed(() => {
  if (!ef.nextTier) return ''
  const era = ERAS.find((e) => e.id === ef.nextTier.requiresEra)
  return era ? era.csVersion : ''
})
const tierCards = computed(() => (ef.tierIndex >= 0 ? efFeaturesOf(ef.currentTier.id) : []))
</script>

<template>
  <div class="shop-list">
    <div class="card ef-status">
      <template v-if="ef.tierIndex >= 0">
        <p class="ef-line"><strong>{{ ef.currentTier.name }}</strong> — your data layer</p>
        <div class="persistence-bar">
          <div class="persistence-fill" :style="{ width: Math.round(ef.ratio * 100) + '%' }" />
        </div>
        <p class="muted ef-line">
          Persistence: {{ Math.round(ef.ratio * 100) }}% · throughput {{ formatRate(ef.throughput) }} vs
          emission {{ formatRate(shop.baseLps) }} · production ×{{ ef.dataMult.toFixed(2) }}
        </p>
      </template>
      <p v-else class="muted ef-line">
        Your app emits Data as it grows — without a data layer it's all lost.
        Adopt Entity Framework to persist it and multiply production (up to ×3).
      </p>
      <button
        v-if="ef.nextTier"
        class="btn btn-primary"
        :disabled="!ef.nextTierUnlocked || game.loc < ef.nextTier.cost"
        @click="ef.buyNextTier()"
      >
        💾 {{ ef.tierIndex >= 0 ? 'Upgrade to' : 'Adopt' }} {{ ef.nextTier.name }} — {{ formatNumber(ef.nextTier.cost) }} LoC
      </button>
      <p v-if="ef.nextTier && !ef.nextTierUnlocked" class="muted ef-line">Requires the {{ requiredEraName }} era.</p>
    </div>
    <template v-if="ef.tierIndex >= 0">
      <h3 class="era-heading">{{ ef.currentTier.name }} features</h3>
      <FeatureCardItem
        v-for="card in tierCards"
        :key="card.id"
        :card="card"
        :owned="Boolean(ef.ownedCards[card.id])"
        :affordable="game.loc >= card.cost"
        @buy="ef.buyCard(card)"
      />
    </template>
  </div>
</template>
