import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail, Send, ArrowLeft, CheckCircle2 } from "lucide-react";
import { forgotPassword } from "../../models/auth.api";

const ForgotPasswordPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: "onChange" });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const onSubmit = handleSubmit(async ({ email }) => {
    setFeedback(null);
    setSubmitting(true);
    const trimmedEmail = email.trim();

    try {
      await forgotPassword(trimmedEmail);
      setFeedback({
        type: "success",
        message: "Liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.",
      });
    } catch (_error) {
      setFeedback({
        type: "error",
        message: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
      });
    } finally {
      setSubmitting(false);
    }
  });

  const isSuccess = feedback?.type === "success";

  return (
    <div className="hero min-h-screen flex items-center justify-center py-12 px-4">
      <div className="hero-pattern" />
      <div className="max-w-md w-full relative space-y-6">
        {isSuccess ? (
          <div className="hero-card text-center p-8">
            <div className="shop-brand justify-center mb-4">
              <div className="shop-brand-logo bg-[var(--brand-500)] text-white">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>
            <h2 className="hero-card-title mb-2">Đã gửi liên kết!</h2>
            <p className="hero-card-subtitle">{feedback.message}</p>
          </div>
        ) : (
          <div className="hero-card p-8">
            <div className="hero-card-header mb-6">
              <div className="shop-brand mb-4">
                <div className="shop-brand-logo bg-[var(--brand-600)] text-white">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="hero-card-title">Quên mật khẩu</h2>
                  <p className="hero-card-subtitle">Nhập email để nhận liên kết đặt lại.</p>
                </div>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="label text-white/80">
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
                  placeholder="nhap@email.com"
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                )}
                {feedback?.type === "error" && (
                  <p className="text-red-400 text-sm mt-1">{feedback.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full"
                title={submitting ? "Đang xử lý" : "Gửi liên kết đặt lại"}
              >
                {submitting ? "Đang xử lý..." : "Gửi liên kết"}
              </button>
            </form>
          </div>
        )}

        <Link to="/login" className="hero-shortcut">
          <div className="hero-shortcut-icon">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-white">Quay lại đăng nhập</span>
            <span className="text-sm text-white/70"> Bỏ qua và đăng nhập</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
