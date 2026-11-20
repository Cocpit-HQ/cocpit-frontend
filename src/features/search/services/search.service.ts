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
import { CursorPaginatedResult } from '@/features/jobs/services/jobs.service';
import { getTrendingHashtags, searchHashtags } from '@/services/api/hashtags';

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

        if (!queryParams.min_salary && !queryParams.max_salary) {
          for (const item of f.salary_range) {
            const m = typeof item === 'string' && item.match(/^Custom:(\d+)?-(\d+)?$/i);
            if (m) {
              const pMin = m[1] ? Number(m[1]) : 0;
              const pMax = m[2] ? Number(m[2]) : 0;
              if (pMin > 0) queryParams.min_salary = pMin;
              if (pMax > 0) queryParams.max_salary = pMax;
              break;
            }
          }
        }
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
      if (f.skills && f.skills.length > 0) {
        queryParams.skills = Array.isArray(f.skills) ? f.skills.join('|') : f.skills;
      }
      if (f.experience && f.experience.length > 0) {
        queryParams.experience = Array.isArray(f.experience) ? f.experience.join('|') : f.experience;
      }
      if (f.open_to && f.open_to.length > 0) {
        queryParams.open_to = Array.isArray(f.open_to) ? f.open_to.join('|') : f.open_to;
      }
      if (f.sector && f.sector.length > 0) {
        queryParams.sector = Array.isArray(f.sector) ? f.sector.join('|') : f.sector;
      }
      if (f.specific_search) {
        queryParams.specific_search = f.specific_search;
      }
      if (f.mentions_org !== undefined) {
        queryParams.mentions_org = f.mentions_org ? 'true' : 'false';
      }
      if (f.mentions_company !== undefined) {
        queryParams.mentions_company = f.mentions_company ? 'true' : 'false';
      }
      if (f.scope) {
        queryParams.scope = f.scope;
      }
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

/**
 * Fetch skills with cursor pagination from the profile module's /profile/skills endpoint.
 * Directly compatible with SearchableCursorFilterChip.
 */
export async function getPaginatedSkills(
  query?: string,
  cursor?: string,
  limit = 50
): Promise<CursorPaginatedResult<string>> {
  const params: Record<string, string | number> = { limit };
  if (query && query.trim()) params.q = query.trim();
  if (cursor) params.cursor = cursor;

  const response = await api.get('/profile/skills', { params });
  const data = response.data?.data;
  const rawItems = data?.items || [];
  const items = rawItems.map((it: any) =>
    typeof it === 'string' ? it : it?.name || it?.skill_name || ''
  );

  return {
    items: items.filter(Boolean),
    nextCursor: data?.next_cursor ? String(data.next_cursor) : null,
    hasMore: Boolean(data?.has_more),
  };
}

/**
 * Unified cursor-paginated hashtag search provider.
 * Supports:
 * - Empty query: returns trending/popular hashtags with keyset cursor pagination
 * - Non-empty query: returns autocomplete matched hashtags with keyset cursor pagination
 * - Directly compatible with SearchableCursorFilterChip & filterOptionsCache
 */
export async function getPaginatedHashtags(
  query?: string,
  cursor?: string,
  limit = 25
): Promise<CursorPaginatedResult<string>> {
  const cleanTerm = (query || '').trim().replace(/^#/, '');
  const params: Record<string, any> = {
    type: 'hashtags',
    limit,
    sort_by: cleanTerm ? 'most_popular' : 'trending',
  };
  if (cleanTerm) {
    params.q = cleanTerm;
  }
  if (cursor) {
    params.cursor = cursor;
  }

  try {
    const response = await api.get('/search', { params });
    const raw = response.data?.data || response.data;
    const rawItems = raw?.items || [];
    const items = rawItems
      .map((item: any) => {
        if (typeof item === 'string') return item.replace(/^#/, '');
        return (item?.tag || '').replace(/^#/, '');
      })
      .filter(Boolean);

    const nextCursor = raw?.next_cursor || raw?.pagination?.next_cursor || null;
    const hasMore = Boolean(raw?.has_more ?? raw?.pagination?.has_more);

    // Fallback: If /search?type=hashtags returned no items on initial browse, fallback to trending
    if (items.length === 0 && !cursor && !cleanTerm) {
      const trending = await getTrendingHashtags();
      return {
        items: trending.map((t) => t.tag.replace(/^#/, '')),
        nextCursor: null,
        hasMore: false,
      };
    }

    return {
      items,
      nextCursor,
      hasMore,
    };
  } catch (err) {
    // Graceful fallback to legacy endpoints if /search is temporarily unavailable
    try {
      if (cleanTerm) {
        const searchRes = await searchHashtags(cleanTerm);
        return {
          items: (searchRes.tags || []).map((t) => t.tag.replace(/^#/, '')),
          nextCursor: null,
          hasMore: false,
        };
      } else {
        const trending = await getTrendingHashtags();
        return {
          items: trending.map((t) => t.tag.replace(/^#/, '')),
          nextCursor: null,
          hasMore: false,
        };
      }
    } catch {
      return { items: [], nextCursor: null, hasMore: false };
    }
  }
}


