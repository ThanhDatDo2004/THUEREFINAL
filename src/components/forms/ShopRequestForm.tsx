import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Send,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
} from "lucide-react";

interface ShopRequestFormData {
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  message: string;
}

const ShopRequestForm: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShopRequestFormData>();

  const onSubmit = async (data: ShopRequestFormData) => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("Shop request submitted:", data);
    setIsSubmitted(true);
    reset();
    setIsSubmitting(false);

    // Hide success message after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
    }, 3000);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-blue-50 py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="header-center">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Đăng ký mở Shop
            </h2>
            <p className="text-gray-600">
              Tham gia cùng ThueRe để mở rộng kinh doanh sân thể thao của bạn
            </p>
          </div>

          {isSubmitted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-green-800 font-medium">
                  Yêu cầu đã được gửi thành công! Chúng tôi sẽ liên hệ với bạn
                  trong vòng 24h.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="">
            {/* Full Name */}
            <div>
              <label className="label">
                <User className="w-4 h-4 inline mr-2" />
                Họ và tên
              </label>
              <input
                type="text"
                {...register("full_name", {
                  required: "Vui lòng nhập họ và tên",
                  minLength: {
                    value: 2,
                    message: "Họ tên phải có ít nhất 2 ký tự",
                  },
                })}
                className="input"
                placeholder="Nhập họ và tên của bạn"
              />
              {errors.full_name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="label">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                {...register("email", {
                  required: "Vui lòng nhập email",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email không hợp lệ",
                  },
                })}
                className="input"
                placeholder="Nhập địa chỉ email của bạn"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="label">
                <Phone className="w-4 h-4 inline mr-2" />
                Số điện thoại
              </label>
              <input
                type="tel"
                {...register("phone_number", {
                  required: "Vui lòng nhập số điện thoại",
                  pattern: {
                    value: /^[0-9]{10,11}$/,
                    message: "Số điện thoại phải có 10-11 chữ số",
                  },
                })}
                className="input"
                placeholder="Nhập số điện thoại của bạn"
              />
              {errors.phone_number && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.phone_number.message}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="label">
                <MapPin className="w-4 h-4 inline mr-2" />
                Địa chỉ
              </label>
              <input
                type="text"
                {...register("address", {
                  required: "Vui lòng nhập địa chỉ",
                  minLength: {
                    value: 10,
                    message: "Địa chỉ phải có ít nhất 10 ký tự",
                  },
                })}
                className="input"
                placeholder="Nhập địa chỉ shop của bạn"
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.address.message}
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="label">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Tin nhắn
              </label>
              <textarea
                rows={4}
                {...register("message", {
                  minLength: {
                    value: 20,
                    message: "Tin nhắn phải có ít nhất 20 ký tự",
                  },
                })}
                className="input"
                placeholder="Mô tả về shop và các loại sân bạn muốn cho thuê..."
              />
              {errors.message && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.message.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={isSubmitting} className="input btn-primary">
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Gửi yêu cầu</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              Quy trình duyệt Shop:
            </h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Gửi form đăng ký</li>
              <li>2. Admin xem xét thông tin (24-48h)</li>
              <li>3. Liên hệ xác nhận qua email/phone</li>
              <li>4. Kích hoạt tài khoản Shop</li>
              <li>5. Bắt đầu quản lý sân trên hệ thống</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopRequestForm;
