import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getShopByUserCode, getShopRevenueByShop } from "../../utils/fakeApi";
import type { ShopRevenue, Shops } from "../../types";

const ShopRevenuePage: React.FC = () => {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shops | null>(null);
  const [rows, setRows] = useState<ShopRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user?.user_code) return;
      setLoading(true);
      const s = await getShopByUserCode(user.user_code);
      setShop(s ?? null);
      if (s) {
        const r = await getShopRevenueByShop(s.shop_code);
        setRows(r);
      }
      setLoading(false);
    })();
  }, [user?.user_code]);

  return (
    <>
      <div className="shop-header">
        <h1 className="shop-title">Doanh thu</h1>
      </div>

      {loading ? (
        <div className="loading-wrap">
          <div className="spinner" />
        </div>
      ) : (
        <div className="table-wrap p-4">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Tháng</th>
                  <th>Năm</th>
                  <th>Thu</th>
                  <th>Chi</th>
                  <th>Còn lại</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.revenue_code}>
                    <td>{r.Month}</td>
                    <td>{r.Year}</td>
                    <td>
                      {new Intl.NumberFormat("vi-VN").format(r.total_income)}đ
                    </td>
                    <td>
                      {new Intl.NumberFormat("vi-VN").format(r.total_expense)}đ
                    </td>
                    <td className="font-semibold">
                      {new Intl.NumberFormat("vi-VN").format(r.Balance)}đ
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500 py-6">
                      Chưa có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default ShopRevenuePage;
