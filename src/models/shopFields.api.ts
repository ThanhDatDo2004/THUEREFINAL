import { api } from "./api";
import type {
  IApiSuccessResponse,
  IApiErrorResponse,
} from "../interfaces/common";
import type {
  FieldWithImages,
  FieldsQuery,
  FieldsListResult,
  FieldsListResultNormalized,
  FieldImages,
} from "../types";
import { ensureSuccess, extractErrorMessage, rethrowApiError } from "./api.helpers";

// Types for shop field management
export interface CreateFieldData {
  field_name: string;
  sport_type: string;
  address: string;
  price_per_hour: number;
  quantityCount?: number;
  status?: "active" | "maintenance" | "inactive";
}

export interface UpdateFieldData {
  field_name?: string;
  sport_type?: string;
  address?: string;
  price_per_hour?: number;
  status?: "active" | "maintenance" | "inactive";
  deleted_images?: number[];
}

export interface UpdateFieldStatusData {
  status: "active" | "maintenance" | "inactive";
}

/**
 * Shop Fields Management API
 * Tương ứng với các routes mới trong backend:
 * - GET /api/shops/me/fields
 * - POST /api/shops/me/fields
 * - PUT /api/shops/me/fields/:fieldId
 */

/**
 * Lấy danh sách sân của shop hiện tại
 * GET /api/shops/me/fields
 */
export async function fetchMyFields(
  params: FieldsQuery = {}
): Promise<FieldsListResultNormalized> {
  try {
    const { data } = await api.get<
      IApiSuccessResponse<FieldsListResult> | IApiErrorResponse
    >("/shops/me/fields", {
      params: buildQuery(params),
    });

    const payload = ensureSuccess(data, "Không thể tải danh sách sân của bạn");

    // Normalize the result similar to fetchFields
    return {
      fields: payload.fields,
      total: payload.total,
      page: payload.page,
      pageSize: payload.pageSize,
      totalPages:
        payload.totalPages ||
        Math.ceil(payload.total / (payload.pageSize || 12)),
      hasNext:
        payload.hasNext || (payload.page || 1) < (payload.totalPages || 1),
      hasPrev: payload.hasPrev || (payload.page || 1) > 1,
      meta: {
        pagination: {
          total: payload.total,
          page: payload.page,
          pageSize: payload.pageSize,
          totalPages:
            payload.totalPages ||
            Math.ceil(payload.total / (payload.pageSize || 12)),
          hasNext:
            payload.hasNext || (payload.page || 1) < (payload.totalPages || 1),
          hasPrev: payload.hasPrev || (payload.page || 1) > 1,
        },
      },
    };
  } catch (error) {
    rethrowApiError(error, "Không thể tải danh sách sân của bạn");
  }
}

/**
 * Tạo sân mới
 * POST /api/shops/me/fields
 */
export async function createMyField(
  fieldData: CreateFieldData,
  images?: File[]
): Promise<FieldWithImages> {
  try {
    const formData = new FormData();

    // Add field data
    formData.append("field_name", fieldData.field_name);
    formData.append("sport_type", fieldData.sport_type);
    formData.append("address", fieldData.address);
    formData.append("price_per_hour", fieldData.price_per_hour.toString());
    
    if (fieldData.quantityCount) {
      formData.append("quantity_count", fieldData.quantityCount.toString());
    }

    if (fieldData.status) {
      formData.append("status", fieldData.status);
    }

    // Add images
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append("images", image);
      });
    }

    const { data } = await api.post<
      IApiSuccessResponse<FieldWithImages> | IApiErrorResponse
    >("/shops/me/fields", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return ensureSuccess(data, "Không thể tạo sân mới");
  } catch (error) {
    rethrowApiError(error, "Không thể tạo sân mới");
  }
}

/**
 * Cập nhật thông tin sân
 * PUT /api/shops/me/fields/:fieldId
 */
export async function updateMyField(
  fieldId: number,
  fieldData: UpdateFieldData
): Promise<FieldWithImages> {
  try {
    const { data } = await api.put<
      IApiSuccessResponse<FieldWithImages> | IApiErrorResponse
    >(`/shops/me/fields/${fieldId}`, fieldData);

    return ensureSuccess(data, "Không thể cập nhật sân");
  } catch (error) {
    rethrowApiError(error, "Không thể cập nhật sân");
  }
}

/**
 * Lấy thông tin chi tiết một sân của shop
 * Sử dụng API public để lấy thông tin sân
 */
export async function fetchMyFieldById(
  fieldId: number
): Promise<FieldWithImages | null> {
  if (!fieldId) return null;

  try {
    const { data } = await api.get<
      IApiSuccessResponse<FieldWithImages> | IApiErrorResponse
    >(`/fields/${fieldId}`);

    return ensureSuccess(data, "Không thể tải thông tin sân");
  } catch (error: any) {
    const status = error?.status ?? error?.response?.status;
    if (status === 404) {
      return null;
    }
    rethrowApiError(error, "Không thể tải thông tin sân");
  }
}


// ===== Quantity Support =====
/**
 * Update CreateFieldData interface to support quantityCount
 */
