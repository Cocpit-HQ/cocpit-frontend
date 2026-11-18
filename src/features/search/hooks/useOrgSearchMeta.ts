import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export interface IndustrySubtypeItem {
  industry_id: string;
  industry_name: string;
  display_order: number;
}

export interface IndustryTreeItem {
  industry_id: string;
  industry_name: string;
  display_order: number;
  subtypes?: IndustrySubtypeItem[];
}

/**
 * Hook to dynamically fetch sector options from the backend API.
 * Never hardcodes sectors on the frontend so additions/changes in backend
 * automatically reflect here without code modification.
 */
export function useSectorOptions() {
  return useQuery<string[]>({
    queryKey: ['search-meta', 'sectors'],
    queryFn: async () => {
      const response = await api.get('/search/meta/sectors');
      return response.data?.data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour cache
    gcTime: 24 * 60 * 60 * 1000,
  });
}

/**
 * Hook to fetch top-level industry categories along with their child sub-types
 * Reuses the existing /jobs/industries API endpoint
 */
export function useIndustriesWithSubtypes() {
  return useQuery<IndustryTreeItem[]>({
    queryKey: ['jobs', 'industries', 'tree'],
    queryFn: async () => {
      const response = await api.get('/jobs/industries', {
        params: { include_subtypes: 'true' },
      });
      return response.data?.data || response.data?.items || [];
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

/**
 * Hook to fetch sub-types for a specific parent industry name or ID
 * Reuses the existing /jobs/industries API endpoint
 */
export function useSubtypesForParent(parentNameOrId?: string) {
  return useQuery<IndustrySubtypeItem[]>({
    queryKey: ['jobs', 'industries', 'subtypes', parentNameOrId],
    queryFn: async () => {
      if (!parentNameOrId) return [];
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parentNameOrId);
      const params = isUuid ? { parent_id: parentNameOrId } : { parent_name: parentNameOrId };
      const response = await api.get('/jobs/industries', { params });
      return response.data?.data || response.data?.items || [];
    },
    enabled: Boolean(parentNameOrId),
    staleTime: 60 * 60 * 1000,
  });
}

