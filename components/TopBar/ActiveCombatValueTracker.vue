<template>
  <div class="flex flex-col h-full w-full">
    <!-- HP/FP/AP Bars Section -->
    <div class="flex flex-col justify-between flex-1 px-0 py-2 gap-2">
      <div class="relative w-full h-full text-center rounded overflow-hidden">
        <div class="resource-bar-track"></div>
        <div class="absolute h-full hp-bar" :style="`width: ${regularHpBarWidth}%; transition: width 0.3s ease;`" />
        <div
          v-if="playerStore.UserInputValues.TempHP > 0"
          class="absolute h-full temp-hp-bar"
          :style="`left: ${regularHpBarWidth}%; width: ${tempHpBarWidth}%; transition: width 0.3s ease, left 0.3s ease;`"
        />
        <div class="absolute z-10 left-2/4 top-2/4 origin-center flex items-center" style="transform: translate(-50%, -50%)">
          <input
            v-model.number="playerStore.UserInputValues.CurrentHP"
            type="number"
            min="0"
            class="text-right bg-transparent text-sm font-bold border-none outline-none resource-input resource-text"
            style="text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9); -moz-appearance: textfield;"
            @blur="setHP"
            @keyup.enter="setHP"
          />
          <span v-if="playerStore.UserInputValues.TempHP > 0" class="resource-text text-sm font-bold" style="text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);">+{{ playerStore.UserInputValues.TempHP }}</span>
          <span class="resource-text text-sm font-bold" style="text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);">/</span>
          <span class="resource-text text-sm font-bold" style="text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);">{{ maxHp }}</span>
        </div>
      </div>

      <div class="relative w-full h-full text-center rounded overflow-hidden">
        <div class="resource-bar-track"></div>
        <div class="absolute h-full fp-bar" :style="`width: ${fpPercentage}%; transition: width 0.3s ease;`" />
        <div class="absolute z-10 left-2/4 top-2/4 origin-center flex items-center" style="transform: translate(-50%, -50%)">
          <input
            v-model.number="playerStore.UserInputValues.CurrentFP"
            type="number"
            min="0"
            class="text-right bg-transparent text-sm font-bold border-none outline-none resource-input resource-text"
            style="text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9); -moz-appearance: textfield;"
            @blur="setFP"
            @keyup.enter="setFP"
          />
          <span v-if="playerStore.UserInputValues.CurrentFP > maxFp" class="resource-text text-sm font-bold" style="text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);">+</span>
          <span class="resource-text text-sm font-bold" style="text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);">/</span>
          <span class="resource-text text-sm font-bold" style="text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);">{{ maxFp }}</span>
        </div>
      </div>

      <div class="relative w-full h-full text-center rounded overflow-hidden">
        <div class="resource-bar-track"></div>
        <div class="absolute h-full ap-bar" :style="`width: ${apPercentage}%; transition: width 0.3s ease;`" />
        <div class="absolute z-10 left-2/4 top-2/4 origin-center flex items-center" style="transform: translate(-50%, -50%)">
          <input
            v-model.number="playerStore.UserInputValues.CurrentAP"
            type="number"
            min="0"
            class="text-right bg-transparent text-sm font-bold border-none outline-none resource-input resource-text"
            style="text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9); -moz-appearance: textfield;"
            @blur="setAP"
            @keyup.enter="setAP"
          />
          <span v-if="playerStore.UserInputValues.CurrentAP > maxAp" class="resource-text text-sm font-bold" style="text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);">+</span>
          <span class="resource-text text-sm font-bold" style="text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);">/</span>
          <span class="resource-text text-sm font-bold" style="text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);">{{ maxAp }}</span>
        </div>
      </div>
    </div>

    <!-- Flasks Section Below -->
    <div class="flex h-16 border-t border-white/20">
      <!-- HP Flask Column -->
      <div class="flex flex-col w-1/3 border-r border-white/20">
        <div class="flex h-2/3">
          <button @click="drinkFlask('hp')" class="w-full flask-drink-button">
            <div class="flex w-full justify-center items-center gap-1 p-1 text-center">
              <span class="flask-count-text">{{ playerStore.UserInputValues.HpFlask }}</span>
              <img src="@/img/icons/flask.png" class="w-6" style="filter: brightness(0) invert(0.9);">
            </div>
          </button>

          <div class="flex flex-col w-7 border-l border-white/20">
            <button class="flask-button flex items-center justify-center h-1/2 border-b border-white/20" @click="addFlask('hp')">
              <span class="flask-button-text">+</span>
            </button>

            <button class="flask-button flex items-center justify-center h-1/2" @click="removeFlask('hp')">
              <span class="flask-button-text">-</span>
            </button>
          </div>
        </div>

        <div class="flex flex-col items-center justify-center h-1/3 select-none text-xs flask-label border-t border-white/20 pt-3">
          <span class="text-sm">Crimson ({{ hpFlaskRestoreAmount }})</span>
        </div>
      </div>

      <!-- FP Flask Column -->
      <div class="flex flex-col w-1/3 border-r border-white/20">
        <div class="flex h-2/3">
          <button @click="drinkFlask('fp')" class="w-full flask-drink-button">
            <div class="flex w-full justify-center items-center gap-1 p-1 text-center">
              <span class="flask-count-text">{{ playerStore.UserInputValues.FpFlask }}</span>
              <img src="@/img/icons/flask.png" class="w-6" style="filter: brightness(0) invert(0.9);">
            </div>
          </button>

          <div class="flex flex-col w-7 border-l border-white/20">
            <button class="flask-button flex items-center justify-center h-1/2 border-b border-white/20" @click="addFlask('fp')">
              <span class="flask-button-text">+</span>
            </button>

            <button class="flask-button flex items-center justify-center h-1/2" @click="removeFlask('fp')">
              <span class="flask-button-text">-</span>
            </button>
          </div>
        </div>

        <div class="flex flex-col items-center justify-center h-1/3 select-none text-xs flask-label border-t border-white/20 pt-3">
          <span class="text-sm">Cerulean ({{ fpFlaskRestoreAmount }})</span>
        </div>
      </div>

      <!-- Flask Level Column -->
      <div class="flex flex-col w-1/3">
        <div class="flex h-2/3 items-center justify-center">
        <span class="flask-level-text">+{{ playerStore.UserInputValues.FlaskLevel }}</span>
          <div class="flex flex-col items-center justify-center flask-level-text">
            <img src="@/img/icons/flask.png" class="w-6" style="filter: brightness(0) invert(0.9);" />
          </div>
        </div>

        <div class="flex flex-col items-center justify-center h-1/3 select-none text-xs flask-label border-t border-white/20 pt-3">
          <span class="text-sm">Flask Level</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { statMod } from '~~/mixins/utils';
