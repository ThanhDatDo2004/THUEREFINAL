// src/utils/fakeApi.ts
import fieldsJson from "./data/fields.json";
import shopsJson from "./data/shops.json";
import fieldImagesJson from "./data/fieldImages.json";
import reviewsJson from "./data/reviews.json";
import bookingsJson from "./data/bookings.json";
import customersJson from "./data/customers.json";
import shopRevenueJson from "./data/shopRevenue.json";

// --- Admin data additions ---
import usersJson from "./data/users.json";
import usersLevelsJson from "./data/usersLevels.json";
import shopRequestsJson from "./data/shopRequests.json";
import paymentsJson from "./data/payments.json";

import type {
  FieldWithImages,
  Fields,
  Shops,
  FieldImages,
  Reviews,
  Bookings,
  Customers,
  ShopRevenue,
  // Admin types
  Users,
  UsersLevel,
  ShopRequests,
  Payments,
} from "../types";

/* -----------------------------
 * Raw JSON → typed constants
 * ----------------------------- */
const FIELDS = fieldsJson as Fields[];
const SHOPS = shopsJson as Shops[];
const FIELD_IMAGES = fieldImagesJson as FieldImages[];
const REVIEWS = reviewsJson as Reviews[];
const BOOKINGS = bookingsJson as Bookings[];
const CUSTOMERS = customersJson as Customers[];
const SHOP_REVENUE = shopRevenueJson as ShopRevenue[];

// --- Admin constants ---
const USERS = usersJson as Users[];
const USERS_LEVELS = usersLevelsJson as UsersLevel[];
const SHOP_REQUESTS = shopRequestsJson as ShopRequests[];
const PAYMENTS = paymentsJson as Payments[];

/* -----------------------------
 * Helpers
 * ----------------------------- */
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

/** Hai khoảng thời gian [a1,a2) và [b1,b2) có overlap không? */
const overlap = (a1: string, a2: string, b1: string, b2: string) =>
  toMin(a1) < toMin(b2) && toMin(b1) < toMin(a2);

/** Chuẩn hoá location dạng "Quận, TP" lấy 2 phần cuối của address */
const normLoc = (addr: string) =>
  addr
    .split(",")
    .slice(-2)
    .map((s) => s.trim())
    .join(",");

/** Tính giờ kết thúc từ giờ bắt đầu + thời lượng (giờ) */
export const computeEndTime = (startTime: string, durationHours: number) => {
  const start = toMin(startTime);
  const end = start + Math.round(durationHours * 60);
  const hh = Math.floor(end / 60) % 24;
  const mm = end % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
};

/* -----------------------------
 * Build sẵn FieldWithImages
 * ----------------------------- */
const FIELDS_JOINED: FieldWithImages[] = FIELDS.map((field) => {
  const images = FIELD_IMAGES.filter(
    (img) => img.field_code === field.field_code
  );
  const shop = SHOPS.find((s) => s.shop_code === field.shop_code)!;
  const fieldReviews = REVIEWS.filter((r) => r.field_code === field.field_code);
  const averageRating =
    fieldReviews.length > 0
      ? fieldReviews.reduce((sum, r) => sum + r.rating, 0) / fieldReviews.length
      : 0;

  // FieldWithImages nên có averageRating?: number trong types
  return { ...field, images, shop, reviews: fieldReviews, averageRating };
});

/* -----------------------------
 * Public query types
 * ----------------------------- */
