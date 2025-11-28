import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  AlertCircle,
  CheckCircle,
  QrCode,
} from "lucide-react";
import { extractErrorMessage } from "../models/api.helpers";
import {
  getCheckinCodeApi,
  type CheckinCodeResponse,
} from "../models/booking.api";

const CheckinCodePage: React.FC = () => {
  const { bookingCode } = useParams<{ bookingCode: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CheckinCodeResponse | null>(null);
  const [copied, setCopied] = useState(false);

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
        console.log("🔍 CheckinCodePage: bookingCode param =", bookingCode);
        const res = await getCheckinCodeApi(bookingCode);
        console.log("✅ Checkin code response:", res);
        if (!ignore) setData(res.data || null);
      } catch (err: unknown) {
        console.error("❌ Error fetching checkin code:", err);
        if (!ignore)
          setError(
            extractErrorMessage(
              err,
              "Không thể tải mã check-in. Vui lòng thử lại."
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

  const handleCopy = () => {
    if (data?.checkinCode) {
      navigator.clipboard.writeText(data.checkinCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (loading) {
    return (
      <div className="page bg-slate-50/80 pb-10 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-700">
          <div className="h-8 w-8 rounded-full border-3 border-gray-300 border-t-emerald-500 animate-spin" />
          <span className="text-lg">Đang tải mã check-in...</span>
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

  if (!data || !data.checkinCode) {
    return (
      <div className="page bg-slate-50/80 pb-10 min-h-screen flex items-center justify-center px-4">
        <div className="container max-w-2xl">
          <div className="section text-center space-y-6">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Không tìm thấy mã check-in
              </h2>
              <p className="text-gray-600">
                Mã booking không hợp lệ hoặc chưa có mã check-in.
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

  return (
    <div className="page bg-gradient-to-br from-emerald-50 to-blue-50 pb-10">
      <div className="container max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="btn-link inline-flex items-center gap-2 text-sm mb-6 mt-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại
        </button>

        <div className="section space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100">
              <QrCode className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Mã Check-In
              </h1>
              <p className="text-gray-600">
                Sử dụng mã này để check-in khi đến sân
              </p>
            </div>
          </div>

          {/* Checkin Code - Big Display */}
          <div className="space-y-4">
            <div className="relative rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100 p-8 shadow-lg">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-3">
                  Mã Check-in
                </p>
                <div className="font-mono text-5xl font-bold text-emerald-900 tracking-wider mb-4 select-all">
                  {data.checkinCode}
                </div>
                <p className="text-sm text-emerald-700">
                  Vui lòng xuất trình mã này khi đến sân
                </p>
              </div>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border font-medium transition ${
                copied
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Copy className="w-5 h-5" />
              {copied ? "✓ Đã sao chép" : "Sao chép mã"}
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => navigate(`/bookings/${data.bookingCode}`)}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              Xem Chi Tiết Booking
            </button>
            <button
              onClick={() => navigate(-1)}
              className="btn-ghost flex items-center justify-center flex-1"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckinCodePage;
