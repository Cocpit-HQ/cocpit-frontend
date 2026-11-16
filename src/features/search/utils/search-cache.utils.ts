import type { QueryClient } from '@tanstack/react-query';

export interface GlobalSearchEntityUpdates {
  is_following?: boolean;
  connection_status?: 'connected' | 'pending_sent' | 'pending_received' | 'none';
  pending_request_id?: string | null;
  is_connected?: boolean;
}

/**
 * Optimistically updates the relationship / follow state for a person, company,
 * or institute across all cached `global-search` queries (both Stage A 'all' and
 * Stage B category infinite queries), then invalidates `['global-search']` so
 * subsequent refetches remain in sync with the server.
 */
export function updateGlobalSearchEntityStatus(
  queryClient: QueryClient,
  targetId: string,
  updates: GlobalSearchEntityUpdates
): void {
  if (!targetId || !queryClient) return;

  const cleanTarget = String(targetId).toLowerCase().trim();

  const matchesTarget = (item: any): boolean => {
    if (!item) return false;
    return Boolean(
      (item.id && String(item.id).toLowerCase().trim() === cleanTarget) ||
      (item.account_name && String(item.account_name).toLowerCase().trim() === cleanTarget) ||
      (item.slug && String(item.slug).toLowerCase().trim() === cleanTarget) ||
      (item.org_id && String(item.org_id).toLowerCase().trim() === cleanTarget) ||
      (item.company_id && String(item.company_id).toLowerCase().trim() === cleanTarget)
    );
  };

  const updateItem = (item: any) => {
    if (matchesTarget(item)) {
      return {
        ...item,
        ...updates,
      };
    }
    return item;
  };

  queryClient.setQueriesData<any>({ queryKey: ['global-search'] }, (oldData: any) => {
    if (!oldData) return oldData;

    // Handle Stage A (All categories overview)
    if (oldData.results || oldData.sections) {
      const updateCategory = (cat: any) => {
        if (!cat || !Array.isArray(cat.items)) return cat;
        return {
          ...cat,
          items: cat.items.map(updateItem),
        };
      };

      const newResults = oldData.results
        ? {
            ...oldData.results,
            people: updateCategory(oldData.results.people),
            companies: updateCategory(oldData.results.companies),
            institutes: updateCategory(oldData.results.institutes),
          }
        : undefined;

      const newSections = oldData.sections
        ? {
            ...oldData.sections,
            people: updateCategory(oldData.sections.people),
            companies: updateCategory(oldData.sections.companies),
            institutes: updateCategory(oldData.sections.institutes),
          }
        : undefined;

      return {
        ...oldData,
        ...(newResults ? { results: newResults } : {}),
        ...(newSections ? { sections: newSections } : {}),
      };
    }

    // Handle Stage B (Infinite query pages for single category: people, companies, institutes)
    if (oldData.pages && Array.isArray(oldData.pages)) {
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => {
          if (!page || !Array.isArray(page.items)) return page;
          return {
            ...page,
            items: page.items.map(updateItem),
          };
        }),
      };
    }

    // Single category flat response if not wrapped in pages
    if (Array.isArray(oldData.items)) {
      return {
        ...oldData,
        items: oldData.items.map(updateItem),
      };
    }

    return oldData;
  });

  // Mark all search queries as stale to trigger a background refetch when mounted
  queryClient.invalidateQueries({ queryKey: ['global-search'] });
}
