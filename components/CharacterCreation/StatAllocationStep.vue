<template>
  <div class="stat-allocation-step">
    <h2 class="step-title">Allocate Your Stats</h2>
    <p class="step-description">
      As a Chaotic Tarnished, your fate is determined by chance. First, choose one stat to set to 15.
      Then assign each of your 6 rolls to specific stats.
    </p>

    <!-- Step 1: Select Stat for 15 -->
    <div class="bonus-stat" :class="{ disabled: hasSelectedFor15 }">
      <h3 class="section-title">Step 1: Choose One Stat to Set to 15</h3>
      <p class="note">This cannot be Endurance.</p>

      <div class="stat-select-grid">
        <button
          v-for="stat in selectableStatsFor15"
          :key="stat.key"
          @click="selectStatFor15(stat.key)"
          class="stat-select-btn"
          :class="{ selected: selectedStatFor15 === stat.key }"
          :disabled="hasSelectedFor15 && selectedStatFor15 !== stat.key"
        >
          {{ stat.label }}
        </button>
      </div>

      <div v-if="selectedStatFor15" class="selected-stat-display">
        Selected: <span class="highlight">{{ getStatLabel(selectedStatFor15) }}</span> = 15
      </div>
    </div>

    <!-- Step 2: Assign Rolls (only visible after selecting stat for 15) -->
    <div v-if="hasSelectedFor15" class="roll-assignment-section">
      <h3 class="section-title">Step 2: Assign Your Rolls to Stats</h3>
      <p class="note">
        Each roll must be assigned to exactly one stat. Each stat (except {{ getStatLabel(selectedStatFor15) }}) must receive exactly one roll.
        {{ getStatLabel(selectedStatFor15) }} already has 15 and will not receive a roll.
      </p>

      <!-- Roll Results Display -->
      <div class="rolls-display">
        <div class="roll-grid">
          <div
            v-for="(roll, index) in rolls"
            :key="index"
            class="roll-card"
            :class="{ assigned: rollAssignments[index] !== null }"
          >
            <div class="roll-header">
              <div class="roll-label">Roll {{ index + 1 }}</div>
              <div class="roll-value">{{ roll }}</div>
            </div>

            <div v-if="rollAssignments[index]" class="roll-assignment">
              Assigned to: <span class="assigned-stat">{{ getStatLabel(rollAssignments[index]!) }}</span>
            </div>

            <div class="roll-controls">
              <select
                v-model="rollAssignments[index]"
                @change="handleRollAssignment(index)"
                class="stat-dropdown"
              >
                <option :value="null">Assign to...</option>
                <option
                  v-for="stat in assignableStats"
                  :key="stat.key"
                  :value="stat.key"
                  :disabled="stat.key === selectedStatFor15 || isStatAlreadyAssigned(stat.key, index)"
                >
                  {{ stat.label }}{{ getStatAssignmentLabel(stat.key, index) }}
                </option>
              </select>

              <button
                v-if="rollAssignments[index]"
                @click="clearRollAssignment(index)"
                class="clear-btn"
                title="Clear this assignment"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Current Stat Summary -->
      <div class="stat-summary">
        <h4 class="summary-title">Current Stats</h4>
        <div class="summary-grid">
          <div
            v-for="stat in allStats"
            :key="stat.key"
            class="summary-row"
            :class="{
              highlight: stat.key === selectedStatFor15,
              hasRoll: getStatValue(stat.key) > 0 && stat.key !== selectedStatFor15
            }"
          >
            <span class="summary-stat-name">{{ stat.label }}:</span>
            <span class="summary-stat-value">{{ getStatValue(stat.key) }}</span>
            <span v-if="stat.key === selectedStatFor15" class="summary-note">(Set to 15)</span>
          </div>
        </div>
      </div>

      <!-- Reset All Button -->
      <div class="reset-all-section">
        <button @click="resetAllAssignments" class="reset-all-btn">
          Reset All Selections
        </button>
        <p class="reset-note">This will clear both your stat-15 choice and all roll assignments, but keep your dice rolls.</p>
      </div>
    </div>

    <!-- Validation Messages -->
    <div v-if="!isValid" class="validation-messages">
      <div v-if="!hasSelectedFor15" class="error-message">
        You must select one stat to set to 15 before assigning rolls.
      </div>
      <div v-if="hasSelectedFor15 && !allRollsAssigned" class="error-message">
        You must assign all {{ rolls.length }} rolls before proceeding.
        ({{ unassignedRollCount }} roll{{ unassignedRollCount !== 1 ? 's' : '' }} remaining)
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  modelValue: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

