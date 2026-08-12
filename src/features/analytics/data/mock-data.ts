import { CareerTrajectorySnapshot } from '../types/trajectory.types';
import { ProfileAnalyticsSnapshot, AudienceInsights } from '../types/profile-analytics.types';

export const MOCK_TRAJECTORY: CareerTrajectorySnapshot = {
  id: 'traj-123',
  lastAnalyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
  nextAnalysisAvailableAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(), // 12 days from now
  targetRole: {
    id: 'role-vp-marketing',
    name: 'VP of Marketing'
  },
  trajectorySummary: {
    currentDirection: 'Your strongest areas are growth and team leadership, while P&L management and strategic influence are your biggest gaps for the target role.',
    strongAreas: ['Growth', 'Team Leadership'],
    majorGaps: ['P&L Management', 'Strategic Influence'],
    relationshipToTarget: 'Strong potential with focused skill development.'
  },
  journey: [
    {
      id: 'j-1',
      role: 'Content Strategist',
      companyOrSchool: 'GrowthLabs',
      dateRange: '2018 - 2020',
      description: 'Improved the art of digital storytelling and audience segmentation at GrowthLabs.',
      isCurrent: false
    },
    {
      id: 'j-2',
      role: 'Marketing Lead',
      companyOrSchool: 'GrowthLabs',
      dateRange: '2020 - Present',
      description: 'Shifted from individual contributor to managing a cross-functional team of 12.',
      isCurrent: true
    },
    {
      id: 'j-3',
      role: 'VP of Marketing',
      companyOrSchool: 'Target Role',
      dateRange: 'Estimated 2026',
      description: 'Global brand stewardship and P&L responsibility.',
      isCurrent: false
    }
  ],
  skillAlignmentScore: 70,
  skillAlignments: [
    { skillName: 'P&L Management', currentLevel: 40, targetLevel: 85 },
    { skillName: 'Strategic Influence', currentLevel: 60, targetLevel: 90 },
    { skillName: 'Team Leadership', currentLevel: 80, targetLevel: 90 },
    { skillName: 'Brand Strategy', currentLevel: 75, targetLevel: 95 },
    { skillName: 'Performance Marketing', currentLevel: 90, targetLevel: 80 }
  ],
  currentProgressScore: 68,
  nextBestAction: {
    id: 'nba-1',
    type: 'Course',
    title: "Enroll in 'Strategic Finance for Marketers'",
    subtitle: 'This 4-week executive certification will bridge your largest skill gap: P&L Management.',
    actionUrl: '#'
  }
};

export const MOCK_STUDENT_TRAJECTORY: CareerTrajectorySnapshot = {
  id: 'traj-student-123',
  lastAnalyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
  nextAnalysisAvailableAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(), // 12 days from now
  targetRole: {
    id: 'role-junior-designer',
    name: 'Junior UI Designer'
  },
  trajectorySummary: {
    currentDirection: 'Your coursework and independent projects show strong visual design foundations.',
    strongAreas: ['Visual Design', 'UI Software'],
    majorGaps: ['Design Systems', 'Real-world execution'],
    relationshipToTarget: 'Strong potential for entry-level roles.'
  },
  journey: [
    {
      id: 'j-s1',
      role: '12th HSC',
      companyOrSchool: 'School',
      dateRange: '2018 - 2020',
      description: 'Focused on art and computer science electives, building an early interest in visual d...',
      isCurrent: false
    },
    {
      id: 'j-s2',
      role: 'B.tech',
      companyOrSchool: 'University',
      dateRange: '2021 - Present',
      description: 'Took on UI/UX coursework and design electives, completed 3 independent projects...',
      isCurrent: true
    },
    {
      id: 'j-s3',
      role: 'Junior UI designer',
      companyOrSchool: 'Target Role',
      dateRange: 'Estimated 2026',
      description: 'Entry-level role focused on visual design execution, working within an existing design s...',
      isCurrent: false
    }
  ],
  skillAlignmentScore: 65,
  skillAlignments: [
    { skillName: 'Visual design', currentLevel: 70, targetLevel: 80 },
    { skillName: 'Prototyping', currentLevel: 60, targetLevel: 75 },
    { skillName: 'UX research', currentLevel: 50, targetLevel: 70 },
    { skillName: 'Design systems', currentLevel: 40, targetLevel: 65 },
    { skillName: 'Accessibility', currentLevel: 55, targetLevel: 75 },
    { skillName: 'Front-end collaboration', currentLevel: 45, targetLevel: 70 }
  ],
  currentProgressScore: 65,
  nextBestAction: {
    id: 'nba-s1',
    type: 'Project',
    title: "Build a complete Design System",
    subtitle: 'Create and document a comprehensive design system for one of your past projects.',
    actionUrl: '#'
  }
};

