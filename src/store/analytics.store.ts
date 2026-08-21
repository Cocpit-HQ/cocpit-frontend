import { create } from 'zustand';
import { DateRange } from 'react-day-picker';
import dayjs from 'dayjs';

export type AnalyticsMainTab = 'career-trajectory' | 'profile-analytics';
export type ProfileSubTab = 'Overview' | 'Content' | 'Audience' | 'Opportunities';

interface AnalyticsStore {
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
  setMainTab: (tab) => set({ mainTab: tab }),

  profileSubTab: 'Overview',
  setProfileSubTab: (tab) => set({ profileSubTab: tab }),

  filter: 'Last 30 days',
  dateRange: {
    from: dayjs().subtract(30, 'days').toDate(),
    to: dayjs().toDate(),
  },
  sortOption: 'Top performing',
  setFilter: (f) => set({ filter: f }),
  setDateRange: (dr) => set({ dateRange: dr }),
  setSortOption: (s) => set({ sortOption: s }),

  selectedRole: '',
  setSelectedRole: (role) => set({ selectedRole: role }),
}));
