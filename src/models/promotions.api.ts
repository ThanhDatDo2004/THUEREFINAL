import { api } from "./api";
import type {
  ShopPromotion,
  ShopPromotionStatus,
} from "../types";

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  error: null | { message?: string | null };
};

type UpdatableStatus = "active" | "disabled" | "draft";

export interface ShopPromotionInput {
  promotion_code: string;
  title: string;
  description?: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_discount_amount?: number | null;
  min_order_amount?: number | null;
  usage_limit?: number | null;
  usage_per_customer?: number | null;
  start_at: string;
  end_at: string;
  status?: ShopPromotionStatus;
}

function extractErrorMessage(payload: ApiResponse<unknown>, fallback: string) {
  return (
    payload?.error?.message ||
    payload?.message ||
    fallback
  );
}

function ensureItem<T>(
  payload: ApiResponse<T>,
  fallbackMessage: string
): T {
  if (payload?.success && payload?.data !== null && payload?.data !== undefined) {
    return payload.data;
  }
  throw new Error(extractErrorMessage(payload, fallbackMessage));
}

export async function fetchShopPromotions(): Promise<ShopPromotion[]> {
  try {
    const { data } = await api.get<ApiResponse<ShopPromotion[]>>(
      "/shops/me/promotions"
    );
    if (data?.success) {
      if (Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    }
    throw new Error(
      extractErrorMessage(data, "Không thể tải danh sách khuyến mãi")
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể tải danh sách khuyến mãi");
  }
}

export async function createShopPromotion(
  payload: ShopPromotionInput
): Promise<ShopPromotion> {
  try {
    const { data } = await api.post<ApiResponse<ShopPromotion>>(
      "/shops/me/promotions",
      payload
    );
    return ensureItem(data, "Không thể tạo khuyến mãi");
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể tạo khuyến mãi");
  }
}

export async function updateShopPromotion(
  promotionId: number,
  payload: ShopPromotionInput
): Promise<ShopPromotion> {
  try {
    const { data } = await api.put<ApiResponse<ShopPromotion>>(
      `/shops/me/promotions/${promotionId}`,
      payload
    );
    return ensureItem(data, "Không thể cập nhật khuyến mãi");
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể cập nhật khuyến mãi");
  }
}

export async function updateShopPromotionStatus(
  promotionId: number,
  status: UpdatableStatus
): Promise<ShopPromotion> {
  try {
    const { data } = await api.patch<ApiResponse<ShopPromotion>>(
      `/shops/me/promotions/${promotionId}/status`,
      { status }
    );
    return ensureItem(data, "Không thể cập nhật trạng thái khuyến mãi");
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể cập nhật trạng thái khuyến mãi");
  }
}

export async function fetchActiveShopPromotions(
  shopCode: number
): Promise<ShopPromotion[]> {
  if (!Number.isFinite(shopCode) || shopCode <= 0) {
    return [];
  }
  try {
    const { data } = await api.get<ApiResponse<ShopPromotion[]>>(
      `/shops/${shopCode}/promotions/active`
    );
    if (data?.success && Array.isArray(data.data)) {
      return data.data;
    }
    throw new Error(
      extractErrorMessage(data, "Không thể tải khuyến mãi đang áp dụng")
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể tải khuyến mãi đang áp dụng");
  }
}