// All possible stats including Endurance
const allStats = [
  { key: 'vitality', label: 'VIT' },
  { key: 'endurance', label: 'END' },
  { key: 'strength', label: 'STR' },
  { key: 'dexterity', label: 'DEX' },
  { key: 'attunement', label: 'ATT' },
  { key: 'intelligence', label: 'INT' },
  { key: 'faith', label: 'FAI' }
] as const

// Stats that can be selected for 15 (all except Endurance)
const selectableStatsFor15 = allStats.filter(s => s.key !== 'endurance')

// Stats that can receive roll assignments (all 7)
const assignableStats = allStats

type StatKey = typeof allStats[number]['key']

// Component state
const rolls = ref<number[]>([])
const selectedStatFor15 = ref<StatKey | null>(null)
const rollAssignments = ref<(StatKey | null)[]>([null, null, null, null, null, null])

// Initialize or restore state
onMounted(() => {
  if (props.modelValue.statAllocation) {
    // Restore existing data
    rolls.value = props.modelValue.statAllocation.rolls
    selectedStatFor15.value = props.modelValue.statAllocation.selectedStatFor15
    rollAssignments.value = props.modelValue.statAllocation.rollAssignments || [null, null, null, null, null, null]
  } else {
    // Generate new rolls
    generateRolls()
  }
})

// Generate 6d2 rolls (6 times)
function generateRolls() {
  rolls.value = []
  for (let i = 0; i < 6; i++) {
    // Roll 6d2: sum of 6 dice rolls, each d2 (1-2)
    let rollSum = 0
    for (let j = 0; j < 6; j++) {
      rollSum += Math.floor(Math.random() * 2) + 1 // 1 or 2
    }
    rolls.value.push(rollSum)
  }
  updateModelValue()
}

// Computed values
const hasSelectedFor15 = computed(() => selectedStatFor15.value !== null)

const allRollsAssigned = computed(() => {
  return rollAssignments.value.every(assignment => assignment !== null)
})

const unassignedRollCount = computed(() => {
  return rollAssignments.value.filter(assignment => assignment === null).length
})

const isValid = computed(() => {
  return hasSelectedFor15.value && allRollsAssigned.value
})

// Check if a stat is already assigned to another roll
function isStatAlreadyAssigned(statKey: StatKey, currentRollIndex: number): boolean {
  return rollAssignments.value.some((assignment, index) => {
    return index !== currentRollIndex && assignment === statKey
  })
}

// Get label for stat in dropdown
function getStatAssignmentLabel(statKey: StatKey, currentRollIndex: number): string {
  if (statKey === selectedStatFor15.value) {
    return ' (Already 15)'
  }
  if (isStatAlreadyAssigned(statKey, currentRollIndex)) {
    return ' (Already assigned)'
  }
  return ''
}

// Get current value for a stat
function getStatValue(statKey: StatKey): number {
  // If this stat is selected for 15, return 15
  if (statKey === selectedStatFor15.value) {
    return 15
  }

  // Find the roll assigned to this stat (only one allowed)
  const rollIndex = rollAssignments.value.findIndex(assignment => assignment === statKey)
  if (rollIndex !== -1) {
    return rolls.value[rollIndex]
  }

  return 0
}

// Stat manipulation functions
function selectStatFor15(stat: StatKey) {
  if (!hasSelectedFor15.value) {
    selectedStatFor15.value = stat
    updateModelValue()
  }
}

function handleRollAssignment(rollIndex: number) {
  // Assignment handled by v-model, just update
  updateModelValue()
}

function clearRollAssignment(rollIndex: number) {
  rollAssignments.value[rollIndex] = null
  updateModelValue()
}

function resetAllAssignments() {
  if (confirm('Are you sure you want to reset all stat selections? This will clear both your stat-15 choice and all roll assignments, but keep your dice rolls.')) {
    selectedStatFor15.value = null
    rollAssignments.value = [null, null, null, null, null, null]
    updateModelValue()
  }
}

function getStatLabel(key: StatKey | null): string {
  if (!key) return ''
  return allStats.find(s => s.key === key)?.label || ''
}

function updateModelValue() {
  // Build final stat values
  const finalStats: Record<StatKey, number> = {
    vitality: 0,
    endurance: 0,
    strength: 0,
    dexterity: 0,
    attunement: 0,
    intelligence: 0,
    faith: 0
  }

  // Apply the stat selected for 15
  if (selectedStatFor15.value) {
    finalStats[selectedStatFor15.value] = 15
  }

  // Apply roll assignments (one roll per stat, one stat per roll)
  rollAssignments.value.forEach((assignment, index) => {
    if (assignment) {
      finalStats[assignment] = rolls.value[index]
    }
  })

  emit('update:modelValue', {
    ...props.modelValue,
    statAllocation: {
      rolls: rolls.value,
      selectedStatFor15: selectedStatFor15.value,
      rollAssignments: rollAssignments.value,
      finalStats: finalStats,
      isValid: isValid.value
    }
  })
}
</script>

