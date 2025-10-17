import { useState, useEffect, useCallback, useRef } from "react";
import { getNotificationsApi, Notification } from "../models/notification.api";
import { extractErrorMessage } from "../models/api.helpers";

export interface UseNotificationPollingOptions {
  enabled?: boolean;
  interval?: number; // milliseconds, default 10000 (10 seconds)
  onNewNotification?: (notification: Notification) => void;
}

export const useNotificationPolling = ({
  enabled = true,
  interval = 10000,
  onNewNotification,
}: UseNotificationPollingOptions) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousCountRef = useRef(0);

  const poll = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      const response = await getNotificationsApi(undefined, 20, 0);

      if (response.success && response.data) {
        const newNotifications = response.data.data;
        const newUnreadCount = response.data.unread_count;

        // Detect new notifications
        if (newUnreadCount > previousCountRef.current && onNewNotification) {
          // Find the newest unread notification
          const newNotification = newNotifications.find((n) => n.IsRead === "N");
          if (newNotification) {
            onNewNotification(newNotification);
          }
        }

        setNotifications(newNotifications);
        setUnreadCount(newUnreadCount);
        previousCountRef.current = newUnreadCount;
        setError(null);
      }
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to fetch notifications");
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [enabled, onNewNotification]);

  useEffect(() => {
    if (!enabled) return;

    // Poll immediately
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, poll]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
  };
};
