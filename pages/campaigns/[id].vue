<template>
  <div class="campaign-manage">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <NuxtLink to="/campaigns" class="breadcrumb-link">Campaigns</NuxtLink>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">{{ campaign?.name || 'Loading...' }}</span>
    </nav>

    <div v-if="loading" class="loading-state">Loading campaign...</div>
    <div v-else-if="!campaign" class="error-state">Campaign not found.</div>
    <div v-else-if="!isGm" class="error-state">Only the GM can manage this campaign.</div>

    <template v-else>
      <div class="manage-header">
        <h1 class="page-title">{{ campaign.name }}</h1>
        <p class="page-subtitle">Campaign Management</p>
      </div>

      <!-- Player Characters Section -->
      <section class="manage-section">
        <h2 class="section-title">Player Characters</h2>

        <div v-if="campaignCharacters.length === 0" class="empty-state">
          No characters assigned to this campaign yet.
        </div>

        <div v-else class="character-grid">
          <div
            v-for="char in campaignCharacters"
            :key="char.id"
            class="character-card"
          >
            <div class="card-header">
              <h3 class="char-name">{{ char.name }}</h3>
              <span class="char-level">Lv. {{ char.level }}</span>
            </div>
            <div class="card-meta">
              <span class="meta-item owner">{{ char.owner?.username || 'Unknown' }}</span>
            </div>
            <div class="card-actions">
              <button @click="inspectCharacter(char.id)" class="btn-edit">Inspect</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Custom Items Section -->
      <section class="manage-section">
        <div class="section-header">
          <h2 class="section-title">Custom Items</h2>
          <button @click="showCreateItem = true" class="btn-create">Create Item</button>
        </div>

        <div v-if="customItems.length === 0" class="empty-state">
          No custom items created for this campaign yet.
        </div>

        <div v-else class="items-table">
          <div class="table-header">
            <span class="col-name">Name</span>
            <span class="col-type">Type</span>
            <span class="col-creator">Created By</span>
            <span class="col-actions">Actions</span>
          </div>
          <div
            v-for="item in customItems"
            :key="`${item.type}-${item.id}`"
            class="table-row"
          >
            <span class="col-name">{{ item.name }}</span>
            <span class="col-type item-type-badge">{{ item.type }}</span>
            <span class="col-creator">{{ item.created_by || 'Unknown' }}</span>
            <div class="col-actions">
              <button @click="editItem(item)" class="btn-small btn-edit-item">Edit</button>
              <button @click="confirmDeleteItem(item)" class="btn-small btn-delete-item">Delete</button>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- Create/Edit Item Modal (shared component) -->
    <Teleport to="body">
      <CreateItemModal
        v-if="showCreateItem || showEditItem"
        :campaign-id="campaignId"
        :edit-item="editingItemData"
        @close="showCreateItem = false; showEditItem = false; editingItemData = null"
        @created="handleItemCreated"
        @updated="handleItemUpdated"
      />
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="deletingItem" class="modal-overlay" @click.self="deletingItem = null">
        <div class="modal-content small">
          <h2 class="modal-title">Delete Item</h2>
          <p class="warning-text">
            Are you sure you want to delete <strong>{{ deletingItem.name }}</strong>?
          </p>
          <p class="warning-text danger">This will remove it from all characters who have it.</p>
          <div class="modal-actions">
            <button @click="deletingItem = null" class="btn-cancel">Cancel</button>
            <button @click="executeDeleteItem" class="btn-delete">Delete</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '~/composables/useApi'
import { useAuth } from '~/composables/useAuth'
import CreateItemModal from '~/components/Campaigns/CreateItemModal.vue'

