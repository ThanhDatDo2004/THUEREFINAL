export function mapLevelCodeToType(levelCode) {
  if (levelCode === 3) return "admin";
  if (levelCode === 2) return "shop";
  return "cus";
}

export function mapApiUserToAuthUser(apiUser) {
  return {
    user_code: apiUser.UserID,
    level_type: mapLevelCodeToType(apiUser.LevelCode),
    user_name: apiUser.FullName,
    email: apiUser.Email ?? "",
  };
}
