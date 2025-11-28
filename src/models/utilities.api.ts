import { api } from "./api";

/**
 * Available utilities for shops
 */
export const AVAILABLE_UTILITIES = [
  { id: "parking", label: "Bãi Đỗ Xe", icon: "🅿️" },
  { id: "restroom", label: "Nhà Vệ Sinh", icon: "🚻" },
  { id: "changing_room", label: "Phòng Thay Đồ", icon: "🚪" },
  { id: "ac", label: "Điều Hoà", icon: "❄️" },
  { id: "hot_water", label: "Nước Nóng", icon: "🚿" },
  { id: "wifi", label: "WiFi", icon: "📶" },
  { id: "racket_rental", label: "Thuê Vợt", icon: "🎾" },
  { id: "ball_rental", label: "Thuê Bóng", icon: "⚽" },
] as const;

export type UtilityId = typeof AVAILABLE_UTILITIES[number]["id"];

export interface FieldUtility {
  utility_id: string;
  field_code: number;
  utility_name: string;
  is_selected?: boolean;
}

export interface UtilitiesResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: FieldUtility[];
}

/**
 * Get utilities for a specific shop
 */
export async function getShopUtilities(shopCode: number): Promise<FieldUtility[]> {
  try {
    const { data } = await api.get<UtilitiesResponse>(
      `/shops/${shopCode}/utilities`
    );
    if (data?.success && data?.data) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching shop utilities:", error);
    return [];
  }
}

/**
 * Update utilities for a specific shop
 */
export async function updateShopUtilities(
  shopCode: number,
  utilities: string[]
): Promise<FieldUtility[]> {
  try {
    const { data } = await api.post<UtilitiesResponse>(
      `/shops/${shopCode}/utilities`,
      { utilities }
    );
    if (data?.success && data?.data) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error updating shop utilities:", error);
    return [];
  }
}

/**
 * Add a utility to a shop
 */
export async function addUtility(
  shopCode: number,
  utilityId: UtilityId
): Promise<FieldUtility> {
  try {
    const { data } = await api.post<UtilitiesResponse>(
      `/shops/${shopCode}/utilities/add`,
      { utility_id: utilityId }
    );
    if (data?.success && data?.data && data.data.length > 0) {
      return data.data[0];
    }
    throw new Error("Failed to add utility");
  } catch (error) {
    console.error("Error adding utility:", error);
    throw (error instanceof Error ? error : new Error("Error adding utility"));
  }
}

/**
 * Remove a utility from a shop
 */
export async function removeUtility(
  shopCode: number,
  utilityId: UtilityId
): Promise<boolean> {
  try {
    const { data } = await api.delete<UtilitiesResponse>(
      `/shops/${shopCode}/utilities/${utilityId}`
    );
    return data?.success || false;
  } catch (error) {
    console.error("Error removing utility:", error);
    return false;
  }
}

/**
 * Get utilities for a specific field
 */
export async function getFieldUtilities(fieldCode: number): Promise<Record<string, boolean>> {
  try {
    const { data } = await api.get<UtilitiesResponse>(
      `/fields/${fieldCode}/utilities`
    );
    
    // Convert array to object with boolean values
    if (data?.success && data?.data) {
      const result: Record<string, boolean> = {};
      AVAILABLE_UTILITIES.forEach(util => {
        result[util.id] = false; // Default to false (no utility)
      });
      
      // Set true for utilities that exist
      data.data.forEach(util => {
        if (result.hasOwnProperty(util.utility_id)) {
          result[util.utility_id] = true;
        }
      });
      
      return result;
    }
    
    // If no data, return all false (defaults)
    const result: Record<string, boolean> = {};
    AVAILABLE_UTILITIES.forEach(util => {
      result[util.id] = false;
    });
    return result;
  } catch (error) {
    console.error("Error fetching field utilities:", error);
    
    // Return all false as defaults
    const result: Record<string, boolean> = {};
    AVAILABLE_UTILITIES.forEach(util => {
      result[util.id] = false;
    });
    return result;
  }
}
