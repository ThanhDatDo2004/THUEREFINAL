// // === RegisterPage.tsx ===
// import React, { useMemo, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useForm } from "react-hook-form";
// import {
//   User,
//   Mail,
//   Lock,
//   Eye,
//   EyeOff,
//   UserPlus,
//   CheckCircle2,
//   TimerReset,
//   LogIn, // Thêm icon
// } from "lucide-react";
// import { api } from "../../models/api";
// import { useAuth } from "../../contexts/AuthContext";
// import { RegisterData } from "../../types";

// type VerifyPhase = "idle" | "sending" | "sent" | "verifying" | "verified";

// const RESEND_SECONDS = 60;

// const RegisterPage: React.FC = () => {
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [registerError, setRegisterError] = useState("");
//   const [isSuccess, setIsSuccess] = useState(false);

//   // NEW: states cho xác minh email
//   const [verifyPhase, setVerifyPhase] = useState<VerifyPhase>("idle");
//   const [otp, setOtp] = useState("");
//   const [otpError, setOtpError] = useState("");
//   const [resendIn, setResendIn] = useState(0);
//   const [serverMsg, setServerMsg] = useState("");

//   const { register: registerUser, loading } = useAuth();
//   const navigate = useNavigate();

//   const {
//     register,
//     handleSubmit,
//     watch,
//     formState: { errors, isValid },
//     getValues,
//     resetField,
//   } = useForm<RegisterData & { confirmPassword: string }>({
//     mode: "onChange", // bật validate realtime
//   });

//   const watchPassword = watch("password");
//   const watchConfirm = watch("confirmPassword");
//   const watchEmail = watch("email");

//   // countdown resend
//   React.useEffect(() => {
//     if (resendIn <= 0) return;
//     const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
//     return () => clearInterval(t);
//   }, [resendIn]);

//   // Nếu user đổi mật khẩu/confirm/email sau khi đã gửi/verify → reset trạng thái OTP để tránh gửi nhầm
//   React.useEffect(() => {
//     // Khi thay đổi password hoặc confirm → buộc xác minh lại
//     if (verifyPhase === "verified" || verifyPhase === "sent") {
//       setVerifyPhase("idle");
//       setOtp("");
//       setOtpError("");
//       setServerMsg("");
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [watchPassword, watchConfirm]);

//   React.useEffect(() => {
//     if (verifyPhase === "verified" || verifyPhase === "sent") {
//       setVerifyPhase("idle");
//       setOtp("");
//       setOtpError("");
//       setServerMsg("");
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [watchEmail]);

//   const canSendCode = useMemo(() => {
//     // Email hợp lệ?
//     const re = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
//     const emailValid = re.test(String(watchEmail ?? ""));

//     // Mật khẩu và xác nhận đã nhập & khớp?
//     const pwOk =
//       !!watchPassword &&
//       !!watchConfirm &&
//       watchConfirm === watchPassword &&
//       !errors.password &&
//       !errors.confirmPassword;

//     return emailValid && pwOk && resendIn === 0 && verifyPhase !== "verified";
//   }, [
//     watchEmail,
//     watchPassword,
//     watchConfirm,
//     errors.password,
//     errors.confirmPassword,
//     resendIn,
//     verifyPhase,
//   ]);

//   const sendCode = async () => {
//     setServerMsg("");
//     setOtpError("");
//     if (!canSendCode) return;

//     try {
//       setVerifyPhase("sending");
//       const { data } = await api.post("/auth/send-code", {
//         email: getValues("email"),
//         // purpose: "register", // nếu backend bạn có hỗ trợ phân biệt mục đích
//       });

//       if (!data?.success) {
//         throw new Error(data?.message || "Không gửi được mã. Thử lại.");
//       }

//       setVerifyPhase("sent");
//       setResendIn(RESEND_SECONDS);
//       setServerMsg("Đã gửi mã xác minh đến email của bạn.");
//     } catch (e: any) {
//       setVerifyPhase("idle");
//       const msg =
//         e?.response?.data?.message || e?.message || "Có lỗi xảy ra khi gửi mã.";
//       setServerMsg(msg);
//     }
//   };

