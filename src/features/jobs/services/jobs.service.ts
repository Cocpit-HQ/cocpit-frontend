import { Job, JobsFilter, JobListing, JobOffer, ListingsCounts } from '../types/jobs.types';
import { DUMMY_JOBS } from '../utils/jobs.utils';
import api from '@/lib/axios';
import { useJobStore } from '@/store/job.store';

// Service layer holds zero client-side UI states.
// All states are managed reactively inside useJobStore.


export const getJobs = async (filters?: JobsFilter, cursor?: string, excludeAppliedAndOffers?: boolean) => {
  try {
    const params: Record<string, any> = { limit: 10 };
    
    if (cursor) {
      params.cursor = cursor;
    }

    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.location) params.location = filters.location;
      
      if (filters.job_type) {
        // Map "Full time" -> "Full-time"
        let type = filters.job_type;
        if (type === 'Full time') type = 'Full-time';
        params.employment_type = type;
      }
      
      if (filters.work_mode) params.work_model = filters.work_mode;

      if (filters.experience) {
        switch (filters.experience) {
          case 'Fresher':
            params.experience_min = 0;
            params.experience_max = 1;
            break;
          case 'Junior (1-3 yrs)':
            params.experience_min = 1;
            params.experience_max = 3;
            break;
          case 'Mid-level (3-5 yrs)':
            params.experience_min = 3;
            params.experience_max = 5;
            break;
          case 'Senior (5+ yrs)':
            params.experience_min = 5;
            break;
        }
      }

      if (filters.salary_range) {
        switch (filters.salary_range) {
          case 'Under 3L':
            params.salary_max = 300000;
            break;
          case '3L-5L':
            params.salary_min = 300000;
            params.salary_max = 500000;
            break;
          case '6L-10L':
            params.salary_min = 600000;
            params.salary_max = 1000000;
            break;
          case '10L+':
            params.salary_min = 1000000;
            break;
        }
      }

      if (filters.date_posted) params.datePosted = filters.date_posted;
      if (filters.industry) params.industry = filters.industry;

      if (filters.location_type) {
        if (filters.location_type.toLowerCase() === 'country') {
          params.work_model = params.work_model ? `${params.work_model},Remote` : 'Remote';
        }
      }
    }

    console.log("API Params:", params);

    const response = await api.get('/jobs', { params });
    const fetchedJobs = response.data;
    
    // Map backend response array to frontend paginated structure
    const paginatedJobs = fetchedJobs.map((job: any) => ({
      id: job.job_id,
      title: job.title,
      company: job.company_name,
      location: job.location,
      work_type: job.job_type || 'Full time',
      work_mode: job.work_mode,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency,
      posted_at: getRelativeTime(job.created_at),
      description: job.description,
      experience: (job.experience_min != null && job.experience_max != null) 
        ? `${job.experience_min}-${job.experience_max}Yrs` 
        : (job.experience_level || '0-2Yrs'),
      is_saved: job.isSaved || false,
      is_applied: job.hasApplied || false,
      is_offer: false,
      tags: job.tags || [],
      is_available: job.status !== 'CLOSED' && job.is_active !== false,
      is_closed: job.status === 'CLOSED' || job.is_active === false
    }));

    // Filter out applied and offers if requested
    let finalJobs = paginatedJobs;
    if (excludeAppliedAndOffers) {
      finalJobs = finalJobs.filter((j: Job) => !j.is_applied && !j.is_offer);
    }

    const hasMore = fetchedJobs.length === 10;
    const nextCursor = hasMore ? fetchedJobs[fetchedJobs.length - 1].created_at : null;

    return {
      data: finalJobs,
      nextCursor,
      hasMore
    };
  } catch (error) {
    console.error("Failed to fetch all jobs:", error);
    return { data: [], nextCursor: null, hasMore: false };
  }
};

