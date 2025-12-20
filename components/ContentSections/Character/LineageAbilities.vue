<template>
  <ClientOnly>
    <div class="lineage-abilities" v-if="lineage">
      <h3 class="section-title">{{ lineage.name }} Abilities</h3>
      <p class="lineage-subtitle">{{ lineage.subtitle }}</p>

      <!-- Vision -->
      <div v-if="visionInfo" class="ability-group">
        <h4 class="ability-title">Vision</h4>
        <p class="ability-text">
          {{ visionInfo.type }} {{ visionInfo.range }} ft
        </p>
      </div>

      <!-- Skill Bonuses -->
      <div v-if="hasSkillBonuses" class="ability-group">
        <h4 class="ability-title">Skill Bonuses</h4>
        <div v-for="(value, skill) in skillBonuses" :key="skill" class="ability-text">
          {{ skill }}: +{{ value }}
        </div>
      </div>

      <!-- Resistances -->
      <div v-if="hasResistances" class="ability-group">
        <h4 class="ability-title">Resistances</h4>
        <div v-for="(value, type) in resistances" :key="type" class="ability-text">
          {{ formatResistanceType(type) }}: {{ formatResistanceValue(value) }}
        </div>
      </div>

      <!-- Special Abilities -->
      <div v-if="hasSpecialAbilities" class="ability-group">
        <h4 class="ability-title">Special Abilities</h4>
        <div v-for="(ability, index) in specialAbilities" :key="index" class="special-ability">
          <p class="ability-name">{{ ability.name }}</p>
          <p class="ability-description">{{ ability.description }}</p>
          <p v-if="ability.scaling" class="ability-scaling">
            Scales with level: {{ formatScaling(ability.scaling) }}
          </p>
        </div>
      </div>

      <!-- Bloodline Modifications -->
      <div v-if="bloodline" class="bloodline-section">
        <h3 class="section-title bloodline-title">{{ bloodline.name }} (Bloodline)</h3>
        <p class="bloodline-description">{{ bloodline.description }}</p>

        <!-- New Bloodline Abilities -->
        <div v-if="hasBloodlineAbilities" class="ability-group">
          <h4 class="ability-title">Bloodline Abilities</h4>
          <div v-for="(ability, index) in bloodlineAbilities" :key="index" class="special-ability">
            <p class="ability-name">{{ ability.name }}</p>
            <p class="ability-description">{{ ability.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCompendiumStore } from '~/store/compendium'
import { usePlayerStore } from '~/store/player'
import { getActiveCharacter } from '~/mixins/characterStorage'
import { getEffectiveAbilities } from '~/mixins/lineageAbilities'

const compendiumStore = useCompendiumStore()
const playerStore = usePlayerStore()

// Get active character's lineage and bloodline
const activeChar = computed(() => getActiveCharacter())
const lineage = computed(() => {
  if (!activeChar.value) return null
  return compendiumStore.getLineageById(activeChar.value.lineage_id)
})

const bloodline = computed(() => {
  if (!activeChar.value || !activeChar.value.bloodline_id) return null
  return compendiumStore.getBloodlineById(activeChar.value.bloodline_id)
})

// Get effective abilities after applying bloodline modifications
const baseAbilities = computed(() => {
  return getEffectiveAbilities(lineage.value, bloodline.value)
})

const visionInfo = computed(() => baseAbilities.value.vision || null)
const skillBonuses = computed(() => baseAbilities.value.skill_bonuses || {})
const resistances = computed(() => baseAbilities.value.resistances || {})
const specialAbilities = computed(() => baseAbilities.value.special_abilities || [])

const hasSkillBonuses = computed(() => Object.keys(skillBonuses.value).length > 0)
const hasResistances = computed(() => Object.keys(resistances.value).length > 0)
const hasSpecialAbilities = computed(() => specialAbilities.value.length > 0)

// Parse bloodline abilities
const bloodlineAbilities = computed(() => {
  if (!bloodline.value || !bloodline.value.new_abilities) return []
  return bloodline.value.new_abilities.special_abilities || []
})

const hasBloodlineAbilities = computed(() => bloodlineAbilities.value.length > 0)

// Format resistance type (capitalize and add spaces)
function formatResistanceType(type: string | number): string {
  const typeStr = String(type)
  return typeStr.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

// Format resistance value (handle flat vs percentage)
function formatResistanceValue(value: any): string {
  if (typeof value === 'object' && value.scaling) {
    // Level-based scaling
    return formatScaling(value.scaling)
  }
  return typeof value === 'number' ? `+${value}` : String(value)
}

// Format scaling based on character level
function formatScaling(scaling: any): string {
  if (!activeChar.value) return 'Unknown'

  const level = activeChar.value.level
  const scalingKeys = Object.keys(scaling).map(Number).sort((a, b) => a - b)

  // Find the highest level threshold that character has reached
  let applicableLevel = scalingKeys[0]
  for (const lvl of scalingKeys) {
    if (level >= lvl) {
      applicableLevel = lvl
    } else {
      break
    }
  }

  return scaling[applicableLevel] || 'Unknown'
}
</script>

<style scoped>
.lineage-abilities {
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  margin: 20px 0;
}

.section-title {
  font-size: 1.5em;
  color: var(--color-gold-primary);
  margin-bottom: 8px;
}

.lineage-subtitle {
  font-size: 1em;
  color: #aaa;
  margin-bottom: 20px;
  font-style: italic;
}

.ability-group {
  margin-bottom: 20px;
}

.ability-title {
  font-size: 1.2em;
  color: #fff;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 5px;
}

.ability-text {
  color: #ccc;
  margin: 5px 0;
  padding-left: 15px;
}

.special-ability {
  background: rgba(255, 255, 255, 0.05);
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.ability-name {
  font-weight: bold;
  color: #fff;
  margin-bottom: 5px;
}

.ability-description {
  color: #ccc;
  line-height: 1.6;
  margin-bottom: 5px;
}

.ability-scaling {
  color: var(--color-gold-primary);
  font-size: 0.9em;
  font-style: italic;
}

.bloodline-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid var(--color-gold-rgba-medium);
}

.bloodline-title {
  color: #87ceeb;
}

.bloodline-description {
  color: #aaa;
  margin-bottom: 15px;
  line-height: 1.6;
}
</style>
