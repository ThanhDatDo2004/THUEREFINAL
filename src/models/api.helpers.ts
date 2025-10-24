import type {
  IApiSuccessResponse,
  IApiErrorResponse,
} from "../interfaces/common";

/**
 * Type guard to check if a response is a successful API response.
 * @param response The response to check.
 * @returns {boolean} True if the response is an IApiSuccessResponse.
 */
export function isApiSuccess<T>(
  response: IApiSuccessResponse<T> | IApiErrorResponse | any
): response is IApiSuccessResponse<T> {
  return response && response.success === true && "data" in response;
};

/**
 * Ensures a successful API response, returning data or throwing an error.
 * @template T The expected data type.
 * @param {IApiSuccessResponse<T> | IApiErrorResponse} payload The API response.
 * @param {string} fallbackMessage The message to use if the API provides none.
 * @returns {T} The data from the successful response.
 * @throws {Error} If the API response indicates an error.
 */
export const ensureSuccess = <T>(
  payload: IApiSuccessResponse<T> | IApiErrorResponse | any,
  fallbackMessage: string
): T => {
  if (isApiSuccess(payload)) {
    return payload.data as T;
  }

  const message = payload?.error?.message || payload?.message || fallbackMessage;
  throw new Error(message);
};

type ErrorWithResponse = {
  response?: { data?: IApiErrorResponse | { message?: string } };
  message?: string;
};

/**
 * Extracts a user-friendly error message from various error structures.
 * @param {unknown} error The error object, typically from a catch block.
 * @param {string} fallback A default message if no specific message can be found.
 * @returns {string} The extracted or fallback error message.
 */
export const extractErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (error instanceof Error) return error.message;

  const apiError = error as ErrorWithResponse;
  const data = apiError.response?.data as any;
  return data?.error?.message || data?.message || apiError.message || fallback;
};

export default {
  isApiSuccess,
  ensureSuccess,
  extractErrorMessage,
};
