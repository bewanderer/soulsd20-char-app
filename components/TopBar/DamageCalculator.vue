<template>
  <div class="flex flex-col h-full w-full px-1 py-1">
    <!-- Row 1: All controls in one row -->
    <div class="flex items-center gap-2 mb-1">
      <h1 class="calculator-title">Damage Calculator</h1>
      <span class="calculator-label">Initial Damage</span>
      <input v-model="calculatorDamageInput" min="0" type="number" class="initial-damage-input" @blur="validateInitialDamage" />

      <!-- Primary controls -->
      <h3 class="calculator-section-title">Primary</h3>
      <ToggleSwitch v-model="primaryActive" :show-label="false" />

      <!-- Bonus controls -->
      <h3 class="calculator-section-title">Bonus</h3>
      <button @click="resetBonusResistances" class="reset-btn text-base px-2 py-0.5" :disabled="!bonusActive" type="button">
        Reset
      </button>
      <ToggleSwitch v-model="bonusActive" :show-label="false" @update:modelValue="saveBonusActiveState" />
    </div>

    <!-- Row 2: Two Tables Side by Side -->
    <div class="flex gap-20 w-full flex-1">
      <!-- PRIMARY TABLE -->
      <div class="flex flex-col" style="width: 40%;">

        <div class="resistance-table" :class="{ inactive: !primaryActive }">
          <div class="flex w-full h-full">
            <!-- Row labels -->
            <div class="table-row-labels">
              <div class="h-1/4" />
              <div class="flex justify-end items-center h-1/4">Tier</div>
              <div class="flex justify-end items-center h-1/4">Flat</div>
              <div class="flex justify-end items-end text-right h-1/4 pb-0.5">Result</div>
            </div>

            <div class="flex flex-col justify-between h-full w-full">
              <!-- Column headers -->
              <div class="table-column-headers">
                <div class="flex justify-center w-1/5 px-1">Phys</div>
                <div class="flex justify-center w-1/5 px-1">Mag</div>
                <div class="flex justify-center w-1/5 px-1">Fire</div>
                <div class="flex justify-center w-1/5 px-1">Lght</div>
                <div class="flex justify-center w-1/5 px-1">Dark</div>
              </div>

              <!-- Resistance Row -->
              <div class="flex justify-between rounded-sm h-1/4">
                <input v-model="resistancePhysical" type="number" class="resistance-input" :disabled="!primaryActive" @blur="validateResistance('Physical')" />
                <input v-model="resistanceMagic" type="number" class="resistance-input" :disabled="!primaryActive" @blur="validateResistance('Magic')" />
                <input v-model="resistanceFire" type="number" class="resistance-input" :disabled="!primaryActive" @blur="validateResistance('Fire')" />
                <input v-model="resistanceLightning" type="number" class="resistance-input" :disabled="!primaryActive" @blur="validateResistance('Lightning')" />
                <input v-model="resistanceDark" type="number" class="resistance-input" :disabled="!primaryActive" @blur="validateResistance('Dark')" />
              </div>

              <!-- Flat Row -->
              <div class="flex justify-between rounded-sm h-1/4">
                <input v-model="flatPhysical" type="number" min="0" class="resistance-input" :disabled="!primaryActive" @blur="validateFlat('FlatPhysical')" />
                <input v-model="flatMagic" type="number" min="0" class="resistance-input" :disabled="!primaryActive" @blur="validateFlat('FlatMagic')" />
                <input v-model="flatFire" type="number" min="0" class="resistance-input" :disabled="!primaryActive" @blur="validateFlat('FlatFire')" />
                <input v-model="flatLightning" type="number" min="0" class="resistance-input" :disabled="!primaryActive" @blur="validateFlat('FlatLightning')" />
                <input v-model="flatDark" type="number" min="0" class="resistance-input" :disabled="!primaryActive" @blur="validateFlat('FlatDark')" />
              </div>

              <!-- Result Row (only in Primary table) -->
              <div class="flex justify-between rounded-sm h-1/4">
                <button class="result-btn" @click="takeDamage(calculatorDamagePhysical)" type="button">
                  <span v-if="calculatorDamagePhysical > 0">-</span>{{ calculatorDamagePhysical }} HP
                </button>
                <button class="result-btn" @click="takeDamage(calculatorDamageMagic)" type="button">
                  <span v-if="calculatorDamageMagic > 0">-</span>{{ calculatorDamageMagic }} HP
                </button>
                <button class="result-btn" @click="takeDamage(calculatorDamageFire)" type="button">
                  <span v-if="calculatorDamageFire > 0">-</span>{{ calculatorDamageFire }} HP
                </button>
                <button class="result-btn" @click="takeDamage(calculatorDamageLightning)" type="button">
                  <span v-if="calculatorDamageLightning > 0">-</span>{{ calculatorDamageLightning }} HP
                </button>
                <button class="result-btn" @click="takeDamage(calculatorDamageDark)" type="button">
                  <span v-if="calculatorDamageDark > 0">-</span>{{ calculatorDamageDark }} HP
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- BONUS TABLE -->
      <div class="flex flex-col" style="width: 40%;">
        <div class="resistance-table" :class="{ inactive: !bonusActive }">
          <div class="flex w-full h-full">
            <!-- Row labels -->
            <div class="table-row-labels">
              <div class="h-1/4" />
              <div class="flex justify-end items-center h-1/4">Tier</div>
              <div class="flex justify-end items-center h-1/4">Flat</div>
              <div class="flex justify-end items-end text-right h-1/4 pb-0.5"></div>
            </div>

            <div class="flex flex-col justify-between h-full w-full">
              <!-- Column headers -->
              <div class="table-column-headers">
                <div class="flex justify-center w-1/5 px-1">Phys</div>
                <div class="flex justify-center w-1/5 px-1">Mag</div>
                <div class="flex justify-center w-1/5 px-1">Fire</div>
                <div class="flex justify-center w-1/5 px-1">Lght</div>
                <div class="flex justify-center w-1/5 px-1">Dark</div>
              </div>

              <!-- Resistance Row -->
              <div class="flex justify-between rounded-sm h-1/4">
                <input v-model="bonusResistancePhysical" type="number" class="resistance-input" :disabled="!bonusActive" @blur="saveBonusResistance" />
                <input v-model="bonusResistanceMagic" type="number" class="resistance-input" :disabled="!bonusActive" @blur="saveBonusResistance" />
                <input v-model="bonusResistanceFire" type="number" class="resistance-input" :disabled="!bonusActive" @blur="saveBonusResistance" />
                <input v-model="bonusResistanceLightning" type="number" class="resistance-input" :disabled="!bonusActive" @blur="saveBonusResistance" />
                <input v-model="bonusResistanceDark" type="number" class="resistance-input" :disabled="!bonusActive" @blur="saveBonusResistance" />
              </div>

              <!-- Flat Row -->
              <div class="flex justify-between rounded-sm h-1/4">
                <input v-model="bonusFlatPhysical" type="number" min="0" class="resistance-input" :disabled="!bonusActive" @blur="saveBonusResistance" />
                <input v-model="bonusFlatMagic" type="number" min="0" class="resistance-input" :disabled="!bonusActive" @blur="saveBonusResistance" />
                <input v-model="bonusFlatFire" type="number" min="0" class="resistance-input" :disabled="!bonusActive" @blur="saveBonusResistance" />
                <input v-model="bonusFlatLightning" type="number" min="0" class="resistance-input" :disabled="!bonusActive" @blur="saveBonusResistance" />
                <input v-model="bonusFlatDark" type="number" min="0" class="resistance-input" :disabled="!bonusActive" @blur="saveBonusResistance" />
              </div>

              <!-- Empty row (no Result buttons in Bonus table) -->
              <div class="flex justify-between rounded-sm h-1/4">
                <!-- Spacer to maintain alignment with Primary table -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePlayerStore } from "~~/store/player"
