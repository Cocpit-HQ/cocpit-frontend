/**
 * Team Management Service
 *
 * All functions currently return empty data.
 * Each function has a TODO comment with the real API endpoint to integrate.
 */

import api from '@/lib/axios';
import {
  TeamRole,
  TeamMember,
  ActivityLogEntry,
  ActivityLogFilters,
  InviteCandidate,
  PendingInvitation,
  UserPendingInvitation,
  CreateRoleInput,
  UpdateRoleInput,
} from '../types/team.types';

// ─── Response Mappers ─────────────────────────────────────────────────────────

/** Maps a snake_case role row from the backend to a camelCase TeamRole */
function mapRole(row: any): TeamRole {
  return {
    id: row.role_id,
    orgId: row.org_id,
    name: row.name,
    color: row.color || '#808080',
    description: row.description || '',
    permissions: row.permissions || [],
    priority: row.priority ?? 0,
    isSystemRole: row.is_system_role ?? false,
    memberCount: row.member_count ?? 0,
    members: Array.isArray(row.members) ? row.members.map((m: any) => ({
      ...m,
      avatarUrl: m.avatar || m.avatar_url || '',
      id: m.id || m.user_id,
      name: m.name || m.full_name,
      status: m.status || 'ACTIVE',
      inviteId: m.invite_id,
    })) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMember(row: any): TeamMember {
  return {
    id: row.user_id,
    orgId: row.org_id || '',
    name: row.full_name,
    avatarUrl: row.avatar_url,
    headline: row.headline,
    roleId: row.role_id,
    roleName: row.role_name,
    roleColor: row.role_color,
    status: row.status,
    joinedAt: row.joined_at,
  };
}

function mapActivityLog(row: any): ActivityLogEntry {
  return {
    id: row.log_id,
    actorName: row.actor_name,
    actorAvatarUrl: row.actor_avatar || row.actor_avatar_url || '/assets/pngegg.png',
    action: row.action,
    targetName: row.target_name,
    targetRole: row.target_role,
    details: row.details,
    highlightedText: row.highlighted_text,
    timestamp: row.created_at,
  };
}

function mapCandidate(row: any): InviteCandidate {
  return {
    id: row.user_id,
    name: row.full_name,
    avatarUrl: row.avatar || row.avatar_url || '',
    headline: row.headline,
    alreadyMember: row.already_member || false,
  };
}

// ─── Roles ────────────────────────────────────────────────────────────────────

export async function getTeamRoles(orgId: string): Promise<TeamRole[]> {
  const res = await api.get(`/organizations/${orgId}/teams/roles`);
  return (res.data || []).map(mapRole);
}

export async function getRoleById(
  orgId: string,
  roleId: string
): Promise<TeamRole | null> {
  try {
    const res = await api.get(`/organizations/${orgId}/teams/roles/${roleId}`);
    return res.data ? mapRole(res.data) : null;
  } catch (error) {
    return null;
  }
}

export async function createRole(
  orgId: string,
  input: CreateRoleInput
): Promise<TeamRole> {
  const res = await api.post(`/organizations/${orgId}/teams/roles`, input);
  return mapRole(res.data);
}

export async function updateRole(
  orgId: string,
  roleId: string,
  input: UpdateRoleInput
): Promise<TeamRole> {
  const res = await api.put(`/organizations/${orgId}/teams/roles/${roleId}`, input);
  return mapRole(res.data);
}

export async function deleteRole(
  orgId: string,
  roleId: string
): Promise<boolean> {
  await api.delete(`/organizations/${orgId}/teams/roles/${roleId}`);
  return true;
}

// ─── Members ──────────────────────────────────────────────────────────────────

export async function getTeamMembers(orgId: string): Promise<TeamMember[]> {
  const res = await api.get(`/organizations/${orgId}/teams/members`);
  // The backend might return paginated { data, meta } or just an array
  const list = res.data?.data || res.data || [];
  return list.map(mapMember);
}

export async function getRoleMembers(
  orgId: string,
  roleId: string
): Promise<TeamMember[]> {
  const res = await api.get(`/organizations/${orgId}/teams/roles/${roleId}/members`);
  const list = res.data?.data || res.data || [];
  return list.map(mapMember);
}

export async function inviteMember(
  orgId: string,
  userId: string,
  roleId?: string
): Promise<void> {
  await api.post(`/organizations/${orgId}/teams/invite`, { userId, roleId });
}

export async function withdrawInvite(
  orgId: string,
  inviteId: string
): Promise<void> {
  await api.delete(`/organizations/${orgId}/teams/invites/${inviteId}`);
}

export async function removeMember(
  orgId: string,
  userId: string
): Promise<boolean> {
  await api.delete(`/organizations/${orgId}/teams/members/${userId}`);
  return true;
}

export async function updateMemberRole(
  orgId: string,
  userId: string,
  roleId: string
): Promise<boolean> {
  await api.put(`/organizations/${orgId}/teams/members/${userId}/role`, { roleId });
  return true;
}

// ─── Activity Logs ────────────────────────────────────────────────────────────

export async function getActivityLogs(
  orgId: string,
  filters?: ActivityLogFilters
): Promise<ActivityLogEntry[]> {
  const params: any = {};
  if (filters) {
    if (filters.memberId && filters.memberId !== 'all') {
      params.memberId = filters.memberId;
    }
    if (filters.dateRange && filters.dateRange !== 'all_time') {
      const dateFrom = new Date();
      if (filters.dateRange === 'last_7_days') dateFrom.setDate(dateFrom.getDate() - 7);
      else if (filters.dateRange === 'last_30_days') dateFrom.setDate(dateFrom.getDate() - 30);
      else if (filters.dateRange === 'last_90_days') dateFrom.setDate(dateFrom.getDate() - 90);
      params.dateFrom = dateFrom.toISOString();
    }
  }

  const res = await api.get(`/organizations/${orgId}/teams/activity`, { params });
  let list = res.data?.data || res.data || [];

  if (filters?.search) {
    const s = filters.search.toLowerCase();
    list = list.filter((item: any) => 
      (item.action && item.action.toLowerCase().includes(s)) ||
      (item.actor_name && item.actor_name.toLowerCase().includes(s)) ||
      (item.actor_role && item.actor_role.toLowerCase().includes(s))
    );
  }
  return list.map(mapActivityLog);
}

// ─── Invite Candidates ───────────────────────────────────────────────────────

export async function getInviteCandidates(
  orgId: string,
  search: string
): Promise<InviteCandidate[]> {
  const res = await api.get(`/organizations/${orgId}/teams/invite-candidates`, { params: { search } });
  const list = res.data?.candidates || res.data?.data || (Array.isArray(res.data) ? res.data : []);
  return list.map(mapCandidate);
}

export async function getPendingInvites(
  orgId: string
): Promise<PendingInvitation[]> {
  const res = await api.get(`/organizations/${orgId}/teams/invites/pending`);
  const list = res.data?.data || res.data || [];
  return list.map((item: any) => ({
    id: item.invite_id,
    userId: item.user_id,
    name: item.full_name || 'Unknown',
    avatarUrl: item.avatar || '/assets/pngegg.png',
    headline: item.headline || '',
    roleId: item.role_id,
    roleName: item.role_name || '',
    roleColor: item.role_color || '',
    invitedAt: item.invited_at,
  }));
}

// ─── User Invitations ─────────────────────────────────────────────────────────

export async function getUserPendingInvites(): Promise<UserPendingInvitation[]> {
  const res = await api.get('/organizations/teams/invites/pending');
  return res.data || [];
}

export async function acceptInvite(token: string): Promise<any> {
  const res = await api.post('/organizations/teams/invites/accept', { token });
  return res.data;
}

export async function declineInvite(token: string): Promise<any> {
  const res = await api.post('/organizations/teams/invites/decline', { token });
  return res.data;
}
