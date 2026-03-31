<template>
  <div class="flex flex-col w-full h-full overflow-hidden main-tab">
    <div class="page-header-bar">
      <h1 class="page-title">
        Inventory
      </h1>
    </div>

    <div class="inventory-content-wrapper flex">
      <!-- Left side: Inventory list (3/5 width) -->
      <div class="inventory-panel-left flex flex-col w-3/5 border-r">
        <div class="flex justify-between w-5/6 mx-auto mt-4 bg-white rounded-md">
          <button v-for="tab in typeTabs"
            :key="'tab' + tab.Identifier"
            class="text-center border-r last:border-r-0 border-black flex-1"
            :class="activeTab === tab.Identifier && 'bg-[#2a5573] tab-active'"
            @click="activeTab = tab.Identifier"
          >
            <div class="p-1">
              {{ tab.Name }}
            </div>
          </button>
        </div>

        <!-- Search and Filter Controls -->
        <div class="w-5/6 mx-auto mt-4 mb-4 flex gap-2">
          <!-- Search input -->
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search items..."
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          />

          <!-- Sort dropdown for Weapons, Armor, Rings -->
          <select
            v-if="['weapon', 'armor', 'ring'].includes(activeTab)"
            v-model="sortOption"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="default">Default</option>
            <option value="rarity-asc">Rarity: Low to High</option>
            <option value="rarity-desc">Rarity: High to Low</option>
          </select>

          <!-- Type filter for Weapons -->
          <select
            v-if="activeTab === 'weapon'"
            v-model="weaponTypeFilter"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Types</option>
            <option value="FIST">Fists</option>
            <option value="DAGGER">Daggers</option>
            <option value="STRAIGHT_THRUST">Straight/Thrust Swords</option>
            <option value="KATANA_CURVED">Katana/Curved Swords</option>
            <option value="GREAT_SWORD">Greatswords</option>
            <option value="ULTRA_GREAT_SWORD">Ultra Greatswords</option>
            <option value="AXE_GREAT_AXE">Axes/Great Axes</option>
            <option value="HAMMER_GREAT_HAMMER">Hammers/Great Hammers</option>
            <option value="TWINBLADE">Twinblades</option>
            <option value="SPEAR">Spears</option>
            <option value="HALBERD">Halberds</option>
            <option value="REAPER">Reapers</option>
            <option value="WHIP">Whips</option>
            <option value="BOW_CROSSBOW">Bows/Crossbows</option>
            <option value="GREAT_BOW_BALLISTA">Great Bows/Ballistas</option>
            <option value="GUN">Guns</option>
            <option value="SHIELD">Shields</option>
            <option value="CATALYSTS">All Catalysts</option>
            <option value="INSTRUMENTS">All Instruments</option>
          </select>

          <!-- Type filter for Armor -->
          <select
            v-if="activeTab === 'armor'"
            v-model="armorTypeFilter"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Types</option>
            <option value="LIGHT">Light</option>
            <option value="MEDIUM">Medium</option>
            <option value="HEAVY">Heavy</option>
          </select>
        </div>

        <div class="overflow-auto flex-1">
          <h1 class="sticky top-0 w-full flex justify-center py-4 bg-dislight section-header text-2xl font-semibold border-b z-10">
            Inventory
          </h1>
          
          <div class="w-full border-b text-xs px-4">
            <div v-if="inventoryItems.length === 0" class="flex justify-center items-center w-full text-2xl empty-state">
              You have no {{ itemCategoryDescription }} in your inventory
            </div>
            <div v-else class="flex flex-wrap w-full inv py-4">
              <div v-for="item in inventoryItems" :key="item.name" class="item-card-wrapper m-3">
                <!-- Image area (no background) -->
                <div class="item-card relative cursor-pointer" :class="{ 'item-selected': selectedItem && selectedItem.id === item.id && selectedItem.category === item.category }" @click="selectItem(item)">
                  <!-- Pedestal layer (background) -->
                  <img
                    :src="`/img/inventory_icons/${imageUtils.getPedestalIconFile()}`"
                    class="item-pedestal"
                    alt=""
                    loading="lazy"
                  />

                  <!-- Item icon layer (foreground) -->
                  <img
                    :src="`/img/inventory_icons/${imageUtils.getItemIconFile(item)}`"
                    :alt="item.name"
                    class="item-icon"
                    :style="getItemIconStyle(item)"
                    loading="lazy"
                  />

                  <!-- Quantity input (editable) -->
                  <input
                    type="number"
                    :value="item.Quantity"
                    @input="updateItemQuantity(item, ($event.target as HTMLInputElement).value)"
                    @focus="($event.target as HTMLInputElement).select()"
                    @click.stop
                    class="quantity-input-field"
                    min="0"
                  />

                  <!-- Delete button -->
                  <button class="delete-item-btn" @click.stop="deleteItem(item)">
                    X
                  </button>
                </div>

                <!-- Name label (below image) -->
                <div class="item-name-label cursor-pointer" @click="selectItem(item)">{{ item.name }}</div>

                <!-- +/- buttons (below name) -->
                <div class="flex w-full">
                  <button class="quantity-decrease-btn" @click="decreaseItemQuantity(item)">
                    -
                  </button>
                  <button class="quantity-increase-btn" @click="increaseItemQuantity(item)">
                    +
                  </button>
                </div>
              </div>
            </div>

            <!-- Inventory Pagination controls -->
            <div v-if="inventoryTotalPages > 1" class="flex items-center justify-center gap-4 w-full mt-4 mb-4">
              <button
                @click="prevInventoryPage"
                :disabled="inventoryCurrentPage === 1"
                class="pagination-btn"
              >
                Previous
              </button>

              <span class="pagination-text">
                Page {{ inventoryCurrentPage }} of {{ inventoryTotalPages }}
              </span>

              <button
                @click="nextInventoryPage"
                :disabled="inventoryCurrentPage === inventoryTotalPages"
                class="pagination-btn"
              >
                Next
              </button>
            </div>
          </div>

          <h1 class="sticky top-0 py-4 w-full flex items-center px-6 section-header bg-dislight text-2xl font-semibold border-b z-10">
            <span class="flex-1 text-center">All items</span>
            <div class="flex justify-center items-center" style="width: 140px;">
              <button
                v-if="characterCampaigns.length > 0"
                @click="openCreateCustom"
                class="create-new-btn"
              >
                Create Custom
              </button>
            </div>
          </h1>

          <div class="p-4 mb-20">
            <div class="flex flex-wrap w-full text-xs">
              <div v-for="item in allItems" :key="'item-' + item.name" class="item-card-wrapper m-3">
                <!-- Image area (no background) -->
                <div class="item-card relative cursor-pointer" :class="{ 'item-selected': selectedItem && selectedItem.id === item.id && selectedItem.category === item.category }" @click="selectItem(item)">
                  <!-- Pedestal layer (background) -->
                  <img
                    :src="`/img/inventory_icons/${imageUtils.getPedestalIconFile()}`"
                    class="item-pedestal"
                    alt=""
                    loading="lazy"
                  />

                  <!-- Item icon layer (foreground) -->
                  <img
                    :src="`/img/inventory_icons/${imageUtils.getItemIconFile(item)}`"
                    :alt="item.name"
                    class="item-icon"
                    :style="getItemIconStyle(item)"
                    loading="lazy"
                  />
                </div>

                <!-- Name label (below image) -->
                <div class="item-name-label cursor-pointer" @click="selectItem(item)">{{ item.name }}</div>

                <!-- Add/In inventory button (below name) -->
                <button v-if="itemNotInInventory(item)" class="add-to-inventory-btn" @click="addItem(item)">
                  Add
                </button>

                <span v-else class="w-full h-4 in-inventory-label text-xs bg-charcoal flex items-center justify-center">
                  In inventory
                </span>
              </div>

              <!-- Pagination controls -->
              <div v-if="totalPages > 1" class="flex items-center justify-center gap-4 w-full mt-4 mb-4">
                <button
                  @click="prevPage"
                  :disabled="currentPage === 1"
                  class="pagination-btn"
                >
                  Previous
                </button>

                <span class="pagination-text">
                  Page {{ currentPage }} of {{ totalPages }}
                </span>

                <button
                  @click="nextPage"
                  :disabled="currentPage === totalPages"
                  class="pagination-btn"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right side: Item detail panel (2/5 width) -->
      <div class="inventory-panel-right flex flex-col w-2/5 overflow-auto">
        <div v-if="selectedItem" class="flex flex-col items-center p-6 item-detail-panel">
          <!-- Large icon display -->
          <div class="relative w-64 h-64 mb-6 item-detail-icon-container">
            <!-- Pedestal layer -->
            <img
              :src="`/img/inventory_icons/${imageUtils.getPedestalIconFile()}`"
              class="item-detail-pedestal"
              alt=""
            />

            <!-- Item icon layer -->
            <img
              :src="`/img/inventory_icons/${imageUtils.getItemIconFile(selectedItem)}`"
              :alt="selectedItem.name"
              class="item-detail-icon"
              :style="getItemIconStyle(selectedItem)"
            />
          </div>

          <!-- Item name -->
          <h2 class="item-detail-name">
            {{ selectedItem.name }}
          </h2>

          <!-- Item description -->
          <p class="item-description text-sm leading-relaxed text-center max-w-md mb-6">
            {{ selectedItem.description || 'No description available.' }}
          </p>

          <!-- Category-specific details -->
          <div class="w-full max-w-md item-details">
            <!-- WEAPON DETAILS -->
            <div v-if="selectedItem.category === 'weapon'" class="space-y-3">
              <!-- Weapon Class -->
              <div class="detail-row">
                <span class="detail-label">Weapon Class:</span>
                <span class="detail-value">{{ formatWeaponType(selectedItem.weapon_type) }}</span>
              </div>

              <!-- Second Type (if exists) -->
              <div v-if="selectedItem.second_type" class="detail-row">
                <span class="detail-label">Secondary Type:</span>
                <span class="detail-value">{{ formatWeaponType(selectedItem.second_type) }}</span>
              </div>

              <!-- Damage Dice -->
              <div v-if="selectedItem.dice && selectedItem.dice.length > 0" class="detail-section">
                <h3 class="detail-section-title">Damage Dice</h3>
                <div class="space-y-1">
                  <div v-for="(die, index) in selectedItem.dice" :key="index" class="detail-stat">
                    <span>{{ formatDamageType(die.type) }}:</span>
                    <span class="text-purple-400">{{ die.count }}d{{ die.value }}</span>
                  </div>
                </div>
              </div>

              <!-- AP Cost -->
              <div class="detail-row">
                <span class="detail-label">AP Cost:</span>
                <span class="detail-value">{{ selectedItem.ap }}</span>
              </div>

              <!-- Durability -->
              <div class="detail-row">
                <span class="detail-label">Durability:</span>
                <span class="detail-value">{{ selectedItem.durability }}</span>
              </div>

              <!-- Infusion (only if exists) -->
              <div v-if="selectedItem.infusion" class="detail-row">
                <span class="detail-label">Infusion:</span>
                <span class="detail-value">{{ selectedItem.infusion }}</span>
              </div>

              <!-- Twin/Trick Weapon -->
              <div class="detail-row">
                <span class="detail-label">Twin Weapon:</span>
                <span class="detail-value">
                  <input type="checkbox" :checked="selectedItem.is_twin" disabled class="cursor-default" />
                </span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Trick Weapon:</span>
                <span class="detail-value">
                  <input type="checkbox" :checked="selectedItem.is_trick" disabled class="cursor-default" />
                </span>
              </div>

              <!-- Requirements -->
              <div v-if="selectedItem.requirements" class="detail-section">
                <h3 class="detail-section-title">Requirements</h3>
                <div class="grid grid-cols-2 gap-2">
                  <div v-if="selectedItem.requirements.str" class="detail-stat">
                    <span>STR:</span> <span class="text-yellow-400">{{ selectedItem.requirements.str }}</span>
                  </div>
                  <div v-if="selectedItem.requirements.dex" class="detail-stat">
                    <span>DEX:</span> <span class="text-yellow-400">{{ selectedItem.requirements.dex }}</span>
                  </div>
                  <div v-if="selectedItem.requirements.int" class="detail-stat">
                    <span>INT:</span> <span class="text-yellow-400">{{ selectedItem.requirements.int }}</span>
                  </div>
                  <div v-if="selectedItem.requirements.fai" class="detail-stat">
                    <span>FAI:</span> <span class="text-yellow-400">{{ selectedItem.requirements.fai }}</span>
                  </div>
                </div>
              </div>

              <!-- Scaling -->
              <div v-if="selectedItem.scaling && selectedItem.scaling.length > 0" class="detail-section">
                <h3 class="detail-section-title">Scaling</h3>
                <div class="grid grid-cols-2 gap-2">
                  <div v-for="scale in selectedItem.scaling" :key="scale.stat + scale.type" class="detail-stat">
                    <span>{{ scale.stat }} ({{ formatDamageType(scale.type) }}):</span>
                    <span class="scaling-positive">{{ scale.value }}</span>
                  </div>
                </div>
              </div>

              <!-- Spell Scaling (for catalysts) -->
              <div v-if="selectedItem.spell_scaling && selectedItem.spell_scaling.length > 0" class="detail-section">
                <h3 class="detail-section-title">Spell Scaling</h3>
                <div class="space-y-1">
                  <div v-for="scale in selectedItem.spell_scaling" :key="scale.stat" class="detail-stat">
                    <span>{{ scale.stat }}:</span>
                    <span class="scaling-positive">
                      {{ scale.value }}
                      <span v-if="scale.requirement" class="text-yellow-400 text-xs ml-2">(Req: {{ scale.requirement }})</span>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Weapon Skills -->
              <div v-if="selectedItem.skill_primary || selectedItem.skill_secondary" class="detail-section">
                <h3 class="detail-section-title">Weapon Skills</h3>
                <div v-if="selectedItem.skill_primary" class="detail-value">Primary: <span class="weapon-skill-name">{{ getWeaponSkillName(selectedItem.skill_primary) }}</span></div>
                <div v-if="selectedItem.skill_secondary" class="detail-value">Secondary: <span class="weapon-skill-name">{{ getWeaponSkillName(selectedItem.skill_secondary) }}</span></div>
              </div>
            </div>

            <!-- ARMOR DETAILS -->
            <div v-if="selectedItem.category === 'armor'" class="space-y-3">
              <!-- Armor Type -->
              <div class="detail-row">
                <span class="detail-label">Type:</span>
                <span class="detail-value">{{ selectedItem.armor_type }}</span>
              </div>

              <!-- Durability -->
              <div v-if="selectedItem.durability" class="detail-row">
                <span class="detail-label">Durability:</span>
                <span class="detail-value">{{ selectedItem.durability }}</span>
              </div>

              <!-- Requirements -->
              <div v-if="selectedItem.requirements" class="detail-section">
                <h3 class="detail-section-title">Requirements</h3>
                <div class="grid grid-cols-2 gap-2">
                  <div v-if="selectedItem.requirements.str" class="detail-stat">
                    <span>STR:</span> <span class="text-yellow-400">{{ selectedItem.requirements.str }}</span>
                  </div>
                  <div v-if="selectedItem.requirements.dex" class="detail-stat">
                    <span>DEX:</span> <span class="text-yellow-400">{{ selectedItem.requirements.dex }}</span>
                  </div>
                  <div v-if="selectedItem.requirements.int" class="detail-stat">
                    <span>INT:</span> <span class="text-yellow-400">{{ selectedItem.requirements.int }}</span>
                  </div>
                  <div v-if="selectedItem.requirements.fai" class="detail-stat">
                    <span>FAI:</span> <span class="text-yellow-400">{{ selectedItem.requirements.fai }}</span>
                  </div>
                </div>
              </div>

              <!-- Bonuses -->
              <div v-if="selectedItem.bonuses && selectedItem.bonuses.length > 0" class="detail-section">
                <h3 class="detail-section-title">Bonuses</h3>
                <div class="space-y-1">
                  <div v-for="(bonus, index) in selectedItem.bonuses" :key="index" class="detail-stat">
                    <span>{{ formatBonusType(bonus.type) }}:</span>
                    <span class="text-blue-400">{{ bonus.value > 0 ? '+' : '' }}{{ bonus.value }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- RING DETAILS -->
            <div v-if="selectedItem.category === 'ring'" class="space-y-3">
              <!-- Tier -->
              <div class="detail-row">
                <span class="detail-label">Tier:</span>
                <span class="detail-value">{{ selectedItem.tier }}</span>
              </div>

              <!-- Scaling -->
              <div v-if="selectedItem.scaling && selectedItem.scaling.length > 0" class="detail-section">
                <h3 class="detail-section-title">Scaling</h3>
                <div class="grid grid-cols-2 gap-2">
                  <div v-for="scale in selectedItem.scaling" :key="scale.stat + scale.type" class="detail-stat">
                    <span>{{ scale.stat }} ({{ formatDamageType(scale.type) }}):</span>
                    <span class="scaling-positive">{{ scale.value }}</span>
                  </div>
                </div>
              </div>

              <!-- Dice -->
              <div v-if="selectedItem.dice && selectedItem.dice.length > 0" class="detail-section">
                <h3 class="detail-section-title">Dice Effects</h3>
                <div class="space-y-1">
                  <div v-for="(die, index) in selectedItem.dice" :key="index" class="detail-stat">
                    <span>{{ formatDamageType(die.type) }}:</span>
                    <span class="text-purple-400">{{ die.count }}d{{ die.value }}</span>
                  </div>
                </div>
              </div>

              <!-- Bonuses -->
              <div v-if="selectedItem.bonuses && selectedItem.bonuses.length > 0" class="detail-section">
                <h3 class="detail-section-title">Bonuses</h3>
                <div class="space-y-1">
                  <div v-for="(bonus, index) in selectedItem.bonuses" :key="index" class="detail-stat">
                    <span>{{ formatBonusType(bonus.type) }}:</span>
                    <span class="text-blue-400">{{ bonus.value > 0 ? '+' : '' }}{{ bonus.value }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ARTIFACT DETAILS -->
            <div v-if="selectedItem.category === 'artifact'" class="space-y-3">
              <!-- Artifact name and description are already displayed above -->

              <!-- Bonuses -->
              <div v-if="selectedItem.bonuses && selectedItem.bonuses.length > 0" class="detail-section">
                <h3 class="detail-section-title">Bonuses</h3>
                <div class="space-y-1">
                  <div v-for="(bonus, index) in selectedItem.bonuses" :key="index" class="detail-stat">
                    <span>{{ formatBonusType(bonus.type) }}:</span>
                    <span class="text-blue-400">{{ bonus.value > 0 ? '+' : '' }}{{ bonus.value }}</span>
                  </div>
                </div>
              </div>

              <!-- Scaling -->
              <div v-if="selectedItem.scaling && selectedItem.scaling.length > 0" class="detail-section">
                <h3 class="detail-section-title">Scaling</h3>
                <div class="grid grid-cols-2 gap-2">
                  <div v-for="scale in selectedItem.scaling" :key="scale.stat + scale.type" class="detail-stat">
                    <span>{{ scale.stat }} ({{ formatDamageType(scale.type) }}):</span>
                    <span class="scaling-positive">{{ scale.value }}</span>
                  </div>
                </div>
              </div>

              <!-- Dice -->
              <div v-if="selectedItem.dice && selectedItem.dice.length > 0" class="detail-section">
                <h3 class="detail-section-title">Dice Effects</h3>
                <div class="space-y-1">
                  <div v-for="(die, index) in selectedItem.dice" :key="index" class="detail-stat">
                    <span>{{ formatDamageType(die.type) }}:</span>
                    <span class="text-purple-400">{{ die.count }}d{{ die.value }}</span>
                  </div>
                </div>
              </div>

              <!-- ARTIFACT UPGRADES -->
              <div v-if="selectedItem.upgrades && selectedItem.upgrades.length > 0" class="detail-section">
                <h3 class="detail-section-title">Artifact Upgrades</h3>
                <div class="space-y-4">
                  <div v-for="(upgrade, index) in selectedItem.upgrades" :key="index" class="upgrade-card">
                    <!-- Upgrade Name -->
                    <div class="upgrade-name">
                      {{ upgrade.name || '?' }}
                    </div>

                    <!-- Upgrade Description -->
                    <div class="upgrade-description">
                      {{ upgrade.description || '?' }}
                    </div>

                    <!-- Unlock Requirements -->
                    <div v-if="upgrade.unlock_requirements || upgrade.requirements_visible === false" class="upgrade-requirements">
                      <span class="requirements-label">Requirements:</span>
                      <span class="requirements-text">{{ upgrade.unlock_requirements || '?' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Placeholder when no item selected -->
        <div v-else class="flex items-center justify-center h-full">
          <p class="placeholder-text text-lg opacity-50">Click an item to view details</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Campaign Selector (when in multiple campaigns) -->
  <Teleport to="body">
    <div v-if="showCampaignSelector" class="campaign-select-overlay" @click.self="showCampaignSelector = false">
      <div class="campaign-select-modal">
        <h2 class="campaign-select-title">Select Campaign</h2>
        <p class="campaign-select-text">Which campaign should this custom item belong to?</p>
        <div class="campaign-select-list">
          <button
            v-for="camp in characterCampaigns"
            :key="camp.id"
            @click="selectCampaignAndCreate(camp.id)"
            class="campaign-select-btn"
          >{{ camp.name }}</button>
        </div>
        <div class="campaign-select-actions">
          <button @click="showCampaignSelector = false" class="campaign-select-cancel">Cancel</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Create Custom Item Modal -->
  <Teleport to="body">
    <CreateItemModal
      v-if="showCreateItemModal && selectedCampaignId"
      :campaign-id="selectedCampaignId"
      @close="showCreateItemModal = false"
      @created="handleCustomItemCreated"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as invutils from '@/mixins/invutils'
import * as imageUtils from '@/mixins/imageUtils'
import { usePlayerStore } from '@/store/player'
import { useCompendiumStore } from '~~/store/compendium'
import { useApi } from '~/composables/useApi'
import { useFoundrySync } from '~/composables/useFoundrySync'
import CreateItemModal from '~/components/Campaigns/CreateItemModal.vue'

const store = usePlayerStore()
const compendiumStore = useCompendiumStore()
const api = useApi()
const foundrySync = useFoundrySync()

// Custom item creation
const showCreateItemModal = ref(false)
const showCampaignSelector = ref(false)
const characterCampaigns = ref<Array<{ id: string; name: string }>>([])
const selectedCampaignId = ref<string | null>(null)

// Fetch character's campaign assignments on mount
onMounted(async () => {
  if (store.UUID) {
    const response = await api.get<any>(`/api/characters/${store.UUID}/`)
    if (response.ok && response.data?.campaigns?.length > 0) {
      characterCampaigns.value = response.data.campaigns
      selectedCampaignId.value = response.data.campaigns[0].id
    }
  }
})

function openCreateCustom() {
  if (characterCampaigns.value.length > 1) {
    // Show campaign selector first
    showCampaignSelector.value = true
  } else if (characterCampaigns.value.length === 1) {
    // Single campaign, open directly
    selectedCampaignId.value = characterCampaigns.value[0].id
    showCreateItemModal.value = true
  }
}

function selectCampaignAndCreate(campaignId: string) {
  selectedCampaignId.value = campaignId
  showCampaignSelector.value = false
  showCreateItemModal.value = true
}

function handleCustomItemCreated(item: any) {
  showCreateItemModal.value = false
  if (item) {
    const itemType = item.type || 'misc'
    switch (itemType) {
      case 'weapon':
        compendiumStore.Weapons.push(item)
        break
      case 'armor':
        compendiumStore.Armors.push(item)
        break
      case 'ring':
        compendiumStore.Rings.push(item)
        break
      case 'artifact':
        compendiumStore.Artifacts.push(item)
        break
      default:
        compendiumStore.Items.push(item)
        break
    }
    foundrySync.send('campaign:compendium-updated', { itemType })
  }
}

const itemTypeOptions = [
  { name: 'Tool', value: 'tools' },
  { name: 'Miscellaneous', value: 'misc' },
  { name: 'Weapon', value: 'weapon' },
  { name: 'Armor', value: 'armor' },
  { name: 'Ring', value: 'ring' },
  { name: 'Artifact', value: 'artifact' }
]

const activeTab = shallowRef('all')
const creatingItem = shallowRef(false)
const createItemName = shallowRef('')
const createItemDescription = shallowRef('')
const createItemType = ref(itemTypeOptions[0].value)

// Persist filter state in localStorage
const INVENTORY_FILTER_KEY = 'sd20_inventory_filters'

function loadFilterState() {
  if (typeof window === 'undefined') return { search: '', sort: 'default', weaponType: 'all', armorType: 'all' }
  try {
    const saved = localStorage.getItem(INVENTORY_FILTER_KEY)
    return saved ? JSON.parse(saved) : { search: '', sort: 'default', weaponType: 'all', armorType: 'all' }
  } catch {
    return { search: '', sort: 'default', weaponType: 'all', armorType: 'all' }
  }
}

function saveFilterState() {
  if (typeof window === 'undefined') return
  localStorage.setItem(INVENTORY_FILTER_KEY, JSON.stringify({
    search: searchQuery.value,
    sort: sortOption.value,
    weaponType: weaponTypeFilter.value,
    armorType: armorTypeFilter.value
  }))
}

const savedFilters = loadFilterState()
const searchQuery = ref(savedFilters.search)
const sortOption = ref(savedFilters.sort)
const weaponTypeFilter = ref(savedFilters.weaponType)
const armorTypeFilter = ref(savedFilters.armorType)
const selectedItem = ref<any>(null)

const itemCategoryDescription = computed(()=>{
  return invutils.itemCategoryDescription(activeTab.value)
})

const inventoryItemsUnfiltered = computed(()=>{
  let items = store.Inventory.filter(i => i.category === activeTab.value || activeTab.value === 'all')

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item =>
      item.name?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    )
  }

  return items
})

const currentPage = ref(1)
const inventoryCurrentPage = ref(1)
const itemsPerPage = 20

const inventoryTotalPages = computed(() => Math.ceil(inventoryItemsUnfiltered.value.length / itemsPerPage))

const inventoryItems = computed(()=>{
  const start = (inventoryCurrentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return inventoryItemsUnfiltered.value.slice(start, end)
})

const allItemsUnfiltered = computed(()=> {
  // Combine all item types from compendium
  let allCombined = [
    ...compendiumStore.Items.map(i => ({ ...i, category: i.category || 'misc' })),
    ...compendiumStore.Weapons.map(w => ({ ...w, category: 'weapon' })),
    ...compendiumStore.Armors.map(a => ({ ...a, category: 'armor' })),
    ...compendiumStore.Rings.map(r => ({ ...r, category: 'ring' })),
    ...compendiumStore.Artifacts.map(a => ({ ...a, category: 'artifact' }))
  ]

  // Filter by active tab
  if (activeTab.value !== 'all') {
    allCombined = allCombined.filter(i => i.category === activeTab.value)
  }

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    allCombined = allCombined.filter(item =>
      item.name?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    )
  }

  // Apply weapon type filter (with grouped type support)
  if (activeTab.value === 'weapon' && weaponTypeFilter.value !== 'all') {
    const weaponTypeGroups: Record<string, string[]> = {
      'STRAIGHT_THRUST': ['STRAIGHT', 'THRUST'],
      'KATANA_CURVED': ['KATANA', 'CURVED'],
      'AXE_GREAT_AXE': ['AXE', 'GREAT_AXE'],
      'HAMMER_GREAT_HAMMER': ['HAMMER', 'GREAT_HAMMER'],
      'BOW_CROSSBOW': ['BOW', 'CROSSBOW'],
      'GREAT_BOW_BALLISTA': ['GREAT_BOW', 'BALLISTA'],
      'CATALYSTS': ['STAFF', 'CHIME', 'TALISMAN', 'PYRO', 'CRUCIBLE'],
      'INSTRUMENTS': ['WIND_INSTRUMENT', 'STRING_INSTRUMENT', 'PERCUSSION_INSTRUMENT', 'TONGUE_INSTRUMENT', 'HORN_INSTRUMENT']
    }
    const filterTypes = weaponTypeGroups[weaponTypeFilter.value] || [weaponTypeFilter.value]
    allCombined = allCombined.filter(item => filterTypes.includes(item.weapon_type))
  }

  // Apply armor type filter
  if (activeTab.value === 'armor' && armorTypeFilter.value !== 'all') {
    allCombined = allCombined.filter(item => item.armor_type === armorTypeFilter.value)
  }

  // Apply sorting
  if (['weapon', 'armor', 'ring'].includes(activeTab.value)) {
    if (sortOption.value === 'rarity-asc') {
      allCombined = [...allCombined].sort((a, b) => getRarityValue(a) - getRarityValue(b))
    } else if (sortOption.value === 'rarity-desc') {
      allCombined = [...allCombined].sort((a, b) => getRarityValue(b) - getRarityValue(a))
    }
  }

  return allCombined
})

const totalPages = computed(() => Math.ceil(allItemsUnfiltered.value.length / itemsPerPage))

const allItems = computed(()=> {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return allItemsUnfiltered.value.slice(start, end)
})

// Reset page and filters when tab changes
watch(activeTab, () => {
  currentPage.value = 1
  inventoryCurrentPage.value = 1
  weaponTypeFilter.value = 'all'
  armorTypeFilter.value = 'all'
  sortOption.value = 'default'
})

// Reset page and save filter state when search/filter changes
watch([searchQuery, sortOption, weaponTypeFilter, armorTypeFilter], () => {
  currentPage.value = 1
  inventoryCurrentPage.value = 1
  saveFilterState()
})

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function goToPage(page: number) {
  currentPage.value = page
}

function nextInventoryPage() {
  if (inventoryCurrentPage.value < inventoryTotalPages.value) {
    inventoryCurrentPage.value++
  }
}

function prevInventoryPage() {
  if (inventoryCurrentPage.value > 1) {
    inventoryCurrentPage.value--
  }
}

function getItemIconStyle(item: any) {
  const settings = imageUtils.getIconCustomSettings(item)

  // If apply is false, use default CSS styling
  if (!settings.apply) {
    return {}
  }

  // Build custom style object
  return {
    width: settings.width ? `${settings.width}%` : undefined,
    height: settings.height ? `${settings.height}%` : undefined,
    top: settings.top ? `${settings.top}%` : undefined,
    left: settings.left ? `${settings.left}%` : undefined,
    transform: `translate(-50%, -50%)${settings.rotation ? ` rotate(${settings.rotation}deg)` : ''}`
  }
}

function getRarityValue(item: any): number {
  // For rings, use tier field directly
  if (item.category === 'ring' && item.tier) {
    return item.tier
  }

  // For weapons and armor, calculate rarity from max requirements
  if (item.requirements) {
    const maxReq = Math.max(
      item.requirements.str || 0,
      item.requirements.dex || 0,
      item.requirements.int || 0,
      item.requirements.fai || 0,
      item.requirements.att || 0
    )

    if (maxReq >= 20) return 4 // Legendary
    if (maxReq >= 17) return 3 // High
    if (maxReq >= 14) return 2 // Medium
    return 1 // Low
  }

  return 0
}

const typeTabs = [
  { Name: 'All', Identifier: 'all', },
  { Name: 'Tools', Identifier: 'tools', },
  { Name: 'Items', Identifier: 'misc', },
  { Name: 'Weapons', Identifier: 'weapon', },
  { Name: 'Armor', Identifier: 'armor', },
  { Name: 'Rings', Identifier: 'ring', },
  { Name: 'Artifacts', Identifier: 'artifact', },
]

async function createItem() {
  // Check if character is in any campaign (required for custom items)
  const campaignMemberships = (store as any).campaignMemberships || []

  if (campaignMemberships.length > 0) {
    // Create via campaign items API
    const campaignId = campaignMemberships[0]?.id
    if (campaignId) {
      const typeMap: Record<string, string> = {
        'weapon': 'weapon', 'armor': 'armor', 'artifact': 'artifact',
        'misc': 'item', 'tools': 'item', 'ring': 'ring'
      }
      const apiType = typeMap[createItemType.value] || 'item'

      const response = await api.post(`/api/campaigns/${campaignId}/items/`, {
        type: apiType,
        name: createItemName.value,
        description: createItemDescription.value,
        item_type: createItemType.value === 'tools' ? 'TOOL' : 'MISC',
      })

      if (response.ok && response.data) {
        // Add to local compendium for immediate display
        compendiumStore.createItem({
          id: (response.data as any).id,
          name: createItemName.value,
          description: createItemDescription.value,
          category: createItemType.value,
          Quantity: 1,
          is_official: false,
          campaign_id: campaignId,
        })
      }
    }
  } else {
    // Local-only creation (no campaign)
    compendiumStore.createItem({
      id: Date.now(),
      name: createItemName.value,
      description: createItemDescription.value,
      category: createItemType.value,
      Quantity: 1,
    })
  }

  createItemName.value = ''
  createItemDescription.value = ''
  creatingItem.value = false
}

function selectItem(item: any) {
  selectedItem.value = item
}

function addItem(item: any) {
  console.log('Adding item:', item)
  store.addInventoryItem({ id: item.id, category: item.category })
  console.log('Inventory after add:', store.Inventory)
}

function deleteItem(item: any) {
  store.removeInventoryItem({ id: item.id, category: item.category })
}

function increaseItemQuantity(item: any) {
  store.increaseItemQuantity({ id: item.id, category: item.category })
}

function decreaseItemQuantity(item: any) {
  store.decreaseItemQuantity({ id: item.id, category: item.category })
}

function updateItemQuantity(item: any, value: string) {
  const quantity = parseInt(value)
  if (isNaN(quantity)) return
  store.setItemQuantity({ id: item.id, category: item.category }, quantity)
}

function itemNotInInventory(item: any) {
  if (!store.Inventory.find(i => i.id === item.id && i.category === item.category)) return true
}

function formatWeaponType(type: string): string {
  if (!type) return ''
  return type.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

function formatDamageType(type: string): string {
  if (!type) return ''
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
}

function formatBonusType(type: string): string {
  if (!type) return ''

  // Map abbreviated bonus types from API to full display names
  const bonusTypeMap: Record<string, string> = {
    // Stats
    'VIT': 'Vitality',
    'END': 'Endurance',
    'STR': 'Strength',
    'DEX': 'Dexterity',
    'ATT': 'Attunement',
    'INT': 'Intelligence',
    'FAI': 'Faith',

    // Skills
    'ATH': 'Athletics',
    'ACR': 'Acrobatics',
    'PER': 'Perception',
    'FIR': 'Firekeeping',
    'SAN': 'Sanity',
    'STE': 'Stealth',
    'PRE': 'Precision',
    'DIP': 'Diplomacy',

    // Knowledge
    'MAG': 'Magics',
    'WOR': 'World History',
    'MON': 'Monsters',
    'COS': 'Cosmic',

    // Resistances
    'PHY_RES': 'Physical Resistance',
    'MAG_RES': 'Magic Resistance',
    'FIR_RES': 'Fire Resistance',
    'LIG_RES': 'Lightning Resistance',
    'DAR_RES': 'Dark Resistance',
    'PHY_FLAT': 'Flat Physical',
    'MAG_FLAT': 'Flat Magic',
    'FIR_FLAT': 'Flat Fire',
    'LIG_FLAT': 'Flat Lightning',
    'DAR_FLAT': 'Flat Dark',

    // Other bonuses
    'MAX_HP': 'Max HP',
    'MAX_FP': 'Max FP',
    'MAX_AP': 'Max AP',
    'DODGE': 'Dodge',
    'ATTUNEMENT_SLOTS': 'Attunement Slots',
  }

  return bonusTypeMap[type] || type
}

function getWeaponSkillName(skillIdOrUrl: number | string): string {
  if (!skillIdOrUrl) return 'None'

  // Extract ID from URL if it's a URL
  let skillId: number
  if (typeof skillIdOrUrl === 'string' && skillIdOrUrl.includes('http')) {
    // Extract ID from URL like "http://127.0.0.1:8000/weaponSkill/67/"
    const match = skillIdOrUrl.match(/\/weaponSkill\/(\d+)/)
    if (!match) {
      console.warn('Could not extract skill ID from URL:', skillIdOrUrl)
      return 'Unknown Skill'
    }
    skillId = parseInt(match[1])
  } else {
    skillId = typeof skillIdOrUrl === 'string' ? parseInt(skillIdOrUrl) : skillIdOrUrl
  }

  const skill = compendiumStore.WeaponSkills.find(s => s.id === skillId)
  console.log('Looking up weapon skill:', { input: skillIdOrUrl, skillId, found: skill?.name, allSkills: compendiumStore.WeaponSkills.length })
  return skill ? skill.name : `Skill #${skillId}`
}
</script>

<style scoped>
/* ===========================================
   Page Title & Header
   =========================================== */
h1.py-4 {
  background: var(--color-bg-secondary);
  color: var(--color-accent-gold-bright);
  border-bottom: var(--border-width-medium) solid var(--color-border-primary);
}

/* ===========================================
   Tab Navigation
   =========================================== */
.flex.justify-between.w-5\/6.mx-auto.mt-4 {
  background: var(--color-bg-tertiary) !important;
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.flex.justify-between.w-5\/6.mx-auto.mt-4 button {
  background: var(--color-bg-tertiary) !important;
  color: var(--color-text-secondary);
  border-right: var(--border-width-thin) solid var(--color-border-secondary) !important;
  padding: var(--spacing-sm) var(--spacing-md);
  transition: var(--transition-hover);
  font-weight: var(--font-weight-semibold);
}

.flex.justify-between.w-5\/6.mx-auto.mt-4 button:last-child {
  border-right: none !important;
}

.flex.justify-between.w-5\/6.mx-auto.mt-4 button:hover {
  background: rgba(42, 42, 42, 0.6) !important;
  color: var(--color-accent-gold-dim);
}

.flex.justify-between.w-5\/6.mx-auto.mt-4 button.bg-\[\#2a5573\] {
  background: var(--color-btn-primary-border) !important;
  border-color: var(--color-gold-primary) !important;
  color: #ffffff !important;
  box-shadow: var(--shadow-gold-medium);
}

/* ===========================================
   Search & Filter Controls
   =========================================== */
.w-5\/6.mx-auto.mt-4.mb-4.flex.gap-2 input[type="text"],
.w-5\/6.mx-auto.mt-4.mb-4.flex.gap-2 select {
  background: var(--color-bg-tertiary) !important;
  color: var(--color-text-primary) !important;
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  font-family: 'EB Garamond', serif;
  transition: var(--transition-hover);
}

.w-5\/6.mx-auto.mt-4.mb-4.flex.gap-2 input[type="text"]:focus,
.w-5\/6.mx-auto.mt-4.mb-4.flex.gap-2 select:focus {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
  outline: none;
}

.w-5\/6.mx-auto.mt-4.mb-4.flex.gap-2 input[type="text"]:hover,
.w-5\/6.mx-auto.mt-4.mb-4.flex.gap-2 select:hover {
  border-color: var(--color-accent-gold-dim);
  background: rgba(42, 42, 42, 0.8) !important;
}

/* ===========================================
   Section Headers (Sticky)
   =========================================== */
h1.sticky.top-0 {
  background: var(--color-bg-secondary) !important;
  color: var(--color-accent-gold-bright);
  border-bottom: var(--border-width-medium) solid var(--color-border-primary);
}

/* ===========================================
   Empty State
   =========================================== */
.empty-state {
  min-height: 17.04vh;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xl);
  font-style: italic;
}

/* ===========================================
   Item Cards & Grid Layout
   =========================================== */
.item-card-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 21%;
  min-width: 200px;
}

.item-card {
  position: relative;
  width: 100%;
  height: 18.52vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: var(--border-width-medium) solid transparent !important;
  border-radius: var(--border-radius-lg);
  transition: var(--transition-hover);
}

.item-card * {
  border-color: transparent !important;
}

.item-selected {
  border-color: var(--color-accent-gold-bright) !important;
  box-shadow: inset 0 0 10px var(--color-gold-rgba-medium), 0 0 8px var(--color-gold-rgba-medium);
}

.item-selected * {
  border-color: transparent !important;
}

.item-card:hover {
  border-color: var(--color-accent-gold-dim) !important;
}

.item-pedestal {
  position: absolute;
  bottom: -30%;
  left: 50%;
  transform: translateX(-50%);
  width: 85%;
  height: auto;
  z-index: 1;
  pointer-events: none;
  opacity: 1;
}

.item-icon {
  position: absolute;
  top: 35%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 75%;
  height: auto;
  max-height: 85%;
  z-index: 2;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6));
  pointer-events: none;
}

