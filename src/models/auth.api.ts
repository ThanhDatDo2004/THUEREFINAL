import { api } from "./api";
import { rethrowApiError } from "./api.helpers";

export type LoginApiReq = { login: string; password: string };
export type RegisterApiReq = { user_name: string; email: string; password: string };

export async function loginApi(payload: LoginApiReq) {
  try {
    const res = await api.post("/auth/login", payload);
    // Nếu backend trả 200 nhưng body không có token (trường hợp hiếm):
    if (!res?.data?.success || !res?.data?.data?.token) {
      const msg =
        res?.data?.error?.message ||
        res?.data?.message ||
        "Tên đăng nhập hoặc mật khẩu không đúng";
      throw new Error(msg);
    }
    return res.data; // { success, data: {token,...}, ... }
  } catch (error) {
    rethrowApiError(error, "Đăng nhập thất bại");
  }
}

export async function registerApi(payload: RegisterApiReq) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function checkEmailExists(email: string) {
  const { data } = await api.post("/auth/check-email", { email });
  return data as { success: boolean; exists: boolean; message?: string };
}

export async function forgotPassword(email: string) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token: string, new_password: string) {
  const { data } = await api.post("/auth/reset-password", { token, new_password });
  return data;
}

export async function getGuestTokenApi() {
  try {
    const { data } = await api.get("/auth/guest-token");
    if (!data?.success || !data?.data?.token) {
      throw new Error(data?.error?.message || data?.message || "Không thể lấy guest token");
    }
    return data;
  } catch (error) {
    rethrowApiError(error, "Không thể lấy guest token");
  }
}
