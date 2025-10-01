import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail, Send, ArrowLeft, Check } from "lucide-react";
import { checkEmailExists, forgotPassword } from "../../models/auth.api";

type Form = { email: string };

const ForgotPasswordPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<Form>({ mode: "onChange" });
  const [checking, setChecking] = useState(false);
  const [canSend, setCanSend] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverMsg, setServerMsg] = useState("");

  const email = watch("email");

  const onCheck = async () => {
    setServerMsg("");
    setCanSend(false);
    if (!email) {
      setError("email", { type: "manual", message: "Vui lòng nhập email" });
      return;
    }
    try {
      setChecking(true);
      const res = await checkEmailExists(email.trim());
      if (!res?.success) throw new Error(res?.message || "Kiểm tra thất bại");
      if (!res.exists) {
        setError("email", { type: "manual", message: "Email không tồn tại" });
        setCanSend(false);
      } else {
        setCanSend(true);
        setServerMsg("Email hợp lệ. Bạn có thể gửi liên kết đặt lại.");
      }
    } catch (e: any) {
      setError("email", {
        type: "manual",
        message: e?.response?.data?.message || e?.message || "Lỗi kiểm tra",
      });
    } finally {
      setChecking(false);
    }
  };

  const onSend = async () => {
    setServerMsg("");
    if (!canSend) return;
    try {
      setSubmitting(true);
      const res = await forgotPassword(email.trim());
      if (!res?.success)
        throw new Error(res?.message || "Không gửi được email");
      setServerMsg(
        "Đã gửi liên kết đặt lại mật khẩu. Vui lòng kiểm tra hộp thư."
      );
    } catch (e: any) {
      setError("email", {
        type: "manual",
        message: e?.response?.data?.message || e?.message || "Gửi thất bại",
      });
    } finally {
      setSubmitting(false);
    }
  };

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

          <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
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
              {!!serverMsg && (
                <p className="text-emerald-700 text-sm mt-2 inline-flex items-center gap-1">
                  <Check className="w-4 h-4" /> {serverMsg}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCheck}
                disabled={checking}
                className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-60"
              >
                {checking ? "Đang kiểm tra..." : "Kiểm tra email"}
              </button>
              <button
                type="button"
                onClick={onSend}
                disabled={!canSend || submitting}
                className={`px-4 py-2 rounded-lg ${
                  canSend
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
                title={
                  canSend ? "Gửi liên kết đặt lại" : "Hãy kiểm tra email trước"
                }
              >
                {submitting ? "Đang gửi..." : "Gửi liên kết"}
              </button>
            </div>
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
