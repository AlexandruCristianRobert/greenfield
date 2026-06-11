<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  initial: { type: String, default: '' },
})
const emit = defineEmits(['save'])

const val = ref(props.initial)
const inputRef = ref(null)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      val.value = props.initial || ''
      setTimeout(() => inputRef.value?.focus(), 30)
    }
  },
  { immediate: true },
)

function isValid() {
  const t = val.value.trim()
  return t.length >= 2 && t.length <= 20 && /^[\p{L}\p{N} _-]+$/u.test(t)
}

function submit(e) {
  e.preventDefault()
  if (isValid()) emit('save', val.value.trim())
}
</script>

<template>
  <div v-if="open" class="modal-overlay">
    <form class="modal card" role="dialog" aria-modal="true" aria-label="Choose your nickname" @submit="submit">
      <h2>Welcome to Greenfield 🌱</h2>
      <p class="muted">
        Pick a nickname — it identifies your save (and future leaderboard entries).
        No password, no account.
      </p>
      <input
        ref="inputRef"
        v-model="val"
        class="text-input"
        maxlength="24"
        placeholder="e.g. LinqPadawan"
        autocomplete="off"
      />
      <p class="hint" :class="{ bad: val.trim().length > 0 && !isValid() }">
        2–20 characters: letters, numbers, spaces, _ or -
      </p>
      <button type="submit" class="btn btn-primary" :disabled="!isValid()">Start coding</button>
    </form>
  </div>
</template>
