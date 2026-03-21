<template>
  <div class="panel-border attuned-spirits-panel">
    <h3 class="panel-title">Attuned Spirits</h3>

    <div v-if="attunedSpirits.length > 0" class="spirits-container">
      <div
        v-for="spirit in attunedSpirits"
        :key="spirit.id"
        class="spirit-card"
        @click="toggleSpiritDescription(spirit.id)"
      >
        <!-- Spirit Header -->
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="text-base font-semibold text-yellow-500">
              {{ spirit.name }}
            </div>
            <div class="text-sm text-gray-300 mt-1 space-y-1">
              <div class="flex gap-4">
                <span><span class="text-gray-400">AP:</span> {{ spirit.ap || 'N/A' }}</span>
                <span><span class="text-gray-400">FP:</span> {{ spirit.fp || 'N/A' }}</span>
              </div>

              <!-- Tier and Size -->
              <div>
                <span class="text-gray-400">Tier:</span>
                {{ spirit.tier ? spirit.tier.replace('_', ' ') : 'N/A' }}
              </div>
              <div>
                <span class="text-gray-400">Size:</span>
                {{ spirit.size || 'N/A' }}
              </div>

              <!-- Damage/Dice -->
              <div v-if="spirit.dice && spirit.dice.length > 0">
                <span class="text-gray-400">Damage:</span>
                {{ formatDice(spirit.dice) }}
                <span v-if="getSpiritScalingBonus(spirit) > 0" class="scaling-positive">
                  + {{ getSpiritScalingBonus(spirit) }}
                </span>
              </div>

              <!-- Damage Type -->
              <div v-if="spirit.dice && spirit.dice.length > 0">
                <span class="text-gray-400">Damage Type:</span>
                {{ getDamageTypes(spirit.dice) }}
              </div>

              <!-- Spirit Scaling from Main Hand Weapon -->
              <div v-if="getMainHandScaling(spirit).length > 0">
                <span class="text-gray-400">Spell Scaling (Main Hand):</span>
                <span v-for="(scaling, index) in getMainHandScaling(spirit)" :key="index">
                  {{ scaling.stat }}: {{ scaling.grade }}
                  <span v-if="index < getMainHandScaling(spirit).length - 1">, </span>
                </span>
                <span class="scaling-positive ml-2">
                  +{{ getMainHandScalingBonus(spirit) }}
                </span>
              </div>

              <!-- Spirit Scaling from Off Hand Weapon -->
              <div v-if="getOffHandScaling(spirit).length > 0">
                <span class="text-gray-400">Spell Scaling (Off Hand):</span>
                <span v-for="(scaling, index) in getOffHandScaling(spirit)" :key="index">
                  {{ scaling.stat }}: {{ scaling.grade }}
                  <span v-if="index < getOffHandScaling(spirit).length - 1">, </span>
                </span>
                <span class="scaling-positive ml-2">
                  +{{ getOffHandScalingBonus(spirit) }}
                </span>
              </div>

              <!-- Range -->
              <div v-if="spirit.range">
                <span class="text-gray-400">Range:</span>
                {{ spirit.range }}
              </div>

              <!-- CF4: Protection Display -->
              <div v-if="hasProtection(spirit)" class="protection-section mt-2 pt-2 border-t border-gray-700">
                <div class="text-gray-400 font-semibold mb-1">Protection Granted:</div>
                <!-- Damage Protection -->
                <div v-for="(prot, idx) in spirit.damage_protection" :key="'dmg-' + idx" class="protection-entry">
                  <span class="protection-type">{{ formatProtectionType(prot.type) }}:</span>
                  {{ formatDamageProtection(prot) }}
                </div>
                <!-- Buildup Protection -->
                <div v-for="(prot, idx) in spirit.buildup_protection" :key="'bld-' + idx" class="protection-entry">
                  <span class="protection-type">{{ formatProtectionType(prot.type) }} Buildup:</span>
                  {{ formatBuildupProtection(prot) }}
                </div>
                <!-- Condition Protection -->
                <div v-for="(prot, idx) in spirit.condition_protection" :key="'cnd-' + idx" class="protection-entry">
                  <span class="protection-type">{{ prot.condition }} Immunity:</span>
                  {{ formatConditionProtection(prot) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Toggle Icon -->
          <div class="text-gray-400 ml-2">
            {{ expandedSpirits.has(spirit.id) ? '▼' : '▶' }}
          </div>
        </div>

        <!-- Spirit Description (Toggled) -->
        <div
          v-if="expandedSpirits.has(spirit.id)"
          class="mt-3 pt-3 border-t border-gray-600 text-sm text-gray-300"
        >
          {{ spirit.description || 'No description available.' }}
        </div>
      </div>
    </div>

    <div v-else class="text-gray-400 italic text-center py-4">
      No spirits attuned
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
const expandedSpirits = ref<Set<number>>(new Set())

// Apply modifications to attuned spirits
const attunedSpirits = computed(() => {
  return (playerStore.AttunedSpirits || []).map(spirit => {
    const modifications = playerStore.SpiritModifications[spirit.id]
    if (!modifications) return spirit
    // Merge modifications with original spirit data
    return { ...spirit, ...modifications }
  })
})

function toggleSpiritDescription(spiritId: number) {
  if (expandedSpirits.value.has(spiritId)) {
    expandedSpirits.value.delete(spiritId)
  } else {
    expandedSpirits.value.add(spiritId)
  }
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

// Get spirit scaling display for main hand
function getMainHandScaling(spirit: any): any[] {
  const weapon = getMainHandWeapon()
  if (!weapon) return []
  return getSpellScalingFromImplement(spirit, weapon)
}

// Get spirit scaling display for off hand
function getOffHandScaling(spirit: any): any[] {
  const weapon = getOffHandWeapon()
  if (!weapon) return []
  return getSpellScalingFromImplement(spirit, weapon)
}

// Get spirit scaling bonus from main hand
function getMainHandScalingBonus(spirit: any): number {
  const weapon = getMainHandWeapon()
  if (!weapon) return 0
  return calculateSpellScaling(spirit, weapon)
}

// Get spirit scaling bonus from off hand
function getOffHandScalingBonus(spirit: any): number {
  const weapon = getOffHandWeapon()
  if (!weapon) return 0
  return calculateSpellScaling(spirit, weapon)
}

// Get spirit scaling bonus from equipped implement (uses maximum of both hands)
function getSpiritScalingBonus(spirit: any): number {
  const mainHandBonus = getMainHandScalingBonus(spirit)
  const offHandBonus = getOffHandScalingBonus(spirit)
  // Return the maximum of the two
  return Math.max(mainHandBonus, offHandBonus)
}

// CF4: Protection helper functions
function hasProtection(spirit: any): boolean {
  return (spirit.damage_protection && spirit.damage_protection.length > 0) ||
         (spirit.buildup_protection && spirit.buildup_protection.length > 0) ||
         (spirit.condition_protection && spirit.condition_protection.length > 0)
}

function formatProtectionType(type: string): string {
  return type.charAt(0) + type.slice(1).toLowerCase()
}

function formatDamageProtection(prot: any): string {
  const parts: string[] = []
  if (prot.tiers > 0) parts.push(`${prot.tiers} tier${prot.tiers > 1 ? 's' : ''}`)
  if (prot.flat > 0) parts.push(`+${prot.flat} flat`)
  if (prot.dice_count > 0 && prot.dice_value > 0) parts.push(`${prot.dice_count}d${prot.dice_value}`)
  if (prot.percentage > 0) parts.push(`${prot.percentage}% (${prot.percentage_timing?.toLowerCase() || 'final'})`)

  const duration = formatDuration(prot)
  const target = formatTarget(prot)

  let result = parts.join(', ') || 'None'
  if (duration) result += ` | ${duration}`
  if (target) result += ` | ${target}`
  return result
}

function formatBuildupProtection(prot: any): string {
  const parts: string[] = []
  if (prot.flat > 0) parts.push(`-${prot.flat} flat`)
  if (prot.dice_count > 0 && prot.dice_value > 0) parts.push(`${prot.dice_count}d${prot.dice_value}`)
  if (prot.percentage > 0) parts.push(`${prot.percentage}% (${prot.percentage_timing?.toLowerCase() || 'final'})`)

  const duration = formatDuration(prot)
  const target = formatTarget(prot)

  let result = parts.join(', ') || 'None'
  if (duration) result += ` | ${duration}`
  if (target) result += ` | ${target}`
  return result
}

function formatConditionProtection(prot: any): string {
  const duration = formatDuration(prot)
  const target = formatTarget(prot)

  let result = 'Immune'
  if (duration) result += ` | ${duration}`
  if (target) result += ` | ${target}`
  return result
}

function formatDuration(prot: any): string {
  const parts: string[] = []
  if (prot.duration_turns > 0) parts.push(`${prot.duration_turns} turn${prot.duration_turns > 1 ? 's' : ''}`)
  if (prot.duration_attacks > 0) parts.push(`${prot.duration_attacks} hit${prot.duration_attacks > 1 ? 's' : ''}`)
  return parts.join(' or ')
}

function formatTarget(prot: any): string {
  if (prot.apply_to_caster && prot.apply_to_target) return 'Self & Target'
  if (prot.apply_to_caster) return 'Self'
  if (prot.apply_to_target) return 'Target'
  return ''
}
</script>

<style scoped>
.attuned-spirits-panel {
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

.spirits-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.spirit-card {
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: var(--transition-hover);
}

.spirit-card:hover {
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

/* CF4: Protection Section Styles */
.protection-section {
  border-color: var(--color-border-secondary);
}

.protection-entry {
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.protection-type {
  color: #60a5fa;
  font-weight: var(--font-weight-semibold);
}
</style>
