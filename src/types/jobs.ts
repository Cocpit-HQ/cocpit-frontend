export type JobListMode = "view" | "my-jobs" | "offers";

export type JobStatus = "in-progress" | "applied" | "in-past" | "saved";

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
}

export interface JobFilters {
  jobType?: string;
  experience?: string;
  salaryRange?: string;
  datePosted?: string;
}

export interface JobFormData {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  location: string;
  experience: string;
  jobType: string;
  salaryRange: string;
}

