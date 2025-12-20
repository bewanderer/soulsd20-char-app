<template>
  <div class="toggle-switch" :class="{ active: modelValue, 'no-label': !showLabel }" @click="toggle">
    <div class="toggle-orb"></div>
    <span v-if="showLabel" class="toggle-label">{{ modelValue ? 'Active' : 'Inactive' }}</span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  showLabel?: boolean
}>(), {
  showLabel: true
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function toggle() {
  emit('update:modelValue', !props.modelValue)
}
</script>

<style scoped>
.toggle-switch {
  position: relative;
  width: 4.43vw; /* ~85px at 1920px - responsive */
  height: 2.59vh; /* ~28px at 1080p - responsive, matches status height */
  background: rgba(85, 85, 85, 0.5);
  border-radius: 1.3vh; /* Responsive border-radius */
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: var(--transition-normal);
  display: flex;
  align-items: center;
  padding: 0 0.31vw; /* ~6px at 1920px - responsive */
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.toggle-switch.no-label {
  width: 2.6vw; /* ~50px at 1920px - responsive, increased slightly */
}

.toggle-switch.active {
  background: linear-gradient(135deg,
    var(--color-ap-gradient-start) 0%,
    var(--color-primary) 50%,
    var(--color-ap-gradient-end) 100%
  );
  border-color: #1a4c14;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 8px rgba(42, 108, 36, 0.3);
}

.toggle-orb {
  position: absolute;
  width: 1.85vh; /* ~20px at 1080p - responsive */
  height: 1.85vh; /* ~20px at 1080p - responsive */
  background: white;
  border-radius: 50%;
  left: 0.21vw; /* ~4px at 1920px - responsive */
  transition: var(--transition-normal);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.toggle-switch.active .toggle-orb {
  left: calc(100% - 1.85vh - 0.21vw); /* Orb size + padding - responsive */
}

.toggle-label {
  font-size: var(--toggle-font-size); /* Responsive: 0.625vw (~12px at 1920px) */
  color: white;
  margin-left: auto;
  font-weight: 600;
  text-transform: uppercase;
  opacity: 0.9;
}

.toggle-switch.active .toggle-label {
  margin-left: 0;
  margin-right: auto;
}
</style>
