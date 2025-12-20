<template>
  <div class="combat-page-container">
    <div class="combat-page-content">
      <h2>Combat</h2>

      <!-- 2x3 Grid Layout -->
      <div class="grid grid-cols-2 gap-6">
        <!-- Row 1 Left: Equipped Weapons -->
        <EquippedWeapons />

        <!-- Row 1 Right: Combat Stats -->
        <CombatStats />

        <!-- Row 2 Left: Attuned Spells/Spirits with Toggle -->
        <div class="panel-border attuned-toggle-panel">
          <div class="flex items-center justify-between mb-4">
            <div class="toggle-container">
              <button
                class="toggle-button"
                :class="{ 'toggle-active': attunementTab === 'spells' }"
                @click="attunementTab = 'spells'"
              >
                Attuned Spells
              </button>
              <button
                class="toggle-button"
                :class="{ 'toggle-active': attunementTab === 'spirits' }"
                @click="attunementTab = 'spirits'"
              >
                Attuned Spirits
              </button>
            </div>
          </div>

          <AttunedSpells v-if="attunementTab === 'spells'" />
          <AttunedSpirits v-else />
        </div>

        <!-- Row 2 Right: Attuned Weapon Skills -->
        <AttunedWeaponSkills />

        <!-- Row 3 Spanning Both Columns: Companion -->
        <div class="col-span-2">
          <CompanionCard />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CombatStats from './CombatStats.vue'
import CompanionCard from './CompanionCard.vue'
import EquippedWeapons from './EquippedWeapons.vue'
import AttunedSpells from './AttunedSpells.vue'
import AttunedSpirits from './AttunedSpirits.vue'
import AttunedWeaponSkills from './AttunedWeaponSkills.vue'

const attunementTab = ref<'spells' | 'spirits'>('spells')
</script>

<style scoped>
.combat-page-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background: var(--color-bg-primary);
}

.combat-page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

h2 {
  color: var(--color-accent-gold-bright);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-xl);
  letter-spacing: 0.05em;
}

.grid {
  display: grid;
  gap: var(--spacing-xl);
}

.col-span-2 {
  grid-column: span 2;
}

@media (max-width: 1024px) {
  .grid-cols-2 {
    grid-template-columns: 1fr;
  }

  .col-span-2 {
    grid-column: span 1;
  }
}

.toggle-container {
  display: flex;
  gap: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-secondary);
  padding: var(--spacing-xs);
}

.toggle-button {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.toggle-button:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.toggle-active {
  background: var(--color-accent-gold);
  color: var(--color-bg-primary);
}

.toggle-active:hover {
  background: var(--color-accent-gold-bright);
  color: var(--color-bg-primary);
}

.attuned-toggle-panel {
  padding: var(--spacing-lg);
}
</style>
