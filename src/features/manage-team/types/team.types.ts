// Permission keys matching the design screens
export type TeamPermission =
  | 'create_post'
  | 'channels'
  | 'chat'
  | 'counter'
  | 'teams'
  | 'activity_logs'
  | 'jobs'
  | 'jobs_detail'
  | 'analytics';

// Human-readable labels for permissions (used in UI)
export const PERMISSION_LABELS: Record<TeamPermission, string> = {
  create_post: 'Create post',
  channels: 'Channels',
  chat: 'Chat',
  counter: 'Counter',
  teams: 'Teams',
  activity_logs: 'Activity logs',
  jobs: 'Jobs',
  jobs_detail: 'Jobs detail',
  analytics: 'Analytics',
};

// All available permissions in display order
export const ALL_PERMISSIONS: TeamPermission[] = [
  'create_post',
  'channels',
  'chat',
  'counter',
  'teams',
  'activity_logs',
  'jobs',
  'jobs_detail',
  'analytics',
];

// Predefined role colors from the design
export const ROLE_COLORS: string[] = [
  '#FF4D4D', // Red
  '#FF8C00', // Orange
  '#FFD700', // Gold
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#00BCD4', // Cyan
  '#9C27B0', // Purple
  '#E91E63', // Pink
  '#795548', // Brown
  '#607D8B', // Blue Grey
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

// Invite candidate (for invite modal)
export interface InviteCandidate {
  id: string;
  name: string;
  avatarUrl: string;
  headline?: string;
  alreadyMember?: boolean;
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
