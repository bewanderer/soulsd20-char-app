<template>
  <div class="content-area-wrapper">
    <!-- Left Panel (50%) -->
    <div class="content-panel left-panel">
      <h2 class="panel-title">Character Info</h2>

        <!-- Physical Description - Always visible and editable -->
        <div class="w-full mb-4">
          <h3 class="section-subtitle">Physical Description</h3>
          <textarea
            v-model="playerStore.PhysicalDescription"
            class="physical-description-textarea"
            placeholder="Describe your character's appearance..."
            maxlength="500"
            rows="4"
            @input="autoResize"
          />
          <div class="character-count">
            {{ (playerStore.PhysicalDescription || '').length }}/500
          </div>
        </div>

        <div class="flex justify-between w-full mb-6">
          <div class="flex flex-col items-start w-2/4 mr-4">
            <h2 class="section-heading">
              Resistances
            </h2>

            <div class="flex flex-col space-y-2 justify-between w-full stat-container mb-6">
              <CharacterResistanceOption
                name="Max curse bonus"
                identifier="Curse"
                sType="status"
                :statAmount="playerStore.UserInputValues.BonusStatuses.Curse"
              />

              <CharacterResistanceOption
                name="Max frost bonus"
                identifier="Frost"
                sType="status"
                :statAmount="playerStore.UserInputValues.BonusStatuses.Frost"
              />

              <CharacterResistanceOption
                name="Max bleed bonus"
                identifier="Bleed"
                sType="status"
                :statAmount="playerStore.UserInputValues.BonusStatuses.Bleed"
              />

              <CharacterResistanceOption
                name="Max poison bonus"
                identifier="Poison"
                sType="status"
                :statAmount="playerStore.UserInputValues.BonusStatuses.Poison"
              />

              <CharacterResistanceOption
                name="Max toxic bonus"
                identifier="Toxic"
                sType="status"
                :statAmount="playerStore.UserInputValues.BonusStatuses.Toxic"
              />

              <CharacterResistanceOption
                name="Max poise bonus"
                identifier="Poise"
                sType="status"
                :statAmount="playerStore.UserInputValues.BonusStatuses.Poise"
              />
            </div>

            <h2 class="section-heading">
              Calculated attributes
            </h2>

            <div class="flex flex-col space-y-2 justify-between w-full stat-container mb-6">
              <CalculatedAttributeOption
                name="Dodge distance"
                identifier="DodgeDistanceOverride"
                :calculatedValue="calculateDodgeDistance"
                unit="ft"
              />

              <CalculatedAttributeOption
                name="Dodge cost"
                identifier="DodgeCostOverride"
                :calculatedValue="calculateDodgeCost"
                unit="AP"
              />

              <CalculatedAttributeOption
                name="Item usage cost"
                identifier="ItemUsageCostOverride"
                :calculatedValue="calculateItemUsageCost"
                unit="AP"
              />

              <CalculatedAttributeOption
                name="Jump (horizontal)"
                identifier="JumpHorizontalOverride"
                :calculatedValue="calculateJumpHorizontal"
                unit="ft"
              />

              <CalculatedAttributeOption
                name="Jump (vertical)"
                identifier="JumpVerticalOverride"
                :calculatedValue="calculateJumpVertical"
                unit="ft"
              />

              <CalculatedAttributeOption
                name="Running jump (horizontal)"
                identifier="RunningJumpHorizontalOverride"
                :calculatedValue="calculateRunningJumpHorizontal"
                unit="ft"
              />

              <CalculatedAttributeOption
                name="Running jump (vertical)"
                identifier="RunningJumpVerticalOverride"
                :calculatedValue="calculateRunningJumpVertical"
                unit="ft"
              />

              <CalculatedAttributeOption
                name="Max equip load"
                identifier="MaxEquipLoadOverride"
                :calculatedValue="calculateMaxEquipLoad"
                unit=""
              />
            </div>
          </div>

          <div class="flex flex-col items-start w-2/4">
            <h2 class="section-heading">
              General
            </h2>

            <HealthDieOption
              name="Health Die"
              identifier="HealthDie"
              class="mb-3"
            />

            <div class="flex flex-col space-y-2 justify-between w-full stat-container mb-6">
              <CharacterGeneralOption
                name="Max HP bonus"
                identifier="MaxHPBonus"
                :statAmount="playerStore.UserInputValues.MaxHPBonus"
              />

              <CharacterGeneralOption
                name="Level HP"
                identifier="LevelHP"
                :statAmount="playerStore.LevelHP"
              />


              <CharacterGeneralOption
                name="Temp HP"
                identifier="TempHP"
                :statAmount="playerStore.UserInputValues.TempHP"
                :min="0"
              />

              <CharacterGeneralOption
                name="Max FP bonus"
                identifier="MaxFPBonus"
                :statAmount="playerStore.UserInputValues.MaxFPBonus"
              />

              <CharacterGeneralOption
                name="Max AP bonus"
                identifier="MaxAPBonus"
                :statAmount="playerStore.UserInputValues.MaxAPBonus"
              />

              <CharacterGeneralOption
                name="Flask level"
                identifier="FlaskLevel"
                :statAmount="playerStore.UserInputValues.FlaskLevel"
              />

              <CharacterGeneralOption
                name="Total dodges"
                identifier="TotalDodges"
                :statAmount="playerStore.UserInputValues.TotalDodges"
              />

              <!-- <CharacterGeneralOption
                name="Current dodges"
                identifier="CurrentDodges"
                :statAmount="playerStore.UserInputValues.CurrentDodges"
              /> -->

              <CharacterGeneralOption
                name="Fate points"
                identifier="FatePoints"
                :statAmount="playerStore.FatePoints"
              />

              <CharacterGeneralOption
                name="Bonus attunement slots"
                identifier="AttunementSlots"
                :statAmount="playerStore.UserInputValues.AttunementSlots"
              />

              <CharacterGeneralOption
                name="Firekeeping checks"
                identifier="FirekeepingChecks"
                :statAmount="playerStore.UserInputValues.FirekeepingChecks"
              />

              <CharacterGeneralOption
                name="Exhaustion"
                identifier="Exhaustion"
                :statAmount="playerStore.UserInputValues.Exhaustion"
              />
            </div>
          </div>
        </div>
    </div>

    <!-- Right Panel (50%) -->
    <div class="content-panel right-panel">
      <h2 class="panel-title">Stats & Skills</h2>
      <div class="w-full">
          <div class="flex justify-around space-x-8">
            <div class="flex flex-col items-start w-2/4">
              <h2 class="section-heading">
                Skills
              </h2>

              <div class="flex flex-col space-y-2 justify-between items-center mb-12 w-full stat-container">
                <CharacterStatOption
                  name="Athletics"
                  identifier="Athletics"
                  sType="skill"
                  :statAmount="playerStore.CharacterStats.Skills.Athletics"
                />
                  
                <CharacterStatOption
                  name="Acrobatics"
                  identifier="Acrobatics"
                  sType="skill"
                  :statAmount="playerStore.CharacterStats.Skills.Acrobatics"
                />
                  
                <CharacterStatOption
                  name="Perception"
                  identifier="Perception"
                  sType="skill"
                  :statAmount="playerStore.CharacterStats.Skills.Perception"
                />
                  
                <CharacterStatOption
                  name="Fire Keeping"
                  identifier="FireKeeping"
                  sType="skill"
                  :statAmount="playerStore.CharacterStats.Skills.FireKeeping"
                />
                  
                <CharacterStatOption
                  name="Sanity"
                  identifier="Sanity"
                  sType="skill"
                  :statAmount="playerStore.CharacterStats.Skills.Sanity"
                />
                  
                <CharacterStatOption
                  name="Stealth"
                  identifier="Stealth"
                  sType="skill"
                  :statAmount="playerStore.CharacterStats.Skills.Stealth"
                />
                  
                <CharacterStatOption
                  name="Precision"
                  identifier="Precision"
                  sType="skill"
                  :statAmount="playerStore.CharacterStats.Skills.Precision"
                />
                  
                <CharacterStatOption
                  name="Diplomacy"
                  identifier="Diplomacy"
                  sType="skill"
                  :statAmount="playerStore.CharacterStats.Skills.Diplomacy"
                />
              </div>
            </div>
        
            <div class="flex flex-col items-start w-2/4">
              <h2 class="section-heading">
                Stats
              </h2>
              <div class="flex flex-col justify-start space-y-2 mb-12 w-full stat-container">
                  <CharacterStatOption
                    name="Vitality"
                    identifier="Vitality"
                    sType="stat"
                    :statAmount="playerStore.CharacterStats.Stats.Vitality"
                  />
                    
                  <CharacterStatOption
                    name="Endurance"
                    identifier="Endurance"
                    sType="stat"
                    :statAmount="playerStore.CharacterStats.Stats.Endurance"
                  />
                    
                  <CharacterStatOption
                    name="Strength"
                    identifier="Strength"
                    sType="stat"
                    :statAmount="playerStore.CharacterStats.Stats.Strength"
                  />
                    
                  <CharacterStatOption
                    name="Dexterity"
                    identifier="Dexterity"
                    sType="stat"
                    :statAmount="playerStore.CharacterStats.Stats.Dexterity"
                  />
                    
                  <CharacterStatOption
                    name="Attunement"
                    identifier="Attunement"
                    sType="stat"
                    :statAmount="playerStore.CharacterStats.Stats.Attunement"
                  />
                    
                  <CharacterStatOption
                    name="Intelligence"
                    identifier="Intelligence"
                    sType="stat"
                    :statAmount="playerStore.CharacterStats.Stats.Intelligence"
                  />
                    
                  <CharacterStatOption
                    name="Faith"
                    identifier="Faith"
                    sType="stat"
                    :statAmount="playerStore.CharacterStats.Stats.Faith"
                  />
              </div>
            </div>
          </div>
      
          <div class="flex justify-between space-x-8">
            <div class="flex flex-col items-start w-2/4">
              <h2 class="section-heading">
                Knowledge
              </h2>
    
              <div class="flex flex-col justify-between space-y-2 mb-12 w-full stat-container">
                  <CharacterStatOption
                    name="Magics"
                    identifier="Magics"
                    sType="knowledge"
                    :statAmount="playerStore.CharacterStats.Knowledge.Magics"
                  />
                
                  <CharacterStatOption
                    name="World/History"
                    identifier="WorldHistory"
                    sType="knowledge"
                    :statAmount="playerStore.CharacterStats.Knowledge.WorldHistory"
                  />
                
                  <CharacterStatOption
                    name="Monsters"
                    identifier="Monsters"
                    sType="knowledge"
                    :statAmount="playerStore.CharacterStats.Knowledge.Monsters"
                  />
                
                  <CharacterStatOption
                    name="Cosmic"
                    identifier="Cosmic"
                    sType="knowledge"
                    :statAmount="playerStore.CharacterStats.Knowledge.Cosmic"
                  />
              </div>
            </div>
          </div>

        <!-- Lineage Abilities Section -->
        <div class="w-full px-4">
          <LineageAbilities />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from '@/store/player'
