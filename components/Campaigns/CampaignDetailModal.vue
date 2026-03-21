<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <button @click="$emit('close')" class="close-btn">&times;</button>

      <header class="modal-header">
        <div class="header-info">
          <h2 class="campaign-name">{{ campaign.name }}</h2>
        </div>
        <div v-if="isGm" class="gm-badge">Game Master</div>
      </header>

      <p v-if="campaign.description" class="campaign-description">{{ campaign.description }}</p>

      <!-- Invite Code Section (GM only) -->
      <section v-if="isGm && campaign.invite_code" class="invite-section">
        <h3>Invite Code</h3>
        <div class="invite-code-container">
          <code class="invite-code">{{ campaign.invite_code }}</code>
          <button @click="copyInviteCode" class="btn-icon btn-copy" title="Copy code">
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
          <button @click="$emit('regenerate-invite')" class="btn-icon btn-refresh" title="Generate new code">
            Refresh
          </button>
        </div>
        <p class="invite-hint">Share this code with players to let them join</p>
      </section>

      <!-- Members Section -->
      <section class="members-section">
        <h3>
          Members
          <span class="member-count">({{ activeMembers.length + 1 }} / {{ campaign.max_players }})</span>
        </h3>

        <div class="members-list">
          <!-- GM -->
          <div class="member-item gm-member">
            <div class="member-info">
              <span class="member-name">{{ campaign.gm_username }}</span>
              <span class="member-role gm">GM</span>
            </div>
          </div>

          <!-- Players -->
          <div
            v-for="member in activeMembers"
            :key="member.id"
            class="member-item"
          >
            <div class="member-info">
              <span class="member-name">{{ member.display_name || member.username }}</span>
              <span class="member-role">Player</span>
            </div>
            <div v-if="isGm" class="member-actions">
              <button @click="confirmKick(member)" class="btn-kick">Kick</button>
            </div>
          </div>

          <!-- Kicked Members (GM only) -->
          <template v-if="isGm && kickedMembers.length > 0">
            <div class="kicked-divider">Kicked Players</div>
            <div
              v-for="member in kickedMembers"
              :key="member.id"
              class="member-item kicked"
            >
              <div class="member-info">
                <span class="member-name">{{ member.display_name || member.username }}</span>
                <span class="member-status">Kicked</span>
              </div>
            </div>
          </template>
        </div>
      </section>

      <!-- Kick Confirmation -->
      <div v-if="kickingMember" class="confirm-overlay">
        <div class="confirm-content">
          <p>Kick {{ kickingMember.username }} from the campaign?</p>
          <div class="confirm-actions">
            <button @click="kickingMember = null" class="btn-cancel">Cancel</button>
            <button @click="handleKick" class="btn-confirm-kick">Kick</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Campaign, CampaignMembership } from '~/composables/useCampaignApi'

const props = defineProps<{
  campaign: Campaign
  isGm: boolean
}>()

const emit = defineEmits<{
  close: []
  updated: []
  kick: [memberId: string]
  'regenerate-invite': []
}>()

const copied = ref(false)
const kickingMember = ref<CampaignMembership | null>(null)

const activeMembers = computed(() => {
  return props.campaign.memberships?.filter(m => m.status === 'active') || []
})

const kickedMembers = computed(() => {
  return props.campaign.memberships?.filter(m => m.status === 'kicked') || []
})

