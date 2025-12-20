<template>
  <div class="flex flex-col w-full main-tab">
    <div class="page-header-bar">
      <div class="toggle-controls">
        <div class="toggle-item">
          <span class="toggle-label-text">5th Ring Slot</span>
          <ToggleSwitch
            v-model="store.Enable5thRingSlot"
            :show-label="false"
            @update:modelValue="store.save()"
          />
        </div>
        <div class="toggle-item">
          <span class="toggle-label-text">2nd Artifact Slot</span>
          <ToggleSwitch
            v-model="store.Enable2ndArtifactSlot"
            :show-label="false"
            @update:modelValue="store.save()"
          />
        </div>
      </div>
      <h1 class="page-title">
        Equipment
      </h1>
    </div>

    <div class="flex w-full equipment-content-wrapper">
      <div class="w-2/4 border-r overflow-auto flex-shrink-0 equipment-panel-left">
        <div class="flex flex-col items-center min-h-full text-white p-6">
          <div class="flex flex-col w-full max-w-screen-md">
            <!-- Top Row: MainHand, Armor, Artifacts, OffHand -->
            <div class="flex justify-between space-x-12 mb-12">
              <!-- MainHand and Artifact2 Column -->
              <div class="flex flex-col w-1/5 space-y-12">
                <!-- Artifact Slot 2 -->
                <div
                  class="equipment-slot-container-small"
                  :class="{
                    'selected-slot': selectedSlot === 'Artifact2' && store.Enable2ndArtifactSlot,
                    'valid-slot-highlight': equipModeActive && validSlotsForEquipMode.includes('Artifact2') && store.Enable2ndArtifactSlot,
                    'invalid-slot-highlight': equipModeActive && !validSlotsForEquipMode.includes('Artifact2'),
                    'success-flash': flashingSlot === 'Artifact2',
                    'slot-disabled': !store.Enable2ndArtifactSlot,
                    'cursor-pointer': store.Enable2ndArtifactSlot,
                    'cursor-not-allowed': !store.Enable2ndArtifactSlot
                  }"
                  @click="store.Enable2ndArtifactSlot && handleSlotClick('Artifact2')"
                >
                  <div v-if="store.Equipment.Artifact2" class="equipment-slot-content">
                    <img :src="`/img/inventory_icons/${imageUtils.getPedestalIconFile()}`" class="slot-pedestal" alt="" />
                    <img
                      :src="`/img/inventory_icons/${imageUtils.getItemIconFile(getFullItemData(store.Equipment.Artifact2))}`"
                      :alt="store.Equipment.Artifact2.name"
                      class="slot-icon"
                    />
                  </div>
                  <div v-else class="equipment-slot-empty">
                    <span>Artifact 2</span>
                  </div>
                  <div class="slot-label">{{ store.Equipment.Artifact2?.name || 'Artifact 2' }}</div>
                </div>

                <!-- MainHand Slot -->
                <div
                  class="equipment-slot-container cursor-pointer"
                  :class="{
                    'selected-slot': selectedSlot === 'MainHand',
                    'valid-slot-highlight': equipModeActive && validSlotsForEquipMode.includes('MainHand'),
                    'invalid-slot-highlight': equipModeActive && !validSlotsForEquipMode.includes('MainHand'),
                    'success-flash': flashingSlot === 'MainHand'
                  }"
                  @click="handleSlotClick('MainHand')"
                >
                  <div v-if="store.Equipment.MainHand" class="equipment-slot-content">
                    <img :src="`/img/inventory_icons/${imageUtils.getPedestalIconFile()}`" class="slot-pedestal" alt="" />
                    <img
                      :src="`/img/inventory_icons/${imageUtils.getItemIconFile(getFullItemData(store.Equipment.MainHand))}`"
                      :alt="store.Equipment.MainHand.name"
                      class="slot-icon"
                    />
                  </div>
                  <div v-else class="equipment-slot-empty">
                    <span>Main Hand</span>
                  </div>
                  <div class="slot-label">{{ store.Equipment.MainHand?.name || 'Main Hand' }}</div>
                </div>
              </div>

              <!-- Armor Column -->
              <div class="flex flex-col w-1/5 items-center">
                <!-- Armor Slot -->
                <div
                  class="equipment-slot-container-large cursor-pointer"
                  :class="{
                    'selected-slot': selectedSlot === 'Armor',
                    'valid-slot-highlight': equipModeActive && validSlotsForEquipMode.includes('Armor'),
                    'invalid-slot-highlight': equipModeActive && !validSlotsForEquipMode.includes('Armor'),
                    'success-flash': flashingSlot === 'Armor'
                  }"
                  @click="handleSlotClick('Armor')"
                >
                  <div v-if="store.Equipment.Armor" class="equipment-slot-content">
                    <img :src="`/img/inventory_icons/${imageUtils.getPedestalIconFile()}`" class="slot-pedestal" alt="" />
                    <img
                      :src="`/img/inventory_icons/${imageUtils.getItemIconFile(getFullItemData(store.Equipment.Armor))}`"
                      :alt="store.Equipment.Armor.name"
                      class="slot-icon"
                    />
                  </div>
                  <div v-else class="equipment-slot-empty">
                    <span>Armor</span>
                  </div>
                  <div class="slot-label">{{ store.Equipment.Armor?.name || 'Armor' }}</div>
                </div>
              </div>

              <!-- Artifact1 and OffHand Column -->
              <div class="flex flex-col w-1/5 space-y-12">
                <!-- Artifact Slot 1 -->
                <div
                  class="equipment-slot-container-small cursor-pointer"
                  :class="{
                    'selected-slot': selectedSlot === 'Artifact',
                    'valid-slot-highlight': equipModeActive && validSlotsForEquipMode.includes('Artifact'),
                    'invalid-slot-highlight': equipModeActive && !validSlotsForEquipMode.includes('Artifact'),
                    'success-flash': flashingSlot === 'Artifact'
                  }"
                  @click="handleSlotClick('Artifact')"
                >
                  <div v-if="store.Equipment.Artifact" class="equipment-slot-content">
                    <img :src="`/img/inventory_icons/${imageUtils.getPedestalIconFile()}`" class="slot-pedestal" alt="" />
                    <img
                      :src="`/img/inventory_icons/${imageUtils.getItemIconFile(getFullItemData(store.Equipment.Artifact))}`"
                      :alt="store.Equipment.Artifact.name"
                      class="slot-icon"
                    />
                  </div>
                  <div v-else class="equipment-slot-empty">
                    <span>Artifact 1</span>
                  </div>
                  <div class="slot-label">{{ store.Equipment.Artifact?.name || 'Artifact 1' }}</div>
                </div>

                <!-- OffHand Slot -->
                <div
                  class="equipment-slot-container cursor-pointer"
                  :class="{
                    'selected-slot': selectedSlot === 'OffHand',
                    'valid-slot-highlight': equipModeActive && validSlotsForEquipMode.includes('OffHand'),
                    'invalid-slot-highlight': equipModeActive && !validSlotsForEquipMode.includes('OffHand'),
                    'success-flash': flashingSlot === 'OffHand'
                  }"
                  @click="handleSlotClick('OffHand')"
                >
                  <div v-if="store.Equipment.OffHand" class="equipment-slot-content">
                    <img :src="`/img/inventory_icons/${imageUtils.getPedestalIconFile()}`" class="slot-pedestal" alt="" />
                    <img
                      :src="`/img/inventory_icons/${imageUtils.getItemIconFile(getFullItemData(store.Equipment.OffHand))}`"
                      :alt="store.Equipment.OffHand.name"
                      class="slot-icon"
                    />
                  </div>
                  <div v-else class="equipment-slot-empty">
                    <span>Off Hand</span>
                  </div>
                  <div class="slot-label">{{ store.Equipment.OffHand?.name || 'Off Hand' }}</div>
                </div>
              </div>
            </div>

            <!-- Bottom Row: Ring Slots -->
            <div class="flex justify-around space-x-4">
              <div
                v-for="ringNum in [1, 2, 3, 4, 5]"
                :key="`Ring${ringNum}`"
                class="equipment-slot-container-ring"
                :class="{
                  'selected-slot': selectedSlot === `Ring${ringNum}` && (ringNum !== 5 || store.Enable5thRingSlot),
                  'valid-slot-highlight': equipModeActive && validSlotsForEquipMode.includes(`Ring${ringNum}`) && (ringNum !== 5 || store.Enable5thRingSlot),
                  'invalid-slot-highlight': equipModeActive && !validSlotsForEquipMode.includes(`Ring${ringNum}`),
                  'success-flash': flashingSlot === `Ring${ringNum}`,
                  'slot-disabled': ringNum === 5 && !store.Enable5thRingSlot,
                  'cursor-pointer': ringNum !== 5 || store.Enable5thRingSlot,
                  'cursor-not-allowed': ringNum === 5 && !store.Enable5thRingSlot
                }"
                @click="(ringNum !== 5 || store.Enable5thRingSlot) && handleSlotClick(`Ring${ringNum}`)"
              >
                <div v-if="(store.Equipment as any)[`Ring${ringNum}`]" class="equipment-slot-content">
                  <img :src="`/img/inventory_icons/${imageUtils.getPedestalIconFile()}`" class="slot-pedestal" alt="" />
                  <img
                    :src="`/img/inventory_icons/${imageUtils.getItemIconFile(getFullItemData((store.Equipment as any)[`Ring${ringNum}`]))}`"
                    :alt="(store.Equipment as any)[`Ring${ringNum}`].name"
                    class="slot-icon"
                  />
                </div>
                <div v-else class="equipment-slot-empty">
                  <span>Ring {{ ringNum }}</span>
                </div>
                <div class="slot-label">{{ (store.Equipment as any)[`Ring${ringNum}`]?.name || `Ring ${ringNum}` }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <div class="w-2/4 overflow-auto equipment-panel-right">
        <div class="p-4">
          <!-- Equip mode banner -->
          <div v-if="equipModeActive" class="equip-mode-banner mb-4 p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-bold text-lg banner-title">
                  Click a slot to equip: <span class="text-gold">{{ itemToEquip?.name }}</span>
                </p>
                <p class="text-sm banner-subtitle">Valid slots are highlighted in green</p>
              </div>
              <button
                class="btn-cancel-equip"
                @click="cancelEquipMode"
              >
                Cancel
              </button>
            </div>
          </div>

          <h1 v-else class="w-full flex justify-center mb-4 text-2xl font-semibold section-title">
            {{ selectedSlot ? `Select ${equipDescription}` : 'Click a slot to equip items' }}
          </h1>

          <div v-if="selectedSlot" class="flex flex-wrap w-full text-xs">
            <div v-if="inventoryItems.length === 0" class="flex justify-center w-full text-2xl py-8 empty-inventory-message">
              You have no {{ itemCategoryDescription }} in your inventory
            </div>
            <div v-else class="flex flex-wrap w-full">
              <div v-for="item in inventoryItems" :key="item.id" class="item-card-wrapper m-3">
                <!-- Image area with layered icons -->
                <div
                  class="item-card relative"
                  :class="{
                    'cursor-pointer': item.availableQuantity > 0,
                    'cursor-not-allowed item-unavailable': item.availableQuantity === 0,
                    'item-selected': selectedItemForPreview && selectedItemForPreview.id === item.id && selectedItemForPreview.category === item.category
                  }"
                  @click="handleItemPreview(item)"
                >
                  <!-- Pedestal layer -->
                  <img
                    :src="`/img/inventory_icons/${imageUtils.getPedestalIconFile()}`"
                    class="item-pedestal"
                    alt=""
                    loading="lazy"
                  />

                  <!-- Item icon layer -->
                  <img
                    :src="`/img/inventory_icons/${imageUtils.getItemIconFile(item)}`"
                    :alt="item.name"
                    class="item-icon"
                    :style="getItemIconStyle(item)"
                    loading="lazy"
                  />

                  <!-- Quantity badge -->
                  <div class="quantity-badge" :class="{ 'unavailable': item.availableQuantity === 0 }">
                    {{ item.availableQuantity }}x available
                  </div>

                  <!-- Already equipped overlay -->
                  <div v-if="item.availableQuantity === 0" class="equipped-overlay">
                    Already Equipped
                  </div>
                </div>

                <!-- Name label -->
                <div
                  class="item-name-label cursor-pointer"
                  @click="handleItemPreview(item)"
                >
                  {{ item.name }}
                </div>

                <!-- Equip buttons -->
                <div v-if="item.availableQuantity > 0" class="flex gap-1 mt-1">
                  <button
                    class="flex-1 h-6 text-white text-xs font-bold bg-green-600 hover:bg-green-700"
                    @click.stop="equipItem(item)"
                  >
                    Equip
                  </button>
                  <button
                    class="flex-1 h-6 text-white text-xs font-bold bg-yellow-600 hover:bg-yellow-700"
                    @click.stop="activateEquipMode(item)"
                  >
                    Select Slot
                  </button>
                </div>
                <div
                  v-else
                  class="w-full h-6 text-white text-xs flex items-center justify-center bg-gray-600 mt-1"
                >
                  All Equipped
                </div>
              </div>
            </div>

            <!-- Item Details Preview -->
            <div v-if="selectedItemForPreview" class="mt-8 p-4 border-t border-white border-opacity-20 w-full">
              <!-- Item name -->
              <h2 class="item-detail-name">
                {{ selectedItemForPreview.name }}
              </h2>

              <!-- Item description -->
              <p class="text-sm leading-relaxed text-center max-w-md mx-auto mb-4 item-description">
                {{ selectedItemForPreview.description || 'No description available.' }}
              </p>

              <!-- Unequip buttons (moved to top for easy access) -->
              <div v-if="getEquippedSlots(selectedItemForPreview).length > 0" class="text-center mb-6">
                <p class="text-sm mb-3 equipped-in-message">
                  Currently equipped in: {{ getEquippedSlots(selectedItemForPreview).join(', ') }}
                </p>
                <div class="flex flex-wrap gap-2 justify-center">
                  <button
                    v-for="slot in getEquippedSlots(selectedItemForPreview)"
                    :key="slot"
                    class="btn-unequip"
                    @click="unequipFromSlot(slot)"
                  >
                    Unequip from {{ slot }}
                  </button>
                </div>
              </div>

              <!-- Category-specific details -->
              <div class="w-full max-w-md mx-auto item-details-container">
                <!-- WEAPON DETAILS -->
                <div v-if="selectedItemForPreview.category === 'weapon'" class="space-y-3">
                  <!-- Weapon Class -->
                  <div class="detail-row">
                    <span class="detail-label">Weapon Class:</span>
                    <span class="detail-value">{{ formatWeaponType(selectedItemForPreview.weapon_type) }}</span>
                  </div>

                  <!-- Second Type (if exists) -->
                  <div v-if="selectedItemForPreview.second_type" class="detail-row">
                    <span class="detail-label">Secondary Type:</span>
                    <span class="detail-value">{{ formatWeaponType(selectedItemForPreview.second_type) }}</span>
                  </div>

                  <!-- Damage Dice -->
                  <div v-if="selectedItemForPreview.dice && selectedItemForPreview.dice.length > 0" class="detail-section">
                    <h3 class="detail-section-title">Damage Dice</h3>
                    <div class="space-y-1">
                      <div v-for="(die, index) in selectedItemForPreview.dice" :key="index" class="detail-stat">
                        <span>{{ formatDamageType(die.type) }}:</span>
                        <span class="stat-dice-value">{{ die.count }}d{{ die.value }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- AP Cost -->
                  <div class="detail-row">
                    <span class="detail-label">AP Cost:</span>
                    <span class="detail-value">{{ selectedItemForPreview.ap }}</span>
                  </div>

                  <!-- Durability -->
                  <div class="detail-row">
                    <span class="detail-label">Durability:</span>
                    <span class="detail-value">{{ selectedItemForPreview.durability }}</span>
                  </div>

                  <!-- Infusion (only if exists) -->
                  <div v-if="selectedItemForPreview.infusion" class="detail-row">
                    <span class="detail-label">Infusion:</span>
                    <span class="detail-value">{{ selectedItemForPreview.infusion }}</span>
                  </div>

                  <!-- Twin/Trick Weapon -->
                  <div class="detail-row">
                    <span class="detail-label">Twin Weapon:</span>
                    <span class="detail-value">
                      <input type="checkbox" :checked="selectedItemForPreview.is_twin" disabled class="cursor-default" />
                    </span>
                  </div>

                  <div class="detail-row">
                    <span class="detail-label">Trick Weapon:</span>
                    <span class="detail-value">
                      <input type="checkbox" :checked="selectedItemForPreview.is_trick" disabled class="cursor-default" />
                    </span>
                  </div>

                  <!-- Requirements -->
                  <div v-if="selectedItemForPreview.requirements" class="detail-section">
                    <h3 class="detail-section-title">Requirements</h3>
                    <div class="grid grid-cols-2 gap-2">
                      <div v-if="selectedItemForPreview.requirements.str" class="detail-stat">
                        <span>STR:</span> <span class="stat-requirement-value">{{ selectedItemForPreview.requirements.str }}</span>
                      </div>
                      <div v-if="selectedItemForPreview.requirements.dex" class="detail-stat">
                        <span>DEX:</span> <span class="stat-requirement-value">{{ selectedItemForPreview.requirements.dex }}</span>
                      </div>
                      <div v-if="selectedItemForPreview.requirements.int" class="detail-stat">
                        <span>INT:</span> <span class="stat-requirement-value">{{ selectedItemForPreview.requirements.int }}</span>
                      </div>
                      <div v-if="selectedItemForPreview.requirements.fai" class="detail-stat">
                        <span>FAI:</span> <span class="stat-requirement-value">{{ selectedItemForPreview.requirements.fai }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Scaling -->
                  <div v-if="selectedItemForPreview.scaling && selectedItemForPreview.scaling.length > 0" class="detail-section">
                    <h3 class="detail-section-title">Scaling</h3>
                    <div class="grid grid-cols-2 gap-2">
                      <div v-for="scale in selectedItemForPreview.scaling" :key="scale.stat + scale.type" class="detail-stat">
                        <span>{{ scale.stat }} ({{ formatDamageType(scale.type) }}):</span>
                        <span class="stat-scaling-value">{{ scale.value }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Spell Scaling (for catalysts) -->
                  <div v-if="selectedItemForPreview.spell_scaling && selectedItemForPreview.spell_scaling.length > 0" class="detail-section">
                    <h3 class="detail-section-title">Spell Scaling</h3>
                    <div class="space-y-1">
                      <div v-for="scale in selectedItemForPreview.spell_scaling" :key="scale.stat" class="detail-stat">
                        <span>{{ scale.stat }}:</span>
                        <span class="stat-scaling-value">
                          {{ scale.value }}
                          <span v-if="scale.requirement" class="text-xs ml-2 stat-requirement-inline">(Req: {{ scale.requirement }})</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Weapon Skills -->
                  <div v-if="selectedItemForPreview.skill_primary || selectedItemForPreview.skill_secondary" class="detail-section">
                    <h3 class="detail-section-title">Weapon Skills</h3>
                    <div v-if="selectedItemForPreview.skill_primary" class="detail-value">Primary: <span class="weapon-skill-name">{{ getWeaponSkillName(selectedItemForPreview.skill_primary) }}</span></div>
                    <div v-if="selectedItemForPreview.skill_secondary" class="detail-value">Secondary: <span class="weapon-skill-name">{{ getWeaponSkillName(selectedItemForPreview.skill_secondary) }}</span></div>
                  </div>
                </div>

                <!-- ARMOR DETAILS -->
                <div v-if="selectedItemForPreview.category === 'armor'" class="space-y-3">
                  <!-- Armor Type -->
                  <div class="detail-row">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">{{ selectedItemForPreview.armor_type }}</span>
                  </div>

                  <!-- Durability -->
                  <div v-if="selectedItemForPreview.durability" class="detail-row">
                    <span class="detail-label">Durability:</span>
                    <span class="detail-value">{{ selectedItemForPreview.durability }}</span>
                  </div>

                  <!-- Requirements -->
                  <div v-if="selectedItemForPreview.requirements" class="detail-section">
                    <h3 class="detail-section-title">Requirements</h3>
                    <div class="grid grid-cols-2 gap-2">
                      <div v-if="selectedItemForPreview.requirements.str" class="detail-stat">
                        <span>STR:</span> <span class="stat-requirement-value">{{ selectedItemForPreview.requirements.str }}</span>
                      </div>
                      <div v-if="selectedItemForPreview.requirements.dex" class="detail-stat">
                        <span>DEX:</span> <span class="stat-requirement-value">{{ selectedItemForPreview.requirements.dex }}</span>
                      </div>
                      <div v-if="selectedItemForPreview.requirements.int" class="detail-stat">
                        <span>INT:</span> <span class="stat-requirement-value">{{ selectedItemForPreview.requirements.int }}</span>
                      </div>
                      <div v-if="selectedItemForPreview.requirements.fai" class="detail-stat">
                        <span>FAI:</span> <span class="stat-requirement-value">{{ selectedItemForPreview.requirements.fai }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Bonuses -->
                  <div v-if="selectedItemForPreview.bonuses && selectedItemForPreview.bonuses.length > 0" class="detail-section">
                    <h3 class="detail-section-title">Bonuses</h3>
                    <div class="space-y-1">
                      <div v-for="(bonus, index) in selectedItemForPreview.bonuses" :key="index" class="detail-stat">
                        <span>{{ formatBonusType(bonus.type) }}:</span>
                        <span class="stat-bonus-value">{{ bonus.value > 0 ? '+' : '' }}{{ bonus.value }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- RING DETAILS -->
                <div v-if="selectedItemForPreview.category === 'ring'" class="space-y-3">
                  <!-- Tier -->
                  <div class="detail-row">
                    <span class="detail-label">Tier:</span>
                    <span class="detail-value">{{ selectedItemForPreview.tier }}</span>
                  </div>

                  <!-- Scaling -->
                  <div v-if="selectedItemForPreview.scaling && selectedItemForPreview.scaling.length > 0" class="detail-section">
                    <h3 class="detail-section-title">Scaling</h3>
                    <div class="grid grid-cols-2 gap-2">
                      <div v-for="scale in selectedItemForPreview.scaling" :key="scale.stat + scale.type" class="detail-stat">
                        <span>{{ scale.stat }} ({{ formatDamageType(scale.type) }}):</span>
                        <span class="stat-scaling-value">{{ scale.value }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Dice -->
                  <div v-if="selectedItemForPreview.dice && selectedItemForPreview.dice.length > 0" class="detail-section">
                    <h3 class="detail-section-title">Dice Effects</h3>
                    <div class="space-y-1">
                      <div v-for="(die, index) in selectedItemForPreview.dice" :key="index" class="detail-stat">
                        <span>{{ formatDamageType(die.type) }}:</span>
                        <span class="stat-dice-value">{{ die.count }}d{{ die.value }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Bonuses -->
                  <div v-if="selectedItemForPreview.bonuses && selectedItemForPreview.bonuses.length > 0" class="detail-section">
                    <h3 class="detail-section-title">Bonuses</h3>
                    <div class="space-y-1">
                      <div v-for="(bonus, index) in selectedItemForPreview.bonuses" :key="index" class="detail-stat">
                        <span>{{ formatBonusType(bonus.type) }}:</span>
                        <span class="stat-bonus-value">{{ bonus.value > 0 ? '+' : '' }}{{ bonus.value }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- ARTIFACT DETAILS -->
                <div v-if="selectedItemForPreview.category === 'artifact'" class="space-y-3">
                  <!-- Bonuses -->
                  <div v-if="selectedItemForPreview.bonuses && selectedItemForPreview.bonuses.length > 0" class="detail-section">
                    <h3 class="detail-section-title">Bonuses</h3>
                    <div class="space-y-1">
                      <div v-for="(bonus, index) in selectedItemForPreview.bonuses" :key="index" class="detail-stat">
                        <span>{{ formatBonusType(bonus.type) }}:</span>
                        <span class="stat-bonus-value">{{ bonus.value > 0 ? '+' : '' }}{{ bonus.value }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Scaling -->
                  <div v-if="selectedItemForPreview.scaling && selectedItemForPreview.scaling.length > 0" class="detail-section">
                    <h3 class="detail-section-title">Scaling</h3>
                    <div class="grid grid-cols-2 gap-2">
                      <div v-for="scale in selectedItemForPreview.scaling" :key="scale.stat + scale.type" class="detail-stat">
                        <span>{{ scale.stat }} ({{ formatDamageType(scale.type) }}):</span>
                        <span class="stat-scaling-value">{{ scale.value }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Dice -->
                  <div v-if="selectedItemForPreview.dice && selectedItemForPreview.dice.length > 0" class="detail-section">
                    <h3 class="detail-section-title">Dice Effects</h3>
                    <div class="space-y-1">
                      <div v-for="(die, index) in selectedItemForPreview.dice" :key="index" class="detail-stat">
                        <span>{{ formatDamageType(die.type) }}:</span>
                        <span class="stat-dice-value">{{ die.count }}d{{ die.value }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- ARTIFACT UPGRADES -->
                  <div v-if="selectedItemForPreview.upgrades && selectedItemForPreview.upgrades.length > 0" class="detail-section">
                    <h3 class="detail-section-title">Artifact Upgrades</h3>
                    <div class="space-y-4">
                      <div v-for="(upgrade, index) in selectedItemForPreview.upgrades" :key="index" class="upgrade-card">
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from "~~/store/player"
import { useCompendiumStore } from "~~/store/compendium"
import * as invutils from '@/mixins/invutils'
import * as imageUtils from '@/mixins/imageUtils'
import { Item } from '@/mixins/types'

const store = usePlayerStore()
const compendiumStore = useCompendiumStore()

const selectedSlot = shallowRef('')
const selectedItemForPreview = ref<any>(null)
const equipModeActive = ref(false)
const itemToEquip = ref<any>(null)

const itemCategoryDescription = computed(()=>{
  return invutils.itemCategoryDescription(slotType.value)
})

const slotType = computed(()=>{
  return invutils.slotCategoryMap[selectedSlot.value] || ''
})

const equipDescription = computed(()=>{
  switch (selectedSlot.value) {
    case 'MainHand':
      return 'a main weapon'
    case 'OffHand':
      return 'an off hand'
    case 'Armor':
      return 'an armor set'
    case 'Artifact':
      return 'an artifact for your 1st slot'
    case 'Artifact2':
      return 'an artifact for your 2nd slot'
    case 'Ring1':
      return 'a ring for your 1st slot'
    case 'Ring2':
      return 'a ring for your 2nd slot'
    case 'Ring3':
      return 'a ring for your 3rd slot'
    case 'Ring4':
      return 'a ring for your 4th slot'
    case 'Ring5':
      return 'a ring for your 5th slot'
  }
  return ''
})

const inventoryItems = computed(()=>{
  return store.Inventory.filter(i => i.category === slotType.value).map(item => {
    const available = store.getAvailableQuantity(item.id, item.category)
    return {
      ...item,
      availableQuantity: available
    }
  })
})

const validSlotsForEquipMode = computed(() => {
  if (!equipModeActive.value || !itemToEquip.value) return []
  return invutils.getValidSlotsForCategory(itemToEquip.value.category)
})

function handleSlotClick(slotName: string) {
  // If in equip mode, try to equip the item to this slot
  if (equipModeActive.value && itemToEquip.value) {
    if (validSlotsForEquipMode.value.includes(slotName)) {
      equipItemToSlot(itemToEquip.value, slotName)
    } else {
      console.error('Cannot equip to this slot type')
    }
    return
  }

  // Normal slot selection
  selectedSlot.value = slotName

  // Preview equipped item if slot has one
  const equippedItem = store.Equipment[slotName as keyof typeof store.Equipment]
  if (equippedItem) {
    const fullData = getFullItemData(equippedItem)
    selectedItemForPreview.value = fullData
  } else {
    selectedItemForPreview.value = null
  }
}

function handleItemPreview(item: any) {
  selectedItemForPreview.value = item
}

function activateEquipMode(item: any) {
  equipModeActive.value = true
  itemToEquip.value = item
  selectedItemForPreview.value = item
}

function cancelEquipMode() {
  equipModeActive.value = false
  itemToEquip.value = null
}

function equipItemToSlot(item: any, slotName: string) {
  // Check if item can be equipped to this slot
  if (!invutils.canEquipToSlot(item, slotName)) {
    console.error('Cannot equip item to this slot')
    return
  }

  // Check available quantity
  const available = store.getAvailableQuantity(item.id, item.category)
  if (available <= 0) {
    console.error('No more copies available to equip')
    return
  }

  // Equip the item (auto-replaces if slot is occupied)
  store.equipItem(slotName as any, {
    id: item.id,
    category: item.category,
    name: item.name
  })

  // Flash slot green to show success
  flashSlotSuccess(slotName)

  // Exit equip mode
  cancelEquipMode()
}

function equipItem(item: Item) {
  if (!selectedSlot.value) return

  // Check if item can be equipped to this slot
  if (!invutils.canEquipToSlot(item, selectedSlot.value)) {
    console.error('Cannot equip item to this slot')
    return
  }

  // Check available quantity
  const available = store.getAvailableQuantity(item.id, item.category)
  if (available <= 0) {
    console.error('No more copies available to equip')
    return
  }

  // Store the slot name before clearing selection
  const targetSlot = selectedSlot.value

  // Equip the item
  store.equipItem(targetSlot as any, {
    id: item.id,
    category: item.category,
    name: item.name
  })

  // Flash slot green to show success
  flashSlotSuccess(targetSlot)

  // Clear selection
  selectedSlot.value = ''
}

// Get full item data from compendium based on equipped item reference
function getFullItemData(equippedItem: { id: number; category: string; name: string } | null) {
  if (!equippedItem) return null

  let fullItem: any = null
  switch (equippedItem.category) {
    case 'weapon':
      fullItem = compendiumStore.Weapons.find(w => w.id === equippedItem.id)
      break
    case 'armor':
      fullItem = compendiumStore.Armors.find(a => a.id === equippedItem.id)
      break
    case 'ring':
      fullItem = compendiumStore.Rings.find(r => r.id === equippedItem.id)
      break
    case 'artifact':
      fullItem = compendiumStore.Artifacts.find(a => a.id === equippedItem.id)
      break
  }

  if (fullItem) {
    fullItem.category = equippedItem.category
  }

  return fullItem
}

function getItemIconStyle(item: any) {
  const settings = imageUtils.getIconCustomSettings(item)

  if (!settings.apply) {
    return {}
  }

  return {
    width: settings.width ? `${settings.width}%` : undefined,
    height: settings.height ? `${settings.height}%` : undefined,
    top: settings.top ? `${settings.top}%` : undefined,
    left: settings.left ? `${settings.left}%` : undefined,
    transform: `translate(-50%, -50%)${settings.rotation ? ` rotate(${settings.rotation}deg)` : ''}`
  }
}

function getEquippedSlots(item: any): string[] {
  const slots: string[] = []
  Object.entries(store.Equipment).forEach(([slotName, equippedItem]) => {
    if (equippedItem && equippedItem.id === item.id && equippedItem.category === item.category) {
      slots.push(slotName)
    }
  })
  return slots
}

// Flash slot with success animation
const flashingSlot = ref<string | null>(null)

function flashSlotSuccess(slotName: string) {
  flashingSlot.value = slotName
  setTimeout(() => {
    flashingSlot.value = null
  }, 600)
}

function unequipFromSlot(slotName: string) {
  store.unequipItem(slotName as any)

  // Refresh preview if needed
  if (selectedItemForPreview.value) {
    const equippedSlots = getEquippedSlots(selectedItemForPreview.value)
    if (equippedSlots.length === 0) {
      selectedItemForPreview.value = null
    }
  }
}

// Formatting functions (copied from InventoryTab for consistency)
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

  const bonusTypeMap: Record<string, string> = {
    'VIT': 'Vitality',
    'END': 'Endurance',
    'STR': 'Strength',
    'DEX': 'Dexterity',
    'ATT': 'Attunement',
    'INT': 'Intelligence',
    'FAI': 'Faith',
    'ATH': 'Athletics',
    'ACR': 'Acrobatics',
    'PER': 'Perception',
    'FIR': 'Firekeeping',
    'SAN': 'Sanity',
    'STE': 'Stealth',
    'PRE': 'Precision',
    'DIP': 'Diplomacy',
    'MAG': 'Magics',
    'WOR': 'World History',
    'MON': 'Monsters',
    'COS': 'Cosmic',
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

  let skillId: number
  if (typeof skillIdOrUrl === 'string' && skillIdOrUrl.includes('http')) {
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
  return skill ? skill.name : `Skill #${skillId}`
}
</script>

<style scoped>
/* Equipment slot containers - dark theme with golden borders */
.equipment-slot-container,
.equipment-slot-container-small,
.equipment-slot-container-ring {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background: var(--color-bg-tertiary);
  border: var(--border-width-medium) solid var(--color-border-primary);
  border-radius: var(--border-radius-lg);
  transition: var(--transition-hover);
}

.equipment-slot-container-large {
  position: relative;
  width: 163%;
  aspect-ratio: 0.7;
  background: var(--color-bg-tertiary);
  border: var(--border-width-medium) solid var(--color-border-primary);
  border-radius: var(--border-radius-lg);
  transition: var(--transition-hover);
}

.equipment-slot-container-ring {
  width: 22%;
}

/* Removed hover borders - only selected/highlight states show borders */

.selected-slot {
  border-color: var(--color-accent-gold-bright) !important;
  background: var(--color-btn-primary-bg-hover) !important;
  box-shadow: var(--shadow-gold-medium);
}

/* Equip mode slot highlighting */
.valid-slot-highlight {
  border-color: var(--color-success) !important;
  background: var(--color-green-rgba-light) !important;
  box-shadow: 0 0 16px var(--color-green-rgba-strong);
  animation: pulse-green 1.5s ease-in-out infinite;
}

.invalid-slot-highlight {
  border-color: var(--color-danger) !important;
  background: var(--color-red-rgba-light) !important;
  opacity: 0.5;
  cursor: not-allowed !important;
}

@keyframes pulse-green {
  0%, 100% {
    box-shadow: 0 0 16px rgba(42, 108, 36, 0.8);
  }
  50% {
    box-shadow: 0 0 24px rgba(42, 108, 36, 1);
  }
}

/* Success flash animation */
.success-flash {
  border-color: #2a6c24 !important;
  background: rgba(42, 108, 36, 0.5) !important;
  animation: flash-success 0.6s ease-out;
}

@keyframes flash-success {
  0% {
    box-shadow: 0 0 0px rgba(42, 108, 36, 0);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 32px rgba(42, 108, 36, 1);
    transform: scale(1.05);
  }
  100% {
    box-shadow: 0 0 0px rgba(42, 108, 36, 0);
    transform: scale(1);
  }
}

/* Equipment slot content - for equipped items */
.equipment-slot-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Equipment slot empty state */
.equipment-slot-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  text-align: center;
}

/* Slot label */
.slot-label {
  position: absolute;
  bottom: -25px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 4px;
}

/* Icons for equipped items in slots - SEPARATE STYLES FOR EACH SLOT TYPE */

/* WEAPON SLOTS (MainHand, OffHand) - Standard square slots */
.equipment-slot-container .slot-pedestal {
  position: absolute;
  bottom: -10%;           /* ADJUST: Pedestal vertical position for weapons */
  left: 50%;
  transform: translateX(-50%);
  width: 80%;           /* ADJUST: Pedestal size for weapons */
  height: auto;
  z-index: 1;
  pointer-events: none;
  opacity: 0.9;         /* ADJUST: Pedestal transparency for weapons */
}

.equipment-slot-container .slot-icon {
  position: absolute;
  top: 38%;             /* ADJUST: Item vertical position for weapons */
  left: 50%;            /* ADJUST: Item horizontal position for weapons */
  transform: translate(-50%, -50%);
  width: 70%;           /* ADJUST: Item size for weapons */
  height: auto;
  max-height: 80%;      /* ADJUST: Maximum item height for weapons */
  z-index: 2;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
  pointer-events: none;
}

/* ARTIFACT SLOTS (Artifact1, Artifact2) - Small square slots */
.equipment-slot-container-small .slot-pedestal {
  position: absolute;
  bottom: -10%;           /* ADJUST: Pedestal vertical position for artifacts */
  left: 50%;
  transform: translateX(-50%);
  width: 80%;           /* ADJUST: Pedestal size for artifacts */
  height: auto;
  z-index: 1;
  pointer-events: none;
  opacity: 0.9;         /* ADJUST: Pedestal transparency for artifacts */
}

.equipment-slot-container-small .slot-icon {
  position: absolute;
  top: 35%;             /* ADJUST: Item vertical position for artifacts */
  left: 50%;            /* ADJUST: Item horizontal position for artifacts */
  transform: translate(-50%, -50%);
  width: 55%;           /* ADJUST: Item size for artifacts */
  height: auto;
  max-height: 80%;      /* ADJUST: Maximum item height for artifacts */
  z-index: 2;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
  pointer-events: none;
}

/* ARMOR SLOT - Tall rectangular slot */
.equipment-slot-container-large .slot-pedestal {
  position: absolute;
  bottom: 0%;           /* ADJUST: Pedestal vertical position for armor */
  left: 50%;
  transform: translateX(-50%);
  width: 80%;           /* ADJUST: Pedestal size for armor */
  height: auto;
  z-index: 1;
  pointer-events: none;
  opacity: 0.9;         /* ADJUST: Pedestal transparency for armor */
}

.equipment-slot-container-large .slot-icon {
  position: absolute;
  top: 43%;             /* ADJUST: Item vertical position for armor */
  left: 53%;            /* ADJUST: Item horizontal position for armor */
  transform: translate(-50%, -50%);
  width: 90%;           /* ADJUST: Item size for armor */
  height: auto;
  max-height: 80%;      /* ADJUST: Maximum item height for armor */
  z-index: 2;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
  pointer-events: none;
}

/* RING SLOTS - Small square slots */
.equipment-slot-container-ring .slot-pedestal {
  position: absolute;
  bottom: 0%;           /* ADJUST: Pedestal vertical position for rings */
  left: 50%;
  transform: translateX(-50%);
  width: 80%;           /* ADJUST: Pedestal size for rings */
  height: auto;
  z-index: 1;
  pointer-events: none;
  opacity: 0.9;         /* ADJUST: Pedestal transparency for rings */
}

.equipment-slot-container-ring .slot-icon {
  position: absolute;
  top: 37%;             /* ADJUST: Item vertical position for rings */
  left: 50%;            /* ADJUST: Item horizontal position for rings */
  transform: translate(-50%, -50%);
  width: 70%;           /* ADJUST: Item size for rings */
  height: auto;
  max-height: 80%;      /* ADJUST: Maximum item height for rings */
  z-index: 2;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
  pointer-events: none;
}

/* Equip mode banner */
.equip-mode-banner {
  background: var(--color-bg-secondary);
  border: var(--border-width-medium) solid var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-medium);
}

.text-gold {
  color: var(--color-accent-gold-bright);
}

/* Available items list (right panel) */
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
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-secondary) !important;
  border-radius: var(--border-radius-lg);
  transition: var(--transition-hover);
}

.item-card * {
  border-color: transparent !important;
}

.item-selected {
  border-color: var(--color-accent-gold-bright) !important;
  box-shadow: var(--shadow-gold-medium);
}

.item-selected * {
  border-color: transparent !important;
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
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4));
  pointer-events: none;
}

.item-name-label {
  width: 100%;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 0.625vw;
  font-weight: var(--font-weight-bold);
  padding: 0.37vh 0.21vw;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 0.37vh;
}

/* Quantity badge */
.quantity-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--color-green-rgba-strong);
  color: var(--color-text-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  padding: 4px 8px;
  border-radius: 12px;
  z-index: 10;
  pointer-events: none;
  box-shadow: var(--shadow-panel);
}

.quantity-badge.unavailable {
  background: var(--color-red-rgba-strong);
}

/* Unavailable item state */
.item-unavailable {
  opacity: 0.5;
  filter: grayscale(50%);
}

.equipped-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-bg-overlay);
  color: var(--color-accent-gold-bright);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  padding: 8px 12px;
  border-radius: var(--border-radius-sm);
  z-index: 11;
  pointer-events: none;
  white-space: nowrap;
  border: var(--border-width-medium) solid var(--color-accent-gold-dim);
}

/* Item detail view styling */
.item-detail-name {
  color: var(--color-accent-gold-bright);
  text-align: center;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-lg);
}

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
  font-size: var(--font-size-base);
}

.detail-value {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
}

.detail-section {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
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
  padding: var(--spacing-xs) 0;
  font-size: var(--font-size-base);
  gap: var(--spacing-sm);
}

.detail-stat > span:first-child {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

/* Equip and Select Slot buttons - fix overflow and proper colors */
.flex.gap-1.mt-1 button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-xs);
  transition: var(--transition-hover);
  white-space: nowrap;
}

