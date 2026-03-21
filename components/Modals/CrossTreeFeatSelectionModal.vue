<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <div class="modal-header">
        <h2 class="modal-title">{{ modalTitle }}</h2>
      </div>

      <div class="modal-body">
        <p class="modal-description">{{ modalDescription }}</p>

        <!-- Search bar and tree filter (shows when feat selection is visible) -->
        <div v-if="shouldShowFeatSelection" class="filter-bar-section">
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search feats by name..."
              class="search-input"
            />
            <button
              v-if="searchQuery"
              class="clear-search-button"
              @click="searchQuery = ''"
              title="Clear search"
            >
              ❌
            </button>
          </div>

          <!-- Tree filter dropdown (only show for multi-tree selections) -->
          <div v-if="shouldShowTreeFilter" class="tree-filter-wrapper">
            <label class="tree-filter-label">Filter by Tree:</label>
            <select v-model="selectedTreeFilter" class="tree-filter-select">
              <option :value="null">All Trees</option>
              <option
                v-for="tree in availableTreesForFilter"
                :key="tree.id"
                :value="tree.id"
              >
                {{ tree.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Choice mode: Pick between single high-level OR two low-level feats -->
        <div v-if="selectionMode === 'choice' && !choiceMode" class="choice-section">
          <h3 class="section-title">Choose Your Acquisition Method</h3>
          <div class="choice-cards">
            <div class="choice-card" @click="choiceMode = 'single'">
              <div class="choice-title">Option 1: One Level {{ modalConfig?.levels?.[0] }} Feat</div>
              <div class="choice-description">
                {{  modalConfig?.categoryFiltered ?
                  `Select any single level ${modalConfig?.levels?.[0]} feat from Magic Trees only (Sorcery, Miracle, Pyromancy, Hex, Spirit Summoning)` :
                  `Select any single level ${modalConfig?.levels?.[0]} feat from any tree`
                }}
              </div>
            </div>
            <div class="choice-card" @click="choiceMode = 'double'">
              <div class="choice-title">Option 2: Two Level {{ modalConfig?.levels?.[1] }} Feats</div>
              <div class="choice-description">
                {{ modalConfig?.categoryFiltered ?
                  `Select one level ${modalConfig?.levels?.[1]} feat from Magic Trees + one from Other Trees` :
                  modalConfig?.differentTrees ?
                  `Select two level ${modalConfig?.levels?.[1]} feats from different trees` :
                  `Select both level ${modalConfig?.levels?.[1]} feats from one tree`
                }}
              </div>
            </div>
          </div>
        </div>

        <!-- Tree selection (for double-feat choice from SAME tree) -->
        <div v-if="choiceMode === 'double' && !modalConfig?.differentTrees && !selectedTree" class="tree-selection-section">
          <h3 class="section-title">Select a Tree</h3>
          <button v-if="choiceMode === 'double'" @click="choiceMode = null" class="back-button">← Back to Choice</button>
          <div class="tree-list">
            <div
              v-for="tree in availableTreesForSelection"
              :key="tree.id"
              class="tree-card"
              :class="{ selected: selectedTree === tree.id }"
              @click="selectTree(tree.id)"
            >
              <div class="tree-name">{{ tree.name }}</div>
              <div class="tree-info">{{ tree.description }}</div>
            </div>
          </div>
        </div>

        <!-- Feat selection -->
        <div v-if="shouldShowFeatSelection" class="feat-selection-section">
          <h3 class="section-title">{{ featSelectionTitle }}</h3>
          <button v-if="choiceMode === 'single'" @click="choiceMode = null" class="back-button">← Back to Choice</button>
          <button v-else-if="choiceMode === 'double' && selectedTree" @click="selectedTree = null" class="back-button">← Back to Tree Selection</button>
          <div class="feat-list">
            <div
              v-for="feat in filteredFeats"
              :key="feat.id"
              class="feat-card"
              :class="{
                selected: isInSelectionMode ? selectedFeats.includes(feat.id) : selectedFeat === feat.id,
                disabled: isFeatDisabled(feat)
              }"
              @click="!isFeatDisabled(feat) && selectFeat(feat)"
            >
              <div class="feat-header">
                <span class="feat-name">{{ feat.name }}</span>
                <span class="feat-level">Level {{ feat.level }}</span>
              </div>
              <div class="feat-description">{{ feat.description }}</div>
              <div v-if="isFeatDisabled(feat)" class="feat-disabled-reason">
                {{ getDisabledReason(feat) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Master Wielder+ special choice -->
        <div v-if="allowFatePointChoice" class="fate-point-choice-section">
          <h3 class="section-title">OR Choose a Fate Point</h3>
          <div
            class="fate-point-card"
            :class="{ selected: choseFatePoint }"
            @click="chooseFatePoint"
          >
            <div class="fate-point-text">
              <strong>+1 Fate Point</strong>
            </div>
          </div>
        </div>

        <!-- Confirmation section (only for feat selections, not fate point) -->
        <div v-if="hasSelection && !choseFatePoint" class="confirmation-section">
          <h3 class="section-title">Confirm Your Selection</h3>
          <!-- Single feat confirmation -->
          <div v-if="selectedFeat && !isInSelectionMode" class="confirmation-card">
            <div class="confirmation-feat-name">{{ selectedFeatObject?.name }}</div>
            <div class="confirmation-feat-level">Level {{ selectedFeatObject?.level }}</div>
            <div class="confirmation-feat-tree">
              From: {{ getTreeName(selectedFeatObject?.weapon_tree) }}
            </div>
            <div class="confirmation-feat-description">{{ selectedFeatObject?.description }}</div>
          </div>
          <!-- Multiple feats confirmation -->
          <div v-else-if="selectedFeats.length > 0" class="confirmation-card">
            <div class="confirmation-multi-title">
              {{ selectionMode === 'halberd-double' ?
                `Selected ${selectedFeats.length} Feat(s) from Different Trees` :
                `Selected ${selectedFeats.length} Feat(s) from ${getTreeName(selectedTree || undefined)}`
              }}
            </div>
            <div v-for="featId in selectedFeats" :key="featId" class="confirmation-feat-item">
              <div class="confirmation-feat-name">{{ getFeatById(featId)?.name }}</div>
              <div class="confirmation-feat-level">Level {{ getFeatById(featId)?.level }}</div>
              <div v-if="selectionMode === 'halberd-double'" class="confirmation-feat-tree">
                From: {{ getTreeName(getFeatById(featId)?.weapon_tree) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button
          v-if="canPostpone"
          class="button-cancel"
          @click="handlePostpone"
        >
          Postpone
        </button>
        <button
          class="button-confirm"
          @click="confirmSelection"
          :disabled="!canConfirm"
        >
          Confirm Selection
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCompendiumStore } from '~/store/compendium'
import { usePlayerStore } from '~/store/player'

const props = defineProps<{
  isOpen: boolean
  modalType: 'dual_wielding_skilled' | 'dual_wielding_skilled_plus' | 'dual_wielding_master' | 'dual_wielding_master_plus' | 'musical_skilled_artist' | 'musical_master_artist' | 'halberd_two_in_one' | 'halberd_two_in_one_plus' | 'halberd_master_of_all_trades' | 'protege_1_lv3' | 'protege_1_lv5' | 'protege_2' | 'protege_3' | null
  availableTrees?: string[]  // For Protege postponed selections
  grantingFeatId?: number | null  // ID of feat that triggered the modal (to exclude from selection)
}>()

const emit = defineEmits<{
  'close': []
  'confirm': [selection: { featId?: number, featIds?: number[], choseFatePoint?: boolean, treeId?: string }]
  'postpone': []
}>()

const compendiumStore = useCompendiumStore()
const playerStore = usePlayerStore()

const selectedTree = ref<string | null>(null)
const selectedFeat = ref<number | null>(null)
const selectedFeats = ref<number[]>([])  // For multi-feat selection
const choseFatePoint = ref(false)
const choiceMode = ref<'single' | 'double' | null>(null)  // For 'choice' selection mode
const musicalStep = ref<1 | 2>(1)  // Current step for Musical Instruments option 2
const searchQuery = ref('')  // Search query for feat filtering
const selectedTreeFilter = ref<string | null>(null)  // Tree filter for feat list

// Reset selections when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    selectedTree.value = null
    selectedFeat.value = null
    selectedFeats.value = []
    choseFatePoint.value = false
    choiceMode.value = null
    musicalStep.value = 1
    searchQuery.value = ''
    selectedTreeFilter.value = null
  }
})

// ALSO reset selections when modal TYPE changes (e.g., protege_1_lv3 → protege_1_lv5)
watch(() => props.modalType, (newType, oldType) => {
  if (newType && newType !== oldType) {
    console.log(`[MODAL] Modal type changed from ${oldType} to ${newType}, resetting state`)
    selectedTree.value = null
    selectedFeat.value = null
    selectedFeats.value = []
    choseFatePoint.value = false
    choiceMode.value = null
    musicalStep.value = 1
    searchQuery.value = ''
    selectedTreeFilter.value = null
  }
})

// Modal configuration based on type
const modalConfig = computed(() => {
  if (!props.modalType) return null

  switch (props.modalType) {
    case 'dual_wielding_skilled':
      return {
        title: 'Dual Wielding - Skilled Wielder (Level 10)',
        description: 'Choose ONE: Any level 10 feat from any tree OR both level 5 feats from one tree',
        selectionMode: 'choice' as const,  // Choice between single lv10 OR two lv5
        levels: [10, 5],
        allowFatePoint: false,
        canPostpone: false
      }
    case 'dual_wielding_skilled_plus':
      return {
        title: 'Dual Wielding - Skilled Wielder+ (Level 13)',
        description: 'Choose ONE: Any level 7 feat from any tree OR two level 3 feats from different trees',
        selectionMode: 'choice' as const,
        levels: [7, 3],
        allowFatePoint: false,
        canPostpone: false,
        differentTrees: true  // Flag for selecting from different trees
      }
    case 'dual_wielding_master':
      return {
        title: 'Dual Wielding - Master Wielder (Level 15)',
        description: 'Choose ONE: Any level 15 feat from any tree OR both level 10 feats from one tree',
        selectionMode: 'choice' as const,
        levels: [15, 10],
        allowFatePoint: false,
        canPostpone: false
      }
    case 'dual_wielding_master_plus':
      return {
        title: 'Dual Wielding - Master Wielder+ (Level 17)',
        description: 'Choose ONE: Any level 13 feat from any tree OR +1 Temporary Fate Point',
        selectionMode: 'single-feat' as const,
        levels: [13],
        allowFatePoint: true,
        canPostpone: false
      }
    case 'musical_skilled_artist':
      return {
        title: 'Musical Instruments - Skilled Artist (Level 10)',
        description: 'Choose ONE: Any level 10 feat from Magic Trees only OR one level 5 feat from Magic Trees + one level 5 feat from Other Trees',
        selectionMode: 'choice' as const,
        levels: [10, 5],
        allowFatePoint: false,
        canPostpone: false,
        differentTrees: true,  // Feats must be from different categories
        categoryFiltered: true  // Enable category-based filtering
      }
    case 'musical_master_artist':
      return {
        title: 'Musical Instruments - Master Artist (Level 15)',
        description: 'Choose ONE: Any level 15 feat from Magic Trees only OR one level 10 feat from Magic Trees + one level 10 feat from Other Trees',
        selectionMode: 'choice' as const,
        levels: [15, 10],
        allowFatePoint: false,
        canPostpone: false,
        differentTrees: true,  // Feats must be from different categories
        categoryFiltered: true  // Enable category-based filtering
      }
    case 'halberd_two_in_one':
      return {
        title: 'Halberd - Two in One (Level 10)',
        description: 'Choose ONE level 5 Spear feat AND ONE level 5 Axe/Greataxe feat. You gain both feats.',
        selectionMode: 'halberd-double' as const,  // Special mode: one from SPEAR, one from GREAT_AXE
        levels: [5],
        allowFatePoint: false,
        canPostpone: false,
        halberdTrees: ['SPEAR', 'GREAT_AXE']  // Must select from these two trees
      }
    case 'halberd_two_in_one_plus':
      return {
        title: 'Halberd - Two in One+ (Level 17)',
        description: 'Choose ONE level 10 feat from either the Axe/Greataxe OR Spear tree.',
        selectionMode: 'single-feat' as const,
        levels: [10],
        allowFatePoint: false,
        canPostpone: false,
        halberdTrees: ['SPEAR', 'GREAT_AXE']  // Filter to these trees only
      }
    case 'halberd_master_of_all_trades':
      return {
        title: 'Halberd - Master of All Trades (Level 20)',
        description: 'Choose ONE level 20 feat from Spear, Axe/Greataxe, OR Straight Sword/Thrusting Sword tree.',
        selectionMode: 'single-feat' as const,
        levels: [20],
        allowFatePoint: false,
        canPostpone: false,
        halberdTrees: ['SPEAR', 'GREAT_AXE', 'STRAIGHT_THRUST']  // Filter to these trees only
      }
    case 'protege_1_lv3':
      return {
        title: 'Protege 1 - Immediate Level 3 Feat',
        description: 'Choose any level 3 feat from any weapon proficiency tree',
        selectionMode: 'single-feat' as const,
        levels: [3],
        allowFatePoint: false,
        canPostpone: false
      }
    case 'protege_1_lv5':
      return {
        title: 'Protege 1 - Level 5 Feat (Triggered)',
        description: 'Choose any level 5 feat from the tree where you just obtained a level 10 feat',
        selectionMode: 'single-feat' as const,
        levels: [5],
        allowFatePoint: false,
        canPostpone: true
      }
    case 'protege_2':
      return {
        title: 'Protege 2 - Lower Feat (Triggered)',
        description: 'Choose either a level 10 OR level 5 feat from the tree where you just obtained a level 15 feat',
        selectionMode: 'single-feat' as const,
        levels: [10, 5],
        allowFatePoint: false,
        canPostpone: true
      }
    case 'protege_3':
      return {
        title: 'Protege 3 - Lower Feat (Triggered)',
        description: 'Choose either a level 15 OR level 10 feat from the tree where you just obtained a level 20 feat',
        selectionMode: 'single-feat' as const,
        levels: [15, 10],
        allowFatePoint: false,
        canPostpone: true
      }
  }
})

const modalTitle = computed(() => modalConfig.value?.title || '')
const modalDescription = computed(() => modalConfig.value?.description || '')
const selectionMode = computed(() => modalConfig.value?.selectionMode || 'single-feat')
const allowFatePointChoice = computed(() => modalConfig.value?.allowFatePoint || false)
const canPostpone = computed(() => modalConfig.value?.canPostpone || false)

// Multi-selection mode check (selecting both feats)
const isInSelectionMode = computed(() => {
  return choiceMode.value === 'double' || selectionMode.value === 'halberd-double'
})

// Determines feat selection panel visibility
const shouldShowFeatSelection = computed(() => {
  if (selectionMode.value === 'single-feat') return true
  if (selectionMode.value === 'halberd-double') return true  // Always show feats for halberd-double
  if (selectionMode.value === 'choice' && choiceMode.value === 'single') return true
  if (selectionMode.value === 'choice' && choiceMode.value === 'double') {
    // For differentTrees mode, show feats immediately
    if (modalConfig.value?.differentTrees) return true
    // For same tree mode, show feats after tree selection
    if (selectedTree.value) return true
  }
  return false
})

// Determines tree filter dropdown visibility (multi-tree selections only)
const shouldShowTreeFilter = computed(() => {
  // Show filter for single-feat mode (Protege modals)
  if (selectionMode.value === 'single-feat') return true
  // Show filter for halberd-double mode (Two in One)
  if (selectionMode.value === 'halberd-double') return true
  // Show filter for choice mode - single high-level feat
  if (selectionMode.value === 'choice' && choiceMode.value === 'single') return true
  // Show filter for choice mode - double feats from different trees
  if (selectionMode.value === 'choice' && choiceMode.value === 'double' && modalConfig.value?.differentTrees) return true
  // Don't show filter when user has already selected a specific tree
  return false
})

// Available trees for filter dropdown
const availableTreesForFilter = computed(() => {
  if (!modalConfig.value) return []

  const allTrees = [
    'FIST', 'DAGGER', 'STRAIGHT_THRUST', 'KATANA_CURVED',
    'ULTRA_GREAT_SWORD', 'GREAT_AXE', 'GREAT_HAMMER', 'TWINBLADE',
    'SPEAR', 'HALBERD', 'REAPER', 'WHIP',
    'CROSS_BOW', 'GREAT_BOW_BALLISTA', 'GUN', 'SHIELD',
    'SORCERY', 'MIRACLE', 'PYROMANCY', 'HEX', 'SPIRIT_SUMMONING',
    'DUAL_WIELDING', 'MUSICAL_INSTRUMENTS'
  ]

  // Get unique trees from currently filtered feats (before tree filter is applied)
  const uniqueTrees = new Set<string>()
  const baseFeats = compendiumStore.WeaponFeats || []

  baseFeats.forEach(feat => {
    // Apply same filters as filteredFeats but without tree filter
    let shouldInclude = false

    // Check against modal config levels
    if (modalConfig.value?.levels?.includes(feat.level)) {
      // For Protege with available trees
      if (props.modalType?.startsWith('protege') && props.availableTrees?.length) {
        shouldInclude = props.availableTrees.includes(feat.weapon_tree)
      }
      // For Halberd feats with halberdTrees filter
      else if (modalConfig.value?.halberdTrees?.length) {
        shouldInclude = modalConfig.value.halberdTrees.includes(feat.weapon_tree)
      }
      // For Musical Instruments single feat (magic trees only)
      else if (selectionMode.value === 'choice' && choiceMode.value === 'single' && modalConfig.value?.categoryFiltered) {
        shouldInclude = isMagicTree(feat.weapon_tree) && feat.id !== props.grantingFeatId
      }
      // For other single feats
      else if (selectionMode.value === 'choice' && choiceMode.value === 'single') {
        shouldInclude = feat.id !== props.grantingFeatId
      }
      // For double feats from different trees
      else if (selectionMode.value === 'choice' && choiceMode.value === 'double' && modalConfig.value?.differentTrees) {
        shouldInclude = true
      }
      // For single-feat mode
      else if (selectionMode.value === 'single-feat') {
        shouldInclude = true
      }
    }

    if (shouldInclude) {
      uniqueTrees.add(feat.weapon_tree)
    }
  })

  // Return sorted list of trees that actually have feats available
  return Array.from(uniqueTrees)
    .sort()
    .map(treeId => ({
      id: treeId,
      name: getTreeName(treeId)
    }))
})

// Check if user has made a selection
const hasSelection = computed(() => {
  if (choseFatePoint.value) return true
  if (selectedFeat.value && !isInSelectionMode.value) return true
  if (selectedFeats.value.length > 0) return true
  return false
})

// Available trees (for two-feat selection)
const availableTreesForSelection = computed(() => {
  // For Protege postponed selections, use provided trees
  if (props.availableTrees && props.availableTrees.length > 0) {
    return props.availableTrees.map(treeId => ({
      id: treeId,
      name: getTreeName(treeId),
      description: `Select from ${getTreeName(treeId)} tree`
    }))
  }

  // For Dual Wielding double mode, show all trees with 2+ feats at the target level
  if (choiceMode.value === 'double' && modalConfig.value) {
    const targetLevel = modalConfig.value.levels?.[1]
    if (!targetLevel) return []

    const allTrees = [
      'FIST', 'DAGGER', 'STRAIGHT_THRUST', 'KATANA_CURVED',
      'ULTRA_GREAT_SWORD', 'GREAT_AXE', 'GREAT_HAMMER', 'TWINBLADE',
      'SPEAR', 'HALBERD', 'REAPER', 'WHIP',
      'CROSS_BOW', 'GREAT_BOW_BALLISTA', 'GUN', 'SHIELD',
      'SORCERY', 'MIRACLE', 'PYROMANCY', 'HEX', 'SPIRIT_SUMMONING'
    ]

    return allTrees
      .map(treeId => {
        const featsAtLevel = (compendiumStore.WeaponFeats || []).filter(
          f => f.weapon_tree === treeId && f.level === targetLevel
        )
        return {
          id: treeId,
          name: getTreeName(treeId),
          description: `${featsAtLevel.length} feat(s) available`,
          featCount: featsAtLevel.length
        }
      })
      .filter(tree => tree.featCount >= 2)  // Show trees with 2 or more feats
  }

  // For Dual Wielding single mode, show all trees except Dual Wielding itself
  const allTrees = [
    'FIST', 'DAGGER', 'STRAIGHT_THRUST', 'KATANA_CURVED',
    'ULTRA_GREAT_SWORD', 'GREAT_AXE', 'GREAT_HAMMER', 'TWINBLADE',
    'SPEAR', 'HALBERD', 'REAPER', 'WHIP',
    'CROSS_BOW', 'GREAT_BOW_BALLISTA', 'GUN', 'SHIELD',
    'SORCERY', 'MIRACLE', 'PYROMANCY', 'HEX', 'SPIRIT_SUMMONING'
  ]

  return allTrees.map(treeId => ({
    id: treeId,
    name: getTreeName(treeId),
    description: `Select from ${getTreeName(treeId)} tree`
  }))
})

// Feat selection title
const featSelectionTitle = computed(() => {
  if (!modalConfig.value) return 'Select a Feat'

  // Halberd double mode (Two in One)
  if (selectionMode.value === 'halberd-double') {
    const level = modalConfig.value.levels[0]
    if (selectedFeats.value.length === 0) {
      return `Select One Level ${level} Spear Feat AND One Level ${level} Axe/Greataxe Feat (0/2)`
    } else if (selectedFeats.value.length === 1) {
      const firstFeat = getFeatById(selectedFeats.value[0])
      const firstTree = getTreeName(firstFeat?.weapon_tree || '')
      const otherTree = firstFeat?.weapon_tree === 'SPEAR' ? 'Axe/Greataxe' : 'Spear'
      return `Selected: ${firstTree} - Now select a Level ${level} ${otherTree} Feat (1/2)`
    } else {
      return `Selected Both Feats (2/2)`
    }
  }

  if (choiceMode.value === 'double') {
    const level = modalConfig.value.levels[1]
    const availableFeatsCount = filteredFeats.value.filter(f => !isFeatDisabled(f)).length

    if (availableFeatsCount === 2 && selectedFeats.value.length === 2) {
      return `Both Level ${level} Feats (Auto-Selected)`
    } else if (availableFeatsCount > 2) {
      return `Select 2 Level ${level} Feats (${selectedFeats.value.length}/2)`
    } else {
      return `Select Both Level ${level} Feats (${selectedFeats.value.length}/2)`
    }
  } else if (choiceMode.value === 'single') {
    return `Select Level ${modalConfig.value.levels[0]} Feat`
  } else if (modalConfig.value.levels.length > 1) {
    return `Select a Feat (Level ${modalConfig.value.levels.join(' or ')})`
  } else {
    return `Select a Level ${modalConfig.value.levels[0]} Feat`
  }
})

// Filtered feats based on selection mode and tree
const filteredFeats = computed(() => {
  if (!modalConfig.value) return []

  const allFeats = compendiumStore.WeaponFeats || []
  let feats: any[] = []

  // Step 1: Apply category/level/tree filtering (existing logic)
  // For choice mode - single feat
  if (selectionMode.value === 'choice' && choiceMode.value === 'single') {
    const targetLevel = modalConfig.value.levels?.[0]
    if (!targetLevel) return []

    // For Musical Instruments, filter to Magic Trees only for single high-level feat
    if (modalConfig.value.categoryFiltered) {
      feats = allFeats.filter(feat =>
        feat.level === targetLevel &&
        feat.id !== props.grantingFeatId &&
        isMagicTree(feat.weapon_tree)  // Only Magic Trees for Musical single feat
      )
    } else {
      // Exclude only the granting feat itself, not the entire tree
      feats = allFeats.filter(feat =>
        feat.level === targetLevel &&
        feat.id !== props.grantingFeatId  // Allow feats from same tree, just not the granting feat
      )
    }
  }

  // For choice mode - double feats from different trees/categories
  else if (selectionMode.value === 'choice' && choiceMode.value === 'double' && modalConfig.value.differentTrees) {
    const targetLevel = modalConfig.value.levels?.[1]
    if (!targetLevel) return []

    // For Musical Instruments: one from Magic Trees, one from Other Trees
    if (modalConfig.value.categoryFiltered) {
      // Show all feats at target level from both categories
      feats = allFeats.filter(feat => feat.level === targetLevel)
    } else {
      // For Dual Wielding: feats from literally different trees (no category restriction)
      feats = allFeats.filter(feat => feat.level === targetLevel)
    }
  }

  // For choice mode - double feats (both from one tree)
  else if (selectionMode.value === 'choice' && choiceMode.value === 'double' && selectedTree.value) {
    const targetLevel = modalConfig.value.levels?.[1]
    if (!targetLevel) return []
    feats = allFeats.filter(feat =>
      feat.weapon_tree === selectedTree.value && feat.level === targetLevel
    )
  }

  // For Halberd double mode (Two in One: one from SPEAR, one from GREAT_AXE)
  else if (selectionMode.value === 'halberd-double') {
    const targetLevel = modalConfig.value.levels?.[0]
    if (!targetLevel) return []

    // Filter to halberdTrees only
    feats = allFeats.filter(feat =>
      feat.level === targetLevel &&
      modalConfig.value?.halberdTrees?.includes(feat.weapon_tree)
    )
  }

  // For single feat selection
  else if (selectionMode.value === 'single-feat') {
    feats = allFeats.filter(feat => {
      // Check if feat level matches
      if (!modalConfig.value?.levels?.includes(feat.level)) return false

      // For Protege selections with available trees (milestone-based filtering)
      if (props.modalType && props.modalType.startsWith('protege') && props.availableTrees && props.availableTrees.length > 0) {
        // Filter to only show feats from trees that have reached the milestone
        if (!props.availableTrees.includes(feat.weapon_tree)) return false
      }

      // For Halberd feats with halberdTrees filter (Two in One+, Master of All Trades)
      if (modalConfig.value?.halberdTrees?.length) {
        if (!modalConfig.value.halberdTrees.includes(feat.weapon_tree)) return false
      }

      // NOTE: DUAL_WIELDING is now allowed for all Protege selections

      return true
    })
  }

  // Step 2: Apply tree filter if selected
  if (selectedTreeFilter.value) {
    feats = feats.filter(feat =>
      feat.weapon_tree === selectedTreeFilter.value
    )
  }

  // Step 3: Apply search filter if search query exists
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    feats = feats.filter(feat =>
      feat.name.toLowerCase().includes(query)
    )
  }

  // Step 4: Sort enabled feats to the top (Musical Instruments smart ordering)
  if (modalConfig.value?.categoryFiltered && modalConfig.value?.differentTrees && isInSelectionMode.value) {
    feats = feats.sort((a, b) => {
      const aDisabled = isFeatDisabled(a)
      const bDisabled = isFeatDisabled(b)

      // Both enabled or both disabled - maintain original order
      if (aDisabled === bDisabled) return 0

      // Enabled feats first
      return aDisabled ? 1 : -1
    })
  }

  return feats
})

