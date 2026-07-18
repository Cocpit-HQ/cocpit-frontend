import {
  TeamRole,
  TeamMember,
  ActivityLogEntry,
  InviteCandidate,
} from '../types/team.types';

// ─── Dummy Members ────────────────────────────────────────────────────────────

export const DUMMY_MEMBERS: TeamMember[] = [
  {
    id: 'user-1',
    orgId: 'org-demo',
    name: 'John Doe',
    avatarUrl: '/images/Team/profile_team.png', // Fallback will show default
    headline: 'sophia.turner@example.com',
    roleId: 'role-2',
    roleName: 'Marketing',
    roleColor: '#EF4444',
    status: 'ACTIVE',
    joinedAt: '2026-02-10T09:00:00.000Z',
  },
  {
    id: 'user-2',
    orgId: 'org-demo',
    name: 'Elena Rodriquez',
    avatarUrl: '/images/Team/profile_team.png', // Fallback will show default
    headline: 'ethan.carter@example.com',
    roleId: 'role-2',
    roleName: 'Marketing',
    roleColor: '#EF4444',
    status: 'ACTIVE',
    joinedAt: '2026-02-10T09:00:00.000Z',
  },
  {
    id: 'user-3',
    orgId: 'org-demo',
    name: 'Liam Brooks',
    avatarUrl: '/images/Team/profile_team.png', // Fallback will show default
    headline: 'liam.brooks@example.com',
    roleId: 'role-2',
    roleName: 'Marketing',
    roleColor: '#EF4444',
    status: 'ACTIVE',
    joinedAt: '2026-02-10T09:00:00.000Z',
  },
];

// ─── Dummy Roles ──────────────────────────────────────────────────────────────

export const DUMMY_ROLES: TeamRole[] = [
  {
    id: 'role-2',
    orgId: 'org-demo',
    name: 'Admin',
    color: '#06b6d4', // cyan-500 from the design screenshot
    description:
      'Full access to all organization settings, team management, and administrative controls.',
    permissions: [
      'create_post',
      'channels',
      'chat',
      'queries',
      'teams',
      'activity_logs',
      'jobs',
      'jobs_chat',
      'analytics',
    ],
    priority: 0,
    isSystemRole: true,
    memberCount: 1,
    members: DUMMY_MEMBERS.filter((m) => m.roleId === 'role-2'),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'role-3',
    orgId: 'org-demo',
    name: 'Manager',
    color: '#8b5cf6', // violet-500
    description: 'Can manage teams and view analytics.',
    permissions: ['teams', 'activity_logs', 'analytics'],
    priority: 1,
    isSystemRole: false,
    memberCount: 0,
    members: [],
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'role-4',
    orgId: 'org-demo',
    name: 'Member',
    color: '#10b981', // emerald-500
    description: 'Standard member access.',
    permissions: ['create_post', 'chat', 'channels'],
    priority: 2,
    isSystemRole: false,
    memberCount: 0,
    members: [],
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
  },
];

// ─── Dummy Activity Logs ──────────────────────────────────────────────────────

export const DUMMY_ACTIVITY_LOGS: ActivityLogEntry[] = [
  {
    id: 'log-1',
    actorName: 'John Doe',
    actorAvatarUrl: '/assets/pngegg.png',
    action: 'updated member',
    targetName: 'Sarah Jessica',
    highlightedText: 'Sarah Jessica',
    timestamp: '2026-07-15T09:30:00.000Z',
  },
  {
    id: 'log-2',
    actorName: 'Lena Brooks',
    actorAvatarUrl: '/assets/pngegg.png',
    action: 'changed to',
    targetRole: 'Admin',
    targetName: 'Sarah Jessica',
    highlightedText: 'Admin',
    timestamp: '2026-07-14T14:20:00.000Z',
  },
  {
    id: 'log-3',
    actorName: 'Alexa Rodriguez',
    actorAvatarUrl: '/assets/pngegg.png',
    action: 'suspended',
    targetName: 'James',
    highlightedText: 'James',
    timestamp: '2026-07-13T10:15:00.000Z',
  },
  {
    id: 'log-4',
    actorName: 'Sam Brooks',
    actorAvatarUrl: '/assets/pngegg.png',
    action: 'assigned a',
    targetRole: 'Manager',
    targetName: 'person',
    highlightedText: 'Manager',
    timestamp: '2026-07-12T16:45:00.000Z',
  },
];

// ─── Dummy Invite Candidates ──────────────────────────────────────────────────

export const DUMMY_INVITE_CANDIDATES: InviteCandidate[] = [
  {
    id: 'cand-1',
    name: 'Jordan Patel',
    avatarUrl: '/assets/pngegg.png',
    headline: 'UI/UX Designer',
    alreadyMember: false,
  },
  {
    id: 'cand-2',
    name: 'Mike Zhang',
    avatarUrl: '/assets/pngegg.png',
    headline: 'Full Stack Developer',
    alreadyMember: false,
  },
  {
    id: 'cand-3',
    name: 'Priya Sharma',
    avatarUrl: '/assets/pngegg.png',
    headline: 'Product Manager',
    alreadyMember: true,
  },
];
