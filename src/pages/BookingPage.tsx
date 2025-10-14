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
import {
  confirmFieldBooking,
  type ConfirmBookingResponse,
} from "../models/booking.api";
import type { FieldWithImages } from "../types";
import {
  getSportLabel,
  resolveFieldPrice,
} from "../utils/field-helpers";
import resolveImageUrl from "../utils/image-helpers";

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
  slotCount: number;
  isContiguous: boolean;
};

type BookingLocationState = {
  field?: FieldWithImages;
  bookingDetails?: BookingStatePayload;
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

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
};

const deriveSlotState = (slot: FieldSlot) => {
  const normalizedStatus = String(slot.status ?? "").toLowerCase();
  const availabilityState = String(
    slot.availability_state ?? slot.availability_status ?? ""
  ).toLowerCase();

  let isAvailable: boolean | undefined;
  const updateAvailability = (hint: boolean | undefined) => {
    if (typeof hint !== "boolean") return;
    if (hint === false) {
      isAvailable = false;
      return;
    }
    if (isAvailable !== false) {
      isAvailable = true;
    }
  };

  updateAvailability(slot.is_available);
  if (availabilityState === "available") {
    updateAvailability(true);
  } else if (
    availabilityState === "unavailable" ||
    availabilityState === "unavailable_slot"
  ) {
    updateAvailability(false);
  }

  if (normalizedStatus === "available") {
    updateAvailability(true);
  }
  if (
    [
      "booked",
      "blocked",
      "on_hold",
      "held",
      "confirmed",
      "reserved",
      "disabled",
    ].includes(normalizedStatus)
  ) {
    updateAvailability(false);
  }

  const isHeld = ["held", "on_hold", "holding"].includes(normalizedStatus);
  const isBooked = ["booked", "confirmed", "reserved"].includes(
    normalizedStatus
  );
  const isBlocked = ["blocked", "disabled"].includes(normalizedStatus);
  const computedIsAvailable =
    isAvailable !== false && !isHeld && !isBooked && !isBlocked;

  return {
    isAvailable: computedIsAvailable,
    isHeld,
    isBooked,
    isBlocked,
    normalizedStatus,
  };
};

const BookingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const locationState =
    typeof location.state === "object" && location.state !== null
      ? (location.state as BookingLocationState)
      : undefined;
  const fieldFromState = locationState?.field;
  const rawBookingPrefill = locationState?.bookingDetails;

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
        } catch (error: unknown) {
          if (!ignore) {
            const message = getErrorMessage(
              error,
              "Không thể tải thông tin sân. Vui lòng thử lại."
            );
            setFieldError(message);
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
  const [selectedSlotIds, setSelectedSlotIds] = useState<number[]>([]);

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
        const res = await fetchFieldAvailability(
          field.field_code,
          selectedDate
        );
        if (!ignore) {
          setSlots(res.slots ?? []);
          if (!res.slots?.length) {
            setSlotsError("Ngày này chưa mở lịch hoặc đã kín lịch.");
          }
        }
      } catch (error: unknown) {
        if (!ignore) {
          setSlots([]);
          const message = getErrorMessage(
            error,
            "Không thể tải khung giờ trống. Vui lòng thử lại."
          );
          setSlotsError(message);
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
    () => slots.filter((slot) => deriveSlotState(slot).isAvailable),
    [slots]
  );

  useEffect(() => {
    if (!availableSlots.length) {
      setSelectedSlotIds([]);
      return;
    }

    const sortedAvailable = [...availableSlots].sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    );

    const buildPrefillSelection = () => {
      if (
        !bookingPrefill ||
        bookingPrefill.date !== selectedDate ||
        !bookingPrefill.startTime
      ) {
        return [] as number[];
      }
      const requiredMinutes = Math.round(
        Math.max(0, (bookingPrefill.duration ?? 0) * 60)
      );
      if (requiredMinutes <= 0) {
        return [] as number[];
      }
      const startIndex = sortedAvailable.findIndex(
        (slot) => slot.start_time === bookingPrefill.startTime
      );
      if (startIndex === -1) {
        return [] as number[];
      }
      const collected: typeof sortedAvailable = [];
      let minutesLeft = requiredMinutes;
      for (
        let index = startIndex;
        index < sortedAvailable.length && minutesLeft > 0;
        index += 1
      ) {
        const current = sortedAvailable[index];
        if (index > startIndex) {
          const prev = sortedAvailable[index - 1];
          if (
            timeToMinutes(current.start_time) !==
            timeToMinutes(prev.end_time)
          ) {
            return [] as number[];
          }
        }
        const duration =
          timeToMinutes(current.end_time) - timeToMinutes(current.start_time);
        if (duration <= 0) {
          return [] as number[];
        }
        collected.push(current);
        minutesLeft -= duration;
      }

      if (minutesLeft > 0) {
        return [] as number[];
      }

      return collected.map((slot) => slot.slot_id);
    };

    setSelectedSlotIds((prev) => {
      const valid = prev.filter((id) =>
        sortedAvailable.some((slot) => slot.slot_id === id)
      );

      if (valid.length > 0) {
        if (valid.length === prev.length) {
          return prev;
        }
        return valid;
      }

      const prefillIds = buildPrefillSelection();
      if (prefillIds.length > 0) {
        return prefillIds;
      }

      return sortedAvailable.length ? [sortedAvailable[0].slot_id] : [];
    });
  }, [availableSlots, bookingPrefill, selectedDate]);

  const selectedSlots = useMemo(() => {
    if (!selectedSlotIds.length) return [];
    const slotMap = new Map(slots.map((slot) => [slot.slot_id, slot]));
    return selectedSlotIds
      .map((id) => slotMap.get(id))
      .filter((slot): slot is FieldSlot => Boolean(slot))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [selectedSlotIds, slots]);

  const effectiveBooking: BookingDetails | null = useMemo(() => {
    if (!field || !selectedSlots.length || !selectedDate) return null;

    const totalMinutes = selectedSlots.reduce((acc, slot) => {
      const duration =
        timeToMinutes(slot.end_time) - timeToMinutes(slot.start_time);
      if (duration <= 0) {
        return acc;
      }
      return acc + duration;
    }, 0);

    if (totalMinutes <= 0) return null;

    const firstSlot = selectedSlots[0];
    const lastSlot = selectedSlots[selectedSlots.length - 1];

    let isContiguous = true;
    for (let i = 1; i < selectedSlots.length; i += 1) {
      const prev = selectedSlots[i - 1];
      const current = selectedSlots[i];
      if (timeToMinutes(prev.end_time) !== timeToMinutes(current.start_time)) {
        isContiguous = false;
        break;
      }
    }

    const duration = totalMinutes / 60;
    const hourlyPrice = resolveFieldPrice(field);
    const totalPrice = duration * hourlyPrice;
    return {
      date: selectedDate,
      startTime: firstSlot.start_time,
      endTime: lastSlot.end_time,
      duration,
      totalPrice,
      slotCount: selectedSlots.length,
      isContiguous,
    };
  }, [field, selectedDate, selectedSlots]);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(value);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmation, setConfirmation] =
    useState<ConfirmBookingResponse | null>(null);

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

  const onSubmit = async (formData: BookingFormData) => {
    if (!field || !effectiveBooking || !selectedSlots.length) {
      setSlotsError("Vui lòng chọn khung giờ trống trước khi tiếp tục.");
      return;
    }
    setIsProcessing(true);
    setSlotsError("");
    setIsSuccess(false);
    setConfirmation(null);

    try {
      const response = await confirmFieldBooking(field.field_code, {
        slots: selectedSlots.map((slot) => ({
          slot_id: Number(slot.slot_id),
          play_date: slot.play_date,
          start_time: slot.start_time,
          end_time: slot.end_time,
        })),
        payment_method: formData.payment_method,
        total_price: effectiveBooking.totalPrice,
        customer: {
          name: formData.customer_name,
          email: formData.customer_email,
          phone: formData.customer_phone,
        },
        notes: formData.notes,
      });

      setConfirmation(response);
      setIsSuccess(true);
    } catch (error: unknown) {
      setIsSuccess(false);
      const message = getErrorMessage(
        error,
        "Không thể xác nhận thanh toán. Vui lòng thử lại."
      );
      setSlotsError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const minSelectableDate = todayString();

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    setSelectedSlotIds([]);
    setSlotsError("");
  };

  const durationLabel = effectiveBooking
    ? minutesToLabel(Math.round(effectiveBooking.duration * 60))
    : null;

  const primaryImage = field?.images?.[0];
  const fieldCoverImage =
    resolveImageUrl(primaryImage?.image_url, primaryImage?.storage) ||
    "https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg";

  const isFieldLoading = loadingField && !field;
  const hasSelectedSlots = Boolean(effectiveBooking);

  if (isSuccess && confirmation && field && effectiveBooking) {
    const paymentMethodLabel = (() => {
      const method = confirmation.payment_method
        ? confirmation.payment_method.toString().toLowerCase()
        : "";
      if (["banktransfer", "bank_transfer"].includes(method)) {
        return "Chuyển khoản ngân hàng";
      }
      if (method === "ewallet") return "Ví điện tử";
      if (method === "card") return "Thẻ";
      if (method === "cash") return "Tiền mặt";
      return confirmation.payment_method || "Không xác định";
    })();

    const paymentStatusLabel = (() => {
      const status = confirmation.payment_status
        ? confirmation.payment_status.toString()
        : "";
      if (!status) return "Không xác định";
      if (status === "mock_success") {
        return "Thanh toán mô phỏng thành công";
      }
      return status
        .replace(/_/g, " ")
        .replace(/^\w/, (c) => c.toUpperCase());
    })();

    const transactionId =
      confirmation.transaction_id && confirmation.transaction_id.trim()
        ? confirmation.transaction_id
        : "Đang chờ cấp";

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
                {confirmation.booking_code}
              </div>
              <p className="text-sm text-green-700 mt-2">
                Vui lòng lưu mã này để check-in khi đến sân.
              </p>
            </div>

            <div className="mb-6 grid gap-3 text-left md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Phương thức thanh toán
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {paymentMethodLabel}
                </p>
                <p className="text-xs text-gray-500">
                  Mã: {confirmation.payment_method}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Trạng thái thanh toán
                </p>
                <p className="mt-1 text-sm font-medium text-emerald-700">
                  {paymentStatusLabel}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Mã giao dịch
                </p>
                <p className="mt-1 font-mono text-sm text-gray-900">
                  {transactionId}
                </p>
              </div>
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
                {minutesToLabel(Math.round(effectiveBooking.duration * 60))})
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
                giờ đặt. Mang theo mã đặt sân, mã giao dịch và giấy tờ tùy thân
                để xác nhận. Thông tin chi tiết đã được gửi tới email của bạn.
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
                  } catch (error: unknown) {
                    const message = getErrorMessage(
                      error,
                      "Không thể tải thông tin sân. Vui lòng thử lại."
                    );
                    setFieldError(message);
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
    <div className="page bg-slate-50/80 pb-10">
      <div className="container max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="btn-link inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại
          </button>
          {field?.field_code && (
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Mã sân: {field.field_code}
            </span>
          )}
        </div>

        <div className="mb-8">
          <ol className="flex flex-wrap items-center gap-3 text-sm">
            <li className="flex items-center gap-2 rounded-full border border-emerald-400 bg-emerald-50 px-3 py-1 text-emerald-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">
                1
              </span>
              Chọn khung giờ
            </li>
            <li
              className={`flex items-center gap-2 rounded-full border px-3 py-1 ${
                hasSelectedSlots
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  hasSelectedSlots
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                2
              </span>
              Nhập thông tin
            </li>
            <li className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-gray-500">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
                3
              </span>
              Xác nhận thanh toán
            </li>
          </ol>
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <section className="section space-y-6">
              <div>
                {isFieldLoading ? (
                  <div className="rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm">
                    <div className="flex animate-pulse gap-4">
                      <div className="h-20 w-20 rounded-lg bg-gray-200" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 w-2/3 rounded bg-gray-200" />
                        <div className="h-3 w-1/2 rounded bg-gray-200" />
                        <div className="h-3 w-3/4 rounded bg-gray-200" />
                      </div>
                    </div>
                  </div>
                ) : field ? (
                  <div className="rounded-xl border border-gray-200 bg-white/90 p-4 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex gap-3">
                        <div className="h-20 w-20 overflow-hidden rounded-lg bg-gray-100 shadow-inner">
                          <img
                            src={fieldCoverImage}
                            alt={field.field_name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                            {field.shop?.shop_name || "Cơ sở"}
                          </p>
                          <h1 className="text-xl font-bold text-gray-900">
                            {field.field_name}
                          </h1>
                          <p className="text-sm text-gray-600">
                            {field.address}
                          </p>
                        </div>
                      </div>
                      <div className="grid w-full gap-3 text-sm md:w-auto md:grid-cols-2">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                          <span className="block text-xs uppercase tracking-wide text-gray-500">
                            Giá / giờ
                          </span>
                          <span className="mt-1 block font-semibold text-gray-900">
                            {(() => {
                              const hourly = resolveFieldPrice(field);
                              return hourly > 0 ? formatPrice(hourly) : "Liên hệ";
                            })()}
                          </span>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                          <span className="block text-xs uppercase tracking-wide text-gray-500">
                            Loại sân
                          </span>
                          <span className="mt-1 block font-semibold text-gray-900 capitalize">
                            {getSportLabel(field.sport_type)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-700">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>
                      Không tìm thấy thông tin sân. Vui lòng quay lại trang
                      trước.
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    1. Chọn ngày và khung giờ
                  </h2>
                  <p className="text-sm text-gray-500">
                    Lịch trống hiển thị theo thời gian thực từ hệ thống quản lý
                    của sân.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-[220px,1fr]">
                  <div>
                    <label className="label inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Ngày thi đấu
                    </label>
                    <input
                      type="date"
                      className="input"
                      min={minSelectableDate}
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      disabled={isFieldLoading}
                    />
                  </div>
                  <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-700">
                    {hasSelectedSlots && effectiveBooking ? (
                      <div className="space-y-1">
                        <span>
                          Đã chọn{" "}
                          {new Date(effectiveBooking.date).toLocaleDateString(
                            "vi-VN"
                          )}{" "}
                          • {effectiveBooking.startTime} -{" "}
                          {effectiveBooking.endTime} ({durationLabel},{" "}
                          {effectiveBooking.slotCount} khung giờ)
                        </span>
                        {!effectiveBooking.isContiguous && (
                          <span className="block text-xs text-amber-700">
                            Lưu ý: các khung giờ đã chọn không liền kề nhau.
                          </span>
                        )}
                      </div>
                    ) : (
                      <span>
                        Chọn ngày và khung giờ phù hợp để tiếp tục điền thông
                        tin đặt sân.
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="label inline-flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Khung giờ trống
                  </label>
                  {loadingSlots ? (
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="spinner" />
                      Đang tải khung giờ...
                    </div>
                  ) : slots.length > 0 ? (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {slots.map((slot) => {
                          const slotState = deriveSlotState(slot);
                          const isSelectable = slotState.isAvailable;
                          const {
                            isHeld,
                            isBooked,
                            isBlocked,
                            normalizedStatus,
                          } = slotState;
                          const isActive =
                            isSelectable &&
                            selectedSlotIds.includes(slot.slot_id);
                          const slotDurationMinutes =
                            timeToMinutes(slot.end_time) -
                            timeToMinutes(slot.start_time);
                          const slotDurationText =
                            slotDurationMinutes > 0
                              ? minutesToLabel(slotDurationMinutes)
                              : "";
                          const holdInfo = isHeld
                            ? formatHoldExpiresAt(slot.hold_expires_at)
                            : "";
                          const statusLabel = isSelectable
                            ? "Có thể đặt"
                            : isHeld
                            ? "Đang giữ chỗ"
                            : isBooked
                            ? "Đã đặt"
                            : isBlocked
                            ? "Không khả dụng"
                            : normalizedStatus
                            ? normalizedStatus
                                .replace(/_/g, " ")
                                .replace(/^\w/, (c) => c.toUpperCase())
                            : "Không khả dụng";
                          const badgeClasses = isActive
                            ? "bg-emerald-500 text-white"
                            : isSelectable
                            ? "bg-emerald-100 text-emerald-700"
                            : isHeld
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-200 text-gray-600";
                          const buttonClasses = [
                            "relative flex h-full flex-col gap-2 rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1",
                            isActive
                              ? "border-emerald-500 bg-emerald-50 shadow-sm"
                              : isHeld
                              ? "border-amber-200 bg-amber-50/70"
                              : isSelectable
                              ? "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/60"
                              : "border-gray-200 bg-gray-100 text-gray-500",
                            !isSelectable
                              ? "cursor-not-allowed opacity-70"
                              : "",
                          ].join(" ");

                          return (
                            <button
                              key={slot.slot_id}
                              type="button"
                              onClick={() => {
                                if (!isSelectable) return;
                                setSelectedSlotIds((prev) => {
                                  const exists = prev.includes(slot.slot_id);
                                  const next = exists
                                    ? prev.filter((id) => id !== slot.slot_id)
                                    : [...prev, slot.slot_id];
                                  if (!next.length) {
                                    return [];
                                  }
                                  const slotMap = new Map(
                                    slots.map((entry) => [
                                      entry.slot_id,
                                      entry,
                                    ])
                                  );
                                  return next
                                    .map((id) => slotMap.get(id))
                                    .filter(
                                      (entry): entry is FieldSlot =>
                                        Boolean(entry)
                                    )
                                    .sort((a, b) =>
                                      a.start_time.localeCompare(b.start_time)
                                    )
                                    .map((entry) => entry.slot_id);
                                });
                                setSlotsError("");
                              }}
                              disabled={!isSelectable}
                              className={buttonClasses}
                              aria-pressed={isActive}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-gray-900">
                                  {slot.start_time} - {slot.end_time}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClasses}`}
                                >
                                  {statusLabel}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{slotDurationText}</span>
                                {holdInfo && (
                                  <span className="font-medium text-amber-600">
                                    Giữ đến {holdInfo}
                                  </span>
                                )}
                              </div>
                              {!isSelectable && !isHeld && (
                                <span className="text-xs text-gray-500">
                                  {isBooked
                                    ? "Khung giờ đã được đặt"
                                    : isBlocked
                                    ? "Khung giờ tạm khóa"
                                    : "Không khả dụng"}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {availableSlots.length === 0 && (
                        <p className="mt-3 text-sm text-amber-600">
                          Tất cả khung giờ trong ngày đã được giữ hoặc đặt. Vui
                          lòng chọn ngày khác.
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-700">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <span>
                        {slotsError || "Ngày này chưa có lịch trống được mở."}
                      </span>
                    </div>
                  )}
                  {slotsError && slots.length > 0 && (
                    <p className="mt-2 text-sm text-red-600">{slotsError}</p>
                  )}
                </div>

                {effectiveBooking && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Khung giờ đã chọn
                        </p>
                        <p className="text-base font-semibold text-emerald-900">
                          {new Date(effectiveBooking.date).toLocaleDateString(
                            "vi-VN"
                          )}{" "}
                          • {effectiveBooking.startTime} -{" "}
                          {effectiveBooking.endTime}
                        </p>
                      </div>
                      <div className="text-sm text-emerald-700">
                        <span className="font-medium">Thời lượng:</span>{" "}
                        {durationLabel}
                        <span className="ml-3 font-medium">Khung giờ:</span>{" "}
                        {effectiveBooking.slotCount}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="section space-y-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  2. Thông tin người đặt
                </h2>
                <p className="text-sm text-gray-500">
                  Nhập chính xác để nhận mã đặt sân và thông báo từ hệ thống.
                </p>
              </div>

              {!field || !effectiveBooking ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700">
                  Vui lòng chọn ngày và khung giờ trước khi nhập thông tin đặt
                  sân.
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="label text-sm font-medium text-gray-700">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          {...register("customer_name", {
                            required: "Vui lòng nhập họ và tên",
                            minLength: {
                              value: 2,
                              message: "Ít nhất 2 ký tự",
                            },
                          })}
                          className="input pl-10"
                          placeholder="Nhập họ và tên của bạn"
                        />
                      </div>
                      {errors.customer_name && (
                        <p className="text-sm text-red-500">
                          {errors.customer_name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="label text-sm font-medium text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          {...register("customer_email", {
                            required: "Vui lòng nhập email",
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: "Email không hợp lệ",
                            },
                          })}
                          className="input pl-10"
                          placeholder="Nhập email của bạn"
                        />
                      </div>
                      {errors.customer_email && (
                        <p className="text-sm text-red-500">
                          {errors.customer_email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="label text-sm font-medium text-gray-700">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          {...register("customer_phone", {
                            required: "Vui lòng nhập số điện thoại",
                            pattern: {
                              value: /^[0-9]{10,11}$/,
                              message: "Số điện thoại phải có 10-11 chữ số",
                            },
                          })}
                          className="input pl-10"
                          placeholder="Nhập số điện thoại của bạn"
                          inputMode="tel"
                        />
                      </div>
                      {errors.customer_phone && (
                        <p className="text-sm text-red-500">
                          {errors.customer_phone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="label inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                        <CreditCard className="h-4 w-4" />
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
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">
                              Chuyển khoản ngân hàng
                            </span>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              Khuyến nghị
                            </span>
                          </div>
                          <p className="card-subtitle">
                            Thanh toán an toàn qua chuyển khoản sau khi hệ thống
                            xác nhận giữ chỗ.
                          </p>
                        </div>
                      </label>
                      <p className="text-xs text-gray-500">
                        Hướng dẫn chuyển khoản chi tiết sẽ được gửi qua email
                        cùng mã đặt sân.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="label text-sm font-medium text-gray-700">
                      Ghi chú (tùy chọn)
                    </label>
                    <textarea
                      {...register("notes")}
                      rows={3}
                      className="input min-h-[100px] resize-y"
                      placeholder="Ví dụ: muốn mượn bóng, yêu cầu chuẩn bị nước uống..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="btn-primary flex w-full items-center justify-center gap-3"
                    aria-busy={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Đang xử lý thanh toán...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        <span>Xác nhận đặt sân</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </section>
          </div>

          <div className="lg:col-span-1">
            <aside className="section sticky top-8 space-y-5">
              <h3 className="text-xl font-bold text-gray-900">
                Tóm tắt đặt sân
              </h3>

              {isFieldLoading ? (
                <div className="loading-wrap">
                  <div className="spinner" />
                </div>
              ) : field ? (
                <div className="space-y-5">
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <img
                      src={fieldCoverImage}
                      alt={field.field_name}
                      className="h-40 w-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {field.field_name}
                    </h4>
                    <p className="text-sm text-gray-600 capitalize">
                      {getSportLabel(field.sport_type)}
                    </p>
                    <p className="text-sm text-gray-500">{field.address}</p>
                    {field.shop?.shop_name && (
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        {field.shop.shop_name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Ngày
                      </span>
                      <span className="font-medium">
                        {effectiveBooking
                          ? new Date(effectiveBooking.date).toLocaleDateString(
                              "vi-VN"
                            )
                          : "-"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Giờ
                      </span>
                      <span className="font-medium">
                        {effectiveBooking
                          ? `${effectiveBooking.startTime} - ${effectiveBooking.endTime}`
                          : "-"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Thời lượng</span>
                      <span className="font-medium">
                        {durationLabel ?? "-"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Số khung giờ</span>
                      <span className="font-medium">
                        {effectiveBooking
                          ? effectiveBooking.slotCount
                          : "-"}
                      </span>
                    </div>

                    {effectiveBooking && !effectiveBooking.isContiguous && (
                      <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Các khung giờ được chọn không liền nhau. Vui lòng kiểm
                        tra lại trước khi xác nhận.
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-5 w-5" />
                        Tổng tiền
                      </span>
                      <span className="text-emerald-600">
                        {effectiveBooking
                          ? formatPrice(effectiveBooking.totalPrice)
                          : "-"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-emerald-700">
                      Giá tạm tính dựa trên thời lượng đã chọn. Hoàn tất thanh
                      toán để đảm bảo giữ chỗ.
                    </p>
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
                    Sau khi xác nhận, mã đặt sân và hướng dẫn thanh toán sẽ được
                    gửi qua email và hiển thị trong lịch sử đặt sân của bạn.
                  </div>
                </div>
              ) : (
                <div className="card-subtitle">
                  Không tìm thấy thông tin sân.
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