.item-name-label {
  width: 100%;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 0.625vw;
  font-weight: var(--font-weight-semibold);
  padding: 0.37vh 0.21vw;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 0.37vh;
  transition: var(--transition-hover);
}

.item-name-label:hover {
  color: var(--color-accent-gold-bright);
}

.item-name-container {
  max-height: 8.89vh;
  width: 100%;
}

/* ===========================================
   Quantity Input & Action Buttons
   =========================================== */
.quantity-input-field {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  width: 5rem; /* Increased width for better 3-digit number display */
  height: 1.5rem;
  z-index: 5; /* Below sticky header (z-10) but above item images */
  background: transparent;
  color: #ffffff;
  border: none;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  text-align: left;
  outline: none;
  transition: var(--transition-hover);
}

.quantity-input-field:focus {
  color: var(--color-accent-gold-bright);
}

/* Delete button on inventory items */
.delete-item-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  right: 0;
  width: 1.5rem;
  height: 1.5rem;
  z-index: 5; /* Below sticky header (z-10) but above item images */
  background: transparent;
  border: none;
  color: var(--color-btn-danger-text);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  transition: var(--transition-hover);
  cursor: pointer;
}

.delete-item-btn:hover {
  color: var(--color-btn-danger-border);
  transform: scale(1.2);
}

