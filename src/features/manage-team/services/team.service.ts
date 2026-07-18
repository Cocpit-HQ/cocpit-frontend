/**
 * Team Management Service
 *
 * NOTE: Backend APIs are NOT ready yet.
 * All functions return dummy data with simulated async delays.
 * When backend is ready, replace dummy returns with actual api calls.
 *
 * Endpoint paths are TBD — will be filled in once the backend team
 * finalizes the API contract.
 */

// import api from '@/lib/axios'; // Uncomment when backend is ready
import {
  TeamRole,
  TeamMember,
  ActivityLogEntry,
  ActivityLogFilters,
  InviteCandidate,
  CreateRoleInput,
  UpdateRoleInput,
} from '../types/team.types';
import {
  DUMMY_ROLES,
  DUMMY_MEMBERS,
  DUMMY_ACTIVITY_LOGS,
  DUMMY_INVITE_CANDIDATES,
} from '../utils/dummy-team-data';

// Simulated network delay
const delay = (ms: number = 300) => new Promise((r) => setTimeout(r, ms));

// ─── Roles ────────────────────────────────────────────────────────────────────

export async function getTeamRoles(orgId: string): Promise<TeamRole[]> {
  // TODO: Replace with api.get(`/organizations/${orgId}/roles`)
  await delay();
  return DUMMY_ROLES.filter((r) => r.orgId === 'org-demo');
}

export async function getRoleById(
  orgId: string,
  roleId: string
): Promise<TeamRole | null> {
  // TODO: Replace with api.get(`/organizations/${orgId}/roles/${roleId}`)
  await delay();
  return DUMMY_ROLES.find((r) => r.id === roleId) ?? null;
}

export async function createRole(
  orgId: string,
  input: CreateRoleInput
): Promise<TeamRole> {
  // TODO: Replace with api.post(`/organizations/${orgId}/roles`, input)
  await delay(500);
  const newRole: TeamRole = {
    id: `role-${Date.now()}`,
    orgId,
    name: input.name,
    color: input.color,
    description: input.description,
    permissions: input.permissions,
    priority: DUMMY_ROLES.length,
    isSystemRole: false,
    memberCount: 0,
    members: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  DUMMY_ROLES.push(newRole);
  return newRole;
}

export async function updateRole(
  orgId: string,
  roleId: string,
  input: UpdateRoleInput
): Promise<TeamRole> {
  // TODO: Replace with api.put(`/organizations/${orgId}/roles/${roleId}`, input)
  await delay(500);
  const existing = DUMMY_ROLES.find((r) => r.id === roleId);
  if (!existing) throw new Error('Role not found');
  Object.assign(existing, {
    ...input,
    permissions: input.permissions ?? existing.permissions,
    updatedAt: new Date().toISOString(),
  });
  return existing;
}

export async function deleteRole(
  orgId: string,
  roleId: string
): Promise<boolean> {
  // TODO: Replace with api.delete(`/organizations/${orgId}/roles/${roleId}`)
  await delay(500);
  const index = DUMMY_ROLES.findIndex((r) => r.id === roleId);
  if (index !== -1) {
    DUMMY_ROLES.splice(index, 1);
  }
  return true;
}

// ─── Members ──────────────────────────────────────────────────────────────────

export async function getTeamMembers(orgId: string): Promise<TeamMember[]> {
  // TODO: Replace with api.get(`/organizations/${orgId}/members`)
  await delay();
  return DUMMY_MEMBERS;
}

export async function getRoleMembers(
  orgId: string,
  roleId: string
): Promise<TeamMember[]> {
  // TODO: Replace with api.get(`/organizations/${orgId}/roles/${roleId}/members`)
  await delay();
  return DUMMY_MEMBERS.filter((m) => m.roleId === roleId);
}

export async function inviteMember(
  orgId: string,
  userId: string,
  roleId?: string
): Promise<boolean> {
  // TODO: Replace with api.post(`/organizations/${orgId}/members/invite`, { userId, roleId })
  await delay(500);
  return true;
}

export async function removeMember(
  orgId: string,
  userId: string
): Promise<boolean> {
  // TODO: Replace with api.delete(`/organizations/${orgId}/members/${userId}`)
  await delay(500);
  return true;
}

export async function updateMemberRole(
  orgId: string,
  userId: string,
  roleId: string
): Promise<boolean> {
  // TODO: Replace with api.put(`/organizations/${orgId}/members/${userId}/role`, { roleId })
  await delay(500);
  return true;
}

// ─── Activity Logs ────────────────────────────────────────────────────────────

export async function getActivityLogs(
  orgId: string,
  filters?: ActivityLogFilters
): Promise<ActivityLogEntry[]> {
  // TODO: Replace with api.get(`/organizations/${orgId}/activity-logs`, { params: filters })
  await delay();
  let logs = [...DUMMY_ACTIVITY_LOGS];

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    logs = logs.filter(
      (l) =>
        l.actorName.toLowerCase().includes(q) ||
        l.targetName?.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q)
    );
  }

  return logs;
}

// ─── Invite Candidates ───────────────────────────────────────────────────────

export async function getInviteCandidates(
  orgId: string,
  search: string
): Promise<InviteCandidate[]> {
  // TODO: Replace with api.get(`/organizations/${orgId}/members/invite-suggestions`, { params: { search } })
  await delay();
  if (!search) return DUMMY_INVITE_CANDIDATES;
  const q = search.toLowerCase();
  return DUMMY_INVITE_CANDIDATES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.headline?.toLowerCase().includes(q)
  );
}
