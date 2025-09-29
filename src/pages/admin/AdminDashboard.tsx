import React, { useEffect, useMemo, useState } from "react";
import {
  getAllUsers,
  getAllShops,
  getAllBookings,
  getAllRevenue,
  getShopRequests,
} from "../../utils/fakeApi";
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
    (async () => {
      const [u, s, b, r, req] = await Promise.all([
        getAllUsers(),
        getAllShops(),
        getAllBookings(),
        getAllRevenue(),
        getShopRequests(),
      ]);
      setUsers(u);
      setShops(s);
      setBookings(b);
      setRevenue(r.filter((x) => x.Year === year));
      setRequests(req);
    })();
  }, [year]);

  const kpis = useMemo(() => {
    const totalUsers = users.length;
    const totalShops = shops.length;
    const totalBookings = bookings.length;
    const totalIncome = revenue.reduce((sum, r) => sum + r.total_income, 0);
    return { totalUsers, totalShops, totalBookings, totalIncome };
  }, [users, shops, bookings, revenue]);

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

  return (
    <div>
      <div className="shop-header">
        <div>
          <h1 className="shop-title">Admin Dashboard</h1>
          <p className="shop-sub">Tổng quan hệ thống năm {year}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-grid">
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
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
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
      </div>

      {/* Requests table */}
      <div className="section mt-6">
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
    </div>
  );
};

export default AdminDashboard;