import ToggleSwitch from '~/components/UI/ToggleSwitch.vue'

const playerStore = usePlayerStore()

const calculatorDamageInput = ref(0)
const primaryActive = ref(true)
const bonusActive = ref(playerStore.UserInputValues.BonusResistancesActive || false)

// Primary table refs
const resistancePhysical = ref(playerStore.UserInputValues.BonusResistances.Physical)
const resistanceMagic = ref(playerStore.UserInputValues.BonusResistances.Magic)
const resistanceFire = ref(playerStore.UserInputValues.BonusResistances.Fire)
const resistanceLightning = ref(playerStore.UserInputValues.BonusResistances.Lightning)
const resistanceDark = ref(playerStore.UserInputValues.BonusResistances.Dark)

const flatPhysical = ref(playerStore.UserInputValues.BonusResistances.FlatPhysical)
const flatMagic = ref(playerStore.UserInputValues.BonusResistances.FlatMagic)
const flatFire = ref(playerStore.UserInputValues.BonusResistances.FlatFire)
const flatLightning = ref(playerStore.UserInputValues.BonusResistances.FlatLightning)
const flatDark = ref(playerStore.UserInputValues.BonusResistances.FlatDark)

// Bonus table refs
const bonusResistancePhysical = ref(playerStore.UserInputValues.BonusResistancesTemp.Physical)
const bonusResistanceMagic = ref(playerStore.UserInputValues.BonusResistancesTemp.Magic)
const bonusResistanceFire = ref(playerStore.UserInputValues.BonusResistancesTemp.Fire)
const bonusResistanceLightning = ref(playerStore.UserInputValues.BonusResistancesTemp.Lightning)
const bonusResistanceDark = ref(playerStore.UserInputValues.BonusResistancesTemp.Dark)

