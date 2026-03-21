<template>
  <div class="campaigns-page">
    <div class="campaigns-container">
      <!-- Character List Panel -->
      <CharacterListPanel
        @create="router.push('/character-creation')"
        @delete="confirmDeleteCharacter"
      />

      <header class="page-header">
        <h1 class="page-title">Campaigns</h1>
        <div class="header-actions">
          <button @click="showJoinModal = true" class="import-btn">
            Join Campaign
          </button>
          <button @click="showCreateModal = true" class="create-btn">
            Create Campaign
          </button>
        </div>
      </header>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading campaigns...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="loadCampaigns" class="btn btn-secondary">Try Again</button>
      </div>

      <!-- Content -->
      <template v-else>
        <!-- Pending Invites -->
        <CampaignInvites
          v-if="pendingInvites.length > 0"
          :invites="[...pendingInvites]"
          @accept="handleAcceptInvite"
          @decline="handleDeclineInvite"
        />

        <!-- GM Campaigns -->
        <section v-if="gmCampaigns.length > 0" class="campaign-section">
          <h2 class="section-title">Your Campaigns (GM)</h2>
          <div class="campaign-grid">
            <CampaignCard
              v-for="campaign in gmCampaigns"
              :key="campaign.id"
              :campaign="campaign"
              :is-gm="true"
              @click="selectCampaign(campaign)"
              @manage="manageCampaign(campaign)"
              @edit="editCampaign(campaign)"
              @delete="confirmDeleteCampaign(campaign)"
            />
          </div>
        </section>

        <!-- Player Campaigns -->
        <section v-if="memberCampaigns.length > 0" class="campaign-section">
          <h2 class="section-title">Joined Campaigns</h2>
          <div class="campaign-grid">
            <CampaignCard
              v-for="campaign in memberCampaigns"
              :key="campaign.id"
              :campaign="campaign"
              :is-gm="false"
              @click="selectCampaign(campaign)"
              @leave="confirmLeaveCampaign(campaign)"
            />
          </div>
        </section>

        <!-- Empty State -->
        <div v-if="campaigns.length === 0 && pendingInvites.length === 0" class="empty-state">
          <h2>No Campaigns Yet</h2>
          <p>Create a new campaign to GM, or join an existing one using an invite code.</p>
          <div class="empty-actions">
            <button @click="showCreateModal = true" class="create-btn">Create Campaign</button>
            <button @click="showJoinModal = true" class="import-btn">Join Campaign</button>
          </div>
        </div>
      </template>
    </div>

    <!-- Campaign Detail Modal -->
    <CampaignDetailModal
      v-if="selectedCampaign"
      :campaign="selectedCampaign"
      :is-gm="isGmOfSelectedCampaign"
      @close="selectedCampaign = null"
      @updated="handleCampaignUpdated"
      @kick="handleKickMember"
      @regenerate-invite="handleRegenerateInvite"
    />

    <!-- Create Campaign Modal -->
    <CreateCampaignModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="handleCampaignCreated"
    />

    <!-- Edit Campaign Modal -->
    <EditCampaignModal
      v-if="editingCampaign"
      :campaign="editingCampaign"
      @close="editingCampaign = null"
      @updated="handleCampaignUpdated"
    />

    <!-- Join Campaign Modal -->
    <JoinCampaignModal
      v-if="showJoinModal"
      @close="showJoinModal = false"
      @joined="handleCampaignJoined"
    />

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      v-if="deletingCampaign"
      title="Delete Campaign"
      :message="`Are you sure you want to delete '${deletingCampaign.name}'? This action cannot be undone.`"
      confirm-text="Delete"
      :is-danger="true"
      @confirm="handleDeleteCampaign"
      @cancel="deletingCampaign = null"
    />

    <!-- Confirm Leave Modal -->
    <ConfirmModal
      v-if="leavingCampaign"
      title="Leave Campaign"
      :message="`Are you sure you want to leave '${leavingCampaign.name}'?`"
      confirm-text="Leave"
      @confirm="handleLeaveCampaign"
      @cancel="leavingCampaign = null"
    />

    <!-- Confirm Delete Character Modal -->
    <ConfirmModal
      v-if="deletingCharacter"
      title="Delete Character"
      :message="`Are you sure you want to delete '${deletingCharacter.name}'? This will permanently remove the character and all associated data.`"
      confirm-text="Delete"
      :is-danger="true"
      @confirm="handleDeleteCharacter"
      @cancel="deletingCharacter = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCampaigns } from '~/composables/useCampaigns'
