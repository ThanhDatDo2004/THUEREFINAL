// src/pages/shop/ShopLayout.tsx
import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  CalendarRange,
  Users,
  Wallet2,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { fetchMyShop } from "../../models/shop.api";

import type { Shops } from "../../types";

const navItemBase =
  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all";
const navItemIdle = "text-gray-700 hover:text-gray-900 hover:bg-gray-100";
const navItemActive = "bg-gray-900 text-white shadow";

const ShopLayout: React.FC = () => {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shops | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!user?.user_code) return;
      try {
        const s = await fetchMyShop();
        if (!ignore) setShop(s ?? null);
      } catch (error) {
        console.error(error);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [user?.user_code]);

  const initial =
    (shop?.shop_name?.trim()?.charAt(0) || "S").toUpperCase();

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
                {initial}
              </div>
              {!collapsed && (
                <div>
                  <div className="font-semibold leading-tight">
                    {shop?.shop_name || "Shop Dashboard"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {shop?.address || user?.email}
                  </div>
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
              to="/shop"
              end
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? navItemActive : navItemIdle}`
              }
            >
              <LayoutDashboard className="h-4 w-4" />
              {!collapsed && <span>Tổng quan</span>}
            </NavLink>

            <NavLink
              to="/shop/fields"
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? navItemActive : navItemIdle}`
              }
            >
              <Layers className="h-4 w-4" />
              {!collapsed && <span>Danh sách sân</span>}
            </NavLink>

            <NavLink
              to="/shop/bookings"
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? navItemActive : navItemIdle}`
              }
            >
              <CalendarRange className="h-4 w-4" />
              {!collapsed && <span>Đơn đặt</span>}
            </NavLink>

            <NavLink
              to="/shop/customers"
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? navItemActive : navItemIdle}`
              }
            >
              <Users className="h-4 w-4" />
              {!collapsed && <span>Khách hàng</span>}
            </NavLink>

            <NavLink
              to="/shop/revenue"
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? navItemActive : navItemIdle}`
              }
            >
              <Wallet2 className="h-4 w-4" />
              {!collapsed && <span>Doanh thu</span>}
            </NavLink>

            <div className="pt-2 mt-2 border-t border-gray-100" />

            <NavLink
              to="/shop/settings"
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? navItemActive : navItemIdle}`
              }
            >
              <Settings className="h-4 w-4" />
              {!collapsed && <span>Cài đặt</span>}
            </NavLink>
          </nav>

          {/* Footer */}
          <div className="px-4 pb-4 pt-2 text-xs text-gray-400">
            {!collapsed && <span>© {new Date().getFullYear()} SportBooking</span>}
          </div>
        </aside>

        {/* CONTENT */}
        <main className="rounded-2xl bg-white shadow-md border border-gray-100 p-4 lg:p-6 min-h-[60vh]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ShopLayout;
