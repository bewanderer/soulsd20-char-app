<template>
  <div class="character-creation-page">
    <!-- Loading state -->
    <div v-if="isLoadingData" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading character creation data...</p>
    </div>

    <!-- Wizard -->
    <div v-else class="wizard-container">
      <h1 class="wizard-title">Create Your Character</h1>

      <!-- Step Indicator -->
      <div class="step-indicator">
        <div
          v-for="step in totalSteps"
          :key="step"
          class="step"
          :class="{
            active: step === currentStep,
            completed: step < currentStep
          }"
          @click="goToStep(step)"
        >
          <div class="step-number">{{ step }}</div>
          <div class="step-label">{{ getStepLabel(step) }}</div>
        </div>
      </div>

      <!-- Current Step Component -->
      <div class="step-content">
        <KeepAlive>
          <component :is="currentStepComponent" v-model="wizardData" />
        </KeepAlive>
      </div>

      <!-- Navigation -->
      <div class="wizard-navigation">
        <button
          @click="cancelCreation"
          class="nav-btn cancel-btn"
        >
          Cancel
        </button>

        <button
          @click="previousStep"
          :disabled="currentStep === 1"
          class="nav-btn back-btn"
        >
          &lt; Back
        </button>

        <button
          v-if="currentStep < totalSteps"
          @click="nextStep"
          :disabled="!canProceed()"
          class="nav-btn next-btn"
        >
          Next &gt;
        </button>

        <button
          v-else
          @click="finalizeCharacter"
          :disabled="!canCreateCharacter() || isCreating"
          class="nav-btn finalize-btn"
        >
          {{ isCreating ? 'Creating...' : 'Create Character' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'

definePageMeta({
  layout: 'app',
  middleware: 'auth'
})
import { useRouter } from 'vue-router'
import { useCharacterCreationWizard } from '~/composables/useCharacterCreationWizard'
import { useCompendiumStore } from '~/store/compendium'
import { usePlayerStore } from '~/store/player'
import { addCharacterWithSync, generateUUID, setActiveCharacter } from '~/mixins/characterStorage'

// Import step components
import NameStep from '~/components/CharacterCreation/NameStep.vue'
import BackgroundStep from '~/components/CharacterCreation/BackgroundStep.vue'
import StatAllocationStep from '~/components/CharacterCreation/StatAllocationStep.vue'
import LineageStep from '~/components/CharacterCreation/LineageStep.vue'
import BloodlineStep from '~/components/CharacterCreation/BloodlineStep.vue'
import ReviewStep from '~/components/CharacterCreation/ReviewStep.vue'

const router = useRouter()
const compendiumStore = useCompendiumStore()
const playerStore = usePlayerStore()
const isCreating = ref(false)
const { currentStep, totalSteps, wizardData, isChaoticTarnished, nextStep, previousStep, goToStep, canProceed } = useCharacterCreationWizard()

const isLoadingData = ref(true)

// Load compendium data if not already loaded
onMounted(() => {
  // Compendium is loaded by plugins/compendium.client.ts on startup
  // LoadingOverlay blocks UI until it finishes
  if (compendiumStore.Backgrounds.length > 0) {
    isLoadingData.value = false
  } else {
    // Watch for compendium to finish loading
    const unwatch = watch(() => compendiumStore.isLoaded, (loaded) => {
      if (loaded) {
        isLoadingData.value = false
        unwatch()
      }
    }, { immediate: true })
  }
})

const currentStepComponent = computed(() => {
  if (isChaoticTarnished.value) {
    // 6-step flow for Chaotic Tarnished
    const steps = [NameStep, BackgroundStep, StatAllocationStep, LineageStep, BloodlineStep, ReviewStep]
    return steps[currentStep.value - 1]
  } else {
    // 5-step flow for normal backgrounds
    const steps = [NameStep, BackgroundStep, LineageStep, BloodlineStep, ReviewStep]
    return steps[currentStep.value - 1]
  }
})

function getStepLabel(step: number): string {
  if (isChaoticTarnished.value) {
    // 6-step labels for Chaotic Tarnished
    const labels = ['Name', 'Background', 'Stats', 'Lineage', 'Bloodline', 'Review']
    return labels[step - 1]
  } else {
    // 5-step labels for normal backgrounds
    const labels = ['Name', 'Background', 'Lineage', 'Bloodline', 'Review']
    return labels[step - 1]
  }
}

function cancelCreation() {
  if (confirm('Are you sure you want to cancel character creation? All progress will be lost.')) {
    router.push('/campaigns')
  }
}

function canCreateCharacter(): boolean {
  // Check all required fields are filled
  return !!(
    wizardData.value.name &&
    wizardData.value.name.trim().length > 0 &&
    wizardData.value.background_id !== null &&
    wizardData.value.lineage_id !== null
  )
}

function finalizeCharacter() {
  // Prevent double-click
  if (isCreating.value) return
  isCreating.value = true

  // Get background data to initialize stats
  const background = compendiumStore.getBackgroundById(wizardData.value.background_id!)

  if (!background) {
    console.error('Background not found')
    return
  }

  // Handle Chaotic Tarnished special case
  let initialStats = {
    vitality: background.vitality,
    endurance: background.endurance,
    strength: background.strength,
    dexterity: background.dexterity,
    attunement: background.attunement,
    intelligence: background.intelligence,
    faith: background.faith
  }

  let startingHp = background.starting_hp

  if (background.has_special_rules && wizardData.value.statAllocation) {
    // Chaotic Tarnished: use final stats from allocation
    const allocation = wizardData.value.statAllocation

    if (allocation.finalStats) {
      initialStats = {
        vitality: allocation.finalStats.vitality,
        endurance: allocation.finalStats.endurance,
        strength: allocation.finalStats.strength,
        dexterity: allocation.finalStats.dexterity,
        attunement: allocation.finalStats.attunement,
        intelligence: allocation.finalStats.intelligence,
        faith: allocation.finalStats.faith
      }

      // Chaotic Tarnished starting HP = Vitality * 2 (set at creation, never changes)
      startingHp = allocation.finalStats.vitality * 2
    }
  }

  // Create character object with ALL fields (prevent old character data carryover)
  // Character starts at Level 0 - they will level up to 1 via the Level Up modal
  const newCharacter = {
    uuid: generateUUID(),
    name: wizardData.value.name,
    gender: wizardData.value.gender,
    physical_description: wizardData.value.physical_description || '',
    level: 0,
    background_id: wizardData.value.background_id!,
    lineage_id: wizardData.value.lineage_id!,
    bloodline_id: wizardData.value.bloodline_id,
    is_finalized: true,
    stats: initialStats,
    creation_stats: { ...initialStats }, // Store original stats for reset (especially Chaotic Tarnished)
    creation_starting_hp: startingHp, // Store original starting HP for reset (especially Chaotic Tarnished)
    skills: {
      Athletics: 0,
      Acrobatics: 0,
      Perception: 0,
      FireKeeping: 0,
      Sanity: 0,
      Stealth: 0,
      Precision: 0,
      Diplomacy: 0
    },
    knowledge: {
      Magics: 0,
      WorldHistory: 0,
      Monsters: 0,
      Cosmic: 0
    },
    starting_hp: startingHp,
    level_hp: 0,
    health_die: { count: 1, sides: 6 },
    current_hp: startingHp,
    current_fp: 2,
    current_ap: 0,
    temp_hp: 0,
    max_hp_bonus: 0,
    max_fp_bonus: 0,
    max_ap_bonus: 0,
    hp_flask: 0,
    fp_flask: 0,
    flask_level: 0,
    total_dodges: 0,
    current_dodges: 0,
    souls: 0,
    undying: 0,
    exhaustion: 0,
    firekeeping_checks: 0,
    attunement_slots: 0,
    current_statuses: {
      Curse: 0,
      Frost: 0,
      Bleed: 0,
      Poison: 0,
      Toxic: 0,
      Poise: 0
    },
    bonus_statuses: {
      Curse: 0,
      Frost: 0,
      Bleed: 0,
      Poison: 0,
      Toxic: 0,
      Poise: 0
    },
    resistances: {
      Physical: 0,
      Magic: 0,
      Fire: 0,
      Lightning: 0,
      Dark: 0,
      PhysicalFlat: 0,
      MagicFlat: 0,
      FireFlat: 0,
      LightningFlat: 0,
      DarkFlat: 0
    },
    combat_settings: {
      twoHandingMainHand: false,
      twoHandingOffHand: false,
      activeCompanionId: null,
      mainHandModifications: { isModified: false },
      offHandModifications: { isModified: false }
    },
    field_notes: {},

    // Inventory and Equipment (empty for new character)
    inventory: [],
    equipment: {
      MainHand: null,
      OffHand: null,
      Armor: null,
      Artifact: null,
      Artifact2: null,
      Ring1: null,
      Ring2: null,
      Ring3: null,
      Ring4: null,
      Ring5: null
    },

    // Spell system (empty for new character)
    attuned_spells: [],
    learned_spells: [],
    spell_modifications: {},

    // Weapon skills (empty for new character)
    attuned_weapon_skills: [],
    learned_weapon_skills: [],
    weapon_skill_modifications: {},

    // Destined traits (empty for new character)
    obtained_destined_traits: [],
    destined_trait_modifications: {},

    // Weapon proficiencies (empty for new character)
    weapon_proficiency_points: {
      total: 0,
      baseFromLevel: 0,
      customBonus: 0
    },
    obtained_weapon_prof_feats: [],
    weapon_proficiencies: {
      FIST: 0,
      DAGGER: 0,
      STRAIGHT_THRUST: 0,
      KATANA_CURVED: 0,
      ULTRA_GREAT_SWORD: 0,
      GREAT_AXE: 0,
      GREAT_HAMMER: 0,
      TWINBLADE: 0,
      SPEAR: 0,
      HALBERD: 0,
      REAPER: 0,
      WHIP: 0,
      CROSS_BOW: 0,
      GREAT_BOW_BALLISTA: 0,
      GUN: 0,
      SHIELD: 0,
      SORCERY: 0,
      MIRACLE: 0,
      PYROMANCY: 0,
      HEX: 0,
      SPIRIT_SUMMONING: 0,
      DUAL_WIELDING: 0
    },

    // Notes and Compendium (empty for new character)
    notes: { sections: [] },
    compendium: { entries: [] },

    // Companions (empty for new character)
    companions: [],

    // Level up state (no pending level up)
    pending_level_up: null,
    has_multi_proficient: false,
    multi_proficient_retroactive_points: 0,

    created_at: new Date().toISOString(),
    last_played: new Date().toISOString()
  }

  console.log(`[SD20 Nav] finalizeCharacter() name="${newCharacter.name}" uuid="${newCharacter.uuid}"`)

  // Save character at Level 0 (with API sync)
  const success = addCharacterWithSync(newCharacter)

  if (success) {
    console.log(`[SD20 Nav] Character created and saved successfully: "${newCharacter.name}" (uuid=${newCharacter.uuid})`)
    // Set as active character and load into store
    setActiveCharacter(newCharacter.uuid)
    playerStore.loadActiveCharacter()
    playerStore.setupAutoSave()

    // Initialize the mandatory Level 1 level-up
    // This bypasses souls requirement and sets up the level-up flow
    playerStore.initializeLevel1LevelUp()

    // Navigate to character sheet where the mandatory Level Up modal will appear
    router.push(`/character/${newCharacter.uuid}`)
  } else {
    console.error('[SD20 Nav] Failed to save character')
    console.error('Failed to save character')
    alert('Failed to create character. Maximum 10 characters allowed.')
  }
}
</script>

<style scoped>
.character-creation-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(to bottom, rgba(10, 10, 10, 0.95), rgba(20, 20, 30, 0.95));
}

.wizard-container {
  max-width: 800px;
  width: 100%;
  background: rgba(20, 20, 20, 0.9);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 40px;
}

.wizard-title {
  text-align: center;
  margin-bottom: 30px;
  color: var(--color-gold-primary);
  font-size: 2em;
}

.step-indicator {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
  gap: 10px;
}

.step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
  outline: none;
}