import { useAuth } from '~/composables/useAuth'
import { deleteCharacterWithSync, type StoredCharacter } from '~/mixins/characterStorage'
import type { Campaign } from '~/composables/useCampaignApi'

definePageMeta({
  layout: 'auth',
  middleware: 'auth'
})

const router = useRouter()
const campaignStore = useCampaigns()
const auth = useAuth()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const showCreateModal = ref(false)
const showJoinModal = ref(false)
const selectedCampaign = ref<Campaign | null>(null)
const editingCampaign = ref<Campaign | null>(null)
const deletingCampaign = ref<Campaign | null>(null)
const leavingCampaign = ref<Campaign | null>(null)
const deletingCharacter = ref<StoredCharacter | null>(null)

// Computed
const campaigns = computed(() => campaignStore.campaigns.value)
const gmCampaigns = computed(() => campaignStore.gmCampaigns.value)
const memberCampaigns = computed(() => campaignStore.memberCampaigns.value)
const pendingInvites = computed(() => campaignStore.pendingInvites.value)

const isGmOfSelectedCampaign = computed(() => {
  if (!selectedCampaign.value || !auth.user.value) return false
  return selectedCampaign.value.gm_uuid === auth.user.value.uuid
})

// Methods
async function loadCampaigns() {
  console.log('[SD20 Nav] campaigns.vue loadCampaigns() called')
  isLoading.value = true
  error.value = null

  try {
    await Promise.all([
      campaignStore.fetchCampaigns(true),
      campaignStore.fetchInvites()
    ])
    console.log(`[SD20 Nav] campaigns loaded: ${campaigns.value.length} campaigns, ${pendingInvites.value.length} pending invites`)
  } catch (err) {
    console.error('[SD20 Nav] Failed to load campaigns:', err)
    error.value = 'Failed to load campaigns'
  } finally {
    isLoading.value = false
  }
}

async function selectCampaign(campaign: Campaign) {
  // Fetch full detail (with memberships) from API
  const detailed = await campaignStore.fetchCampaign(campaign.id)
  selectedCampaign.value = detailed || campaign
}

function manageCampaign(campaign: Campaign) {
  router.push(`/campaigns/${campaign.id}`)
}

function editCampaign(campaign: Campaign) {
  editingCampaign.value = campaign
}

function confirmDeleteCampaign(campaign: Campaign) {
  deletingCampaign.value = campaign
}

function confirmLeaveCampaign(campaign: Campaign) {
  leavingCampaign.value = campaign
}

async function handleDeleteCampaign() {
  if (!deletingCampaign.value) return

  await campaignStore.deleteCampaign(deletingCampaign.value.id)
  deletingCampaign.value = null
}

async function handleLeaveCampaign() {
  if (!leavingCampaign.value) return

  await campaignStore.leaveCampaign(leavingCampaign.value.id)
  leavingCampaign.value = null
}

async function handleAcceptInvite(inviteId: string) {
  await campaignStore.acceptInvite(inviteId)
}

async function handleDeclineInvite(inviteId: string) {
  await campaignStore.declineInvite(inviteId)
}

async function handleCampaignCreated(_campaign: Campaign) {
  showCreateModal.value = false
  // Force refresh to ensure list is updated
  await campaignStore.fetchCampaigns(true)
  // Don't auto-open detail modal - let user click on the campaign card
}

async function handleCampaignJoined(_campaign: Campaign) {
  showJoinModal.value = false
  // Force refresh to ensure list is updated
  await campaignStore.fetchCampaigns(true)
  // Don't auto-open detail modal - let user click on the campaign card
}

