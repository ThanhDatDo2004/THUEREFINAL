import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAdminUsers,
  fetchAdminUserLevels,
  updateAdminUserStatus,
} from "../../models/admin.api";
import type { Users, UsersLevel } from "../../types";
import { Ban, Search, ShieldCheck, Users as UsersIcon } from "lucide-react";

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

  const heroStats = [
    {
      label: "Tổng người dùng",
      value: stats.total.toLocaleString("vi-VN"),
      accent: "bg-white/15 text-white",
      icon: UsersIcon,
    },
    {
      label: "Đang hoạt động",
      value: stats.active.toLocaleString("vi-VN"),
      accent: "bg-emerald-500/30 text-white",
      icon: ShieldCheck,
    },
    {
      label: "Đã khóa",
      value: stats.inactive.toLocaleString("vi-VN"),
      accent: "bg-rose-500/30 text-white",
      icon: Ban,
    },
    {
      label: "Phân bố vai trò",
      value:
        Object.entries(stats.byRole)
          .map(([role, count]) => `${role}: ${count}`)
          .join(" · ") || "—",
      accent: "bg-slate-900/20 text-white",
      icon: UsersIcon,
    },
  ];

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
    <div className="flex w-full min-w-0 flex-col gap-6">
      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 text-white shadow-lg">
        <div className="space-y-6 p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                <UsersIcon className="h-3.5 w-3.5" />
                Trung tâm người dùng
              </p>
              <h1 className="text-3xl font-bold leading-tight md:text-4xl">
                Quản lý người dùng hệ thống
              </h1>
              <p className="text-sm text-white/80 md:text-base">
                Theo dõi quyền truy cập, trạng thái hoạt động và hành động nhanh
                với từng tài khoản.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm theo tên, email hoặc ID"
                  className="w-full rounded-2xl border border-white/30 bg-white/15 px-10 py-2 text-sm text-white placeholder:text-white/70 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/40"
                />
              </div>
              <button
                type="button"
                className="rounded-2xl border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                onClick={resetFilters}
              >
                Đặt lại
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {heroStats.map(({ label, value, accent, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/20 bg-white/10 p-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/70">
                      {label}
                    </p>
                    <p className="text-xl font-semibold">{value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col text-sm text-slate-600">
            <span className="font-semibold text-slate-700">Vai trò</span>
            <select
              className="input mt-1 h-11 w-full"
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
          </label>

          <label className="flex flex-col text-sm text-slate-600">
            <span className="font-semibold text-slate-700">Trạng thái</span>
            <select
              className="input mt-1 h-11 w-full"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã khóa</option>
            </select>
          </label>

          <label className="flex flex-col text-sm text-slate-600">
            <span className="font-semibold text-slate-700">Sắp xếp</span>
            <select
              className="input mt-1 h-11 w-full"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              <option value="name">Theo tên</option>
              <option value="email">Theo email</option>
              <option value="role">Theo vai trò</option>
              <option value="id">Theo ID</option>
            </select>
          </label>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Danh sách người dùng
              </h2>
              <p className="text-xs text-slate-500">
                {sorted.length} kết quả · {users.length} tổng cộng
              </p>
            </div>
          </div>
          <div className="space-y-3 px-4 py-4 sm:px-6">
            {sorted.map((user) => {
              const isSelected = selectedUser?.user_code === user.user_code;
              return (
                <div
                  key={user.user_code}
                  className={`rounded-2xl border p-4 transition ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-50/30 shadow-sm"
                      : "border-slate-100 bg-white hover:border-emerald-200"
                  }`}
                  onClick={() => setSelectedUser(user)}
                  role="button"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-slate-900">
                        {user.user_name}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 text-sm sm:items-end">
                      {renderRoleBadge(user)}
                      {renderStatusBadge(user)}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 text-xs text-slate-500 sm:grid-cols-3">
                    <div>
                      <p className="font-semibold text-slate-700">Tài khoản</p>
                      <p>{user.user_id}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700">
                        Mã hệ thống
                      </p>
                      <p>#{user.user_code}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {!sorted.length && (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                Không tìm thấy người dùng phù hợp.
              </div>
            )}
          </div>
        </section>

        <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Thông tin chi tiết
          </h3>
          {selectedUser ? (
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <div>
                <p className="text-xs uppercase text-slate-400">
                  Tên người dùng
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {selectedUser.user_name}
                </p>
              </div>
           
              <div>
                <p className="text-xs uppercase text-slate-400">Email</p>
                <a
                  href={`mailto:${selectedUser.email}`}
                  className="font-medium text-emerald-600 hover:underline"
                >
                  {selectedUser.email}
                </a>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">
                  Số điện thoại
                </p>
                <p>{selectedUser.phone_number || "Chưa cập nhật"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Vai trò</p>
                {renderRoleBadge(selectedUser)}
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Trạng thái</p>
                {renderStatusBadge(selectedUser)}
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Mã hệ thống</p>
                <p className="font-semibold text-slate-900">
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
                className={`w-full rounded-xl px-4 py-2 text-sm font-semibold ${
                  selectedUser.isActive
                    ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                }`}
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
            <p className="mt-4 text-sm text-slate-500">
              Chọn một người dùng từ danh sách để xem chi tiết.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
};

export default AdminUsersPage;
