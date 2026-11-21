# State Management Guideline — `analytics`

Reference pattern: `src/features/manage-team/STATE_MANAGEMENT.md` and `src/features/businessProfile/**`. This document defines how state is structured, persisted, and consumed across all components in `src/features/analytics`.

---

## 1. The Rule That Decides Everything

| Kind of Data | Where it Lives | Why |
|---|---|---|
| **Server Data** (overview metrics, audience demographics, content performance, opportunities, post analytics, trajectory) | **TanStack Query** (`useQuery`) | Automatic caching, request deduplication, background re-validation, loading/error states |
| **Derived Data** (computed percentages, formatted chart points, sorted posts, filtered lists) | **`useMemo`**, never a separate `useState` | Prevents cascading renders, out-of-sync states, and unnecessary CPU recalculations |
| **Ephemeral UI State** (dropdown open/close, popovers, tooltip hovers, local search inputs) | **`useState` / `useRef`** local to the owning component | Component-scoped; nothing else in the tree needs to know about it |
| **Shared Filter & Navigation State** (main tab, profile sub-tab, time range, custom dates, content sort option, trajectory target role) | **Zustand store** (`analytics.store.ts`) | Synchronizes filters across sibling tabs (Overview, Content, Audience, Opportunities) without prop drilling |
| **Route & Shareable State** (post ID for single-post analytics, direct tab deep-linking) | **URL path & query params** (`/analytics/post/[id]`, `?tab=`) | Enables browser history, page refresh persistence, and link sharing |

---

## 2. Server State & Cache Architecture (TanStack Query)

All analytics data fetching is encapsulated inside dedicated custom hooks in `hooks/`. Queries use consistent key hierarchies and standardized cache invalidation policies:

### Query Keys Hierarchy
```typescript
['analytics', 'overview', filter, serializeDateRange(dateRange)]
['analytics', 'audience', filter, serializeDateRange(dateRange)]
['analytics', 'content', filter, sortOption, serializeDateRange(dateRange)]
['analytics', 'opportunities', filter, serializeDateRange(dateRange)]
['analytics', 'post', postId, filter, serializeDateRange(dateRange)]
['analytics', 'career-trajectory', selectedRole]
```

### Cache & Stale Time Policies
- **Read-heavy data with low volatility**: Analytics data does not mutate every second. A default `staleTime` of **5 minutes** (`300,000ms`) is enforced across all profile analytics queries.
- **Career Trajectory**: Long-horizon projection data uses a `staleTime` of **15 minutes**.
- **Window focus refetching**: Disabled or throttled to prevent spamming backend analytics aggregations on alt-tabbing.
- **Query Gate / `enabled` check**: Custom date filters require both `dateRange.from` and `dateRange.to` to be defined before triggering an API call:
  ```typescript
  enabled: filter !== 'Custom' || (!!dateRange?.from && !!dateRange?.to)
  ```

### Telemetry & Event Mutations
- **Resume Events** (`recordResumeEvent`): Fire-and-forget analytics telemetry (`POST /api/analytics/resume-events`). These are non-blocking tracking calls that do not require cache invalidation.

---

## 3. Client State Architecture (Zustand Store)

The analytics feature maintains shared filter and tab state via `useAnalyticsStore` (`src/features/analytics/store/analytics.store.ts`).

### Store Schema
```typescript
interface AnalyticsStore {
  // Navigation
  mainTab: AnalyticsMainTab;          // 'career-trajectory' | 'profile-analytics'
  setMainTab: (tab: AnalyticsMainTab) => void;

  profileSubTab: ProfileSubTab;      // 'Overview' | 'Content' | 'Audience' | 'Opportunities'
  setProfileSubTab: (tab: ProfileSubTab) => void;

  // Global Time & Sort Filters
  filter: string;                     // 'Last 30 Days', 'Last 7 Days', 'Last 90 Days', 'All Time', 'Custom'
  dateRange: DateRange | undefined;   // { from: Date, to: Date }
  sortOption: string;                 // 'Top performing', 'Most recent', etc. (Content tab)
  setFilter: (f: string) => void;
  setDateRange: (dr: DateRange | undefined) => void;
  setSortOption: (s: string) => void;

  // Career Trajectory State
  selectedRole: string;
  setSelectedRole: (role: string) => void;
}
```

