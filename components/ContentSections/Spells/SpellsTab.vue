<template>
  <div class="flex flex-col w-full overflow-hidden main-tab">
    <!-- Header with Attunement Slots Display -->
    <div class="page-header-bar">
      <h1 class="page-title">
        Spells | Spirits | Weapon Skills
      </h1>

      <div class="text-lg attunement-display" style="position: absolute; right: 1.5rem;">
        Attunement: <span class="attunement-count">{{ attunedCount }}/{{ totalAttunementSlots }}</span>
      </div>
    </div>

    <!-- Two-column layout -->
    <div class="flex spells-content-wrapper">
      <!-- Left Panel: List -->
      <div class="flex flex-col w-1/2 border-r overflow-auto spells-panel-left">
        <!-- Tabs -->
        <div class="sticky top-0 p-4 w-full flex flex-col justify-center font-semibold z-10 border-b filter-panel">
          <div class="flex justify-between rounded-md overflow-hidden mb-4 tab-buttons-container">
            <button
              class="text-center border-r flex-1 p-2 tab-button"
              :class="activeTab === 'spells' && 'tab-button-active'"
              @click="activeTab = 'spells'"
            >
              Spells
            </button>

            <button
              class="text-center border-r flex-1 p-2 tab-button"
              :class="activeTab === 'spirits' && 'tab-button-active'"
              @click="activeTab = 'spirits'"
            >
              Spirits
            </button>

            <button
              class="text-center flex-1 p-2 tab-button"
              :class="activeTab === 'weaponskills' && 'tab-button-active'"
              @click="activeTab = 'weaponskills'"
            >
              Weapon Skills
            </button>
          </div>

          <!-- Search -->
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search..."
            class="w-full px-3 py-2 rounded mb-4 search-input-field"
          />

          <!-- Filters for Spells -->
          <div v-if="activeTab === 'spells'" class="flex flex-col space-y-2">
            <!-- View Mode Filter -->
            <select v-model="viewMode" class="px-3 py-2 rounded filter-select">
              <option value="all">All Spells</option>
              <option value="learned">Learned Only</option>
              <option value="attuned">Attuned Only</option>
              <option value="not_learned">Not Learned</option>
            </select>

            <!-- Requirements Filter -->
            <select v-model="requirementsFilter" class="px-3 py-2 rounded filter-select">
              <option value="all">All Requirements</option>
              <option value="can_learn">Can Learn (Meet Requirements)</option>
              <option value="cannot_learn">Cannot Learn Yet</option>
            </select>

            <!-- Category Filter -->
            <select v-model="categoryFilter" class="px-3 py-2 rounded filter-select">
              <option value="all">All Categories</option>
              <option value="SORCERY">Sorcery</option>
              <option value="HEX">Hex</option>
              <option value="MIRACLE">Miracle</option>
              <option value="PYROMANCY">Pyromancy</option>
              <option value="SPECIAL">Special (Time Magic)</option>
            </select>

            <!-- Specialization Filter -->
            <select v-if="categoryFilter !== 'all' && categoryFilter !== 'SPECIAL'" v-model="specializationFilter" class="px-3 py-2 rounded filter-select">
              <option value="all">All Specializations</option>
              <option v-for="spec in availableSpecializations" :key="spec.value" :value="spec.value">
                {{ spec.label }}
              </option>
            </select>
          </div>

          <!-- Filters for Spirits -->
          <div v-if="activeTab === 'spirits'" class="flex flex-col space-y-2">
            <!-- View Mode Filter -->
            <select v-model="viewMode" class="px-3 py-2 rounded filter-select">
              <option value="all">All Spirits</option>
              <option value="learned">Learned Only</option>
              <option value="attuned">Attuned Only</option>
              <option value="not_learned">Not Learned</option>
            </select>

            <!-- Requirements Filter -->
            <select v-model="requirementsFilter" class="px-3 py-2 rounded filter-select">
              <option value="all">All Requirements</option>
              <option value="can_learn">Can Learn (Meet Requirements)</option>
              <option value="cannot_learn">Cannot Learn Yet</option>
            </select>

            <!-- Tier Filter -->
            <select v-model="tierFilter" class="px-3 py-2 rounded filter-select">
              <option value="all">All Tiers</option>
              <option value="TIER_I">Tier I</option>
              <option value="TIER_II">Tier II</option>
              <option value="TIER_III">Tier III</option>
              <option value="TIER_IV">Tier IV</option>
            </select>

            <!-- Size Filter -->
            <select v-model="sizeFilter" class="px-3 py-2 rounded filter-select">
              <option value="all">All Sizes</option>
              <option value="SMALL">Small</option>
              <option value="MEDIUM">Medium</option>
              <option value="LARGE">Large</option>
              <option value="HUGE">Huge</option>
              <option value="GARGANTUAN">Gargantuan</option>
              <option value="COLOSSAL">Colossal</option>
            </select>
          </div>

          <!-- Filters for Weapon Skills (View Mode only) -->
          <div v-if="activeTab === 'weaponskills'" class="flex flex-col space-y-2">
            <select v-model="viewMode" class="px-3 py-2 rounded filter-select">
              <option value="all">All Weapon Skills</option>
              <option value="learned">Learned Only</option>
              <option value="attuned">Attuned Only</option>
              <option value="not_learned">Not Learned</option>
            </select>
          </div>
        </div>

        <!-- List Display -->
        <div class="flex flex-col space-y-2 p-4">
          <button
            v-for="item in filteredItems"
            :key="item.id"
            class="flex justify-between items-center w-full rounded py-2 px-3 transition-colors cursor-pointer item-button"
            :class="getItemColorClass(item)"
            @click="selectedItem = item"
          >
            <div class="flex flex-col items-start">
              <span class="font-bold item-name">{{ item.name }}</span>
              <span class="text-sm item-category">{{ getItemCategoryDisplay(item) }}</span>
            </div>

            <div class="flex items-center space-x-2">
              <span v-if="isLearned(item)" class="text-xs px-2 py-1 rounded badge-learned">Learned</span>
              <span v-if="isAttuned(item)" class="text-xs px-2 py-1 rounded badge-attuned">Attuned</span>
            </div>
          </button>

          <div v-if="filteredItems.length === 0" class="italic text-center py-8 empty-state">
            No items found
          </div>
        </div>
      </div>

      <!-- Right Panel: Detail Panel -->
      <div class="w-1/2 overflow-auto p-4 detail-panel spells-panel-right">
        <div v-if="selectedItem" class="flex flex-col space-y-4">
          <!-- Item Name -->
          <div class="flex items-center gap-2">
            <h2 class="text-2xl font-bold item-title">
              {{ getItemWithModifications(selectedItem).name }}
            </h2>
            <span v-if="isCustomized(selectedItem)" class="text-sm font-semibold modified-badge" title="This item has custom modifications">
              [MODIFIED]
            </span>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2">
            <button
              v-if="!isLearned(selectedItem)"
              @click="learn(selectedItem)"
              class="px-4 py-2 rounded btn-learn"
            >
              Learn
            </button>

            <button
              v-if="isLearned(selectedItem)"
              @click="unlearn(selectedItem)"
              class="px-4 py-2 rounded btn-unlearn"
            >
              Unlearn
            </button>

            <button
              v-if="isLearned(selectedItem) && !isAttuned(selectedItem)"
              @click="attune(selectedItem)"
              :disabled="!canAttune"
              :title="!canAttune ? `Requires ${getAttunementCost(selectedItem, activeTab)} attunement slot(s) (${totalAttunementSlots - attunedCount} available)` : ''"
              class="px-4 py-2 rounded btn-attune"
              :class="!canAttune && 'btn-disabled'"
            >
              Attune
            </button>

            <button
              v-if="isAttuned(selectedItem)"
              @click="unattune(selectedItem)"
              class="px-4 py-2 rounded btn-unattune"
            >
              Unattune
            </button>

            <button
              @click="showEditModal = true"
              class="px-4 py-2 rounded btn-edit-item"
            >
              Edit
            </button>
          </div>

          <!-- Spell/Spirit/Skill Details -->
          <div class="rounded p-4 details-box">
            <div v-if="activeTab === 'spells'" class="flex flex-col space-y-2">
              <div><strong>Category:</strong> {{ getCategoryName(getItemWithModifications(selectedItem).category) }}</div>
              <div><strong>Specialization:</strong> {{ getSpecializationName(getItemWithModifications(selectedItem).category) }}</div>
              <div v-if="getItemWithModifications(selectedItem).requirements">
                <strong>Requirements:</strong>
                <span v-if="getItemWithModifications(selectedItem).requirements.str">STR {{ getItemWithModifications(selectedItem).requirements.str }}, </span>
                <span v-if="getItemWithModifications(selectedItem).requirements.dex">DEX {{ getItemWithModifications(selectedItem).requirements.dex }}, </span>
                INT {{ getItemWithModifications(selectedItem).requirements.int || 0 }},
                FAI {{ getItemWithModifications(selectedItem).requirements.fai || 0 }}
              </div>
              <div><strong>Attunement Cost:</strong> {{ getItemWithModifications(selectedItem).att_cost || 1 }}</div>
              <div><strong>AP Cost:</strong> {{ getItemWithModifications(selectedItem).ap || getItemWithModifications(selectedItem).cost_ap || 'N/A' }}</div>
              <div><strong>FP Cost:</strong> {{ getItemWithModifications(selectedItem).cost_fp || 0 }}</div>
              <div v-if="getItemWithModifications(selectedItem).is_slow"><span class="slow-action-indicator">Slow Action</span></div>
              <div class="mt-4"><strong>Description:</strong></div>
              <div>{{ getItemWithModifications(selectedItem).description }}</div>
            </div>

            <div v-if="activeTab === 'spirits'" class="flex flex-col space-y-2">
              <div><strong>Tier:</strong> {{ getItemWithModifications(selectedItem).tier }}</div>
              <div><strong>Size:</strong> {{ getItemWithModifications(selectedItem).size }}</div>
              <div v-if="getItemWithModifications(selectedItem).requirements">
                <strong>Requirements:</strong>
                <span v-if="getItemWithModifications(selectedItem).requirements.str">STR {{ getItemWithModifications(selectedItem).requirements.str }}, </span>
                <span v-if="getItemWithModifications(selectedItem).requirements.dex">DEX {{ getItemWithModifications(selectedItem).requirements.dex }}, </span>
                INT {{ getItemWithModifications(selectedItem).requirements.int || 0 }},
                FAI {{ getItemWithModifications(selectedItem).requirements.fai || 0 }}
              </div>
              <div><strong>Attunement Cost:</strong> {{ getItemWithModifications(selectedItem).att_cost || 1 }}</div>
              <div><strong>AP Cost:</strong> {{ getItemWithModifications(selectedItem).ap || 0 }}</div>
              <div><strong>FP Cost:</strong> {{ getItemWithModifications(selectedItem).fp || 0 }}</div>
              <div class="mt-4"><strong>Description:</strong></div>
              <div>{{ getItemWithModifications(selectedItem).description }}</div>
            </div>

            <div v-if="activeTab === 'weaponskills'" class="flex flex-col space-y-2">
              <div><strong>Usage Type:</strong> {{ getItemWithModifications(selectedItem).usage_type }}</div>
              <div><strong>FP Cost:</strong> {{ getItemWithModifications(selectedItem).cost_fp || 0 }}</div>
              <div v-if="getItemWithModifications(selectedItem).is_slow"><span class="slow-action-indicator">Slow Action</span></div>
              <div class="mt-4"><strong>Description:</strong></div>
              <div>{{ getItemWithModifications(selectedItem).description }}</div>
            </div>
          </div>

          <!-- Reset to Default Button (if customized) -->
          <button
            v-if="isCustomized(selectedItem)"
            @click="resetToDefault(selectedItem)"
            class="px-4 py-2 rounded btn-reset"
          >
            Reset to Default
          </button>
        </div>

        <div v-else class="italic text-center py-8 no-selection">
          Select an item to view details
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal && selectedItem" class="edit-modal-overlay" @click.self="showEditModal = false">
      <div class="rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto modal-content-box">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold modal-title">Edit {{ selectedItem.name }}</h2>
          <button @click="showEditModal = false" class="modal-close-button text-2xl">&times;</button>
        </div>

        <div class="space-y-4">
          <!-- Attunement Cost -->
          <div>
            <label class="block mb-2 modal-label">Attunement Cost</label>
            <input
              v-model.number="editForm.att_cost"
              type="number"
              min="0"
              class="w-full px-3 py-2 rounded modal-input"
            />
          </div>

          <!-- AP Cost -->
          <div>
            <label class="block mb-2 modal-label">AP Cost</label>
            <input
              v-model.number="editForm.ap"
              type="number"
              min="0"
              class="w-full px-3 py-2 rounded modal-input"
            />
          </div>

          <!-- FP Cost -->
          <div>
            <label class="block mb-2 modal-label">FP Cost</label>
            <input
              v-model.number="editForm.cost_fp"
              type="number"
              min="0"
              class="w-full px-3 py-2 rounded modal-input"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block mb-2 modal-label">Description</label>
            <textarea
              v-model="editForm.description"
              rows="4"
              class="w-full px-3 py-2 rounded modal-textarea"
            ></textarea>
          </div>

          <!-- Range (Spells and Spirits) -->
          <div v-if="activeTab === 'spells' || activeTab === 'spirits'">
            <label class="block mb-2 modal-label">Range</label>
            <input
              v-model="editForm.range"
              type="text"
              class="w-full px-3 py-2 rounded modal-input"
              placeholder="e.g., 30 feet, Touch, Self"
            />
          </div>

          <!-- Spell/Spirit-specific fields -->
          <div v-if="activeTab === 'spells' || activeTab === 'spirits'" class="space-y-4">
            <div class="text-lg font-semibold modal-label">Stat Requirements</div>

            <!-- STR Requirement -->
            <div>
              <label class="block mb-2 modal-label">STR Requirement</label>
              <input
                v-model.number="editForm.requirements.str"
                type="number"
                min="0"
                class="w-full px-3 py-2 rounded modal-input"
              />
            </div>

            <!-- DEX Requirement -->
            <div>
              <label class="block mb-2 modal-label">DEX Requirement</label>
              <input
                v-model.number="editForm.requirements.dex"
                type="number"
                min="0"
                class="w-full px-3 py-2 rounded modal-input"
              />
            </div>

            <!-- INT Requirement -->
            <div>
              <label class="block mb-2 modal-label">INT Requirement</label>
              <input
                v-model.number="editForm.requirements.int"
                type="number"
                min="0"
                class="w-full px-3 py-2 rounded modal-input"
              />
            </div>

            <!-- FAI Requirement -->
            <div>
              <label class="block mb-2 modal-label">FAI Requirement</label>
              <input
                v-model.number="editForm.requirements.fai"
                type="number"
                min="0"
                class="w-full px-3 py-2 rounded modal-input"
              />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2 pt-4">
            <button
              @click="saveModifications"
              class="flex-1 px-4 py-2 rounded btn-save-modal"
            >
              Save Changes
            </button>
            <button
              @click="showEditModal = false"
              class="px-4 py-2 rounded btn-cancel-modal"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from '@/store/player'
