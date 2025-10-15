import type { Fields, FieldSportType, FieldStatus } from "../types";

// --- Normalization ---

/**
 * Aggressively normalizes a string for use as a lookup key.
 * - Converts to lowercase
 * - Removes diacritics (e.g., "Bóng đá" -> "Bong da")
 * - Replaces whitespace and non-alphanumeric characters with a single underscore
 * - Trims leading/trailing underscores
 * @param value The string to normalize.
 * @returns A normalized string key.
 */
const normalizeStringForLookup = (value?: string | null): string => {
  if (!value) return "";
  return value
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]+/g, "")
    .replace(/[\s_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

// --- Sports Metadata and Aliases ---

const SPORT_METADATA: Record<
  Exclude<FieldSportType, string>,
  { label: string }
> = {
  badminton: { label: "Cầu lông" },
  football: { label: "Bóng đá" },
  baseball: { label: "Bóng chày" },
  swimming: { label: "Bơi lội" },
  tennis: { label: "Tennis" },
  table_tennis: { label: "Bóng bàn" },
  basketball: { label: "Bóng rổ" },
};

const SPORT_ALIASES = (Object.entries(SPORT_METADATA) as [Exclude<FieldSportType, string>, { label: string }][]).reduce(
  (
    acc: Record<string, Exclude<FieldSportType, string>>,
    entry
  ) => {
    const [key, { label }] = entry;
    const canonical = key as Exclude<FieldSportType, string>;
    acc[normalizeStringForLookup(key)] = canonical;
    acc[normalizeStringForLookup(label)] = canonical;
    return acc;
  },
  {} as Record<string, Exclude<FieldSportType, string>>
);

// --- Status Metadata and Aliases ---

type CanonicalStatus = "active" | "maintenance" | "booked" | "inactive" | "draft";

const STATUS_METADATA: Record<
  CanonicalStatus,
  { label: string; className: string }
> = {
  active: { label: "Sẵn sàng", className: "status-chip status-trong" },
  maintenance: { label: "Bảo trì", className: "status-chip status-bao-tri" },
  booked: { label: "Đã đặt", className: "status-chip status-khac" },
  inactive: { label: "Tạm đóng", className: "status-chip status-khac" },
  draft: { label: "Bản nháp", className: "status-chip status-khac" },
};

// A definitive map of various raw status inputs to a canonical status.
const STATUS_ALIAS_MAP: Record<string, CanonicalStatus> = {
  // Active statuses
  active: "active",
  available: "active",
  open: "active",
  trong: "active",
  san_sang: "active",
  "sẵn sàng": "active",

  // Maintenance statuses
  maintenance: "maintenance",
  on_maintenance: "maintenance",
  bao_tri: "maintenance",
  "bảo trì": "maintenance",

  // Booked statuses
  booked: "booked",
  reserved: "booked",
  confirmed: "booked",
  da_dat: "booked",
  "đã đặt": "booked",
  held: "booked", // "Held" is closer to "booked" than "maintenance"
  on_hold: "booked",
  "đang giữ chỗ": "booked",

  // Inactive statuses
  inactive: "inactive",
  closed: "inactive",
  unavailable: "inactive",
  blocked: "inactive",
  disabled: "inactive",
  tam_dong: "inactive",
  "tạm đóng": "inactive",
  tam_khoa: "inactive",
  "tạm khóa": "inactive",

  // Draft status
  draft: "draft",
  "bản nháp": "draft",
};

// --- Public Helper Functions ---

/**
 * Gets the display label for a given sport type.
 * @param sportType The sport type to resolve.
 * @returns The display label or a capitalized version of the input.
 */
export const getSportLabel = (
  sportType?: FieldSportType | string | null
): string => {
  const normalized = normalizeSportTypeValue(sportType);
  if (normalized && normalized in SPORT_METADATA) {
    return SPORT_METADATA[normalized as keyof typeof SPORT_METADATA].label ?? "Không xác định";
  }
  return "Không xác định";
};

/**
 * Normalizes a raw sport type string to its canonical form.
 * @param sportType The raw sport type string (e.g., "Bong da", "football").
 * @returns The canonical `FieldSportType` or the original trimmed string if no alias matches.
 */
export const normalizeSportTypeValue = (
  sportType?: FieldSportType | string | null
): Exclude<FieldSportType, string> | undefined => {
  if (!sportType) return undefined;
  const lookupKey = normalizeStringForLookup(sportType);
  return SPORT_ALIASES[lookupKey];
};

/**
 * Gets the display label for a given field status.
 * @param status The status to resolve.
 * @returns The display label for the status.
 */
export const getFieldStatusLabel = (
  status?: FieldStatus | string | null
): string => {
  const normalized = normalizeFieldStatusValue(status);
  return normalized ? STATUS_METADATA[normalized]?.label ?? "Không xác định" : "Không xác định";
};

/**
 * Gets the appropriate CSS class for a given field status.
 * @param status The status to resolve.
 * @returns The CSS class string for the status.
 */
export const getFieldStatusClass = (
  status?: FieldStatus | string | null
): string => {
  const normalized = normalizeFieldStatusValue(status);
  const defaultClass = "status-chip status-khac";
  return normalized ? STATUS_METADATA[normalized]?.className ?? defaultClass : defaultClass;
};

/**
 * Normalizes a raw status string to its canonical form.
 * @param status The raw status string (e.g., "san_sang", "Đã đặt").
 * @returns The canonical `FieldStatus` or undefined if no alias matches.
 */
export const normalizeFieldStatusValue = (
  status?: FieldStatus | string | null
): CanonicalStatus | undefined => {
  if (!status) return undefined;
  const lookupKey = normalizeStringForLookup(status);
  return STATUS_ALIAS_MAP[lookupKey];
};

/**
 * Safely resolves the price for a field from multiple possible properties.
 * @param field A field-like object with price properties.
 * @returns The resolved price, or 0 if not found.
 */
export const resolveFieldPrice = (
  field: Pick<Fields, "price_per_hour" | "default_price_per_hour"> | null | undefined
): number => {
  return field?.price_per_hour ?? field?.default_price_per_hour ?? 0;
};

/**
 * Safely resolves the rating for a field from multiple possible properties.
 * @param field A field-like object with rating properties.
 * @returns The resolved rating, or 0 if not found.
 */
export const resolveFieldRating = (
  field: { avg_rating?: number | null; averageRating?: number | null } | null | undefined
): number => {
  return field?.avg_rating ?? field?.averageRating ?? 0;
};
