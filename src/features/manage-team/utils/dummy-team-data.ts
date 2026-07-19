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
  {
    id: 'user-4',
    orgId: 'org-demo',
    name: 'Sarah Jessica',
    avatarUrl: '/images/Team/profile_team.png', // Fallback will show default
    headline: 'sarah.jessica@example.com',
    roleId: 'role-2',
    roleName: 'Marketing',
    roleColor: '#EF4444',
    status: 'ACTIVE',
    joinedAt: '2026-02-10T09:00:00.000Z',
  },
  {
    id: 'user-5',
    orgId: 'org-demo',
    name: 'Michael Chen',
    avatarUrl: '/images/Team/profile_team.png',
    headline: 'michael.chen@example.com',
    roleId: 'role-3',
    roleName: 'Manager',
    roleColor: '#8b5cf6',
    status: 'ACTIVE',
    joinedAt: '2026-03-15T10:00:00.000Z',
  },
  {
    id: 'user-6',
    orgId: 'org-demo',
    name: 'Jane Smith',
    avatarUrl: '/images/Team/profile_team.png',
    headline: 'jane.smith@example.com',
    roleId: 'role-3',
    roleName: 'Manager',
    roleColor: '#8b5cf6',
    status: 'ACTIVE',
    joinedAt: '2026-04-10T10:00:00.000Z',
  },
  {
    id: 'user-7',
    orgId: 'org-demo',
    name: 'David Lee',
    avatarUrl: '/images/Team/profile_team.png',
    headline: 'david.lee@example.com',
    roleId: 'role-3',
    roleName: 'Manager',
    roleColor: '#8b5cf6',
    status: 'ACTIVE',
    joinedAt: '2026-05-20T10:00:00.000Z',
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
    memberCount: 3,
    members: DUMMY_MEMBERS.filter((m) => m.roleId === 'role-3'),
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
    action: 'updated role for',
    targetName: 'Sarah jenkis',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'log-2',
    actorName: 'John Doe',
    actorAvatarUrl: '/assets/pngegg.png',
    action: 'liked post by',
    targetName: 'Sarah jenkis',
    highlightedText: 'post',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'log-3',
    actorName: 'Elena Rodriquez',
    actorAvatarUrl: '/assets/pngegg.png',
    action: 'commented on',
    targetName: 'james',
    highlightedText: 'post',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'log-4',
    actorName: 'Liam Brooks',
    actorAvatarUrl: '/assets/pngegg.png',
    action: 'replied to',
    targetName: 'james',
    highlightedText: 'message',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

// ─── Dummy Invite Candidates ──────────────────────────────────────────────────

export const DUMMY_INVITE_CANDIDATES: InviteCandidate[] = [
  {
    id: 'cand-1',
    name: 'James Karl',
    avatarUrl: '/images/Team/profile_team.png',
    headline: '',
    alreadyMember: false,
  },
  {
    id: 'cand-2',
    name: 'Liz Mean',
    avatarUrl: '/images/Team/profile_team.png',
    headline: '',
    alreadyMember: false,
  },
  {
    id: 'cand-3',
    name: 'Will Jackson',
    avatarUrl: '/images/Team/profile_team.png',
    headline: '',
    alreadyMember: false,
  },
];
