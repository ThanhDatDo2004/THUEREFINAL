import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { LoginData } from "../../types";

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth(); // ❗️không dùng loading global cho nút
  const navigate = useNavigate();
  const location = useLocation() as any;

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({ mode: "onChange" });

  const onSubmit = async (data: LoginData) => {
    setLoginError("");
    setSubmitting(true);
    try {
      const ok = await login(data.email.trim(), data.password);
      if (ok) {
        const fromPath = location.state?.from?.pathname || "/";
        const carryState = location.state?.carry;
        navigate(fromPath, { replace: true, state: carryState });
      }
    } catch (e: any) {
      setLoginError(e?.message || "Email hoặc mật khẩu không chính xác");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="section">
          <div className="header-center">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Đăng nhập</h2>
            <p className="mt-2 text-gray-600">Chào mừng trở lại với SportBooking</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="label"><Mail className="w-4 h-4 inline mr-2" />Email</label>
              <input
                type="email"
                {...register("email", {
                  required: "Vui lòng nhập email",
                  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Email không hợp lệ" },
                })}
                className="input"
                placeholder="Nhập email của bạn"
                autoComplete="username"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label"><Lock className="w-4 h-4 inline mr-2" />Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "Vui lòng nhập mật khẩu",
                    minLength: { value: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
                  })}
                  className="input"
                  placeholder="Nhập mật khẩu của bạn"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <div className="text-right -mt-2 mb-2">
              <Link to="/forgot" className="text-sm text-emerald-700 hover:underline">Quên mật khẩu?</Link>
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{loginError}</p>
              </div>
            )}

            <button type="submit" disabled={submitting} className="input btn-primary">
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Đăng nhập</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">Đăng ký ngay</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