export const getRecommendations = async (): Promise<Job[]> => {
  try {
    const response = await api.get('/jobs/recommendations');
    const fetchedJobs = response.data;
    
    return fetchedJobs.map((job: any) => ({
      id: job.job_id,
      title: job.title,
      company: job.company_name,
      location: job.location,
      work_type: job.job_type,
      work_mode: job.work_mode,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency,
      posted_at: getRelativeTime(job.created_at),
      description: job.description,
      experience: (job.experience_min != null && job.experience_max != null) 
        ? `${job.experience_min}-${job.experience_max}Yrs` 
        : (job.experience_level || '0-2Yrs'),
      is_saved: job.isSaved || false,
      is_applied: job.hasApplied || false,
      is_offer: false,
      tags: job.tags || [],
      is_recommended: job.is_recommended || false,
      recommended_badge: job.recommended_badge || '',
      response_rate: job.response_rate || '',
      avg_reply: job.avg_reply || '',
      match_reason: job.match_reason || '',
      match_score: job.match_score || null,
    }));
  } catch (error) {
    console.error("Failed to fetch recommended jobs:", error);
    return [];
  }
};

export const getSavedJobs = async (filters?: JobsFilter, cursor?: string) => {
  try {
    const params: Record<string, any> = { limit: 10 };
    if (cursor) {
      params.cursor = cursor;
    }

    const response = await api.get('/jobs/saved/me', { params });
    const fetchedJobs = response.data;
    
    const paginatedJobs = fetchedJobs.map((job: any) => ({
      id: job.job_id,
      title: job.title,
      company: job.company_name,
      location: job.location,
      work_type: job.job_type || 'Full time',
      work_mode: job.work_mode,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency,
      posted_at: getRelativeTime(job.created_at),
      description: job.description,
      experience: (job.experience_min != null && job.experience_max != null) 
        ? `${job.experience_min}-${job.experience_max}Yrs` 
        : (job.experience_level || '0-2Yrs'),
      is_saved: true,
      is_applied: job.hasApplied || false,
      is_offer: false,
      tags: job.tags || [],
      is_available: job.status !== 'CLOSED' && job.is_active !== false,
      is_closed: job.status === 'CLOSED' || job.is_active === false
    }));

    const hasMore = fetchedJobs.length === 10;
    const nextCursor = hasMore ? fetchedJobs[fetchedJobs.length - 1].saved_at : null;

    return {
      data: paginatedJobs,
      nextCursor,
      hasMore
    };
  } catch (error) {
    console.error("Failed to fetch saved jobs:", error);
    return { data: [], nextCursor: null, hasMore: false };
  }
};

export const getRelativeTime = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
};

