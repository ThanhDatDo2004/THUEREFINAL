import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  FileText,
} from "lucide-react";
import { extractErrorMessage } from "../models/api.helpers";
import { getBookingDetailApi, type BookingDetail } from "../models/booking.api";

type BookingDetailPageState = BookingDetail & {
  transactionId?: string;
};

const formatCurrency = (value?: number) => {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(value);
};

const getStatusBadge = (status: string) => {
  const mapping: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Chờ xác nhận" },
    confirmed: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      label: "Đã xác nhận",
    },
    cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Đã hủy" },
    completed: { bg: "bg-blue-100", text: "text-blue-700", label: "Hoàn thành" },
  };
  const config = mapping[status] || mapping.pending;
  return { ...config, value: status };
};

const getPaymentStatusBadge = (status: string) => {
  const mapping: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Chưa thanh toán" },
    paid: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Đã thanh toán" },
    failed: { bg: "bg-red-100", text: "text-red-700", label: "Thanh toán thất bại" },
    refunded: { bg: "bg-gray-100", text: "text-gray-700", label: "Đã hoàn tiền" },
  };
  const config = mapping[status] || mapping.pending;
  return { ...config, value: status };
};

const BookingDetailPage: React.FC = () => {
  const { bookingCode } = useParams<{ bookingCode: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BookingDetailPageState | null>(null);

  useEffect(() => {
    let ignore = false;
    if (!bookingCode) {
      setError("Thiếu mã booking.");
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("🔍 BookingDetailPage: bookingCode param =", bookingCode);
        const res = await getBookingDetailApi(bookingCode);
        console.log("✅ Booking detail response:", res);
        if (!ignore) setData(res.data || {});
      } catch (err: unknown) {
        console.error("❌ Error fetching booking detail:", err);
        if (!ignore)
          setError(
            extractErrorMessage(
              err,
              "Không thể tải chi tiết đặt sân. Vui lòng thử lại."
            )
          );
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [bookingCode]);

  if (loading) {
    return (
      <div className="page bg-slate-50/80 pb-10 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-700">
          <div className="h-8 w-8 rounded-full border-3 border-gray-300 border-t-emerald-500 animate-spin" />
          <span className="text-lg">Đang tải chi tiết đặt sân...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page bg-slate-50/80 pb-10 min-h-screen flex items-center justify-center px-4">
        <div className="container max-w-2xl">
          <div className="section text-center space-y-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Lỗi tải dữ liệu
              </h2>
              <p className="text-gray-600 text-lg">{error}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate(-1)}
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </button>
              <button
                onClick={() => navigate("/")}
                className="btn-ghost inline-flex items-center justify-center gap-2"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.BookingCode) {
    return (
      <div className="page bg-slate-50/80 pb-10 min-h-screen flex items-center justify-center px-4">
        <div className="container max-w-2xl">
          <div className="section text-center space-y-6">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Không tìm thấy đặt sân
              </h2>
              <p className="text-gray-600">
                Mã booking không hợp lệ hoặc đã bị xóa.
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const bookingStatusBadge = getStatusBadge(data.BookingStatus || "pending");
  const paymentStatusBadge = getPaymentStatusBadge(data.PaymentStatus || "pending");

  return (
    <div className="page bg-slate-50/80 pb-10">
      <div className="container max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="btn-link inline-flex items-center gap-2 text-sm mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại
        </button>

        <div className="section space-y-6">
          {/* Header */}
          <div className="space-y-4 pb-6 border-b border-gray-200">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Chi Tiết Đặt Sân
                </h1>
                <p className="text-sm text-gray-500">
                  Mã booking: <span className="font-mono font-semibold text-gray-900">{data.BookingCode}</span>
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold text-center ${bookingStatusBadge.bg} ${bookingStatusBadge.text}`}
                >
                  {bookingStatusBadge.label}
                </span>
                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold text-center ${paymentStatusBadge.bg} ${paymentStatusBadge.text}`}
                >
                  {paymentStatusBadge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Field & Shop Info */}
          {(data.FieldName || data.ShopName) && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Sân
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {data.FieldName || "-"}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Cơ sở
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {data.ShopName || "-"}
                </p>
              </div>
            </div>
          )}

          {/* Booking Time & Price */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-2 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Ngày thi đấu
              </p>
              <p className="text-2xl font-bold text-emerald-900">
                {data.PlayDate
                  ? new Date(data.PlayDate).toLocaleDateString("vi-VN")
                  : "-"}
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-2 flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Tổng tiền
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(data.TotalPrice)}
              </p>
            </div>
          </div>

          {/* Time Slots */}
          {data.slots && data.slots.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Clock className="w-5 h-5" />
                Khung giờ đã đặt
              </div>
              <div className="rounded-lg border border-gray-200 divide-y bg-white">
                {data.slots.map((slot: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="text-sm text-gray-600">
                      {slot.PlayDate ? new Date(slot.PlayDate).toLocaleDateString("vi-VN") : "-"}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {slot.StartTime} - {slot.EndTime}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      {slot.Status || "booked"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer Info */}
          {(data.CustomerName || data.CustomerEmail || data.CustomerPhone) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <FileText className="w-5 h-5" />
                Thông tin người đặt
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                {data.CustomerName && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                      Họ và tên
                    </p>
                    <p className="text-gray-900">{data.CustomerName}</p>
                  </div>
                )}
                {data.CustomerEmail && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                      Email
                    </p>
                    <p className="text-gray-900 break-all">{data.CustomerEmail}</p>
                  </div>
                )}
                {data.CustomerPhone && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                      Số điện thoại
                    </p>
                    <p className="text-gray-900">{data.CustomerPhone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => navigate(`/bookings/${data.BookingCode}/checkin-code`)}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Xem Mã Check-In
            </button>
            <button
              onClick={() => navigate(-1)}
              className="btn-ghost flex-1"
            >
              Quay lại
            </button>
          </div>

          {/* Info Note */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <p className="font-semibold mb-1">📌 Thông tin cần biết:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Vui lòng đến sân 15 phút trước giờ đặt</li>
              <li>Mang theo mã check-in để xác nhận khi check-in</li>
              <li>Liên hệ cơ sở nếu có thay đổi lịch</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailPage;
