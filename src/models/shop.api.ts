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
  FieldPricing,
  FieldOperatingHours,
  FieldOperatingHoursPayload,
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
  phone_number?: string;
  opening_time?: string | null;
  closing_time?: string | null;
  is_open_24h?: boolean;
}

export async function updateMyShop(
  payload: UpdateMyShopPayload
): Promise<Shops> {
  try {
    const body: Record<string, unknown> = { ...payload };
    if (body.opening_time === undefined) {
      delete body.opening_time;
    }
    if (body.closing_time === undefined) {
      delete body.closing_time;
    }
    if (body.is_open_24h === undefined) {
      delete body.is_open_24h;
    }

    const { data } = await api.put<
      ApiSuccess<MaybeArrayResult<Shops>> | ApiError
    >("/shops/me", body);
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
  quantity_count?: number;
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
  quantityCount?: number;
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
    if (payload.quantityCount) {
      formData.append("quantity_count", String(payload.quantityCount));
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

// New function to fetch shop bookings for revenue display
export interface ShopBookingItem {
  BookingCode: string;
  FieldCode: number;
  FieldName?: string;
  ShopName?: string;
  PlayDate?: string;
  StartTime?: string;
  EndTime?: string;
  TotalPrice: number;
  PlatformFee?: number;
  NetToShop?: number;
  BookingStatus: "pending" | "confirmed" | "cancelled" | "completed";
  PaymentStatus: "pending" | "paid" | "failed" | "refunded";
  CheckinCode?: string;
  CustomerUserID?: number;
  CustomerName?: string;
  CustomerPhone?: string;
  CustomerEmail?: string;
  // Slots from Booking_Slots table
  slots?: Array<{
    Slot_ID: number;
    PlayDate: string;
    StartTime: string;
    EndTime: string;
    PricePerSlot?: number;
    Status?: string;
  }>;
}

export async function fetchShopBookingsForRevenue(): Promise<ShopBookingItem[]> {
  try {
    const { data } = await api.get<
      ApiSuccess<MaybeArrayResult<ShopBookingItem[]>> | ApiError
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

// Bank account types
export interface ShopBankAccount {
  ShopBankID: number;
  ShopCode: number;
  BankName: string;
  AccountNumber: string;
  AccountHolder?: string;
  IsDefault?: string | boolean;
}

export async function fetchShopBankAccounts(): Promise<ShopBankAccount[]> {
  try {
    const { data } = await api.get<
      ApiSuccess<MaybeArrayResult<ShopBankAccount[]>> | ApiError
    >("/shops/me/bank-accounts");
    const payload = ensureSuccess(
      data,
      "Không thể tải danh sách tài khoản ngân hàng."
    );
    return normalizeList(payload);
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(error, "Không thể tải danh sách tài khoản ngân hàng.")
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

// Field Operating Hours API Functions (separated from pricing)
// Backend response might have different field names, so we normalize them
const normalizeOperatingHoursResponse = (data: any): FieldOperatingHours => {
  return {
    pricing_id: data.pricing_id || data.PricingID || data.id,
    field_code: data.field_code || data.FieldCode || data.fieldId,
    day_of_week: data.day_of_week || data.DayOfWeek || data.dayOfWeek,
    start_time: data.start_time || data.StartTime || data.startTime,
    end_time: data.end_time || data.EndTime || data.endTime,
    created_at: data.created_at || data.CreateAt || data.createdAt,
    updated_at: data.updated_at || data.UpdateAt || data.updatedAt,
  };
};

// Keep old pricing functions for backward compatibility
export interface FieldPricingPayload {
  field_code: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  price_per_hour: number;
}

const normalizePricingResponse = (data: any): FieldPricing => {
  return {
    pricing_id: data.pricing_id || data.PricingID || data.id,
    field_code: data.field_code || data.FieldCode || data.fieldId,
    day_of_week: data.day_of_week || data.DayOfWeek || data.dayOfWeek,
    start_time: data.start_time || data.StartTime || data.startTime,
    end_time: data.end_time || data.EndTime || data.endTime,
    price_per_hour:
      data.price_per_hour || data.PricePerHour || data.pricePerHour,
    created_at: data.created_at || data.CreateAt || data.createdAt,
    updated_at: data.updated_at || data.UpdateAt || data.updatedAt,
  };
};

// New Operating Hours API Functions
export async function fetchFieldOperatingHours(
  fieldCode: number
): Promise<FieldOperatingHours[]> {
  if (!Number.isFinite(fieldCode)) return [];
  try {
    console.log(`Fetching operating hours for field ${fieldCode}`);

    const { data } = await api.get<
      ApiSuccess<MaybeArrayResult<FieldOperatingHours[]>> | ApiError
    >(`/shops/me/fields/${fieldCode}/pricing`);

    console.log(`API response for field ${fieldCode}:`, data);

    const payload = ensureSuccess(data, "Không thể tải dữ liệu giờ hoạt động.");
    const rawList = normalizeList(payload);

    console.log(`Normalized list for field ${fieldCode}:`, rawList);

    // Normalize each item in the list to handle different backend response formats
    const result = rawList.map((item: any) =>
      normalizeOperatingHoursResponse(item)
    );
    console.log(`Final result for field ${fieldCode}:`, result);

    return result;
  } catch (error: unknown) {
    console.error(
      `Error fetching operating hours for field ${fieldCode}:`,
      error
    );
    throw new Error(
      extractErrorMessage(error, "Không thể tải dữ liệu giờ hoạt động.")
    );
  }
}

export async function createFieldOperatingHours(
  payload: FieldOperatingHoursPayload
): Promise<FieldOperatingHours> {
  if (!Number.isFinite(payload.field_code)) {
    throw new Error("Field code không hợp lệ.");
  }
  try {
    const normalizedFieldCode = Number(payload.field_code);
    const normalizedDay = Number(payload.day_of_week);
    const start = (payload.start_time || "").trim();
    const end = (payload.end_time || "").trim();
    if (!Number.isFinite(normalizedFieldCode)) {
      throw new Error("Field code không hợp lệ.");
    }
    if (
      !Number.isInteger(normalizedDay) ||
      normalizedDay < 0 ||
      normalizedDay > 6
    ) {
      throw new Error("Thứ trong tuần không hợp lệ (0-6).");
    }
    if (!start || !end) {
      throw new Error("Giờ bắt đầu/kết thúc không được để trống.");
    }
    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
      throw new Error("Định dạng giờ không hợp lệ. Vui lòng dùng HH:MM.");
    }

    const normalizedPayload = {
      field_code: normalizedFieldCode,
      day_of_week: normalizedDay,
      start_time: start,
      end_time: end,
    };

    console.log(
      "Attempting to create operating hours with payload:",
      normalizedPayload
    );

    const { data } = await api.post<
      ApiSuccess<MaybeArrayResult<FieldOperatingHours>> | ApiError
    >(`/shops/me/fields/${normalizedFieldCode}/pricing`, normalizedPayload);

    const payloadData = ensureSuccess(data, "Không thể tạo giờ hoạt động mới.");
    const rawData = normalizeSingle(payloadData);
    return normalizeOperatingHoursResponse(rawData);
  } catch (error: unknown) {
    console.error("Create operating hours error:", error);
    throw new Error(
      extractErrorMessage(error, "Không thể tạo giờ hoạt động mới.")
    );
  }
}

export async function updateFieldOperatingHours(
  pricingId: number,
  payload: Partial<FieldOperatingHoursPayload>
): Promise<FieldOperatingHours> {
  if (!Number.isFinite(pricingId)) {
    throw new Error("Pricing ID không hợp lệ.");
  }
  try {
    // Filter out undefined values and normalize numeric day_of_week
    const filtered = Object.fromEntries(
      Object.entries(payload).filter(([_, value]) => value !== undefined)
    ) as Partial<FieldOperatingHoursPayload>;

    const normalized: Record<string, unknown> = { ...filtered };
    if (filtered.day_of_week !== undefined) {
      const day = Number(filtered.day_of_week);
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        throw new Error("Thứ trong tuần không hợp lệ (0-6).");
      }
      normalized.day_of_week = day;
    }
    if (filtered.start_time !== undefined) {
      const start = String(filtered.start_time || "").trim();
      if (!start) {
        throw new Error("Giờ bắt đầu không được để trống.");
      }
      if (!/^\d{2}:\d{2}$/.test(start)) {
        throw new Error("Định dạng giờ bắt đầu không hợp lệ (HH:MM).");
      }
      normalized.start_time = start;
    }
    if (filtered.end_time !== undefined) {
      const end = String(filtered.end_time || "").trim();
      if (!end) {
        throw new Error("Giờ kết thúc không được để trống.");
      }
      if (!/^\d{2}:\d{2}$/.test(end)) {
        throw new Error("Định dạng giờ kết thúc không hợp lệ (HH:MM).");
      }
      normalized.end_time = end;
    }

    const { data } = await api.put<
      ApiSuccess<MaybeArrayResult<FieldOperatingHours>> | ApiError
    >(`/shops/me/pricing/${pricingId}`, normalized);
    const payloadData = ensureSuccess(
      data,
      "Không thể cập nhật giờ hoạt động."
    );
    const rawData = normalizeSingle(payloadData);

    return normalizeOperatingHoursResponse(rawData);
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(error, "Không thể cập nhật giờ hoạt động.")
    );
  }
}

export async function deleteFieldOperatingHours(
  pricingId: number
): Promise<{ deleted: boolean }> {
  if (!Number.isFinite(pricingId)) {
    throw new Error("Pricing ID không hợp lệ.");
  }
  try {
    const { data } = await api.delete<
      ApiSuccess<{ deleted: boolean }> | ApiError
    >(`/shops/me/pricing/${pricingId}`);
    return ensureSuccess(data, "Không thể xóa giờ hoạt động.");
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, "Không thể xóa giờ hoạt động."));
  }
}

// Keep old pricing functions for backward compatibility (used in fields management)
export async function fetchFieldPricing(
  fieldCode: number
): Promise<FieldPricing[]> {
  if (!Number.isFinite(fieldCode)) return [];
  try {
    const { data } = await api.get<
      ApiSuccess<MaybeArrayResult<FieldPricing[]>> | ApiError
    >(`/shops/me/fields/${fieldCode}/pricing`);
    const payload = ensureSuccess(data, "Không thể tải dữ liệu giá sân.");
    const rawList = normalizeList(payload);

    // Normalize each item in the list to handle different backend response formats
    return rawList.map((item: any) => normalizePricingResponse(item));
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(error, "Không thể tải dữ liệu giá sân.")
    );
  }
}

export async function createFieldPricing(
  payload: FieldPricingPayload
): Promise<FieldPricing> {
  if (!Number.isFinite(payload.field_code)) {
    throw new Error("Field code không hợp lệ.");
  }
  try {
    // Normalize payload to handle different backend expectations
    const normalizedPayload = {
      field_code: payload.field_code,
      day_of_week: payload.day_of_week,
      start_time: payload.start_time,
      end_time: payload.end_time,
      price_per_hour: payload.price_per_hour,
    };

    const { data } = await api.post<
      ApiSuccess<MaybeArrayResult<FieldPricing>> | ApiError
    >(`/shops/me/fields/${payload.field_code}/pricing`, normalizedPayload);
    const payloadData = ensureSuccess(data, "Không thể tạo giá sân mới.");
    const rawData = normalizeSingle(payloadData);

    return normalizePricingResponse(rawData);
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, "Không thể tạo giá sân mới."));
  }
}

