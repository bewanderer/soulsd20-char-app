<template>
  <div class="bloodline-step">
    <h2 class="step-title">Choose Your Bloodline (Optional)</h2>
    <p v-if="hasBloodlines" class="step-description">
      Bloodlines modify your lineage's base abilities. You can skip this step to keep the default lineage abilities.
    </p>
    <p v-else class="step-description">
      Your lineage has no bloodline variants. You may proceed to the next step.
    </p>

    <div v-if="!hasBloodlines" class="no-bloodlines">
      <div class="no-bloodlines-message">
        <p><strong>{{ selectedLineageName }}</strong> has no bloodline variants.</p>
        <p>Click "Next" to continue to the final step.</p>
      </div>
    </div>

    <div v-else class="bloodline-list">
      <!-- Skip Bloodline Option -->
      <div
        class="bloodline-card skip-option"
        :class="{ selected: selectedId === null }"
        @click="skipBloodline()"
      >
        <div class="bloodline-header">
          <h3 class="bloodline-name">No Bloodline (Default)</h3>
        </div>
        <div class="bloodline-description">
          Keep the default {{ selectedLineageName }} abilities without any bloodline modifications.
        </div>
      </div>
      <div
        v-for="bloodline in availableBloodlines"
        :key="bloodline.id"
        class="bloodline-card"
        :class="{
          selected: selectedId === bloodline.id,
          locked: bloodline.has_unlock_requirement
        }"
        @click="selectBloodline(bloodline.id)"
      >
        <div class="bloodline-header">
          <h3 class="bloodline-name">{{ bloodline.name }}</h3>
          <div v-if="bloodline.has_unlock_requirement" class="unlock-badge">🔒 Requires Unlock</div>
        </div>

        <div class="bloodline-description">
          {{ bloodline.description }}
        </div>

        <div v-if="bloodline.has_unlock_requirement" class="unlock-requirement">
          <strong>Unlock Requirement:</strong> {{ bloodline.unlock_requirement }}
        </div>

        <div v-if="getGrantedAbilities(bloodline).length > 0" class="grants-info">
          <strong>Grants:</strong> {{ getGrantedAbilities(bloodline).join(', ') }}
        </div>

        <div v-if="getRemovedAbilities(bloodline).length > 0" class="removes-info">
          <strong>Removes:</strong> {{ getRemovedAbilities(bloodline).join(', ') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCompendiumStore } from '~/store/compendium'
import { getRemovedAbilityNames, getGrantedAbilityNames } from '~/mixins/lineageAbilities'

const props = defineProps<{
  modelValue: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const compendiumStore = useCompendiumStore()
const selectedId = ref<number | null>(null)

const selectedLineage = computed(() => {
  return compendiumStore.getLineageById(props.modelValue.lineage_id)
})

const selectedLineageName = computed(() => selectedLineage.value?.name || 'Unknown')

const hasBloodlines = computed(() => {
  return selectedLineage.value?.bloodline_count > 0
})

const availableBloodlines = computed(() => {
  if (!props.modelValue.lineage_id) return []
  return compendiumStore.getBloodlinesForLineage(props.modelValue.lineage_id)
})

onMounted(() => {
  selectedId.value = props.modelValue.bloodline_id || null
})

// Reset bloodline selection if lineage changes
watch(() => props.modelValue.lineage_id, () => {
  selectedId.value = null
})

function getGrantedAbilities(bloodline: any): string[] {
  return getGrantedAbilityNames(bloodline)
}

function getRemovedAbilities(bloodline: any): string[] {
  return getRemovedAbilityNames(bloodline)
}

function selectBloodline(id: number) {
  selectedId.value = id
  emit('update:modelValue', {
    ...props.modelValue,
    bloodline_id: id
  })
}

function skipBloodline() {
  selectedId.value = null
  emit('update:modelValue', {
    ...props.modelValue,
    bloodline_id: null
  })
}
</script>

<style scoped>
.bloodline-step {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step-title {
  color: var(--color-gold-primary);
  font-size: 1.5em;
  margin-bottom: 10px;
}

.step-description {
  color: #ccc;
  font-size: 0.95em;
  margin-bottom: 20px;
}

.no-bloodlines {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.no-bloodlines-message {
  text-align: center;
  padding: 40px;
  background: rgba(100, 100, 100, 0.2);
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
}

.no-bloodlines-message p {
  color: #ccc;
  margin-bottom: 10px;
}

.no-bloodlines-message strong {
  color: var(--color-gold-primary);
}

.bloodline-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 350px;
  overflow-y: auto;
  padding: 10px;
}

.bloodline-card {
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.bloodline-card:hover {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(0, 0, 0, 0.7);
}

.bloodline-card.selected {
  border-color: var(--color-gold-primary);
  background: var(--color-gold-rgba-light);
}

.bloodline-card.locked {
  border-color: rgba(200, 100, 100, 0.4);
}

.bloodline-card.skip-option {
  border-color: rgba(100, 200, 255, 0.3);
  background: rgba(100, 150, 200, 0.1);
}

.bloodline-card.skip-option:hover {
  border-color: rgba(100, 200, 255, 0.5);
  background: rgba(100, 150, 200, 0.2);
}

.bloodline-card.skip-option.selected {
  border-color: #64b5f6;
  background: rgba(100, 181, 246, 0.2);
}

.bloodline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.bloodline-name {
  color: white;
  font-size: 1.1em;
  font-weight: bold;
}

.unlock-badge {
  background: var(--color-red-rgba-light);
  border: 1px solid var(--color-red-primary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75em;
  color: #ffffff;
}

.bloodline-description {
  color: #bbb;
  font-size: 0.9em;
  line-height: 1.4;
  margin-bottom: 12px;
}

.unlock-requirement {
  margin-top: 10px;
  padding: 8px;
  background: var(--color-red-rgba-light);
  border: 1px solid var(--color-red-primary);
  border-radius: 4px;
  font-size: 0.85em;
  color: #ffffff;
}

.unlock-requirement strong {
  color: #ffffff;
}

.grants-info {
  margin-top: 10px;
  padding: 8px;
  background: var(--color-green-rgba-light);
  border: 1px solid var(--color-green-primary);
  border-radius: 4px;
  font-size: 0.85em;
  color: #ffffff;
}

.grants-info strong {
  color: #ffffff;
}

.removes-info {
  margin-top: 10px;
  padding: 8px;
  background: var(--color-red-rgba-light);
  border: 1px solid var(--color-red-primary);
  border-radius: 4px;
  font-size: 0.85em;
  color: #ffffff;
}

.removes-info strong {
  color: #ffffff;
}
</style>
