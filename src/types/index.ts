// Database Models Types
export interface UsersLevel {
  level_code: number;
  level_type: "cus" | "shop" | "admin";
}

export interface Users {
  user_code: number;
  level_code: number;
  user_name: string;
  user_id: string;
  user_password: string;
  email: string;
  phone_number?: string;
  isActive: 0 | 1;
}

export interface Shops {
  shop_code: number;
  user_code: number;
  shop_name: string;
  address: string;
  bank_account_number: string;
  bank_name: string;
  isapproved: 0 | 1;
}

export type FieldSportType =
  | "badminton"
  | "football"
  | "baseball"
  | "swimming"
  | "tennis"
  | "table_tennis"
  | "basketball"
  | string;

export type FieldStatus =
  | "active"
  | "maintenance"
  | "inactive"
  | "available"
  | "unavailable"
  | "booked"
  | "draft"
  | string;

export interface Fields {
  field_code: number;
  shop_code: number;
  field_name: string;
  sport_type: FieldSportType;
  /**
   * Một số endpoint dùng price_per_hour, một số khác dùng default_price_per_hour.
   * Giữ cả hai để tương thích ngược.
   */
  price_per_hour?: number;
  default_price_per_hour?: number;
  address: string;
  status: FieldStatus;
}

export interface FieldImages {
  image_code: number;
  field_code: number;
  image_url: string;
  sort_order?: number;
  is_primary?: number | boolean;
  storage?: {
    bucket: string;
    key: string;
    region?: string;
  };
}

export interface Bookings {
  booking_code: number;
  field_code: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  payment_status: "pending" | "paid" | "failed";
  code: string;
  check_status: "chưa xác nhận" | "đúng giờ" | "trễ" | "mất cọc";
  created_at: string;
}

export interface Payments {
  payment_code: number;
  booking_code: number;
  payment_method: "banktransfer";
  amount: number;
  transaction_code: string;
  payment_date: string;
  status: "success" | "failed" | "pending";
}

export interface Customers {
  customer_code: number;
  shop_code: number;
  name: string;
  email: string;
  phone_number: string;
  total_orders: number;
  last_booking_date: string;
}

export interface ShopRevenue {
  revenue_code: number;
  shop_code: number;
  total_income: number;
  total_expense: number;
  Balance: number;
  Month: number;
  Year: number;
}

export interface AdminRevenue {
  revenue_code: number;
  booking_code: number;
  commission_percent: number;
  commission_amount: number;
  created_at: string;
}

export interface Reviews {
  review_code: number;
  field_code: number;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ShopRequests {
  request_id: number;
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  message: string;
  created_at: string;
  status: "pending" | "reviewed" | "approved" | "rejected";
}

// Extended types for UI
export interface FieldWithImages extends Fields {
  images: FieldImages[];
  shop: Shops;
  reviews: Reviews[];
  avg_rating: number;
  averageRating?: number;
}

export type FieldsQuery = {
  search?: string;
  sportType?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
  sortBy?: "price" | "rating" | "name";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  status?: string;
  shopStatus?: string;
};

export interface BookingWithField extends Bookings {
  field: Fields;
  payment: Payments | null;
}

// Auth Context Types
export interface AuthUser {
  user_code: number;
  level_type: "cus" | "shop" | "admin";
  user_name: string;
  email: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

export interface RegisterData {
  user_name: string;
  user_id: string;
  email: string;
  password: string;
  level_type: "cus" | "shop";
}

export interface LoginData {
  email: string;
  password: string;
}

// Shop Field Management Types
export interface CreateFieldData {
  field_name: string;
  sport_type: string;
  address: string;
  price_per_hour: number;
  status?: "active" | "maintenance" | "inactive";
}

export interface UpdateFieldData {
  field_name?: string;
  sport_type?: string;
  address?: string;
  price_per_hour?: number;
  status?: "active" | "maintenance" | "inactive";
}

export interface UpdateFieldStatusData {
  status: "active" | "maintenance" | "inactive";
}

// Enhanced AuthUser with shop_code
export interface AuthUser {
  user_code: number;
  level_type: "cus" | "shop" | "admin";
  user_name: string;
  email: string;
  shop_code?: number; // Added for shop owners
}

// Enhanced AuthContextType
export interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  isShopOwner: () => boolean; // Helper to check if user is shop owner
  getShopCode: () => number | null; // Helper to get shop code
}
