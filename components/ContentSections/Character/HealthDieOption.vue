<template>
  <div class="health-die-container flex justify-between items-center rounded-sm bg-white text-charcoal overflow-hidden">
    <div class="flex w-full justify-between items-center px-3 py-2">
      <span class="font-semibold">
        {{ name }}
      </span>

      <div class="flex items-center gap-2">
        <div class="flex items-center gap-0.5">
          <input
            v-model="diceCount"
            type="number"
            min="1"
            max="10"
            class="dice-input"
            @change="updateHealthDie"
          />
          <span class="dice-separator">d</span>
          <input
            v-model="diceSides"
            type="number"
            min="2"
            :max="20"
            class="dice-input"
            @change="updateHealthDie"
          />
        </div>

        <FieldComment
          :fieldKey="identifier"
          :fieldLabel="name"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from '@/store/player'
import FieldComment from '~/components/UI/FieldComment.vue'

const playerStore = usePlayerStore()

const props = defineProps({
  name: {
    type: String,
    default: 'Health Die'
  },
  identifier: {
    type: String,
    default: 'HealthDie'
  }
})

const diceCount = shallowRef(playerStore.HealthDie.count)
const diceSides = shallowRef(playerStore.HealthDie.sides)

function updateHealthDie() {
  // Validate and constrain values
  if (!diceCount.value || diceCount.value < 1) diceCount.value = 1
  if (diceCount.value > 10) diceCount.value = 10

  if (!diceSides.value || diceSides.value < 2) diceSides.value = 2
  if (diceSides.value > 20) diceSides.value = 20

  // Update store
  playerStore.HealthDie.count = diceCount.value
  playerStore.HealthDie.sides = diceSides.value
  playerStore.save()
}
</script>

<style scoped>
/* Container dark theme with custom width */
.health-die-container {
  width: 60%;
  background: var(--color-bg-tertiary) !important;
  border: var(--border-width-thin) solid var(--color-border-primary);
  color: var(--color-text-primary) !important;
  transition: var(--transition-hover);
}

.health-die-container:hover {
  border-color: var(--color-accent-gold);
  box-shadow: var(--shadow-gold-soft);
}

/* Dice input fields */
.dice-input {
  width: 2.5rem !important;
  min-width: 2.5rem !important;
  padding: 0.25rem 0.5rem;
  text-align: center;
  background: var(--color-bg-secondary) !important;
  color: var(--color-text-primary) !important;
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  transition: var(--transition-fast);
}

.dice-input:focus {
  outline: none;
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
}

.dice-separator {
  color: var(--color-accent-gold-bright);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-base);
}

/* Text contrast */
span {
  color: var(--color-text-primary) !important;
}
</style>