import { useCompendiumStore } from '@/store/compendium'
import LineageAbilities from './LineageAbilities.vue'
import CalculatedAttributeOption from './CalculatedAttributeOption.vue'
import HealthDieOption from './HealthDieOption.vue'

const playerStore = usePlayerStore()
const compendiumStore = useCompendiumStore()

// Auto-resize textarea based on content
function autoResize(event: Event) {
  const textarea = event.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
  textarea.style.height = Math.max(80, textarea.scrollHeight) + 'px'
}

const requiredSoulsToLevel = computed(()=>{
  return (playerStore.Level * 10) + 10
})

const lineageName = computed(() => {
  if (!playerStore.LineageId) return ''
  const lineage = compendiumStore.getLineageById(playerStore.LineageId)
  return lineage?.name || ''
})

const bloodlineName = computed(() => {
  if (!playerStore.BloodlineId) return ''
  const bloodline = compendiumStore.getBloodlineById(playerStore.BloodlineId)
  return bloodline?.name || ''
})

const backgroundName = computed(() => {
  if (!playerStore.BackgroundId) return ''
  const background = compendiumStore.getBackgroundById(playerStore.BackgroundId)
  return background?.name || ''
})

// Calculate dodge cost based on armor weight and Strength
const calculateDodgeCost = computed(() => {
  // If manual override is set, use it
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
    return 2 // Default if armor not found
  }

  const armorType = armor.armor_type // LIGHT, MEDIUM, or HEAVY

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

  return 2 // Default fallback
})

