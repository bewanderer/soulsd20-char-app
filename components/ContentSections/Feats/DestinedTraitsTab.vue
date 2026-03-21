<template>
  <div class="flex flex-col w-full overflow-hidden main-tab">
    <!-- Header with Fate Points Display -->
    <div class="page-header-bar">
      <h1 class="page-title">
        Destined Traits
      </h1>

      <div class="text-lg fate-points-label" style="position: absolute; right: 1.5rem;">
        Fate Points: <span class="fate-points-value">{{ spentFatePoints }}/{{ effectiveTotalFatePoints }}</span>
        <span v-if="playerStore.TemporaryFatePoints > 0" class="text-sm ml-2 temporary-fate-indicator">
          (+{{ playerStore.TemporaryFatePoints }} from DW17)
        </span>
      </div>
    </div>

    <!-- Two-column layout -->
    <div class="flex destined-traits-content-wrapper">
      <!-- Left Panel: List -->
      <div class="flex flex-col w-1/2 border-r overflow-auto destined-traits-panel-left">
        <!-- Filters -->
        <div class="sticky top-0 p-4 w-full flex flex-col justify-center font-semibold z-10 border-b filter-panel">
          <!-- Search -->
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search..."
            class="w-full px-3 py-2 rounded mb-4 search-input-field"
          />

          <!-- Filters -->
          <div class="flex flex-col space-y-2">
            <!-- View Mode Filter -->
            <select v-model="viewMode" class="px-3 py-2 rounded filter-select">
              <option value="all">All Traits</option>
              <option value="obtained">Obtained Only</option>
              <option value="not_obtained">Not Obtained</option>
            </select>

            <!-- Cost Filter -->
            <select v-model="costFilter" class="px-3 py-2 rounded filter-select">
              <option value="all">All Costs</option>
              <option value="1">Cost: 1</option>
              <option value="2">Cost: 2</option>
              <option value="3">Cost: 3</option>
              <option value="4">Cost: 4</option>
              <option value="5+">Cost: 5+</option>
            </select>
          </div>
        </div>

        <!-- List Display -->
        <div class="flex flex-col space-y-2 p-4">
          <button
            v-for="trait in filteredTraits"
            :key="trait.id"
            class="flex justify-between items-center w-full rounded py-2 px-3 transition-colors cursor-pointer"
            :class="getTraitColorClass(trait)"
            @click="selectedTrait = trait"
          >
            <div class="flex flex-col items-start">
              <span class="font-bold">{{ trait.name }}</span>
              <span class="text-sm">Cost: {{ trait.name.trim().toLowerCase() === 'limitless' ? '600 souls' : getTraitCost(trait) + ' fate point(s)' }}</span>
            </div>

            <div class="flex items-center space-x-2">
              <span v-if="isObtained(trait)" class="obtained-badge text-xs px-2 py-1 rounded">Obtained</span>
            </div>
          </button>

          <div v-if="filteredTraits.length === 0" class="empty-state italic text-center py-8">
            No traits found
          </div>
        </div>
      </div>

      <!-- Right Panel: Detail Panel -->
      <div class="w-1/2 overflow-auto p-4 destined-traits-panel-right">
        <div v-if="selectedTrait" class="flex flex-col space-y-4">
          <!-- Trait Name -->
          <div class="flex items-center gap-2">
            <h2 class="text-2xl font-bold detail-heading">
              {{ getTraitWithModifications(selectedTrait).name }}
            </h2>
            <span v-if="isCustomized(selectedTrait)" class="modified-badge text-sm font-semibold" title="This trait has custom modifications">
              [MODIFIED]
            </span>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2">
            <button
              v-if="!isObtained(selectedTrait)"
              @click="obtain(selectedTrait)"
              :disabled="!canObtain"
              class="px-4 py-2 rounded obtain-btn"
              :class="canObtain ? 'obtain-btn-enabled' : 'obtain-btn-disabled cursor-not-allowed'"
            >
              Obtain
            </button>

            <button
              v-if="isObtained(selectedTrait)"
              @click="unobtain(selectedTrait)"
              class="px-4 py-2 unobtain-btn rounded"
            >
              Unobtain
            </button>

            <button
              @click="showEditModal = true"
              class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Edit
            </button>

            <!-- Resume button for postponed Protege selections -->
            <button
              v-if="hasPostponedSelection(selectedTrait)"
              @click="resumeProtegeSelection(selectedTrait)"
              class="px-4 py-2 resume-btn rounded"
            >
              Resume Selection
            </button>
          </div>

          <!-- Worthless Husk Counter (only show if trait is Worthless Husk and obtained) -->
          <div v-if="isObtained(selectedTrait) && selectedTrait.name === 'Worthless Husk'" class="worthless-husk-container">
            <span class="worthless-husk-label">Stack Count:</span>
            <div class="worthless-husk-controls">
              <button
                @click="decrementWorthlessHusk"
                class="status-button"
                :disabled="store.WorthlessHuskCount <= 1"
              >
                -
              </button>
              <button
                @click="incrementWorthlessHusk"
                class="status-button"
              >
                +
              </button>
            </div>
            <span class="worthless-husk-value">{{ store.WorthlessHuskCount }}</span>
            <span class="worthless-husk-calculation">({{ store.WorthlessHuskCount }} × -1 Fate Point = {{ -store.WorthlessHuskCount }} FP)</span>
          </div>

          <!-- Trait Details -->
          <div class="bg-white rounded p-4 text-charcoal">
            <div class="flex flex-col space-y-2">
              <div><strong>Cost:</strong> {{ selectedTrait.name.trim().toLowerCase() === 'limitless' ? '600 souls' : (getTraitWithModifications(selectedTrait).cost || 1) + ' Fate Point(s)' }}</div>
              <div class="mt-4"><strong>Description:</strong></div>
              <div>{{ getTraitWithModifications(selectedTrait).description }}</div>
            </div>
          </div>

          <!-- Reset to Default Button (if customized) -->
          <button
            v-if="isCustomized(selectedTrait)"
            @click="resetToDefault(selectedTrait)"
            class="px-4 py-2 reset-btn rounded"
          >
            Reset to Default
          </button>
        </div>

        <div v-else class="empty-state italic text-center py-8">
          Select a trait to view details
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal && selectedTrait" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" @click.self="showEditModal = false">
      <div class="modal-content rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold modal-heading">Edit {{ selectedTrait.name }}</h2>
          <button @click="showEditModal = false" class="modal-close-btn text-2xl">&times;</button>
        </div>

        <div class="space-y-4">
          <!-- Cost -->
          <div>
            <label class="block modal-label mb-2">Fate Point Cost</label>
            <input
              v-model.number="editForm.cost"
              type="number"
              min="0"
              class="w-full px-3 py-2 rounded modal-input"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block modal-label mb-2">Description</label>
            <textarea
              v-model="editForm.description"
              rows="4"
              class="w-full px-3 py-2 rounded modal-input"
            ></textarea>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2 pt-4">
            <button
              @click="saveModifications"
              class="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save Changes
            </button>
            <button
              @click="showEditModal = false"
              class="px-4 py-2 cancel-btn rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cross-Tree Feat Selection Modal (for Protege resumption) -->
    <CrossTreeFeatSelectionModal
      :isOpen="showCrossTreeModal"
      :modalType="currentModalType"
      :availableTrees="currentModalAvailableTrees"
      @confirm="handleModalConfirm"
      @postpone="handleModalPostpone"
      @close="handleModalClose"
    />
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from '@/store/player'
import { useCompendiumStore } from '@/store/compendium'
import CrossTreeFeatSelectionModal from '@/components/Modals/CrossTreeFeatSelectionModal.vue'