//   const verifyCode = async () => {
//     setOtpError("");
//     setServerMsg("");
//     if (!otp || otp.length < 4) {
//       setOtpError("Vui lòng nhập mã hợp lệ.");
//       return;
//     }
//     try {
//       setVerifyPhase("verifying");
//       const { data } = await api.post("/auth/verify-code", {
//         email: getValues("email"),
//         code: otp,
//       });

//       if (!data?.success) {
//         throw new Error(
//           data?.message || "Mã xác minh không đúng hoặc đã hết hạn."
//         );
//       }
//       setVerifyPhase("verified");
//       setServerMsg("Xác minh email thành công!");
//     } catch (e: any) {
//       setVerifyPhase("sent");
//       const msg =
//         e?.response?.data?.message ||
//         e?.message ||
//         "Xác minh thất bại, vui lòng thử lại.";
//       setOtpError(msg);
//     }
//   };

//   const onSubmit = async (data: RegisterData & { confirmPassword: string }) => {
//     setRegisterError("");

//     // Bắt buộc đã verified trước khi cho đăng ký
//     if (verifyPhase !== "verified") {
//       setRegisterError("Vui lòng xác minh email trước khi đăng ký.");
//       return;
//     }

//     // Phanh tay: đảm bảo confirmPassword hợp lệ (chặn mọi trường hợp bypass)
//     if (!data.confirmPassword || data.confirmPassword !== data.password) {
//       setRegisterError("Mật khẩu xác nhận không khớp hoặc chưa nhập.");
//       return;
//     }

//     const { confirmPassword, ...userData } = data;
//     const success = await registerUser(userData);

//     if (success) {
//       setIsSuccess(true);
//       // Xoá các trường nhạy cảm trên UI
//       resetField("password");
//       resetField("confirmPassword");
//       setOtp("");
//       setVerifyPhase("idle");
//       setTimeout(() => {
//         navigate("/login");
//       }, 2000);
//     } else {
//       setRegisterError("Email đã được sử dụng hoặc có lỗi xảy ra");
//     }
//   };

//   if (isSuccess) {
//     return (
//       // [NEW UI] 1. Sử dụng .hero cho màn hình thành công
//       <div className="hero min-h-screen flex items-center justify-center py-12 px-4">
//         <div className="hero-pattern" /> {/* Hiệu ứng nền */}
//         <div className="max-w-md w-full relative">
//           {/* [NEW UI] 2. Sử dụng .hero-card cho thông báo */}
//           <div className="hero-card text-center p-8">
//             <div className="shop-brand justify-center mb-4">
//               <div className="shop-brand-logo bg-[var(--brand-500)] text-white">
//                 <CheckCircle2 className="w-8 h-8" />
//               </div>
//             </div>
//             <h2 className="hero-card-title mb-2">Đăng ký thành công!</h2>
//             {/* [FIX 1] Sửa lỗi thẻ đóng </D> thành </p> */}
//             <p className="hero-card-subtitle">
//               Đang chuyển hướng đến trang đăng nhập...
//             </p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     // [NEW UI] 1. Sử dụng .hero và .hero-pattern (từ home.css) làm nền
//     <div className="hero min-h-screen flex items-center justify-center py-12 px-4">
//       <div className="hero-pattern" />

//       {/* Thêm 'relative' để nội dung nổi lên trên 'hero-pattern' */}
//       <div className="max-w-md w-full relative space-y-6">
//         {/* [NEW UI] 2. Sử dụng .hero-card (từ home.css) làm thẻ form */}
//         <div className="hero-card p-8">
//           {/* Header */}
//           <div className="hero-card-header mb-6">
//             {/* [NEW UI] 3. Sử dụng .shop-brand (shop.css) cho header */}
//             <div className="shop-brand mb-4">
//               <div className="shop-brand-logo bg-[var(--brand-600)] text-white">
//                 <UserPlus className="w-6 h-6" />
//               </div>
//               <div>
//                 <h2 className="hero-card-title">Đăng ký</h2>
//                 <p className="hero-card-subtitle">
//                   Tạo tài khoản SportBooking của bạn
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Register Form */}
//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//             {/* Full Name */}
//             <div>
//               {/* [NEW UI] 4. Đổi màu label sang trắng */}
//               <label className="label text-white/80">
//                 <User className="w-4 h-4 inline mr-2" />
//                 Họ và tên
//               </label>
//               {/* Giữ .input (từ skin.css) */}
//               <input
//                 type="text"
//                 {...register("user_name", {
//                   required: "Vui lòng nhập họ và tên",
//                   minLength: {
//                     value: 2,
//                     message: "Họ tên phải có ít nhất 2 ký tự",
//                   },
//                 })}
//                 className="input"
//                 placeholder="Nhập họ và tên của bạn"
//               />
//               {/* [NEW UI] 5. Đổi màu lỗi sang đỏ sáng */}
//               {errors.user_name && (
//                 <p className="text-red-400 text-sm mt-1">
//                   {errors.user_name.message}
//                 </p>
//               )}
//             </div>

