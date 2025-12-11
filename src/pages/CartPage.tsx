import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  RefreshCcw,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Trash2,
  AlertCircle,
  ListChecks,
  Eye,
} from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getCartApi, type CartItem } from "../models/cart.api";
import {
  cancelBookingApi,
  getMyBookingsApi,
  type BookingItem,
} from "../models/booking.api";
import { extractErrorMessage } from "../models/api.helpers";
import { getBookingStatusBadge } from "../utils/statusLabels";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const formatPrice = (value: number) => currencyFormatter.format(value || 0);

const formatCountdown = (seconds: number) => {
  if (seconds <= 0) return "0 giây";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes <= 0) {
    return `${remainingSeconds} giây`;
  }
  return `${minutes} phút ${remainingSeconds.toString().padStart(2, "0")} giây`;
};

const CartPage: React.FC = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [processing, setProcessing] = useState<Record<number, boolean>>({});
  const [orders, setOrders] = useState<BookingItem[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const [ordersProcessing, setOrdersProcessing] = useState<
    Record<string | number, boolean>
  >({});
  const navigate = useNavigate();

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCartApi();
      const payload = response.data;
      setItems(payload?.items ?? []);
    } catch (err: unknown) {
      const message = extractErrorMessage(err, "Không thể tải giỏ hàng");
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const response = await getMyBookingsApi(undefined, 20, 0);
      const payload = response.data;
      const paidOrders =
        payload?.data?.filter((booking) => booking.PaymentStatus === "paid") ??
        [];
      setOrders(paidOrders);
    } catch (err: unknown) {
      const message = extractErrorMessage(
        err,
        "Không thể tải danh sách đơn đã đặt"
      );
      setOrdersError(message);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secondsRemaining = useCallback(
    (item: CartItem) => {
      const expires = new Date(item.expiresAt).getTime();
      if (Number.isNaN(expires)) {
        return 0;
      }
      return Math.max(0, Math.floor((expires - now) / 1000));
    },
    [now]
  );

  useEffect(() => {
    if (items.length === 0) return;
    const hasExpired = items.some(
      (item) => secondsRemaining(item) <= 0 && !processing[item.bookingCode]
    );
    if (hasExpired) {
      loadCart();
    }
  }, [items, secondsRemaining, loadCart, processing]);

  const handleProceedToPayment = (bookingCode: number) => {
    navigate(`/payment/${bookingCode}/transfer`);
  };

  const handleCancelCartItem = async (item: CartItem) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn hủy giữ chỗ cho đơn này? Khung giờ sẽ được mở lại cho khách khác."
      )
    ) {
      return;
    }

    setProcessing((prev) => ({ ...prev, [item.bookingCode]: true }));
    try {
      await cancelBookingApi(item.bookingCode.toString());
      await loadCart();
    } catch (err: unknown) {
      const message = extractErrorMessage(err, "Không thể hủy giữ chỗ");
      setError(message);
    } finally {
      setProcessing((prev) => {
        const next = { ...prev };
        delete next[item.bookingCode];
        return next;
      });
    }
  };

  const handleCancelOrder = async (booking: BookingItem) => {
    if (
      !window.confirm(
        "Bạn chắc chắn muốn hủy đơn này? Bạn sẽ mất 50% phí đặt và chủ sân sẽ liên hệ lại."
      )
    ) {
      return;
    }

    setOrdersProcessing((prev) => ({
      ...prev,
      [booking.BookingCode]: true,
    }));
    setOrderMessage(null);

    try {
      const response = await cancelBookingApi(
        String(booking.BookingCode),
        undefined
      );
      setOrderMessage(
        response.data?.message ||
          "Yêu cầu hủy sân đã được gửi. Chủ sân sẽ sớm liên hệ với bạn."
      );
      await loadOrders();
    } catch (err: unknown) {
      const message = extractErrorMessage(err, "Không thể gửi yêu cầu hủy sân");
      setOrdersError(message);
    } finally {
      setOrdersProcessing((prev) => {
        const next = { ...prev };
        delete next[booking.BookingCode];
        return next;
      });
    }
  };

  const cartTotal = useMemo(
    () => items.reduce((acc, item) => acc + (item.totalPrice || 0), 0),
    [items]
  );

  const getOrderSlotInfo = (booking: BookingItem) => {
    if (!booking.slots || booking.slots.length === 0) {
      return "Đang cập nhật";
    }
    const slot = booking.slots[0];
    const date = new Date(slot.PlayDate).toLocaleDateString("vi-VN");
    return `${date} ${slot.StartTime} - ${slot.EndTime}`;
  };

  const canCancelOrder = (booking: BookingItem) =>
    booking.PaymentStatus === "paid" &&
    booking.BookingStatus === "confirmed" &&
    booking.cancellationStatus !== "pending" &&
    booking.BookingStatus !== "cancellation_pending";

  return (
    <div className="page">
      <div className="container">
        <section className="section space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
                <ShoppingCart className="h-7 w-7 text-emerald-600" />
                Giỏ hàng của bạn
              </h1>
              <p className="text-sm text-gray-600">
                Các đơn giữ chỗ sẽ hết hạn sau 15 phút kể từ thời điểm xác nhận.
              </p>
              {items.length > 0 && (
                <p className="text-xs text-gray-500">
                  Tổng giá trị đang giữ: {formatPrice(cartTotal)}
                </p>
              )}
            </div>
            <button
              onClick={loadCart}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className="h-4 w-4" />
              Làm mới
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-medium">Đã xảy ra lỗi</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div>
              {loading ? (
                <div className="flex justify-center py-16">
                  <LoadingSpinner size="lg" />
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
                  <ShoppingCart className="mx-auto h-12 w-12 text-gray-300" />
                  <h2 className="mt-4 text-2xl font-semibold text-gray-900">
                    Giỏ hàng đang trống
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Bạn chưa giữ sân nào. Hãy khám phá các sân và đặt lịch ngay.
                  </p>
                  <button
                    onClick={() => navigate("/fields")}
                    className="btn-primary mt-6 inline-flex items-center justify-center"
                  >
                    Khám phá sân
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => {
                    const remainingSeconds = secondsRemaining(item);
                    const isExpired = remainingSeconds <= 0;
                    const cartCancellationPending =
                      item.bookingStatus === "cancellation_pending";

                    return (
                      <div
                        key={item.cartId}
                        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-1">
                            <h2 className="text-xl font-semibold text-gray-900">
                              {item.fieldName}
                            </h2>
                            <p className="text-sm capitalize text-gray-500">
                              {item.sportType}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 text-emerald-600" />
                              <span>{item.address ?? "Chưa cập nhật"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <CreditCard className="h-4 w-4 text-emerald-600" />
                              <span>
                                Tổng tiền:{" "}
                                <span className="font-semibold text-gray-900">
                                  {formatPrice(item.totalPrice)}
                                </span>
                              </span>
                            </div>
                            {item.discountAmount > 0 && (
                              <p className="text-xs text-emerald-600">
                                Tiết kiệm {formatPrice(item.discountAmount)}
                                {item.promotionCode
                                  ? ` với mã ${item.promotionCode}`
                                  : ""}
                              </p>
                            )}
                          </div>

                          <div className="text-right space-y-2">
                            <div
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                                isExpired
                                  ? "bg-red-50 text-red-600"
                                  : remainingSeconds <= 120
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              <Clock className="h-4 w-4" />
                              {isExpired
                                ? "Đã hết thời gian giữ"
                                : `Giữ chỗ còn ${formatCountdown(
                                    remainingSeconds
                                  )}`}
                            </div>
                            {cartCancellationPending && (
                              <p className="text-xs text-amber-600">
                                Đã gửi yêu cầu hủy. Vui lòng đợi chủ sân xác
                                nhận.
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Tạo lúc:{" "}
                              {new Date(item.createdAt).toLocaleString("vi-VN")}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-[2fr_1fr]">
                          <div className="rounded-xl bg-gray-50 p-4">
                            <h3 className="text-sm font-semibold text-gray-700">
                              Khung giờ đã giữ
                            </h3>
                            <div className="mt-3 space-y-2 text-sm text-gray-700">
                              {item.slots.map((slot) => (
                                <div
                                  key={`${slot.bookingCode}-${slot.playDate}-${slot.startTime}`}
                                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-emerald-600" />
                                    <span>
                                      {new Date(
                                        slot.playDate
                                      ).toLocaleDateString("vi-VN")}
                                    </span>
                                  </div>
                                  <div className="font-medium text-gray-900">
                                    {slot.startTime} - {slot.endTime}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-3">
                            <button
                              onClick={() =>
                                handleProceedToPayment(item.bookingCode)
                              }
                              disabled={
                                isExpired ||
                                Boolean(processing[item.bookingCode]) ||
                                cartCancellationPending
                              }
                              className="btn-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <CreditCard className="h-4 w-4" />
                              Thanh toán ngay
                            </button>
                            <button
                              onClick={() => handleCancelCartItem(item)}
                              disabled={
                                Boolean(processing[item.bookingCode]) ||
                                cartCancellationPending
                              }
                              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              Hủy giữ chỗ
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
                  <ListChecks className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Đơn đã thanh toán
                  </h2>
                  <p className="text-sm text-gray-500">
                    Hiển thị các đơn đã thanh toán và chờ đến giờ sử dụng. Bạn
                    có thể xem chi tiết hoặc gửi yêu cầu hủy (mất 50% phí).
                  </p>
                </div>
              </div>

              {orderMessage && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  {orderMessage}
                </div>
              )}

              {ordersError && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {ordersError}
                </div>
              )}

              {ordersLoading ? (
                <div className="flex justify-center py-10">
                  <LoadingSpinner />
                </div>
              ) : orders.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-gray-200 p-6 text-center">
                  <p className="text-sm text-gray-500">
                    Bạn chưa có đơn nào đã thanh toán gần đây.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {orders.map((booking) => {
                    const isCancellationPending =
                      booking.BookingStatus === "cancellation_pending" ||
                      booking.cancellationStatus === "pending";
                    const badge = isCancellationPending
                      ? {
                          label: "Đang chờ hủy",
                          className:
                            "bg-amber-50 text-amber-700 border-amber-200",
                        }
                      : booking.BookingStatus === "cancelled"
                      ? {
                          label: "Đã hủy",
                          className: "bg-rose-50 text-rose-700 border-rose-200",
                        }
                      : getBookingStatusBadge(booking.BookingStatus);
                    const disableCancel =
                      !canCancelOrder(booking) ||
                      Boolean(ordersProcessing[booking.BookingCode]);
                    return (
                      <div
                        key={booking.BookingCode}
                        className="rounded-xl border border-gray-200 p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase text-gray-500">
                              Mã đơn
                            </p>
                            <p className="text-lg font-semibold text-gray-900">
                              #{booking.BookingCode}
                            </p>
                            <p className="text-sm text-gray-600">
                              {booking.FieldName || `Sân #${booking.FieldCode}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              Khung giờ: {getOrderSlotInfo(booking)}
                            </p>
                            <p className="text-xs text-gray-500">
                              SĐT liên hệ:{" "}
                              {booking.CustomerPhone || "Chưa cập nhật"}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-1 py-1 text-xs font-semibold ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                            <p className="mt-1 text-xs text-gray-500">
                              Tổng: {formatPrice(Number(booking.TotalPrice))}
                            </p>
                          </div>
                        </div>
                        {booking.cancellationStatus === "pending" && (
                          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                            Đã gửi yêu cầu hủy. Chủ sân sẽ liên hệ với bạn sớm
                            nhất.
                          </div>
                        )}
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                          <button
                            onClick={() =>
                              navigate(`/bookings/${booking.BookingCode}`)
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                          >
                            <Eye className="h-4 w-4" />
                            Xem chi tiết
                          </button>
                          <button
                            onClick={() => handleCancelOrder(booking)}
                            disabled={disableCancel}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" />
                            Hủy đặt (-50%)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CartPage;