/* Quantity adjustment buttons (+ / -) */
.quantity-decrease-btn,
.quantity-increase-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 1rem;
  background: var(--color-btn-primary-border);
  color: #ffffff;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  border: none;
  border-radius: 0;
  transition: var(--transition-hover);
  cursor: pointer;
}

.quantity-decrease-btn {
  border-right: var(--border-width-thin) solid rgba(0, 0, 0, 0.3);
}

.quantity-decrease-btn:hover,
.quantity-increase-btn:hover {
  background: var(--color-btn-primary-border);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

/* Add to Inventory button */
.add-to-inventory-btn {
  width: 100%;
  height: 1rem;
  background: var(--color-btn-success-bg);
  color: #ffffff;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border: var(--border-width-thin) solid var(--color-btn-success-border);
  border-radius: 0;
  transition: var(--transition-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.add-to-inventory-btn:hover {
  background: var(--color-btn-success-bg-hover);
  box-shadow: 0 0 8px rgba(32, 103, 34, 0.5);
}

.in-inventory-label {
  background: var(--color-bg-tertiary);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
  border: var(--border-width-thin) solid var(--color-border-tertiary);
}

/* ===========================================
   Pagination Controls
   =========================================== */
.pagination-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  color: #ffffff;
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-semibold);
  transition: var(--transition-hover);
  cursor: pointer;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

.pagination-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: rgba(42, 42, 42, 0.5);
  border-color: var(--color-border-tertiary);
}

/* ===========================================
   Create New Button
   =========================================== */
.create-new-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  color: #ffffff;
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  transition: var(--transition-hover);
  cursor: pointer;
}

