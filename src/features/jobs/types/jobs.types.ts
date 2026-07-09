export interface Job {
  id: string;
  title: string;
  company: string;
  company_logo?: string;
  location: string;
  job_type: 'Full time' | 'Part time' | 'Remote' | 'Contract' | 'Internship' | string;
  work_type?: 'Full time' | 'Part time' | 'Remote' | 'Contract' | 'Internship' | string;
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
  is_closed?: boolean;
  is_followed?: boolean;
  org_id?: string;
  recruiter_id?: string;
  applicants_count?: number;
  shortlisted_count?: number;
  offers_count?: number;

  // AI Recommendation details
  is_recommended?: boolean;
  recommended_badge?: string; // e.g., "Top 10%", "Top 5%", "Top 15%"
  response_rate?: string; // e.g., "98%", "95%", "92%"
  avg_reply?: string; // e.g., "1 day", "2 day", "3 day"
  match_reason?: string; // e.g., "Matches your skills in React and Node.js"

  // Application details
  application_status?: 'Applied' | 'in-review' | 'Shortlisted' | 'Declined' | string;
  applied_date_display?: string;
  applied_at?: string;
  created_at?: string;
  is_available?: boolean;

  // Offer details
  is_offer?: boolean;
  offer_expiry_text?: string;
  offer_expiry_color?: 'orange' | 'gray' | string;
  offer_days_left?: number;
  recruiter_name?: string;
  recruiter_title?: string;
  recruiter_avatar?: string;
  recruiter_message?: string;
  offer_id?: string;
  offerStatus?: string;
  applicants?: number;
  actively_hiring?: boolean;
  easy_apply?: boolean;
  company_id?: string;
  company_slug?: string;
  company_type?: string;
  industry?: string;
  skills?: string[];
}

export interface JobsFilter {
  search?: string;
  location?: string;  // city / "remote" free-text, maps to backend ?location=
  job_type?: string; // "Full time" | "Part time" etc.
  experience?: string; // "0-2Yrs" etc.
  work_mode?: string; // "Remote" | "Hybrid" | "Onsite"
  salary_range?: string | string[];
  date_posted?: string;
  industry?: string;
}

export interface JobsState {
  jobs: Job[];
  selectedJob: Job | null;
  isLoading: boolean;
  filters: JobsFilter;
  hasMore: boolean;
  cursor?: string;
}

export interface JobListing {
  id: string;
  title: string;
  posted_at?: string;
  last_edited?: string;
  status: 'ACTIVE' | 'IN REVIEW' | 'DRAFT' | 'CLOSED' | string;
  company?: string;
  location?: string;
  description?: string;
  experience?: string;
  work_type?: string;
  work_mode?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  industry?: string;
  org_id?: string | null;
  applicants_count?: number;
  shortlisted_count?: number;
  offers_count?: number;
  ai_generation_count?: number;
}

export interface ListingsCounts {
  all: number;
  active: number;
  closed: number;
  draft: number;
  inReview: number;
}

export interface JobOffer {
  id: string;
  offer_id?: string;
  job_id?: string;
  context_sent?: boolean;
  job_role: string;
  days_remaining: number;
  company_name: string;
  location: string;
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'expired';
  note?: string;
  is_active?: boolean;
  job_status?: string;
  recruiter: {
    id?: string;
    name: string;
    headline: string;
    avatar?: string;
  };
}

