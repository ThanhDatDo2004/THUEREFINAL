import { api } from "./api";
import type {
  FieldWithImages,
  FieldsQuery,
  FieldsListResult,
  FieldsListResultNormalized,
  ApiSuccess,
  ApiError,
  FieldImages,
} from "../types";

// Types for shop field management
export interface CreateFieldData {
  field_name: string;
  sport_type: string;
  address: string;
  price_per_hour: number;
  status?: "active" | "maintenance" | "inactive";
}

export interface UpdateFieldData {
  field_name?: string;
  sport_type?: string;
  address?: string;
  price_per_hour?: number;
  status?: "active" | "maintenance" | "inactive";
}

export interface UpdateFieldStatusData {
  status: "active" | "maintenance" | "inactive";
}

// Helper functions from existing fields.api.ts
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

const buildQuery = (params: FieldsQuery = {}) => {
  const query: Record<string, unknown> = {};

  if (params.search) query.search = params.search;
  if (params.sportType) query.sportType = params.sportType;
  if (params.location) query.location = params.location;
  if (typeof params.priceMin === "number") query.priceMin = params.priceMin;
  if (typeof params.priceMax === "number") query.priceMax = params.priceMax;
  if (typeof params.page === "number") query.page = params.page;
  if (typeof params.pageSize === "number") query.pageSize = params.pageSize;
  if (params.sortBy) query.sortBy = params.sortBy;
  if (params.sortDir) query.sortDir = params.sortDir;
  if (params.status) query.status = params.status;

  return query;
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
    const { data } = await api.get<ApiSuccess<FieldsListResult> | ApiError>(
      "/shops/me/fields",
      {
        params: buildQuery(params),
      }
    );

    const payload = ensureSuccess(data, "Không thể tải danh sách sân của bạn");

    // Normalize the result similar to fetchFields
    return {
      ...payload,
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
  } catch (error: unknown) {
    const message = extractErrorMessage(
      error,
      "Không thể tải danh sách sân của bạn"
    );
    throw new Error(message);
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

    if (fieldData.status) {
      formData.append("status", fieldData.status);
    }

    // Add images
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append("images", image);
      });
    }

    const { data } = await api.post<ApiSuccess<FieldWithImages> | ApiError>(
      "/shops/me/fields",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return ensureSuccess(data, "Không thể tạo sân mới");
  } catch (error: unknown) {
    const message = extractErrorMessage(error, "Không thể tạo sân mới");
    throw new Error(message);
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
    const { data } = await api.put<ApiSuccess<FieldWithImages> | ApiError>(
      `/shops/me/fields/${fieldId}`,
      fieldData
    );

    return ensureSuccess(data, "Không thể cập nhật sân");
  } catch (error: unknown) {
    const message = extractErrorMessage(error, "Không thể cập nhật sân");
    throw new Error(message);
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
    const { data } = await api.get<ApiSuccess<FieldWithImages> | ApiError>(
      `/fields/${fieldId}`
    );

    return ensureSuccess(data, "Không thể tải thông tin sân");
  } catch (error: unknown) {
    const typed = error as ErrorWithResponse;
    if (typed.response?.status === 404) {
      return null;
    }
    const message = extractErrorMessage(error, "Không thể tải thông tin sân");
    throw new Error(message);
  }
}