const formatSalary = (min?: number, max?: number, currency = 'USD') => {
  if (!min && !max) return undefined;
  const formatNum = (num: number) => {
    if (num >= 100000) {
      return `${(num / 100000).toFixed(0)}L`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}k`;
    }
    return num.toString();
  };
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : '';
  if (min && max) return `${symbol}${formatNum(min)} - ${symbol}${formatNum(max)}`;
  if (min) return `${symbol}${formatNum(min)}+`;
  if (max) return `Up to ${symbol}${formatNum(max)}`;
  return undefined;
};

const extractRequirements = (description?: string): string[] => {
  if (!description) return [];
  const lines = description.split('\n');
  const reqs: string[] = [];
  let capture = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.toLowerCase().includes('### requirements') ||
      trimmed.toLowerCase().includes('### responsibilities') ||
      trimmed.toLowerCase().includes('key responsibilities')
    ) {
      capture = true;
      continue;
    }
    if (capture) {
      if (trimmed.startsWith('###')) {
        break;
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
        reqs.push(trimmed.replace(/^[-•*]\s*/, ''));
      }
    }
  }
  return reqs;
};

export const getJobById = async (jobId: string): Promise<Job | null> => {
  try {
    const response = await api.get(`/jobs/${jobId}`);
    const job = response.data;
    if (!job) return null;

    const respondedOffers = useJobStore.getState().respondedOffers;
    const offerResponse = respondedOffers[job.job_id] || respondedOffers[job.offer_id];
    let status = (job.is_offer ? job.offerStatus : undefined) || job.applicationStatus;
    if (job.is_offer && offerResponse) {
      status = offerResponse === 'accept' ? 'Accepted' : 'Declined';
    }
    if (status) {
      status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }

    const formattedJob: Job = {
      id: job.job_id,
      title: job.title,
      company: job.company_name,
      company_logo: job.company_logo,
      location: job.location,
      job_type: job.job_type || 'Full time',
      experience: (job.experience_min != null && job.experience_max != null)
        ? `${job.experience_min}-${job.experience_max} Yrs`
        : (job.experience_level || '0-2 Yrs'),
      work_mode: job.work_mode || 'Hybrid',
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency || 'USD',
      salary_display: formatSalary(job.salary_min, job.salary_max, job.salary_currency),
      posted_at: getRelativeTime(job.created_at),
      description: job.description || '',
      requirements: extractRequirements(job.description),
      is_saved: job.isSaved || job.is_saved || false,
      is_applied: job.hasApplied || job.is_applied || false,
      is_offer: job.is_offer || false,
      is_closed: job.status === 'CLOSED' || job.is_active === false,
      is_available: job.status !== 'CLOSED' && job.is_active !== false,
      is_followed: job.is_followed || false,
      org_id: job.org_id,
      recruiter_id: job.recruiter_id,
      application_status: status,
      offer_id: job.offer_id,
      offer_days_left: job.offer_days_left || 7,
      offer_expiry_text: job.offer_expiry_text || 'Ends in 7 days',
      recruiter_name: job.recruiter_name,
      recruiter_title: job.recruiter_title || 'HR Manager',
      recruiter_avatar: job.recruiter_avatar,
      recruiter_message: job.recruiter_message || undefined,
      response_rate: job.response_rate,
      avg_reply: job.avg_reply,
    };

    return formattedJob;
  } catch (error) {
    console.error("Failed to fetch job details:", error);
    return null;
  }
};

export const saveJob = async (jobId: string, shouldSave: boolean): Promise<boolean> => {
  try {
    if (shouldSave) {
      await api.post(`/jobs/${jobId}/save`);
    } else {
      await api.delete(`/jobs/${jobId}/save`);
    }
    return true;
  } catch (error) {
    console.error("Failed to save/unsave job:", error);
    throw error;
  }
};

export const applyJob = async (jobId: string, formData?: FormData, jsonBody?: any): Promise<boolean> => {
  try {
    if (formData) {
      await api.post(`/jobs/${jobId}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } else if (jsonBody) {
      await api.post(`/jobs/${jobId}/apply`, jsonBody);
    } else {
      await api.post(`/jobs/${jobId}/apply`);
    }
    return true;
  } catch (error) {
    console.error("Failed to apply for job:", error);
    throw error;
  }
};

export const getRecentResumes = async (): Promise<any[]> => {
  try {
    const response = await api.get('/jobs/applications/me/resumes');
    return response.data;
  } catch (error) {
    console.error('Error getting recent resumes:', error);
    return [];
  }
};

export const getMyApplications = async (): Promise<Job[]> => {
  try {
    const response = await api.get('/jobs/applications/me', {
      params: { limit: 100 }
    });
    const jobs = response.data;
    
    return jobs.map((job: any) => ({
      id: job.job_id,
      title: job.title,
      company: job.company_name,
      location: job.location,
      work_type: job.job_type || 'Full time',
      work_mode: job.work_mode,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency,
      posted_at: getRelativeTime(job.created_at),
      applied_date_display: `Applied ${getRelativeTime(job.applied_at)}`,
      description: job.description,
      experience: (job.experience_min != null && job.experience_max != null) 
        ? `${job.experience_min}-${job.experience_max}Yrs` 
        : (job.experience_level || '0-2Yrs'),
      is_saved: job.isSaved || job.is_saved || false,
      is_applied: true,
      is_offer: false,
      tags: job.tags || [],
      application_status: job.applicationStatus || 'Applied',
      is_available: job.status !== 'CLOSED' && job.is_active !== false,
      is_closed: job.status === 'CLOSED' || job.is_active === false
    }));
  } catch (error) {
    console.error("Failed to fetch applications:", error);
    return [];
  }
};

export const getJobApplicants = async (jobId: string, status?: string) => {
  const params = status && status !== 'all' ? { status } : {};
  const response = await api.get(`/jobs/${jobId}/applicants`, { params });
  return response.data;
};

export const getApplicationDetail = async (appId: string) => {
  const response = await api.get(`/jobs/applications/${appId}`);
  return response.data;
};