// Check if feat is already obtained or disabled by Musical Instruments/Halberd logic
function isFeatDisabled(feat: any): boolean {
  // Check if already obtained
  const alreadyObtained = playerStore.ObtainedWeaponProfFeats.some(
    (obtained: any) => obtained.feat_id === feat.id
  )
  if (alreadyObtained) return true

  // Halberd double mode logic (Two in One: one from SPEAR, one from GREAT_AXE)
  if (selectionMode.value === 'halberd-double' && isInSelectionMode.value) {
    // Never disable already-selected feats (allow deselection)
    if (selectedFeats.value.includes(feat.id)) {
      return false
    }
    // If one feat selected, disable all OTHER feats from that tree
    if (selectedFeats.value.length === 1) {
      const firstSelectedFeat = getFeatById(selectedFeats.value[0])
      const firstTree = firstSelectedFeat?.weapon_tree

      // Disable all OTHER feats from the same tree (not the selected one)
      if (feat.weapon_tree === firstTree) {
        return true
      }
    }
    // If two feats selected, can't select more (but can still deselect)
    if (selectedFeats.value.length >= 2) {
      return true  // All non-selected feats are disabled
    }
    return false
  }

  // Musical Instruments smart disabling logic (Option 2 only)
  if (modalConfig.value?.categoryFiltered && modalConfig.value?.differentTrees && isInSelectionMode.value) {
    const featCategory = getTreeCategory(feat.weapon_tree)

    // If no feats selected yet, only Magic Trees are enabled
    if (selectedFeats.value.length === 0) {
      return featCategory !== 'magic'  // Disable all non-magic feats
    }

    // If one feat selected, check which category it was
    if (selectedFeats.value.length === 1) {
      const firstSelectedFeat = getFeatById(selectedFeats.value[0])
      const firstCategory = getTreeCategory(firstSelectedFeat?.weapon_tree || '')

      // If first selection was Magic, disable all Magic feats (enable Others)
      if (firstCategory === 'magic') {
        return featCategory === 'magic'
      }
      // If first selection was Other (shouldn't happen, but handle it), disable all Others
      else {
        return featCategory === 'other'
      }
    }
  }

  return false
}