import { usePlayerStore } from '~~/store/player';

const playerStore = usePlayerStore()

const maxHp = computed(() => {
  const startingHP = playerStore.StartingHP || 0
  const levelHP = playerStore.LevelHP || 0
  const bonusHP = playerStore.UserInputValues.MaxHPBonus || 0

  // Vit Mod bonus: Applied once per even level (2, 4, 6, etc.)
  // Level 1 = 0, Level 2 = 1x, Level 4 = 2x, Level 20 = 10x
  const vitality = playerStore.CharacterStats.Stats.Vitality
  const vitMod = statMod(vitality)
  const level = playerStore.Level
  const vitBonus = vitMod * Math.floor(level / 2)

  return startingHP + levelHP + bonusHP + vitBonus
})

const maxFp = computed(()=>{
  let baseFP = 5
  if (playerStore.CharacterStats.Stats.Attunement >= 10) {
    baseFP += playerStore.CharacterStats.Stats.Attunement - 10
  } else {
    baseFP += statMod(playerStore.CharacterStats.Stats.Attunement)
  }
  return baseFP + playerStore.UserInputValues.MaxFPBonus
})

const maxAp = computed(() => {
  const endurance = playerStore.CharacterStats.Stats.Endurance
  const endMod = statMod(endurance)
  const bonus = playerStore.UserInputValues.MaxAPBonus
  return 8 + endMod + bonus
})

const regularHpBarWidth = computed(() => {
  if (maxHp.value === 0) return 0
  const current = playerStore.UserInputValues.CurrentHP
  const temp = playerStore.UserInputValues.TempHP
  const totalHP = current + temp

  // Bar width calculation base: max(totalHP, maxHP)
  const barBase = Math.max(totalHP, maxHp.value)

  // Regular HP (red) bar: Current HP as percentage of bar base
  const percentage = (current / barBase) * 100
  return Math.min(Math.max(percentage, 0), 100)
})

const tempHpBarWidth = computed(() => {
  const temp = playerStore.UserInputValues.TempHP
  if (maxHp.value === 0 || temp === 0) return 0

  const current = playerStore.UserInputValues.CurrentHP
  const totalHP = current + temp

  // Bar width calculation base: max(totalHP, maxHP)
  const barBase = Math.max(totalHP, maxHp.value)

  // Temp HP (yellow) bar: Temp HP as percentage of bar base
  const percentage = (temp / barBase) * 100
  return Math.min(Math.max(percentage, 0), 100)
})

let fpPercentage = computed(()=>{
  try {
    return Math.max((playerStore.UserInputValues.CurrentFP / maxFp.value) * 100, 0)
  } catch {}
  return 0
})

let apPercentage = computed(()=>{
  try {
    return Math.max((playerStore.UserInputValues.CurrentAP / maxAp.value) * 100, 0)
  } catch {}
  return 0
})

const hpFlaskRestoreAmount = computed<number>(()=>{
  if (playerStore.UserInputValues.FlaskLevel === 0) return 15
  return 15 + (15 * playerStore.UserInputValues.FlaskLevel)
})

const fpFlaskRestoreAmount = computed<number>(()=>{
  if (playerStore.UserInputValues.FlaskLevel === 0) return 5
  return 5 + (2 * playerStore.UserInputValues.FlaskLevel)
})

