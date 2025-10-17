import React, { useEffect, useState } from "react";
import {
  getNotificationsApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
  deleteNotificationApi,
  Notification,
} from "../models/notification.api";
import { useNotificationPolling } from "../hooks/useNotificationPolling";
import { extractErrorMessage } from "../models/api.helpers";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Layout from "../components/layouts/Layout";
import {
  Bell,
  Trash2,
  CheckCircle,
  AlertCircle,
  Wallet,
  CreditCard,
} from "lucide-react";

interface NotificationsCenterState {
  loading: boolean;
  error: string | null;
  notifications: Notification[];
  unreadCount: number;
  totalNotifications: number;
  filterType: "all" | "unread";
  currentPage: number;
}

const NotificationsCenter: React.FC = () => {
  const [state, setState] = useState<NotificationsCenterState>({
    loading: true,
    error: null,
    notifications: [],
    unreadCount: 0,
    totalNotifications: 0,
    filterType: "all",
    currentPage: 0,
  });

  const itemsPerPage = 10;

  // Use polling hook
  useNotificationPolling({
    enabled: true,
    interval: 10000, // 10 seconds
    onNewNotification: (notification) => {
      // Show toast or notification when new message arrives
      console.log("New notification:", notification);
    },
  });

  // Load notifications
  useEffect(() => {
    loadNotifications();
  }, [state.filterType, state.currentPage]);

  const loadNotifications = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const isRead =
        state.filterType === "unread" ? false : undefined;
      const response = await getNotificationsApi(
        isRead,
        itemsPerPage,
        state.currentPage * itemsPerPage
      );

      if (response.success && response.data) {
        setState((prev) => ({
          ...prev,
          notifications: response.data.data,
          unreadCount: response.data.unread_count,
          totalNotifications: response.data.pagination.total,
          loading: false,
        }));
      }
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to load notifications");
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
    }
  };

  const handleMarkAsRead = async (notificationID: number) => {
    try {
      await markNotificationAsReadApi(notificationID);
      await loadNotifications();
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to mark as read");
      alert(errorMsg);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsReadApi();
      await loadNotifications();
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to mark all as read");
      alert(errorMsg);
    }
  };

  const handleDeleteNotification = async (notificationID: number) => {
    try {
      await deleteNotificationApi(notificationID);
      await loadNotifications();
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to delete notification");
      alert(errorMsg);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case "payment":
        return <CreditCard className="w-5 h-5 text-green-600" />;
      case "wallet":
        return <Wallet className="w-5 h-5 text-purple-600" />;
      case "payout":
        return <CreditCard className="w-5 h-5 text-orange-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case "booking":
        return "bg-blue-50";
      case "payment":
        return "bg-green-50";
      case "wallet":
        return "bg-purple-50";
      case "payout":
        return "bg-orange-50";
      default:
        return "bg-gray-50";
    }
  };

  if (state.loading && state.notifications.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Trung Tâm Thông Báo
              </h1>
              <p className="text-gray-600">
                Unread: {state.unreadCount} / Total: {state.totalNotifications}
              </p>
            </div>
            {state.unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                Đánh Dấu Tất Cả Là Đã Đọc
              </button>
            )}
          </div>

          {/* Error Message */}
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{state.error}</p>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  filterType: "all",
                  currentPage: 0,
                }))
              }
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                state.filterType === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Tất Cả
            </button>
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  filterType: "unread",
                  currentPage: 0,
                }))
              }
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                state.filterType === "unread"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Chưa Đọc ({state.unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {state.notifications.length > 0 ? (
              state.notifications.map((notification) => (
                <div
                  key={notification.NotificationID}
                  className={`rounded-lg p-6 flex items-start justify-between hover:shadow-lg transition ${getNotificationBgColor(
                    notification.Type
                  )} ${
                    notification.IsRead === "N"
                      ? "border-l-4 border-blue-600"
                      : "border-l-4 border-gray-300"
                  }`}
                >
                  {/* Content */}
                  <div className="flex-1 flex gap-4">
                    <div className="pt-1">
                      {getNotificationIcon(notification.Type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {notification.Title}
                      </h3>
                      <p className="text-gray-700 text-sm mt-1">
                        {notification.Content}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs text-gray-500">
                          {new Date(notification.CreateAt).toLocaleString("vi-VN")}
                        </span>
                        {notification.IsRead === "N" && (
                          <span className="inline-block px-2 py-1 bg-blue-600 text-white text-xs rounded font-semibold">
                            Chưa Đọc
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    {notification.IsRead === "N" && (
                      <button
                        onClick={() =>
                          handleMarkAsRead(notification.NotificationID)
                        }
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        title="Mark as read"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        handleDeleteNotification(notification.NotificationID)
                      }
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                      title="Delete notification"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  Không có thông báo nào
                </p>
              </div>
            )}
          </div>

          {/* Load More */}
          {state.notifications.length < state.totalNotifications && (
            <div className="text-center mt-8">
              <button
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    currentPage: prev.currentPage + 1,
                  }))
                }
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition"
              >
                Xem Thêm
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NotificationsCenter;