definePageMeta({
  layout: 'auth',
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const api = useApi()
const auth = useAuth()

const campaignId = route.params.id as string
const loading = ref(true)
const campaign = ref<any>(null)
const isGm = ref(false)
const campaignCharacters = ref<any[]>([])
const customItems = ref<any[]>([])

// Create item state
const showCreateItem = ref(false)

// Edit item state
const showEditItem = ref(false)
const editingItemData = ref<any>(null)

// Delete item state
const deletingItem = ref<any>(null)

onMounted(async () => {
  // Fetch campaign detail
  const campResponse = await api.get<any>(`/api/campaigns/${campaignId}/`)
  if (!campResponse.ok || !campResponse.data) {
    loading.value = false
    return
  }

  campaign.value = campResponse.data

  // Check if current user is GM
  const userUuid = auth.user.value?.uuid
  isGm.value = campResponse.data.gm_uuid === userUuid

  if (!isGm.value) {
    loading.value = false
    return
  }

  // Fetch characters in this campaign
  const charsResponse = await api.get<any[]>(`/api/campaigns/${campaignId}/characters/`)
  if (charsResponse.ok && charsResponse.data) {
    campaignCharacters.value = charsResponse.data
  }

  // Fetch custom items
  await loadCustomItems()

  loading.value = false
})

async function loadCustomItems() {
  const response = await api.get<any[]>(`/api/campaigns/${campaignId}/items/`)
  if (response.ok && response.data) {
    customItems.value = response.data
  }
}

function inspectCharacter(charId: string) {
  router.push(`/character/${charId}?from_campaign=${campaignId}`)
}

async function handleItemCreated(_item: any) {
  showCreateItem.value = false
  await loadCustomItems()
}

async function handleItemUpdated(_item: any) {
  showEditItem.value = false
  editingItemData.value = null
  await loadCustomItems()
}

function editItem(item: any) {
  editingItemData.value = { ...item }
  showEditItem.value = true
}

function confirmDeleteItem(item: any) {
  deletingItem.value = item
}

async function executeDeleteItem() {
  if (!deletingItem.value) return

  const response = await api.delete(`/api/campaigns/${campaignId}/items/${deletingItem.value.id}/`)
  if (response.ok) {
    deletingItem.value = null
    await loadCustomItems()
  }
}
</script>

<style scoped>
.campaign-manage {
  max-width: 60rem;
  margin: 0 auto;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  color: #fff;
}

/* Breadcrumb */
.breadcrumb {
  margin-bottom: 1.5em;
  font-size: clamp(0.85rem, 1vw, 0.95rem);
}

.breadcrumb-link,
.breadcrumb-link:link,
.breadcrumb-link:visited,
.breadcrumb-link:hover {
  color: #ffd700 !important;
  text-decoration: none !important;
}

.breadcrumb-sep {
  color: #666;
  margin: 0 0.5em;
}

.breadcrumb-current {
  color: #ccc;
}

/* Header */
.manage-header {
  margin-bottom: 2em;
}

.page-title {
  font-size: clamp(1.5rem, 2vw, 2rem);
  color: var(--color-gold-primary);
  margin: 0 0 0.25em 0;
}

.page-subtitle {
  color: #888;
  margin: 0;
  font-size: clamp(0.9rem, 1.1vw, 1rem);
}

/* States */
.loading-state, .error-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #888;
  font-size: clamp(1rem, 1.2vw, 1.1rem);
}

/* Sections */
.manage-section {
  margin-bottom: 2.5em;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1em;
  padding-bottom: 0.625em;
  border-bottom: 0.0625rem solid rgba(255, 215, 0, 0.2);
}

.section-title {
  font-size: clamp(1.1rem, 1.4vw, 1.3rem);
  color: #fff;
  margin: 0 0 1em 0;
}

.section-header .section-title {
  margin: 0;
}

.btn-create {
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

.btn-create:hover {
  border-color: var(--color-gold-primary);
  box-shadow: var(--shadow-gold-medium);
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #888;
  background: rgba(20, 20, 25, 0.5);
  border: 0.0625rem solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
}

/* Character Grid */
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
  margin-bottom: 0.75em;
}

.meta-item.owner {
  font-size: 0.8em;
  color: var(--color-green-primary);
  background: rgba(60, 179, 113, 0.12);
  padding: 0.15em 0.5em;
  border-radius: 0.25rem;
}

.card-actions {
  display: flex;
  gap: 0.5em;
  padding-top: 0.625em;
  border-top: 0.0625rem solid rgba(255, 255, 255, 0.1);
}

.btn-view {
  flex: 1;
  padding: 0.5em 0.75em;
  background: rgba(255, 255, 255, 0.05);
  border: 0.0625rem solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  color: #ccc;
  font-size: clamp(0.8rem, 0.95vw, 0.85rem);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: #fff;
}

.btn-edit {
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

.btn-edit:hover {
  background: rgba(255, 215, 0, 0.2);
}

/* Items Table */
.items-table {
  border: 0.0625rem solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  padding: 0.75em 1em;
  background: rgba(255, 255, 255, 0.05);
  color: #999;
  font-size: 0.8em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  padding: 0.625em 1em;
  border-top: 0.0625rem solid rgba(255, 255, 255, 0.05);
  align-items: center;
}

.table-row:hover {
  background: rgba(255, 255, 255, 0.03);
}

.col-name {
  color: #fff;
  font-size: clamp(0.85rem, 1vw, 0.95rem);
}

.col-type {
  color: #888;
  font-size: 0.85em;
}

.item-type-badge {
  text-transform: capitalize;
}

.col-creator {
  color: #888;
  font-size: 0.85em;
}

.col-actions {
  display: flex;
  gap: 0.375em;
}

.btn-small {
  padding: 0.25em 0.625em;
  border-radius: 0.25rem;
  font-size: 0.8em;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit-item {
  background: transparent;
  border: 0.0625rem solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
}

.btn-edit-item:hover {
  background: rgba(255, 215, 0, 0.1);
}

.btn-delete-item {
  background: transparent;
  border: 0.0625rem solid rgba(255, 107, 107, 0.3);
  color: #ff8585;
}

.btn-delete-item:hover {
  border-color: #ff6b6b;
}

/* Modals */
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
  max-width: clamp(28rem, 40vw, 34rem);
  width: 90%;
}

.modal-content.small {
  max-width: clamp(22rem, 30vw, 26rem);
}

.modal-title {
  color: var(--color-gold-primary);
  font-size: clamp(1.1rem, 1.4vw, 1.3rem);
  margin: 0 0 1.25em 0;
}

.form-group {
  margin-bottom: 1em;
}

.form-group label {
  display: block;
  color: #ccc;
  font-size: clamp(0.85rem, 1vw, 0.9rem);
  margin-bottom: 0.375em;
}

.form-input {
  width: 100%;
  padding: 0.625em 0.875em;
  background: rgba(0, 0, 0, 0.4);
  border: 0.0625rem solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  color: #fff;
  font-size: clamp(0.9rem, 1vw, 1rem);
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-gold-primary);
}

.form-row {
  display: flex;
  gap: 1em;
}

.form-group.half {
  flex: 1;
}

.error-msg {
  color: #ff8585;
  font-size: 0.85em;
  margin-bottom: 1em;
}

.warning-text {
  color: #ccc;
  margin: 0.5em 0;
}

.warning-text.danger {
  color: #ff8585;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75em;
  margin-top: 1.25em;
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

.btn-submit {
  padding: 0.5em 1.25em;
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  border-radius: 0.375rem;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  border-color: var(--color-gold-primary);
  box-shadow: var(--shadow-gold-medium);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-delete {
  padding: 0.5em 1.25em;
  background: rgba(255, 107, 107, 0.15);
  border: 0.0625rem solid rgba(255, 107, 107, 0.4);
  border-radius: 0.375rem;
  color: #ff8585;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete:hover {
  background: rgba(255, 107, 107, 0.25);
  border-color: #ff6b6b;
}
</style>
