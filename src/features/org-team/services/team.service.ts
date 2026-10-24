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

function parsePermissionsList(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') return [parsed];
    } catch (e) {
      return raw.split(',').map((s) => s.trim());
    }
  }
  return [];
}

/** Maps a snake_case role row from the backend to a camelCase TeamRole */
function mapRole(row: any): TeamRole {
  const rawPerms = parsePermissionsList(row.permissions);
  const permissions = rawPerms
    .map((p: any) => (typeof p === 'string' ? p.toUpperCase().trim().replace(/\s+/g, '_') : ''))
    .filter((p: string) => p.length > 0 && p !== 'CHANNEL' && p !== 'CHANNELS');

  const roleName = row.name || '';
  const isDefaultAdmin = roleName.toLowerCase() === 'admin' || roleName.toLowerCase() === 'owner';
  const roleColor = isDefaultAdmin ? '#06B6D4' : (row.color || '#808080');

  return {
    id: row.role_id || row.id,
    orgId: row.org_id || row.orgId,
    name: roleName,
    color: roleColor,
    description: row.description || '',
    permissions: permissions as any,
    priority: row.priority ?? 0,
    isSystemRole: row.is_system_role ?? row.isSystemRole ?? false,
    memberCount: row.member_count ?? row.memberCount ?? 0,
    members: Array.isArray(row.members) ? row.members.map((m: any) => ({
      ...m,
      avatarUrl: m.avatar || m.avatar_url || m.avatarUrl || m.user?.avatar || m.user?.avatar_url || '',
      id: m.id || m.user_id,
      userId: m.user_id || m.userId || m.id,
      name: m.name || m.full_name,
      status: m.status || 'ACTIVE',
      inviteId: m.invite_id,
      isOwner: Boolean(m.is_owner ?? m.isOwner),
    })) : [],
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
  };
}

function mapMember(row: any): TeamMember {
  return {
    id: row.user_id || row.id,
    userId: row.user_id || row.userId || row.id,
    orgId: row.org_id || '',
    name: row.full_name || row.name,
    avatarUrl: row.avatar || row.avatar_url || row.avatarUrl || row.user?.avatar || row.user?.avatar_url || '',
    email: row.email,
    headline: row.headline,
    roleId: row.role_id || row.roleId,
    roleName: row.role_name || row.roleName,
    roleColor: row.role_color || row.roleColor,
    status: row.status,
    joinedAt: row.joined_at || row.joinedAt,
  };
}