const playerStore = usePlayerStore()
const compendiumStore = useCompendiumStore()
const store = playerStore // Alias for template access

const searchQuery = ref('')
const viewMode = ref('all')
const costFilter = ref('all')
const selectedTrait = ref<any>(null)
const showEditModal = ref(false)
const editForm = ref<any>({
  cost: 1,
  description: ''
})

// Cross-tree modal state
const showCrossTreeModal = ref(false)
const currentModalType = ref<any>(null)
const currentModalAvailableTrees = ref<string[]>([])
const isClosingAfterCompletion = ref(false) // Track if modal closed after successful completion

// Watch selectedTrait and populate edit form
watch(selectedTrait, (newTrait) => {
  if (newTrait) {
    const traitWithMods = getTraitWithModifications(newTrait)
    editForm.value = {
      cost: traitWithMods.cost || 1,
      description: traitWithMods.description || ''
    }
  }
})

// Total fate points available
const totalFatePoints = computed(() => playerStore.FatePoints)

// Effective total fate points (includes temporary from DW17)
const effectiveTotalFatePoints = computed(() => {
  return playerStore.FatePoints + playerStore.TemporaryFatePoints
})

// Calculate spent fate points
const spentFatePoints = computed(() => {
  if (!playerStore.ObtainedDestinedTraits) return 0

  return playerStore.ObtainedDestinedTraits.reduce((sum, obtainedTrait) => {
    // Find the trait in compendium to get current modifications
    const compendiumTrait = compendiumStore.DestinyFeats?.find((t: any) => t.id === obtainedTrait.id)
    if (!compendiumTrait) return sum + (obtainedTrait.cost || 1)

    // Limitless doesn't cost fate points - skip it
    const traitName = compendiumTrait.name.trim().toLowerCase()
    if (traitName === 'limitless') {
      return sum // Don't add any fate point cost for Limitless
    }

    // Get trait cost with modifications
    let cost = getTraitCost(compendiumTrait)

    // For Worthless Husk, multiply cost by stack count
    if (compendiumTrait.name === 'Worthless Husk' && playerStore.WorthlessHuskCount > 1) {
      cost = cost * playerStore.WorthlessHuskCount
    }

    return sum + cost
  }, 0)
})

