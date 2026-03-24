<template>
  <div class="top-bar">
    <!-- Section 1: Player Icon -->
    <div class="header-section player-icon-section" @mouseenter="showImageButtons = true" @mouseleave="showImageButtons = false">
      <div v-if="!characterImage" class="player-icon-placeholder">
        ?
      </div>
      <img v-else :src="characterImage" class="player-icon" alt="Character portrait" />

      <div v-if="showImageButtons" class="image-button-overlay">
        <button v-if="!characterImage" @click="openImageUpload('upload')" class="btn-upload">Upload</button>
        <template v-if="characterImage">
          <button @click="openImageUpload('upload')" class="btn-upload">Upload</button>
          <button @click="openImageUpload('edit')" class="btn-edit">Edit</button>
        </template>
      </div>
    </div>

    <!-- Section 2: Character Info -->
    <div class="header-section character-info-section">
      <!-- Left Column -->
      <div class="char-info-column">
        <div class="char-name-dropdown">
          <CharacterSelector />
        </div>

        <div class="info-row">
          <span class="info-label label-smaller">Souls Level</span>
          <input v-model.number="playerStore.Level" type="number" class="info-input editable-input" @blur="saveCharacter" @keyup.enter="saveCharacter" />
        </div>
        <div class="info-row">
          <span class="info-label">Souls</span>
          <div class="info-input souls-display">
            <input v-model.number="playerStore.Souls" type="number" class="souls-editable" @blur="saveCharacter" @keyup.enter="saveCharacter" /> / {{ requiredSoulsToLevel }}
          </div>
        </div>
        <div v-if="playerStore.canLevelUp()" class="info-row level-up-row">
          <span class="info-label"></span>
          <button @click="openLevelUpModal" class="btn-level-up">
            Level Up
          </button>
        </div>
      </div>

      <!-- Right Column -->
      <div class="char-info-column">
        <div class="info-row">
          <span class="info-label">Gender</span>
          <div class="info-input">{{ playerStore.Gender || 'Not set' }}</div>
        </div>
        <div class="info-row">
          <span class="info-label">Lineage</span>
          <div class="info-input">{{ lineageName || 'Not set' }}</div>
        </div>
        <div class="info-row">
          <span class="info-label">Bloodline</span>
          <div class="info-input">{{ bloodlineName || 'None' }}</div>
        </div>
        <div class="info-row">
          <span class="info-label label-smaller">Background</span>
          <div class="info-input">{{ backgroundName || 'Not set' }}</div>
        </div>
        <div class="info-row">
          <span class="info-label">Undying</span>
          <input v-model.number="playerStore.Undying" type="number" class="info-input editable-input" @blur="saveCharacter" @keyup.enter="saveCharacter" />
        </div>
      </div>
    </div>

    <!-- Section 3: Resource Bars + Flasks -->
    <div class="header-section resource-bars-section">
      <ActiveCombatValueTracker />
    </div>

    <!-- Section 4: Statuses (single column) -->
    <div class="header-section statuses-section">
      <StatusOption name="Curse" />
      <StatusOption name="Bleed" />
      <StatusOption name="Toxic" />
      <StatusOption name="Frost" />
      <StatusOption name="Poison" />
      <StatusOption name="Poise" />
    </div>

    <!-- Section 5: Damage Calculator -->
    <div class="header-section calculator-section">
      <DamageCalculator />
    </div>

    <!-- Character Image Upload Modal -->
    <CharacterImageUpload
      v-if="showImageUploadModal"
      :mode="imageUploadMode"
      :existingImage="playerStore.CharacterImagePath"
      @close="closeImageUpload"
      @save="handleImageSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from '@/store/player'
import { useCompendiumStore } from '@/store/compendium'
import CharacterImageUpload from '@/components/Modals/CharacterImageUpload.vue'

const playerStore = usePlayerStore()
const compendiumStore = useCompendiumStore()

const showImageButtons = ref(false)
const showImageUploadModal = ref(false)
const imageUploadMode = ref<'upload' | 'edit'>('upload')

const characterImage = computed(() => {
  const raw = playerStore.CharacterImagePath || ''
  if (!raw) return ''

  // Try parsing JSON (legacy format with position data)
  let url = raw
  try {
    const data = JSON.parse(raw)
    url = data.url || raw
  } catch {
    // Plain URL string
  }

  // R2-hosted images (production) are full URLs already
  if (url.startsWith('https://')) return url

  // Server-hosted images (development) need the API base URL prefix
  if (url.startsWith('/media/')) {
    const config = useRuntimeConfig()
    const apiBase = config.public.API_BASE_URL || 'http://127.0.0.1:8000'
    return `${apiBase}${url}`
  }
  return url
})

