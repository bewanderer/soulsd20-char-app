<template>
  <div v-if="pending" class="step-container">
    <h3 class="step-title">Step 1: Increase Stats & HP</h3>

    <!-- HP Roll Display (Even Levels Only) -->
    <div v-if="pending.isEvenLevel" class="section hp-section">
      <h4 class="section-title">HP Gain</h4>
      <div class="hp-roll-display">
        <span class="roll-label">HP Roll:</span>
        <span class="roll-total">+{{ pending.hpRoll }}</span>
      </div>
    </div>

    <!-- Stat Selection -->
    <div class="section stat-section">
      <h4 class="section-title">Increase a Stat by 1</h4>
      <div class="stat-grid">
        <div
          v-for="stat in stats"
          :key="stat.key"
          :class="['stat-option', { selected: pending.selectedStat === stat.key }]"
          @click="selectStat(stat.key)"
        >
          <div class="stat-name">{{ stat.label }}</div>
          <div class="stat-values">
            <span class="old-value">{{ getCurrentStatValue(stat.key) }}</span>
            <span class="arrow">→</span>
            <span class="new-value">{{ getCurrentStatValue(stat.key) + 1 }}</span>
          </div>
        </div>
      </div>
      <button @click="resetStats" class="btn-danger">Reset Stat Choice</button>
    </div>

    <!-- Knowledge Selection (Odd Levels Only) -->
    <div v-if="!pending.isEvenLevel" class="section knowledge-section">
      <h4 class="section-title">Increase a Knowledge Skill by 1</h4>
      <div class="knowledge-grid">
        <div
          v-for="knowledge in knowledgeSkills"
          :key="knowledge.key"
          :class="['knowledge-option', { selected: pending.selectedKnowledge === knowledge.key }]"
          @click="selectKnowledge(knowledge.key)"
        >
          <div class="knowledge-name">{{ knowledge.label }}</div>
          <div class="knowledge-values">
            <span class="old-value">{{ getCurrentKnowledgeValue(knowledge.key) }}</span>
            <span class="arrow">→</span>
            <span class="new-value">{{ getCurrentKnowledgeValue(knowledge.key) + 1 }}</span>
          </div>
        </div>
      </div>
      <button @click="resetKnowledge" class="btn-danger">Reset Knowledge Choice</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from '@/store/player'

const playerStore = usePlayerStore()
const pending = computed(() => playerStore.PendingLevelUp)

const stats = [
  { key: 'Vitality', label: 'Vitality' },
  { key: 'Endurance', label: 'Endurance' },
  { key: 'Strength', label: 'Strength' },
  { key: 'Dexterity', label: 'Dexterity' },
  { key: 'Attunement', label: 'Attunement' },
  { key: 'Intelligence', label: 'Intelligence' },
  { key: 'Faith', label: 'Faith' }
]

const knowledgeSkills = [
  { key: 'Magics', label: 'Magics' },
  { key: 'WorldHistory', label: 'World History' },
  { key: 'Monsters', label: 'Monsters' },
  { key: 'Cosmic', label: 'Cosmic' }
]

function getCurrentStatValue(statKey: string): number {
  return (playerStore.CharacterStats.Stats as any)[statKey] || 10
}

function getCurrentKnowledgeValue(knowledgeKey: string): number {
  return (playerStore.CharacterStats.Knowledge as any)[knowledgeKey] || 0
}

function selectStat(statKey: string) {
  if (!pending.value) return

  const oldValue = getCurrentStatValue(statKey)
  const newValue = oldValue + 1

  playerStore.PendingLevelUp!.selectedStat = statKey
  playerStore.PendingLevelUp!.oldStatValue = oldValue
  playerStore.PendingLevelUp!.newStatValue = newValue

  playerStore.save()
}

function selectKnowledge(knowledgeKey: string) {
  if (!pending.value) return

  playerStore.PendingLevelUp!.selectedKnowledge = knowledgeKey
  playerStore.save()
}

function resetStats() {
  // Only reset stat choice, not knowledge
  if (!pending.value) return
  playerStore.PendingLevelUp!.selectedStat = null
  playerStore.PendingLevelUp!.oldStatValue = 0
  playerStore.PendingLevelUp!.newStatValue = 0
  playerStore.save()
}

function resetKnowledge() {
  if (!pending.value) return
  playerStore.PendingLevelUp!.selectedKnowledge = null
  playerStore.save()
}
</script>

<style scoped>
.step-container {
  display: flex;
  flex-direction: column;
  gap: var(--padding-lg);
}

.step-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-accent-gold-bright);
  margin-bottom: var(--padding-md);
}

.section {
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
  padding: var(--padding-md);
}

.section-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--padding-sm);
}

/* HP Section */
.hp-roll-display {
  display: flex;
  align-items: center;
  gap: var(--padding-sm);
  font-size: var(--font-size-lg);
  margin-bottom: var(--padding-sm);
}

.roll-label {
  color: var(--color-text-light);
}

.roll-value,
.roll-bonus {
  color: var(--color-accent-gold-bright);
  font-weight: var(--font-weight-bold);
}

.roll-separator {
  color: var(--color-text-secondary);
}

.roll-total {
  color: var(--color-success);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-xl);
}

.retroactive-hp,
.total-hp-gain {
  display: flex;
  gap: var(--padding-sm);
  padding: var(--padding-xs) 0;
}

.retro-label,
.total-label {
  color: var(--color-text-light);
}

.retro-value {
  color: var(--color-accent-gold);
  font-weight: var(--font-weight-semibold);
}

.total-value {
  color: var(--color-success);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
}

/* Stat Grid */
.stat-grid,
.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--padding-sm);
  margin-bottom: var(--padding-md);
}

.stat-option,
.knowledge-option {
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-sm);
  padding: var(--padding-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.stat-option:hover,
.knowledge-option:hover {
  border-color: var(--color-accent-gold);
  background: var(--color-bg-tertiary);
}

.stat-option.selected,
.knowledge-option.selected {
  border-color: var(--color-accent-gold-bright);
  background: var(--color-accent-gold);
  color: var(--color-bg-primary);
}

.stat-name,
.knowledge-name {
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--padding-xs);
  color: var(--color-text-light);
}

.stat-values,
.knowledge-values {
  display: flex;
  align-items: center;
  gap: var(--padding-xs);
  font-size: var(--font-size-sm);
}

.old-value {
  color: var(--color-text-secondary);
}

.arrow {
  color: var(--color-accent-gold);
}

.new-value {
  color: var(--color-success);
  font-weight: var(--font-weight-bold);
}

.stat-option.selected .stat-name,
.stat-option.selected .old-value,
.stat-option.selected .arrow,
.stat-option.selected .new-value,
.knowledge-option.selected .knowledge-name,
.knowledge-option.selected .old-value,
.knowledge-option.selected .arrow,
.knowledge-option.selected .new-value {
  color: var(--color-bg-primary);
}

/* Buttons - use global classes, no inline styles */
</style>
