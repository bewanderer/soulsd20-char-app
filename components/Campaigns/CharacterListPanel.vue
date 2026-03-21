<template>
  <section class="character-section">
    <div class="section-header">
      <h2 class="section-title">Your Characters</h2>
      <div class="section-actions">
        <button @click="$emit('create')" class="create-char-btn">
          Create New Character
        </button>
      </div>
    </div>

    <div v-if="characters.length === 0" class="empty-chars">
      <p>No characters yet. Create one to get started.</p>
    </div>

    <div v-else class="character-grid">
      <div
        v-for="char in characters"
        :key="char.uuid"
        class="character-card"
      >
        <div class="card-header">
          <h3 class="char-name">{{ char.name || 'Unnamed' }}</h3>
          <span class="char-level">Lv. {{ char.level }}</span>
        </div>

        <div class="card-meta">
          <span v-if="lineageName(char)" class="meta-item">{{ lineageName(char) }}</span>
          <span v-if="backgroundName(char)" class="meta-item">{{ backgroundName(char) }}</span>
        </div>

        <!-- Campaign badges -->
        <div v-if="characterCampaigns[char.uuid]?.length" class="campaign-badges">
          <span
            v-for="camp in characterCampaigns[char.uuid]"
            :key="camp.id"
            class="campaign-badge"
          >{{ camp.name }}</span>
        </div>

        <div class="card-actions">
          <button @click="openCharacter(char.uuid)" class="btn-open">
            Open
          </button>
          <button @click="showAssignModal(char)" class="btn-assign">
            Assign
          </button>
          <button @click="$emit('delete', char)" class="btn-delete">
            Delete
          </button>
        </div>
      </div>
    </div>
    <!-- Assign to Campaign Modal -->
    <Teleport to="body">
      <div v-if="assigningChar" class="modal-overlay" @click.self="assigningChar = null">
        <div class="modal-content small">
          <h2 class="modal-title">Assign {{ assigningChar.name }} to Campaign</h2>

          <div v-if="campaignStore.campaigns.value?.length === 0" class="empty-state-text">
            You are not a member of any campaigns.
          </div>

          <div v-else class="assign-list">
            <div
              v-for="camp in campaignStore.campaigns.value"
              :key="camp.id"
              class="assign-item"
            >
              <span class="assign-name">{{ camp.name }}</span>
              <button
                v-if="characterCampaigns[assigningChar.uuid]?.some(c => c.id === camp.id)"
                @click="removeFromCampaign(assigningChar.uuid, camp.id)"
                class="btn-remove-assign"
              >Remove</button>
              <button
                v-else
                @click="assignToCampaign(camp.id)"
                class="btn-confirm-assign"
              >Assign</button>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="assigningChar = null" class="btn-cancel">Close</button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAllCharacters, type StoredCharacter } from '~/mixins/characterStorage'
import { useCompendiumStore } from '~/store/compendium'
import { useApi } from '~/composables/useApi'
import { waitForInitialSync } from '~/composables/useCharacterSync'
import { useCampaigns } from '~/composables/useCampaigns'

const emit = defineEmits<{
  create: []
  delete: [character: StoredCharacter]
}>()

const router = useRouter()
const compendiumStore = useCompendiumStore()
const api = useApi()
const campaignStore = useCampaigns()

const characters = ref<any[]>([])
// Map of character UUID -> list of campaigns they belong to
const characterCampaigns = ref<Record<string, Array<{ id: string; name: string }>>>({})

// Assign modal state
const assigningChar = ref<any | null>(null)

async function loadCharacters() {
  // Fetch only characters owned by current user (own_only bypasses admin override)
  const response = await api.get<any[]>('/api/characters/?own_only=true')
  if (response.ok && response.data) {
    characters.value = response.data.map((c: any) => ({
      uuid: c.id,
      name: c.name,
      level: c.level,
      lineage_id: c.lineage_id,
      background_id: c.background_id,
      bloodline_id: c.bloodline_id,
      last_played: c.last_played,
      campaigns: c.campaigns || [],
    }))
    // Build campaign map from API response
    for (const char of characters.value) {
      if (char.campaigns?.length > 0) {
        characterCampaigns.value[char.uuid] = char.campaigns
      }
    }
  }
}

function lineageName(char: StoredCharacter): string {
  if (!char.lineage_id) return ''
  const lineage = compendiumStore.getLineageById(char.lineage_id)
  return lineage?.name || ''
}

function backgroundName(char: StoredCharacter): string {
  if (!char.background_id) return ''
  const bg = compendiumStore.getBackgroundById(char.background_id)
  return bg?.name || ''
}

function openCharacter(uuid: string) {
  router.push(`/character/${uuid}`)
}

function showAssignModal(char: StoredCharacter) {
  assigningChar.value = char
}

async function assignToCampaign(campaignId: string) {
  if (!assigningChar.value) return

  const response = await api.post(`/api/campaigns/${campaignId}/assign_character/`, {
    character_uuid: assigningChar.value.uuid
  })

  if (response.ok) {
    await loadCharacters()
  }

  assigningChar.value = null
}

async function removeFromCampaign(charUuid: string, campaignId: string) {
  const response = await api.post(`/api/campaigns/${campaignId}/unassign_character/`, {
    character_uuid: charUuid
  })

  if (response.ok) {
    await loadCharacters()
  }
}

onMounted(async () => {
  await loadCharacters()
})
</script>

<style scoped>
.character-section {
  margin-bottom: clamp(1.5rem, 3vw, 2.5rem);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25em;
  padding-bottom: 0.625em;
  border-bottom: 0.0625rem solid rgba(255, 215, 0, 0.2);
}

