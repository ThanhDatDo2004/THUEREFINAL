import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import type { BookingItem } from "../../models/booking.api";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { api } from "../../models/api";

const ITEMS_PER_PAGE = 10;

const ShopBookingsPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "paid" | "failed"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!user?.user_code) return;
      setLoading(true);
      try {
        // Fetch all bookings - no search parameter
        const bookingsResponse = await api.get<any>("/shops/me/bookings");

        if (ignore) return;

        const bookingData =
          bookingsResponse.data?.data?.data ||
          bookingsResponse.data?.data ||
          [];
        setBookings(Array.isArray(bookingData) ? bookingData : []);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        if (!ignore) {
          setBookings([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [user?.user_code]);

  // Filter by status and search - client-side filtering
  const filteredBookings = useMemo(() => {
    try {
      let result = bookings;

      if (statusFilter !== "all") {
        result = result.filter((b) => b.PaymentStatus === statusFilter);
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        result = result.filter((b) => {
          // Convert all searchable fields to string and check includes
          const bookingCode = String(b.BookingCode || "").toLowerCase();
          const fieldName = String(b.FieldName || "").toLowerCase();
          const customerPhone = String(b.CustomerPhone || "").toLowerCase();
          const checkinCode = String(b.CheckinCode || "").toLowerCase();
          const customerName = String(b.CustomerName || "").toLowerCase();

          return (
            bookingCode.includes(term) ||
            fieldName.includes(term) ||
            customerPhone.includes(term) ||
            checkinCode.includes(term) ||
            customerName.includes(term)
          );
        });
      }

      return result;
    } catch (error) {
      console.error("Error filtering bookings:", error);
      return [];
    }
  }, [bookings, statusFilter, searchTerm]);

  // Pagination
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBookings.length / ITEMS_PER_PAGE)
  );

  // Auto-reset currentPage if it exceeds totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Statistics
  const stats = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter((b) => b.PaymentStatus === "pending").length,
      paid: bookings.filter((b) => b.PaymentStatus === "paid").length,
      failed: bookings.filter((b) => b.PaymentStatus === "failed").length,
    }),
    [bookings]
  );

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getBookingStatusBadgeColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-50 text-green-700 border-green-200";
      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      case "pending":
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getBookingStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "completed":
        return "Hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Đã thanh toán";
      case "pending":
        return "Chờ thanh toán";
      case "failed":
        return "Thất bại";
      default:
        return status;
    }
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
                  Chờ Thanh Toán
                </div>
                <div className="text-3xl font-bold text-amber-900">
                  {stats.pending}
                </div>
                <div className="text-xs text-amber-700 mt-2">
                  Đang chờ xử lý
                </div>
              </div>

              <div className="bg-white rounded-lg border border-emerald-200 p-6 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-emerald-50">
                <div className="text-emerald-800 text-sm font-medium mb-2">
                  Đã Thanh Toán
                </div>
                <div className="text-3xl font-bold text-emerald-900">
                  {stats.paid}
                </div>
                <div className="text-xs text-emerald-700 mt-2">
                  Hoàn thành thanh toán
                </div>
              </div>

              <div className="bg-white rounded-lg border border-red-200 p-6 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-red-50">
                <div className="text-red-800 text-sm font-medium mb-2">
                  Thất Bại
                </div>
                <div className="text-3xl font-bold text-red-900">
                  {stats.failed}
                </div>
                <div className="text-xs text-red-700 mt-2">
                  Thanh toán thất bại
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
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>

                {/* Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as typeof statusFilter);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                >
                  <option value="all">Tất cả Trạng Thái ({stats.total})</option>
                  <option value="pending">
                    Chờ Thanh Toán ({stats.pending})
                  </option>
                  <option value="paid">Đã Thanh Toán ({stats.paid})</option>
                  <option value="failed">Thất Bại ({stats.failed})</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {filteredBookings.length === 0 ? (
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
                        {paginatedBookings.map((b) => (
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
                                <span className="text-gray-400 text-xs">-</span>
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
                                className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(
                                  b.PaymentStatus
                                )}`}
                              >
                                {getPaymentStatusLabel(b.PaymentStatus)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getBookingStatusBadgeColor(
                                  b.BookingStatus
                                )}`}
                              >
                                {getBookingStatusLabel(b.BookingStatus)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} đến{" "}
                        {Math.min(
                          currentPage * ITEMS_PER_PAGE,
                          filteredBookings.length
                        )}{" "}
                        trong {filteredBookings.length} đơn
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          ).map((page) => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-8 h-8 rounded-lg border text-sm font-medium transition ${
                                page === currentPage
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
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