// Check if can obtain (enough fate points - includes temporary + Protege prerequisites)
const canObtain = computed(() => {
  if (!selectedTrait.value) return false

  // Special check for Limitless - requires 600 souls instead of fate points
  const traitName = selectedTrait.value.name.trim().toLowerCase()
  if (traitName === 'limitless') {
    return playerStore.Souls >= 600
  }

  // Check Protege prerequisites
  if (selectedTrait.value.name === 'Protege 2') {
    const hasProtege1 = playerStore.ObtainedDestinedTraits.some((t: any) => t.name === 'Protege 1')
    if (!hasProtege1) return false
  }

  if (selectedTrait.value.name === 'Protege 3') {
    const hasProtege2 = playerStore.ObtainedDestinedTraits.some((t: any) => t.name === 'Protege 2')
    if (!hasProtege2) return false
  }

  const traitCost = getTraitCost(selectedTrait.value)
  return (spentFatePoints.value + traitCost) <= effectiveTotalFatePoints.value
})

// Filtered traits
const filteredTraits = computed(() => {
  let traits = compendiumStore.DestinyFeats || []

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    traits = traits.filter((trait: any) =>
      trait.name.toLowerCase().includes(query)
    )
  }

  // View mode filter
  if (viewMode.value === 'obtained') {
    traits = traits.filter((trait: any) => isObtained(trait))
  } else if (viewMode.value === 'not_obtained') {
    traits = traits.filter((trait: any) => !isObtained(trait))
  }

  // Cost filter
  if (costFilter.value !== 'all') {
    if (costFilter.value === '5+') {
      traits = traits.filter((trait: any) => getTraitCost(trait) >= 5)
    } else {
      const cost = parseInt(costFilter.value)
      traits = traits.filter((trait: any) => getTraitCost(trait) === cost)
    }
  }

  return traits
})

// Check if trait is obtained
function isObtained(trait: any): boolean {
  if (!playerStore.ObtainedDestinedTraits) return false
  return playerStore.ObtainedDestinedTraits.some((t: any) => t.id === trait.id)
}

// Get trait color class based on state
function getTraitColorClass(trait: any): string {
  if (isObtained(trait)) {
    return 'trait-obtained'
  }
  return 'trait-not-obtained'
}

// Get trait with modifications
function getTraitWithModifications(trait: any) {
  if (!trait) return null

  const modifications = playerStore.DestinedTraitModifications?.[trait.id]
  if (!modifications) return trait

  return { ...trait, ...modifications }
}

// Check if trait is customized
function isCustomized(trait: any): boolean {
  if (!trait) return false
  return !!playerStore.DestinedTraitModifications?.[trait.id]
}

// Get trait cost with modifications
function getTraitCost(trait: any): number {
  if (!trait) return 1

  const modifications = playerStore.DestinedTraitModifications?.[trait.id]
  if (modifications && modifications.cost !== undefined) {
    return modifications.cost
  }

  return trait.cost || 1
}

// Worthless Husk counter functions
function incrementWorthlessHusk() {
  playerStore.WorthlessHuskCount++
  playerStore.save()
}

function decrementWorthlessHusk() {
  if (playerStore.WorthlessHuskCount > 1) {
    playerStore.WorthlessHuskCount--
    playerStore.save()
  }
}

