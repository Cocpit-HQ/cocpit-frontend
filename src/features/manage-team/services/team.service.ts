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
    permissions: Array.isArray(row.permissions) ? row.permissions.map((p: string) => p.toUpperCase()) : [],
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

function formatAction(action: string, metadata?: any): string {
  if (!action) return 'performed an activity';
  const upper = action.toUpperCase().trim();
  switch (upper) {
    case 'VIEW':
    case 'VIEWED':
      return 'viewed page';
    case 'TEAMS':
      return 'viewed Teams';
    case 'ACTIVITY_LOGS':
      return 'viewed Activity logs';
    case 'CREATE_POST':
      return 'created a post';
    case 'CREATE_ROLE':
      return 'created role';
    case 'UPDATE_ROLE':
      return 'updated role';
    case 'DELETE_ROLE':
      return 'deleted role';
    case 'INVITE_MEMBER':
      return 'invited team member';
    case 'ASSIGN_ROLE':
      return 'assigned role';
    case 'REMOVE_MEMBER':
      return 'removed member';
    case 'TRANSFER_OWNERSHIP':
      return 'transferred ownership';
    default:
      return action.replace(/_/g, ' ').toLowerCase();
  }
}

function mapActivityLog(row: any): ActivityLogEntry {
  const metadata = row.metadata || {};
  let targetName = row.target_name || metadata.targetName || metadata.roleName || '';
  let highlightedText = row.highlighted_text || '';

  return {
    id: row.log_id || row.id,
    actorName: row.actor_name || 'Team member',
    actorAvatarUrl: row.actor_avatar || row.actor_avatar_url || '/assets/pngegg.png',
    action: formatAction(row.action, metadata),
    targetName: targetName,
    targetRole: row.target_role || row.actor_role,
    details: row.details || (row.metadata ? JSON.stringify(row.metadata) : ''),
    highlightedText: highlightedText,
    timestamp: row.created_at || row.timestamp,
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
  let dateFromLimit: Date | null = null;

  if (filters) {
    if (filters.roleId && filters.roleId !== 'all') {
      params.roleId = filters.roleId;
    }
    if (filters.memberId && filters.memberId !== 'all') {
      params.memberId = filters.memberId;
    }
    if (filters.search) {
      params.search = filters.search;
    }
    if (filters.dateRange && filters.dateRange !== 'all_time') {
      dateFromLimit = new Date();
      dateFromLimit.setHours(0, 0, 0, 0);
      if (filters.dateRange === 'last_7_days') dateFromLimit.setDate(dateFromLimit.getDate() - 7);
      else if (filters.dateRange === 'last_30_days') dateFromLimit.setDate(dateFromLimit.getDate() - 30);
      else if (filters.dateRange === 'last_90_days') dateFromLimit.setDate(dateFromLimit.getDate() - 90);
      params.dateFrom = dateFromLimit.toISOString();
    }
  }

  const res = await api.get(`/organizations/${orgId}/teams/activity`, { params });
  let list = res.data?.data || res.data || [];

  // Client-side date range filter fallback
  if (dateFromLimit) {
    const minTimestamp = dateFromLimit.getTime();
    list = list.filter((item: any) => {
      const ts = item.created_at || item.timestamp;
      if (!ts) return true;
      const t = new Date(ts).getTime();
      return !isNaN(t) && t >= minTimestamp;
    });
  }

  // Client-side member filter fallback
  if (filters?.memberId && filters.memberId !== 'all') {
    list = list.filter((item: any) => {
      const actorId = item.actor_id || item.actorId || item.user_id;
      return actorId === filters.memberId;
    });
  }

  // Client-side search filter fallback
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    list = list.filter((item: any) => 
      (item.action && item.action.toLowerCase().includes(s)) ||
      (item.actor_name && item.actor_name.toLowerCase().includes(s)) ||
      (item.actor_role && item.actor_role.toLowerCase().includes(s)) ||
      (item.target_name && item.target_name.toLowerCase().includes(s)) ||
      (item.details && item.details.toLowerCase().includes(s)) ||
      (item.metadata && JSON.stringify(item.metadata).toLowerCase().includes(s))
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
