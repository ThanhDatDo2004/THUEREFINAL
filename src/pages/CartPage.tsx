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
} from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getCartApi, type CartItem } from "../models/cart.api";
import { cancelBookingApi } from "../models/booking.api";
import { extractErrorMessage } from "../models/api.helpers";

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

  useEffect(() => {
    loadCart();
  }, [loadCart]);

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

  const handleCancelBooking = async (item: CartItem) => {
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

  const cartTotal = useMemo(
    () => items.reduce((acc, item) => acc + (item.totalPrice || 0), 0),
    [items]
  );

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
                          onClick={() => handleProceedToPayment(item.bookingCode)}
                          disabled={
                            isExpired || Boolean(processing[item.bookingCode])
                          }
                          className="btn-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CreditCard className="h-4 w-4" />
                          Thanh toán ngay
                        </button>
                        <button
                          onClick={() => handleCancelBooking(item)}
                          disabled={Boolean(processing[item.bookingCode])}
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
        </section>
      </div>
    </div>
  );
};

export default CartPage;
