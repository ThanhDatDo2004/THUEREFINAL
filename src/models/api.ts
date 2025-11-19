const RAW_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5050";

function normalizeApiBase(base: string) {
  const clean = base.replace(/\/+$/, "");
  return /\/api$/i.test(clean) ? clean : clean + "/api";
}

function normalizeApiOrigin(base: string) {
  const withoutTrailingSlash = base.replace(/\/+$/, "");
  return withoutTrailingSlash.replace(/\/api$/i, "");
}

export const API_BASE = normalizeApiBase(RAW_BASE);
export const API_ORIGIN = normalizeApiOrigin(RAW_BASE);

type Primitive = string | number | boolean;

export type ApiRequestConfig = {
  params?:
    | Record<string, Primitive | Primitive[] | null | undefined>
    | URLSearchParams;
  headers?: Record<string, string>;
  data?: any;
  body?: BodyInit | null;
  signal?: AbortSignal;
};

export type ApiResponse<T> = {
  data: T;
  status: number;
  headers: Headers;
};

const isAbsoluteUrl = (path: string) => /^https?:\/\//i.test(path);

const buildUrl = (path: string, params?: ApiRequestConfig["params"]) => {
  const base = isAbsoluteUrl(path)
    ? path
    : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const url = new URL(base);
  if (params) {
    if (params instanceof URLSearchParams) {
      params.forEach((value, key) => {
        url.searchParams.append(key, value);
      });
    } else {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((item) =>
            url.searchParams.append(key, String(item ?? ""))
          );
          return;
        }
        url.searchParams.set(key, String(value));
      });
    }
  }
  return url.toString();
};

const parseJsonSafely = async (res: Response) => {
  try {
    return await res.json();
  } catch (_err) {
    return null;
  }
};

const buildError = (res: Response, data: any) => {
  const message =
    data?.error?.message ||
    data?.message ||
    `Request failed with status ${res.status}`;
  const error: any = new Error(message);
  error.status = res.status;
  error.body = data;
  return error;
};

async function request<T>(
  method: string,
  path: string,
  config: ApiRequestConfig = {}
): Promise<ApiResponse<T>> {
  const url = buildUrl(path, config.params);
  const headers = new Headers(config.headers || {});
  headers.set("Accept", "application/json");

  const token = localStorage.getItem("access_token");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body: BodyInit | null | undefined =
    config.body === undefined ? null : config.body;
  let isFormData = false;

  if (body === null && config.data !== undefined) {
    if (config.data instanceof FormData) {
      body = config.data;
      isFormData = true;
    } else if (
      config.data instanceof URLSearchParams ||
      typeof config.data === "string"
    ) {
      body = config.data;
    } else {
      body = JSON.stringify(config.data);
    }
  }

  if (!isFormData && body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    signal: config.signal,
  };

  if (method !== "GET" && method !== "HEAD" && body !== null) {
    fetchOptions.body = body;
  }

  const res = await fetch(url, fetchOptions);
  const data = await parseJsonSafely(res);

  if (!res.ok || (data && typeof data === "object" && data.success === false)) {
    throw buildError(res, data);
  }

  return {
    data: data as T,
    status: res.status,
    headers: res.headers,
  };
}

export const api = {
  get<T>(path: string, config?: ApiRequestConfig) {
    return request<T>("GET", path, config);
  },
  delete<T>(path: string, config?: ApiRequestConfig) {
    return request<T>("DELETE", path, config);
  },
  post<T>(path: string, data?: any, config?: ApiRequestConfig) {
    return request<T>("POST", path, { ...(config || {}), data });
  },
  put<T>(path: string, data?: any, config?: ApiRequestConfig) {
    return request<T>("PUT", path, { ...(config || {}), data });
  },
  patch<T>(path: string, data?: any, config?: ApiRequestConfig) {
    return request<T>("PATCH", path, { ...(config || {}), data });
  },
  request,
};

export default api;