async function copyInviteCode() {
  if (!props.campaign.invite_code) return

  try {
    await navigator.clipboard.writeText(props.campaign.invite_code)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

function confirmKick(member: CampaignMembership) {
  kickingMember.value = member
}

function handleKick() {
  if (!kickingMember.value) return
  emit('kick', kickingMember.value.id)
  kickingMember.value = null
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
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
  max-width: clamp(30rem, 45vw, 37.5rem);
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: none;
  color: #888;
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #fff;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25em;
  padding-right: 2.5rem;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 0.75em;
}

.campaign-name {
  color: #fff;
  font-size: clamp(1.25rem, 1.6vw, 1.5rem);
  margin: 0;
}

.gm-badge {
  background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%);
  color: #1a1a1a;
  padding: 0.375em 0.75em;
  border-radius: 0.25rem;
  font-weight: 600;
  font-size: clamp(0.8rem, 0.95vw, 0.85rem);
}

.campaign-description {
  color: #888;
  line-height: 1.5;
  font-size: clamp(0.9rem, 1vw, 1rem);
  margin-bottom: 1.5625em;
}

/* Invite Section */
.invite-section {
  background: rgba(255, 215, 0, 0.05);
  border: 0.0625rem solid rgba(255, 215, 0, 0.2);
  border-radius: 0.5rem;
  padding: clamp(1rem, 1.5vw, 1.25rem);
  margin-bottom: 1.5625em;
}

.invite-section h3 {
  color: var(--color-gold-primary);
  font-size: clamp(0.9rem, 1.1vw, 1rem);
  margin: 0 0 0.9375em 0;
}

.invite-code-container {
  display: flex;
  align-items: center;
  gap: 0.625em;
}

.invite-code {
  flex: 1;
  padding: 0.75em 1em;
  background: rgba(0, 0, 0, 0.4);
  border: 0.0625rem solid rgba(255, 215, 0, 0.3);
  border-radius: 0.375rem;
  color: var(--color-gold-primary);
  font-size: clamp(1rem, 1.3vw, 1.2rem);
  letter-spacing: 0.1875rem;
  text-align: center;
}

.btn-icon {
  padding: 0.625em;
  background: transparent;
  border: 0.0625rem solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 1.1em;
  transition: all 0.2s;
}

.btn-icon:hover {
  border-color: var(--color-gold-primary);
  background: rgba(255, 215, 0, 0.1);
}

.invite-hint {
  color: #666;
  font-size: clamp(0.8rem, 0.95vw, 0.85rem);
  margin: 0.75em 0 0 0;
}

/* Members Section */
.members-section h3 {
  color: #fff;
  font-size: clamp(0.9rem, 1.1vw, 1rem);
  margin: 0 0 0.9375em 0;
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.member-count {
  color: #666;
  font-weight: normal;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75em 1em;
  background: rgba(0, 0, 0, 0.3);
  border: 0.0625rem solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
}

.member-item.gm-member {
  border-color: rgba(255, 215, 0, 0.3);
  background: rgba(255, 215, 0, 0.05);
}

.member-item.kicked {
  opacity: 0.5;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 0.75em;
}

.member-name {
  color: #fff;
  font-weight: 500;
  font-size: clamp(0.9rem, 1vw, 1rem);
}

.member-role {
  padding: 0.1875em 0.5em;
  border-radius: 0.25rem;
  font-size: 0.75em;
  background: rgba(255, 255, 255, 0.1);
  color: #888;
}

.member-role.gm {
  background: rgba(255, 215, 0, 0.2);
  color: var(--color-gold-primary);
}

.member-status {
  color: #ff6b6b;
  font-size: 0.8em;
}

.member-actions {
  display: flex;
  gap: 0.5em;
}

.btn-kick {
  padding: 0.375em 0.75em;
  background: transparent;
  border: 0.0625rem solid rgba(255, 107, 107, 0.3);
  border-radius: 0.25rem;
  color: #ff6b6b;
  font-size: clamp(0.75rem, 0.9vw, 0.8rem);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-kick:hover {
  background: rgba(255, 107, 107, 0.1);
  border-color: #ff6b6b;
}

.kicked-divider {
  color: #666;
  font-size: 0.8em;
  text-transform: uppercase;
  margin: 0.9375em 0 0.5em 0;
  padding-top: 0.9375em;
  border-top: 0.0625rem solid rgba(255, 255, 255, 0.1);
}

/* Confirm Overlay */
.confirm-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
}

.confirm-content {
  background: rgba(30, 30, 35, 0.98);
  border: 0.0625rem solid rgba(255, 107, 107, 0.3);
  border-radius: 0.5rem;
  padding: clamp(1.25rem, 2vw, 1.5625rem);
  text-align: center;
}

.confirm-content p {
  color: #fff;
  font-size: clamp(0.9rem, 1vw, 1rem);
  margin: 0 0 1.25em 0;
}

.confirm-actions {
  display: flex;
  gap: 0.75em;
  justify-content: center;
}

.btn-cancel {
  padding: 0.625em 1.25em;
  background: transparent;
  border: 0.0625rem solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  color: #ccc;
  font-size: clamp(0.85rem, 1vw, 0.9rem);
  cursor: pointer;
}

.btn-confirm-kick {
  padding: 0.625em 1.25em;
  background: rgba(255, 107, 107, 0.2);
  border: 0.0625rem solid #ff6b6b;
  border-radius: 0.25rem;
  color: #ff6b6b;
  font-size: clamp(0.85rem, 1vw, 0.9rem);
  cursor: pointer;
}

.btn-cancel:hover,
.btn-confirm-kick:hover {
  opacity: 0.8;
}
</style>