import { useCompendiumStore } from '@/store/compendium'

const playerStore = usePlayerStore()
const compendiumStore = useCompendiumStore()

const activeTab = ref<'spells' | 'spirits' | 'weaponskills'>('spells')
const searchQuery = ref('')
const viewMode = ref('all')
const requirementsFilter = ref('all')
const categoryFilter = ref('all')
const specializationFilter = ref('all')
const tierFilter = ref('all')
const sizeFilter = ref('all')
const selectedItem = ref<any>(null)
const showEditModal = ref(false)
const editForm = ref<any>({
  att_cost: 1,
  ap: 0,
  cost_fp: 0,
  description: '',
  range: '',
  requirements: {
    str: 0,
    dex: 0,
    int: 0,
    fai: 0
  }
})

// Watch selectedItem and populate edit form
watch(selectedItem, (newItem) => {
  if (newItem) {
    const itemWithMods = getItemWithModifications(newItem)
    editForm.value = {
      att_cost: itemWithMods.att_cost || 1,
      ap: itemWithMods.ap || itemWithMods.cost_ap || 0,
      cost_fp: itemWithMods.cost_fp || itemWithMods.fp || 0,
      description: itemWithMods.description || '',
      range: itemWithMods.range || '',
      requirements: {
        str: itemWithMods.requirements?.str || 0,
        dex: itemWithMods.requirements?.dex || 0,
        int: itemWithMods.requirements?.int || 0,
        fai: itemWithMods.requirements?.fai || 0
      }
    }
  }
})