const dodgeCost = computed(() => {
  const cost = calculateDodgeCost.value
  return `${cost} AP`
})

// Calculate dodge distance based on armor equipped
const calculateDodgeDistance = computed(() => {
  // If manual override is set, use it
  if (playerStore.DodgeDistanceOverride !== null) {
    return playerStore.DodgeDistanceOverride
  }

  const equippedArmor = playerStore.Equipment.Armor

  // No armor - base 10 ft, with armor - base 5 ft
  // Feats and weapon proficiencies can override this via DodgeDistanceOverride
  return equippedArmor ? 5 : 10
})

const dodgeDistance = computed(() => {
  const distance = calculateDodgeDistance.value
  return `${distance} ft`
})

// Calculate item usage cost based on Dexterity
const calculateItemUsageCost = computed(() => {
  // If manual override is set, use it
  if (playerStore.ItemUsageCostOverride !== null) {
    return playerStore.ItemUsageCostOverride
  }

  const dex = playerStore.CharacterStats.Stats.Dexterity
  if (dex < 10) return 4
  if (dex < 18) return 3
  return 2
})

// Jump calculations (without running start)
const calculateJumpHorizontal = computed(() => {
  // If manual override is set, use it
  if (playerStore.JumpHorizontalOverride !== null) {
    return playerStore.JumpHorizontalOverride
  }
  // Without running start = STR / 2 in feet
  return playerStore.CharacterStats.Stats.Strength / 2
})

