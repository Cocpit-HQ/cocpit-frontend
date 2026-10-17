export type RoleType = 'Professional' | 'Student';

export interface TargetRole {
  id: string;
  name: string;
}

export interface SkillAlignment {
  skillName: string;
  currentLevel: number; // percentage
  targetLevel: number; // percentage
}

export interface JourneyItem {
  id: string;
  role: string;
  companyOrSchool: string;
  dateRange: string;
  description?: string;
  isCurrent: boolean;
}

export type NextBestActionType = 'Job' | 'Connection' | 'Channel' | 'Course' | 'Project' | 'Other';

export interface NextBestAction {
  id: string;
  type: NextBestActionType;
  title: string;
  subtitle?: string;
  actionUrl?: string;
}

export interface CareerTrajectorySnapshot {
  id: string;
  lastAnalyzedAt: string; // ISO String
  nextAnalysisAvailableAt: string; // ISO String
  targetRole: TargetRole;
  trajectorySummary: {
    currentDirection: string;
    strongAreas: string[];
    majorGaps: string[];
    relationshipToTarget: string;
  };
  journey: JourneyItem[];
  skillAlignmentScore: number; // overall % aligned
  skillAlignments: SkillAlignment[];
  currentProgressScore: number; // overall progress %
  nextBestAction: NextBestAction;
}
