import type { AuthUser } from "../types";

type ApiUserLike = {
  UserID?: number;
  UserCode?: number;
  user_code?: number;
  LevelCode?: number;
  level_code?: number;
  FullName?: string;
  user_name?: string;
  Email?: string | null;
  email?: string | null;
  ShopCode?: number | null;
  shop_code?: number | null;
};

export function mapLevelCodeToType(levelCode: number): AuthUser["level_type"] {
  if (levelCode === 3) return "admin";
  if (levelCode === 2) return "shop";
  return "cus";
}

export function mapApiUserToAuthUser(apiUser: ApiUserLike): AuthUser {
  if (!apiUser) {
    throw new Error("Thiếu thông tin người dùng.");
  }

  const userCode =
    apiUser.UserID ?? apiUser.UserCode ?? apiUser.user_code ?? null;
  if (typeof userCode !== "number") {
    throw new Error("Không xác định được mã người dùng.");
  }

  const levelCode =
    apiUser.LevelCode ?? apiUser.level_code ?? (apiUser as any).Level ?? 0;
  const fullName =
    apiUser.FullName ??
    apiUser.user_name ??
    (apiUser as any).Fullname ??
    "";
  const email = apiUser.Email ?? apiUser.email ?? "";
  const shopCode = apiUser.ShopCode ?? apiUser.shop_code ?? null;

  const mapped: AuthUser = {
    user_code: userCode,
    level_type: mapLevelCodeToType(Number(levelCode) || 0),
    user_name: fullName,
    email,
  };

  if (shopCode !== null && shopCode !== undefined) {
    mapped.shop_code = Number(shopCode);
  }

  return mapped;
}
