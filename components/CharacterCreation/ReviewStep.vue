<template>
  <div class="review-step">
    <h2 class="step-title">Review Your Character</h2>
    <p class="step-description">Check your selections before creating your character.</p>

    <div class="review-sections">
      <!-- Name Section -->
      <div class="review-section">
        <h3 class="section-title">Character Name</h3>
        <div class="section-content">
          <p class="character-name">{{ wizardData.name }}</p>
        </div>
      </div>

      <!-- Background Section -->
      <div class="review-section">
        <h3 class="section-title">Background</h3>
        <div v-if="selectedBackground" class="section-content">
          <p class="item-name">{{ selectedBackground.name }}</p>
          <div class="stats-grid">
            <div class="stat-item"><strong>HP:</strong> {{ finalHp }}</div>
            <div class="stat-item"><strong>VIT:</strong> {{ finalStats.vitality }}</div>
            <div class="stat-item"><strong>END:</strong> {{ finalStats.endurance }}</div>
            <div class="stat-item"><strong>STR:</strong> {{ finalStats.strength }}</div>
            <div class="stat-item"><strong>DEX:</strong> {{ finalStats.dexterity }}</div>
            <div class="stat-item"><strong>ATT:</strong> {{ finalStats.attunement }}</div>
            <div class="stat-item"><strong>INT:</strong> {{ finalStats.intelligence }}</div>
            <div class="stat-item"><strong>FAI:</strong> {{ finalStats.faith }}</div>
          </div>
          <div v-if="selectedBackground.has_special_rules" class="special-note">
            <strong>Special:</strong> {{ selectedBackground.special_rules }}
          </div>
        </div>
      </div>

      <!-- Lineage Section -->
      <div class="review-section">
        <h3 class="section-title">Lineage</h3>
        <div v-if="selectedLineage" class="section-content">
          <p class="item-name">{{ selectedLineage.name }}</p>
          <p class="item-subtitle">{{ selectedLineage.subtitle }}</p>
          <div class="lineage-info">
            <p><strong>Language:</strong> {{ selectedLineage.language }}</p>
            <p><strong>Lifespan:</strong> {{ selectedLineage.lifespan_min }}-{{ selectedLineage.lifespan_max }} years</p>
          </div>
        </div>
      </div>

      <!-- Bloodline Section -->
      <div class="review-section">
        <h3 class="section-title">Bloodline</h3>
        <div v-if="selectedBloodline" class="section-content">
          <p class="item-name">{{ selectedBloodline.name }}</p>
          <p class="item-description">{{ selectedBloodline.description }}</p>
        </div>
        <div v-else class="section-content">
          <p class="no-selection">No bloodline selected</p>
        </div>
      </div>
    </div>

    <div class="final-warning">
      <p><strong>⚠️ Important:</strong> After creation, your lineage and background choices will be locked.</p>
      <p>You can reset your character later if needed, but you cannot change these core choices during gameplay.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCompendiumStore } from '~/store/compendium'

const props = defineProps<{
  modelValue: any
}>()

const compendiumStore = useCompendiumStore()

const wizardData = computed(() => props.modelValue)

const selectedBackground = computed(() => {
  if (!wizardData.value.background_id) return null
  return compendiumStore.getBackgroundById(wizardData.value.background_id)
})

const selectedLineage = computed(() => {
  if (!wizardData.value.lineage_id) return null
  return compendiumStore.getLineageById(wizardData.value.lineage_id)
})

const selectedBloodline = computed(() => {
  if (!wizardData.value.bloodline_id) return null
  return compendiumStore.getBloodlineById(wizardData.value.bloodline_id)
})

// Calculate final stats (handles Chaotic Tarnished special case)
const finalStats = computed(() => {
  if (!selectedBackground.value) {
    return {
      vitality: 0,
      endurance: 0,
      strength: 0,
      dexterity: 0,
      attunement: 0,
      intelligence: 0,
      faith: 0
    }
  }

  // Check if Chaotic Tarnished with stat allocation
  if (selectedBackground.value.has_special_rules && wizardData.value.statAllocation?.finalStats) {
    return wizardData.value.statAllocation.finalStats
  }

  // Normal background stats
  return {
    vitality: selectedBackground.value.vitality,
    endurance: selectedBackground.value.endurance,
    strength: selectedBackground.value.strength,
    dexterity: selectedBackground.value.dexterity,
    attunement: selectedBackground.value.attunement,
    intelligence: selectedBackground.value.intelligence,
    faith: selectedBackground.value.faith
  }
})

// Calculate final HP (handles Chaotic Tarnished VIT * 2 rule)
const finalHp = computed(() => {
  if (!selectedBackground.value) return 0

  // Chaotic Tarnished: HP = VIT * 2
  if (selectedBackground.value.has_special_rules && wizardData.value.statAllocation?.finalStats) {
    return wizardData.value.statAllocation.finalStats.vitality * 2
  }

  // Normal background starting HP
  return selectedBackground.value.starting_hp
})
</script>

<style scoped>
.review-step {
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

.review-sections {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 320px;
  overflow-y: auto;
  padding: 10px;
}

.review-section {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 15px;
}

.section-title {
  color: var(--color-gold-primary);
  font-size: 1em;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--color-gold-rgba-medium);
  padding-bottom: 5px;
}

.section-content {
  color: white;
}

.character-name {
  font-size: 1.5em;
  font-weight: bold;
  color: white;
}

.item-name {
  font-size: 1.2em;
  font-weight: bold;
  color: white;
  margin-bottom: 5px;
}

.item-subtitle {
  font-size: 0.9em;
  color: var(--color-gold-primary);
  font-style: italic;
  margin-bottom: 10px;
}

.item-description {
  color: #ccc;
  font-size: 0.9em;
  line-height: 1.4;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 10px;
}

.stat-item {
  color: #ccc;
  font-size: 0.9em;
}

.stat-item strong {
  color: #888;
}

.lineage-info {
  margin-top: 10px;
}

.lineage-info p {
  color: #ccc;
  font-size: 0.9em;
  margin-bottom: 5px;
}

.lineage-info strong {
  color: #888;
}

.special-note {
  margin-top: 12px;
  padding: 10px;
  background: rgba(255, 100, 100, 0.1);
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 4px;
  font-size: 0.85em;
  color: #ffcccc;
}

.special-note strong {
  color: var(--color-red-bright);
}

.no-selection {
  color: #888;
  font-style: italic;
}

.final-warning {
  margin-top: 10px;
  padding: 15px;
  background: rgba(255, 150, 0, 0.1);
  border: 2px solid rgba(255, 150, 0, 0.5);
  border-radius: 6px;
}

.final-warning p {
  color: #ffcc99;
  font-size: 0.9em;
  margin-bottom: 8px;
}

.final-warning strong {
  color: #ff9944;
}
</style>