async function handleCampaignUpdated() {
  // Always refresh campaigns list to ensure UI is updated
  await campaignStore.fetchCampaigns(true)

  if (selectedCampaign.value) {
    await campaignStore.fetchCampaign(selectedCampaign.value.id)
    const current = campaignStore.currentCampaign.value
    selectedCampaign.value = current ? { ...current, memberships: current.memberships ? [...current.memberships] : undefined } : null
  }
  editingCampaign.value = null
}

async function handleKickMember(memberId: string) {
  if (!selectedCampaign.value) return
  await campaignStore.kickMember(selectedCampaign.value.id, memberId)
  await handleCampaignUpdated()
}

async function handleRegenerateInvite() {
  if (!selectedCampaign.value) return
  await campaignStore.regenerateInviteCode(selectedCampaign.value.id)
  await handleCampaignUpdated()
}

function confirmDeleteCharacter(char: StoredCharacter) {
  deletingCharacter.value = char
}

async function handleDeleteCharacter() {
  if (!deletingCharacter.value) return
  deleteCharacterWithSync(deletingCharacter.value.uuid)
  deletingCharacter.value = null
}

onMounted(() => {
  loadCampaigns()
})
</script>

<style scoped>
.campaigns-page {
  min-height: 100vh;
  padding: clamp(1.5rem, 3vw, 2.5rem) clamp(1rem, 2vw, 1.5rem);
  background: linear-gradient(to bottom, rgba(10, 10, 10, 0.95), rgba(20, 20, 30, 0.95));
}

.campaigns-container {
  max-width: clamp(60rem, 80vw, 75rem);
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(1.5rem, 3vw, 2.5rem);
}

.page-title {
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  color: var(--color-gold-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: clamp(0.625rem, 1.2vw, 0.9375rem);
}

/* Button styles - copied exactly from WelcomeScreen */
.create-btn, .import-btn {
  padding: 16px 32px;
  font-size: 1.2em;
  border: 2px solid;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: bold;
}

.create-btn {
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  color: #ffffff;
  transition: var(--transition-hover);
}

.create-btn:hover {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  transform: scale(1.05);
  box-shadow: var(--shadow-gold-medium);
}

.import-btn {
  background: transparent;
  border-color: var(--color-border-primary);
  color: var(--color-text-primary);
}

.import-btn:hover {
  border-color: var(--color-accent-gold-bright);
  transform: scale(1.05);
  box-shadow: var(--shadow-gold-soft);
}

.loading-state,
.error-state {
  text-align: center;
  padding: clamp(2.5rem, 5vw, 3.75rem) clamp(1rem, 2vw, 1.5rem);
  color: #999;
  font-size: clamp(0.9rem, 1vw, 1rem);
}

.spinner {
  width: clamp(2.5rem, 4vw, 3.125rem);
  height: clamp(2.5rem, 4vw, 3.125rem);
  border: 0.25rem solid rgba(255, 215, 0, 0.2);
  border-top-color: var(--color-gold-primary);
  border-radius: 50%;
  margin: 0 auto 1.25em;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.campaign-section {
  margin-bottom: clamp(1.5rem, 3vw, 2.5rem);
}

.section-title {
  font-size: clamp(1.1rem, 1.4vw, 1.3rem);
  color: #fff;
  margin-bottom: 1.25em;
  padding-bottom: 0.625em;
  border-bottom: 0.0625rem solid rgba(255, 215, 0, 0.2);
}

.campaign-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(clamp(16rem, 22vw, 18.75rem), 1fr));
  gap: clamp(1rem, 1.5vw, 1.25rem);
}

.empty-state {
  text-align: center;
  padding: clamp(3rem, 6vw, 5rem) clamp(1rem, 2vw, 1.5rem);
  background: rgba(20, 20, 25, 0.5);
  border: 0.0625rem solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
}

.empty-state h2 {
  color: #fff;
  margin-bottom: 0.625em;
  font-size: clamp(1.25rem, 1.5vw, 1.5rem);
}

.empty-state p {
  color: #888;
  margin-bottom: 1.875em;
  font-size: clamp(0.9rem, 1vw, 1rem);
}

.empty-actions {
  display: flex;
  gap: clamp(0.625rem, 1.2vw, 0.9375rem);
  justify-content: center;
}

</style>