/* Equip button - standard green for affirmative action */
.flex.gap-1.mt-1 button.bg-green-600 {
  background: rgba(32, 103, 34, 0.6);
  color: #ffffff;
  border: none;
}

.flex.gap-1.mt-1 button.bg-green-600:hover {
  background: rgba(32, 103, 34, 0.8);
  box-shadow: 0 0 8px rgba(32, 103, 34, 0.5);
}

/* Select Slot button - golden for primary action */
.flex.gap-1.mt-1 button.bg-yellow-600 {
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  color: #ffffff;
  transition: var(--transition-hover);
}

.flex.gap-1.mt-1 button.bg-yellow-600:hover {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

/* All Equipped button */
.w-full.h-6.text-white.text-xs.flex.items-center.justify-center.bg-gray-600.mt-1 {
  min-height: 2rem;
  background: var(--color-bg-tertiary);
  color: var(--color-text-tertiary);
  border: var(--border-width-thin) solid var(--color-border-tertiary);
  border-radius: var(--border-radius-sm);
}

/* Unequip button - transparent with standard border */
.btn-unequip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  background: transparent;
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  transition: var(--transition-hover);
  cursor: pointer;
}

.btn-unequip:hover {
  border-color: var(--color-btn-danger-border);
  color: var(--color-btn-danger-text);
  box-shadow: 0 0 8px rgba(220, 20, 60, 0.3);
}