export async function updateFieldPricing(
  pricingId: number,
  payload: Partial<FieldPricingPayload>
): Promise<FieldPricing> {
  if (!Number.isFinite(pricingId)) {
    throw new Error("Pricing ID không hợp lệ.");
  }
  try {
    // Filter out undefined values and normalize payload
    const normalizedPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, value]) => value !== undefined)
    );

    const { data } = await api.put<
      ApiSuccess<MaybeArrayResult<FieldPricing>> | ApiError
    >(`/shops/me/pricing/${pricingId}`, normalizedPayload);
    const payloadData = ensureSuccess(data, "Không thể cập nhật giá sân.");
    const rawData = normalizeSingle(payloadData);

    return normalizePricingResponse(rawData);
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, "Không thể cập nhật giá sân."));
  }
}

export async function deleteFieldPricing(
  pricingId: number
): Promise<{ deleted: boolean }> {
  if (!Number.isFinite(pricingId)) {
    throw new Error("Pricing ID không hợp lệ.");
  }
  try {
    const { data } = await api.delete<
      ApiSuccess<{ deleted: boolean }> | ApiError
    >(`/shops/me/pricing/${pricingId}`);
    return ensureSuccess(data, "Không thể xóa giá sân.");
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, "Không thể xóa giá sân."));
  }
}
