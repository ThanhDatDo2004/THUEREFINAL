import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, AlertCircle, FileText } from "lucide-react";
import { extractErrorMessage } from "../models/api.helpers";
import {
  getBookingStatusBadge,
  getPaymentStatusBadge,
} from "../utils/statusLabels";
import { getBookingDetailApi, type BookingDetail } from "../models/booking.api";

type BookingDetailPageState = BookingDetail & {
  transactionId?: string;
  quantityID?: number;
  quantityNumber?: number;
};

const formatCurrency = (value?: number) => {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(value);
};

const getSlotStatusBadge = (status?: string | null) => {
  const normalized = String(status ?? "").toLowerCase();
  if (
    ["held", "holding", "on_hold", "pending", "pending_hold"].includes(
      normalized
    )
  ) {
    return {
      bg: "bg-amber-100",
      text: "text-amber-700",
      label: "Đang giữ chỗ",
    };
  }
  if (["cancelled", "canceled"].includes(normalized)) {
    return {
      bg: "bg-red-100",
      text: "text-red-700",
      label: "Đã hủy",
    };
  }
  if (["available"].includes(normalized)) {
    return {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      label: "Trống",
    };
  }
  if (["booked", "confirmed", "reserved"].includes(normalized)) {
    return {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      label: "Đã đặt",
    };
  }
  return {
    bg: "bg-gray-100",
    text: "text-gray-700",
    label: status || "Không xác định",
  };
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
        if (!ignore)
          setData(res.data ? (res.data as BookingDetailPageState) : null);
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

  const isCancellationPending =
    data.BookingStatus === "cancellation_pending" ||
    data.cancellation?.status === "pending";
  const bookingStatusBadge = isCancellationPending
    ? {
        label: "Đang chờ hủy",
        className: "bg-amber-100 text-amber-800 border-amber-200",
      }
    : getBookingStatusBadge(data.BookingStatus || "pending");
  const paymentStatusBadge = getPaymentStatusBadge(
    data.PaymentStatus || "pending"
  );

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
                  Mã booking:{" "}
                  <span className="font-mono font-semibold text-gray-900">
                    {data.BookingCode}
                  </span>
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold text-center ${bookingStatusBadge.className}`}
                >
                  {bookingStatusBadge.label}
                </span>
                {isCancellationPending && (
                  <p className="text-xs text-amber-600 text-center">
                    Yêu cầu hủy đang chờ chủ sân xác nhận qua email.
                  </p>
                )}
                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold text-center ${paymentStatusBadge.className}`}
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
                  Chi nhánh
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
                Sân
              </p>
              <span className="text-2xl font-bold text-emerald-900">
                Sân {data.slots[0].QuantityNumber}
              </span>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-2 flex items-center gap-1">
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
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="text-sm text-gray-600">
                      {slot.PlayDate
                        ? new Date(slot.PlayDate).toLocaleDateString("vi-VN")
                        : "-"}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {slot.StartTime} - {slot.EndTime}
                    </span>
                    <div className="flex items-center gap-2">
                      {typeof slot.QuantityID === "number" && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          Sân {slot.QuantityNumber}
                        </span>
                      )}
                      {(() => {
                        const badge = getSlotStatusBadge(slot.Status);
                        return (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text}`}
                          >
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>
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
                    <p className="text-gray-900 break-all">
                      {data.CustomerEmail}
                    </p>
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
              onClick={() =>
                navigate(`/bookings/${data.BookingCode}/checkin-code`)
              }
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              Xem Mã Check-in
            </button>
            <button onClick={() => navigate(-1)} className="btn-ghost flex-1">
              Quay lại
            </button>
          </div>

          {/* Info Note */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <p className="font-semibold mb-1">Thông tin cần biết:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Vui lòng đến sân 15 phút trước giờ đặt</li>
              <li>Mang theo mã check-in để xác nhận khi check-in</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailPage;
