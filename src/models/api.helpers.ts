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
  const typed = error as any;
  return (
    typed?.body?.error?.message ||
    typed?.body?.message ||
    typed?.response?.data?.error?.message ||
    typed?.response?.data?.message ||
    typed?.message ||
    fallback
  );
};

export const rethrowApiError = (error: unknown, fallback: string): never => {
  const message = extractErrorMessage(error, fallback);
  if (error && typeof error === "object") {
    (error as any).message = message;
    throw error;
  }
  throw new Error(message);
};

export default {
  isApiSuccess,
  ensureSuccess,
  extractErrorMessage,
  rethrowApiError,
};
