import React, { useEffect, useState, useMemo } from "react";
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
    failedPayments: summary.paymentStatus.failed,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quản lý Đơn Đặt
          </h1>
          <p className="text-gray-600">
            Theo dõi và quản lý tất cả đơn đặt sân của bạn
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mx-auto mb-4"></div>
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-gray-600 text-sm font-medium mb-2">
                  Tổng Đơn
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.total}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Tất cả các đơn đặt
                </div>
              </div>

              <div className="bg-white rounded-lg border border-amber-200 p-6 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-amber-50">
                <div className="text-amber-800 text-sm font-medium mb-2">
                  Đang Chờ
                </div>
                <div className="text-3xl font-bold text-amber-900">
                  {stats.pending}
                </div>
                <div className="text-xs text-amber-700 mt-2">
                  Đơn chờ xác nhận
                </div>
              </div>

              <div className="bg-white rounded-lg border border-emerald-200 p-6 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-emerald-50">
                <div className="text-emerald-800 text-sm font-medium mb-2">
                  Đã Xác Nhận
                </div>
                <div className="text-3xl font-bold text-emerald-900">
                  {stats.confirmed}
                </div>
                <div className="text-xs text-emerald-700 mt-2">
                  Sẵn sàng phục vụ
                </div>
              </div>

              <div className="bg-white rounded-lg border border-red-200 p-6 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-red-50">
                <div className="text-red-800 text-sm font-medium mb-2">
                  Huỷ đơn đặt
                </div>
                <div className="text-3xl font-bold text-red-900">
                  {stats.failedPayments}
                </div>
                <div className="text-xs text-red-700 mt-2">
                  Cần xử lý thủ công
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, số điện thoại, mã Checkin..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>

                {/* Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as BookingStatusFilter);
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                >
                  <option value="all">Tất cả đơn ({stats.total})</option>
                  <option value="pending">
                    Đang chờ ({summary.bookingStatus.pending})
                  </option>
                  <option value="confirmed">
                    Đã xác nhận ({summary.bookingStatus.confirmed})
                  </option>
                  
                  <option value="cancelled">
                    Đã hủy ({summary.bookingStatus.cancelled})
                  </option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {bookings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-gray-400 mb-2 text-5xl">∅</div>
                  <p className="text-gray-600 font-medium mb-1">
                    Không có dữ liệu
                  </p>
                  <p className="text-gray-500 text-sm">
                    {searchTerm
                      ? "Không tìm thấy kết quả phù hợp"
                      : "Chưa có đơn đặt nào"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto -mx-4 md:mx-0">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Mã
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Sân
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Số Sân
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Khách
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Số Điện Thoại
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Mã Check-in
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Ngày & Giờ
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Tiền
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Thanh Toán
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Trạng Thái
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {bookings.map((b) => {
                          const paymentBadge = getPaymentStatusBadge(
                            b.PaymentStatus
                          );
                          const bookingBadge = getBookingStatusBadge(
                            b.BookingStatus
                          );
                          return (
                            <tr
                              key={b.BookingCode}
                              className="hover:bg-blue-50 transition-colors"
                            >
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                {b.BookingCode}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {b.FieldName || `Sân ${b.FieldCode}`}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {(b as any).quantityNumber ? (
                                  <span className="inline-block px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                                    Sân {(b as any).quantityNumber}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs">
                                    -
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {b.CustomerName || `Khách #${b.CustomerUserID}`}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {b.CustomerPhone || "-"}
                              </td>
                              <td className="px-6 py-4 text-sm font-mono text-gray-700">
                                {b.CheckinCode || "-"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {b.slots && b.slots.length > 0 ? (
                                  <>
                                    <div>
                                      {new Date(
                                        b.slots[0].PlayDate
                                      ).toLocaleDateString("vi-VN")}
                                    </div>
                                    <div className="text-gray-500 text-xs flex flex-col gap-1">
                                      {b.slots.map((slot) => (
                                        <span key={slot.Slot_ID}>
                                          {slot.StartTime?.substring(0, 5)} -{" "}
                                          {slot.EndTime?.substring(0, 5)}
                                        </span>
                                      ))}
                                    </div>
                                  </>
                                ) : (
                                  <div>-</div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                                {b.TotalPrice?.toLocaleString("vi-VN")}đ
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${paymentBadge.className}`}
                                >
                                  {paymentBadge.label}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${bookingBadge.className}`}
                                >
                                  {bookingBadge.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Hiển thị {startIndex || 0} đến {endIndex} trong{" "}
                        {pagination.total} đơn
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          ).map((pageNumber) => (
                            <button
                              key={pageNumber}
                              onClick={() => setPage(pageNumber)}
                              className={`w-8 h-8 rounded-lg border text-sm font-medium transition ${
                                pageNumber === page
                                  ? "bg-blue-600 text-white border-blue-600"
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
                          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShopBookingsPage;
