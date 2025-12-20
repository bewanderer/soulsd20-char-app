<template>
  <div class="flex justify-between items-center w-full rounded-sm bg-white text-charcoal overflow-hidden">
    <div class="flex h-full border-r border-black">
      <button
        class="general-decrease-btn"
        @click="decreasePlayerStat"
      >
        -
      </button>

      <button
        class="general-increase-btn"
        @click="increasePlayerStat"
      >
        +
      </button>
    </div>

    <div class="flex w-full justify-between items-center">
      <span class="pl-2 pr-4 font-semibold">
        {{ name }}
      </span>

      <div class="flex items-center gap-2 pr-3">
        <input
          v-model="stat"
          type="number"
          :min="min"
          class="px-1 w-6 text-center text-charcoal bg-white"
          @change="setAmt"
        />

        <FieldComment
          :fieldKey="identifier"
          :fieldLabel="name"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as utils from '@/mixins/utils'
import { usePlayerStore } from '@/store/player'
import FieldComment from '~/components/UI/FieldComment.vue'

const playerStore = usePlayerStore()

const props = defineProps({
  name: {
    type: String,
    default: ''
  },
  identifier: {
    type: String,
    default: ''
  },
  statAmount: {
    type: Number,
    default: 0
  },
  min: {
    type: Number,
    default: undefined
  }
})

const stat = shallowRef(props.statAmount)

// Watch for changes to statAmount prop and update local stat
watch(() => props.statAmount, (newValue) => {
  stat.value = newValue
})

function setAmt() {
  if (!stat.value) stat.value = 0
  updatePlayerValue('set')
}

function decreasePlayerStat() {
  updatePlayerValue('decrease')
}

function increasePlayerStat() {
  updatePlayerValue('increase')
}

function updatePlayerValue(type?: string) {
  if (type !== 'set') {
    stat.value = type === 'increase' ? utils.increaseValue(stat.value) : utils.decreaseValue(stat.value, props.min)
  }

  // Check if this identifier exists on playerStore root or in UserInputValues
  if (props.identifier in playerStore) {
    // Directly on playerStore (FatePoints, AttunementSlots, etc.)
    (playerStore as any)[props.identifier] = stat.value
  } else {
    // In UserInputValues
    (playerStore.UserInputValues as any)[props.identifier] = stat.value
  }

  playerStore.save()
}
</script>

<style scoped>
/* Container dark theme */
.flex.justify-between.items-center.w-full.rounded-sm.bg-white {
  background: var(--color-bg-tertiary) !important;
  border: var(--border-width-thin) solid var(--color-border-primary);
  color: var(--color-text-primary) !important;
  transition: var(--transition-hover);
}

.flex.justify-between.items-center.w-full.rounded-sm.bg-white:hover {
  border-color: var(--color-accent-gold);
  box-shadow: var(--shadow-gold-soft);
}

/* Golden +/- buttons */
.general-decrease-btn,
.general-increase-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 1rem;
  background: var(--color-btn-primary-border);
  border: none;
  color: #ffffff;
  font-weight: var(--font-weight-bold);
  border-radius: 0;
  transition: var(--transition-hover);
  cursor: pointer;
}

.general-decrease-btn {
  border-right: 1px solid rgba(0, 0, 0, 0.3);
}

.general-decrease-btn:hover,
.general-increase-btn:hover {
  background: var(--color-btn-primary-border);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

/* Wider input field for 2+ digit numbers */
input[type="number"] {
  width: 2.5rem !important;
  min-width: 2.5rem !important;
  background: var(--color-bg-secondary) !important;
  color: var(--color-text-primary) !important;
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-sm);
}

/* Text contrast - white text on dark background */
span {
  color: var(--color-text-primary) !important;
}

/* Border color fix */
.border-black, .border-r {
  border-color: var(--color-border-primary) !important;
}
</style>