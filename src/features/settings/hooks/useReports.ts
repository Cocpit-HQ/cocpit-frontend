import { useQuery } from "@tanstack/react-query";
import {
  getUserReports,
  getUserReportById,
  getAccountActions,
  getAccountActionById,
} from "@/features/settings/api/reports";

export const USER_REPORTS_QUERY_KEY = ["userReports"];
export const ACCOUNT_ACTIONS_QUERY_KEY = ["accountActions"];

export function useUserReports() {
  const query = useQuery({
    queryKey: USER_REPORTS_QUERY_KEY,
    queryFn: () => getUserReports(),
  });

  return {
    reports: query.data?.reports || [],
    isLoading: query.isLoading,
  };
}

// `id` is the "tab/selection parameter" — it comes from
// useSettingsStore's reports.selectedReportId. Passing `null` disables the
// fetch entirely, so selecting a row is just a store update; TanStack Query
// handles the fetch + per-id cache from there.
export function useReportDetail(id: number | null) {
  const query = useQuery({
    queryKey: [...USER_REPORTS_QUERY_KEY, id],
    queryFn: () => getUserReportById(id as number),
    enabled: id !== null,
  });

  return {
    report: query.data,
    isLoading: query.isLoading,
  };
}

// Actions are only fetched once the "Account actions" pill is active —
// `enabled` mirrors the `activeTab === 'Explore'` gating used in useJobs.ts.
export function useAccountActions(enabled: boolean) {
  const query = useQuery({
    queryKey: ACCOUNT_ACTIONS_QUERY_KEY,
    queryFn: () => getAccountActions(),
    enabled,
  });

  return {
    actions: query.data?.actions || [],
    isLoading: query.isLoading,
  };
}

export function useActionDetail(id: string | null) {
  const query = useQuery({
    queryKey: [...ACCOUNT_ACTIONS_QUERY_KEY, id],
    queryFn: () => getAccountActionById(id as string),
    enabled: id !== null,
  });

  return {
    action: query.data,
    isLoading: query.isLoading,
  };
}
