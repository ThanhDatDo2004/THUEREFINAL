import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Store,
  FileClock,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const navItemBase =
  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all";
const navItemIdle = "text-gray-700 hover:text-gray-900 hover:bg-gray-100";
const navItemActive = "bg-gray-900 text-white shadow";

function AdminLayout() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* SIDEBAR */}
        <aside
          className={[
            "rounded-2xl bg-white shadow-md border border-gray-100 sticky top-6 h-max",
            collapsed ? "lg:w-[84px]" : "lg:w-[280px]",
          ].join(" ")}
        >
          {/* Brand */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                A
              </div>
              {!collapsed && (
                <div>
                  <div className="font-semibold leading-tight">Admin Panel</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              )}
            </div>

            {/* Collapse button */}
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Mở rộng" : "Thu gọn"}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Nav */}
          <nav className="p-3 space-y-1">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? navItemActive : navItemIdle}`
              }
            >
              <LayoutDashboard className="h-4 w-4" />
              {!collapsed && <span>Dashboard</span>}
            </NavLink>

            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? navItemActive : navItemIdle}`
              }
            >
              <Users className="h-4 w-4" />
              {!collapsed && <span>Users</span>}
            </NavLink>

            <NavLink
              to="/admin/shops"
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? navItemActive : navItemIdle}`
              }
            >
              <Store className="h-4 w-4" />
              {!collapsed && <span>Shops</span>}
            </NavLink>

            <NavLink
              to="/admin/requests"
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? navItemActive : navItemIdle}`
              }
            >
              <FileClock className="h-4 w-4" />
              {!collapsed && <span>Shop Requests</span>}
            </NavLink>

            <div className="pt-2 mt-2 border-t border-gray-100" />

            <NavLink
              to="/admin/settings"
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? navItemActive : navItemIdle}`
              }
            >
              <Settings className="h-4 w-4" />
              {!collapsed && <span>Settings</span>}
            </NavLink>
          </nav>

          {/* Footer note */}
          <div className="px-4 pb-4 pt-2 text-xs text-gray-400">
            {!collapsed && (
              <span>© {new Date().getFullYear()} SportBooking</span>
            )}
          </div>
        </aside>

        {/* CONTENT */}
        <main className="rounded-2xl bg-white shadow-md border border-gray-100 p-4 lg:p-6 min-h-[60vh]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