.create-new-btn:hover {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

.create-disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

/* ===========================================
   Item Detail Panel (Right Side)
   =========================================== */
.item-detail-panel {
  background: transparent !important;
}

.item-detail-name {
  color: var(--color-accent-gold-bright);
  text-align: center;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-lg);
}

.item-detail-icon-container {
  position: relative;
  width: 16rem;
  height: 18rem;
  background: transparent;
}

.item-detail-pedestal {
  position: absolute;
  bottom: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: auto;
  opacity: 0.9;
}

.item-detail-icon {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6));
}

/* Item description */
.item-detail-panel p {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
}

/* ===========================================
   Detail Sections & Stats
   =========================================== */
.detail-row {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: var(--border-width-thin) solid var(--color-border-tertiary);
  gap: var(--spacing-sm);
}

.detail-label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.detail-value {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.detail-section {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
}

.detail-section-title {
  color: var(--color-accent-gold-bright);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-md);
  text-align: center;
}

.detail-stat {
  display: flex;
  align-items: center;
  padding: calc(var(--spacing-xs) + 2px) 0;
  font-size: var(--font-size-sm);
  gap: var(--spacing-sm);
}

.detail-stat > span:first-child {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

/* Color-coded stat values */
.detail-stat .text-yellow-400 {
  color: var(--color-souls) !important;
}

.detail-stat .text-blue-400 {
  color: var(--color-fp) !important;
  filter: brightness(1.2);
}

.detail-stat .text-purple-400 {
  color: var(--color-accent-gold) !important;
}

/* ===========================================
   Create Item Popup
   =========================================== */
.create-item-popup {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border: var(--border-width-medium) solid var(--color-border-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-panel);
  min-width: 300px;
  z-index: 20000;
}

.popup-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.popup-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  min-width: 90px;
}

