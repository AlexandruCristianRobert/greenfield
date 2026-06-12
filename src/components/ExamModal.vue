<script setup>
import { ref, computed } from 'vue'
import { useProgressStore } from '../stores/progress.js'
import { passMarkFor } from '../lib/exam.js'

const props = defineProps({ drawn: { type: Array, required: true } })
const emit = defineEmits(['close'])

const progress = useProgressStore()
const index = ref(0)
const answers = ref([])
const result = ref(null)

const question = computed(() => props.drawn[index.value])

function pick(optionIndex) {
  if (result.value) return // exam already graded — ignore stray clicks
  answers.value[index.value] = optionIndex
  if (index.value < props.drawn.length - 1) {
    index.value += 1
  } else {
    result.value = progress.finishExam(answers.value)
  }
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal card exam-modal" role="dialog" aria-modal="true" aria-label="Certification Exam">
      <template v-if="!result">
        <p class="muted exam-progress">Question {{ index + 1 }} / {{ drawn.length }} · pass mark {{ passMarkFor(drawn.length) }}</p>
        <h2 class="exam-question">{{ question.text }}</h2>
        <button v-for="(opt, i) in question.options" :key="i" class="btn exam-option" @click="pick(i)">
          {{ opt }}
        </button>
      </template>
      <template v-else>
        <h2>{{ result.passed ? '🎓 Certified!' : '❌ Not yet' }}</h2>
        <p>{{ result.correct }} / {{ result.size }} correct.</p>
        <p class="muted">
          {{ result.passed
            ? 'The next era unlocks — new Feature Cards await.'
            : 'Review your Feature Cards and retry after the cooldown.' }}
        </p>
        <button class="btn btn-primary" @click="emit('close')">Continue</button>
      </template>
    </div>
  </div>
</template>
