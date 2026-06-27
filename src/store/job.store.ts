import { create } from 'zustand';
import type { JobsFilter } from '@/features/jobs/types/jobs.types';

interface JobsUIState {
  // ─── Tab ───────────────────────────────────────────────────
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // ─── Saved & Applied Job IDs ──────────────────────────────
  savedJobIds: Set<string>;
  appliedJobIds: Set<string>;
  addSavedId: (id: string) => void;
  addSavedIds: (ids: string[]) => void;
  removeSavedId: (id: string) => void;
  addAppliedId: (id: string) => void;
  addAppliedIds: (ids: string[]) => void;
  removeAppliedId: (id: string) => void;

  // ─── Responded Offers ──────────────────────────────────────
  respondedOffers: Record<string, 'accept' | 'decline'>;
  setOfferResponse: (id: string, action: 'accept' | 'decline') => void;

  // ─── Followed Companies ────────────────────────────────────
  followedCompanies: Set<string>;
  toggleFollowCompany: (companyName: string) => void;

  // ─── Application Stats ─────────────────────────────────────
  applicationStats: { totalApplied: number; shortlisted: number };
  setApplicationStats: (stats: { totalApplied: number; shortlisted: number }) => void;

  // ─── Filters ───────────────────────────────────────────────
  filters: JobsFilter;
  setFilterValue: (key: keyof JobsFilter, value: string) => void;
  setMultipleFilters: (updates: Partial<JobsFilter>) => void;
  resetFilters: () => void;
}

export const useJobStore = create<JobsUIState>((set) => ({
  // Tab
  activeTab: 'Explore',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Saved & Applied Job IDs
  savedJobIds: new Set<string>(),
  appliedJobIds: new Set<string>(),

  addSavedId: (id) =>
    set((state) => {
      const next = new Set(state.savedJobIds);
      next.add(id);
      return { savedJobIds: next };
    }),

  addSavedIds: (ids) =>
    set((state) => {
      const next = new Set(state.savedJobIds);
      let changed = false;
      ids.forEach((id) => {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      });
      return changed ? { savedJobIds: next } : {};
    }),

  removeSavedId: (id) =>
    set((state) => {
      const next = new Set(state.savedJobIds);
      next.delete(id);
      return { savedJobIds: next };
    }),

  addAppliedId: (id) =>
    set((state) => {
      const next = new Set(state.appliedJobIds);
      next.add(id);
      return { appliedJobIds: next };
    }),

  addAppliedIds: (ids) =>
    set((state) => {
      const next = new Set(state.appliedJobIds);
      let changed = false;
      ids.forEach((id) => {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      });
      return changed ? { appliedJobIds: next } : {};
    }),

  removeAppliedId: (id) =>
    set((state) => {
      const next = new Set(state.appliedJobIds);
      next.delete(id);
      return { appliedJobIds: next };
    }),

  // Responded Offers
  respondedOffers: {},
  setOfferResponse: (id, action) =>
    set((state) => ({
      respondedOffers: {
        ...state.respondedOffers,
        [id]: action,
      },
    })),

  // Followed Companies
  followedCompanies: new Set<string>(),
  toggleFollowCompany: (companyName) =>
    set((state) => {
      const next = new Set(state.followedCompanies);
      if (next.has(companyName)) {
        next.delete(companyName);
      } else {
        next.add(companyName);
      }
      return { followedCompanies: next };
    }),

  // Application Stats
  applicationStats: { totalApplied: 0, shortlisted: 0 },
  setApplicationStats: (stats) => set({ applicationStats: stats }),

  // Filters
  filters: {
    search: '',
    location: '',
    job_type: '',
    work_mode: '',
    experience: '',
    salary_range: '',
  },

  setFilterValue: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
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
    set({
      filters: {
        search: '',
        location: '',
        job_type: '',
        work_mode: '',
        experience: '',
        salary_range: '',
      },
    }),
}));
