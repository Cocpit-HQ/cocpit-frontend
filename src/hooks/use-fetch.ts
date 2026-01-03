/**
 * useFetch Hook
 * Generic hook for fetching data with loading and error states
 */

"use client";

import { useCallback, useEffect, useState } from "react";

// Mocking ApiResponse for now, or you can import from a central types file
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

interface UseFetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface UseFetchOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  immediate?: boolean;
}

export function useFetch<T>(
  fetchFn: () => Promise<ApiResponse<T>>,
  options: UseFetchOptions = {}
) {
  const { onSuccess, onError, immediate = true } = options;
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, isLoading: true, error: null });
    try {
      const response = await fetchFn();
      if (response.success) {
        setState({ data: response.data ?? null, isLoading: false, error: null });
        onSuccess?.();
      } else {
        const errorMessage = response.error?.message || "An error occurred";
        setState({ data: null, isLoading: false, error: errorMessage });
        onError?.(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error?.message || "An unexpected error occurred";
      setState({ data: null, isLoading: false, error: errorMessage });
      onError?.(errorMessage);
    }
  }, [fetchFn, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, refetch: execute };
}
