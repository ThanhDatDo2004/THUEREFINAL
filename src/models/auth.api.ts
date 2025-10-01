import { api } from "./api";

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
  } catch (e: any) {
    // Trường hợp HTTP 401/4xx/timeout, axios sẽ vào catch
    const msg =
      e?.response?.data?.error?.message || // ví dụ "Invalid username or password"
      e?.response?.data?.message ||
      e?.message ||
      "Đăng nhập thất bại";
    throw new Error(msg);
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
