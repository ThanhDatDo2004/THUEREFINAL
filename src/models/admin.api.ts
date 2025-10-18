import { api } from "./api";
import type {
  Users,
  UsersLevel,
  Shops,
  Bookings,
  ShopRevenue,
  ShopRequests,
} from "../types";
import type { IApiSuccessResponse } from "../interfaces/common";

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
  error?: { message?: string | null } | null;
};

type MaybeArrayResult<T> =
  | T
  | { items: T; data?: never }
  | { data: T; items?: never }
  | { rows: T; items?: never; data?: never };

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
        status?: number;
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

export async function fetchAdminUsers(): Promise<Users[]> {
  try {
    const { data } = await api.get<ApiSuccess<MaybeArrayResult<Users[]>> | ApiError>(
      "/admin/users"
    );
    const payload = ensureSuccess(
      data,
      "Không thể tải danh sách người dùng."
    );
    return normalizeList(payload);
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(error, "Không thể tải danh sách người dùng.")
    );
  }
}

export async function fetchAdminUserLevels(): Promise<UsersLevel[]> {
  try {
    const { data } = await api.get<
      ApiSuccess<MaybeArrayResult<UsersLevel[]>> | ApiError
    >("/admin/users/levels");
    const payload = ensureSuccess(
      data,
      "Không thể tải thông tin phân quyền."
    );
    return normalizeList(payload);
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(error, "Không thể tải thông tin phân quyền.")
    );
  }
}

export async function fetchAdminShops(): Promise<Shops[]> {
  try {
    const { data } = await api.get<ApiSuccess<MaybeArrayResult<Shops[]>> | ApiError>(
      "/admin/shops"
    );
    const payload = ensureSuccess(data, "Không thể tải danh sách shop.");
    return normalizeList(payload);
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(error, "Không thể tải danh sách shop.")
    );
  }
}

export async function fetchAdminBookings(): Promise<Bookings[]> {
  try {
    const { data } = await api.get<
      ApiSuccess<MaybeArrayResult<Bookings[]>> | ApiError
    >("/admin/bookings");
    const payload = ensureSuccess(
      data,
      "Không thể tải danh sách đơn đặt."
    );
    return normalizeList(payload);
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(error, "Không thể tải danh sách đơn đặt.")
    );
  }
}

export async function fetchAdminRevenue(
  year?: number
): Promise<ShopRevenue[]> {
  try {
    const { data } = await api.get<
      ApiSuccess<MaybeArrayResult<ShopRevenue[]>> | ApiError
    >("/admin/revenue", {
      params: year ? { year } : undefined,
    });
    const payload = ensureSuccess(
      data,
      "Không thể tải dữ liệu doanh thu."
    );
    return normalizeList(payload);
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(error, "Không thể tải dữ liệu doanh thu.")
    );
  }
}

export async function fetchAdminShopRequests(): Promise<ShopRequests[]> {
  try {
    const { data } = await api.get<
      ApiSuccess<MaybeArrayResult<ShopRequests[]>> | ApiError
    >("/admin/shop-requests");
    const payload = ensureSuccess(
      data,
      "Không thể tải danh sách yêu cầu mở shop."
    );
    return normalizeList(payload);
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(
        error,
        "Không thể tải danh sách yêu cầu mở shop."
      )
    );
  }
}

export async function fetchAdminShopRequestById(
  requestId: number
): Promise<ShopRequests | null> {
  if (!Number.isFinite(requestId)) return null;
  try {
    const { data } = await api.get<
      ApiSuccess<MaybeArrayResult<ShopRequests>> | ApiError
    >(`/admin/shop-requests/${requestId}`);
    const payload = ensureSuccess(
      data,
      "Không thể tải chi tiết yêu cầu mở shop."
    );
    return normalizeSingle(payload) ?? null;
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(
        error,
        "Không thể tải chi tiết yêu cầu mở shop."
      )
    );
  }
}