const bonusFlatPhysical = ref(playerStore.UserInputValues.BonusResistancesTemp.FlatPhysical)
const bonusFlatMagic = ref(playerStore.UserInputValues.BonusResistancesTemp.FlatMagic)
const bonusFlatFire = ref(playerStore.UserInputValues.BonusResistancesTemp.FlatFire)
const bonusFlatLightning = ref(playerStore.UserInputValues.BonusResistancesTemp.FlatLightning)
const bonusFlatDark = ref(playerStore.UserInputValues.BonusResistancesTemp.FlatDark)

// Watch for store changes and sync local refs (handles character reset/switch)
watch(() => playerStore.UserInputValues.BonusResistancesActive, (newVal) => {
  bonusActive.value = newVal
})

watch(() => playerStore.UserInputValues.BonusResistances, (newVal) => {
  resistancePhysical.value = newVal.Physical
  resistanceMagic.value = newVal.Magic
  resistanceFire.value = newVal.Fire
  resistanceLightning.value = newVal.Lightning
  resistanceDark.value = newVal.Dark
  flatPhysical.value = newVal.FlatPhysical
  flatMagic.value = newVal.FlatMagic
  flatFire.value = newVal.FlatFire
  flatLightning.value = newVal.FlatLightning
  flatDark.value = newVal.FlatDark
}, { deep: true })

watch(() => playerStore.UserInputValues.BonusResistancesTemp, (newVal) => {
  bonusResistancePhysical.value = newVal.Physical
  bonusResistanceMagic.value = newVal.Magic
  bonusResistanceFire.value = newVal.Fire
  bonusResistanceLightning.value = newVal.Lightning
  bonusResistanceDark.value = newVal.Dark
  bonusFlatPhysical.value = newVal.FlatPhysical
  bonusFlatMagic.value = newVal.FlatMagic
  bonusFlatFire.value = newVal.FlatFire
  bonusFlatLightning.value = newVal.FlatLightning
  bonusFlatDark.value = newVal.FlatDark
}, { deep: true })

function saveBonusActiveState(value: boolean) {
  playerStore.UserInputValues.BonusResistancesActive = value
}

function resetBonusResistances() {
  if (!confirm('Reset all bonus resistances to 0?')) return

  bonusResistancePhysical.value = 0
  bonusResistanceMagic.value = 0
  bonusResistanceFire.value = 0
  bonusResistanceLightning.value = 0
  bonusResistanceDark.value = 0

  bonusFlatPhysical.value = 0
  bonusFlatMagic.value = 0
  bonusFlatFire.value = 0
  bonusFlatLightning.value = 0
  bonusFlatDark.value = 0

  saveBonusResistance()
}

