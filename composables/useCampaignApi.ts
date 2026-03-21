/**
 * Campaign API composable for managing campaigns, memberships, and invites.
 * Provides methods for all campaign-related API operations.
 */

import { useApi, type ApiResponse } from './useApi'

// Campaign types matching Django API
export interface Campaign {
  id: string
  name: string
  description: string
  image_url: string | null
  gm_uuid: string
  gm_username: string
  max_players: number
  player_count: number
  is_full: boolean
  invite_code?: string
  invite_enabled?: boolean
  settings?: Record<string, unknown>
  memberships?: CampaignMembership[]
  created_at: string
  updated_at: string
  last_session: string | null
}

export interface CampaignMembership {
  id: string
  user_uuid: string
  username: string
  role: 'player'
  status: 'invited' | 'active' | 'left' | 'kicked'
  display_name: string
  joined_at: string
}

export interface CampaignInvite {
  id: string
  campaign: string
  campaign_name: string
  invited_by_username: string
  invited_user_username: string
  role: 'player'
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  message: string
  created_at: string
  expires_at: string | null
  responded_at: string | null
}

export interface CreateCampaignData {
  name: string
  description?: string
  image_url?: string
  max_players?: number
  settings?: Record<string, unknown>
}

export interface UpdateCampaignData {
  name?: string
  description?: string
  image_url?: string
  max_players?: number
  invite_enabled?: boolean
  settings?: Record<string, unknown>
  last_session?: string
}

export function useCampaignApi() {
  const api = useApi()

  // ============================================
  // Campaign CRUD
  // ============================================

  /**
   * Get all campaigns the user is part of (as GM or member).
   */
  async function getCampaigns(): Promise<ApiResponse<Campaign[]>> {
    return api.get<Campaign[]>('/api/campaigns/')
  }

  /**
   * Get campaigns where user is the GM.
   */
  async function getCampaignsAsGM(): Promise<ApiResponse<Campaign[]>> {
    return api.get<Campaign[]>('/api/campaigns/as_gm/')
  }

  /**
   * Get campaigns where user is a player.
   */
  async function getCampaignsAsPlayer(): Promise<ApiResponse<Campaign[]>> {
    return api.get<Campaign[]>('/api/campaigns/as_player/')
  }

  /**
   * Get detailed campaign information.
   */
  async function getCampaign(campaignId: string): Promise<ApiResponse<Campaign>> {
    return api.get<Campaign>(`/api/campaigns/${campaignId}/`)
  }

  /**
   * Create a new campaign.
   */
  async function createCampaign(data: CreateCampaignData): Promise<ApiResponse<Campaign>> {
    return api.post<Campaign>('/api/campaigns/', data)
  }

  /**
   * Update a campaign.
   */
  async function updateCampaign(campaignId: string, data: UpdateCampaignData): Promise<ApiResponse<Campaign>> {
    return api.patch<Campaign>(`/api/campaigns/${campaignId}/`, data)
  }

  /**
   * Delete a campaign.
   */
  async function deleteCampaign(campaignId: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/api/campaigns/${campaignId}/`)
  }

  // ============================================
  // Campaign Membership
  // ============================================

  /**
   * Join a campaign using an invite code.
   */
  async function joinCampaign(inviteCode: string): Promise<ApiResponse<{
    detail: string
    campaign: Campaign
    membership: CampaignMembership
  }>> {
    return api.post('/api/campaigns/join/', { invite_code: inviteCode })
  }

  /**
   * Leave a campaign.
   */
  async function leaveCampaign(campaignId: string): Promise<ApiResponse<{ detail: string }>> {
    return api.post<{ detail: string }>(`/api/campaigns/${campaignId}/leave/`)
  }

  /**
   * Get all members of a campaign.
   */
  async function getCampaignMembers(campaignId: string): Promise<ApiResponse<CampaignMembership[]>> {
    return api.get<CampaignMembership[]>(`/api/campaigns/${campaignId}/members/`)
  }

  /**
   * Kick a member from a campaign (GM only).
   */
  async function kickMember(campaignId: string, memberId: string): Promise<ApiResponse<{ detail: string }>> {
    return api.post<{ detail: string }>(`/api/campaigns/${campaignId}/members/${memberId}/kick/`)
  }

  // ============================================
  // Invite Code Management
  // ============================================

  /**
   * Regenerate the campaign invite code (GM only).
   */
  async function regenerateInviteCode(campaignId: string): Promise<ApiResponse<{ invite_code: string }>> {
    return api.post<{ invite_code: string }>(`/api/campaigns/${campaignId}/regenerate_invite/`)
  }

  // ============================================
  // Direct Invites
  // ============================================

  /**
   * Get pending invites for the current user.
   */
  async function getReceivedInvites(): Promise<ApiResponse<CampaignInvite[]>> {
    return api.get<CampaignInvite[]>('/api/campaigns/invites/')
  }

  /**
   * Get invites sent by the current user.
   */
  async function getSentInvites(): Promise<ApiResponse<CampaignInvite[]>> {
    return api.get<CampaignInvite[]>('/api/campaigns/invites/sent/')
  }

  /**
   * Send a direct invite to a user (GM only).
   */
  async function sendInvite(
    campaignId: string,
    userUuid: string,
    message: string = ''
  ): Promise<ApiResponse<CampaignInvite>> {
    return api.post<CampaignInvite>(`/api/campaigns/${campaignId}/invite/`, {
      invited_user_uuid: userUuid,
      role: 'player',
      message
    })
  }

  /**
   * Accept a campaign invite.
   */
  async function acceptInvite(inviteId: string): Promise<ApiResponse<{ detail: string; campaign: Campaign }>> {
    return api.post(`/api/campaigns/invites/${inviteId}/accept/`)
  }

  /**
   * Decline a campaign invite.
   */
  async function declineInvite(inviteId: string): Promise<ApiResponse<{ detail: string }>> {
    return api.post<{ detail: string }>(`/api/campaigns/invites/${inviteId}/decline/`)
  }

  // ============================================
  // Character Assignment
  // ============================================

  /**
   * Get all characters in a campaign.
   */
  async function getCampaignCharacters(campaignId: string): Promise<ApiResponse<unknown[]>> {
    return api.get<unknown[]>(`/api/campaigns/${campaignId}/characters/`)
  }

  /**
   * Assign a character to a campaign.
   */
  async function assignCharacter(campaignId: string, characterUuid: string): Promise<ApiResponse<{
    detail: string
    character_id: string
    campaign_id: string
  }>> {
    return api.post(`/api/campaigns/${campaignId}/assign_character/`, {
      character_uuid: characterUuid
    })
  }

  /**
   * Unassign a character from a campaign.
   */
  async function unassignCharacter(campaignId: string, characterUuid: string): Promise<ApiResponse<{ detail: string }>> {
    return api.post<{ detail: string }>(`/api/campaigns/${campaignId}/unassign_character/`, {
      character_uuid: characterUuid
    })
  }

  return {
    // Campaign CRUD
    getCampaigns,
    getCampaignsAsGM,
    getCampaignsAsPlayer,
    getCampaign,
    createCampaign,
    updateCampaign,
    deleteCampaign,

    // Membership
    joinCampaign,
    leaveCampaign,
    getCampaignMembers,
    kickMember,

    // Invite code
    regenerateInviteCode,

    // Direct invites
    getReceivedInvites,
    getSentInvites,
    sendInvite,
    acceptInvite,
    declineInvite,

    // Character assignment
    getCampaignCharacters,
    assignCharacter,
    unassignCharacter
  }
}
