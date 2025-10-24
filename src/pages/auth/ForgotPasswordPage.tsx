import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail, Send, ArrowLeft, Check, CheckCircle2 } from "lucide-react"; // Thêm CheckCircle2
import { forgotPassword } from "../../models/auth.api";

type Form = { email: string };

const ForgotPasswordPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ mode: "onChange" });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const onSubmit = handleSubmit(async ({ email }) => {
    setFeedback(null);
    setSubmitting(true);
    const trimmedEmail = email.trim();

    try {
      // Giả định forgotPassword đã được cập nhật ở backend để xử lý cả việc kiểm tra email
      await forgotPassword(trimmedEmail);
      setFeedback({
        type: "success",
        message:
          "Liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.",
      });
    } catch (e: any) {
      // Hiển thị một thông báo lỗi chung chung để tăng cường bảo mật
      setFeedback({
        type: "error",
        message: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
      });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    // [NEW UI] 1. Sử dụng .hero và .hero-pattern (từ home.css) làm nền
    <div className="hero min-h-screen flex items-center justify-center py-12 px-4">
      <div className="hero-pattern" />
      
      {/* Thêm 'relative' để nội dung nổi lên trên 'hero-pattern' */}
      <div className="max-w-md w-full relative space-y-6">

        {/* [NEW UX] 2. Tách biệt trạng thái UI khi thành công */}
        {feedback?.type === 'success' ? (
          
          // [NEW UI] 3. Thẻ "Thành công" (dùng .hero-card)
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

          // [NEW UI] 4. Thẻ Form (dùng .hero-card) khi chưa gửi
          <div className="hero-card p-8">
            <div className="hero-card-header mb-6">
              {/* [NEW UI] 5. Dùng .shop-brand (shop.css) cho header */}
              <div className="shop-brand mb-4">
                <div className="shop-brand-logo bg-[var(--brand-600)] text-white">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="hero-card-title">Quên mật khẩu</h2>
                  <p className="hero-card-subtitle">
                    Nhập email để nhận liên kết đặt lại.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                {/* [NEW UI] 6. Đổi màu label sang trắng */}
                <label className="label text-white/80">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                {/* Giữ .input (từ skin.css) */}
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
                  // [NEW UI] 7. Đổi màu lỗi sang đỏ sáng
                  <p className="text-red-400 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
                {/* [NEW UI] 8. Chỉ hiển thị lỗi (error), vì success đã có thẻ riêng */}
                {feedback?.type === 'error' && (
                  <p className="text-red-400 text-sm mt-1">
                    {feedback.message}
                  </p>
                )}
              </div>

              {/* Giữ .btn-primary (từ skin.css) */}
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

        {/* [NEW UI] 9. Sử dụng .hero-shortcut (từ home.css) cho liên kết quay lại */}
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

export default ForgotPasswordPage;