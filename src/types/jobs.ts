export type JobListMode = "view" | "my-jobs" | "offers";

export type JobStatus = "in-progress" | "applied" | "in-past";
export type MyJobsTab = JobStatus | "saved";

export type WorkMode = "Remote" | "Hybrid" | "Onsite";
export type CompanyType = "Startup" | "MNC" | "Product-based" | "Service-based";

export interface TimelineEvent {
  status: string;
  date?: string;
  completed: boolean;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  postedTime: string;
  applicants: number;
  salary: string;
  logo: string;
  isOffer?: boolean;
  status?: JobStatus;
  isSaved?: boolean;

  // New fields
  description?: string;
  skills?: string[];
  experience?: string;
  matchScore?: number;
  workMode?: WorkMode;
  companyType?: CompanyType;
  industry?: string;
  easyApply?: boolean;
  activelyHiring?: boolean;
  recruiterInsight?: string;
  applicationTimeline?: TimelineEvent[];
  aboutCompany?: string;
}

export interface JobFilters {
  jobType: string[];
  experience: string;
  salaryRange: string;
  datePosted: string;
  workMode: string[];
  companyType: string[];
  industry: string[];
  easyApply: boolean;
  activelyHiring: boolean;
  locations: string[];
}

export interface JobFormData {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  location: string;
  experience: string;
  jobType: string;
  salaryRange: string;
  skills: string; // comma separated for form
  workMode: WorkMode;
  companyType: CompanyType;
  industry: string;
  aboutCompany: string;
  activelyHiring: boolean;
  easyApply: boolean;
}

export interface JobsContextType {
  jobs: Job[];
  addJob: (job: Job) => void;
  applyToJob: (jobId: number) => void;
  saveJob: (jobId: number) => void;
  filters: JobFilters;
  updateFilters: (filters: Partial<JobFilters>) => void;
  filteredJobs: Job[];
  searchKeywords: string;
  setSearchKeywords: (keywords: string) => void;
  resetFilters: () => void;
  myJobs: Job[];
  activeTab: JobListMode;
  setActiveTab: (tab: JobListMode) => void;
  myJobsTab: MyJobsTab;
  setMyJobsTab: (tab: MyJobsTab) => void;
}
