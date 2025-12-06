import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { respondCancellationDecisionApi } from "../models/booking.api";
import { extractErrorMessage } from "../models/api.helpers";

type DecisionState = {
  loading: boolean;
  error: string | null;
  message: string | null;
  decision?: "approved" | "rejected";
  bookingCode?: number;
  refundAmount?: number | null;
};

const CancellationResponsePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<DecisionState>({
    loading: true,
    error: null,
    message: null,
  });

  useEffect(() => {
    const token = searchParams.get("token");
    const decisionParam = searchParams.get("decision");
    if (!token || !decisionParam) {
      setState({
        loading: false,
        error: "Thiếu thông tin xử lý yêu cầu hủy sân.",
        message: null,
      });
      return;
    }

    const normalizedDecision = decisionParam.toLowerCase().startsWith("a")
      ? "approve"
      : "reject";

    const handleResponse = async () => {
      try {
        const response = await respondCancellationDecisionApi(
          token,
          normalizedDecision
        );
        const payload = response.data;
        setState({
          loading: false,
          error: null,
          message:
            normalizedDecision === "approve"
              ? "Bạn đã đồng ý hủy sân. Khung giờ này sẽ được mở lại cho khách khác."
              : "Bạn đã từ chối yêu cầu hủy sân. Chúng tôi sẽ gửi thông báo cho khách hàng.",
          decision: payload?.decision,
          bookingCode: payload?.bookingCode,
          refundAmount: payload?.refundAmount,
        });
      } catch (err: unknown) {
        setState({
          loading: false,
          error: extractErrorMessage(
            err,
            "Không thể xử lý yêu cầu. Vui lòng thử lại hoặc liên hệ hỗ trợ."
          ),
          message: null,
        });
      }
    };

    handleResponse();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Xử Lý Yêu Cầu Hủy Sân
          </h1>
          <p className="text-sm text-gray-500">
            Liên kết được cung cấp trong email xác nhận từ hệ thống.
          </p>
        </div>

        {state.loading ? (
          <div className="flex flex-col items-center gap-4 py-10">
            <LoadingSpinner />
            <p className="text-sm text-gray-500">
              Đang xử lý yêu cầu của bạn...
            </p>
          </div>
        ) : state.error ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
            <XCircle className="h-10 w-10" />
            <p className="font-semibold">{state.error}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-700">
            <CheckCircle className="h-10 w-10" />
            <p className="font-semibold">
              {state.message || "Đã xử lý yêu cầu hủy sân."}
            </p>
            {state.bookingCode && (
              <p className="text-sm text-emerald-800">
                Mã đơn:{" "}
                <span className="font-semibold">#{state.bookingCode}</span>
              </p>
            )}
            {typeof state.refundAmount === "number" && (
              <p className="text-xs text-gray-600">
                Số tiền hoàn dự kiến:{" "}
                <span className="font-semibold">
                  {state.refundAmount.toLocaleString("vi-VN")}₫
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CancellationResponsePage;
