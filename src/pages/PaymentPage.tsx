import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  CheckCircle,
  AlertCircle,
  Loader,
  RefreshCw,
  Phone,
} from "lucide-react";
import { initiatePaymentApi, confirmPaymentApi } from "../models/payment.api";
import { usePaymentPolling } from "../hooks/usePaymentPolling";
import { extractErrorMessage } from "../models/api.helpers";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Layout from "../components/layouts/Layout";

interface PaymentPageState {
  loading: boolean;
  initiating: boolean;
  error: string | null;
  qrCode: string | null;
  momoUrl: string | null;
  amount: number | null;
  paymentID: number | null;
  expiresIn: number | null;
  bookingId: number | null;
  pollInterval: number; // For exponential backoff
  pollingEnabled: boolean; // ✅ NEW: Control when to start polling
}

type LocationState = {
  qrCode?: string;
  paymentID?: number;
  amount?: number;
};

const PaymentPage: React.FC = () => {
  const { bookingCode } = useParams<{ bookingCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Get QR data from navigation state (passed from BookingPage)
  const navigationState = useMemo(() => {
    const state = location.state as LocationState | null;
    return state || {};
  }, [location.state]);

  const [state, setState] = useState<PaymentPageState>({
    loading: !navigationState.qrCode, // Only load if no state data
    initiating: false,
    error: null,
    qrCode: navigationState.qrCode || null,
    momoUrl: null,
    amount: navigationState.amount || null,
    paymentID: navigationState.paymentID || null,
    expiresIn: 900,
    bookingId: null,
    pollInterval: 4000, // Start at 4s, will increase with backoff
    pollingEnabled: false, // ✅ Start with polling disabled
  });

  const paymentPolling = usePaymentPolling({
    bookingCode: bookingCode || "",
    enabled:
      !!bookingCode &&
      !state.error &&
      !!state.paymentID &&
      state.pollingEnabled, // ✅ Only poll if enabled
    interval: state.pollInterval,
    onSuccess: (status) => {
      if (status === "paid") {
        setState((prev) => ({ ...prev, initiating: false }));
        // Redirect to success/result page
        setTimeout(() => {
          navigate(`/payment/${bookingCode}`);
        }, 1000);
      } else if (status === "failed") {
        setState((prev) => ({
          ...prev,
          error: "Thanh toán thất bại. Vui lòng thử lại.",
        }));
      }
    },
    onError: (error) => {
      // Timeout error
      setState((prev) => ({
        ...prev,
        error,
      }));
    },
  });

  // ✅ Auto-start polling after 5 second delay (wait for SePay webhook)
  useEffect(() => {
    if (!state.paymentID || state.pollingEnabled) {
      return; // Don't auto-start if already polling or no paymentID
    }

    const timer = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        pollingEnabled: true,
      }));
    }, 5000); // Wait 5 seconds before starting poll

    return () => clearTimeout(timer);
  }, [state.paymentID, state.pollingEnabled]);

  // Initialize payment - SePay bank transfer (fallback if no state data)
  useEffect(() => {
    // If we already have QR data from state, skip initiate
    if (
      navigationState.qrCode &&
      navigationState.paymentID &&
      navigationState.amount
    ) {
      return;
    }

    const initializePayment = async () => {
      if (!bookingCode) return;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const response = await initiatePaymentApi(bookingCode, "bank_transfer");

        if (response.success && response.data) {
          const data = response.data;

          // SePay QR image URL (use fallback if not provided)
          const qrCode = data.qr_code || null;
          const amount = data.amount || null;
          const paymentID = data.paymentID || null;
          const bookingId =
            typeof (data as { bookingId?: number }).bookingId === "number"
              ? (data as { bookingId?: number }).bookingId!
              : null;

          // Must have amount and paymentID for transfer
          if (!amount || !paymentID) {
            setState((prev) => ({
              ...prev,
              error:
                "Invalid payment response format. Check backend implementation.",
              loading: false,
            }));
            return;
          }

          setState((prev) => ({
            ...prev,
            qrCode,
            amount,
            paymentID,
            expiresIn: data.expiresIn || 900,
            bookingId,
            loading: false,
          }));
        }
      } catch (err: unknown) {
        // Special handling for 404s
        const anyErr = err as { response?: { status?: number } };
        const is404 = anyErr?.response?.status === 404;
        const fallback = is404
          ? "Không tìm thấy booking. Vui lòng tạo booking trước."
          : "Failed to initiate payment";
        const errorMsg = extractErrorMessage(err, fallback);
        setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      }
    };

    initializePayment();
  }, [bookingCode, navigationState]);

  // Exponential backoff: increase interval after each failed check (capped at 10s)
  useEffect(() => {
    if (paymentPolling.error && state.pollInterval < 10000) {
      const timer = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          pollInterval: Math.min(prev.pollInterval + 1000, 10000),
        }));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [paymentPolling.error, state.pollInterval]);

  const handleRetry = () => {
    setState((prev) => ({
      ...prev,
      error: null,
      pollInterval: 4000, // Reset to initial interval
      pollingEnabled: true, // ✅ Enable polling on retry
    }));
  };

  // Build SePay QR URL with proper format
  const buildSePayQRUrl = () => {
    if (state.qrCode) return state.qrCode; // Use backend QR if available
    // Fallback: https://qr.sepay.vn/img?acc=96247THUERE&bank=BIDV&amount=912&des=BK20
    const params = new URLSearchParams({
      acc: "96247THUERE",
      bank: "BIDV",
      ...(state.amount ? { amount: String(state.amount) } : {}),
      des: `BK${bookingCode}`,
    });
    return `https://qr.sepay.vn/img?${params.toString()}`;
  };

  const handleTestPayment = async () => {
    if (!state.paymentID) return;

    try {
      setState((prev) => ({ ...prev, initiating: true }));
      await confirmPaymentApi(state.paymentID);
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to confirm payment");
      setState((prev) => ({ ...prev, error: errorMsg, initiating: false }));
      alert(errorMsg);
    }
  };

  if (state.loading && !state.qrCode) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Thanh Toán Đặt Sân
            </h1>
            <p className="text-gray-600">Booking: {bookingCode}</p>
          </div>

          {/* Payment Instructions (SePay Bank Transfer) */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            {/* Status Badge */}
            <div className="flex items-center justify-center mb-6">
              {paymentPolling.isPaid && (
                <div className="flex flex-col items-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mb-2" />
                  <span className="text-xl font-semibold text-green-600">
                    Thanh Toán Thành Công
                  </span>
                </div>
              )}
              {paymentPolling.isFailed && (
                <div className="flex flex-col items-center">
                  <AlertCircle className="w-16 h-16 text-red-500 mb-2" />
                  <span className="text-xl font-semibold text-red-600">
                    Thanh Toán Thất Bại
                  </span>
                </div>
              )}
              {paymentPolling.isPending && (
                <div className="flex flex-col items-center">
                  {paymentPolling.loading ? (
                    <>
                      <Loader className="w-16 h-16 text-blue-500 mb-2 animate-spin" />
                      <span className="text-xl font-semibold text-blue-600">
                        Đang Chờ Thanh Toán
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full border-4 border-yellow-400 mb-2"></div>
                      <span className="text-xl font-semibold text-yellow-600">
                        Chưa Thanh Toán
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Amount */}
            {state.amount && (
              <div className="text-center mb-6 pb-6 border-b">
                <p className="text-gray-600 text-sm mb-1">Số Tiền Thanh Toán</p>
                <p className="text-4xl font-bold text-blue-600">
                  {state.amount.toLocaleString("vi-VN")}₫
                </p>
              </div>
            )}

            {/* Transfer Instructions + SePay QR */}
            {!paymentPolling.isPaid && (
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-sm text-gray-700">
                    Vui lòng chuyển khoản theo hướng dẫn bên dưới. Hệ thống sẽ
                    tự động khớp khi nội dung chính xác.
                  </p>
                </div>
                {(state.qrCode || true) && (
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium mb-3">Quét mã QR SePay</p>
                    <div className="flex justify-center">
                      {(() => {
                        const qrUrl = buildSePayQRUrl();
                        return (
                          <img
                            src={qrUrl}
                            alt="SePay QR"
                            className="w-64 h-64 object-contain"
                          />
                        );
                      })()}
                    </div>
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Nội dung chuyển khoản
                    </p>
                    <p className="mt-1 font-mono font-semibold">{`BK${bookingCode}`}</p>
                  </div>
                  <div className="rounded-lg border px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Số tiền
                    </p>
                    <p className="mt-1 font-semibold">
                      {state.amount?.toLocaleString("vi-VN")}₫
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Tài khoản nhận
                  </p>
                  <div className="mt-1 text-sm text-gray-900">
                    <p>Người nhận: Do Thanh Dat</p>
                    <p>Ngân hàng: BIDV</p>
                    <p>Số tài khoản: 6353897509</p>
                    <p>Chi nhánh: TP.HCM</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-semibold">Lỗi</p>
                <p className="text-red-600 text-sm">{state.error}</p>
              </div>
            )}

            {paymentPolling.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-semibold">Lỗi Xác Minh</p>
                <p className="text-red-600 text-sm">{paymentPolling.error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-3">
              {/* Test Payment Button (for development) */}
              {!paymentPolling.isPaid && state.paymentID && (
                <button
                  onClick={handleTestPayment}
                  disabled={state.initiating || paymentPolling.loading}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition text-sm"
                >
                  {state.initiating ? "Xử Lý..." : "🧪 Thử Thanh Toán (Dev)"}
                </button>
              )}

              {paymentPolling.isPaid && (
                <button
                  onClick={() => navigate(`/payment/${bookingCode}`)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition"
                >
                  Xem Kết Quả Thanh Toán
                </button>
              )}

              {paymentPolling.isFailed && (
                <button
                  onClick={handleRetry}
                  disabled={state.initiating || paymentPolling.loading}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition text-sm flex items-center justify-center"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Thử Lại
                </button>
              )}

              {paymentPolling.isPending && (
                <button
                  onClick={handleRetry}
                  disabled={state.initiating || paymentPolling.loading}
                  className="w-full bg-gray-300 hover:bg-gray-400 disabled:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition text-sm flex items-center justify-center"
                >
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Đang Kiểm Tra
                </button>
              )}

              {paymentPolling.isPending && (
                <button
                  onClick={() => {
                    alert(
                      "Vui lòng liên hệ với chúng tôi để được hỗ trợ. Số điện thoại: 090.123.4567"
                    );
                    window.location.href = "tel:+84901234567";
                  }}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition text-sm flex items-center justify-center"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Liên Hệ Hỗ Trợ
                </button>
              )}
            </div>

            {/* Info */}
            {state.expiresIn && !paymentPolling.isPaid && (
              <p className="text-center text-gray-500 text-sm mt-4">
                Vui lòng hoàn tất chuyển khoản trong{" "}
                {Math.ceil(state.expiresIn / 60)} phút
              </p>
            )}
          </div>

          {/* Polling Status */}
          <div className="text-center text-sm text-gray-600">
            <p>Trạng thái: {paymentPolling.status}</p>
            {paymentPolling.loading && (
              <p className="text-blue-600">
                Đang kiểm tra lần thứ{" "}
                {state.initiating ? "..." : paymentPolling.loading ? "..." : ""}
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentPage;
