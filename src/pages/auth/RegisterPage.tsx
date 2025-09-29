import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Car as IdCard,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { RegisterData } from "../../types";

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterData & { confirmPassword: string }>();

  const watchPassword = watch("password");

  const onSubmit = async (data: RegisterData & { confirmPassword: string }) => {
    setRegisterError("");

    const { confirmPassword, ...userData } = data;

    const success = await registerUser(userData);

    if (success) {
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } else {
      setRegisterError("Email đã được sử dụng hoặc có lỗi xảy ra");
    }
  };

  if (isSuccess) {
    return (
      <div className="page bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="section auth-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Đăng ký thành công!
            </h2>
            <p className="text-gray-600">
              Đang chuyển hướng đến trang đăng nhập...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="section">
          {/* Header */}
          <div className="header-center">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Đăng ký</h2>
            <p className="mt-2 text-gray-600">
              Tạo tài khoản SportBooking của bạn
            </p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="label">
                <User className="w-4 h-4 inline mr-2" />
                Họ và tên
              </label>
              <input
                type="text"
                {...register("user_name", {
                  required: "Vui lòng nhập họ và tên",
                  minLength: {
                    value: 2,
                    message: "Họ tên phải có ít nhất 2 ký tự",
                  },
                })}
                className="input"
                placeholder="Nhập họ và tên của bạn"
              />
              {errors.user_name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.user_name.message}
                </p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="label">
                <IdCard className="w-4 h-4 inline mr-2" />
                Tên đăng nhập
              </label>
              <input
                type="text"
                {...register("user_id", {
                  required: "Vui lòng nhập tên đăng nhập",
                  minLength: {
                    value: 3,
                    message: "Tên đăng nhập phải có ít nhất 3 ký tự",
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: "Tên đăng nhập chỉ được chứa chữ, số và dấu _",
                  },
                })}
                className="input"
                placeholder="Nhập tên đăng nhập"
              />
              {errors.user_id && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.user_id.message}
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
                placeholder="Nhập email của bạn"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* User Level */}
            <div>
              <label className="label">Loại tài khoản</label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    value="cus"
                    {...register("level_type", {
                      required: "Vui lòng chọn loại tài khoản",
                    })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium">Khách hàng</span>
                </label>
                <label className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    value="shop"
                    {...register("level_type", {
                      required: "Vui lòng chọn loại tài khoản",
                    })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium">Chủ sân</span>
                </label>
              </div>
              {errors.level_type && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.level_type.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="label">
                <Lock className="w-4 h-4 inline mr-2" />
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "Vui lòng nhập mật khẩu",
                    minLength: {
                      value: 6,
                      message: "Mật khẩu phải có ít nhất 6 ký tự",
                    },
                  })}
                  className="input"
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label">
                <Lock className="w-4 h-4 inline mr-2" />
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword", {
                    required: "Vui lòng xác nhận mật khẩu",
                    validate: (value) =>
                      value === watchPassword || "Mật khẩu xác nhận không khớp",
                  })}
                  className="input"
                  placeholder="Nhập lại mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Error Message */}
            {registerError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{registerError}</p>
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="input btn-primary">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang đăng ký...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Đăng ký</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Đã có tài khoản?{" "}
              <Link
                to="/login"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