// Obtain trait
function obtain(trait: any) {
  if (!trait || !canObtain.value) return

  // Special handling for Limitless - costs 600 souls instead of fate points
  const traitName = trait.name.trim().toLowerCase()
  if (traitName === 'limitless') {
    if (playerStore.Souls < 600) {
      alert('You need at least 600 souls to obtain Limitless.')
      return
    }
    playerStore.Souls -= 600
    console.log('Limitless: Deducted 600 souls, remaining:', playerStore.Souls)
  }

  if (!playerStore.ObtainedDestinedTraits) {
    playerStore.ObtainedDestinedTraits = []
  }

  // Use the current cost (including modifications)
  const currentCost = getTraitCost(trait)

  playerStore.ObtainedDestinedTraits.push({
    id: trait.id,
    name: trait.name,
    cost: currentCost
  })

  // Initialize Worthless Husk counter if this is the Worthless Husk trait
  if (trait.name === 'Worthless Husk') {
    playerStore.WorthlessHuskCount = 1
  }

  // Grant retroactive tertiary points if Multi Proficient trait
  if (trait.name === 'Multi Proficient') {
    // Ensure WeaponProficiencyPoints is initialized
    if (!playerStore.WeaponProficiencyPoints) {
      playerStore.WeaponProficiencyPoints = {
        total: playerStore.Level,
        baseFromLevel: playerStore.Level,
        customBonus: 0
      }
    }

    // Set tracking flag
    playerStore.HasMultiProficient = true

    // Grant retroactive points only if not already granted
    if (playerStore.MultiProficientRetroactivePoints === 0) {
      const retroactivePoints = playerStore.calculateMultiProficientRetroactive()
      playerStore.MultiProficientRetroactivePoints = retroactivePoints

      // Add points to available pool
      playerStore.WeaponProficiencyPoints.customBonus += retroactivePoints
      playerStore.WeaponProficiencyPoints.total = playerStore.WeaponProficiencyPoints.baseFromLevel + playerStore.WeaponProficiencyPoints.customBonus

      console.log(`Multi Proficient: Granted ${retroactivePoints} retroactive tertiary points`)
    }
  }

  // Trigger Protege 1 lv3 modal IMMEDIATELY when obtaining Protege 1
  if (trait.name === 'Protege 1' && !playerStore.ProtegeFlags.protege_1_lv3_obtained) {
    currentModalType.value = 'protege_1_lv3'
    currentModalAvailableTrees.value = [] // All trees available for lv3
    showCrossTreeModal.value = true
  }

  // Check for retroactive Protege 2/3 triggers when obtaining them
  if (trait.name === 'Protege 2' && !playerStore.ProtegeFlags.protege_2_used && !playerStore.ProtegeFlags.protege_2_postponed) {
    const availableTrees = playerStore.getProtegeAvailableTrees(15) // lv15 milestone
    if (availableTrees.length > 0) {
      currentModalType.value = 'protege_2'
      currentModalAvailableTrees.value = availableTrees
      showCrossTreeModal.value = true
    }
  }

  if (trait.name === 'Protege 3' && !playerStore.ProtegeFlags.protege_3_used && !playerStore.ProtegeFlags.protege_3_postponed) {
    const availableTrees = playerStore.getProtegeAvailableTrees(20) // lv20 milestone
    if (availableTrees.length > 0) {
      currentModalType.value = 'protege_3'
      currentModalAvailableTrees.value = availableTrees
      showCrossTreeModal.value = true
    }
  }

  playerStore.save()
}