### Golden Rules for Consuming the Store
1. **Always use atomic selectors**:
   ```typescript
   // ✅ GOOD: Only re-renders when `filter` changes
   const filter = useAnalyticsStore((state) => state.filter);

   // ❌ AVOID: Re-renders on any store state change
   const { filter, mainTab, setMainTab } = useAnalyticsStore();
   ```
2. **Never duplicate store values into local component state**:
   If a component needs `filter`, consume it directly from `useAnalyticsStore` or `useAnalyticsFilter`. Do not copy it into local `useState`.

---

## 4. Component-by-Component Inventory & State Roles

| File | Type | State Role & Responsibility |
|---|---|---|
| `pages/AnalyticsPage.tsx` | Page Container | Top-level view container, feature-guard check, mounts header and tab dispatcher |
| `pages/PostAnalyticsPage.tsx` | Page Container | Single-post analytics view container, extracts `postId` from URL params |
| `components/layout/AnalyticsHeader.tsx` | Presentation | Displays greeting, avatar, and high-level description; stateless |
| `components/layout/AnalyticsTabs.tsx` | Control | Connects to `useAnalyticsStore(state => state.mainTab)` to switch between Career Trajectory and Profile Analytics |
| `components/ui/AnalyticsFilterBar.tsx` | UI Control | Date range dropdown, calendar popover, sort dropdown; wraps `useAnalyticsFilter` |
| `components/profile-analytics/ProfileAnalyticsHome.tsx` | Orchestrator | Renders sub-tabs (Overview, Content, Audience, Opportunities) based on `profileSubTab` |
| `components/profile-analytics/OverviewTab.tsx` | Data Consumer | Reads `useAnalyticsOverview`, visualizes Key Metrics cards, Profile Strength, and Trend Chart |
| `components/profile-analytics/AudienceTab.tsx` | Data Consumer | Reads `useAnalyticsAudience`, visualizes Reach, Top Demographics, Countries/Cities breakdown |
| `components/profile-analytics/ContentTab.tsx` | Data Consumer | Reads `useAnalyticsContent`, displays Format Performance and Top Posts table with sort controls |
| `components/profile-analytics/OpportunitiesTab.tsx` | Data Consumer | Reads `useAnalyticsOpportunities`, displays recruiter visits, repeat views, and top organizations |
| `components/profile-analytics/PostAnalytics.tsx` | Data Consumer | Reads `usePostAnalytics(postId)`, renders single-post impression metrics and engagement rates |
| `components/career-trajectory/CareerTrajectoryHome.tsx` | Data Consumer | Reads `useCareerTrajectory(selectedRole)`, visualizes skill gaps and next best action |
| `components/profile-analytics/AnalyticsEmptyState.tsx` | UI Feedback | Clean zero-data empty state with informative illustration and messaging |
| `components/profile-analytics/AnalyticsErrorState.tsx` | UI Feedback | Graceful error state with retry action button |

---

## 5. Performance Best Practices

1. **`useMemo` for Chart Data Transformations**:
   API responses return raw labels and data arrays. Transform them into Recharts/Chart.js structures inside `useMemo` so that re-renders of parent wrappers do not reconstruct large dataset objects.
2. **Memoize Complex Cards (`React.memo`)**:
   Wrap granular metrics cards (e.g. `MetricCard`, `PostRow`) in `React.memo` to eliminate unnecessary re-renders when switching filters or opening popovers.
3. **Debounced Custom Date Range**:
   When users pick custom dates from the calendar, only trigger queries when both `from` and `to` are selected.
4. **Design Token Compliance**:
   Strict adherence to `newGlobal.css` tokens (`bg-ds-*`, `text-ds-*`, `border-ds-*`). Never use hardcoded hex colors or arbitrary tailwind classes.