export const MOCK_PROFILE_ANALYTICS: ProfileAnalyticsSnapshot = {
  overview: {
    overallReach: { value: 1284, trend: 15 },
    profileViews: { value: 342, trend: 8 },
    engagementRate: { value: 4.2, trend: 1.1 },
    topCountries: [
      { name: 'United States', count: 450 },
      { name: 'United Kingdom', count: 210 },
      { name: 'Canada', count: 180 }
    ],
    industryDistribution: [
      { name: 'Technology', count: 650 },
      { name: 'Marketing', count: 420 },
      { name: 'Finance', count: 110 }
    ],
    insights: [
      'Profile visibility increased 12%.',
      'Recruiter interest increased 34%.',
      'Your articles generated the most profile visits.'
    ]
  },
  content: {
    formatPerformance: {
      articles: { value: 850, trend: 20 },
      media: { value: 420, trend: -5 },
      polls: { value: 310, trend: 40 },
      text: { value: 150, trend: 2 }
    },
    topPosts: [
      {
        id: 'post-1',
        type: 'article',
        previewText: '5 strategies to scale your marketing team in 2026...',
        views: 1200,
        likes: 145,
        comments: 32,
        shares: 12,
        saves: 45,
        engagementRate: 8.5,
        totalReach: 3400,
        directImpact: {
          profileVisits: 45,
          newFollowers: 12,
          recruiterViews: 3
        },
        geographicDistribution: [
          { name: 'US', count: 800 },
          { name: 'UK', count: 300 }
        ],
        industryDistribution: [
          { name: 'Marketing', count: 900 },
          { name: 'Tech', count: 200 }
        ]
      },
      {
        id: 'post-2',
        type: 'poll',
        previewText: 'What is your biggest hiring challenge this quarter?',
        views: 850,
        likes: 45,
        comments: 89,
        shares: 2,
        saves: 1,
        engagementRate: 15.2,
        totalReach: 1500,
        directImpact: {
          profileVisits: 15,
          newFollowers: 3,
          recruiterViews: 1
        },
        geographicDistribution: [
          { name: 'US', count: 500 },
          { name: 'Canada', count: 200 }
        ],
        industryDistribution: [
          { name: 'Tech', count: 400 },
          { name: 'HR', count: 350 }
        ]
      }
    ]
  },
  audience: {
    overallReach: { value: 1284, trend: 15 },
    profileViews: { value: 342, trend: 8 },
    engagementRate: { value: 4.2, trend: 1.1 },
    topCountries: [
      { name: 'United States', count: 850 },
      { name: 'United Kingdom', count: 320 }
    ],
    topCities: [
      { name: 'New York', count: 400 },
      { name: 'London', count: 320 }
    ],
    audienceIndustries: [
      { name: 'Technology', percentage: 45 },
      { name: 'Marketing', percentage: 35 },
      { name: 'Finance', percentage: 10 },
      { name: 'Other', percentage: 10 }
    ],
    insights: [
      'Your audience in New York grew by 15% this week.',
      'Technology professionals make up the majority of your new followers.'
    ]
  },
  opportunities: {
    opportunityActivity: { value: 156, trend: 22 },
    repeatOrganizationVisitors: { value: 34, trend: 5 },
    topOrganizations: [
      { id: 'org-1', name: 'Google', visitCount: 12, relevantActiveRole: 'Product Marketing Manager' },
      { id: 'org-2', name: 'Stripe', visitCount: 8, relevantActiveRole: 'Marketing Lead' },
      { id: 'org-3', name: 'Meta', visitCount: 5 } // No active role
    ],
    organizationIndustries: [
      { name: 'Internet Software', percentage: 60 },
      { name: 'Financial Services', percentage: 25 },
      { name: 'Other', percentage: 15 }
    ],
    insights: [
      'Google recruiters have viewed your profile 3 times this week.',
      'Your recent article attracted views from 5 top tech companies.'
    ]
  }
};
