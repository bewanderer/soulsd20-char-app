<template>
  <div class="background-step">
    <h2 class="step-title">Choose Your Background</h2>
    <p class="step-description">Your background determines starting HP and base stats.</p>

    <div class="background-grid">
      <div
        v-for="background in backgrounds"
        :key="background.id"
        class="background-card"
        :class="{ selected: selectedId === background.id }"
        @click="selectBackground(background.id)"
      >
        <div class="background-header">
          <h3 class="background-name">{{ background.name }}</h3>
          <div class="background-hp">HP: {{ background.has_special_rules ? '?' : background.starting_hp }}</div>
        </div>

        <div class="background-stats">
          <div class="stat-row">
            <span class="stat-label">VIT:</span> <span class="stat-value">{{ background.has_special_rules ? '?' : background.vitality }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">END:</span> <span class="stat-value">{{ background.has_special_rules ? '?' : background.endurance }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">STR:</span> <span class="stat-value">{{ background.has_special_rules ? '?' : background.strength }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">DEX:</span> <span class="stat-value">{{ background.has_special_rules ? '?' : background.dexterity }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">ATT:</span> <span class="stat-value">{{ background.has_special_rules ? '?' : background.attunement }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">INT:</span> <span class="stat-value">{{ background.has_special_rules ? '?' : background.intelligence }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">FAI:</span> <span class="stat-value">{{ background.has_special_rules ? '?' : background.faith }}</span>
          </div>
        </div>

        <div v-if="background.has_special_rules" class="special-rules">
          <strong>Special:</strong> {{ background.special_rules }}
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

const backgrounds = computed(() => compendiumStore.Backgrounds)

onMounted(() => {
  selectedId.value = props.modelValue.background_id || null
})

function selectBackground(id: number) {
  selectedId.value = id
  emit('update:modelValue', {
    ...props.modelValue,
    background_id: id
  })
}
</script>

<style scoped>
.background-step {
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

.background-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  max-height: 350px;
  overflow-y: auto;
  padding: 10px;
}

.background-card {
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.background-card:hover {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(0, 0, 0, 0.7);
}

.background-card.selected {
  border-color: var(--color-gold-primary);
  background: var(--color-gold-rgba-light);
}

.background-card.selected .stat-label {
  color: #888;
}

.background-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.background-name {
  color: white;
  font-size: 1.1em;
  font-weight: bold;
}

.background-hp {
  color: var(--color-red-bright);
  font-weight: bold;
}

.background-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  color: #ccc;
  font-size: 0.9em;
}

.stat-label {
  font-weight: bold;
  color: #888;
}

.stat-value {
  color: white;
}

.special-rules {
  margin-top: 10px;
  padding: 8px;
  background: rgba(255, 100, 100, 0.1);
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 4px;
  font-size: 0.85em;
  color: #ffcccc;
}

.special-rules strong {
  color: var(--color-red-bright);
}
</style>
