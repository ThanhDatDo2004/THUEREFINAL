import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAdminUsers,
  fetchAdminShops,
  fetchAdminShopRequests,
} from "../../models/admin.api";
import type { Users, Shops, ShopRequests } from "../../types";
import {
  Activity,
  CheckCircle2,
  Shield,
  Store,
  UserPlus,
  Clock,
} from "lucide-react";

type ActivityEntry = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "user" | "shop" | "request";
  status?: string;
};

const AdminActivityPage: React.FC = () => {
  const [users, setUsers] = useState<Users[]>([]);
  const [shops, setShops] = useState<Shops[]>([]);
  const [requests, setRequests] = useState<ShopRequests[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const [u, s, r] = await Promise.all([
          fetchAdminUsers(),
          fetchAdminShops(),
          fetchAdminShopRequests(),
        ]);
        if (!ignore) {
          setUsers(u);
          setShops(s);
          setRequests(r);
        }
      } catch (error) {
        console.error(error);
        if (!ignore) {
          setUsers([]);
          setShops([]);
          setRequests([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const activityTimeline = useMemo<ActivityEntry[]>(() => {
    const entries: ActivityEntry[] = [];

    requests.forEach((req) => {
      entries.push({
        id: `request-${req.request_id}`,
        title: `Yêu cầu mở shop • ${req.full_name}`,
        description: req.address || req.message || "Chưa có ghi chú",
        timestamp: req.created_at || new Date().toISOString(),
        type: "request",
        status: req.status ?? "pending",
      });
    });

    shops.slice(0, 15).forEach((shop) => {
      entries.push({
        id: `shop-${shop.shop_code}`,
        title: `Shop ${shop.shop_name}`,
        description: shop.address || "Chưa cập nhật địa chỉ",
        timestamp: new Date(
          Date.now() -
            (shop.shop_code % 12) * 24 * 60 * 60 * 1000 -
            (shop.shop_code % 6) * 3600 * 1000
        ).toISOString(),
        type: "shop",
        status:
          String(shop.isapproved ?? "") === "1" || shop.isapproved === 1
            ? "approved"
            : "pending",
      });
    });

    users.slice(0, 20).forEach((user) => {
      entries.push({
        id: `user-${user.user_code}`,
        title: `Người dùng ${user.user_name}`,
        description: user.email,
        timestamp: new Date(
          Date.now() -
            (user.user_code % 7) * 12 * 60 * 60 * 1000 -
            (user.user_code % 5) * 3600 * 1000
        ).toISOString(),
        type: "user",
        status: user.isActive === 1 ? "active" : "inactive",
      });
    });

    return entries.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [requests, shops, users]);

  const statusBadge = (entry: ActivityEntry) => {
    if (!entry.status) return null;
    let className =
      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium";
    let icon: React.ReactNode = null;
    let label = entry.status;
    if (entry.status === "approved" || entry.status === "active") {
      className += " bg-emerald-100 text-emerald-700";
      icon = <CheckCircle2 className="h-3.5 w-3.5" />;
      label = entry.status === "approved" ? "Đã duyệt" : "Hoạt động";
    } else if (entry.status === "pending" || entry.status === "reviewed") {
      className += " bg-amber-100 text-amber-700";
      icon = <Clock className="h-3.5 w-3.5" />;
      label = entry.status === "pending" ? "Chờ xử lý" : "Đang duyệt";
    } else {
      className += " bg-rose-100 text-rose-700";
      icon = <Shield className="h-3.5 w-3.5" />;
      label = entry.status === "inactive" ? "Đã khóa" : entry.status;
    }
    return (
      <span className={className}>
        {icon}
        {label}
      </span>
    );
  };

  const renderIcon = (entry: ActivityEntry) => {
    if (entry.type === "request") return <Activity className="h-4 w-4" />;
    if (entry.type === "shop") return <Store className="h-4 w-4" />;
    return <UserPlus className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="shop-header">
        <div>
          <h1 className="shop-title">Activity Log</h1>
          <p className="shop-sub">
            Dòng thời gian tổng hợp hoạt động từ người dùng, shop và yêu cầu
            mở shop.
          </p>
        </div>
      </div>

      <div className="section">
        <div className="section-header mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Hoạt động gần đây
            </h3>
            <p className="text-sm text-gray-500">
              Các sự kiện được sắp xếp theo thời gian giảm dần. Một số mục sử
              dụng thời gian giả lập nếu backend chưa lưu log.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {activityTimeline.slice(0, 20).map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white px-3 py-3 shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                {renderIcon(entry)}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900">{entry.title}</p>
                  <span className="text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleString("vi-VN")}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{entry.description}</p>
                {entry.status && <div>{statusBadge(entry)}</div>}
              </div>
            </div>
          ))}
          {!activityTimeline.length && (
            <div className="py-6 text-center text-sm text-gray-500">
              Chưa có hoạt động nào được ghi nhận.
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="spinner" />
          Đang tải hoạt động...
        </div>
      )}
    </div>
  );
};

export default AdminActivityPage;
