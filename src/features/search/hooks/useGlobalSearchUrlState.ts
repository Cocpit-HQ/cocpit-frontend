import { useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { SearchCategory, SearchFilterState } from '../types/search.types';

export const isSafeExitUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string' || !url.startsWith('/')) return false;
  // Reject protocol-relative URLs (open-redirect security risk)
  if (url.startsWith('//') || url.startsWith('/\\')) return false;
  // Reject loops back into search
  if (url.startsWith('/search') || url.startsWith('/jobs/search')) return false;
  return true;
};

export const isInvalidSearchExit = (url: string | null | undefined): boolean => !isSafeExitUrl(url);

const parseMultiParam = (val: string | null | undefined): string[] => {
  if (!val || typeof val !== 'string') return [];
  const trimmed = val.trim();
  if (!trimmed) return [];
  if (trimmed.includes('|')) {
    return trimmed.split('|').map((s) => s.trim()).filter(Boolean);
  }
  return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
};

const parseLocationParam = (val: string | null | undefined): string[] => {
  if (!val || typeof val !== 'string') return [];
  const trimmed = val.trim();
  if (!trimmed) return [];
  // Location strings frequently include commas (e.g. "Pune, Maharashtra, India").
  // Split on '|' when multiple locations are chosen, otherwise treat as a single location.
  if (trimmed.includes('|')) {
    return trimmed.split('|').map((s) => s.trim()).filter(Boolean);
  }
  return [trimmed];
};