const requiredSoulsToLevel = computed(() => {
  return (playerStore.Level * 10) + 10
})

const lineageName = computed(() => {
  if (!playerStore.LineageId) return ''
  const lineage = compendiumStore.getLineageById(playerStore.LineageId)
  return lineage?.name || ''
})

const bloodlineName = computed(() => {
  if (!playerStore.BloodlineId) return ''
  const bloodline = compendiumStore.getBloodlineById(playerStore.BloodlineId)
  return bloodline?.name || ''
})

const backgroundName = computed(() => {
  if (!playerStore.BackgroundId) return ''
  const background = compendiumStore.getBackgroundById(playerStore.BackgroundId)
  return background?.name || ''
})

function saveCharacter() {
  // Validate and reset to 0 if empty or invalid for Level
  if (playerStore.Level === null || playerStore.Level === undefined || isNaN(playerStore.Level)) {
    playerStore.Level = 0
  }
  // Validate and reset to 0 if empty or invalid for Souls
  if (playerStore.Souls === null || playerStore.Souls === undefined || isNaN(playerStore.Souls)) {
    playerStore.Souls = 0
  }
  // Validate and reset to 0 if empty or invalid for Undying
  if (playerStore.Undying === null || playerStore.Undying === undefined || isNaN(playerStore.Undying)) {
    playerStore.Undying = 0
  }
  playerStore.save()
}

function openLevelUpModal() {
  playerStore.initializeLevelUp()
}

function openImageUpload(mode: 'upload' | 'edit') {
  imageUploadMode.value = mode
  showImageUploadModal.value = true
}

function closeImageUpload() {
  showImageUploadModal.value = false
}

function handleImageSaved(imageData: string) {
  playerStore.CharacterImagePath = imageData
  playerStore.save()
  showImageUploadModal.value = false
}
</script>

