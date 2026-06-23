import { Job, JobsFilter, JobListing, JobOffer } from '../types/jobs.types';
import { DUMMY_JOBS, DUMMY_OFFERS } from '../utils/jobs.utils';
import api from '@/lib/axios';

// Initial default state for the application
const INITIAL_APPLIED_IDS = ['app-1', 'app-2', 'app-3', 'app-4', 'app-5', 'app-6', 'app-7', 'app-8', 'app-9'];
const INITIAL_SAVED_IDS = ['rec-1', 'rec-2', 'app-1', 'app-2', 'offer-1', 'offer-2', 'offer-3'];

// Module-level state variables that reset back to their original state upon browser refresh
let inMemoryAppliedIds: string[] = [...INITIAL_APPLIED_IDS];
let inMemorySavedIds: string[] = [...INITIAL_SAVED_IDS];
let inMemoryRespondedOffers: Record<string, 'accept' | 'decline'> = {};
let inMemoryFollowedCompanies: string[] = [];
let inMemoryJobListings: JobListing[] = [];
let inMemoryActiveTab: string = 'Explore';

// Getters & Mutators for hooks
export const getAppliedJobIds = (): string[] => inMemoryAppliedIds;
export const getSavedJobIds = (): string[] => inMemorySavedIds;
export const getRespondedOffers = (): Record<string, 'accept' | 'decline'> => inMemoryRespondedOffers;
export const getFollowedCompanies = (): string[] => inMemoryFollowedCompanies;
export const getActiveTab = (): string => inMemoryActiveTab;

export const setAppliedJobIds = (ids: string[]) => { inMemoryAppliedIds = ids; };
export const setSavedJobIds = (ids: string[]) => { inMemorySavedIds = ids; };
export const setRespondedOffers = (offers: Record<string, 'accept' | 'decline'>) => { inMemoryRespondedOffers = offers; };
export const setFollowedCompanies = (companies: string[]) => { inMemoryFollowedCompanies = companies; };
export const setActiveTab = (tab: string) => { 
  inMemoryActiveTab = tab; 
};

export const getJobs = async (filters?: JobsFilter, cursor?: string, excludeAppliedAndOffers?: boolean) => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 300));

  let filteredJobs = DUMMY_JOBS.map(j => ({
    ...j,
    is_applied: inMemoryAppliedIds.includes(j.id),
    is_saved: inMemorySavedIds.includes(j.id)
  }));

  if (excludeAppliedAndOffers) {
    filteredJobs = filteredJobs.filter(j => !j.is_applied && !j.is_offer);
  }

  if (filters) {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filteredJobs = filteredJobs.filter(
        j => j.title.toLowerCase().includes(q) || 
             j.company.toLowerCase().includes(q) || 
             j.description.toLowerCase().includes(q)
      );
    }
    if (filters.job_type) {
      filteredJobs = filteredJobs.filter(
        j => j.job_type.toLowerCase() === filters.job_type?.toLowerCase()
      );
    }
    if (filters.work_mode) {
      filteredJobs = filteredJobs.filter(
        j => j.work_mode?.toLowerCase() === filters.work_mode?.toLowerCase()
      );
    }
    if (filters.experience) {
      filteredJobs = filteredJobs.filter(
        j => j.experience?.toLowerCase() === filters.experience?.toLowerCase()
      );
    }
    
    // Date posted filter
    if (filters.date_posted) {
      const dp = filters.date_posted.toLowerCase();
      if (dp === 'today') {
        filteredJobs = filteredJobs.filter(
          j => j.posted_at.toLowerCase().includes('hour') || 
               j.posted_at.toLowerCase().includes('minute') || 
               j.posted_at.toLowerCase().includes('today')
        );
      } else if (dp === 'last 7 days') {
        filteredJobs = filteredJobs.filter(
          j => j.posted_at.toLowerCase().includes('hour') || 
               j.posted_at.toLowerCase().includes('minute') || 
               j.posted_at.toLowerCase().includes('today') ||
               (j.posted_at.toLowerCase().includes('day') && !j.posted_at.toLowerCase().includes('month') && parseInt(j.posted_at, 10) <= 7)
        );
      } else if (dp === 'last 30 days') {
        filteredJobs = filteredJobs.filter(
          j => !j.posted_at.toLowerCase().includes('month') && 
               !j.posted_at.toLowerCase().includes('year')
        );
      }
    }

    // Industry filter
    if (filters.industry) {
      const ind = filters.industry.toLowerCase();
      if (ind === 'tech') {
        filteredJobs = filteredJobs.filter(
          j => j.tags?.some(t => ['react', 'node.js', 'typescript', 'next.js', 'aws', 'docker', 'telemetry', 'developer tools', 'saas'].includes(t.toLowerCase()))
        );
      } else if (ind === 'design') {
        filteredJobs = filteredJobs.filter(
          j => j.title.toLowerCase().includes('design') || 
               j.tags?.some(t => ['figma', 'ui/ux', 'product design', 'visual design', 'design systems', 'prototyping'].includes(t.toLowerCase()))
        );
      } else {
        // Generic matches for custom inputs or other industries
        filteredJobs = filteredJobs.filter(
          j => j.title.toLowerCase().includes(ind) || 
               j.description.toLowerCase().includes(ind) ||
               j.tags?.some(t => t.toLowerCase().includes(ind))
        );
      }
    }

    // Location type filter
    if (filters.location_type) {
      const loc = filters.location_type.toLowerCase();
      if (loc === 'city') {
        filteredJobs = filteredJobs.filter(
          j => j.location.toLowerCase() !== 'remote'
        );
      } else if (loc === 'country') {
        filteredJobs = filteredJobs.filter(
          j => j.location.toLowerCase() === 'remote'
        );
      }
    }
  }

  // Handle cursor-based pagination simulation
  const limit = 5;
  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + limit);
  const nextIndex = startIndex + limit;
  const hasMore = nextIndex < filteredJobs.length;
  const nextCursor = hasMore ? nextIndex.toString() : null;

  return {
    data: paginatedJobs,
    nextCursor,
    hasMore
  };
};