.popup-input {
  flex: 1;
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-family: 'EB Garamond', serif;
  transition: var(--transition-hover);
}

.popup-input:focus {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
  outline: none;
}

.popup-create-button {
  align-self: flex-start;
  padding: var(--spacing-sm) var(--spacing-xl);
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  color: #ffffff;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-base);
  border-radius: var(--border-radius-md);
  margin-top: var(--spacing-sm);
  transition: var(--transition-hover);
}

.popup-create-button:hover {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

/* Type dropdown fix - ensure readable contrast */
:deep(.popup-row select),
:deep(.popup-row button[role="combobox"]) {
  background: var(--color-bg-tertiary) !important;
  color: #ffffff !important;
  border: var(--border-width-thin) solid var(--color-border-primary);
}

:deep(.popup-row select option),
:deep(.popup-row [role="listbox"]),
:deep(.popup-row [role="option"]) {
  background: var(--color-bg-tertiary) !important;
  color: #ffffff !important;
}

:deep(.popup-row [role="option"]:hover),
:deep(.popup-row [role="option"][aria-selected="true"]) {
  background: var(--color-btn-primary-bg-hover) !important;
  color: var(--color-accent-gold-bright) !important;
}

/* ===========================================
   Placeholder State
   =========================================== */
.flex.items-center.justify-center.h-full p {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-lg);
  font-style: italic;
  opacity: 0.7;
}

