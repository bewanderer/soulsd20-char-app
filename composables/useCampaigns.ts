/**
 * Campaign state management composable.
 * Manages the client-side state for campaigns, memberships, and invites.
 *
 * Unlike characters, campaigns don't need localStorage syncing since they're
 * purely server-side data. This composable handles fetching, caching, and
 * reactive state management.
 */

import { ref, computed, readonly } from 'vue'
import {
  useCampaignApi,
  type Campaign,
  type CampaignMembership,
  type CampaignInvite,
  type CreateCampaignData,
  type UpdateCampaignData
} from './useCampaignApi'

// Reactive state
const campaigns = ref<Campaign[]>([])
const currentCampaign = ref<Campaign | null>(null)
const pendingInvites = ref<CampaignInvite[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const lastFetched = ref<number | null>(null)

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

export function useCampaigns() {
  const api = useCampaignApi()

  // ============================================
  // Computed Properties
  // ============================================

  /** Campaigns where the user is the GM */
  const gmCampaigns = computed(() =>
    campaigns.value.filter(c => c.gm_uuid === getCurrentUserUuid())
  )

  /** Campaigns where the user is a player */
  const memberCampaigns = computed(() =>
    campaigns.value.filter(c => c.gm_uuid !== getCurrentUserUuid())
  )

  /** Number of pending invites */
  const pendingInviteCount = computed(() => pendingInvites.value.length)

  // Helper to get current user UUID (from auth state)
  function getCurrentUserUuid(): string | null {
    // Import from useAuth if available
    try {
      const authData = localStorage.getItem('sd20_user')
      if (authData) {
        const user = JSON.parse(authData)
        return user.uuid || null
      }
    } catch {
      // Ignore parse errors
    }
    return null
  }

  // ============================================
  // Data Fetching
  // ============================================

  /**
   * Fetch all campaigns the user is part of.
   * Uses caching to avoid unnecessary API calls.
   */
  async function fetchCampaigns(force = false): Promise<void> {
    // Check cache
    if (!force && lastFetched.value && Date.now() - lastFetched.value < CACHE_DURATION) {
      return
    }

    isLoading.value = true
    error.value = null

    const response = await api.getCampaigns()

    if (response.ok && response.data) {
      campaigns.value = response.data
      lastFetched.value = Date.now()
    } else {
      error.value = response.error?.message || 'Failed to fetch campaigns'
    }

    isLoading.value = false
  }

  /**
   * Fetch a specific campaign by ID.
   */
  async function fetchCampaign(campaignId: string): Promise<Campaign | null> {
    isLoading.value = true
    error.value = null

    const response = await api.getCampaign(campaignId)

    isLoading.value = false

    if (response.ok && response.data) {
      currentCampaign.value = response.data

      // Update in campaigns list if present - use array replacement for proper reactivity
      const index = campaigns.value.findIndex(c => c.id === campaignId)
      if (index >= 0) {
        campaigns.value = [
          ...campaigns.value.slice(0, index),
          response.data,
          ...campaigns.value.slice(index + 1)
        ]
      }

      return response.data
    } else {
      error.value = response.error?.message || 'Failed to fetch campaign'
      return null
    }
  }

  /**
   * Fetch pending invites for the current user.
   */
  async function fetchInvites(): Promise<void> {
    const response = await api.getReceivedInvites()

    if (response.ok && response.data) {
      pendingInvites.value = response.data
    }
  }

  // ============================================
  // Campaign Management
  // ============================================

  /**
   * Create a new campaign.
   */
  async function createCampaign(data: CreateCampaignData): Promise<Campaign | null> {
    isLoading.value = true
    error.value = null

    const response = await api.createCampaign(data)

    isLoading.value = false

    if (response.ok && response.data) {
      campaigns.value.push(response.data)
      return response.data
    } else {
      error.value = response.error?.message || 'Failed to create campaign'
      return null
    }
  }

  /**
   * Update a campaign.
   */
  async function updateCampaign(campaignId: string, data: UpdateCampaignData): Promise<Campaign | null> {
    isLoading.value = true
    error.value = null

    const response = await api.updateCampaign(campaignId, data)

    isLoading.value = false

    if (response.ok && response.data) {
      // Update in local state - use array replacement for proper reactivity
      const index = campaigns.value.findIndex(c => c.id === campaignId)
      if (index >= 0) {
        // Replace entire array to ensure Vue reactivity triggers
        campaigns.value = [
          ...campaigns.value.slice(0, index),
          response.data,
          ...campaigns.value.slice(index + 1)
        ]
      }
      if (currentCampaign.value?.id === campaignId) {
        currentCampaign.value = response.data
      }
      return response.data
    } else {
      error.value = response.error?.message || 'Failed to update campaign'
      return null
    }
  }

  /**
   * Delete a campaign.
   */
  async function deleteCampaign(campaignId: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    const response = await api.deleteCampaign(campaignId)

    isLoading.value = false

    if (response.ok) {
      campaigns.value = campaigns.value.filter(c => c.id !== campaignId)
      if (currentCampaign.value?.id === campaignId) {
        currentCampaign.value = null
      }
      return true
    } else {
      error.value = response.error?.message || 'Failed to delete campaign'
      return false
    }
  }

  // ============================================
  // Membership
  // ============================================

  /**
   * Join a campaign using an invite code.
   */
  async function joinCampaign(inviteCode: string): Promise<Campaign | null> {
    isLoading.value = true
    error.value = null

    const response = await api.joinCampaign(inviteCode)

    isLoading.value = false

    if (response.ok && response.data) {
      campaigns.value.push(response.data.campaign)
      return response.data.campaign
    } else {
      error.value = response.error?.message || 'Failed to join campaign'
      return null
    }
  }

  /**
   * Leave a campaign.
   */
  async function leaveCampaign(campaignId: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    const response = await api.leaveCampaign(campaignId)

    isLoading.value = false

    if (response.ok) {
      campaigns.value = campaigns.value.filter(c => c.id !== campaignId)
      if (currentCampaign.value?.id === campaignId) {
        currentCampaign.value = null
      }
      return true
    } else {
      error.value = response.error?.message || 'Failed to leave campaign'
      return false
    }
  }

  /**
   * Kick a member from a campaign.
   */
  async function kickMember(campaignId: string, memberId: string): Promise<boolean> {
    const response = await api.kickMember(campaignId, memberId)

    if (response.ok) {
      // Refresh campaign data
      await fetchCampaign(campaignId)
      return true
    } else {
      error.value = response.error?.message || 'Failed to kick member'
      return false
    }
  }

  // ============================================
  // Invite Code
  // ============================================

  /**
   * Regenerate the invite code for a campaign.
   */
  async function regenerateInviteCode(campaignId: string): Promise<string | null> {
    const response = await api.regenerateInviteCode(campaignId)

    if (response.ok && response.data) {
      // Update local state
      const campaign = campaigns.value.find(c => c.id === campaignId)
      if (campaign) {
        campaign.invite_code = response.data.invite_code
      }
      if (currentCampaign.value?.id === campaignId) {
        currentCampaign.value.invite_code = response.data.invite_code
      }
      return response.data.invite_code
    } else {
      error.value = response.error?.message || 'Failed to regenerate invite code'
      return null
    }
  }

  // ============================================
  // Direct Invites
  // ============================================

  /**
   * Accept a campaign invite.
   */
  async function acceptInvite(inviteId: string): Promise<boolean> {
    const response = await api.acceptInvite(inviteId)

    if (response.ok && response.data) {
      // Remove from pending invites
      pendingInvites.value = pendingInvites.value.filter(i => i.id !== inviteId)
      // Add campaign to list
      campaigns.value.push(response.data.campaign)
      return true
    } else {
      error.value = response.error?.message || 'Failed to accept invite'
      return false
    }
  }

  /**
   * Decline a campaign invite.
   */
  async function declineInvite(inviteId: string): Promise<boolean> {
    const response = await api.declineInvite(inviteId)

    if (response.ok) {
      pendingInvites.value = pendingInvites.value.filter(i => i.id !== inviteId)
      return true
    } else {
      error.value = response.error?.message || 'Failed to decline invite'
      return false
    }
  }

  /**
   * Send a direct invite to a user.
   */
  async function sendInvite(
    campaignId: string,
    userUuid: string,
    message: string = ''
  ): Promise<boolean> {
    const response = await api.sendInvite(campaignId, userUuid, message)

    if (response.ok) {
      return true
    } else {
      error.value = response.error?.message || 'Failed to send invite'
      return false
    }
  }

  // ============================================
  // Character Assignment
  // ============================================

  /**
   * Assign a character to a campaign.
   */
  async function assignCharacter(campaignId: string, characterUuid: string): Promise<boolean> {
    const response = await api.assignCharacter(campaignId, characterUuid)

    if (response.ok) {
      return true
    } else {
      error.value = response.error?.message || 'Failed to assign character'
      return false
    }
  }

  /**
   * Unassign a character from a campaign.
   */
  async function unassignCharacter(campaignId: string, characterUuid: string): Promise<boolean> {
    const response = await api.unassignCharacter(campaignId, characterUuid)

    if (response.ok) {
      return true
    } else {
      error.value = response.error?.message || 'Failed to unassign character'
      return false
    }
  }

  // ============================================
  // Utility
  // ============================================

  /**
   * Clear all campaign state (on logout).
   */
  function clearState(): void {
    campaigns.value = []
    currentCampaign.value = null
    pendingInvites.value = []
    error.value = null
    lastFetched.value = null
  }

  /**
   * Set the current active campaign.
   */
  function setCurrentCampaign(campaign: Campaign | null): void {
    currentCampaign.value = campaign
  }

  /**
   * Get a campaign by ID from local state.
   */
  function getCampaignById(campaignId: string): Campaign | undefined {
    return campaigns.value.find(c => c.id === campaignId)
  }

  return {
    // State (readonly to prevent direct mutation)
    campaigns: readonly(campaigns),
    currentCampaign: readonly(currentCampaign),
    pendingInvites: readonly(pendingInvites),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    gmCampaigns,
    memberCampaigns,
    pendingInviteCount,

    // Data fetching
    fetchCampaigns,
    fetchCampaign,
    fetchInvites,

    // Campaign management
    createCampaign,
    updateCampaign,
    deleteCampaign,

    // Membership
    joinCampaign,
    leaveCampaign,
    kickMember,

    // Invite code
    regenerateInviteCode,

    // Direct invites
    acceptInvite,
    declineInvite,
    sendInvite,

    // Character assignment
    assignCharacter,
    unassignCharacter,

    // Utility
    clearState,
    setCurrentCampaign,
    getCampaignById
  }
}
