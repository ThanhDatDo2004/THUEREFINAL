import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthContextType, AuthUser, RegisterData } from "../types";
import { loginApi, registerApi } from "../models/auth.api";
import { mapApiUserToAuthUser } from "../utils/mapUser";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

// Ưu tiên message từ backend (axios error)
function pickErrorMessage(err: any, fallback = "Đã có lỗi xảy ra") {
  return (
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true); // chỉ dùng để hydrate ban đầu

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (emailOrPhone: string, password: string): Promise<boolean> => {
    try {
      const identifier = String(emailOrPhone ?? "").trim();
      const pwd = String(password ?? "");
      if (!identifier) throw new Error("Vui lòng nhập email hoặc số điện thoại");
      if (!pwd) throw new Error("Vui lòng nhập mật khẩu");

      // sẽ ném Error nếu 401/4xx/5xx
      const res = await loginApi({ login: identifier, password: pwd });

      localStorage.setItem("access_token", res.data.token);
      const authUser = mapApiUserToAuthUser(res.data);
      setUser(authUser);
      localStorage.setItem("user", JSON.stringify(authUser));
      return true;
    } catch (err: any) {
      // NÉM LẠI để UI hiển thị
      throw new Error(pickErrorMessage(err, "Tên đăng nhập hoặc mật khẩu không đúng"));
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      // sẽ ném Error nếu 4xx/5xx
      await registerApi({
        user_name: userData.user_name,
        email: userData.email,
        password: userData.password,
      });
      return true;
    } catch (err: any) {
      // NÉM LẠI để UI hiển thị
      throw new Error(pickErrorMessage(err, "Đăng ký thất bại"));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
  };

  const value: AuthContextType = { user, login, register, logout, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