function drinkFlask(type: string) {
  if (type === 'hp') {
    if (playerStore.UserInputValues.HpFlask === 0) return
    playerStore.UserInputValues.CurrentHP = Math.min(playerStore.UserInputValues.CurrentHP + hpFlaskRestoreAmount.value, maxHp.value)
    playerStore.UserInputValues.HpFlask--
  } else {
    if (playerStore.UserInputValues.FpFlask === 0) return
    playerStore.UserInputValues.CurrentFP = Math.min(playerStore.UserInputValues.CurrentFP + fpFlaskRestoreAmount.value, maxFp.value)
    playerStore.UserInputValues.FpFlask--
  }
}

function addFlask(type: string) {
  if (type === 'hp') {
    playerStore.UserInputValues.HpFlask++
  } else {
    playerStore.UserInputValues.FpFlask++
  }
  playerStore.save()
}

function removeFlask(type: string) {
  if (type === 'hp') {
    playerStore.UserInputValues.HpFlask--
    if (playerStore.UserInputValues.HpFlask < 0) playerStore.UserInputValues.HpFlask = 0
  } else {
    playerStore.UserInputValues.FpFlask--
    if (playerStore.UserInputValues.FpFlask < 0) playerStore.UserInputValues.FpFlask = 0
  }
  playerStore.save()
}

function setHP() {
  // Validate and reset to 0 if empty or invalid
  if (playerStore.UserInputValues.CurrentHP === null || playerStore.UserInputValues.CurrentHP === undefined || isNaN(playerStore.UserInputValues.CurrentHP)) {
    playerStore.UserInputValues.CurrentHP = 0
  }

  // If Current HP exceeds Max HP, convert overflow to Temp HP
  if (playerStore.UserInputValues.CurrentHP > maxHp.value) {
    const overflow = playerStore.UserInputValues.CurrentHP - maxHp.value
    playerStore.UserInputValues.TempHP = overflow  // Reset to overflow amount, not add to existing
    playerStore.UserInputValues.CurrentHP = maxHp.value
  }

  playerStore.save()
}

function setFP() {
  // Validate and reset to 0 if empty or invalid
  if (playerStore.UserInputValues.CurrentFP === null || playerStore.UserInputValues.CurrentFP === undefined || isNaN(playerStore.UserInputValues.CurrentFP)) {
    playerStore.UserInputValues.CurrentFP = 0
  }
  playerStore.save()
}

function setAP() {
  // Validate and reset to 0 if empty or invalid
  if (playerStore.UserInputValues.CurrentAP === null || playerStore.UserInputValues.CurrentAP === undefined || isNaN(playerStore.UserInputValues.CurrentAP)) {
    playerStore.UserInputValues.CurrentAP = 0
  }
  playerStore.save()
}
</script>

<style scoped>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.resource-input {
  min-width: 1ch;
  max-width: 8ch;
  width: auto;
  background: transparent;
  border-color: transparent !important;
  color: white !important;
  margin-right: -9px;
}

.resource-input:focus {
  outline: none;
  border-color: transparent;
  box-shadow: none;
  color: var(--color-accent-gold-bright);
}

.resource-bar-track {
  position: absolute;
  width: 100%;
  height: 100%;
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-sm);
  box-shadow: var(--shadow-inset);
}

.hp-bar {
  background: linear-gradient(90deg, #760000 0%, #a00000 50%, #760000 100%);
  border-radius: var(--border-radius-sm);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}

.temp-hp-bar {
  background: linear-gradient(90deg, #b8860b 0%, var(--color-gold-primary) 50%, #b8860b 100%);
  border-radius: var(--border-radius-sm);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}

.fp-bar {
  background: linear-gradient(90deg, #24586a 0%, #2e6b7a 50%, #24586a 100%);
  border-radius: var(--border-radius-sm);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}

.ap-bar {
  background: linear-gradient(90deg, #206722 0%, #28822d 50%, #206722 100%);
  border-radius: var(--border-radius-sm);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}

.flask-button {
  background: var(--color-btn-primary-border);
  border: none;
  color: #ffffff;
  transition: var(--transition-hover);
  cursor: pointer;
  padding: 0;
  min-width: 0;
  border-radius: 0;
}

.flask-button:hover {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

.flask-button-text {
  color: #ffffff;
  font-size: 0.83vw; /* ~16px at 1920px - matches base text size */
  font-weight: 400; /* Normal weight, matches Flask Level */
  line-height: 1;
}

.flask-drink-button {
  background: transparent;
  border: none;
  cursor: pointer;
  transition: var(--transition-hover);
  padding: 0;
}

.flask-drink-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.flask-count-text {
  color: #ffffff;
  font-size: 0.83vw; /* ~16px at 1920px - matches Flask Level */
  font-weight: 100; /* matches Flask Level */
}

.resource-text {
  color: var(--color-text-primary);
}

.flask-label {
  color: var(--color-text-primary);
}

.flask-level-text {
  color: var(--color-text-primary);
}
</style>