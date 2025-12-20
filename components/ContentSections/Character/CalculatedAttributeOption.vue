<template>
  <div class="calculated-attribute-container">
    <div class="flex w-full justify-between items-center px-2 py-1">
      <span class="attribute-name">
        {{ name }}
      </span>

      <div class="flex items-center gap-1">
        <input
          v-model.number="manualValue"
          type="number"
          :placeholder="calculatedValue.toString()"
          class="attribute-input"
          @input="handleInput"
        />
        <span class="attribute-unit">{{ unit }}</span>

        <button
          v-if="hasOverride"
          @click="clearOverride"
          class="reset-override-btn"
          title="Reset to calculated value"
        >
          Reset
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { usePlayerStore } from '@/store/player'

const playerStore = usePlayerStore()

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  identifier: {
    type: String,
    required: true
  },
  calculatedValue: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: ''
  }
})

const manualValue = ref<number | null>(null)

// Check if there's a manual override
const hasOverride = computed(() => {
  return (playerStore as any)[props.identifier] !== null
})

// Initialize manual value from store
watch(() => (playerStore as any)[props.identifier], (newVal) => {
  if (newVal !== null) {
    manualValue.value = newVal
  } else {
    manualValue.value = null
  }
}, { immediate: true })

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value

  // If input is empty, clear the override
  if (value === '' || value === null || value === undefined) {
    clearOverride()
    return
  }

  // Convert to number
  const numValue = Number(value)

  // If not a valid number, don't save
  if (isNaN(numValue)) {
    return
  }

  // Set the override value in the store
  (playerStore as any)[props.identifier] = numValue
  playerStore.save()
}

function updateValue() {
  // If input is empty, null, undefined, or NaN, clear the override
  if (
    manualValue.value === null ||
    manualValue.value === undefined ||
    isNaN(manualValue.value as number)
  ) {
    clearOverride()
    return
  }

  // Set the override value in the store
  (playerStore as any)[props.identifier] = manualValue.value
  playerStore.save()
}

function clearOverride() {
  manualValue.value = null;
  (playerStore as any)[props.identifier] = null
  playerStore.save()
}
</script>

<style scoped>
.calculated-attribute-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-secondary);
  overflow: hidden;
  transition: var(--transition-hover);
}

.calculated-attribute-container:hover {
  border-color: var(--color-border-primary);
  box-shadow: var(--shadow-gold-soft);
}

.attribute-name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.attribute-input {
  padding: 2px 4px;
  width: 3rem;
  text-align: center;
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-secondary);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  transition: var(--transition-hover);
}

.attribute-input:focus {
  outline: none;
  border-color: var(--color-accent-gold-dim);
  box-shadow: var(--shadow-gold-soft);
}

.attribute-input::placeholder {
  color: var(--color-text-tertiary);
  font-style: italic;
}

.attribute-unit {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.reset-override-btn {
  margin-left: 4px;
  padding: 2px 6px;
  font-size: var(--font-size-xs);
  background: var(--color-btn-danger-bg);
  border: var(--border-width-thin) solid var(--color-btn-danger-border);
  color: var(--color-btn-danger-text);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: var(--transition-hover);
}

.reset-override-btn:hover {
  background: var(--color-btn-danger-bg-hover);
  box-shadow: 0 0 10px rgba(220, 20, 60, 0.4);
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type=number] {
  -moz-appearance: textfield;
}
</style>
