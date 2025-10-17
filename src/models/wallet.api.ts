import api from "./api";
import type { IApiSuccessResponse } from "../interfaces/common";

export interface WalletInfo {
  balance: number;
  totalCredit: number;
  totalDebit: number;
  available: number;
}

export interface WalletTransaction {
  WalletTxnID: number;
  Type: "credit_settlement" | "debit_payout" | "adjustment";
  Amount: number;
  Note: string;
  Status: "completed" | "pending" | "failed";
  BookingCode?: string;
  CreateAt: string;
}

export interface WalletTransactionsResponse {
  data: WalletTransaction[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface PayoutRequest {
  PayoutID: number;
  ShopCode: number;
  ShopName: string;
  Amount: number;
  Status: "requested" | "processing" | "paid" | "rejected";
  BankName: string;
  AccountNumber: string;
  RequestedAt: string;
}

export interface PayoutRequestsResponse {
  data: PayoutRequest[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface CreatePayoutRequest {
  amount: number;
  bank_id: number;
  note?: string;
}

export interface PayoutResponse {
  payoutID: number;
  shopCode: number;
  amount: number;
  status: "requested" | "processing" | "paid" | "rejected";
  requestedAt: string;
}

/**
 * Get wallet info for current shop
 */
export const getWalletInfoApi = async (): Promise<IApiSuccessResponse<WalletInfo>> => {
  const response = await api.get<IApiSuccessResponse<WalletInfo>>("/shops/me/wallet");
  return response.data;
};

/**
 * Get wallet transaction history
 */
export const getWalletTransactionsApi = async (
  type?: "credit_settlement" | "debit_payout" | "adjustment",
  limit: number = 10,
  offset: number = 0
): Promise<IApiSuccessResponse<WalletTransactionsResponse>> => {
  const params: any = { limit, offset };
  if (type) params.type = type;
  const response = await api.get<IApiSuccessResponse<WalletTransactionsResponse>>(
    "/shops/me/wallet/transactions",
    { params }
  );
  return response.data;
};

/**
 * Create payout request
 */
export const createPayoutRequestApi = async (
  data: CreatePayoutRequest
): Promise<IApiSuccessResponse<PayoutResponse>> => {
  const response = await api.post<IApiSuccessResponse<PayoutResponse>>(
    "/shops/me/payout-requests",
    data
  );
  return response.data;
};

/**
 * Get payout requests list
 */
export const getPayoutRequestsApi = async (
  status?: "requested" | "processing" | "paid" | "rejected",
  limit: number = 10,
  offset: number = 0
): Promise<IApiSuccessResponse<PayoutRequestsResponse>> => {
  const params: any = { limit, offset };
  if (status) params.status = status;
  const response = await api.get<IApiSuccessResponse<PayoutRequestsResponse>>(
    "/shops/me/payout-requests",
    { params }
  );
  return response.data;
};

/**
 * Get payout request detail
 */
export const getPayoutRequestDetailApi = async (
  payoutID: number
): Promise<IApiSuccessResponse<PayoutRequest>> => {
  const response = await api.get<IApiSuccessResponse<PayoutRequest>>(
    `/shops/me/payout-requests/${payoutID}`
  );
  return response.data;
};
