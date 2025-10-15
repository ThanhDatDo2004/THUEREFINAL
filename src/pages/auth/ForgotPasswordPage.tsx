import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail, Send, ArrowLeft, Check } from "lucide-react";
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
          "Nếu email của bạn tồn tại trong hệ thống, một liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.",
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
    <div className="page bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="section">
          <div className="header-center">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Quên mật khẩu</h2>
            <p className="mt-2 text-gray-600">
              Nhập email để nhận liên kết đặt lại.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
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
                placeholder="nhap@email.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
              {feedback && (
                <div
                  className={`text-sm mt-2 inline-flex items-center gap-1 ${
                    feedback.type === "success"
                      ? "text-emerald-700"
                      : "text-red-500"
                  }`}
                >
                  {feedback.type === "success" && <Check className="w-4 h-4" />}
                  {feedback.message}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-60"
              title={submitting ? "Đang xử lý" : "Gửi liên kết đặt lại"}
            >
              {submitting ? "Đang xử lý..." : "Gửi liên kết"}
            </button>
          </form>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-emerald-700 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
