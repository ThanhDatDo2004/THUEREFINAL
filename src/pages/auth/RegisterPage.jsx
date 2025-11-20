import React, { useMemo, useState, useEffect } from "react";
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
  LogIn,
} from "lucide-react";
import { api } from "../../models/api";
import { useAuth } from "../../contexts/AuthContext";

const RESEND_SECONDS = 60;

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [verifyPhase, setVerifyPhase] = useState("idle");
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
  } = useForm({ mode: "onChange" });

  const watchPassword = watch("password");
  const watchConfirm = watch("confirmPassword");
  const watchEmail = watch("email");

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  useEffect(() => {
    if (verifyPhase === "verified" || verifyPhase === "sent") {
      setVerifyPhase("idle");
      setOtp("");
      setOtpError("");
      setServerMsg("");
    }
  }, [watchPassword, watchConfirm]);

  useEffect(() => {
    if (verifyPhase === "verified" || verifyPhase === "sent") {
      setVerifyPhase("idle");
      setOtp("");
      setOtpError("");
      setServerMsg("");
    }
  }, [watchEmail]);

  const canSendCode = useMemo(() => {
    const re = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    const emailValid = re.test(String(watchEmail ?? ""));
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
      });

      if (!data?.success) {
        throw new Error(data?.message || "Không gửi được mã. Thử lại.");
      }

      setVerifyPhase("sent");
      setResendIn(RESEND_SECONDS);
      setServerMsg("Đã gửi mã xác minh đến email của bạn.");
    } catch (error) {
      setVerifyPhase("idle");
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Có lỗi xảy ra khi gửi mã.";
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
        throw new Error(data?.message || "Mã xác minh không đúng hoặc đã hết hạn.");
      }
      setVerifyPhase("verified");
      setServerMsg("Xác minh email thành công!");
    } catch (error) {
      setVerifyPhase("sent");
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Xác minh thất bại, vui lòng thử lại.";
      setOtpError(msg);
    }
  };

  const onSubmit = async (data) => {
    setRegisterError("");

    if (verifyPhase !== "verified") {
      setRegisterError("Vui lòng xác minh email trước khi đăng ký.");
      return;
    }

    if (!data.confirmPassword || data.confirmPassword !== data.password) {
      setRegisterError("Mật khẩu xác nhận không khớp hoặc chưa nhập.");
      return;
    }

    const { confirmPassword, ...userData } = data;
    const success = await registerUser(userData);

    if (success) {
      setIsSuccess(true);
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
      <div className="hero min-h-screen flex items-center justify-center py-12 px-4">
        <div className="hero-pattern" />
        <div className="hero-card p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </div>
          <h2 className="hero-card-title mb-2">Đăng ký thành công!</h2>
          <p className="text-white/70 mb-6">
            Bạn sẽ được chuyển hướng đến trang đăng nhập trong giây lát.
          </p>
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hero min-h-screen flex items-center justify-center py-12 px-4">
      <div className="hero-pattern" />
      <div className="max-w-xl w-full relative space-y-6">
        <div className="hero-card p-8">
          <div className="hero-card-header mb-6">
            <div className="shop-brand mb-4">
              <div className="shop-brand-logo bg-[var(--accent-500)] text-white">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="hero-card-title">Đăng ký tài khoản</h2>
                <p className="hero-card-subtitle">Tạo tài khoản khách hàng của bạn</p>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="label text-white/80">
                  <User className="w-4 h-4 inline mr-2" />Họ tên
                </label>
                <input
                  type="text"
                  {...register("user_name", {
                    required: "Vui lòng nhập họ tên",
                    minLength: { value: 2, message: "Ít nhất 2 ký tự" },
                  })}
                  className="input"
                  placeholder="Nhập họ tên của bạn"
                />
                {errors.user_name && (
                  <p className="text-red-400 text-sm mt-1">{errors.user_name.message}</p>
                )}
              </div>

              <div>
                <label className="label text-white/80">
                  <Mail className="w-4 h-4 inline mr-2" />Email
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
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label text-white/80">
                    <Lock className="w-4 h-4 inline mr-2" />Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password", {
                        required: "Vui lòng nhập mật khẩu",
                        minLength: { value: 6, message: "Ít nhất 6 ký tự" },
                      })}
                      className="input"
                      placeholder="Mật khẩu"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
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
                    <Lock className="w-4 h-4 inline mr-2" />Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      {...register("confirmPassword", {
                        required: "Vui lòng xác nhận mật khẩu",
                        validate: (value) =>
                          value === watch("password") || "Mật khẩu xác nhận không khớp",
                      })}
                      className="input"
                      placeholder="Nhập lại mật khẩu"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="label text-white/80 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />Xác minh email
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary flex-1"
                    onClick={sendCode}
                    disabled={!canSendCode || verifyPhase === "sending"}
                  >
                    {verifyPhase === "sending" ? "Đang gửi..." : "Gửi mã xác minh"}
                  </button>
                  {resendIn > 0 && (
                    <div className="px-4 py-2 rounded-lg bg-white/10 text-white/80 flex items-center gap-2">
                      <TimerReset className="w-4 h-4" />
                      <span>{resendIn}s</span>
                    </div>
                  )}
                </div>
                {serverMsg && <p className="text-sm text-amber-200">{serverMsg}</p>}

                {verifyPhase === "sent" || verifyPhase === "verifying" || verifyPhase === "verified" ? (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="input flex-1"
                        placeholder="Nhập mã xác minh"
                      />
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={verifyCode}
                        disabled={verifyPhase === "verifying"}
                      >
                        {verifyPhase === "verifying" ? "Đang kiểm tra..." : "Xác minh"}
                      </button>
                    </div>
                    {otpError && <p className="text-sm text-red-400">{otpError}</p>}
                  </div>
                ) : null}

                {verifyPhase === "verified" && (
                  <p className="text-sm text-green-400">
                    Email đã được xác minh! Bạn có thể hoàn tất đăng ký.
                  </p>
                )}
              </div>
            </div>

            {registerError && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-300 text-sm">{registerError}</p>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={!isValid || loading || verifyPhase !== "verified"}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Đăng ký</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="hero-shortcut" onClick={() => navigate("/login")}>
          <div className="hero-shortcut-icon">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-white">Đã có tài khoản?</span>
            <span className="text-sm text-white/70"> Đăng nhập ngay</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
);

export default RegisterPage;
