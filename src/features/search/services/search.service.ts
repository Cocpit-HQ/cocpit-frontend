import api from '@/lib/axios';
import {
  GlobalSearchParams,
  StageAResponse,
  StageBCategoryResponse,
  SearchPersonItem,
  SearchCompanyItem,
  SearchInstituteItem,
  SearchHashtagItem,
} from '../types/search.types';
import { Job } from '@/features/jobs/types/jobs.types';

export const searchService = {
  async searchAll(query: string): Promise<StageAResponse> {
    const response = await api.get('/search', {
      params: {
        q: query,
        type: 'all',
      },
    });
    const d = response.data;
    const payload = d?.results || d?.sections ? d : (d?.data?.results || d?.data?.sections ? d.data : d);
    return payload;
  },

  async searchCategory<T = any>(params: GlobalSearchParams): Promise<StageBCategoryResponse<T>> {
    const queryParams: Record<string, any> = {
      q: params.q,
      type: params.type || 'all',
    };

    if (params.cursor) {
      queryParams.cursor = params.cursor;
    }

    if (params.limit) {
      queryParams.limit = params.limit;
    }

    // Unpack filters if present (for jobs, people, companies, institutes)
    if (params.filters) {
      const f = params.filters;
      if (f.job_type && f.job_type.length > 0) {
        queryParams.job_type = f.job_type.join(',');
        queryParams.jobType = queryParams.job_type;
      }
      if (f.experience_level && f.experience_level.length > 0) {
        queryParams.experience_level = f.experience_level.join(',');
        queryParams.experienceLevel = queryParams.experience_level;
      }
      if (f.work_mode && f.work_mode.length > 0) {
        queryParams.work_mode = f.work_mode.join(',');
        queryParams.workMode = queryParams.work_mode;
      }
      if (f.min_salary) queryParams.min_salary = f.min_salary;
      if (f.max_salary) queryParams.max_salary = f.max_salary;
      if (f.salary_range && f.salary_range.length > 0) {
        queryParams.salary_range = f.salary_range.join(',');
        queryParams.salaryRanges = queryParams.salary_range;
      }
      if (f.industry && f.industry.length > 0) {
        queryParams.industry = Array.isArray(f.industry) ? f.industry.join('|') : f.industry;
      }
      if (f.date_posted) {
        queryParams.date_posted = f.date_posted;
        queryParams.datePosted = f.date_posted;
      }
      if (f.company && f.company.length > 0) {
        queryParams.company = Array.isArray(f.company) ? f.company.join('|') : f.company;
      }
      if (f.is_verified !== undefined) {
        queryParams.is_verified = f.is_verified ? 'true' : 'false';
        queryParams.verified = queryParams.is_verified;
      }
      if (f.location) {
        queryParams.location = Array.isArray(f.location) ? f.location.join('|') : f.location;
      }
      if (f.role) {
        queryParams.role = Array.isArray(f.role) ? f.role.join('|') : f.role;
      }
      if (f.institute_type && f.institute_type.length > 0) {
        queryParams.institute_type = Array.isArray(f.institute_type) ? f.institute_type.join(',') : f.institute_type;
      }
      if (f.institute && f.institute.length > 0) {
        queryParams.institute = Array.isArray(f.institute) ? f.institute.join('|') : f.institute;
      }
      if (f.org_size) {
        queryParams.org_size = Array.isArray(f.org_size) ? f.org_size.join('|') : f.org_size;
      }
      if (f.org_type || f.type) {
        const t = f.org_type || f.type;
        // Do NOT overwrite queryParams.type (which holds the search vertical e.g. 'companies', 'jobs')
        queryParams.org_type = Array.isArray(t) ? t.join('|') : t;
        queryParams.company_type = queryParams.org_type;
      }
      if (f.actively_hiring !== undefined) {
        queryParams.actively_hiring = f.actively_hiring ? 'true' : 'false';
      }
      if (f.content_type) {
        queryParams.content_type = Array.isArray(f.content_type) ? f.content_type.join(',') : f.content_type;
      }
      if (f.posted_by) {
        queryParams.posted_by = Array.isArray(f.posted_by) ? f.posted_by.join(',') : f.posted_by;
      }
      if (f.hashtag && f.hashtag.length > 0) {
        queryParams.hashtag = Array.isArray(f.hashtag) ? f.hashtag.join(',') : f.hashtag;
      }
      if (f.sort_by) queryParams.sort_by = f.sort_by;
    }

    const response = await api.get('/search', {
      params: queryParams,
    });
    const raw = response.data?.data && Array.isArray(response.data?.data?.items) ? response.data.data : response.data;
    const next_cursor = raw?.next_cursor || raw?.pagination?.next_cursor || null;
    const has_more = Boolean(raw?.has_more ?? raw?.pagination?.has_more);
    return {
      ...raw,
      next_cursor,
      has_more,
    };
  },

  async searchPeople(params: GlobalSearchParams): Promise<StageBCategoryResponse<SearchPersonItem>> {
    return this.searchCategory<SearchPersonItem>({ ...params, type: 'people' });
  },

  async searchJobs(params: GlobalSearchParams): Promise<StageBCategoryResponse<Job>> {
    return this.searchCategory<Job>({ ...params, type: 'jobs' });
  },

  async searchCompanies(params: GlobalSearchParams): Promise<StageBCategoryResponse<SearchCompanyItem>> {
    return this.searchCategory<SearchCompanyItem>({ ...params, type: 'companies' });
  },

  async searchInstitutes(params: GlobalSearchParams): Promise<StageBCategoryResponse<SearchInstituteItem>> {
    return this.searchCategory<SearchInstituteItem>({ ...params, type: 'institutes' });
  },

  async searchPosts(params: GlobalSearchParams): Promise<StageBCategoryResponse<any>> {
    return this.searchCategory<any>({ ...params, type: 'posts' });
  },

  async searchHashtags(params: GlobalSearchParams): Promise<StageBCategoryResponse<SearchHashtagItem>> {
    return this.searchCategory<SearchHashtagItem>({ ...params, type: 'hashtags' });
  },
};
