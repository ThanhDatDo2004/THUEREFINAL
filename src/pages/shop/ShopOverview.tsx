import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getShopByUserCode,
  getShopFields,
  getAllBookings,
  getShopRevenueByShop,
} from "../../utils/fakeApi";
import type {
  Bookings,
  FieldWithImages,
  ShopRevenue,
  Shops,
} from "../../types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CalendarRange, Layers, Star, Wallet2 } from "lucide-react";

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

const ShopOverview: React.FC = () => {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shops | null>(null);
  const [fields, setFields] = useState<FieldWithImages[]>([]);
  const [bookings, setBookings] = useState<Bookings[]>([]);
  const [revenue, setRevenue] = useState<ShopRevenue[]>([]);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1..12

  useEffect(() => {
    (async () => {
      if (!user?.user_code) return;
      const s = await getShopByUserCode(user.user_code);
      if (!s) return;
      setShop(s);

      const [fs, allBookings, rev] = await Promise.all([
        getShopFields(s.shop_code),
        getAllBookings(),
        getShopRevenueByShop(s.shop_code),
      ]);

      setFields(fs);
      setBookings(
        allBookings.filter((b) => fs.some((f) => f.field_code === b.field_code))
      );
      setRevenue(rev.filter((r) => r.Year === currentYear));
    })();
  }, [user?.user_code, currentYear]);

  const monthRevenue = useMemo(() => {
    const m = revenue.find((r) => r.Month === currentMonth);
    return {
      income: m?.total_income ?? 0,
      expense: m?.total_expense ?? 0,
      balance: m?.Balance ?? 0,
    };
  }, [revenue, currentMonth]);

  const stats = useMemo(() => {
    const totalFields = fields.length;
    const totalBookings = bookings.length;
    const avgRating = fields.length
      ? (
          fields.reduce((sum, f) => sum + (f.averageRating ?? 0), 0) /
          fields.length
        ).toFixed(1)
      : "0.0";
    return { totalFields, totalBookings, avgRating, monthRevenue };
  }, [fields, bookings, monthRevenue]);

  const chartData = useMemo(() => {
    const base = Array.from({ length: 12 }, (_, i) => ({
      name: MONTH_LABELS[i],
      income: 0,
      expense: 0,
    }));
    revenue.forEach((r) => {
      const idx = r.Month - 1;
      if (idx >= 0 && idx < 12) {
        base[idx].income = r.total_income;
        base[idx].expense = r.total_expense;
      }
    });
    return base;
  }, [revenue]);

  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort(
        (a, b) =>
          new Date(b.booking_date).getTime() -
          new Date(a.booking_date).getTime()
      )
      .slice(0, 5);
  }, [bookings]);

  return (
    <div>
      <div className="shop-header">
        <div>
          <h1 className="shop-title">Tổng quan shop {shop?.shop_name ?? ""}</h1>
          <p className="shop-sub">
            Năm {currentYear} • Dữ liệu tổng hợp theo tháng
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Layers size={18} />
          </div>
          <div className="stat-value">{stats.totalFields}</div>
          <div className="stat-label">Tổng số sân</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <CalendarRange size={18} />
          </div>
          <div className="stat-value">{stats.totalBookings}</div>
          <div className="stat-label">Tổng số đặt sân</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Star size={18} />
          </div>
          <div className="stat-value">{stats.avgRating}</div>
          <div className="stat-label">Điểm đánh giá TB</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Wallet2 size={18} />
          </div>
          <div className="stat-value">
            {stats.monthRevenue.balance.toLocaleString()}₫
          </div>
          <div className="stat-label">Lợi nhuận tháng {currentMonth}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="section mt-6">
        <h3 className="text-lg font-semibold mb-3">Doanh thu theo tháng</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`} />
              <Tooltip formatter={(v: number) => v.toLocaleString() + "₫"} />
              <Area
                type="monotone"
                dataKey="income"
                name="Thu"
                stroke="#10b981"
                fill="#10b98122"
              />
              <Area
                type="monotone"
                dataKey="expense"
                name="Chi"
                stroke="#ef4444"
                fill="#ef444422"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="section mt-6">
        <div className="results-bar">
          <h3 className="text-lg font-semibold">Đơn đặt gần đây</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Mã</th>
                <th className="th">Khách hàng</th>
                <th className="th">Ngày</th>
                <th className="th">Khung giờ</th>
                <th className="th">Tổng tiền</th>
                <th className="th">Thanh toán</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b.booking_code}>
                  <td className="td">#{b.booking_code}</td>
                  <td className="td">{b.customer_name}</td>
                  <td className="td">
                    {new Date(b.booking_date).toLocaleDateString()}
                  </td>
                  <td className="td">
                    {b.start_time}–{b.end_time}
                  </td>
                  <td className="td">{b.total_price.toLocaleString()}₫</td>
                  <td className="td capitalize">{b.payment_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShopOverview;
