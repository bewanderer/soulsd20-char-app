<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h2 class="modal-title">Create Campaign</h2>

      <form @submit.prevent="handleSubmit" class="campaign-form">
        <div class="form-group">
          <label for="name">Campaign Name *</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            placeholder="Enter campaign name"
            required
          />
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            v-model="form.description"
            placeholder="Describe your campaign..."
            rows="3"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="maxPlayers">Max Players</label>
            <input
              id="maxPlayers"
              v-model.number="form.max_players"
              type="number"
              min="1"
              max="20"
            />
          </div>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <div class="form-actions">
          <button type="button" @click="$emit('close')" class="btn-cancel">Cancel</button>
          <button type="submit" class="btn-submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Creating...' : 'Create Campaign' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useCampaigns } from '~/composables/useCampaigns'
import type { Campaign } from '~/composables/useCampaignApi'

const emit = defineEmits<{
  close: []
  created: [campaign: Campaign]
}>()

const campaignStore = useCampaigns()

const form = reactive({
  name: '',
  description: '',
  max_players: 6
})

const isSubmitting = ref(false)
const error = ref<string | null>(null)

async function handleSubmit() {
  if (!form.name.trim()) {
    error.value = 'Campaign name is required'
    return
  }

  isSubmitting.value = true
  error.value = null

  const campaign = await campaignStore.createCampaign({
    name: form.name.trim(),
    description: form.description.trim(),
    max_players: form.max_players
  })

  isSubmitting.value = false

  if (campaign) {
    emit('created', campaign)
  } else {
    error.value = campaignStore.error.value || 'Failed to create campaign'
  }
}
</script>

<style scoped>
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
  max-width: clamp(25rem, 38vw, 31.25rem);
  width: 90%;
}

.modal-title {
  color: var(--color-gold-primary);
  font-size: clamp(1.25rem, 1.6vw, 1.5rem);
  margin: 0 0 1.5625em 0;
}

.campaign-form {
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 1.5vw, 1.25rem);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

.form-group label {
  color: #ccc;
  font-size: clamp(0.85rem, 1vw, 0.9rem);
}

.form-group input,
.form-group textarea {
  padding: 0.75em 1em;
  background: rgba(0, 0, 0, 0.4);
  border: 0.0625rem solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  color: #fff;
  font-size: clamp(0.9rem, 1vw, 1rem);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-gold-primary);
}

.form-group textarea {
  resize: vertical;
  min-height: 5rem;
}

.form-row {
  display: flex;
  gap: clamp(1rem, 1.5vw, 1.25rem);
}

.form-row .form-group {
  flex: 1;
}

.error-message {
  padding: 0.75em;
  background: rgba(255, 107, 107, 0.1);
  border: 0.0625rem solid rgba(255, 107, 107, 0.3);
  border-radius: 0.375rem;
  color: #ff8585;
  font-size: clamp(0.85rem, 1vw, 0.9rem);
}

.form-actions {
  display: flex;
  gap: clamp(0.75rem, 1.2vw, 0.9375rem);
  justify-content: flex-end;
  margin-top: 0.625em;
}

.btn-cancel,
.btn-submit {
  padding: 0.75em 1.5em;
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: clamp(0.85rem, 1vw, 1rem);
  cursor: pointer;
  transition: all 0.2s;
  border: 0.125rem solid;
}

.btn-cancel {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.2);
  color: #ccc;
}

.btn-cancel:hover {
  border-color: rgba(255, 255, 255, 0.4);
}

.btn-submit {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-dim);
  color: #fff;
}

.btn-submit:hover:not(:disabled) {
  border-color: var(--color-gold-primary);
  box-shadow: var(--shadow-gold-medium);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
