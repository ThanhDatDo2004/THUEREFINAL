import { api } from "./api";

export type ShopRequestPayload = {
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  message?: string;
};

type ApiSuccess<T> = {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  error: null;
};

type ApiError = {
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

export async function submitShopRequest(payload: ShopRequestPayload) {
  try {
    const { data } = await api.post<ApiSuccess<{ ok: boolean }> | ApiError>(
      "/shops/requests",
      payload
    );
    return ensureSuccess(data, "Không thể gửi yêu cầu");
  } catch (error: any) {
    const message =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Không thể gửi yêu cầu";
    throw new Error(message);
  }
}
