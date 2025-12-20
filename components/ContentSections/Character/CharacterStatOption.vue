<template>
  <div class="flex items-center w-full h-full rounded text-lg bg-white overflow-hidden">
    <div class="flex items-center border-r border-black">
      <div class="flex flex-col">
        <button class="stat-increase-btn" @click="increasePlayerStat">
          +
        </button>

        <button class="stat-decrease-btn" @click="decreasePlayerStat">
          -
        </button>
      </div>

      <span class="mx-3">
        {{ stat }}
      </span>
    </div>

    <div class="flex w-full h-full justify-between items-center">
      <div class="flex items-center">
        <img :src="'/img/icons/' + identifier + '.png'" class="text-black w-7 h-fit ml-2" />

        <span class="py-1 pl-3 pr-2 font-bold">
          {{ name }}
        </span>
      </div>

      <div class="flex justify-end items-center h-full gap-2 pr-2">
        <span class="text-sm mr-2">
          Mod:
        </span>

        <div class="stat-mod-display">
          {{ mod }}
        </div>

        <FieldComment
          :fieldKey="`${sType}_${identifier}`.toLowerCase()"
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
    Type: String,
    default: ''
  },
  identifier: {
    Type: String,
    default: ''
  },
  sType: {
    Type: String,
    default: ''
  },
  statAmount: {
    Type: Number,
    default: 0
  }
})

const stat = ref(props.statAmount)

// Keep local stat in sync with store
watch(() => props.statAmount, (newValue) => {
  stat.value = newValue
})

const mod = computed(() => {
  if (props.sType === 'stat') {
    return utils.statMod(stat.value)
  } else if (props.sType === 'skill') {
    return props.statAmount + utils.skillModBonusFromStats(props.identifier)
  }

  return stat.value
})

function increasePlayerStat() {
  updatePlayerStat(1)
}

function decreasePlayerStat() {
  updatePlayerStat(-1)
}

function updatePlayerStat(amount: number) {
  stat.value += amount
  if (props.sType === 'skill') (playerStore.CharacterStats.Skills as any)[props.identifier] = stat.value
  else if (props.sType === 'stat') (playerStore.CharacterStats.Stats as any)[props.identifier] = stat.value
  else if (props.sType === 'knowledge') (playerStore.CharacterStats.Knowledge as any)[props.identifier] = stat.value

  playerStore.save()
}
</script>

<style scoped>
/* Task 11: Stat Display Component - SoulsBorne Styling */

/* Main container with dark tertiary background */
.flex.items-center.w-full.h-full.rounded.text-lg.bg-white.overflow-hidden {
  background: var(--color-bg-tertiary) !important;
  border: var(--border-width-thin) solid var(--color-border-primary);
  transition: var(--transition-hover);
}

.flex.items-center.w-full.h-full.rounded.text-lg.bg-white.overflow-hidden:hover {
  border-color: var(--color-accent-gold);
  box-shadow: var(--shadow-gold-soft);
}

/* +/- buttons with golden theme */
.stat-increase-btn,
.stat-decrease-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  background: var(--color-btn-primary-border);
  color: #ffffff;
  font-weight: var(--font-weight-bold);
  border: none;
  border-radius: 0;
  transition: var(--transition-hover);
  cursor: pointer;
}

.stat-increase-btn {
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
}

.stat-increase-btn:hover,
.stat-decrease-btn:hover {
  background: var(--color-btn-primary-border);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

.stat-increase-btn:active,
.stat-decrease-btn:active {
  background: var(--color-accent-gold-bright);
  color: #ffffff;
}

/* Stat value display (center number) */
.flex.items-center.border-r.border-black span.mx-3 {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-xl);
}

/* Border between buttons and content */
.flex.items-center.border-r.border-black {
  border-right-color: var(--color-border-primary) !important;
}

/* Icon styling - white icons */
img[src*='/img/icons/'] {
  filter: brightness(0) invert(1);
  transition: filter var(--transition-fast);
}

.flex.items-center.w-full.h-full.rounded.text-lg.bg-white.overflow-hidden:hover img[src*='/img/icons/'] {
  filter: brightness(0) invert(1) drop-shadow(0 0 4px rgba(255, 255, 255, 0.5));
}

/* Stat name label */
.flex.items-center span.py-1.pl-3.pr-2.font-bold {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

/* Mod label text */
.flex.justify-end.items-center.h-full.gap-2 span.text-sm.mr-2 {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

/* Modifier value display (right side) */
.stat-mod-display {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 1.75rem;
  height: 100%;
  background: var(--color-bg-secondary);
  color: var(--color-accent-gold-bright);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-sm);
  font-weight: var(--font-weight-bold);
}
</style>