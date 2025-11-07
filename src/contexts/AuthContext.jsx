import React, { createContext, useContext, useState, useEffect } from "react";
import { loginApi, registerApi } from "../models/auth.api";
import { mapApiUserToAuthUser } from "../utils/mapUser";

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};

const pickErrorMessage = (err, fallback = "Đã có lỗi xảy ra") =>
  err?.response?.data?.error?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const login = async (emailOrPhone, password) => {
    try {
      const identifier = String(emailOrPhone ?? "").trim();
      const pwd = String(password ?? "");
      if (!identifier) throw new Error("Vui lòng nhập email hoặc số điện thoại");
      if (!pwd) throw new Error("Vui lòng nhập mật khẩu");

      const res = await loginApi({ login: identifier, password: pwd });

      localStorage.setItem("access_token", res.data.token);
      const authUser = mapApiUserToAuthUser(res.data);
      setUser(authUser);
      localStorage.setItem("user", JSON.stringify(authUser));
      return true;
    } catch (err) {
      throw new Error(pickErrorMessage(err, "Tên đăng nhập hoặc mật khẩu không đúng"));
    }
  };

  const register = async (userData) => {
    try {
      await registerApi({
        user_name: userData.user_name,
        email: userData.email,
        password: userData.password,
      });
      return true;
    } catch (err) {
      throw new Error(pickErrorMessage(err, "Đăng ký thất bại"));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
  };

  const isShopOwner = () => user?.level_type === "shop";
  const getShopCode = () => user?.shop_code ?? null;

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isShopOwner,
    getShopCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