export async function updateAdminUserStatus(
  userId: number,
  isActive: boolean
): Promise<Users> {
  const { data } = await api.patch<
    ApiSuccess<MaybeArrayResult<Users>> | ApiError
  >(`/admin/users/${userId}/status`, { isActive });
  const payload = ensureSuccess(
    data,
    isActive
      ? "Không thể mở khóa tài khoản người dùng."
      : "Không thể khóa tài khoản người dùng."
  );
  const result = normalizeSingle(payload);
  if (!result) {
    throw new Error("Không nhận được dữ liệu người dùng đã cập nhật.");
  }
  return result;
}

export async function updateAdminShopRequestStatus(
  requestId: number,
  status: ShopRequests["status"]
): Promise<ShopRequests> {
  try {
    const { data } = await api.patch<
      ApiSuccess<MaybeArrayResult<ShopRequests>> | ApiError
    >(`/admin/shop-requests/${requestId}/status`, { status });

    const payload = ensureSuccess(
      data,
      "Không thể cập nhật trạng thái yêu cầu mở shop."
    );

    const result = normalizeSingle(payload);
    if (!result) {
      throw new Error("Không nhận được dữ liệu yêu cầu đã cập nhật.");
    }
    return result;
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(
        error,
        "Không thể cập nhật trạng thái yêu cầu mở shop."
      )
    );
  }
}

export interface AdminPayoutRequest {
  PayoutID: number;
  ShopCode: number;
  ShopName: string;
  Amount: number;
  Status: "requested" | "processing" | "paid" | "rejected";
  BankName: string;
  AccountNumber: string;
  RequestedAt: string;
}

export interface AdminPayoutRequestWithBank {
  PayoutID: number;
  ShopCode: number;
  ShopName: string;
  Amount: number;
  Status: "requested" | "processing" | "paid" | "rejected";
  BankName: string;
  AccountNumber: string;
  AccountHolder?: string;
  IsDefault?: string | boolean;
  RequestedAt: string;
}

export interface AdminPayoutsResponse {
  data: AdminPayoutRequest[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface ApprovePayoutRequest {
  note?: string;
}

export interface ApprovePayoutResponse {
  payoutID: number;
  status: "paid";
  approvedAt: string;
}

export interface RejectPayoutRequest {
  reason: string; // required
}

export interface RejectPayoutResponse {
  payoutID: number;
  status: "rejected";
  rejectionReason: string;
}

/**
 * Get all payout requests (admin only)
 */
export const getAdminPayoutRequestsApi = async (
  status?: "requested" | "processing" | "paid" | "rejected",
  shopCode?: number,
  limit: number = 10,
  offset: number = 0
): Promise<IApiSuccessResponse<AdminPayoutsResponse>> => {
  const params: any = { limit, offset };
  if (status) params.status = status;
  if (shopCode) params.shop_code = shopCode;
  const response = await api.get<IApiSuccessResponse<AdminPayoutsResponse>>(
    "/admin/payout-requests",
    { params }
  );
  return response.data;
};

/**
 * Approve payout request (admin only)
 */
export const approvePayoutRequestApi = async (
  payoutID: number,
  data?: ApprovePayoutRequest
): Promise<IApiSuccessResponse<ApprovePayoutResponse>> => {
  const response = await api.patch<IApiSuccessResponse<ApprovePayoutResponse>>(
    `/admin/payout-requests/${payoutID}/approve`,
    data || {}
  );
  return response.data;
};

/**
 * Reject payout request (admin only)
 */
export const rejectPayoutRequestApi = async (
  payoutID: number,
  data: RejectPayoutRequest
): Promise<IApiSuccessResponse<RejectPayoutResponse>> => {
  const response = await api.patch<IApiSuccessResponse<RejectPayoutResponse>>(
    `/admin/payout-requests/${payoutID}/reject`,
    data
  );
  return response.data;
};
