import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Job, JobsFilter, JobListing } from '@/features/jobs/types/jobs.types';

export interface CachedList<T> {
  jobs: T[];
  nextCursor?: string;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  hasFetched: boolean;
  lastFetched?: number; // timestamp
}

export interface RecruiterFilters {
  jobType: string[];
  experience: string;
  workMode: string[];
  easyApply: boolean;
  activelyHiring: boolean;
  locations: string[];
  companyType: string[];
  industry: string[];
  salaryRange: string[];
  datePosted: string;
}

export interface JobsUIState {
  // ─── ui slice ─────────────────────────────────────────────
  ui: {
    activeCandidateTab: string;
    activeRecruiterTab: string;
    selectedJobId: string | null;
    loadingUIFlags: Record<string, boolean>;
  };

  // ─── filters slice ────────────────────────────────────────
  filters: {
    search: string;
    location: string;
    sort: string;
    selectedStatusFilter: string;
    selectedDateFilter: string;
    recruiterFilters: RecruiterFilters;
    job_type?: string;
    work_mode?: string;
    experience?: string;
    salary_range?: string | string[];
    date_posted?: string;
    industry?: string;
  };

  // ─── explore slice ────────────────────────────────────────
  explore: CachedList<Job>;

  // ─── applications slice ────────────────────────────────────
  applications: {
    applied: CachedList<Job>;
    saved: CachedList<Job>;
    offers: CachedList<Job>;
    stats: { totalApplied: number; shortlisted: number };
  };

  // ─── recruiter slice ───────────────────────────────────────
  recruiter: {
    published: CachedList<Job>;
    drafts: CachedList<Job>;
    archived: CachedList<Job>;
  };

  // ─── In-memory set checks (maintained for O(1) speed) ────
  savedJobIds: Set<string>;
  appliedJobIds: Set<string>;
  respondedOffers: Record<string, 'accept' | 'decline'>;
  followedCompanies: Set<string>;

  // ─── UI Actions ───────────────────────────────────────────
  setActiveCandidateTab: (tab: string) => void;
  setActiveRecruiterTab: (tab: string) => void;
  setSelectedJobId: (id: string | null) => void;
  setLoadingUIFlag: (key: string, value: boolean) => void;

  // ─── Filter Actions ────────────────────────────────────────
  setCandidateFilterValue: (key: string, value: any) => void;
  setRecruiterFilterValue: (key: keyof RecruiterFilters, value: any) => void;
  setMultipleFilters: (updates: Partial<JobsFilter>) => void;
  resetFilters: () => void;

  // ─── Caching and List Actions ──────────────────────────────
  setExploreList: (updates: Partial<CachedList<Job>>) => void;
  setApplicationsList: (listKey: 'applied' | 'saved' | 'offers', updates: Partial<CachedList<Job>>) => void;
  setRecruiterList: (listKey: 'published' | 'drafts' | 'archived', updates: Partial<CachedList<Job>>) => void;
  setApplicationStats: (stats: { totalApplied: number; shortlisted: number }) => void;

  // ─── Mutation and Optimistic Update Actions ───────────────
  addSavedId: (id: string) => void;
  addSavedIds: (ids: string[]) => void;
  removeSavedId: (id: string) => void;
  addAppliedId: (id: string) => void;
  addAppliedIds: (ids: string[]) => void;
  removeAppliedId: (id: string) => void;
  setOfferResponse: (id: string, action: 'accept' | 'decline') => void;
  toggleFollowCompany: (companyName: string) => void;

  // ─── Recruiter Mutations ────────────────────────────────────
  addRecruiterJob: (listKey: 'published' | 'drafts' | 'archived', job: Job) => void;
  updateRecruiterJob: (job: Job) => void;
  deleteRecruiterJob: (jobId: string) => void;
  publishRecruiterDraft: (jobId: string) => void;

  // ─── Create Job Flow ───────────────────────────────────────
  createJobStep: 'verification' | 'role-input' | 'details' | 'preview';
  createJobTitle: string;
  createJobId: string | null;
  createJobDetails: Partial<JobListing>;
  isDrafting: boolean;
  setCreateJobStep: (step: 'verification' | 'role-input' | 'details' | 'preview') => void;
  setCreateJobTitle: (title: string) => void;
  setCreateJobId: (id: string | null) => void;
  setCreateJobDetails: (details: Partial<JobListing>) => void;
  setIsDrafting: (isDrafting: boolean) => void;
  resetCreateJobFlow: () => void;

