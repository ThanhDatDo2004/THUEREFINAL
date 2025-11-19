export type StatusBadgeMeta = {
  label: string;
  className: string;
};

const BOOKING_STATUS_BADGES: Record<string, StatusBadgeMeta> = {
  pending: {
    label: "Chờ xác nhận",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  confirmed: {
    label: "Đã xác nhận",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },

  cancelled: {
    label: "Đã hủy",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

const PAYMENT_STATUS_BADGES: Record<string, StatusBadgeMeta> = {
  pending: {
    label: "Chờ thanh toán",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  paid: {
    label: "Đã thanh toán",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  failed: {
    label: "Thanh toán thất bại",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
  refunded: {
    label: "Đã hoàn tiền",
    className: "bg-gray-50 text-gray-700 border-gray-200",
  },
};

const DEFAULT_BADGE: StatusBadgeMeta = {
  label: "Không xác định",
  className: "bg-gray-50 text-gray-700 border-gray-200",
};

export const getBookingStatusBadge = (status: string | null | undefined) => {
  if (!status) return DEFAULT_BADGE;
  return (
    BOOKING_STATUS_BADGES[String(status).toLowerCase()] ?? {
      label: status,
      className: DEFAULT_BADGE.className,
    }
  );
};

export const getPaymentStatusBadge = (status: string | null | undefined) => {
  if (!status) return DEFAULT_BADGE;
  return (
    PAYMENT_STATUS_BADGES[String(status).toLowerCase()] ?? {
      label: status,
      className: DEFAULT_BADGE.className,
    }
  );
};