export type FieldsQuery = {
  search?: string;
  sportType?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  date?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  sortBy?: "price" | "rating" | "name";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

/* -----------------------------
 * Availability helpers / APIs
 * ----------------------------- */

/** Kiểm tra 1 sân có rảnh hay không theo ngày + khoảng giờ */
export function isFieldAvailable(
  field_code: number,
  date: string,
  startTime: string,
  endTime: string
) {
  if (toMin(startTime) >= toMin(endTime)) return false;
  const dayBookings = BOOKINGS.filter(
    (b) => b.field_code === field_code && b.booking_date === date
  );
  return !dayBookings.some((b) =>
    overlap(startTime, endTime, b.start_time, b.end_time)
  );
}

/** Lấy các booking của 1 sân (tuỳ chọn lọc theo ngày) */
export function getFieldBookings(field_code: number, date?: string) {
  return BOOKINGS.filter(
    (b) => b.field_code === field_code && (!date || b.booking_date === date)
  ).slice();
}

/* -----------------------------
 * Fields listing (filter/sort/paginate)
 * ----------------------------- */
export async function getFields(q: FieldsQuery) {
  // await new Promise((r) => setTimeout(r, 120)); // giả lập network

  let items = [...FIELDS_JOINED];

  if (q.search?.trim()) {
    const s = q.search.toLowerCase();
    items = items.filter(
      (f) =>
        f.field_name.toLowerCase().includes(s) ||
        f.shop.shop_name.toLowerCase().includes(s) ||
        f.address.toLowerCase().includes(s)
    );
  }
  if (q.sportType) items = items.filter((f) => f.sport_type === q.sportType);
  if (q.location)
    items = items.filter((f) => normLoc(f.address).includes(q.location!));
  if (typeof q.priceMin === "number")
    items = items.filter((f) => f.price_per_hour >= q.priceMin!);
  if (typeof q.priceMax === "number")
    items = items.filter((f) => f.price_per_hour <= q.priceMax!);

  // Availability filter (tránh trùng lịch)
  if (
    q.date &&
    q.startTime &&
    q.endTime &&
    toMin(q.startTime) < toMin(q.endTime)
  ) {
    items = items.filter((f) =>
      isFieldAvailable(f.field_code, q.date!, q.startTime!, q.endTime!)
    );
  }

  // Sorting
  if (q.sortBy) {
    const dir = q.sortDir === "desc" ? -1 : 1;
    items.sort((a, b) => {
      if (q.sortBy === "price")
        return (a.price_per_hour - b.price_per_hour) * dir;
      if (q.sortBy === "rating")
        return ((a.averageRating ?? 0) - (b.averageRating ?? 0)) * dir;
      if (q.sortBy === "name")
        return a.field_name.localeCompare(b.field_name, "vi") * dir;
      return 0;
    });
  }

  // Pagination
  const total = items.length;
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 12;
  const paged = items.slice((page - 1) * pageSize, page * pageSize);

  const facets = {
    sportTypes: Array.from(new Set(items.map((f) => f.sport_type))).sort(),
    locations: Array.from(new Set(items.map((f) => normLoc(f.address)))).sort(),
  };

  return { items: paged, total, facets };
}

/* -----------------------------
 * Field/item getters
 * ----------------------------- */
export async function getFieldById(fieldId: number) {
  return FIELDS_JOINED.find((f) => f.field_code === fieldId);
}

export async function getShopFields(shopCode: number) {
  return FIELDS_JOINED.filter((f) => f.shop_code === shopCode);
}

export async function getFieldFacets() {
  return {
    sportTypes: Array.from(
      new Set(FIELDS_JOINED.map((f) => f.sport_type))
    ).sort(),
    locations: Array.from(
      new Set(FIELDS_JOINED.map((f) => normLoc(f.address)))
    ).sort(),
  };
}

/* -----------------------------
 * Shop dashboard APIs
 * ----------------------------- */
export async function getShopByUserCode(userCode: number) {
  return SHOPS.find((s) => s.user_code === userCode);
}

export async function getAllBookings() {
  // Trả về bản sao để tránh mutate ngoài ý muốn
  return BOOKINGS.slice();
}

export async function getCustomersByShop(shopCode: number) {
  return CUSTOMERS.filter((c) => c.shop_code === shopCode).slice();
}

export async function getShopRevenueByShop(shopCode: number) {
  return SHOP_REVENUE.filter((r) => r.shop_code === shopCode).slice();
}

/* -----------------------------
 * Admin helpers (cho Admin Dashboard/Pages)
 * ----------------------------- */
export async function getAllUsers(): Promise<Users[]> {
  return USERS.slice();
}

export async function getUsersLevels(): Promise<UsersLevel[]> {
  return USERS_LEVELS.slice();
}

export async function getAllShops(): Promise<Shops[]> {
  return SHOPS.slice();
}

export async function getShopRequests(): Promise<ShopRequests[]> {
  return SHOP_REQUESTS.slice();
}

export async function getAllRevenue(): Promise<ShopRevenue[]> {
  return SHOP_REVENUE.slice();
}

export async function getAllPayments(): Promise<Payments[]> {
  return PAYMENTS.slice();
}

/* -----------------------------
 * Reviews helpers (optional)
 * ----------------------------- */
export async function getReviewsByField(field_code: number) {
  return REVIEWS.filter((r) => r.field_code === field_code).slice();
}

/* -----------------------------
 * UPDATE APIs for Shop (in-memory)
 * ----------------------------- */
// Chỉ cho phép các key có thật trong Fields (không include 'description' nếu types chưa có)
type UpdatableFieldKeys = Extract<
  keyof Fields,
  "field_name" | "price_per_hour" | "sport_type" | "status" | "address"
>;
export type UpdateFieldInput = Partial<Pick<Fields, UpdatableFieldKeys>>;

/**
 * Cập nhật thông tin sân theo field_code (in-memory).
 * Cho phép sửa: field_name, sport_type, price_per_hour, status, address.
 * Trả về FieldWithImages đã cập nhật để UI dùng luôn.
 */
export async function updateShopField(
  field_code: number,
  payload: UpdateFieldInput
): Promise<FieldWithImages | null> {
  // update bản gốc
  const idx = FIELDS.findIndex((f) => f.field_code === field_code);
  if (idx === -1) return null;
  Object.assign(FIELDS[idx], payload);

  // đồng bộ bản đã join (để UI phản hồi ngay)
  const j = FIELDS_JOINED.findIndex((f) => f.field_code === field_code);
  if (j !== -1) {
    Object.assign(FIELDS_JOINED[j], payload);
  }

  return FIELDS_JOINED.find((f) => f.field_code === field_code) ?? null;
}

/** Đặt trạng thái sân, ví dụ: 'bảo trì' ↔ 'trống' */
export async function setFieldStatus(
  field_code: number,
  status: Fields["status"]
): Promise<FieldWithImages | null> {
  return updateShopField(field_code, { status });
}
type CreateFieldInput = Pick<
  Fields,
  "field_name" | "sport_type" | "price_per_hour" | "address"
> & {
  status?: Fields["status"];
};

function nextFieldId() {
  return (FIELDS.reduce((m, f) => Math.max(m, f.field_code), 0) || 0) + 1;
}

/** Tạo sân mới cho shop (in-memory) và trả về FieldWithImages để UI dùng luôn */
export async function createShopField(
  shop_code: number,
  payload: CreateFieldInput
): Promise<FieldWithImages> {
  const field_code = nextFieldId();

  const newField: Fields = {
    field_code,
    shop_code,
    field_name: payload.field_name.trim(),
    sport_type: payload.sport_type,
    price_per_hour: Number(payload.price_per_hour) || 0,
    address: payload.address.trim(),
    status: payload.status ?? ("trống" as Fields["status"]),
  };

  // 1) ghi vào nguồn dữ liệu gốc
  FIELDS.push(newField);

  // 2) build bản joined cho UI
  const shop = SHOPS.find((s) => s.shop_code === shop_code)!;
  const images = FIELD_IMAGES.filter((img) => img.field_code === field_code); // có thể rỗng
  const reviews = REVIEWS.filter((r) => r.field_code === field_code);
  const joined: FieldWithImages = {
    ...newField,
    shop,
    images,
    reviews,
    averageRating: 0,
  };

  FIELDS_JOINED.push(joined);
  return joined;
}

/* -----------------------------
 * Expose utilities
 * ----------------------------- */
export const utils = { normLoc, overlap, toMin };
