<template>
  <div class="flex flex-col w-full overflow-hidden main-tab">
    <!-- Header with Proficiency Points Display -->
    <div class="page-header-bar" style="position: relative;">
      <h1 class="page-title">
        Weapon Proficiencies
      </h1>

      <div v-if="!editingBonus" class="points-display">
        <span class="point-type">Total Points: <span class="points-value">{{ spentPoints }}/{{ totalPoints }}</span></span>
        <span class="point-breakdown">(Level: {{ baseFromLevel }} + Bonus: {{ customBonus }})</span>
        <button @click="startEditBonus" class="btn-neutral-small">
          Edit Bonus
        </button>
      </div>

      <div v-else class="points-editor">
        <span class="editor-label">Bonus Points:</span>
        <input
          v-model.number="bonusPointsInput"
          type="number"
          min="0"
          class="points-input-field"
        />
        <span class="editor-calc">(Total: {{ playerStore.Level + bonusPointsInput }})</span>
        <button @click="saveBonusPoints" class="btn-primary-small">Save</button>
        <button @click="cancelEditBonus" class="btn-warning-small">Cancel</button>
      </div>
    </div>

    <!-- Two-column layout -->
    <div class="flex weapon-prof-content-wrapper">
      <!-- Left Panel: Tree List -->
      <div class="flex flex-col w-1/2 border-r overflow-auto weapon-prof-panel-left">
        <!-- Filters -->
        <div class="sticky top-0 p-4 w-full flex flex-col justify-center font-semibold z-10 border-b filter-panel">
          <!-- Filters -->
          <div class="flex flex-col space-y-2">
            <!-- View Mode Filter -->
            <select v-model="viewMode" class="px-3 py-2 rounded filter-select">
              <option value="all">All Proficiencies</option>
              <option value="obtained">Obtained Only</option>
            </select>

            <!-- Tree Filter -->
            <select v-model="treeFilter" class="px-3 py-2 rounded filter-select">
              <option value="all">All Trees</option>
              <option v-for="tree in weaponTrees" :key="tree.id" :value="tree.id">
                {{ tree.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Tree Display -->
        <div class="flex flex-col space-y-2 p-4">
          <div v-for="tree in filteredTrees" :key="tree.id" class="border border-gray-600 rounded">
            <!-- Tree Header (Collapsible) -->
            <button
              @click="toggleTree(tree.id)"
              class="w-full flex justify-between items-center p-3 rounded-t"
              :class="getTreeHeaderClass(tree.id)"
            >
              <div class="flex items-center space-x-2">
                <span>{{ expandedTrees.includes(tree.id) ? '▼' : '►' }}</span>
                <span class="font-bold">{{ tree.name }}</span>
                <span class="text-sm tree-points">({{ getPointsInTree(tree.id) }}/{{ getTreeMax(tree.id) }})</span>
              </div>
            </button>

            <!-- Tree Feats (Collapsible Content) -->
            <div v-if="expandedTrees.includes(tree.id)" class="flex flex-col space-y-1 p-2">
              <button
                v-for="feat in getFeatsForTree(tree.id)"
                :key="feat.id"
                class="flex items-center justify-between p-2 rounded feat-item transition-colors cursor-pointer"
                :class="getFeatColorClass(feat)"
                @click="selectFeat(feat)"
              >
                <div class="flex items-center space-x-2">
                  <span>{{ isObtained(feat) ? '✓' : '□' }}</span>
                  <span>Lv{{ feat.level }}: {{ feat.name }}</span>
                </div>

                <!-- Right-aligned content: acquisition note or locked text -->
                <div class="flex items-center">
                  <span v-if="isGreyedOut(feat)" class="acquisition-note">
                    {{ getAcquisitionNote(feat) }}
                  </span>
                  <span v-else-if="!canObtainFeat(feat) && !isObtained(feat)" class="text-xs locked-text">
                    Locked
                  </span>
                </div>
              </button>

              <div v-if="getFeatsForTree(tree.id).length === 0" class="empty-state italic text-center py-2">
                No feats available
              </div>
            </div>
          </div>

          <div v-if="filteredTrees.length === 0" class="empty-state italic text-center py-8">
            No trees found
          </div>
        </div>
      </div>

      <!-- Right Panel: Detail Panel -->
      <div class="w-1/2 overflow-auto p-4 weapon-prof-panel-right">
        <!-- Tree Summary (when tree is selected, no feat selected) -->
        <div v-if="selectedTree && !selectedFeat" class="flex flex-col space-y-4">
          <!-- Tree Name -->
          <h2 class="text-2xl font-bold feat-name">
            {{ getTreeName(selectedTree) }}
          </h2>

          <!-- Tree Points Info -->
          <div class="info-panel rounded p-4">
            <div class="flex flex-col space-y-2">
              <div class="text-lg">
                <strong>Points in this Tree:</strong>
                <span class="points-value ml-2">{{ getPointsInTree(selectedTree) }} / {{ getTreeMax(selectedTree) }}</span>
              </div>
            </div>
          </div>

          <!-- Point Investment UI for Tree -->
          <div class="info-panel rounded p-4">
            <div class="flex flex-col space-y-2">
              <div class="panel-label font-bold">Edit Points in {{ getTreeName(selectedTree) }}:</div>
              <div class="flex items-center space-x-2">
                <button
                  @click="decrementTreePoints(selectedTree)"
                  :disabled="!canDecrementPoints(selectedTree)"
                  class="px-3 py-1 rounded decrement-btn"
                  :class="canDecrementPoints(selectedTree) ? 'decrement-btn-enabled' : 'btn-disabled'"
                >
                  -
                </button>

                <input
                  v-model.number="pointsInput[selectedTree]"
                  @change="updateTreePoints(selectedTree)"
                  type="number"
                  min="0"
                  :max="getTreeMax(selectedTree)"
                  class="w-20 px-3 py-1 rounded tree-points-input text-center"
                />

                <button
                  @click="incrementTreePoints(selectedTree)"
                  :disabled="!canIncrementPoints"
                  class="px-3 py-1 rounded increment-btn"
                  :class="canIncrementPoints ? 'increment-btn-enabled' : 'btn-disabled'"
                >
                  +
                </button>

                <span class="panel-text text-sm">/ {{ getTreeMax(selectedTree) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Feat Details (when feat is selected) -->
        <div v-else-if="selectedFeat" class="flex flex-col space-y-4">
          <!-- Feat Name -->
          <div class="flex items-center gap-2">
            <h2 class="text-2xl font-bold feat-name">
              {{ selectedFeat.name }}
            </h2>
          </div>

          <!-- Tree Info -->
          <div class="info-panel rounded p-4">
            <div class="flex flex-col space-y-2">
              <div><strong>Tree:</strong> {{ getTreeName(selectedFeat.weapon_tree) }}</div>
              <div><strong>Level Required:</strong> {{ selectedFeat.level }}</div>
            </div>
          </div>

          <!-- Point Investment UI -->
          <div class="info-panel rounded p-4">
            <div class="flex flex-col space-y-2">
              <div class="panel-label font-bold">Points in {{ getTreeName(selectedFeat.weapon_tree) }} Tree:</div>
              <div class="flex items-center space-x-2">
                <button
                  @click="decrementTreePoints(selectedFeat.weapon_tree)"
                  :disabled="!canDecrementPoints(selectedFeat.weapon_tree)"
                  class="px-3 py-1 rounded decrement-btn"
                  :class="canDecrementPoints(selectedFeat.weapon_tree) ? 'decrement-btn-enabled' : 'btn-disabled'"
                >
                  -
                </button>

                <input
                  v-model.number="pointsInput[selectedFeat.weapon_tree]"
                  @change="updateTreePoints(selectedFeat.weapon_tree)"
                  type="number"
                  min="0"
                  :max="getTreeMax(selectedFeat.weapon_tree)"
                  class="w-20 px-3 py-1 rounded tree-points-input text-center"
                />

                <button
                  @click="incrementTreePoints(selectedFeat.weapon_tree)"
                  :disabled="!canIncrementPoints"
                  class="px-3 py-1 rounded increment-btn"
                  :class="canIncrementPoints ? 'increment-btn-enabled' : 'btn-disabled'"
                >
                  +
                </button>

                <span class="panel-text text-sm">/ {{ getTreeMax(selectedFeat.weapon_tree) }}</span>
              </div>
            </div>
          </div>

          <!-- Acquisition Note for Greyed Feats -->
          <div v-if="isGreyedOut(selectedFeat)" class="info-panel rounded p-4">
            <div class="text-sm acquisition-note-detail">
              {{ getAcquisitionNote(selectedFeat) }}
            </div>
            <div class="text-xs mt-2 text-gray-400">
              This feat cannot be un-obtained directly. Un-obtain the granting feat to remove it.
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2">
            <button
              v-if="!isObtained(selectedFeat)"
              @click="obtain(selectedFeat)"
              :disabled="!canObtainFeat(selectedFeat)"
              class="px-4 py-2 rounded obtain-btn"
              :class="canObtainFeat(selectedFeat) ? 'obtain-btn-enabled' : 'btn-disabled-gray'"
            >
              Obtain
            </button>

            <button
              v-if="isObtained(selectedFeat) && !isGreyedOut(selectedFeat)"
              @click="unobtain(selectedFeat)"
              class="px-4 py-2 unobtain-btn rounded"
            >
              Unobtain
            </button>

            <div v-if="isObtained(selectedFeat) && isGreyedOut(selectedFeat)" class="text-sm text-gray-400 italic px-4 py-2">
              Un-obtain not available for cross-tree acquired feats
            </div>
          </div>

          <!-- Feat Details -->
          <div class="bg-white rounded p-4 text-charcoal">
            <div class="flex flex-col space-y-2">
              <div class="mt-4"><strong>Description:</strong></div>
              <div>{{ selectedFeat.description }}</div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state italic text-center py-8">
          Select a tree or feat to view details
        </div>
      </div>
    </div>

    <!-- Cross-Tree Feat Selection Modal -->
    <CrossTreeFeatSelectionModal
      :isOpen="showCrossTreeModal"
      :modalType="currentModalType"
      :availableTrees="currentModalAvailableTrees"
      :grantingFeatId="grantingFeatId"
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

const viewMode = ref('all')
const treeFilter = ref('all')
const selectedFeat = ref<any>(null)
const selectedTree = ref<string | null>(null)
const expandedTrees = ref<string[]>([])
const pointsInput = ref<Record<string, number>>({})
const editingBonus = ref(false)
const bonusPointsInput = ref(0)

// Weapon trees definition with max points per tree
const weaponTrees = [
  { id: 'FIST', name: 'Fist', max: 25 },
  { id: 'DAGGER', name: 'Dagger', max: 25 },
  { id: 'STRAIGHT_THRUST', name: 'Straight Sword / Thrusting Sword', max: 25 },
  { id: 'KATANA_CURVED', name: 'Katana / Curved Sword', max: 25 },
  { id: 'ULTRA_GREAT_SWORD', name: 'Greatsword / Ultra Greatsword', max: 25 },
  { id: 'GREAT_AXE', name: 'Axe / Greataxe', max: 25 },
  { id: 'GREAT_HAMMER', name: 'Hammer / Greathammer', max: 25 },
  { id: 'TWINBLADE', name: 'Twinblade', max: 25 },
  { id: 'SPEAR', name: 'Spear', max: 25 },
  { id: 'HALBERD', name: 'Halberd', max: 25 },
  { id: 'REAPER', name: 'Reaper', max: 25 },
  { id: 'WHIP', name: 'Whip', max: 25 },
  { id: 'CROSS_BOW', name: 'Bow / Crossbow', max: 25 },
  { id: 'GREAT_BOW_BALLISTA', name: 'Greatbow / Ballista', max: 25 },
  { id: 'GUN', name: 'Gun Sidearm', max: 10 },
  { id: 'SHIELD', name: 'Shield / Greatshield', max: 10 },
  { id: 'SORCERY', name: 'Sorcery', max: 25 },
  { id: 'MIRACLE', name: 'Miracles', max: 25 },
  { id: 'PYROMANCY', name: 'Pyromancy', max: 25 },
  { id: 'HEX', name: 'Hexes', max: 25 },
  { id: 'SPIRIT_SUMMONING', name: 'Spirit Summoning', max: 25 },
  { id: 'DUAL_WIELDING', name: 'Dual Wielding', max: 20 },
  { id: 'MUSICAL_INSTRUMENTS', name: 'Musical Instruments', max: 20 }
]

// Initialize points input with current values
onMounted(() => {
  weaponTrees.forEach(tree => {
    pointsInput.value[tree.id] = getPointsInTree(tree.id)
  })

  // Check for incomplete modal from previous session
  checkPendingModalOnLoad()
})

// Watch for changes in player store points and sync input
watch(() => playerStore.WeaponProficiencies, (newProfs) => {
  if (newProfs) {
    weaponTrees.forEach(tree => {
      pointsInput.value[tree.id] = newProfs[tree.id] || 0
    })
  }
}, { deep: true })

// Simplified computed properties
const totalPoints = computed(() => playerStore.WeaponProficiencyPoints?.total || 0)
const baseFromLevel = computed(() => playerStore.WeaponProficiencyPoints?.baseFromLevel || 0)
const customBonus = computed(() => playerStore.WeaponProficiencyPoints?.customBonus || 0)
const spentPoints = computed(() => playerStore.getTotalSpentPoints())
const availablePoints = computed(() => playerStore.getAvailablePoints())
const canIncrementPoints = computed(() => availablePoints.value > 0)

// Filtered trees based on filters
const filteredTrees = computed(() => {
  let trees = weaponTrees

  // Tree filter
  if (treeFilter.value !== 'all') {
    trees = trees.filter(tree => tree.id === treeFilter.value)
  }

  return trees
})

// Get tree name by ID
function getTreeName(treeId: string): string {
  const tree = weaponTrees.find(t => t.id === treeId)
  return tree?.name || treeId
}

// Get tree max points by ID
function getTreeMax(treeId: string): number {
  const tree = weaponTrees.find(t => t.id === treeId)
  return tree?.max || 20
}

// Get points invested in tree (from WeaponProficiencies, not WeaponProficiencyPoints.trees)
function getPointsInTree(treeId: string): number {
  return playerStore.WeaponProficiencies?.[treeId] || 0
}

// Check if tree has only cross-tree acquired feats (no natural points invested)
function hasOnlyCrossTreeFeats(treeId: string): boolean {
  const naturalPoints = getPointsInTree(treeId)
  if (naturalPoints > 0) return false // Has natural points, so not only cross-tree

  // Check if there are any obtained feats from this tree
  const hasFeatsFromThisTree = (playerStore.ObtainedWeaponProfFeats || []).some(
    (feat: any) => feat.weapon_tree === treeId
  )

  return hasFeatsFromThisTree
}

// Get tree header class based on investment type
function getTreeHeaderClass(treeId: string): string {
  if (hasOnlyCrossTreeFeats(treeId)) {
    return 'tree-header-cross-tree-only'
  } else if (getPointsInTree(treeId) > 0) {
    return 'tree-header-invested'
  } else {
    return 'tree-header-default'
  }
}

// Get feats for a tree
function getFeatsForTree(treeId: string) {
  let feats = (compendiumStore.WeaponFeats || []).filter((feat: any) => feat.weapon_tree === treeId)

  // Sort by level
  feats.sort((a: any, b: any) => a.level - b.level)

  // View mode filter
  if (viewMode.value === 'obtained') {
    feats = feats.filter((feat: any) => isObtained(feat))
  }

  return feats
}

// Toggle tree expansion
function toggleTree(treeId: string) {
  const index = expandedTrees.value.indexOf(treeId)
  if (index === -1) {
    expandedTrees.value.push(treeId)
  } else {
    expandedTrees.value.splice(index, 1)
  }

  // Set selected tree (show tree info on right panel)
  selectedTree.value = treeId
  // Clear selected feat when tree is clicked
  selectedFeat.value = null
}

// Select feat (show feat details on right panel)
function selectFeat(feat: any) {
  selectedFeat.value = feat
  // Clear selected tree when feat is clicked
  selectedTree.value = null
}

// Check if feat is obtained
function isObtained(feat: any): boolean {
  if (!playerStore.ObtainedWeaponProfFeats) return false
  return playerStore.ObtainedWeaponProfFeats.some((f: any) => f.feat_id === feat.id)
}

// Check if feat is greyed out (obtained via cross-tree)
function isGreyedOut(feat: any): boolean {
  if (!playerStore.ObtainedWeaponProfFeats) return false
  const obtainedFeat = playerStore.ObtainedWeaponProfFeats.find((f: any) => f.feat_id === feat.id)
  return obtainedFeat?.is_greyed_out || false
}

// Get acquisition note for greyed feats
function getAcquisitionNote(feat: any): string {
  if (!playerStore.ObtainedWeaponProfFeats) return ''
  const obtainedFeat = playerStore.ObtainedWeaponProfFeats.find((f: any) => f.feat_id === feat.id)
  return obtainedFeat?.acquisition_note || ''
}

// Check if can obtain feat (has enough points in tree)
function canObtainFeat(feat: any): boolean {
  // Can't obtain if greyed out (must unobtain granting feat instead)
  if (isGreyedOut(feat)) return false

  const pointsInTree = getPointsInTree(feat.weapon_tree)
  if (pointsInTree < feat.level) return false

  // Note: + variant feats (like Skilled Wielder+) can be obtained freely
  // The prerequisite check only applies to triggering cross-tree modals, not normal acquisition

  return true
}

// Get feat color class
function getFeatColorClass(feat: any): string {
  if (isObtained(feat)) {
    if (isGreyedOut(feat)) {
      return 'item-greyed' // Special class for cross-tree obtained feats
    }
    return 'item-obtained'
  }
  if (!canObtainFeat(feat)) {
    return 'item-locked'
  }
  return 'item-default'
}

// Increment tree points using simplified store method
function incrementTreePoints(treeId: string) {
  if (!canIncrementPoints.value) return
  playerStore.addPointToTree(treeId)
}

// Decrement tree points using simplified store method
function decrementTreePoints(treeId: string) {
  if (!canDecrementPoints(treeId)) return
  playerStore.removePointFromTree(treeId)
}

// Check if can decrement points (no obtained feats would become invalid)
function canDecrementPoints(treeId: string): boolean {
  const currentPoints = getPointsInTree(treeId)
  if (currentPoints === 0) return false

  // Check if any obtained feats require this level
  const obtainedFeatsInTree = (playerStore.ObtainedWeaponProfFeats || []).filter(
    (feat: any) => feat.weapon_tree === treeId
  )

  const maxRequiredLevel = Math.max(...obtainedFeatsInTree.map((feat: any) => feat.level), 0)
  return currentPoints > maxRequiredLevel
}

// Update tree points from input by adding/removing points
function updateTreePoints(treeId: string) {
  const newValue = pointsInput.value[treeId]
  const currentValue = getPointsInTree(treeId)
  const treeMax = getTreeMax(treeId)

  if (newValue < 0 || newValue > treeMax) {
    // Reset to current value if invalid
    pointsInput.value[treeId] = currentValue
    return
  }

  // Check if any obtained feats would become invalid
  const obtainedFeatsInTree = (playerStore.ObtainedWeaponProfFeats || []).filter(
    (feat: any) => feat.weapon_tree === treeId
  )
  const maxRequiredLevel = Math.max(...obtainedFeatsInTree.map((feat: any) => feat.level), 0)

  if (newValue < maxRequiredLevel) {
    // Can't reduce below max required level
    pointsInput.value[treeId] = currentValue
    return
  }

  // Add or remove points to reach the new value
  if (newValue > currentValue) {
    // Add points
    for (let i = currentValue; i < newValue; i++) {
      const success = playerStore.addPointToTree(treeId)
      if (!success) {
        // Couldn't add point (no available points)
        pointsInput.value[treeId] = getPointsInTree(treeId)
        return
      }
    }
  } else if (newValue < currentValue) {
    // Remove points
    for (let i = currentValue; i > newValue; i--) {
      playerStore.removePointFromTree(treeId)
    }
  }
}

// Modal state
const showCrossTreeModal = ref(false)
const currentModalType = ref<'dual_wielding_skilled' | 'dual_wielding_skilled_plus' | 'dual_wielding_master' | 'dual_wielding_master_plus' | 'musical_skilled_artist' | 'musical_master_artist' | 'protege_1_lv3' | 'protege_1_lv5' | 'protege_2' | 'protege_3' | null>(null)
const currentModalAvailableTrees = ref<string[]>([])
const pendingTriggers = ref<string[]>([]) // DEPRECATED - kept for backward compatibility
const immediateTriggers = ref<string[]>([]) // DW + Musical triggers (processed first)
const deferredProtegeTriggers = ref<string[]>([]) // Protege triggers (processed after immediate triggers)
const obtainedFeatsInChain = ref<Array<{ featId: number, level: number, tree: string }>>([]) // Track all feats obtained in current chain
const isProcessingTriggers = ref(false) // Flag to prevent nested trigger checking
const grantingFeatId = ref<number | null>(null) // Track which feat triggered the modal
const isClosingAfterCompletion = ref(false) // Track if modal closed after successful completion

// Pending modal state persistence (survives page refresh)
const PENDING_MODAL_KEY = 'sd20_pending_cross_tree_modal'

interface PendingModalState {
  characterUUID: string
  grantingFeatId: number
  modalType: string
  timestamp: number
}

function savePendingModalState(featId: number, modalType: string) {
  const state: PendingModalState = {
    characterUUID: playerStore.UUID,
    grantingFeatId: featId,
    modalType: modalType,
    timestamp: Date.now()
  }
  localStorage.setItem(PENDING_MODAL_KEY, JSON.stringify(state))
}

function clearPendingModalState() {
  localStorage.removeItem(PENDING_MODAL_KEY)
}

function checkPendingModalOnLoad() {
  const stored = localStorage.getItem(PENDING_MODAL_KEY)
  if (!stored) return

  try {
    const state: PendingModalState = JSON.parse(stored)

    // Only revert if it's for the current character
    if (state.characterUUID !== playerStore.UUID) {
      clearPendingModalState()
      return
    }

    // Check if the pending modal is stale (older than 1 hour)
    const ONE_HOUR = 60 * 60 * 1000
    if (Date.now() - state.timestamp > ONE_HOUR) {
      clearPendingModalState()
      return
    }

    // Un-obtain the granting feat
    console.log(`Reverting incomplete modal: un-obtaining feat ID ${state.grantingFeatId}`)
    playerStore.unobtainWeaponProfFeat(state.grantingFeatId)

    // Reset flags based on modal type
    if (state.modalType === 'protege_1_lv3') {
      playerStore.ProtegeFlags.protege_1_lv3_obtained = false
    } else if (state.modalType === 'protege_1_lv5') {
      playerStore.ProtegeFlags.protege_1_lv5_used = false
      playerStore.ProtegeFlags.protege_1_lv5_postponed = false
      playerStore.ProtegeFlags.protege_1_postponed_trees = []
    } else if (state.modalType === 'protege_2') {
      playerStore.ProtegeFlags.protege_2_used = false
      playerStore.ProtegeFlags.protege_2_postponed = false
      playerStore.ProtegeFlags.protege_2_postponed_trees = []
    } else if (state.modalType === 'protege_3') {
      playerStore.ProtegeFlags.protege_3_used = false
      playerStore.ProtegeFlags.protege_3_postponed = false
      playerStore.ProtegeFlags.protege_3_postponed_trees = []
    } else if (state.modalType.startsWith('dual_wielding')) {
      if (state.modalType === 'dual_wielding_skilled') {
        playerStore.DualWieldingFeatFlags.skilled_wielder_used = false
      } else if (state.modalType === 'dual_wielding_skilled_plus') {
        playerStore.DualWieldingFeatFlags.skilled_wielder_plus_used = false
      } else if (state.modalType === 'dual_wielding_master') {
        playerStore.DualWieldingFeatFlags.master_wielder_used = false
      } else if (state.modalType === 'dual_wielding_master_plus') {
        playerStore.DualWieldingFeatFlags.master_wielder_plus_used = false
        if (playerStore.TemporaryFatePoints > 0) {
          playerStore.TemporaryFatePoints--
        }
      }
    } else if (state.modalType.startsWith('musical')) {
      // Reset Musical Instruments flags based on type
      if (state.modalType === 'musical_skilled_artist') {
        playerStore.MusicalInstrumentsFeatFlags.skilled_artist_used = false
      } else if (state.modalType === 'musical_master_artist') {
        playerStore.MusicalInstrumentsFeatFlags.master_artist_used = false
      }
    }

    // Clear the pending state
    clearPendingModalState()

    // Show notification
    alert('Incomplete cross-tree feat modal detected. The granting feat has been reverted so you can obtain it again.')
  } catch (e) {
    console.error('Error processing pending modal state:', e)
    clearPendingModalState()
  }
}

// Obtain feat (with cross-tree trigger detection)
async function obtain(feat: any) {
  if (!feat || !canObtainFeat(feat)) return

  // Use new store method
  const success = playerStore.obtainWeaponProfFeat(feat.id, 'natural')
  if (!success) return

  // Track the granting feat for potential reversion
  grantingFeatId.value = feat.id

  // Track this feat in the chain
  obtainedFeatsInChain.value.push({
    featId: feat.id,
    level: feat.level,
    tree: feat.weapon_tree
  })

  // Only check for triggers if we're not already processing triggers
  // This prevents nested trigger checking when obtaining cross-tree feats
  if (isProcessingTriggers.value) {
    return
  }

  // Check for Dual Wielding triggers
  const dwTriggers = playerStore.checkDualWieldingTriggers(feat.id)
  console.log(`[TRIGGER CHECK] Feat: ${feat.name} (ID: ${feat.id}, Level: ${feat.level})`)
  console.log(`[TRIGGER CHECK] DW Triggers:`, dwTriggers)

  // Check for Musical Instruments triggers
  const musicalTriggers = playerStore.checkMusicalInstrumentTriggers(feat.id)
  console.log(`[TRIGGER CHECK] Musical Triggers:`, musicalTriggers)

  // Combine immediate triggers (DW + Musical)
  immediateTriggers.value = [...dwTriggers, ...musicalTriggers]
  console.log(`[TRIGGER CHECK] Immediate Triggers (DW + Musical):`, immediateTriggers.value)

  // NOTE: We do NOT check for Protege triggers here
  // Protege triggers are checked AFTER all immediate triggers complete
  // This ensures cross-tree feats are obtained before evaluating Protege milestones

  // Process immediate triggers if any
  if (immediateTriggers.value.length > 0) {
    isProcessingTriggers.value = true
    console.log(`[TRIGGER CHECK] Starting immediate trigger processing...`)
    processImmediateTriggers()
  } else {
    // No immediate triggers - check deferred Protege triggers
    console.log(`[TRIGGER CHECK] No immediate triggers, checking deferred Protege triggers...`)
    checkDeferredProtegeTriggers()
  }
}

// Process immediate triggers (DW + Musical) - Phase 1
function processImmediateTriggers() {
  console.log(`[PROCESS IMMEDIATE] Called. Immediate triggers:`, immediateTriggers.value)

  if (immediateTriggers.value.length === 0) {
    console.log(`[PROCESS IMMEDIATE] No immediate triggers left, checking deferred Protege triggers...`)
    checkDeferredProtegeTriggers()
    return
  }

  const trigger = immediateTriggers.value.shift()!
  console.log(`[PROCESS IMMEDIATE] Processing trigger:`, trigger)
  currentModalType.value = trigger as any

  // Calculate available trees for the trigger (DW and Musical don't use available trees, so set empty)
  currentModalAvailableTrees.value = []

  // Save pending state before opening modal
  if (grantingFeatId.value) {
    savePendingModalState(grantingFeatId.value, trigger)
    console.log(`[PROCESS IMMEDIATE] Saved pending modal state for feat ID:`, grantingFeatId.value)
  }

  console.log(`[PROCESS IMMEDIATE] Opening modal. showCrossTreeModal = true`)
  showCrossTreeModal.value = true
}

// Check for deferred Protege triggers across ALL feats obtained in chain - Phase 2
function checkDeferredProtegeTriggers() {
  console.log(`[CHECK DEFERRED] Checking Protege triggers for all feats in chain:`, obtainedFeatsInChain.value)

  // Check Protege triggers for ALL feats obtained in the chain
  const allProtegeTriggers: string[] = []

  for (const chainFeat of obtainedFeatsInChain.value) {
    const protegeTriggers = playerStore.checkProtegeTrigg(chainFeat.featId)
    if (protegeTriggers.length > 0) {
      console.log(`[CHECK DEFERRED] Protege triggers for feat ${chainFeat.featId}:`, protegeTriggers)
      allProtegeTriggers.push(...protegeTriggers)
    }
  }

  // Remove duplicates
  deferredProtegeTriggers.value = [...new Set(allProtegeTriggers)]
  console.log(`[CHECK DEFERRED] Combined Protege Triggers:`, deferredProtegeTriggers.value)

  // Process Protege triggers if any
  if (deferredProtegeTriggers.value.length > 0) {
    console.log(`[CHECK DEFERRED] Starting deferred Protege trigger processing...`)
    processProtegeTriggers()
  } else {
    // All triggers complete
    console.log(`[CHECK DEFERRED] No Protege triggers, finishing chain`)
    finishTriggerChain()
  }
}

// Process deferred Protege triggers - Phase 2
function processProtegeTriggers() {
  console.log(`[PROCESS PROTEGE] Called. Deferred triggers:`, deferredProtegeTriggers.value)

  if (deferredProtegeTriggers.value.length === 0) {
    console.log(`[PROCESS PROTEGE] No Protege triggers left, finishing chain`)
    finishTriggerChain()
    return
  }

  const trigger = deferredProtegeTriggers.value.shift()!
  console.log(`[PROCESS PROTEGE] Processing trigger:`, trigger)
  currentModalType.value = trigger as any

  // For Protege postponed selections, get available trees
  if (trigger === 'protege_1_lv5' && playerStore.ProtegeFlags.protege_1_lv5_postponed) {
    currentModalAvailableTrees.value = playerStore.resumeProtegeSelection('protege_1_lv5')
    console.log(`[PROCESS PROTEGE] Protege 1 lv5 POSTPONED - Resuming with trees:`, currentModalAvailableTrees.value)
  } else if (trigger === 'protege_2' && playerStore.ProtegeFlags.protege_2_postponed) {
    currentModalAvailableTrees.value = playerStore.resumeProtegeSelection('protege_2')
    console.log(`[PROCESS PROTEGE] Protege 2 POSTPONED - Resuming with trees:`, currentModalAvailableTrees.value)
  } else if (trigger === 'protege_3' && playerStore.ProtegeFlags.protege_3_postponed) {
    currentModalAvailableTrees.value = playerStore.resumeProtegeSelection('protege_3')
    console.log(`[PROCESS PROTEGE] Protege 3 POSTPONED - Resuming with trees:`, currentModalAvailableTrees.value)
  } else {
    // Calculate available trees based on milestone levels
    if (trigger === 'protege_1_lv3') {
      currentModalAvailableTrees.value = [] // All trees available for lv3
      console.log(`[PROCESS PROTEGE] Protege 1 lv3 - All trees available`)
    } else if (trigger === 'protege_1_lv5') {
      currentModalAvailableTrees.value = playerStore.getProtegeAvailableTrees(10) // Trees with lv10 feats
      console.log(`[PROCESS PROTEGE] Protege 1 lv5 - Available trees:`, currentModalAvailableTrees.value)
    } else if (trigger === 'protege_2') {
      currentModalAvailableTrees.value = playerStore.getProtegeAvailableTrees(15) // Trees with lv15 feats
      console.log(`[PROCESS PROTEGE] Protege 2 - Available trees:`, currentModalAvailableTrees.value)
    } else if (trigger === 'protege_3') {
      currentModalAvailableTrees.value = playerStore.getProtegeAvailableTrees(20) // Trees with lv20 feats
      console.log(`[PROCESS PROTEGE] Protege 3 - Available trees:`, currentModalAvailableTrees.value)
    } else {
      currentModalAvailableTrees.value = []
      console.log(`[PROCESS PROTEGE] Other trigger type - No trees`)
    }
  }

  // Save pending state before opening modal
  if (grantingFeatId.value) {
    savePendingModalState(grantingFeatId.value, trigger)
    console.log(`[PROCESS PROTEGE] Saved pending modal state for feat ID:`, grantingFeatId.value)
  }

  console.log(`[PROCESS PROTEGE] Opening modal. showCrossTreeModal = true`)
  showCrossTreeModal.value = true
}

// Finish trigger chain - cleanup
function finishTriggerChain() {
  console.log(`[FINISH CHAIN] All triggers complete, cleaning up`)
  isProcessingTriggers.value = false
  grantingFeatId.value = null
  obtainedFeatsInChain.value = []
  immediateTriggers.value = []
  deferredProtegeTriggers.value = []
  pendingTriggers.value = [] // Clear deprecated queue
}

// DEPRECATED: Old processNextTrigger function - kept for backward compatibility
function processNextTrigger() {
  console.log(`[PROCESS TRIGGER] DEPRECATED - Called. Pending triggers:`, pendingTriggers.value)

  if (pendingTriggers.value.length === 0) {
    console.log(`[PROCESS TRIGGER] No triggers left, returning`)
    return
  }

  const trigger = pendingTriggers.value.shift()!
  console.log(`[PROCESS TRIGGER] Processing trigger:`, trigger)
  currentModalType.value = trigger as any

  // For Protege postponed selections, get available trees
  if (trigger === 'protege_1_lv5' && playerStore.ProtegeFlags.protege_1_lv5_postponed) {
    currentModalAvailableTrees.value = playerStore.resumeProtegeSelection('protege_1_lv5')
    console.log(`[PROCESS TRIGGER] Protege 1 lv5 POSTPONED - Resuming with trees:`, currentModalAvailableTrees.value)
  } else if (trigger === 'protege_2' && playerStore.ProtegeFlags.protege_2_postponed) {
    currentModalAvailableTrees.value = playerStore.resumeProtegeSelection('protege_2')
    console.log(`[PROCESS TRIGGER] Protege 2 POSTPONED - Resuming with trees:`, currentModalAvailableTrees.value)
  } else if (trigger === 'protege_3' && playerStore.ProtegeFlags.protege_3_postponed) {
    currentModalAvailableTrees.value = playerStore.resumeProtegeSelection('protege_3')
    console.log(`[PROCESS TRIGGER] Protege 3 POSTPONED - Resuming with trees:`, currentModalAvailableTrees.value)
  } else {
    // Calculate available trees based on milestone levels
    if (trigger === 'protege_1_lv3') {
      currentModalAvailableTrees.value = [] // All trees available for lv3
      console.log(`[PROCESS TRIGGER] Protege 1 lv3 - All trees available`)
    } else if (trigger === 'protege_1_lv5') {
      currentModalAvailableTrees.value = playerStore.getProtegeAvailableTrees(10) // Trees with lv10 feats
      console.log(`[PROCESS TRIGGER] Protege 1 lv5 - Available trees:`, currentModalAvailableTrees.value)
    } else if (trigger === 'protege_2') {
      currentModalAvailableTrees.value = playerStore.getProtegeAvailableTrees(15) // Trees with lv15 feats
      console.log(`[PROCESS TRIGGER] Protege 2 - Available trees:`, currentModalAvailableTrees.value)
    } else if (trigger === 'protege_3') {
      currentModalAvailableTrees.value = playerStore.getProtegeAvailableTrees(20) // Trees with lv20 feats
      console.log(`[PROCESS TRIGGER] Protege 3 - Available trees:`, currentModalAvailableTrees.value)
    } else {
      currentModalAvailableTrees.value = []
      console.log(`[PROCESS TRIGGER] Other trigger type - No trees`)
    }
  }

  // Save pending state before opening modal
  if (grantingFeatId.value) {
    savePendingModalState(grantingFeatId.value, trigger)
    console.log(`[PROCESS TRIGGER] Saved pending modal state for feat ID:`, grantingFeatId.value)
  }

  console.log(`[PROCESS TRIGGER] Opening modal. showCrossTreeModal = true`)
  showCrossTreeModal.value = true
}

// Handle modal confirmation
function handleModalConfirm(selection: { featId?: number, featIds?: number[], choseFatePoint?: boolean, treeId?: string }) {
  console.log(`[HANDLE CONFIRM] Starting confirmation. Selection:`, selection)
  const modalType = currentModalType.value

  // Determine if this is Dual Wielding, Musical Instruments, or Protege and apply selection
  let result: { dwTriggers: string[], musicalTriggers: string[], obtainedFeatIds: number[] } | null = null

  if (modalType && modalType.startsWith('dual_wielding')) {
    result = playerStore.handleDualWieldingSelection(modalType, selection)
  } else if (modalType && modalType.startsWith('musical')) {
    result = playerStore.handleMusicalInstrumentSelection(modalType, selection)
  } else if (modalType && modalType.startsWith('protege')) {
    result = playerStore.handleProtegeSelection(modalType, selection, selection.treeId)
  }

  // If result was returned, track obtained feats in chain and process triggers
  if (result) {
    // Add all obtained feats to the chain for deferred Protege trigger checking
    if (result.obtainedFeatIds && result.obtainedFeatIds.length > 0) {
      result.obtainedFeatIds.forEach(featId => {
        const feat = compendiumStore.WeaponFeats.find((f: any) => f.id === featId)
        if (feat) {
          const chainFeat = {
            featId: feat.id,
            level: feat.level,
            tree: feat.weapon_tree
          }
          // Add to chain if not already present
          const alreadyInChain = obtainedFeatsInChain.value.some(f => f.featId === chainFeat.featId)
          if (!alreadyInChain) {
            obtainedFeatsInChain.value.push(chainFeat)
          }
        }
      })
      console.log(`[HANDLE CONFIRM] Added ${result.obtainedFeatIds.length} feat(s) to chain. Chain now:`, obtainedFeatsInChain.value)
    }

    // Process triggers if any
    if (result.dwTriggers.length > 0 || result.musicalTriggers.length > 0) {
      console.log(`[HANDLE CONFIRM] Selection triggered new modals:`, result)

      // Add DW triggers first, then Musical triggers
      const newTriggers = [...result.dwTriggers, ...result.musicalTriggers]
      immediateTriggers.value.push(...newTriggers)

      console.log(`[HANDLE CONFIRM] Added ${newTriggers.length} new immediate triggers. Total immediate triggers:`, immediateTriggers.value.length)
    }
  }

  // Clear pending state on successful completion
  clearPendingModalState()

  // Set flag to indicate modal is closing after successful completion
  isClosingAfterCompletion.value = true
  console.log(`[HANDLE CONFIRM] Set isClosingAfterCompletion = true`)

  // Close modal
  showCrossTreeModal.value = false
  currentModalType.value = null
  currentModalAvailableTrees.value = []

  // Continue processing triggers based on current phase
  // If there are immediate triggers left, process them
  if (immediateTriggers.value.length > 0) {
    console.log(`[HANDLE CONFIRM] ${immediateTriggers.value.length} immediate triggers remaining, will process next`)
    setTimeout(() => {
      processImmediateTriggers()
    }, 300)
  }
  // If there are deferred Protege triggers left, process them
  else if (deferredProtegeTriggers.value.length > 0) {
    console.log(`[HANDLE CONFIRM] ${deferredProtegeTriggers.value.length} deferred Protege triggers remaining, will process next`)
    setTimeout(() => {
      processProtegeTriggers()
    }, 300)
  }
  // If no immediate/deferred triggers but we have feats in chain, check for NEW deferred triggers
  else if (obtainedFeatsInChain.value.length > 0) {
    console.log(`[HANDLE CONFIRM] No more immediate triggers, but chain has ${obtainedFeatsInChain.value.length} feats. Checking deferred Protege triggers...`)
    setTimeout(() => {
      checkDeferredProtegeTriggers()
    }, 300)
  }
  // All triggers complete
  else {
    console.log(`[HANDLE CONFIRM] All triggers complete, no feats in chain`)
    finishTriggerChain()
  }
}

// Handle modal postpone
function handleModalPostpone() {
  console.log(`[HANDLE POSTPONE] Starting postpone`)
  const modalType = currentModalType.value

  if (modalType && modalType.startsWith('protege')) {
    // Just save the postponed flag - trees will be recalculated on resume
    playerStore.postponeProtegeSelection(modalType, [])
  }

  // Clear pending state on postpone (valid user action)
  clearPendingModalState()

  // Set flag to indicate modal is closing after successful completion
  isClosingAfterCompletion.value = true
  console.log(`[HANDLE POSTPONE] Set isClosingAfterCompletion = true`)

  // Close modal
  showCrossTreeModal.value = false
  currentModalType.value = null
  currentModalAvailableTrees.value = []

  // Continue processing triggers based on current phase
  // If there are immediate triggers left, process them
  if (immediateTriggers.value.length > 0) {
    console.log(`[HANDLE POSTPONE] ${immediateTriggers.value.length} immediate triggers remaining, will process next`)
    setTimeout(() => {
      processImmediateTriggers()
    }, 300)
  }
  // If there are deferred Protege triggers left, process them
  else if (deferredProtegeTriggers.value.length > 0) {
    console.log(`[HANDLE POSTPONE] ${deferredProtegeTriggers.value.length} deferred Protege triggers remaining, will process next`)
    setTimeout(() => {
      processProtegeTriggers()
    }, 300)
  }
  // If no immediate triggers but we were processing immediate phase, check deferred triggers
  else if (isProcessingTriggers.value) {
    console.log(`[HANDLE POSTPONE] No more immediate triggers, checking deferred Protege triggers...`)
    setTimeout(() => {
      checkDeferredProtegeTriggers()
    }, 300)
  }
  // All triggers complete
  else {
    console.log(`[HANDLE POSTPONE] All triggers complete`)
    finishTriggerChain()
  }
}

// Handle modal close (without completion)
function handleModalClose() {
  console.log(`[HANDLE CLOSE] Called. isClosingAfterCompletion:`, isClosingAfterCompletion.value)

  // If modal closed after successful completion (confirm/postpone), skip reversion logic
  if (isClosingAfterCompletion.value) {
    console.log(`[HANDLE CLOSE] Modal closed after completion, skipping reversion`)
    isClosingAfterCompletion.value = false // Reset flag for next modal
    return
  }

  const modalType = currentModalType.value
  console.log(`[HANDLE CLOSE] Modal closed WITHOUT completion. modalType:`, modalType, 'grantingFeatId:', grantingFeatId.value)

  // Modal closed without completing selection - need to revert
  if (grantingFeatId.value && modalType) {
    // Get the granting feat info for notification
    const grantingFeat = compendiumStore.WeaponFeats.find((f: any) => f.id === grantingFeatId.value)

    // Get dependent feats that will be removed (all feats obtained in chain)
    const dependentFeats = playerStore.ObtainedWeaponProfFeats?.filter(
      (f: any) => f.source_feat_id === grantingFeatId.value
    ) || []

    let message = `Modal closed without completion. This will un-obtain ${grantingFeat?.name || 'the feat'}`

    if (dependentFeats.length > 0) {
      const dependentNames = dependentFeats.map((f: any) => f.name).join(', ')
      message += ` and ${dependentFeats.length} dependent feat(s): ${dependentNames}`
    }

    message += '.\n\nContinue?'

    // Show warning
    const confirmed = confirm(message)

    if (confirmed) {
      // Un-obtain the granting feat (cascading removal will handle dependent feats)
      playerStore.unobtainWeaponProfFeat(grantingFeatId.value)

      // Reset flags based on modal type
      if (modalType === 'protege_1_lv3') {
        playerStore.ProtegeFlags.protege_1_lv3_obtained = false
      } else if (modalType === 'protege_1_lv5') {
        playerStore.ProtegeFlags.protege_1_lv5_used = false
        playerStore.ProtegeFlags.protege_1_lv5_postponed = false
        playerStore.ProtegeFlags.protege_1_postponed_trees = []
      } else if (modalType === 'protege_2') {
        playerStore.ProtegeFlags.protege_2_used = false
        playerStore.ProtegeFlags.protege_2_postponed = false
        playerStore.ProtegeFlags.protege_2_postponed_trees = []
      } else if (modalType === 'protege_3') {
        playerStore.ProtegeFlags.protege_3_used = false
        playerStore.ProtegeFlags.protege_3_postponed = false
        playerStore.ProtegeFlags.protege_3_postponed_trees = []
      } else if (modalType.startsWith('dual_wielding')) {
        // Reset Dual Wielding flags based on type
        if (modalType === 'dual_wielding_skilled') {
          playerStore.DualWieldingFeatFlags.skilled_wielder_used = false
        } else if (modalType === 'dual_wielding_skilled_plus') {
          playerStore.DualWieldingFeatFlags.skilled_wielder_plus_used = false
        } else if (modalType === 'dual_wielding_master') {
          playerStore.DualWieldingFeatFlags.master_wielder_used = false
        } else if (modalType === 'dual_wielding_master_plus') {
          playerStore.DualWieldingFeatFlags.master_wielder_plus_used = false
          // Also revert Fate Point if it was added
          if (playerStore.TemporaryFatePoints > 0) {
            playerStore.TemporaryFatePoints--
          }
        }
      } else if (modalType.startsWith('musical')) {
        // Reset Musical Instruments flags based on type
        if (modalType === 'musical_skilled_artist') {
          playerStore.MusicalInstrumentsFeatFlags.skilled_artist_used = false
        } else if (modalType === 'musical_master_artist') {
          playerStore.MusicalInstrumentsFeatFlags.master_artist_used = false
        }
      }

      // Show notification
      alert('Progress lost. Feat has been un-obtained and flags have been reset.')
    } else {
      // User cancelled - keep modal open
      showCrossTreeModal.value = true
      return
    }
  }

  // Close modal and clean up
  showCrossTreeModal.value = false
  currentModalType.value = null
  currentModalAvailableTrees.value = []
  grantingFeatId.value = null

  // Clear all trigger queues and chain tracking
  pendingTriggers.value = []
  immediateTriggers.value = []
  deferredProtegeTriggers.value = []
  obtainedFeatsInChain.value = []
  isProcessingTriggers.value = false
}

// Unobtain feat (with cascading removal warning)
async function unobtain(feat: any) {
  if (!feat || !playerStore.ObtainedWeaponProfFeats) return

  // Check if this feat has dependent cross-tree feats
  const obtainedFeat = playerStore.ObtainedWeaponProfFeats.find((f: any) => f.feat_id === feat.id)
  if (!obtainedFeat) return

  const dependentFeats = playerStore.ObtainedWeaponProfFeats.filter(
    (f: any) => f.source_feat_id === obtainedFeat.id
  )

  // Warn if there are dependent feats
  if (dependentFeats.length > 0) {
    const dependentNames = dependentFeats.map((f: any) => f.name).join(', ')
    const confirmed = confirm(
      `Warning: Un-obtaining this feat will also remove ${dependentFeats.length} dependent feat(s):\n\n${dependentNames}\n\nContinue?`
    )
    if (!confirmed) return
  }

  // Use new store method (cascading removal handled automatically)
  playerStore.unobtainWeaponProfFeat(feat.id)
}

// Simplified bonus points editing
function startEditBonus() {
  bonusPointsInput.value = customBonus.value
  editingBonus.value = true
}

function saveBonusPoints() {
  if (!playerStore.WeaponProficiencyPoints) {
    playerStore.WeaponProficiencyPoints = {
      total: playerStore.Level,
      baseFromLevel: playerStore.Level,
      customBonus: 0
    }
  }
  playerStore.WeaponProficiencyPoints.customBonus = Math.max(0, bonusPointsInput.value)
  playerStore.WeaponProficiencyPoints.total = playerStore.Level + playerStore.WeaponProficiencyPoints.customBonus
  playerStore.save()
  editingBonus.value = false
}

function cancelEditBonus() {
  editingBonus.value = false
}
</script>

<style scoped>
/* Independent scroll for split layout - Task 4.2 */
.weapon-prof-content-wrapper {
  height: calc(100vh - 190px); /* Same as CharacterTab */
  width: 100%;
}

.weapon-prof-panel-left,
.weapon-prof-panel-right {
  height: 100%; /* Fill wrapper height */
}

/* Page Header */
.page-header {
  position: sticky;
  top: 0;
  padding: 1rem;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: var(--font-weight-semibold);
  z-index: 10;
  border-bottom: var(--border-width-thin) solid var(--color-border-primary);
  background: var(--color-bg-primary);
  position: relative;
}

.points-display {
  font-size: 1.125rem;
  position: absolute;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--color-text-primary);
}

.point-type {
  font-size: 1.3rem;
  color: var(--color-text-secondary);
}

.point-breakdown {
  font-size: 0.9rem;
  color: var(--color-text-tertiary);
  margin-left: 0.5rem;
}

.points-editor {
  font-size: 1rem;
  position: absolute;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-primary);
}

.editor-label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.editor-calc {
  color: var(--color-accent-gold-bright);
  font-size: 0.9rem;
  margin-left: 0.5rem;
}

.points-input-field {
  width: 5rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: 0.25rem;
  text-align: center;
}

.points-input-field:focus {
  outline: none;
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
}

/* Custom scrollbar */
.overflow-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: var(--color-green-primary);
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: var(--color-green-bright);
}

/* Filter Panel */
.filter-panel {
  background: var(--color-bg-secondary);
  border-color: var(--color-border-primary);
  color: var(--color-text-primary);
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

/* Save button - golden theme */
button.bg-green-600 {
  background: var(--color-btn-primary-border) !important;
  border: 2px solid var(--color-gold-dim);
  color: #ffffff;
  transition: var(--transition-hover);
}

button.bg-green-600:hover {
  background: var(--color-btn-primary-border) !important;
  border-color: var(--color-gold-primary);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

/* +/- tree point buttons in detail panel */
.bg-green-600.hover\:bg-green-700 {
  background: var(--color-btn-primary-border) !important;
  color: #ffffff;
}

.bg-green-600.hover\:bg-green-700:hover:not(:disabled) {
  background: var(--color-btn-primary-border) !important;
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

/* Header and Text Classes */
.header-text {
  color: var(--color-text-primary);
}

.points-value {
  color: var(--color-accent-gold-bright);
}

.tree-points {
  color: var(--color-text-primary);
}

.panel-label {
  color: var(--color-text-primary);
}

.panel-text {
  color: var(--color-text-primary);
}

.feat-name {
  color: var(--color-text-primary);
}

.locked-text {
  color: var(--color-red-bright);
}

.empty-state {
  color: var(--color-text-secondary);
}

/* Button Classes */
.edit-btn {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  transition: var(--transition-hover);
}

.edit-btn:hover {
  background: #2a2a2a;
  border-color: var(--color-accent-gold-dim);
}

.save-btn {
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  color: #ffffff;
  transition: var(--transition-hover);
}

.save-btn:hover {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

.cancel-btn {
  background: var(--color-red-rgba-medium);
  border: var(--border-width-thin) solid var(--color-danger);
  color: #ffffff; /* White text for readability on red background */
  transition: var(--transition-hover);
}

.cancel-btn:hover {
  background: var(--color-red-rgba-strong);
  box-shadow: 0 0 10px var(--color-red-rgba-strong);
}

.decrement-btn {
  color: var(--color-text-primary);
}

.decrement-btn-enabled {
  background: var(--color-red-rgba-medium);
  border: var(--border-width-thin) solid var(--color-danger);
  color: #ffffff; /* White text for readability on red background */
}

.decrement-btn-enabled:hover {
  background: var(--color-red-rgba-strong);
  box-shadow: 0 0 10px var(--color-red-rgba-strong);
}

.increment-btn {
  color: var(--color-text-primary);
}

.increment-btn-enabled {
  background: var(--color-btn-primary-border);
  color: #ffffff;
}

.increment-btn-enabled:hover {
  background: var(--color-btn-primary-border);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

.btn-disabled {
  background: var(--color-bg-tertiary);
  color: var(--color-text-disabled);
  cursor: not-allowed;
}

.btn-disabled-gray {
  background: #4a4a4a;
  color: var(--color-text-disabled);
  cursor: not-allowed;
}

.obtain-btn {
  color: var(--color-text-primary);
}

.obtain-btn-enabled {
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  color: #ffffff; /* White text on light golden background */
}

.obtain-btn-enabled:hover {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff; /* Keep white text on hover */
  box-shadow: var(--shadow-gold-medium);
}

.unobtain-btn {
  background: var(--color-red-rgba-medium);
  border: var(--border-width-thin) solid var(--color-danger);
  color: #ffffff; /* White text for readability on red background */
}

.unobtain-btn:hover {
  background: var(--color-red-rgba-strong);
  box-shadow: 0 0 10px var(--color-red-rgba-strong);
}

/* Input Fields */
.points-input {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
}

.points-input:focus {
  outline: none;
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
}

.tree-points-input {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
}

.tree-points-input:focus {
  outline: none;
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
}

/* Panel Classes */
.info-panel {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: var(--border-width-medium) solid var(--color-border-primary);
}

.tree-header {
  background: transparent;
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
}

.tree-header:hover {
  border-color: var(--color-accent-gold);
  box-shadow: 0 0 15px var(--color-gold-rgba-light);
}

.tree-header-default {
  background: transparent;
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  font-weight: var(--font-weight-bold);
}

.tree-header-default:hover {
  border-color: var(--color-accent-gold);
  box-shadow: 0 0 15px var(--color-gold-rgba-light);
}

.tree-header-invested {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.8), rgba(212, 175, 55, 0.5));
  border: 2px solid var(--color-accent-gold-bright);
  color: #ffffff; /* Always white text for readability */
  font-weight: var(--font-weight-bold);
  box-shadow: 0 0 20px var(--color-gold-rgba-light);
}

.tree-header-invested:hover {
  border-color: var(--color-accent-gold-bright);
  box-shadow: 0 0 25px var(--color-gold-rgba-medium);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.9), rgba(212, 175, 55, 0.6));
  color: #ffffff; /* Keep white text on hover */
}

/* Tree header for trees with only cross-tree acquired feats (blue styling) */
.tree-header-cross-tree-only {
  background: linear-gradient(135deg, rgb(55 145 212 / 30%), rgb(55 145 212 / 10%));
  border: 2px solid rgba(100, 150, 255, 0.6);
  color: #ffffff;
  font-weight: var(--font-weight-bold);
  box-shadow: 0 0 20px rgba(100, 150, 255, 0.2);
}

.tree-header-cross-tree-only:hover {
  border-color: rgba(100, 150, 255, 0.8);
  box-shadow: 0 0 25px rgba(100, 150, 255, 0.4);
  background: linear-gradient(135deg, rgb(55 145 212 / 40%), rgb(55 145 212 / 15%));
  color: #ffffff;
}

/* Feat Item States */
.feat-item {
  color: var(--color-text-primary);
}

.item-obtained {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.8), rgba(212, 175, 55, 0.5));
  border: 2px solid var(--color-accent-gold-bright);
  color: #ffffff; /* White text on golden background */
}