<style scoped>
.stat-allocation-step {
  display: flex;
  flex-direction: column;
  gap: 25px;
  color: white;
}

.step-title {
  color: var(--color-gold-primary);
  font-size: 1.5em;
  margin-bottom: 10px;
}

.step-description {
  color: #ccc;
  font-size: 0.95em;
  line-height: 1.5;
}

.section-title {
  color: var(--color-gold-primary);
  font-size: 1.2em;
  margin-bottom: 12px;
}

.note {
  color: #aaa;
  font-size: 0.9em;
  font-style: italic;
  margin-bottom: 15px;
}

/* Bonus Stat Selection */
.bonus-stat {
  background: rgba(0, 100, 200, 0.1);
  border: 2px solid rgba(100, 150, 255, 0.5);
  border-radius: 6px;
  padding: 20px;
  transition: all 0.3s;
}

.bonus-stat.disabled {
  opacity: 0.6;
  border-color: rgba(100, 150, 255, 0.3);
}

.stat-select-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.stat-select-btn {
  padding: 15px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.1em;
  font-weight: bold;
}

.stat-select-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.stat-select-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.stat-select-btn.selected {
  background: rgba(100, 150, 255, 0.3);
  border-color: #6495ff;
  color: #6495ff;
}

.selected-stat-display {
  text-align: center;
  padding: 10px;
  background: rgba(100, 150, 255, 0.2);
  border-radius: 4px;
  font-size: 1.1em;
  color: white;
}

.highlight {
  color: var(--color-gold-primary);
  font-weight: bold;
}

/* Roll Assignment Section */
.roll-assignment-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.rolls-display {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-gold-rgba-medium);
  border-radius: 6px;
  padding: 20px;
}

.roll-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.roll-card {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 15px;
  transition: all 0.2s;
}

.roll-card.assigned {
  border-color: rgba(0, 255, 0, 0.4);
  background: rgba(0, 255, 0, 0.05);
}

.roll-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.roll-label {
  font-size: 0.9em;
  color: #aaa;
}

.roll-value {
  font-size: 1.8em;
  font-weight: bold;
  color: var(--color-gold-primary);
}

.roll-assignment {
  margin-bottom: 10px;
  padding: 8px;
  background: rgba(0, 255, 0, 0.1);
  border-radius: 4px;
  text-align: center;
  font-size: 0.95em;
  color: #ccc;
}

.assigned-stat {
  color: #4caf50;
  font-weight: bold;
}

.roll-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.stat-dropdown {
  flex: 1;
  padding: 8px;
  background: var(--color-bg-primary);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: white;
  font-size: 0.95em;
  cursor: pointer;
}

.stat-dropdown:focus {
  border-color: rgba(100, 150, 255, 0.5);
  outline: none;
}

.clear-btn {
  padding: 8px 12px;
  background: rgba(200, 0, 0, 0.3);
  border: 1px solid rgba(255, 100, 100, 0.5);
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9em;
  white-space: nowrap;
}

.clear-btn:hover {
  background: rgba(200, 0, 0, 0.5);
}

/* Stat Summary */
.stat-summary {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 20px;
}

.summary-title {
  color: var(--color-gold-primary);
  font-size: 1.1em;
  margin-bottom: 15px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.summary-row.highlight {
  background: rgba(100, 150, 255, 0.2);
  border-color: rgba(100, 150, 255, 0.5);
}

.summary-row.hasRoll {
  border-color: rgba(0, 255, 0, 0.3);
}

.summary-stat-name {
  font-weight: bold;
  color: var(--color-gold-primary);
  min-width: 40px;
}

.summary-stat-value {
  font-size: 1.2em;
  font-weight: bold;
  color: white;
  min-width: 30px;
}

.summary-note {
  color: #6495ff;
  font-size: 0.85em;
  font-style: italic;
}

/* Reset All Section */
.reset-all-section {
  text-align: center;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
}

.reset-all-btn {
  padding: 12px 24px;
  background: rgba(150, 0, 0, 0.5);
  border: 2px solid rgba(255, 100, 100, 0.5);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: all 0.2s;
  margin-bottom: 10px;
}

.reset-all-btn:hover {
  background: rgba(200, 0, 0, 0.7);
}

.reset-note {
  color: #aaa;
  font-size: 0.9em;
  margin: 0;
}

/* Validation Messages */
.validation-messages {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.error-message {
  padding: 12px;
  background: rgba(200, 0, 0, 0.2);
  border: 1px solid rgba(255, 100, 100, 0.5);
  border-radius: 4px;
  color: var(--color-red-bright);
  font-weight: bold;
}
</style>
