// Status classification sets
const HELD_STATUS = new Set([
  "held",
  "holding",
  "on_hold",
  "pending",
  "pending_hold",
  "pending_booking",
  "pending_payment",
  "pending_confirmation",
  "pending_confirm",
]);

const BOOKED_STATUS = new Set([
  "booked",
  "confirmed",
  "reserved",
  "paid",
  "success",
  "completed",
  "done",
  "inactive",
  "maintenance",
  "blocked",
  "cancelled",
  "cancel",
]);

export type CourtStatusType = "available" | "held" | "booked";

// Status checkers
export const isHeldStatus = (value: string | null | undefined): boolean =>
  HELD_STATUS.has(String(value ?? "").toLowerCase());

export const isBookedStatus = (value: string | null | undefined): boolean =>
  BOOKED_STATUS.has(String(value ?? "").toLowerCase());

// Parse datetime
export const parseDateTime = (
  value: string | null | undefined
): Date | null => {
  if (!value) return null;
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// Hold expiry calculation
export const getHoldExpiryDate = (
  holdExpiresAt?: string | null,
  holdExpiresAtTs?: number | null
): Date | null => {
  if (typeof holdExpiresAtTs === "number" && !Number.isNaN(holdExpiresAtTs)) {
    const normalizedMs =
      holdExpiresAtTs > 1_000_000_000_000
        ? holdExpiresAtTs
        : holdExpiresAtTs * 1000;
    const date = new Date(normalizedMs);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return parseDateTime(holdExpiresAt);
};

export const isHoldStillActive = (
  holdExpiresAt?: string | null,
  holdExpiresAtTs?: number | null
): boolean => {
  const parsed = getHoldExpiryDate(holdExpiresAt, holdExpiresAtTs);
  return !parsed || parsed.getTime() > Date.now();
};

// Normalize status value
export const normalizeCourtStatus = (
  value: string | null | undefined,
  holdExpiresAt?: string | null,
  holdExpiresAtTs?: number | null
): CourtStatusType => {
  const normalized = String(value ?? "").toLowerCase();
  if (isHeldStatus(normalized)) {
    return isHoldStillActive(holdExpiresAt, holdExpiresAtTs)
      ? "held"
      : "available";
  }
  if (isBookedStatus(normalized)) {
    return "booked";
  }
  return normalized === "available" ? "available" : "booked";
};