function saveBonusResistance() {
  playerStore.UserInputValues.BonusResistancesTemp = {
    Physical: bonusResistancePhysical.value,
    Magic: bonusResistanceMagic.value,
    Fire: bonusResistanceFire.value,
    Lightning: bonusResistanceLightning.value,
    Dark: bonusResistanceDark.value,
    FlatPhysical: bonusFlatPhysical.value,
    FlatMagic: bonusFlatMagic.value,
    FlatFire: bonusFlatFire.value,
    FlatLightning: bonusFlatLightning.value,
    FlatDark: bonusFlatDark.value
  }
}

// Damage calculation - combines both tables if both active
const calculatorDamagePhysical = computed(() => {
  let totalResistance = 0
  let totalFlat = 0

  if (primaryActive.value) {
    totalResistance += resistancePhysical.value
    totalFlat += flatPhysical.value
  }

  if (bonusActive.value) {
    totalResistance += bonusResistancePhysical.value
    totalFlat += bonusFlatPhysical.value
  }

  return calulateDamage(calculatorDamageInput.value, totalResistance, totalFlat)
})

const calculatorDamageMagic = computed(() => {
  let totalResistance = 0
  let totalFlat = 0

  if (primaryActive.value) {
    totalResistance += resistanceMagic.value
    totalFlat += flatMagic.value
  }

  if (bonusActive.value) {
    totalResistance += bonusResistanceMagic.value
    totalFlat += bonusFlatMagic.value
  }

  return calulateDamage(calculatorDamageInput.value, totalResistance, totalFlat)
})

const calculatorDamageFire = computed(() => {
  let totalResistance = 0
  let totalFlat = 0

  if (primaryActive.value) {
    totalResistance += resistanceFire.value
    totalFlat += flatFire.value
  }

  if (bonusActive.value) {
    totalResistance += bonusResistanceFire.value
    totalFlat += bonusFlatFire.value
  }

  return calulateDamage(calculatorDamageInput.value, totalResistance, totalFlat)
})

const calculatorDamageLightning = computed(() => {
  let totalResistance = 0
  let totalFlat = 0

  if (primaryActive.value) {
    totalResistance += resistanceLightning.value
    totalFlat += flatLightning.value
  }

  if (bonusActive.value) {
    totalResistance += bonusResistanceLightning.value
    totalFlat += bonusFlatLightning.value
  }

  return calulateDamage(calculatorDamageInput.value, totalResistance, totalFlat)
})

const calculatorDamageDark = computed(() => {
  let totalResistance = 0
  let totalFlat = 0

  if (primaryActive.value) {
    totalResistance += resistanceDark.value
    totalFlat += flatDark.value
  }

  if (bonusActive.value) {
    totalResistance += bonusResistanceDark.value
    totalFlat += bonusFlatDark.value
  }

  return calulateDamage(calculatorDamageInput.value, totalResistance, totalFlat)
})

// Validation functions
function validateInitialDamage() {
  if (calculatorDamageInput.value === null || calculatorDamageInput.value === undefined || calculatorDamageInput.value < 0) {
    calculatorDamageInput.value = 0
  }
}

function validateResistance(type: 'Physical' | 'Magic' | 'Fire' | 'Lightning' | 'Dark') {
  const refMap = {
    Physical: resistancePhysical,
    Magic: resistanceMagic,
    Fire: resistanceFire,
    Lightning: resistanceLightning,
    Dark: resistanceDark
  }

  const ref = refMap[type]
  const previousValue = playerStore.UserInputValues.BonusResistances[type]

  if (ref.value === null || ref.value === undefined) {
    ref.value = previousValue
  } else {
    playerStore.UserInputValues.BonusResistances[type] = Number(ref.value)
  }
}

