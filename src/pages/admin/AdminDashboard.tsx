import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAdminUsers,
  fetchAdminShops,
  fetchAdminBookings,
  fetchAdminRevenue,
  fetchAdminShopRequests,
} from "../../models/admin.api";
import type {
  Users,
  Shops,
  Bookings,
  ShopRevenue,
  ShopRequests,
} from "../../types";
import {
  Users as UsersIcon,
  Store,
  CalendarRange,
  Wallet2,
  CheckCircle2,
  AlertTriangle,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";

const MONTH_LABELS = [
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6",
  "T7",
  "T8",
  "T9",
  "T10",
  "T11",
  "T12",
];

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<Users[]>([]);
  const [shops, setShops] = useState<Shops[]>([]);
  const [bookings, setBookings] = useState<Bookings[]>([]);
  const [revenue, setRevenue] = useState<ShopRevenue[]>([]);
  const [requests, setRequests] = useState<ShopRequests[]>([]);

  const now = new Date();
  const year = now.getFullYear();

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [u, s, b, r, req] = await Promise.all([
          fetchAdminUsers(),
          fetchAdminShops(),
          fetchAdminBookings(),
          fetchAdminRevenue(year),
          fetchAdminShopRequests(),
        ]);
        if (!ignore) {
          setUsers(u);
          setShops(s);
          setBookings(b);
          setRevenue(r);
          setRequests(req);
        }
      } catch (error) {
        console.error(error);
        if (!ignore) {
          setUsers([]);
          setShops([]);
          setBookings([]);
          setRevenue([]);
          setRequests([]);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [year]);

  const kpis = useMemo(() => {
    const totalUsers = users.length;
    const totalShops = shops.length;
    const totalBookings = bookings.length;
    const totalIncome = revenue.reduce((sum, r) => sum + r.total_income, 0);
    const pendingRequests = requests.filter(
      (r) => r.status === "pending" || !r.status
    ).length;
    const approvalRate = requests.length
      ? Math.round(
          (requests.filter((r) => r.status === "approved").length /
            requests.length) *
            100
        )
      : 0;
    return {
      totalUsers,
      totalShops,
      totalBookings,
      totalIncome,
      pendingRequests,
      approvalRate,
    };
  }, [users, shops, bookings, revenue, requests]);

  const bookingsByMonth = useMemo(() => {
    const arr = Array.from({ length: 12 }, (_, i) => ({
      name: MONTH_LABELS[i],
      value: 0,
    }));
    bookings.forEach((b) => {
      const d = new Date(b.booking_date);
      if (d.getFullYear() === year) arr[d.getMonth()].value += 1;
    });
    return arr;
  }, [bookings, year]);

  const incomeByMonth = useMemo(() => {
    const arr = Array.from({ length: 12 }, (_, i) => ({
      name: MONTH_LABELS[i],
      income: 0,
    }));
    revenue.forEach((r) => {
      arr[r.Month - 1].income = r.total_income;
    });
    return arr;
  }, [revenue]);

  const recentRequests = useMemo(() => {
    return [...requests]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);
  }, [requests]);

  const requestStatusData = useMemo(() => {
    const grouped = requests.reduce<Record<string, number>>((acc, req) => {
      const key = req.status ?? "pending";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const statuses = ["pending", "reviewed", "approved", "rejected"];
    return statuses.map((status) => ({
      status,
      value: grouped[status] ?? 0,
    }));
  }, [requests]);

  const topCustomers = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    bookings.forEach((booking) => {
      const key = booking.customer_name || "Khách lẻ";
      const prev = map.get(key) ?? { count: 0, revenue: 0 };
      prev.count += 1;
      prev.revenue += booking.total_price;
      map.set(key, prev);
    });
    return Array.from(map.entries())
      .map(([name, info]) => ({ name, ...info }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [bookings]);

  return (
    <div className="space-y-6">
      <div className="shop-header">
        <div>
          <h1 className="shop-title">Admin Dashboard</h1>
          <p className="shop-sub">Tổng quan hệ thống năm {year}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="stat-card">
          <div className="stat-icon">
            <UsersIcon size={18} />
          </div>
          <div className="stat-value">{kpis.totalUsers}</div>
          <div className="stat-label">Người dùng</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Store size={18} />
          </div>
          <div className="stat-value">{kpis.totalShops}</div>
          <div className="stat-label">Shop</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <CalendarRange size={18} />
          </div>
          <div className="stat-value">{kpis.totalBookings}</div>
          <div className="stat-label">Đơn đặt</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Wallet2 size={18} />
          </div>
          <div className="stat-value">{kpis.totalIncome.toLocaleString()}₫</div>
          <div className="stat-label">Tổng doanh thu (shops)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <AlertTriangle size={18} />
          </div>
          <div className="stat-value text-amber-600">
            {kpis.pendingRequests}
          </div>
          <div className="stat-label">Yêu cầu chờ duyệt</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle2 size={18} />
          </div>
          <div className="stat-value text-emerald-600">
            {kpis.approvalRate}%
          </div>
          <div className="stat-label">Tỉ lệ duyệt yêu cầu</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="section">
          <h3 className="text-lg font-semibold mb-3">Đơn đặt theo tháng</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart
                data={bookingsByMonth}
                margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name="Số đơn" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="section">
          <h3 className="text-lg font-semibold mb-3">Trạng thái yêu cầu mở shop</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={requestStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" name="Số lượng" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="section">
          <h3 className="text-lg font-semibold mb-3">Doanh thu theo tháng</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart
                data={incomeByMonth}
                margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`}
                />
                <Tooltip formatter={(v: number) => v.toLocaleString() + "₫"} />
                <Area type="monotone" dataKey="income" name="Thu" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="section">
          <h3 className="text-lg font-semibold mb-3">Khách hàng nổi bật</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Khách hàng</th>
                  <th className="th">Số đơn</th>
                  <th className="th">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((customer) => (
                  <tr key={customer.name}>
                    <td className="td font-semibold text-gray-900">
                      {customer.name}
                    </td>
                    <td className="td">{customer.count}</td>
                    <td className="td">
                      {customer.revenue.toLocaleString("vi-VN")}₫
                    </td>
                  </tr>
                ))}
                {!topCustomers.length && (
                  <tr>
                    <td className="td text-center text-gray-500" colSpan={3}>
                      Chưa có dữ liệu đặt sân.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Requests table */}
      <div className="section">
        <div className="results-bar">
          <h3 className="text-lg font-semibold">Shop requests mới</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">ID</th>
                <th className="th">Họ tên</th>
                <th className="th">Email</th>
                <th className="th">Điện thoại</th>
                <th className="th">Ngày tạo</th>
                <th className="th">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.map((r) => (
                <tr key={r.request_id}>
                  <td className="td">#{r.request_id}</td>
                  <td className="td">{r.full_name}</td>
                  <td className="td">{r.email}</td>
                  <td className="td">{r.phone_number}</td>
                  <td className="td">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="td capitalize">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section">
        <div className="results-bar">
          <h3 className="text-lg font-semibold">Trung tâm hành động</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <div className="flex items-center gap-2 text-amber-700 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              Yêu cầu còn chờ
            </div>
            <p className="mt-2">
              Có {kpis.pendingRequests} yêu cầu mở shop cần được duyệt. Kiểm tra tại mục
              <strong> Shop Requests</strong>.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Duy trì tăng trưởng
            </div>
            <p className="mt-2">
              Tỉ lệ duyệt đạt {kpis.approvalRate}% trong năm nay. Tiếp tục hỗ trợ các shop hoàn thiện hồ sơ để tăng chuyển đổi.
            </p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <div className="flex items-center gap-2 text-blue-700 font-semibold">
              <Activity className="h-4 w-4" />
              Giám sát hoạt động
            </div>
            <p className="mt-2">
              Truy cập mục <strong>Activity Log</strong> để xem timeline hoạt động mới nhất từ người dùng và shop.
            </p>
          </div>
        </div>
      </div>

      {(!users.length || !shops.length) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Chưa có đầy đủ dữ liệu? Hãy kiểm tra backend hoặc seed dữ liệu để dashboard hiển thị đầy đủ hơn.
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
