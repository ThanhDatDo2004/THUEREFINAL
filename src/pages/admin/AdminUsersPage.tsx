import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAdminUsers,
  fetchAdminUserLevels,
  updateAdminUserStatus,
} from "../../models/admin.api";
import type { Users, UsersLevel } from "../../types";

type StatusFilter = "all" | "active" | "inactive";
type SortKey = "name" | "email" | "role" | "id";

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<Users[]>([]);
  const [levels, setLevels] = useState<UsersLevel[]>([]);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [selectedUser, setSelectedUser] = useState<Users | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [u, l] = await Promise.all([
          fetchAdminUsers(),
          fetchAdminUserLevels(),
        ]);
        if (!ignore) {
          setUsers(u);
          setLevels(l);
        }
      } catch (error) {
        console.error(error);
        if (!ignore) {
          setUsers([]);
          setLevels([]);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const levelMap = useMemo(() => {
    const map = new Map<number, string>();
    levels.forEach((l) => map.set(l.level_code, l.level_type));
    return map;
  }, [levels]);

  const roleOptions = useMemo<{ label: string; value: string }[]>(() => {
    return [{ label: "Tất cả", value: "all" }].concat(
      levels.map((l) => ({
        label: l.level_type.toUpperCase(),
        value: String(l.level_code),
      }))
    );
  }, [levels]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => Boolean(u.isActive)).length;
    const inactive = total - active;
    const byRole = levels.reduce<Record<string, number>>((acc, level) => {
      acc[level.level_type] = users.filter(
        (u) => u.level_code === level.level_code
      ).length;
      return acc;
    }, {});
    return { total, active, inactive, byRole };
  }, [users, levels]);

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !search ||
        user.user_name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.user_id.toLowerCase().includes(search);
      const matchesRole =
        roleFilter === "all" || user.level_code === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? user.isActive === 1 : user.isActive === 0);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, q, roleFilter, statusFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const compare = (a: Users, b: Users) => {
      if (sortKey === "name") {
        return a.user_name.localeCompare(b.user_name, "vi");
      }
      if (sortKey === "email") {
        return a.email.localeCompare(b.email, "vi");
      }
      if (sortKey === "role") {
        const roleA = levelMap.get(a.level_code) ?? "";
        const roleB = levelMap.get(b.level_code) ?? "";
        return roleA.localeCompare(roleB, "vi");
      }
      return a.user_code - b.user_code;
    };
    return list.sort(compare);
  }, [filtered, sortKey, levelMap]);

  useEffect(() => {
    setSelectedUser((prev) => {
      if (prev && sorted.some((u) => u.user_code === prev.user_code)) {
        return sorted.find((u) => u.user_code === prev.user_code) ?? null;
      }
      return sorted[0] ?? null;
    });
  }, [sorted]);

  const resetFilters = () => {
    setQ("");
    setRoleFilter("all");
    setStatusFilter("all");
    setSortKey("name");
  };

  const renderRoleBadge = (user: Users) => {
    const role = levelMap.get(user.level_code) ?? "?";
    const roleClassName =
      role === "admin"
        ? "bg-emerald-100 text-emerald-700"
        : role === "shop"
        ? "bg-blue-100 text-blue-700"
        : "bg-gray-100 text-gray-700";
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${roleClassName}`}
      >
        {role}
      </span>
    );
  };

  const renderStatusBadge = (user: Users) => {
    const isActive = Boolean(user.isActive);
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          isActive
            ? "bg-emerald-100 text-emerald-700"
            : "bg-rose-100 text-rose-700"
        }`}
      >
        {isActive ? "Đang hoạt động" : "Đã khóa"}
      </span>
    );
  };

  const handleToggleStatus = async (user: Users) => {
    const nextActive = user.isActive !== 1;
    if (
      !window.confirm(
        nextActive ? "Mở khóa tài khoản này?" : "Khóa tài khoản này?"
      )
    ) {
      return;
    }
    setUpdatingId(user.user_code);
    try {
      const updated = await updateAdminUserStatus(user.user_code, nextActive);
      setUsers((prev) =>
        prev.map((u) => (u.user_code === updated.user_code ? updated : u))
      );
      setSelectedUser(updated);
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="shop-header">
        <div>
          <h1 className="shop-title">Users</h1>
          <p className="shop-sub">
            Quản lý người dùng hệ thống, vai trò và trạng thái hoạt động
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input w-64"
            placeholder="Tìm theo tên hoặc email"
          />
          <button type="button" className="btn-ghost" onClick={resetFilters}>
            Đặt lại
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Tổng người dùng</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-emerald-600">{stats.active}</div>
          <div className="stat-label">Đang hoạt động</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-rose-600">{stats.inactive}</div>
          <div className="stat-label">Đã khóa</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-sky-600">
            {Object.entries(stats.byRole)
              .map(([role, count]) => `${role}: ${count}`)
              .join(" • ") || "—"}
          </div>
          <div className="stat-label">Phân bố theo vai trò</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="section space-y-4 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Role</label>
              <select
                className="input h-10 w-40"
                value={roleFilter}
                onChange={(e) =>
                  setRoleFilter(
                    e.target.value === "all"
                      ? "all"
                      : Number(e.target.value) || "all"
                  )
                }
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">
                Trạng thái
              </label>
              <select
                className="input h-10 w-36"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
              >
                <option value="all">Tất cả</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Đã khóa</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">
                Sắp xếp
              </label>
              <select
                className="input h-10 w-40"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
              >
                <option value="name">Theo tên</option>
                <option value="email">Theo email</option>
                <option value="role">Theo vai trò</option>
                <option value="id">Theo ID</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="table min-w-[720px]">
              <thead>
                <tr>
                  <th className="th text-left">User</th>
                  <th className="th text-left">Email</th>
                  <th className="th text-left">Role</th>
                  <th className="th text-left">Trạng thái</th>
                  <th className="th text-left">Liên hệ</th>
                  <th className="th text-left">Mã</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((user) => {
                  const isSelected = selectedUser?.user_code === user.user_code;
                  return (
                    <tr
                      key={user.user_code}
                      className={isSelected ? "bg-gray-50" : undefined}
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="td font-medium text-gray-900">
                        {user.user_name}
                      </td>
                      <td className="td text-gray-600">{user.email}</td>
                      <td className="td">{renderRoleBadge(user)}</td>
                      <td className="td">{renderStatusBadge(user)}</td>
                      <td className="td text-sm text-gray-600">
                        <div>{user.phone_number || "—"}</div>
                        <div className="text-xs text-gray-500">
                          {user.email}
                        </div>
                      </td>
                      <td className="td text-sm text-gray-500">
                        #{user.user_code}
                      </td>
                    </tr>
                  );
                })}
                {sorted.length === 0 && (
                  <tr>
                    <td className="td text-center text-gray-500" colSpan={5}>
                      Không tìm thấy người dùng phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="section space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Thông tin chi tiết
          </h3>
          {selectedUser ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Tên người dùng</p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedUser.user_name}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Tài khoản đăng nhập</p>
                <p className="text-sm font-medium text-gray-700">
                  {selectedUser.user_id}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Email</p>
                <a
                  href={`mailto:${selectedUser.email}`}
                  className="text-sm font-medium text-indigo-600 hover:underline"
                >
                  {selectedUser.email}
                </a>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Số điện thoại</p>
                <p className="text-sm font-medium text-gray-700">
                  {selectedUser.phone_number || "Chưa cập nhật"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Vai trò</p>
                {renderRoleBadge(selectedUser)}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Trạng thái</p>
                {renderStatusBadge(selectedUser)}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Mã hệ thống</p>
                <p className="text-sm font-medium text-gray-700">
                  #{selectedUser.user_code}
                </p>
              </div>
              <button
                type="button"
                className="btn-primary w-full"
                onClick={() =>
                  window.open(
                    `mailto:${selectedUser.email}?subject=Hỗ trợ từ Admin`,
                    "_blank"
                  )
                }
              >
                Liên hệ qua email
              </button>
              <button
                type="button"
                className={
                  selectedUser.isActive
                    ? "btn-danger w-full"
                    : "btn-primary w-full"
                }
                onClick={() => handleToggleStatus(selectedUser)}
                disabled={updatingId === selectedUser.user_code}
              >
                {updatingId === selectedUser.user_code
                  ? "Đang cập nhật..."
                  : selectedUser.isActive
                  ? "Khoá tài khoản"
                  : "Mở khoá tài khoản"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Chọn một người dùng từ danh sách để xem chi tiết.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
};

export default AdminUsersPage;
