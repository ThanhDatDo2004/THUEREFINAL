import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { AuthContextType, AuthUser, RegisterData } from "../types";
import { getGuestTokenApi, loginApi, registerApi } from "../models/auth.api";
import { mapApiUserToAuthUser } from "../utils/mapUser";
import { extractErrorMessage } from "../models/api.helpers";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

// Ưu tiên message phía backend
function pickErrorMessage(err: any, fallback = "Đã có lỗi xảy ra") {
  return extractErrorMessage(err, fallback);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true); // chỉ dùng để hydrate ban đầu

  const ensureGuestToken = useCallback(async () => {
    const existingToken = localStorage.getItem("access_token");
    if (existingToken) {
      return;
    }

    try {
      const response = await getGuestTokenApi();
      const token = response?.data?.token;
      if (token) {
        localStorage.setItem("access_token", token);
      }
    } catch (error) {
      console.error("Không thể lấy guest token:", error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const raw = localStorage.getItem("user");
      if (raw) {
        try {
          setUser(JSON.parse(raw));
        } catch {
          localStorage.removeItem("user");
        }
      }

      await ensureGuestToken();
      setLoading(false);
    };

    init();
  }, [ensureGuestToken]);

  const login = async (
    emailOrPhone: string,
    password: string
  ): Promise<boolean> => {
    try {
      const identifier = String(emailOrPhone ?? "").trim();
      const pwd = String(password ?? "");
      if (!identifier)
        throw new Error("Vui lòng nhập email hoặc số điện thoại");
      if (!pwd) throw new Error("Vui lòng nhập mật khẩu");

      // sẽ ném Error nếu 401/4xx/5xx
      const res = await loginApi({ login: identifier, password: pwd });

      localStorage.setItem("access_token", res.data.token);
      const authUser = mapApiUserToAuthUser(res.data);
      setUser(authUser);
      localStorage.setItem("user", JSON.stringify(authUser));
      return true;
    } catch (err: any) {
      const message = pickErrorMessage(
        err,
        "Tên đăng nhập hoặc mật khẩu không đúng"
      );
      if (err && typeof err === "object") {
        err.message = message;
        throw err;
      }
      throw new Error(message);
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
      const message = pickErrorMessage(err, "Đăng ký thất bại");
      if (err && typeof err === "object") {
        err.message = message;
        throw err;
      }
      throw new Error(message);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    ensureGuestToken();
  };

  const isShopOwner = () => {
    return user?.level_type === "shop";
  };

  const getShopCode = () => {
    return user?.shop_code ?? null;
  };

  const value: AuthContextType = {
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
