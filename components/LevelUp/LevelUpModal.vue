<template>
  <div v-if="playerStore.PendingLevelUp?.active" class="modal-overlay" @click.self="handleOverlayClick">
    <div class="modal-container level-up-modal">
      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">{{ modalTitle }}</h2>
        <button v-if="!isMandatory" @click="closeModal" class="modal-close-btn">×</button>
      </div>

      <!-- Progress Indicator -->
      <div class="step-progress">
        <div
          :class="['step-indicator', { active: currentStep === 1, completed: step1Complete }]"
          @click="gotoStep(1)"
        >
          Step 1: Stats & HP
        </div>
        <div
          :class="['step-indicator', { active: currentStep === 2, completed: step2Complete }]"
          @click="gotoStep(2)"
        >
          Step 2: Proficiency
        </div>
      </div>

      <!-- Step 1: HP & Stats & Knowledge -->
      <div v-if="currentStep === 1" class="modal-content">
        <LevelUpStep1 />
      </div>

      <!-- Step 2: Proficiency Points -->
      <div v-if="currentStep === 2" class="modal-content">
        <LevelUpStep2 />
      </div>

      <!-- Navigation -->
      <div class="modal-footer">
        <button
          v-if="currentStep === 2"
          @click="currentStep = 1"
          class="btn-neutral"
        >
          Previous
        </button>

        <button
          v-if="currentStep === 1"
          @click="nextStep"
          :disabled="!step1Complete"
          class="btn-primary"
        >
          Next
        </button>

        <button
          v-if="currentStep === 2"
          @click="completeLevelUp"
          :disabled="!step2Complete"
          class="btn-golden"
        >
          Complete Level Up
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from '@/store/player'
import LevelUpStep1 from './LevelUpStep1.vue'
import LevelUpStep2 from './LevelUpStep2.vue'

const playerStore = usePlayerStore()
const currentStep = ref(1)

// Check if this is a mandatory level-up (from character creation)
const isMandatory = computed(() => {
  return playerStore.PendingLevelUp?.mandatory === true
})

// Dynamic title based on context
const modalTitle = computed(() => {
  if (isMandatory.value) {
    return 'Complete Character Creation - Level 1'
  }
  return `Level Up to ${playerStore.PendingLevelUp?.targetLevel}`
})

const step1Complete = computed(() => {
  const pending = playerStore.PendingLevelUp
  if (!pending) return false

  const hasStatSelection = pending.selectedStat !== null
  const hasKnowledgeSelection = pending.isEvenLevel || pending.selectedKnowledge !== null

  return hasStatSelection && hasKnowledgeSelection
})

const step2Complete = computed(() => {
  const pending = playerStore.PendingLevelUp
  if (!pending) return false

  return pending.primarySpent === pending.primaryToSpend &&
         pending.secondarySpent === pending.secondaryToSpend &&
         pending.tertiarySpent === pending.tertiaryToSpend
})

function gotoStep(step: number) {
  if (step === 1 || (step === 2 && step1Complete.value)) {
    currentStep.value = step
  }
}

function nextStep() {
  if (step1Complete.value) {
    currentStep.value = 2
  }
}

function completeLevelUp() {
  if (step2Complete.value) {
    // Mark as completed before calling completeLevelUp
    if (playerStore.PendingLevelUp) {
      playerStore.PendingLevelUp.completed = true
    }
    playerStore.completeLevelUp()
    // Reset to step 1 for next time
    currentStep.value = 1
  }
}

function handleOverlayClick() {
  // Prevent closing by clicking overlay if mandatory
  if (!isMandatory.value) {
    closeModal()
  }
}

function closeModal() {
  // Prevent closing if mandatory (character creation Level 1)
  if (isMandatory.value) {
    return
  }

  // Reset all choices except HP roll (to prevent HP spam)
  if (playerStore.PendingLevelUp) {
    // Reset the state
    playerStore.resetLevelUpStep1()
    playerStore.resetLevelUpStep2()
    // Close the modal
    playerStore.PendingLevelUp.active = false
    playerStore.save()
  }
  // Reset to step 1 for next time
  currentStep.value = 1
}
</script>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* Modal Container */
.modal-container {
  background: var(--color-bg-secondary);
  border: var(--border-width-thick) solid var(--color-accent-gold);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 0 30px var(--color-gold-rgba-medium);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--padding-lg);
  border-bottom: var(--border-width-thin) solid var(--color-border-primary);
  background: var(--color-bg-tertiary);
}

.modal-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-accent-gold-bright);
  margin: 0;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
  line-height: 1;
  padding: 0;
  width: 2rem;
  height: 2rem;
}

.modal-close-btn:hover {
  color: var(--color-accent-gold-bright);
}

/* Step Progress Indicator */
.step-progress {
  display: flex;
  padding: var(--padding-md);
  background: var(--color-bg-tertiary);
  border-bottom: var(--border-width-thin) solid var(--color-border-primary);
  gap: var(--padding-sm);
}

.step-indicator {
  flex: 1;
  padding: var(--padding-sm) var(--padding-md);
  text-align: center;
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
  color: var(--color-text-secondary);
}

.step-indicator.active {
  background: var(--color-accent-gold);
  color: var(--color-bg-primary);
  border-color: var(--color-accent-gold-bright);
  font-weight: var(--font-weight-bold);
}

.step-indicator.completed {
  border-color: var(--color-accent-gold);
  color: var(--color-text-primary);
}

.step-indicator:hover:not(.active) {
  border-color: var(--color-accent-gold);
  background: var(--color-bg-tertiary);
}

/* Modal Content */
.modal-content {
  padding: var(--padding-lg);
  flex: 1;
  overflow-y: auto;
}

/* Modal Footer */
.modal-footer {
  display: flex;
  justify-content: space-between;
  padding: var(--padding-lg);
  border-top: var(--border-width-thin) solid var(--color-border-primary);
  background: var(--color-bg-tertiary);
  gap: var(--padding-md);
}

/* Button Styles */
.btn-neutral,
.btn-primary,
.btn-golden {
  padding: var(--padding-sm) var(--padding-lg);
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: var(--transition-fast);
  border: var(--border-width-thin) solid transparent;
}

.btn-neutral {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border-color: var(--color-border-primary);
}

.btn-neutral:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-accent-gold);
}

.btn-primary {
  background: var(--color-btn-primary);
  color: #ffffff;
  border-color: var(--color-btn-primary-border);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-btn-primary-hover);
  box-shadow: var(--shadow-gold-soft);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-golden {
  background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%);
  color: #1a1a1a;
  font-weight: var(--font-weight-bold);
  border: 2px solid #B8941C;
}

.btn-golden:hover:not(:disabled) {
  background: linear-gradient(135deg, #FFD700 0%, #FFF4A3 100%);
  box-shadow: 0 0 15px var(--color-gold-rgba-strong);
  transform: translateY(-2px);
}

.btn-golden:active:not(:disabled) {
  transform: translateY(0);
}

.btn-golden:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