export const getJobById = async (jobId: string): Promise<Job | null> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const job = DUMMY_JOBS.find(j => j.id === jobId);
  if (!job) return null;

  const offerResponse = inMemoryRespondedOffers[job.id];
  let status = job.application_status;
  if (job.is_offer && offerResponse) {
    status = offerResponse === 'accept' ? 'Accepted' : 'Declined';
  }

  return {
    ...job,
    is_applied: inMemoryAppliedIds.includes(job.id),
    is_saved: inMemorySavedIds.includes(job.id),
    is_followed: inMemoryFollowedCompanies.includes(job.company),
    application_status: status
  };
};

export const saveJob = async (jobId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  if (inMemorySavedIds.includes(jobId)) {
    inMemorySavedIds = inMemorySavedIds.filter(id => id !== jobId);
  } else {
    inMemorySavedIds.push(jobId);
  }
  return true;
};

export const applyJob = async (jobId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  if (!inMemoryAppliedIds.includes(jobId)) {
    inMemoryAppliedIds.push(jobId);
  }
  return true;
};

export const getMyApplications = async (): Promise<Job[]> => {
  await new Promise(resolve => setTimeout(resolve, 250));
  return DUMMY_JOBS
    .filter(j => inMemoryAppliedIds.includes(j.id))
    .map(j => ({
      ...j,
      is_applied: true,
      is_saved: inMemorySavedIds.includes(j.id)
    }));
};

export const withdrawApplication = async (jobId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  inMemoryAppliedIds = inMemoryAppliedIds.filter(id => id !== jobId);
  return true;
};

export const getApplicationStats = async (): Promise<{ totalApplied: number; shortlisted: number }> => {
  await new Promise(resolve => setTimeout(resolve, 150));
  const appliedJobs = DUMMY_JOBS.filter(j => inMemoryAppliedIds.includes(j.id));
  const shortlistedCount = appliedJobs.filter(j => j.application_status === 'Shortlisted').length;
  return {
    totalApplied: inMemoryAppliedIds.length,
    shortlisted: shortlistedCount
  };
};

export const getMyOffers = async (): Promise<Job[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return DUMMY_JOBS
    .filter(j => j.is_offer && !inMemoryRespondedOffers[j.id])
    .map(j => ({
      ...j,
      is_saved: inMemorySavedIds.includes(j.id),
      is_applied: inMemoryAppliedIds.includes(j.id)
    }));
};

export const respondToOffer = async (offerId: string, action: 'accept' | 'decline'): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 150));
  inMemoryRespondedOffers[offerId] = action;
  return true;
};

// Mock Listings Data
const DUMMY_JOB_LISTINGS: JobListing[] = [];

export const getMyListings = async (): Promise<JobListing[]> => {
  try {
    const response = await api.get(`/jobs/my`);
    return response.data.map((job: any) => ({
      id: job.job_id,
      title: job.title,
      status: job.status,
      posted_at: job.created_at,
      last_edited: job.updated_at,
      company: job.company_name,
      location: job.location,
      description: job.description,
      work_type: job.job_type,
      work_mode: job.work_mode,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency
    })) as JobListing[];
  } catch (error) {
    console.error("Failed to fetch listings:", error);
    return [];
  }
};