/* Cancel equip mode button - transparent with standard border */
.btn-cancel-equip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  background: transparent;
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-sm);
  font-weight: var(--font-weight-bold);
  transition: var(--transition-hover);
  cursor: pointer;
}

.btn-cancel-equip:hover {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
}

/* Weapon Skill Names */
.weapon-skill-name {
  color: var(--color-accent-gold-bright);
  font-weight: var(--font-weight-semibold);
}

/* ===========================================
   Banner and Section Titles
   =========================================== */
.banner-title {
  color: var(--color-text-primary);
}

.banner-subtitle {
  color: var(--color-text-secondary);
  opacity: 0.8;
}

.section-title {
  color: var(--color-text-primary);
}

.empty-inventory-message {
  color: var(--color-text-primary);
}

/* ===========================================
   Item Details Container
   =========================================== */
.item-details-container {
  color: var(--color-text-primary);
}

.item-description {
  color: var(--color-text-primary);
}

.equipped-in-message {
  color: var(--color-accent-gold-bright);
  font-weight: var(--font-weight-semibold);
}

/* ===========================================
   Stat Value Colors (Semantic)
   =========================================== */
.stat-requirement-value {
  color: var(--color-accent-gold-bright);
  font-weight: var(--font-weight-semibold);
}

.stat-requirement-inline {
  color: var(--color-accent-gold-bright);
  font-weight: var(--font-weight-medium);
}

.stat-scaling-value {
  color: var(--color-success);
  filter: brightness(1.3);
  font-weight: var(--font-weight-semibold);
}

.stat-bonus-value {
  color: var(--color-fp);
  filter: brightness(1.2);
  font-weight: var(--font-weight-semibold);
}

.stat-dice-value {
  color: var(--color-accent-gold);
  font-weight: var(--font-weight-semibold);
}

/* Toggle controls in header - aligned left */
.toggle-controls {
  position: absolute;
  left: var(--spacing-lg);
  display: flex;
  gap: var(--spacing-lg);
  align-items: center;
}

.toggle-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.toggle-label-text {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

/* Disabled slot styling */
.slot-disabled {
  opacity: 0.3;
  filter: grayscale(80%);
  pointer-events: none;
  position: relative;
}

.slot-disabled::after {
  content: 'DISABLED';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  color: var(--color-text-tertiary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  z-index: 100;
  white-space: nowrap;
}

/* Independent scroll for split layout */
.equipment-content-wrapper {
  height: calc(100vh - 190px); /* Same as CharacterTab */
  width: 100%;
}

.equipment-panel-left,
.equipment-panel-right {
  height: 100%; /* Fill wrapper height */
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
</style>