export const getApplicationAnalysis = async (appId: string) => {
  const response = await api.get(`/jobs/applications/${appId}/analysis`);
  return response.data;
};

export const updateApplicationStatus = async (appId: string, status: string) => {
  const response = await api.put(`/jobs/applications/${appId}/status`, { status });
  return response.data;
};

export const upsertApplicationNote = async (appId: string, note: string) => {
  const response = await api.put(`/jobs/applications/${appId}/note`, { note });
  return response.data;
};

export const toggleFollowEntity = async (entityId: string, entityType: 'user' | 'org', currentlyFollowed: boolean) => {
  const basePath = entityType === 'org' ? '/organizations' : '/users';
  if (currentlyFollowed) {
    const response = await api.delete(`${basePath}/${entityId}/unfollow`);
    return response.data;
  } else {
    const response = await api.post(`${basePath}/${entityId}/follow`);
    return response.data;
  }
};

export const getJobDetail = async (jobId: string) => {
  const response = await api.get(`/jobs/${jobId}`);
  return response.data;
};

export const withdrawApplication = async (jobId: string): Promise<boolean> => {
  try {
    await api.delete(`/jobs/${jobId}/apply`);
    return true;
  } catch (error) {
    console.error("Failed to withdraw application:", error);
    throw error;
  }
};

export const getApplicationStats = async (): Promise<{ totalApplied: number; shortlisted: number }> => {
  try {
    const response = await api.get('/jobs/applications/me/stats');
    return response.data;
  } catch (error) {
    console.error('Failed to get application stats:', error);
    return { totalApplied: 0, shortlisted: 0 };
  }
};

export const getMyOffers = async (): Promise<Job[]> => {
  try {
    const response = await api.get('/jobs/offers/me');
    const offers = response.data || [];
    
    return offers.map((job: any) => {
      const respondedOffers = useJobStore.getState().respondedOffers;
      const offerResponse = respondedOffers[job.offer_id] || respondedOffers[job.job_id];
      let status = job.status || (job.is_offer ? job.status : undefined);
      if (offerResponse) {
        status = offerResponse === 'accept' ? 'Accepted' : 'Declined';
      }
      if (status) {
        status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      }

      const formattedJob: Job = {
        id: job.job_id,
        title: job.title,
        company: job.company_display_name || job.company_name,
        company_logo: job.company_logo,
        location: job.location,
        job_type: job.job_type || 'Full time',
        experience: job.experience_level || '0-2 Yrs',
        work_mode: job.work_mode || 'Hybrid',
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_currency: job.salary_currency || 'USD',
        salary_display: formatSalary(job.salary_min, job.salary_max, job.salary_currency),
        posted_at: getRelativeTime(job.created_at),
        description: job.description || '',
        requirements: extractRequirements(job.description),
        is_saved: useJobStore.getState().savedJobIds.has(job.job_id),
        is_applied: useJobStore.getState().appliedJobIds.has(job.job_id),
        is_offer: true,
        is_closed: false,
        is_followed: useJobStore.getState().followedCompanies.has(job.company_name),
        org_id: job.org_id,
        recruiter_id: job.recruiter_id,
        application_status: status,
        offer_id: job.offer_id,
        offer_days_left: 7,
        offer_expiry_text: 'Ends in 7 days',
        recruiter_name: job.sent_by_name,
        recruiter_title: 'HR Manager',
        recruiter_avatar: undefined,
        recruiter_message: job.message || undefined,
      };

      return formattedJob;
    });
  } catch (error) {
    console.error("Failed to fetch my offers:", error);
    return [];
  }
};

export const respondToOffer = async (offerId: string, action: 'accept' | 'decline'): Promise<boolean> => {
  try {
    const backendAction = action === 'accept' ? 'accepted' : 'declined';
    await api.patch(`/jobs/offers/${offerId}/respond`, { action: backendAction });
    return true;
  } catch (error) {
    console.error("Failed to respond to offer:", error);
    throw error;
  }
};

// Mock Listings Data
const DUMMY_JOB_LISTINGS: JobListing[] = [];

