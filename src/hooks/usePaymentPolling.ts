import { useState, useEffect, useCallback, useRef } from "react";
import { checkPaymentStatusApi } from "../models/payment.api";
import { extractErrorMessage } from "../models/api.helpers";

export interface UsePaymentPollingOptions {
  bookingCode: string;
  enabled?: boolean;
  interval?: number; // milliseconds, default 2000
  onSuccess?: (status: string) => void;
  onError?: (error: string) => void;
  timeout?: number; // milliseconds, default 15 minutes (900000ms)
}

export const usePaymentPolling = ({
  bookingCode,
  enabled = true,
  interval = 2000,
  onSuccess,
  onError,
  timeout = 900000, // 15 minutes default
}: UsePaymentPollingOptions) => {
  const [status, setStatus] = useState<string>("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const onSuccessRef = useRef<typeof onSuccess>(onSuccess);
  const onErrorRef = useRef<typeof onError>(onError);

  // Keep callback refs in sync without re-subscribing the polling interval
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const poll = useCallback(async () => {
    if (!enabled) return;

    // Check if timeout exceeded
    if (startTimeRef.current && Date.now() - startTimeRef.current > timeout) {
      const timeoutMsg = `Timeout: Thanh toán chưa hoàn tất sau 15 phút. Vui lòng thử lại.`;
      setError(timeoutMsg);
      const errorHandler = onErrorRef.current;
      if (errorHandler) {
        errorHandler(timeoutMsg);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    try {
      setLoading(true);
      const response = await checkPaymentStatusApi(bookingCode);

      if (response.success && response.data) {
        const newStatus = response.data.status;
        setStatus(newStatus);
        setError(null);

        // Call callback when status changes
        const successHandler = onSuccessRef.current;
        if (successHandler) {
          successHandler(newStatus);
        }

        // Stop polling if payment is completed
        if (newStatus === "paid" || newStatus === "failed" || newStatus === "refunded") {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }
      }
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to check payment status");
      setError(errorMsg);
      const errorHandler = onErrorRef.current;
      if (errorHandler) {
        errorHandler(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [bookingCode, enabled, timeout]);

  useEffect(() => {
    if (!enabled) return;

    startTimeRef.current = Date.now();

    // Poll immediately first
    poll();

    // Then set up interval
    intervalRef.current = setInterval(poll, interval);

    // Set up timeout
    timeoutRef.current = setTimeout(() => {
      const timeoutMsg = `Timeout: Thanh toán chưa hoàn tất sau 15 phút. Vui lòng thử lại.`;
      setError(timeoutMsg);
      const errorHandler = onErrorRef.current;
      if (errorHandler) {
        errorHandler(timeoutMsg);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, timeout);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, interval, poll, timeout]);

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
