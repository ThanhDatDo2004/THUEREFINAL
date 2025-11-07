import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Lock, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { resetPassword } from "../../models/auth.api";

const ResetPasswordPage = () => {
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
  } = useForm({ mode: "onChange" });
  const watchPassword = watch("password");

  const onSubmit = async (data) => {
    setServerMsg("");
    if (!token) {
      setServerMsg("Liên kết không hợp lệ.");
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(token, data.password);
      if (!res?.success) {
        throw new Error(res?.message || "Đặt lại mật khẩu thất bại.");
      }
      setDone(true);
      setServerMsg("Đặt lại mật khẩu thành công.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      setServerMsg(error?.response?.data?.message || error?.message || "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="hero min-h-screen flex items-center justify-center py-12 px-4">
        <div className="hero-pattern" />
        <div className="max-w-md w-full relative">
          <div className="hero-card text-center p-8">
            <div className="shop-brand justify-center mb-4">
              <div className="shop-brand-logo bg-[var(--brand-500)] text-white">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>
            <h2 className="hero-card-title mb-2">Thành công!</h2>
            <p className="hero-card-subtitle">Đang chuyển hướng đến trang đăng nhập…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hero min-h-screen flex items-center justify-center py-12 px-4">
      <div className="hero-pattern" />
      <div className="max-w-md w-full relative space-y-6">
        <div className="hero-card p-8">
          <div className="hero-card-header mb-6">
            <div className="shop-brand mb-4">
              <div className="shop-brand-logo bg-[var(--brand-600)] text-white">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="hero-card-title">Đặt lại mật khẩu</h2>
                <p className="hero-card-subtitle">Nhập mật khẩu mới của bạn</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label text-white/80">
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
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="label text-white/80">
                <Lock className="w-4 h-4 inline mr-2" /> Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  {...register("confirmPassword", {
                    required: "Vui lòng xác nhận mật khẩu",
                    validate: (value) => value === watchPassword || "Mật khẩu xác nhận không khớp",
                  })}
                  className="input"
                  placeholder="Nhập lại mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {!!serverMsg && (
              <p
                className={`text-sm mt-1 ${
                  serverMsg.includes("thành công") ? "text-emerald-300" : "text-red-400"
                }`}
              >
                {serverMsg}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Đang đổi..." : "Đổi mật khẩu"}
            </button>
          </form>
        </div>

        <Link to="/login" className="hero-shortcut">
          <div className="hero-shortcut-icon">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-white">Quay lại đăng nhập</span>
            <span className="text-sm text-white/70">Bỏ qua và đăng nhập</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
