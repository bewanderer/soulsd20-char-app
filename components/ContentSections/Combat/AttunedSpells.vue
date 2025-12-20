<template>
  <div class="panel-border attuned-spells-panel">
    <h3 class="panel-title">Attuned Spells</h3>

    <div v-if="attunedSpells.length > 0" class="spells-container">
      <div
        v-for="spell in attunedSpells"
        :key="spell.id"
        class="spell-card"
        @click="toggleSpellDescription(spell.id)"
      >
        <!-- Spell Header -->
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="text-base font-semibold text-yellow-500">
              {{ spell.name }}
            </div>
            <div class="text-sm text-gray-300 mt-1 space-y-1">
              <div class="flex gap-4">
                <span><span class="text-gray-400">AP:</span> {{ spell.cost_ap || spell.ap || 'N/A' }}</span>
                <span><span class="text-gray-400">FP:</span> {{ spell.cost_fp || spell.fp || 'N/A' }}</span>
              </div>

              <!-- Damage/Dice -->
              <div v-if="spell.dice && spell.dice.length > 0">
                <span class="text-gray-400">Damage:</span>
                {{ formatDice(spell.dice) }}
                <span v-if="getSpellScalingBonus(spell) > 0" class="scaling-positive">
                  + {{ getSpellScalingBonus(spell) }}
                </span>
              </div>

              <!-- Damage Type -->
              <div v-if="spell.dice && spell.dice.length > 0">
                <span class="text-gray-400">Damage Type:</span>
                {{ getDamageTypes(spell.dice) }}
              </div>

              <!-- Spell Scaling from Main Hand Weapon -->
              <div v-if="getMainHandScaling(spell).length > 0">
                <span class="text-gray-400">Spell Scaling (Main Hand):</span>
                <span v-for="(scaling, index) in getMainHandScaling(spell)" :key="index">
                  {{ scaling.stat }}: {{ scaling.grade }}
                  <span v-if="index < getMainHandScaling(spell).length - 1">, </span>
                </span>
                <span class="scaling-positive ml-2">
                  +{{ getMainHandScalingBonus(spell) }}
                </span>
              </div>

              <!-- Spell Scaling from Off Hand Weapon -->
              <div v-if="getOffHandScaling(spell).length > 0">
                <span class="text-gray-400">Spell Scaling (Off Hand):</span>
                <span v-for="(scaling, index) in getOffHandScaling(spell)" :key="index">
                  {{ scaling.stat }}: {{ scaling.grade }}
                  <span v-if="index < getOffHandScaling(spell).length - 1">, </span>
                </span>
                <span class="scaling-positive ml-2">
                  +{{ getOffHandScalingBonus(spell) }}
                </span>
              </div>

              <!-- Range -->
              <div v-if="spell.range">
                <span class="text-gray-400">Range:</span>
                {{ spell.range }}
              </div>
            </div>
          </div>

          <!-- Toggle Icon -->
          <div class="text-gray-400 ml-2">
            {{ expandedSpells.has(spell.id) ? '▼' : '▶' }}
          </div>
        </div>

        <!-- Spell Description (Toggled) -->
        <div
          v-if="expandedSpells.has(spell.id)"
          class="mt-3 pt-3 border-t border-gray-600 text-sm text-gray-300"
        >
          {{ spell.description || 'No description available.' }}
        </div>
      </div>
    </div>

    <div v-else class="text-gray-400 italic text-center py-4">
      No spells attuned
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlayerStore } from '@/store/player'
import { useCompendiumStore } from '@/store/compendium'
import {
  formatDice,
  getDamageTypes,
  calculateSpellScaling,
  getSpellScalingFromImplement
} from '@/mixins/combatUtils'

const playerStore = usePlayerStore()
const compendiumStore = useCompendiumStore()
const expandedSpells = ref<Set<number>>(new Set())

// Apply modifications to attuned spells
const attunedSpells = computed(() => {
  return (playerStore.AttunedSpells || []).map(spell => {
    const modifications = playerStore.SpellModifications[spell.id]
    if (!modifications) return spell
    // Merge modifications with original spell data
    return { ...spell, ...modifications }
  })
})

function toggleSpellDescription(spellId: number) {
  if (expandedSpells.value.has(spellId)) {
    expandedSpells.value.delete(spellId)
  } else {
    expandedSpells.value.add(spellId)
  }
}

// Get the equipped casting implement (weapon in main or off hand) - legacy function
function getCastingImplement() {
  // Check main hand first
  if (playerStore.Equipment.MainHand) {
    const mainHandWeapon = compendiumStore.Weapons.find(w => w.id === playerStore.Equipment.MainHand?.id)
    if (mainHandWeapon && mainHandWeapon.spell_scaling && mainHandWeapon.spell_scaling.length > 0) {
      return mainHandWeapon
    }
  }

  // Check off hand
  if (playerStore.Equipment.OffHand) {
    const offHandWeapon = compendiumStore.Weapons.find(w => w.id === playerStore.Equipment.OffHand?.id)
    if (offHandWeapon && offHandWeapon.spell_scaling && offHandWeapon.spell_scaling.length > 0) {
      return offHandWeapon
    }
  }

  return null
}

