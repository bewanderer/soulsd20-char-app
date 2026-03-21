<template>
  <section class="invites-section">
    <h2 class="section-title">Pending Invites</h2>
    <div class="invites-list">
      <div v-for="invite in invites" :key="invite.id" class="invite-card">
        <div class="invite-info">
          <h4 class="campaign-name">{{ invite.campaign_name }}</h4>
          <p class="invite-from">Invited by {{ invite.invited_by_username }}</p>
          <p v-if="invite.message" class="invite-message">"{{ invite.message }}"</p>
        </div>
        <div class="invite-actions">
          <button @click="$emit('accept', invite.id)" class="btn-accept">Accept</button>
          <button @click="$emit('decline', invite.id)" class="btn-decline">Decline</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CampaignInvite } from '~/composables/useCampaignApi'

defineProps<{
  invites: CampaignInvite[]
}>()

defineEmits<{
  accept: [inviteId: string]
  decline: [inviteId: string]
}>()
</script>

<style scoped>
.invites-section {
  margin-bottom: clamp(2rem, 3vw, 2.5rem);
}

.section-title {
  font-size: clamp(1.1rem, 1.4vw, 1.3rem);
  color: #fff;
  margin-bottom: 1.25em;
  padding-bottom: 0.625em;
  border-bottom: 0.0625rem solid rgba(255, 215, 0, 0.2);
}

.invites-list {
  display: flex;
  flex-direction: column;
  gap: clamp(0.75rem, 1.2vw, 0.9375rem);
}

.invite-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: clamp(1rem, 1.5vw, 1.25rem);
  background: rgba(255, 215, 0, 0.05);
  border: 0.0625rem solid rgba(255, 215, 0, 0.3);
  border-radius: 0.5rem;
}

.invite-info {
  flex: 1;
}

.campaign-name {
  color: var(--color-gold-primary);
  margin: 0 0 0.5em 0;
  font-size: clamp(1rem, 1.2vw, 1.1rem);
}

.invite-from {
  color: #888;
  font-size: clamp(0.85rem, 1vw, 0.9rem);
  margin: 0 0 0.25em 0;
}

.invite-message {
  color: #aaa;
  font-style: italic;
  font-size: clamp(0.8rem, 0.95vw, 0.85rem);
  margin: 0.5em 0 0 0;
}

.invite-actions {
  display: flex;
  gap: 0.625em;
}

.btn-accept,
.btn-decline {
  padding: 0.625em 1.25em;
  border-radius: 0.25rem;
  font-weight: 600;
  font-size: clamp(0.85rem, 1vw, 0.9rem);
  cursor: pointer;
  transition: all 0.2s;
  border: 0.125rem solid;
}

.btn-accept {
  background: rgba(76, 175, 80, 0.2);
  border-color: #4caf50;
  color: #4caf50;
}

.btn-accept:hover {
  background: rgba(76, 175, 80, 0.3);
}

.btn-decline {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.2);
  color: #888;
}

.btn-decline:hover {
  border-color: #ff6b6b;
  color: #ff6b6b;
}
</style>