//             {/* Password */}
//             <div>
//               <label className="label text-white/80">
//                 <Lock className="w-4 h-4 inline mr-2" />
//                 Mật khẩu
//               </label>
//               <div className="relative">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   {...register("password", {
//                     required: "Vui lòng nhập mật khẩu",
//                     minLength: {
//                       value: 6,
//                       message: "Mật khẩu phải có ít nhất 6 ký tự",
//                     },
//                   })}
//                   className="input"
//                   placeholder="Nhập mật khẩu"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
//                 >
//                   {showPassword ? (
//                     <EyeOff className="w-5 h-5" />
//                   ) : (
//                     <Eye className="w-5 h-5" />
//                   )}
//                 </button>
//               </div>
//               {errors.password && (
//                 <p className="text-red-400 text-sm mt-1">
//                   {errors.password.message}
//                 </p>
//               )}
//             </div>

//             {/* Confirm Password */}
//             <div>
//               <label className="label text-white/80">
//                 <Lock className="w-4 h-4 inline mr-2" />
//                 Xác nhận mật khẩu
//               </label>
//               <div className="relative">
//                 <input
//                   type={showConfirmPassword ? "text" : "password"}
//                   {...register("confirmPassword", {
//                     required: "Vui lòng xác nhận mật khẩu",
//                     validate: (value) =>
//                       value === watchPassword || "Mật khẩu xác nhận không khớp",
//                   })}
//                   className="input"
//                   placeholder="Nhập lại mật khẩu"
//                 />
//                 {/* [FIX 2] Sửa lỗi typo 'top-1/L' thành 'top-1/2' */}
//                 <button
//                   type="button"
//                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
//                 >
//                   {showConfirmPassword ? (
//                     <EyeOff className="w-5 h-5" />
//                   ) : (
//                     <Eye className="w-5 h-5" />
//                   )}
//                 </button>
//               </div>
//               {errors.confirmPassword && (
//                 <p className="text-red-400 text-sm mt-1">
//                   {errors.confirmPassword.message}
//                 </p>
//               )}
//             </div>

//             {/* Email + Gửi mã */}
//             <div>
//               <label className="label text-white/80">
//                 <Mail className="w-4 h-4 inline mr-2" />
//                 Email
//               </label>
//               <div className="flex gap-2">
//                 <input
//                   type="email"
//                   {...register("email", {
//                     required: "Vui lòng nhập email",
//                     pattern: {
//                       value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
//                       message: "Email không hợp lệ",
//                     },
//                   })}
//                   className="input flex-1"
//                   placeholder="Nhập email của bạn"
//                   disabled={verifyPhase === "verified"}
//                 />
//                 {/* [NEW UI] 6. Cập nhật style nút (đặc biệt là 'disabled') cho nền tối */}
//                 <button
//                   type="button"
//                   onClick={sendCode}
//                   disabled={!canSendCode}
//                   className={`px-3 rounded-lg border text-sm font-medium transition ${
//                     canSendCode
//                       ? "bg-[var(--brand-600)] text-white border-[var(--brand-600)] hover:opacity-90"
//                       : "bg-white/10 text-white/50 border-white/20 cursor-not-allowed"
//                   }`}
//                   title={
//                     !watchPassword || !watchConfirm
//                       ? "Nhập và xác nhận mật khẩu trước"
//                       : resendIn > 0
//                       ? `Gửi lại sau ${resendIn}s`
//                       : "Gửi mã xác minh"
//                   }
//                 >
//                   {verifyPhase === "sending"
//                     ? "Đang gửi..."
//                     : resendIn > 0
//                     ? `${resendIn}s`
//                     : "Gửi mã"}
//                 </button>
//               </div>
//               {errors.email && (
//                 <p className="text-red-400 text-sm mt-1">
//                   {errors.email.message}
//                 </p>
//               )}

