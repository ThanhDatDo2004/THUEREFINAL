import { api } from "./api";
import type { IApiSuccessResponse } from "../interfaces/common";

export interface CartSlot {
  bookingCode: number;
  playDate: string;
  startTime: string;
  endTime: string;
  quantityId: number | null;
  status: string;
  pricePerSlot: number;
}

export interface CartItem {
  cartId: number;
  bookingCode: number;
  fieldCode: number;
  fieldName: string;
  sportType: string;
  shopName: string;
  address: string | null;
  totalPrice: number;
  discountAmount: number;
  promotionCode: string | null;
  bookingStatus: string;
  paymentStatus: string;
  expiresAt: string;
  secondsUntilExpiry: number;
  createdAt: string;
  slots: CartSlot[];
}

export interface CartResponse {
  items: CartItem[];
  total: number;
}

export const getCartApi = async (): Promise<IApiSuccessResponse<CartResponse>> => {
  const response = await api.get<IApiSuccessResponse<CartResponse>>("/cart");
  return response.data;
};
