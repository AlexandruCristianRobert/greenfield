<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/game.js'
import { useProgressStore } from '../stores/progress.js'
import { useMetaStore } from '../stores/meta.js'
import { formatNumber } from '../lib/format.js'
import { EXAM_COOLDOWN_MS } from '../lib/exam.js'
import ExamModal from './ExamModal.vue'

const game = useGameStore()
const progress = useProgressStore()
const meta = useMetaStore()

const drawn = ref(null)
const now = ref(Date.now())
let clockHandle

onMounted(() => { clockHandle = setInterval(() => { now.value = Date.now() }, 1000) })
onUnmounted(() => clearInterval(clockHandle))

const eligibility = computed(() => progress.eligibility(now.value))
const cooldownLeft = computed(() =>
  Math.max(0, Math.ceil((progress.lastExamFailAt + EXAM_COOLDOWN_MS - now.value) / 1000)),
)

function startExam() {
  const d = progress.beginExam()
  if (d) drawn.value = d
}
</script>

<template>
  <div class="era-panel card">
    <ExamModal v-if="drawn" :drawn="drawn" @close="drawn = null; meta.saveLocal()" />
    <div class="era-title" :style="{ borderColor: progress.currentEra.color }">
      <strong>{{ progress.currentEra.csVersion }}</strong>
      <span class="muted">{{ progress.currentEra.name }} · {{ progress.currentEra.year }}</span>
    </div>

    <template v-if="progress.allErasDone">
      <p class="era-done">🏆 All M2 eras certified — C# 8+ arrives in the next update.</p>
    </template>
    <template v-else>
      <p class="muted era-cards-line">
        Feature Cards: {{ progress.ownedEraCount }} / {{ progress.eraFeatures.length }} (exam needs ≥ {{ Math.ceil(progress.eraFeatures.length / 2) }})
      </p>

      <button
        v-if="!progress.releaseFunded"
        class="btn btn-primary"
        :disabled="game.loc < progress.releaseCost"
        @click="progress.fundRelease()"
      >
        🚀 Fund the Release — {{ formatNumber(progress.releaseCost) }} LoC
      </button>

      <template v-else>
        <p class="release-ok">✅ Release funded</p>
        <button class="btn btn-primary" :disabled="!eligibility.eligible" @click="startExam">
          🎓 Take the Certification Exam
        </button>
        <p v-if="eligibility.reason === 'cards'" class="muted">Learn more of this era's Feature Cards first.</p>
        <p v-else-if="eligibility.reason === 'cooldown'" class="muted">Retry in {{ cooldownLeft }}s.</p>
      </template>
    </template>
  </div>
</template>