.item-obtained:hover {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.9), rgba(212, 175, 55, 0.6));
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-medium);
  color: #ffffff; /* Keep white text on hover */
}

.item-locked {
  background: transparent;
  color: var(--color-text-tertiary);
  border: 2px solid var(--color-border-secondary);
  cursor: not-allowed;
}

.item-default {
  background: transparent;
  color: var(--color-text-primary);
  border: 2px solid var(--color-border-primary);
}

.item-default:hover {
  border-color: var(--color-accent-gold);
  box-shadow: var(--shadow-gold-soft);
  color: var(--color-text-primary); /* Keep same text color on hover */
}

/* Greyed out feat (cross-tree acquired) */
.item-greyed {
  background: linear-gradient(135deg, rgba(150, 150, 150, 0.4), rgba(150, 150, 150, 0.2));
  border: 2px solid rgba(150, 150, 150, 0.6);
  color: var(--color-accent-gold-bright); /* Golden text for greyed feats */
  opacity: 0.9;
}

.item-greyed:hover {
  background: linear-gradient(135deg, rgba(150, 150, 150, 0.5), rgba(150, 150, 150, 0.3));
  border-color: rgba(150, 150, 150, 0.8);
  box-shadow: 0 0 15px rgba(150, 150, 150, 0.4);
  color: var(--color-accent-gold-bright); /* Keep golden text on hover */
}

/* Ensure feat name stays golden in greyed items */
.item-greyed span {
  color: var(--color-accent-gold-bright) !important;
}

/* Acquisition note styling */
.acquisition-note {
  color: var(--color-accent-gold-bright); /* Golden color */
  font-style: normal;
  font-size: 0.95rem; /* Slightly larger (from text-xs which is 0.75rem) */
  font-weight: normal; /* Not bold */
}

.acquisition-note-detail {
  color: var(--color-accent-gold-bright);
  font-weight: normal; /* Not bold */
  font-size: 1rem; /* Slightly larger */
}
</style>
