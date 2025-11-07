import { api } from "./api";

export async function loginApi(payload) {
  try {
    const res = await api.post("/auth/login", payload);
    if (!res?.data?.success || !res?.data?.data?.token) {
      const msg =
        res?.data?.error?.message ||
        res?.data?.message ||
        "Tên đăng nhập hoặc mật khẩu không đúng";
      throw new Error(msg);
    }
    return res.data;
  } catch (error) {
    const msg =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Đăng nhập thất bại";
    throw new Error(msg);
  }
}

export async function registerApi(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function checkEmailExists(email) {
  const { data } = await api.post("/auth/check-email", { email });
  return data;
}

export async function forgotPassword(email) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token, new_password) {
  const { data } = await api.post("/auth/reset-password", { token, new_password });
  return data;
}
