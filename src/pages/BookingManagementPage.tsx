import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getMyBookingsApi,
  getBookingDetailApi,
  cancelBookingApi,
  getCheckinCodeApi,
  verifyCheckinApi,
  BookingItem,
  BookingDetail,
} from "../models/booking.api";
import { extractErrorMessage } from "../models/api.helpers";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Layout from "../components/layouts/Layout";
import { Calendar, Clock, MapPin, DollarSign, Check, X, Eye, Copy } from "lucide-react";

interface BookingManagementState {
  view: "list" | "detail";
  loading: boolean;
  error: string | null;
  bookings: BookingItem[];
  selectedBooking: BookingDetail | null;
  totalBookings: number;
  currentPage: number;
  statusFilter: string;
  checkinCode: string | null;
  showCheckinModal: boolean;
  verifyingCheckin: boolean;
  cancelingBooking: boolean;
}

const BookingManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookingCode } = useParams<{ bookingCode: string }>();
  const [state, setState] = useState<BookingManagementState>({
    view: bookingCode ? "detail" : "list",
    loading: true,
    error: null,
    bookings: [],
    selectedBooking: null,
    totalBookings: 0,
    currentPage: 0,
    statusFilter: "all",
    checkinCode: null,
    showCheckinModal: false,
    verifyingCheckin: false,
    cancelingBooking: false,
  });

  const itemsPerPage = 10;

  // Load bookings list
  useEffect(() => {
    if (state.view === "list") {
      loadBookings();
    }
  }, [state.statusFilter, state.view]);

  // Load booking detail if bookingCode is provided
  useEffect(() => {
    if (bookingCode) {
      loadBookingDetail(bookingCode);
    }
  }, [bookingCode]);

  const loadBookings = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const status =
        state.statusFilter === "all" ? undefined : (state.statusFilter as any);
      const response = await getMyBookingsApi(
        status,
        itemsPerPage,
        state.currentPage * itemsPerPage
      );

      if (response.success && response.data) {
        setState((prev) => ({
          ...prev,
          bookings: response.data.data,
          totalBookings: response.data.pagination.total,
          loading: false,
        }));
      }
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to load bookings");
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
    }
  };

  const loadBookingDetail = async (code: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getBookingDetailApi(code);

      if (response.success && response.data) {
        setState((prev) => ({
          ...prev,
          selectedBooking: response.data,
          view: "detail",
          loading: false,
        }));
      }
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to load booking detail");
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
    }
  };

  const handleCancelBooking = async () => {
    if (!state.selectedBooking) return;

    const reason = prompt("Lý do hủy đặt sân (tùy chọn):");
    if (reason === null) return; // User cancelled

    try {
      setState((prev) => ({ ...prev, cancelingBooking: true }));
      await cancelBookingApi(state.selectedBooking.BookingCode, reason || undefined);

      // Reload booking detail
      await loadBookingDetail(state.selectedBooking.BookingCode);
      setState((prev) => ({ ...prev, cancelingBooking: false }));
      alert("Hủy đặt sân thành công");
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to cancel booking");
      setState((prev) => ({ ...prev, error: errorMsg, cancelingBooking: false }));
      alert(errorMsg);
    }
  };

  const handleGetCheckinCode = async () => {
    if (!state.selectedBooking) return;

    try {
      const response = await getCheckinCodeApi(state.selectedBooking.BookingCode);
      if (response.success && response.data) {
        setState((prev) => ({
          ...prev,
          checkinCode: response.data.checkinCode,
          showCheckinModal: true,
        }));
      }
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to get checkin code");
      alert(errorMsg);
    }
  };

  const handleCopyCheckinCode = async () => {
    if (state.checkinCode) {
      try {
        await navigator.clipboard.writeText(state.checkinCode);
        alert("Mã check-in đã được sao chép");
      } catch {
        alert("Không thể sao chép mã check-in");
      }
    }
  };

  const handleVerifyCheckin = async () => {
    if (!state.selectedBooking || !state.checkinCode) return;

    try {
      setState((prev) => ({ ...prev, verifyingCheckin: true }));
      await verifyCheckinApi(state.selectedBooking.BookingCode, state.checkinCode);
      setState((prev) => ({
        ...prev,
        showCheckinModal: false,
        verifyingCheckin: false,
      }));
      alert("Check-in thành công");
      await loadBookingDetail(state.selectedBooking.BookingCode);
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to verify checkin");
      setState((prev) => ({ ...prev, verifyingCheckin: false }));
      alert(errorMsg);
    }
  };

  const handleLoadMore = async () => {
    const nextPage = state.currentPage + 1;
    setState((prev) => ({ ...prev, currentPage: nextPage }));
    await loadBookings();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (state.loading && state.view === "list" && state.bookings.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  // DETAIL VIEW
  if (state.view === "detail" && state.selectedBooking) {
    const booking = state.selectedBooking;
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <button
                  onClick={() => setState((prev) => ({ ...prev, view: "list" }))}
                  className="text-blue-600 hover:text-blue-800 font-semibold mb-2"
                >
                  ← Quay Lại
                </button>
                <h1 className="text-3xl font-bold text-gray-900">
                  Chi Tiết Đặt Sân
                </h1>
                <p className="text-gray-600">{booking.BookingCode}</p>
              </div>
            </div>

            {/* Error */}
            {state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600">{state.error}</p>
              </div>
            )}

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  Trạng Thái Đặt Sân
                </h3>
                <span
                  className={`px-4 py-2 rounded-full font-semibold ${getStatusBadgeColor(
                    booking.BookingStatus
                  )}`}
                >
                  {booking.BookingStatus === "pending" && "Đang Chờ"}
                  {booking.BookingStatus === "confirmed" && "Đã Xác Nhận"}
                  {booking.BookingStatus === "completed" && "Hoàn Thành"}
                  {booking.BookingStatus === "cancelled" && "Đã Hủy"}
                </span>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  Trạng Thái Thanh Toán
                </h3>
                <span
                  className={`px-4 py-2 rounded-full font-semibold ${getPaymentBadgeColor(
                    booking.PaymentStatus
                  )}`}
                >
                  {booking.PaymentStatus === "pending" && "Chưa Thanh Toán"}
                  {booking.PaymentStatus === "paid" && "Đã Thanh Toán"}
                  {booking.PaymentStatus === "failed" && "Thất Bại"}
                  {booking.PaymentStatus === "refunded" && "Đã Hoàn Tiền"}
                </span>
              </div>
            </div>

            {/* Booking Details */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông Tin Chi Tiết</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 text-sm">Ngày Chơi</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {booking.PlayDate
                        ? new Date(booking.PlayDate).toLocaleDateString("vi-VN")
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Thời Gian</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {booking.slots && booking.slots.length > 0
                        ? `${booking.slots[0].StartTime} - ${booking.slots[0].EndTime}`
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 text-sm">Sân</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {booking.FieldName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Cửa Hàng</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {booking.ShopName || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông Tin Khách Hàng</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Tên Khách Hàng</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {booking.CustomerName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Email</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {booking.CustomerEmail || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Số Điện Thoại</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {booking.CustomerPhone || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing Details */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Chi Phí</h2>

              <div className="space-y-3 mb-4 pb-4 border-b">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Giá Sân</span>
                  <span className="font-semibold text-gray-900">
                    {booking.TotalPrice.toLocaleString("vi-VN")}₫
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Phí Nền Tảng (5%)</span>
                  <span className="font-semibold text-red-600">
                    -{booking.PlatformFee.toLocaleString("vi-VN")}₫
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Số Tiền Cho Cửa Hàng (95%)</span>
                  <span className="font-semibold text-green-600">
                    {booking.NetToShop.toLocaleString("vi-VN")}₫
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xl font-bold">
                <span>Tổng Cộng</span>
                <span className="text-blue-600">
                  {booking.TotalPrice.toLocaleString("vi-VN")}₫
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {booking.PaymentStatus === "pending" && (
                <a
                  href={`/payment/${booking.BookingCode}`}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                  <DollarSign className="w-5 h-5" />
                  Thanh Toán
                </a>
              )}

              {booking.BookingStatus === "confirmed" &&
                booking.PaymentStatus === "paid" && (
                  <button
                    onClick={handleGetCheckinCode}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                  >
                    <Check className="w-5 h-5" />
                    Check-in
                  </button>
                )}

              {booking.BookingStatus !== "cancelled" &&
                booking.BookingStatus !== "completed" && (
                  <button
                    onClick={handleCancelBooking}
                    disabled={state.cancelingBooking}
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                    {state.cancelingBooking ? "Đang Hủy..." : "Hủy Đặt Sân"}
                  </button>
                )}
            </div>

            {/* Checkin Modal */}
            {state.showCheckinModal && state.checkinCode && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-8 max-w-md w-full">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Mã Check-in
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Sử dụng mã này để check-in tại quầy:
                  </p>

                  <div className="bg-gray-100 rounded-lg p-4 mb-6">
                    <p className="text-4xl font-bold text-center text-blue-600 font-mono">
                      {state.checkinCode}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCopyCheckinCode}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      <Copy className="w-5 h-5" />
                      Sao Chép
                    </button>
                    <button
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          showCheckinModal: false,
                        }))
                      }
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // LIST VIEW
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Quản Lý Đặt Sân
            </h1>
            <p className="text-gray-600">Xem và quản lý tất cả các đặt sân của bạn</p>
          </div>

          {/* Error */}
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{state.error}</p>
            </div>
          )}

          {/* Filter */}
          <div className="mb-6">
            <select
              value={state.statusFilter}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  statusFilter: e.target.value,
                  currentPage: 0,
                }))
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Tất Cả</option>
              <option value="pending">Đang Chờ</option>
              <option value="confirmed">Đã Xác Nhận</option>
              <option value="completed">Hoàn Thành</option>
              <option value="cancelled">Đã Hủy</option>
            </select>
          </div>

          {/* Bookings Grid */}
          {state.bookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {state.bookings.map((booking) => (
                <div
                  key={booking.BookingCode}
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl transition overflow-hidden"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {booking.FieldName}
                        </h3>
                        <p className="text-sm text-gray-600">{booking.ShopName}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(
                          booking.BookingStatus
                        )}`}
                      >
                        {booking.BookingStatus === "pending" && "Đang Chờ"}
                        {booking.BookingStatus === "confirmed" && "Đã Xác Nhận"}
                        {booking.BookingStatus === "completed" && "Hoàn Thành"}
                        {booking.BookingStatus === "cancelled" && "Đã Hủy"}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4 pb-4 border-b">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          {new Date(booking.PlayDate).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">
                          {booking.StartTime} - {booking.EndTime}
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <p className="text-gray-600 text-sm">Giá Sân</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {booking.TotalPrice.toLocaleString("vi-VN")}₫
                      </p>
                    </div>

                    {/* Payment Status */}
                    <div className="mb-6">
                      <p className="text-gray-600 text-sm">Thanh Toán</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getPaymentBadgeColor(
                          booking.PaymentStatus
                        )}`}
                      >
                        {booking.PaymentStatus === "pending" && "Chưa Thanh Toán"}
                        {booking.PaymentStatus === "paid" && "Đã Thanh Toán"}
                        {booking.PaymentStatus === "failed" && "Thất Bại"}
                        {booking.PaymentStatus === "refunded" && "Đã Hoàn Tiền"}
                      </span>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => navigate(`/bookings/${booking.BookingCode}`)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      <Eye className="w-5 h-5" />
                      Xem Chi Tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 text-lg">Không có đặt sân nào</p>
            </div>
          )}

          {/* Load More */}
          {state.bookings.length < state.totalBookings && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={state.loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition"
              >
                {state.loading ? "Đang Tải..." : "Xem Thêm"}
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BookingManagementPage;