// Get effective weapon (with modifications applied)
function getEffectiveWeapon(weapon: any, hand: 'mainHand' | 'offHand') {
  if (!weapon) return null

  // Get modifications by weapon ID
  const mods = playerStore.WeaponModifications[weapon.id]

  if (!mods) return weapon

  // Return modified weapon with overrides
  return {
    ...weapon,
    spell_scaling: mods.spell_scaling && mods.spell_scaling.length > 0 ? mods.spell_scaling : weapon.spell_scaling
  }
}

// Get main hand weapon if it has spell scaling
function getMainHandWeapon() {
  if (!playerStore.Equipment.MainHand) return null
  const weapon = compendiumStore.Weapons.find(w => w.id === playerStore.Equipment.MainHand?.id)
  const effectiveWeapon = getEffectiveWeapon(weapon, 'mainHand')
  return (effectiveWeapon && effectiveWeapon.spell_scaling && effectiveWeapon.spell_scaling.length > 0) ? effectiveWeapon : null
}

// Get off hand weapon if it has spell scaling
function getOffHandWeapon() {
  if (!playerStore.Equipment.OffHand) return null
  const weapon = compendiumStore.Weapons.find(w => w.id === playerStore.Equipment.OffHand?.id)
  const effectiveWeapon = getEffectiveWeapon(weapon, 'offHand')
  return (effectiveWeapon && effectiveWeapon.spell_scaling && effectiveWeapon.spell_scaling.length > 0) ? effectiveWeapon : null
}

// Get spell scaling display for main hand
function getMainHandScaling(spell: any): any[] {
  const weapon = getMainHandWeapon()
  if (!weapon) return []
  return getSpellScalingFromImplement(spell, weapon)
}

// Get spell scaling display for off hand
function getOffHandScaling(spell: any): any[] {
  const weapon = getOffHandWeapon()
  if (!weapon) return []
  return getSpellScalingFromImplement(spell, weapon)
}

// Get spell scaling bonus from main hand
function getMainHandScalingBonus(spell: any): number {
  const weapon = getMainHandWeapon()
  if (!weapon) return 0
  return calculateSpellScaling(spell, weapon)
}

// Get spell scaling bonus from off hand
function getOffHandScalingBonus(spell: any): number {
  const weapon = getOffHandWeapon()
  if (!weapon) return 0
  return calculateSpellScaling(spell, weapon)
}

// Get spell scaling bonus from equipped implement (legacy - now uses first available)
function getSpellScalingBonus(spell: any): number {
  const mainHandBonus = getMainHandScalingBonus(spell)
  const offHandBonus = getOffHandScalingBonus(spell)
  // Return the maximum of the two
  return Math.max(mainHandBonus, offHandBonus)
}

// Get spell scaling display (stat: grade) - legacy function
function getSpellScalingDisplay(spell: any): any[] {
  const implement = getCastingImplement()
  if (!implement) return []
  return getSpellScalingFromImplement(spell, implement)
}
</script>

<style scoped>
.attuned-spells-panel {
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

.spells-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.spell-card {
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: var(--transition-hover);
}

.spell-card:hover {
  background: rgba(42, 42, 42, 0.8);
  border-color: var(--color-accent-gold-dim);
  box-shadow: var(--shadow-gold-soft);
}

.text-yellow-500 {
  color: var(--color-accent-gold-bright);
}

.text-gray-300 {
  color: var(--color-text-primary);
}

.text-gray-400 {
  color: var(--color-text-secondary);
}

.text-sm {
  font-size: var(--font-size-sm);
}

.text-base {
  font-size: var(--font-size-base);
}

.text-xs {
  font-size: var(--font-size-xs);
}

.font-semibold {
  font-weight: var(--font-weight-semibold);
}

.italic {
  font-style: italic;
}

.space-y-1 > * + * {
  margin-top: var(--spacing-xs);
}

.flex {
  display: flex;
}

.flex-1 {
  flex: 1;
}

.gap-4 {
  gap: var(--spacing-lg);
}

.items-start {
  align-items: flex-start;
}

.justify-between {
  justify-content: space-between;
}

.mt-1 {
  margin-top: var(--spacing-xs);
}

.mt-3 {
  margin-top: var(--spacing-md);
}

.ml-2 {
  margin-left: var(--spacing-sm);
}

.pt-3 {
  padding-top: var(--spacing-md);
}

.py-4 {
  padding-top: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
}

.border-t {
  border-top-width: var(--border-width-thin);
  border-top-style: solid;
}

.border-gray-600 {
  border-color: var(--color-border-primary);
}

.text-center {
  text-align: center;
}

.scaling-positive {
  color: #4ade80;
  font-weight: var(--font-weight-semibold);
}
</style>
