<script setup>
import { usePrestigeStore } from '../stores/prestige.js'
import { PATTERNS } from '../data/patterns.js'

const prestige = usePrestigeStore()
</script>

<template>
  <div class="shop-list">
    <p class="knowledge-line">📐 Blueprints: <strong>{{ prestige.blueprints }}</strong> · earned via the Rewrite (∛ of run LoC / 100T)</p>
    <p class="muted">Patterns are permanent — they survive every Rewrite.</p>
    <div v-for="p in PATTERNS" :key="p.id" class="card skill-branch">
      <div class="skill-head">
        <span class="skill-icon">{{ p.icon }}</span>
        <div class="skill-info">
          <strong>{{ p.name }}</strong>
          <span class="muted">{{ p.desc }}</span>
        </div>
        <button
          v-if="!prestige.patterns[p.id]"
          class="btn"
          :disabled="prestige.blueprints < p.cost"
          @click="prestige.buyPattern(p.id)"
        >{{ p.cost }} 📐</button>
        <span v-else class="feature-owned">✓ built</span>
      </div>
    </div>
  </div>
</template>