  // ─── My Listings Dashboard ─────────────────────────────────
  selectedOfferGroup: any | null;
  setSelectedOfferGroup: (group: any | null) => void;
}

const createEmptyList = <T>(): CachedList<T> => ({
  jobs: [],
  nextCursor: undefined,
  hasMore: true,
  loading: false,
  error: null,
  hasFetched: false,
  lastFetched: undefined,
});

export const useJobStore = create<JobsUIState>()(
  persist(
    (set) => ({
  // ─── Slices Initialization ────────────────────────────────
  ui: {
    activeCandidateTab: 'Explore',
    activeRecruiterTab: 'my-jobs',
    selectedJobId: null,
    loadingUIFlags: {},
  },
  filters: {
    search: '',
    location: '',
    sort: 'recent',
    selectedStatusFilter: 'All',
    selectedDateFilter: 'All time',
    recruiterFilters: {
      jobType: [],
      experience: 'All Levels',
      workMode: [],
      easyApply: false,
      activelyHiring: false,
      locations: [],
      companyType: [],
      industry: [],
      salaryRange: [],
      datePosted: 'Any Time',
    },
    job_type: '',
    work_mode: '',
    experience: '',
    salary_range: '',
    date_posted: '',
    industry: '',
  },
  explore: createEmptyList<Job>(),
  applications: {
    applied: createEmptyList<Job>(),
    saved: createEmptyList<Job>(),
    offers: createEmptyList<Job>(),
    stats: { totalApplied: 0, shortlisted: 0 },
  },
  recruiter: {
    published: createEmptyList<Job>(),
    drafts: createEmptyList<Job>(),
    archived: createEmptyList<Job>(),
  },

  savedJobIds: new Set<string>(),
  appliedJobIds: new Set<string>(),
  respondedOffers: {},
  followedCompanies: new Set<string>(),

  // ─── UI Actions ───────────────────────────────────────────
  setActiveCandidateTab: (tab) =>
    set((state) => ({ ui: { ...state.ui, activeCandidateTab: tab } })),
  setActiveRecruiterTab: (tab) =>
    set((state) => ({ ui: { ...state.ui, activeRecruiterTab: tab } })),
  setSelectedJobId: (id) =>
    set((state) => ({ ui: { ...state.ui, selectedJobId: id } })),
  setLoadingUIFlag: (key, value) =>
    set((state) => ({
      ui: {
        ...state.ui,
        loadingUIFlags: { ...state.ui.loadingUIFlags, [key]: value },
      },
    })),

  // ─── Filter Actions ────────────────────────────────────────
  setCandidateFilterValue: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    })),
  setRecruiterFilterValue: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        recruiterFilters: {
          ...state.filters.recruiterFilters,
          [key]: value,
        },
      },
    })),
  setMultipleFilters: (updates) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...updates,
      },
    })),
  resetFilters: () =>
    set((state) => ({
      filters: {
        search: '',
        location: '',
        sort: 'recent',
        selectedStatusFilter: 'All',
        selectedDateFilter: 'All time',
        recruiterFilters: {
          jobType: [],
          experience: 'All Levels',
          workMode: [],
          easyApply: false,
          activelyHiring: false,
          locations: [],
          companyType: [],
          industry: [],
          salaryRange: [],
          datePosted: 'Any Time',
        },
        job_type: '',
        work_mode: '',
        experience: '',
        salary_range: '',
        date_posted: '',
        industry: '',
      },
    })),

  // ─── Caching and List Actions ──────────────────────────────
  setExploreList: (updates) =>
    set((state) => ({
      explore: { ...state.explore, ...updates },
    })),
  setApplicationsList: (listKey, updates) =>
    set((state) => ({
      applications: {
        ...state.applications,
        [listKey]: { ...state.applications[listKey], ...updates },
      },
    })),
  setRecruiterList: (listKey, updates) =>
    set((state) => ({
      recruiter: {
        ...state.recruiter,
        [listKey]: { ...state.recruiter[listKey], ...updates },
      },
    })),
  setApplicationStats: (stats) =>
    set((state) => ({
      applications: { ...state.applications, stats },
    })),

  // ─── Mutation and Optimistic Update Actions ───────────────
  addSavedId: (id) =>
    set((state) => {
      const nextSaved = new Set(state.savedJobIds);
      nextSaved.add(id);

      // Optimistically flag in explore list
      const nextExploreJobs = state.explore.jobs.map((j) =>
        j.id === id ? { ...j, is_saved: true } : j
      );

      return {
        savedJobIds: nextSaved,
        explore: { ...state.explore, jobs: nextExploreJobs },
      };
    }),

  addSavedIds: (ids) =>
    set((state) => {
      const nextSaved = new Set(state.savedJobIds);
      let changed = false;
      ids.forEach((id) => {
        if (!nextSaved.has(id)) {
          nextSaved.add(id);
          changed = true;
        }
      });
      if (!changed) return {};

      const nextExploreJobs = state.explore.jobs.map((j) =>
        nextSaved.has(j.id) ? { ...j, is_saved: true } : j
      );

      return {
        savedJobIds: nextSaved,
        explore: { ...state.explore, jobs: nextExploreJobs },
      };
    }),

  removeSavedId: (id) =>
    set((state) => {
      const nextSaved = new Set(state.savedJobIds);
      nextSaved.delete(id);

      // Unflag in explore list
      const nextExploreJobs = state.explore.jobs.map((j) =>
        j.id === id ? { ...j, is_saved: false } : j
      );
      // Remove from saved cache
      const nextSavedJobs = state.applications.saved.jobs.filter((j) => j.id !== id);

      return {
        savedJobIds: nextSaved,
        explore: { ...state.explore, jobs: nextExploreJobs },
        applications: {
          ...state.applications,
          saved: { ...state.applications.saved, jobs: nextSavedJobs },
        },
      };
    }),

  addAppliedId: (id) =>
    set((state) => {
      const nextApplied = new Set(state.appliedJobIds);
      nextApplied.add(id);

      // Flag in explore list
      const nextExploreJobs = state.explore.jobs.map((j) =>
        j.id === id ? { ...j, is_applied: true, application_status: 'Applied' } : j
      );

      return {
        appliedJobIds: nextApplied,
        explore: { ...state.explore, jobs: nextExploreJobs },
      };
    }),

  addAppliedIds: (ids) =>
    set((state) => {
      const nextApplied = new Set(state.appliedJobIds);
      let changed = false;
      ids.forEach((id) => {
        if (!nextApplied.has(id)) {
          nextApplied.add(id);
          changed = true;
        }
      });
      if (!changed) return {};

      const nextExploreJobs = state.explore.jobs.map((j) =>
        nextApplied.has(j.id) ? { ...j, is_applied: true } : j
      );

      return {
        appliedJobIds: nextApplied,
        explore: { ...state.explore, jobs: nextExploreJobs },
      };
    }),

  removeAppliedId: (id) =>
    set((state) => {
      const nextApplied = new Set(state.appliedJobIds);
      nextApplied.delete(id);

      // Unflag in explore list
      const nextExploreJobs = state.explore.jobs.map((j) =>
        j.id === id ? { ...j, is_applied: false, application_status: undefined } : j
      );
      // Remove from applied cache
      const nextAppliedJobs = state.applications.applied.jobs.filter((j) => j.id !== id);

      return {
        appliedJobIds: nextApplied,
        explore: { ...state.explore, jobs: nextExploreJobs },
        applications: {
          ...state.applications,
          applied: { ...state.applications.applied, jobs: nextAppliedJobs },
        },
      };
    }),

  setOfferResponse: (id, action) =>
    set((state) => {
      const nextOffers = { ...state.respondedOffers, [id]: action };
      const status = action === 'accept' ? 'Accepted' : 'Declined';

      // Update explore cache
      const nextExploreJobs = state.explore.jobs.map((j) =>
        j.id === id ? { ...j, application_status: status } : j
      );
      // Update offers cache
      const nextOfferJobs = state.applications.offers.jobs.map((j) =>
        j.id === id ? { ...j, application_status: status } : j
      );

      return {
        respondedOffers: nextOffers,
        explore: { ...state.explore, jobs: nextExploreJobs },
        applications: {
          ...state.applications,
          offers: { ...state.applications.offers, jobs: nextOfferJobs },
        },
      };
    }),

  toggleFollowCompany: (companyName) =>
    set((state) => {
      const nextFollowed = new Set(state.followedCompanies);
      if (nextFollowed.has(companyName)) {
        nextFollowed.delete(companyName);
      } else {
        nextFollowed.add(companyName);
      }

      // Update in explore cache
      const nextExploreJobs = state.explore.jobs.map((j) =>
        j.company === companyName ? { ...j, is_followed: nextFollowed.has(companyName) } : j
      );

      return {
        followedCompanies: nextFollowed,
        explore: { ...state.explore, jobs: nextExploreJobs },
      };
    }),

  // Recruiter Mutations
  addRecruiterJob: (listKey, job) =>
    set((state) => {
      const currentList = state.recruiter[listKey];
      const nextJobs = [job, ...currentList.jobs];
      return {
        recruiter: {
          ...state.recruiter,
          [listKey]: { ...currentList, jobs: nextJobs },
        },
      };
    }),

  updateRecruiterJob: (job) =>
    set((state) => {
      const updateList = (list: CachedList<Job>) => {
        const index = list.jobs.findIndex((j) => j.id === job.id);
        if (index === -1) return list;
        const nextJobs = [...list.jobs];
        nextJobs[index] = { ...nextJobs[index], ...job };
        return { ...list, jobs: nextJobs };
      };

      return {
        recruiter: {
          published: updateList(state.recruiter.published),
          drafts: updateList(state.recruiter.drafts),
          archived: updateList(state.recruiter.archived),
        },
      };
    }),

  deleteRecruiterJob: (jobId) =>
    set((state) => {
      const filterOut = (list: CachedList<Job>) => ({
        ...list,
        jobs: list.jobs.filter((j) => j.id !== jobId),
      });

      return {
        recruiter: {
          published: filterOut(state.recruiter.published),
          drafts: filterOut(state.recruiter.drafts),
          archived: filterOut(state.recruiter.archived),
        },
      };
    }),

  publishRecruiterDraft: (jobId) =>
    set((state) => {
      const targetJob = state.recruiter.drafts.jobs.find((j) => j.id === jobId);
      const nextDraftsJobs = state.recruiter.drafts.jobs.filter((j) => j.id !== jobId);

      if (!targetJob) return {};

      const publishedJob = { ...targetJob, status: 'PUBLISHED', is_closed: false };
      const nextPublishedJobs = [publishedJob, ...state.recruiter.published.jobs];

      return {
        recruiter: {
          ...state.recruiter,
          drafts: { ...state.recruiter.drafts, jobs: nextDraftsJobs },
          published: { ...state.recruiter.published, jobs: nextPublishedJobs },
        },
      };
    }),

  // ─── Create Job Flow ───────────────────────────────────────
  createJobStep: 'verification',
  createJobTitle: '',
  createJobId: null,
  createJobDetails: {},
  isDrafting: false,

  setCreateJobStep: (step) => set({ createJobStep: step }),
  setCreateJobTitle: (title) => set({ createJobTitle: title }),
  setCreateJobId: (id) => set({ createJobId: id }),
  setCreateJobDetails: (details) =>
    set((state) => ({
      createJobDetails: { ...state.createJobDetails, ...details },
    })),
  setIsDrafting: (isDrafting) => set({ isDrafting }),
  resetCreateJobFlow: () =>
    set({
      createJobStep: 'verification',
      createJobTitle: '',
      createJobId: null,
      createJobDetails: {},
      isDrafting: false,
    }),

  // ─── My Listings Dashboard ─────────────────────────────────
  selectedOfferGroup: null,
  setSelectedOfferGroup: (group) => set({ selectedOfferGroup: group }),
    }),
    {
      name: 'job-flow-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        createJobStep: state.createJobStep,
        createJobTitle: state.createJobTitle,
        createJobId: state.createJobId,
        createJobDetails: state.createJobDetails,
        isDrafting: state.isDrafting,
        selectedOfferGroup: state.selectedOfferGroup,
      }),
    }
  )
);