.step:focus {
  outline: none;
}

.step.active {
  opacity: 1;
  box-shadow: none !important;
}

.step.completed {
  opacity: 0.8;
  color: #4caf50;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 8px;
  color: white;
  outline: none;
}

.step.active .step-number {
  background: var(--color-btn-primary-bg-hover);
  border-color: var(--color-accent-gold-bright);
  color: #ffffff;
  box-shadow: var(--shadow-gold-inset);
}

.step.completed .step-number {
  background: rgba(76, 175, 80, 0.3);
  border-color: #4caf50;
}

.step-label {
  font-size: 0.85em;
  text-align: center;
  color: white;
}

.step-content {
  min-height: 400px;
  margin-bottom: 30px;
}

.wizard-navigation {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.nav-btn {
  padding: 12px 24px;
  border-radius: 4px;
  border: 2px solid;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.2s;
  font-weight: bold;
}

.cancel-btn {
  background: rgba(150, 0, 0, 0.3);
  border-color: rgba(255, 0, 0, 0.5);
  color: white;
}

.cancel-btn:hover {
  background: rgba(150, 0, 0, 0.5);
}

.back-btn {
  background: rgba(100, 100, 100, 0.3);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.back-btn:hover:not(:disabled) {
  background: rgba(100, 100, 100, 0.5);
}

.next-btn {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-dim);
  color: #ffffff;
  margin-left: auto;
  transition: var(--transition-hover);
}

.next-btn:hover:not(:disabled) {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

.finalize-btn {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-dim);
  color: #ffffff;
  margin-left: auto;
  transition: var(--transition-hover);
}

.finalize-btn:hover {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--color-gold-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: var(--color-gold-primary);
  font-size: 1.2em;
}
</style>
