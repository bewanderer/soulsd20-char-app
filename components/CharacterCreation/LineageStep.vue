<template>
  <div class="lineage-step">
    <h2 class="step-title">Choose Your Lineage</h2>
    <p class="step-description">Lineages provide unique abilities and characteristics.</p>

    <div class="lineage-list">
      <div
        v-for="lineage in lineages"
        :key="lineage.id"
        class="lineage-card"
        :class="{ selected: selectedId === lineage.id }"
        @click="selectLineage(lineage.id)"
      >
        <div class="lineage-header">
          <h3 class="lineage-name">{{ lineage.name }}</h3>
          <div class="lineage-subtitle">{{ lineage.subtitle }}</div>
        </div>

        <div class="lineage-info">
          <div class="info-row">
            <span class="info-label">Language:</span> {{ lineage.language }}
          </div>
          <div class="info-row">
            <span class="info-label">Lifespan:</span> {{ lineage.lifespan_min }}-{{ lineage.lifespan_max }} years
          </div>
          <div class="info-row">
            <span class="info-label">Bloodlines:</span> {{ lineage.bloodline_count }}
          </div>
        </div>

        <div class="lineage-description">
          {{ lineage.description.substring(0, 150) }}{{ lineage.description.length > 150 ? '...' : '' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCompendiumStore } from '~/store/compendium'

const props = defineProps<{
  modelValue: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const compendiumStore = useCompendiumStore()
const selectedId = ref<number | null>(null)

const lineages = computed(() => compendiumStore.Lineages)

onMounted(() => {
  selectedId.value = props.modelValue.lineage_id || null
})

function selectLineage(id: number) {
  selectedId.value = id
  emit('update:modelValue', {
    ...props.modelValue,
    lineage_id: id
  })
}
</script>

<style scoped>
.lineage-step {
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

.lineage-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 350px;
  overflow-y: auto;
  padding: 10px;
}

.lineage-card {
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.lineage-card:hover {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(0, 0, 0, 0.7);
}

.lineage-card.selected {
  border-color: var(--color-gold-primary);
  background: var(--color-gold-rgba-light);
}

.lineage-card.selected .lineage-subtitle {
  color: var(--color-gold-primary);
}

.lineage-header {
  margin-bottom: 12px;
}

.lineage-name {
  color: white;
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 4px;
}

.lineage-subtitle {
  color: var(--color-gold-primary);
  font-size: 0.9em;
  font-style: italic;
}

.lineage-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.info-row {
  color: #ccc;
  font-size: 0.85em;
}

.info-label {
  font-weight: bold;
  color: #888;
}

.lineage-description {
  color: #bbb;
  font-size: 0.9em;
  line-height: 1.4;
}
</style>