// Category mapping - maps API values to their parent category
const categoryMapping: Record<string, string> = {
  SOUL_CRYSTAL: 'SORCERY',
  FROST: 'SORCERY',
  ASSASSIN_LIGHT: 'SORCERY',
  COSMIC: 'SORCERY',
  DARK: 'HEX',
  DEBUFF_HEX: 'HEX',
  BLOOD: 'HEX',
  DEATH: 'HEX',
  DARKFROST_BLACKFIRE: 'HEX',
  HEALING: 'MIRACLE',
  LIGHTNING: 'MIRACLE',
  BUFF_DEF_MIRACLE: 'MIRACLE',
  FORCE: 'MIRACLE',
  FIRE: 'PYROMANCY',
  DRAGON: 'PYROMANCY',
  PESTILENCE: 'PYROMANCY',
  BUFF_DEBUFF_PYRO: 'PYROMANCY',
  TIME: 'SPECIAL'
}

// Specialization display names - preserve original naming with slashes
const specializationLabels: Record<string, string> = {
  SOUL_CRYSTAL: 'Soul/Crystal',
  FROST: 'Frost',
  ASSASSIN_LIGHT: 'Assassin/Light',
  COSMIC: 'Cosmic',
  DARK: 'Dark',
  DEBUFF_HEX: 'Debuffing',
  BLOOD: 'Blood',
  DEATH: 'Death',
  DARKFROST_BLACKFIRE: 'Darkfrost/Blackfire',
  HEALING: 'Healing',
  LIGHTNING: 'Lightning',
  BUFF_DEF_MIRACLE: 'Buffing and Defensive',
  FORCE: 'Force',
  FIRE: 'Fire',
  DRAGON: 'Dragon',
  PESTILENCE: 'Pestilence',
  BUFF_DEBUFF_PYRO: 'Buffing and Debuffing',
  TIME: 'Time Magic'
}

