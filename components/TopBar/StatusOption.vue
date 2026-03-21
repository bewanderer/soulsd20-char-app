<template>
  <div class="status-container" :class="{ 'status-over-threshold': isOverThreshold }">
    <div class="status-buttons-wrapper">
      <button class="status-button" @click="decreaseStatus">
        -
      </button>

      <button class="status-button" @click="increaseStatus">
        +
      </button>
    </div>

    <div class="status-content">
      <span class="status-label">
        {{ name }}
      </span>

      <div class="status-input-wrapper">
        <input v-model.number="inflictionAmt" min="0" type="number" class="status-input" @blur="setAmt" @keyup.enter="setAmt" />
        <span class="status-separator">
          /
        </span>
        <div class="status-resistance">
          {{ resistance }}
        </div>
        <FieldComment
          :fieldKey="`status_${name.toLowerCase()}`"
          :fieldLabel="`${name} Status`"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as utils from '@/mixins/utils'
import { usePlayerStore } from '~~/store/player'
import FieldComment from '~/components/UI/FieldComment.vue'

const props = defineProps({
  name: {
    type: String,
    default: ''
  },
})

const playerStore = usePlayerStore()

const inflictionAmt = computed({
  get: () => (playerStore.UserInputValues.CurrentStatuses as any)[props.name],
  set: (value) => {
    (playerStore.UserInputValues.CurrentStatuses as any)[props.name] = value
    playerStore.save()
  }
})

const resistance = computed(()=>{
  if (props.name === 'Curse') return 10 + (playerStore.UserInputValues.BonusStatuses as any)[props.name]
  else if (props.name === 'Frost' || props.name === 'Bleed') return 10 + utils.statMod(playerStore.CharacterStats.Stats.Strength) + (playerStore.UserInputValues.BonusStatuses as any)[props.name]
  else if (props.name === 'Poison' || props.name === 'Toxic') return 10 + utils.statMod(playerStore.CharacterStats.Stats.Intelligence) + (playerStore.UserInputValues.BonusStatuses as any)[props.name]
  else if (props.name === 'Poise') {
    const poiseBonus = (playerStore.UserInputValues.BonusStatuses as any)[props.name] || 0
    if (playerStore.CharacterStats.Stats.Endurance >= 10) return playerStore.CharacterStats.Stats.Endurance - 5 + poiseBonus
    else return 5 + poiseBonus
  }
  return 0
})

// Visual indicator when status buildup meets or exceeds threshold
const isOverThreshold = computed(() => {
  return inflictionAmt.value >= resistance.value && resistance.value > 0
})

function setAmt() {
  // Validate and reset to 0 if empty or invalid
  if (inflictionAmt.value === null || inflictionAmt.value === undefined || isNaN(inflictionAmt.value)) {
    inflictionAmt.value = 0
  }
}

function increaseStatus() {
  inflictionAmt.value = utils.increaseValue(inflictionAmt.value)
}

function decreaseStatus() {
  inflictionAmt.value = utils.decreaseValue(inflictionAmt.value, 0)
}
</script>
<style scoped>
.status-container {
  display: flex;
  align-items: center;
  width: 100%;
  height: 2.85vh;
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  overflow: hidden;
  font-size: 0.73vw; /* ~14px at 1920px */
  transition: var(--transition-hover);
}

.status-container:hover {
  border-color: var(--color-accent-gold);
  box-shadow: var(--shadow-gold-soft);
}

/* Visual indicator when status buildup meets or exceeds threshold */
.status-container.status-over-threshold {
  border-color: var(--color-btn-danger-border);
  box-shadow: 0 0 6px rgba(220, 38, 38, 0.5);
  background: rgba(220, 38, 38, 0.15);
}

.status-container.status-over-threshold:hover {
  border-color: var(--color-btn-danger-border);
  box-shadow: 0 0 10px rgba(220, 38, 38, 0.7);
}

.status-buttons-wrapper {
  display: flex;
  border-right: 1px solid black;
}

.status-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-btn-primary-border);
  border: none;
  border-right: 1px solid black;
  color: #ffffff;
  width: 0.83vw; /* ~16px at 1920px - reduced by 20% from 1.04vw */
  height: 100%;
  cursor: pointer;
  font-weight: 600;
  transition: var(--transition-hover);
}

.status-button:last-child {
  border-right: none;
}

.status-button:hover {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

.status-content {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  margin-right: 4px;
}

.status-label {
  padding-left: 8px;
  padding-right: 16px;
  font-weight: 600;
}

.status-input-wrapper {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 1.85vh; /* ~20px at 1080p - matches container height */
  gap: 0.21vw; /* ~4px at 1920px - responsive */
}

.status-input {
  text-align: center;
  padding: 0 0.21vw; /* ~4px at 1920px - responsive */
  width: 2.5vw; /* ~48px at 1920px - increased from 2.08vw */
  color: var(--color-text-primary);
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  outline: none;
  font-size: 0.73vw; /* ~14px at 1920px - matches container */
  border-radius: var(--border-radius-sm);
  transition: var(--transition-hover);
}

.status-input:focus {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
}

.status-separator {
  margin-right: 4px;
  color: var(--color-text-primary);
}

.status-resistance {
  font-weight: bold;
  width: 0.63vw; /* ~12px at 1920px - responsive (was w-3) */
  text-align: right;
  color: var(--color-text-primary);
}

/* Hide number input spinners */
.status-input::-webkit-inner-spin-button,
.status-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.status-input {
  -moz-appearance: textfield;
}
</style>
