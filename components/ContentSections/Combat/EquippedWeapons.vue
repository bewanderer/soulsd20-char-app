<template>
  <div class="panel-border equipped-weapons-panel">
    <h3 class="panel-title">Equipped Weapons</h3>

    <div class="weapons-container">
      <!-- Main Hand Weapon -->
      <div class="weapon-slot">
        <div class="weapon-header">
          <h4 class="weapon-title">Main Hand</h4>
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 cursor-pointer two-handing-label">
              <input
                v-model="playerStore.CombatSettings.twoHandingMainHand"
                type="checkbox"
                class="w-4 h-4 rounded cursor-pointer two-handing-checkbox"
              />
              <span class="text-sm">Two-Handing</span>
            </label>
            <button
              v-if="mainHandWeapon"
              @click="toggleEditMode('mainHand')"
              class="px-3 py-1 text-sm rounded transition-colors edit-toggle-btn"
              :class="editingMainHand ? 'cancel-mode' : 'edit-mode'"
            >
              {{ editingMainHand ? 'Cancel' : 'Edit' }}
            </button>
          </div>
        </div>

        <div v-if="mainHandWeapon" class="space-y-2 text-sm weapon-details">
          <div class="text-base font-semibold weapon-name">
            {{ mainHandWeapon.name }}
            <span v-if="isMainHandModified" class="text-xs modified-badge ml-2">(modified)</span>
          </div>

          <!-- CF3: Trick Weapon Form Selector -->
          <div v-if="mainHandWeapon.is_trick" class="form-selector mb-3">
            <div class="flex gap-2">
              <button
                @click="mainHandSelectedForm = 'primary'"
                class="form-tab"
                :class="{ 'form-tab-active': mainHandSelectedForm === 'primary' }"
              >
                {{ formatWeaponType(mainHandWeapon.weapon_type) }}
              </button>
              <button
                @click="mainHandSelectedForm = 'secondary'"
                class="form-tab"
                :class="{ 'form-tab-active': mainHandSelectedForm === 'secondary' }"
              >
                {{ formatWeaponType(mainHandWeapon.second_type) }}
              </button>
            </div>
          </div>

          <!-- Damage Type (hidden for catalysts unless user added damage data) -->
          <div v-if="!mainHandIsCatalyst || mainHandHasDamage" class="flex gap-2">
            <span class="text-gray-400">Damage Type:</span>
            <span>{{ getDamageTypes(getEffectiveWeapon(mainHandWeapon, 'mainHand')?.dice) }}</span>
          </div>

          <!-- Damage Dice (hidden for catalysts unless user added damage data) -->
          <div v-if="!mainHandIsCatalyst || mainHandHasDamage" class="flex gap-2">
            <span class="text-gray-400">Damage Dice:</span>
            <span>{{ formatDice(getEffectiveWeapon(mainHandWeapon, 'mainHand')?.dice) }}</span>
          </div>

          <!-- Scaling Display (CF1: Shows damage type) - hidden for catalysts unless user added scaling -->
          <div v-if="(!mainHandIsCatalyst || mainHandHasScaling) && getEffectiveScaling(getEffectiveWeapon(mainHandWeapon, 'mainHand'), playerStore.CombatSettings.twoHandingMainHand).length > 0" class="flex gap-2">
            <span class="text-gray-400">Scaling:</span>
            <span>
              <span v-for="(scaling, index) in getEffectiveScaling(getEffectiveWeapon(mainHandWeapon, 'mainHand'), playerStore.CombatSettings.twoHandingMainHand)" :key="index">
                {{ formatDamageType(scaling.type) }} {{ scaling.stat }}: {{ getEffectiveGrade(scaling.stat, scaling.grade || scaling.value, playerStore.CombatSettings.twoHandingMainHand, getEffectiveWeapon(mainHandWeapon, 'mainHand')) }}
                <span v-if="index < getEffectiveScaling(getEffectiveWeapon(mainHandWeapon, 'mainHand'), playerStore.CombatSettings.twoHandingMainHand).length - 1">, </span>
              </span>
            </span>
          </div>

          <!-- Spell Scaling Display -->
          <div v-if="getEffectiveWeapon(mainHandWeapon, 'mainHand')?.spell_scaling && getEffectiveWeapon(mainHandWeapon, 'mainHand')?.spell_scaling.length > 0" class="flex gap-2">
            <span class="text-gray-400">Spell Scaling:</span>
            <span>
              <span v-for="(scaling, index) in getEffectiveWeapon(mainHandWeapon, 'mainHand')?.spell_scaling" :key="index">
                {{ scaling.stat }}: {{ scaling.value || scaling.grade }} ({{ scaling.requirement }}+)<span v-if="index < getEffectiveWeapon(mainHandWeapon, 'mainHand')?.spell_scaling.length - 1">, </span>
              </span>
            </span>
          </div>

          <!-- Calculated Scaling Bonus (hidden for catalysts unless user added damage and scaling) -->
          <div v-if="!mainHandIsCatalyst || (mainHandHasDamage && mainHandHasScaling)" class="flex gap-2">
            <span class="text-gray-400">Scaling Bonus:</span>
            <span :class="calculateWeaponScaling(getEffectiveWeapon(mainHandWeapon, 'mainHand'), playerStore.CombatSettings.twoHandingMainHand) >= 0 ? 'text-green-400' : 'text-red-400'" class="font-semibold">{{ calculateWeaponScaling(getEffectiveWeapon(mainHandWeapon, 'mainHand'), playerStore.CombatSettings.twoHandingMainHand) >= 0 ? '+' : '' }}{{ calculateWeaponScaling(getEffectiveWeapon(mainHandWeapon, 'mainHand'), playerStore.CombatSettings.twoHandingMainHand) }}</span>
          </div>

          <!-- Total Damage Preview (hidden for catalysts unless user added damage and scaling) -->
          <div v-if="!mainHandIsCatalyst || (mainHandHasDamage && mainHandHasScaling)" class="flex gap-2">
            <span class="text-gray-400">Total Damage:</span>
            <span class="text-yellow-400 font-semibold">
              {{ formatDice(getEffectiveWeapon(mainHandWeapon, 'mainHand')?.dice) }} + {{ calculateWeaponScaling(getEffectiveWeapon(mainHandWeapon, 'mainHand'), playerStore.CombatSettings.twoHandingMainHand) }}
            </span>
          </div>

          <!-- AP Cost (hidden for catalysts unless edited, hidden if 0 and not edited) -->
          <div v-if="mainHandShowAp" class="flex gap-2">
            <span class="text-gray-400">AP Cost:</span>
            <span>{{ getEffectiveWeapon(mainHandWeapon, 'mainHand')?.ap || 'N/A' }}</span>
          </div>

          <!-- Edit Mode UI -->
          <div v-if="editingMainHand && tempMainHandMods" class="mt-4 p-4 bg-gray-800 rounded border border-blue-500">
            <h5 class="font-semibold text-blue-400 mb-3">Edit Weapon Stats</h5>

            <!-- AP Cost Edit -->
            <div class="mb-3">
              <label class="block text-gray-400 text-xs mb-1">AP Cost:</label>
              <input
                v-model.number="tempMainHandMods.ap"
                type="number"
                min="0"
                class="w-20 px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
              />
            </div>

            <!-- Damage Dice Edit -->
            <div class="mb-3">
              <label class="block text-gray-400 text-xs mb-1">Damage Dice:</label>
              <div v-for="(die, index) in tempMainHandMods.dice" :key="index" class="flex items-center gap-2 mb-2">
                <input
                  v-model.number="die.count"
                  type="number"
                  min="1"
                  class="w-16 px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
                  placeholder="Count"
                />
                <span>d</span>
                <input
                  v-model.number="die.value"
                  type="number"
                  min="1"
                  class="w-16 px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
                  placeholder="Sides"
                />
                <select
                  v-model="die.type"
                  class="px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
                >
                  <!-- Damage Types -->
                  <option value="PHYSICAL">PHYSICAL</option>
                  <option value="MAGIC">MAGIC</option>
                  <option value="FIRE">FIRE</option>
                  <option value="LIGHTNING">LIGHTNING</option>
                  <option value="DARK">DARK</option>
                  <option value="TRUE">TRUE</option>
                  <option value="DAMAGE_FP">DAMAGE FP</option>
                  <option value="DAMAGE_AP">DAMAGE AP</option>
                  <!-- Restoration -->
                  <option value="HEAL">HEAL</option>
                  <option value="RESTORE_FP">RESTORE FP</option>
                  <option value="RESTORE_AP">RESTORE AP</option>
                  <!-- Status Buildup -->
                  <option value="BLEED">BLEED</option>
                  <option value="POISON">POISON</option>
                  <option value="TOXIC">TOXIC</option>
                  <option value="FROST">FROST</option>
                  <option value="CURSE">CURSE</option>
                  <option value="POISE">POISE</option>
                  <!-- Equipment -->
                  <option value="DURABILITY">DURABILITY</option>
                  <!-- Manual -->
                  <option value="VARYING">VARYING</option>
                </select>
                <button @click="removeDice('mainHand', index)" class="btn-warning-small">
                  Remove
                </button>
              </div>
              <button @click="addDice('mainHand')" class="btn-success-small">
                Add Dice
              </button>
            </div>

            <!-- Damage Scaling Edit (CF1: Per-Damage-Type Scaling) -->
            <div class="mb-3">
              <label class="block text-gray-400 text-xs mb-1">Damage Scaling:</label>
              <div v-for="(scale, index) in tempMainHandMods.scaling" :key="index" class="flex items-center gap-2 mb-2">
                <select
                  v-model="scale.type"
                  class="px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
                >
                  <option value="PHYSICAL">Physical</option>
                  <option value="MAGIC">Magic</option>
                  <option value="FIRE">Fire</option>
                  <option value="LIGHTNING">Lightning</option>
                  <option value="DARK">Dark</option>
                </select>
                <select
                  v-model="scale.stat"
                  class="px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
                >
                  <option value="STR">STR</option>
                  <option value="DEX">DEX</option>
                  <option value="INT">INT</option>
                  <option value="FAI">FAI</option>
                </select>
                <select
                  v-model="scale.value"
                  class="px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
                >
                  <option value="SS">SS</option>
                  <option value="S">S</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                </select>
                <button @click="removeScaling('mainHand', index)" class="btn-warning-small">
                  Remove
                </button>
              </div>
              <button @click="addScaling('mainHand')" class="btn-success-small">
                Add Scaling
              </button>
            </div>

            <!-- Spell Scaling Edit -->
            <div class="mb-3">
              <label class="block text-gray-400 text-xs mb-1">Spell Scaling:</label>
              <div v-for="(scale, index) in tempMainHandMods.spell_scaling" :key="index" class="flex items-center gap-2 mb-2">
                <select
                  v-model="scale.stat"
                  class="px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
                >
                  <option value="STR">STR</option>
                  <option value="DEX">DEX</option>
                  <option value="INT">INT</option>
                  <option value="FAI">FAI</option>
                </select>
                <input
                  v-model.number="scale.requirement"
                  type="number"
                  min="0"
                  class="w-16 px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
                  placeholder="Req"
                />
                <span class="text-xs">+</span>
                <select
                  v-model="scale.value"
                  class="px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
                >
                  <option value="SS">SS</option>
                  <option value="S">S</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                </select>
                <button @click="removeSpellScaling('mainHand', index)" class="btn-warning-small">
                  Remove
                </button>
              </div>
              <button @click="addSpellScaling('mainHand')" class="btn-success-small">
                Add Spell Scaling
              </button>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 mt-4">
              <button @click="saveModifications('mainHand')" class="btn-success">
                Save Modifications
              </button>
              <button @click="resetModifications('mainHand')" class="btn-warning">
                Reset to Default
              </button>
            </div>
          </div>

          <!-- Weapon Skills -->
          <div v-if="mainHandPrimarySkill || mainHandSecondarySkill" class="mt-3 space-y-2">
            <div
              class="text-gray-400 font-semibold cursor-pointer hover:text-gray-300 transition-colors flex items-center gap-2"
              @click="mainHandSkillsExpanded = !mainHandSkillsExpanded"
            >
              <span>{{ mainHandSkillsExpanded ? '▼' : '▶' }}</span>
              <span>Weapon Skills</span>
            </div>

            <!-- Expandable Skills Section -->
            <div v-if="mainHandSkillsExpanded" class="space-y-2">
              <!-- Primary Skill -->
              <div v-if="mainHandPrimarySkill" class="bg-gray-800 rounded p-2 border border-gray-600">
                <div class="font-semibold text-yellow-400">{{ mainHandPrimarySkill.name }}</div>
                <div class="text-xs text-gray-300 flex gap-3 mt-1">
                  <span v-if="mainHandPrimarySkill.ap || mainHandPrimarySkill.cost_ap">AP: {{ mainHandPrimarySkill.ap || mainHandPrimarySkill.cost_ap }}</span>
                  <span v-if="mainHandPrimarySkill.fp || mainHandPrimarySkill.cost_fp">FP: {{ mainHandPrimarySkill.fp || mainHandPrimarySkill.cost_fp }}</span>
                </div>
                <div v-if="mainHandPrimarySkill.description" class="text-xs text-gray-400 mt-1">
                  {{ mainHandPrimarySkill.description }}
                </div>
              </div>

              <!-- Secondary Skill -->
              <div v-if="mainHandSecondarySkill" class="bg-gray-800 rounded p-2 border border-gray-600">
                <div class="font-semibold text-yellow-400">{{ mainHandSecondarySkill.name }}</div>
                <div class="text-xs text-gray-300 flex gap-3 mt-1">
                  <span v-if="mainHandSecondarySkill.ap || mainHandSecondarySkill.cost_ap">AP: {{ mainHandSecondarySkill.ap || mainHandSecondarySkill.cost_ap }}</span>
                  <span v-if="mainHandSecondarySkill.fp || mainHandSecondarySkill.cost_fp">FP: {{ mainHandSecondarySkill.fp || mainHandSecondarySkill.cost_fp }}</span>
                </div>
                <div v-if="mainHandSecondarySkill.description" class="text-xs text-gray-400 mt-1">
                  {{ mainHandSecondarySkill.description }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-gray-400 italic text-sm">
          No weapon equipped
        </div>
      </div>

      <!-- Off-Hand Weapon -->
      <div class="weapon-slot">
        <div class="weapon-header">
          <h4 class="weapon-title">Off-Hand</h4>
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 cursor-pointer two-handing-label">
              <input
                v-model="playerStore.CombatSettings.twoHandingOffHand"
                type="checkbox"
                class="w-4 h-4 rounded cursor-pointer two-handing-checkbox"
              />
              <span class="text-sm">Two-Handing</span>
            </label>
            <button
              v-if="offHandWeapon"
              @click="toggleEditMode('offHand')"
              class="px-3 py-1 text-sm rounded transition-colors edit-toggle-btn"
              :class="editingOffHand ? 'cancel-mode' : 'edit-mode'"
            >
              {{ editingOffHand ? 'Cancel' : 'Edit' }}
            </button>
          </div>
        </div>

        <div v-if="offHandWeapon" class="space-y-2 text-sm weapon-details">
          <div class="text-base font-semibold weapon-name">
            {{ offHandWeapon.name }}
            <span v-if="isOffHandModified" class="text-xs modified-badge ml-2">(modified)</span>
          </div>

          <!-- CF3: Trick Weapon Form Selector -->
          <div v-if="offHandWeapon.is_trick" class="form-selector mb-3">
            <div class="flex gap-2">
              <button
                @click="offHandSelectedForm = 'primary'"
                class="form-tab"
                :class="{ 'form-tab-active': offHandSelectedForm === 'primary' }"
              >
                {{ formatWeaponType(offHandWeapon.weapon_type) }}
              </button>
              <button
                @click="offHandSelectedForm = 'secondary'"
                class="form-tab"
                :class="{ 'form-tab-active': offHandSelectedForm === 'secondary' }"
              >
                {{ formatWeaponType(offHandWeapon.second_type) }}
              </button>
            </div>
          </div>

          <!-- Damage Type (hidden for catalysts unless user added damage data) -->
          <div v-if="!offHandIsCatalyst || offHandHasDamage" class="flex gap-2">
            <span class="text-gray-400">Damage Type:</span>
            <span>{{ getDamageTypes(getEffectiveWeapon(offHandWeapon, 'offHand')?.dice) }}</span>
          </div>

          <!-- Damage Dice (hidden for catalysts unless user added damage data) -->
          <div v-if="!offHandIsCatalyst || offHandHasDamage" class="flex gap-2">
            <span class="text-gray-400">Damage Dice:</span>
            <span>{{ formatDice(getEffectiveWeapon(offHandWeapon, 'offHand')?.dice) }}</span>
          </div>

          <!-- Scaling Display (CF1: Shows damage type) - hidden for catalysts unless user added scaling -->
          <div v-if="(!offHandIsCatalyst || offHandHasScaling) && getEffectiveScaling(getEffectiveWeapon(offHandWeapon, 'offHand'), playerStore.CombatSettings.twoHandingOffHand).length > 0" class="flex gap-2">
            <span class="text-gray-400">Scaling:</span>
            <span>
              <span v-for="(scaling, index) in getEffectiveScaling(getEffectiveWeapon(offHandWeapon, 'offHand'), playerStore.CombatSettings.twoHandingOffHand)" :key="index">
                {{ formatDamageType(scaling.type) }} {{ scaling.stat }}: {{ getEffectiveGrade(scaling.stat, scaling.grade || scaling.value, playerStore.CombatSettings.twoHandingOffHand, getEffectiveWeapon(offHandWeapon, 'offHand')) }}
                <span v-if="index < getEffectiveScaling(getEffectiveWeapon(offHandWeapon, 'offHand'), playerStore.CombatSettings.twoHandingOffHand).length - 1">, </span>
              </span>
            </span>
          </div>

          <!-- Spell Scaling Display -->
          <div v-if="getEffectiveWeapon(offHandWeapon, 'offHand')?.spell_scaling && getEffectiveWeapon(offHandWeapon, 'offHand')?.spell_scaling.length > 0" class="flex gap-2">
            <span class="text-gray-400">Spell Scaling:</span>
            <span>
              <span v-for="(scaling, index) in getEffectiveWeapon(offHandWeapon, 'offHand')?.spell_scaling" :key="index">
                {{ scaling.stat }}: {{ scaling.value || scaling.grade }} ({{ scaling.requirement }}+)<span v-if="index < getEffectiveWeapon(offHandWeapon, 'offHand')?.spell_scaling.length - 1">, </span>
              </span>
            </span>
          </div>

          <!-- Calculated Scaling Bonus (hidden for catalysts unless user added damage and scaling) -->
          <div v-if="!offHandIsCatalyst || (offHandHasDamage && offHandHasScaling)" class="flex gap-2">
            <span class="text-gray-400">Scaling Bonus:</span>
            <span :class="calculateWeaponScaling(getEffectiveWeapon(offHandWeapon, 'offHand'), playerStore.CombatSettings.twoHandingOffHand) >= 0 ? 'text-green-400' : 'text-red-400'" class="font-semibold">{{ calculateWeaponScaling(getEffectiveWeapon(offHandWeapon, 'offHand'), playerStore.CombatSettings.twoHandingOffHand) >= 0 ? '+' : '' }}{{ calculateWeaponScaling(getEffectiveWeapon(offHandWeapon, 'offHand'), playerStore.CombatSettings.twoHandingOffHand) }}</span>
          </div>

          <!-- Total Damage Preview (hidden for catalysts unless user added damage and scaling) -->
          <div v-if="!offHandIsCatalyst || (offHandHasDamage && offHandHasScaling)" class="flex gap-2">
            <span class="text-gray-400">Total Damage:</span>
            <span class="text-yellow-400 font-semibold">
              {{ formatDice(getEffectiveWeapon(offHandWeapon, 'offHand')?.dice) }} + {{ calculateWeaponScaling(getEffectiveWeapon(offHandWeapon, 'offHand'), playerStore.CombatSettings.twoHandingOffHand) }}
            </span>
          </div>

          <!-- AP Cost (hidden for catalysts unless edited, hidden if 0 and not edited) -->
          <div v-if="offHandShowAp" class="flex gap-2">
            <span class="text-gray-400">AP Cost:</span>
            <span>{{ getEffectiveWeapon(offHandWeapon, 'offHand')?.ap || 'N/A' }}</span>
          </div>

          <!-- Edit Mode UI -->
          <div v-if="editingOffHand && tempOffHandMods" class="mt-4 p-4 bg-gray-800 rounded border border-blue-500">
            <h5 class="font-semibold text-blue-400 mb-3">Edit Weapon Stats</h5>

            <!-- AP Cost Edit -->
            <div class="mb-3">
              <label class="block text-gray-400 text-xs mb-1">AP Cost:</label>
              <input
                v-model.number="tempOffHandMods.ap"
                type="number"
                min="0"
                class="w-20 px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
              />
            </div>

            <!-- Damage Dice Edit -->
            <div class="mb-3">
              <label class="block text-gray-400 text-xs mb-1">Damage Dice:</label>
              <div v-for="(die, index) in tempOffHandMods.dice" :key="index" class="flex items-center gap-2 mb-2">
                <input
                  v-model.number="die.count"
                  type="number"
                  min="1"
                  class="w-16 px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
                  placeholder="Count"
                />
                <span>d</span>
                <input
                  v-model.number="die.value"
                  type="number"
                  min="1"
                  class="w-16 px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
                  placeholder="Sides"
                />
                <select
                  v-model="die.type"
                  class="px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
                >
                  <!-- Damage Types -->
                  <option value="PHYSICAL">PHYSICAL</option>
                  <option value="MAGIC">MAGIC</option>
                  <option value="FIRE">FIRE</option>
                  <option value="LIGHTNING">LIGHTNING</option>
                  <option value="DARK">DARK</option>
                  <option value="TRUE">TRUE</option>
                  <option value="DAMAGE_FP">DAMAGE FP</option>
                  <option value="DAMAGE_AP">DAMAGE AP</option>
                  <!-- Restoration -->
                  <option value="HEAL">HEAL</option>
                  <option value="RESTORE_FP">RESTORE FP</option>
                  <option value="RESTORE_AP">RESTORE AP</option>
                  <!-- Status Buildup -->
                  <option value="BLEED">BLEED</option>
                  <option value="POISON">POISON</option>
                  <option value="TOXIC">TOXIC</option>
                  <option value="FROST">FROST</option>
                  <option value="CURSE">CURSE</option>
                  <option value="POISE">POISE</option>
                  <!-- Equipment -->
                  <option value="DURABILITY">DURABILITY</option>
                  <!-- Manual -->
                  <option value="VARYING">VARYING</option>
                </select>
                <button @click="removeDice('offHand', index)" class="btn-warning-small">
                  Remove
                </button>
              </div>
              <button @click="addDice('offHand')" class="btn-success-small">
                Add Dice
              </button>
            </div>

            <!-- Damage Scaling Edit (CF1: Per-Damage-Type Scaling) -->
            <div class="mb-3">
              <label class="block text-gray-400 text-xs mb-1">Damage Scaling:</label>
              <div v-for="(scale, index) in tempOffHandMods.scaling" :key="index" class="flex items-center gap-2 mb-2">
                <select
                  v-model="scale.type"
                  class="px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
                >
                  <option value="PHYSICAL">Physical</option>
                  <option value="MAGIC">Magic</option>
                  <option value="FIRE">Fire</option>
                  <option value="LIGHTNING">Lightning</option>
                  <option value="DARK">Dark</option>
                </select>
                <select
                  v-model="scale.stat"
                  class="px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
                >
                  <option value="STR">STR</option>
                  <option value="DEX">DEX</option>
                  <option value="INT">INT</option>
                  <option value="FAI">FAI</option>
                </select>
                <select
                  v-model="scale.value"
                  class="px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
                >
                  <option value="SS">SS</option>
                  <option value="S">S</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                </select>
                <button @click="removeScaling('offHand', index)" class="btn-warning-small">
                  Remove
                </button>
              </div>
              <button @click="addScaling('offHand')" class="btn-success-small">
                Add Scaling
              </button>
            </div>

            <!-- Spell Scaling Edit -->
            <div class="mb-3">
              <label class="block text-gray-400 text-xs mb-1">Spell Scaling:</label>
              <div v-for="(scale, index) in tempOffHandMods.spell_scaling" :key="index" class="flex items-center gap-2 mb-2">
                <select
                  v-model="scale.stat"
                  class="px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
                >
                  <option value="STR">STR</option>
                  <option value="DEX">DEX</option>
                  <option value="INT">INT</option>
                  <option value="FAI">FAI</option>
                </select>
                <input
                  v-model.number="scale.requirement"
                  type="number"
                  min="0"
                  class="w-16 px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
                  placeholder="Req"
                />
                <span class="text-xs">+</span>
                <select
                  v-model="scale.value"
                  class="px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
                >
                  <option value="SS">SS</option>
                  <option value="S">S</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                </select>
                <button @click="removeSpellScaling('offHand', index)" class="btn-warning-small">
                  Remove
                </button>
              </div>
              <button @click="addSpellScaling('offHand')" class="btn-success-small">
                Add Spell Scaling
              </button>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 mt-4">
              <button @click="saveModifications('offHand')" class="btn-success">
                Save Modifications
              </button>
              <button @click="resetModifications('offHand')" class="btn-warning-small">
                Reset to Default
              </button>
            </div>
          </div>

          <!-- Weapon Skills -->
          <div v-if="offHandPrimarySkill || offHandSecondarySkill" class="mt-3 space-y-2">
            <div
              class="text-gray-400 font-semibold cursor-pointer hover:text-gray-300 transition-colors flex items-center gap-2"
              @click="offHandSkillsExpanded = !offHandSkillsExpanded"
            >
              <span>{{ offHandSkillsExpanded ? '▼' : '▶' }}</span>
              <span>Weapon Skills</span>
            </div>

            <!-- Expandable Skills Section -->
            <div v-if="offHandSkillsExpanded" class="space-y-2">
              <!-- Primary Skill -->
              <div v-if="offHandPrimarySkill" class="bg-gray-800 rounded p-2 border border-gray-600">
                <div class="font-semibold text-yellow-400">{{ offHandPrimarySkill.name }}</div>
                <div class="text-xs text-gray-300 flex gap-3 mt-1">
                  <span v-if="offHandPrimarySkill.ap || offHandPrimarySkill.cost_ap">AP: {{ offHandPrimarySkill.ap || offHandPrimarySkill.cost_ap }}</span>
                  <span v-if="offHandPrimarySkill.fp || offHandPrimarySkill.cost_fp">FP: {{ offHandPrimarySkill.fp || offHandPrimarySkill.cost_fp }}</span>
                </div>
                <div v-if="offHandPrimarySkill.description" class="text-xs text-gray-400 mt-1">
                  {{ offHandPrimarySkill.description }}
                </div>
              </div>

              <!-- Secondary Skill -->
              <div v-if="offHandSecondarySkill" class="bg-gray-800 rounded p-2 border border-gray-600">
                <div class="font-semibold text-yellow-400">{{ offHandSecondarySkill.name }}</div>
                <div class="text-xs text-gray-300 flex gap-3 mt-1">
                  <span v-if="offHandSecondarySkill.ap || offHandSecondarySkill.cost_ap">AP: {{ offHandSecondarySkill.ap || offHandSecondarySkill.cost_ap }}</span>
                  <span v-if="offHandSecondarySkill.fp || offHandSecondarySkill.cost_fp">FP: {{ offHandSecondarySkill.fp || offHandSecondarySkill.cost_fp }}</span>
                </div>
                <div v-if="offHandSecondarySkill.description" class="text-xs text-gray-400 mt-1">
                  {{ offHandSecondarySkill.description }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-gray-400 italic text-sm">
          No weapon equipped
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '@/store/player'
import { useCompendiumStore } from '@/store/compendium'
import type { WeaponSkill } from '@/mixins/types'
import {
  calculateWeaponScaling,
  formatDice,
  getDamageTypes,
  adjustScalingGrade
} from '@/mixins/combatUtils'

const playerStore = usePlayerStore()
const compendiumStore = useCompendiumStore()

// Catalyst weapon types - these don't show physical damage fields by default
const CATALYST_TYPES = ['STAFF', 'CHIME', 'TALISMAN', 'PYRO', 'CRUCIBLE']

// Edit mode state
const editingMainHand = ref(false)
const editingOffHand = ref(false)

// Temporary modification state (for editing)
const tempMainHandMods = ref<any>(null)
const tempOffHandMods = ref<any>(null)

// Weapon skills collapse state
const mainHandSkillsExpanded = ref(false)
const offHandSkillsExpanded = ref(false)

// CF3: Trick weapon form selection (primary/secondary)
const mainHandSelectedForm = ref<'primary' | 'secondary'>('primary')
const offHandSelectedForm = ref<'primary' | 'secondary'>('primary')

// Check if weapon is modified
const isMainHandModified = computed(() => {
  if (!mainHandWeapon.value) return false
  return !!playerStore.WeaponModifications[mainHandWeapon.value.id]
})

const isOffHandModified = computed(() => {
  if (!offHandWeapon.value) return false
  return !!playerStore.WeaponModifications[offHandWeapon.value.id]
})

// Get weapon data from compendium by matching equipped weapon ID
const mainHandWeapon = computed(() => {
  if (!playerStore.Equipment.MainHand) return null
  return compendiumStore.Weapons.find(w => w.id === playerStore.Equipment.MainHand?.id)
})

const offHandWeapon = computed(() => {
  if (!playerStore.Equipment.OffHand) return null
  return compendiumStore.Weapons.find(w => w.id === playerStore.Equipment.OffHand?.id)
})

// Extract skill ID from URL (e.g., "http://127.0.0.1:8000/weaponSkill/1/" -> 1)
function extractSkillIdFromUrl(url: string | null | undefined): number | null {
  if (!url || typeof url !== 'string') return null

  const match = url.match(/\/weaponSkill\/(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

// Get weapon skill from compendium store by URL
function getWeaponSkillFromUrl(skillUrl: string | null | undefined): WeaponSkill | null {
  const skillId = extractSkillIdFromUrl(skillUrl)
  if (!skillId) return null

  const skill = compendiumStore.WeaponSkills.find(skill => skill.id === skillId)
  if (!skill) return null

  // Apply modifications if they exist
  const modifications = playerStore.WeaponSkillModifications[skill.id]
  if (!modifications) return skill

  // Merge modifications with original skill data
  return { ...skill, ...modifications }
}

// Computed refs for weapon skills (look up from compendium store)
// CF3: Now handles form-specific skills for trick weapons
const mainHandPrimarySkill = computed(() => {
  if (!mainHandWeapon.value) return null
  // CF3: For trick weapons, use form-specific skill
  if (mainHandWeapon.value.is_trick && mainHandSelectedForm.value === 'secondary') {
    return getWeaponSkillFromUrl(mainHandWeapon.value.second_skill_primary)
  }
  return getWeaponSkillFromUrl(mainHandWeapon.value.skill_primary)
})

const mainHandSecondarySkill = computed(() => {
  if (!mainHandWeapon.value) return null
  // CF3: For trick weapons, use form-specific skill
  if (mainHandWeapon.value.is_trick && mainHandSelectedForm.value === 'secondary') {
    return getWeaponSkillFromUrl(mainHandWeapon.value.second_skill_secondary)
  }
  return getWeaponSkillFromUrl(mainHandWeapon.value.skill_secondary)
})

const offHandPrimarySkill = computed(() => {
  if (!offHandWeapon.value) return null
  // CF3: For trick weapons, use form-specific skill
  if (offHandWeapon.value.is_trick && offHandSelectedForm.value === 'secondary') {
    return getWeaponSkillFromUrl(offHandWeapon.value.second_skill_primary)
  }
  return getWeaponSkillFromUrl(offHandWeapon.value.skill_primary)
})

const offHandSecondarySkill = computed(() => {
  if (!offHandWeapon.value) return null
  // CF3: For trick weapons, use form-specific skill
  if (offHandWeapon.value.is_trick && offHandSelectedForm.value === 'secondary') {
    return getWeaponSkillFromUrl(offHandWeapon.value.second_skill_secondary)
  }
  return getWeaponSkillFromUrl(offHandWeapon.value.skill_secondary)
})

// Get effective scaling grade (adjusted for two-handing STR)
// Note: This function should NOT upgrade STR if getEffectiveScaling already added it
function getEffectiveGrade(stat: string, grade: string, twoHanding: boolean, originalWeapon: any): string {
  // Only upgrade STR if the weapon originally had STR scaling
  if (twoHanding && stat === 'STR' && originalWeapon?.scaling?.some((s: any) => s.stat === 'STR')) {
    return adjustScalingGrade(grade, 1)
  }
  return grade
}

// Get effective scaling array (adds STR: E if two-handing and no STR scaling exists)
// CF1: Now includes damage type in scaling entries
function getEffectiveScaling(weapon: any, twoHanding: boolean): any[] {
  if (!weapon || !weapon.scaling) return []

  const scaling = [...weapon.scaling]

  // If two-handing and no STR scaling exists, add Physical STR: E
  if (twoHanding) {
    const hasStrScaling = scaling.some(s => s.stat === 'STR')
    if (!hasStrScaling) {
      // CF1: Include type property - defaults to PHYSICAL for two-handing bonus
      scaling.unshift({ type: 'PHYSICAL', stat: 'STR', grade: 'E', value: 'E' })
    }
  }

  return scaling
}

// CF1: Format damage type for display (PHYSICAL -> Physical)
function formatDamageType(type: string): string {
  if (!type) return ''
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
}

// Check if a weapon is a catalyst type
function isCatalyst(weapon: any): boolean {
  if (!weapon) return false
  const weaponType = weapon.weapon_type?.toUpperCase()
  return CATALYST_TYPES.includes(weaponType)
}

// Check if weapon has damage dice data (for showing damage fields on catalysts that were edited)
function hasDamageData(weapon: any): boolean {
  if (!weapon) return false
  const dice = weapon.dice || []
  return dice.length > 0 && dice.some((d: any) => d.count > 0 && d.value > 0)
}

// Check if weapon has physical scaling data
function hasPhysicalScaling(weapon: any): boolean {
  if (!weapon) return false
  const scaling = weapon.scaling || []
  return scaling.length > 0
}

// Computed helpers for catalyst detection (to keep template clean)
const mainHandEffective = computed(() => getEffectiveWeapon(mainHandWeapon.value, 'mainHand'))
const offHandEffective = computed(() => getEffectiveWeapon(offHandWeapon.value, 'offHand'))

const mainHandIsCatalyst = computed(() => isCatalyst(mainHandEffective.value))
const offHandIsCatalyst = computed(() => isCatalyst(offHandEffective.value))

const mainHandHasDamage = computed(() => hasDamageData(mainHandEffective.value))
const offHandHasDamage = computed(() => hasDamageData(offHandEffective.value))

const mainHandHasScaling = computed(() => hasPhysicalScaling(mainHandEffective.value))
const offHandHasScaling = computed(() => hasPhysicalScaling(offHandEffective.value))

// Check if AP was edited by user (for showing AP on catalysts only when edited)
const mainHandApEdited = computed(() => {
  if (!mainHandWeapon.value) return false
  const mods = playerStore.WeaponModifications[mainHandWeapon.value.id]
  return mods && mods.ap !== undefined
})

const offHandApEdited = computed(() => {
  if (!offHandWeapon.value) return false
  const mods = playerStore.WeaponModifications[offHandWeapon.value.id]
  return mods && mods.ap !== undefined
})

// Check if AP should be shown (hide for catalysts unless edited, hide if 0 and not edited)
const mainHandShowAp = computed(() => {
  const effective = mainHandEffective.value
  if (!effective) return false
  const ap = effective.ap
  // Hide if catalyst and not edited
  if (mainHandIsCatalyst.value && !mainHandApEdited.value) return false
  // Hide if AP is 0 and not edited
  if (ap === 0 && !mainHandApEdited.value) return false
  return true
})

const offHandShowAp = computed(() => {
  const effective = offHandEffective.value
  if (!effective) return false
  const ap = effective.ap
  // Hide if catalyst and not edited
  if (offHandIsCatalyst.value && !offHandApEdited.value) return false
  // Hide if AP is 0 and not edited
  if (ap === 0 && !offHandApEdited.value) return false
  return true
})

// CF3: Get form-specific data from weapon
function getFormData(weapon: any, form: 'primary' | 'secondary') {
  if (!weapon) return null

  // Filter dice, scaling, spell_scaling by form
  const dice = (weapon.dice || []).filter((d: any) => (d.form || 'primary') === form)
  const scaling = (weapon.scaling || []).filter((s: any) => (s.form || 'primary') === form)
  const spellScaling = (weapon.spell_scaling || []).filter((s: any) => (s.form || 'primary') === form)

  // Get form-specific requirements (handle both array and single object)
  let requirements = null
  if (Array.isArray(weapon.requirements)) {
    requirements = weapon.requirements.find((r: any) => (r.form || 'primary') === form) || null
  } else if (weapon.requirements && (weapon.requirements.form || 'primary') === form) {
    requirements = weapon.requirements
  }

  // Get form-specific AP, skills, and infusion
  const ap = form === 'primary' ? weapon.ap : (weapon.second_ap ?? weapon.ap)
  const skillPrimary = form === 'primary' ? weapon.skill_primary : weapon.second_skill_primary
  const skillSecondary = form === 'primary' ? weapon.skill_secondary : weapon.second_skill_secondary
  const infusion = form === 'primary' ? weapon.infusion : weapon.second_infusion
  const weaponType = form === 'primary' ? weapon.weapon_type : (weapon.second_type || weapon.weapon_type)

  return {
    ...weapon,
    ap,
    dice,
    scaling,
    spell_scaling: spellScaling,
    requirements,
    skill_primary: skillPrimary,
    skill_secondary: skillSecondary,
    infusion,
    weapon_type: weaponType,
    _form: form // Track which form this data is for
  }
}

// CF3: Format weapon type for display
function formatWeaponType(type: string): string {
  if (!type) return ''
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Get effective weapon stats (with modifications applied)
// CF3: Now handles form-specific data for trick weapons
function getEffectiveWeapon(weapon: any, hand: 'mainHand' | 'offHand') {
  if (!weapon) return null

  // CF3: Get the selected form for this hand
  const selectedForm = hand === 'mainHand' ? mainHandSelectedForm.value : offHandSelectedForm.value

  // CF3: For trick weapons, get form-specific base data
  let baseWeapon = weapon
  if (weapon.is_trick) {
    baseWeapon = getFormData(weapon, selectedForm)
  }

  // Get modifications by weapon ID
  const mods = playerStore.WeaponModifications[weapon.id]

  if (!mods) return baseWeapon

  // CF3: For trick weapons, filter modifications by form
  let effectiveDice = baseWeapon.dice
  let effectiveScaling = baseWeapon.scaling
  let effectiveSpellScaling = baseWeapon.spell_scaling
  let effectiveAp = baseWeapon.ap

  if (weapon.is_trick) {
    // Filter modifications by selected form
    if (mods.dice && mods.dice.length > 0) {
      effectiveDice = mods.dice.filter((d: any) => (d.form || 'primary') === selectedForm)
    }
    if (mods.scaling && mods.scaling.length > 0) {
      effectiveScaling = mods.scaling.filter((s: any) => (s.form || 'primary') === selectedForm)
    }
    if (mods.spell_scaling && mods.spell_scaling.length > 0) {
      effectiveSpellScaling = mods.spell_scaling.filter((s: any) => (s.form || 'primary') === selectedForm)
    }
    // CF3: Use form-specific AP modification
    if (selectedForm === 'primary' && mods.ap !== undefined) {
      effectiveAp = mods.ap
    } else if (selectedForm === 'secondary' && mods.second_ap !== undefined) {
      effectiveAp = mods.second_ap
    }
  } else {
    // Non-trick weapon: use modifications as before
    if (mods.dice && mods.dice.length > 0) {
      effectiveDice = mods.dice
    }
    if (mods.scaling && mods.scaling.length > 0) {
      effectiveScaling = mods.scaling
    }
    if (mods.spell_scaling && mods.spell_scaling.length > 0) {
      effectiveSpellScaling = mods.spell_scaling
    }
    if (mods.ap !== undefined) {
      effectiveAp = mods.ap
    }
  }

  // Return modified weapon with overrides
  return {
    ...baseWeapon,
    ap: effectiveAp,
    dice: effectiveDice,
    scaling: effectiveScaling,
    spell_scaling: effectiveSpellScaling
  }
}

// Toggle edit mode
// CF3: Now handles form-specific editing for trick weapons
function toggleEditMode(hand: 'mainHand' | 'offHand') {
  if (hand === 'mainHand') {
    if (editingMainHand.value) {
      // Cancel edit
      editingMainHand.value = false
      tempMainHandMods.value = null
    } else {
      // Start edit - initialize temp mods with current weapon or existing mods
      const weapon = mainHandWeapon.value
      if (!weapon) return

      const currentMods = playerStore.WeaponModifications[weapon.id]
      const selectedForm = mainHandSelectedForm.value

      if (currentMods) {
        // Edit existing modifications
        // CF3: For trick weapons, filter to show only selected form's data
        if (weapon.is_trick) {
          tempMainHandMods.value = {
            ap: selectedForm === 'primary' ? (currentMods.ap ?? weapon.ap) : (currentMods.second_ap ?? weapon.second_ap ?? weapon.ap),
            dice: (currentMods.dice || weapon.dice || []).filter((d: any) => (d.form || 'primary') === selectedForm).map((d: any) => ({ ...d })),
            scaling: (currentMods.scaling || weapon.scaling || []).filter((s: any) => (s.form || 'primary') === selectedForm).map((s: any) => ({ ...s })),
            spell_scaling: (currentMods.spell_scaling || weapon.spell_scaling || []).filter((s: any) => (s.form || 'primary') === selectedForm).map((s: any) => ({ ...s })),
            _editingForm: selectedForm // Tracks the active form being edited
          }
        } else {
          tempMainHandMods.value = JSON.parse(JSON.stringify(currentMods))
        }
      } else {
        // Create new modifications from weapon
        // CF3: For trick weapons, use form-specific data
        if (weapon.is_trick) {
          const formData = getFormData(weapon, selectedForm)
          tempMainHandMods.value = {
            ap: formData.ap,
            dice: JSON.parse(JSON.stringify(formData.dice || [])),
            scaling: JSON.parse(JSON.stringify(formData.scaling || [])),
            spell_scaling: JSON.parse(JSON.stringify(formData.spell_scaling || [])),
            _editingForm: selectedForm
          }
        } else {
          tempMainHandMods.value = {
            ap: weapon.ap,
            dice: JSON.parse(JSON.stringify(weapon.dice || [])),
            scaling: JSON.parse(JSON.stringify(weapon.scaling || [])),
            spell_scaling: JSON.parse(JSON.stringify(weapon.spell_scaling || []))
          }
        }
      }
      editingMainHand.value = true
    }
  } else {
    if (editingOffHand.value) {
      editingOffHand.value = false
      tempOffHandMods.value = null
    } else {
      const weapon = offHandWeapon.value
      if (!weapon) return

      const currentMods = playerStore.WeaponModifications[weapon.id]
      const selectedForm = offHandSelectedForm.value

      if (currentMods) {
        // CF3: For trick weapons, filter to show only selected form's data
        if (weapon.is_trick) {
          tempOffHandMods.value = {
            ap: selectedForm === 'primary' ? (currentMods.ap ?? weapon.ap) : (currentMods.second_ap ?? weapon.second_ap ?? weapon.ap),
            dice: (currentMods.dice || weapon.dice || []).filter((d: any) => (d.form || 'primary') === selectedForm).map((d: any) => ({ ...d })),
            scaling: (currentMods.scaling || weapon.scaling || []).filter((s: any) => (s.form || 'primary') === selectedForm).map((s: any) => ({ ...s })),
            spell_scaling: (currentMods.spell_scaling || weapon.spell_scaling || []).filter((s: any) => (s.form || 'primary') === selectedForm).map((s: any) => ({ ...s })),
            _editingForm: selectedForm
          }
        } else {
          tempOffHandMods.value = JSON.parse(JSON.stringify(currentMods))
        }
      } else {
        // CF3: For trick weapons, use form-specific data
        if (weapon.is_trick) {
          const formData = getFormData(weapon, selectedForm)
          tempOffHandMods.value = {
            ap: formData.ap,
            dice: JSON.parse(JSON.stringify(formData.dice || [])),
            scaling: JSON.parse(JSON.stringify(formData.scaling || [])),
            spell_scaling: JSON.parse(JSON.stringify(formData.spell_scaling || [])),
            _editingForm: selectedForm
          }
        } else {
          tempOffHandMods.value = {
            ap: weapon.ap,
            dice: JSON.parse(JSON.stringify(weapon.dice || [])),
            scaling: JSON.parse(JSON.stringify(weapon.scaling || [])),
            spell_scaling: JSON.parse(JSON.stringify(weapon.spell_scaling || []))
          }
        }
      }
      editingOffHand.value = true
    }
  }
}

// Save modifications
// CF3: Now handles form-specific modifications for trick weapons
function saveModifications(hand: 'mainHand' | 'offHand') {
  // Validate scaling before saving
  if (!validateScaling(hand)) {
    return // Don't save if validation fails
  }

  if (hand === 'mainHand' && tempMainHandMods.value) {
    const weapon = mainHandWeapon.value
    if (!weapon) return

    // CF3: For trick weapons, merge form-specific modifications
    if (weapon.is_trick && tempMainHandMods.value._editingForm) {
      const editingForm = tempMainHandMods.value._editingForm
      const existingMods = playerStore.WeaponModifications[weapon.id] || {
        ap: weapon.ap,
        second_ap: weapon.second_ap,
        dice: JSON.parse(JSON.stringify(weapon.dice || [])),
        scaling: JSON.parse(JSON.stringify(weapon.scaling || [])),
        spell_scaling: JSON.parse(JSON.stringify(weapon.spell_scaling || []))
      }

      // Update AP for the correct form
      if (editingForm === 'primary') {
        existingMods.ap = tempMainHandMods.value.ap
      } else {
        existingMods.second_ap = tempMainHandMods.value.ap
      }

      // Merge dice: remove old form entries, add new ones with form field
      existingMods.dice = (existingMods.dice || []).filter((d: any) => (d.form || 'primary') !== editingForm)
      const newDice = tempMainHandMods.value.dice.map((d: any) => ({ ...d, form: editingForm }))
      existingMods.dice = [...existingMods.dice, ...newDice]

      // Merge scaling: remove old form entries, add new ones with form field
      existingMods.scaling = (existingMods.scaling || []).filter((s: any) => (s.form || 'primary') !== editingForm)
      const newScaling = tempMainHandMods.value.scaling.map((s: any) => ({ ...s, form: editingForm }))
      existingMods.scaling = [...existingMods.scaling, ...newScaling]

      // Merge spell_scaling: remove old form entries, add new ones with form field
      existingMods.spell_scaling = (existingMods.spell_scaling || []).filter((s: any) => (s.form || 'primary') !== editingForm)
      const newSpellScaling = tempMainHandMods.value.spell_scaling.map((s: any) => ({ ...s, form: editingForm }))
      existingMods.spell_scaling = [...existingMods.spell_scaling, ...newSpellScaling]

      playerStore.WeaponModifications[weapon.id] = existingMods
    } else {
      // Non-trick weapon: save as before
      playerStore.WeaponModifications[weapon.id] = tempMainHandMods.value
    }
    playerStore.save()
    editingMainHand.value = false
    tempMainHandMods.value = null
  } else if (hand === 'offHand' && tempOffHandMods.value) {
    const weapon = offHandWeapon.value
    if (!weapon) return

    // CF3: For trick weapons, merge form-specific modifications
    if (weapon.is_trick && tempOffHandMods.value._editingForm) {
      const editingForm = tempOffHandMods.value._editingForm
      const existingMods = playerStore.WeaponModifications[weapon.id] || {
        ap: weapon.ap,
        second_ap: weapon.second_ap,
        dice: JSON.parse(JSON.stringify(weapon.dice || [])),
        scaling: JSON.parse(JSON.stringify(weapon.scaling || [])),
        spell_scaling: JSON.parse(JSON.stringify(weapon.spell_scaling || []))
      }

      // Update AP for the correct form
      if (editingForm === 'primary') {
        existingMods.ap = tempOffHandMods.value.ap
      } else {
        existingMods.second_ap = tempOffHandMods.value.ap
      }

      // Merge dice
      existingMods.dice = (existingMods.dice || []).filter((d: any) => (d.form || 'primary') !== editingForm)
      const newDice = tempOffHandMods.value.dice.map((d: any) => ({ ...d, form: editingForm }))
      existingMods.dice = [...existingMods.dice, ...newDice]

      // Merge scaling
      existingMods.scaling = (existingMods.scaling || []).filter((s: any) => (s.form || 'primary') !== editingForm)
      const newScaling = tempOffHandMods.value.scaling.map((s: any) => ({ ...s, form: editingForm }))
      existingMods.scaling = [...existingMods.scaling, ...newScaling]

      // Merge spell_scaling
      existingMods.spell_scaling = (existingMods.spell_scaling || []).filter((s: any) => (s.form || 'primary') !== editingForm)
      const newSpellScaling = tempOffHandMods.value.spell_scaling.map((s: any) => ({ ...s, form: editingForm }))
      existingMods.spell_scaling = [...existingMods.spell_scaling, ...newSpellScaling]

      playerStore.WeaponModifications[weapon.id] = existingMods
    } else {
      playerStore.WeaponModifications[weapon.id] = tempOffHandMods.value
    }
    playerStore.save()
    editingOffHand.value = false
    tempOffHandMods.value = null
  }
}

// Reset modifications
function resetModifications(hand: 'mainHand' | 'offHand') {
  if (hand === 'mainHand') {
    const weapon = mainHandWeapon.value
    if (!weapon) return

    // Delete modifications for this weapon ID
    delete playerStore.WeaponModifications[weapon.id]
    playerStore.save()
    editingMainHand.value = false
    tempMainHandMods.value = null
  } else {
    const weapon = offHandWeapon.value
    if (!weapon) return

    // Delete modifications for this weapon ID
    delete playerStore.WeaponModifications[weapon.id]
    playerStore.save()
    editingOffHand.value = false
    tempOffHandMods.value = null
  }
}

// Add dice
// CF3: Includes form field for trick weapons
function addDice(hand: 'mainHand' | 'offHand') {
  const mods = hand === 'mainHand' ? tempMainHandMods.value : tempOffHandMods.value
  if (mods && mods.dice) {
    const newDice: any = { type: 'PHYSICAL', count: 1, value: 6 }
    // CF3: Add form field if editing a trick weapon
    if (mods._editingForm) {
      newDice.form = mods._editingForm
    }
    mods.dice.push(newDice)
  }
}

// Remove dice
function removeDice(hand: 'mainHand' | 'offHand', index: number) {
  const mods = hand === 'mainHand' ? tempMainHandMods.value : tempOffHandMods.value
  if (mods && mods.dice) {
    mods.dice.splice(index, 1)
  }
}

// Get available stats for a specific scaling entry (filters out already-used stats)
// CF1: No longer restricts to unique stats - now allows any stat with different damage types
function getAvailableStatsForScaling(hand: 'mainHand' | 'offHand', currentIndex: number): string[] {
  // All stats available - multiple entries per stat allowed (with different damage types)
  return ['STR', 'DEX', 'INT', 'FAI']
}

// CF1: Validate scaling to prevent duplicate (type, stat) combinations
function validateScaling(hand: 'mainHand' | 'offHand'): boolean {
  const mods = hand === 'mainHand' ? tempMainHandMods.value : tempOffHandMods.value
  if (!mods || !mods.scaling) return true

  // Check for duplicate (type, stat) combinations
  const combos = mods.scaling.map((s: any) => `${s.type}-${s.stat}`)
  const hasDuplicates = combos.length !== new Set(combos).size

  if (hasDuplicates) {
    alert('Damage Scaling cannot have duplicate damage type + stat combinations. Each combination (e.g., Physical STR) can only appear once.')
    return false
  }

  return true
}

// Add scaling
// CF1: Updated to allow multiple scaling entries with unique (type, stat) combinations
// CF3: Includes form field for trick weapons
function addScaling(hand: 'mainHand' | 'offHand') {
  const mods = hand === 'mainHand' ? tempMainHandMods.value : tempOffHandMods.value
  if (mods && mods.scaling) {
    const damageTypes = ['PHYSICAL', 'MAGIC', 'FIRE', 'LIGHTNING', 'DARK']
    const stats = ['STR', 'DEX', 'INT', 'FAI']

    // Find first available (type, stat) combination
    const existingCombos = mods.scaling.map((s: any) => `${s.type}-${s.stat}`)

    for (const type of damageTypes) {
      for (const stat of stats) {
        if (!existingCombos.includes(`${type}-${stat}`)) {
          const newScaling: any = { type, stat, value: 'E' }
          // CF3: Add form field if editing a trick weapon
          if (mods._editingForm) {
            newScaling.form = mods._editingForm
          }
          mods.scaling.push(newScaling)
          return
        }
      }
    }

    // All combinations used (5 types × 4 stats = 20 max)
    alert('Cannot add more scaling: All damage type + stat combinations are already in use.')
  }
}

// Remove scaling
function removeScaling(hand: 'mainHand' | 'offHand', index: number) {
  const mods = hand === 'mainHand' ? tempMainHandMods.value : tempOffHandMods.value
  if (mods && mods.scaling) {
    mods.scaling.splice(index, 1)
  }
}

// Add spell scaling
// CF3: Includes form field for trick weapons
function addSpellScaling(hand: 'mainHand' | 'offHand') {
  const mods = hand === 'mainHand' ? tempMainHandMods.value : tempOffHandMods.value
  if (mods && mods.spell_scaling) {
    // Spell scaling can have multiple entries per stat (for different requirements)
    // Add new entry with default values
    const newSpellScaling: any = { stat: 'INT', requirement: 0, value: 'D' }
    // CF3: Add form field if editing a trick weapon
    if (mods._editingForm) {
      newSpellScaling.form = mods._editingForm
    }
    mods.spell_scaling.push(newSpellScaling)
  }
}

// Remove spell scaling
function removeSpellScaling(hand: 'mainHand' | 'offHand', index: number) {
  const mods = hand === 'mainHand' ? tempMainHandMods.value : tempOffHandMods.value
  if (mods && mods.spell_scaling) {
    mods.spell_scaling.splice(index, 1)
  }
}
</script>

<style scoped>
.equipped-weapons-panel {
  height: 100%;
}

.panel-title {
  color: var(--color-accent-gold-bright);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-lg);
  border-bottom: var(--border-width-medium) solid var(--color-border-primary);
  padding-bottom: var(--spacing-sm);
}

.weapons-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.weapon-slot {
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
}

.weapon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.weapon-title {
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.weapon-header label {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.weapon-header input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-sm);
}

.weapon-header button {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
  border-radius: var(--border-radius-sm);
  transition: var(--transition-hover);
}

.text-yellow-500 {
  color: var(--color-accent-gold-bright);
}

.text-orange-400 {
  color: var(--color-accent-amber);
}

.text-gray-400 {
  color: var(--color-text-secondary);
}

.text-green-400 {
  color: #4ade80;
}

.text-red-400 {
  color: #f87171;
}

.text-yellow-400 {
  color: var(--color-accent-amber);
}

.text-sm {
  font-size: var(--font-size-sm);
}

.text-base {
  font-size: var(--font-size-base);
}

.text-xs {
  font-size: var(--font-size-xs);
}

.space-y-2 > * + * {
  margin-top: var(--spacing-sm);
}

.space-y-3 > * + * {
  margin-top: var(--spacing-md);
}

.space-y-4 > * + * {
  margin-top: var(--spacing-lg);
}

.flex {
  display: flex;
}

.gap-2 {
  gap: var(--spacing-sm);
}

.gap-3 {
  gap: var(--spacing-md);
}

.gap-4 {
  gap: var(--spacing-lg);
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-between: space-between;
}

.mb-2 {
  margin-bottom: var(--spacing-sm);
}

.mb-3 {
  margin-bottom: var(--spacing-md);
}

.mt-1 {
  margin-top: var(--spacing-xs);
}

.mt-3 {
  margin-top: var(--spacing-md);
}

.mt-4 {
  margin-top: var(--spacing-lg);
}

.pt-3 {
  padding-top: var(--spacing-md);
}

.p-2 {
  padding: var(--spacing-sm);
}

.p-4 {
  padding: var(--spacing-lg);
}

.px-2 {
  padding-left: var(--spacing-sm);
  padding-right: var(--spacing-sm);
}

.px-3 {
  padding-left: var(--spacing-md);
  padding-right: var(--spacing-md);
}

.px-4 {
  padding-left: var(--spacing-lg);
  padding-right: var(--spacing-lg);
}

.py-1 {
  padding-top: var(--spacing-xs);
  padding-bottom: var(--spacing-xs);
}

.py-2 {
  padding-top: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
}

.ml-2 {
  margin-left: var(--spacing-sm);
}

.rounded {
  border-radius: var(--border-radius-md);
}

.rounded-lg {
  border-radius: var(--border-radius-lg);
}

.border {
  border-width: var(--border-width-thin);
}

.border-gray-600 {
  border-color: var(--color-border-primary);
}

.border-blue-500 {
  border-color: var(--color-accent-gold);
}

.border-t {
  border-top-width: var(--border-width-thin);
  border-top-style: solid;
}

.bg-gray-800 {
  background: var(--color-bg-secondary);
}

.bg-gray-700 {
  background: var(--color-bg-tertiary);
}

.bg-blue-600 {
  background: var(--color-btn-primary-bg-active);
  border: var(--border-width-thin) solid var(--color-accent-gold);
  color: var(--color-accent-gold-bright);
}

.bg-blue-600:hover {
  background: var(--color-btn-primary-border);
  box-shadow: var(--shadow-gold-soft);
}

.bg-red-600 {
  background: var(--color-red-rgba-light);
  border: var(--border-width-thin) solid var(--color-danger);
  color: #ffffff; /* White text for readability on red background */
}

.bg-red-600:hover {
  background: var(--color-red-rgba-medium);
}

.bg-red-700:hover {
  background: var(--color-red-rgba-strong);
}

/* Small add buttons - golden standard */
button.text-xs.bg-green-600 {
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  color: #ffffff;
  transition: var(--transition-hover);
}

button.text-xs.bg-green-600:hover {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

/* Save Modifications button - green success style */
button.px-4.py-2.bg-green-600 {
  background: var(--color-btn-success-bg);
  border: 2px solid var(--color-btn-success-border);
  color: #ffffff;
  transition: var(--transition-hover);
}

button.px-4.py-2.bg-green-600:hover {
  background: var(--color-btn-success-bg-hover);
  border-color: var(--color-btn-success-border);
  color: #ffffff;
  box-shadow: 0 0 15px rgba(60, 179, 113, 0.5);
}

.bg-green-700:hover {
  background: var(--color-btn-success-bg-hover);
}

/* Reset to Default button - red warning style */
.bg-yellow-600 {
  background: var(--color-red-rgba-light);
  border: var(--border-width-thin) solid var(--color-danger);
  color: #ffffff;
  transition: var(--transition-hover);
}

.bg-yellow-600:hover {
  background: var(--color-red-rgba-medium);
  border-color: var(--color-danger);
  color: #ffffff;
}

.bg-yellow-700:hover {
  background: var(--color-red-rgba-medium);
}

.text-blue-400 {
  color: var(--color-accent-gold);
}

.font-semibold {
  font-weight: var(--font-weight-semibold);
}

.font-bold {
  font-weight: var(--font-weight-bold);
}

.italic {
  font-style: italic;
}

.cursor-pointer {
  cursor: pointer;
}

.transition-colors {
  transition: var(--transition-hover);
}

.hover\:text-gray-300:hover {
  color: var(--color-text-primary);
}

.w-16 {
  width: 64px;
}

.w-20 {
  width: 80px;
}

.w-4 {
  width: 16px;
}

.h-4 {
  height: 16px;
}

.block {
  display: block;
}

/* Two-Handing Label and Checkbox */
.two-handing-label {
  color: var(--color-text-primary);
}

.two-handing-checkbox {
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-primary);
}

.two-handing-checkbox:focus {
  outline: none;
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
}

/* Edit Toggle Button */
.edit-toggle-btn.edit-mode {
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  color: #ffffff;
  transition: var(--transition-hover);
}

.edit-toggle-btn.edit-mode:hover {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

.edit-toggle-btn.cancel-mode {
  background: var(--color-danger);
  border: var(--border-width-thin) solid var(--color-danger);
  color: #ffffff; /* White text for readability on red background */
}

.edit-toggle-btn.cancel-mode:hover {
  background: var(--color-red-rgba-medium);
}

/* Weapon Details */
.weapon-details {
  color: var(--color-text-primary);
}

.weapon-name {
  color: var(--color-accent-gold-bright);
}

.modified-badge {
  color: var(--color-accent-amber);
}

/* Button Success Styles - Matching btn-edit-item from SpellsTab */
.btn-success-small,
.btn-success {
  background: var(--color-green-rgba-medium);
  border: var(--border-width-thin) solid var(--color-success);
  color: #ffffff;
  transition: var(--transition-hover);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.btn-success-small:hover,
.btn-success:hover {
  background: var(--color-green-rgba-strong);
}

/* Warning Button Styles */
.btn-warning-small {
  background: var(--color-red-rgba-medium);
  border: var(--border-width-thin) solid var(--color-danger);
  color: #ffffff;
  transition: var(--transition-hover);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.btn-warning-small:hover {
  background: var(--color-red-rgba-strong);
}

/* CF3: Trick Weapon Form Selector */
.form-selector {
  border-bottom: var(--border-width-thin) solid var(--color-border-primary);
  padding-bottom: var(--spacing-sm);
}

.form-tab {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--transition-hover);
}

.form-tab:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border-color: var(--color-border-secondary);
}

.form-tab-active {
  background: var(--color-btn-primary-border);
  border-color: var(--color-accent-gold);
  color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
}

.form-tab-active:hover {
  background: var(--color-btn-primary-border);
  border-color: var(--color-accent-gold-bright);
}
</style>
