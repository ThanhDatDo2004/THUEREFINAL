import { useState, useEffect, useCallback, useRef } from "react";
import { checkPaymentStatusApi } from "../models/payment.api";
import { extractErrorMessage } from "../models/api.helpers";

export interface UsePaymentPollingOptions {
  bookingCode: string;
  enabled?: boolean;
  interval?: number; // milliseconds, default 2000
  onSuccess?: (status: string) => void;
  onError?: (error: string) => void;
}

export const usePaymentPolling = ({
  bookingCode,
  enabled = true,
  interval = 2000,
  onSuccess,
  onError,
}: UsePaymentPollingOptions) => {
  const [status, setStatus] = useState<string>("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const poll = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      const response = await checkPaymentStatusApi(bookingCode);

      if (response.success && response.data) {
        const newStatus = response.data.status;
        setStatus(newStatus);
        setError(null);

        // Call callback when status changes
        if (onSuccess) {
          onSuccess(newStatus);
        }

        // Stop polling if payment is completed
        if (newStatus === "paid" || newStatus === "failed" || newStatus === "refunded") {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to check payment status");
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [bookingCode, enabled, onSuccess, onError]);

  useEffect(() => {
    if (!enabled) return;

    // Poll immediately first
    poll();

    // Then set up interval
    intervalRef.current = setInterval(poll, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, poll]);

  return {
    status,
    loading,
    error,
    isPaid: status === "paid",
    isFailed: status === "failed",
    isRefunded: status === "refunded",
    isPending: status === "pending",
  };
};