//               {/* [NEW UI] 7. Đổi màu thông báo sang xanh lá sáng */}
//               {!!serverMsg && (
//                 <p className="text-emerald-300 text-sm mt-2">{serverMsg}</p>
//               )}
//             </div>

//             {/* Ô nhập mã xác minh (hiện sau khi đã gửi) */}
//             {(verifyPhase === "sent" ||
//               verifyPhase === "verifying" ||
//               verifyPhase === "verified") && (
//               <div>
//                 <label className="label text-white/80">Mã xác minh</label>
//                 <div className="flex gap-2">
//                   <input
//                     type="text"
//                     inputMode="numeric"
//                     maxLength={6}
//                     value={otp}
//                     onChange={(e) => setOtp(e.target.value.replace(/\s/g, ""))}
//                     className="input flex-1 tracking-widest text-center"
//                     placeholder="Nhập mã (6 số)"
//                     disabled={verifyPhase === "verified"}
//                   />
//                   {verifyPhase === "verified" ? (
//                     // [NEW UI] 8. Đổi màu text sang xanh lá sáng
//                     <span className="inline-flex items-center gap-1 text-emerald-300 font-medium">
//                       <CheckCircle2 className="w-5 h-5" /> Đã xác minh
//                     </span>
//                   ) : (
//                     <button
//                       type="button"
//                       onClick={verifyCode}
//                       className="px-3 rounded-lg border bg-[var(--brand-600)] text-white border-[var(--brand-600)] text-sm font-medium"
//                       disabled={verifyPhase === "verifying"}
//                     >
//                       {verifyPhase === "verifying"
//                         ? "Đang kiểm tra..."
//                         : "Xác minh"}
//                     </button>
//                   )}
//                 </div>
//                 {!!otpError && (
//                   <p className="text-red-400 text-sm mt-1">{otpError}</p>
//                 )}
//                 {verifyPhase !== "verified" && resendIn > 0 && (
//                   // [NEW UI] 9. Đổi màu text sang xám nhạt
//                   <p className="text-white/60 text-xs mt-1 inline-flex items-center gap-1">
//                     <TimerReset className="w-4 h-4" />
//                     Có thể gửi lại mã sau {resendIn}s
//                   </p>
//                 )}
//               </div>
//             )}

//             {/* Error Message */}
//             {registerError && (
//               // [NEW UI] 10. Cập nhật style báo lỗi cho nền tối
//               <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
//                 <p className="text-red-300 text-sm">{registerError}</p>
//               </div>
//             )}

//             {/* Submit Button */}
//             {/* Giữ .btn-primary (từ skin.css) */}
//             <button
//               type="submit"
//               disabled={loading || !isValid || verifyPhase !== "verified"}
//               className="btn-primary w-full"
//               title={
//                 verifyPhase !== "verified"
//                   ? "Vui lòng xác minh email trước"
//                   : !isValid
//                   ? "Vui lòng điền đầy đủ và hợp lệ"
//                   : "Đăng ký"
//               }
//             >
//               {loading ? (
//                 <>
//                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                   <span>Đang đăng ký...</span>
//                 </>
//               ) : (
//                 <>
//                   <UserPlus className="w-5 h-5" />
//                   <span>Đăng ký</span>
//                 </>
//               )}
//             </button>
//           </form>

//           {/* [NEW UI] 11. Xóa link cũ */}
//           {/* <div className="mt-6 text-center"> ... </div> */}
//         </div>

//         {/* [NEW UI] 12. Sử dụng .hero-shortcut (home.css) cho liên kết quay lại */}
//         <Link to="/login" className="hero-shortcut">
//           <div className="hero-shortcut-icon">
//             <LogIn className="w-5 h-5" />
//           </div>
//           <div>
//             <span className="font-semibold text-white">Đã có tài khoản?</span>
//             <span className="text-sm text-white/70">Đăng nhập ngay</span>
//           </div>
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default RegisterPage;
