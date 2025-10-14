import { API_ORIGIN } from "../models/api";

type StorageMeta = {
  bucket?: string;
  key?: string;
  region?: string;
};

function sanitizeBase(value?: string | null) {
  if (!value) return "";
  return value.trim().replace(/\/+$/, "");
}

const CONFIGURED_UPLOAD_BASE = sanitizeBase(
  import.meta.env.VITE_PUBLIC_UPLOAD_BASE
);
const API_BASE_ORIGIN = sanitizeBase(API_ORIGIN);
const DEFAULT_REGION = "ap-southeast-1";

function joinBaseWithPath(base: string, path: string) {
  const cleanBase = base.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  if (!cleanBase) {
    return `/${cleanPath}`;
  }
  return `${cleanBase}/${cleanPath}`;
}

function isAbsoluteUrl(candidate: string) {
  return /^(?:[a-z][a-z\d+\-.]*:)?\/\//i.test(candidate);
}

function buildS3Url(storage?: StorageMeta) {
  if (!storage?.bucket || !storage?.key) return undefined;
  const cleanKey = storage.key.replace(/^\/+/, "");
  const region = storage.region?.trim() || DEFAULT_REGION;
  const host =
    region === "us-east-1"
      ? `${storage.bucket}.s3.amazonaws.com`
      : `${storage.bucket}.s3.${region}.amazonaws.com`;
  return `https://${host}/${cleanKey}`;
}

export function resolveImageUrl(
  input?: string | null,
  storage?: StorageMeta
): string | undefined {
  const base = CONFIGURED_UPLOAD_BASE || API_BASE_ORIGIN;
  const trimmed = typeof input === "string" ? input.trim() : "";

  if (trimmed) {
    if (isAbsoluteUrl(trimmed) || trimmed.startsWith("data:")) {
      return trimmed;
    }

    if (trimmed.startsWith("/")) {
      if (!base) return trimmed;
      return joinBaseWithPath(base, trimmed);
    }

    const normalized = trimmed.replace(/^\/+/, "");
    if (normalized) {
      return joinBaseWithPath(base, normalized);
    }
  }

  const s3Url = buildS3Url(storage);
  if (s3Url) {
    return s3Url;
  }

  if (trimmed) {
    return trimmed;
  }

  return undefined;
}

export default resolveImageUrl;