function getDisabledReason(feat: any): string {
  // Check if already obtained
  const alreadyObtained = playerStore.ObtainedWeaponProfFeats.some(
    (obtained: any) => obtained.feat_id === feat.id
  )
  if (alreadyObtained) return 'Already obtained'

  // Halberd double mode specific reasons
  if (selectionMode.value === 'halberd-double' && isInSelectionMode.value) {
    if (selectedFeats.value.length === 1) {
      const firstSelectedFeat = getFeatById(selectedFeats.value[0])
      const firstTree = firstSelectedFeat?.weapon_tree

      if (feat.weapon_tree === firstTree) {
        return `Already selected ${getTreeName(firstTree)} feat`
      }
    }
    if (selectedFeats.value.length >= 2 && !selectedFeats.value.includes(feat.id)) {
      return 'Already selected 2 feats'
    }
    return ''
  }

  // Musical Instruments specific reasons
  if (modalConfig.value?.categoryFiltered && modalConfig.value?.differentTrees && isInSelectionMode.value) {
    const featCategory = getTreeCategory(feat.weapon_tree)

    if (selectedFeats.value.length === 0 && featCategory !== 'magic') {
      return 'Select a Magic Tree feat first'
    }

    if (selectedFeats.value.length === 1) {
      const firstSelectedFeat = getFeatById(selectedFeats.value[0])
      const firstCategory = getTreeCategory(firstSelectedFeat?.weapon_tree || '')

      if (firstCategory === 'magic' && featCategory === 'magic') {
        return 'Already selected Magic Tree feat'
      }
      if (firstCategory === 'other' && featCategory === 'other') {
        return 'Already selected Other Tree feat'
      }
    }
  }

  return ''
}

