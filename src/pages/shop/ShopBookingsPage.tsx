import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import type { BookingItem } from "../../models/booking.api";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { api } from "../../models/api";
import { extractErrorMessage } from "../../models/api.helpers";
import {
  getBookingStatusBadge,
  getPaymentStatusBadge,
} from "../../utils/statusLabels";

const ITEMS_PER_PAGE = 10;

type BookingStatusFilter =
  | "all"
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

const ShopBookingsPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    limit: ITEMS_PER_PAGE,
    offset: 0,
    total: 0,
  });
  const [summary, setSummary] = useState({
    bookingStatus: {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    },
    paymentStatus: {
      pending: 0,
      paid: 0,
      failed: 0,
      refunded: 0,
    },
  });

  useEffect(() => {
    let ignore = false;

    if (!user?.user_code) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: Record<string, any> = {
          limit: ITEMS_PER_PAGE,
          offset: (page - 1) * ITEMS_PER_PAGE,
          sort: "CreateAt",
          order: "DESC",
        };
        if (statusFilter !== "all") {
          params.status = statusFilter;
        }
        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }

        const response = await api.get("/shops/me/bookings", { params });
        const payload = response.data;
        if (!payload?.success) {
          throw new Error(
            payload?.error?.message ||
              payload?.message ||
              "Không thể tải danh sách đặt sân"
          );
        }

        const result = payload.data ?? {};
        if (ignore) return;

        const rows = Array.isArray(result.data) ? result.data : [];
        setBookings(rows);
        setPagination(
          result.pagination ?? {
            limit: ITEMS_PER_PAGE,
            offset: (page - 1) * ITEMS_PER_PAGE,
            total: rows.length,
          }
        );
        setSummary({
          bookingStatus: {
            pending: result.summary?.bookingStatus?.pending ?? 0,
            confirmed: result.summary?.bookingStatus?.confirmed ?? 0,
            completed: result.summary?.bookingStatus?.completed ?? 0,
            cancelled: result.summary?.bookingStatus?.cancelled ?? 0,
          },
          paymentStatus: {
            pending: result.summary?.paymentStatus?.pending ?? 0,
            paid: result.summary?.paymentStatus?.paid ?? 0,
            failed: result.summary?.paymentStatus?.failed ?? 0,
            refunded: result.summary?.paymentStatus?.refunded ?? 0,
          },
        });
      } catch (err) {
        if (!ignore) {
          setError(extractErrorMessage(err, "Không thể tải danh sách đặt sân"));
          setBookings([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchBookings();
    return () => {
      ignore = true;
    };
  }, [user?.user_code, statusFilter, searchTerm, page]);

  const totalBookings =
    summary.bookingStatus.pending +
    summary.bookingStatus.confirmed +
    summary.bookingStatus.completed +
    summary.bookingStatus.cancelled;
  const totalPages = Math.max(
    1,
    Math.ceil(pagination.total / pagination.limit || ITEMS_PER_PAGE)
  );
  const startIndex = pagination.total === 0 ? 0 : pagination.offset + 1;
  const endIndex =
    pagination.total === 0
      ? 0
      : Math.min(pagination.offset + bookings.length, pagination.total);

  const stats = {
    total: totalBookings,
    pending: summary.bookingStatus.pending,
    confirmed: summary.bookingStatus.confirmed,
    cancelled: summary.bookingStatus.cancelled,
  };

  const heroStats = [
    {
      label: "Tổng đơn",
      value: stats.total,
      description: "Toàn bộ đơn đặt",
    },
    {
      label: "Đang chờ",
      value: stats.pending,
      description: "Cần xác nhận",
    },
    {
      label: "Đã xác nhận",
      value: stats.confirmed,
      description: "Sẵn sàng phục vụ",
    },
    {
      label: "Đã hủy",
      value: stats.cancelled,
      description: "Cần theo dõi",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 text-white shadow-lg">
          <div className="space-y-6 p-6 md:p-8">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                Trung tâm đặt sân
              </p>
              <h1 className="text-3xl font-bold leading-tight md:text-4xl">
                Quản lý đơn đặt của bạn
              </h1>
              <p className="text-sm text-white/80 md:text-base">
                Theo dõi trạng thái thanh toán, lịch sử đặt sân và xử lý nhanh
                mọi yêu cầu của khách hàng.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {heroStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/20 bg-white/10 p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-white/70">
                    {item.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {item.value.toLocaleString("vi-VN")}
                  </p>
                  <p className="text-sm text-white/70">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-emerald-200"></div>
              <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, số điện thoại, mã check-in..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-lg border border-gray-300 px-10 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as BookingStatusFilter);
                    setPage(1);
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  <option value="all">Tất cả đơn ({stats.total})</option>
                  <option value="pending">
                    Đang chờ ({summary.bookingStatus.pending})
                  </option>
                  <option value="confirmed">
                    Đã xác nhận ({summary.bookingStatus.confirmed})
                  </option>
                  <option value="completed">
                    Đã hoàn tất ({summary.bookingStatus.completed})
                  </option>
                  <option value="cancelled">
                    Đã hủy ({summary.bookingStatus.cancelled})
                  </option>
                </select>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              {bookings.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="mb-2 text-5xl text-gray-300">∅</div>
                  <p className="mb-1 text-gray-700 font-semibold">
                    Không có dữ liệu
                  </p>
                  <p className="text-sm text-gray-500">
                    {searchTerm
                      ? "Không tìm thấy kết quả phù hợp với từ khóa."
                      : "Chưa có đơn đặt nào trong thời gian này."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 px-4 py-6 sm:px-6">
                    {bookings.map((booking) => {
                      const paymentBadge = getPaymentStatusBadge(
                        booking.PaymentStatus
                      );
                      const bookingBadge = getBookingStatusBadge(
                        booking.BookingStatus
                      );
                      const slotDate =
                        booking.slots && booking.slots.length
                          ? new Date(
                              booking.slots[0].PlayDate
                            ).toLocaleDateString("vi-VN")
                          : null;
                      const quantityNumber = (booking as any).quantityNumber;

                      return (
                        <div
                          key={booking.BookingCode}
                          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-black/5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs uppercase text-slate-500">
                                Mã đơn
                              </p>
                              <p className="text-2xl font-semibold text-slate-900">
                                #{booking.BookingCode}
                              </p>
                              <p className="text-sm text-slate-600">
                                {booking.FieldName || `Sân ${booking.FieldCode}`}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${paymentBadge.className}`}
                              >
                                Thanh toán: {paymentBadge.label}
                              </span>
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${bookingBadge.className}`}
                              >
                                Đơn: {bookingBadge.label}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-4 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <p className="text-xs uppercase text-slate-500">
                                Khách hàng
                              </p>
                              <p className="font-semibold text-slate-900">
                                {booking.CustomerName ||
                                  `Khách #${booking.CustomerUserID}`}
                              </p>
                              <p>{booking.CustomerPhone || "Không có số"}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-slate-500">
                                Check-in
                              </p>
                              <p className="font-mono text-slate-900">
                                {booking.CheckinCode || "-"}
                              </p>
                              {quantityNumber ? (
                                <p className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                  Sân {quantityNumber}
                                </p>
                              ) : null}
                            </div>
                            <div>
                              <p className="text-xs uppercase text-slate-500">
                                Tổng tiền
                              </p>
                              <p className="text-lg font-semibold text-slate-900">
                                {booking.TotalPrice?.toLocaleString("vi-VN")}đ
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="text-xs uppercase text-slate-500">
                              Thời gian thi đấu
                            </p>
                            {slotDate ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-900 ring-1 ring-slate-200">
                                  {slotDate}
                                </span>
                                {booking.slots?.map((slot) => (
                                  <span
                                    key={slot.Slot_ID}
                                    className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                                  >
                                    {slot.StartTime?.substring(0, 5)} -{" "}
                                    {slot.EndTime?.substring(0, 5)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-slate-500">
                                Chưa cập nhật lịch chơi
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-600">
                      <div>
                        Hiển thị {startIndex || 0} đến {endIndex} trong{" "}
                        {pagination.total} đơn
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="rounded-lg border border-gray-300 p-2 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          ).map((pageNumber) => (
                            <button
                              key={pageNumber}
                              onClick={() => setPage(pageNumber)}
                              className={`h-8 w-8 rounded-lg border text-sm font-medium transition ${
                                pageNumber === page
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {pageNumber}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={page === totalPages}
                          className="rounded-lg border border-gray-300 p-2 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default ShopBookingsPage;