/* ===========================================
   Weapon Skill Names
   =========================================== */
.weapon-skill-name {
  color: var(--color-accent-gold-bright);
  font-weight: var(--font-weight-semibold);
}

/* ===========================================
   Text Classes
   =========================================== */

.tab-active {
  color: var(--color-text-primary);
}

.section-header {
  color: var(--color-text-primary);
}

.pagination-text {
  color: var(--color-text-primary);
}

.item-description {
  color: var(--color-text-primary);
}

.item-details {
  color: var(--color-text-primary);
}

.placeholder-text {
  color: var(--color-text-primary);
}

/* ===========================================
   Artifact Upgrade Cards
   =========================================== */
.upgrade-card {
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-secondary);
  border-radius: var(--border-radius-md);
}

.upgrade-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-accent-gold-bright);
  margin-bottom: var(--spacing-sm);
}

.upgrade-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-sm);
}

.upgrade-requirements {
  font-size: var(--font-size-sm);
  padding-top: var(--spacing-sm);
  border-top: var(--border-width-thin) solid var(--color-border-tertiary);
}

.requirements-label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin-right: var(--spacing-xs);
}

.requirements-text {
  color: var(--color-text-primary);
  font-style: italic;
}

/* ===========================================
   Independent Scroll for Split Layout
   =========================================== */
