import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  CheckCircle2,
  TimerReset,
} from "lucide-react";
import { api } from "../../models/api";
import { useAuth } from "../../contexts/AuthContext";
import { RegisterData } from "../../types";

type VerifyPhase = "idle" | "sending" | "sent" | "verifying" | "verified";

const RESEND_SECONDS = 60;

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // NEW: states cho xác minh email
  const [verifyPhase, setVerifyPhase] = useState<VerifyPhase>("idle");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [serverMsg, setServerMsg] = useState("");

  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    getValues,
    resetField,
  } = useForm<RegisterData & { confirmPassword: string }>({
    mode: "onChange", // bật validate realtime
  });

  const watchPassword = watch("password");
  const watchConfirm = watch("confirmPassword");
  const watchEmail = watch("email");

  // countdown resend
  React.useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  // Nếu user đổi mật khẩu/confirm/email sau khi đã gửi/verify → reset trạng thái OTP để tránh gửi nhầm
  React.useEffect(() => {
    // Khi thay đổi password hoặc confirm → buộc xác minh lại
    if (verifyPhase === "verified" || verifyPhase === "sent") {
      setVerifyPhase("idle");
      setOtp("");
      setOtpError("");
      setServerMsg("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchPassword, watchConfirm]);

  React.useEffect(() => {
    if (verifyPhase === "verified" || verifyPhase === "sent") {
      setVerifyPhase("idle");
      setOtp("");
      setOtpError("");
      setServerMsg("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchEmail]);

  const canSendCode = useMemo(() => {
    // Email hợp lệ?
    const re = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    const emailValid = re.test(String(watchEmail ?? ""));

    // Mật khẩu và xác nhận đã nhập & khớp?
    const pwOk =
      !!watchPassword &&
      !!watchConfirm &&
      watchConfirm === watchPassword &&
      !errors.password &&
      !errors.confirmPassword;

    return emailValid && pwOk && resendIn === 0 && verifyPhase !== "verified";
  }, [
    watchEmail,
    watchPassword,
    watchConfirm,
    errors.password,
    errors.confirmPassword,
    resendIn,
    verifyPhase,
  ]);

  const sendCode = async () => {
    setServerMsg("");
    setOtpError("");
    if (!canSendCode) return;

    try {
      setVerifyPhase("sending");
      const { data } = await api.post("/auth/send-code", {
        email: getValues("email"),
        // purpose: "register", // nếu backend bạn có hỗ trợ phân biệt mục đích
      });

      if (!data?.success) {
        throw new Error(data?.message || "Không gửi được mã. Thử lại.");
      }

      setVerifyPhase("sent");
      setResendIn(RESEND_SECONDS);
      setServerMsg("Đã gửi mã xác minh đến email của bạn.");
    } catch (e: any) {
      setVerifyPhase("idle");
      const msg =
        e?.response?.data?.message || e?.message || "Có lỗi xảy ra khi gửi mã.";
      setServerMsg(msg);
    }
  };

  const verifyCode = async () => {
    setOtpError("");
    setServerMsg("");
    if (!otp || otp.length < 4) {
      setOtpError("Vui lòng nhập mã hợp lệ.");
      return;
    }
    try {
      setVerifyPhase("verifying");
      const { data } = await api.post("/auth/verify-code", {
        email: getValues("email"),
        code: otp,
      });

      if (!data?.success) {
        throw new Error(
          data?.message || "Mã xác minh không đúng hoặc đã hết hạn."
        );
      }
      setVerifyPhase("verified");
      setServerMsg("Xác minh email thành công!");
    } catch (e: any) {
      setVerifyPhase("sent");
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Xác minh thất bại, vui lòng thử lại.";
      setOtpError(msg);
    }
  };

  const onSubmit = async (data: RegisterData & { confirmPassword: string }) => {
    setRegisterError("");

    // Bắt buộc đã verified trước khi cho đăng ký
    if (verifyPhase !== "verified") {
      setRegisterError("Vui lòng xác minh email trước khi đăng ký.");
      return;
    }

    // Phanh tay: đảm bảo confirmPassword hợp lệ (chặn mọi trường hợp bypass)
    if (!data.confirmPassword || data.confirmPassword !== data.password) {
      setRegisterError("Mật khẩu xác nhận không khớp hoặc chưa nhập.");
      return;
    }

    const { confirmPassword, ...userData } = data;
    const success = await registerUser(userData);

    if (success) {
      setIsSuccess(true);
      // Xoá các trường nhạy cảm trên UI
      resetField("password");
      resetField("confirmPassword");
      setOtp("");
      setVerifyPhase("idle");
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

            {/* Email + Gửi mã (ĐÃ DI CHUYỂN XUỐNG DƯỚI) */}
            <div>
              <label className="label">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  {...register("email", {
                    required: "Vui lòng nhập email",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email không hợp lệ",
                    },
                  })}
                  className="input flex-1"
                  placeholder="Nhập email của bạn"
                  disabled={verifyPhase === "verified"}
                />
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={!canSendCode}
                  className={`px-3 rounded-lg border text-sm ${
                    canSendCode
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-gray-200 text-gray-500 border-gray-300"
                  }`}
                  title={
                    !watchPassword || !watchConfirm
                      ? "Nhập và xác nhận mật khẩu trước"
                      : resendIn > 0
                      ? `Gửi lại sau ${resendIn}s`
                      : "Gửi mã xác minh"
                  }
                >
                  {verifyPhase === "sending"
                    ? "Đang gửi..."
                    : resendIn > 0
                    ? `${resendIn}s`
                    : "Gửi mã"}
                </button>
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}

              {/* Thông báo server */}
              {!!serverMsg && (
                <p className="text-emerald-700 text-sm mt-2">{serverMsg}</p>
              )}
            </div>

            {/* Ô nhập mã xác minh (hiện sau khi đã gửi) */}
            {(verifyPhase === "sent" ||
              verifyPhase === "verifying" ||
              verifyPhase === "verified") && (
              <div>
                <label className="label">Mã xác minh đã gửi qua email</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\s/g, ""))}
                    className="input flex-1 tracking-widest text-center"
                    placeholder="Nhập mã (6 số)"
                    disabled={verifyPhase === "verified"}
                  />
                  {verifyPhase === "verified" ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="w-5 h-5" /> Đã xác minh
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={verifyCode}
                      className="px-3 rounded-lg border bg-blue-600 text-white border-blue-600 text-sm"
                      disabled={verifyPhase === "verifying"}
                    >
                      {verifyPhase === "verifying"
                        ? "Đang kiểm tra..."
                        : "Xác minh"}
                    </button>
                  )}
                </div>
                {!!otpError && (
                  <p className="text-red-500 text-sm mt-1">{otpError}</p>
                )}
                {verifyPhase !== "verified" && resendIn > 0 && (
                  <p className="text-gray-500 text-xs mt-1 inline-flex items-center gap-1">
                    <TimerReset className="w-4 h-4" />
                    Có thể gửi lại mã sau {resendIn}s
                  </p>
                )}
              </div>
            )}

            {/* Error Message */}
            {registerError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{registerError}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isValid || verifyPhase !== "verified"}
              className={`input btn-primary ${
                verifyPhase !== "verified" || !isValid
                  ? "opacity-60 cursor-not-allowed"
                  : ""
              }`}
              title={
                verifyPhase !== "verified"
                  ? "Vui lòng xác minh email trước"
                  : !isValid
                  ? "Vui lòng điền đầy đủ và hợp lệ"
                  : "Đăng ký"
              }
            >
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
