import type { Fields, FieldSportType, FieldStatus } from "../types";

const SPORT_LABELS: Record<string, string> = {
  badminton: "Cầu lông",
  football: "Bóng đá",
  baseball: "Bóng chày",
  swimming: "Bơi lội",
  tennis: "Tennis",
  table_tennis: "Bóng bàn",
  basketball: "Bóng rổ",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Sẵn sàng",
  available: "Sẵn sàng",
  open: "Sẵn sàng",
  maintenance: "Bảo trì",
  on_maintenance: "Bảo trì",
  inactive: "Tạm đóng",
  closed: "Tạm đóng",
  unavailable: "Tạm đóng",
  booked: "Đã đặt",
  reserved: "Đã đặt",
  held: "Đang giữ chỗ",
  on_hold: "Đang giữ chỗ",
  blocked: "Tạm khóa",
  disabled: "Tạm khóa",
  pending: "Đang xử lý",
  cancelled: "Đã hủy",
  completed: "Hoàn tất",
  confirmed: "Đã xác nhận",
  "trống": "Sẵn sàng",
  "đã đặt": "Đã đặt",
  "bảo trì": "Bảo trì",
};

const STATUS_CLASSNAMES: Record<string, string> = {
  active: "status-chip status-trong",
  available: "status-chip status-trong",
  open: "status-chip status-trong",
  "trống": "status-chip status-trong",
  maintenance: "status-chip status-bao-tri",
  on_maintenance: "status-chip status-bao-tri",
  "bảo trì": "status-chip status-bao-tri",
  held: "status-chip status-bao-tri",
  on_hold: "status-chip status-bao-tri",
  booked: "status-chip status-khac",
  reserved: "status-chip status-khac",
  confirmed: "status-chip status-khac",
  "đã đặt": "status-chip status-khac",
  blocked: "status-chip status-khac",
  disabled: "status-chip status-khac",
  unavailable: "status-chip status-khac",
  inactive: "status-chip status-khac",
  closed: "status-chip status-khac",
  cancelled: "status-chip status-khac",
};

const normalizeKey = (value?: FieldStatus | string | null) =>
  (value ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

export const getSportLabel = (sportType?: FieldSportType | string | null) => {
  if (!sportType) return "Không xác định";
  const normalized = normalizeKey(sportType);
  if (SPORT_LABELS[normalized]) {
    return SPORT_LABELS[normalized];
  }
  // Chuẩn hóa dạng chuỗi bất kỳ, ví dụ "bóng đá" hoặc "indoor football"
  const clean = sportType
    .toString()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "Không xác định";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

export const getFieldStatusLabel = (
  status?: FieldStatus | string | null
) => {
  if (!status) return "Không xác định";
  const normalized = normalizeKey(status);
  return STATUS_LABELS[normalized] ?? status.toString();
};

export const getFieldStatusClass = (
  status?: FieldStatus | string | null
) => {
  const normalized = normalizeKey(status);
  return STATUS_CLASSNAMES[normalized] ?? "status-chip status-khac";
};

export const resolveFieldPrice = (
  field: Pick<
    Fields,
    "price_per_hour" | "default_price_per_hour"
  > | null | undefined
) => {
  if (!field) return 0;
  const direct = field.price_per_hour;
  if (typeof direct === "number" && !Number.isNaN(direct)) {
    return direct;
  }
  const fallback = field.default_price_per_hour;
  if (typeof fallback === "number" && !Number.isNaN(fallback)) {
    return fallback;
  }
  return 0;
};