// Available specializations based on selected category
const availableSpecializations = computed(() => {
  const specs: Record<string, Array<{value: string, label: string}>> = {
    SORCERY: [
      { value: 'SOUL_CRYSTAL', label: 'Soul/Crystal' },
      { value: 'FROST', label: 'Frost' },
      { value: 'ASSASSIN_LIGHT', label: 'Assassin/Light' },
      { value: 'COSMIC', label: 'Cosmic' }
    ],
    HEX: [
      { value: 'DARK', label: 'Dark' },
      { value: 'DEBUFF_HEX', label: 'Debuffing' },
      { value: 'BLOOD', label: 'Blood' },
      { value: 'DEATH', label: 'Death' },
      { value: 'DARKFROST_BLACKFIRE', label: 'Darkfrost/Blackfire' }
    ],
    MIRACLE: [
      { value: 'HEALING', label: 'Healing' },
      { value: 'LIGHTNING', label: 'Lightning' },
      { value: 'BUFF_DEF_MIRACLE', label: 'Buffing and Defensive' },
      { value: 'FORCE', label: 'Force' }
    ],
    PYROMANCY: [
      { value: 'FIRE', label: 'Fire' },
      { value: 'DRAGON', label: 'Dragon' },
      { value: 'PESTILENCE', label: 'Pestilence' },
      { value: 'BUFF_DEBUFF_PYRO', label: 'Buffing and Debuffing' }
    ]
  }
  return specs[categoryFilter.value] || []
})

// Watch category filter and reset specialization when it changes
watch(categoryFilter, () => {
  specializationFilter.value = 'all'
})

// Total attunement slots calculation
// Formula: 1 + (Att stat - 10) + bonus, cannot go below 0
const totalAttunementSlots = computed(() => {
  const att = playerStore.CharacterStats.Stats.Attunement || 10
  const fromStat = Math.max(0, 1 + (att - 10))
  const bonus = playerStore.UserInputValues.AttunementSlots || 0
  return fromStat + bonus
})

// Get attunement cost with modifications
function getAttunementCost(item: any, itemType: 'spells' | 'spirits' | 'weaponskills'): number {
  if (!item) return 1

  const modifications = itemType === 'spells'
    ? playerStore.SpellModifications[item.id]
    : itemType === 'spirits'
    ? playerStore.SpiritModifications[item.id]
    : playerStore.WeaponSkillModifications[item.id]

  if (modifications && modifications.att_cost !== undefined) {
    return modifications.att_cost
  }

  return item.att_cost || 1
}

// Count attuned items (spells + spirits + weapon skills)
const attunedCount = computed(() => {
  let count = 0

  // Count attuned spells with their att_cost (including modifications)
  playerStore.AttunedSpells.forEach(spell => {
    // Find the spell in compendium to get current modifications
    const compendiumSpell = compendiumStore.Spells?.find((s: any) => s.id === spell.id)
    if (compendiumSpell) {
      count += getAttunementCost(compendiumSpell, 'spells')
    } else {
      count += spell.att_cost || 1
    }
  })

  // Count attuned spirits with their att_cost (including modifications)
  playerStore.AttunedSpirits.forEach(spirit => {
    // Find the spirit in compendium to get current modifications
    const compendiumSpirit = compendiumStore.Spirits?.find((s: any) => s.id === spirit.id)
    if (compendiumSpirit) {
      count += getAttunementCost(compendiumSpirit, 'spirits')
    } else {
      count += spirit.att_cost || 1
    }
  })

  // Count attuned weapon skills with their att_cost (including modifications)
  playerStore.AttunedWeaponSkills.forEach((skill: any) => {
    // Find the skill in compendium to get current modifications
    const compendiumSkill = compendiumStore.WeaponSkills?.find((s: any) => s.id === skill.id)
    if (compendiumSkill) {
      count += getAttunementCost(compendiumSkill, 'weaponskills')
    } else {
      count += skill.att_cost || 1
    }
  })

  return count
})

// Check if can attune more items
const canAttune = computed(() => {
  if (!selectedItem.value) return false
  const attCost = getAttunementCost(selectedItem.value, activeTab.value)
  return (attunedCount.value + attCost) <= totalAttunementSlots.value
})

// Get all items based on active tab
const allItems = computed(() => {
  if (activeTab.value === 'spells') {
    return compendiumStore.Spells
  } else if (activeTab.value === 'spirits') {
    return compendiumStore.Spirits
  } else {
    return compendiumStore.WeaponSkills
  }
})

