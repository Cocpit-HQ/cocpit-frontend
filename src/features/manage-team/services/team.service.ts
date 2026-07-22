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
    email: row.email,
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
    case 'ACTOR_SWITCH':
      return 'switched actor context to organization';
    case 'CREATE_PAGE':
      return 'created the company page';
    case 'UPDATE_PROFILE':
      return 'updated organization profile';
    case 'UPLOAD_VERIFICATION_DOC':
      return 'uploaded verification document';
    case 'VERIFICATION_STATUS_CHANGED':
      return 'updated verification status';
    case 'INVITE_MEMBER':
      return 'invited team member';
    case 'WITHDRAW_INVITE':
      return 'withdrew team invitation';
    case 'ACCEPT_INVITE':
      return 'joined organization';
    case 'REMOVE_MEMBER':
      return 'removed team member';
    case 'ASSIGN_ROLE':
      return 'updated role for';
    case 'CREATE_ROLE':
      return 'created role';
    case 'UPDATE_ROLE':
      return 'updated role';
    case 'DELETE_ROLE':
      return 'deleted role';
    case 'CREATE_JOB':
      return 'created job';
    case 'CLOSE_JOB':
      return 'closed job';
    case 'DELETE_JOB':
      return 'deleted job';
    case 'SEND_OFFER':
      return 'sent offer to candidate for';
    case 'SHORTLIST_APPLICATION':
      return 'shortlisted application for';
    case 'DECLINE_APPLICATION':
      return 'declined application for';
    case 'CREATE_POST':
      return 'created a post';
    case 'EDIT_POST':
      return 'edited a post';
    case 'CHANGE_VISIBILITY':
      return 'changed post visibility';
    case 'DELETE_POST':
      return 'deleted a post';
    case 'LIKE':
    case 'LIKED':
      return 'liked post by';
    case 'COMMENT':
    case 'COMMENTED':
      return 'commented on';
    case 'REPOST':
    case 'REPOSTED':
      return 'reposted post by';
    case 'SHARE_POST':
      return 'shared a post';
    case 'REPORT_POST':
      return 'reported a post';
    case 'SAVE_POST':
      return 'saved a post';
    case 'CREATE_CHANNEL':
      return 'created channel';
    case 'CREATE_ARTICLE':
      return 'created article';
    case 'EDIT_ARTICLE':
      return 'edited article';
    case 'DELETE_ARTICLE':
      return 'deleted article';
    case 'POST_THOUGHT':
      return 'posted a thought';
    case 'DELETE_THOUGHT':
      return 'deleted a thought';
    case 'REPLY_THOUGHT':
      return 'replied to';
    case 'RESOLVE_QUERY':
      return 'resolved support query';
    case 'REASSIGN_QUERY':
      return 'reassigned support query';
    case 'CLOSE_QUERY':
      return 'closed support query';
    case 'START_CHAT_SESSION':
      return 'started chat session';
    case 'ACCEPT_CONNECTION':
      return 'accepted connection request';
    case 'EXTERNAL_CONNECTION':
      return 'connected with external user';
    case 'UNAUTHORIZED_ACCESS_ATTEMPT':
      return 'attempted unauthorized access';
    case 'VIEW_USER_PROFILE':
      return 'viewed profile of';
    case 'VIEW':
    case 'VIEWED':
      return 'viewed public profile';
    case 'TRANSFER_OWNERSHIP':
      return 'transferred ownership';
    default:
      return action.replace(/_/g, ' ').toLowerCase();
  }
}

