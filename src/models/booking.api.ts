import { api } from "./api";
import type { ApiError, ApiSuccess } from "./fields.api";

export interface ConfirmBookingSlotPayload {
  slot_id: number;
  play_date: string;
  start_time: string;
  end_time: string;
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
  notes?: string;
}

export interface ConfirmBookingResponse {
  booking_code: string;
  transaction_id: string;
  payment_status: "mock_success";
  payment_method: string;
  field_code: number;
  slots: ConfirmBookingSlotPayload[];
}

type ApiConfirmBookingResponse =
  | ApiSuccess<ConfirmBookingResponse>
  | ApiError;

const ensureSuccess = (
  payload: ApiConfirmBookingResponse,
  fallback: string
): ConfirmBookingResponse => {
  if (payload?.success && payload.data) {
    return payload.data;
  }
  const message =
    payload?.error?.message || payload?.message || fallback;
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

export default confirmFieldBooking;