// Filter items based on search, filters, and view mode
const filteredItems = computed(() => {
  let items = allItems.value

  // Search filter
  if (searchQuery.value) {
    items = items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // View mode filter
  if (viewMode.value === 'learned') {
    items = items.filter(item => isLearned(item))
  } else if (viewMode.value === 'attuned') {
    items = items.filter(item => isAttuned(item))
  } else if (viewMode.value === 'not_learned') {
    items = items.filter(item => !isLearned(item))
  }

  // Spell-specific filters
  if (activeTab.value === 'spells') {
    // Requirements filter
    if (requirementsFilter.value === 'can_learn') {
      items = items.filter(item => meetsRequirements(item))
    } else if (requirementsFilter.value === 'cannot_learn') {
      items = items.filter(item => !meetsRequirements(item))
    }

    // Category filter (maps API category to parent category)
    if (categoryFilter.value !== 'all') {
      items = items.filter(item => {
        const itemCategory = categoryMapping[item.category]
        return itemCategory === categoryFilter.value
      })
    }

    // Specialization filter (filters by exact API category value)
    if (specializationFilter.value !== 'all') {
      items = items.filter(item => item.category === specializationFilter.value)
    }
  }

  // Spirit-specific filters
  if (activeTab.value === 'spirits') {
    // Requirements filter
    if (requirementsFilter.value === 'can_learn') {
      items = items.filter(item => meetsRequirements(item))
    } else if (requirementsFilter.value === 'cannot_learn') {
      items = items.filter(item => !meetsRequirements(item))
    }

    // Tier filter
    if (tierFilter.value !== 'all') {
      items = items.filter(item => item.tier === tierFilter.value)
    }

    // Size filter
    if (sizeFilter.value !== 'all') {
      items = items.filter(item => item.size === sizeFilter.value)
    }
  }

  return items
})

// Get color class based on learned/attuned status
function getItemColorClass(item: any) {
  if (isAttuned(item)) {
    return 'item-attuned'
  } else if (isLearned(item)) {
    return 'item-learned'
  } else {
    return 'item-default-spell'
  }
}

// Check if item is learned
function isLearned(item: any) {
  if (activeTab.value === 'spells') {
    return playerStore.LearnedSpells.includes(item.id)
  } else if (activeTab.value === 'spirits') {
    return playerStore.LearnedSpirits.includes(item.id)
  } else {
    return playerStore.LearnedWeaponSkills.includes(item.id)
  }
}

// Check if item is attuned
function isAttuned(item: any) {
  if (activeTab.value === 'spells') {
    return playerStore.AttunedSpells.some(s => s.id === item.id)
  } else if (activeTab.value === 'spirits') {
    return playerStore.AttunedSpirits.some((s: any) => s.id === item.id)
  } else {
    return playerStore.AttunedWeaponSkills.some((s: any) => s.id === item.id)
  }
}

// Check if player meets spell/spirit requirements (STR/DEX/INT/FAI stats)
// This is used by the "Can Learn" / "Cannot Learn Yet" filter
// Returns true if player's stats are >= item requirements
function meetsRequirements(item: any) {
  if (!item.requirements) return true

  const str = playerStore.CharacterStats.Stats.Strength
  const dex = playerStore.CharacterStats.Stats.Dexterity
  const int = playerStore.CharacterStats.Stats.Intelligence
  const fai = playerStore.CharacterStats.Stats.Faith

  return str >= (item.requirements.str || 0) &&
         dex >= (item.requirements.dex || 0) &&
         int >= (item.requirements.int || 0) &&
         fai >= (item.requirements.fai || 0)
}

// Get item with modifications applied
function getItemWithModifications(item: any) {
  if (!item) return null

  const modifications = activeTab.value === 'spells'
    ? playerStore.SpellModifications[item.id]
    : activeTab.value === 'spirits'
    ? playerStore.SpiritModifications[item.id]
    : playerStore.WeaponSkillModifications[item.id]

  if (!modifications) return item

  // Merge modifications with original item
  return { ...item, ...modifications }
}

// Check if item is customized
function isCustomized(item: any) {
  if (!item) return false

  if (activeTab.value === 'spells') {
    return !!playerStore.SpellModifications[item.id]
  } else if (activeTab.value === 'spirits') {
    return !!playerStore.SpiritModifications[item.id]
  } else {
    return !!playerStore.WeaponSkillModifications[item.id]
  }
}

// Learn item
function learn(item: any) {
  if (activeTab.value === 'spells') {
    if (!playerStore.LearnedSpells.includes(item.id)) {
      playerStore.LearnedSpells.push(item.id)
      playerStore.save()
    }
  } else if (activeTab.value === 'spirits') {
    if (!playerStore.LearnedSpirits.includes(item.id)) {
      playerStore.LearnedSpirits.push(item.id)
      playerStore.save()
    }
  } else {
    if (!playerStore.LearnedWeaponSkills.includes(item.id)) {
      playerStore.LearnedWeaponSkills.push(item.id)
      playerStore.save()
    }
  }
}

// Unlearn item
function unlearn(item: any) {
  // First unattune if attuned
  if (isAttuned(item)) {
    unattune(item)
  }

  if (activeTab.value === 'spells') {
    const index = playerStore.LearnedSpells.indexOf(item.id)
    if (index !== -1) {
      playerStore.LearnedSpells.splice(index, 1)
      playerStore.save()
    }
  } else if (activeTab.value === 'spirits') {
    const index = playerStore.LearnedSpirits.indexOf(item.id)
    if (index !== -1) {
      playerStore.LearnedSpirits.splice(index, 1)
      playerStore.save()
    }
  } else {
    const index = playerStore.LearnedWeaponSkills.indexOf(item.id)
    if (index !== -1) {
      playerStore.LearnedWeaponSkills.splice(index, 1)
      playerStore.save()
    }
  }
}

// Attune item
function attune(item: any) {
  if (!canAttune.value) {
    alert('Not enough attunement slots!')
    return
  }

  // Create a copy with current modifications applied
  const itemCopy = JSON.parse(JSON.stringify(item))

  // Apply the current attunement cost (including modifications)
  const currentAttCost = getAttunementCost(item, activeTab.value)
  itemCopy.att_cost = currentAttCost

  if (activeTab.value === 'spells') {
    if (!playerStore.AttunedSpells.some(s => s.id === item.id)) {
      playerStore.AttunedSpells.push(itemCopy)
      playerStore.save()
    }
  } else if (activeTab.value === 'spirits') {
    if (!playerStore.AttunedSpirits.some((s: any) => s.id === item.id)) {
      playerStore.AttunedSpirits.push(itemCopy)
      playerStore.save()
    }
  } else {
    if (!playerStore.AttunedWeaponSkills.some((s: any) => s.id === item.id)) {
      playerStore.AttunedWeaponSkills.push(itemCopy)
      playerStore.save()
    }
  }
}

// Unattune item
function unattune(item: any) {
  if (activeTab.value === 'spells') {
    const index = playerStore.AttunedSpells.findIndex(s => s.id === item.id)
    if (index !== -1) {
      playerStore.AttunedSpells.splice(index, 1)
      playerStore.save()
    }
  } else if (activeTab.value === 'spirits') {
    const index = playerStore.AttunedSpirits.findIndex((s: any) => s.id === item.id)
    if (index !== -1) {
      playerStore.AttunedSpirits.splice(index, 1)
      playerStore.save()
    }
  } else {
    const index = playerStore.AttunedWeaponSkills.findIndex((s: any) => s.id === item.id)
    if (index !== -1) {
      playerStore.AttunedWeaponSkills.splice(index, 1)
      playerStore.save()
    }
  }
}

// Reset to default
function resetToDefault(item: any) {
  if (!item || !isCustomized(item)) return

  const confirmReset = confirm(
    `Warning, you are about to reset "${item.name}" to the compendium default. Are you sure you want to continue?`
  )

  if (!confirmReset) return

  if (activeTab.value === 'spells') {
    playerStore.clearSpellModification(item.id)
  } else if (activeTab.value === 'spirits') {
    playerStore.clearSpiritModification(item.id)
  } else {
    playerStore.clearWeaponSkillModification(item.id)
  }
}

// Get parent category name from API category value
function getCategoryName(apiCategory: string): string {
  const parentCategory = categoryMapping[apiCategory]
  const categoryNames: Record<string, string> = {
    SORCERY: 'Sorcery',
    HEX: 'Hex',
    MIRACLE: 'Miracle',
    PYROMANCY: 'Pyromancy',
    SPECIAL: 'Special'
  }
  return categoryNames[parentCategory] || 'Unknown'
}

// Get specialization name from API category value
function getSpecializationName(apiCategory: string): string {
  return specializationLabels[apiCategory] || apiCategory
}

// Get full category display for list (Category - Specialization)
function getSpellCategoryDisplay(spell: any): string {
  const category = getCategoryName(spell.category)
  const specialization = getSpecializationName(spell.category)
  return `${category} - ${specialization}`
}

// Get category display for item based on active tab
function getItemCategoryDisplay(item: any): string {
  if (activeTab.value === 'spells') {
    return getSpellCategoryDisplay(item)
  } else if (activeTab.value === 'spirits') {
    // Format: "Tier I - Medium", "Tier II - Large", etc.
    const tierDisplay = item.tier ? item.tier.replace('_', ' ') : 'Unknown Tier'
    const sizeDisplay = item.size || 'Unknown Size'
    return `${tierDisplay} - ${sizeDisplay}`
  } else {
    // Weapon Skills: show "Regular" or "Power Stance"
    return item.usage_type === 'STANCE' ? 'Power Stance' : 'Regular'
  }
}

// Save modifications
function saveModifications() {
  if (!selectedItem.value) return

  const modifications: any = {
    att_cost: editForm.value.att_cost,
    ap: editForm.value.ap,
    cost_fp: editForm.value.cost_fp,
    description: editForm.value.description
  }

  // Add spell/spirit-specific fields
  if (activeTab.value === 'spells' || activeTab.value === 'spirits') {
    modifications.range = editForm.value.range
    modifications.requirements = {
      str: editForm.value.requirements.str,
      dex: editForm.value.requirements.dex,
      int: editForm.value.requirements.int,
      fai: editForm.value.requirements.fai
    }
  }

  // Save to player store
  if (activeTab.value === 'spells') {
    playerStore.setSpellModification(selectedItem.value.id, modifications)
  } else if (activeTab.value === 'spirits') {
    playerStore.setSpiritModification(selectedItem.value.id, modifications)
  } else {
    playerStore.setWeaponSkillModification(selectedItem.value.id, modifications)
  }

  showEditModal.value = false
}
</script>

<style scoped>
/* Header styling */
.sticky.top-0.p-4.w-full.flex.justify-center.items-center {
  background: var(--color-bg-secondary);
  border-bottom: var(--border-width-medium) solid var(--color-border-primary);
}

.sticky.top-0.p-4.w-full.flex.justify-center.items-center h1 {
  color: var(--color-text-gold);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.sticky.top-0.p-4.w-full.flex.justify-center.items-center .text-yellow-400 {
  color: var(--color-accent-gold-bright);
}

/* Filter panel styling */
.sticky.top-0.p-4.w-full.flex.flex-col.justify-center {
  background: var(--color-bg-secondary);
  border-bottom: var(--border-width-thin) solid var(--color-border-primary);
}

/* Tab buttons */
.flex.justify-between.rounded-md.overflow-hidden button {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border-right: var(--border-width-thin) solid var(--color-border-primary);
  transition: var(--transition-hover);
}

.flex.justify-between.rounded-md.overflow-hidden button:hover {
  background: rgba(42, 42, 42, 0.8);
}

.flex.justify-between.rounded-md.overflow-hidden button.bg-\[#2a5573\] {
  background: var(--color-btn-primary-bg-active) !important;
  color: var(--color-accent-gold-bright) !important;
  box-shadow: var(--shadow-gold-soft);
}

/* Search and filter inputs */
input[type="text"],
select {
  background: var(--color-bg-tertiary) !important;
  color: var(--color-text-primary) !important;
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
}

input[type="text"]:focus {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
  outline: none;
}

select {
  cursor: pointer;
}

/* List items */
button.flex.justify-between.items-center.w-full.rounded {
  border-radius: var(--border-radius-md);
  transition: var(--transition-hover);
}

button.bg-blue-600 {
  background: rgba(65, 105, 225, 0.3) !important;
  border: var(--border-width-thin) solid var(--color-fp);
  color: var(--color-text-primary) !important;
}

button.bg-yellow-600 {
  background: var(--color-btn-primary-bg-active) !important;
  border: var(--border-width-thin) solid var(--color-accent-gold);
  color: var(--color-text-primary) !important;
}

button.bg-gray-700 {
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-secondary);
  color: var(--color-text-primary);
}

button.bg-gray-700:hover {
  background: rgba(42, 42, 42, 0.8);
  border-color: var(--color-border-primary);
}

/* Badge styling */
.text-xs.px-2.py-1.rounded {
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

span.bg-yellow-600.text-white {
  background: var(--color-btn-primary-border-hover);
  color: var(--color-text-primary);
}

span.bg-blue-600.text-white {
  background: rgba(65, 105, 225, 0.8);
  color: var(--color-text-primary);
}

/* Detail panel */
.flex.flex-col.space-y-4 h2 {
  color: var(--color-text-gold);
}

.text-yellow-400 {
  color: var(--color-accent-amber) !important;
}

/* Action buttons */
button.px-4.py-2.rounded {
  border-radius: var(--border-radius-sm);
  font-weight: var(--font-weight-semibold);
  transition: var(--transition-hover);
  border: var(--border-width-thin) solid transparent;
}

button.bg-yellow-600 {
  background: var(--color-btn-primary-border);
  border-color: var(--color-accent-gold);
  color: var(--color-accent-gold-bright);
}

button.bg-yellow-600:hover,
button.bg-yellow-700:hover {
  background: var(--color-btn-primary-border-hover);
  box-shadow: var(--shadow-gold-soft);
}

button.bg-red-600 {
  background: var(--color-red-rgba-medium);
  border-color: var(--color-danger);
  color: #ffffff;
}

button.bg-red-600:hover,
button.bg-red-700:hover {
  background: var(--color-red-rgba-strong);
}

button.bg-blue-600 {
  background: rgba(65, 105, 225, 0.5);
  border-color: var(--color-fp);
  color: #5b86ff;
}

button.bg-blue-600:hover,
button.bg-blue-700:hover {
  background: rgba(65, 105, 225, 0.7);
}

button.bg-green-600 {
  background: var(--color-green-rgba-medium);
  border-color: var(--color-success);
  color: var(--color-green-bright);
}

button.bg-green-600:hover,
button.bg-green-700:hover {
  background: var(--color-green-rgba-strong);
}

button.bg-gray-500 {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-secondary);
  color: var(--color-text-disabled);
  cursor: not-allowed;
}

button.bg-gray-600 {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-primary);
  color: var(--color-text-primary);
}

