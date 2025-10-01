import type { AuthUser } from "../types";

export function mapLevelCodeToType(levelCode: number): AuthUser["level_type"] {
  // CẬP NHẬT ánh xạ này theo DB của bạn:
  // Trong log bạn gửi trước đó: admin có LevelCode = 3
  if (levelCode === 3) return "admin";
  if (levelCode === 2) return "shop";
  return "cus"; // mặc định
}

export function mapApiUserToAuthUser(apiUser: {
  UserID: number;
  LevelCode: number;
  FullName: string;
  Email: string | null;
}): AuthUser {
  return {
    user_code: apiUser.UserID,
    level_type: mapLevelCodeToType(apiUser.LevelCode),
    user_name: apiUser.FullName,
    email: apiUser.Email ?? "",
  };
}
