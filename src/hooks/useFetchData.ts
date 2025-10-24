import { useState, useCallback } from "react";
import type { IApiSuccessResponse, IApiErrorResponse } from "../interfaces/common";
import { isApiSuccess, extractErrorMessage } from "../models/api.helpers";

export interface UseFetchDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

/**
 * Unified hook for fetching API data
 * Replaces repetitive try-catch patterns throughout the app
 * 
 * Usage:
 * ```typescript
 * const { data, loading, error } = useFetchData(
 *   () => bookingApi.getBookings(),
 *   []
 * );
 * ```
 */
export const useFetchData = <T>(
  fetchFn: () => Promise<IApiSuccessResponse<T> | IApiErrorResponse | T>,
  dependencies: any[] = [],
  onSuccess?: (data: T) => void,
  onError?: (error: string) => void
): UseFetchDataState<T> => {
  const [state, setState] = useState<UseFetchDataState<T>>({
    data: null,
    loading: true,
    error: null,
    success: false,
  });

  const fetchData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await fetchFn();

      if (isApiSuccess(response)) {
        const data = response.data as T;
        setState({ data, loading: false, error: null, success: true });
        onSuccess?.(data);
      } else {
        const errorMessage = extractErrorMessage(response, "Failed to fetch data");
        setState({ data: null, loading: false, error: errorMessage, success: false });
        onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage = extractErrorMessage(err, "An error occurred");
      setState({ data: null, loading: false, error: errorMessage, success: false });
      onError?.(errorMessage);
    }
  }, dependencies);

  // Auto-fetch on mount
  useState(() => {
    fetchData();
  }, [fetchData]);

  return state;
};

/**
 * Manual fetch hook - for situations where you control when to fetch
 */
export const useManualFetch = <T>(
  fetchFn: () => Promise<IApiSuccessResponse<T> | IApiErrorResponse | T>
): [UseFetchDataState<T>, () => Promise<void>] => {
  const [state, setState] = useState<UseFetchDataState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const execute = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await fetchFn();

      if (isApiSuccess(response)) {
        const data = response.data as T;
        setState({ data, loading: false, error: null, success: true });
      } else {
        const errorMessage = extractErrorMessage(response, "Failed to fetch data");
        setState({ data: null, loading: false, error: errorMessage, success: false });
      }
    } catch (err) {
      const errorMessage = extractErrorMessage(err, "An error occurred");
      setState({ data: null, loading: false, error: errorMessage, success: false });
    }
  }, []);

  return [state, execute];
};

export default useFetchData;