export const getMyListings = async (status?: string, cursor?: string, limit: number = 10) => {
  try {
    const params: Record<string, any> = { limit };
    if (cursor) params.cursor = cursor;
    if (status && status !== 'All') {
      // Map frontend labels to backend param: "In review" -> "IN_REVIEW", "Drafts" -> "DRAFT"
      let statusParam = status;
      if (status === 'Drafts') statusParam = 'DRAFT';
      else if (status === 'In review') statusParam = 'IN_REVIEW';
      else statusParam = status.replace(/ /g, '_').toUpperCase();
      params.status = statusParam;
    }

    const actorType = api.defaults.headers.common["x-actor-type"];
    const actorId = api.defaults.headers.common["x-actor-id"];
    
    const endpoint = actorType === "ORGANIZATION" && actorId
      ? `/organizations/${actorId}/jobs?scope=internal`
      : `/jobs/my`;

    const response = await api.get(endpoint, { params });
    const responseData = response.data;

    // Parse structured response { jobs, nextCursor, hasMore, counts }
    const fetchedJobs = responseData.jobs || responseData;
    const mapped = fetchedJobs.map((job: any) => ({
      id: job.job_id,
      title: job.title,
      status: job.status,
      posted_at: getRelativeTime(job.created_at),
      last_edited: job.updated_at,
      company: job.company_name,
      location: job.location,
      description: job.description,
      work_type: job.job_type,
      work_mode: job.work_mode,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency,
      org_id: job.org_id
    })) as JobListing[];

    const nextCursor = responseData.nextCursor || null;
    const hasMore = responseData.hasMore ?? false;
    const counts: ListingsCounts = responseData.counts || { all: 0, active: 0, closed: 0, draft: 0, inReview: 0 };

    return { data: mapped, nextCursor, hasMore, counts };
  } catch (error) {
    console.error("Failed to fetch listings:", error);
    return { data: [], nextCursor: null, hasMore: false, counts: { all: 0, active: 0, closed: 0, draft: 0, inReview: 0 } as ListingsCounts };
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

export const generateJobDescription = async (
  jobId: string,
  rolePrompt: string
): Promise<any> => {
  try {
    const response = await api.post(`/jobs/${jobId}/generate`, {
      role: rolePrompt
    });
    return response.data;
  } catch (error) {
    console.error('Failed to trigger background AI generation:', error);
    throw error;
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
  try {
    await api.post(`/jobs/${id}/close`);
    return true;
  } catch (error) {
    console.error("Failed to close job listing:", error);
    return false;
  }
};

export const deleteJobListing = async (id: string): Promise<boolean> => {
  try {
    await api.delete(`/jobs/${id}`);
    return true;
  } catch (error) {
    console.error("Failed to delete job listing:", error);
    return false;
  }
};

const mapBackendToJobOffer = (raw: any): JobOffer => {
  const computeDaysRemaining = (expiresAt?: string): number => {
    if (!expiresAt) return 30;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return {
    id: raw.offer_id,
    job_role: raw.title,
    days_remaining: computeDaysRemaining(raw.expires_at),
    company_name: raw.company_display_name || raw.company_name,
    location: raw.location || 'Remote',
    status: raw.status as 'pending' | 'accepted' | 'declined',
    note: raw.message || undefined,
    recruiter: {
      name: raw.sent_by_name || 'Recruiter',
      headline: raw.company_display_name || '',
      avatar: raw.company_logo || undefined,
    },
  };
};

export const getJobOffers = async () => {
  try {
    const response = await api.get('/jobs/offers/me');
    const mappedOffers = (response.data || []).map(mapBackendToJobOffer);
    return { data: mappedOffers, success: true };
  } catch (error) {
    console.error("Failed to fetch job offers:", error);
    return { data: [], success: false };
  }
};

export const acceptJobOffer = async (offerId: string) => {
  try {
    await api.patch(`/jobs/offers/${offerId}/respond`, { action: 'accepted' });
    return { success: true };
  } catch (error) {
    console.error("Failed to accept job offer:", error);
    return { success: false };
  }
};

export const declineJobOffer = async (offerId: string) => {
  try {
    await api.patch(`/jobs/offers/${offerId}/respond`, { action: 'declined' });
    return { success: true };
  } catch (error) {
    console.error("Failed to decline job offer:", error);
    return { success: false };
  }
};


