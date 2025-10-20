import { api } from "./api";
import type { FieldImages, FieldWithImages, FieldsQuery } from "../types";

export interface FieldsFacetItem {
  value: string;
  label: string;
  total: number;
  count: number;
}

export interface FieldsSummary {
  totals: {
    fields: number;
    available: number;
    maintenance: number;
    booked: number;
  };
  shops: {
    approved: number;
    pending: number;
  };
}

export interface FieldsPaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface FieldsListMeta {
  pagination?: FieldsPaginationMeta;
  filters?: Record<string, unknown>;
  appliedFilters?: Record<string, unknown>;
}

export interface FieldsListResult {
  items: FieldWithImages[];
  total: number;
  page: number;
  pageSize: number;
  facets: {
    sportTypes: string[];
    locations: string[];
    statuses?: FieldsFacetItem[];
    shopApprovals?: FieldsFacetItem[];
  };
  summary?: FieldsSummary;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  meta?: FieldsListMeta;
}

export type FieldsListResultNormalized = FieldsListResult & {
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  meta: FieldsListMeta & {
    pagination: FieldsPaginationMeta;
  };
};

export type ApiSuccess<T> = {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  error: null;
};

export type ApiError = {
  success: false;
  statusCode: number;
  message: string;
  data: null;
  error?: { message?: string };
};