// Get selected feat object
const selectedFeatObject = computed(() => {
  if (!selectedFeat.value) return null
  return compendiumStore.WeaponFeats.find(f => f.id === selectedFeat.value)
})

// Can confirm selection
const canConfirm = computed(() => {
  if (choseFatePoint.value) return true
  if (selectedFeat.value && !isInSelectionMode.value) return true
  // For multi-selection, need exactly 2 feats
  if (isInSelectionMode.value && selectedFeats.value.length === 2) return true
  return false
})

// Helper to get feat by ID
function getFeatById(featId: number) {
  return compendiumStore.WeaponFeats.find(f => f.id === featId)
}

// Helper to get tree display name
function getTreeName(treeId: string | undefined): string {
  if (!treeId) return ''
  const names: Record<string, string> = {
    FIST: 'Fist',
    DAGGER: 'Dagger',
    STRAIGHT_THRUST: 'Straight/Thrust Sword',
    KATANA_CURVED: 'Katana/Curved Sword',
    ULTRA_GREAT_SWORD: 'Ultra Great Sword',
    GREAT_AXE: 'Great Axe',
    GREAT_HAMMER: 'Great Hammer',
    TWINBLADE: 'Twinblade',
    SPEAR: 'Spear',
    HALBERD: 'Halberd',
    REAPER: 'Reaper',
    WHIP: 'Whip',
    CROSS_BOW: 'Crossbow',
    GREAT_BOW_BALLISTA: 'Great Bow/Ballista',
    GUN: 'Gun',
    SHIELD: 'Shield',
    SORCERY: 'Sorcery',
    MIRACLE: 'Miracle',
    PYROMANCY: 'Pyromancy',
    HEX: 'Hex',
    SPIRIT_SUMMONING: 'Spirit Summoning',
    DUAL_WIELDING: 'Dual Wielding',
    MUSICAL_INSTRUMENTS: 'Musical Instruments'
  }
  return names[treeId] || treeId
}

