import { api } from "./api";
import type { FieldImages } from "../types";
import type {
  IApiSuccessResponse,
  IApiErrorResponse,
} from "../interfaces/common";
import { ensureSuccess, extractErrorMessage } from "./api.helpers";

// --- API Functions ---

/**
 * Deletes a specific image for a field.
 * Corresponds to: DELETE /api/shops/me/fields/:fieldId/images/:imageId
 * @param {number} fieldId The ID of the field.
 * @param {number} imageId The ID of the image to delete.
 * @returns {Promise<{ deleted: boolean }>} A promise that resolves if deletion is successful.
 */
export async function deleteFieldImage(
  fieldId: number,
  imageId: number
): Promise<{ deleted: boolean }> {
  try {
    const { data } = await api.delete<
      IApiSuccessResponse<{ deleted: boolean }> | IApiErrorResponse
    >(`/shops/me/fields/${fieldId}/images/${imageId}`);
    return ensureSuccess(data, "Không thể xóa ảnh. Vui lòng thử lại.");
  } catch (error: unknown) {
    const message = extractErrorMessage(
      error,
      "Lỗi không xác định khi xóa ảnh"
    );
    throw new Error(message);
  }
}

/**
 * Uploads a single image for a field.
 * Corresponds to: POST /api/fields/:fieldId/images
 * @param {number} fieldId The ID of the field.
 * @param {File} file The image file to upload.
 * @returns {Promise<FieldImages>} A promise that resolves with the new image data.
 */
export async function uploadFieldImage(
  fieldId: number,
  file: File
): Promise<FieldImages> {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const { data } = await api.post<
      IApiSuccessResponse<FieldImages> | IApiErrorResponse
    >(`/fields/${fieldId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return ensureSuccess(data, "Không thể tải ảnh lên. Vui lòng thử lại.");
  } catch (error: unknown) {
    const message = extractErrorMessage(
      error,
      "Lỗi không xác định khi tải ảnh lên"
    );
    throw new Error(message);
  }
}

/**
 * Uploads multiple images for a field concurrently.
 * @param {number} fieldId The ID of the field.
 * @param {File[]} files An array of image files to upload.
 * @returns {Promise<FieldImages[]>} A promise that resolves with an array of the new image data.
 */
export async function uploadMultipleFieldImages(
  fieldId: number,
  files: File[]
): Promise<FieldImages[]> {
  const uploadPromises = files.map((file) => uploadFieldImage(fieldId, file));
  try {
    return await Promise.all(uploadPromises);
  } catch (error: unknown) {
    // The error is already processed in uploadFieldImage, just re-throw it.
    throw error;
  }
}

/**
 * Deletes multiple images for a field concurrently.
 * @param {number} fieldId The ID of the field.
 * @param {number[]} imageIds An array of image IDs to delete.
 * @returns {Promise<{ deleted: boolean }[]>} A promise that resolves with an array of deletion statuses.
 */
export async function deleteMultipleFieldImages(
  fieldId: number,
  imageIds: number[]
): Promise<{ deleted: boolean }[]> {
  const deletePromises = imageIds.map((id) => deleteFieldImage(fieldId, id));
  try {
    return await Promise.all(deletePromises);
  } catch (error: unknown) {
    // The error is already processed in deleteFieldImage, just re-throw it.
    throw error;
  }
}

// --- Constants ---

const VALID_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// --- Validation and Utility Functions ---

/**
 * Formats file size in bytes to a human-readable string (KB, MB, GB).
 * @param {number} bytes The file size in bytes.
 * @returns {string} The formatted file size string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Checks if a file is a valid image based on type and size.
 * @param {File} file The file to validate.
 * @returns {{ isValid: boolean; reason?: "type" | "size" }} The validation result.
 */
export function isValidImageFile(file: File): {
  isValid: boolean;
  reason?: "type" | "size";
} {
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    return { isValid: false, reason: "type" };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { isValid: false, reason: "size" };
  }
  return { isValid: true };
}

/**
 * Validates a list of files, separating them into valid and invalid lists.
 * @param {File[]} files The files to validate.
 * @returns {{ valid: File[]; invalid: { file: File; reason: string }[] }} The categorized files.
 */
export function validateImageFiles(files: File[]): {
  valid: File[];
  invalid: { file: File; reason: string }[];
} {
  const valid: File[] = [];
  const invalid: { file: File; reason: string }[] = [];

  for (const file of files) {
    const validation = isValidImageFile(file);
    if (validation.isValid) {
      valid.push(file);
    } else {
      let reason = "Lỗi không xác định";
      if (validation.reason === "type") {
        reason = `Định dạng file không hợp lệ. Chỉ chấp nhận: ${VALID_IMAGE_TYPES.map(
          (t) => t.split("/")[1]
        ).join(", ")}.`;
      } else if (validation.reason === "size") {
        reason = `Dung lượng file quá lớn (tối đa ${formatFileSize(
          MAX_IMAGE_SIZE_BYTES
        )}).`;
      }
      invalid.push({ file, reason });
    }
  }

  return { valid, invalid };
}

/**
 * Gets the primary image URL for a field, with fallbacks.
 * It prioritizes the image marked as primary, then the one with the lowest sort order,
 * and finally the first image in the original array.
 * @param {{ images: FieldImages[] }} field The field object containing images.
 * @returns {string | null} The URL of the primary image or null if none exist.
 */
export function getPrimaryImageUrl(field: {
  images: FieldImages[];
}): string | null {
  if (!field.images || field.images.length === 0) {
    return null;
  }

  // Create a sorted copy to avoid mutating the original array
  const sortedImages = [...field.images].sort((a, b) => {
    // Primary image always comes first
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    // Then sort by sort_order
    return (a.sort_order ?? 999) - (b.sort_order ?? 999);
  });

  return sortedImages[0].image_url;
}

/**
 * Gets a sorted list of all image URLs for a field.
 * @param {{ images: FieldImages[] }} field The field object containing images.
 * @returns {string[]} A sorted array of image URLs.
 */
export function getFieldImageUrls(field: { images: FieldImages[] }): string[] {
  if (!field.images) return [];
  return [...field.images]
    .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
    .map((img) => img.image_url);
}

