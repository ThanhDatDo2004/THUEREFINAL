// src/pages/BookingPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  DollarSign,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchFieldAvailability,
  fetchFieldById,
  type FieldSlot,
} from "../models/fields.api";
import type { FieldWithImages } from "../types";

interface BookingFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_method: "banktransfer";
  notes?: string;
}

type BookingStatePayload = {
  date: string;
  startTime: string;
  duration: number;
};

type BookingDetails = {
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalPrice: number;
};

const todayString = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  const local = new Date(now.getTime() - offsetMs);
  return local.toISOString().split("T")[0];
};

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const addMinutesToTime = (time: string, minutes: number) => {
  const total = timeToMinutes(time) + minutes;
  const hh = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const mm = (total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
};

const minutesToLabel = (minutes: number) => {
  if (minutes <= 0) return "0 phút";
  if (minutes % 60 === 0) {
    return `${minutes / 60} giờ`;
  }
  return `${minutes} phút`;
};

const slotDurationLabel = (slot: FieldSlot) => {
  const minutes = timeToMinutes(slot.end_time) - timeToMinutes(slot.start_time);
  return minutesToLabel(minutes);
};

const formatHoldExpiresAt = (value: string | null) => {
  if (!value) return "";
  const normalized = value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const BookingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const fieldFromState = (location.state as any)?.field as
    | FieldWithImages
    | undefined;
  const rawBookingPrefill = (location.state as any)
    ?.bookingDetails as BookingStatePayload | undefined;

  const bookingPrefill = useMemo(() => {
    if (!rawBookingPrefill) return null;
    const minutes = Math.round((rawBookingPrefill.duration ?? 0) * 60);
    const endTime = addMinutesToTime(rawBookingPrefill.startTime, minutes);
    return {
      ...rawBookingPrefill,
      endTime,
    };
  }, [rawBookingPrefill]);

  const initialDate = bookingPrefill?.date ?? todayString();

  const [field, setField] = useState<FieldWithImages | null>(
    fieldFromState ?? null
  );
  const [loadingField, setLoadingField] = useState(!fieldFromState && !!id);
  const [fieldError, setFieldError] = useState("");

  useEffect(() => {
    let ignore = false;
    if (!fieldFromState && id) {
      const numericId = Number(id);
      if (!Number.isFinite(numericId)) {
        setFieldError("Mã sân không hợp lệ.");
        setLoadingField(false);
        return;
      }
      (async () => {
        setLoadingField(true);
        setFieldError("");
        try {
          const fetched = await fetchFieldById(numericId);
          if (!ignore) setField(fetched ?? null);
        } catch (err: any) {
          if (!ignore) {
            setFieldError(
              err?.message || "Không thể tải thông tin sân. Vui lòng thử lại."
            );
            setField(null);
          }
        } finally {
          if (!ignore) setLoadingField(false);
        }
      })();
    }
    return () => {
      ignore = true;
    };
  }, [fieldFromState, id]);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [slots, setSlots] = useState<FieldSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  useEffect(() => {
    if (!field?.field_code || !selectedDate) {
      setSlots([]);
      return;
    }
    let ignore = false;
    setLoadingSlots(true);
    setSlotsError("");
    setSlots([]);
    (async () => {
      try {
        const res = await fetchFieldAvailability(field.field_code, selectedDate);
        if (!ignore) {
          setSlots(res.slots ?? []);
          if (!res.slots?.length) {
            setSlotsError("Ngày này chưa mở lịch hoặc đã kín lịch.");
          }
        }
      } catch (err: any) {
        if (!ignore) {
          setSlots([]);
          setSlotsError(
            err?.message || "Không thể tải khung giờ trống. Vui lòng thử lại."
          );
        }
      } finally {
        if (!ignore) setLoadingSlots(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [field?.field_code, selectedDate]);

  const availableSlots = useMemo(
    () =>
      slots.filter((slot) => slot.status === "available" && slot.is_available),
    [slots]
  );

  useEffect(() => {
    if (!availableSlots.length) {
      setSelectedSlotId(null);
      return;
    }
    if (
      selectedSlotId &&
      availableSlots.some((slot) => slot.slot_id === selectedSlotId)
    ) {
      return;
    }
    const prefillMatch =
      bookingPrefill && bookingPrefill.date === selectedDate
        ? availableSlots.find(
            (slot) =>
              slot.start_time === bookingPrefill.startTime &&
              slot.end_time === bookingPrefill.endTime
          )
        : null;
    setSelectedSlotId(
      prefillMatch?.slot_id ?? availableSlots[0]?.slot_id ?? null
    );
  }, [availableSlots, bookingPrefill, selectedDate, selectedSlotId]);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.slot_id === selectedSlotId) ?? null,
    [slots, selectedSlotId]
  );

  const effectiveBooking: BookingDetails | null = useMemo(() => {
    if (!field || !selectedSlot || !selectedDate) return null;
    const minutes =
      timeToMinutes(selectedSlot.end_time) -
      timeToMinutes(selectedSlot.start_time);
    if (minutes <= 0) return null;
    const duration = minutes / 60;
    const totalPrice = duration * (field.price_per_hour || 0);
    return {
      date: selectedDate,
      startTime: selectedSlot.start_time,
      endTime: selectedSlot.end_time,
      duration,
      totalPrice,
    };
  }, [field, selectedSlot, selectedDate]);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(value);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingCode, setBookingCode] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    defaultValues: {
      customer_name: user?.user_name || "",
      customer_email: user?.email || "",
      payment_method: "banktransfer",
    },
  });

  const generateBookingCode = () =>
    "BOOK" + Math.random().toString(36).slice(2, 8).toUpperCase();

  const onSubmit = async (data: BookingFormData) => {
    if (!field || !effectiveBooking) {
      setSlotsError("Vui lòng chọn khung giờ trống trước khi tiếp tục.");
      return;
    }
    setIsProcessing(true);

    await new Promise((res) => setTimeout(res, 2000));

    const newCode = generateBookingCode();
    setBookingCode(newCode);
    setIsSuccess(true);
    setIsProcessing(false);
  };

  const minSelectableDate = todayString();

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    setSelectedSlotId(null);
    setSlotsError("");
  };

  const durationLabel = effectiveBooking
    ? minutesToLabel(Math.round(effectiveBooking.duration * 60))
    : null;

  if (isSuccess && field && effectiveBooking) {
    return (
      <div className="page">
        <div className="container">
          <div className="section text-center">
            <div className="success-icon">
              <CheckCircle className="success-icon-inner" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Đặt sân thành công!
            </h2>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-green-800 mb-2">
                Mã đặt sân của bạn:
              </h3>
              <div className="text-3xl font-mono font-bold text-green-600 bg-white p-4 rounded border-2 border-green-300">
                {bookingCode}
              </div>
              <p className="text-sm text-green-700 mt-2">
                Vui lòng lưu mã này để check-in khi đến sân.
              </p>
            </div>

            <div className="text-left bg-gray-50 rounded-lg p-6 mb-6 space-y-2">
              <h4 className="font-bold text-gray-900 mb-3">
                Chi tiết đặt sân:
              </h4>
              <div>
                <strong>Sân:</strong> {field.field_name}
              </div>
              <div>
                <strong>Ngày:</strong>{" "}
                {new Date(effectiveBooking.date).toLocaleDateString("vi-VN")}
              </div>
              <div>
                <strong>Giờ:</strong> {effectiveBooking.startTime} -{" "}
                {effectiveBooking.endTime} (
                {minutesToLabel(
                  Math.round(effectiveBooking.duration * 60)
                )}
                )
              </div>
              <div>
                <strong>Tổng tiền:</strong>{" "}
                {formatPrice(effectiveBooking.totalPrice)}
              </div>
              <div>
                <strong>Địa chỉ:</strong> {field.address}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate("/")}
                className="btn-primary w-full"
              >
                Về trang chủ
              </button>
              <button
                onClick={() => navigate("/fields")}
                className="btn-ghost w-full"
              >
                Đặt sân khác
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Lưu ý:</strong> Vui lòng đến sân trước 15 phút so với
                giờ đặt. Mang theo mã đặt sân và giấy tờ tùy thân để xác nhận.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isSuccess && !loadingField && fieldError) {
    return (
      <div className="page">
        <div className="container">
          <div className="section text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-2xl font-semibold text-gray-900">
              Không thể tải thông tin sân
            </h2>
            <p className="text-gray-600">{fieldError}</p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (!id) return;
                setFieldError("");
                setLoadingField(true);
                void (async () => {
                  try {
                    const fetched = await fetchFieldById(Number(id));
                    setField(fetched ?? null);
                    setFieldError("");
                  } catch (err: any) {
                    setFieldError(
                      err?.message ||
                        "Không thể tải thông tin sân. Vui lòng thử lại."
                    );
                    setField(null);
                  } finally {
                    setLoadingField(false);
                  }
                })();
              }}
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isSuccess && !loadingField && !field) {
    return (
      <div className="page">
        <div className="container">
          <div className="section text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h2 className="text-2xl font-semibold text-gray-900">
              Không tìm thấy sân
            </h2>
            <p className="text-gray-600">
              Vui lòng quay lại trang chi tiết sân để chọn lại.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate(`/fields/${id ?? ""}`)}
            >
              Quay lại trang sân
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <button
          onClick={() => navigate(-1)}
          className="btn-link inline-flex items-center mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Quay lại
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section className="section">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                1. Chọn ngày và khung giờ
              </h2>
              {!field ? (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>
                    Không tìm thấy thông tin sân. Vui lòng quay lại trang trước.
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="label inline-flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Ngày thi đấu
                    </label>
                    <input
                      type="date"
                      className="input"
                      min={minSelectableDate}
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="label inline-flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Khung giờ trống
                    </label>
                    {loadingSlots ? (
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="spinner" />
                        Đang tải khung giờ...
                      </div>
                    ) : slots.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {slots.map((slot) => {
                            const isAvailable =
                              slot.status === "available" && slot.is_available;
                            const isActive =
                              isAvailable && slot.slot_id === selectedSlotId;
                            const holdInfo =
                              slot.status === "held"
                                ? formatHoldExpiresAt(slot.hold_expires_at)
                                : "";

                            return (
                              <button
                                key={slot.slot_id}
                                type="button"
                                onClick={() => {
                                  if (!isAvailable) return;
                                  setSelectedSlotId(slot.slot_id);
                                  setSlotsError("");
                                }}
                                disabled={!isAvailable}
                                className={`px-3 py-3 rounded-lg border text-left transition ${
                                  isActive
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                                    : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40"
                                } ${
                                  !isAvailable
                                    ? "cursor-not-allowed opacity-60 hover:border-gray-200 hover:bg-transparent"
                                    : ""
                                }`}
                              >
                                <div className="font-semibold">
                                  {slot.start_time} - {slot.end_time}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {slotDurationLabel(slot)}
                                </div>
                                {!isAvailable && (
                                  <div className="mt-2 text-xs text-gray-600">
                                    {slot.status === "booked"
                                      ? "Đã đặt"
                                      : slot.status === "held" && holdInfo
                                      ? `Đang giữ chỗ (hết hạn ${holdInfo})`
                                      : slot.status === "held"
                                      ? "Đang giữ chỗ"
                                      : "Không khả dụng"}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {availableSlots.length === 0 && (
                          <p className="text-sm text-amber-600 mt-3">
                            Tất cả khung giờ trong ngày đã được giữ hoặc đặt.
                            Vui lòng chọn ngày khác.
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>
                          {slotsError ||
                            "Ngày này chưa có lịch trống được mở."}
                        </span>
                      </div>
                    )}
                    {slotsError && slots.length > 0 && availableSlots.length > 0 && (
                      <p className="text-red-600 text-sm mt-2">{slotsError}</p>
                    )}
                  </div>

                  {effectiveBooking && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-emerald-800">
                          Đã chọn:
                        </div>
                        <div className="text-sm text-emerald-700">
                          {new Date(
                            effectiveBooking.date
                          ).toLocaleDateString("vi-VN")}{" "}
                          • {effectiveBooking.startTime} -{" "}
                          {effectiveBooking.endTime}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-emerald-700">
                          Thời lượng
                        </div>
                        <div className="font-semibold text-emerald-800">
                          {durationLabel}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="section">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                2. Thông tin người đặt
              </h2>

              {!field || !effectiveBooking ? (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                  Vui lòng chọn ngày và khung giờ trước khi nhập thông tin đặt
                  sân.
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <label className="label inline-flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      {...register("customer_name", {
                        required: "Vui lòng nhập họ và tên",
                        minLength: { value: 2, message: "Ít nhất 2 ký tự" },
                      })}
                      className="input"
                      placeholder="Nhập họ và tên của bạn"
                    />
                    {errors.customer_name && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.customer_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="label inline-flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email *
                    </label>
                    <input
                      type="email"
                      {...register("customer_email", {
                        required: "Vui lòng nhập email",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Email không hợp lệ",
                        },
                      })}
                      className="input"
                      placeholder="Nhập email của bạn"
                    />
                    {errors.customer_email && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.customer_email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="label inline-flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      {...register("customer_phone", {
                        required: "Vui lòng nhập số điện thoại",
                        pattern: {
                          value: /^[0-9]{10,11}$/,
                          message: "Số điện thoại phải có 10-11 chữ số",
                        },
                      })}
                      className="input"
                      placeholder="Nhập số điện thoại của bạn"
                    />
                    {errors.customer_phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.customer_phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="label inline-flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Phương thức thanh toán
                    </label>
                    <label className="radio-tile">
                      <input
                        type="radio"
                        value="banktransfer"
                        {...register("payment_method")}
                        defaultChecked
                      />
                      <div className="radio-body">
                        <div className="font-medium text-gray-900">
                          Chuyển khoản ngân hàng
                        </div>
                        <div className="card-subtitle">
                          Thanh toán qua chuyển khoản
                        </div>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="label">Ghi chú (tùy chọn)</label>
                    <textarea
                      {...register("notes")}
                      rows={3}
                      className="input"
                      placeholder="Thêm ghi chú nếu cần..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="btn-primary w-full"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang xử lý thanh toán...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        <span>Xác nhận đặt sân</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="section sticky top-8 space-y-4">
              <h3 className="text-xl font-bold text-gray-900">
                Tóm tắt đặt sân
              </h3>

              {loadingField ? (
                <div className="loading-wrap">
                  <div className="spinner" />
                </div>
              ) : field ? (
                <div className="space-y-4">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img
                      src={
                        field.images?.[0]?.image_url ||
                        "https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg"
                      }
                      alt={field.field_name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <h4 className="font-bold text-lg text-gray-900">
                      {field.field_name}
                    </h4>
                    <p className="text-gray-600 capitalize">
                      {field.sport_type}
                    </p>
                    <p className="card-subtitle">{field.shop?.shop_name}</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Ngày:
                      </span>
                      <span className="font-medium">
                        {effectiveBooking
                          ? new Date(
                              effectiveBooking.date
                            ).toLocaleDateString("vi-VN")
                          : "-"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Giờ:
                      </span>
                      <span className="font-medium">
                        {effectiveBooking
                          ? `${effectiveBooking.startTime} - ${effectiveBooking.endTime}`
                          : "-"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Thời lượng:</span>
                      <span className="font-medium">
                        {durationLabel ?? "-"}
                      </span>
                    </div>
                  </div>

                  <div className="border-top pt-4">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-5 h-5" />
                        Tổng tiền:
                      </span>
                      <span className="text-emerald-600">
                        {effectiveBooking
                          ? formatPrice(effectiveBooking.totalPrice)
                          : "-"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Lưu ý:</strong> Sau khi thanh toán thành công, bạn
                      sẽ nhận được mã đặt sân để check-in.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="card-subtitle">
                  Không tìm thấy thông tin sân.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