function formatAction(action: string, metadata?: any): string {
  if (!action) return 'performed an activity';
  const upper = action.toUpperCase().trim();
  switch (upper) {
    case 'ACTOR_SWITCH':
      return 'successfully switched to the Organization account.';
    case 'CREATE_ORGANIZATION':
    case 'CREATE_PAGE':
    case 'ONBOARDING_COMPLETED':
      return 'created the Organization account.';
    case 'UPDATE_PROFILE':
    case 'UPDATE_PROFILE_DETAILS':
      return 'updated company details';
    case 'UPLOAD_VERIFICATION_DOC':
      return 'uploaded verification document';
    case 'VERIFICATION_STATUS_CHANGED':
      return 'updated verification status';
    case 'INVITE_MEMBER':
      return 'invited';
    case 'WITHDRAW_INVITE':
      return 'withdrew invitation for';
    case 'ACCEPT_INVITE':
    case 'JOIN_ORGANIZATION':
      return 'joined organization';
    case 'DECLINE_INVITE':
    case 'DECLINE_INVITATION':
      return 'declined invitation';
    case 'REMOVE_MEMBER':
      return 'removed';
    case 'LEAVE_ORGANIZATION':
    case 'LEAVE_TEAM':
      return 'left the organization';
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
      return 'created a';
    case 'EDIT_POST':
    case 'UPDATE_POST':
      return 'edited a';
    case 'CHANGE_VISIBILITY':
      return 'changed post visibility';
    case 'DELETE_POST':
      return 'deleted a';
    case 'LIKE':
    case 'LIKED':
      return 'liked post by';
    case 'COMMENT':
    case 'COMMENTED':
      return 'commented on';
    case 'REPOST':
    case 'REPOSTED':
      return metadata.authorName || metadata.targetName ? 'reposted post by' : 'reposted a';
    case 'SHARE_POST':
      return 'shared a';
    case 'REPORT_POST':
      return 'reported a';
    case 'SAVE_POST':
      return 'saved a';
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
      return 'viewed';
    case 'UPDATE_LOGO':
      return 'updated company logo';
    case 'DELETE_LOGO':
    case 'REMOVE_LOGO':
      return 'removed company logo';
    case 'UPDATE_COVER':
      return 'updated company cover banner';
    case 'DELETE_COVER':
    case 'REMOVE_COVER':
      return 'removed company cover banner';
    case 'VIEW':
    case 'VIEWED':
      return 'viewed public profile';
    case 'TRANSFER_OWNERSHIP':
      return 'transferred ownership to';
    case 'ORGANIZATION_BLOCK_ADDED':
    case 'ORGANIZATION_BLOCK_ADD':
    case 'BLOCK_USER':
    case 'BLOCK_ORGANIZATION':
    case 'ORGANIZATION_BLOCK':
    case 'BLOCK':
      return 'blocked';
    case 'ORGANIZATION_BLOCK_REMOVED':
    case 'ORGANIZATION_BLOCK_REMOVE':
    case 'UNBLOCK_USER':
    case 'UNBLOCK_ORGANIZATION':
    case 'ORGANIZATION_UNBLOCK':
    case 'UNBLOCK':
      return 'unblocked';
    case 'DOCUMENTS_SUBMITTED':
    case 'SUBMIT_DOCUMENTS':
    case 'DOCUMENT_SUBMITTED':
      return 'submitted verification documents';
    case 'DOMAIN_VERIFIED':
      return 'verified company domain';
    case 'ORGANIZATION_DEACTIVATED':
    case 'DEACTIVATE_ORGANIZATION':
    case 'DEACTIVATE_COMPANY':
      return 'deactivated the company page';
    case 'ORGANIZATION_REACTIVATED':
    case 'REACTIVATE_ORGANIZATION':
    case 'REACTIVATE_COMPANY':
      return 'reactivated the company page';
    case 'ORGANIZATION_SCHEDULED_FOR_DELETION':
    case 'DELETE_ORGANIZATION':
    case 'DELETE_COMPANY':
    case 'DELETE':
      return 'scheduled company page for deletion';
    case 'ORGANIZATION_RECOVERED':
    case 'RECOVER_ORGANIZATION':
    case 'RESTORE_ORGANIZATION':
    case 'RESTORE_COMPANY':
      return 'recovered the company page';
    case 'ORGANIZATION_NOTIFICATIONS_UPDATED': {
      const state = metadata?.state || (metadata?.newValue === false ? 'off' : 'on');
      return `turned ${state}`;
    }
    default:
      if (upper.includes('UNBLOCK') || upper.includes('BLOCK_REMOVED') || upper.includes('BLOCK_REMOVE')) {
        return 'unblocked';
      }
      if (upper.includes('BLOCK_ADDED') || upper.includes('BLOCK_ADD')) {
        return 'blocked';
      }
      return action.replace(/_/g, ' ').toLowerCase();
  }
}