const ensureSuccess = <T,>(
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

const toNumberOrUndefined = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toBooleanOrUndefined = (value: unknown) =>
  typeof value === "boolean" ? value : undefined;

const DEFAULT_PAGE_SIZE = 12;

export const normalizeFieldsListResult = (
  input: FieldsListResult
): FieldsListResultNormalized => {
  const items = Array.isArray(input.items) ? input.items : [];
  const metaPagination = input.meta?.pagination;

  const totalCandidate =
    toNumberOrUndefined(metaPagination?.total) ??
    toNumberOrUndefined(input.total) ??
    items.length;

  const pageSizeCandidate =
    toNumberOrUndefined(metaPagination?.pageSize) ??
    toNumberOrUndefined(input.pageSize) ??
    (items.length > 0 ? items.length : DEFAULT_PAGE_SIZE);

  const pageCandidate =
    toNumberOrUndefined(metaPagination?.page) ??
    toNumberOrUndefined(input.page) ??
    1;

  const totalPagesCandidate =
    toNumberOrUndefined(metaPagination?.totalPages) ??
    toNumberOrUndefined(input.totalPages);

  const total = Math.max(0, totalCandidate ?? 0);
  const pageSize = Math.max(1, pageSizeCandidate ?? DEFAULT_PAGE_SIZE);
  const page = Math.max(1, pageCandidate ?? 1);

  const fallbackTotalPages = Math.max(1, Math.ceil(total / pageSize));
  const totalPages = Math.max(1, totalPagesCandidate ?? fallbackTotalPages);

  const hasNext =
    toBooleanOrUndefined(metaPagination?.hasNext) ??
    toBooleanOrUndefined(input.hasNext) ??
    page < totalPages;

  const hasPrev =
    toBooleanOrUndefined(metaPagination?.hasPrev) ??
    toBooleanOrUndefined(input.hasPrev) ??
    page > 1;

  const pagination: FieldsPaginationMeta = {
    total,
    page,
    pageSize,
    totalPages,
    hasNext,
    hasPrev,
  };

  return {
    ...input,
    items,
    total,
    page,
    pageSize,
    totalPages,
    hasNext,
    hasPrev,
    meta: {
      ...input.meta,
      pagination,
    },
  };
};

export async function fetchFields(
  params: FieldsQuery = {}
): Promise<FieldsListResultNormalized> {
  try {
    const { data } = await api.get<
      ApiSuccess<FieldsListResult> | ApiError
    >(
      "/fields",
      { params: buildQuery(params) }
    );
    const payload = ensureSuccess(
      data,
      "Không thể tải danh sách sân"
    );
    return normalizeFieldsListResult(payload);
  } catch (error: unknown) {
    const message = extractErrorMessage(
      error,
      "Không thể tải danh sách sân"
    );
    throw new Error(message);
  }
}

export async function fetchFieldById(
  fieldId: number
): Promise<FieldWithImages | null> {
  try {
    const { data } = await api.get<
      ApiSuccess<FieldWithImages> | ApiError
    >(`/fields/${fieldId}`);
    return ensureSuccess(data, "Không thể tải thông tin sân");
  } catch (error: unknown) {
    const typed = error as ErrorWithResponse;
    if (typed.response?.status === 404) {
      return null;
    }
    const message = extractErrorMessage(
      error,
      "Không thể tải thông tin sân"
    );
    throw new Error(message);
  }
}

export async function uploadFieldImage(
  fieldId: number,
  file: File
): Promise<FieldImages> {
  const formData = new FormData();
  formData.append("images", file);

  try {
    const { data } = await api.post<
      ApiSuccess<FieldImages> | ApiError
    >(`/fields/${fieldId}/images`, formData);
    return ensureSuccess(data, "Không thể tải ảnh sân");
  } catch (error: unknown) {
    const message = extractErrorMessage(
      error,
      "Không thể tải ảnh sân"
    );
    throw new Error(message);
  }
}

export type FieldSlotStatus =
  | "available"
  | "held"
  | "booked"
  | "blocked"
  | "on_hold"
  | "confirmed"
  | "reserved"
  | "disabled"
  | string;

export interface FieldSlot {
  slot_id: number;
  field_code: number;
  play_date: string;
  start_time: string;
  end_time: string;
  status: FieldSlotStatus;
  hold_expires_at: string | null;
  is_available?: boolean;
  availability_state?: string | null;
  availability_status?: string | null;
}

export interface FieldAvailabilityResponse {
  field_code: number;
  date: string | null;
  slots: FieldSlot[];
}

export async function fetchFieldAvailability(
  fieldId: number,
  date?: string
): Promise<FieldAvailabilityResponse> {
  try {
    const { data } = await api.get<
      ApiSuccess<FieldAvailabilityResponse> | ApiError
    >(`/fields/${fieldId}/availability`, {
      params: date ? { date } : undefined,
    });
    return ensureSuccess(data, "Không thể tải lịch sân");
  } catch (error: unknown) {
    const message = extractErrorMessage(
      error,
      "Không thể tải lịch sân"
    );
    throw new Error(message);
  }
}

export interface FieldStats {
  FieldCode: number;
  FieldName: string;
  Rent: number;
  booking_count: number;
  Status: string;
  DefaultPricePerHour: number;
  SportType: string;
  ShopName: string;
  confirmed_count: number;
  total_bookings: number;
}

export interface FieldWithBookingStats extends FieldWithImages {
  booking_count?: number;
  Rent?: number;
  confirmed_count?: number;
  total_bookings?: number;
}

export interface FieldListWithRentResponse {
  data: FieldWithBookingStats[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

/**
 * Get field stats including booking count
 */
export async function fetchFieldStats(
  fieldCode: number
): Promise<FieldStats> {
  try {
    const { data } = await api.get<ApiSuccess<FieldStats> | ApiError>(
      `/fields/${fieldCode}/stats`
    );
    return ensureSuccess(data, "Không thể tải thông tin sân");
  } catch (error: unknown) {
    const typed = error as ErrorWithResponse;
    if (typed.response?.status === 404) {
      throw new Error("Sân không tồn tại");
    }
    const message = extractErrorMessage(error, "Không thể tải thông tin sân");
    throw new Error(message);
  }
}

/**
 * Get list of fields with booking count sorted by Rent DESC
 */
export async function fetchFieldsWithRent(
  shopCode: number,
  limit: number = 10,
  offset: number = 0
): Promise<FieldListWithRentResponse> {
  try {
    const { data } = await api.get<
      ApiSuccess<FieldListWithRentResponse> | ApiError
    >(`/fields/shop/${shopCode}/with-rent`, {
      params: { limit, offset },
    });
    return ensureSuccess(
      data,
      "Không thể tải danh sách sân"
    );
  } catch (error: unknown) {
    const message = extractErrorMessage(
      error,
      "Không thể tải danh sách sân"
    );
    throw new Error(message);
  }
}

// ===== NEW: Field Quantity Management =====

export interface Quantity {
  quantity_id: number;
  quantity_number: number;
  status: "available" | "maintenance" | "inactive";
  created_at?: string;
  updated_at?: string;
}

export interface FieldWithQuantities {
  fieldCode: number;
  fieldName: string;
  quantityCount: number;
  quantities: Quantity[];
}

export interface AvailableQuantitiesResponse {
  fieldCode: number;
  playDate: string;
  timeSlot: string;
  totalQuantities: number;
  availableQuantities: Quantity[];
  bookedQuantities: Quantity[];
  availableCount: number;
}

export interface QuantitiesListResponse {
  fieldCode: number;
  totalQuantities: number;
  quantities: Quantity[];
}

/**
 * Get available courts for a specific time slot
 * GET /api/fields/:fieldCode/available-quantities?playDate=YYYY-MM-DD&startTime=HH:MM&endTime=HH:MM
 */
export async function fetchAvailableQuantities(
  fieldCode: number,
  playDate: string,
  startTime: string,
  endTime: string
): Promise<AvailableQuantitiesResponse> {
  try {
    const { data } = await api.get<
      ApiSuccess<AvailableQuantitiesResponse> | ApiError
    >(`/fields/${fieldCode}/available-quantities`, {
      params: { playDate, startTime, endTime },
    });
    return ensureSuccess(data, "Không thể tải danh sách sân trống");
  } catch (error: unknown) {
    const message = extractErrorMessage(
      error,
      "Không thể tải danh sách sân trống"
    );
    throw new Error(message);
  }
}

/**
 * Get all quantities for a field
 * GET /api/fields/:fieldCode/quantities
 */
export async function fetchFieldQuantities(
  fieldCode: number
): Promise<QuantitiesListResponse> {
  try {
    const { data } = await api.get<
      ApiSuccess<QuantitiesListResponse> | ApiError
    >(`/fields/${fieldCode}/quantities`);
    return ensureSuccess(data, "Không thể tải danh sách sân");
  } catch (error: unknown) {
    const message = extractErrorMessage(
      error,
      "Không thể tải danh sách sân"
    );
    throw new Error(message);
  }
}

/**
 * Update quantity status
 * PUT /api/fields/:fieldCode/quantities/:quantityNumber/status
 */
export async function updateQuantityStatus(
  fieldCode: number,
  quantityNumber: number,
  status: "available" | "maintenance" | "inactive"
): Promise<Quantity> {
  try {
    const { data } = await api.put<
      ApiSuccess<Quantity> | ApiError
    >(`/fields/${fieldCode}/quantities/${quantityNumber}/status`, { status });
    return ensureSuccess(data, "Không thể cập nhật trạng thái sân");
  } catch (error: unknown) {
    const message = extractErrorMessage(
      error,
      "Không thể cập nhật trạng thái sân"
    );
    throw new Error(message);
  }
}