// Unobtain trait
function unobtain(trait: any) {
  if (!trait || !playerStore.ObtainedDestinedTraits) return

  const index = playerStore.ObtainedDestinedTraits.findIndex((t: any) => t.id === trait.id)
  if (index !== -1) {
    // Check Protege hierarchy: cannot remove Protege 1 if Protege 2 is obtained
    if (trait.name === 'Protege 1') {
      const hasProtege2 = playerStore.ObtainedDestinedTraits.some((t: any) => t.name === 'Protege 2')
      if (hasProtege2) {
        alert('Cannot remove Protege 1 while Protege 2 is obtained. Remove Protege 2 first.')
        return
      }
    }

    // Check Protege hierarchy: cannot remove Protege 2 if Protege 3 is obtained
    if (trait.name === 'Protege 2') {
      const hasProtege3 = playerStore.ObtainedDestinedTraits.some((t: any) => t.name === 'Protege 3')
      if (hasProtege3) {
        alert('Cannot remove Protege 2 while Protege 3 is obtained. Remove Protege 3 first.')
        return
      }
    }

    // Check if this is a Protege or Dual Wielding trait and remove associated feats
    if (trait.name === 'Protege 1' || trait.name === 'Protege 2' || trait.name === 'Protege 3') {
      // Find all feats acquired through this Protege trait
      const featsToRemove = playerStore.ObtainedWeaponProfFeats.filter((f: any) =>
        f.is_greyed_out && f.acquisition_note && f.acquisition_note.includes(trait.name)
      )

      if (featsToRemove.length > 0) {
        const featNames = featsToRemove.map((f: any) => f.name).join(', ')
        const confirmed = confirm(
          `Removing ${trait.name} will also remove ${featsToRemove.length} feat(s) acquired through it:\n\n${featNames}\n\nContinue?`
        )
        if (!confirmed) return
      }

      // Remove all associated feats
      featsToRemove.forEach((feat: any) => {
        playerStore.unobtainWeaponProfFeat(feat.feat_id)
      })
    }

    // Remove the trait
    playerStore.ObtainedDestinedTraits.splice(index, 1)

    // Special handling for Limitless - refund 600 souls
    const traitName = trait.name.trim().toLowerCase()
    if (traitName === 'limitless') {
      playerStore.Souls += 600
      console.log('Limitless: Refunded 600 souls, new total:', playerStore.Souls)
    }

    // Reset Protege flags when removing Protege traits
    if (trait.name === 'Protege 1') {
      playerStore.ProtegeFlags.protege_1_lv3_obtained = false
      playerStore.ProtegeFlags.protege_1_lv5_used = false
      playerStore.ProtegeFlags.protege_1_lv5_postponed = false
      playerStore.ProtegeFlags.protege_1_postponed_trees = []
    } else if (trait.name === 'Protege 2') {
      playerStore.ProtegeFlags.protege_2_used = false
      playerStore.ProtegeFlags.protege_2_postponed = false
      playerStore.ProtegeFlags.protege_2_postponed_trees = []
    } else if (trait.name === 'Protege 3') {
      playerStore.ProtegeFlags.protege_3_used = false
      playerStore.ProtegeFlags.protege_3_postponed = false
      playerStore.ProtegeFlags.protege_3_postponed_trees = []
    }

    // Reset Worthless Husk counter if this is the Worthless Husk trait
    if (trait.name === 'Worthless Husk') {
      playerStore.WorthlessHuskCount = 0
    }

    // Remove retroactive tertiary points if Multi Proficient trait
    if (trait.name === 'Multi Proficient') {
      // Remove tracking flag
      playerStore.HasMultiProficient = false

      // Remove all retroactive points
      const pointsToRemove = playerStore.MultiProficientRetroactivePoints
      if (pointsToRemove > 0 && playerStore.WeaponProficiencyPoints) {
        playerStore.WeaponProficiencyPoints.customBonus -= pointsToRemove
        playerStore.WeaponProficiencyPoints.total = playerStore.WeaponProficiencyPoints.baseFromLevel + playerStore.WeaponProficiencyPoints.customBonus
      }

      // Reset counter
      playerStore.MultiProficientRetroactivePoints = 0
      console.log(`Multi Proficient: Removed ${pointsToRemove} retroactive tertiary points`)
    }

    playerStore.save()
  }
}

// Reset to default
function resetToDefault(trait: any) {
  if (!trait || !isCustomized(trait)) return

  const confirmReset = confirm(
    `Warning, you are about to reset "${trait.name}" to the compendium default. Are you sure you want to continue?`
  )

  if (!confirmReset) return

  if (playerStore.clearDestinedTraitModification) {
    playerStore.clearDestinedTraitModification(trait.id)
  }
}

// Save modifications
function saveModifications() {
  if (!selectedTrait.value) return

  const modifications = {
    cost: editForm.value.cost,
    description: editForm.value.description
  }

  if (playerStore.setDestinedTraitModification) {
    playerStore.setDestinedTraitModification(selectedTrait.value.id, modifications)
  }

  showEditModal.value = false
}

// Check if trait has postponed Protege selection
function hasPostponedSelection(trait: any): boolean {
  if (!trait || !isObtained(trait)) return false

  // Check if postponed AND if there are valid trees available NOW
  if (trait.name === 'Protege 1' && playerStore.ProtegeFlags.protege_1_lv5_postponed) {
    const availableTrees = playerStore.getProtegeAvailableTrees(10) // lv10 milestone
    return availableTrees.length > 0
  }
  if (trait.name === 'Protege 2' && playerStore.ProtegeFlags.protege_2_postponed) {
    const availableTrees = playerStore.getProtegeAvailableTrees(15) // lv15 milestone
    return availableTrees.length > 0
  }
  if (trait.name === 'Protege 3' && playerStore.ProtegeFlags.protege_3_postponed) {
    const availableTrees = playerStore.getProtegeAvailableTrees(20) // lv20 milestone
    return availableTrees.length > 0
  }
  return false
}

