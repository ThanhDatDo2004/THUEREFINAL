import React, { useEffect, useMemo, useState } from "react";
import { getAllUsers, getUsersLevels } from "../../utils/fakeApi";
import type { Users, UsersLevel } from "../../types";

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<Users[]>([]);
  const [levels, setLevels] = useState<UsersLevel[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const [u, l] = await Promise.all([getAllUsers(), getUsersLevels()]);
      setUsers(u);
      setLevels(l);
    })();
  }, []);

  const levelMap = useMemo(() => {
    const map = new Map<number, string>();
    levels.forEach((l) => map.set(l.level_code, l.level_type));
    return map;
  }, [levels]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter(
      (u) =>
        u.user_name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s)
    );
  }, [users, q]);

  return (
    <div>
      <div className="shop-header">
        <div>
          <h1 className="shop-title">Users</h1>
          <p className="shop-sub">Quản lý người dùng hệ thống</p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input"
          placeholder="Tìm theo tên hoặc email"
        />
      </div>

      <div className="section">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">ID</th>
                <th className="th">Tên</th>
                <th className="th">Email</th>
                <th className="th">Role</th>
                <th className="th">Active</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.user_code}>
                  <td className="td">{u.user_code}</td>
                  <td className="td">{u.user_name}</td>
                  <td className="td">{u.email}</td>
                  <td className="td uppercase">
                    {levelMap.get(u.level_code) || "?"}
                  </td>
                  <td className="td">{u.isActive ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
