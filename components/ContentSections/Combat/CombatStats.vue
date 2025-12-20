<template>
  <div class="panel-border combat-stats-panel">
    <h3 class="panel-title">Combat Stats</h3>

    <div class="stats-grid">
      <!-- Dodge Cost -->
      <div class="stat-card">
        <div class="stat-label">Dodge Cost</div>
        <div class="stat-value">{{ dodgeCost }} AP</div>
      </div>

      <!-- Dodge Distance -->
      <div class="stat-card">
        <div class="stat-label">Dodge Distance</div>
        <div class="stat-value">{{ dodgeDistance }} ft</div>
      </div>

      <!-- Total Dodges -->
      <div class="stat-card">
        <div class="stat-label">Total Dodges</div>
        <div class="stat-value">{{ totalDodges }}</div>
      </div>

      <!-- Item Usage Cost -->
      <div class="stat-card">
        <div class="stat-label">Item Usage Cost</div>
        <div class="stat-value">{{ itemUsageCost }} AP</div>
      </div>

      <!-- Jump Horizontal -->
      <div class="stat-card">
        <div class="stat-label">Jump (Horizontal)</div>
        <div class="stat-value">{{ jumpHorizontal }} ft</div>
      </div>

      <!-- Jump Vertical -->
      <div class="stat-card">
        <div class="stat-label">Jump (Vertical)</div>
        <div class="stat-value">{{ jumpVertical }} ft</div>
      </div>

      <!-- Running Jump Horizontal -->
      <div class="stat-card">
        <div class="stat-label">Running Jump (Horizontal)</div>
        <div class="stat-value">{{ runningJumpHorizontal }} ft</div>
      </div>

      <!-- Running Jump Vertical -->
      <div class="stat-card">
        <div class="stat-label">Running Jump (Vertical)</div>
        <div class="stat-value">{{ runningJumpVertical }} ft</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '@/store/player'
import { useCompendiumStore } from '@/store/compendium'

const playerStore = usePlayerStore()
const compendiumStore = useCompendiumStore()

// Dodge Cost - based on armor type and Strength
const dodgeCost = computed(() => {
  // Check for manual override first
  if (playerStore.DodgeCostOverride !== null) {
    return playerStore.DodgeCostOverride
  }

  const str = playerStore.CharacterStats.Stats.Strength
  const equippedArmor = playerStore.Equipment.Armor

  // No armor equipped
  if (!equippedArmor) {
    return 2
  }

  // Get armor type from compendium
  const armor = compendiumStore.Armors.find(a => a.id === equippedArmor.id)
  if (!armor) {
    return 2
  }

  const armorType = armor.armor_type

  // Apply formula based on armor type and strength
  if (armorType === 'LIGHT') {
    if (str <= 6) return 4
    if (str <= 9) return 3
    return 2
  } else if (armorType === 'MEDIUM') {
    if (str <= 9) return 4
    if (str <= 12) return 3
    return 2
  } else if (armorType === 'HEAVY') {
    if (str <= 12) return 4
    if (str <= 15) return 3
    return 2
  }

  return 2
})

// Dodge Distance - 10 ft (no armor) or 5 ft (with armor)
const dodgeDistance = computed(() => {
  // Check for manual override first
  if (playerStore.DodgeDistanceOverride !== null) {
    return playerStore.DodgeDistanceOverride
  }

  const equippedArmor = playerStore.Equipment.Armor
  return equippedArmor ? 5 : 10
})

// Item Usage Cost - based on Dexterity
const itemUsageCost = computed(() => {
  // Check for manual override first
  if (playerStore.ItemUsageCostOverride !== null) {
    return playerStore.ItemUsageCostOverride
  }

  const dex = playerStore.CharacterStats.Stats.Dexterity
  if (dex < 10) return 4
  if (dex < 18) return 3
  return 2
})

// Jump Horizontal - STR / 2
const jumpHorizontal = computed(() => {
  if (playerStore.JumpHorizontalOverride !== null) {
    return playerStore.JumpHorizontalOverride
  }
  return playerStore.CharacterStats.Stats.Strength / 2
})

// Jump Vertical - STR / 4
const jumpVertical = computed(() => {
  if (playerStore.JumpVerticalOverride !== null) {
    return playerStore.JumpVerticalOverride
  }
  return playerStore.CharacterStats.Stats.Strength / 4
})

// Running Jump Horizontal - STR
const runningJumpHorizontal = computed(() => {
  if (playerStore.RunningJumpHorizontalOverride !== null) {
    return playerStore.RunningJumpHorizontalOverride
  }
  return playerStore.CharacterStats.Stats.Strength
})

// Running Jump Vertical - STR / 2
const runningJumpVertical = computed(() => {
  if (playerStore.RunningJumpVerticalOverride !== null) {
    return playerStore.RunningJumpVerticalOverride
  }
  return playerStore.CharacterStats.Stats.Strength / 2
})

// Total Dodges
const totalDodges = computed(() => {
  return playerStore.UserInputValues.TotalDodges || 0
})
</script>

<style scoped>
.combat-stats-panel {
  height: 100%;
}

.panel-title {
  color: var(--color-accent-gold-bright);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-lg);
  border-bottom: var(--border-width-medium) solid var(--color-border-primary);
  padding-bottom: var(--spacing-sm);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

.stat-card {
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
}

.stat-label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-xs);
}

.stat-value {
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