// Resume postponed Protege selection
function resumeProtegeSelection(trait: any) {
  if (!trait) return

  let modalType: string | null = null

  if (trait.name === 'Protege 1' && playerStore.ProtegeFlags.protege_1_lv5_postponed) {
    modalType = 'protege_1_lv5'
    currentModalAvailableTrees.value = playerStore.resumeProtegeSelection('protege_1_lv5')
  } else if (trait.name === 'Protege 2' && playerStore.ProtegeFlags.protege_2_postponed) {
    modalType = 'protege_2'
    currentModalAvailableTrees.value = playerStore.resumeProtegeSelection('protege_2')
  } else if (trait.name === 'Protege 3' && playerStore.ProtegeFlags.protege_3_postponed) {
    modalType = 'protege_3'
    currentModalAvailableTrees.value = playerStore.resumeProtegeSelection('protege_3')
  }

  if (modalType) {
    currentModalType.value = modalType
    showCrossTreeModal.value = true
  }
}

// Handle modal confirmation
function handleModalConfirm(selection: { featId?: number, choseFatePoint?: boolean, treeId?: string }) {
  console.log(`[DESTINED] handleModalConfirm called. modalType:`, currentModalType.value, 'selection:', selection)
  const modalType = currentModalType.value

  if (modalType && modalType.startsWith('protege')) {
    const triggers = playerStore.handleProtegeSelection(modalType, selection, selection.treeId)

    // Process returned triggers by opening their modals
    if (triggers && (triggers.dwTriggers.length > 0 || triggers.musicalTriggers.length > 0)) {
      console.log(`[DESTINED] Protege selection triggered:`, triggers)

      // Process DW triggers first (immediate)
      if (triggers.dwTriggers.length > 0) {
        const dwTrigger = triggers.dwTriggers[0] // Process first DW trigger
        console.log(`[DESTINED] Opening DW modal:`, dwTrigger)

        // Set flag to prevent closing
        isClosingAfterCompletion.value = true

        // Switch to DW modal
        currentModalType.value = dwTrigger
        currentModalAvailableTrees.value = [] // DW doesn't need tree restriction
        // Modal stays open, just switches type
        return
      }

      // Process Musical triggers if no DW triggers
      if (triggers.musicalTriggers.length > 0) {
        const musicalTrigger = triggers.musicalTriggers[0] // Process first Musical trigger
        console.log(`[DESTINED] Opening Musical modal:`, musicalTrigger)

        // Set flag to prevent closing
        isClosingAfterCompletion.value = true

        // Switch to Musical modal
        currentModalType.value = musicalTrigger
        currentModalAvailableTrees.value = [] // Musical doesn't need tree restriction
        // Modal stays open, just switches type
        return
      }
    }
  }

  // After Protege 1 lv3 completes, check for retroactive lv10 milestones
  if (modalType === 'protege_1_lv3') {
    console.log(`[DESTINED] Protege 1 lv3 completed. Checking for lv10 retroactive trigger...`)
    console.log(`[DESTINED] ProtegeFlags:`, JSON.parse(JSON.stringify(playerStore.ProtegeFlags)))
    console.log(`[DESTINED] lv5_used:`, playerStore.ProtegeFlags.protege_1_lv5_used)
    console.log(`[DESTINED] lv5_postponed:`, playerStore.ProtegeFlags.protege_1_lv5_postponed)

    if (!playerStore.ProtegeFlags.protege_1_lv5_used && !playerStore.ProtegeFlags.protege_1_lv5_postponed) {
      const availableTrees = playerStore.getProtegeAvailableTrees(10) // lv10 milestone
      console.log(`[DESTINED] Available lv10 trees:`, availableTrees)

      if (availableTrees.length > 0) {
        // Trigger lv5 modal immediately after lv3 completes
        console.log(`[DESTINED] Triggering Protege 1 lv5 modal retroactively!`)

        // Set flag to prevent handleModalClose from closing the modal
        isClosingAfterCompletion.value = true

        currentModalType.value = 'protege_1_lv5'
        currentModalAvailableTrees.value = availableTrees
        // Don't close modal, just switch to lv5
        return
      } else {
        console.log(`[DESTINED] No lv10 trees available, skipping lv5 trigger`)
      }
    } else {
      console.log(`[DESTINED] lv5 already used or postponed, skipping trigger`)
    }
  }

  // Set flag before closing (normal completion)
  isClosingAfterCompletion.value = true

  // Close modal
  console.log(`[DESTINED] Closing modal`)
  showCrossTreeModal.value = false
  currentModalType.value = null
  currentModalAvailableTrees.value = []
}