.inventory-content-wrapper {
  height: calc(100vh - 190px);
  width: 100%;
}

.inventory-panel-left,
.inventory-panel-right {
  height: 100%;
}

/* Campaign Selector Modal */
.campaign-select-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.campaign-select-modal {
  background: rgba(25, 25, 30, 0.98);
  border: 0.0625rem solid rgba(255, 215, 0, 0.2);
  border-radius: 0.75rem;
  padding: clamp(1.5rem, 2.5vw, 1.875rem);
  max-width: clamp(20rem, 30vw, 25rem);
  width: 90%;
}

.campaign-select-title {
  color: var(--color-gold-primary);
  font-size: clamp(1.1rem, 1.4vw, 1.3rem);
  margin: 0 0 0.5em 0;
}

.campaign-select-text {
  color: #ccc;
  font-size: clamp(0.85rem, 1vw, 0.95rem);
  margin-bottom: 1em;
}

.campaign-select-list {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  margin-bottom: 1em;
}

.campaign-select-btn {
  width: 100%;
  padding: 0.75em 1em;
  background: rgba(255, 215, 0, 0.08);
  border: 0.0625rem solid rgba(255, 215, 0, 0.3);
  border-radius: 0.375rem;
  color: #ffd700;
  font-size: clamp(0.9rem, 1vw, 1rem);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.campaign-select-btn:hover {
  background: rgba(255, 215, 0, 0.15);
  border-color: rgba(255, 215, 0, 0.5);
}

.campaign-select-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5em;
  border-top: 0.0625rem solid rgba(255, 255, 255, 0.1);
}

.campaign-select-cancel {
  padding: 0.5em 1.25em;
  background: transparent;
  border: 0.0625rem solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  color: #ccc;
  cursor: pointer;
}

.campaign-select-cancel:hover {
  border-color: rgba(255, 255, 255, 0.4);
}
</style>