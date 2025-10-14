// src/models/api.ts
import axios from "axios";

const RAW_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5050";

function normalizeApiBase(base: string) {
  const clean = base.replace(/\/+$/, "");
  return /\/api$/i.test(clean) ? clean : clean + "/api";
}

function normalizeApiOrigin(base: string) {
  const withoutTrailingSlash = base.replace(/\/+$/, "");
  return withoutTrailingSlash.replace(/\/api$/i, "");
}

export const API_BASE = normalizeApiBase(RAW_BASE); // -> http://localhost:5050/api
export const API_ORIGIN = normalizeApiOrigin(RAW_BASE);

export const api = axios.create({ baseURL: API_BASE, timeout: 10000 });

// Gắn Bearer token nếu có
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Cho lỗi 4xx/5xx rơi vào catch của caller
api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default api;
