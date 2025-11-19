import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAdminFinanceBookings,
  type AdminFinanceFilters,
} from "../../models/admin.api";
import type { AdminFinanceBooking, AdminFinanceSummary } from "../../types";
import {
  Activity,
  BarChart3,
  Building2,
  CalendarRange,
  Clock,
  DollarSign,
  Filter,
  Hash,
  LineChart,
  Percent,
  RefreshCw,
  ScanLine,
  TrendingUp,
  Users,
  Wallet2,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

type QuickRange = "today" | "week" | "month" | "year";

const QUICK_RANGES: ReadonlyArray<[QuickRange, string]> = [
  ["today", "Hôm nay"],
  ["week", "7 ngày"],
  ["month", "Tháng này"],
  ["year", "Năm nay"],
];

const DEFAULT_SUMMARY: AdminFinanceSummary = {
  total_records: 0,
  total_total_price: 0,
  total_platform_fee: 0,
  total_net_to_shop: 0,
  total_checkins: 0,
  total_quantity_ids: 0,
  first_create_at: null,
  last_create_at: null,
};

const formatNumber = (value: number) =>
  Number(value ?? 0).toLocaleString("vi-VN");

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  minimumFractionDigits: 0,
});

const formatMoney = (value: number) => currencyFormatter.format(value ?? 0);

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateTime = (value: string | null, fallback = "-") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    hour12: false,
  });
};

const statTone = {
  emerald: "bg-emerald-500",
  blue: "bg-sky-500",
  orange: "bg-orange-500",
  slate: "bg-slate-500",
};

type ToneKey = keyof typeof statTone;

