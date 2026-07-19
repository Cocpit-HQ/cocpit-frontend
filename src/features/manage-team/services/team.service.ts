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
    actorAvatarUrl: row.actor_avatar_url,
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
): Promise<boolean> {
  await api.post(`/organizations/${orgId}/teams/invite`, { userId, roleId });
  return true;
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
  const res = await api.get(`/organizations/${orgId}/teams/activity`, { params: filters });
  const list = res.data?.data || res.data || [];
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
