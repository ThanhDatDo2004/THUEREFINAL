// src/pages/BookingPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
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
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getFieldById } from "../utils/fakeApi";
import type { FieldWithImages } from "../types";

interface BookingFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_method: "banktransfer";
  notes?: string;
}

type BookingDetails = {
  date: string;
  startTime: string;
  duration: number;
  totalPrice: number;
};

const BookingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation() as any;
  const navigate = useNavigate();
  const { user } = useAuth();

  // state truyền từ FieldDetailPage (nếu có)
  const fieldFromState: FieldWithImages | undefined = location.state?.field;
  const bookingFromState: BookingDetails | undefined =
    location.state?.bookingDetails;

  // fallback: nếu F5 mất state, lấy field bằng :id để vẫn render tóm tắt
  const [field, setField] = useState<FieldWithImages | null>(
    fieldFromState ?? null
  );
  const [loadingField, setLoadingField] = useState(!fieldFromState && !!id);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!fieldFromState && id) {
        setLoadingField(true);
        const fetched = await getFieldById(Number(id));
        if (alive) setField(fetched ?? null);
        setLoadingField(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [fieldFromState, id]);

  // Bước 1: chọn thời gian (nếu thiếu bookingDetails)
  const [date, setDate] = useState<string>(bookingFromState?.date ?? "");
  const [startTime, setStartTime] = useState<string>(
    bookingFromState?.startTime ?? ""
  );
  const [duration, setDuration] = useState<number>(
    bookingFromState?.duration ?? 1
  );
  const [timeError, setTimeError] = useState<string>("");
  const [timeConfirmed, setTimeConfirmed] = useState<boolean>(
    !!bookingFromState
  );

  const confirmTime = () => {
    if (!date || !startTime || !duration) {
      setTimeError("Vui lòng chọn đầy đủ ngày, giờ bắt đầu và thời lượng.");
      return;
    }
    if (!field) {
      setTimeError("Không tìm thấy thông tin sân. Vui lòng quay lại.");
      return;
    }
    setTimeError("");
    setTimeConfirmed(true);
  };

  const effectiveBooking: BookingDetails | null = useMemo(() => {
    if (!field) return null;
    const price = field.price_per_hour || 0;
    const computedTotal = duration * price;
    if (timeConfirmed) {
      return {
        date,
        startTime,
        duration,
        totalPrice: computedTotal,
      };
    }
    // nếu nhận từ state ban đầu
    if (bookingFromState) return bookingFromState;
    return null;
  }, [field, timeConfirmed, date, startTime, duration, bookingFromState]);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(n);

  // Bước 2: form thông tin & thanh toán
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
    "BOOK" + Math.random().toString(36).substr(2, 6).toUpperCase();

  const onSubmit = async (data: BookingFormData) => {
    if (!field || !effectiveBooking) return;
    setIsProcessing(true);

    // giả lập xử lý thanh toán
    await new Promise((res) => setTimeout(res, 2000));

    const newCode = generateBookingCode();
    setBookingCode(newCode);
    setIsSuccess(true);
    setIsProcessing(false);
  };

  // Màn hình thành công
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
                Vui lòng lưu mã này để check-in khi đến sân
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
                <strong>Giờ:</strong> {effectiveBooking.startTime} (
                {effectiveBooking.duration} giờ)
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

  // Trang chính
  return (
    <div className="page">
      <div className="container">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="btn-link inline-flex items-center mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Quay lại
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT: Bước 1 (nếu cần) + Bước 2 */}
          <div className="lg:col-span-2">
            {/* Bước 1: Chọn thời gian (chỉ hiện khi chưa có) */}
            {!timeConfirmed && (
              <div className="section mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Chọn thời gian đặt sân
                </h2>

                {!field ? (
                  <div className="card-subtitle">
                    Không tìm thấy thông tin sân. Vui lòng quay lại.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="label">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Ngày
                      </label>
                      <input
                        type="date"
                        className="input"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="label">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Giờ bắt đầu
                      </label>
                      <input
                        type="time"
                        step={1800}
                        className="input"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="label">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Thời lượng (giờ)
                      </label>
                      <select
                        className="select"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                      >
                        {[1, 2, 3, 4].map((h) => (
                          <option key={h} value={h}>
                            {h} giờ
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      {timeError && (
                        <div className="text-red-600 text-sm mb-2">
                          {timeError}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="card-subtitle">
                          Đơn giá:{" "}
                          {field.price_per_hour
                            ? formatPrice(field.price_per_hour)
                            : "-"}{" "}
                          / giờ
                        </div>
                        <button className="btn-primary" onClick={confirmTime}>
                          Tiếp tục
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bước 2: Form thông tin & thanh toán */}
            <div className="section">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Thông tin đặt sân
              </h2>

              {!field || !effectiveBooking ? (
                <div className="card-subtitle">
                  Vui lòng hoàn tất bước chọn thời gian trước khi nhập thông tin
                  thanh toán.
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Customer Name */}
                  <div>
                    <label className="label">
                      <User className="w-4 h-4 inline mr-2" />
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

                  {/* Customer Email */}
                  <div>
                    <label className="label">
                      <Mail className="w-4 h-4 inline mr-2" />
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

                  {/* Customer Phone */}
                  <div>
                    <label className="label">
                      <Phone className="w-4 h-4 inline mr-2" />
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

                  {/* Payment Method */}
                  <div>
                    <label className="label">
                      <CreditCard className="w-4 h-4 inline mr-2" />
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

                  {/* Notes */}
                  <div>
                    <label className="label">Ghi chú (tùy chọn)</label>
                    <textarea
                      {...register("notes")}
                      rows={3}
                      className="input"
                      placeholder="Thêm ghi chú nếu cần..."
                    />
                  </div>

                  {/* Submit */}
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
            </div>
          </div>

          {/* RIGHT: Tóm tắt đặt sân */}
          <div className="lg:col-span-1">
            <div className="section sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
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
                          ? new Date(effectiveBooking.date).toLocaleDateString(
                              "vi-VN"
                            )
                          : "-"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Giờ:
                      </span>
                      <span className="font-medium">
                        {effectiveBooking ? effectiveBooking.startTime : "-"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Thời gian:</span>
                      <span className="font-medium">
                        {effectiveBooking
                          ? `${effectiveBooking.duration} giờ`
                          : "-"}
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