button.bg-gray-600:hover,
button.bg-gray-700:hover {
  background: rgba(42, 42, 42, 0.8);
}

button.bg-gray-700 {
  background: var(--color-bg-secondary);
  border-color: var(--color-border-primary);
  color: var(--color-text-primary);
}

button.bg-gray-700:hover,
button.bg-gray-800:hover {
  background: var(--color-bg-tertiary);
}

/* Details box */
.bg-white.rounded.p-4 {
  background: var(--color-bg-tertiary) !important;
  color: var(--color-text-primary) !important;
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
}

.bg-white.rounded.p-4 strong {
  color: var(--color-text-gold);
}

/* Modal */
.edit-modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 15000; /* Above CharacterSelector (10000) and Tab navigation (2000) */
}

.bg-gray-800.rounded-lg.p-6 {
  background: var(--color-bg-secondary);
  border: var(--border-width-medium) solid var(--color-border-primary);
  box-shadow: var(--shadow-panel);
  border-radius: var(--border-radius-lg);
}

.bg-gray-800.rounded-lg.p-6 h2 {
  color: var(--color-accent-gold-bright);
}

.bg-gray-800.rounded-lg.p-6 label {
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
}

.bg-gray-800.rounded-lg.p-6 input[type="number"],
.bg-gray-800.rounded-lg.p-6 textarea {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-sm);
}

