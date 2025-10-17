import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../models/api";
import { ensureSuccess, extractErrorMessage } from "../models/api.helpers";

type SlotInfo = {
  PlayDate?: string;
  StartTime?: string;
  EndTime?: string;
  playDate?: string;
  startTime?: string;
  endTime?: string;
};

type PaymentResultData = {
  bookingCode?: string;
  transactionId?: string;
  fieldName?: string;
  amount?: number;
  totalPrice?: number;
  status?: string;
  slots?: SlotInfo[];
};

const formatCurrency = (value?: number) => {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(value);
};

const normalizeSlot = (slot: SlotInfo) => {
  const playDate = slot.PlayDate || slot.playDate || "";
  const startTime = slot.StartTime || slot.startTime || "";
  const endTime = slot.EndTime || slot.endTime || "";
  return { playDate, startTime, endTime };
};

const PaymentResult: React.FC = () => {
  const { bookingCode } = useParams<{ bookingCode: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaymentResultData | null>(null);

  useEffect(() => {
    let ignore = false;
    if (!bookingCode) {
      setError("Thiếu mã booking.");
      setLoading(false);
      return () => {};
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/payments/result/${bookingCode}`);
        const payload = ensureSuccess<PaymentResultData>(res.data, "Không lấy được kết quả thanh toán.");
        if (!ignore) setData(payload || {});
      } catch (err: unknown) {
        if (!ignore) setError(extractErrorMessage(err, "Không thể tải kết quả thanh toán."));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [bookingCode]);

  const normalizedSlots = useMemo(() => {
    return (data?.slots || []).map((s) => normalizeSlot(s));
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-700">
          <div className="h-6 w-6 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" />
          <span>Đang tải kết quả thanh toán...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-4 text-red-600 text-2xl font-semibold">Có lỗi xảy ra</div>
          <div className="mb-6 text-gray-700">{error}</div>
          <div className="flex flex-col gap-3">
            <button className="btn-primary" onClick={() => navigate(-1)}>Quay lại</button>
            <button className="btn-ghost" onClick={() => navigate("/")}>Về trang chủ</button>
          </div>
        </div>
      </div>
    );
  }

  const shownBookingCode = data?.bookingCode || bookingCode;
  const amount = typeof data?.totalPrice === "number" ? data?.totalPrice : data?.amount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-100 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-lg rounded-xl p-8">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="h-10 w-10 text-emerald-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Thanh Toán Thành Công!</h1>
            {data?.status && (
              <p className="mt-1 text-sm text-emerald-700">Trạng thái: {data.status}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Mã Booking</div>
              <div className="mt-1 font-mono text-base font-semibold text-gray-900">{shownBookingCode}</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Mã Giao Dịch</div>
              <div className="mt-1 font-mono text-base text-gray-900">{data?.transactionId || "Đang cập nhật"}</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Sân</div>
              <div className="mt-1 text-base font-semibold text-gray-900">{data?.fieldName || "-"}</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Tổng tiền</div>
              <div className="mt-1 text-base font-semibold text-emerald-700">{formatCurrency(amount)}</div>
            </div>
          </div>

          {normalizedSlots.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Khung giờ đã đặt</h3>
              <div className="rounded-lg border border-gray-200 divide-y">
                {normalizedSlots.map((s, idx) => (
                  <div key={idx} className="px-4 py-2 flex items-center justify-between text-sm">
                    <span className="text-gray-600">{s.playDate ? new Date(s.playDate).toLocaleDateString("vi-VN") : "-"}</span>
                    <span className="font-medium text-gray-900">{s.startTime} - {s.endTime}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              className="btn-primary w-full"
              onClick={() => navigate(`/bookings/${shownBookingCode}`)}
            >
              Xem Chi Tiết Booking
            </button>
            <button
              className="btn-ghost w-full"
              onClick={() => navigate(`/bookings/${shownBookingCode}/checkin-code`)}
            >
              Xem Mã Check-in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;