<style scoped>
.top-bar {
  display: flex;
  width: 100%;
  height: var(--header-height); /* Responsive: 49.91vh at base */
  background: linear-gradient(to bottom, #1a1a1a 0%, #2a2a2a 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: var(--padding-sm); /* Responsive: 0.74vh */
  gap: var(--gap-xs); /* Responsive: 0.25em - reduced from 0.5em */
  position: relative;
  z-index: 200; /* Above content (z-index 1-11) and tab navigation (z-index 100) */
}

/* Section 1: Player Icon - 13% */
.player-icon-section {
  width: 11%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.player-icon {
  width: 80%;
  height: 100%;
  border: 2px solid var(--color-gold-primary);
  object-fit: cover;
  box-shadow: 0px 0px 10px #eeeeeeff;
}

.player-icon-placeholder {
  width: 80%;
  height: 100%;
  border: 2px solid var(--color-gold-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(48px, 6vw, 96px);
  font-weight: bold;
  color: var(--color-gold-primary);
  background: rgba(26, 26, 26, 0.8);
  box-shadow: 0px 0px 10px #eeeeeeff;
}

.player-icon-section {
  position: relative;
  cursor: pointer;
}

.image-button-overlay {
  position: absolute;
  top: 0;
  left: 10%;
  width: 80%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--gap-sm);
  background: rgba(0, 0, 0, 0.7);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: auto;
}

.player-icon-section:hover .image-button-overlay {
  opacity: 1;
}

.btn-upload,
.btn-edit {
  padding: var(--padding-xs) var(--padding-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid var(--color-gold-dim);
  background: var(--color-accent-gold-bright);
  color: #1a1a1a;
}

.btn-upload:hover,
.btn-edit:hover {
  background: linear-gradient(135deg, #FFD700 0%, #FFF4A3 100%);
  border-color: var(--color-gold-primary);
  box-shadow: 0 0 15px var(--color-gold-rgba-strong);
  transform: translateY(-1px);
}

/* Section 2: Character Info - 2 columns */
.character-info-section {
  flex: 0 0 27%; /* Fixed width - reduced from flex: 1 1 auto */
  display: flex;
  gap: var(--gap-xs); /* Responsive: 0.25em - reduced from 0.75em */
  padding: var(--padding-xs); /* Responsive: 0.37vh */
  padding-right: 0; /* Minimal right padding to bring closer to resource bars */
}

.char-info-column {
  flex: 1;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--gap-xs) var(--gap-sm); /* Responsive: 0.25em 0.5em */
  align-items: center;
}

.char-name-dropdown {
  grid-column: 1 / -1;
  width: 100%;
  margin-bottom: var(--padding-xs); /* Responsive: 0.37vh */
}

.info-row {
  display: contents;
}

.info-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: var(--info-label-font-size); /* Responsive: clamp(11px, 0.68vw, 15px) */
  font-weight: 500;
  word-break: break-word;
  overflow-wrap: break-word;
  line-height: 1.2;
}

.info-label.label-smaller {
  font-size: var(--info-label-smaller-font-size); /* Responsive: clamp(10px, 0.625vw, 12.5px) */
}

.info-input {
  background: transparent;
  color: var(--color-text-primary);
  padding: 2px var(--padding-sm); /* Responsive vertical/horizontal */
  border-radius: var(--border-radius-sm); /* Responsive: 0.21vw */
  font-size: var(--info-input-font-size); /* Responsive: clamp(12px, 0.73vw, 16px) */
  text-align: center;
  border: var(--border-width-thin) solid var(--color-border-primary);
  word-break: break-word;
  overflow-wrap: break-word;
  line-height: 1.2;
  white-space: normal;
  max-width: var(--info-input-max-width); /* Responsive: 7.29vw (~140px at 1920px) */
  transition: var(--transition-hover);
}

input.info-input.editable-input {
  outline: none;
  background: transparent;
}

input.info-input.editable-input:focus {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
}

.souls-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0px;
  padding: 2px var(--padding-sm); /* Responsive */
  overflow: visible;
  font-size: var(--info-input-font-size); /* Responsive */
}

.souls-editable {
  background: transparent;
  border: none;
  outline: none;
  min-width: 1ch;
  max-width: 6ch;
  width: auto;
  flex: 0 0 auto;
  text-align: right;
  direction: ltr;
  color: var(--color-text-primary);
  font-size: var(--info-input-font-size); /* Responsive */
  padding: 0;
  margin: 0;
  margin-left: -25px; /* Keep fixed - character-width based alignment */
}

.souls-editable::-webkit-inner-spin-button,
.souls-editable::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Section 3: Resource Bars - increased width */
.resource-bars-section {
  flex: 0 0 19%; /* Increased from 17% to give more space */
  flex-shrink: 0;
  display: flex;
  padding: 0px;
}

/* Section 4: Statuses - 6% */
.statuses-section {
  flex: 0 0 3%; /* Reduced from 5% for larger status boxes */
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: top; /* Center vertically to fill ~60% of height */
  gap: var(--gap-xs); /* Responsive: 0.25em */
  padding: var(--padding-xs); /* Responsive: 0.74vh */
}

/* Section 5: Damage Calculator - Responsive width */
.calculator-section {
  flex: 0 1 35%;
  max-width: var(--calculator-section-max-width); /* Responsive: 26.04vw (~500px at 1920px) */
  min-width: var(--calculator-section-min-width); /* Responsive: 20.83vw (~400px at 1920px) */
  flex-shrink: 1;
  display: flex;
  padding: var(--padding-sm); /* Responsive: 0.74vh */
  overflow: hidden;
}

/* Responsive breakpoints - handled by responsive-system.css */
@media (max-width: 1279px) {
  .calculator-section {
    max-width: 100%; /* Allow full width on smaller screens */
  }

  .character-info-section {
    flex: 1 1 auto; /* Adapt to available space */
  }
}

/* Hide number input spinners */
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Level Up Button - Golden theme with pulse animation */
.level-up-row {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: var(--padding-xs);
}

.btn-level-up {
  width: 100%;
  background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%);
  color: #1a1a1a;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  padding: var(--padding-xs) var(--padding-md);
  border-radius: var(--border-radius-md);
  border: 2px solid #B8941C;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  animation: pulse-gold 2s infinite;
}

.btn-level-up:hover {
  background: linear-gradient(135deg, #FFD700 0%, #FFF4A3 100%);
  box-shadow: 0 0 15px var(--color-gold-rgba-strong);
  transform: translateY(-1px);
}

.btn-level-up:active {
  transform: translateY(0);
}

@keyframes pulse-gold {
  0%, 100% {
    box-shadow: 0 0 5px var(--color-gold-rgba-medium);
  }
  50% {
    box-shadow: 0 0 20px var(--color-gold-rgba-strong);
  }
}

</style>