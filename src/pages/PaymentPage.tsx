import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  CheckCircle,
  AlertCircle,
  Loader,
  RefreshCw,
  Phone,
} from "lucide-react";
import {
  initiatePaymentApi,
  checkPaymentStatusApi,
} from "../models/payment.api";
import { usePaymentPolling } from "../hooks/usePaymentPolling";
import { extractErrorMessage } from "../models/api.helpers";
import { normalizePaymentStatus } from "../utils/payment-helpers";

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
  pollInterval: number;
  pollingEnabled: boolean;
  checkCooldown: number;
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

  const navigationState = useMemo(() => {
    const state = location.state as LocationState | null;
    return state || {};
  }, [location.state]);

  const [state, setState] = useState<PaymentPageState>({
    loading: !navigationState.qrCode,
    initiating: false,
    error: null,
    qrCode: navigationState.qrCode || null,
    momoUrl: null,
    amount: navigationState.amount || null,
    paymentID: navigationState.paymentID || null,
    expiresIn: 900,
    bookingId: null,
    pollInterval: 4000,
    pollingEnabled: false,
    checkCooldown: 0,
  });

  const paymentPolling = usePaymentPolling({
    bookingCode: bookingCode || "",
    enabled:
      !!bookingCode &&
      !state.error &&
      !!state.paymentID &&
      state.pollingEnabled,
    interval: state.pollInterval,
    onSuccess: (status) => {
      if (status === "paid") {
        setState((prev) => ({ ...prev, initiating: false }));
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
      setState((prev) => ({
        ...prev,
        error,
      }));
    },
  });

  useEffect(() => {
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
          const qrCode = data.qr_code || null;
          const amount = data.amount || null;
          const paymentID = data.paymentID || null;
          const bookingId =
            typeof (data as { bookingId?: number }).bookingId === "number"
              ? (data as { bookingId?: number }).bookingId!
              : null;

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

  // ✅ Cooldown timer for check button
  useEffect(() => {
    if (state.checkCooldown <= 0) return;
    const timer = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        checkCooldown: Math.max(prev.checkCooldown - 1, 0),
      }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [state.checkCooldown]);

  // ✅ Auto-polling every 2 seconds after user verifies
  useEffect(() => {
    if (!state.pollingEnabled || !bookingCode) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await checkPaymentStatusApi(bookingCode);

        if (response.success && response.data) {
          const paymentStatus = normalizePaymentStatus(response.data.status);

          if (paymentStatus === "paid") {
            clearInterval(pollInterval);
            setState((prev) => ({ ...prev, pollingEnabled: false }));
            setTimeout(() => {
              navigate(`/payment/${bookingCode}`);
            }, 1000);
          } else if (paymentStatus === "failed") {
            clearInterval(pollInterval);
            setState((prev) => ({
              ...prev,
              error: "Thanh toán thất bại. Vui lòng thử lại.",
              pollingEnabled: false,
            }));
          }
          // If still pending, continue polling
        }
      } catch (err: unknown) {
        console.error("Polling error:", err);
        // Continue polling on error
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [state.pollingEnabled, bookingCode, navigate]);
  const handleRetry = () => {
    setState((prev) => ({
      ...prev,
      error: null,
      pollInterval: 4000,
      pollingEnabled: true,
    }));
  };

  const handleVerifyPayment = async () => {
    if (!bookingCode) return;

    try {
      setState((prev) => ({
        ...prev,
        initiating: true,
        error: null,
      }));

      const response = await checkPaymentStatusApi(bookingCode);

      if (response.success && response.data) {
        const paymentStatus = normalizePaymentStatus(response.data.status);

        if (paymentStatus === "paid") {
          setState((prev) => ({ ...prev, initiating: false }));
          setTimeout(() => {
            navigate(`/payment/${bookingCode}`);
          }, 1000);
        } else if (paymentStatus === "failed") {
          setState((prev) => ({
            ...prev,
            error: "Thanh toán thất bại. Vui lòng thử lại.",
            initiating: false,
          }));
        } else {
          // Status is still pending - continue polling
          setState((prev) => ({
            ...prev,
            pollingEnabled: true,
            initiating: false,
            checkCooldown: 5,
          }));
        }
      }
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(
        err,
        "Không thể xác nhận thanh toán"
      );
      setState((prev) => ({
        ...prev,
        error: errorMsg,
        initiating: false,
      }));
    }
  };

  const buildSePayQRUrl = () => {
    if (state.qrCode) return state.qrCode;
    const params = new URLSearchParams({
      acc: "96247THUERE",
      bank: "BIDV",
      ...(state.amount ? { amount: String(state.amount) } : {}),
      des: `BK${bookingCode}`,
    });
    return `https://qr.sepay.vn/img?${params.toString()}`;
  };

  if (state.loading && !state.qrCode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-16 h-16 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Thanh Toán Đặt Sân
          </h1>
          <p className="text-gray-600">Booking: {bookingCode}</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          {state.amount && (
            <div className="text-center mb-6 pb-6 border-b">
              <p className="text-gray-600 text-sm mb-1">Số Tiền Thanh Toán</p>
              <p className="text-4xl font-bold text-blue-600">
                {state.amount.toLocaleString("vi-VN")}₫
              </p>
            </div>
          )}

          {!paymentPolling.isPaid && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-sm text-gray-700">
                  Vui lòng chuyển khoản theo hướng dẫn bên dưới. Hệ thống sẽ tự
                  động khớp khi nội dung chính xác.
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

          <div className="space-y-3">
            {paymentPolling.isPending && (
              <button
                onClick={handleVerifyPayment}
                disabled={state.checkCooldown > 0 || state.initiating}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center"
              >
                {state.initiating ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : state.checkCooldown > 0 ? (
                  `${state.checkCooldown}s`
                ) : (
                  "Xác Nhận Đã Chuyển Tiền"
                )}
              </button>
            )}

            {paymentPolling.isPaid && (
              <button
                onClick={() => navigate(`/payment/${bookingCode}`)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                Xem Kết Quả Thanh Toán
              </button>
            )}

            {paymentPolling.isFailed && (
              <button
                onClick={handleRetry}
                disabled={paymentPolling.loading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Thử Lại
              </button>
            )}

            {paymentPolling.isPending && state.pollingEnabled && (
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

          {state.expiresIn && !paymentPolling.isPaid && (
            <p className="text-center text-gray-500 text-sm mt-4">
              Vui lòng hoàn tất chuyển khoản trong{" "}
              {Math.ceil(state.expiresIn / 60)} phút
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
