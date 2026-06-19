export interface Job {
  id: string;
  title: string;
  company: string;
  company_logo?: string;
  location: string;
  job_type: 'Full time' | 'Part time' | 'Remote' | 'Contract' | 'Internship' | string;
  experience?: string; // e.g. "0-2Yrs"
  work_mode?: 'Remote' | 'Hybrid' | 'Onsite' | string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_display?: string; // e.g., "$160k - $210k"
  posted_at: string; // e.g., "1 day ago", "1 hour ago", "2 months ago"
  description: string;
  requirements?: string[];
  tags?: string[];
  is_saved?: boolean;
  is_applied?: boolean;

  // AI Recommendation details
  is_recommended?: boolean;
  recommended_badge?: string; // e.g., "Top 10%", "Top 5%", "Top 15%"
  response_rate?: string; // e.g., "98%", "95%", "92%"
  avg_reply?: string; // e.g., "1 day", "2 day", "3 day"
  match_reason?: string; // e.g., "Matches your skills in React and Node.js"
}

export interface JobsFilter {
  search?: string;
  job_type?: string; // "Full time" | "Part time" etc.
  experience?: string; // "0-2Yrs" etc.
  work_mode?: string; // "Remote" | "Hybrid" | "Onsite"
  salary_range?: string;
}

export interface JobsState {
  jobs: Job[];
  selectedJob: Job | null;
  isLoading: boolean;
  filters: JobsFilter;
  hasMore: boolean;
  cursor?: string;
}