// Helper to determine if a tree is a Magic Tree (for Musical Instruments)
function isMagicTree(treeId: string): boolean {
  const magicTrees = ['SORCERY', 'MIRACLE', 'PYROMANCY', 'HEX', 'SPIRIT_SUMMONING']
  return magicTrees.includes(treeId)
}

// Helper to get tree category
function getTreeCategory(treeId: string): 'magic' | 'other' {
  return isMagicTree(treeId) ? 'magic' : 'other'
}

function selectTree(treeId: string) {
  selectedTree.value = treeId
  selectedFeat.value = null  // Reset feat selection
  selectedFeats.value = []   // Reset multi-feat selection

  // Auto-select both feats if tree has exactly 2 feats at target level
  if (choiceMode.value === 'double' && modalConfig.value) {
    const targetLevel = modalConfig.value.levels?.[1]
    if (!targetLevel) return

    const featsAtLevel = (compendiumStore.WeaponFeats || []).filter(
      f => f.weapon_tree === treeId && f.level === targetLevel && !isFeatDisabled(f)
    )

    if (featsAtLevel.length === 2) {
      // Automatically select both feats
      selectedFeats.value = featsAtLevel.map(f => f.id)
    }
  }
}

function selectFeat(feat: any) {
  if (isInSelectionMode.value) {
    // Multi-selection mode: toggle feat in/out of selection
    const index = selectedFeats.value.indexOf(feat.id)

    if (index === -1) {
      // Adding a feat
      // For categoryFiltered mode (Musical Instruments), the isFeatDisabled logic handles validation
      // No need for alerts - disabled feats can't be clicked

      // Halberd double mode: enforce different tree selection
      if (selectionMode.value === 'halberd-double' && selectedFeats.value.length === 1) {
        const firstSelectedFeat = getFeatById(selectedFeats.value[0])
        if (firstSelectedFeat?.weapon_tree === feat.weapon_tree) {
          alert('You must select one feat from Spear and one from Axe/Greataxe!')
          return
        }
      }

      // differentTrees mode (Dual Wielding - non-Musical): enforce different tree selection
      if (modalConfig.value?.differentTrees && !modalConfig.value?.categoryFiltered && selectedFeats.value.length === 1) {
        const firstSelectedFeat = getFeatById(selectedFeats.value[0])
        if (firstSelectedFeat?.weapon_tree === feat.weapon_tree) {
          alert('You must select feats from different trees!')
          return
        }
      }

      // Add feat if not already selected and under the limit
      if (selectedFeats.value.length < 2) {
        selectedFeats.value.push(feat.id)
      }
    } else {
      // Removing a feat
      // Halberd double mode - allow free deselection of either feat
      if (selectionMode.value === 'halberd-double') {
        selectedFeats.value.splice(index, 1)
        return
      }

      // Musical Instruments smart unselection logic
      if (modalConfig.value?.categoryFiltered && modalConfig.value?.differentTrees) {
        const removingFeat = getFeatById(feat.id)
        const removingCategory = getTreeCategory(removingFeat?.weapon_tree || '')

        // If unselecting the Magic Tree feat (first selection), clear both
        if (removingCategory === 'magic') {
          selectedFeats.value = []
          return
        }
        // If unselecting the Other Tree feat (second selection), only clear that one
        else {
          selectedFeats.value.splice(index, 1)
          return
        }
      }

      // Default behavior for other modes
      selectedFeats.value.splice(index, 1)
    }
  } else {
    // Single selection mode
    selectedFeat.value = feat.id
  }
  choseFatePoint.value = false  // Deselect fate point if feat selected
}

