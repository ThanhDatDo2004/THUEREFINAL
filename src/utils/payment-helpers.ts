export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

/**
 * Normalize arbitrary payment status values from backend/webhooks into a
 * predictable set that the UI understands.
 */
export const normalizePaymentStatus = (
  rawStatus: unknown
): PaymentStatus => {
  if (rawStatus === null || rawStatus === undefined) {
    return "pending";
  }

  const normalized = String(rawStatus).trim().toLowerCase();

  if (["paid", "success", "completed"].includes(normalized)) {
    return "paid";
  }

  if (["failed", "failure", "error", "cancelled", "canceled"].includes(normalized)) {
    return "failed";
  }

  if (["refunded", "refund"].includes(normalized)) {
    return "refunded";
  }

  return "pending";
};