const calculateJumpVertical = computed(() => {
  // If manual override is set, use it
  if (playerStore.JumpVerticalOverride !== null) {
    return playerStore.JumpVerticalOverride
  }
  // Without running start = STR / 4 in feet
  return playerStore.CharacterStats.Stats.Strength / 4
})

// Running jump calculations (with 10-foot running start)
const calculateRunningJumpHorizontal = computed(() => {
  // If manual override is set, use it
  if (playerStore.RunningJumpHorizontalOverride !== null) {
    return playerStore.RunningJumpHorizontalOverride
  }
  // With running start = STR stat in feet
  return playerStore.CharacterStats.Stats.Strength
})

const calculateRunningJumpVertical = computed(() => {
  // If manual override is set, use it
  if (playerStore.RunningJumpVerticalOverride !== null) {
    return playerStore.RunningJumpVerticalOverride
  }
  // With running start = STR / 2 in feet
  return playerStore.CharacterStats.Stats.Strength / 2
})

// Max Equip Load calculation
const calculateMaxEquipLoad = computed(() => {
  // If manual override is set, use it
  if (playerStore.MaxEquipLoadOverride !== null) {
    return playerStore.MaxEquipLoadOverride
  }
  // Formula: ((STR + END) / 2) * 15
  return ((playerStore.CharacterStats.Stats.Strength + playerStore.CharacterStats.Stats.Endurance) / 2) * 15
})
</script>

<style scoped>
.content-area-wrapper {
  display: flex;
  width: 100%;
  height: calc(100vh - 190px);
  gap: var(--padding-lg); /* Responsive: 1.48vh (~16px at 1080p) */
}

.content-panel {
  position: relative;
  width: 50%;
  background: var(--color-bg-secondary);
  border: var(--border-width-medium) solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
  padding: var(--padding-lg);
  overflow-y: auto;
  box-shadow: var(--shadow-panel);
}

.panel-title {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  color: var(--color-accent-gold-bright);
  text-align: center;
  margin-bottom: var(--padding-lg);
  padding-bottom: var(--padding-sm);
  border-bottom: var(--border-width-medium) solid var(--color-border-primary);
  letter-spacing: 0.05em;
}

/* Custom scrollbar for content panels */
.content-panel {
  scrollbar-width: thin;
  scrollbar-color: #ffd900b0 rgba(0, 0, 0, 0.3);
}

.content-panel::-webkit-scrollbar {
  width: 8px;
}

.content-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.content-panel::-webkit-scrollbar-thumb {
  background: var(--color-gold-primary);
  border-radius: 4px;
}

.content-panel::-webkit-scrollbar-thumb:hover {
  background: var(--color-gold-primary);
}

/* Physical Description Textarea */
.physical-description-textarea {
  width: 100%;
  padding: var(--padding-md);
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: var(--border-width-medium) solid var(--color-accent-gold-dim);
  border-radius: var(--border-radius-md);
  resize: none;
  min-height: 7.41vh;
  overflow-y: auto;
  font-size: var(--font-size-small);
  line-height: var(--line-height-relaxed);
  outline: none;
  transition: var(--transition-hover);
}

.physical-description-textarea::placeholder {
  color: var(--color-text-tertiary);
  font-style: italic;
}

.physical-description-textarea:focus {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-medium);
}

/* Stat containers - 20% wider than default max-w-xs (320px -> 384px equivalent) */
.stat-container {
  max-width: 95%; /* 20% increase from standard small container, responsive to parent */
}

/* Calculated Attributes - Static displays */
.calculated-attribute-static {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0.25rem 0.5rem;
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-secondary);
  border-radius: var(--border-radius-sm);
  transition: var(--transition-hover);
}

.calculated-attribute-static:hover {
  border-color: var(--color-border-primary);
  box-shadow: var(--shadow-gold-soft);
}

.attribute-name-static {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  margin-right: 0.5rem;
}

.attribute-value-static {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

/* Section headings and text */
.section-heading {
  padding-bottom: var(--padding-md);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  text-align: center;
}

.section-subtitle {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--padding-sm);
}

.character-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  text-align: right;
  margin-top: 0.25rem;
}

/* Responsive breakpoint */
@media (max-width: 1279px) {
  .content-area-wrapper {
    flex-direction: column;
    height: auto;
  }

  .content-panel {
    width: 100%;
    min-height: 50vh;
  }
}
</style>