// Handle modal postpone
function handleModalPostpone() {
  console.log(`[DESTINED] handleModalPostpone called`)
  const modalType = currentModalType.value

  if (modalType && modalType.startsWith('protege')) {
    // Re-postpone with same trees
    playerStore.postponeProtegeSelection(modalType, currentModalAvailableTrees.value)
  }

  // Set flag before closing (postpone is a valid completion)
  isClosingAfterCompletion.value = true

  // Close modal
  showCrossTreeModal.value = false
  currentModalType.value = null
  currentModalAvailableTrees.value = []
}

// Handle modal close
function handleModalClose() {
  console.log(`[DESTINED] handleModalClose called. isClosingAfterCompletion:`, isClosingAfterCompletion.value)

  // If modal closed after successful completion (confirm/postpone), skip closure logic
  if (isClosingAfterCompletion.value) {
    console.log(`[DESTINED] Modal closed after completion, skipping closure logic`)
    isClosingAfterCompletion.value = false // Reset flag for next modal
    return
  }

  console.log(`[DESTINED] Modal closed WITHOUT completion`)

  // For Protege 1 lv3, cannot close without completing - remove Protege 1 if closed
  if (currentModalType.value === 'protege_1_lv3') {
    const confirmRemove = confirm(
      'Closing this modal without selecting a feat will remove Protege 1.\n\nAre you sure you want to close?'
    )
    if (confirmRemove) {
      // Remove Protege 1
      const protege1 = playerStore.ObtainedDestinedTraits.find((t: any) => t.name === 'Protege 1')
      if (protege1) {
        const index = playerStore.ObtainedDestinedTraits.findIndex((t: any) => t.id === protege1.id)
        if (index !== -1) {
          playerStore.ObtainedDestinedTraits.splice(index, 1)
          playerStore.save()
        }
      }
    } else {
      // Don't close modal
      return
    }
  }

  showCrossTreeModal.value = false
  currentModalType.value = null
  currentModalAvailableTrees.value = []
}
</script>

<style scoped>
/* Custom scrollbar */
.overflow-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #2a6c24;
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: #3a8c34;
}

/* Search input */
.search-input-field {
  background: var(--color-bg-tertiary) !important;
  color: var(--color-text-primary) !important;
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
}

.search-input-field:focus {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
  outline: none;
}

/* Filter selects */
.filter-select {
  background: var(--color-bg-tertiary) !important;
  color: var(--color-text-primary) !important;
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
}

/* Trait list items - add borders for SoulsBorne aesthetic */
.flex.justify-between.items-center.w-full.rounded.py-2.px-3 {
  border: var(--border-width-thin) solid var(--color-border-primary);
  margin-bottom: var(--spacing-xs);
}

.flex.justify-between.items-center.w-full.rounded.py-2.px-3:hover {
  border-color: var(--color-accent-gold-dim);
}

/* Edit and Save buttons - standardized green */
button.bg-green-600 {
  background: var(--color-green-rgba-medium) !important;
  color: #ffffff;
  border: var(--border-width-thin) solid var(--color-success);
  transition: var(--transition-hover);
}

button.bg-green-600:hover {
  background: var(--color-green-rgba-strong) !important;
  box-shadow: 0 0 15px var(--color-green-rgba-medium);
}

button.bg-green-600.hover\:bg-green-700 {
  background: var(--color-green-rgba-medium) !important;
  color: #ffffff;
}

button.bg-green-600.hover\:bg-green-700:hover {
  background: var(--color-green-rgba-strong) !important;
  box-shadow: 0 0 15px var(--color-green-rgba-medium);
}

/* Text Classes */
.fate-points-label {
  color: var(--color-text-primary);
}

.fate-points-value {
  color: var(--color-accent-gold-bright);
}

.temporary-fate-indicator {
  color: rgba(100, 150, 255, 0.9);
  font-style: italic;
}