export const initializeJobDraft = async (title: string): Promise<string | null> => {
  try {
    const response = await api.post('/jobs', { title });
    const newJob = response.data.job || response.data;
    return newJob.job_id || newJob.id;
  } catch (error) {
    console.error("Failed to initialize job draft:", error);
    return null;
  }
};

export const createJobListing = async (
  title: string,
  status: string = 'ACTIVE',
  details?: Partial<JobListing>
): Promise<JobListing | null> => {
  try {
    let jobId = details?.id;

    // 1. If we don't have an ID, we MUST create the draft first
    if (!jobId) {
      const createResponse = await api.post('/jobs', { title });
      const newBackendJob = createResponse.data.job || createResponse.data;
      jobId = newBackendJob.job_id;
    }

    // 2. Now we have a jobId (either newly created or passed in). 
    //    We need to update it with the rest of the details.
    if (jobId) {
      // Parse experience string like "0 - 2 years" into min/max numbers
      let expMin = undefined;
      let expMax = undefined;
      if (details?.experience) {
        const match = details.experience.match(/(\d+)\s*-\s*(\d+)/);
        if (match) {
           expMin = parseInt(match[1]);
           expMax = parseInt(match[2]);
        } else if (details.experience.includes('5+')) {
           expMin = 5;
           expMax = 10;
        }
      }

      let sMin = details?.salary_min;
      let sMax = details?.salary_max;
      
      // Auto-correct if max is accidentally smaller than min (e.g. if max was left as 0)
      if (sMin !== undefined && sMax !== undefined && sMin > sMax) {
          sMax = sMin;
      }

      const updatePayload = {
        title,
        description: details?.description,
        location: details?.location,
        job_type: details?.work_type,
        work_mode: details?.work_mode,
        salary_min: sMin,
        salary_max: sMax,
        salary_currency: details?.salary_currency,
        experience_min: expMin,
        experience_max: expMax,
        experience_label: details?.experience
      };
      
      const updateResponse = await api.patch(`/jobs/${jobId}`, updatePayload);
      const backendJob = updateResponse.data.job || updateResponse.data;
      
      // 3. If the user hit "Publish" (ACTIVE), submit it
      if (status === 'ACTIVE') {

         await api.post(`/jobs/${jobId}/submit`, {
           title,
           description: details?.description || 'No description provided',
           location: details?.location || 'Remote',
           salary_min: sMin || 0,
           salary_max: sMax || sMin || 0,
           salary_currency: details?.salary_currency || 'USD',
           experience_min: expMin !== undefined ? expMin : 0,
           experience_max: expMax !== undefined ? expMax : 2,
           experience_label: details?.experience || '0 - 2 years',
           work_mode: details?.work_mode || 'Hybrid',
           job_type: details?.work_type || 'Full-time',
           industry: 'Technology',
           about_company: details?.company ? `About ${details.company}` : 'Tech company',
         }).catch(err => {
            console.error("Error submitting job:", err?.response?.data || err);
            throw err; // Re-throw to catch block
         });
      }

      return {
        id: backendJob.job_id,
        title: backendJob.title,
        status: status,
        last_edited: 'Last edited just now'
      } as JobListing;
    }

    return null;
  } catch (error) {
    console.error("Failed to create/update job listing via API", error);
    return null;
  }
};

export const closeJobListing = async (id: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 150));
  inMemoryJobListings = inMemoryJobListings.map(l =>
    l.id === id ? { ...l, status: 'CLOSED' } : l
  );
  const dummyIndex = DUMMY_JOB_LISTINGS.findIndex(l => l.id === id);
  if (dummyIndex !== -1) {
    DUMMY_JOB_LISTINGS[dummyIndex].status = 'CLOSED';
  }
  return true;
};

export const deleteJobListing = async (id: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 150));
  inMemoryJobListings = inMemoryJobListings.filter(l => l.id !== id);
  const dummyIndex = DUMMY_JOB_LISTINGS.findIndex(l => l.id === id);
  if (dummyIndex !== -1) {
    DUMMY_JOB_LISTINGS.splice(dummyIndex, 1);
  }
  return true;
};

let inMemoryJobOffers = [...DUMMY_OFFERS];

export const getJobOffers = async () => {
  await new Promise(resolve => setTimeout(resolve, 150));
  return { data: inMemoryJobOffers, success: true };
};

export const acceptJobOffer = async (offerId: string) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  inMemoryJobOffers = inMemoryJobOffers.map(o => o.id === offerId ? { ...o, status: 'accepted' } : o);
  return { success: true };
};

export const declineJobOffer = async (offerId: string) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  inMemoryJobOffers = inMemoryJobOffers.map(o => o.id === offerId ? { ...o, status: 'declined' } : o);
  return { success: true };
};

