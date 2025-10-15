import { api } from "./api";
import type { FieldWithImages } from "../types";
import type {
  IApiSuccessResponse,
  IApiErrorResponse,
} from "../interfaces/common";
import { ensureSuccess, extractErrorMessage } from "./api.helpers";

// Types for field status management
export interface UpdateFieldStatusData {
  status: "active" | "maintenance" | "inactive";
}

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
    const { data } = await api.patch<
      IApiSuccessResponse<FieldWithImages> | IApiErrorResponse
    >(`/shops/me/fields/${fieldId}/status`, statusData);

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