.section-title {
  font-size: clamp(1.1rem, 1.4vw, 1.3rem);
  color: #fff;
  margin: 0;
}

.create-char-btn {
  padding: 0.5em 1.25em;
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  border-radius: 0.375rem;
  color: #fff;
  font-weight: 600;
  font-size: clamp(0.85rem, 1vw, 0.95rem);
  cursor: pointer;
  transition: all 0.2s;
}

.create-char-btn:hover {
  border-color: var(--color-gold-primary);
  box-shadow: var(--shadow-gold-medium);
}

.empty-chars {
  text-align: center;
  padding: 2rem 1rem;
  color: #888;
  font-size: clamp(0.9rem, 1vw, 1rem);
  background: rgba(20, 20, 25, 0.5);
  border: 0.0625rem solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(clamp(14rem, 20vw, 16rem), 1fr));
  gap: clamp(0.75rem, 1.2vw, 1rem);
}

.character-card {
  background: rgba(25, 25, 30, 0.9);
  border: 0.0625rem solid rgba(255, 215, 0, 0.15);
  border-radius: 0.625rem;
  padding: clamp(0.875rem, 1.3vw, 1.125rem);
  transition: all 0.2s ease;
}

.character-card:hover {
  border-color: rgba(255, 215, 0, 0.4);
  transform: translateY(-0.125rem);
  box-shadow: 0 0.25rem 1.25rem rgba(0, 0, 0, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5em;
}

.char-name {
  font-size: clamp(1rem, 1.2vw, 1.1rem);
  color: #fff;
  margin: 0;
}

.char-level {
  font-size: 0.8em;
  color: var(--color-gold-primary);
  font-weight: bold;
}

.card-meta {
  display: flex;
  gap: 0.5em;
  flex-wrap: wrap;
  margin-bottom: 0.75em;
}

.meta-item {
  font-size: 0.8em;
  color: #888;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.15em 0.5em;
  border-radius: 0.25rem;
}

.card-actions {
  display: flex;
  gap: 0.5em;
  padding-top: 0.625em;
  border-top: 0.0625rem solid rgba(255, 255, 255, 0.1);
}

.btn-open {
  flex: 1;
  padding: 0.5em 0.75em;
  background: rgba(255, 215, 0, 0.1);
  border: 0.0625rem solid rgba(255, 215, 0, 0.3);
  border-radius: 0.25rem;
  color: #ffd700;
  font-size: clamp(0.8rem, 0.95vw, 0.85rem);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-open:hover {
  background: rgba(255, 215, 0, 0.2);
  border-color: rgba(255, 215, 0, 0.5);
}

.btn-delete {
  padding: 0.5em 0.75em;
  background: transparent;
  border: 0.0625rem solid rgba(255, 107, 107, 0.3);
  border-radius: 0.25rem;
  color: #ff8585;
  font-size: clamp(0.8rem, 0.95vw, 0.85rem);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete:hover {
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.btn-assign {
  padding: 0.5em 0.75em;
  background: transparent;
  border: 0.0625rem solid rgba(60, 179, 113, 0.4);
  border-radius: 0.25rem;
  color: var(--color-green-primary);
  font-size: clamp(0.8rem, 0.95vw, 0.85rem);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-assign:hover {
  border-color: var(--color-green-primary);
  background: rgba(60, 179, 113, 0.15);
}

.campaign-badges {
  display: flex;
  gap: 0.375em;
  flex-wrap: wrap;
  margin-bottom: 0.5em;
}

.campaign-badge {
  font-size: 0.7em;
  color: var(--color-green-primary);
  background: rgba(60, 179, 113, 0.12);
  border: 0.0625rem solid rgba(60, 179, 113, 0.4);
  padding: 0.15em 0.5em;
  border-radius: 0.25rem;
}

/* Assign Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: rgba(25, 25, 30, 0.98);
  border: 0.0625rem solid rgba(255, 215, 0, 0.2);
  border-radius: 0.75rem;
  padding: clamp(1.5rem, 2.5vw, 1.875rem);
  max-width: clamp(22rem, 35vw, 28rem);
  width: 90%;
}

.modal-content.small {
  max-width: clamp(20rem, 30vw, 25rem);
}

.modal-title {
  color: var(--color-gold-primary);
  font-size: clamp(1.1rem, 1.4vw, 1.3rem);
  margin: 0 0 1.25em 0;
}

.empty-state-text {
  color: #888;
  padding: 1rem 0;
}

.assign-list {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  margin-bottom: 1em;
}

.assign-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5em 0.75em;
  background: rgba(255, 255, 255, 0.03);
  border: 0.0625rem solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
}

.assign-name {
  color: #ccc;
  font-size: clamp(0.85rem, 1vw, 0.95rem);
}

.btn-confirm-assign {
  padding: 0.375em 0.875em;
  background: rgba(60, 179, 113, 0.1);
  border: 0.0625rem solid rgba(60, 179, 113, 0.4);
  border-radius: 0.25rem;
  color: var(--color-green-primary);
  font-size: 0.8em;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm-assign:hover {
  background: rgba(60, 179, 113, 0.2);
  border-color: var(--color-green-primary);
}

.btn-remove-assign {
  padding: 0.375em 0.875em;
  background: transparent;
  border: 0.0625rem solid rgba(255, 107, 107, 0.3);
  border-radius: 0.25rem;
  color: #ff8585;
  font-size: 0.8em;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove-assign:hover {
  border-color: #ff6b6b;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.75em;
  border-top: 0.0625rem solid rgba(255, 255, 255, 0.1);
}

.btn-cancel {
  padding: 0.5em 1.25em;
  background: transparent;
  border: 0.0625rem solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  color: #ccc;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  border-color: rgba(255, 255, 255, 0.4);
}
</style>
