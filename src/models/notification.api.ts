import api from "./api";
import type { IApiSuccessResponse } from "../interfaces/common";

export interface Notification {
  NotificationID: number;
  Type: "booking" | "wallet" | "payout" | "system";
  Title: string;
  Content: string;
  IsRead: "Y" | "N";
  CreateAt: string;
}

export interface NotificationsListResponse {
  data: Notification[];
  unread_count: number;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface MarkAsReadResponse {
  notificationID: number;
  isRead: boolean;
}

export interface MarkAllAsReadResponse {
  updated: number;
}

/**
 * Get notifications list
 */
export const getNotificationsApi = async (
  isRead?: boolean,
  limit: number = 10,
  offset: number = 0
): Promise<IApiSuccessResponse<NotificationsListResponse>> => {
  const params: any = { limit, offset };
  if (isRead !== undefined) params.isRead = isRead;
  const response = await api.get<IApiSuccessResponse<NotificationsListResponse>>(
    "/notifications",
    { params }
  );
  return response.data;
};

/**
 * Mark single notification as read
 */
export const markNotificationAsReadApi = async (
  notificationID: number
): Promise<IApiSuccessResponse<MarkAsReadResponse>> => {
  const response = await api.patch<IApiSuccessResponse<MarkAsReadResponse>>(
    `/notifications/${notificationID}/read`
  );
  return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsReadApi = async (): Promise<
  IApiSuccessResponse<MarkAllAsReadResponse>
> => {
  const response = await api.patch<IApiSuccessResponse<MarkAllAsReadResponse>>(
    "/notifications/read-all"
  );
  return response.data;
};

/**
 * Delete a notification
 */
export const deleteNotificationApi = async (
  notificationID: number
): Promise<IApiSuccessResponse<{ success: true }>> => {
  const response = await api.delete<IApiSuccessResponse<{ success: true }>>(
    `/notifications/${notificationID}`
  );
  return response.data;
};