function validateFlat(type: 'FlatPhysical' | 'FlatMagic' | 'FlatFire' | 'FlatLightning' | 'FlatDark') {
  const refMap = {
    FlatPhysical: flatPhysical,
    FlatMagic: flatMagic,
    FlatFire: flatFire,
    FlatLightning: flatLightning,
    FlatDark: flatDark
  }

  const ref = refMap[type]
  const previousValue = playerStore.UserInputValues.BonusResistances[type]

  if (ref.value === null || ref.value === undefined || ref.value < 0) {
    ref.value = previousValue
  } else {
    playerStore.UserInputValues.BonusResistances[type] = Number(ref.value)
  }
}

// Damage calculation logic
function calulateDamage(damage: number, resistance: number, extraFlat: number): number {
  const dmg = Number(damage) || 0
  const res = Number(resistance) || 0
  const flat = Number(extraFlat) || 0

  let effectiveResForPercentage = res
  if (res > 0) {
    effectiveResForPercentage = Math.min(res, 3)
  }

  const percentageDamage = Math.floor(dmg * effectiveResForPercentage / 10)
  const flatFromResistance = Math.max(res - 3, 0)
  const totalFlat = flatFromResistance + flat
  const finalDamage = dmg - percentageDamage - totalFlat

  return Math.max(finalDamage, 0)
}

function takeDamage(damageAmount: number) {
  playerStore.UserInputValues.CurrentHP -= damageAmount
  if (playerStore.UserInputValues.CurrentHP < 0) playerStore.UserInputValues.CurrentHP = 0
}
</script>

<style scoped>
.resistance-table {
  width: 100%;
  flex: 1;
  min-height: 0;
  max-height: none;
}

.resistance-table.inactive {
  opacity: 0.5;
  pointer-events: none;
}


.resistance-input {
  flex: 1;
  border-right: 1px solid black;
  height: 100%;
  background: white;
  color: #333;
  text-align: center;
  width: var(--calculator-input-width); /* Responsive: 1.67vw (~32px at 1920px) */
  max-width: 2.6vw; /* Responsive: ~50px at 1920px */
  font-size: var(--calculator-input-font-size); /* Responsive: clamp(11px, 0.68vw, 13px) */
  font-weight: 500;
  padding: 2px var(--padding-sm); /* Match result button padding */
}

.resistance-input:disabled {
  background: #ddd;
  cursor: not-allowed;
}

.result-btn {
  flex: 0 0 auto;
  height: 100%;
  min-width: fit-content;
  width: auto;
  border-right: 1px solid black;
  background: white;
  color: #333;
  text-align: center;
  cursor: pointer;
  transition: background 0.2s;
  font-size: var(--calculator-result-font-size); /* Responsive: clamp(10px, 0.625vw, 12px) */
  font-weight: 600;
  padding: 2px var(--padding-sm); /* Responsive padding */
  white-space: nowrap;
  overflow: visible;
  display: inline-block;
}

.result-btn:hover {
  background: #ffcccc;
}

.result-btn:last-child {
  border-right: none;
}

.resistance-input:last-child {
  border-right: none;
}

.reset-btn {
  background: var(--color-btn-primary-border);
  border: none;
  color: white;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover:not(:disabled) {
  background: var(--color-btn-primary-border);
  border-color: var(--color-btn-primary-border-hover);
  box-shadow: var(--shadow-gold-soft);
}

.reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.initial-damage-input {
  background: white;
  border-radius: var(--border-radius-sm); /* Responsive: 0.21vw */
  color: #333;
  text-align: center;
  width: 2.5vw; /* ~48px at 1920px - responsive */
  height: 2.22vh; /* ~24px at 1080p - increased from h-5 (20px) */
  font-size: 0.73vw; /* ~14px at 1920px - responsive */
  border: none;
  outline: none;
  padding: 0 0.21vw; /* ~4px at 1920px - responsive */
}

.initial-damage-input::-webkit-inner-spin-button,
.initial-damage-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.initial-damage-input {
  -moz-appearance: textfield;
}

/* Calculator text styles */
.calculator-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
}

.calculator-label {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}

.calculator-section-title {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
}

.table-row-labels {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 3.5rem;
  height: 100%;
  margin-right: 0.5rem;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.table-column-headers {
  display: flex;
  justify-content: space-between;
  color: var(--color-text-primary);
  height: 25%;
  align-items: center;
  font-size: var(--font-size-sm);
}
</style>
