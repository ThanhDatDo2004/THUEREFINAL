import { api } from "./api";
import {
  normalizeFieldsListResult,
  type FieldsListResult,
  type FieldsListResultNormalized,
} from "./fields.api";
import type {
  Bookings,
  Customers,
  FieldWithImages,
  Fields,
  ShopRevenue,
  Shops,
} from "../types";

export type ShopRequestPayload = {
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  message?: string;
};

type ApiSuccess<T> = {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  error: null;
};

type ApiError = {
  success: false;
  statusCode: number;
  message: string;
  data: null;
  error?: { message?: string | null } | null;
};

type MaybeArrayResult<T> = T | { data: T } | { items: T } | { rows: T };

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

const normalizeList = <T>(input: MaybeArrayResult<T[]>) => {
  if (Array.isArray(input)) return input;
  if (Array.isArray((input as { items?: T[] }).items)) {
    return (input as { items: T[] }).items;
  }
  if (Array.isArray((input as { data?: T[] }).data)) {
    return (input as { data: T[] }).data;
  }
  if (Array.isArray((input as { rows?: T[] }).rows)) {
    return (input as { rows: T[] }).rows;
  }
  return [];
};

const normalizeSingle = <T>(input: MaybeArrayResult<T>) => {
  if (
    input &&
    typeof input === "object" &&
    !Array.isArray(input) &&
    "items" in input
  ) {
    return (input as { items: T }).items;
  }
  if (
    input &&
    typeof input === "object" &&
    !Array.isArray(input) &&
    "data" in input
  ) {
    return (input as { data: T }).data;
  }
  if (
    input &&
    typeof input === "object" &&
    !Array.isArray(input) &&
    "rows" in input
  ) {
    return (input as { rows: T }).rows;
  }
  return input as T;
};

const extractErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null) {
    const maybe = error as {
      response?: {
        data?: { error?: { message?: string | null } | null; message?: string };
      };
      message?: string;
    };
    const apiMessage =
      maybe.response?.data?.error?.message ||
      maybe.response?.data?.message ||
      maybe.message;
    if (apiMessage) return apiMessage;
  }
  return fallback;
};

export async function submitShopRequest(payload: ShopRequestPayload) {
  try {
    const { data } = await api.post<ApiSuccess<{ ok: boolean }> | ApiError>(
      "/shops/requests",
      payload
    );
    return ensureSuccess(data, "Không thể gửi yêu cầu");
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, "Không thể gửi yêu cầu"));
  }
}

export async function fetchMyShop(): Promise<Shops | null> {
  try {
    const { data } = await api.get<
      ApiSuccess<MaybeArrayResult<Shops>> | ApiError
    >("/shops/me");
    const payload = ensureSuccess(
      data,
      "Không thể tải thông tin shop của bạn."
    );
    return normalizeSingle(payload) ?? null;
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(error, "Không thể tải thông tin shop của bạn.")
    );
  }
}

export interface UpdateMyShopPayload {
  shop_name: string;
  address: string;
  bank_account_number?: string;
  bank_name?: string;
  bank_account_holder?: string;
}

export async function updateMyShop(
  payload: UpdateMyShopPayload
): Promise<Shops> {
  try {
    const { data } = await api.put<
      ApiSuccess<MaybeArrayResult<Shops>> | ApiError
    >("/shops/me", payload);
    const payloadData = ensureSuccess(
      data,
      "Không thể cập nhật thông tin shop."
    );
    return normalizeSingle(payloadData);
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(error, "Không thể cập nhật thông tin shop.")
    );
  }
}

export async function fetchShopByCode(shopCode: number): Promise<Shops | null> {
  if (!Number.isFinite(shopCode)) return null;
  try {
    const { data } = await api.get<
      ApiSuccess<MaybeArrayResult<Shops>> | ApiError
    >(`/shops/${shopCode}`);
    const payload = ensureSuccess(data, "Không thể tải thông tin shop.");
    return normalizeSingle(payload) ?? null;
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(error, "Không thể tải thông tin shop.")
    );
  }
}

export interface UpsertShopFieldPayload {
  field_name?: string;
  sport_type?: Fields["sport_type"];
  price_per_hour?: number;
  default_price_per_hour?: number;
  address?: string;
  status?: Fields["status"];
  // Frontend passes list of image IDs to delete; backend may choose to honor it
  deleted_images?: number[];
}

export interface ShopFieldsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export interface CreateShopFieldPayload {
  field_name: string;
  sport_type: Fields["sport_type"];
  price_per_hour: number;
  address: string;
  status?: Fields["status"];
  images?: File[];
}

const buildShopFieldsQuery = (params: ShopFieldsQuery = {}) => {
  const query: Record<string, unknown> = {};
  if (typeof params.page === "number") query.page = params.page;
  if (typeof params.pageSize === "number") query.pageSize = params.pageSize;
  if (params.search) query.search = params.search;
  if (params.status) query.status = params.status;
  return query;
};

