// Permission keys matching the design screens
export type TeamPermission =
  | 'create_post'
  | 'channels'
  | 'chat'
  | 'queries'
  | 'teams'
  | 'activity_logs'
  | 'jobs'
  | 'jobs_chat'
  | 'analytics';

// Human-readable labels for permissions (used in UI)
export const PERMISSION_LABELS: Record<TeamPermission, string> = {
  create_post: 'Create post',
  channels: 'Channel',
  chat: 'Chat',
  queries: 'Queries',
  teams: 'Teams',
  activity_logs: 'Activity logs',
  jobs: 'Jobs',
  jobs_chat: 'Jobs chat',
  analytics: 'Analytics',
};

// All available permissions in display order
export const ALL_PERMISSIONS: TeamPermission[] = [
  'create_post',
  'channels',
  'chat',
  'queries',
  'teams',
  'activity_logs',
  'jobs',
  'jobs_chat',
  'analytics',
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
