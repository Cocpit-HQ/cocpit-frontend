// Permission keys matching the design screens
export type TeamPermission =
  | 'CREATE_POST'
  | 'MANAGE_COMPANY_DETAILS'
  | 'REPORT_BLOCK'
  | 'CHANNEL'
  | 'CHAT'
  | 'TEAMS'
  | 'ACTIVITY_LOGS'
  | 'JOBS'
  | 'JOBS_CHAT'
  | 'ANALYTICS'
  | 'SETTINGS';

// Human-readable labels for permissions (used in UI)
export const PERMISSION_LABELS: Record<string, string> = {
  CREATE_POST: 'Post & Interactions',
  MANAGE_COMPANY_DETAILS: 'Profile Management',
  REPORT_BLOCK: 'Report/Block',
  CHANNEL: 'Channel',
  CHAT: 'Chat',
  TEAMS: 'Teams',
  ACTIVITY_LOGS: 'Activity logs',
  JOBS: 'Jobs',
  JOBS_CHAT: 'Jobs chat',
  ANALYTICS: 'Analytics',
  SETTINGS: 'Settings',
  // System / RBAC permission key mappings
  SWITCH_TO_COMPANY: 'Switch to company',
  MANAGE_COMPANY: 'Manage company',
  MANAGE_SETTINGS: 'Manage settings',
  MANAGE_ROLES: 'Manage roles',
  MANAGE_MEMBERS: 'Manage members',
  INVITE_MEMBERS: 'Invite members',
  REMOVE_MEMBERS: 'Remove members',
  VIEW_MEMBERS: 'View members',
  POST_JOBS: 'Post jobs',
  VIEW_JOBS: 'View jobs',
  MANAGE_JOBS: 'Manage jobs',
  VIEW_APPLICANTS: 'View applicants',
  MANAGE_APPLICANTS: 'Manage applicants',
  CREATE_CONTENT: 'Create content',
  MANAGE_COMMENTS: 'Manage comments',
  VIEW_ANALYTICS: 'View analytics',
  '*': 'All permissions',
};

export function getPermissionLabel(perm: string): string {
  if (!perm) return '';
  const upper = String(perm).toUpperCase().trim();
  if (PERMISSION_LABELS[upper]) {
    return PERMISSION_LABELS[upper];
  }
  const formatted = upper
    .toLowerCase()
    .replace(/_/g, ' ')
    .trim();
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}


// All available permissions in display order (Channels removed per SCRUM-1132)
export const ALL_PERMISSIONS: TeamPermission[] = [
  'CREATE_POST',
  'MANAGE_COMPANY_DETAILS',
  'CHAT',
  'TEAMS',
  'ACTIVITY_LOGS',
  'JOBS',
  'JOBS_CHAT',
  'ANALYTICS',
  'SETTINGS',
];

// Predefined role colors from the design
export const ROLE_COLORS: string[] = [
  '#06B6D4',
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#10B981',
  '#14B8A6',
  '#3B82F6',
  '#8B5CF6',
  '#6366F1',
  '#EC4899',
  '#64748B',
];

// Role entity (maps to organization_roles table)
export interface TeamRole {
  id: string;
  orgId: string;
  name: string;
  color: string;
  description?: string;
  permissions: TeamPermission[];
  priority: number;
  isSystemRole: boolean;
  memberCount: number;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

// Member entity (maps to organization_members table)
export interface TeamMember {
  id: string;
  userId?: string;
  orgId: string;
  name: string;
  avatarUrl: string;
  email?: string;
  headline?: string;
  roleId?: string;
  roleName?: string;
  roleColor?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_INVITE' | 'REMOVED';
  joinedAt: string;
  inviteId?: string;
  isOwner?: boolean;
}

// Activity log entry
export interface ActivityLogEntry {
  id: string;
  actorName: string;
  actorAvatarUrl: string;
  action: string;
  targetName?: string;
  targetRole?: string;
  targetId?: string;
  targetType?: string;
  linkUrl?: string;
  targetLinkUrl?: string;
  highlightedLinkUrl?: string;
  details?: string;
  highlightedText?: string;
  suffixText?: string;
  timestamp: string;
  isTargetClickable?: boolean;
}

// Filter state for activity logs
export interface ActivityLogFilters {
  search: string;
  roleId: string;
  memberId: string;
  dateRange: string;
}

export interface InviteCandidate {
  id: string;
  name: string;
  avatarUrl: string;
  headline?: string;
  alreadyMember?: boolean;
}

export interface PendingInvitation {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string;
  email?: string;
  headline?: string;
  roleId: string;
  roleName: string;
  roleColor?: string;
  invitedAt: string;
}

export interface UserPendingInvitation {
  invite_id: string;
  org_id: string;
  org_name: string;
  org_logo: string;
  role: string;
  role_id: string;
  token: string;
  expires_at: string;
  invited_at: string;
  inviter_name: string;
  inviter_avatar: string;
}

// Input types for mutations
export interface CreateRoleInput {
  name: string;
  color: string;
  description?: string;
  permissions: TeamPermission[];
}

export interface UpdateRoleInput {
  name?: string;
  color?: string;
  description?: string;
  permissions?: TeamPermission[];
}
