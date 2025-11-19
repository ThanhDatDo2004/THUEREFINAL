import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  fetchAdminUsers,
  fetchAdminShops,
  fetchAdminShopRequests,
  fetchAdminRevenue,
} from "../../models/admin.api";
import type { Users, Shops, ShopRequests, ShopRevenue } from "../../types";
import {
  Users as UsersIcon,
  Store,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
} from "lucide-react";

type RevenueBreakdown = {
  month: string;
  income: number;
  expense: number;
  balance: number;
};

const monthLabel = (monthNumber: number) => {
  return `T${monthNumber}`;
};

const AdminInsightsPage: React.FC = () => {
  const [users, setUsers] = useState<Users[]>([]);
  const [shops, setShops] = useState<Shops[]>([]);
  const [requests, setRequests] = useState<ShopRequests[]>([]);
  const [revenue, setRevenue] = useState<ShopRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [u, s, r, rev] = await Promise.all([
          fetchAdminUsers(),
          fetchAdminShops(),
          fetchAdminShopRequests(),
          fetchAdminRevenue(new Date().getFullYear()).catch(() => []),
        ]);
        if (ignore) return;
        setUsers(u);
        setShops(s);
        setRequests(r);
        setRevenue(rev ?? []);
      } catch (err) {
        console.error(err);
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải dữ liệu insights."
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const insightStats = useMemo(() => {
    const totalUsers = users.length;
    const totalAdmins = users.filter((u) => u.level_code === 3).length;
    const activeUsers = users.filter((u) => u.isActive === 1).length;
    const totalShops = shops.length;
    const approvedShops = shops.filter(
      (s) => String(s.isapproved ?? "") === "1" || s.isapproved === 1
    ).length;
    const pendingRequests = requests.filter(
      (r) => r.status === "pending" || !r.status
    ).length;
    const approvalRate =
      requests.length > 0
        ? Math.round(
            (requests.filter((r) => r.status === "approved").length /
              requests.length) *
              100
          )
        : 0;

    return {
      totalUsers,
      activeUsers,
      totalAdmins,
      totalShops,
      approvedShops,
      pendingRequests,
      approvalRate,
    };
  }, [users, shops, requests]);

  const requestStatusData = useMemo(() => {
    const grouped = requests.reduce<Record<string, number>>((acc, req) => {
      const key = req.status || "pending";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const order = ["pending", "reviewed", "approved", "rejected"];
    return order.map((statusKey) => ({
      status: statusKey,
      value: grouped[statusKey] ?? 0,
    }));
  }, [requests]);

  const revenueSeries: RevenueBreakdown[] = useMemo(() => {
    if (!revenue.length) return [];
    return revenue
      .sort((a, b) => a.Month - b.Month)
      .map((entry) => ({
        month: monthLabel(entry.Month),
        income: entry.total_income,
        expense: entry.total_expense,
        balance: entry.Balance,
      }));
  }, [revenue]);

  const topShops = useMemo(() => {
    return [...shops]
      .sort((a, b) => {
        const nameA = a.shop_name?.toLowerCase() ?? "";
        const nameB = b.shop_name?.toLowerCase() ?? "";
        return nameA.localeCompare(nameB, "vi");
      })
      .slice(0, 6);
  }, [shops]);

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div className="shop-header flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="shop-title">Insights</h1>
          <p className="shop-sub">
            Bức tranh tổng quan về người dùng, shop và yêu cầu đăng ký trong hệ
            thống.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="stat-card min-w-0">
          <div className="stat-icon">
            <UsersIcon size={18} />
          </div>
          <div className="stat-value">{insightStats.totalUsers}</div>
          <div className="stat-label">Tổng người dùng</div>
          <div className="stat-sub">
            {insightStats.activeUsers} đang hoạt động •{" "}
            {insightStats.totalAdmins} admin
          </div>
        </div>
        <div className="stat-card min-w-0">
          <div className="stat-icon">
            <Store size={18} />
          </div>
          <div className="stat-value">{insightStats.totalShops}</div>
          <div className="stat-label">Shop đã tạo</div>
          <div className="stat-sub">
            {insightStats.approvedShops} shop đã duyệt (
            {Math.round(
              insightStats.approvedShops === 0
                ? 0
                : (insightStats.approvedShops /
                    Math.max(insightStats.totalShops, 1)) *
                    100
            )}
            %)
          </div>
        </div>
        <div className="stat-card min-w-0">
          <div className="stat-icon">
            <AlertTriangle size={18} />
          </div>
          <div className="stat-value">{insightStats.pendingRequests}</div>
          <div className="stat-label">Yêu cầu chờ xử lý</div>
          <div className="stat-sub">
            Tỉ lệ duyệt: {insightStats.approvalRate}%
          </div>
        </div>
        <div className="stat-card min-w-0">
          <div className="stat-icon">
            <TrendingUp size={18} />
          </div>
          <div className="stat-value">
            {revenueSeries.length
              ? revenueSeries
                  .reduce((acc, curr) => acc + curr.balance, 0)
                  .toLocaleString("vi-VN")
              : "—"}
          </div>
          <div className="stat-label">Tổng lợi nhuận năm</div>
          <div className="stat-sub">Dữ liệu doanh thu toàn hệ thống</div>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="section min-w-0 overflow-hidden">
          <div className="section-header">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Phân bố yêu cầu mở shop
              </h3>
              <p className="text-sm text-gray-500">
                Tổng hợp trạng thái xử lý yêu cầu trong toàn hệ thống
              </p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <BarChart data={requestStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="section min-w-0 overflow-hidden">
          <div className="section-header">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Diễn biến doanh thu
              </h3>
              <p className="text-sm text-gray-500">
                Thu/chi và lợi nhuận theo tháng trong năm hiện tại
              </p>
            </div>
          </div>
          <div className="h-72 w-full">
            {revenueSeries.length ? (
              <ResponsiveContainer>
                <AreaChart data={revenueSeries}>
                  <defs>
                    <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f87171" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={(v) => `${Math.round(v / 1_000_000)}tr`}
                  />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Thu"
                    stroke="#10b981"
                    fill="url(#income)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Chi"
                    stroke="#f97316"
                    fill="url(#expense)"
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    name="Lợi nhuận"
                    stroke="#6366f1"
                    fillOpacity={0}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Chưa có dữ liệu doanh thu cho năm hiện tại.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="section min-w-0 overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Shop nổi bật
          </h3>
          <div className="min-w-0 divide-y divide-gray-100">
            {topShops.map((shop) => (
              <div
                key={shop.shop_code}
                className="flex w-full items-center gap-3 py-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 font-semibold">
                  {shop.shop_name?.charAt(0).toUpperCase() ?? "S"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">
                    {shop.shop_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {shop.address}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    shop.isapproved
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {shop.isapproved ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Đã duyệt
                    </>
                  ) : (
                    <>
                      <Clock className="h-3.5 w-3.5" />
                      Đang khoá
                    </>
                  )}
                </span>
              </div>
            ))}
            {!topShops.length && (
              <div className="py-6 text-center text-sm text-gray-500">
                Chưa có shop nào được tạo.
              </div>
            )}
          </div>
        </div>

        <div className="section min-w-0 overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Tiến trình yêu cầu
          </h3>
          <div className="min-w-0 space-y-4">
            {requests.slice(0, 6).map((req) => (
              <div
                key={req.request_id}
                className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <p className="font-semibold text-gray-900">
                    #{req.request_id} • {req.full_name}
                  </p>
                  <span
                    className={`text-xs font-medium uppercase ${
                      req.status === "approved"
                        ? "text-emerald-600"
                        : req.status === "rejected"
                        ? "text-rose-600"
                        : "text-amber-600"
                    }`}
                  >
                    {req.status ?? "pending"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{req.address}</p>
              </div>
            ))}
            {!requests.length && (
              <div className="py-6 text-center text-sm text-gray-500">
                Chưa có yêu cầu nào.
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="spinner" />
          Đang tải dữ liệu insights...
        </div>
      )}
    </div>
  );
};

export default AdminInsightsPage;
