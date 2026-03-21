<template>
  <div v-if="pending" class="step-container">
    <h3 class="step-title">Step 2: Allocate Proficiency Points</h3>

    <!-- Points Summary -->
    <div class="points-summary">
      <div v-if="pending.tertiaryToSpend > 0" class="point-type-summary tertiary">
        <span class="point-type-label">Tertiary Points:</span>
        <span class="point-type-value">{{ pending.tertiarySpent }}/{{ pending.tertiaryToSpend }}</span>
      </div>
      <div v-if="pending.secondaryToSpend > 0" class="point-type-summary secondary">
        <span class="point-type-label">Secondary Points:</span>
        <span class="point-type-value">{{ pending.secondarySpent }}/{{ pending.secondaryToSpend }}</span>
      </div>
      <div class="point-type-summary primary">
        <span class="point-type-label">Primary Points:</span>
        <span class="point-type-value">{{ pending.primarySpent }}/{{ pending.primaryToSpend }}</span>
      </div>
    </div>

    <!-- Current Phase Indicator -->
    <div class="current-phase">
      <span v-if="currentPhase === 'tertiary'" class="phase-label tertiary-phase">
        Spending Tertiary Points
      </span>
      <span v-else-if="currentPhase === 'secondary'" class="phase-label secondary-phase">
        Spending Secondary Points
      </span>
      <span v-else-if="currentPhase === 'primary'" class="phase-label primary-phase">
        Spending Primary Points
      </span>
      <span v-else class="phase-label phase-complete">
        All points allocated!
      </span>
    </div>

    <!-- Tree List -->
    <div class="tree-list">
      <div
        v-for="tree in weaponTrees"
        :key="tree.id"
        :class="['tree-item', { disabled: !canSpendOnTree(tree.id) }]"
      >
        <div class="tree-info">
          <span class="tree-name">{{ tree.name }}</span>
          <span class="tree-points">
            {{ getCurrentTreePoints(tree.id) }}/{{ tree.max }}
          </span>
        </div>
        <button
          @click="addPointToTree(tree.id)"
          :disabled="!canSpendOnTree(tree.id)"
          class="btn-add-point"
        >
          +1
        </button>
      </div>
    </div>

    <!-- Reset Button -->
    <button @click="resetProficiency" class="btn-danger">Reset All Proficiency Choices</button>
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from '@/store/player'

const playerStore = usePlayerStore()
const pending = computed(() => playerStore.PendingLevelUp)

const weaponTrees = [
  { id: 'FIST', name: 'Fist', max: 25 },
  { id: 'DAGGER', name: 'Dagger', max: 25 },
  { id: 'STRAIGHT_THRUST', name: 'Straight Sword / Thrusting Sword', max: 25 },
  { id: 'KATANA_CURVED', name: 'Katana / Curved Sword', max: 25 },
  { id: 'ULTRA_GREAT_SWORD', name: 'Greatsword / Ultra Greatsword', max: 25 },
  { id: 'GREAT_AXE', name: 'Axe / Greataxe', max: 25 },
  { id: 'GREAT_HAMMER', name: 'Hammer / Greathammer', max: 25 },
  { id: 'TWINBLADE', name: 'Twinblade', max: 25 },
  { id: 'SPEAR', name: 'Spear', max: 25 },
  { id: 'HALBERD', name: 'Halberd', max: 25 },
  { id: 'REAPER', name: 'Reaper', max: 25 },
  { id: 'WHIP', name: 'Whip', max: 25 },
  { id: 'CROSS_BOW', name: 'Bow / Crossbow', max: 25 },
  { id: 'GREAT_BOW_BALLISTA', name: 'Greatbow / Ballista', max: 25 },
  { id: 'GUN', name: 'Gun Sidearm', max: 10 },
  { id: 'SHIELD', name: 'Shield / Greatshield', max: 10 },
  { id: 'SORCERY', name: 'Sorcery', max: 25 },
  { id: 'MIRACLE', name: 'Miracles', max: 25 },
  { id: 'PYROMANCY', name: 'Pyromancy', max: 25 },
  { id: 'HEX', name: 'Hexes', max: 25 },
  { id: 'SPIRIT_SUMMONING', name: 'Spirit Summoning', max: 25 },
  { id: 'DUAL_WIELDING', name: 'Dual Wielding', max: 20 },
  { id: 'MUSICAL_INSTRUMENTS', name: 'Musical Instruments', max: 20 }
]

const currentPhase = computed(() => {
  if (!pending.value) return null

  if (pending.value.primarySpent < pending.value.primaryToSpend) return 'primary'
  if (pending.value.secondarySpent < pending.value.secondaryToSpend) return 'secondary'
  if (pending.value.tertiarySpent < pending.value.tertiaryToSpend) return 'tertiary'
  return 'complete'
})

function getCurrentTreePoints(treeId: string): number {
  const base = playerStore.WeaponProficiencies[treeId] || 0
  const temp = pending.value?.tempTreeAllocations[treeId] || 0
  return base + temp
}

