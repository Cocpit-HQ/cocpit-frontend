export interface ProfileScoreCategoryBreakdown {
  earned: number;
  max: number;
  missing: string[];
}

export interface ProfileScoreBreakdown {
  basic_info: ProfileScoreCategoryBreakdown;
  skills: ProfileScoreCategoryBreakdown;
  experience: ProfileScoreCategoryBreakdown;
  projects: ProfileScoreCategoryBreakdown;
  education: ProfileScoreCategoryBreakdown;
  profile_banner: ProfileScoreCategoryBreakdown;
}

export interface ProfileScoreResponse {
  score: number;
  breakdown: ProfileScoreBreakdown;
}
