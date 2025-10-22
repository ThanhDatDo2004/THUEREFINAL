import { api } from "./api";
import type { ApiError, ApiSuccess } from "./fields.api";
import type { IApiSuccessResponse } from "../interfaces/common";

export interface ConfirmBookingSlotPayload {
  slot_id: number;
  play_date: string;
  start_time: string;
  end_time: string;
  quantity_id?: number | null;
  quantity_number?: number | null;
}

export interface ConfirmBookingPayload {
  slots: ConfirmBookingSlotPayload[];
  payment_method: string;
  total_price: number;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  quantity_id?: number;
  notes?: string;
  created_by?: number;
  promotion_code?: string;
}

export interface ConfirmBookingResponse {
  booking_code: string;
  transaction_id: string;
  payment_status: "mock_success";
  payment_method: string;
  field_code: number;
  slots: ConfirmBookingSlotPayload[];
  qr_code?: string; // SePay QR image URL from confirm
  paymentID?: number; // Payment ID from confirm
  amount?: number; // Total amount to pay
  amount_before_discount?: number;
  discount_amount?: number;
  promotion_code?: string | null;
  promotion_title?: string | null;
}

// New booking types for API v2
export interface BookingSlot {
  SlotID: number;
  QuantityNumber: number;
  PlayDate: string;
  StartTime: string;
  EndTime: string;
  Status: "booked" | "available" | "cancelled";
}

export interface BookingItem {
  BookingCode: string;
  FieldCode: number;
  FieldName?: string;
  SportType?: string;
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
  slots?: Array<{
    Slot_ID: number;
    PlayDate: string;
    StartTime: string;
    EndTime: string;
    PricePerSlot: number;
    Status: string;
  }>;
}

export interface BookingListResponse {
  data: BookingItem[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface BookingDetail {
  BookingCode: string;
  TotalPrice: number;
  BookingStatus: "pending" | "confirmed" | "cancelled" | "completed";
  PaymentStatus: "pending" | "paid" | "failed" | "refunded";
  slots: BookingSlot[];
  FieldName?: string;
  ShopName?: string;
  PlayDate?: string;
  CustomerName?: string;
  CustomerEmail?: string;
  CustomerPhone?: string;
}

export interface CancelBookingRequest {
  reason?: string;
}

export interface CancelBookingResponse {
  bookingCode: string;
  status: "cancelled";
  refundAmount?: number;
}

export interface CheckinCodeResponse {
  bookingCode: string;
  checkinCode: string;
}

export interface VerifyCheckinRequest {
  checkin_code: string;
}

export interface VerifyCheckinResponse {
  bookingCode: string;
  checkinTime: string;
}

type ApiConfirmBookingResponse = ApiSuccess<ConfirmBookingResponse> | ApiError;

const ensureSuccess = (
  payload: ApiConfirmBookingResponse,
  fallback: string
): ConfirmBookingResponse => {
  if (payload?.success && payload.data) {
    return payload.data;
  }
  const message = payload?.error?.message || payload?.message || fallback;
  throw new Error(message);
};

export async function confirmFieldBooking(
  fieldId: number,
  payload: ConfirmBookingPayload
): Promise<ConfirmBookingResponse> {
  if (!fieldId) {
    throw new Error("Thiếu mã sân để đặt lịch.");
  }

  try {
    const { data } = await api.post<ApiConfirmBookingResponse>(
      `/fields/${fieldId}/bookings/confirm`,
      payload
    );
    return ensureSuccess(data, "Không thể xác nhận thanh toán.");
  } catch (error: any) {
    const message =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Không thể xác nhận thanh toán.";
    throw new Error(message);
  }
}

/**
 * Get list of user bookings
 */
export const getMyBookingsApi = async (
  status?: "pending" | "confirmed" | "cancelled" | "completed",
  limit: number = 10,
  offset: number = 0,
  sort: string = "CreateAt",
  order: "ASC" | "DESC" = "DESC"
): Promise<IApiSuccessResponse<BookingListResponse>> => {
  const params: any = { limit, offset, sort, order };
  if (status) params.status = status;
  const response = await api.get<IApiSuccessResponse<BookingListResponse>>(
    "/bookings",
    { params }
  );
  return response.data;
};

/**
 * Get booking detail
 */
export const getBookingDetailApi = async (
  bookingCode: string
): Promise<IApiSuccessResponse<BookingDetail>> => {
  const response = await api.get<IApiSuccessResponse<BookingDetail>>(
    `/bookings/${bookingCode}`
  );
  return response.data;
};

/**
 * Cancel booking
 */
export const cancelBookingApi = async (
  bookingCode: string,
  reason?: string
): Promise<IApiSuccessResponse<CancelBookingResponse>> => {
  const response = await api.patch<IApiSuccessResponse<CancelBookingResponse>>(
    `/bookings/${bookingCode}/cancel`,
    { reason }
  );
  return response.data;
};

/**
 * Get checkin code for a booking
 */
export const getCheckinCodeApi = async (
  bookingCode: string
): Promise<IApiSuccessResponse<CheckinCodeResponse>> => {
  const response = await api.get<IApiSuccessResponse<CheckinCodeResponse>>(
    `/bookings/${bookingCode}/checkin-code`
  );
  return response.data;
};

/**
 * Verify checkin code
 */
export const verifyCheckinApi = async (
  bookingCode: string,
  checkinCode: string
): Promise<IApiSuccessResponse<VerifyCheckinResponse>> => {
  const response = await api.post<IApiSuccessResponse<VerifyCheckinResponse>>(
    `/bookings/${bookingCode}/verify-checkin`,
    { checkin_code: checkinCode }
  );
  return response.data;
};

// Create booking (new API)
export interface CreateBookingRequest {
  fieldCode: number;
  playDate: string;
  startTime: string;
  endTime: string;
  CustomerName?: string;
  CustomerEmail?: string;
  CustomerPhone?: string;
}

export interface CreateBookingData {
  bookingCode: string | number;
  totalPrice: number;
}

export const createBookingApi = async (
  payload: CreateBookingRequest
): Promise<IApiSuccessResponse<CreateBookingData>> => {
  const response = await api.post<IApiSuccessResponse<CreateBookingData>>(
    `/bookings/create`,
    payload
  );
  return response.data;
};

export default confirmFieldBooking;

// ===== Quantity Support for Bookings =====

export interface CreateBookingWithQuantityRequest extends CreateBookingRequest {
  quantityID?: number; // NEW: specific court ID
}

export interface BookingItemWithQuantity extends BookingItem {
  quantityID?: number; // NEW: specific court ID
  quantityNumber?: number; // NEW: court number display (e.g., 1, 2, 3)
}
