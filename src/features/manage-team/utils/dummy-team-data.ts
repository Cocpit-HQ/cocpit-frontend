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
    avatarUrl: '/assets/pngegg.png',
    headline: 'Product Designer',
    roleId: 'role-1',
    roleName: 'Marketing',
    roleColor: '#2196F3',
    status: 'ACTIVE',
    joinedAt: '2026-03-15T09:00:00.000Z',
  },
  {
    id: 'user-2',
    orgId: 'org-demo',
    name: 'Lena Brooks',
    avatarUrl: '/assets/pngegg.png',
    headline: 'Engineering Manager',
    roleId: 'role-2',
    roleName: 'Admin',
    roleColor: '#4CAF50',
    status: 'ACTIVE',
    joinedAt: '2026-02-10T09:00:00.000Z',
  },
  {
    id: 'user-3',
    orgId: 'org-demo',
    name: 'Alexa Rodriguez',
    avatarUrl: '/assets/pngegg.png',
    headline: 'Frontend Engineer',
    roleId: 'role-1',
    roleName: 'Marketing',
    roleColor: '#2196F3',
    status: 'ACTIVE',
    joinedAt: '2026-04-01T09:00:00.000Z',
  },
  {
    id: 'user-4',
    orgId: 'org-demo',
    name: 'Sam Brooks',
    avatarUrl: '/assets/pngegg.png',
    headline: 'Backend Engineer',
    roleId: 'role-3',
    roleName: 'Tech Lead',
    roleColor: '#FF8C00',
    status: 'ACTIVE',
    joinedAt: '2026-01-20T09:00:00.000Z',
  },
  {
    id: 'user-5',
    orgId: 'org-demo',
    name: 'Sarah Jessica',
    avatarUrl: '/assets/pngegg.png',
    headline: 'HR Business Partner',
    roleId: 'role-1',
    roleName: 'Marketing',
    roleColor: '#2196F3',
    status: 'ACTIVE',
    joinedAt: '2026-05-10T09:00:00.000Z',
  },
  {
    id: 'user-6',
    orgId: 'org-demo',
    name: 'ABG_CHR',
    avatarUrl: '/assets/pngegg.png',
    headline: 'DevOps Lead',
    roleId: 'role-2',
    roleName: 'Admin',
    roleColor: '#4CAF50',
    status: 'ACTIVE',
    joinedAt: '2026-06-01T09:00:00.000Z',
  },
];

// ─── Dummy Roles ──────────────────────────────────────────────────────────────

export const DUMMY_ROLES: TeamRole[] = [
  {
    id: 'role-1',
    orgId: 'org-demo',
    name: 'Marketing',
    color: '#2196F3',
    description:
      'Responsible for developing, implementing, and executing strategic marketing plans and campaigns for managing content, and tracking campaign performances.',
    permissions: ['create_post', 'channels', 'analytics'],
    priority: 1,
    isSystemRole: false,
    memberCount: 3,
    members: DUMMY_MEMBERS.filter((m) => m.roleId === 'role-1'),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-06-15T00:00:00.000Z',
  },
  {
    id: 'role-2',
    orgId: 'org-demo',
    name: 'Admin',
    color: '#4CAF50',
    description:
      'Full access to all organization settings, team management, and administrative controls.',
    permissions: [
      'create_post',
      'channels',
      'chat',
      'counter',
      'teams',
      'activity_logs',
      'jobs',
      'jobs_detail',
      'analytics',
    ],
    priority: 0,
    isSystemRole: true,
    memberCount: 2,
    members: DUMMY_MEMBERS.filter((m) => m.roleId === 'role-2'),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'role-3',
    orgId: 'org-demo',
    name: 'Tech Lead',
    color: '#FF8C00',
    description:
      'Technical team leads with access to engineering tools, job management, and analytics.',
    permissions: ['create_post', 'chat', 'jobs', 'jobs_detail', 'analytics'],
    priority: 2,
    isSystemRole: false,
    memberCount: 1,
    members: DUMMY_MEMBERS.filter((m) => m.roleId === 'role-3'),
    createdAt: '2026-02-15T00:00:00.000Z',
    updatedAt: '2026-05-20T00:00:00.000Z',
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
