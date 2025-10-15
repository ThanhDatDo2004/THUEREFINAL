import { api } from "./api";
import type { FieldWithImages, ApiSuccess, ApiError } from "../types";

// Types for field status management
export interface UpdateFieldStatusData {
  status: "active" | "maintenance" | "inactive";
}

// Helper functions
const ensureSuccess = <T>(
  payload: ApiSuccess<T> | ApiError,
  fallbackMessage: string
): T => {
  if (payload?.success && payload.data !== undefined) {
    return payload.data;
  }
  const message =
    payload?.error?.message || payload?.message || fallbackMessage;
  throw new Error(message);
};

type ErrorWithResponse = {
  response?: {
    status?: number;
    data?: {
      error?: { message?: string | null } | null;
      message?: string | null;
    };
  };
  message?: string;
};

const extractErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "object" && error !== null) {
    const typed = error as ErrorWithResponse;
    const apiMessage =
      typed.response?.data?.error?.message || typed.response?.data?.message;
    if (apiMessage) return apiMessage;
    if (typed.message) return typed.message;
  }
  return fallback;
};

/**
 * Field Status Management API
 * Tương ứng với route mới trong backend:
 * - PATCH /api/shops/me/fields/:fieldId/status
 */

/**
 * Cập nhật trạng thái sân (đặt bảo trì, kích hoạt, vô hiệu hóa)
 * PATCH /api/shops/me/fields/:fieldId/status
 */
export async function updateFieldStatus(
  fieldId: number,
  statusData: UpdateFieldStatusData
): Promise<FieldWithImages> {
  try {
    const { data } = await api.patch<ApiSuccess<FieldWithImages> | ApiError>(
      `/shops/me/fields/${fieldId}/status`,
      statusData
    );

    return ensureSuccess(data, "Không thể cập nhật trạng thái sân");
  } catch (error: unknown) {
    const message = extractErrorMessage(
      error,
      "Không thể cập nhật trạng thái sân"
    );
    throw new Error(message);
  }
}

/**
 * Đặt sân vào trạng thái bảo trì
 * Convenience function để đặt status = "maintenance"
 */
export async function setFieldMaintenance(
  fieldId: number
): Promise<FieldWithImages> {
  return updateFieldStatus(fieldId, { status: "maintenance" });
}

/**
 * Kích hoạt sân (chuyển từ maintenance về active)
 * Convenience function để đặt status = "active"
 */
export async function activateField(fieldId: number): Promise<FieldWithImages> {
  return updateFieldStatus(fieldId, { status: "active" });
}

/**
 * Vô hiệu hóa sân
 * Convenience function để đặt status = "inactive"
 */
export async function deactivateField(
  fieldId: number
): Promise<FieldWithImages> {
  return updateFieldStatus(fieldId, { status: "inactive" });
}

/**
 * Kiểm tra xem sân có đang trong trạng thái bảo trì không
 */
export function isFieldInMaintenance(field: FieldWithImages): boolean {
  return field.status === "maintenance";
}

/**
 * Kiểm tra xem sân có đang hoạt động không
 */
export function isFieldActive(field: FieldWithImages): boolean {
  return field.status === "active";
}

/**
 * Lấy label hiển thị cho trạng thái sân
 */
export function getFieldStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    active: "Hoạt động",
    maintenance: "Bảo trì",
    inactive: "Không hoạt động",
    available: "Có sẵn",
    unavailable: "Không có sẵn",
    booked: "Đã đặt",
    draft: "Bản nháp",
  };

  return statusLabels[status] || status;
}

/**
 * Lấy màu sắc cho trạng thái sân (cho UI)
 */
export function getFieldStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    active: "green",
    maintenance: "orange",
    inactive: "red",
    available: "blue",
    unavailable: "gray",
    booked: "purple",
    draft: "yellow",
  };

  return statusColors[status] || "gray";
}