export function useGlobalSearchUrlState() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const q = searchParams.get('q') || '';
  const rawType = searchParams.get('type') || 'all';
  const type: SearchCategory = (
    ['all', 'people', 'jobs', 'companies', 'institutes', 'posts', 'hashtags'].includes(rawType)
      ? rawType
      : 'all'
  ) as SearchCategory;

  const cursor = searchParams.get('cursor') || null;

  const currentSearchUrl = useMemo(
    () => `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
    [pathname, searchParams]
  );

  const filters = useMemo<SearchFilterState>(() => {
    const job_type = searchParams.get('job_type')?.split(',').filter(Boolean) || [];
    const experience_level = searchParams.get('experience_level')?.split(',').filter(Boolean) || [];
    const work_mode = searchParams.get('work_mode')?.split(',').filter(Boolean) || [];
    const min_salary = searchParams.get('min_salary') || undefined;
    const max_salary = searchParams.get('max_salary') || undefined;
    const salary_range = searchParams.get('salary_range')?.split(',').filter(Boolean) || [];
    const industry = parseMultiParam(searchParams.get('industry'));
    const date_posted = searchParams.get('date_posted') || undefined;
    const company = parseMultiParam(searchParams.get('company'));
    const is_verified = searchParams.get('is_verified') === 'true' ? true : undefined;
    const actively_hiring = searchParams.get('actively_hiring') === 'true' ? true : undefined;
    const location = parseLocationParam(searchParams.get('location'));
    const role = parseMultiParam(searchParams.get('role'));
    const institute_type = parseMultiParam(searchParams.get('institute_type'));
    const institute = parseMultiParam(searchParams.get('institute') || searchParams.get('school'));
    const org_size = parseMultiParam(searchParams.get('org_size'));
    const org_type = parseMultiParam(searchParams.get('org_type') || searchParams.get('type_filter'));
    const content_type = parseMultiParam(searchParams.get('content_type'));
    const posted_by = parseMultiParam(searchParams.get('posted_by'));
    const hashtag = parseMultiParam(searchParams.get('hashtag') || searchParams.get('hashtags'));
    const sort_by = searchParams.get('sort_by') || undefined;

    return {
      job_type: job_type.length > 0 ? job_type : undefined,
      experience_level: experience_level.length > 0 ? experience_level : undefined,
      work_mode: work_mode.length > 0 ? work_mode : undefined,
      min_salary,
      max_salary,
      salary_range: salary_range.length > 0 ? salary_range : undefined,
      industry: industry.length > 0 ? industry : undefined,
      industry_type: industry.length > 0 ? industry : undefined,
      date_posted,
      company: company.length > 0 ? company : undefined,
      is_verified,
      actively_hiring,
      location: location.length > 0 ? location : undefined,
      role: role.length > 0 ? role : undefined,
      institute_type: institute_type.length > 0 ? institute_type : undefined,
      institute: institute.length > 0 ? institute : undefined,
      school: institute.length > 0 ? institute : undefined,
      org_size: org_size.length > 0 ? org_size : undefined,
      org_type: org_type.length > 0 ? org_type : undefined,
      type: org_type.length > 0 ? org_type : undefined,
      content_type: content_type.length > 0 ? content_type : undefined,
      posted_by: posted_by.length > 0 ? posted_by : undefined,
      hashtag: hashtag.length > 0 ? hashtag : undefined,
      sort_by,
    };
  }, [searchParams]);

  // Synchronize initial search step and search origin on mount / URL change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentPathWithQuery = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    sessionStorage.setItem('cocpit_last_search_url', currentPathWithQuery);

    // 1. Record search origin if coming from outside search
    const referrer = document.referrer;
    if (
      referrer &&
      referrer.includes(window.location.host) &&
      !referrer.includes('/search')
    ) {
      try {
        const urlObj = new URL(referrer);
        sessionStorage.setItem('cocpit_search_origin', urlObj.pathname + urlObj.search);
      } catch {
        // ignore
      }
    }

    // 2. Synchronize search step stack
    try {
      const rawSteps = sessionStorage.getItem('cocpit_search_steps');
      let steps: string[] = rawSteps ? JSON.parse(rawSteps) : [];

      if (!steps || steps.length === 0) {
        steps = [currentPathWithQuery];
        sessionStorage.setItem('cocpit_search_steps', JSON.stringify(steps));
      } else {
        const existingIdx = steps.lastIndexOf(currentPathWithQuery);
        if (existingIdx !== -1) {
          steps = steps.slice(0, existingIdx + 1);
          sessionStorage.setItem('cocpit_search_steps', JSON.stringify(steps));
        }
      }
    } catch {
      // ignore
    }
  }, [pathname, searchParams]);

  const updateUrl = useCallback(
    (
      newParams: Record<string, string | null | undefined>,
      options?: { push?: boolean }
    ) => {
      const current = new URLSearchParams(searchParams.toString());

      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          current.delete(key);
        } else {
          current.set(key, value);
        }
      });

      const nextUrl = `${pathname}${current.toString() ? `?${current.toString()}` : ''}`;
      const currentPathWithQuery = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('cocpit_last_search_url', nextUrl);

        try {
          const rawSteps = sessionStorage.getItem('cocpit_search_steps');
          let steps: string[] = rawSteps ? JSON.parse(rawSteps) : [];

          if (options?.push && nextUrl !== currentPathWithQuery) {
            const currentIndex = steps.lastIndexOf(currentPathWithQuery);
            if (currentIndex !== -1) {
              steps = steps.slice(0, currentIndex + 1);
            }
            if (steps[steps.length - 1] !== nextUrl) {
              steps.push(nextUrl);
            }
          } else if (steps.length > 0) {
            steps[steps.length - 1] = nextUrl;
          } else {
            steps = [nextUrl];
          }

          sessionStorage.setItem('cocpit_search_steps', JSON.stringify(steps));
        } catch {
          // ignore
        }
      }

      if (options?.push) {
        router.push(nextUrl, { scroll: false });
      } else {
        router.replace(nextUrl, { scroll: false });
      }
    },
    [searchParams, router, pathname]
  );

  const setQuery = useCallback(
    (newQ: string) => {
      const trimmed = newQ.trim();
      if (trimmed === q) return;
      updateUrl(
        {
          q: trimmed,
          cursor: null,
        },
        { push: true }
      );
    },
    [q, updateUrl]
  );

  const setType = useCallback(
    (newType: SearchCategory) => {
      if (newType === type) return;
      updateUrl(
        {
          type: newType,
          job_type: null,
          experience_level: null,
          work_mode: null,
          min_salary: null,
          max_salary: null,
          salary_range: null,
          industry: null,
          date_posted: null,
          is_verified: null,
          actively_hiring: null,
          role: null,
          institute_type: null,
          institute: null,
          school: null,
          org_size: null,
          org_type: null,
          content_type: null,
          posted_by: null,
          hashtag: null,
          hashtags: null,
          sort_by: null,
          cursor: null,
        },
        { push: true }
      );
    },
    [type, updateUrl]
  );

  const exitSearch = useCallback(() => {
    let targetDestination: string | null = null;

    const returnTo = searchParams?.get('returnTo');
    if (returnTo && isSafeExitUrl(returnTo)) {
      targetDestination = returnTo;
    } else if (typeof window !== 'undefined') {
      const origin = sessionStorage.getItem('cocpit_search_origin');
      if (origin && isSafeExitUrl(origin)) {
        targetDestination = origin;
      } else {
        const outsideSearch = sessionStorage.getItem('cocpit_last_location_outside_search');
        if (outsideSearch && isSafeExitUrl(outsideSearch)) {
          targetDestination = outsideSearch;
        } else {
          const preSearch = sessionStorage.getItem('cocpit_pre_search_url');
          if (preSearch && isSafeExitUrl(preSearch)) {
            targetDestination = preSearch;
          }
        }
      }
    }

    // Clean up temporary search storage keys only after resolving destination
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('cocpit_search_steps');
      sessionStorage.removeItem('cocpit_last_search_url');
      sessionStorage.removeItem('cocpit_search_origin');
      sessionStorage.removeItem('cocpit_pre_search_url');
    }

    if (targetDestination) {
      router.push(targetDestination);
      return;
    }

    // Default fallbacks without history back:
    // If in jobs category, close directly to jobs
    if (type === 'jobs') {
      router.push('/jobs');
      return;
    }

    // Global default: return to main feed
    router.push('/feed');
  }, [searchParams, router, type]);

  const goBackStep = useCallback(() => {
    if (typeof window === 'undefined') {
      router.push('/feed');
      return;
    }

    try {
      const rawSteps = sessionStorage.getItem('cocpit_search_steps');
      let steps: string[] = rawSteps ? JSON.parse(rawSteps) : [];

      if (steps.length > 1) {
        steps.pop();
        const prevStepUrl = steps[steps.length - 1];
        sessionStorage.setItem('cocpit_search_steps', JSON.stringify(steps));
        router.push(prevStepUrl, { scroll: false });
        return;
      }
    } catch {
      // ignore
    }

    // If stack has only 1 step or is empty, exit search cleanly to origin
    exitSearch();
  }, [exitSearch, router]);

  const toggleFilterArray = useCallback(
    (key: keyof SearchFilterState, value: string) => {
      const rawVal = filters[key];
      const currentArr: string[] = Array.isArray(rawVal)
        ? (rawVal as string[])
        : typeof rawVal === 'string' && rawVal
        ? [rawVal]
        : [];

      const lowerVal = value.toLowerCase();
      const lowerNoUnderscore = lowerVal.replace(/_/g, ' ');
      const existsIndex = currentArr.findIndex((item) => {
        const itemLower = item.toLowerCase();
        return (
          itemLower === lowerVal ||
          itemLower === lowerNoUnderscore ||
          itemLower.replace(/_/g, ' ') === lowerNoUnderscore
        );
      });

      const updated = existsIndex >= 0
        ? currentArr.filter((_, idx) => idx !== existsIndex)
        : [...currentArr, value];

      // Join with '|' for location, company, role, org_size, industry, hashtag, institute to safely protect items with commas
      const delimiter = ['location', 'company', 'role', 'org_size', 'industry', 'hashtag', 'institute', 'school'].includes(key) ? '|' : ',';

      updateUrl({
        [key]: updated.length > 0 ? updated.join(delimiter) : null,
        cursor: null,
      });
    },
    [filters, updateUrl]
  );

  const setFilterValue = useCallback(
    (key: keyof SearchFilterState, value: string | null | undefined) => {
      updateUrl({
        [key]: value || null,
        cursor: null,
      });
    },
    [updateUrl]
  );

  const toggleVerified = useCallback(() => {
    const nextVal = filters.is_verified ? null : 'true';
    updateUrl({
      is_verified: nextVal,
      cursor: null,
    });
  }, [filters.is_verified, updateUrl]);

  const toggleActivelyHiring = useCallback(() => {
    const nextVal = filters.actively_hiring ? null : 'true';
    updateUrl({
      actively_hiring: nextVal,
      cursor: null,
    });
  }, [filters.actively_hiring, updateUrl]);

  const clearAllFilters = useCallback(() => {
    updateUrl({
      job_type: null,
      experience_level: null,
      work_mode: null,
      min_salary: null,
      max_salary: null,
      salary_range: null,
      industry: null,
      date_posted: null,
      company: null,
      is_verified: null,
      actively_hiring: null,
      location: null,
      role: null,
      institute_type: null,
      institute: null,
      school: null,
      org_size: null,
      org_type: null,
      type: null,
      content_type: null,
      posted_by: null,
      hashtag: null,
      hashtags: null,
      sort_by: null,
      cursor: null,
    });
  }, [updateUrl]);

  const setCursor = useCallback(
    (newCursor: string | null) => {
      updateUrl({
        cursor: newCursor,
      });
    },
    [updateUrl]
  );

  return {
    q,
    type,
    cursor,
    filters,
    currentSearchUrl,
    setQuery,
    setType,
    toggleFilterArray,
    setFilterValue,
    toggleVerified,
    toggleActivelyHiring,
    clearAllFilters,
    setCursor,
    goBackStep,
    exitSearch,
  };
}
