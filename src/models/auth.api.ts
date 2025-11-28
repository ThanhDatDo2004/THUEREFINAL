import { api } from "./api";
import { rethrowApiError } from "./api.helpers";

export type LoginApiReq = { login: string; password: string };
export type RegisterApiReq = {
  user_name: string;
  email: string;
  password: string;
};

type AuthApiEnvelope<T> = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
  error?: { message?: string | null } | null;
};

export interface LoginApiUser {
  UserID: number;
  LevelCode: number;
  FullName: string;
  Email: string | null;
  ShopCode?: number | null;
  shop_code?: number | null;
}

export interface LoginApiSuccess {
  token: string;
  user: LoginApiUser;
}

const unwrapAuthPayload = <T>(
  payload: AuthApiEnvelope<T> | T,
  fallback: string
): T => {
  if (payload && typeof payload === "object" && "success" in payload) {
    const typed = payload as AuthApiEnvelope<T>;
    if (typed.success === false || typed.data === undefined || typed.data === null) {
      const message = typed.error?.message || typed.message || fallback;
      throw new Error(message);
    }
    return typed.data;
  }
  if (payload === undefined || payload === null) {
    throw new Error(fallback);
  }
  return payload as T;
};

const collectScopes = (...values: any[]) => {
  const scopes: any[] = [];
  const pushUnique = (value: any) => {
    if (!value || typeof value !== "object") return;
    if (scopes.includes(value)) return;
    scopes.push(value);
    if (value.data && value.data !== value) {
      pushUnique(value.data);
    }
  };
  values.forEach(pushUnique);
  return scopes;
};

const findToken = (scopes: any[]): string | undefined => {
  for (const scope of scopes) {
    const token =
      scope?.token ||
      scope?.access_token ||
      scope?.authToken ||
      scope?.data?.token ||
      scope?.data?.access_token ||
      scope?.data?.authToken;
    if (typeof token === "string" && token.trim()) {
      return token;
    }
  }
  return undefined;
};

const findUser = (scopes: any[]): LoginApiUser | undefined => {
  const candidateFromScope = (scope: any) => {
    if (!scope || typeof scope !== "object") return undefined;
    const candidates = [
      scope.user,
      scope.user_info,
      scope.user_data,
      scope.profile,
      scope.account,
      scope,
    ];
    for (const candidate of candidates) {
      if (
        candidate &&
        typeof candidate === "object" &&
        (typeof candidate.UserID === "number" ||
          typeof candidate.UserCode === "number" ||
          typeof candidate.user_code === "number")
      ) {
        return candidate as LoginApiUser;
      }
    }
    return undefined;
  };

  for (const scope of scopes) {
    const result = candidateFromScope(scope);
    if (result) return result;
  }
  return undefined;
};

const normalizeLoginResponse = (
  base: any,
  raw: AuthApiEnvelope<LoginApiSuccess> | LoginApiSuccess
): LoginApiSuccess => {
  const scopes = collectScopes(base, raw);
  const token = findToken(scopes);
  if (!token) {
    throw new Error("Không nhận được token đăng nhập.");
  }
  const user = findUser(scopes);
  if (!user) {
    throw new Error("Không nhận được thông tin người dùng.");
  }
  return { token, user };
};

export async function loginApi(payload: LoginApiReq): Promise<LoginApiSuccess> {
  try {
    const { data } = await api.post<
      AuthApiEnvelope<LoginApiSuccess> | LoginApiSuccess
    >("/auth/login", payload);
    const base = unwrapAuthPayload<LoginApiSuccess | LoginApiUser>(
      data,
      "Tên đăng nhập hoặc mật khẩu không đúng"
    );
    return normalizeLoginResponse(base, data);
  } catch (error) {
    rethrowApiError(error, "Đăng nhập thất bại");
  }
}

export async function registerApi(payload: RegisterApiReq) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token: string, new_password: string) {
  const { data } = await api.post("/auth/reset-password", {
    token,
    new_password,
  });
  return data;
}

export async function getGuestTokenApi(): Promise<string> {
  try {
    const { data } = await api.post<
      AuthApiEnvelope<{ token: string }> | { token: string }
    >("/auth/guest");
    const payload = unwrapAuthPayload(
      data,
      "Không thể lấy guest token"
    );
    if (!payload?.token) {
      throw new Error("Không nhận được guest token.");
    }
    return payload.token;
  } catch (error) {
    rethrowApiError(error, "Không thể lấy guest token");
  }
}