function chooseFatePoint() {
  choseFatePoint.value = true
  selectedFeat.value = null  // Deselect feat if fate point chosen
}

function confirmSelection() {
  if (!canConfirm.value) return

  const selection: { featId?: number, featIds?: number[], choseFatePoint?: boolean, treeId?: string } = {}

  if (choseFatePoint.value) {
    selection.choseFatePoint = true
  } else if (isInSelectionMode.value && selectedFeats.value.length === 2) {
    // Multi-feat selection
    selection.featIds = selectedFeats.value
    selection.treeId = selectedTree.value || undefined
  } else if (selectedFeat.value) {
    // Single feat selection
    selection.featId = selectedFeat.value
    if (selectedTree.value) {
      selection.treeId = selectedTree.value
    }
  }

  emit('confirm', selection)
  emit('close')
}

function handlePostpone() {
  emit('postpone')
  emit('close')
}

function closeModal() {
  // Modal closed without completing - emit close event
  // Parent component will handle reversion if needed
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-container {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 2px solid var(--color-gold-primary);
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.0);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  color: var(--color-gold-primary);
  font-size: 1.4em;
  font-weight: bold;
  margin: 0;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.modal-description {
  color: #ccc;
  font-size: 1em;
  margin-bottom: 24px;
  line-height: 1.5;
}

.section-title {
  color: var(--color-gold-primary);
  font-size: 1.1em;
  font-weight: bold;
  margin-bottom: 16px;
}

/* Tree selection */
.tree-selection-section {
  margin-bottom: 24px;
}

.tree-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.tree-card {
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.tree-card:hover {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(0, 0, 0, 0.7);
}

.tree-card.selected {
  border-color: var(--color-gold-primary);
  background: var(--color-gold-rgba-light);
}

.tree-name {
  color: white;
  font-weight: bold;
  font-size: 1em;
  margin-bottom: 8px;
}

.tree-info {
  color: #999;
  font-size: 0.85em;
}

/* Filter bar (search + tree filter) */
.filter-bar-section {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 8px 12px;
}

.search-icon {
  font-size: 1.1em;
  margin-right: 8px;
  opacity: 0.7;
}

.search-input {
  flex: 1;
  background: transparent !important;
  border: none !important;
  outline: none !important;
  color: white;
  font-size: 1em;
  padding: 4px 0;
  box-shadow: none !important;
}

.search-input:focus {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.search-input::placeholder {
  color: #999;
}

.clear-search-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9em;
  padding: 4px 8px;
  margin-left: 8px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.clear-search-button:hover {
  opacity: 1;
}

/* Tree filter */
.tree-filter-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tree-filter-label {
  color: #ccc;
  font-size: 0.95em;
  font-weight: 500;
  white-space: nowrap;
}

.tree-filter-select {
  flex: 1;
  background: rgba(0, 0, 0, 0.5) !important;
  border: 2px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 8px;
  color: white;
  font-size: 1em;
  padding: 8px 12px;
  cursor: pointer;
  outline: none !important;
  box-shadow: none !important;
}

.tree-filter-select:hover {
  background: rgba(0, 0, 0, 0.5) !important;
  border: 2px solid rgba(255, 255, 255, 0.2) !important;
  box-shadow: none !important;
}

.tree-filter-select:focus {
  background: rgba(0, 0, 0, 0.5) !important;
  border: 2px solid rgba(255, 255, 255, 0.2) !important;
  box-shadow: none !important;
}

.tree-filter-select option {
  background: #1a1a1a;
  color: white;
}

/* Feat selection */
.feat-selection-section {
  margin-bottom: 24px;
}

.feat-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.feat-card {
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.feat-card:hover:not(.disabled):not(.selected) {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(0, 0, 0, 0.7);
}

.feat-card.selected {
  border-color: var(--color-gold-primary);
  background: var(--color-gold-rgba-light);
}

.feat-card.selected:hover {
  border-color: var(--color-gold-primary);
  background: var(--color-gold-rgba-light);
}

.feat-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.feat-name {
  color: white;
  font-weight: bold;
  font-size: 1em;
}

.feat-level {
  color: var(--color-gold-primary);
  font-size: 0.9em;
}

.feat-description {
  color: #bbb;
  font-size: 0.9em;
  line-height: 1.4;
}

.feat-disabled-reason {
  color: #f66;
  font-size: 0.85em;
  margin-top: 8px;
}

/* Fate point choice */
.fate-point-choice-section {
  margin-bottom: 24px;
}

.fate-point-card {
  background: rgba(100, 100, 200, 0.2);
  border: 2px solid rgba(100, 150, 255, 0.4);
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 16px;
}

.fate-point-card:hover {
  border-color: rgba(100, 150, 255, 0.6);
  background: rgba(100, 100, 200, 0.3);
}

.fate-point-card.selected {
  border-color: var(--color-gold-primary);
  background: var(--color-gold-rgba-light);
}

.fate-point-text strong {
  color: white;
  display: block;
  margin-bottom: 8px;
}

.fate-point-text p {
  color: #ccc;
  margin: 0;
}

/* Confirmation */
.confirmation-section {
  margin-bottom: 24px;
}

.confirmation-card {
  background: var(--color-green-rgba-light);
  border: 2px solid var(--color-green-primary);
  border-radius: 8px;
  padding: 20px;
}

.confirmation-feat-name {
  color: white;
  font-weight: bold;
  font-size: 1.1em;
  margin-bottom: 8px;
}

.confirmation-feat-level {
  color: var(--color-gold-primary);
  font-size: 0.9em;
  margin-bottom: 8px;
}

.confirmation-feat-tree {
  color: #ccc;
  font-size: 0.9em;
  margin-bottom: 12px;
}

.confirmation-feat-description {
  color: #ddd;
  font-size: 0.95em;
  line-height: 1.4;
}

/* Footer */
.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  justify-content: flex-end;
}

.button-cancel,
.button-confirm {
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.button-cancel {
  background: rgba(150, 150, 150, 0.2);
  color: white;
  border-color: rgba(150, 150, 150, 0.4);
}

.button-cancel:hover:not(:disabled) {
  background: rgba(150, 150, 150, 0.3);
  border-color: rgba(150, 150, 150, 0.6);
}

.button-confirm {
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  color: #ffffff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
  transition: var(--transition-hover);
}

.button-confirm:hover:not(:disabled) {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
}

.button-cancel:disabled,
.button-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Choice section */
.choice-section {
  margin-bottom: 24px;
}

.choice-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.choice-card {
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.choice-card:hover {
  border-color: var(--color-gold-primary);
  background: var(--color-gold-rgba-light);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
}

.choice-title {
  color: white;
  font-weight: bold;
  font-size: 1.1em;
  margin-bottom: 8px;
}

.choice-description {
  color: #ccc;
  font-size: 0.9em;
  line-height: 1.4;
}

/* Back button */
.back-button {
  background: rgba(150, 150, 150, 0.2);
  border: 1px solid rgba(150, 150, 150, 0.4);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  margin-bottom: 12px;
  transition: all 0.2s;
}

.back-button:hover {
  background: rgba(150, 150, 150, 0.3);
  border-color: rgba(150, 150, 150, 0.6);
}

/* Multi-feat confirmation */
.confirmation-multi-title {
  color: white;
  font-weight: bold;
  font-size: 1.1em;
  margin-bottom: 16px;
}

.confirmation-feat-item {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 8px;
}

.confirmation-feat-item:last-child {
  margin-bottom: 0;
}

/* Scrollbar styling */
.modal-body::-webkit-scrollbar,
.feat-list::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track,
.feat-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb,
.feat-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover,
.feat-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
