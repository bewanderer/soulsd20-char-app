// Wizard state and logic for character creation
import { ref, watch, computed } from 'vue'
import { useCompendiumStore } from '~/store/compendium'

export function useCharacterCreationWizard() {
  const compendiumStore = useCompendiumStore()
  const currentStep = ref(1)

  const wizardData = ref({
    name: '',
    gender: '',
    physical_description: '',
    background_id: null as number | null,
    lineage_id: null as number | null,
    bloodline_id: null as number | null,
    statAllocation: null as {
      rolls: number[]
      selectedStatFor15: string | null
      rollAssignments: (string | null)[]
      finalStats: {
        vitality: number
        endurance: number
        strength: number
        dexterity: number
        attunement: number
        intelligence: number
        faith: number
      }
      isValid: boolean
    } | null
  })

  // Check if Chaotic Tarnished is selected
  const isChaoticTarnished = computed(() => {
    if (!wizardData.value.background_id) return false
    const background = compendiumStore.getBackgroundById(wizardData.value.background_id)
    return background?.has_special_rules === true
  })

  // Dynamic total steps based on background selection
  const totalSteps = computed(() => {
    return isChaoticTarnished.value ? 6 : 5
  })

  function nextStep() {
    if (currentStep.value < totalSteps.value) {
      currentStep.value++
    }
  }

  function previousStep() {
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }

  function goToStep(step: number) {
    // Only allow navigation to completed steps or the next available step
    if (step >= 1 && step <= totalSteps.value) {
      // Can go back to any previous step
      if (step < currentStep.value) {
        currentStep.value = step
        return
      }

      // Can only go forward if all previous steps are valid
      for (let i = 1; i < step; i++) {
        const prevStep = currentStep.value
        currentStep.value = i
        if (!canProceed()) {
          currentStep.value = prevStep
          return
        }
      }

      currentStep.value = step
    }
  }

  function canProceed(): boolean {
    // Validate current step before allowing next
    // Step numbers vary based on Chaotic Tarnished selection
    if (isChaoticTarnished.value) {
      // 6-step flow: Name, Background, StatAllocation, Lineage, Bloodline, Review
      switch (currentStep.value) {
        case 1:
          return wizardData.value.name.trim().length > 0 && wizardData.value.gender.length > 0
        case 2:
          return wizardData.value.background_id !== null
        case 3:
          // Stat allocation validation
          return wizardData.value.statAllocation?.isValid === true
        case 4:
          return wizardData.value.lineage_id !== null
        case 5:
          // Bloodline is always optional
          return true
        case 6:
          return true // Review step always valid
        default:
          return false
      }
    } else {
      // 5-step flow: Name, Background, Lineage, Bloodline, Review
      switch (currentStep.value) {
        case 1:
          return wizardData.value.name.trim().length > 0 && wizardData.value.gender.length > 0
        case 2:
          return wizardData.value.background_id !== null
        case 3:
          return wizardData.value.lineage_id !== null
        case 4:
          // Bloodline is always optional
          return true
        case 5:
          return true // Review step always valid
        default:
          return false
      }
    }
  }

  function resetWizard() {
    currentStep.value = 1
    wizardData.value = {
      name: '',
      gender: '',
      physical_description: '',
      background_id: null,
      lineage_id: null,
      bloodline_id: null,
      statAllocation: null
    }
  }

  // Handle dependency: changing background resets stat allocation
  watch(() => wizardData.value.background_id, (newBackgroundId, oldBackgroundId) => {
    if (newBackgroundId !== oldBackgroundId && oldBackgroundId !== null) {
      wizardData.value.statAllocation = null
    }
  })

  // Handle dependency: changing lineage resets bloodline
  watch(() => wizardData.value.lineage_id, (newLineageId, oldLineageId) => {
    if (newLineageId !== oldLineageId && oldLineageId !== null) {
      wizardData.value.bloodline_id = null
    }
  })

  return {
    currentStep,
    totalSteps,
    wizardData,
    isChaoticTarnished,
    nextStep,
    previousStep,
    goToStep,
    canProceed,
    resetWizard
  }
}
