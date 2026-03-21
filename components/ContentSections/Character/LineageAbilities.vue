<template>
  <ClientOnly>
    <div class="lineage-abilities" v-if="lineage">
      <h3 class="section-title">{{ lineage.name }} Abilities</h3>
      <p class="lineage-subtitle">{{ lineage.subtitle }}</p>

      <!-- Vision -->
      <div v-if="visionInfo" class="ability-group">
        <h4 class="ability-title">Vision</h4>
        <p class="ability-text">
          {{ formatVisionType(visionInfo.type) }} {{ visionInfo.range }} ft
        </p>
      </div>

      <!-- Skill Bonuses -->
      <div v-if="hasSkillBonuses" class="ability-group">
        <h4 class="ability-title">Skill Bonuses</h4>
        <div v-for="(value, skill) in skillBonuses" :key="skill" class="ability-text">
          {{ formatSkillName(skill) }}: {{ formatSkillValue(value) }}
        </div>
      </div>

      <!-- Resistances -->
      <div v-if="hasResistances" class="ability-group">
        <h4 class="ability-title">Resistances</h4>
        <div v-for="(text, index) in formattedResistances" :key="index" class="ability-text">
          {{ text }}
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
const resistances = computed(() => baseAbilities.value.resistances || [])
const specialAbilities = computed(() => baseAbilities.value.special_abilities || [])

// Handle resistances as array (API format)
const resistancesList = computed(() => {
  const res = resistances.value
  // If it's already an array, return it
  if (Array.isArray(res)) return res
  // If it's an object (old format), convert to array
  if (res && typeof res === 'object') {
    const list: any[] = []
    for (const key of Object.keys(res)) {
      if (key === 'scaling' || key === 'condition' || key === 'choice') continue
      list.push({ type: key, value: res[key] })
    }
    return list
  }
  return []
})

// Pre-compute formatted resistances so Vue tracks the level dependency for reactivity
const formattedResistances = computed(() => {
  // Use playerStore.Level directly - this is the reactive source for level changes
  const charLevel = playerStore.Level ?? 1
  return resistancesList.value.map(res => formatResistanceEntryWithLevel(res, charLevel))
})

const hasSkillBonuses = computed(() => Object.keys(skillBonuses.value).length > 0)
const hasResistances = computed(() => resistancesList.value.length > 0)
const hasSpecialAbilities = computed(() => specialAbilities.value.length > 0)

// Parse bloodline abilities
const bloodlineAbilities = computed(() => {
  if (!bloodline.value || !bloodline.value.new_abilities) return []
  return bloodline.value.new_abilities.special_abilities || []
})

const hasBloodlineAbilities = computed(() => bloodlineAbilities.value.length > 0)

// Format vision type (e.g., "half_darkvision" -> "Half Darkvision")
function formatVisionType(type: string): string {
  if (!type) return ''
  return type.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

// Format skill name (e.g., "Fire_Keeping" -> "Fire Keeping")
function formatSkillName(skill: string | number): string {
  const skillStr = String(skill)
  return skillStr.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

// Format skill value (handle negative values, text values like "+1 every 5 levels")
function formatSkillValue(value: any): string {
  if (typeof value === 'number') {
    return value >= 0 ? `+${value}` : String(value)
  }
  // String values like "+1 every 5 levels" - return as-is
  return String(value)
}

// Format a resistance entry from the array format (with explicit level for reactivity)
// Entry format: { type: "physical", tiers: 1, scaling: [...] } or { type: "magic", flat: 2, scaling: [...] }
function formatResistanceEntryWithLevel(entry: any, level: number): string {
  if (!entry || typeof entry !== 'object') return String(entry)

  // Get the damage type (capitalize)
  const damageType = entry.type
    ? entry.type.charAt(0).toUpperCase() + entry.type.slice(1).toLowerCase()
    : 'Unknown'

  // Determine if it's tiers or flat
  const isTiers = 'tiers' in entry
  const isFlat = 'flat' in entry
  const baseValue = entry.tiers ?? entry.flat ?? 0

  // Get current value based on character level and scaling
  let currentValue = baseValue
  if (entry.scaling && Array.isArray(entry.scaling)) {
    for (const scale of entry.scaling) {
      if (level >= scale.level) {
        currentValue = scale.tiers ?? scale.flat ?? currentValue
      }
    }
  }

  // Format the output
  if (isTiers) {
    return `${damageType}: +${currentValue} tier${currentValue !== 1 ? 's' : ''}`
  } else if (isFlat) {
    return `${damageType} (Flat): +${currentValue}`
  } else {
    return `${damageType}: +${currentValue}`
  }
}

// Format scaling based on character level
function formatScaling(scaling: any): string {
  // Use playerStore.Level directly for reactivity
  const level = playerStore.Level ?? 1
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
