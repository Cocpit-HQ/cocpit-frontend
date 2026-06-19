import { Job, JobsFilter } from '../types/jobs.types';
import { DUMMY_JOBS } from '../utils/jobs.utils';

export const getJobs = async (filters?: JobsFilter, cursor?: string) => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 300));

  let filteredJobs = [...DUMMY_JOBS];

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
    // Add additional filters if needed
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
  return DUMMY_JOBS.find(j => j.id === jobId) || null;
};

export const saveJob = async (jobId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  // Mock API success
  return true;
};

export const applyJob = async (jobId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  // Mock API success
  return true;
};
