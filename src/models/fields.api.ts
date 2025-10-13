import { api } from "./api";
import type { FieldWithImages, FieldsQuery } from "../types";

export interface FieldsListResult {
  items: FieldWithImages[];
  total: number;
  page: number;
  pageSize: number;
  facets: {
    sportTypes: string[];
    locations: string[];
  };
}

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

export async function fetchFields(
  params: FieldsQuery = {}
): Promise<FieldsListResult> {
  try {
    const { data } = await api.get<ApiSuccess<FieldsListResult> | ApiError>(
      "/fields",
      { params: buildQuery(params) }
    );
    return ensureSuccess(data, "Không thể tải danh sách sân");
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