function mapActivityLog(row: any): ActivityLogEntry {
  const metadata = row.metadata || {};
  let targetName = row.target_name || metadata.targetName || metadata.targetUserName || metadata.name || '';
  let targetId = metadata.targetUserId || metadata.removedUserId || metadata.targetId || metadata.postId || metadata.id || metadata.jobId || metadata.roleId || '';
  let targetType = metadata.targetType || '';
  let linkUrl = metadata.linkUrl || '';
  let targetLinkUrl = '';
  let highlightedLinkUrl = '';
  let highlightedText = metadata.highlightedText || '';
  let suffixText = '';
  let isTargetClickable = true;
  const roleId = row.role_id || metadata.roleId || metadata.role_id || '';

  let actionFormatted = formatAction(row.action, metadata);

  const actionUpper = (row.action || '').toUpperCase().trim();
  if (
    actionUpper === 'ACTOR_SWITCH' ||
    actionUpper === 'CREATE_ORGANIZATION' ||
    actionUpper === 'CREATE_PAGE' ||
    actionUpper === 'ONBOARDING_COMPLETED' ||
    actionUpper === 'UPDATE_LOGO' ||
    actionUpper === 'DELETE_LOGO' ||
    actionUpper === 'REMOVE_LOGO' ||
    actionUpper === 'UPDATE_COVER' ||
    actionUpper === 'DELETE_COVER' ||
    actionUpper === 'REMOVE_COVER' ||
    actionUpper === 'UPDATE_PROFILE' ||
    actionUpper === 'UPDATE_PROFILE_DETAILS' ||
    actionUpper === 'DOCUMENTS_SUBMITTED' ||
    actionUpper === 'SUBMIT_DOCUMENTS' ||
    actionUpper === 'DOCUMENT_SUBMITTED' ||
    actionUpper === 'DOMAIN_VERIFIED' ||
    actionUpper === 'ORGANIZATION_DEACTIVATED' ||
    actionUpper === 'DEACTIVATE_ORGANIZATION' ||
    actionUpper === 'DEACTIVATE_COMPANY' ||
    actionUpper === 'ORGANIZATION_REACTIVATED' ||
    actionUpper === 'REACTIVATE_ORGANIZATION' ||
    actionUpper === 'REACTIVATE_COMPANY' ||
    actionUpper === 'ORGANIZATION_SCHEDULED_FOR_DELETION' ||
    actionUpper === 'DELETE_ORGANIZATION' ||
    actionUpper === 'DELETE_COMPANY' ||
    actionUpper === 'DELETE' ||
    actionUpper === 'ORGANIZATION_RECOVERED' ||
    actionUpper === 'RECOVER_ORGANIZATION' ||
    actionUpper === 'RESTORE_ORGANIZATION' ||
    actionUpper === 'RESTORE_COMPANY'
  ) {
    targetName = '';
    highlightedText = '';
  } else if (actionUpper === 'INVITE_MEMBER') {
    if (!targetName && metadata.email) {
      targetName = metadata.email;
    }
    if (!targetName) {
      targetName = 'team member';
    }
    if (metadata.roleName || metadata.role) {
      highlightedText = `as ${metadata.roleName || metadata.role}`;
      if (roleId) {
        highlightedLinkUrl = `/team/role/${roleId}`;
      }
    }
    if (metadata.targetUserId || row.target_user_id) {
      targetLinkUrl = `/profile/${metadata.targetUserId || row.target_user_id}`;
    }
  } else if (actionUpper === 'WITHDRAW_INVITE') {
    if (!targetName && metadata.email) {
      targetName = metadata.email;
    }
    if (!targetName) {
      targetName = 'team member';
    }
    if (metadata.targetUserId || row.target_user_id) {
      targetLinkUrl = `/profile/${metadata.targetUserId || row.target_user_id}`;
      linkUrl = targetLinkUrl;
    }
  } else if (actionUpper === 'ASSIGN_ROLE') {
    if (!targetName) {
      targetName = 'team member';
    }
    if (metadata.roleName || metadata.role) {
      highlightedText = `as ${metadata.roleName || metadata.role}`;
      if (roleId) {
        highlightedLinkUrl = `/team/role/${roleId}`;
      }
    }
    if (metadata.targetUserId || row.target_user_id) {
      targetLinkUrl = `/profile/${metadata.targetUserId || row.target_user_id}`;
    }
  } else if (actionUpper === 'REMOVE_MEMBER') {
    if (!targetName) {
      targetName = 'team member';
    }
    if (metadata.targetUserId || metadata.removedUserId || row.target_user_id) {
      targetLinkUrl = `/profile/${metadata.targetUserId || metadata.removedUserId || row.target_user_id}`;
      linkUrl = targetLinkUrl;
    }
  } else if (actionUpper === 'TRANSFER_OWNERSHIP') {
    if (!targetName) {
      targetName = 'team member';
    }
    const targetUserId = metadata.targetUserId || metadata.to || row.target_user_id;
    if (targetUserId) {
      targetLinkUrl = `/profile/${targetUserId}`;
      linkUrl = targetLinkUrl;
    }
  } else if (actionUpper === 'ACCEPT_INVITE' || actionUpper === 'JOIN_ORGANIZATION') {
    targetName = '';
    if (metadata.roleName || metadata.role) {
      highlightedText = `as ${metadata.roleName || metadata.role}`;
      if (roleId) {
        highlightedLinkUrl = `/team/role/${roleId}`;
      }
    }
  } else if (actionUpper === 'DECLINE_INVITE' || actionUpper === 'DECLINE_INVITATION') {
    targetName = '';
    if (metadata.roleName || metadata.role) {
      highlightedText = `as ${metadata.roleName || metadata.role}`;
      if (roleId) {
        highlightedLinkUrl = `/team/role/${roleId}`;
      }
    }
  } else if (actionUpper === 'LEAVE_ORGANIZATION' || actionUpper === 'LEAVE_TEAM') {
    targetName = '';
    if (metadata.roleName || metadata.role) {
      highlightedText = `as ${metadata.roleName || metadata.role}`;
      if (roleId) {
        highlightedLinkUrl = `/team/role/${roleId}`;
      }
    }
  } else if (actionUpper === 'CREATE_ROLE' || actionUpper === 'UPDATE_ROLE' || actionUpper === 'DELETE_ROLE') {
    if (!targetName) {
      targetName = metadata.roleName || '';
    }
    if (roleId && actionUpper !== 'DELETE_ROLE') {
      targetLinkUrl = `/team/role/${roleId}`;
      linkUrl = targetLinkUrl;
    }
  } else if (actionUpper === 'LIKE' || actionUpper === 'LIKED') {
    const author = (targetName || metadata.authorName || '').trim();
    targetName = '';
    highlightedText = 'post';
    if (author) {
      actionFormatted = 'liked';
      suffixText = `by ${author}`;
    } else {
      actionFormatted = 'liked a';
    }
    if (!linkUrl && targetId) linkUrl = `/post/${targetId}`;
    highlightedLinkUrl = linkUrl;
  } else if (actionUpper === 'COMMENT' || actionUpper === 'COMMENTED') {
    actionFormatted = 'commented on';
    const rawAuthor = (targetName || metadata.authorName || metadata.postAuthorName || '').trim();
    if (rawAuthor) {
      const apostrophe = rawAuthor.endsWith('s') || rawAuthor.endsWith('S') ? "'" : "'s";
      targetName = `${rawAuthor}${apostrophe}`;
    } else {
      targetName = '';
    }
    highlightedText = 'post';
    const postId = metadata.postId || metadata.post_id || targetId;
    if (postId) {
      highlightedLinkUrl = `/post/${postId}`;
      linkUrl = `/post/${postId}`;
    }
    isTargetClickable = false;
  } else if (actionUpper === 'REPOST' || actionUpper === 'REPOSTED') {
    const author = (targetName || metadata.authorName || '').trim();
    targetName = '';
    highlightedText = 'post';
    if (author) {
      actionFormatted = 'reposted';
      suffixText = `by ${author}`;
    } else {
      actionFormatted = 'reposted a';
    }
    const postId = metadata.postId || metadata.id || targetId;
    if (postId) {
      highlightedLinkUrl = `/post/${postId}`;
      linkUrl = `/post/${postId}`;
    }
  } else if (
    actionUpper === 'CREATE_POST' ||
    actionUpper === 'EDIT_POST' ||
    actionUpper === 'UPDATE_POST' ||
    actionUpper === 'DELETE_POST' ||
    actionUpper === 'SHARE_POST' ||
    actionUpper === 'REPORT_POST' ||
    actionUpper === 'SAVE_POST'
  ) {
    targetName = '';
    if (!highlightedText) highlightedText = 'post';
    if (!linkUrl && targetId && actionUpper !== 'DELETE_POST') linkUrl = `/post/${targetId}`;
    highlightedLinkUrl = linkUrl;
  } else if (actionUpper === 'CREATE_JOB' || actionUpper === 'CLOSE_JOB' || actionUpper === 'DELETE_JOB' || actionUpper === 'SEND_OFFER') {
    if (!targetName) targetName = metadata.jobTitle || metadata.title || '';
    if (!linkUrl && targetId && actionUpper !== 'DELETE_JOB') linkUrl = `/jobs/${targetId}`;
    targetLinkUrl = linkUrl;
  } else if (actionUpper === 'VIEW_USER_PROFILE') {
    actionFormatted = 'viewed';
    const rawTargetName = (targetName || metadata.targetName || metadata.targetUserName || metadata.name || '').trim();
    if (rawTargetName) {
      const apostrophe = rawTargetName.endsWith('s') || rawTargetName.endsWith('S') ? "'" : "'s";
      targetName = `${rawTargetName}${apostrophe}`;
    } else {
      targetName = '';
      actionFormatted = 'viewed a';
    }
    highlightedText = 'profile';

    // Normalize any legacy '/u/' route to '/profile/'
    if (linkUrl && linkUrl.startsWith('/u/')) {
      linkUrl = linkUrl.replace(/^\/u\//, '/profile/');
    }
    if (!linkUrl) {
      const handleOrId = metadata.targetHandle || targetId || metadata.targetUserId || row.target_user_id;
      if (handleOrId) {
        linkUrl = `/profile/${handleOrId}`;
      }
    }
    highlightedLinkUrl = linkUrl;
    targetLinkUrl = linkUrl;
  } else if (
    actionUpper === 'ORGANIZATION_BLOCK_ADDED' ||
    actionUpper === 'ORGANIZATION_BLOCK_REMOVED' ||
    actionUpper === 'ORGANIZATION_BLOCK_ADD' ||
    actionUpper === 'ORGANIZATION_BLOCK_REMOVE' ||
    actionUpper === 'BLOCK_USER' ||
    actionUpper === 'UNBLOCK_USER' ||
    actionUpper === 'BLOCK_ORGANIZATION' ||
    actionUpper === 'UNBLOCK_ORGANIZATION' ||
    actionUpper === 'ORGANIZATION_BLOCK' ||
    actionUpper === 'ORGANIZATION_UNBLOCK' ||
    actionUpper === 'BLOCK' ||
    actionUpper === 'UNBLOCK' ||
    actionUpper.includes('BLOCK')
  ) {
    if (!targetName) {
      targetName = metadata.targetName || metadata.blockedName || metadata.targetUserName || metadata.name || '';
    }
    if (!targetName) {
      targetName = metadata.targetType === 'company' || metadata.type === 'company' ? 'organization' : 'user';
    }
    highlightedText = '';
    const blockTargetId = metadata.targetId || metadata.blockedId || targetId;
    if (!linkUrl && blockTargetId) {
      linkUrl = `/profile/${blockTargetId}`;
    }
    targetLinkUrl = linkUrl;
  } else if (actionUpper === 'ORGANIZATION_NOTIFICATIONS_UPDATED') {
    const state = metadata?.state || (metadata?.newValue === false ? 'off' : 'on');
    actionFormatted = `turned ${state}`;
    targetName = '';
    highlightedText = metadata?.settingLabel || metadata?.label || 'notifications';
  } else {
    if (!targetName) {
      targetName = metadata.roleName || metadata.title || '';
    }
    if (roleId) {
      targetLinkUrl = `/team/role/${roleId}`;
    }
  }

  return {
    id: row.log_id || row.id,
    actorName: row.actor_name || 'Team member',
    actorAvatarUrl: row.actor_avatar || row.actor_avatar_url || '/assets/pngegg.png',
    action: actionFormatted,
    targetName: targetName,
    targetRole: row.target_role || row.actor_role,
    targetId: targetId,
    targetType: targetType,
    linkUrl: linkUrl,
    targetLinkUrl: targetLinkUrl,
    highlightedLinkUrl: highlightedLinkUrl,
    details: row.details || (row.metadata ? JSON.stringify(row.metadata) : ''),
    highlightedText: highlightedText,
    suffixText: suffixText,
    timestamp: row.created_at || row.timestamp,
    isTargetClickable: isTargetClickable,
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
  const roles: TeamRole[] = (res.data || []).map(mapRole);

  // Merge Owner role into Admin role transparently for the frontend
  const ownerRoleIndex = roles.findIndex(r => r.name.toUpperCase() === 'OWNER');
  const adminRoleIndex = roles.findIndex(r => r.name.toUpperCase() === 'ADMIN');

  if (ownerRoleIndex !== -1 && adminRoleIndex !== -1) {
    const ownerRole = roles[ownerRoleIndex];
    const adminRole = roles[adminRoleIndex];

    // Inject Owner members into Admin, flagged as owners (deduplicating by id/userId)
    const existingIds = new Set(adminRole.members.map(m => m.id || m.userId));
    const uniqueOwnerMembers = ownerRole.members
      .filter(m => !existingIds.has(m.id || m.userId))
      .map(m => ({ ...m, isOwner: true }));

    const mergedMembers = [...uniqueOwnerMembers, ...adminRole.members];

    roles[adminRoleIndex] = {
      ...adminRole,
      members: mergedMembers,
      memberCount: mergedMembers.length,
    };

    // Remove the Owner role from the list
    roles.splice(ownerRoleIndex, 1);
  }

  return roles;
}

export async function getRoleById(
  orgId: string,
  roleId: string
): Promise<TeamRole | null> {
  try {
    const res = await api.get(`/organizations/${orgId}/teams/roles/${roleId}`);
    const role = mapRole(res.data);

    // If Admin role, merge Owner members into it transparently
    if (role.name.toUpperCase() === 'ADMIN') {
      const allRolesRes = await api.get(`/organizations/${orgId}/teams/roles`);
      const rawRoles: TeamRole[] = (allRolesRes.data || []).map(mapRole);
      const ownerRole = rawRoles.find(r => r.name.toUpperCase() === 'OWNER');
      if (ownerRole) {
        const existingIds = new Set(role.members.map(m => m.id || m.userId));
        const uniqueOwnerMembers = ownerRole.members
          .filter(m => !existingIds.has(m.id || m.userId))
          .map(m => ({ ...m, isOwner: true }));
        const mergedMembers = [...uniqueOwnerMembers, ...role.members];
        return {
          ...role,
          members: mergedMembers,
          memberCount: mergedMembers.length,
        };
      }
    }

    return role;
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
    permissions: input.permissions
      ?.filter((p) => typeof p === 'string' && p.toUpperCase().trim() !== 'CHANNEL' && p.toUpperCase().trim() !== 'CHANNELS')
      ?.map((p) =>
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
    permissions: input.permissions
      ?.filter((p) => typeof p === 'string' && p.toUpperCase().trim() !== 'CHANNEL' && p.toUpperCase().trim() !== 'CHANNELS')
      ?.map((p) =>
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
    email: item.email || undefined,
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

export async function batchDeclineTeamInvites(tokens: string[]): Promise<any> {
  const res = await api.post('/organizations/teams/invites/batch-decline', { tokens });
  return res.data;
}
