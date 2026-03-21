<template>
  <div class="campaign-card" @click="$emit('click')">
    <div class="card-header">
      <h3 class="campaign-name">{{ campaign.name }}</h3>
      <span v-if="isGm" class="gm-badge">GM</span>
    </div>

    <p class="campaign-description">{{ campaign.description || 'No description' }}</p>

    <div class="card-meta">
      <div class="meta-item">
        <span class="meta-label">Players</span>
        <span class="meta-value">{{ campaign.player_count }} / {{ campaign.max_players }}</span>
      </div>
      <div v-if="!isGm" class="meta-item">
        <span class="meta-label">GM</span>
        <span class="meta-value">{{ campaign.gm_username }}</span>
      </div>
    </div>

    <div class="card-actions" @click.stop>
      <template v-if="isGm">
        <button @click="$emit('manage', campaign)" class="action-btn action-manage">Manage</button>
        <button @click="$emit('edit', campaign)" class="action-btn">Edit</button>
        <button @click="$emit('delete', campaign)" class="action-btn action-danger">Delete</button>
      </template>
      <template v-else>
        <button @click="$emit('leave', campaign)" class="action-btn">Leave</button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Campaign } from '~/composables/useCampaignApi'

defineProps<{
  campaign: Campaign
  isGm: boolean
}>()

defineEmits<{
  click: []
  edit: [campaign: Campaign]
  delete: [campaign: Campaign]
  leave: [campaign: Campaign]
  manage: [campaign: Campaign]
}>()
</script>

<style scoped>
.campaign-card {
  background: rgba(25, 25, 30, 0.9);
  border: 0.0625rem solid rgba(255, 215, 0, 0.15);
  border-radius: 0.625rem;
  padding: clamp(1rem, 1.5vw, 1.25rem);
  cursor: pointer;
  transition: all 0.2s ease;
}

.campaign-card:hover {
  border-color: rgba(255, 215, 0, 0.4);
  transform: translateY(-0.125rem);
  box-shadow: 0 0.25rem 1.25rem rgba(0, 0, 0, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75em;
}

.campaign-name {
  font-size: clamp(1.1rem, 1.3vw, 1.25rem);
  color: #fff;
  margin: 0;
}

.gm-badge {
  background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%);
  color: #1a1a1a;
  font-size: 0.75em;
  font-weight: bold;
  padding: 0.25em 0.625em;
  border-radius: 0.25rem;
}

.campaign-description {
  color: #888;
  font-size: clamp(0.85rem, 1vw, 0.9rem);
  margin-bottom: 1em;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  gap: clamp(1rem, 1.5vw, 1.25rem);
  margin-bottom: 1em;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.25em;
}

.meta-label {
  font-size: 0.75em;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.03125rem;
}

.meta-value {
  font-size: clamp(0.85rem, 1vw, 0.9rem);
  color: #ccc;
  text-transform: capitalize;
}

.card-actions {
  display: flex;
  gap: 0.625em;
  padding-top: 0.75em;
  border-top: 0.0625rem solid rgba(255, 255, 255, 0.1);
}

.action-btn {
  padding: 0.5em 1em;
  background: transparent;
  border: 0.0625rem solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  color: #ccc;
  font-size: clamp(0.8rem, 0.95vw, 0.85rem);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: #fff;
}

.action-danger:hover {
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.action-manage {
  border-color: rgba(255, 215, 0, 0.3);
  color: #ffd700;
}

.action-manage:hover {
  border-color: rgba(255, 215, 0, 0.5);
  background: rgba(255, 215, 0, 0.1);
}
</style>