const AdminDashboard: React.FC = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const initialFilters: Required<
    Pick<AdminFinanceFilters, "startDate" | "endDate">
  > &
    Pick<
      AdminFinanceFilters,
      "fieldCode" | "customerUserID" | "bookingStatus"
    > = {
    startDate: formatDateInput(startOfMonth),
    endDate: formatDateInput(now),
    fieldCode: "",
    customerUserID: "",
    bookingStatus: "all",
  };

  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [financeData, setFinanceData] = useState<AdminFinanceBooking[]>([]);
  const [summary, setSummary] = useState<AdminFinanceSummary>(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetchAdminFinanceBookings({
          ...appliedFilters,
          limit: 500,
          offset: 0,
        });
        if (!ignore) {
          setFinanceData(response.items ?? []);
          setSummary(response.summary ?? DEFAULT_SUMMARY);
          setLastRefreshedAt(new Date().toISOString());
        }
      } catch (err) {
        console.error(err);
        if (!ignore) {
          setFinanceData([]);
          setSummary(DEFAULT_SUMMARY);
          setError(
            (err as Error)?.message || "Không thể tải dữ liệu tài chính."
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [appliedFilters]);

  const statusCounts = useMemo(() => {
    return financeData.reduce<Record<string, number>>((acc, booking) => {
      const key = booking.booking_status?.trim() || "other";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }, [financeData]);

  const paymentCounts = useMemo(() => {
    return financeData.reduce<Record<string, number>>((acc, booking) => {
      const key = booking.payment_status?.trim() || "other";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }, [financeData]);

  const handleInputChange = (field: keyof typeof filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
  };

  const refreshData = () => {
    setAppliedFilters((prev) => ({ ...prev }));
  };

  const handleQuickRange = (range: QuickRange) => {
    const end = new Date();
    let start = new Date();
    switch (range) {
      case "today":
        break;
      case "week":
        start.setDate(start.getDate() - 6);
        break;
      case "month":
        start = new Date(end.getFullYear(), end.getMonth(), 1);
        break;
      case "year":
        start = new Date(end.getFullYear(), 0, 1);
        break;
    }
    const updated = {
      ...filters,
      startDate: formatDateInput(start),
      endDate: formatDateInput(end),
    };
    setFilters(updated);
    setAppliedFilters(updated);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  const computedSummary = useMemo(() => {
    const totalRecords = summary.total_records || 0;
    const totalPrice = summary.total_total_price || 0;
    const totalNet = summary.total_net_to_shop || 0;
    const totalPlatform = summary.total_platform_fee || 0;

    const averageTicket = totalRecords ? totalPrice / totalRecords : 0;
    const averageNet = totalRecords ? totalNet / totalRecords : 0;
    const platformShare = totalPrice ? (totalPlatform / totalPrice) * 100 : 0;
    const netShare = totalPrice ? (totalNet / totalPrice) * 100 : 0;

    const distributionBase = totalRecords || 1;

    const statusDistribution = Object.entries(statusCounts)
      .map(([label, count]) => ({
        label,
        count,
        percent: Math.round((count / distributionBase) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    const paymentDistribution = Object.entries(paymentCounts)
      .map(([label, count]) => ({
        label,
        count,
        percent: Math.round((count / distributionBase) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalRecords,
      totalPrice,
      totalNet,
      totalPlatform,
      averageTicket,
      averageNet,
      platformShare,
      netShare,
      statusDistribution,
      paymentDistribution,
    };
  }, [summary, statusCounts, paymentCounts]);

  const topCustomers = useMemo(() => {
    const map = new Map<
      string,
      { name: string; total: number; count: number }
    >();
    financeData.forEach((booking) => {
      const key =
        booking.customer_user_id !== null
          ? `id-${booking.customer_user_id}`
          : booking.customer_name || "anonymous";
      const entry = map.get(key) ?? {
        name: booking.customer_name?.trim() || "Khách lẻ",
        total: 0,
        count: 0,
      };
      entry.total += booking.net_to_shop ?? 0;
      entry.count += 1;
      map.set(key, entry);
    });
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [financeData]);

  const topFields = useMemo(() => {
    const map = new Map<
      number,
      { name: string; total: number; bookings: number }
    >();
    financeData.forEach((booking) => {
      const current = map.get(booking.field_code) ?? {
        name: booking.field_name || `Sân #${booking.field_code}`,
        total: 0,
        bookings: 0,
      };
      current.total += booking.total_price ?? 0;
      current.bookings += 1;
      map.set(booking.field_code, current);
    });
    return Array.from(map.entries())
      .map(([code, info]) => ({ code, ...info }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [financeData]);

  const recentBookings = useMemo(() => {
    return [...financeData]
      .filter((item) => item.create_at)
      .sort(
        (a, b) =>
          new Date(b.create_at || 0).getTime() -
          new Date(a.create_at || 0).getTime()
      )
      .slice(0, 6);
  }, [financeData]);

  const renderDistribution = (
    items: Array<{ label: string; count: number; percent: number }>,
    tone: ToneKey
  ) => {
    if (!items.length) {
      return (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          Chưa có dữ liệu cho bộ lọc hiện tại.
        </div>
      );
    }

    const barClass = statTone[tone];

    return (
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm font-medium text-slate-700">
              <span className="capitalize">{item.label || "Khác"}</span>
              <span className="text-xs font-semibold text-slate-500">
                {formatNumber(item.count)} · {item.percent}%
              </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${barClass}`}
                style={{ width: `${Math.min(item.percent, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const lastUpdatedText = formatDateTime(
    summary.last_create_at,
    "Chưa có dữ liệu"
  );
  const lastRefreshedText = formatDateTime(lastRefreshedAt, "—");

  return (
    <div className="flex w-full min-w-0 flex-col gap-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 text-white shadow-xl">
        <div className="absolute inset-0 opacity-40 mix-blend-overlay">
          <div className="absolute -left-10 top-10 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-emerald-900/40 blur-3xl" />
        </div>
        <div className="relative px-8 py-10 lg:px-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <div className="flex-1 min-w-0 space-y-3 lg:max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium">
                <Activity className="h-4 w-4" />
                Trung tâm tài chính
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                Bảng điều khiển doanh thu & dòng tiền
              </h1>
              <p className="text-base text-emerald-50/90 md:text-lg">
                Theo dõi hiệu suất tài chính theo thời gian thực, quản lý doanh
                thu đa kênh và phát hiện cơ hội tối ưu hóa chỉ trong một màn
                hình.
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-emerald-50/80">
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Dữ liệu đến: {lastUpdatedText}
                </span>
                <span className="inline-flex items-center gap-2">
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Lần làm mới gần nhất: {lastRefreshedText}
                </span>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-3">
              <button
                className="btn-ghost hover:text-white hover:bg-white/10"
                onClick={resetFilters}
                disabled={loading}
              >
                Đặt lại
              </button>
              <button
                className="btn-primary bg-white/20 font-semibold text-emerald-900 hover:brightness-110"
                onClick={refreshData}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Làm mới dữ liệu
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center justify-between text-sm font-semibold text-emerald-50/80">
                Tổng doanh thu
                <DollarSign className="h-5 w-5 text-emerald-100" />
              </div>
              <div className="mt-4 text-3xl font-bold">
                {formatMoney(computedSummary.totalPrice)}
              </div>
              <p className="mt-2 text-sm text-emerald-50/70">
                Toàn bộ giá trị booking phát sinh theo bộ lọc hiện tại.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center justify-between text-sm font-semibold text-emerald-50/80">
                Doanh thu thực nhận
                <Wallet2 className="h-5 w-5 text-emerald-100" />
              </div>
              <div className="mt-4 text-3xl font-bold">
                {formatMoney(computedSummary.totalNet)}
              </div>
              <p className="mt-2 text-sm text-emerald-50/70">
                Sau khi trừ phí nền tảng · {computedSummary.netShare.toFixed(1)}
                % tổng booking.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center justify-between text-sm font-semibold text-emerald-50/80">
                Phí nền tảng
                <BarChart3 className="h-5 w-5 text-emerald-100" />
              </div>
              <div className="mt-4 text-3xl font-bold">
                {formatMoney(computedSummary.totalPlatform)}
              </div>
              <p className="mt-2 text-sm text-emerald-50/70">
                Chiếm {computedSummary.platformShare.toFixed(1)}% tổng booking ·{" "}
                {formatNumber(summary.total_checkins)} lượt check-in.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2 text-slate-900">
            <Filter className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-semibold">Bộ lọc nâng cao</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Thu hẹp phạm vi dữ liệu theo thời gian, sân, khách hàng và trạng
            thái để phân tích chính xác hơn.
          </p>

          <div className="mt-6 space-y-5 text-sm">
            <label className="space-y-2">
              <span className="font-semibold text-slate-600">
                Khoảng thời gian
              </span>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                  className="form-input w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className="form-input w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-2">
                <span className="font-semibold text-slate-600">
                  Mã sân (FieldCode)
                </span>
                <input
                  type="number"
                  value={filters.fieldCode}
                  onChange={(e) =>
                    handleInputChange("fieldCode", e.target.value)
                  }
                  className="form-input w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="VD: 68"
                  min={0}
                />
              </label>
              <label className="space-y-2">
                <span className="font-semibold text-slate-600">
                  Mã khách (CustomerID)
                </span>
                <input
                  type="number"
                  value={filters.customerUserID}
                  onChange={(e) =>
                    handleInputChange("customerUserID", e.target.value)
                  }
                  className="form-input w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="VD: 11"
                  min={0}
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="font-semibold text-slate-600">
                Trạng thái booking
              </span>
              <select
                className="form-input w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={filters.bookingStatus}
                onChange={(e) =>
                  handleInputChange("bookingStatus", e.target.value)
                }
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-2">
              <span className="font-semibold text-slate-600">Bộ lọc nhanh</span>
              <div className="flex flex-wrap gap-2">
                {QUICK_RANGES.map(([range, label]) => (
                  <button
                    key={range}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600"
                    onClick={() => handleQuickRange(range)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              className="btn-primary flex-1 justify-center"
              onClick={applyFilters}
              disabled={loading}
            >
              Áp dụng bộ lọc
            </button>
            <button
              className="btn-ghost px-4"
              onClick={resetFilters}
              disabled={loading}
            >
              Xóa lọc
            </button>
          </div>
          {error && (
            <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          )}
        </div>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
              Tổng số booking
              <ScanLine className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="mt-4 text-3xl font-bold text-slate-900">
              {formatNumber(computedSummary.totalRecords)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {formatNumber(summary.total_checkins)} lượt check-in ·{" "}
              {formatNumber(summary.total_quantity_ids)} Sân lẻ
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
              Giá trị trung bình đơn
              <LineChart className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="mt-4 text-3xl font-bold text-slate-900">
              {formatMoney(computedSummary.averageTicket)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Net thực nhận trung bình:{" "}
              {formatMoney(computedSummary.averageNet)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
              Tỷ trọng dòng tiền
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="mt-4 text-xl font-semibold text-slate-900">
              Net / Gross: {computedSummary.netShare.toFixed(1)}%
            </div>
            <div className="mt-3 space-y-2 text-xs text-slate-500">
              <div className="flex items-center justify-between">
                <span>Phí nền tảng</span>
                <span>{computedSummary.platformShare.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${Math.min(computedSummary.platformShare, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
              Khách hàng nổi bật
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {topCustomers.length ? (
                topCustomers.map((customer) => (
                  <div
                    key={customer.name}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {customer.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {customer.count} đơn
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">
                      {formatMoney(customer.total)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
                  Bộ lọc hiện chưa có khách hàng nào.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
              Sân mang lại doanh thu cao
              <Building2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {topFields.length ? (
                topFields.map((field) => (
                  <div
                    key={field.code}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {field.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        #{field.code} · {field.bookings} đơn
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">
                      {formatMoney(field.total)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
                  Chưa có booking theo bộ lọc.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
              Gần nhất
              <Clock className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {recentBookings.length ? (
                recentBookings.map((booking) => (
                  <div
                    key={`recent-${booking.booking_code}`}
                    className="flex flex-col rounded-xl border border-slate-100 px-3 py-2"
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                      #{booking.booking_code}
                      <span>{formatDateTime(booking.create_at)}</span>
                    </div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {booking.customer_name || "Khách lẻ"} ·{" "}
                      {formatMoney(booking.total_price)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {booking.field_name || `Sân #${booking.field_code}`} ·{" "}
                      {booking.booking_status || "Chưa rõ"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
                  Bộ lọc chưa có giao dịch mới.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Phân bổ trạng thái booking
                </h2>
                <p className="text-xs text-slate-500">
                  Theo dõi tỷ trọng các trạng thái để nắm tình hình vận hành.
                </p>
              </div>
            </div>
            <div className="mt-6">
              {renderDistribution(
                computedSummary.statusDistribution,
                "emerald"
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Phân bổ trạng thái thanh toán
                </h2>
                <p className="text-xs text-slate-500">
                  So sánh tỷ lệ thanh toán thành công để cải thiện thu tiền.
                </p>
              </div>
            </div>
            <div className="mt-6">
              {renderDistribution(computedSummary.paymentDistribution, "blue")}
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Điểm nhấn vận hành
              </h2>
              <p className="text-xs text-slate-500">
                Những chỉ số quan trọng giúp ưu tiên hành động kế tiếp.
              </p>
            </div>
          </div>

          <ul className="mt-6 space-y-4 text-sm text-slate-600">
            <li className="rounded-xl border border-slate-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  {formatNumber(summary.total_checkins)} lượt check-in đã ghi
                  nhận
                </span>
                <ScanLine className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Đảm bảo quy trình check-in hoạt động trơn tru để không bỏ sót dữ
                liệu.
              </p>
            </li>
            <li className="rounded-xl border border-slate-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  {formatMoney(computedSummary.totalPlatform)} phí nền tảng
                </span>
                <Percent className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Theo dõi tỷ lệ phí để tối ưu các chương trình ưu đãi cho đối
                tác.
              </p>
            </li>
            <li className="rounded-xl border border-slate-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  {recentBookings.length} booking cập nhật gần nhất
                </span>
                <CalendarRange className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Hãy xem bảng hoạt động gần đây để đảm bảo không có booking bị bỏ
                lỡ.
              </p>
            </li>
          </ul>
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Nhật ký booking chi tiết
            </h2>
            <p className="text-xs text-slate-500">
              Danh sách booking theo bộ lọc · Hiển thị {financeData.length} /{" "}
              {formatNumber(summary.total_records)} bản ghi
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-600">
              <DollarSign className="h-3 w-3" />
              {formatMoney(computedSummary.totalPrice)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
              <Wallet2 className="h-3 w-3" />
              {formatMoney(computedSummary.totalNet)}
            </span>
          </div>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Mã Đơn</th>
                <th className="px-4 py-3 text-left font-semibold">Sân</th>
                <th className="px-4 py-3 text-left font-semibold">
                  Khách hàng
                </th>
                <th className="px-4 py-3 text-left font-semibold">Liên hệ</th>
                <th className="px-4 py-3 text-right font-semibold">
                  Tổng tiền
                </th>
                <th className="px-4 py-3 text-right font-semibold">Phí nền</th>
                <th className="px-4 py-3 text-right font-semibold">Net nhận</th>
                <th className="px-4 py-3 text-left font-semibold">Booking</th>
                <th className="px-4 py-3 text-left font-semibold">
                  Thanh toán
                </th>
                <th className="px-4 py-3 text-left font-semibold">Check-in</th>
                <th className="px-4 py-3 text-left font-semibold">QtyID</th>
                <th className="px-4 py-3 text-left font-semibold">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {financeData.map((booking) => (
                <tr
                  key={`booking-${booking.booking_code}`}
                  className="hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    #{booking.booking_code}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">
                      {booking.field_name || `Sân #${booking.field_code}`}
                    </div>
                    <div className="text-xs text-slate-500">
                      #{booking.field_code}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">
                      {booking.customer_name || "Khách lẻ"}
                    </div>
                    <div className="text-xs text-slate-500">
                      ID: {booking.customer_user_id ?? "Không có"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    <div>{booking.customer_email || "—"}</div>
                    <div>{booking.customer_phone || "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {formatMoney(booking.total_price)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {formatMoney(booking.platform_fee)}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                    {formatMoney(booking.net_to_shop)}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold capitalize text-slate-600">
                    {booking.booking_status || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold capitalize text-slate-600">
                    {booking.payment_status || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {booking.checkin_code || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {booking.quantity_id ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDateTime(booking.create_at)}
                  </td>
                </tr>
              ))}
              {!financeData.length && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-sm text-slate-500"
                    colSpan={12}
                  >
                    {loading
                      ? "Đang tải dữ liệu..."
                      : "Không có booking nào theo bộ lọc hiện tại."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
