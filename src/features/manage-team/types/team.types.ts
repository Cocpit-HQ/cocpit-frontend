// Permission keys matching the design screens
export type TeamPermission =
  | 'CREATE_POST'
  | 'CHANNEL'
  | 'CHAT'
  | 'QUERIES'
  | 'TEAMS'
  | 'ACTIVITY_LOGS'
  | 'JOBS'
  | 'JOBS_CHAT'
  | 'ANALYTICS';

// Human-readable labels for permissions (used in UI)
export const PERMISSION_LABELS: Record<string, string> = {
  CREATE_POST: 'Create post',
  CHANNEL: 'Channel',
  CHAT: 'Chat',
  QUERIES: 'Queries',
  TEAMS: 'Teams',
  ACTIVITY_LOGS: 'Activity logs',
  JOBS: 'Jobs',
  JOBS_CHAT: 'Jobs chat',
  ANALYTICS: 'Analytics',
  // System / RBAC permission key mappings
  SWITCH_TO_COMPANY: 'Switch to company',
  MANAGE_COMPANY: 'Manage company',
  MANAGE_COMPANY_DETAILS: 'Manage company details',
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


// All available permissions in display order
export const ALL_PERMISSIONS: TeamPermission[] = [
  'CREATE_POST',
  'CHANNEL',
  'CHAT',
  'QUERIES',
  'TEAMS',
  'ACTIVITY_LOGS',
  'JOBS',
  'JOBS_CHAT',
  'ANALYTICS',
];

// Predefined role colors from the design
export const ROLE_COLORS: string[] = [
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
  details?: string;
  highlightedText?: string;
  timestamp: string;
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
