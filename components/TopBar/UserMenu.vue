<template>
  <div class="user-menu" ref="menuRef">
    <button @click="toggleMenu" class="user-menu-trigger" :class="{ active: isOpen }">
      <div class="user-avatar">
        <span v-if="user">{{ userInitial }}</span>
        <span v-else>?</span>
      </div>
      <svg class="dropdown-arrow" :class="{ rotated: isOpen }" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
      </svg>
    </button>

    <Transition name="menu-fade">
      <div v-if="isOpen" class="user-menu-dropdown">
        <div class="user-info">
          <div class="user-name">{{ user?.username || 'Guest' }}</div>
          <div v-if="user?.subscription_tier" class="user-tier">{{ user.subscription_tier }}</div>
        </div>

        <div class="menu-divider"></div>

        <button @click="goToCampaigns" class="menu-item">
          <svg class="menu-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
          </svg>
          <span>Campaigns</span>
        </button>

        <button v-if="user?.patreon_connected" @click="refreshPatreon" class="menu-item" :disabled="isRefreshing">
          <svg class="menu-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
          </svg>
          <span>{{ isRefreshing ? 'Refreshing...' : 'Refresh Patreon' }}</span>
        </button>

        <div class="menu-divider"></div>

        <button @click="handleLogout" class="menu-item menu-item-danger">
          <svg class="menu-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"/>
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

const router = useRouter()
const auth = useAuth()

const isOpen = ref(false)
const isRefreshing = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const user = computed(() => auth.user.value)

const userInitial = computed(() => {
  if (!user.value?.username) return '?'
  return user.value.username.charAt(0).toUpperCase()
})

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function closeMenu() {
  isOpen.value = false
}

function goToCampaigns() {
  closeMenu()
  router.push('/campaigns')
}

async function refreshPatreon() {
  if (isRefreshing.value) return
  isRefreshing.value = true

  try {
    await auth.refreshPatreonStatus()
  } finally {
    isRefreshing.value = false
  }
}

async function handleLogout() {
  closeMenu()
  await auth.logout()
  router.push('/login')
}

// Close menu when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.user-menu {
  position: relative;
  z-index: 300;
}

.user-menu-trigger {
  display: flex;
  align-items: center;
  gap: 0.375em;
  padding: 0.375em 0.625em;
  background: rgba(0, 0, 0, 0.4);
  border: 0.0625rem solid rgba(255, 215, 0, 0.2);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-menu-trigger:hover,
.user-menu-trigger.active {
  background: rgba(0, 0, 0, 0.6);
  border-color: rgba(255, 215, 0, 0.4);
}

.user-avatar {
  width: clamp(1.5rem, 2vw, 1.75rem);
  height: clamp(1.5rem, 2vw, 1.75rem);
  border-radius: 50%;
  background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: clamp(0.75rem, 1vw, 0.875rem);
  color: #1a1a1a;
}

.dropdown-arrow {
  width: 1em;
  height: 1em;
  color: rgba(255, 255, 255, 0.6);
  transition: transform 0.2s ease;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.user-menu-dropdown {
  position: absolute;
  top: calc(100% + 0.5em);
  left: 0;
  min-width: clamp(11rem, 14vw, 12.5rem);
  background: rgba(25, 25, 30, 0.98);
  border: 0.0625rem solid rgba(255, 215, 0, 0.2);
  border-radius: 0.5rem;
  box-shadow: 0 0.25rem 1.25rem rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

.user-info {
  padding: 0.75em 1em;
}

.user-name {
  font-weight: 600;
  color: #fff;
  font-size: clamp(0.8rem, 1vw, 0.875rem);
}

.user-tier {
  font-size: clamp(0.7rem, 0.85vw, 0.75rem);
  color: var(--color-gold-primary);
  margin-top: 0.125em;
  text-transform: capitalize;
}

.menu-divider {
  height: 0.0625rem;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.25em 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.625em;
  width: 100%;
  padding: 0.625em 1em;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: clamp(0.8rem, 1vw, 0.875rem);
  cursor: pointer;
  transition: background 0.2s ease;
  text-align: left;
}

.menu-item:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.menu-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-item-danger {
  color: #ff6b6b;
}

.menu-item-danger:hover:not(:disabled) {
  background: rgba(255, 107, 107, 0.1);
  color: #ff8585;
}

.menu-icon {
  width: 1.125em;
  height: 1.125em;
  flex-shrink: 0;
}

/* Transition animations */
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-0.5em);
}
</style>