export async function fetchShopFields(
  shopCode?: number,
  params?: ShopFieldsQuery
): Promise<FieldsListResultNormalized> {
  try {
    const path = shopCode ? `/shops/${shopCode}/fields` : "/shops/me/fields";
    const { data } = await api.get<
      | ApiSuccess<FieldsListResult | MaybeArrayResult<FieldWithImages[]>>
      | ApiError
    >(path, {
      params: buildShopFieldsQuery(params),
    });
    const payload = ensureSuccess(data, "Không thể tải danh sách sân.");
    if (Array.isArray(payload)) {
      const items = normalizeList(payload);
      return normalizeFieldsListResult({
        items,
        total: items.length,
        page: 1,
        pageSize: items.length || 1,
        facets: {
          sportTypes: [],
          locations: [],
        },
        summary: undefined,
      });
    }
    return normalizeFieldsListResult(payload as FieldsListResult);
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, "Không thể tải danh sách sân."));
  }
}

export async function createShopField(
  shopCode: number,
  payload: CreateShopFieldPayload
): Promise<FieldWithImages> {
  if (!Number.isFinite(shopCode)) {
    throw new Error("Thiếu mã shop để tạo sân mới.");
  }
  try {
    const formData = new FormData();
    formData.append("field_name", payload.field_name);
    formData.append("sport_type", payload.sport_type);
    formData.append("price_per_hour", String(payload.price_per_hour ?? 0));
    formData.append("address", payload.address);
    if (payload.status) {
      formData.append("status", payload.status);
    }
    (payload.images ?? []).forEach((file) => {
      formData.append("images", file);
    });

    const { data } = await api.post<
      ApiSuccess<MaybeArrayResult<FieldWithImages>> | ApiError
    >(`/shops/${shopCode}/fields`, formData);
    const payloadData = ensureSuccess(data, "Không thể tạo sân mới.");
    const normalized = normalizeSingle(payloadData);
    if (!normalized) {
      throw new Error("Không nhận được dữ liệu sân sau khi tạo.");
    }
    return normalized;
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, "Không thể tạo sân mới."));
  }
}

export async function updateShopField(
  fieldCode: number,
  payload: UpsertShopFieldPayload
): Promise<FieldWithImages | null> {
  if (!Number.isFinite(fieldCode)) return null;
  try {
    const { data } = await api.put<
      ApiSuccess<MaybeArrayResult<FieldWithImages>> | ApiError
    >(`/shops/me/fields/${fieldCode}`, payload);
    const payloadData = ensureSuccess(
      data,
      "Không thể cập nhật thông tin sân."
    );
    return normalizeSingle(payloadData) ?? null;
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(error, "Không thể cập nhật thông tin sân.")
    );
  }
}

export async function updateShopFieldStatus(
  fieldCode: number,
  status: Fields["status"]
): Promise<FieldWithImages | null> {
  if (!Number.isFinite(fieldCode)) return null;
  try {
    const { data } = await api.patch<
      ApiSuccess<MaybeArrayResult<FieldWithImages>> | ApiError
    >(`/shops/me/fields/${fieldCode}/status`, { status });
    const payloadData = ensureSuccess(
      data,
      "Không thể cập nhật trạng thái sân."
    );
    return normalizeSingle(payloadData) ?? null;
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(error, "Không thể cập nhật trạng thái sân.")
    );
  }
}

export async function deleteShopField(
  fieldCode: number
): Promise<{ deleted: boolean } | null> {
  if (!Number.isFinite(fieldCode)) return null;
  try {
    const { data } = await api.delete<
      ApiSuccess<{ deleted: boolean }> | ApiError
    >(`/shops/me/fields/${fieldCode}`);
    return ensureSuccess(data, "Không thể xoá sân.");
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, "Không thể xoá sân."));
  }
}

export async function fetchMyShopBookings(): Promise<Bookings[]> {
  try {
    const { data } = await api.get<
      ApiSuccess<MaybeArrayResult<Bookings[]>> | ApiError
    >("/shops/me/bookings");
    const payload = ensureSuccess(
      data,
      "Không thể tải danh sách đơn đặt của shop."
    );
    return normalizeList(payload);
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(error, "Không thể tải danh sách đơn đặt của shop.")
    );
  }
}

export async function fetchMyShopCustomers(): Promise<Customers[]> {
  try {
    const { data } = await api.get<
      ApiSuccess<MaybeArrayResult<Customers[]>> | ApiError
    >("/shops/me/customers");
    const payload = ensureSuccess(data, "Không thể tải danh sách khách hàng.");
    return normalizeList(payload);
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(error, "Không thể tải danh sách khách hàng.")
    );
  }
}

export async function fetchMyShopRevenue(params?: {
  year?: number;
  month?: number;
}): Promise<ShopRevenue[]> {
  try {
    const { data } = await api.get<
      ApiSuccess<MaybeArrayResult<ShopRevenue[]>> | ApiError
    >("/shops/me/revenue", {
      params,
    });
    const payload = ensureSuccess(
      data,
      "Không thể tải dữ liệu doanh thu của shop."
    );
    return normalizeList(payload);
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(error, "Không thể tải dữ liệu doanh thu của shop.")
    );
  }
}
