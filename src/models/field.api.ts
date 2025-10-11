import { api } from "./api";
import type { FieldWithImages, FieldsQuery } from "../types";

export type FieldListResponse = {
  items: FieldWithImages[];
  total: number;
  page: number;
  pageSize: number;
  facets: {
    sportTypes: string[];
    locations: string[];
  };
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

function ensureSuccess<T>(
  payload: ApiSuccess<T> | ApiError,
  fallbackMessage: string
): T {
  if (payload?.success && payload.data !== undefined) {
    return payload.data;
  }
  const message =
    payload?.error?.message || payload?.message || fallbackMessage;
  throw new Error(message);
}

export async function fetchFields(
  params: FieldsQuery
): Promise<FieldListResponse> {
  const { data } = await api.get<ApiSuccess<FieldListResponse> | ApiError>(
    "/fields",
    { params }
  );
  return ensureSuccess(data, "Không tải được danh sách sân");
}

export async function fetchFieldById(
  fieldId: number
): Promise<FieldWithImages> {
  const { data } = await api.get<ApiSuccess<FieldWithImages> | ApiError>(
    `/fields/${fieldId}`
  );
  return ensureSuccess(data, "Không tải được thông tin sân");
}