.bg-gray-800.rounded-lg.p-6 input[type="number"]:focus,
.bg-gray-800.rounded-lg.p-6 textarea:focus {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
  outline: none;
}

/* Empty state */
.text-gray-400.italic {
  color: var(--color-text-tertiary);
}

/* Border styling */
.border-r {
  border-right: var(--border-width-thin) solid var(--color-border-primary);
}

.border-b {
  border-bottom: var(--border-width-thin) solid var(--color-border-primary);
}

/* Custom scrollbar */
.overflow-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: var(--color-bg-primary);
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: var(--color-accent-gold-dim);
  border-radius: var(--border-radius-sm);
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent-gold);
}

/* Custom class conversions from Tailwind */
.spells-header {
  border-color: var(--color-border-primary);
  background: var(--color-bg-secondary);
}

.header-title {
  color: var(--color-accent-gold-bright);
}

.attunement-display {
  color: var(--color-text-primary);
}

.attunement-count {
  color: var(--color-accent-gold-bright);
}

.filter-panel {
  background: var(--color-bg-secondary);
  border-color: var(--color-border-primary);
  color: var(--color-text-primary);
}

.tab-buttons-container {
  background: var(--color-bg-primary);
}

.tab-button {
  background: transparent;
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  transition: var(--transition-hover);
}

.tab-button:hover {
  border-color: var(--color-accent-gold);
  box-shadow: var(--shadow-gold-soft);
}

.tab-button-active {
  background: var(--color-btn-primary-border) !important;
  color: #ffffff !important;
  border-color: var(--color-accent-gold-bright) !important;
  box-shadow: var(--shadow-gold-soft) !important;
}

.search-input-field {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
}

