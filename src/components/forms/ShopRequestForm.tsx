import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  AlertCircle,
  Building,
  CheckCircle2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  PhoneCall,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { submitShopRequest } from "../../models/shop.api";

interface ShopRequestFormData {
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  message: string;
}

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const benefits: Array<{
  icon: IconComponent;
  title: string;
  description: string;
}> = [
  {
    icon: Sparkles,
    title: "Tối ưu tỷ lệ lấp sân",
    description: "Thu hút khách mới nhờ chiến dịch marketing có sẵn.",
  },
  {
    icon: CheckCircle2,
    title: "Quy trình minh bạch",
    description: "Theo dõi trạng thái duyệt hồ sơ ngay trên dashboard.",
  },
  {
    icon: Building,
    title: "Quản lý tập trung",
    description: "Đồng bộ lịch sân, báo cáo doanh thu, chiết khấu rõ ràng.",
  },
];

const contactChannels: Array<{
  icon: IconComponent;
  label: string;
  value: string;
  hint: string;
}> = [
  {
    icon: PhoneCall,
    label: "Hotline",
    value: "0866 845 867",
    hint: "08:00 - 22:00 (T2-T7)",
  },
  {
    icon: Mail,
    label: "Email hỗ trợ",
    value: "thuere2004",
    hint: "Phản hồi trong 24h",
  },
];

const processSteps = [
  "Gửi form đăng ký và mô tả thông tin sân",
  "Đội ngũ kiểm duyệt liên hệ xác thực",
  "Bàn giao tài khoản quản lý và hướng dẫn",
  "Bắt đầu nhận đơn đặt sân trên hệ thống",
];

const ShopRequestForm: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShopRequestFormData>();

  const onSubmit = async (data: ShopRequestFormData) => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      await submitShopRequest(data);
      setIsSubmitted(true);
      reset();
      setTimeout(() => {
        setIsSubmitted(false);
      }, 3000);
    } catch (error: any) {
      setSubmitError(
        error?.message || "Không thể gửi yêu cầu. Vui lòng thử lại sau."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative isolate overflow-hidden bg-slate-950 py-16 sm:py-20">
      <div className="absolute inset-0 -z-10 opacity-60">
        <div className="absolute inset-y-0 left-1/2 w-[140%] -translate-x-1/2 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.35),_transparent_60%)] blur-3xl" />
        <div className="absolute inset-y-0 right-1/3 w-[80%] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_55%)] blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-white mb-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
            <Sparkles className="h-4 w-4 text-emerald-300" />
            Đối tác sân thể thao
          </p>
          <h2 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Đăng ký mở Shop và bắt đầu nhận đơn trong vài bước
          </h2>
          <p className="mt-4 text-base text-white/70 max-w-3xl mx-auto">
            Điền thông tin cơ bản, đội ngũ ThueRe sẽ đồng hành cùng bạn trong
            suốt hành trình số hóa quản lý sân và tối ưu hiệu suất hoạt động.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-[0_25px_80px_rgba(15,23,42,0.4)] backdrop-blur-xl">
            <div className="mt-10 space-y-5">
              {benefits.map(({ icon: Icon, title, description }, index) => (
                <div
                  key={title}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
                >
                  <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/40 text-emerald-200">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{title}</p>
                    <p className="text-sm text-white/70">{description}</p>
                    <p className="text-xs text-white/40 mt-1">
                      Bước {String(index + 1).padStart(2, "0")}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
              <h4 className="text-lg font-semibold text-white">
                Quy trình duyệt chi tiết
              </h4>
              <ol className="mt-4 space-y-4 text-sm text-white/80">
                {processSteps.map((step, index) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-sm font-semibold text-emerald-200">
                      {index + 1}
                    </span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {contactChannels.map(({ icon: Icon, label, value, hint }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/10 bg-slate-900/40 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/70 text-emerald-200">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm text-white/70">{label}</p>
                        <p className="text-base font-semibold text-white">
                          {value}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-widest text-white/40">
                      {hint}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="relative rounded-3xl bg-white p-8 shadow-2xl shadow-emerald-900/20">
            <div className="absolute inset-x-10 -top-8 z-10 flex justify-center">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-6 py-3 text-sm font-medium text-emerald-700 shadow-lg shadow-emerald-100/60">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/10 text-xs font-semibold uppercase tracking-widest text-emerald-600">
                  TR
                </span>
                Đối tác mới đăng ký mỗi ngày
              </div>
            </div>
            <div className="pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-500">
                Bắt đầu ngay
              </p>
              <h3 className="mt-3 text-3xl font-bold text-slate-900">
                Form đăng ký mở Shop
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Chúng tôi sẽ liên hệ trong 24h để xác nhận và hướng dẫn các bước
                tiếp theo.
              </p>
            </div>

            {isSubmitted && (
              <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-emerald-900 shadow-inner">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">Gửi yêu cầu thành công</p>
                    <p className="text-sm">
                      Đội ngũ hỗ trợ sẽ phản hồi qua email hoặc điện thoại trong
                      vòng 24 giờ làm việc.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!!submitError && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium">Không thể gửi yêu cầu</p>
                  <p className="text-sm">{submitError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="label text-slate-700">
                    <span className="inline-flex items-center gap-2">
                      <User className="h-4 w-4 text-emerald-500" />
                      Họ và tên
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      {...register("full_name", {
                        required: "Vui lòng nhập họ và tên",
                        minLength: {
                          value: 2,
                          message: "Họ tên phải có ít nhất 2 ký tự",
                        },
                      })}
                      className="input pr-12"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  {errors.full_name && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.full_name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label text-slate-700">
                    <span className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4 text-emerald-500" />
                      Email
                    </span>
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
                    placeholder="thuere2004@gmail.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="label text-slate-700">
                    <span className="inline-flex items-center gap-2">
                      <Phone className="h-4 w-4 text-emerald-500" />
                      Số điện thoại
                    </span>
                  </label>
                  <input
                    type="tel"
                    {...register("phone_number", {
                      required: "Vui lòng nhập số điện thoại",
                      pattern: {
                        value: /^[0-9]{10,11}$/,
                        message: "Số điện thoại phải có 10-11 chữ số",
                      },
                    })}
                    className="input"
                    placeholder="09xx xxx xxx"
                  />
                  {errors.phone_number && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.phone_number.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label text-slate-700">
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-500" />
                      Địa chỉ sân
                    </span>
                  </label>
                  <input
                    type="text"
                    {...register("address", {
                      required: "Vui lòng nhập địa chỉ",
                      minLength: {
                        value: 10,
                        message: "Địa chỉ phải có ít nhất 10 ký tự",
                      },
                    })}
                    className="input"
                    placeholder="Đường, quận/huyện..."
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.address.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="label text-slate-700 inline-flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-500" />
                  Giới thiệu ngắn gọn về sân
                </label>
                <textarea
                  rows={5}
                  {...register("message", {
                    minLength: {
                      value: 20,
                      message: "Tin nhắn phải có ít nhất 20 ký tự",
                    },
                  })}
                  className="input"
                  placeholder="Loại sân, số lượng sân, tình trạng đặt sân hiện tại, các khung giờ trống..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.message.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary input bg-gradient-to-r from-emerald-500 to-blue-500 text-base font-semibold text-white shadow-lg shadow-emerald-200/60 transition hover:from-emerald-600 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Gửi yêu cầu hợp tác</span>
                  </>
                )}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ShopRequestForm;
