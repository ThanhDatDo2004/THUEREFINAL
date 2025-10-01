import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { resetPassword } from "../../models/auth.api";

type FormValues = { password: string; confirmPassword: string };

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverMsg, setServerMsg] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ mode: "onChange" });
  const watchPassword = watch("password");

  const onSubmit = async (data: FormValues) => {
    setServerMsg("");
    if (!token) {
      setServerMsg("Liên kết không hợp lệ.");
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(token, data.password);
      if (!res?.success)
        throw new Error(res?.message || "Đặt lại mật khẩu thất bại.");
      setDone(true);
      setServerMsg("Đặt lại mật khẩu thành công.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (e: any) {
      setServerMsg(
        e?.response?.data?.message || e?.message || "Có lỗi xảy ra."
      );
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="page bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="section auth-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Thành công!
            </h2>
            <p className="text-gray-600">
              Đang chuyển hướng đến trang đăng nhập…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="section">
          <div className="header-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Đặt lại mật khẩu
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">
                <Lock className="w-4 h-4 inline mr-2" /> Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "Vui lòng nhập mật khẩu",
                    minLength: { value: 6, message: "Tối thiểu 6 ký tự" },
                  })}
                  className="input"
                  placeholder="Mật khẩu mới"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
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

            <div>
              <label className="label">
                <Lock className="w-4 h-4 inline mr-2" /> Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  {...register("confirmPassword", {
                    required: "Vui lòng xác nhận mật khẩu",
                    validate: (v) =>
                      v === watchPassword || "Mật khẩu xác nhận không khớp",
                  })}
                  className="input"
                  placeholder="Nhập lại mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showConfirm ? (
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

            {!!serverMsg && (
              <p className="text-sm mt-1 {serverMsg.includes('thành công') ? 'text-emerald-700' : 'text-red-600'}">
                {serverMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="input btn-primary"
            >
              {loading ? "Đang đổi..." : "Đổi mật khẩu"}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link
              to="/login"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