.obtained-badge {
  background: var(--color-gold-primary); /* Pure golden background */
  color: var(--color-bg-tertiary); /* Dark text on golden background */
  border: 1px solid var(--color-gold-dim);
}

.empty-state {
  color: var(--color-text-secondary);
}

/* Filter Panel */
.filter-panel {
  background: var(--color-bg-secondary);
  border-color: var(--color-border-primary);
  color: var(--color-text-primary);
}

.detail-heading {
  color: var(--color-text-primary);
}

.modified-badge {
  color: var(--color-accent-gold-bright);
}

/* Trait List Item States - Vibrant Golden Gradient */
.trait-obtained {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.8), rgba(212, 175, 55, 0.5));
  border: 2px solid var(--color-accent-gold-bright);
  color: #ffffff; /* White text on golden background */
}

.trait-obtained:hover {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.9), rgba(212, 175, 55, 0.6));
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-medium);
  color: #ffffff; /* Keep white text on hover */
}

/* White text for all child elements in obtained traits except badge */
.trait-obtained span:not(.obtained-badge),
.trait-obtained .font-bold:not(.obtained-badge),
.trait-obtained .text-sm:not(.obtained-badge) {
  color: #ffffff;
}

.trait-not-obtained {
  background: transparent;
  color: var(--color-text-primary);
  border: 2px solid var(--color-border-primary);
}

/* Button Classes */
.obtain-btn {
  color: var(--color-text-primary);
}

.obtain-btn-enabled {
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  color: #ffffff;
  transition: var(--transition-hover);
}

.obtain-btn-enabled:hover {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

.obtain-btn-disabled {
  background: var(--color-bg-tertiary);
  color: var(--color-text-disabled);
}

.unobtain-btn {
  background: var(--color-danger);
  color: var(--color-text-primary);
}

.unobtain-btn:hover {
  background: #a00003;
  box-shadow: 0 0 10px rgba(220, 20, 60, 0.4);
}

.reset-btn {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.reset-btn:hover {
  background: #2a2a2a;
}

.resume-btn {
  background: rgba(100, 150, 255, 0.3);
  border: 2px solid rgba(100, 150, 255, 0.6);
  color: #ffffff;
  transition: var(--transition-hover);
}

.resume-btn:hover {
  background: rgba(100, 150, 255, 0.5);
  border-color: rgba(100, 150, 255, 0.8);
  box-shadow: 0 0 15px rgba(100, 150, 255, 0.4);
}

/* Modal Classes */
.modal-content {
  background: var(--color-bg-secondary);
}

.modal-heading {
  color: var(--color-text-primary);
}

.modal-close-btn {
  color: var(--color-text-secondary);
}

.modal-close-btn:hover {
  color: var(--color-text-primary);
}

.modal-label {
  color: var(--color-text-primary);
}

.modal-input {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
}

.modal-input:focus {
  outline: none;
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
}

.cancel-btn {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.cancel-btn:hover {
  background: #2a2a2a;
}

/* Independent scroll for split layout */
.destined-traits-content-wrapper {
  height: calc(100vh - 190px);
  width: 100%;
}

.destined-traits-panel-left,
.destined-traits-panel-right {
  height: 100%;
}

/* Worthless Husk Counter Styling */
.worthless-husk-container {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-sm);
  padding: 12px 16px;
  color: var(--color-text-primary);
  transition: var(--transition-hover);
}

.worthless-husk-container:hover {
  border-color: var(--color-accent-gold);
  box-shadow: var(--shadow-gold-soft);
}

.worthless-husk-label {
  font-weight: 600;
  color: var(--color-text-primary);
}

.worthless-husk-controls {
  display: flex;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding-right: 12px;
}

.worthless-husk-controls .status-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-btn-primary-border);
  border: none;
  border-right: 1px solid rgba(0, 0, 0, 0.3);
  color: #ffffff;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1em;
  transition: var(--transition-hover);
}

.worthless-husk-controls .status-button:last-child {
  border-right: none;
}

.worthless-husk-controls .status-button:hover:not(:disabled) {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

.worthless-husk-controls .status-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--color-bg-secondary);
}

.worthless-husk-value {
  font-weight: bold;
  font-size: 1.1em;
  min-width: 24px;
  text-align: center;
  color: var(--color-accent-gold-bright);
}

.worthless-husk-calculation {
  font-size: 0.9em;
  color: var(--color-text-secondary);
  font-style: italic;
}
</style>
