<template>
  <div class="flex items-center w-full rounded-sm text-lg font-bold bg-white overflow-hidden h-[60px]" :class="{ 'has-points': proficiencyAmount > 0 }">
    <div class="flex items-center border-r border-black h-full">
      <div class="flex flex-col h-full">
        <button class="proficiency-increment-btn border-b text-sm w-5 h-1/2" @click="increaseWeaponProficiency(identifier)">
          +
        </button>

        <button class="proficiency-increment-btn text-sm w-5 h-1/2"  @click="decreaseWeaponProficiency(identifier)">
          -
        </button>
      </div>

      <span class="mx-3">
        {{ proficiencyAmount }}
      </span>
    </div>

    <div class="flex w-full justify-between items-center mr-3">
      <span class="py-1 pl-3 pr-2 leading-5">
        {{ name }}
      </span>

      <button class="flex items-center justify-center font-bold text-lg" @click="showFeats">
        <UIcon name="i-heroicons-chevron-right" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from "~~/store/player"

const props = defineProps({
  name: {
    type: String,
    default: ''
  },
  identifier: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['expand'])

const store = usePlayerStore()

const proficiencyAmount = computed(()=>{
  return (store.WeaponProficiencies as any)[props.identifier] || 0
})

function increaseWeaponProficiency(wepaonType: string) {
  (store.WeaponProficiencies as any)[wepaonType] += 1
}

function decreaseWeaponProficiency(wepaonType: string) {
  if ((store.WeaponProficiencies as any)[wepaonType] > 0) {
    (store.WeaponProficiencies as any)[wepaonType] -= 1
  }
}

function showFeats() {
  emit('expand', props.identifier)
}
</script>

<style scoped>
/* Empty/uninvested tree - transparent with grayish outline */
.flex.items-center.w-full.rounded-sm.bg-white {
  background: transparent !important;
  border: var(--border-width-thin) solid var(--color-border-secondary);
  border-radius: var(--border-radius-md);
  color: var(--color-text-secondary);
  transition: var(--transition-hover);
  overflow: hidden;
}

.flex.items-center.w-full.rounded-sm.bg-white:hover {
  background: rgba(42, 42, 42, 0.3) !important;
  border-color: var(--color-border-primary);
}

/* Invested tree - golden background and border */
.flex.items-center.w-full.rounded-sm.bg-white.has-points {
  background: var(--color-btn-primary-bg) !important;
  border-color: var(--color-accent-gold);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-gold-inset);
}

.flex.items-center.w-full.rounded-sm.bg-white.has-points:hover {
  background: var(--color-btn-primary-bg-hover) !important;
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
}

/* Proficiency level display */
.flex.items-center.border-r.border-black {
  border-right: var(--border-width-thin) solid var(--color-border-primary) !important;
}

.flex.items-center.w-full.rounded-sm.bg-white span.mx-3 {
  color: var(--color-accent-gold-bright);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
}

/* +/- buttons */
.proficiency-increment-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-btn-primary-border);
  color: #ffffff;
  font-weight: var(--font-weight-bold);
  transition: var(--transition-hover);
  cursor: pointer;
  border: none;
}

.proficiency-increment-btn:hover {
  background: var(--color-btn-primary-border);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

/* Proficiency name */
.flex.items-center.w-full.rounded-sm.bg-white .leading-5 {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

/* Chevron button */
.flex.items-center.w-full.rounded-sm.bg-white button:last-child {
  color: var(--color-accent-gold-bright);
  transition: var(--transition-hover);
}

.flex.items-center.w-full.rounded-sm.bg-white button:last-child:hover {
  color: var(--color-accent-gold);
}
</style>