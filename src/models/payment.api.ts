import api from "./api";
import type { IApiSuccessResponse } from "../interfaces/common";
import type { PaymentStatus } from "../utils/payment-helpers";

export interface BankAccountInfo {
  adminBankId: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface PaymentInitResponse {
  paymentID: number;
  qr_code: string;
  momo_url: string;
  amount: number;
  platformFee: number;
  netToShop: number;
  paymentStatus: PaymentStatus;
  expiresIn: number;
  bookingId?: number;
  paymentMethod?: string;
  bankAccount?: BankAccountInfo | null;
}

export interface PaymentStatusResponse {
  paymentID: number;
  bookingCode: string;
  amount: number;
  status: PaymentStatus | string;
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