function mapActivityLog(row: any): ActivityLogEntry {
  const metadata = row.metadata || {};
  let targetName = row.target_name || metadata.targetName || metadata.roleName || metadata.title || '';
  let targetId = metadata.targetId || metadata.postId || metadata.jobId || metadata.roleId || '';
  let targetType = metadata.targetType || '';
  let linkUrl = metadata.linkUrl || '';
  let highlightedText = metadata.highlightedText || '';

  const actionUpper = (row.action || '').toUpperCase().trim();
  if (actionUpper === 'LIKE' || actionUpper === 'COMMENT' || actionUpper === 'REPOST' || actionUpper === 'CREATE_POST') {
    if (!highlightedText) highlightedText = 'post';
    if (!linkUrl && targetId) linkUrl = `/post/${targetId}`;
  } else if (actionUpper === 'CREATE_JOB' || actionUpper === 'CLOSE_JOB' || actionUpper === 'SEND_OFFER') {
    if (!highlightedText) highlightedText = 'job';
    if (!linkUrl && targetId) linkUrl = `/jobs/${targetId}`;
  } else if (actionUpper === 'ASSIGN_ROLE' || actionUpper === 'CREATE_ROLE') {
    if (!highlightedText && metadata.roleId) highlightedText = 'role';
    if (!linkUrl && metadata.roleId) linkUrl = `/team/role/${metadata.roleId}`;
  } else if (actionUpper === 'VIEW_USER_PROFILE') {
    if (!highlightedText) highlightedText = 'profile';
    if (!linkUrl && metadata.targetHandle) linkUrl = `/u/${metadata.targetHandle}`;
    else if (!linkUrl && targetId) linkUrl = `/profile/${targetId}`;
  }

  return {
    id: row.log_id || row.id,
    actorName: row.actor_name || 'Team member',
    actorAvatarUrl: row.actor_avatar || row.actor_avatar_url || '/assets/pngegg.png',
    action: formatAction(row.action, metadata),
    targetName: targetName,
    targetRole: row.target_role || row.actor_role,
    targetId: targetId,
    targetType: targetType,
    linkUrl: linkUrl,
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
  const payload = {
    ...input,
    permissions: input.permissions?.map((p) =>
      typeof p === 'string' ? p.toUpperCase().trim().replace(/\s+/g, '_') : p
    ),
  };
  const res = await api.post(`/organizations/${orgId}/teams/roles`, payload);
  return mapRole(res.data);
}

export async function updateRole(
  orgId: string,
  roleId: string,
  input: UpdateRoleInput
): Promise<TeamRole> {
  const payload = {
    ...input,
    permissions: input.permissions?.map((p) =>
      typeof p === 'string' ? p.toUpperCase().trim().replace(/\s+/g, '_') : p
    ),
  };
  const res = await api.put(`/organizations/${orgId}/teams/roles/${roleId}`, payload);
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

export interface ActivityLogCursor {
  cursorCreatedAt: string;
  cursorLogId: string;
}

export interface ActivityLogsPage {
  data: ActivityLogEntry[];
  nextCursor: ActivityLogCursor | null;
  hasMore: boolean;
}

/**
 * Cursor-paginated activity log fetch — mirrors jobsService.getMyListings so the
 * hook can drive an infinite-scroll list instead of loading the whole log in one shot.
 */
export async function getActivityLogs(
  orgId: string,
  filters?: ActivityLogFilters,
  cursor?: ActivityLogCursor | null,
  limit: number = 20
): Promise<ActivityLogsPage> {
  const params: any = { limit };

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
      const dateFromLimit = new Date();
      dateFromLimit.setHours(0, 0, 0, 0);
      if (filters.dateRange === 'last_7_days') dateFromLimit.setDate(dateFromLimit.getDate() - 7);
      else if (filters.dateRange === 'last_30_days') dateFromLimit.setDate(dateFromLimit.getDate() - 30);
      else if (filters.dateRange === 'last_90_days') dateFromLimit.setDate(dateFromLimit.getDate() - 90);
      params.dateFrom = dateFromLimit.toISOString();
    }
  }

  if (cursor?.cursorCreatedAt && cursor?.cursorLogId) {
    params.cursorCreatedAt = cursor.cursorCreatedAt;
    params.cursorLogId = cursor.cursorLogId;
  }

  const res = await api.get(`/organizations/${orgId}/teams/activity`, { params });
  const list = res.data?.data || res.data || [];
  const mapped = list.map(mapActivityLog);
  const rawCursor = res.data?.nextCursor;
  const nextCursor: ActivityLogCursor | null = rawCursor?.cursorCreatedAt && rawCursor?.cursorLogId
    ? { cursorCreatedAt: rawCursor.cursorCreatedAt, cursorLogId: rawCursor.cursorLogId }
    : null;

  return {
    data: mapped,
    nextCursor,
    hasMore: mapped.length === limit && !!nextCursor,
  };
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
