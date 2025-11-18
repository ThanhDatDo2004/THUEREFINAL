// import React, { useState } from "react";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { useForm } from "react-hook-form";
// import {
//   Mail,
//   Lock,
//   Eye,
//   EyeOff,
//   LogIn,
//   UserPlus, 
//   KeyRound, 
// } from "lucide-react";
// import { useAuth } from "../../contexts/AuthContext";
// import { LoginData } from "../../types";

// const LoginPage: React.FC = () => {
//   const [showPassword, setShowPassword] = useState(false);
//   const [loginError, setLoginError] = useState("");
//   const [submitting, setSubmitting] = useState(false);
//   const { login } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation() as any;

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<LoginData>({ mode: "onChange" });

//   const onSubmit = async (data: LoginData) => {
//     setLoginError("");
//     setSubmitting(true);
//     try {
//       const ok = await login(data.email.trim(), data.password);
//       if (ok) {
//         const fromPath = location.state?.from?.pathname || "/";
//         const carryState = location.state?.carry;
//         navigate(fromPath, { replace: true, state: carryState });
//       }
//     } catch (e: any) {
//       setLoginError(e?.message || "Email hoặc mật khẩu không chính xác");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="hero min-h-screen flex items-center justify-center py-12 px-4">
//       <div className="hero-pattern" />

//       <div className="max-w-md w-full relative space-y-6">
//         <div className="hero-card p-8">
//           <div className="hero-card-header mb-6">
//             <div className="shop-brand mb-4">
//               <div className="shop-brand-logo bg-[var(--brand-600)] text-white">
//                 <LogIn className="w-6 h-6" />
//               </div>
//               <div>
//                 <h2 className="hero-card-title">Đăng nhập</h2>
//                 <p className="hero-card-subtitle">Chào mừng trở lại</p>
//               </div>
//             </div>
//           </div>

//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//             <div>
//               <label className="label text-white/80">
//                 <Mail className="w-4 h-4 inline mr-2" />
//                 Email
//               </label>
//               <input
//                 type="email"
//                 {...register("email", {
//                   required: "Vui lòng nhập email",
//                   pattern: {
//                     value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
//                     message: "Email không hợp lệ",
//                   },
//                 })}
//                 className="input"
//                 placeholder="Nhập email của bạn"
//                 autoComplete="username"
//               />
//               {/* [NEW UI] 5. Đổi màu lỗi sang đỏ sáng */}
//               {errors.email && (
//                 <p className="text-red-400 text-sm mt-1">
//                   {errors.email.message}
//                 </p>
//               )}
//             </div>

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
//                   placeholder="Nhập mật khẩu của bạn"
//                   autoComplete="current-password"
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

//             {loginError && (
//               <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
//                 <p className="text-red-300 text-sm">{loginError}</p>
//               </div>
//             )}

//             <button
//               type="submit"
//               disabled={submitting}
//               className="btn-primary w-full"
//             >
//               {submitting ? (
//                 <>
//                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                   <span>Đang đăng nhập...</span>
//                 </>
//               ) : (
//                 <>
//                   <LogIn className="w-5 h-5" />
//                   <span>Đăng nhập</span>
//                 </>
//               )}
//             </button>
//           </form>
//         </div>

//         <div className="space-y-3">
//           <Link to="/forgot" className="hero-shortcut">
//             <div className="hero-shortcut-icon">
//               <KeyRound className="w-5 h-5" />
//             </div>
//             <div>
//               <span className="font-semibold text-white">Quên mật khẩu?</span>
//               <span className="text-sm text-white/70">Nhấn để đặt lại</span>
//             </div>
//           </Link>

//           <Link to="/register" className="hero-shortcut">
//             <div className="hero-shortcut-icon">
//               <UserPlus className="w-5 h-5" />
//             </div>
//             <div>
//               <span className="font-semibold text-white">
//                 Chưa có tài khoản?
//               </span>
//               <span className="text-sm text-white/70">Đăng ký ngay</span>
//             </div>
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginPage;
