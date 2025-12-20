<template>
  <div class="flex items-center w-full rounded-sm text-lg font-bold bg-white overflow-hidden">
    <div class="flex items-center border-black">
      <span class="text-center w-8" :title="feat.cost + ' fate point(s)'">
        {{ feat.cost }}
      </span>
    </div>

    <div class="flex w-full justify-between items-center mr-3 border-l">
      <span class="py-1 pl-3 pr-2">
        {{ feat.name }}
      </span>

      <button class="font-bold text-lg" @click="showFeat">
        >
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  feat: {
    type: Object,
    default: {}
  }
})

const emit = defineEmits(['expand'])

function showFeat() {
  emit('expand')
}
</script>

<style scoped>
.flex.items-center.w-full.rounded-sm.bg-white {
  background: var(--color-bg-tertiary) !important;
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
  color: var(--color-text-primary);
  transition: var(--transition-hover);
  overflow: hidden;
}

.flex.items-center.w-full.rounded-sm.bg-white:hover {
  background: rgba(42, 42, 42, 0.8) !important;
  border-color: var(--color-accent-gold-dim);
  box-shadow: var(--shadow-gold-soft);
}

.flex.items-center.w-full.rounded-sm.bg-white .text-center {
  background: var(--color-btn-primary-bg-hover);
  color: var(--color-accent-gold-bright);
  font-weight: var(--font-weight-bold);
  padding: var(--spacing-sm);
  border-right: var(--border-width-thin) solid var(--color-border-primary);
}

.flex.items-center.w-full.rounded-sm.bg-white span {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.flex.items-center.w-full.rounded-sm.bg-white button {
  color: var(--color-accent-gold-bright);
  font-weight: var(--font-weight-bold);
  transition: var(--transition-hover);
}

.flex.items-center.w-full.rounded-sm.bg-white button:hover {
  color: var(--color-accent-gold);
}

.flex.items-center.w-full.rounded-sm.bg-white .border-l {
  border-left: var(--border-width-thin) solid var(--color-border-primary);
}
</style>