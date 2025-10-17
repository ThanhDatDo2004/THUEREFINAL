import api from "./api";
import type { IApiSuccessResponse, IApiErrorResponse } from "../interfaces/common";

export interface PaymentInitResponse {
  paymentID: number;
  qr_code: string;
  momo_url: string;
  amount: number;
  platformFee: number;
  netToShop: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  expiresIn: number;
  bookingId?: number;
}

export interface PaymentStatusResponse {
  paymentID: number;
  bookingCode: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "refunded";
  paidAt?: string;
}

export interface PaymentConfirmResponse {
  success: boolean;
  paymentID: number;
  bookingCode: string;
  amountToPay: number;
  platformFee: number;
  netToShop: number;
}

/**
 * Initiate payment for a booking
 */
export const initiatePaymentApi = async (
  bookingCode: string,
  paymentMethod: "bank_transfer" | "card" | "ewallet" | "cash" = "ewallet"
): Promise<IApiSuccessResponse<PaymentInitResponse>> => {
  const response = await api.post<IApiSuccessResponse<PaymentInitResponse>>(
    `/payments/bookings/${bookingCode}/initiate`,
    { payment_method: paymentMethod }
  );
  return response.data;
};

/**
 * Check payment status for a booking
 */
export const checkPaymentStatusApi = async (
  bookingCode: string
): Promise<IApiSuccessResponse<PaymentStatusResponse>> => {
  const response = await api.get<IApiSuccessResponse<PaymentStatusResponse>>(
    `/payments/bookings/${bookingCode}/status`
  );
  return response.data;
};

/**
 * Confirm payment (testing endpoint)
 */
export const confirmPaymentApi = async (
  paymentID: number
): Promise<IApiSuccessResponse<PaymentConfirmResponse>> => {
  const response = await api.post<IApiSuccessResponse<PaymentConfirmResponse>>(
    `/payments/${paymentID}/confirm`
  );
  return response.data;
};
