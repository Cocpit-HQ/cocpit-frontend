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