.search-input-field:focus {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
  outline: none;
}

.filter-select {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  cursor: pointer;
}

.item-button {
  transition: var(--transition-hover);
}

.item-name {
  color: var(--color-text-primary);
}

.item-category {
  color: var(--color-text-secondary);
}

/* White category text when spell is learned or attuned */
.item-learned .item-category,
.item-attuned .item-category {
  color: #ffffff;
}

/* White category text when parent item is hovered */
.item-button:hover .item-category {
  color: #ffffff;
}

.badge-learned {
  background: var(--color-btn-primary-border-hover);
  color: var(--color-text-primary);
}

.badge-attuned {
  background: rgba(65, 105, 225, 0.8);
  color: var(--color-text-primary);
}

.empty-state {
  color: var(--color-text-tertiary);
}

.detail-panel {
  background: var(--color-bg-secondary);
}

.item-title {
  color: var(--color-text-primary);
}

.modified-badge {
  color: var(--color-accent-amber);
}

.btn-learn {
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  color: #FFFFFF;
  transition: var(--transition-hover);
}

.btn-learn:hover {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #FFFFFF;
  box-shadow: var(--shadow-gold-medium);
}

.btn-unlearn {
  background: var(--color-red-rgba-medium);
  border: var(--border-width-thin) solid var(--color-danger);
  color: #ffffff; /* White text for readability on red background */
  transition: var(--transition-hover);
}

.btn-unlearn:hover {
  background: var(--color-red-rgba-strong);
}

.btn-attune {
  background: rgba(65, 105, 225, 0.5);
  border: var(--border-width-thin) solid var(--color-fp);
  color: #FFFFFF;
  transition: var(--transition-hover);
}

.btn-attune:hover {
  background: rgba(65, 105, 225, 0.7);
}

.btn-disabled {
  background: var(--color-bg-tertiary) !important;
  border-color: var(--color-border-secondary) !important;
  color: var(--color-text-disabled) !important;
  cursor: not-allowed !important;
}

.btn-unattune {
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  color: var(--color-text-primary);
  transition: var(--transition-hover);
}

.btn-unattune:hover {
  background: rgba(42, 42, 42, 0.8);
}

.btn-edit-item {
  background: var(--color-green-rgba-medium);
  border: var(--border-width-thin) solid var(--color-success);
  color: #ffffff; /* White text for readability on green background */
  transition: var(--transition-hover);
}

.btn-edit-item:hover {
  background: var(--color-green-rgba-strong);
}

.details-box {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
}

.details-box strong {
  color: var(--color-text-gold);
}

.slow-action-indicator {
  color: var(--color-danger);
  filter: brightness(1.5);
}

.btn-reset {
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  color: var(--color-text-primary);
  transition: var(--transition-hover);
}

.btn-reset:hover {
  background: var(--color-bg-tertiary);
}

.no-selection {
  color: var(--color-text-tertiary);
}

.modal-content-box {
  background: var(--color-bg-secondary);
  border: var(--border-width-medium) solid var(--color-border-primary);
  box-shadow: var(--shadow-panel);
}

.modal-title {
  color: var(--color-accent-gold-bright);
}

.modal-close-button {
  color: var(--color-text-tertiary);
  transition: var(--transition-hover);
}

.modal-close-button:hover {
  color: var(--color-text-primary);
}

.modal-label {
  color: var(--color-text-secondary);
}

.modal-input,
.modal-textarea {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  transition: var(--transition-hover);
}

.modal-input:focus,
.modal-textarea:focus {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
  outline: none;
}

.btn-save-modal {
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  color: #FFFFFF;
  transition: var(--transition-hover);
}

.btn-save-modal:hover {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #FFFFFF;
  box-shadow: var(--shadow-gold-medium);
}

.btn-cancel-modal {
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  color: var(--color-text-primary);
  transition: var(--transition-hover);
}

.btn-cancel-modal:hover {
  background: rgba(42, 42, 42, 0.8);
}

/* Spell/Weapon Skill Item States - Matching Weapon Proficiencies Pattern */
.item-learned {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.8), rgba(212, 175, 55, 0.5));
  border: 2px solid var(--color-accent-gold-bright);
  color: #ffffff; /* White text on golden background */
}

.item-learned:hover {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.9), rgba(212, 175, 55, 0.6));
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-medium);
  color: #ffffff; /* Keep white text on hover */
}

.item-attuned {
  background: linear-gradient(135deg, rgba(65, 105, 225, 0.8), rgba(65, 105, 225, 0.5));
  border: 2px solid var(--color-fp);
  color: #ffffff; /* White text on blue background */
}

.item-attuned:hover {
  background: linear-gradient(135deg, rgba(65, 105, 225, 0.9), rgba(65, 105, 225, 0.6));
  border-color: var(--color-fp);
  box-shadow: 0 0 20px rgba(65, 105, 225, 0.5);
  color: #ffffff; /* Keep white text on hover */
}

.item-default-spell {
  background: transparent;
  color: var(--color-text-primary);
  border: 2px solid var(--color-border-primary);
}

.item-default-spell:hover {
  border-color: var(--color-accent-gold);
  box-shadow: var(--shadow-gold-soft);
  color: var(--color-text-primary); /* Keep same text color on hover */
}

/* Badge text fix for readability */
.badge-learned {
  background: var(--color-gold-primary); /* Pure golden background */
  color: var(--color-bg-tertiary); /* Dark text on golden background */
  border: 1px solid var(--color-gold-dim);
}

.badge-attuned {
  background: rgba(65, 105, 225, 0.3);
  color: #ffffff; /* White text on blue background */
  border: 1px solid var(--color-fp);
}

/* Independent scroll for split layout - Task 4.2 */
.spells-content-wrapper {
  height: calc(100vh - 190px); /* Same as CharacterTab */
  width: 100%;
}

.spells-panel-left,
.spells-panel-right {
  height: 100%; /* Fill wrapper height */
}
</style>
