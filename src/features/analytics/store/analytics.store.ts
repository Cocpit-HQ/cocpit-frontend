import { create } from 'zustand';
import { DateRange } from 'react-day-picker';
import dayjs from 'dayjs';
import { ANALYTICS_FILTER_LABELS, ANALYTICS_SORT_OPTIONS } from '../constants/analytics.constants';

export type AnalyticsMainTab = 'career-trajectory' | 'profile-analytics';
export type ProfileSubTab = 'Overview' | 'Content' | 'Audience' | 'Opportunities';

export interface AnalyticsStore {
  // Top-level tab (Career Trajectory vs Profile Analytics)
  mainTab: AnalyticsMainTab;
  setMainTab: (tab: AnalyticsMainTab) => void;

  // Profile analytics sub-tab
  profileSubTab: ProfileSubTab;
  setProfileSubTab: (tab: ProfileSubTab) => void;

  // Shared filter state (persists across tab switches)
  filter: string;
  dateRange: DateRange | undefined;
  sortOption: string; // Content tab only
  setFilter: (f: string) => void;
  setDateRange: (dr: DateRange | undefined) => void;
  setSortOption: (s: string) => void;

  // Career trajectory
  selectedRole: string;
  setSelectedRole: (role: string) => void;
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  mainTab: 'profile-analytics',
  setMainTab: (tab) => {
    if (tab === 'career-trajectory') return;
    set({ mainTab: tab });
  },

  profileSubTab: 'Overview',
  setProfileSubTab: (tab) => set({ profileSubTab: tab }),

  filter: ANALYTICS_FILTER_LABELS.LAST_30_DAYS,
  dateRange: {
    from: dayjs().subtract(30, 'days').toDate(),
    to: dayjs().toDate(),
  },
  sortOption: ANALYTICS_SORT_OPTIONS[0],
  setFilter: (f) => set({ filter: f }),
  setDateRange: (dr) => set({ dateRange: dr }),
  setSortOption: (s) => set({ sortOption: s }),

  selectedRole: '',
  setSelectedRole: (role) => set({ selectedRole: role }),
}));
