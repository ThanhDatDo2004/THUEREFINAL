import usersJson from "./data/users.json";
import shopsJson from "./data/shops.json";
import type { Users, Shops } from "../types";

const USERS = usersJson as Users[];
const SHOPS = shopsJson as Shops[];

export function getUserByEmail(email: string): Users | undefined {
  return USERS.find(u => u.email === email);
}

export function getShopByUserCode(userCode: number): Shops | undefined {
  return SHOPS.find(s => s.user_code === userCode);
}