function canSpendOnTree(treeId: string): boolean {
  if (!pending.value) return false

  const currentPoints = getCurrentTreePoints(treeId)
  const treeMax = weaponTrees.find(t => t.id === treeId)?.max || 25

  // Check if tree is at max
  if (currentPoints >= treeMax) return false

  const phase = currentPhase.value

  if (phase === 'tertiary') {
    // Tertiary: must be <= 2 highest trees
    return canUseTertiary(treeId)
  } else if (phase === 'secondary') {
    // Secondary: must be <= highest tree
    return canUseSecondary(treeId)
  } else if (phase === 'primary') {
    // Primary: can be used on any tree
    return true
  }

  return false
}

function canUseTertiary(treeId: string): boolean {
  // Get all current tree points (base + temp)
  const allTreePoints = weaponTrees.map(tree => ({
    id: tree.id,
    points: getCurrentTreePoints(tree.id)
  })).sort((a, b) => b.points - a.points)

  const secondHighest = allTreePoints[1]?.points || 0
  const targetCurrent = getCurrentTreePoints(treeId)

  // Can spend if this tree is at or below the second highest
  // AND at least 2 other trees are >= this tree's current points
  const othersAtOrAbove = allTreePoints.filter(
    t => t.id !== treeId && t.points >= targetCurrent
  ).length

  return targetCurrent <= secondHighest && othersAtOrAbove >= 2
}

function canUseSecondary(treeId: string): boolean {
  // Get all current tree points (base + temp)
  const allTreePoints = weaponTrees.map(tree => ({
    id: tree.id,
    points: getCurrentTreePoints(tree.id)
  })).sort((a, b) => b.points - a.points)

  const highest = allTreePoints[0]?.points || 0
  const targetCurrent = getCurrentTreePoints(treeId)

  // Can spend if this tree is at or below the highest
  // AND at least 1 other tree is >= this tree's current points
  const othersAtOrAbove = allTreePoints.filter(
    t => t.id !== treeId && t.points >= targetCurrent
  ).length

  return targetCurrent <= highest && othersAtOrAbove >= 1
}

function addPointToTree(treeId: string) {
  if (!pending.value || !canSpendOnTree(treeId)) return

  // Add to temp allocations
  if (!pending.value.tempTreeAllocations[treeId]) {
    pending.value.tempTreeAllocations[treeId] = 0
  }
  pending.value.tempTreeAllocations[treeId]++

  // Increment spent counter
  if (currentPhase.value === 'tertiary') {
    pending.value.tertiarySpent++
  } else if (currentPhase.value === 'secondary') {
    pending.value.secondarySpent++
  } else if (currentPhase.value === 'primary') {
    pending.value.primarySpent++
  }

  playerStore.save()
}

function resetProficiency() {
  playerStore.resetLevelUpStep2()
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

/* Match Step 1 section styling */
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

/* Points Summary */
.points-summary {
  display: flex;
  gap: var(--padding-md);
  justify-content: center;
  flex-wrap: wrap;
}

.point-type-summary {
  padding: var(--padding-sm) var(--padding-md);
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-sm);
  display: flex;
  gap: var(--padding-sm);
  align-items: center;
  transition: var(--transition-fast);
}

.point-type-summary.tertiary {
  border-color: var(--color-warning);
}

.point-type-summary.secondary {
  border-color: var(--color-text-secondary);
}

.point-type-summary.primary {
  border-color: var(--color-accent-gold);
}

.point-type-label {
  color: var(--color-text-light);
  font-weight: var(--font-weight-semibold);
}

.point-type-value {
  color: var(--color-accent-gold-bright);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
}

/* Current Phase */
.current-phase {
  padding: var(--padding-md);
  text-align: center;
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-sm);
}

.phase-label {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
}

.tertiary-phase {
  color: var(--color-text-light);
}

.secondary-phase {
  color: var(--color-text-light);
}

.primary-phase {
  color: var(--color-accent-gold-bright);
}

.phase-complete {
  color: var(--color-success);
}

/* Tree List - match grid styling from Step 1 */
.tree-list {
  display: flex;
  flex-direction: column;
  gap: var(--padding-sm);
  max-height: 400px;
  overflow-y: auto;
}

.tree-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--padding-sm);
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.tree-item:hover:not(.disabled) {
  border-color: var(--color-accent-gold);
  background: var(--color-bg-tertiary);
}

.tree-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tree-info {
  display: flex;
  gap: var(--padding-md);
  align-items: center;
  flex: 1;
}

.tree-name {
  color: var(--color-text-light);
  font-weight: var(--font-weight-semibold);
}

.tree-points {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

/* Add Point Button */
.btn-add-point {
  padding: var(--padding-xs) var(--padding-md);
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  color: #ffffff;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-weight: var(--font-weight-bold);
  transition: var(--transition-hover);
}

.btn-add-point:hover:not(:disabled) {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

.btn-add-point:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Reset Button - use global btn-danger class */
</style>
