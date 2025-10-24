import { useState, useCallback } from "react";

export interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string;
}

export const useAsyncData = <T>(
  initialData: T
): [AsyncState<T>, (fn: () => Promise<T>) => Promise<void>] => {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: "",
  });

  const execute = useCallback(async (fn: () => Promise<T>) => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const result = await fn();
      setState((prev) => ({ ...prev, data: result, loading: false }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Có lỗi xảy ra";
      setState((prev) => ({ ...prev, error: message, loading: false }));
    }
  }, []);

  return [state, execute];
};
