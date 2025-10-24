import type {
  IApiSuccessResponse,
  IApiErrorResponse,
} from "../interfaces/common";

/**
 * Generic type for potential data wrapper formats
 */
type MaybeArrayResult<T> = T | { data: T } | { items: T } | { rows: T };

/**
 * Normalizes array-like results from various API response formats
 */
export const normalizeList = <T>(input: MaybeArrayResult<T[]>): T[] => {
  if (Array.isArray(input)) return input;
  if (Array.isArray((input as { items?: T[] }).items)) {
    return (input as { items: T[] }).items;
  }
  if (Array.isArray((input as { data?: T[] }).data)) {
    return (input as { data: T[] }).data;
  }
  if (Array.isArray((input as { rows?: T[] }).rows)) {
    return (input as { rows: T[] }).rows;
  }
  return [];
};

/**
 * Normalizes single object results from various API response formats
 */
export const normalizeSingle = <T>(input: MaybeArrayResult<T>): T => {
  if (
    input &&
    typeof input === "object" &&
    !Array.isArray(input) &&
    "items" in input
  ) {
    return (input as { items: T }).items;
  }
  if (
    input &&
    typeof input === "object" &&
    !Array.isArray(input) &&
    "data" in input
  ) {
    return (input as { data: T }).data;
  }
  if (
    input &&
    typeof input === "object" &&
    !Array.isArray(input) &&
    "rows" in input
  ) {
    return (input as { rows: T }).rows;
  }
  return input as T;
};

/**
 * Handles null/undefined values in API responses
 */
export const normalizeNullFields = <T extends Record<string, any>>(
  obj: T,
  fieldDefaults: Record<keyof T, any> = {}
): T => {
  const result = { ...obj } as T;
  for (const key in fieldDefaults) {
    if (result[key] === null || result[key] === undefined) {
      result[key] = fieldDefaults[key];
    }
  }
  return result;
};

/**
 * Picks specific fields from object
 */
export const pickFields = <T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): Partial<T> => {
  const result: Partial<T> = {};
  fields.forEach((field) => {
    result[field] = obj[field];
  });
  return result;
};

/**
 * Omits specific fields from object
 */
export const omitFields = <T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): Partial<T> => {
  const result: Partial<T> = { ...obj };
  fields.forEach((field) => {
    delete result[field];
  });
  return result;
};

export default {
  normalizeList,
  normalizeSingle,
  normalizeNullFields,
  pickFields,
  omitFields,
};
